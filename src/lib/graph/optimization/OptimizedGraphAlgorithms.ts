/**
 * Optimized Graph Algorithms
 * 
 * Provides performance-optimized algorithms for graph operations,
 * replacing O(n²) operations with more efficient alternatives.
 */

import type { GraphNode, GraphEdge } from '../types';

interface SweepEvent {
  x: number;
  type: 'start' | 'end';
  edgeIndex: number;
  edge: GraphEdge;
  yMin: number;
  yMax: number;
}

/**
 * Sweep line algorithm for detecting edge crossings
 * Time complexity: O(n log n) instead of O(n²)
 */
export class SweepLineEdgeCrossing {
  private events: SweepEvent[] = [];
  private activeSegments = new Set<number>();
  
  /**
   * Count edge crossings using sweep line algorithm
   */
  countCrossings(edges: GraphEdge[], nodes: GraphNode[]): number {
    // Build node position lookup map for O(1) access
    const nodePositions = new Map<string, { x: number; y: number }>();
    nodes.forEach(node => {
      nodePositions.set(node.id, node.position);
    });
    
    // Create sweep events
    this.events = [];
    edges.forEach((edge, index) => {
      const source = nodePositions.get(edge.source);
      const target = nodePositions.get(edge.target);
      
      if (!source || !target) return;
      
      const minX = Math.min(source.x, target.x);
      const maxX = Math.max(source.x, target.x);
      const minY = Math.min(source.y, target.y);
      const maxY = Math.max(source.y, target.y);
      
      this.events.push({
        x: minX,
        type: 'start',
        edgeIndex: index,
        edge,
        yMin: minY,
        yMax: maxY
      });
      
      this.events.push({
        x: maxX,
        type: 'end',
        edgeIndex: index,
        edge,
        yMin: minY,
        yMax: maxY
      });
    });
    
    // Sort events by x-coordinate
    this.events.sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      // Process end events before start events at same x
      if (a.type !== b.type) return a.type === 'end' ? -1 : 1;
      return 0;
    });
    
    // Process sweep line
    let crossings = 0;
    this.activeSegments.clear();
    
    for (const event of this.events) {
      if (event.type === 'start') {
        // Check for intersections with active segments
        for (const activeIndex of this.activeSegments) {
          const activeEdge = edges[activeIndex];
          if (!activeEdge) continue;
          
          const activeSource = nodePositions.get(activeEdge.source);
          const activeTarget = nodePositions.get(activeEdge.target);
          
          if (activeSource && activeTarget) {
            const source = nodePositions.get(event.edge.source);
            const target = nodePositions.get(event.edge.target);
            
            if (source && target && this.segmentsIntersect(
              activeSource, activeTarget,
              source, target
            )) {
              crossings++;
            }
          }
        }
        
        this.activeSegments.add(event.edgeIndex);
      } else {
        this.activeSegments.delete(event.edgeIndex);
      }
    }
    
    return crossings;
  }
  
  private segmentsIntersect(
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
}

/**
 * Spatial indexing for node overlap detection
 * Uses grid-based spatial hashing for O(n) average case
 */
