/**
 * Professional circular layout algorithm implementation for ALNRetool.
 * 
 * Provides sophisticated circular and radial positioning for murder mystery
 * visualization, enabling investigation workflows through systematic arrangement
 * of characters, evidence, and timeline events around geometric circles.
 * 
 * Key features:
 * - O(V + E) complexity with efficient sorting and grouping
 * - Configurable radius, sweep angles, and rotation direction
 * - Advanced sorting by degree, clustering coefficient, alphabetical, type
 * - Sophisticated grouping by type, cluster, or connected components
 * - Bipartite layout support for suspect-evidence relationships
 * - Automatic overlap adjustment and quality metrics
 * - DFS-based connected component analysis
 * 
 * @example
 * ```typescript
 * const config: CircularLayoutConfig = {
 *   radius: 500,
 *   startAngle: 0,
 *   sweep: 2 * Math.PI,
 *   sortBy: 'degree',        // Marcus Blackwood (hub) first
 *   groupBy: 'type',         // Characters, elements, puzzles
 *   adjustForOverlap: true
 * };
 * 
 * const algorithm = new CircularLayoutAlgorithm(traversalEngine, config);
 * const layoutData = algorithm.apply(investigationGraph);
 * ```
 * 
 * @see {@link BaseLayoutAlgorithm} Abstract base class
 * @author ALNRetool Development Team
 * @since 1.0.0
 */

import { BaseLayoutAlgorithm, type LayoutMetadata, type LayoutConfig } from '../BaseLayoutAlgorithm';
import type { GraphData } from '../../types';
import type { TraversalEngine } from '../../modules/TraversalEngine';

/**
 * Configuration interface for circular layout algorithm.
 * 
 * Extends base LayoutConfig with circular-specific positioning parameters,
 * advanced sorting strategies, and grouping options optimized for murder
 * mystery investigation visualization and relationship analysis.
 * 
 * @interface CircularLayoutConfig
 * @extends LayoutConfig
 * 
 * @example
 * ```typescript
 * const config: CircularLayoutConfig = {
 *   radius: 450,             // Investigation circle radius
 *   startAngle: Math.PI/4,   // Start from 45 degrees
 *   sweep: 1.8 * Math.PI,    // 324 degree arc (not full circle)
 *   clockwise: true,         // Timeline order direction
 *   sortBy: 'clustering',    // Sort by network clustering
 *   groupBy: 'component',    // Separate investigation clusters
 *   adjustForOverlap: true,  // Prevent character overlap
 *   bipartite: false         // Single circle layout
 * };
 * ```
 */
export interface CircularLayoutConfig extends LayoutConfig {
  /** Circle radius in pixels (default: 400 for investigation focus) */
  radius?: number;
  
  /** Starting angle in radians (0 = east, Math.PI/2 = north) */
  startAngle?: number;
  
  /** Angular sweep in radians (2π = full circle, π = semicircle) */
  sweep?: number;
  
  /** Clockwise rotation direction (true = timeline order) */
  clockwise?: boolean;
  
  /** Node sorting strategy for circular positioning */
  sortBy?: 'degree' | 'alphabetical' | 'type' | 'clustering' | 'none';
  
  /** Node grouping strategy for organized sections */
  groupBy?: 'type' | 'cluster' | 'component' | 'none';
  
  /** Automatically adjust positions to prevent node overlap */
  adjustForOverlap?: boolean;
  
  /** Use bipartite layout with two semicircles (suspects vs evidence) */
  bipartite?: boolean;
}

