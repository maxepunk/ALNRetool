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
  const { buildElementFilters, buildPuzzleFilters } = await import('../../services/filterBuilder.js');
  
  // Get database IDs from environment
  const elementsDb = process.env.NOTION_ELEMENTS_DB || '18c2f33d-583f-8020-91bc-d84c7dd94306';
  const puzzlesDb = process.env.NOTION_PUZZLES_DB || '1b62f33d-583f-80cc-87cf-d7d6c4b0b265';
  
  // Extract filter parameters from query
  const elementStatus = req.query.elementStatus as string | undefined;
  const elementLastEdited = req.query.elementLastEdited as string | undefined;
  const puzzleLastEdited = req.query.puzzleLastEdited as string | undefined;
  
  // Build Notion filters
  const elementFilters = buildElementFilters({
    status: elementStatus,
    lastEdited: elementLastEdited,
  });
  
  const puzzleFilters = buildPuzzleFilters({
    lastEdited: puzzleLastEdited,
  });
  
  // Create cache key including filters
  const filterString = [
    elementStatus ? `es:${elementStatus}` : '',
    elementLastEdited ? `el:${elementLastEdited}` : '',
    puzzleLastEdited ? `pl:${puzzleLastEdited}` : '',
  ].filter(Boolean).join('_');
  
  const cacheKey = filterString ? `synthesized_${filterString}` : 'synthesized_all';
  const bypassCache = req.headers['x-cache-bypass'] === 'true';
  
  if (!bypassCache) {
    const cached = cacheService.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache-Hit', 'true');
      return res.json(cached);
    }
  }
  
  // Fetch all data with pagination and filters
  const allElements: Element[] = [];
  const allPuzzles: Puzzle[] = [];
  
  // Fetch all elements with filters
  let elementCursor: string | undefined;
  let hasMoreElements = true;
  while (hasMoreElements) {
    const result = await fetchAllPages(elementsDb, 100, elementCursor, elementFilters);
    allElements.push(...result.pages.map(transformElement));
    elementCursor = result.nextCursor || undefined;
    hasMoreElements = result.hasMore;
  }
  
  // Fetch all puzzles with filters
  let puzzleCursor: string | undefined;
  let hasMorePuzzles = true;
  while (hasMorePuzzles) {
    const result = await fetchAllPages(puzzlesDb, 100, puzzleCursor, puzzleFilters);
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