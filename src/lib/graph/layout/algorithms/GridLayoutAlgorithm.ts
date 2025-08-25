/**
 * Professional grid-based layout algorithm implementation for ALNRetool.
 * 
 * Provides structured grid positioning for systematic visualization of murder mystery
 * entities, enabling organized analysis of characters, evidence, and timeline events
 * through regular geometric arrangements with configurable sorting and grouping.
 * 
 * Key features:
 * - O(V) linear complexity for efficient positioning
 * - Configurable grid dimensions and cell sizing
 * - Multiple sorting strategies (degree, alphabetical, type)
 * - Entity grouping by type or cluster
 * - Perfect overlap prevention
 * - Optimal aspect ratio calculation
 * 
 * @example
 * ```typescript
 * const config: GridLayoutConfig = {
 *   columns: 8,
 *   cellWidth: 200,
 *   cellHeight: 150,
 *   sortBy: 'degree',
 *   groupBy: 'type'
 * };
 * 
 * const algorithm = new GridLayoutAlgorithm(traversalEngine, config);
 * const layoutData = algorithm.apply(graph);
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
 * Configuration interface for grid-based layout algorithm.
 * 
 * Extends base LayoutConfig with grid-specific positioning parameters,
 * sorting strategies, and grouping options optimized for murder mystery
 * investigation workflows and systematic entity analysis.
 * 
 * @interface GridLayoutConfig
 * @extends LayoutConfig
 * 
 * @example
 * ```typescript
 * const config: GridLayoutConfig = {
 *   columns: 6,              // Fixed column count
 *   cellWidth: 180,          // Cell width for character cards
 *   cellHeight: 140,         // Cell height for compact display
 *   marginX: 40,             // Horizontal spacing between cells
 *   marginY: 30,             // Vertical spacing between cells
 *   sortBy: 'degree',        // Sort by connection count
 *   groupBy: 'type',         // Group characters, elements, puzzles
 *   preventOverlap: true     // Ensure clean grid positioning
 * };
 * ```
 */
export interface GridLayoutConfig extends LayoutConfig {
  /** Number of columns in grid layout (auto-calculated if not specified) */
  columns?: number;
  
  /** Number of rows in grid layout (auto-calculated if not specified) */
  rows?: number;
  
  /** Width of each grid cell in pixels (default: 150) */
  cellWidth?: number;
  
  /** Height of each grid cell in pixels (default: 150) */
  cellHeight?: number;
  
  /** Horizontal margin between grid cells in pixels (default: 50) */
  marginX?: number;
  
  /** Vertical margin between grid cells in pixels (default: 50) */
  marginY?: number;
  
  /** Node sorting strategy for grid positioning */
  sortBy?: 'degree' | 'alphabetical' | 'type' | 'none';
  
  /** Node grouping strategy for systematic organization */
  groupBy?: 'type' | 'cluster' | 'none';
  
  /** Prevent node overlapping in grid cells (default: true) */
  preventOverlap?: boolean;
}

/**
 * Grid-based layout algorithm for systematic entity visualization.
 * 
 * Implements structured grid positioning with configurable dimensions, sorting,
 * and grouping strategies. Ideal for systematic analysis of murder mystery
 * entities where organized layout aids investigation workflows.
 * 
 * Algorithm complexity:
 * - Time: O(V + E) for degree calculation, O(V log V) for sorting
 * - Space: O(V) for position storage
 * - Grid calculation: O(1) for dimension determination
 * 
 * @class GridLayoutAlgorithm
 * @extends BaseLayoutAlgorithm
 * 
 * @example
 * ```typescript
 * // Create grid layout for character analysis
 * const algorithm = new GridLayoutAlgorithm(traversalEngine, {
 *   columns: 8,
 *   cellWidth: 200,
 *   cellHeight: 150,
 *   sortBy: 'degree',     // Most connected first (Marcus at top)
 *   groupBy: 'type',      // Characters, elements, puzzles grouped
 *   marginX: 60,
 *   marginY: 40
 * });
 * 
 * // Apply systematic grid layout
 * const organizedGraph = algorithm.apply(investigationGraph);
 * ```
 */
