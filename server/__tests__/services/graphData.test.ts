import { describe, it, expect, vi } from 'vitest';
import { getCompleteGraphData } from '../../services/graphData.js';

vi.mock('../../routes/notion/base.js', () => ({
  fetchAllPages: vi.fn().mockResolvedValue({ pages: [], hasMore: false, nextCursor: null }),
}));

vi.mock('../../services/relationshipSynthesizer.js', () => ({
  synthesizeBidirectionalRelationships: vi.fn((elements, puzzles, timeline, characters) => ({
    elements,
    puzzles,
    timeline,
    characters,
  })),
}));

vi.mock('../../services/graphBuilder.js', () => ({
  buildCompleteGraph: vi.fn(() => ({
    nodes: [],
    edges: [],
    metadata: {
      totalNodes: 0,
      totalEdges: 0,
      placeholderNodes: 0,
      missingEntities: [],
    },
  })),
}));

describe('Graph Data Service', () => {
  it('should call its dependencies and return graph data', async () => {
    const { fetchAllPages } = await import('../../routes/notion/base.js');
    const { synthesizeBidirectionalRelationships } = await import('../../services/relationshipSynthesizer.js');
    const { buildCompleteGraph } = await import('../../services/graphBuilder.js');

    const result = await getCompleteGraphData();

    expect(fetchAllPages).toHaveBeenCalledTimes(4);
    expect(synthesizeBidirectionalRelationships).toHaveBeenCalledOnce();
    expect(buildCompleteGraph).toHaveBeenCalledOnce();
    expect(result).toHaveProperty('graph');
    expect(result).toHaveProperty('entityCounts');
    expect(result).toHaveProperty('buildTime');
    expect(result.graph).toHaveProperty('nodes');
    expect(result.graph).toHaveProperty('edges');
  });
});
