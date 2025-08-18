/**
 * MetricsCalculator Module
 * Calculates various metrics about graph structure
 */

import type {
  GraphData,
  GraphNode,
  GraphEdge,
  GraphMetrics,
  EntityType,
  RelationshipType,
  MetricsCalculator as IMetricsCalculator
} from '../types';

export class MetricsCalculator implements IMetricsCalculator {
  /**
   * Calculate complete metrics for a graph
   */
  calculateMetrics(graph: GraphData): GraphMetrics {
    const nodeMetrics = this.calculateNodeMetrics(graph.nodes);
    const edgeMetrics = this.calculateEdgeMetrics(graph.edges);
    const connectivityMetrics = this.calculateConnectivity(graph);
    
    return {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      ...nodeMetrics,
      ...edgeMetrics,
      ...connectivityMetrics,
    } as GraphMetrics;
  }

  /**
   * Calculate node-related metrics
   */
  calculateNodeMetrics(nodes: GraphNode[]): Partial<GraphMetrics> {
    const entityCounts: Record<EntityType, number> = {
      character: 0,
      element: 0,
      puzzle: 0,
      timeline: 0,
    };
    
    nodes.forEach(node => {
      const entityType = node.data.metadata.entityType;
      if (entityType in entityCounts) {
        entityCounts[entityType]++;
      }
    });
    
    return {
      nodeCount: nodes.length,
      orphanCount: 0, // Will be calculated separately with edges
      entityCounts,
    };
  }

  /**
   * Calculate edge-related metrics
   */
  calculateEdgeMetrics(edges: GraphEdge[]): Partial<GraphMetrics> {
    const relationshipCounts: Record<RelationshipType, number> = {
      requirement: 0,
      reward: 0,
      collaboration: 0,
      timeline: 0,
      owner: 0,
      ownership: 0,
      container: 0,
      'virtual-dependency': 0,
      'puzzle-grouping': 0,
    };
    
    edges.forEach(edge => {
      const relationshipType = edge.data?.relationshipType;
      if (relationshipType && relationshipType in relationshipCounts) {
        relationshipCounts[relationshipType]++;
      }
    });
    
    return {
      edgeCount: edges.length,
      relationshipCounts,
    };
  }

  /**
   * Calculate connectivity metrics
   */
  calculateConnectivity(graph: GraphData): Partial<GraphMetrics> {
    const { nodes, edges } = graph;
    
    if (nodes.length === 0) {
      return {
        avgDegree: 0,
        density: 0,
        componentCount: 0,
        maxDepth: 0,
        orphanCount: 0,
      };
    }
    
    // Calculate average degree and find orphans
    const degrees = new Map<string, number>();
    edges.forEach(edge => {
      degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
    });
    
    // Count orphan nodes (nodes with no edges)
    let orphanCount = 0;
    nodes.forEach(node => {
      if (!degrees.has(node.id)) {
        orphanCount++;
      }
    });
    
    const totalDegree = Array.from(degrees.values()).reduce((sum, deg) => sum + deg, 0);
    const avgDegree = totalDegree / nodes.length;
    
    // Calculate density (actual edges / possible edges)
    const possibleEdges = (nodes.length * (nodes.length - 1)) / 2;
    const density = possibleEdges > 0 ? edges.length / possibleEdges : 0;
    
    // Calculate connected components
    const componentCount = this.countComponents(nodes, edges);
    
    // Calculate max depth (simplified - would need full traversal for accurate depth)
    const maxDepth = this.calculateMaxDepth(nodes, edges);
    
    return {
      avgDegree: Math.round(avgDegree * 100) / 100,
      density: Math.round(density * 1000) / 1000,
      componentCount,
      maxDepth,
      orphanCount,
    };
  }

  /**
   * Count connected components in the graph
   */
  private countComponents(nodes: GraphNode[], edges: GraphEdge[]): number {
    const adjacency = new Map<string, Set<string>>();
    const visited = new Set<string>();
    
    // Build adjacency list
    nodes.forEach(node => adjacency.set(node.id, new Set()));
    edges.forEach(edge => {
      adjacency.get(edge.source)?.add(edge.target);
      adjacency.get(edge.target)?.add(edge.source);
    });
    
    // DFS to count components
    let components = 0;
    
    const dfs = (nodeId: string) => {
      visited.add(nodeId);
      const neighbors = adjacency.get(nodeId) || new Set();
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      });
    };
    
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        components++;
        dfs(node.id);
      }
    });
    
    return components;
  }

  /**
   * Calculate maximum depth in the graph
   */
  private calculateMaxDepth(nodes: GraphNode[], edges: GraphEdge[]): number {
    // Build adjacency list for directed graph
    const adjacency = new Map<string, Set<string>>();
    nodes.forEach(node => adjacency.set(node.id, new Set()));
    edges.forEach(edge => {
      adjacency.get(edge.source)?.add(edge.target);
    });
    
    // Find nodes with no incoming edges (potential roots)
    const incomingCount = new Map<string, number>();
    nodes.forEach(node => incomingCount.set(node.id, 0));
    edges.forEach(edge => {
      incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    });
    
    const roots = nodes.filter(node => incomingCount.get(node.id) === 0);
    
    // BFS from each root to find max depth
    let maxDepth = 0;
    
    roots.forEach(root => {
      const queue: Array<{ id: string; depth: number }> = [{ id: root.id, depth: 0 }];
      const visitedInPath = new Set<string>();
      
      while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        
        if (visitedInPath.has(id)) continue;
        visitedInPath.add(id);
        
        maxDepth = Math.max(maxDepth, depth);
        
        const neighbors = adjacency.get(id) || new Set();
        neighbors.forEach(neighbor => {
          if (!visitedInPath.has(neighbor)) {
            queue.push({ id: neighbor, depth: depth + 1 });
          }
        });
      }
    });
    
    return maxDepth;
  }
}

// Export singleton instance
export const metricsCalculator = new MetricsCalculator();