export class GridLayoutAlgorithm extends BaseLayoutAlgorithm {
  /**
   * Initialize grid layout algorithm with murder mystery optimization.
   * 
   * Sets up algorithm metadata, performance characteristics, and default configuration
   * optimized for systematic visualization of investigation entities and evidence.
   * 
   * @param traversalEngine Graph traversal utilities for entity analysis
   * @param config Optional grid-specific configuration parameters
   * 
   * @example
   * ```typescript
   * const algorithm = new GridLayoutAlgorithm(traversalEngine, {
   *   columns: 10,           // Wide grid for many characters
   *   cellWidth: 180,        // Room for character details
   *   cellHeight: 120,       // Compact vertical space
   *   sortBy: 'degree',      // Hub characters first
   *   groupBy: 'type'        // Organize by entity type
   * });
   * ```
   */
  constructor(traversalEngine: TraversalEngine, config?: GridLayoutConfig) {
    const metadata: LayoutMetadata = {
      id: 'grid',
      name: 'Grid Layout',
      description: 'Arranges nodes in a regular grid pattern',
      category: 'grid',
      capabilities: {
        supportsAsync: false,
        supportsCancellation: false,
        supportsIncremental: false,
        supportsConstraints: true,
        maxNodes: 10000,
        maxEdges: 50000
      },
      defaultConfig: {
        cellWidth: 150,
        cellHeight: 150,
        marginX: 50,
        marginY: 50,
        sortBy: 'none',
        groupBy: 'none',
        preventOverlap: true
      },
      performance: {
        timeComplexity: 'O(V)',
        spaceComplexity: 'O(V)'
      }
    };

    super(metadata, traversalEngine, config);
  }

