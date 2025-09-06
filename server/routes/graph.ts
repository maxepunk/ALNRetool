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
import { getCompleteGraphData } from '../services/graphData.js';

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
  const includeMetadata = req.query.includeMetadata !== 'false';
  const cacheKey = 'graph_complete';
  const bypassCache = req.headers['x-cache-bypass'] === 'true';

  if (!bypassCache) {
    const cached = cacheService.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache-Hit', 'true');
      res.setHeader('X-Graph-Build-Time', '0');
      if (cached.metadata) {
        cached.metadata.cached = true;
      }
      return res.json(cached);
    }
  }

  const { graph, entityCounts, buildTime } = await getCompleteGraphData();

  const response = {
    nodes: graph.nodes,
    edges: graph.edges,
    ...(includeMetadata && {
      metadata: {
        ...graph.metadata,
        entityCounts,
        buildTime,
        cached: false,
      },
    }),
  };

  cacheService.set(cacheKey, response);

  res.setHeader('X-Cache-Hit', 'false');
  res.setHeader('X-Graph-Build-Time', String(buildTime));
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