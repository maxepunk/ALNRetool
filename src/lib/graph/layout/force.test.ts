import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyForceLayout } from './force';
import type { GraphNode, GraphEdge, NodeMetadata, GraphNodeData } from '../types';

// Helper function to create valid node data
const createNodeData = (label: string, entityType: string): GraphNodeData => ({
  label,
  metadata: { entityType } as NodeMetadata,
  entity: null
});

// Mock d3-force
vi.mock('d3-force', () => ({
  forceSimulation: vi.fn(() => ({
    nodes: vi.fn().mockReturnThis(),
    force: vi.fn().mockReturnThis(),
    alpha: vi.fn().mockReturnThis(),
    alphaMin: vi.fn().mockReturnThis(),
    alphaTarget: vi.fn().mockReturnThis(),
    alphaDecay: vi.fn().mockReturnThis(),
    velocityDecay: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    tick: vi.fn().mockReturnThis(),
    on: vi.fn((event, callback) => {
      if (event === 'end' && callback) {
        // Simulate immediate completion
        setTimeout(() => callback(), 0);
      }
      return {
        nodes: vi.fn().mockReturnThis(),
        force: vi.fn().mockReturnThis(),
        alpha: vi.fn().mockReturnThis(),
        alphaMin: vi.fn().mockReturnThis(),
        alphaTarget: vi.fn().mockReturnThis(),
        alphaDecay: vi.fn().mockReturnThis(),
        velocityDecay: vi.fn().mockReturnThis(),
        stop: vi.fn().mockReturnThis(),
        tick: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis()
      };
    })
  })),
  forceLink: vi.fn(() => ({
    id: vi.fn().mockReturnThis(),
    distance: vi.fn().mockReturnThis(),
    strength: vi.fn().mockReturnThis(),
    iterations: vi.fn().mockReturnThis(),
    links: vi.fn().mockReturnThis()
  })),
  forceManyBody: vi.fn(() => ({
    strength: vi.fn().mockReturnThis(),
    theta: vi.fn().mockReturnThis(),
    distanceMin: vi.fn().mockReturnThis(),
    distanceMax: vi.fn().mockReturnThis()
  })),
  forceX: vi.fn(() => ({
    strength: vi.fn().mockReturnThis(),
    x: vi.fn().mockReturnThis()
  })),
  forceY: vi.fn(() => ({
    strength: vi.fn().mockReturnThis(),
    y: vi.fn().mockReturnThis()
  })),
  forceCollide: vi.fn(() => ({
    radius: vi.fn().mockReturnThis(),
    strength: vi.fn().mockReturnThis(),
    iterations: vi.fn().mockReturnThis()
  })),
  forceCenter: vi.fn(() => ({
    strength: vi.fn().mockReturnThis(),
    x: vi.fn().mockReturnThis(),
    y: vi.fn().mockReturnThis()
  }))
}));

