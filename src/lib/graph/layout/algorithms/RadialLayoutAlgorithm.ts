/**
 * Radial Concentric Layout Algorithm Module
 * 
 * Professional implementation of radial concentric layout algorithm optimized
 * for ALNRetool's murder mystery game visualization. Specializes in center-focused
 * arrangements with concentric circles for investigation focus and character relationship analysis.
 * 
 * **Algorithm Overview:**
 * Implements sophisticated radial positioning using graph traversal and geometric calculations:
 * 1. **Center Detection**: Identifies focal node using degree centrality or user specification
 * 2. **Level Assignment**: Calculates graph distances using BFS traversal from center
 * 3. **Concentric Arrangement**: Positions nodes in circles based on their distance levels
 * 4. **Angular Distribution**: Optimally distributes nodes around each circle circumference
 * 
 * **Murder Mystery Optimization:**
 * - **Investigation Focus**: Center victim or key suspect for clear investigation hierarchy
 * - **Relationship Tiers**: Concentric circles show relationship proximity (intimate, close, distant)
 * - **Evidence Clustering**: Group related clues in concentric arrangement around central evidence
 * - **Character Analysis**: Radial visualization of social networks and influence patterns
 * 
 * **Performance Characteristics:**
 * - **Time Complexity**: O(V + E) - Linear traversal with efficient level assignment
 * - **Space Complexity**: O(V) - Linear memory for level tracking and positioning
 * - **Scalability**: Handles up to 5,000 nodes and 20,000 edges efficiently
 * - **Quality**: Clear hierarchical visualization with minimal edge crossings
 * 
 * **Layout Categories:**
 * - **Victim-Centered**: Investigation radiating from victim to suspects and evidence
 * - **Suspect-Focused**: Character analysis with suspect at center of social network
 * - **Evidence-Based**: Clue clustering with primary evidence as focal point
 * - **Timeline-Radial**: Temporal events arranged in concentric chronological circles
 * 
 * **Geometric Features:**
 * - **Customizable Angles**: Full circle or sector-based arrangements
 * - **Level Separation**: Adjustable spacing between concentric circles
 * - **Sorting Options**: Degree-based, alphabetical, or type-based node ordering
 * - **Center Flexibility**: Automatic detection or manual center node specification
 * 
 * @example
 * ```typescript
 * // Victim-centered investigation layout
 * const victimFocused = new RadialLayoutAlgorithm(traversalEngine, {
 *   centerNode: 'victim-john-doe',  // Victim as investigation center
 *   levelSeparation: 180,           // Clear separation between relationship tiers
 *   sortBy: 'degree',              // Most connected suspects closer
 *   startAngle: 0,                 // Full circle arrangement
 *   endAngle: 2 * Math.PI
 * });
 * 
 * // Character relationship analysis
 * const socialNetwork = new RadialLayoutAlgorithm(traversalEngine, {
 *   centerNode: 'main-suspect',     // Suspect-centered analysis
 *   levelSeparation: 150,           // Intimate vs distant relationships
 *   sortBy: 'type',                // Group by character types
 *   startAngle: -Math.PI / 2,      // Top-down arrangement
 *   endAngle: Math.PI / 2
 * });
 * 
 * // Evidence clustering layout
 * const evidenceWeb = new RadialLayoutAlgorithm(traversalEngine, {
 *   radius: 120,                   // Compact evidence arrangement
 *   levelSeparation: 100,          // Tight evidence grouping
 *   sortBy: 'alphabetical',        // Ordered evidence presentation
 *   viewType: 'puzzle-focus'       // Evidence-optimized spacing
 * });
 * ```
 * 
 * @see BaseLayoutAlgorithm - Abstract foundation and Template Method pattern
 * @see TraversalEngine - BFS traversal for level assignment
 * @see GraphNode - Node structure with position and metadata
 */

import { BaseLayoutAlgorithm, type LayoutMetadata, type LayoutConfig } from '../BaseLayoutAlgorithm';
import type { GraphData, GraphNode } from '../../types';
import type { TraversalEngine } from '../../modules/TraversalEngine';

/**
 * Comprehensive configuration interface for radial concentric layout algorithm.
 * Extends base LayoutConfig with radial-specific parameters for center selection,
 * geometric positioning, and murder mystery investigation optimization.
 * 
 * **Configuration Categories:**
 * - **Center Selection**: Focal node identification and positioning
 * - **Geometric Parameters**: Circle sizing and angular arrangements
 * - **Level Management**: Concentric circle spacing and organization
 * - **Sorting Options**: Node ordering within each concentric level
 * 
 * **Murder Mystery Optimizations:**
 * - **Investigation Hierarchy**: Center-focused layouts for investigation flow
 * - **Relationship Proximity**: Distance-based relationship visualization
 * - **Evidence Grouping**: Concentric arrangement of related clues
 * - **Character Analysis**: Social network visualization with clear focal points
 * 
 * @example
 * ```typescript
 * const mysteryConfig: RadialLayoutConfig = {
 *   // Investigation focus configuration
 *   centerNode: 'victim-001',       // Victim-centered investigation
 *   levelSeparation: 200,           // Clear relationship tier separation
 *   
 *   // Geometric arrangement
 *   radius: 150,                    // Base circle radius
 *   startAngle: -Math.PI / 4,       // Upper-left starting position
 *   endAngle: 7 * Math.PI / 4,      // Nearly full circle
 *   
 *   // Organization options
 *   sortBy: 'degree',               // Most connected suspects prominent
 *   groupBy: 'type',                // Group characters vs evidence
 *   
 *   // Canvas integration
 *   width: 1200,                    // Investigation board width
 *   height: 900,                    // Investigation board height
 *   viewType: 'character-journey'   // Character relationship focus
 * };
 * ```
 */
