import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import graphRouter from '../../routes/graph.js';
import { cacheService } from '../../services/cache.js';

// Mock services
vi.mock('../../services/cache.js', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('../../routes/notion/base.js', () => ({
  fetchAllPages: vi.fn().mockResolvedValue({ pages: [], nextCursor: null, hasMore: false }),
}));

vi.mock('../../services/relationshipSynthesizer.js', () => ({
  synthesizeBidirectionalRelationships: vi.fn((a, b, c, d) => ({
    characters: d,
    elements: a,
    puzzles: b,
    timeline: c,
  })),
}));

vi.mock('../../services/graphBuilder.js', () => ({
  buildCompleteGraph: vi.fn().mockReturnValue({
    nodes: [{ id: '1', type: 'character', data: { name: 'Test' } }],
    edges: [],
    metadata: { totalNodes: 1, totalEdges: 0 },
  }),
}));

const app = express();
app.use('/graph', graphRouter);

describe('Graph Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /graph/health', () => {
    it('should return 200 OK and status', async () => {
      const res = await request(app).get('/graph/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'ok',
        service: 'graph-builder',
        endpoints: ['/complete'],
      });
    });
  });

  describe('GET /graph/complete', () => {
    it('should return a complete graph', async () => {
      const res = await request(app).get('/graph/complete');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('nodes');
      expect(res.body).toHaveProperty('edges');
      expect(res.body.nodes).toHaveLength(1);
    });

    it('should cache the graph response', async () => {
      await request(app).get('/graph/complete');
      expect(cacheService.set).toHaveBeenCalledWith('graph_complete', expect.any(Object));
    });

    it('should return cached data if available', async () => {
      const cachedData = {
        nodes: [{ id: '2', type: 'puzzle' }],
        edges: [],
        metadata: { buildTime: 123 },
      };
      (cacheService.get as vi.Mock).mockReturnValue(cachedData);

      const res = await request(app).get('/graph/complete');
      expect(res.status).toBe(200);
      expect(res.body.metadata.cached).toBe(true);
      expect(res.headers['x-cache-hit']).toBe('true');
    });

    it('should bypass cache if x-cache-bypass header is true', async () => {
      const cachedData = { nodes: [{ id: '2', type: 'puzzle' }], edges: [] };
      (cacheService.get as vi.Mock).mockReturnValue(cachedData);

      const res = await request(app).get('/graph/complete').set('x-cache-bypass', 'true');
      expect(res.status).toBe(200);
      expect(res.body.nodes[0].id).toBe('1'); // from mocked buildCompleteGraph
      expect(res.headers['x-cache-hit']).toBe('false');
    });

    it('should handle the includeMetadata query parameter', async () => {
      let res = await request(app).get('/graph/complete?includeMetadata=false');
      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('metadata');

      // Reset mocks and cache for the second request
      vi.clearAllMocks();
      (cacheService.get as vi.Mock).mockReturnValue(undefined);

      res = await request(app).get('/graph/complete?includeMetadata=true');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('metadata');
    });
  });
});
