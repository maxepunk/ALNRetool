/**
 * GraphUtilities Module
 * Comprehensive utility functions for graph manipulation and analysis.
 * 
 * This class provides a wide range of graph operations including node/edge lookup,
 * graph traversal, topological sorting, cycle detection, validation, and merging.
 * It implements the IGraphUtilities interface and delegates complex traversal
 * operations to TraversalEngine for optimal performance.
 * 
 * @example
 * ```typescript
 * const utils = new GraphUtilities(traversalEngine);
 * const node = utils.findNodeById(nodes, 'node-123');
 * const connected = utils.getConnectedNodes(node, graph);
 * const cycles = utils.detectCycles(graph);
 * const validation = utils.validateGraph(graph);
 * ```
 * 
 * @see TraversalEngine - Handles complex graph traversal algorithms
 * @see IGraphUtilities - Interface contract for graph utilities
 */

import type {
  GraphData,
  GraphNode,
  GraphEdge,
  GraphUtilities as IGraphUtilities
} from '../types';
import { logger } from '../utils/Logger'
import type { TraversalEngine } from './TraversalEngine';


export class GraphUtilities implements IGraphUtilities {
  /** TraversalEngine instance for complex graph analysis operations */
  private readonly traversalEngine: TraversalEngine;
  
  /**
   * Initialize GraphUtilities with required TraversalEngine dependency.
   * 
   * @param traversalEngine - TraversalEngine instance for graph traversal operations
   * 
   * @remarks
   * Uses dependency injection to maintain clean separation of concerns and
   * enable easy testing with mock implementations.
   */
  constructor(traversalEngine: TraversalEngine) {
    this.traversalEngine = traversalEngine;
  }
  /**
   * Find a node by ID in the given node array.
   * Performs linear search to locate node with matching ID.
   * 
   * @param nodes - Array of graph nodes to search
   * @param id - ID of the node to find
   * @returns The node with matching ID, or undefined if not found
   * 
   * @example
   * ```typescript
   * const node = utils.findNodeById(graph.nodes, 'char-123');
   * if (node) {
   *   console.log(`Found node: ${node.data.label}`);
   * }
   * ```
   * 
   * Complexity: O(n) where n = nodes.length
   */
  findNodeById(nodes: GraphNode[], id: string): GraphNode | undefined {
    return nodes.find(node => node.id === id);
  }

  /**
   * Get node by ID (alias for findNodeById for compatibility).
   * Backward compatibility method that delegates to findNodeById.
   * 
   * @param nodes - Array of graph nodes to search
   * @param id - ID of the node to get
   * @returns The node with matching ID, or undefined if not found
   * 
   * @deprecated Use findNodeById() for clarity in new code
   * 
   * Complexity: O(n) where n = nodes.length
   */
  getNodeById(nodes: GraphNode[], id: string): GraphNode | undefined {
    return this.findNodeById(nodes, id);
  }

  /**
   * Find an edge by ID in the given edge array.
   * Performs linear search to locate edge with matching ID.
   * 
   * @param edges - Array of graph edges to search
   * @param id - ID of the edge to find
   * @returns The edge with matching ID, or undefined if not found
   * 
   * @example
   * ```typescript
   * const edge = utils.findEdgeById(graph.edges, 'edge-456');
   * if (edge) {
   *   console.log(`Edge from ${edge.source} to ${edge.target}`);
   * }
   * ```
   * 
   * Complexity: O(m) where m = edges.length
   */
  findEdgeById(edges: GraphEdge[], id: string): GraphEdge | undefined {
    return edges.find(edge => edge.id === id);
  }

