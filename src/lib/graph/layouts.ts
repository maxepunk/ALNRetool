/**
 * Murder Mystery Investigation Graph Layouts
 * 
 * Advanced Dagre-based graph layout configurations optimized for interactive murder mystery
 * game visualization. Provides specialized layout presets, dynamic spacing algorithms,
 * and investigation-specific optimizations for detective workflows and evidence analysis.
 * 
 * **Core Layout Strategy:**
 * - **Hierarchical Organization**: Clear progression paths through investigation puzzles
 * - **Dynamic Spacing**: Adaptive node spacing based on entity relationships
 * - **Context-Aware Sizing**: Entity-specific dimensions for optimal readability
 * - **Visual Hierarchy**: Strategic spacing to emphasize investigation flow
 * 
 * **Investigation Layout Presets:**
 * 
 * **Puzzle Focus Layout:**
 * - Horizontal evidence chain visualization
 * - Dynamic element clustering near related puzzles
 * - Enhanced spacing for visual hierarchy clarity
 * - Optimized for puzzle dependency analysis
 * 
 * **Character Journey Layout:**
 * - Vertical ownership tree visualization
 * - Hierarchical character-to-item relationships
 * - Top-down investigation flow structure
 * - Perfect for character-centric evidence mapping
 * 
 * **Content Status Layout:**
 * - Compact grouping by investigation status
 * - Minimal spacing for overview presentations
 * - Systematic organization of case materials
 * - Ideal for progress tracking and status reviews
 * 
 * **Architecture Benefits:**
 * - **Performance Optimized**: Network-simplex algorithm for complex dependency networks
 * - **Overlap Prevention**: Enhanced spacing calculations prevent visual conflicts
 * - **Hierarchical Support**: Parent-child puzzle relationships with size differentiation
 * - **Investigation Context**: Layout decisions optimized for detective workflows
 * 
 * @module graph/layouts
 * @since 1.0.0
 * @version 2.1.0
 * @author ALNRetool Development Team
 */

import dagre from 'dagre';
import type { GraphNode, GraphEdge, LayoutConfig, EntityType } from './types';
import { logger } from './utils/Logger'


// ============================================================================
// Layout Configurations
// ============================================================================

/**
 * Murder Mystery Investigation Layout Presets
 * 
 * Curated collection of layout configurations optimized for different investigation
 * scenarios and detective workflows. Each preset provides specialized spacing,
 * alignment, and organizational strategies for specific murder mystery visualization needs.
 * 
 * **Preset Categories:**
 * 
 * **Investigation Flow Layouts:**
 * - **puzzleFocus**: Horizontal puzzle dependency chains with evidence clustering
 * - **characterJourney**: Vertical character ownership trees with hierarchical relationships
 * 
 * **Administrative Layouts:**
 * - **contentStatus**: Compact status-based grouping for progress tracking
 * - **default**: Balanced general-purpose layout for mixed investigation content
 * 
 * **Configuration Strategy:**
 * - **Direction Control**: LR (left-right) for workflows, TB (top-bottom) for hierarchies
 * - **Rank Separation**: Vertical/horizontal spacing between investigation levels
 * - **Node Separation**: Spacing between parallel investigation paths
 * - **Dynamic Features**: Enhanced clustering and spacing for evidence relationships
 * 
 * @constant LAYOUT_PRESETS
 * @since 1.0.0
 */
