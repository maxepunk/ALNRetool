/**
 * Edge Builder Module
 * Centralizes edge creation logic to reduce duplication
 * Replaces multiple createEdge functions across the codebase
 */

import type { GraphEdge, RelationshipType, GraphNode } from '../types';

/**
 * Edge style configurations by relationship type
 */
const EDGE_STYLES: Record<RelationshipType, {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  animated?: boolean;
  label?: string;
}> = {
  requirement: {
    stroke: '#dc2626', // Red
    strokeWidth: 2,
    label: 'requires',
  },
  reward: {
    stroke: '#10b981', // Green
    strokeWidth: 2,
    strokeDasharray: '5,5',
    animated: true,
    label: 'rewards',
  },
  chain: {
    stroke: '#8b5cf6', // Purple
    strokeWidth: 3,
    label: 'chain',
  },
  collaboration: {
    stroke: '#06b6d4', // Cyan
    strokeWidth: 2,
    strokeDasharray: '3,3',
    label: 'collaborates',
  },
  timeline: {
    stroke: '#f59e0b', // Amber
    strokeWidth: 2,
    strokeDasharray: '3,3',
    label: 'timeline',
  },
  owner: {
    stroke: '#3b82f6', // Blue
    strokeWidth: 2,
    label: 'owns',
  },
  ownership: {
    stroke: '#3b82f6', // Blue
    strokeWidth: 2,
    label: 'owns',
  },
  container: {
    stroke: '#64748b', // Slate
    strokeWidth: 2,
    strokeDasharray: 'none',
    label: 'contains',
  },
};

/**
 * Edge builder class for creating consistent edges
 */
export class EdgeBuilder {
  private edges: GraphEdge[] = [];
  private nodeMap: Map<string, GraphNode> = new Map();
  private edgeSet: Set<string> = new Set();

  /**
   * Initialize with existing edges and nodes
   */
  constructor(existingEdges?: GraphEdge[], nodes?: GraphNode[]) {
    if (existingEdges) {
      this.edges = [...existingEdges];
      existingEdges.forEach(edge => {
        this.edgeSet.add(this.getEdgeKey(edge.source, edge.target, edge.data?.relationshipType));
      });
    }
    
    if (nodes) {
      nodes.forEach(node => {
        this.nodeMap.set(node.id, node);
      });
    }
  }

  /**
   * Create an edge between two nodes
   */
  public createEdge(
    source: string,
    target: string,
    relationshipType: RelationshipType,
    options?: {
      weight?: number;
      metadata?: Record<string, unknown>;
      isBroken?: boolean;
      customStyle?: Record<string, any>;
    }
  ): GraphEdge | null {
    // Check if edge already exists
    const edgeKey = this.getEdgeKey(source, target, relationshipType);
    if (this.edgeSet.has(edgeKey)) {
      console.debug(`Edge already exists: ${edgeKey}`);
      return null;
    }

    // Validate nodes exist if nodeMap is populated
    if (this.nodeMap.size > 0) {
      if (!this.nodeMap.has(source)) {
        console.warn(`Source node not found for edge: ${source}`);
        return null;
      }
      if (!this.nodeMap.has(target)) {
        console.warn(`Target node not found for edge: ${target}`);
        return null;
      }
    }

    // Get style configuration
    const styleConfig = EDGE_STYLES[relationshipType] || {
      stroke: '#6b7280',
      strokeWidth: 1,
    };

    // Create edge ID
    const id = `${relationshipType}-${source}-${target}`;

    // Build edge style
    const style: React.CSSProperties = {
      stroke: options?.isBroken ? '#ef4444' : styleConfig.stroke,
      strokeWidth: styleConfig.strokeWidth,
      strokeDasharray: options?.isBroken ? '10,5' : styleConfig.strokeDasharray,
      opacity: options?.isBroken ? 0.5 : 1,
      ...options?.customStyle,
    };

    // Create edge
    const edge: GraphEdge = {
      id,
      source,
      target,
      type: 'default',
      animated: styleConfig.animated || false,
      style,
      data: {
        relationshipType,
        weight: options?.weight || 1,
        metadata: {
          ...options?.metadata,
          isBroken: options?.isBroken || false,
          label: styleConfig.label,
        },
      },
    };

    // Add to tracking
    this.edges.push(edge);
    this.edgeSet.add(edgeKey);

    return edge;
  }

  /**
   * Create multiple edges at once
   */
  public createEdges(
    edgeDefinitions: Array<{
      source: string;
      target: string;
      relationshipType: RelationshipType;
      options?: Parameters<EdgeBuilder['createEdge']>[3];
    }>
  ): GraphEdge[] {
    const newEdges: GraphEdge[] = [];

    edgeDefinitions.forEach(def => {
      const edge = this.createEdge(
        def.source,
        def.target,
        def.relationshipType,
        def.options
      );
      if (edge) {
        newEdges.push(edge);
      }
    });

    return newEdges;
  }

  /**
   * Create bidirectional edges
   */
  public createBidirectionalEdge(
    nodeA: string,
    nodeB: string,
    relationshipType: RelationshipType,
    options?: Parameters<EdgeBuilder['createEdge']>[3]
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];

