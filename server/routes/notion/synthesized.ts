/**
 * Synthesized data router
 * Provides endpoint for fetching all data with bidirectional relationships
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { cacheService } from '../../services/cache.js';
import { fetchAllPages } from './base.js';
import { transformElement, transformPuzzle } from '../../../src/types/notion/transforms.js';
import type { Element, Puzzle } from '../../../src/types/notion/app.js';

const router = Router();

// GET /api/notion/synthesized - Get all data with synthesized bidirectional relationships
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { synthesizeBidirectionalRelationships } = await import('../../services/relationshipSynthesizer.js');
  
  // Get database IDs from environment
  const elementsDb = process.env.NOTION_ELEMENTS_DB || '18c2f33d-583f-8020-91bc-d84c7dd94306';
  const puzzlesDb = process.env.NOTION_PUZZLES_DB || '1b62f33d-583f-80cc-87cf-d7d6c4b0b265';
  
  // Check cache first
  const cacheKey = 'synthesized_all';
  const bypassCache = req.headers['x-cache-bypass'] === 'true';
  
  if (!bypassCache) {
    const cached = cacheService.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache-Hit', 'true');
      return res.json(cached);
    }
  }
  
  // Fetch all data with pagination
  const allElements: Element[] = [];
  const allPuzzles: Puzzle[] = [];
  
  // Fetch all elements
  let elementCursor: string | undefined;
  let hasMoreElements = true;
  while (hasMoreElements) {
    const result = await fetchAllPages(elementsDb, 100, elementCursor);
    allElements.push(...result.pages.map(transformElement));
    elementCursor = result.nextCursor || undefined;
    hasMoreElements = result.hasMore;
  }
  
  // Fetch all puzzles
  let puzzleCursor: string | undefined;
  let hasMorePuzzles = true;
  while (hasMorePuzzles) {
    const result = await fetchAllPages(puzzlesDb, 100, puzzleCursor);
    allPuzzles.push(...result.pages.map(transformPuzzle));
    puzzleCursor = result.nextCursor || undefined;
    hasMorePuzzles = result.hasMore;
  }
  
  // Synthesize bidirectional relationships
  const synthesized = synthesizeBidirectionalRelationships(allElements, allPuzzles);
  
  const response = {
    elements: synthesized.elements,
    puzzles: synthesized.puzzles,
    totalElements: synthesized.elements.length,
    totalPuzzles: synthesized.puzzles.length
  };
  
  // Cache for 5 minutes
  cacheService.set(cacheKey, response);
  res.setHeader('X-Cache-Hit', 'false');
  res.json(response);
}));

export default router;