export const LAYOUT_PRESETS = {
  /**
   * Puzzle Focus Investigation Layout
   * 
   * Specialized horizontal layout for puzzle dependency visualization in murder mystery
   * investigations. Optimizes the flow from evidence discovery through puzzle solving
   * to reward collection, with dynamic clustering to group related investigation elements.
   * 
   * **Investigation Workflow:**
   * Evidence → Puzzle Requirements → Puzzle Solving → Rewards → Timeline Integration
   * 
   * **Key Features:**
   * - **Dynamic Element Clustering**: Groups evidence near related puzzles
   * - **Tight Vertical Spacing**: 40px spacing between clustered items
   * - **Enhanced Rank Separation**: 300px horizontal spacing between workflow stages
   * - **Post-Layout Optimization**: Additional clustering algorithms for evidence grouping
   * 
   * **Investigation Use Cases:**
   * - Puzzle dependency chain analysis
   * - Evidence-to-solution pathway visualization
   * - Investigation progress tracking through puzzle completion
   * - Reward discovery and collection workflow mapping
   * 
   * @property puzzleFocus
   * @since 1.0.0
   */
  puzzleFocus: {
    direction: 'LR' as const,
    rankSeparation: 300,  // Increased from 200 for better layer separation
    nodeSeparation: 100,  // Default separation (will be overridden by dynamic spacing)
    center: true,
    // Enable dynamic spacing features for better element grouping
    dynamicSpacing: true,       // Use tighter spacing for elements
    tightElementSpacing: 40,    // Tight vertical spacing between elements
    clusterElements: true,      // Apply post-layout clustering
  } as any,  // Cast to any to include extended options
  
  /**
   * Character Journey Investigation Layout
   * 
   * Vertical tree layout for character-centric investigation analysis in murder mystery
   * scenarios. Visualizes hierarchical ownership relationships from characters down through
   * their associated puzzles, evidence, and timeline events.
   * 
   * **Investigation Hierarchy:**
   * Character (Suspect/Victim) → Owned Puzzles → Related Evidence → Timeline Events
   * 
   * **Key Features:**
   * - **Top-Down Character Focus**: Primary character positioned at hierarchy root
   * - **Ownership Visualization**: Clear parent-child relationships showing possession
   * - **Upper-Left Alignment**: Systematic tree structure for methodical analysis
   * - **Balanced Spacing**: 200px vertical, 120px horizontal for optimal readability
   * 
   * **Investigation Applications:**
   * - Suspect profile building and evidence association
   * - Character motivation analysis through owned items
   * - Witness testimony verification against owned evidence
   * - Timeline correlation with character-specific events
   * 
   * @property characterJourney
   * @since 1.0.0
   */
  characterJourney: {
    direction: 'TB' as const,
    rankSeparation: 200,  // Vertical spacing between hierarchy levels
    nodeSeparation: 120,  // Horizontal spacing between nodes at same level
    center: true,
    alignment: 'UL' as const,  // Upper-left alignment for tree structure
    rankdir: 'TB' as const,    // Top-to-bottom direction
  },
  
  /**
   * Content Status Investigation Layout
   * 
   * Compact horizontal layout for investigation progress tracking and status-based
   * evidence organization. Optimized for administrative oversight and case management
   * with minimal spacing to maximize information density.
   * 
   * **Status Categories:**
   * Active Investigation → Pending Analysis → Completed Evidence → Archived Items
   * 
   * **Key Features:**
   * - **Compact Organization**: Minimal spacing for maximum information density
   * - **Status-Based Grouping**: Systematic organization by investigation progress
   * - **Horizontal Flow**: Left-right progression through investigation stages
   * - **No Centering**: Utilizes full viewport width for comprehensive overview
   * 
   * **Investigation Use Cases:**
   * - Case progress monitoring and status tracking
   * - Evidence processing workflow management
   * - Investigation team coordination and task assignment
   * - Administrative reporting and case documentation
   * 
   * @property contentStatus
   * @since 1.0.0
   */
  contentStatus: {
    direction: 'LR' as const,
    rankSeparation: 150,  // Increased from 100
    nodeSeparation: 60,   // Increased from 30
    center: false,
  },
  
  /**
   * Default Investigation Layout
   * 
   * Balanced general-purpose layout for mixed murder mystery investigation content.
   * Provides optimal spacing and organization for scenarios that don't fit specialized
   * investigation workflows, ensuring readability across diverse evidence types.
   * 
   * **Balanced Design:**
   * Mixed Evidence Types → Flexible Organization → Readable Spacing → Centered Presentation
   * 
   * **Key Features:**
   * - **Universal Compatibility**: Works well with any combination of entity types
   * - **Balanced Spacing**: 250px rank separation, 80px node separation for readability
   * - **Centered Layout**: Optimal viewport utilization with centered presentation
   * - **Fallback Reliability**: Safe default when specialized layouts aren't suitable
   * 
   * **Investigation Applications:**
   * - Initial case overview and general evidence presentation
   * - Multi-entity investigations with diverse evidence types
   * - Exploratory analysis when investigation focus isn't yet determined
   * - Training scenarios and demonstration layouts
   * 
   * @property default
   * @since 1.0.0
   */
  default: {
    direction: 'LR' as const,
    rankSeparation: 250,  // Increased from 150
    nodeSeparation: 80,   // Increased from 50
    center: true,
  },
} as const satisfies Record<string, LayoutConfig>;

