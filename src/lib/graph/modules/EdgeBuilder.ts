/**
 * Edge Builder Module
 * Centralizes edge creation logic to reduce duplication
 * Replaces multiple createEdge functions across the codebase
 */

import type { GraphEdge, RelationshipType, GraphNode } from '../types';
import { MarkerType } from '@xyflow/react';
import type { EdgeMarker } from '@xyflow/react';

/**
 * Edge style configurations by relationship type
 */
const EDGE_STYLES: Record<RelationshipType, {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  animated?: boolean;
  label?: string;
  markerEnd?: EdgeMarker;
}> = {
  requirement: {
    stroke: 'hsl(var(--destructive))', // Using shadcn CSS variable
    strokeWidth: 2,
    label: 'requires',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: 'hsl(var(--destructive))',
    },
  },
  reward: {
    stroke: 'hsl(var(--success, 142 76% 36%))', // Green with fallback
    strokeWidth: 2,
    strokeDasharray: '5,5',
    animated: true,
    label: 'rewards',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: 'hsl(var(--success, 142 76% 36%))',
    },
  },
  collaboration: {
    stroke: 'hsl(var(--info, 199 89% 48%))', // Cyan with fallback
    strokeWidth: 2,
    strokeDasharray: '3,3',
    label: 'collaborates',
    markerEnd: {
      type: MarkerType.Arrow,
      width: 15,
      height: 15,
      color: 'hsl(var(--info, 199 89% 48%))',
    },
  },
  timeline: {
    stroke: 'hsl(var(--warning, 45 93% 47%))', // Amber with fallback
    strokeWidth: 2,
    strokeDasharray: '3,3',
    label: 'timeline',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: 'hsl(var(--warning, 45 93% 47%))',
    },
  },
  owner: {
    stroke: 'hsl(var(--primary))', // Using primary theme color
    strokeWidth: 2,
    label: 'owns',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: 'hsl(var(--primary))',
    },
  },
  ownership: {
    stroke: 'hsl(var(--primary))', // Using primary theme color
    strokeWidth: 2,
    label: 'owns',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: 'hsl(var(--primary))',
    },
  },
  container: {
    stroke: 'hsl(var(--muted-foreground))', // Muted theme color
    strokeWidth: 2,
    strokeDasharray: 'none',
    label: 'contains',
  },
  'virtual-dependency': {
    stroke: 'transparent', // Invisible - for layout only
    strokeWidth: 0,
    label: '', // No label needed for virtual edges
  },
  'puzzle-grouping': {
    stroke: 'hsl(var(--border))', // Border theme color
    strokeWidth: 3,
    label: 'group',
    markerEnd: {
      type: MarkerType.Arrow,
      width: 18,
      height: 18,
      color: 'hsl(var(--border))',
    },
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

    // Calculate smart edge weight based on element affinity
    const weight = this.calculateSmartWeight(source, target, relationshipType, options?.weight);

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
      markerEnd: styleConfig.markerEnd, // Add arrow marker
      label: styleConfig.label, // Add label at edge level for React Flow
      labelStyle: {
        fill: 'hsl(var(--foreground))',
        fontSize: 12,
        fontWeight: 500,
      },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 4,
      labelBgStyle: {
        fill: 'hsl(var(--background))',
        fillOpacity: 0.9,
      },
      data: {
        relationshipType,
        weight,
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
    averageWeight: number;
    weightDistribution: Record<string, number>;
  } {
    const stats = {
      total: this.edges.length,
      byType: {} as Record<RelationshipType, number>,
      broken: 0,
      averageWeight: 0,
      weightDistribution: {} as Record<string, number>,
    };

    let totalWeight = 0;

    this.edges.forEach(edge => {
      const type = edge.data?.relationshipType;
      if (type) {
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      }
      if (edge.data?.metadata?.isBroken) {
        stats.broken++;
      }
      
      // Track weight statistics
      const weight = edge.data?.weight || 1;
      totalWeight += weight;
      
      // Categorize weights
      const weightCategory = 
        weight >= 5 ? 'very-high' :
        weight >= 3 ? 'high' :
        weight >= 2 ? 'medium' :
        weight > 1 ? 'low-boost' :
        'standard';
      
      stats.weightDistribution[weightCategory] = 
        (stats.weightDistribution[weightCategory] || 0) + 1;
    });

    stats.averageWeight = stats.total > 0 ? totalWeight / stats.total : 0;

    return stats;
  }

  /**
   * Analyze element affinity in the graph
   * Returns information about dual-role elements and their connections
   */
  public analyzeElementAffinity(): {
    dualRoleElements: string[];
    multiPuzzleElements: string[];
    highAffinityEdges: GraphEdge[];
  } {
    const dualRoleElements: Set<string> = new Set();
    const multiPuzzleElements: Set<string> = new Set();
    const highAffinityEdges: GraphEdge[] = [];

    // Check all nodes for dual-role and multi-puzzle elements
    this.nodeMap.forEach((node) => {
      if (node.data.metadata.entityType === 'element') {
        const element = node.data.entity as any;
        
        // Check for dual-role elements
        if (element.requiredForPuzzleIds?.length > 0 && 
            element.rewardedByPuzzleIds?.length > 0) {
          dualRoleElements.add(node.id);
        }
        
        // Check for multi-puzzle elements
        const totalPuzzleConnections = 
          (element.requiredForPuzzleIds?.length || 0) + 
          (element.rewardedByPuzzleIds?.length || 0);
        
        if (totalPuzzleConnections > 1) {
          multiPuzzleElements.add(node.id);
        }
      }
    });

    // Find high affinity edges (weight >= 2)
    this.edges.forEach(edge => {
      if ((edge.data?.weight || 1) >= 2) {
        highAffinityEdges.push(edge);
      }
    });

    return {
      dualRoleElements: Array.from(dualRoleElements),
      multiPuzzleElements: Array.from(multiPuzzleElements),
      highAffinityEdges,
    };
  }

  /**
   * Clear all edges
   */
  public clear(): void {
    this.edges = [];
    this.edgeSet.clear();
  }

  /**
   * Calculate smart edge weight based on element affinity
   * Analyzes element relationships to assign higher weights for stronger connections
   */
  private calculateSmartWeight(
    source: string,
    target: string,
    relationshipType: RelationshipType,
    baseWeight?: number
  ): number {
    // Start with base weight or default
    let weight = baseWeight || 1;

    // Get nodes if available
    const sourceNode = this.nodeMap.get(source);
    const targetNode = this.nodeMap.get(target);

    if (!sourceNode || !targetNode) {
      return weight;
    }

    // Phase 3: Smart edge weighting for element affinity
    // Elements that serve multiple purposes should have stronger connections
    
    // Check if this is an element-to-puzzle edge
    if (sourceNode.data.metadata.entityType === 'element' && 
        targetNode.data.metadata.entityType === 'puzzle') {
      
      const element = sourceNode.data.entity as any;
      
      // Dual-role elements (both requirement and reward) get higher weight
      if (element.requiredForPuzzleIds?.length > 0 && 
          element.rewardedByPuzzleIds?.length > 0) {
        weight *= 3; // Triple weight for dual-role elements
      }
      
      // Elements required by multiple puzzles get higher weight
      else if (element.requiredForPuzzleIds?.length > 1) {
        weight *= 2; // Double weight for multi-puzzle requirements
      }
      
      // Elements with SF patterns get slightly higher weight
      if (element.sfPatterns && Object.keys(element.sfPatterns).length > 0) {
        weight *= 1.5; // 50% boost for SF pattern elements
      }
    }
    
    // Check if this is a puzzle-to-element edge
    else if (sourceNode.data.metadata.entityType === 'puzzle' && 
             targetNode.data.metadata.entityType === 'element') {
      
      const element = targetNode.data.entity as any;
      
      // Elements that are rewards and also requirements get higher weight
      if (element.requiredForPuzzleIds?.length > 0 && 
          element.rewardedByPuzzleIds?.length > 0) {
        weight *= 3; // Triple weight for dual-role elements
      }
      
      // Elements rewarded by multiple puzzles get higher weight
      else if (element.rewardedByPuzzleIds?.length > 1) {
        weight *= 2; // Double weight for multi-puzzle rewards
      }
    }
    
    // Check for puzzle-to-puzzle connections (dependencies)
    else if (sourceNode.data.metadata.entityType === 'puzzle' && 
             targetNode.data.metadata.entityType === 'puzzle') {
      
      const sourcePuzzle = sourceNode.data.entity as any;
      const targetPuzzle = targetNode.data.entity as any;
      
      // Parent-child puzzle relationships get highest weight
      if (sourcePuzzle.subPuzzleIds?.includes(target) || 
          targetPuzzle.parentItemId === source) {
        weight *= 5; // Very high weight for parent-child
      }
      
      // Puzzles in the same narrative thread get higher weight
      const commonThreads = sourcePuzzle.narrativeThreads?.filter((thread: string) =>
        targetPuzzle.narrativeThreads?.includes(thread)
      );
      if (commonThreads?.length > 0) {
        weight *= 2; // Double weight for narrative connections
      }
    }
    
    // Ownership edges get moderate weight boost
    if (relationshipType === 'ownership' || relationshipType === 'owner') {
      weight *= 1.5;
    }
    
    // Timeline edges get lower weight (they're less structurally important)
    if (relationshipType === 'timeline') {
      weight *= 0.7;
    }

    return weight;
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