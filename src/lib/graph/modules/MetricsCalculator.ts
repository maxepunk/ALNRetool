/**
 * MetricsCalculator Module
 * Comprehensive graph metrics calculation for structural analysis and optimization.
 * 
 * This class provides detailed analysis of graph properties including node distribution,
 * edge patterns, connectivity metrics, and structural characteristics. It implements
 * the IMetricsCalculator interface and supports both basic metrics (counts, ratios)
 * and advanced graph theory metrics (density, components, depth analysis).
 * 
 * Key metrics calculated:
 * - Node/edge counts and distributions by type
 * - Connectivity patterns (degree, density, components) 
 * - Graph depth and traversal characteristics
 * - Orphan detection and component analysis
 * 
 * @example
 * ```typescript
 * const calculator = new MetricsCalculator();
 * const metrics = calculator.calculateMetrics(graphData);
 * console.log(`Graph density: ${metrics.density}`);
 * console.log(`Components: ${metrics.componentCount}`);
 * ```
 * 
 * @see GraphMetrics - Interface for metrics structure
 * @see GraphData - Input graph structure
 * @see IMetricsCalculator - Interface contract
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

/**
 * MetricsCalculator implementation for comprehensive graph analysis.
 * Provides methods to calculate structural, connectivity, and distribution metrics.
 */