// ============================================================================
// Node Size Configuration
// ============================================================================

/**
 * Murder Mystery Investigation Node Dimensions
 * 
 * Specialized node sizing configuration optimized for murder mystery investigation
 * entity visualization. Provides entity-specific dimensions that ensure optimal
 * readability, prevent visual overlap, and maintain hierarchical visual relationships.
 * 
 * **Entity-Specific Sizing Strategy:**
 * 
 * **Character Nodes (240×100):**
 * - Largest horizontal footprint for suspect/victim prominence
 * - Adequate space for names, roles, and status indicators
 * - Designed for character photo and key information display
 * 
 * **Element Nodes (200×80):**
 * - Balanced size for evidence items and investigative clues
 * - Sufficient space for item names and descriptive metadata
 * - Optimized for evidence clustering and relationship visualization
 * 
 * **Puzzle Nodes (180×180):**
 * - Square diamond shape for investigation challenge representation
 * - Equal dimensions support rotated diamond visual styling
 * - Significant size increase to accommodate puzzle complexity information
 * 
 * **Timeline Nodes (160×60):**
 * - Compact horizontal format for temporal event representation
 * - Space-efficient design for timeline integration and sequencing
 * - Optimized for chronological arrangement and temporal relationships
 * 
 * **Size Optimization Benefits:**
 * - **Readability**: All text content remains legible at standard zoom levels
 * - **Overlap Prevention**: Dimensions calculated to prevent visual conflicts
 * - **Hierarchical Emphasis**: Size relationships reinforce entity importance
 * - **Layout Efficiency**: Balanced sizing optimizes overall graph layout quality
 * 
 * @constant NODE_DIMENSIONS
 * @since 1.0.0
 * @private
 */
const NODE_DIMENSIONS: Record<EntityType, { width: number; height: number }> = {
  character: { width: 240, height: 100 },  // Increased from 200x80
  element: { width: 200, height: 80 },     // Increased from 160x60
  puzzle: { width: 180, height: 180 },     // Increased significantly for diamond shape
  timeline: { width: 160, height: 60 },    // Increased from 120x40
};

/**
 * Calculate Dynamic Node Dimensions for Investigation Entities
 * 
 * Intelligent node sizing system that adapts dimensions based on entity metadata,
 * hierarchical relationships, and visual hints to optimize murder mystery investigation
 * visualization. Provides context-aware sizing for parent-child puzzle relationships
 * and visual emphasis based on investigation importance.
 * 
 * **Adaptive Sizing Features:**
 * 
 * **Puzzle Hierarchy Support:**
 * - **Parent Puzzles**: 240×240px for complex investigation challenges with sub-tasks
 * - **Child Puzzles**: 140×140px for focused sub-investigation components
 * - **Standard Puzzles**: 180×180px for independent investigation challenges
 * 
 * **Visual Hint Integration:**
 * - **Small Modifier**: 0.8× scaling for minor investigation elements
 * - **Medium Modifier**: 1.0× scaling for standard investigation importance
 * - **Large Modifier**: 1.3× scaling for critical investigation components
 * 
 * **Hierarchy Detection:**
 * - Automatically identifies parent puzzles via subPuzzleIds property
 * - Recognizes child puzzles through parentItemId relationships
 * - Maintains visual hierarchy through size differentiation
 * 
 * **Investigation Benefits:**
 * - **Visual Hierarchy**: Size emphasizes investigation element importance
 * - **Relationship Clarity**: Parent-child sizing makes dependencies obvious
 * - **Context Awareness**: Visual hints guide investigator attention
 * - **Dynamic Adaptation**: Sizing responds to investigation complexity
 * 
 * @param node - Graph node requiring dimension calculation
 * @returns Calculated width and height dimensions for optimal investigation visualization
 * @since 1.0.0
 * @complexity O(1) - Constant time dimension calculation
 */