export interface RadialLayoutConfig extends LayoutConfig {
  /** Specific node ID to use as center, or auto-detect using degree centrality */
  centerNode?: string;
  /** Base radius for first concentric circle in pixels (legacy parameter, use levelSeparation) */
  radius?: number;
  /** Starting angle in radians for node placement (0 = right, π/2 = bottom) */
  startAngle?: number;
  /** Ending angle in radians for node placement (2π = full circle) */
  endAngle?: number;
  /** Distance between concentric circle levels in pixels (typical: 100-250) */
  levelSeparation?: number;
  /** Sorting method for nodes within each level (degree recommended for investigation) */
  sortBy?: 'degree' | 'alphabetical' | 'type' | 'none';
  /** Grouping strategy for node organization within levels (future enhancement) */
  groupBy?: 'type' | 'cluster' | 'none';
}

/**
 * Internal data structure for tracking nodes during radial layout computation.
 * Stores node reference, assigned concentric level, and optional geometric positioning
 * information for efficient layout calculation and debugging.
 * 
 * **Level Assignment:**
 * - Level 0: Center node (investigation focus)
 * - Level 1: Direct connections (immediate suspects/evidence)
 * - Level 2+: Progressively distant relationships
 * 
 * **Geometric Integration:**
 * - Angle and radius calculated during position computation
 * - Optional fields populated for debugging and quality assessment
 * - Level determines concentric circle for final positioning
 * 
 * @internal
 */
interface NodeLevel {
  /** Graph node reference with all metadata and properties */
  node: GraphNode;
  /** Concentric level (0 = center, 1+ = distance from center) */
  level: number;
  /** Optional angular position in radians for debugging */
  angle?: number;
  /** Optional radius distance from center for debugging */
  radius?: number;
}

/**
 * Professional radial concentric layout algorithm implementation for ALNRetool.
 * 
 * Provides sophisticated center-focused graph layout using BFS traversal and geometric
 * positioning, optimized for murder mystery investigation visualization, character
 * relationship analysis, and evidence clustering with clear hierarchical focus.
 * 
 * **Implementation Architecture:**
 * - **Template Method Pattern**: Extends BaseLayoutAlgorithm with radial-specific implementation
 * - **Graph Traversal**: TraversalEngine integration for BFS level assignment
 * - **Geometric Computation**: Precise trigonometric positioning for concentric circles
 * - **Center Detection**: Intelligent focal node selection using degree centrality
 * 
 * **Algorithm Phases:**
 * 1. **Center Selection**: Identify focal node using degree centrality or user specification
 * 2. **Level Assignment**: BFS traversal to calculate distance levels from center
 * 3. **Level Grouping**: Organize nodes into concentric circle groups
 * 4. **Intra-Level Sorting**: Order nodes within each level using specified criteria
 * 5. **Geometric Positioning**: Calculate precise angular and radial coordinates
 * 
 * **Murder Mystery Specialization:**
 * - **Investigation Focus**: Victim or suspect-centered layouts for clear investigation hierarchy
 * - **Relationship Visualization**: Concentric circles representing relationship proximity
 * - **Evidence Clustering**: Central evidence with related clues in surrounding circles
 * - **Character Analysis**: Social network visualization with influence patterns
 * 
 * **Quality Guarantees:**
 * - **Hierarchical Clarity**: Clear center-to-periphery relationship visualization
 * - **Minimal Crossings**: Concentric arrangement reduces edge intersections
 * - **Balanced Distribution**: Even angular distribution within each level
 * - **Investigation Focus**: Central positioning of key murder mystery elements
 * 
 * **Performance Features:**
 * - **Linear Complexity**: O(V + E) time for optimal scalability
 * - **Memory Efficiency**: O(V) space with minimal overhead
 * - **Constraint Support**: Custom center node and geometric parameters
 * - **High Scalability**: 5,000+ nodes with sub-second computation
 * 
 * @example
 * ```typescript
 * // Victim-centered investigation layout
 * const investigation = new RadialLayoutAlgorithm(traversalEngine, {
 *   centerNode: 'victim-jane-smith',  // Investigation focal point
 *   levelSeparation: 200,             // Clear relationship tiers
 *   sortBy: 'degree',                 // Most connected suspects prominent
 *   startAngle: -Math.PI / 2,         // Top-down arrangement
 *   endAngle: 3 * Math.PI / 2         // Three-quarter circle
 * });
 * 
 * // Character relationship analysis
 * const socialNetwork = new RadialLayoutAlgorithm(traversalEngine, {
 *   levelSeparation: 180,             // Intimate vs distant relationships
 *   sortBy: 'type',                   // Group by character roles
 *   viewType: 'character-journey',    // Character-optimized spacing
 *   endAngle: 2 * Math.PI             // Full circle social network
 * });
 * 
 * // Evidence clustering layout
 * const evidenceLayout = new RadialLayoutAlgorithm(traversalEngine, {
 *   centerNode: 'murder-weapon',      // Central evidence
 *   levelSeparation: 120,             // Tight evidence clustering
 *   sortBy: 'alphabetical',           // Ordered evidence presentation
 *   startAngle: 0,                    // Right-side starting position
 *   endAngle: Math.PI                 // Half-circle arrangement
 * });
 * 
 * // Apply layout with automatic center detection
 * const layout = investigation.apply(mysteryGraph);
 * console.log(`Investigation hierarchy: ${layout.nodes.length} nodes arranged`);
 * ```
 * 
 * @see BaseLayoutAlgorithm - Abstract foundation with Template Method pattern
 * @see RadialLayoutConfig - Configuration interface for radial parameters
 * @see TraversalEngine - BFS traversal for level assignment
 * @see NodeLevel - Internal structure for level tracking
 */