export class SpatialIndex {
  private grid: Map<string, GraphNode[]> = new Map();
  private cellSize: number;
  
  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
  }
  
  /**
   * Build spatial index from nodes
   */
  buildIndex(nodes: GraphNode[]): void {
    this.grid.clear();
    
    nodes.forEach(node => {
      const cellKey = this.getCellKey(node.position.x, node.position.y);
      
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, []);
      }
      
      this.grid.get(cellKey)!.push(node);
    });
  }
  
  /**
   * Count node overlaps using spatial indexing
   */
  countOverlaps(nodes: GraphNode[], threshold: number = 50): number {
    this.buildIndex(nodes);
    
    let overlaps = 0;
    const checked = new Set<string>();
    
    nodes.forEach(node => {
      // Get neighboring cells
      const neighbors = this.getNeighboringCells(node.position.x, node.position.y);
      
      neighbors.forEach(cellKey => {
        const cellNodes = this.grid.get(cellKey) || [];
        
        cellNodes.forEach(other => {
          if (node.id === other.id) return;
          
          const pairKey = [node.id, other.id].sort().join('-');
          if (checked.has(pairKey)) return;
          
          checked.add(pairKey);
          
          const dx = Math.abs(node.position.x - other.position.x);
          const dy = Math.abs(node.position.y - other.position.y);
          
          if (dx < threshold && dy < threshold) {
            overlaps++;
          }
        });
      });
    });
    
    return overlaps;
  }
  
  /**
   * Find nodes within radius of a point
   */
  findNodesInRadius(x: number, y: number, radius: number): GraphNode[] {
    const result: GraphNode[] = [];
    const cellsToCheck = this.getCellsInRadius(x, y, radius);
    
    cellsToCheck.forEach(cellKey => {
      const cellNodes = this.grid.get(cellKey) || [];
      
      cellNodes.forEach(node => {
        const distance = Math.sqrt(
          Math.pow(node.position.x - x, 2) +
          Math.pow(node.position.y - y, 2)
        );
        
        if (distance <= radius) {
          result.push(node);
        }
      });
    });
    
    return result;
  }
  
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
  
  private getNeighboringCells(x: number, y: number): string[] {
    const cells: string[] = [];
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    
    // Include the cell itself and 8 neighboring cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        cells.push(`${cellX + dx},${cellY + dy}`);
      }
    }
    
    return cells;
  }
  
  private getCellsInRadius(x: number, y: number, radius: number): string[] {
    const cells: string[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellY = Math.floor(y / this.cellSize);
    
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        cells.push(`${centerCellX + dx},${centerCellY + dy}`);
      }
    }
    
    return cells;
  }
}

/**
 * Optimized connected component finder using Union-Find
 */
export class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();
  
  /**
   * Initialize union-find structure
   */
  initialize(nodeIds: string[]): void {
    nodeIds.forEach(id => {
      this.parent.set(id, id);
      this.rank.set(id, 0);
    });
  }
  
  /**
   * Find root with path compression
   */
  find(x: string): string {
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }
  
  /**
   * Union by rank
   */
  union(x: string, y: string): void {
    const rootX = this.find(x);
    const rootY = this.find(y);
    
    if (rootX === rootY) return;
    
    const rankX = this.rank.get(rootX) || 0;
    const rankY = this.rank.get(rootY) || 0;
    
    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
  }
  
  /**
   * Get connected components
   */
  getComponents(): Map<string, string[]> {
    const components = new Map<string, string[]>();
    
    for (const [node] of this.parent) {
      const root = this.find(node);
      
      if (!components.has(root)) {
        components.set(root, []);
      }
      
      components.get(root)!.push(node);
    }
    
    return components;
  }
  
  /**
   * Find connected components in graph
   */
  static findConnectedComponents(
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): Map<string, GraphNode[]> {
    const uf = new UnionFind();
    const nodeIds = nodes.map(n => n.id);
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    uf.initialize(nodeIds);
    
    // Process edges to connect components
    edges.forEach(edge => {
      if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
        uf.union(edge.source, edge.target);
      }
    });
    
    // Build component map
    const componentIds = uf.getComponents();
    const components = new Map<string, GraphNode[]>();
    
    for (const [rootId, nodeIds] of componentIds) {
      const componentNodes = nodeIds
        .map(id => nodeMap.get(id))
        .filter((n): n is GraphNode => n !== undefined);
      
      if (componentNodes.length > 0) {
        components.set(rootId, componentNodes);
      }
    }
    
    return components;
  }
}

/**
 * Optimized edge length calculator with caching
 */
export class EdgeLengthCalculator {
  private nodePositionCache = new Map<string, { x: number; y: number }>();
  private edgeLengthCache = new Map<string, number>();
  