function getNodeDimensions(node: GraphNode): { width: number; height: number } {
  const baseSize = NODE_DIMENSIONS[node.data.metadata.entityType];
  const visualSize = node.data.metadata.visualHints?.size;
  const entity = node.data.entity;
  
  // Special handling for puzzle hierarchy
  if (node.data.metadata.entityType === 'puzzle') {
    // Parent puzzles (have sub-puzzles) are larger
    if (entity.subPuzzleIds && entity.subPuzzleIds.length > 0) {
      return { width: 240, height: 240 };  // Parent size
    }
    // Child puzzles (have parent) are smaller
    if (entity.parentItemId) {
      return { width: 140, height: 140 };  // Child size
    }
  }
  
  // Scale based on visual hints
  const sizeMultipliers = {
    small: 0.8,
    medium: 1.0,
    large: 1.3,
  };
  
  const multiplier = visualSize ? sizeMultipliers[visualSize] : 1.0;
  
  return {
    width: Math.round(baseSize.width * multiplier),
    height: Math.round(baseSize.height * multiplier),
  };
}

// ============================================================================
// Dagre Graph Builder
// ============================================================================

/**
 * Create Optimized Dagre Graph for Murder Mystery Investigation
 * 
 * Initializes and configures a Dagre graph instance with murder mystery investigation
 * optimizations including enhanced spacing, margin calculations, and layout parameters
 * specifically tuned for detective workflow visualization and evidence relationship clarity.
 * 
 * **Configuration Optimizations:**
 * 
 * **Spacing Strategy:**
 * - **Rank Separation**: Configurable spacing between investigation workflow stages
 * - **Node Separation**: Optimal spacing between parallel investigation paths
 * - **Edge Separation**: 20px spacing around dependency relationships for clarity
 * - **Enhanced Margins**: 100px margins for comprehensive edge routing space
 * 
 * **Layout Algorithm Selection:**
 * - **Network-Simplex**: Default algorithm for complex investigation networks
 * - **Safe Configuration**: Avoids problematic layout options that cause rendering issues
 * - **Edge Routing**: Optimized pathfinding for clear relationship visualization
 * 
 * **Investigation-Specific Features:**
 * - **Direction Support**: Full directional control (LR, RL, TB, BT) for investigation flows
 * - **Margin Optimization**: Generous margins prevent edge clipping in complex cases
 * - **Default Edge Labels**: Required Dagre configuration for consistent rendering
 * 
 * **Performance Considerations:**
 * - **Algorithm Stability**: Uses proven network-simplex for reliable layout convergence
 * - **Memory Efficiency**: Optimized configuration reduces layout computation overhead
 * - **Rendering Safety**: Configuration prevents common Dagre rendering failures
 * 
 * @param config - Layout configuration specifying direction, spacing, and alignment
 * @returns Configured Dagre graph instance ready for node and edge addition
 * @since 1.0.0
 * @complexity O(1) - Constant time graph initialization
 * @private
 */
function createDagreGraph(config: LayoutConfig): dagre.graphlib.Graph {
  const g = new dagre.graphlib.Graph();
  
  // Set graph options with optimized layout parameters
  g.setGraph({
    rankdir: config.direction,
    ranksep: config.rankSeparation as number,
    nodesep: config.nodeSeparation as number,
    marginx: 100,  // Increased from 50 for better edge spacing
    marginy: 100,  // Increased from 50 for better edge spacing
    // Use safer options - network-simplex causes issues
    edgesep: 20,  // Add edge separation
  });
  
  // Default edge label (required by Dagre)
  g.setDefaultEdgeLabel(() => ({}));
  
  return g;
}

// ============================================================================
// Layout Application
// ============================================================================

