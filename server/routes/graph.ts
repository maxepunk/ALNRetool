/**
 * Graph API Router
 * 
 * Provides endpoints for complete graph data with server-side relationship resolution.
 * Ensures all entities are fetched before building relationships, eliminating
 * pagination boundary issues.
 * 
 * @module server/routes/graph
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cacheService } from '../services/cache.js';
import { fetchAllPages } from './notion/base.js';
import { 
  transformCharacter, 
  transformElement, 
  transformPuzzle, 
  transformTimelineEvent 
} from '../../src/types/notion/transforms.js';
import { synthesizeBidirectionalRelationships } from '../services/relationshipSynthesizer.js';
import { buildCompleteGraph, filterGraphForView } from '../services/graphBuilder.js';
import config from '../config/index.js';
import { log } from '../utils/logger.js';
import type { Character, Element, Puzzle, TimelineEvent } from '../../src/types/notion/app.js';

const router = Router();

/**
 * GET /api/graph/complete - Get complete graph with all nodes and edges
 * 
 * This endpoint:
 * 1. Fetches ALL entities from Notion (no artificial limits)
 * 2. Synthesizes bidirectional relationships
 * 3. Builds complete graph structure server-side
 * 4. Returns nodes, edges, and metadata ready for React Flow
 * 
 * Query params:
 * - viewConfig: Optional view configuration for filtering
 * - includeMetadata: Whether to include graph metadata (default: true)
 */
router.get('/complete', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Extract query parameters
  const viewConfig = req.query.viewConfig ? JSON.parse(req.query.viewConfig as string) : null;
  const includeMetadata = req.query.includeMetadata !== 'false';
  
  // Create cache key
  const cacheKey = viewConfig 
    ? `graph_complete_${JSON.stringify(viewConfig)}`
    : 'graph_complete_all';
  
  // Check cache unless bypassed
  const bypassCache = req.headers['x-cache-bypass'] === 'true';
  
  if (!bypassCache) {
    const cached = cacheService.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache-Hit', 'true');
      res.setHeader('X-Graph-Build-Time', '0');
      return res.json(cached);
    }
  }
  
  // Get database IDs from config
  const charactersDb = config.notionDatabaseIds.characters;
  const elementsDb = config.notionDatabaseIds.elements;
  const puzzlesDb = config.notionDatabaseIds.puzzles;
  const timelineDb = config.notionDatabaseIds.timeline;
  
  log.info('[Graph API] Fetching all entities for complete graph');
  
  // Fetch ALL entities with proper pagination (no artificial limits)
  const allCharacters: Character[] = [];
  const allElements: Element[] = [];
  const allPuzzles: Puzzle[] = [];
  const allTimeline: TimelineEvent[] = [];
  
  // Fetch all characters
  let characterCursor: string | undefined;
  let hasMoreCharacters = true;
  while (hasMoreCharacters) {
    const result = await fetchAllPages(charactersDb, 100, characterCursor);
    allCharacters.push(...result.pages.map(transformCharacter));
    characterCursor = result.nextCursor || undefined;
    hasMoreCharacters = result.hasMore;
    
    // CRITICAL: Continue fetching even if we have 100+ items
    if (characterCursor && result.pages.length === 100) {
      log.debug('[Graph API] Fetching next batch of characters', { 
        fetched: allCharacters.length,
        cursor: characterCursor 
      });
    }
  }
  
  // Fetch all elements
  let elementCursor: string | undefined;
  let hasMoreElements = true;
  while (hasMoreElements) {
    const result = await fetchAllPages(elementsDb, 100, elementCursor);
    allElements.push(...result.pages.map(transformElement));
    elementCursor = result.nextCursor || undefined;
    hasMoreElements = result.hasMore;
    
    if (elementCursor && result.pages.length === 100) {
      log.debug('[Graph API] Fetching next batch of elements', { 
        fetched: allElements.length,
        cursor: elementCursor 
      });
    }
  }
  
  // Fetch all puzzles
  let puzzleCursor: string | undefined;
  let hasMorePuzzles = true;
  while (hasMorePuzzles) {
    const result = await fetchAllPages(puzzlesDb, 100, puzzleCursor);
    allPuzzles.push(...result.pages.map(transformPuzzle));
    puzzleCursor = result.nextCursor || undefined;
    hasMorePuzzles = result.hasMore;
    
    if (puzzleCursor && result.pages.length === 100) {
      log.debug('[Graph API] Fetching next batch of puzzles', { 
        fetched: allPuzzles.length,
        cursor: puzzleCursor 
      });
    }
  }
  
  // Fetch all timeline events
  let timelineCursor: string | undefined;
  let hasMoreTimeline = true;
  while (hasMoreTimeline) {
    const result = await fetchAllPages(timelineDb, 100, timelineCursor);
    allTimeline.push(...result.pages.map(transformTimelineEvent));
    timelineCursor = result.nextCursor || undefined;
    hasMoreTimeline = result.hasMore;
    
    if (timelineCursor && result.pages.length === 100) {
      log.debug('[Graph API] Fetching next batch of timeline', { 
        fetched: allTimeline.length,
        cursor: timelineCursor 
      });
    }
  }
  
  log.info('[Graph API] All entities fetched', {
    characters: allCharacters.length,
    elements: allElements.length,
    puzzles: allPuzzles.length,
    timeline: allTimeline.length,
  });
  
  // Synthesize bidirectional relationships
  const synthesized = synthesizeBidirectionalRelationships(allElements, allPuzzles, allTimeline, allCharacters);
  
  // Build complete graph
  const fullGraph = buildCompleteGraph({
    characters: synthesized.characters,
    elements: synthesized.elements,
    puzzles: synthesized.puzzles,
    timeline: synthesized.timeline,
  });
  
  // Apply view filtering if requested
  const graph = viewConfig 
    ? filterGraphForView(fullGraph, viewConfig)
    : fullGraph;
  
  // Prepare response
  const response = {
    nodes: graph.nodes,
    edges: graph.edges,
    ...(includeMetadata && {
      metadata: {
        ...fullGraph.metadata,
        entityCounts: {
          characters: allCharacters.length,
          elements: allElements.length,
          puzzles: allPuzzles.length,
          timeline: allTimeline.length,
        },
        buildTime: Date.now() - startTime,
        cached: false,
      },
    }),
  };
  
  // Cache for 5 minutes (same as other endpoints)
  cacheService.set(cacheKey, response);
  
  // Set response headers
  res.setHeader('X-Cache-Hit', 'false');
  res.setHeader('X-Graph-Build-Time', String(Date.now() - startTime));
  res.setHeader('X-Total-Nodes', String(graph.nodes.length));
  res.setHeader('X-Total-Edges', String(graph.edges.length));
  
  res.json(response);
}));

/**
 * GET /api/graph/health - Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'graph-builder',
    endpoints: ['/complete'],
  });
});

export default router;