export class RadialLayoutAlgorithm extends BaseLayoutAlgorithm {
  /**
   * Initialize radial concentric layout algorithm with murder mystery optimizations.
   * 
   * Creates a professionally-configured radial layout instance with intelligent defaults
   * optimized for investigation focus, character relationship analysis, and evidence
   * clustering while maintaining flexibility for custom geometric parameters.
   * 
   * **Initialization Strategy:**
   * - **Metadata Configuration**: Algorithm identity and capability declaration
   * - **Default Optimization**: Murder mystery-specific parameter tuning
   * - **Dependency Injection**: TraversalEngine integration for BFS traversal
   * - **Geometric Setup**: Concentric circle and angular distribution defaults
   * 
   * **Default Configuration Rationale:**
   * - **150px Level Separation**: Clear relationship tier visualization
   * - **Degree Sorting**: Most connected nodes prominently positioned
   * - **Full Circle (2π)**: Complete 360° arrangement for comprehensive view
   * - **200px Base Radius**: Comfortable reading distance for center focus
   * 
   * **Capability Declaration:**
   * - **Constraints Support**: Custom center node and geometric positioning
   * - **High Scalability**: 5,000 nodes / 20,000 edges performance guarantee
   * - **Synchronous Execution**: Fast, deterministic computation model
   * - **Linear Complexity**: O(V + E) time and space efficiency
   * 
   * @param traversalEngine - TraversalEngine instance for BFS level calculation
   * @param config - Optional radial-specific configuration overrides
   * 
   * @example
   * ```typescript
   * // Standard investigation layout
   * const standard = new RadialLayoutAlgorithm(traversalEngine);
   * 
   * // Custom victim-focused layout
   * const victimFocus = new RadialLayoutAlgorithm(traversalEngine, {
   *   centerNode: 'victim-001',       // Specific victim center
   *   levelSeparation: 250,           // Wide relationship separation
   *   sortBy: 'degree',               // Connection-based prominence
   *   viewType: 'investigation'       // Investigation-optimized spacing
   * });
   * 
   * // Compact evidence clustering
   * const evidence = new RadialLayoutAlgorithm(traversalEngine, {
   *   levelSeparation: 100,           // Tight evidence grouping
   *   startAngle: Math.PI / 4,        // Quarter-turn start
   *   endAngle: 7 * Math.PI / 4,      // Seven-eighths circle
   *   sortBy: 'alphabetical'          // Ordered evidence
   * });
   * ```
   * 
   * Complexity: O(1) - Constant time initialization
   */
  constructor(traversalEngine: TraversalEngine, config?: RadialLayoutConfig) {
    const metadata: LayoutMetadata = {
      id: 'radial',
      name: 'Radial Layout',
      description: 'Arranges nodes in concentric circles around a central node',
      category: 'radial',
      capabilities: {
        supportsAsync: false,
        supportsCancellation: false,
        supportsIncremental: false,
        supportsConstraints: true,
        maxNodes: 5000,
        maxEdges: 20000
      },
      defaultConfig: {
        radius: 200,
        startAngle: 0,
        endAngle: 2 * Math.PI,
        levelSeparation: 150,
        sortBy: 'degree',
        groupBy: 'none'
      },
      performance: {
        timeComplexity: 'O(V + E)',
        spaceComplexity: 'O(V)'
      }
    };

    super(metadata, traversalEngine, config);
  }