/**
 * Apply Murder Mystery Investigation Dagre Layout
 * 
 * Comprehensive graph layout function that applies Dagre hierarchical positioning
 * to murder mystery investigation entities. Handles node positioning, edge routing,
 * dimension calculations, and error recovery for robust investigation visualization.
 * 
 * **Layout Process:**
 * 1. **Graph Initialization**: Creates optimized Dagre graph with investigation settings
 * 2. **Node Registration**: Adds investigation entities with calculated dimensions
 * 3. **Edge Validation**: Validates and adds relationships between investigation elements
 * 4. **Layout Computation**: Applies Dagre algorithm for optimal positioning
 * 5. **Position Integration**: Transfers calculated positions back to graph nodes
 * 
 * **Investigation Optimizations:**
 * 
 * **Entity Dimension Handling:**
 * - Dynamic sizing based on entity type and hierarchy relationships
 * - Special handling for parent-child puzzle relationships
 * - Visual hint integration for investigation importance emphasis
 * 
 * **Edge Relationship Validation:**
 * - Comprehensive validation prevents invalid relationship rendering
 * - Detailed logging for investigation debugging and troubleshooting
 * - Graceful handling of missing or invalid investigation connections
 * 
 * **Error Recovery:**
 * - Empty node set handling with appropriate logging
 * - Invalid edge detection and reporting for investigation integrity
 * - Fallback positioning for robust visualization under all conditions
 * 
 * **Performance Features:**
 * - Efficient node ID lookup using Set data structure for O(1) validation
 * - Batch processing of investigation entities and relationships
 * - Memory-optimized node cloning for position integration
 * 
 * @param nodes - Array of investigation entities to position (characters, puzzles, evidence, timeline)
 * @param edges - Array of relationships between investigation entities
 * @param config - Layout configuration preset (default: LAYOUT_PRESETS.default)
 * @returns Array of positioned investigation nodes ready for visualization
 * @throws Logs warnings for invalid edges but continues layout process
 * @since 1.0.0
 * @complexity O(V + E) where V = nodes, E = edges
 * 
 * @example
 * ```typescript
 * // Apply puzzle focus layout for evidence chain analysis
 * const layoutedNodes = applyDagreLayout(
 *   investigationNodes,
 *   evidenceRelationships,
 *   LAYOUT_PRESETS.puzzleFocus
 * );
 * 
 * // Apply character journey layout for suspect analysis
 * const characterLayout = applyDagreLayout(
 *   characterNodes,
 *   ownershipEdges,
 *   LAYOUT_PRESETS.characterJourney
 * );
 * ```
 */
export function applyDagreLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutConfig = LAYOUT_PRESETS.default
): GraphNode[] {
  // Create Dagre graph
  const dagreGraph = createDagreGraph(config);
  
  
  // Early return if no nodes
  if (nodes.length === 0) {
    logger.warn('No nodes provided to dagre layout');
    return [];
  }
  
  // Create a set of valid node IDs for quick lookup
  const validNodeIds = new Set(nodes.map(node => node.id));
  
  // Add nodes to Dagre
  nodes.forEach(node => {
    const dimensions = getNodeDimensions(node);
    dagreGraph.setNode(node.id, {
      width: dimensions.width,
      height: dimensions.height,
      // Pass through metadata for custom ranking if needed
      entityType: node.data.metadata.entityType,
    });
  });
  
  // Add edges to Dagre - only if both source and target exist
  let invalidEdgeCount = 0;
  edges.forEach(edge => {
    if (!validNodeIds.has(edge.source)) {
      logger.warn(`Edge source not found in nodes: ${edge.source}`);
      invalidEdgeCount++;
      return;
    }
    if (!validNodeIds.has(edge.target)) {
      logger.warn(`Edge target not found in nodes: ${edge.target}`);
      invalidEdgeCount++;
      return;
    }
    
    dagreGraph.setEdge(edge.source, edge.target, {
      // Weight affects edge routing
      weight: edge.data?.strength || 1,
    });
  });
  
  if (invalidEdgeCount > 0) {
    logger.warn(`Skipped ${invalidEdgeCount} invalid edges in dagre layout`);
  }
  
  // Run layout algorithm
  try {
    // Add safety check before layout
    if (dagreGraph.nodeCount() === 0) {
      logger.warn('No nodes in graph, skipping dagre layout');
      return applyFallbackLayout(nodes);
    }
    dagre.layout(dagreGraph);
  } catch (error) {
    logger.error('Dagre layout failed:', undefined, error instanceof Error ? error : new Error(String(error)));
    // Fall back to simple grid layout
    return applyFallbackLayout(nodes);
  }
  
  // Extract positions and apply to nodes
  const positionedNodes = nodes.map(node => {
    const dagreNode = dagreGraph.node(node.id);
    
    if (!dagreNode) {
      logger.warn(`Node ${node.id} not found in Dagre graph`);
      return node;
    }
    
    // Update node position
    return {
      ...node,
      position: {
        x: dagreNode.x - (dagreNode.width / 2),
        y: dagreNode.y - (dagreNode.height / 2),
      },
    };
  });
  
  // Center the graph if requested
  if (config.center) {
    return centerGraph(positionedNodes);
  }
  
  return positionedNodes;
}

// ============================================================================
// Layout Utilities
// ============================================================================

/**
 * Center the graph around origin (0, 0)
 */
