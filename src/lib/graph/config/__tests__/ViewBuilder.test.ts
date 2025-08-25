/**
 * ViewBuilder Tests
 * 
 * Comprehensive test suite for the declarative view builder engine.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ViewBuilder } from '../ViewBuilder';
import { ViewRegistry } from '../ViewRegistry';
import { ViewCache } from '../ViewCache';
import { TimelineConfig } from '../views/TimelineConfig';
import { NodeConnectionsConfig } from '../views/NodeConnectionsConfig';
import { TraversalEngine } from '../../modules/TraversalEngine';
import type { ViewConfiguration } from '../ViewConfiguration';
import type { NotionData, GraphData } from '../../types';
import type { StrategyDependencies } from '../../core/ViewStrategy.interface';

// Mock dependencies
const mockEntityTransformer = {
  transformCharacters: vi.fn((chars: any[]) => chars.map((c: any) => ({ 
    id: c.id, 
    type: 'characterNode',
    data: c 
  }))),
  transformElements: vi.fn((elems: any[]) => elems.map((e: any) => ({ 
    id: e.id, 
    type: 'elementNode',
    data: e 
  }))),
  transformPuzzles: vi.fn((puzzles: any[]) => puzzles.map((p: any) => ({ 
    id: p.id, 
    type: 'puzzleNode',
    data: p 
  }))),
  transformTimeline: vi.fn((events: any[]) => events.map((t: any) => ({ 
    id: t.id, 
    type: 'timelineNode',
    data: t 
  })))
};

const mockEdgeResolver = {
  clearCache: vi.fn(),
  createCharacterEdges: vi.fn(() => []),
  createPuzzleEdges: vi.fn(() => []),
  createTimelineEdges: vi.fn(() => []),
  createElementEdges: vi.fn(() => []),
  deduplicateEdges: vi.fn((edges) => edges)
};

const mockGraphFilterer = {
  filterByDepth: vi.fn(() => new Set(['node1', 'node2']))
};

// Create a real TraversalEngine instance for testing
const traversalEngine = new TraversalEngine();

// Mock the traverse method to return expected results
vi.spyOn(traversalEngine, 'traverse').mockImplementation((edges, startId, options) => ({
  visitedNodes: new Set([startId, 'node1', 'node2']),
  depths: new Map([[startId, 0], ['node1', 1], ['node2', 1]]),
  paths: new Map([[startId, [startId]], ['node1', [startId, 'node1']], ['node2', [startId, 'node2']]]),
  order: [startId, 'node1', 'node2'],
  nodesProcessed: 3
}));

const mockLayoutOrchestrator = {
  layout: vi.fn()
};

const mockDeps: StrategyDependencies = {
  entityTransformer: mockEntityTransformer as any,
  edgeResolver: mockEdgeResolver as any,
  graphFilterer: mockGraphFilterer as any,
  traversalEngine: traversalEngine,
  layoutOrchestrator: mockLayoutOrchestrator as any
};

// Sample test data
const mockData: NotionData = {
  characters: [
    { id: 'char1', name: 'Alice', ownedElementIds: ['elem1'], connections: ['char2'] },
    { id: 'char2', name: 'Bob', ownedElementIds: ['elem2'], connections: ['char1'] }
  ],
  elements: [
    { id: 'elem1', name: 'Sword', status: 'Done' },
    { id: 'elem2', name: 'Shield', status: 'In Progress' }
  ],
  puzzles: [
    { id: 'puzzle1', name: 'Main Quest', subPuzzleIds: ['puzzle2'] },
    { id: 'puzzle2', name: 'Sub Quest', puzzleElementIds: ['elem1'] }
  ],
  timeline: [
    { id: 'event1', name: 'Battle', date: '2024-01-01', charactersInvolvedIds: ['char1'] },
    { id: 'event2', name: 'Meeting', date: '2024-01-02', charactersInvolvedIds: ['char1', 'char2'] }
  ]
} as any;

describe('ViewBuilder', () => {
  let viewBuilder: ViewBuilder;

  beforeEach(() => {
    viewBuilder = new ViewBuilder(mockDeps);
    vi.clearAllMocks();
  });

  describe('Basic Configuration Processing', () => {
    it('should build a graph from a simple configuration', () => {
      const config: ViewConfiguration = {
        id: 'test',
        name: 'Test View',
        nodes: {
          include: [
            { type: 'basic', ids: ['char1', 'char2'] }
          ]
        },
        edges: [
          { entityType: 'character' }
        ]
      };

      const result = viewBuilder.build(config, mockData);

      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(mockEntityTransformer.transformCharacters).toHaveBeenCalled();
      expect(mockEdgeResolver.createCharacterEdges).toHaveBeenCalled();
    });

    it('should handle filtered node selection', () => {
      const config: ViewConfiguration = {
        id: 'filtered',
        name: 'Filtered View',
        nodes: {
          include: [
            {
              type: 'filtered',
              entityType: 'element',
              where: (elem) => (elem as any).status === 'Done'
            }
          ]
        },
        edges: []
      };

      const result = viewBuilder.build(config, mockData);

      expect(result.nodes).toHaveLength(1);
      expect(mockEntityTransformer.transformElements).toHaveBeenCalledWith([mockData.elements[0]]);
    });
  });

  describe('Template Variable Substitution', () => {
    it('should substitute template variables', () => {
      const config: ViewConfiguration = {
        id: 'template',
        name: 'Template View',
        nodes: {
          include: [
            { type: 'basic', ids: ['{{nodeId}}'] }
          ]
        },
        edges: []
      };

      const result = viewBuilder.build(config, mockData, { nodeId: 'char1' });

      expect(result.nodes).toHaveLength(1);
      expect(mockEntityTransformer.transformCharacters).toHaveBeenCalledWith([mockData.characters[0]]);
    });

    it('should handle missing template variables gracefully', () => {
      const config: ViewConfiguration = {
        id: 'template',
        name: 'Template View',
        nodes: {
          include: [
            { type: 'basic', ids: ['{{missingVar}}'] }
          ]
        },
        edges: []
      };

      const result = viewBuilder.build(config, mockData, {});
      
      // Should not crash, but may have no nodes
      expect(result).toBeDefined();
    });
  });

  describe('Hook System', () => {
    it('should execute beforeNodeSelection hook', () => {
      const beforeHook = vi.fn();
      const config: ViewConfiguration = {
        id: 'hooks',
        name: 'Hooks View',
        nodes: { include: [] },
        edges: [],
        hooks: {
          beforeNodeSelection: beforeHook
        }
      };

      viewBuilder.build(config, mockData);

      expect(beforeHook).toHaveBeenCalled();
      // The hook is called with processed config (which includes appliedVariables) and data
      const [passedConfig, passedData] = beforeHook.mock.calls[0];
      expect(passedConfig.id).toBe('hooks');
      expect(passedConfig.name).toBe('Hooks View');
      expect(passedData).toBe(mockData);
    });

    it('should execute afterNodeCreation hook', () => {
      const afterHook = vi.fn((nodes) => nodes);
      const config: ViewConfiguration = {
        id: 'hooks',
        name: 'Hooks View',
        nodes: {
          include: [{ type: 'basic', ids: ['char1'] }]
        },
        edges: [],
        hooks: {
          afterNodeCreation: afterHook
        }
      };

      viewBuilder.build(config, mockData);

      expect(afterHook).toHaveBeenCalled();
      expect(afterHook.mock.calls[0]?.[0]).toHaveLength(1);
      // afterHook only receives one argument (nodes), so checking [1] is invalid
      expect(afterHook.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Limits', () => {
    it('should apply maxNodes limit', () => {
      const config: ViewConfiguration = {
        id: 'limited',
        name: 'Limited View',
        nodes: {
          include: [
            { type: 'basic', ids: ['char1', 'char2', 'elem1', 'elem2'] }
          ]
        },
        edges: [],
        performance: {
          maxNodes: 2
        }
      };

      const result = viewBuilder.build(config, mockData);

      expect(result.nodes).toHaveLength(2);
    });
  });

  describe('Real Configuration Tests', () => {
    it('should build TimelineConfig correctly', () => {
      const result = viewBuilder.build(TimelineConfig, mockData, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01')
      });

      expect(result).toBeDefined();
      expect(mockEntityTransformer.transformTimeline).toHaveBeenCalled();
    });

    it('should build NodeConnectionsConfig with traversal', () => {
      // The traversal engine is already mocked in our dependencies
      // It will return visitedNodes containing the startId
      const result = viewBuilder.build(NodeConnectionsConfig, mockData, {
        nodeId: 'char1',
        nodeType: 'character',
        maxDepth: 2,
        maxNodes: 10
      });

      expect(result).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0);
      // Verify traversalEngine was called
      expect(traversalEngine.traverse).toHaveBeenCalled();
    });
  });

  describe('Edge Configuration', () => {
    it('should filter edges by type', () => {
      mockEdgeResolver.createPuzzleEdges.mockReturnValue([
        { id: 'e1', source: 'p1', target: 'p2', type: 'dependency', data: { relationshipType: 'dependency' } },
        { id: 'e2', source: 'p1', target: 'elem1', type: 'reward', data: { relationshipType: 'reward' } },
        { id: 'e3', source: 'p2', target: 'p3', type: 'chain', data: { relationshipType: 'chain' } }
      ] as any);

      const config: ViewConfiguration = {
        id: 'edge-filter',
        name: 'Edge Filter View',
        nodes: {
          include: [{ type: 'basic', ids: ['puzzle1'] }]
        },
        edges: [
          {
            entityType: 'puzzle',
            includeTypes: ['dependency', 'chain']
          }
        ]
      };

      const result = viewBuilder.build(config, mockData);

      // Should exclude 'reward' type edges
      expect(result.edges).toHaveLength(2);
      expect(result.edges.every(e => e.type !== 'reward')).toBe(true);
    });
  });
});

describe('ViewRegistry', () => {
  let registry: ViewRegistry;

  beforeEach(() => {
    registry = new ViewRegistry();
  });

  it('should register and retrieve configurations', () => {
    registry.register(TimelineConfig);
    
    const retrieved = registry.get('timeline');
    expect(retrieved).toBe(TimelineConfig);
  });

  it('should generate metadata', () => {
    registry.register(NodeConnectionsConfig);
    
    const metadata = registry.getMetadata('node-connections');
    expect(metadata).toBeDefined();
    expect(metadata?.requiredVariables).toContain('nodeId');
    expect(metadata?.requiredVariables).toContain('nodeType');
  });

  it('should validate configurations', () => {
    const invalidConfig = {
      id: 'invalid',
      name: 'Invalid'
      // Missing nodes and edges
    } as ViewConfiguration;

    expect(() => registry.register(invalidConfig)).toThrow();
  });
});

describe('ViewCache', () => {
  let cache: ViewCache;

  beforeEach(() => {
    cache = new ViewCache();
  });

  afterEach(() => {
    cache.destroy();
  });

  it('should cache and retrieve graph data', () => {
    const config = { id: 'test' } as ViewConfiguration;
    const graphData: GraphData = { nodes: [], edges: [] };

    cache.set(config, undefined, graphData);
    const retrieved = cache.get(config, undefined);

    expect(retrieved).toBe(graphData);
  });

  it('should respect TTL', async () => {
    const config = {
      id: 'test',
      performance: { cacheTTL: 100 } // 100ms TTL
    } as ViewConfiguration;
    const graphData: GraphData = { nodes: [], edges: [] };

    cache.set(config, undefined, graphData);
    
    // Should be cached
    expect(cache.get(config, undefined)).toBe(graphData);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should be expired
    expect(cache.get(config, undefined)).toBeUndefined();
  });

  it('should generate different keys for different variables', () => {
    const config = { id: 'test' } as ViewConfiguration;
    const graphData1: GraphData = { nodes: [], edges: [] };
    const graphData2: GraphData = { nodes: [{ id: 'n1' } as any], edges: [] };

    cache.set(config, { var1: 'a' }, graphData1);
    cache.set(config, { var1: 'b' }, graphData2);

    expect(cache.get(config, { var1: 'a' })).toBe(graphData1);
    expect(cache.get(config, { var1: 'b' })).toBe(graphData2);
  });
});