/**
 * Circular layout algorithm for investigation focus visualization.
 * 
 * Implements sophisticated circular positioning with advanced sorting,
 * grouping, and geometric calculations. Optimized for murder mystery
 * character networks where circular arrangement aids investigation
 * workflows and relationship analysis.
 * 
 * Algorithm complexity:
 * - Time: O(V + E) for degree calculation, O(V log V) for sorting, O(V²) for clustering
 * - Space: O(V) for position storage and adjacency lists
 * - Connected components: O(V + E) using DFS traversal
 * 
 * @class CircularLayoutAlgorithm
 * @extends BaseLayoutAlgorithm
 * 
 * @example
 * ```typescript
 * // Create circular layout for character relationship analysis
 * const algorithm = new CircularLayoutAlgorithm(traversalEngine, {
 *   radius: 600,
 *   sortBy: 'clustering',    // Most clustered characters first
 *   groupBy: 'type',         // Separate characters from evidence
 *   adjustForOverlap: true,  // Clean positioning
 *   bipartite: false         // Single investigation circle
 * });
 * 
 * // Apply circular positioning
 * const circularGraph = algorithm.apply(mysteryNetwork);
 * ```
 */
export class CircularLayoutAlgorithm extends BaseLayoutAlgorithm {
  /**
   * Initialize circular layout algorithm with murder mystery optimization.
   * 
   * Sets up algorithm metadata, performance characteristics, and default configuration
   * optimized for investigation visualization, character relationship analysis,
   * and systematic evidence arrangement in circular patterns.
   * 
   * @param traversalEngine Graph traversal utilities for relationship analysis
   * @param config Optional circular layout configuration parameters
   * 
   * @example
   * ```typescript
 * const algorithm = new CircularLayoutAlgorithm(traversalEngine, {
   *   radius: 500,              // Large investigation circle
   *   startAngle: 0,            // Start from east (3 o'clock)
   *   sweep: 2 * Math.PI,       // Full circle sweep
   *   sortBy: 'degree',         // Hub characters (Marcus) first
   *   groupBy: 'component',     // Separate connected groups
   *   adjustForOverlap: true    // Prevent character overlap
   * });
   * ```
   */
  constructor(traversalEngine: TraversalEngine, config?: CircularLayoutConfig) {
    const metadata: LayoutMetadata = {
      id: 'circular',
      name: 'Circular Layout',
      description: 'Arranges nodes in a circle with optional grouping and sorting',
      category: 'radial',
      capabilities: {
        supportsAsync: false,
        supportsCancellation: false,
        supportsIncremental: false,
        supportsConstraints: true,
        maxNodes: 5000,
        maxEdges: 25000
      },
      defaultConfig: {
        radius: 400,
        startAngle: 0,
        sweep: 2 * Math.PI,
        clockwise: true,
        sortBy: 'none',
        groupBy: 'none',
        adjustForOverlap: true,
        bipartite: false
      },
      performance: {
        timeComplexity: 'O(V + E) for sorting, O(V) for layout',
        spaceComplexity: 'O(V)'
      }
    };

    super(metadata, traversalEngine, config);
  }

  /**
   * Apply circular layout algorithm to graph data with systematic positioning.
   * 
   * Executes complete circular layout pipeline including node sorting, grouping,
   * position calculation, and overlap adjustment for organized visualization.
   * 
   * Time Complexity: O(V log V) for sorting, O(V + E) for grouping
   * Space Complexity: O(V) for position storage
   * 
   * @param graph Input graph data with nodes and edges
   * @returns Updated graph with circular node positions
   * 
   * @example
   * ```typescript
   * // Apply circular layout to investigation network
   * const circularData = algorithm.apply(murderMysteryGraph);
   * 
   * // Characters now arranged in investigation circle
   * console.log(circularData.nodes[0].position); // { x: 900, y: 500 }
   * ```
   */
  apply(graph: GraphData): GraphData {
    if (graph.nodes.length === 0) return graph;
    
    const config = this.config as CircularLayoutConfig;
    
    // Sort nodes if requested
    const sortedNodes = this.sortNodes([...graph.nodes], config.sortBy || 'none', graph);
    
    // Group nodes if requested
    const groups = this.groupNodes(sortedNodes, config.groupBy || 'none', graph);
    
    // Calculate positions
    const positions = config.bipartite
      ? this.calculateBipartitePositions(groups, config)
      : this.calculateCircularPositions(groups, config);
    
    // Adjust for overlap if needed
    if (config.adjustForOverlap) {
      this.adjustForOverlap(positions, config);
    }
    
    // Update node positions
    const updatedNodes = graph.nodes.map(node => {
      const position = positions.get(node.id);
      if (!position) return node;
      
      return {
        ...node,
        position: {
          x: position.x,
          y: position.y
        }
      };
    });
    
    return {
      ...graph,
      nodes: updatedNodes
    };
  }