function centerGraph(nodes: GraphNode[]): GraphNode[] {
  if (nodes.length === 0) return nodes;
  
  // Calculate bounding box
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x);
    maxY = Math.max(maxY, node.position.y);
  });
  
  // Calculate center offset
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // Apply offset to center the graph
  return nodes.map(node => ({
    ...node,
    position: {
      x: node.position.x - centerX,
      y: node.position.y - centerY,
    },
  }));
}

/**
 * Fallback grid layout if Dagre fails
 */
function applyFallbackLayout(nodes: GraphNode[]): GraphNode[] {
  const GRID_SPACING = 200;
  const COLUMNS = Math.ceil(Math.sqrt(nodes.length));
  
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: (index % COLUMNS) * GRID_SPACING,
      y: Math.floor(index / COLUMNS) * GRID_SPACING,
    },
  }));
}

/**
 * Group nodes by entity type for hierarchical layout
 */
export function groupNodesByType(nodes: GraphNode[]): Map<EntityType, GraphNode[]> {
  const groups = new Map<EntityType, GraphNode[]>();
  
  nodes.forEach(node => {
    const type = node.data.metadata.entityType;
    const group = groups.get(type) || [];
    group.push(node);
    groups.set(type, group);
  });
  
  return groups;
}

/**
 * Apply hierarchical layout with entity type layers
 * Used for Puzzle Focus View to create clear layers
 */
export function applyHierarchicalLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutConfig = LAYOUT_PRESETS.puzzleFocus
): GraphNode[] {
  // Group nodes by type
  const groups = groupNodesByType(nodes);
  
  // Define layer order for puzzle view
  const layerOrder: EntityType[] = ['element', 'puzzle', 'timeline', 'character'];
  
  // Create Dagre graph with rank constraints
  const dagreGraph = createDagreGraph(config);
  
  
  // Create a set of valid node IDs for quick lookup
  const validNodeIds = new Set(nodes.map(node => node.id));
  
  // Add nodes with rank constraints
  let nodesAdded = 0;
  layerOrder.forEach((type, layerIndex) => {
    const layerNodes = groups.get(type) || [];
    layerNodes.forEach(node => {
      const dimensions = getNodeDimensions(node);
      dagreGraph.setNode(node.id, {
        width: dimensions.width,
        height: dimensions.height,
        // Rank determines the layer
        rank: layerIndex,
      });
      nodesAdded++;
    });
  });
  
  logger.debug(`Added ${nodesAdded} nodes to dagre graph`);
  
  // Add edges - only if both source and target exist
  let invalidEdgeCount = 0;
  edges.forEach(edge => {
    if (!validNodeIds.has(edge.source)) {
      logger.warn(`Hierarchical edge source not found: ${edge.source}`);
      invalidEdgeCount++;
      return;
    }
    if (!validNodeIds.has(edge.target)) {
      logger.warn(`Hierarchical edge target not found: ${edge.target}`);
      invalidEdgeCount++;
      return;
    }
    
    dagreGraph.setEdge(edge.source, edge.target, {
      weight: edge.data?.strength || 1,
    });
  });
  
  if (invalidEdgeCount > 0) {
    logger.warn(`Skipped ${invalidEdgeCount} invalid edges in hierarchical layout`);
  }
  
  // Check if we have any nodes before running layout
  if (nodesAdded === 0) {
    logger.warn('No nodes added to dagre graph, returning empty layout');
    return nodes;
  }
  
  // Run layout
  try {
    // Add safety check before layout
    if (dagreGraph.nodeCount() === 0) {
      logger.warn('No nodes in hierarchical graph, skipping dagre layout');
      return applyFallbackLayout(nodes);
    }
    dagre.layout(dagreGraph);
  } catch (error) {
    logger.error('Hierarchical layout failed:', undefined, error instanceof Error ? error : new Error(String(error)));
    logger.error('Graph state:', undefined, new Error(`nodeCount: ${dagreGraph.nodeCount()}, edgeCount: ${dagreGraph.edgeCount()}`));
    return applyDagreLayout(nodes, edges, config); // Fall back to standard layout
  }
  
  // Extract positions
  const positionedNodes = nodes.map(node => {
    const dagreNode = dagreGraph.node(node.id);
    
    if (!dagreNode) {
      return node;
    }
    
    return {
      ...node,
      position: {
        x: dagreNode.x - (dagreNode.width / 2),
        y: dagreNode.y - (dagreNode.height / 2),
      },
    };
  });
  
  return config.center ? centerGraph(positionedNodes) : positionedNodes;
}

