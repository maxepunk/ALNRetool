/**
 * GraphUtilities Module
 * Utility functions for graph manipulation and analysis
 */

import type {
  GraphData,
  GraphNode,
  GraphEdge,
  GraphUtilities as IGraphUtilities
} from '../types';

export class GraphUtilities implements IGraphUtilities {
  /**
   * Find a node by ID
   */
  findNodeById(nodes: GraphNode[], id: string): GraphNode | undefined {
    return nodes.find(node => node.id === id);
  }

  /**
   * Find an edge by ID
   */
  findEdgeById(edges: GraphEdge[], id: string): GraphEdge | undefined {
    return edges.find(edge => edge.id === id);
  }

  /**
   * Get all nodes connected to a given node
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
   * Calculate the degree of a node
   */
  getNodeDegree(node: GraphNode, edges: GraphEdge[]): number {
    return edges.filter(edge => 
      edge.source === node.id || edge.target === node.id
    ).length;
  }

  /**
   * Detect cycles in the graph
   */
  detectCycles(graph: GraphData): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const adjacency = this.buildAdjacencyList(graph);
    
    const dfs = (nodeId: string, path: string[]): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);
      
      const neighbors = adjacency.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, [...path])) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart));
          }
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    graph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });
    
    return cycles;
  }

  /**
   * Perform topological sort on the graph
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
      console.warn('Graph contains cycles, topological sort incomplete');
    }
    
    return sorted;
  }

  /**
   * Find orphan nodes (nodes with no connections)
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
   * Merge multiple graphs into one
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
   * Build adjacency list from graph
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
   * Validate graph data structure
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
export const graphUtilities = new GraphUtilities();