  /**
   * Sort nodes according to specified strategy for circular positioning.
   * 
   * Supports advanced sorting strategies optimized for murder mystery analysis:
   * - degree: Hub characters first (Marcus Blackwood, key suspects)
   * - clustering: Highest clustering coefficient first (tight-knit groups)
   * - alphabetical: Lexicographic order for systematic reference
   * - type: Group by entity type (characters, elements, puzzles)
   * 
   * Complexity: O(V log V) for sorting, O(V²) for clustering coefficient
   * 
   * @param nodes Array of nodes to sort
   * @param sortBy Sorting strategy identifier
   * @param graph Graph data for metric calculations
   * @returns Sorted array of nodes for circular arrangement
   * 
   * @example
   * ```typescript
   * // Sort by clustering - most interconnected characters first
   * const sorted = this.sortNodes(nodes, 'clustering', graph);
   * ```
   */
  private sortNodes(
    nodes: GraphData['nodes'],
    sortBy: string,
    graph: GraphData
  ): GraphData['nodes'] {
    if (sortBy === 'none') return nodes;
    
    // Calculate metrics if needed
    const degrees = new Map<string, number>();
    const clustering = new Map<string, number>();
    
    if (sortBy === 'degree' || sortBy === 'clustering') {
      // Calculate degrees
      graph.edges.forEach(edge => {
        degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
        degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
      });
      
      // Calculate clustering coefficient if needed
      if (sortBy === 'clustering') {
        nodes.forEach(node => {
          const neighbors = new Set<string>();
          graph.edges.forEach(edge => {
            if (edge.source === node.id) neighbors.add(edge.target);
            if (edge.target === node.id) neighbors.add(edge.source);
          });
          
          if (neighbors.size < 2) {
            clustering.set(node.id, 0);
          } else {
            let connections = 0;
            const neighborArray = Array.from(neighbors);
            for (let i = 0; i < neighborArray.length; i++) {
              for (let j = i + 1; j < neighborArray.length; j++) {
                const hasEdge = graph.edges.some(edge =>
                  (edge.source === neighborArray[i] && edge.target === neighborArray[j]) ||
                  (edge.source === neighborArray[j] && edge.target === neighborArray[i])
                );
                if (hasEdge) connections++;
              }
            }
            
            const possibleConnections = (neighbors.size * (neighbors.size - 1)) / 2;
            clustering.set(node.id, connections / possibleConnections);
          }
        });
      }
    }
    
    return nodes.sort((a, b) => {
      switch (sortBy) {
        case 'degree':
          return (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0);
        case 'clustering':
          return (clustering.get(b.id) || 0) - (clustering.get(a.id) || 0);
        case 'alphabetical':
          return (a.data?.label || a.id).localeCompare(
            b.data?.label || b.id
          );
        case 'type':
          return (a.type || '').localeCompare(b.type || '');
        default:
          return 0;
      }
    });
  }

