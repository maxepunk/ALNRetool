/**
 * Layout Quality Metrics Module
 * 
 * Provides comprehensive metrics for evaluating graph layout quality,
 * including edge crossings, node overlaps, clustering scores, and more.
 * 
 * Extracted from pureDagreLayout.ts for better modularity.
 */

import type { GraphNode, GraphEdge } from '../types';

/**
 * Interface for layout quality metrics
 */
export interface LayoutQualityMetrics {
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
 * Uses the cross product method to determine intersection
 * 
 * @param p1 - Start point of first segment
 * @param p2 - End point of first segment
 * @param p3 - Start point of second segment
 * @param p4 - End point of second segment
 * @returns true if segments intersect, false otherwise
 */
export function doEdgesIntersect(
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
 * 
 * @param nodes - Array of positioned graph nodes
 * @param edges - Array of graph edges
 * @returns Object containing various quality metrics
 */
export function calculateLayoutQuality(
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
    const entity = element.data.entity as any;
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
    elementClusteringScore: Math.round(elementClusteringScore * 100) / 100,
    puzzleAlignmentScore: Math.round(puzzleAlignmentScore * 100) / 100,
  };
}

/**
 * Report layout quality metrics to console
 * 
 * @param metrics - Layout quality metrics to report
 */
export function reportLayoutQuality(metrics: LayoutQualityMetrics): void {
  console.log('[Layout Quality Report]');
  console.log(`  Edge Crossings: ${metrics.edgeCrossings}`);
  console.log(`  Total Edge Length: ${metrics.totalEdgeLength}px`);
  console.log(`  Average Edge Length: ${metrics.averageEdgeLength}px`);
  console.log(`  Edge Length Variance: ${metrics.edgeLengthVariance}`);
  console.log(`  Node Overlaps: ${metrics.nodeOverlaps}`);
  console.log(`  Aspect Ratio: ${metrics.aspectRatio}`);
  console.log(`  Node Density: ${metrics.density}`);
  console.log(`  Element Clustering Score: ${metrics.elementClusteringScore} (0-1, higher is better)`);
  console.log(`  Puzzle Alignment Score: ${metrics.puzzleAlignmentScore} (0-1, higher is better)`);

  // Overall quality assessment
  const qualityScore = (
    (1 - Math.min(metrics.edgeCrossings / 20, 1)) * 0.3 +  // Fewer crossings is better
    (1 - Math.min(metrics.nodeOverlaps / 10, 1)) * 0.2 +   // No overlaps is better
    (Math.min(metrics.aspectRatio / 3, 1)) * 0.1 +          // Aspect ratio around 3 is good
    metrics.elementClusteringScore * 0.2 +                   // Higher clustering is better
    metrics.puzzleAlignmentScore * 0.2                       // Better alignment is better
  );

  const qualityLevel = 
    qualityScore > 0.8 ? 'Excellent' :
    qualityScore > 0.6 ? 'Good' :
    qualityScore > 0.4 ? 'Fair' : 'Poor';

  console.log(`  Overall Quality: ${qualityLevel} (${Math.round(qualityScore * 100)}%)`);
}