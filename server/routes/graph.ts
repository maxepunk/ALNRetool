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
import { buildCompleteGraph } from '../services/graphBuilder.js';
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
 * - includeMetadata: Whether to include graph metadata (default: true)
 */
router.get('/complete', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Extract query parameters
  const includeMetadata = req.query.includeMetadata !== 'false';
  
  // Use unified cache key (cache unification fix)
  const cacheKey = 'graph_complete';
  
  // Check cache unless bypassed
  const bypassCache = req.headers['x-cache-bypass'] === 'true';
  
  
  if (!bypassCache) {
    const cached = cacheService.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache-Hit', 'true');
      res.setHeader('X-Graph-Build-Time', '0');
      // Update metadata to reflect that this is cached data
      if (cached.metadata) {
        cached.metadata.cached = true;
      }
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
  
  // Helper function to fetch all entities of a specific type
  async function fetchAllEntities<T>(
    databaseId: string,
    transformFn: (page: any) => T,
    entityName: string,
    targetArray: T[]
  ): Promise<void> {
    let cursor: string | undefined;
    let hasMore = true;
    
    while (hasMore) {
      const result = await fetchAllPages(databaseId, 100, cursor);
      targetArray.push(...result.pages.map(transformFn));
      cursor = result.nextCursor || undefined;
      hasMore = result.hasMore;
      
      // CRITICAL: Continue fetching even if we have 100+ items
      if (cursor && result.pages.length === 100) {
        log.debug(`[Graph API] Fetching next batch of ${entityName}`, { 
          fetched: targetArray.length,
          cursor: cursor 
        });
      }
    }
  }
  
  // Fetch all entity types using the helper function
  await fetchAllEntities(charactersDb, transformCharacter, 'characters', allCharacters);
  await fetchAllEntities(elementsDb, transformElement, 'elements', allElements);
  await fetchAllEntities(puzzlesDb, transformPuzzle, 'puzzles', allPuzzles);
  await fetchAllEntities(timelineDb, transformTimelineEvent, 'timeline', allTimeline);
  
  log.info('[Graph API] All entities fetched', {
    characters: allCharacters.length,
    elements: allElements.length,
    puzzles: allPuzzles.length,
    timeline: allTimeline.length,
  });
  
  // Synthesize bidirectional relationships
  const synthesized = synthesizeBidirectionalRelationships(allElements, allPuzzles, allTimeline, allCharacters);
  
  // Build complete graph
  const graph = buildCompleteGraph({
    characters: synthesized.characters,
    elements: synthesized.elements,
    puzzles: synthesized.puzzles,
    timeline: synthesized.timeline,
  });
  
  // Prepare response
  const response = {
    nodes: graph.nodes,
    edges: graph.edges,
    ...(includeMetadata && {
      metadata: {
        ...graph.metadata,
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
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'graph-builder',
    endpoints: ['/complete'],
  });
});

export default router;