  /**
   * Get all nodes connected to a given node.
   * Finds nodes that are directly connected via any edge (incoming or outgoing).
   * 
   * @param node - The source node to find connections for
   * @param graph - Complete graph data containing nodes and edges
   * @returns Array of nodes directly connected to the given node
   * 
   * @remarks
   * - Treats graph as undirected (considers both incoming and outgoing edges)
   * - Returns unique nodes (no duplicates even if multiple edges exist)
   * - Does not include the source node itself in results
   * 
   * @example
   * ```typescript
   * const sourceNode = utils.findNodeById(graph.nodes, 'char-123');
   * const neighbors = utils.getConnectedNodes(sourceNode, graph);
   * console.log(`${sourceNode.id} has ${neighbors.length} connections`);
   * ```
   * 
   * Complexity: O(m + n) where m = edges, n = nodes
   */
  getConnectedNodes(node: GraphNode, graph: GraphData): GraphNode[] {
    const connectedIds = new Set<string>();
    
    graph.edges.forEach(edge => {
      if (edge.source === node.id) {
        connectedIds.add(edge.target);
      } else if (edge.target === node.id) {
        connectedIds.add(edge.source);
      }
    });
    
    return graph.nodes.filter(n => connectedIds.has(n.id));
  }

  /**
   * Filter nodes by type.
   * Returns all nodes matching the specified node type.
   * 
   * @param nodes - Array of graph nodes to filter
   * @param type - Node type to filter by (e.g., 'puzzleNode', 'characterNode')
   * @returns Array of nodes with matching type
   * 
   * @example
   * ```typescript
   * const characterNodes = utils.filterNodesByType(graph.nodes, 'characterNode');
   * const puzzleNodes = utils.filterNodesByType(graph.nodes, 'puzzleNode');
   * ```
   * 
   * Complexity: O(n) where n = nodes.length
   */
  filterNodesByType(nodes: GraphNode[], type: string): GraphNode[] {
    return nodes.filter(node => node.type === type);
  }