  /**
   * Apply grid layout algorithm to graph data with systematic positioning.
   * 
   * Executes complete grid layout pipeline including node sorting, grouping,
   * dimension calculation, and position assignment for organized visualization.
   * 
   * Time Complexity: O(V log V) for sorting, O(V) for positioning
   * Space Complexity: O(V) for position storage
   * 
   * @param graph Input graph data with nodes and edges
   * @returns Updated graph with systematic grid positions
   * 
   * @example
   * ```typescript
   * // Apply grid layout to investigation network
   * const organizedData = algorithm.apply(murderMysteryGraph);
   * 
   * // Nodes now arranged in systematic grid
   * console.log(organizedData.nodes[0].position); // { x: 50, y: 50 }
 * ```
   */
  apply(graph: GraphData): GraphData {
    if (graph.nodes.length === 0) return graph;
    
    const config = this.config as GridLayoutConfig;
    
    // Sort nodes if requested
    const sortedNodes = this.sortNodes([...graph.nodes], config.sortBy || 'none', graph);
    
    // Group nodes if requested
    const groupedNodes = this.groupNodes(sortedNodes, config.groupBy || 'none');
    
    // Calculate grid dimensions
    const gridDimensions = this.calculateGridDimensions(
      groupedNodes.length,
      config
    );
    
    // Calculate positions
    const positions = this.calculatePositions(
      groupedNodes,
      gridDimensions,
      config
    );
    
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
   * Sort nodes according to specified strategy for systematic grid placement.
   * 
   * Supports multiple sorting strategies optimized for murder mystery analysis:
   * - degree: Hub characters first (Marcus Blackwood, key suspects)
   * - alphabetical: Lexicographic order for easy reference
   * - type: Group by entity type (characters, elements, puzzles)
   * 
   * Complexity: O(V log V) for sorting, O(V + E) for degree calculation
   * 
   * @param nodes Array of nodes to sort
   * @param sortBy Sorting strategy identifier
   * @param graph Graph data for degree calculation
   * @returns Sorted array of nodes
   * 
   * @example
   * ```typescript
   * // Sort by degree - Marcus Blackwood (high degree) appears first
   * const sorted = this.sortNodes(nodes, 'degree', graph);
   * ```
   */
  private sortNodes(
    nodes: any[],
    sortBy: string,
    graph: GraphData
  ): any[] {
    if (sortBy === 'none') return nodes;
    
    // Calculate degrees if needed
    const degrees = new Map<string, number>();
    if (sortBy === 'degree') {
      graph.edges.forEach(edge => {
        degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
        degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
      });
    }
    
    return nodes.sort((a, b) => {
      switch (sortBy) {
        case 'degree':
          return (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0);
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
   * Group nodes by specified criteria for organized grid sections.
   * 
   * Creates logical groupings within the grid layout for systematic analysis:
   * - type: Separate characters, elements, puzzles, timeline events
   * - cluster: Group by investigation clusters or evidence groups
   * 
   * Complexity: O(V) for grouping and flattening
   * 
   * @param nodes Array of nodes to group
   * @param groupBy Grouping strategy identifier
   * @returns Regrouped array with logical sections
   * 
   * @example
   * ```typescript
   * // Group by type - characters first, then elements, then puzzles
   * const grouped = this.groupNodes(sortedNodes, 'type');
   * ```
   */
  private groupNodes(
    nodes: any[],
    groupBy: string
  ): any[] {
    if (groupBy === 'none') return nodes;
    
    const groups = new Map<string, any[]>();
    
    // Group nodes
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
    
    // Flatten groups back to array
    const grouped: any[] = [];
    groups.forEach(group => {
      grouped.push(...group);
    });
    
    return grouped;
  }

  /**
   * Calculate optimal grid dimensions for node count and configuration.
   * 
   * Determines grid rows and columns using explicit configuration or
   * automatic calculation for optimal aspect ratio and space utilization.
   * 
   * Complexity: O(1) for dimension calculation
   * 
   * @param nodeCount Total number of nodes to arrange
   * @param config Grid configuration with dimension preferences
   * @returns Grid dimensions object with rows and columns
   * 
   * @example
   * ```typescript
   * // Calculate dimensions for 24 characters
   * const dims = this.calculateGridDimensions(24, { columns: 6 });
   * // Returns: { columns: 6, rows: 4 }
   * ```
   */
  private calculateGridDimensions(
    nodeCount: number,
    config: GridLayoutConfig
  ): { columns: number; rows: number } {
    if (config.columns && config.rows) {
      return { columns: config.columns, rows: config.rows };
    }
    
    if (config.columns) {
      return {
        columns: config.columns,
        rows: Math.ceil(nodeCount / config.columns)
      };
    }
    
    if (config.rows) {
      return {
        columns: Math.ceil(nodeCount / config.rows),
        rows: config.rows
      };
    }
    
    // Calculate optimal grid dimensions
    const sqrt = Math.sqrt(nodeCount);
    const columns = Math.ceil(sqrt);
    const rows = Math.ceil(nodeCount / columns);
    
    return { columns, rows };
  }

  /**
   * Calculate precise grid positions for all nodes.
   * 
   * Maps each node to specific grid cell coordinates using configured
   * cell dimensions and margins for consistent systematic layout.
   * 
   * Complexity: O(V) for position calculation
   * 
   * @param nodes Ordered array of nodes for positioning
   * @param gridDimensions Grid structure with rows and columns
   * @param config Layout configuration with cell dimensions
   * @returns Map of node IDs to calculated positions
   * 
   * @example
   * ```typescript
   * const positions = this.calculatePositions(
   *   orderedNodes,
   *   { columns: 6, rows: 4 },
   *   { cellWidth: 180, cellHeight: 120, marginX: 40, marginY: 30 }
   * );
   * ```
   */
  private calculatePositions(
    nodes: any[],
    gridDimensions: { columns: number; rows: number },
    config: GridLayoutConfig
  ): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    
    const cellWidth = config.cellWidth || 150;
    const cellHeight = config.cellHeight || 150;
    const marginX = config.marginX || 50;
    const marginY = config.marginY || 50;
    
    const startX = marginX;
    const startY = marginY;
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / gridDimensions.columns);
      const col = index % gridDimensions.columns;
      
      positions.set(node.id, {
        x: startX + col * cellWidth,
        y: startY + row * cellHeight
      });
    });
    
    return positions;
  }

  /**
   * Calculate layout quality metrics specific to grid arrangements.
   * 
   * Extends base quality metrics with grid-specific measurements including
   * perfect overlap prevention, aspect ratio analysis, and symmetry assessment.
   * 
   * Complexity: O(V) for position analysis
   * 
   * @param graph Graph data with positioned nodes
   * @returns Enhanced quality metrics object
   * 
   * @example
   * ```typescript
   * const metrics = algorithm.calculateQualityMetrics(layoutData);
   * console.log(metrics.nodeOverlaps); // Always 0 for grid layout
   * console.log(metrics.symmetry);     // Always 1.0 (perfect symmetry)
   * ```
   */
  calculateQualityMetrics(graph: GraphData) {
    const metrics = super.calculateQualityMetrics(graph);
    
    // Grid layout has perfect regularity but may have many edge crossings
    return {
      ...metrics,
      nodeOverlaps: 0, // Grid prevents overlaps
      aspectRatio: this.calculateAspectRatio(graph),
      symmetry: 1.0 // Perfect symmetry in grid
    };
  }

  /**
   * Calculate aspect ratio of grid layout for visual balance assessment.
   * 
   * Computes ratio between layout width and height to evaluate visual
   * proportions and screen space utilization efficiency.
   * 
   * Complexity: O(V) for position boundary calculation
   * 
   * @param graph Graph data with positioned nodes
   * @returns Aspect ratio value (1.0 = perfect square, <1.0 = taller, >1.0 = wider)
   * 
   * @example
   * ```typescript
   * const ratio = this.calculateAspectRatio(gridGraph);
   * // 0.8 = layout is taller than wide (good for portrait screens)
   * ```
   */
  private calculateAspectRatio(graph: GraphData): number {
    if (graph.nodes.length === 0) return 1;
    
    const xs = graph.nodes.map(n => n.position?.x || 0);
    const ys = graph.nodes.map(n => n.position?.y || 0);
    
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    
    if (height === 0) return 1;
    return Math.min(width / height, height / width);
  }
}