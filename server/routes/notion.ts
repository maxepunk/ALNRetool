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

export default router;