  /**
   * Get edges for a specific node.
   * Returns all edges where the node appears as either source or target.
   * 
   * @param nodeId - ID of the node to get edges for
   * @param edges - Array of graph edges to search
   * @returns Array of edges connected to the specified node
   * 
   * @example
   * ```typescript
   * const nodeEdges = utils.getNodeEdges('char-123', graph.edges);
   * console.log(`Node has ${nodeEdges.length} connections`);
   * ```
   * 
   * Complexity: O(m) where m = edges.length
   */
  getNodeEdges(nodeId: string, edges: GraphEdge[]): GraphEdge[] {
    return edges.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    );
  }

  /**
   * Calculate the degree of a node.
   * Returns the total number of edges connected to the node (in + out degree).
   * 
   * @param node - The node to calculate degree for
   * @param edges - Array of graph edges
   * @returns Number of edges connected to the node
   * 
   * @remarks
   * In graph theory, degree is the number of edges incident to a node.
   * For directed graphs, this returns the total degree (in-degree + out-degree).
   * 
   * @example
   * ```typescript
   * const node = utils.findNodeById(graph.nodes, 'char-123');
   * const degree = utils.getNodeDegree(node, graph.edges);
   * console.log(`Node ${node.id} has degree ${degree}`);
   * ```
   * 
   * Complexity: O(m) where m = edges.length
   */
  getNodeDegree(node: GraphNode, edges: GraphEdge[]): number {
    return edges.filter(edge => 
      edge.source === node.id || edge.target === node.id
    ).length;
  }

  /**
   * Detect cycles in the graph.
   * Delegates to TraversalEngine for efficient cycle detection using DFS.
   * 
   * @param graph - Graph data to analyze for cycles
   * @returns Array of cycles, where each cycle is an array of node IDs
   * 
   * @remarks
   * - Uses TraversalEngine's cycle detection algorithm
   * - Finds directed cycles in the graph
   * - Returns actual cycle paths, not just existence
   * - Empty array indicates no cycles found
   * 
   * @example
   * ```typescript
   * const cycles = utils.detectCycles(graph);
   * if (cycles.length > 0) {
   *   console.log(`Found ${cycles.length} cycles`);
   *   cycles.forEach(cycle => console.log(`Cycle: ${cycle.join(' -> ')}`))
   * }
   * ```
   * 
   * Complexity: O(V + E) where V = nodes, E = edges
   */
  detectCycles(graph: GraphData): string[][] {
    return this.traversalEngine.detectCycles(graph.edges);
  }

  /**
   * Perform topological sort on the graph.
   * Orders nodes such that for every directed edge (u,v), u appears before v.
   * 
   * @param graph - Graph data to sort topologically
   * @returns Array of nodes in topological order, or partial order if cycles exist
   * 
   * @remarks
   * - Uses Kahn's algorithm with in-degree counting
   * - Returns partial ordering if graph contains cycles
   * - Logs warning if cycles prevent complete sorting
   * - Useful for dependency resolution and scheduling
   * 
   * @example
   * ```typescript
   * const sorted = utils.topologicalSort(graph);
   * if (sorted.length === graph.nodes.length) {
   *   console.log('Successfully sorted all nodes');
   *   sorted.forEach(node => console.log(node.id));
   * } else {
   *   console.log('Graph contains cycles - partial sort only');
   * }
   * ```
   * 
   * Complexity: O(V + E) where V = nodes, E = edges
   */
  topologicalSort(graph: GraphData): GraphNode[] {
    const inDegree = new Map<string, number>();
    const adjacency = this.buildAdjacencyList(graph);
    const sorted: GraphNode[] = [];
    const queue: string[] = [];
    
    // Initialize in-degree count
    graph.nodes.forEach(node => {
      inDegree.set(node.id, 0);
    });
    
    graph.edges.forEach(edge => {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });
    
    // Find nodes with no incoming edges
    graph.nodes.forEach(node => {
      if (inDegree.get(node.id) === 0) {
        queue.push(node.id);
      }
    });
    
    // Process queue
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = this.findNodeById(graph.nodes, nodeId);
      if (node) {
        sorted.push(node);
      }
      
      const neighbors = adjacency.get(nodeId) || [];
      neighbors.forEach(neighbor => {
        const newInDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newInDegree);
        
        if (newInDegree === 0) {
          queue.push(neighbor);
        }
      });
    }
    
    // If sorted doesn't contain all nodes, there's a cycle
    if (sorted.length !== graph.nodes.length) {
      logger.warn('Graph contains cycles, topological sort incomplete');
    }
    
    return sorted;
  }

  /**
   * Find orphan nodes (nodes with no connections).
   * Returns nodes that have no incoming or outgoing edges.
   * 
   * @param graph - Graph data to analyze for orphans
   * @returns Array of nodes with no edge connections
   * 
   * @remarks
   * - Orphan nodes are isolated from the rest of the graph
   * - Useful for identifying disconnected components
   * - May indicate data quality issues or intentional isolated elements
   * 
   * @example
   * ```typescript
   * const orphans = utils.findOrphans(graph);
   * if (orphans.length > 0) {
   *   console.log(`Found ${orphans.length} orphan nodes:`);
   *   orphans.forEach(node => console.log(`- ${node.id}`));
   * }
   * ```
   * 
   * Complexity: O(V + E) where V = nodes, E = edges
   */
  findOrphans(graph: GraphData): GraphNode[] {
    const connectedIds = new Set<string>();
    
    graph.edges.forEach(edge => {
      connectedIds.add(edge.source);
      connectedIds.add(edge.target);
    });
    
    return graph.nodes.filter(node => !connectedIds.has(node.id));
  }

  /**
   * Merge multiple graphs into one.
   * Combines nodes and edges from multiple graphs, removing duplicates.
   * 
   * @param graphs - Variable number of graph data objects to merge
   * @returns New graph containing unique nodes and edges from all input graphs
   * 
   * @remarks
   * - Deduplicates nodes and edges based on ID
   * - First occurrence of duplicate IDs is kept
   * - Creates new metadata with merge information
   * - Preserves original graph objects (immutable operation)
   * 
   * @example
   * ```typescript
   * const merged = utils.mergeGraphs(graphA, graphB, graphC);
   * console.log(`Merged ${merged.nodes.length} nodes and ${merged.edges.length} edges`);
   * console.log(`From ${graphs.length} source graphs`);
   * ```
   * 
   * Complexity: O(V + E) where V = total nodes, E = total edges
   */
  mergeGraphs(...graphs: GraphData[]): GraphData {
    const mergedNodes: GraphNode[] = [];
    const mergedEdges: GraphEdge[] = [];
    const nodeIdSet = new Set<string>();
    const edgeIdSet = new Set<string>();
    
    graphs.forEach(graph => {
      // Add unique nodes
      graph.nodes.forEach(node => {
        if (!nodeIdSet.has(node.id)) {
          mergedNodes.push(node);
          nodeIdSet.add(node.id);
        }
      });
      
      // Add unique edges
      graph.edges.forEach(edge => {
        if (!edgeIdSet.has(edge.id)) {
          mergedEdges.push(edge);
          edgeIdSet.add(edge.id);
        }
      });
    });
    
    return {
      nodes: mergedNodes,
      edges: mergedEdges,
      metadata: {
        timestamp: new Date().toISOString(),
        metrics: {
          startTime: 0,
          endTime: 0,
          duration: 0,
          nodeCount: mergedNodes.length,
          edgeCount: mergedEdges.length,
          warnings: [`Merged from ${graphs.length} graphs`],
        }
      }
    };
  }

  /**
   * Build adjacency list from graph.
   * Internal method that converts edge list to adjacency list representation.
   * 
   * @param graph - Graph data to convert to adjacency list
   * @returns Map from node ID to array of neighboring node IDs
   * 
   * @remarks
   * - Creates directed adjacency list (source -> targets)
   * - Initializes empty lists for all nodes
   * - Used internally by topological sort and other algorithms
   * 
   * Complexity: O(V + E) where V = nodes, E = edges
   */
  private buildAdjacencyList(graph: GraphData): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();
    
    graph.nodes.forEach(node => {
      adjacency.set(node.id, []);
    });
    
    graph.edges.forEach(edge => {
      const sourceNeighbors = adjacency.get(edge.source) || [];
      sourceNeighbors.push(edge.target);
      adjacency.set(edge.source, sourceNeighbors);
    });
    
    return adjacency;
  }

  /**
   * Validate graph data structure.
   * Performs comprehensive validation of graph integrity and consistency.
   * 
   * @param graph - Graph data to validate
   * @returns Validation result with boolean valid flag and array of error messages
   * 
   * @remarks
   * Validation checks include:
   * - Node and edge arrays are properly typed
   * - All nodes have required ID and position properties
   * - Position coordinates are valid numbers
   * - All edges have required ID, source, and target properties
   * - Edge references point to existing nodes
   * - No dangling edge references
   * 
   * @example
   * ```typescript
   * const validation = utils.validateGraph(graph);
   * if (!validation.valid) {
   *   console.error('Graph validation failed:');
   *   validation.errors.forEach(error => console.error(`- ${error}`));
   * } else {
   *   console.log('Graph is valid');
   * }
   * ```
   * 
   * Complexity: O(V + E) where V = nodes, E = edges
   */
  validateGraph(graph: GraphData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check nodes
    if (!Array.isArray(graph.nodes)) {
      errors.push('Nodes must be an array');
    } else {
      graph.nodes.forEach((node, i) => {
        if (!node.id) errors.push(`Node at index ${i} missing ID`);
        if (!node.position) {
          errors.push(`Node ${node.id} missing position`);
        } else if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
          errors.push(`Node ${node.id} has invalid position`);
        }
      });
    }
    
    // Check edges
    if (!Array.isArray(graph.edges)) {
      errors.push('Edges must be an array');
    } else {
      const nodeIds = new Set(graph.nodes.map(n => n.id));
      graph.edges.forEach((edge, i) => {
        if (!edge.id) errors.push(`Edge at index ${i} missing ID`);
        if (!edge.source) errors.push(`Edge ${edge.id} missing source`);
        if (!edge.target) errors.push(`Edge ${edge.id} missing target`);
        
        if (!nodeIds.has(edge.source)) {
          errors.push(`Edge ${edge.id} references non-existent source: ${edge.source}`);
        }
        if (!nodeIds.has(edge.target)) {
          errors.push(`Edge ${edge.id} references non-existent target: ${edge.target}`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
// Singleton removed - use dependency injection via GraphContext instead
// This promotes better testability and eliminates global state dependencies