    const edge1 = this.createEdge(nodeA, nodeB, relationshipType, options);
    if (edge1) edges.push(edge1);

    const edge2 = this.createEdge(nodeB, nodeA, relationshipType, options);
    if (edge2) edges.push(edge2);

    return edges;
  }

  /**
   * Create chain edges between sequential nodes
   */
  public createChainEdges(
    nodeIds: string[],
    relationshipType: RelationshipType = 'chain',
    options?: Parameters<EdgeBuilder['createEdge']>[3]
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];

    for (let i = 0; i < nodeIds.length - 1; i++) {
      const sourceId = nodeIds[i];
      const targetId = nodeIds[i + 1];
      if (!sourceId || !targetId) continue;
      
      const edge = this.createEdge(
        sourceId,
        targetId,
        relationshipType,
        options
      );
      if (edge) {
        edges.push(edge);
      }
    }

    return edges;
  }

  /**
   * Create edges from one source to multiple targets
   */
  public createFanOutEdges(
    source: string,
    targets: string[],
    relationshipType: RelationshipType,
    options?: Parameters<EdgeBuilder['createEdge']>[3]
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];

    targets.forEach(target => {
      const edge = this.createEdge(source, target, relationshipType, options);
      if (edge) {
        edges.push(edge);
      }
    });

    return edges;
  }

  /**
   * Create edges from multiple sources to one target
   */
  public createFanInEdges(
    sources: string[],
    target: string,
    relationshipType: RelationshipType,
    options?: Parameters<EdgeBuilder['createEdge']>[3]
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];

    sources.forEach(source => {
      const edge = this.createEdge(source, target, relationshipType, options);
      if (edge) {
        edges.push(edge);
      }
    });

    return edges;
  }

  /**
   * Get all created edges
   */
  public getEdges(): GraphEdge[] {
    return this.edges;
  }

  /**
   * Get edge statistics
   */
  public getStatistics(): {
    total: number;
    byType: Record<RelationshipType, number>;
    broken: number;
  } {
    const stats = {
      total: this.edges.length,
      byType: {} as Record<RelationshipType, number>,
      broken: 0,
    };

    this.edges.forEach(edge => {
      const type = edge.data?.relationshipType;
      if (type) {
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      }
      if (edge.data?.metadata?.isBroken) {
        stats.broken++;
      }
    });

    return stats;
  }

  /**
   * Clear all edges
   */
  public clear(): void {
    this.edges = [];
    this.edgeSet.clear();
  }

  /**
   * Generate unique edge key
   */
  private getEdgeKey(
    source: string,
    target: string,
    relationshipType?: RelationshipType | string
  ): string {
    return `${relationshipType || 'default'}-${source}-${target}`;
  }

  /**
   * Check if an edge exists
   */
  public hasEdge(
    source: string,
    target: string,
    relationshipType?: RelationshipType
  ): boolean {
    const key = this.getEdgeKey(source, target, relationshipType);
    return this.edgeSet.has(key);
  }

  /**
   * Remove an edge
   */
  public removeEdge(
    source: string,
    target: string,
    relationshipType?: RelationshipType
  ): boolean {
    const key = this.getEdgeKey(source, target, relationshipType);
    
    if (!this.edgeSet.has(key)) {
      return false;
    }

    this.edgeSet.delete(key);
    this.edges = this.edges.filter(edge => 
      !(edge.source === source && 
        edge.target === target && 
        edge.data?.relationshipType === relationshipType)
    );

    return true;
  }

  /**
   * Filter edges by relationship type
   */
  public filterByType(types: RelationshipType[]): GraphEdge[] {
    return this.edges.filter(edge => 
      types.includes(edge.data?.relationshipType as RelationshipType)
    );
  }

  /**
   * Get edges connected to a specific node
   */
  public getNodeEdges(nodeId: string): {
    incoming: GraphEdge[];
    outgoing: GraphEdge[];
  } {
    return {
      incoming: this.edges.filter(edge => edge.target === nodeId),
      outgoing: this.edges.filter(edge => edge.source === nodeId),
    };
  }
}

/**
 * Factory function for creating edge builders
 */
export function createEdgeBuilder(
  existingEdges?: GraphEdge[],
  nodes?: GraphNode[]
): EdgeBuilder {
  return new EdgeBuilder(existingEdges, nodes);
}

/**
 * Utility to merge multiple edge builders
 */
export function mergeEdgeBuilders(...builders: EdgeBuilder[]): EdgeBuilder {
  const mergedBuilder = new EdgeBuilder();
  
  builders.forEach(builder => {
    const edges = builder.getEdges();
    edges.forEach(edge => {
      if (!mergedBuilder.hasEdge(
        edge.source,
        edge.target,
        edge.data?.relationshipType as RelationshipType
      )) {
        mergedBuilder.createEdge(
          edge.source,
          edge.target,
          edge.data?.relationshipType as RelationshipType,
          {
            weight: edge.data?.weight,
            metadata: edge.data?.metadata,
            isBroken: edge.data?.metadata?.isBroken as boolean,
            customStyle: edge.style as Record<string, any>,
          }
        );
      }
    });
  });
  
  return mergedBuilder;
}