// ============================================================================
// Layout Analysis
// ============================================================================

/**
 * Apply smart grouping for puzzle chains
 * Groups parent and child puzzles together for better visual organization
 */
export function applyPuzzleChainGrouping(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutConfig = LAYOUT_PRESETS.puzzleFocus
): GraphNode[] {
  // Create Dagre graph with compound support
  const dagreGraph = createDagreGraph(config);
  
  // Map to track parent-child relationships
  const puzzleGroups = new Map<string, string[]>();
  const childToParent = new Map<string, string>();
  
  // Identify puzzle chains
  nodes.forEach(node => {
    if (node.data.metadata.entityType === 'puzzle') {
      const puzzle = node.data.entity;
      
      // If this is a parent puzzle, create a group
      if (puzzle.subPuzzleIds && puzzle.subPuzzleIds.length > 0) {
        puzzleGroups.set(node.id, puzzle.subPuzzleIds);
        
        // Create a compound node for the group
        dagreGraph.setNode(`group-${node.id}`, {
          width: 400,  // Group container width
          height: 300,  // Group container height
        });
      }
      
      // Track child-parent relationships
      if (puzzle.parentItemId) {
        childToParent.set(node.id, puzzle.parentItemId);
      }
    }
  });
  
  // Add nodes to Dagre with parent assignments
  nodes.forEach(node => {
    const dimensions = getNodeDimensions(node);
    const parentId = childToParent.get(node.id);
    
    dagreGraph.setNode(node.id, {
      width: dimensions.width,
      height: dimensions.height,
      // Assign to parent group if child puzzle
      parent: parentId ? `group-${parentId}` : undefined,
    });
  });
  
  // Add edges
  const validNodeIds = new Set(nodes.map(node => node.id));
  edges.forEach(edge => {
    if (validNodeIds.has(edge.source) && validNodeIds.has(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target, {
        weight: edge.data?.strength || 1,
      });
    }
  });
  
  // Run layout
  try {
    if (dagreGraph.nodeCount() === 0) {
      return applyFallbackLayout(nodes);
    }
    dagre.layout(dagreGraph);
  } catch (error) {
    logger.error('Puzzle chain grouping layout failed:', undefined, error instanceof Error ? error : new Error(String(error)));
    return applyDagreLayout(nodes, edges, config);
  }
  
  // Extract positions with group offsets
  const positionedNodes = nodes.map(node => {
    const dagreNode = dagreGraph.node(node.id);
    
    if (!dagreNode) {
      return node;
    }
    
    // Adjust position based on parent group if applicable
    let x = dagreNode.x - (dagreNode.width / 2);
    let y = dagreNode.y - (dagreNode.height / 2);
    
    const parentId = childToParent.get(node.id);
    if (parentId) {
      const parentGroup = dagreGraph.node(`group-${parentId}`);
      if (parentGroup) {
        // Offset child position within parent group
        x += parentGroup.x - (parentGroup.width / 2);
        y += parentGroup.y - (parentGroup.height / 2);
      }
    }
    
    return {
      ...node,
      position: { x, y },
    };
  });
  
  return config.center ? centerGraph(positionedNodes) : positionedNodes;
}

/**
 * Calculate layout metrics for debugging
 */
export function calculateLayoutMetrics(nodes: GraphNode[]) {
  if (nodes.length === 0) {
    return { width: 0, height: 0, density: 0, overlap: 0 };
  }
  
  // Bounding box
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x);
    maxY = Math.max(maxY, node.position.y);
  });
  
  const width = maxX - minX;
  const height = maxY - minY;
  const area = width * height;
  const density = nodes.length / (area / 10000); // Nodes per 100x100 area
  
  // Check for overlapping nodes (simple check)
  let overlap = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = Math.abs((nodes[i]?.position?.x ?? 0) - (nodes[j]?.position?.x ?? 0));
      const dy = Math.abs((nodes[i]?.position?.y ?? 0) - (nodes[j]?.position?.y ?? 0));
      
      // If nodes are too close, consider them overlapping
      if (dx < 50 && dy < 50) {
        overlap++;
      }
    }
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height),
    density: Math.round(density * 100) / 100,
    overlap,
  };
}