export class MetricsCalculator implements IMetricsCalculator {
  /**
   * Calculate comprehensive metrics for a complete graph structure.
   * Combines node metrics, edge metrics, and connectivity analysis into unified report.
   * 
   * @param graph - Complete graph data with nodes and edges
   * @returns GraphMetrics object containing all calculated metrics
   * 
   * @remarks
   * Metrics include:
   * - Basic counts (nodes, edges, orphans)
   * - Entity type distribution (character, puzzle, element, timeline)
   * - Relationship type distribution (requirement, reward, chain, etc.)
   * - Connectivity metrics (average degree, density, components)
   * - Structural characteristics (max depth, component analysis)
   * 
   * @example
   * ```typescript
   * const metrics = calculator.calculateMetrics(graphData);
   * console.log(`${metrics.nodeCount} nodes, ${metrics.edgeCount} edges`);
   * console.log(`Density: ${metrics.density}, Components: ${metrics.componentCount}`);
   * ```
   * 
   * Complexity: O(V + E) where V = nodes, E = edges
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
   * Calculate node-specific metrics including counts and entity type distribution.
   * Analyzes node composition and categorizes by entity types.
   * 
   * @param nodes - Array of graph nodes to analyze
   * @returns Partial metrics object containing node-related statistics
   * 
   * @remarks
   * Calculates:
   * - Total node count
   * - Entity type distribution (character, element, puzzle, timeline)
   * - Placeholder for orphan count (calculated with edge data)
   * 
   * Entity types are extracted from node.data.metadata.entityType and must
   * match the EntityType enum values for accurate counting.
   * 
   * @example
   * ```typescript
   * const nodeMetrics = calculator.calculateNodeMetrics(graph.nodes);
   * console.log(`Characters: ${nodeMetrics.entityCounts?.character}`);
   * console.log(`Puzzles: ${nodeMetrics.entityCounts?.puzzle}`);
   * ```
   * 
   * Complexity: O(n) where n = nodes.length
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
   * Calculate edge-specific metrics including counts and relationship type distribution.
   * Analyzes edge composition and categorizes by relationship types.
   * 
   * @param edges - Array of graph edges to analyze
   * @returns Partial metrics object containing edge-related statistics
   * 
   * @remarks
   * Calculates:
   * - Total edge count
   * - Relationship type distribution (requirement, reward, chain, etc.)
   * 
   * Relationship types are extracted from edge.data.relationshipType and include:
   * - requirement: Puzzle prerequisites
   * - reward: Puzzle rewards/outcomes
   * - chain: Sequential puzzle connections
   * - collaboration: Character interactions
   * - timeline: Temporal relationships
   * - owner/ownership: Entity ownership
   * - container: Containment relationships
   * - virtual-dependency: Computed dependencies
   * - puzzle-grouping: Logical puzzle groups
   * 
   * @example
   * ```typescript
   * const edgeMetrics = calculator.calculateEdgeMetrics(graph.edges);
   * console.log(`Requirements: ${edgeMetrics.relationshipCounts?.requirement}`);
   * console.log(`Chains: ${edgeMetrics.relationshipCounts?.chain}`);
   * ```
   * 
   * Complexity: O(m) where m = edges.length
   */
  calculateEdgeMetrics(edges: GraphEdge[]): Partial<GraphMetrics> {
    const relationshipCounts: Record<RelationshipType, number> = {
      requirement: 0,
      reward: 0,
      chain: 0,
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
   * Calculate advanced connectivity and structural metrics for the graph.
   * Performs comprehensive graph theory analysis including density, components, and depth.
   * 
   * @param graph - Complete graph data for connectivity analysis
   * @returns Partial metrics object containing connectivity statistics
   * 
   * @remarks
   * Calculates advanced metrics:
   * - Average degree: Mean number of connections per node
   * - Density: Ratio of actual to possible edges (0-1 scale)
   * - Component count: Number of disconnected graph sections
   * - Max depth: Longest path from root nodes
   * - Orphan count: Nodes with no connections
   * 
   * Handles edge cases:
   * - Empty graphs return zero values for all metrics
   * - Single nodes are counted as separate components
   * - Density calculation avoids division by zero
   * 
   * @example
   * ```typescript
   * const connectivity = calculator.calculateConnectivity(graph);
   * console.log(`Avg degree: ${connectivity.avgDegree}`);
   * console.log(`Density: ${connectivity.density}`);
   * console.log(`${connectivity.componentCount} components`);
   * ```
   * 
   * Complexity: O(V + E) where V = nodes, E = edges
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
   * Count the number of connected components in an undirected graph.
   * Uses depth-first search to identify disconnected graph sections.
   * 
   * @param nodes - Array of all graph nodes
   * @param edges - Array of all graph edges
   * @returns Number of connected components in the graph
   * 
   * @remarks
   * Connected component definition:
   * - Nodes are in the same component if there's a path between them
   * - Treats the graph as undirected for connectivity analysis
   * - Isolated nodes (no edges) count as separate components
   * - Uses DFS traversal to visit all reachable nodes from each starting point
   * 
   * Algorithm:
   * 1. Build undirected adjacency list from edges
   * 2. For each unvisited node, start DFS and increment component count
   * 3. DFS marks all reachable nodes as visited
   * 
   * @example
   * ```typescript
   * // Graph with 3 components: {A-B}, {C-D-E}, {F}
   * const components = calculator.countComponents(nodes, edges);
   * console.log(components); // Output: 3
   * ```
   * 
   * Complexity: O(V + E) where V = nodes, E = edges
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
   * Calculate the maximum depth (longest path) in the directed graph.
   * Finds the deepest traversal possible from any root node (nodes with no incoming edges).
   * 
   * @param nodes - Array of all graph nodes
   * @param edges - Array of all graph edges (treated as directed)
   * @returns Maximum depth from any root node to any reachable leaf
   * 
   * @remarks
   * Algorithm approach:
   * 1. Identify root nodes (no incoming edges) as potential starting points
   * 2. Perform BFS from each root to calculate path depths
   * 3. Track maximum depth encountered across all traversals
   * 4. Handles cycles by tracking visited nodes per path
   * 
   * Depth calculation:
   * - Root nodes start at depth 0
   * - Each edge traversal increases depth by 1
   * - Returns the maximum depth found from any root
   * - If no roots exist (all nodes have incoming edges), may indicate cycles
   * 
   * @example
   * ```typescript
   * // Graph: A -> B -> C, D -> E
   * // Max depth = 2 (A -> B -> C has depth 2)
   * const maxDepth = calculator.calculateMaxDepth(nodes, edges);
   * console.log(maxDepth); // Output: 2
   * ```
   * 
   * Complexity: O(V + E) where V = nodes, E = edges
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
// Singleton removed - use dependency injection via GraphContext instead