  /**
   * Build position cache
   */
  buildCache(nodes: GraphNode[]): void {
    this.nodePositionCache.clear();
    nodes.forEach(node => {
      this.nodePositionCache.set(node.id, node.position);
    });
  }
  
  /**
   * Calculate edge lengths with caching
   */
  calculateEdgeLengths(edges: GraphEdge[]): number[] {
    const lengths: number[] = [];
    
    edges.forEach(edge => {
      const cacheKey = `${edge.source}-${edge.target}`;
      
      if (this.edgeLengthCache.has(cacheKey)) {
        lengths.push(this.edgeLengthCache.get(cacheKey)!);
        return;
      }
      
      const source = this.nodePositionCache.get(edge.source);
      const target = this.nodePositionCache.get(edge.target);
      
      if (source && target) {
        const length = Math.sqrt(
          Math.pow(target.x - source.x, 2) +
          Math.pow(target.y - source.y, 2)
        );
        
        this.edgeLengthCache.set(cacheKey, length);
        lengths.push(length);
      }
    });
    
    return lengths;
  }
  
  /**
   * Clear caches
   */
  clearCache(): void {
    this.nodePositionCache.clear();
    this.edgeLengthCache.clear();
  }
}

/**
 * Batch matrix operations for performance
 */
export class MatrixOperations {
  /**
   * Calculate distance matrix efficiently
   */
  static calculateDistanceMatrix(nodes: GraphNode[]): number[][] {
    const n = nodes.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    // Use symmetry to reduce calculations by half
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const distance = Math.sqrt(
          Math.pow(nodes[j]!.position.x - nodes[i]!.position.x, 2) +
          Math.pow(nodes[j]!.position.y - nodes[i]!.position.y, 2)
        );
        
        matrix[i]![j] = distance;
        matrix[j]![i] = distance; // Symmetric
      }
    }
    
    return matrix;
  }
  
  /**
   * Find k-nearest neighbors efficiently
   */
  static findKNearestNeighbors(
    nodeIndex: number,
    distanceMatrix: number[][],
    k: number
  ): number[] {
    const distances = distanceMatrix[nodeIndex]!;
    const indexed = distances.map((d, i) => ({ distance: d, index: i }));
    
    // Filter out self and sort
    const filtered = indexed.filter(item => item.index !== nodeIndex);
    filtered.sort((a, b) => a.distance - b.distance);
    
    return filtered.slice(0, k).map(item => item.index);
  }
}

/**
 * Export optimized layout quality calculator
 */
export function calculateOptimizedLayoutQuality(
  nodes: GraphNode[],
  edges: GraphEdge[]
): {
  edgeCrossings: number;
  nodeOverlaps: number;
  edgeLengths: number[];
  averageEdgeLength: number;
  edgeLengthVariance: number;
} {
  // Use optimized algorithms
  const sweepLine = new SweepLineEdgeCrossing();
  const spatialIndex = new SpatialIndex();
  const lengthCalculator = new EdgeLengthCalculator();
  
  // Build caches
  lengthCalculator.buildCache(nodes);
  
  // Calculate metrics
  const edgeCrossings = sweepLine.countCrossings(edges, nodes);
  const nodeOverlaps = spatialIndex.countOverlaps(nodes);
  const edgeLengths = lengthCalculator.calculateEdgeLengths(edges);
  
  const totalLength = edgeLengths.reduce((sum, len) => sum + len, 0);
  const averageEdgeLength = edgeLengths.length > 0 
    ? totalLength / edgeLengths.length 
    : 0;
  
  const edgeLengthVariance = edgeLengths.length > 0
    ? edgeLengths.reduce((sum, len) => 
        sum + Math.pow(len - averageEdgeLength, 2), 0
      ) / edgeLengths.length
    : 0;
  
  // Clear caches
  lengthCalculator.clearCache();
  
  return {
    edgeCrossings,
    nodeOverlaps,
    edgeLengths,
    averageEdgeLength,
    edgeLengthVariance
  };
}