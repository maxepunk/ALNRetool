import { Router, Request, Response } from 'express';
import { notion } from '../services/notion.js';
import { asyncHandler } from '../utils/asyncHandler.js';
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

// Helper to fetch all pages from a database with pagination
async function fetchAllPages(databaseId: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100
    }) as NotionListResponse<NotionPage>;
    
    pages.push(...response.results);
    cursor = response.next_cursor || undefined;
  } while (cursor);
  
  return pages;
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

  const pages = await fetchAllPages(databaseId);
  const characters = pages.map(transformCharacter);
  
  const response: APIResponse<Character> = {
    data: characters,
    nextCursor: null,
    hasMore: false
  };
  
  res.json(response);
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

  const pages = await fetchAllPages(databaseId);
  const elements = pages.map(transformElement);
  
  const response: APIResponse<Element> = {
    data: elements,
    nextCursor: null,
    hasMore: false
  };
  
  res.json(response);
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

  const pages = await fetchAllPages(databaseId);
  const puzzles = pages.map(transformPuzzle);
  
  const response: APIResponse<Puzzle> = {
    data: puzzles,
    nextCursor: null,
    hasMore: false
  };
  
  res.json(response);
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

  const pages = await fetchAllPages(databaseId);
  const events = pages.map(transformTimelineEvent);
  
  const response: APIResponse<TimelineEvent> = {
    data: events,
    nextCursor: null,
    hasMore: false
  };
  
  res.json(response);
}));

export default router;