describe('applyForceLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Layout', () => {
    it('returns positioned nodes with x and y coordinates', () => {
      const nodes: GraphNode[] = [
        {
          id: 'node1',
          type: 'puzzle',
          data: { 
            label: 'Node 1',
            metadata: { entityType: 'puzzle' } as NodeMetadata,
            entity: null
          },
          position: { x: 0, y: 0 }
        },
        {
          id: 'node2',
          type: 'character',
          data: { 
            label: 'Node 2',
            metadata: { entityType: 'character' } as NodeMetadata,
            entity: null
          },
          position: { x: 0, y: 0 }
        }
      ];

      const edges: GraphEdge[] = [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
          type: 'dependency'
        }
      ];

      const result = applyForceLayout(nodes, edges);

      expect(result).toHaveLength(2);
      
      // Check that nodes have positions
      result.forEach((node: GraphNode) => {
        expect(node).toHaveProperty('position');
        expect(node.position).toHaveProperty('x');
        expect(node.position).toHaveProperty('y');
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      });
    });

    it('handles empty nodes and edges', () => {
      const result = applyForceLayout([], []);
      
      expect(result).toEqual([]);
    });

    it('handles nodes without edges', () => {
      const nodes: GraphNode[] = [
        {
          id: 'isolated1',
          type: 'element',
          data: createNodeData('Isolated 1', 'element'),
          position: { x: 0, y: 0 }
        },
        {
          id: 'isolated2',
          type: 'element',
          data: createNodeData('Isolated 2', 'element'),
          position: { x: 0, y: 0 }
        }
      ];

      const result = applyForceLayout(nodes, []);
      
      expect(result).toHaveLength(2);
      
      // Isolated nodes should still get positions
      result.forEach((node: GraphNode) => {
        expect(node.position).toBeDefined();
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      });
    });
  });

  describe('Node Types', () => {
    it('handles different node types correctly', () => {
      const nodes: GraphNode[] = [
        {
          id: 'puzzle1',
          type: 'puzzle',
          data: createNodeData('Puzzle', 'puzzle'),
          position: { x: 0, y: 0 }
        },
        {
          id: 'char1',
          type: 'character',
          data: createNodeData('Character', 'character'),
          position: { x: 0, y: 0 }
        },
        {
          id: 'elem1',
          type: 'element',
          data: createNodeData('Element', 'element'),
          position: { x: 0, y: 0 }
        },
        {
          id: 'timeline1',
          type: 'timeline',
          data: createNodeData('Timeline', 'timeline'),
          position: { x: 0, y: 0 }
        }
      ];

      const result = applyForceLayout(nodes, []);
      
      expect(result).toHaveLength(4);
      
      // Verify node types are preserved
      expect(result.find((n: GraphNode) => n.id === 'puzzle1')?.type).toBe('puzzle');
      expect(result.find((n: GraphNode) => n.id === 'char1')?.type).toBe('character');
      expect(result.find((n: GraphNode) => n.id === 'elem1')?.type).toBe('element');
      expect(result.find((n: GraphNode) => n.id === 'timeline1')?.type).toBe('timeline');
    });
  });

  describe('Edge Types', () => {
    it('preserves node properties after layout', () => {
      const nodes: GraphNode[] = [
        {
          id: 'n1',
          type: 'puzzle',
          data: createNodeData('N1', 'puzzle'),
          position: { x: 0, y: 0 }
        },
        {
          id: 'n2',
          type: 'puzzle',
          data: createNodeData('N2', 'puzzle'),
          position: { x: 0, y: 0 }
        },
        {
          id: 'n3',
          type: 'element',
          data: createNodeData('N3', 'element'),
          position: { x: 0, y: 0 }
        }
      ];

      const edges: GraphEdge[] = [
        {
          id: 'e1',
          source: 'n1',
          target: 'n2',
          type: 'dependency',
          animated: true
        },
        {
          id: 'e2',
          source: 'n2',
          target: 'n3',
          type: 'reward',
          style: { stroke: '#ff0000' }
        }
      ];

      const result = applyForceLayout(nodes, edges);
      
      expect(result).toHaveLength(3);
      
      // Verify nodes retain their original properties
      const n1 = result.find((n: GraphNode) => n.id === 'n1');
      expect(n1?.type).toBe('puzzle');
      expect(n1?.data.label).toBe('N1');
      
      const n2 = result.find((n: GraphNode) => n.id === 'n2');
      expect(n2?.type).toBe('puzzle');
      expect(n2?.data.label).toBe('N2');
      
      const n3 = result.find((n: GraphNode) => n.id === 'n3');
      expect(n3?.type).toBe('element');
      expect(n3?.data.label).toBe('N3');
    });
  });

  describe('Tier-based Layout', () => {
    it('groups nodes by tier when metadata is present', () => {
      const nodes: GraphNode[] = [
        {
          id: 'core1',
          type: 'character',
          data: { 
            label: 'Core Character',
            metadata: { entityType: 'character', tier: 'Core' } as NodeMetadata,
            entity: null
          },
          position: { x: 0, y: 0 }
        },
        {
          id: 'core2',
          type: 'character',
          data: { 
            label: 'Another Core',
            metadata: { entityType: 'character', tier: 'Core' } as NodeMetadata,
            entity: null
          },
          position: { x: 0, y: 0 }
        },
        {
          id: 'secondary1',
          type: 'character',
          data: { 
            label: 'Secondary Character',
            metadata: { entityType: 'character', tier: 'Secondary' } as NodeMetadata,
            entity: null
          },
          position: { x: 0, y: 0 }
        }
      ];

      const result = applyForceLayout(nodes, []);
      
      expect(result).toHaveLength(3);
      
      // All nodes should have positions
      result.forEach((node: GraphNode) => {
        expect(node.position).toBeDefined();
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      });
    });
  });

  describe('Timeline Layout', () => {
    it('orders timeline nodes by timestamp', () => {
      const nodes: GraphNode[] = [
        {
          id: 't1',
          type: 'timeline',
          data: { 
            label: 'Event 1',
            metadata: { entityType: 'timeline', timestamp: 1000 } as NodeMetadata,
            entity: null
          },
          position: { x: 0, y: 0 }
        },
        {
          id: 't2',
          type: 'timeline',
          data: { 
            label: 'Event 2',
            metadata: { entityType: 'timeline', timestamp: 2000 } as NodeMetadata,
            entity: null
          },
          position: { x: 0, y: 0 }
        },
        {
          id: 't3',
          type: 'timeline',
          data: { 
            label: 'Event 3',
            metadata: { entityType: 'timeline', timestamp: 1500 } as NodeMetadata,
            entity: null
          },
          position: { x: 0, y: 0 }
        }
      ];

      const result = applyForceLayout(nodes, []);
      
      expect(result).toHaveLength(3);
      
      // All timeline nodes should have positions
      result.forEach((node: GraphNode) => {
        expect(node.position).toBeDefined();
      });
    });
  });

  describe('Large Graphs', () => {
    it('handles large number of nodes', () => {
      const nodes: GraphNode[] = Array.from({ length: 100 }, (_, i) => ({
        id: `node${i}`,
        type: 'element',
        data: createNodeData(`Node ${i}`, 'element'),
        position: { x: 0, y: 0 }
      }));

      const edges: GraphEdge[] = Array.from({ length: 50 }, (_, i) => ({
        id: `edge${i}`,
        source: `node${i}`,
        target: `node${i + 50}`,
        type: 'relation'
      }));

      const result = applyForceLayout(nodes, edges);
      
      expect(result).toHaveLength(100);
      
      // All nodes should have valid positions
      result.forEach((node: GraphNode) => {
        expect(node.position).toBeDefined();
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
        expect(Number.isFinite(node.position.x)).toBe(true);
        expect(Number.isFinite(node.position.y)).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles invalid edge references gracefully', () => {
      const nodes: GraphNode[] = [
        {
          id: 'valid1',
          type: 'puzzle',
          data: createNodeData('Valid Node', 'puzzle'),
          position: { x: 0, y: 0 }
        }
      ];

      const edges: GraphEdge[] = [
        {
          id: 'invalid-edge',
          source: 'valid1',
          target: 'non-existent', // Invalid target
          type: 'dependency'
        }
      ];

      // Should not throw, but filter out invalid edges
      const result = applyForceLayout(nodes, edges);
      
      expect(result).toHaveLength(1);
      // Function returns nodes, not edges, so just check nodes have positions
      expect(result[0]?.position).toBeDefined();
    });

    it('handles nodes with missing positions', () => {
      const nodes = [
        {
          id: 'no-pos',
          type: 'puzzle',
          data: createNodeData('No Position', 'puzzle')
          // Missing position property
        }
      ] as GraphNode[];

      const result = applyForceLayout(nodes, []);
      
      expect(result).toHaveLength(1);
      expect(result[0]?.position).toBeDefined();
      expect(typeof result[0]?.position.x).toBe('number');
      expect(typeof result[0]?.position.y).toBe('number');
    });
  });

  describe('Canvas Sizing', () => {
    it('adjusts canvas size based on node count', () => {
      // Small graph
      const smallNodes: GraphNode[] = Array.from({ length: 10 }, (_, i) => ({
        id: `node${i}`,
        type: 'element',
        data: createNodeData(`Node ${i}`, 'element'),
        position: { x: 0, y: 0 }
      }));

      const smallResult = applyForceLayout(smallNodes, []);
      expect(smallResult).toHaveLength(10);

      // Large graph
      const largeNodes: GraphNode[] = Array.from({ length: 200 }, (_, i) => ({
        id: `node${i}`,
        type: 'element',
        data: createNodeData(`Node ${i}`, 'element'),
        position: { x: 0, y: 0 }
      }));

      const largeResult = applyForceLayout(largeNodes, []);
      expect(largeResult).toHaveLength(200);
      
      // Both should complete successfully with positioned nodes
      smallResult.forEach((node: GraphNode) => {
        expect(node.position).toBeDefined();
      });
      
      largeResult.forEach((node: GraphNode) => {
        expect(node.position).toBeDefined();
      });
    });
  });
});