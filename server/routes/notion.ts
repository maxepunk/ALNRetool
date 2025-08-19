import { Router, Request, Response } from 'express';
import { notion } from '../services/notion.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cacheService } from '../services/cache.js';
import type { 
  NotionListResponse, 
  NotionPage 
} from '../../src/types/notion/raw.js';
import {
  transformCharacter,
  transformElement,
  transformPuzzle,
  transformTimelineEvent
} from '../../src/types/notion/transforms.js';
import {
  toNotionProperties
} from '../services/notionPropertyMappers.js';
import type {
  APIResponse,
  APIError,
  Character,
  Element,
  Puzzle,
  TimelineEvent
} from '../../src/types/notion/app.js';

const router = Router();

// Helper to handle cached Notion requests
async function handleCachedNotionRequest<T>(
  req: Request, 
  res: Response, 
  endpointName: string, 
  databaseId: string, 
  transformFn: (page: NotionPage) => T
): Promise<void> {
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const bypassCache = req.headers['x-cache-bypass'] === 'true';
  const cacheKey = cacheService.getCacheKey(endpointName, { limit, cursor });

  if (!bypassCache) {
    const cachedResponse = cacheService.get<APIResponse<T>>(cacheKey);
    if (cachedResponse) {
      res.setHeader('X-Cache-Hit', 'true');
      res.json(cachedResponse);
      return;
    }
  }

  const result = await fetchAllPages(databaseId, limit, cursor);
  const data = result.pages.map(transformFn);

  const response: APIResponse<T> = {
    data,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore
  };

  cacheService.set(cacheKey, response);
  res.setHeader('X-Cache-Hit', 'false');
  res.json(response);
}

// Helper to fetch pages from a database with pagination limit
async function fetchAllPages(
  databaseId: string, 
  maxItems: number = 100,
  startCursor?: string
): Promise<{ pages: NotionPage[], hasMore: boolean, nextCursor: string | null }> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined = startCursor;
  let totalFetched = 0;
  
  // Fetch only up to maxItems to prevent timeouts
  while (totalFetched < maxItems) {
    const pageSize = Math.min(100, maxItems - totalFetched);
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: pageSize
    }) as NotionListResponse<NotionPage>;
    
    pages.push(...response.results);
    totalFetched += response.results.length;
    cursor = response.next_cursor || undefined;
    
    // Stop if no more pages or reached limit
    if (!cursor || totalFetched >= maxItems) {
      break;
    }
  }
  
  return { 
    pages, 
    hasMore: !!cursor, 
    nextCursor: cursor || null 
  };
}

// GET /api/notion/characters
router.get('/characters', asyncHandler(async (req: Request, res: Response) => {
  const databaseId = process.env.NOTION_CHARACTERS_DB;
  if (!databaseId) {
    return res.status(500).json({ 
      statusCode: 500, 
      code: 'CONFIG_ERROR', 
      message: 'Characters database ID not configured' 
    });
  }
  await handleCachedNotionRequest(req, res, 'characters', databaseId, transformCharacter);
}));

// GET /api/notion/elements
router.get('/elements', asyncHandler(async (req: Request, res: Response) => {
  const databaseId = process.env.NOTION_ELEMENTS_DB;
  if (!databaseId) {
    return res.status(500).json({ 
      statusCode: 500, 
      code: 'CONFIG_ERROR', 
      message: 'Elements database ID not configured' 
    });
  }
  await handleCachedNotionRequest(req, res, 'elements', databaseId, transformElement);
}));

// GET /api/notion/puzzles
router.get('/puzzles', asyncHandler(async (req: Request, res: Response) => {
  const databaseId = process.env.NOTION_PUZZLES_DB;
  if (!databaseId) {
    return res.status(500).json({ 
      statusCode: 500, 
      code: 'CONFIG_ERROR', 
      message: 'Puzzles database ID not configured' 
    });
  }
  await handleCachedNotionRequest(req, res, 'puzzles', databaseId, transformPuzzle);
}));

// GET /api/notion/timeline
router.get('/timeline', asyncHandler(async (req: Request, res: Response) => {
  const databaseId = process.env.NOTION_TIMELINE_DB;
  if (!databaseId) {
    return res.status(500).json({ 
      statusCode: 500, 
      code: 'CONFIG_ERROR', 
      message: 'Timeline database ID not configured' 
    });
  }
  await handleCachedNotionRequest(req, res, 'timeline', databaseId, transformTimelineEvent);
}));

// PUT /api/notion/:entityType/:id - Update an entity in Notion
router.put('/:entityType/:id', asyncHandler(async (req: Request, res: Response) => {
  const { entityType, id } = req.params;
  const updates = req.body;

  // Validate entity type
  const validTypes = ['characters', 'elements', 'puzzles', 'timeline'];
  if (!validTypes.includes(entityType)) {
    return res.status(400).json({
      statusCode: 400,
      code: 'INVALID_ENTITY_TYPE',
      message: `Invalid entity type: ${entityType}. Must be one of: ${validTypes.join(', ')}`
    });
  }

  try {
    // Convert updates to Notion property format
    // toNotionProperties expects the plural form as used in the API
    const properties = toNotionProperties(entityType as 'characters' | 'elements' | 'puzzles' | 'timeline', updates);

    // Update the page in Notion
    const updatedPage = await notion.pages.update({
      page_id: id,
      properties
    }) as NotionPage;

    // Transform the updated page back to our app format
    let transformedEntity;
    switch (entityType) {
      case 'characters':
        transformedEntity = transformCharacter(updatedPage);
        break;
      case 'elements':
        transformedEntity = transformElement(updatedPage);
        break;
      case 'puzzles':
        transformedEntity = transformPuzzle(updatedPage);
        break;
      case 'timeline':
        transformedEntity = transformTimelineEvent(updatedPage);
        break;
    }

    // Invalidate cache for this entity type
    const cacheKey = `notion_${entityType}_*`;
    cacheService.invalidatePattern(cacheKey);

    // Return the updated entity
    res.json(transformedEntity);
  } catch (error) {
    console.error(`Error updating ${entityType} ${id}:`, error);
    
    // Handle Notion API errors
    if (error && typeof error === 'object' && 'code' in error) {
      const notionError = error as any;
      return res.status(400).json({
        statusCode: 400,
        code: notionError.code,
        message: notionError.message || `Failed to update ${entityType}`
      });
    }
    
    // Generic error
    return res.status(500).json({
      statusCode: 500,
      code: 'UPDATE_ERROR',
      message: `Failed to update ${entityType}: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}));

export default router;