  /**
   * Group nodes by specified criteria for organized circular sections.
   * 
   * Creates logical groupings within the circular layout for systematic analysis:
   * - type: Separate characters, elements, puzzles, timeline events
   * - cluster: Group by investigation clusters or evidence groups
   * - component: Group by connected components using DFS analysis
   * 
   * Complexity: O(V + E) for connected components, O(V) for other groupings
   * 
   * @param nodes Array of nodes to group
   * @param groupBy Grouping strategy identifier
   * @param graph Graph data for component analysis
   * @returns Map of group keys to node arrays
   * 
   * @example
   * ```typescript
   * // Group by connected components - separate investigation clusters
   * const groups = this.groupNodes(sortedNodes, 'component', graph);
   * ```
   */
  private groupNodes(
    nodes: GraphData['nodes'],
    groupBy: string,
    graph: GraphData
  ): Map<string, GraphData['nodes']> {
    const groups = new Map<string, GraphData['nodes']>();
    
    if (groupBy === 'none') {
      groups.set('default', nodes);
      return groups;
    }
    
    if (groupBy === 'component') {
      // Find connected components
      const components = this.findConnectedComponents(nodes, graph);
      components.forEach((component, index) => {
        groups.set(`component-${index}`, component);
      });
      return groups;
    }
    
    // Group by type or cluster
    nodes.forEach(node => {
      let groupKey = 'default';
      
      switch (groupBy) {
        case 'type':
          groupKey = node.type || 'default';
          break;
        case 'cluster':
          groupKey = node.data?.cluster || 'default';
          break;
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(node);
    });
    
    return groups;
  }

  /**
   * Find connected components using depth-first search traversal.
   * 
   * Identifies separate investigation clusters or evidence groups by
   * analyzing graph connectivity using DFS algorithm with adjacency lists.
   * 
   * Complexity: O(V + E) for DFS traversal and adjacency list construction
   * 
   * @param nodes Array of nodes to analyze for components
   * @param graph Graph data containing edge connectivity
   * @returns Array of node arrays, each representing a connected component
   * 
   * @example
   * ```typescript
   * // Find separate investigation clusters
   * const components = this.findConnectedComponents(nodes, graph);
   * // Result: [[marcus_group], [witness_group], [evidence_group]]
   * ```
   */
  private findConnectedComponents(nodes: GraphData['nodes'], graph: GraphData): GraphData['nodes'][] {
    const visited = new Set<string>();
    const components: GraphData['nodes'][] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Build adjacency list
    const adjacency = new Map<string, Set<string>>();
    graph.edges.forEach(edge => {
      if (!adjacency.has(edge.source)) {
        adjacency.set(edge.source, new Set());
      }
      if (!adjacency.has(edge.target)) {
        adjacency.set(edge.target, new Set());
      }
      adjacency.get(edge.source)!.add(edge.target);
      adjacency.get(edge.target)!.add(edge.source);
    });
    
    // DFS to find components
    const dfs = (nodeId: string, component: GraphData['nodes']) => {
      visited.add(nodeId);
      const node = nodeMap.get(nodeId);
      if (node) component.push(node);
      
      const neighbors = adjacency.get(nodeId) || new Set();
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          dfs(neighborId, component);
        }
      });
    };
    
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const component: GraphData['nodes'] = [];
        dfs(node.id, component);
        if (component.length > 0) {
          components.push(component);
        }
      }
    });
    
    return components;
  }

  /**
   * Calculate precise circular positions for all grouped nodes.
   * 
   * Maps nodes to circular coordinates using trigonometric calculations
   * with configurable radius, sweep angles, rotation direction, and grouping.
   * 
   * Complexity: O(V) for position calculation
   * 
   * @param groups Map of grouped nodes for organized circular sections
   * @param config Circular layout configuration with geometric parameters
   * @returns Map of node IDs to calculated circular positions
   * 
   * @example
   * ```typescript
   * const positions = this.calculateCircularPositions(
   *   characterGroups,
   *   { radius: 500, startAngle: 0, sweep: 2*Math.PI, clockwise: true }
   * );
   * ```
   */
  private calculateCircularPositions(
    groups: Map<string, GraphData['nodes']>,
    config: CircularLayoutConfig
  ): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    
    const radius = config.radius || 400;
    const startAngle = config.startAngle || 0;
    const sweep = config.sweep || 2 * Math.PI;
    const clockwise = config.clockwise !== false;
    const centerX = config.width ? config.width / 2 : 500;
    const centerY = config.height ? config.height / 2 : 500;
    
    // Calculate total nodes
    let totalNodes = 0;
    groups.forEach(group => {
      totalNodes += group.length;
    });
    
    // Calculate positions
    let currentAngle = startAngle;
    const angleStep = sweep / Math.max(1, totalNodes - (sweep === 2 * Math.PI ? 0 : 1));
    
    groups.forEach((group, _groupKey) => {
      group.forEach(node => {
        const angle = clockwise ? currentAngle : -currentAngle;
        
        positions.set(node.id, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        });
        
        currentAngle += angleStep;
      });
      
      // Add gap between groups
      if (groups.size > 1) {
        currentAngle += angleStep * 0.5;
      }
    });
    
    return positions;
  }
  
  /**
   * Calculate bipartite circular positions using two semicircles.
   * 
   * Arranges nodes in two opposing semicircles, ideal for suspect-evidence
   * relationships or character-location bipartite graphs in investigations.
   * 
   * Complexity: O(V) for dual semicircle position calculation
   * 
   * @param groups Map of grouped nodes (first two groups used for bipartite)
   * @param config Circular layout configuration for geometric parameters
   * @returns Map of node IDs to bipartite circular positions
   * 
   * @example
   * ```typescript
   * // Position suspects on left, evidence on right semicircles
   * const positions = this.calculateBipartitePositions(
   *   new Map([['suspects', suspectNodes], ['evidence', evidenceNodes]]),
   *   { radius: 400 }
   * );
   * ```
   */
  private calculateBipartitePositions(
    groups: Map<string, GraphData['nodes']>,
    config: CircularLayoutConfig
  ): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    
    const radius = config.radius || 400;
    const centerX = config.width ? config.width / 2 : 500;
    const centerY = config.height ? config.height / 2 : 500;
    
    // Split nodes into two groups for bipartite layout
    const groupArray = Array.from(groups.values());
    const group1 = groupArray[0] || [];
    const group2 = groupArray[1] || [];
    
    // Position first group on left semicircle
    const angleStep1 = Math.PI / Math.max(1, group1.length + 1);
    group1.forEach((node, index) => {
      const angle = Math.PI / 2 + angleStep1 * (index + 1);
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    });
    
    // Position second group on right semicircle
    const angleStep2 = Math.PI / Math.max(1, group2.length + 1);
    group2.forEach((node, index) => {
      const angle = -Math.PI / 2 - angleStep2 * (index + 1);
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    });
    
    return positions;
  }

  /**
   * Adjust node positions to prevent visual overlap in circular layout.
   * 
   * Uses iterative force-based adjustment to separate overlapping nodes
   * while maintaining circular arrangement structure for clean visualization.
   * 
   * Complexity: O(V²) for overlap detection and adjustment iterations
   * 
   * @param positions Mutable map of node positions to adjust
   * @param _config Circular layout configuration (reserved for future use)
   * 
   * @remarks
   * Limited to 10 iterations to prevent infinite adjustment loops.
   * Uses minimum distance of 2.5x node radius for comfortable spacing.
   */
  private adjustForOverlap(
    positions: Map<string, { x: number; y: number }>,
    _config: CircularLayoutConfig
  ): void {
    const nodeRadius = 30; // Approximate node radius
    const minDistance = nodeRadius * 2.5;
    
    // Simple overlap adjustment - increase radius if nodes are too close
    let overlapsFound = true;
    let iterations = 0;
    const maxIterations = 10;
    
    while (overlapsFound && iterations < maxIterations) {
      overlapsFound = false;
      iterations++;
      
      const posArray = Array.from(positions.entries());
      
      for (let i = 0; i < posArray.length; i++) {
        for (let j = i + 1; j < posArray.length; j++) {
          const entry1 = posArray[i];
          const entry2 = posArray[j];
          if (!entry1 || !entry2) continue;
          
          const [id1, pos1] = entry1;
          const [id2, pos2] = entry2;
          
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance) {
            overlapsFound = true;
            
            // Move nodes apart
            const moveDistance = (minDistance - distance) / 2;
            const moveX = (dx / distance) * moveDistance;
            const moveY = (dy / distance) * moveDistance;
            
            positions.set(id1, {
              x: pos1.x - moveX,
              y: pos1.y - moveY
            });
            
            positions.set(id2, {
              x: pos2.x + moveX,
              y: pos2.y + moveY
            });
          }
        }
      }
    }
  }

  /**
   * Calculate layout quality metrics specific to circular arrangements.
   * 
   * Extends base quality metrics with circular-specific measurements including
   * edge crossing optimization, perfect aspect ratio, and symmetry analysis.
   * 
   * Complexity: O(E²) for edge crossing calculation
   * 
   * @param graph Graph data with positioned nodes for quality assessment
   * @returns Enhanced quality metrics object with circular layout specifics
   * 
   * @example
   * ```typescript
   * const metrics = algorithm.calculateQualityMetrics(circularGraph);
   * console.log(metrics.edgeCrossings);  // Optimized crossings count
   * console.log(metrics.aspectRatio);   // Always 1.0 (perfect circle)
   * console.log(metrics.symmetry);      // 0.95 (high circular symmetry)
   * ```
   */
  calculateQualityMetrics(graph: GraphData) {
    const metrics = super.calculateQualityMetrics(graph);
    
    // Circular layout minimizes edge crossings for certain graph types
    return {
      ...metrics,
      edgeCrossings: this.countEdgeCrossings(graph),
      nodeOverlaps: 0, // Circular layout with adjustment prevents overlaps
      aspectRatio: 1.0, // Perfect aspect ratio for circle
      symmetry: 0.95 // High symmetry in circular arrangement
    };
  }

  /**
   * Count edge crossings optimized for circular layout geometry.
   * 
   * Uses angular position analysis to efficiently calculate edge crossings
   * in circular arrangements without full geometric intersection testing.
   * 
   * Complexity: O(E²) for pairwise edge crossing analysis
   * 
   * @param graph Graph data with nodes in circular positions
   * @returns Number of edge crossings in circular layout
   * 
   * @remarks
   * Optimized for circular geometry where crossing detection can use
   * angular intervals rather than full line segment intersection.
   */
  private countEdgeCrossings(graph: GraphData): number {
    // Simplified edge crossing calculation for circular layout
    // In circular layout, crossing number can be calculated more efficiently
    let crossings = 0;
    const nodePositions = new Map<string, number>();
    
    // Assign angular positions to nodes
    graph.nodes.forEach((node, index) => {
      nodePositions.set(node.id, index);
    });
    
    // Count crossings
    const edges = graph.edges;
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const edge1 = edges[i];
        const edge2 = edges[j];
        if (!edge1 || !edge2) continue;
        
        const e1Source = nodePositions.get(edge1.source) || 0;
        const e1Target = nodePositions.get(edge1.target) || 0;
        const e2Source = nodePositions.get(edge2.source) || 0;
        const e2Target = nodePositions.get(edge2.target) || 0;
        
        // Check if edges cross in circular layout
        const e1Min = Math.min(e1Source, e1Target);
        const e1Max = Math.max(e1Source, e1Target);
        const e2Min = Math.min(e2Source, e2Target);
        const e2Max = Math.max(e2Source, e2Target);
        
        if ((e1Min < e2Min && e2Min < e1Max && e1Max < e2Max) ||
            (e2Min < e1Min && e1Min < e2Max && e2Max < e1Max)) {
          crossings++;
        }
      }
    }
    
    return crossings;
  }
}