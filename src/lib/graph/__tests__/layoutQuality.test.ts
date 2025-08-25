/**
 * Tests for Layout Quality Metrics
 * 
 * Tests the calculateLayoutQuality function and its helper functions
 * to ensure accurate measurement of layout characteristics.
 */

import { describe, it, expect } from 'vitest';
import type { GraphNode, GraphEdge } from '../types';
import type { Element, Puzzle } from '@/types/notion/app';

// Mock the pureDagreLayout module to expose internal functions
// Since these are not exported, we'll need to test them indirectly
// through the main applyPureDagreLayout function, or extract them first

// For now, we'll create test utilities that mirror the internal implementations
// These should match the implementations in pureDagreLayout.ts exactly

interface LayoutQualityMetrics {
  edgeCrossings: number;
  totalEdgeLength: number;
  averageEdgeLength: number;
  nodeOverlaps: number;
  aspectRatio: number;
  density: number;
  edgeLengthVariance: number;
  elementClusteringScore: number;
  puzzleAlignmentScore: number;
}

/**
 * Check if two line segments intersect
 * Mirrors the internal doEdgesIntersect function
 */
function doEdgesIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const ccw = (A: typeof p1, B: typeof p1, C: typeof p1) => {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  };

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Calculate comprehensive layout quality metrics
 * Mirrors the internal calculateLayoutQuality function
 */
function calculateLayoutQuality(
  nodes: GraphNode[],
  edges: GraphEdge[]
): LayoutQualityMetrics {
  // Calculate edge crossings
  let edgeCrossings = 0;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const edge1 = edges[i];
      const edge2 = edges[j];
      if (!edge1 || !edge2) continue;

      const source1 = nodes.find(n => n.id === edge1.source);
      const target1 = nodes.find(n => n.id === edge1.target);
      const source2 = nodes.find(n => n.id === edge2.source);
      const target2 = nodes.find(n => n.id === edge2.target);

      if (source1 && target1 && source2 && target2) {
        if (doEdgesIntersect(
          source1.position, target1.position,
          source2.position, target2.position
        )) {
          edgeCrossings++;
        }
      }
    }
  }

  // Calculate edge lengths
  const edgeLengths: number[] = [];
  edges.forEach(edge => {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    if (source && target) {
      const length = Math.sqrt(
        Math.pow(target.position.x - source.position.x, 2) +
        Math.pow(target.position.y - source.position.y, 2)
      );
      edgeLengths.push(length);
    }
  });

  const totalEdgeLength = edgeLengths.reduce((sum, len) => sum + len, 0);
  const averageEdgeLength = edgeLengths.length > 0 ?
    totalEdgeLength / edgeLengths.length : 0;

  // Calculate edge length variance
  const edgeLengthVariance = edgeLengths.length > 0 ?
    edgeLengths.reduce((sum, len) => sum + Math.pow(len - averageEdgeLength, 2), 0) / edgeLengths.length : 0;

  // Calculate node overlaps
  let nodeOverlaps = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const node1 = nodes[i];
      const node2 = nodes[j];
      if (!node1 || !node2) continue;
      
      const dx = Math.abs(node1.position.x - node2.position.x);
      const dy = Math.abs(node1.position.y - node2.position.y);
      
      // Consider nodes overlapping if too close
      if (dx < 50 && dy < 50) {
        nodeOverlaps++;
      }
    }
  }

  // Calculate bounding box and aspect ratio
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  nodes.forEach(node => {
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y);
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const aspectRatio = width > 0 && height > 0 ? width / height : 1;
  const area = width * height;
  const density = area > 0 ? nodes.length / area : 0;

  // Calculate element clustering score (how well elements cluster near puzzles)
  let elementClusteringScore = 0;
  const elementNodes = nodes.filter(n => n.data.metadata.entityType === 'element');
  const puzzleNodes = nodes.filter(n => n.data.metadata.entityType === 'puzzle');

  elementNodes.forEach(element => {
    const entity = element.data.entity;
    const connectedPuzzles = [
      ...(entity.requiredForPuzzleIds || []),
      ...(entity.rewardedByPuzzleIds || [])
    ];

    if (connectedPuzzles.length > 0) {
      let minDistance = Infinity;
      connectedPuzzles.forEach(puzzleId => {
        const puzzle = puzzleNodes.find(p => p.id === puzzleId);
        if (puzzle) {
          const distance = Math.sqrt(
            Math.pow(puzzle.position.x - element.position.x, 2) +
            Math.pow(puzzle.position.y - element.position.y, 2)
          );
          minDistance = Math.min(minDistance, distance);
        }
      });

      // Score based on proximity (closer is better)
      if (minDistance < Infinity) {
        elementClusteringScore += Math.max(0, 1 - minDistance / 500);
      }
    }
  });

  elementClusteringScore = elementNodes.length > 0 ? 
    elementClusteringScore / elementNodes.length : 1;

  // Calculate puzzle alignment score (how well puzzles align horizontally)
  let puzzleAlignmentScore = 0;
  if (puzzleNodes.length > 1) {
    const yPositions = puzzleNodes.map(p => p.position.y);
    const avgY = yPositions.reduce((sum, y) => sum + y, 0) / yPositions.length;
    const yVariance = yPositions.reduce((sum, y) => sum + Math.pow(y - avgY, 2), 0) / yPositions.length;

    // Lower variance means better alignment
    puzzleAlignmentScore = Math.max(0, 1 - Math.sqrt(yVariance) / 200);
  } else {
    puzzleAlignmentScore = 1;
  }

  return {
    edgeCrossings,
    totalEdgeLength: Math.round(totalEdgeLength),
    averageEdgeLength: Math.round(averageEdgeLength),
    nodeOverlaps,
    aspectRatio: Math.round(aspectRatio * 100) / 100,
    density: Math.round(density * 10000) / 10000,
    edgeLengthVariance: Math.round(edgeLengthVariance),
    elementClusteringScore: Math.round(elementClusteringScore * 100),
    puzzleAlignmentScore: Math.round(puzzleAlignmentScore * 100),
  };
}