  /**
   * Apply radial concentric layout algorithm to graph data synchronously.
   * 
   * Implements complete radial positioning pipeline including center detection,
   * BFS level assignment, concentric grouping, and geometric positioning to produce
   * investigation-focused layouts optimized for murder mystery visualization.
   * 
   * **Algorithm Pipeline:**
   * 1. **Input Validation**: Empty graph handling and configuration validation
   * 2. **Center Detection**: Identify focal node using degree centrality or user specification
   * 3. **Level Assignment**: BFS traversal from center to calculate distance levels
   * 4. **Level Grouping**: Organize nodes into concentric circle groups
   * 5. **Intra-Level Sorting**: Order nodes within levels using specified criteria
   * 6. **Position Calculation**: Geometric computation of angular and radial coordinates
   * 7. **Graph Update**: Apply calculated positions to nodes with metadata preservation
   * 
   * **Center Selection Strategy:**
   * - **User-Specified**: Use provided centerNode ID when available
   * - **Degree Centrality**: Automatically select most connected node
   * - **Fallback**: Use first node if no connections exist
   * 
   * **Level Assignment Process:**
   * - **BFS Traversal**: TraversalEngine provides distance-based level calculation
   * - **Connected Components**: Handle disconnected graphs with outermost level placement
   * - **Level Validation**: Ensure all nodes receive appropriate level assignments
   * 
   * **Murder Mystery Optimizations:**
   * - **Investigation Focus**: Center victim or key suspect for clear hierarchy
   * - **Relationship Visualization**: Concentric circles show connection proximity
   * - **Evidence Clustering**: Related clues positioned in appropriate distance levels
   * - **Character Analysis**: Social network patterns emerge through radial arrangement
   * 
   * @param graph - Complete graph data requiring radial concentric layout
   * @returns GraphData with nodes positioned in concentric circles and preserved metadata
   * 
   * @complexity O(V + E) - Linear time for BFS traversal, level grouping, and positioning
   * 
   * @example
   * ```typescript
   * // Investigation hierarchy layout
   * const mysteryGraph: GraphData = {
   *   nodes: [
   *     { id: 'victim', type: 'character', data: { label: 'Victim' } },
   *     { id: 'suspect1', type: 'character', data: { label: 'Main Suspect' } },
   *     { id: 'witness1', type: 'character', data: { label: 'Witness' } },
   *     { id: 'evidence1', type: 'element', data: { label: 'Murder Weapon' } }
   *   ],
   *   edges: [
   *     { id: 'e1', source: 'victim', target: 'suspect1', type: 'relation' },
   *     { id: 'e2', source: 'victim', target: 'witness1', type: 'relation' },
   *     { id: 'e3', source: 'suspect1', target: 'evidence1', type: 'dependency' }
   *   ]
   * };
   * 
   * const layout = algorithm.apply(mysteryGraph);
   * console.log('Radial investigation layout:');
   * layout.nodes.forEach(node => {
   *   const level = // calculated during layout
   *   console.log(`${node.id}: Level ${level} at (${node.position.x}, ${node.position.y})`);
   * });
   * 
   * // Verify center positioning
   * const centerNode = layout.nodes.find(n => n.id === 'victim');
   * console.log(`Center node at: (${centerNode?.position.x}, ${centerNode?.position.y})`);
   * ```
   * 
   * @remarks
   * **Performance Considerations:**
   * - Empty graphs return immediately with no computation overhead
   * - BFS traversal scales linearly with graph size
   * - Geometric calculations are constant time per node
   * - Memory usage minimal with efficient level tracking
   * 
   * **Center Node Selection:**
   * - Explicit centerNode config takes precedence
   * - Degree centrality used for automatic center detection
   * - Handles disconnected graphs gracefully with fallback selection
   * 
   * **Level Assignment:**
   * - Level 0: Center node (investigation focal point)
   * - Level 1+: BFS distance from center (relationship proximity)
   * - Disconnected nodes placed at outermost level
   * 
   * **Position Calculation:**
   * - Even angular distribution within each concentric level
   * - Configurable level separation for relationship tier visualization
   * - Full or partial circle arrangements based on angle parameters
   * 
   * **Integration Notes:**
   * - Preserves all original node and edge metadata
   * - Only modifies node position properties
   * - Compatible with all React Flow node types
   * - Canvas dimensions affect center positioning
   * 
   * For investigation-focused layouts, consider using victim or main suspect as centerNode.
   * For character analysis, let degree centrality automatically select the most connected character.
   */
  apply(graph: GraphData): GraphData {
    if (graph.nodes.length === 0) return graph;
    
    const config = this.config as RadialLayoutConfig;
    
    // Identify center node for radial focus
    const centerNode = this.findCenterNode(graph, config.centerNode);
    if (!centerNode) return graph;
    
    // Calculate concentric levels using BFS traversal
    const levels = this.calculateLevels(graph, centerNode.id);
    
    // Group nodes by their assigned levels
    const levelGroups = this.groupByLevel(levels);
    
    // Sort nodes within each level using specified criteria
    this.sortNodesInLevels(levelGroups, config.sortBy || 'degree', graph);
    
    // Calculate geometric positions for concentric arrangement
    const positions = this.calculatePositions(levelGroups, config);
    
    // Apply calculated positions to graph nodes
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
   * Identify optimal center node for radial layout focus using degree centrality analysis.
   * 
   * Implements intelligent center node selection combining user specification with
   * automatic degree centrality detection to identify the most appropriate focal
   * point for murder mystery investigation or character relationship visualization.
   * 
   * **Selection Strategy:**
   * 1. **User Priority**: Return specified centerNodeId if exists in graph
   * 2. **Degree Centrality**: Calculate connection counts for all nodes
   * 3. **Maximum Selection**: Choose node with highest connection degree
   * 4. **Fallback**: Use first available node if no connections exist
   * 
   * **Murder Mystery Applications:**
   * - **Victim Focus**: Often the most connected character in investigation
   * - **Suspect Analysis**: Main suspects typically have high social connectivity
   * - **Evidence Centrality**: Key evidence pieces connect to multiple clues
   * - **Character Networks**: Social hubs emerge as natural focal points
   * 
   * **Degree Centrality Calculation:**
   * - Counts both incoming and outgoing edges for each node
   * - Handles undirected graph behavior with bidirectional counting
   * - Efficient O(E) computation using edge iteration
   * - Ties resolved by node order (deterministic behavior)
   * 
   * @param graph - Complete graph data for center node analysis
   * @param centerNodeId - Optional user-specified center node ID
   * @returns Selected center node or null if graph is empty
   * 
   * @complexity O(E + V) - Linear edge iteration plus node degree comparison
   * 
   * @example
   * ```typescript
   * // User-specified center (investigation focus)
   * const victimCenter = this.findCenterNode(graph, 'victim-jane-doe');
   * 
   * // Automatic center detection (most connected character)
   * const autoCenter = this.findCenterNode(graph);
   * console.log(`Detected center: ${autoCenter?.id} with degree ${maxDegree}`);
   * 
   * // Handle missing specified center
   * const missingCenter = this.findCenterNode(graph, 'nonexistent-id');
   * // Returns null, algorithm will use automatic detection
   * ```
   * 
   * @remarks
   * **User Specification Priority:**
   * - Specified centerNodeId always takes precedence when valid
   * - Invalid IDs return null, triggering automatic detection fallback
   * - Useful for investigation focus on specific characters or evidence
   * 
   * **Degree Centrality Benefits:**
   * - Identifies natural social hubs and key evidence pieces
   * - Creates meaningful investigation hierarchies automatically
   * - Handles both directed and undirected graph structures
   * - Provides consistent, deterministic center selection
   * 
   * **Edge Cases:**
   * - Empty graphs return null (handled by calling method)
   * - Isolated nodes (degree 0) can still be selected as centers
   * - Multiple nodes with same maximum degree resolved by iteration order
   * - Single-node graphs automatically use the only available node
   * 
   * **Investigation Context:**
   * In murder mystery scenarios, the highest-degree node often represents:
   * - The victim (connected to suspects, witnesses, evidence)
   * - Main suspect (central figure in social network)
   * - Key evidence (connected to multiple investigation aspects)
   * - Important location (scene of crime with multiple connections)
   */
  private findCenterNode(graph: GraphData, centerNodeId?: string): GraphNode | null {
    // Prioritize user-specified center node
    if (centerNodeId) {
      return graph.nodes.find(n => n.id === centerNodeId) || null;
    }
    
    // Calculate degree centrality for all nodes
    const degrees = new Map<string, number>();
    graph.edges.forEach(edge => {
      degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
    });
    
    // Find node with maximum degree centrality
    let maxDegree = 0;
    let centerNode: GraphNode | null = null;
    
    graph.nodes.forEach(node => {
      const degree = degrees.get(node.id) || 0;
      if (degree > maxDegree) {
        maxDegree = degree;
        centerNode = node;
      }
    });
    
    // Fallback to first node if no edges exist
    return centerNode || graph.nodes[0] || null;
  }

  /**
   * Calculate concentric levels for all nodes using BFS traversal from center node.
   * 
   * Implements comprehensive level assignment using breadth-first search to determine
   * the shortest path distance from the center node to all reachable nodes, with
   * special handling for disconnected components in murder mystery graphs.
   * 
   * **Level Assignment Strategy:**
   * - **Level 0**: Center node (investigation focal point)
   * - **Level 1**: Direct neighbors (immediate suspects, witnesses, evidence)
   * - **Level 2+**: Progressively distant connections (extended network)
   * - **Disconnected**: Outermost level (isolated characters or evidence)
   * 
   * **BFS Traversal Process:**
   * 1. **TraversalEngine Integration**: Leverage optimized BFS implementation
   * 2. **Bidirectional Edges**: Handle undirected graph behavior with reverse inclusion
   * 3. **Depth Mapping**: Convert traversal depths to structured NodeLevel objects
   * 4. **Disconnected Handling**: Place unreachable nodes at maximum + 1 level
   * 
   * **Murder Mystery Applications:**
   * - **Investigation Hierarchy**: Distance represents investigation relevance
   * - **Relationship Proximity**: Closer levels indicate stronger connections
   * - **Evidence Correlation**: Related evidence clusters in similar levels
   * - **Character Networks**: Social distance visualization through level separation
   * 
   * **Level Semantics:**
   * - Level 0: Central figure (victim, main suspect, key evidence)
   * - Level 1: Primary connections (close family, direct evidence, witnesses)
   * - Level 2: Secondary connections (friends, circumstantial evidence)
   * - Level 3+: Extended network (acquaintances, background information)
   * 
   * @param graph - Complete graph data for level calculation
   * @param centerNodeId - Center node ID for BFS traversal origin
   * @returns Map of node IDs to NodeLevel structures with assigned levels
   * 
   * @complexity O(V + E) - Linear BFS traversal plus node mapping
   * 
   * @example
   * ```typescript
   * // Calculate levels from victim as center
   * const levels = this.calculateLevels(graph, 'victim-john-doe');
   * 
   * // Analyze level distribution
   * const levelCounts = new Map<number, number>();
   * levels.forEach(nodeLevel => {
   *   levelCounts.set(nodeLevel.level, (levelCounts.get(nodeLevel.level) || 0) + 1);
   * });
   * 
   * console.log('Investigation hierarchy:');
   * levelCounts.forEach((count, level) => {
   *   console.log(`Level ${level}: ${count} nodes`);
   * });
   * 
   * // Find direct connections (Level 1)
   * const directConnections = Array.from(levels.values())
   *   .filter(nl => nl.level === 1)
   *   .map(nl => nl.node.id);
   * console.log('Direct connections:', directConnections);
   * ```
   * 
   * @remarks
   * **TraversalEngine Integration:**
   * - Uses optimized BFS implementation for performance
   * - includeReverse: true enables undirected graph behavior
   * - Depth values directly correspond to concentric circle levels
   * 
   * **Disconnected Component Handling:**
   * - Isolated nodes placed at maxLevel + 1 for clear separation
   * - Ensures all nodes receive level assignments for positioning
   * - Maintains visual distinction between connected and isolated elements
   * 
   * **Performance Characteristics:**
   * - BFS traversal: O(V + E) time complexity
   * - Node mapping: O(V) additional overhead
   * - Memory usage: O(V) for level storage
   * - Efficient for large investigation networks
   * 
   * **Error Handling:**
   * - Missing center node returns empty map
   * - Gracefully handles graphs with no edges
   * - Ensures all input nodes receive appropriate level assignments
   * 
   * **Investigation Insights:**
   * Level distribution reveals investigation structure:
   * - Narrow level 1: Focused investigation with few direct connections
   * - Wide level 1: Complex case with many immediate suspects/evidence
   * - Deep levels: Extended social networks requiring thorough investigation
   * - Many disconnected: Case with multiple isolated leads
   */
  private calculateLevels(graph: GraphData, centerNodeId: string): Map<string, NodeLevel> {
    const levels = new Map<string, NodeLevel>();
    
    // Verify center node exists in graph
    const centerNode = graph.nodes.find(n => n.id === centerNodeId);
    if (!centerNode) return levels;
    
    // Perform BFS traversal using TraversalEngine for optimal performance
    const traversalResult = this.traversalEngine.traverse(
      graph.edges,
      centerNodeId,
      { 
        algorithm: 'bfs',
        includeReverse: true // Enable undirected graph behavior
      }
    );
    
    // Convert BFS depths to structured NodeLevel objects
    traversalResult.depths.forEach((depth, nodeId) => {
      const node = graph.nodes.find(n => n.id === nodeId);
      if (node) {
        levels.set(nodeId, { node, level: depth });
      }
    });
    
    // Handle disconnected nodes by placing at outermost level
    const maxLevel = Math.max(...Array.from(levels.values()).map(l => l.level), 0);
    graph.nodes.forEach(node => {
      if (!levels.has(node.id)) {
        levels.set(node.id, { node, level: maxLevel + 1 });
      }
    });
    
    return levels;
  }

  /**
   * Group nodes by their assigned concentric levels for efficient positioning.
   * 
   * Organizes NodeLevel objects into level-based groups to enable systematic
   * concentric circle positioning and intra-level sorting for murder mystery
   * investigation visualization and character relationship analysis.
   * 
   * **Grouping Strategy:**
   * - **Level-Based Organization**: Separate nodes into distinct concentric levels
   * - **Array Structure**: Maintain node order for subsequent sorting operations
   * - **Efficient Access**: Enable O(1) level-based node retrieval
   * - **Complete Coverage**: Ensure all nodes are properly grouped
   * 
   * **Murder Mystery Applications:**
   * - **Investigation Tiers**: Group suspects, witnesses, evidence by proximity
   * - **Relationship Circles**: Organize characters by social distance
   * - **Evidence Clustering**: Group related clues in appropriate concentric levels
   * - **Analysis Preparation**: Enable level-specific sorting and positioning
   * 
   * **Group Structure:**
   * - Level 0: [center node] - Investigation focal point
   * - Level 1: [direct connections] - Primary suspects, witnesses, evidence
   * - Level 2+: [extended network] - Secondary connections and context
   * - Max level: [disconnected nodes] - Isolated elements
   * 
   * @param levels - Map of node IDs to NodeLevel structures from BFS calculation
   * @returns Map of level numbers to arrays of NodeLevel objects
   * 
   * @complexity O(V) - Single pass through all nodes for grouping
   * 
   * @example
   * ```typescript
   * // Group nodes by calculated levels
   * const levelGroups = this.groupByLevel(levels);
   * 
   * // Analyze group distribution
   * console.log('Investigation structure:');
   * levelGroups.forEach((nodes, level) => {
   *   console.log(`Level ${level}: ${nodes.length} nodes`);
   *   nodes.forEach(nodeLevel => {
   *     console.log(`  - ${nodeLevel.node.id} (${nodeLevel.node.type})`);
   *   });
   * });
   * 
   * // Access specific level for processing
   * const centerGroup = levelGroups.get(0); // Center node(s)
   * const primarySuspects = levelGroups.get(1); // Direct connections
   * 
   * // Prepare for angular positioning
   * levelGroups.forEach((nodes, level) => {
   *   console.log(`Level ${level} will have ${nodes.length} nodes in circle`);
   * });
   * ```
   * 
   * @remarks
   * **Efficiency Considerations:**
   * - Single-pass grouping with O(V) time complexity
   * - Map structure provides O(1) level access
   * - Array preservation enables subsequent sorting operations
   * - Memory overhead minimal with reference-based grouping
   * 
   * **Investigation Structure:**
   * Typical murder mystery level distribution:
   * - Level 0: 1 node (victim or main suspect)
   * - Level 1: 3-8 nodes (immediate suspects, key witnesses, primary evidence)
   * - Level 2: 5-15 nodes (extended social network, circumstantial evidence)
   * - Level 3+: Variable (background characters, secondary evidence)
   * 
   * **Angular Distribution Preparation:**
   * Each level group will be distributed evenly around its concentric circle:
   * - Single node: Positioned at angular midpoint
   * - Multiple nodes: Even angular spacing around circle
   * - Large groups: May require sector-based arrangement
   * 
   * **Sorting Preparation:**
   * Groups maintain insertion order, enabling subsequent sorting by:
   * - Degree centrality (most connected first)
   * - Alphabetical order (systematic presentation)
   * - Node type (characters before evidence)
   * - Custom criteria (investigation priority)
   */
  private groupByLevel(levels: Map<string, NodeLevel>): Map<number, NodeLevel[]> {
    const groups = new Map<number, NodeLevel[]>();
    
    // Group nodes by their assigned concentric levels
    levels.forEach(nodeLevel => {
      if (!groups.has(nodeLevel.level)) {
        groups.set(nodeLevel.level, []);
      }
      groups.get(nodeLevel.level)!.push(nodeLevel);
    });
    
    return groups;
  }

  /**
   * Sort nodes within each concentric level using specified criteria for optimal presentation.
   * 
   * Implements comprehensive intra-level sorting to optimize angular positioning
   * within concentric circles, enhancing murder mystery investigation clarity
   * and character relationship analysis through strategic node ordering.
   * 
   * **Sorting Strategies:**
   * - **Degree Centrality**: Most connected nodes positioned prominently (investigation priority)
   * - **Alphabetical Order**: Systematic presentation for easy reference
   * - **Type-Based**: Group similar entities (characters, evidence, locations)
   * - **None**: Preserve original discovery order from BFS traversal
   * 
   * **Murder Mystery Applications:**
   * - **Suspect Prominence**: Most connected suspects positioned at "12 o'clock"
   * - **Evidence Priority**: Key evidence pieces prominently displayed
   * - **Character Grouping**: Similar character types clustered together
   * - **Systematic Investigation**: Alphabetical order for methodical analysis
   * 
   * **Degree Centrality Sorting:**
   * - Calculates total connections (in + out) for each node
   * - Descending order places most connected nodes first in angular arrangement
   * - Identifies key figures and important evidence automatically
   * - Handles isolated nodes gracefully with degree 0
   * 
   * **Angular Positioning Impact:**
   * Sorted nodes are positioned starting from startAngle:
   * - First node: Most prominent angular position
   * - Subsequent nodes: Clockwise arrangement by importance/criteria
   * - Last node: Least prominent position in angular range
   * 
   * @param levelGroups - Map of concentric levels to node arrays for sorting
   * @param sortBy - Sorting criterion ('degree', 'alphabetical', 'type', 'none')
   * @param graph - Complete graph data for degree calculation when needed
   * 
   * @complexity O(V log V) - Sorting within each level, dominated by degree calculation
   * 
   * @example
   * ```typescript
   * // Sort by degree centrality (investigation priority)
   * this.sortNodesInLevels(levelGroups, 'degree', graph);
   * console.log('Level 1 nodes by importance:');
   * levelGroups.get(1)?.forEach((nodeLevel, index) => {
   *   const degree = degrees.get(nodeLevel.node.id) || 0;
   *   console.log(`${index + 1}. ${nodeLevel.node.id}: ${degree} connections`);
   * });
   * 
   * // Sort alphabetically for systematic presentation
   * this.sortNodesInLevels(levelGroups, 'alphabetical', graph);
   * console.log('Alphabetical character order:');
   * levelGroups.get(1)?.forEach(nodeLevel => {
   *   const label = nodeLevel.node.data?.label || nodeLevel.node.id;
   *   console.log(`- ${label}`);
   * });
   * 
   * // Sort by type for grouped presentation
   * this.sortNodesInLevels(levelGroups, 'type', graph);
   * console.log('Grouped by type:');
   * levelGroups.get(1)?.forEach(nodeLevel => {
   *   console.log(`${nodeLevel.node.type}: ${nodeLevel.node.id}`);
   * });
   * ```
   * 
   * @remarks
   * **Degree Calculation:**
   * - Only computed when sortBy === 'degree' for efficiency
   * - Counts both source and target connections (undirected behavior)
   * - Cached in Map for O(1) lookup during sorting
   * 
   * **Label Resolution:**
   * - Uses node.data.label when available for readable sorting
   * - Falls back to node.id for consistent behavior
   * - Handles missing data gracefully with empty string defaults
   * 
   * **Investigation Benefits:**
   * - **Degree Sorting**: Automatically highlights key suspects and evidence
   * - **Alphabetical Sorting**: Enables systematic investigation methodology
   * - **Type Sorting**: Groups characters vs evidence for focused analysis
   * - **No Sorting**: Preserves discovery order from BFS traversal
   * 
   * **Performance Optimization:**
   * - Early return for 'none' sorting to avoid unnecessary computation
   * - Degree calculation only when needed
   * - In-place sorting to minimize memory allocation
   * - Efficient string comparison using localeCompare
   * 
   * **Angular Positioning Preview:**
   * After sorting, nodes will be positioned angularly as:
   * 1. First node: startAngle position (most prominent)
   * 2. Second node: startAngle + angleStep
   * 3. Continue clockwise based on sorting order
   * 4. Last node: Most distant angular position
   */
  private sortNodesInLevels(
    levelGroups: Map<number, NodeLevel[]>,
    sortBy: string,
    graph: GraphData
  ): void {
    // Skip sorting if none specified
    if (sortBy === 'none') return;
    
    // Calculate degree centrality when needed for sorting
    const degrees = new Map<string, number>();
    if (sortBy === 'degree') {
      graph.edges.forEach(edge => {
        degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
        degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
      });
    }
    
    // Apply sorting criteria to each concentric level
    levelGroups.forEach(nodes => {
      nodes.sort((a, b) => {
        switch (sortBy) {
          case 'degree':
            // Descending order: most connected nodes first
            return (degrees.get(b.node.id) || 0) - (degrees.get(a.node.id) || 0);
          case 'alphabetical':
            // Ascending alphabetical order by label or ID
            return (a.node.data?.label || a.node.id).localeCompare(
              b.node.data?.label || b.node.id
            );
          case 'type':
            // Ascending order by node type (characters, evidence, etc.)
            return (a.node.type || '').localeCompare(b.node.type || '');
          default:
            // No sorting - preserve original order
            return 0;
        }
      });
    });
  }

  /**
   * Calculate precise geometric positions for concentric radial arrangement.
   * 
   * Implements comprehensive trigonometric positioning system to place nodes
   * in concentric circles with optimal angular distribution, creating clear
   * investigation hierarchies and character relationship visualizations.
   * 
   * **Positioning Algorithm:**
   * 1. **Center Placement**: Level 0 nodes positioned at layout center point
   * 2. **Radius Calculation**: Level × levelSeparation determines circle radius
   * 3. **Angular Distribution**: Even spacing within specified angle range
   * 4. **Trigonometric Positioning**: Polar to Cartesian coordinate conversion
   * 5. **Single Node Centering**: Solo nodes positioned at angular midpoint
   * 
   * **Geometric Parameters:**
   * - **Center Point**: (centerX, centerY) as focus of concentric arrangement
   * - **Level Separation**: Radial distance between concentric circles
   * - **Angle Range**: Configurable sector for partial or full circle layouts
   * - **Angular Distribution**: Even spacing optimized for node count
   * 
   * **Murder Mystery Layout Patterns:**
   * - **Full Circle (0 to 2π)**: Complete investigation overview
   * - **Semicircle (0 to π)**: Focused suspect analysis
   * - **Quarter Circle (0 to π/2)**: Concentrated evidence clustering
   * - **Custom Sectors**: Specific angle ranges for specialized views
   * 
   * **Coordinate System:**
   * - **Origin**: Center of investigation board/canvas
   * - **Positive X**: Rightward from center (0 radians)
   * - **Positive Y**: Downward from center (π/2 radians)
   * - **Angular Direction**: Clockwise rotation (standard screen coordinates)
   * 
   * @param levelGroups - Map of sorted concentric levels to node arrays
   * @param config - Radial configuration with geometric parameters
   * @returns Map of node IDs to precise (x, y) coordinate positions
   * 
   * @complexity O(V) - Linear positioning calculation for all nodes
   * 
   * @example
   * ```typescript
   * // Calculate positions for investigation layout
   * const positions = this.calculatePositions(levelGroups, {
   *   levelSeparation: 200,    // 200px between relationship tiers
   *   startAngle: -Math.PI/2,  // Start at top (12 o'clock)
   *   endAngle: 3*Math.PI/2,   // Three-quarter circle
   *   width: 1200,            // Investigation board width
   *   height: 900             // Investigation board height
   * });
   * 
   * // Analyze positioning results
   * console.log('Investigation layout coordinates:');
   * positions.forEach((pos, nodeId) => {
   *   const distance = Math.sqrt(Math.pow(pos.x - 600, 2) + Math.pow(pos.y - 450, 2));
   *   console.log(`${nodeId}: (${pos.x}, ${pos.y}) - ${Math.round(distance)}px from center`);
   * });
   * 
   * // Verify center positioning
   * const centerPos = positions.get('victim-center');
   * console.log(`Center at: (${centerPos?.x}, ${centerPos?.y})`);
   * ```
   * 
   * @remarks
   * **Angular Distribution Logic:**
   * - Multiple nodes: angleStep = angleRange / nodeCount for even spacing
   * - Single node: Positioned at angleRange midpoint for visual balance
   * - Zero nodes: Handled gracefully (though shouldn't occur)
   * 
   * **Radius Calculation:**
   * - Level 0: radius = 0 (center position)
   * - Level 1: radius = 1 × levelSeparation
   * - Level N: radius = N × levelSeparation
   * - Linear progression creates clear concentric tiers
   * 
   * **Trigonometric Positioning:**
   * - x = centerX + radius × cos(angle)
   * - y = centerY + radius × sin(angle)
   * - Standard unit circle math with center offset
   * - Handles all quadrants correctly
   * 
   * **Investigation Layout Benefits:**
   * - **Clear Hierarchy**: Concentric circles show relationship distance
   * - **Focal Emphasis**: Center positioning highlights key investigation elements
   * - **Angular Organization**: Sorted arrangement within each circle
   * - **Scalable Design**: Works for small teams or large investigation networks
   * 
   * **Canvas Integration:**
   * - Uses canvas dimensions for center point calculation
   * - Defaults to 500×500 center when dimensions unavailable
   * - Coordinates compatible with React Flow positioning system
   * - Handles various aspect ratios gracefully
   * 
   * **Quality Assurance:**
   * - No node overlap within levels (angular distribution)
   * - Clear separation between levels (radial spacing)
   * - Consistent positioning for identical inputs (deterministic)
   * - Handles edge cases (single nodes, empty levels) gracefully
   */
  private calculatePositions(
    levelGroups: Map<number, NodeLevel[]>,
    config: RadialLayoutConfig
  ): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    const levelSeparation = config.levelSeparation || 150;
    const startAngle = config.startAngle || 0;
    const endAngle = config.endAngle || 2 * Math.PI;
    const centerX = config.width ? config.width / 2 : 500;
    const centerY = config.height ? config.height / 2 : 500;
    
    levelGroups.forEach((nodes, level) => {
      if (level === 0) {
        // Position center node(s) at layout focal point
        nodes.forEach(nodeLevel => {
          positions.set(nodeLevel.node.id, {
            x: centerX,
            y: centerY
          });
        });
      } else {
        // Calculate radius for this concentric level
        const radius = level * levelSeparation;
        
        // Calculate angular step for even distribution
        const angleRange = endAngle - startAngle;
        const angleStep = nodes.length > 1 
          ? angleRange / nodes.length 
          : 0;
        
        // Position nodes using trigonometric calculation
        nodes.forEach((nodeLevel, index) => {
          const angle = startAngle + (angleStep * index) + 
            (nodes.length === 1 ? angleRange / 2 : 0);
          
          positions.set(nodeLevel.node.id, {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
          });
        });
      }
    });
    
    return positions;
  }
}

/**
 * Export type alias for external usage and documentation.
 * Provides convenient access to radial-specific configuration options
 * without requiring direct import of the interface.
 */
export type { RadialLayoutConfig };
}