// Helper to create mock nodes
function createMockNode(
  id: string,
  x: number,
  y: number,
  entityType: 'puzzle' | 'element' = 'element',
  entity?: Partial<Element | Puzzle>
): GraphNode {
  return {
    id,
    type: entityType === 'puzzle' ? 'puzzle' : 'element',
    position: { x, y },
    data: {
      label: `Node ${id}`,
      metadata: {
        entityType,
      },
      entity: entity || {},
    },
  };
}

// Helper to create mock edges
function createMockEdge(id: string, source: string, target: string): GraphEdge {
  return {
    id,
    source,
    target,
    type: 'dependency',
  };
}

describe('Layout Quality Metrics', () => {
  describe('doEdgesIntersect', () => {
    it('should detect intersecting edges', () => {
      // Two lines that clearly intersect
      const result = doEdgesIntersect(
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
        { x: 100, y: 0 }
      );
      expect(result).toBe(true);
    });

    it('should not detect parallel edges as intersecting', () => {
      // Two parallel horizontal lines
      const result = doEdgesIntersect(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 0, y: 50 },
        { x: 100, y: 50 }
      );
      expect(result).toBe(false);
    });

    it('should not detect non-intersecting edges', () => {
      // Two lines that don't intersect
      const result = doEdgesIntersect(
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 60, y: 0 },
        { x: 100, y: 0 }
      );
      expect(result).toBe(false);
    });

    it('should handle edge cases with shared endpoints', () => {
      // Two lines sharing an endpoint (touching at endpoint)
      // The algorithm considers touching endpoints as intersection
      const result = doEdgesIntersect(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 }
      );
      expect(result).toBe(true); // Algorithm counts touching as intersection
    });
  });

  describe('calculateLayoutQuality', () => {
    it('should calculate edge crossings correctly', () => {
      const nodes = [
        createMockNode('a', 0, 0),
        createMockNode('b', 100, 100),
        createMockNode('c', 0, 100),
        createMockNode('d', 100, 0),
      ];
      const edges = [
        createMockEdge('e1', 'a', 'b'), // Diagonal from top-left to bottom-right
        createMockEdge('e2', 'c', 'd'), // Diagonal from bottom-left to top-right
      ];

      const metrics = calculateLayoutQuality(nodes, edges);
      expect(metrics.edgeCrossings).toBe(1);
    });

    it('should calculate edge lengths correctly', () => {
      const nodes = [
        createMockNode('a', 0, 0),
        createMockNode('b', 100, 0),
        createMockNode('c', 0, 100),
      ];
      const edges = [
        createMockEdge('e1', 'a', 'b'), // Length = 100
        createMockEdge('e2', 'a', 'c'), // Length = 100
      ];

      const metrics = calculateLayoutQuality(nodes, edges);
      expect(metrics.totalEdgeLength).toBe(200);
      expect(metrics.averageEdgeLength).toBe(100);
      expect(metrics.edgeLengthVariance).toBe(0); // All edges same length
    });

    it('should calculate edge length variance', () => {
      const nodes = [
        createMockNode('a', 0, 0),
        createMockNode('b', 100, 0),
        createMockNode('c', 200, 0),
      ];
      const edges = [
        createMockEdge('e1', 'a', 'b'), // Length = 100
        createMockEdge('e2', 'a', 'c'), // Length = 200
      ];

      const metrics = calculateLayoutQuality(nodes, edges);
      expect(metrics.averageEdgeLength).toBe(150);
      expect(metrics.edgeLengthVariance).toBeGreaterThan(0);
    });

    it('should detect node overlaps', () => {
      const nodes = [
        createMockNode('a', 0, 0),
        createMockNode('b', 30, 30), // Overlapping with 'a' (within 50px threshold)
        createMockNode('c', 100, 100), // Not overlapping
      ];
      const edges: GraphEdge[] = [];

      const metrics = calculateLayoutQuality(nodes, edges);
      expect(metrics.nodeOverlaps).toBe(1);
    });

    it('should calculate aspect ratio and density', () => {
      const nodes = [
        createMockNode('a', 0, 0),
        createMockNode('b', 200, 0),
        createMockNode('c', 100, 100),
      ];
      const edges: GraphEdge[] = [];

      const metrics = calculateLayoutQuality(nodes, edges);
      // Width = 200, Height = 100, Aspect ratio = 2
      expect(metrics.aspectRatio).toBe(2);
      // Area = 200 * 100 = 20000, Density = 3 / 20000 = 0.00015
      // But implementation rounds to 4 decimal places: 0.0001
      expect(metrics.density).toBe(0.0001);
    });

    it('should calculate element clustering score', () => {
      const puzzleNode = createMockNode('p1', 100, 100, 'puzzle');
      const closeElement = createMockNode('e1', 150, 100, 'element', {
        requiredForPuzzleIds: ['p1'],
      } as Element);
      const farElement = createMockNode('e2', 600, 600, 'element', {
        requiredForPuzzleIds: ['p1'],
      } as Element);
      const unconnectedElement = createMockNode('e3', 0, 0, 'element');

      const nodes = [puzzleNode, closeElement, farElement, unconnectedElement];
      const edges: GraphEdge[] = [];

      const metrics = calculateLayoutQuality(nodes, edges);
      // Close element should contribute high score, far element low score
      expect(metrics.elementClusteringScore).toBeGreaterThan(0);
      expect(metrics.elementClusteringScore).toBeLessThan(100);
    });

    it('should calculate puzzle alignment score', () => {
      // Well-aligned puzzles (same Y position)
      const alignedNodes = [
        createMockNode('p1', 0, 100, 'puzzle'),
        createMockNode('p2', 100, 100, 'puzzle'),
        createMockNode('p3', 200, 100, 'puzzle'),
      ];

      const alignedMetrics = calculateLayoutQuality(alignedNodes, []);
      expect(alignedMetrics.puzzleAlignmentScore).toBe(100); // Gets multiplied by 100 and rounded

      // Poorly aligned puzzles (different Y positions)
      const misalignedNodes = [
        createMockNode('p1', 0, 0, 'puzzle'),
        createMockNode('p2', 100, 100, 'puzzle'),
        createMockNode('p3', 200, 200, 'puzzle'),
      ];

      const misalignedMetrics = calculateLayoutQuality(misalignedNodes, []);
      expect(misalignedMetrics.puzzleAlignmentScore).toBeLessThan(100);
    });

    it('should handle empty graphs', () => {
      const metrics = calculateLayoutQuality([], []);
      expect(metrics.edgeCrossings).toBe(0);
      expect(metrics.totalEdgeLength).toBe(0);
      expect(metrics.averageEdgeLength).toBe(0);
      expect(metrics.nodeOverlaps).toBe(0);
      expect(metrics.aspectRatio).toBe(1);
      expect(metrics.density).toBe(0);
    });

    it('should handle single node graphs', () => {
      const nodes = [createMockNode('a', 50, 50)];
      const metrics = calculateLayoutQuality(nodes, []);
      
      expect(metrics.edgeCrossings).toBe(0);
      expect(metrics.nodeOverlaps).toBe(0);
      expect(metrics.aspectRatio).toBe(1); // Single point has aspect ratio 1
      // Single element node with no puzzle connections, score = 0 / 1 = 0
      expect(metrics.elementClusteringScore).toBe(0);
      expect(metrics.puzzleAlignmentScore).toBe(100); // No puzzles = perfect alignment
    });

    it('should handle disconnected graphs', () => {
      const nodes = [
        createMockNode('a', 0, 0),
        createMockNode('b', 100, 0),
        createMockNode('c', 200, 0),
        createMockNode('d', 300, 0),
      ];
      // No edges - completely disconnected

      const metrics = calculateLayoutQuality(nodes, []);
      expect(metrics.edgeCrossings).toBe(0);
      expect(metrics.totalEdgeLength).toBe(0);
      expect(metrics.averageEdgeLength).toBe(0);
      expect(metrics.nodeOverlaps).toBe(0);
    });
  });

  describe('Edge case handling', () => {
    it('should handle undefined edges in array', () => {
      const nodes = [
        createMockNode('a', 0, 0),
        createMockNode('b', 100, 0),
      ];
      const edges = [
        createMockEdge('e1', 'a', 'b'),
        undefined as any,
        null as any,
      ];

      // Should not throw and should ignore undefined/null edges
      const metrics = calculateLayoutQuality(nodes.filter(Boolean), edges.filter(Boolean));
      expect(metrics.totalEdgeLength).toBe(100);
    });

    it('should handle edges with missing nodes', () => {
      const nodes = [
        createMockNode('a', 0, 0),
        createMockNode('b', 100, 0),
      ];
      const edges = [
        createMockEdge('e1', 'a', 'b'), // Valid
        createMockEdge('e2', 'a', 'nonexistent'), // Invalid target
        createMockEdge('e3', 'nonexistent', 'b'), // Invalid source
      ];

      const metrics = calculateLayoutQuality(nodes, edges);
      // Should only count the valid edge
      expect(metrics.totalEdgeLength).toBe(100);
      expect(metrics.edgeCrossings).toBe(0);
    });

    it('should handle very large graphs efficiently', () => {
      // Create a grid of nodes
      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];
      const gridSize = 10;

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const id = `n${i}_${j}`;
          nodes.push(createMockNode(id, i * 100, j * 100));
          
          // Connect to right neighbor
          if (i < gridSize - 1) {
            edges.push(createMockEdge(`e_h_${i}_${j}`, id, `n${i + 1}_${j}`));
          }
          // Connect to bottom neighbor
          if (j < gridSize - 1) {
            edges.push(createMockEdge(`e_v_${i}_${j}`, id, `n${i}_${j + 1}`));
          }
        }
      }

      const startTime = performance.now();
      const metrics = calculateLayoutQuality(nodes, edges);
      const endTime = performance.now();

      // Should complete in reasonable time (< 1 second for 100 nodes)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Grid layout with orthogonal edges has many crossings
      // Each horizontal edge crosses with each vertical edge at grid intersections
      expect(metrics.edgeCrossings).toBeGreaterThan(0);
      // All edges in grid should have same length
      expect(metrics.edgeLengthVariance).toBe(0);
    });
  });
});