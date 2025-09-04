/**
 * @module dagre
 * @description Pure Dagre Layout with Semantic Ranking
 * 
 * This module provides a simplified graph layout algorithm that leverages Dagre's
 * natural optimization capabilities with semantic node ranking. It replaces the 
 * complex three-phase hybrid approach with a simpler, more maintainable solution.
 * 
 * The layout uses edge directions to naturally create a left-to-right flow:
 * - Requirements (elements) → Puzzles → Rewards (elements)
 * 
 * @example
 * ```typescript
 * const layoutedNodes = applyPureDagreLayout(nodes, edges, {
 *   direction: 'LR',
 *   puzzleSpacing: 300,
 *   elementSpacing: 100,
 *   optimizeEdgeCrossings: true
 * });
 * ```
 * 
 * @since Sprint 2 - Replaced hybrid puzzleCentricLayout
 * @author ALNRetool Team
 */

import dagre from 'dagre';
import type { GraphNode, GraphEdge } from '../types';
import { filterTimelineEdges } from '../filtering';
// Module imports removed in Phase 3 - using simplified inline implementations


/**
 * Configuration options for the pure Dagre layout algorithm
 * 
 * @interface PureDagreLayoutOptions
 * @property {('TB'|'LR')} [direction='LR'] - Layout direction: 'TB' (top-bottom) or 'LR' (left-right)
 * @property {number} [rankSeparation=300] - Horizontal spacing between ranks (columns)
 * @property {number} [nodeSeparation=100] - Vertical spacing between nodes in same rank
 * @property {boolean} [center=false] - Whether to center the graph in viewport
 * @property {number} [puzzleSpacing=300] - Horizontal spacing between puzzle ranks
 * @property {number} [elementSpacing=100] - Vertical spacing between elements
 * @property {boolean} [useFractionalRanks=true] - Enable fractional ranks for dual-role elements
 * @property {boolean} [optimizeEdgeCrossings=true] - Use network-simplex algorithm for edge crossing minimization
 * @property {boolean} [dynamicSpacing=false] - Enable dynamic spacing based on node type
 * @property {number} [tightElementSpacing=40] - Tight spacing for elements when dynamic spacing is enabled
 * @property {number} [adaptiveRankSeparation=false] - Calculate rank separation based on connected elements
 * @property {boolean} [clusterElements=false] - Apply post-layout clustering to group elements near puzzles
 */
export interface PureDagreLayoutOptions {
  direction?: 'TB' | 'LR';
  rankSeparation?: number;
  nodeSeparation?: number;
  center?: boolean;
  puzzleSpacing?: number;      // Horizontal spacing between puzzle ranks
  elementSpacing?: number;      // Vertical spacing between elements
  useFractionalRanks?: boolean; // Enable fractional ranks for dual-role elements
  optimizeEdgeCrossings?: boolean; // Use network-simplex for optimization
  dynamicSpacing?: boolean;    // Enable dynamic spacing based on node type
  tightElementSpacing?: number; // Tight spacing for elements when dynamic spacing
  adaptiveRankSeparation?: boolean; // Calculate rank separation based on connections
  clusterElements?: boolean;    // Post-layout element clustering
  alignSpecialNodes?: boolean;  // Align Characters with Puzzles and Timeline with Elements
  filterTimelineEdges?: boolean; // Filter Timeline edges based on visible entity types
}

/**
 * Default configuration values
 */
const DEFAULT_OPTIONS: Required<PureDagreLayoutOptions> = {
  direction: 'LR',
  rankSeparation: 300,
  nodeSeparation: 100,
  center: false,
  puzzleSpacing: 300,
  elementSpacing: 100,
  useFractionalRanks: true,
  optimizeEdgeCrossings: true,
  dynamicSpacing: false,
  tightElementSpacing: 40,
  adaptiveRankSeparation: false,
  clusterElements: false,
  alignSpecialNodes: false,
  filterTimelineEdges: false,
};

/**
 * Phase 4: Calculate adaptive rank separation based on node density
 * Adjusts spacing to prevent overcrowding and improve readability
 */
function calculateAdaptiveRankSeparation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: PureDagreLayoutOptions
): Required<PureDagreLayoutOptions> {
  // Group nodes by type to estimate rank distribution
  const nodesByType = new Map<string, GraphNode[]>();
  nodes.forEach(node => {
    const type = node.data.metadata.entityType;
    if (!nodesByType.has(type)) {
      nodesByType.set(type, []);
    }
    nodesByType.get(type)!.push(node);
  });

  // Analyze element-puzzle relationships for density estimation
  const puzzleElementMap = new Map<string, Set<string>>();
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;
    
    // Track elements connected to each puzzle
    if (edge.data?.relationshipType === 'requirement' || 
        edge.data?.relationshipType === 'reward') {
      const puzzleId = targetNode.data.metadata.entityType === 'puzzle' ? 
        targetNode.id : sourceNode.id;
      const elementId = sourceNode.data.metadata.entityType === 'element' ? 
        sourceNode.id : targetNode.id;
      
      if (!puzzleElementMap.has(puzzleId)) {
        puzzleElementMap.set(puzzleId, new Set());
      }
      puzzleElementMap.get(puzzleId)!.add(elementId);
    }
  });

  // Calculate density metrics
  const elementCount = nodesByType.get('element')?.length || 0;
  const puzzleCount = nodesByType.get('puzzle')?.length || 0;
  const timelineCount = nodesByType.get('timeline')?.length || 0;
  
  // Average elements per puzzle
  const avgElementsPerPuzzle = puzzleCount > 0 ? 
    Array.from(puzzleElementMap.values()).reduce((sum, set) => sum + set.size, 0) / puzzleCount : 0;
  
  // Calculate adaptive rank separation
  let adaptiveRankSeparation = config.rankSeparation || 300;
  
  // If we have high element density, increase rank separation
  if (avgElementsPerPuzzle > 5) {
    adaptiveRankSeparation = Math.max(400, adaptiveRankSeparation * 1.3);
    // logger.debug(`[Adaptive Spacing] High element density (${avgElementsPerPuzzle.toFixed(1)} per puzzle), increasing rank separation to ${adaptiveRankSeparation}`);
  } else if (avgElementsPerPuzzle > 3) {
    adaptiveRankSeparation = Math.max(350, adaptiveRankSeparation * 1.15);
    // logger.debug(`[Adaptive Spacing] Medium element density (${avgElementsPerPuzzle.toFixed(1)} per puzzle), increasing rank separation to ${adaptiveRankSeparation}`);
  } else {
    // logger.debug(`[Adaptive Spacing] Low element density (${avgElementsPerPuzzle.toFixed(1)} per puzzle), keeping rank separation at ${adaptiveRankSeparation}`);
  }
  
  // Adaptive node separation based on rank density
  let adaptiveNodeSeparation = config.nodeSeparation || 100;
  
  // Calculate maximum nodes in any rank (estimated)
  const maxRankSize = Math.max(elementCount, puzzleCount, timelineCount);
  
  if (maxRankSize > 10) {
    adaptiveNodeSeparation = Math.min(60, adaptiveNodeSeparation * 0.7);
    // logger.debug(`[Adaptive Spacing] High rank density (max ${maxRankSize} nodes), reducing node separation to ${adaptiveNodeSeparation}`);
  } else if (maxRankSize > 5) {
    adaptiveNodeSeparation = Math.min(80, adaptiveNodeSeparation * 0.85);
    // logger.debug(`[Adaptive Spacing] Medium rank density (max ${maxRankSize} nodes), reducing node separation to ${adaptiveNodeSeparation}`);
  } else {
    // logger.debug(`[Adaptive Spacing] Low rank density (max ${maxRankSize} nodes), keeping node separation at ${adaptiveNodeSeparation}`);
  }
  
  // Apply element-specific tighter spacing if dynamic spacing is enabled
  if (config.dynamicSpacing && config.tightElementSpacing) {
    // This will be applied later in the layout process
    // logger.debug(`[Adaptive Spacing] Dynamic element spacing enabled: ${config.tightElementSpacing}px`);
  }
  
  return {
    ...DEFAULT_OPTIONS,
    ...config,
    rankSeparation: adaptiveRankSeparation,
    nodeSeparation: adaptiveNodeSeparation,
    adaptiveRankSeparation: true, // Flag to indicate adaptive spacing was applied
  } as Required<PureDagreLayoutOptions>;
}


/**
 * Apply pure Dagre layout with semantic ranking to graph nodes
 * 
 * @function applyPureDagreLayout
 * @description Main entry point for the pure Dagre layout algorithm. Uses natural edge
 * flow to create semantic positioning where requirements flow into puzzles and rewards
 * flow out, creating a left-to-right narrative structure.
 * 
 * Algorithm strategy:
 * 1. Let Dagre handle layout naturally based on edge relationships
 * 2. Requirements flow INTO puzzles (element→puzzle edges)
 * 3. Rewards flow OUT OF puzzles (puzzle→element edges)
 * 4. This creates natural flow: requirements (left) → puzzles (center) → rewards (right)
 * 
 * @param {GraphNode[]} nodes - Array of graph nodes to position
 * @param {GraphEdge[]} edges - Array of edges defining relationships between nodes
 * @param {PureDagreLayoutOptions} [options={}] - Optional configuration overrides
 * 
 * @returns {GraphNode[]} Array of nodes with updated position coordinates
 * 
 * @complexity O(V + E) where V = nodes.length, E = edges.length
 * 
 * @example
 * ```typescript
 * const nodes = [...]; // Graph nodes
 * const edges = [...]; // Graph edges
 * const positioned = applyPureDagreLayout(nodes, edges, {
 *   direction: 'LR',
 *   optimizeEdgeCrossings: true
 * });
 * ```
 */
export function applyPureDagreLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: PureDagreLayoutOptions = {}
): GraphNode[] {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Removed debug logging for cleaner code
  
  // Create enhanced edges array for potential virtual edges
  let enhancedEdges = [...edges];
  
  // Add virtual alignment edges if enabled
  if (config.alignSpecialNodes) {
    let alignmentEdgesCreated = 0;
    
    // Build adjacency map for O(1) edge lookups
    const sourceToEdgeMap = new Map<string, GraphEdge[]>();
    edges.forEach(edge => {
      if (!sourceToEdgeMap.has(edge.source)) {
        sourceToEdgeMap.set(edge.source, []);
      }
      sourceToEdgeMap.get(edge.source)!.push(edge);
    });
    
    // Create node type map for O(1) entity type lookups
    const nodeTypeMap = new Map<string, string>();
    nodes.forEach(node => {
      nodeTypeMap.set(node.id, node.data.metadata.entityType);
    });
    
    // Create alignment edges for Characters to align with their Puzzles
    nodes.forEach(node => {
      if (node.data.metadata.entityType === 'character') {
        // Use adjacency map for O(1) lookup
        const characterEdges = sourceToEdgeMap.get(node.id) || [];
        
        // Find puzzles this character is connected to
        const connectedPuzzles = characterEdges
          .filter(e => e.data?.relationshipType === 'puzzle')
          .map(e => e.target);
        
        connectedPuzzles.forEach(puzzleId => {
          // Add bidirectional virtual edge to force same rank
          enhancedEdges.push({
            id: `align-char-${node.id}-${puzzleId}`,
            source: puzzleId,
            target: node.id,
            data: { 
              relationshipType: 'virtual-alignment-same-rank',
              weight: 100,
              label: 'char-align'
            }
          } as GraphEdge);
          alignmentEdgesCreated++;
        });
      }
      
      // Create alignment edges for Timeline events to align with their Elements
      if (node.data.metadata.entityType === 'timeline') {
        // Use adjacency map for O(1) lookup
        const timelineEdges = sourceToEdgeMap.get(node.id) || [];
        
        // Find elements connected to this timeline event
        const connectedElements = timelineEdges
          .filter(e => e.data?.relationshipType === 'timeline' && 
                      nodeTypeMap.get(e.target) === 'element')
          .map(e => e.target);
        
        connectedElements.forEach(elementId => {
          enhancedEdges.push({
            id: `align-timeline-${node.id}-${elementId}`,
            source: elementId,
            target: node.id,
            data: { 
              relationshipType: 'virtual-alignment-next-rank',
              weight: 100,
              label: 'timeline-align'
            }
          } as GraphEdge);
          alignmentEdgesCreated++;
        });
      }
    });
  }

  // Filter Timeline edges based on visible entity types
  if (config.filterTimelineEdges) {
    // Use the shared filtering utility
    enhancedEdges = filterTimelineEdges(enhancedEdges as any[], nodes, true) as GraphEdge[];
  }

  // Phase 4: Adaptive rank separation
  // Analyze node density to determine optimal rank separation
  const adaptiveConfig = calculateAdaptiveRankSeparation(nodes, edges, config);
  
  // Create and configure Dagre graph with adaptive settings
  const dagreGraph = createDagreGraph(adaptiveConfig);

  // Add all nodes to Dagre
  nodes.forEach(node => {
    const width = node.width || getNodeWidth(node);
    const height = node.height || getNodeHeight(node);
    
    dagreGraph.setNode(node.id, {
      width,
      height,
      label: node.data.label,
    });
  });

  // Add edges - the key is that edges already encode the semantic relationships!
  // Requirement edges: element -> puzzle (element is source, puzzle is target)
  // Reward edges: puzzle -> element (puzzle is source, element is target)
  // This naturally creates: requirements (left) -> puzzles (center) -> rewards (right)
  
  const nodeIds = new Set(nodes.map(n => n.id));
  let edgeCount = 0;
  let virtualEdgeCount = 0;
  
  
  enhancedEdges.forEach(edge => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      // Phase 3: Use smart edge weights from EdgeBuilder
      // Start with the pre-calculated weight from EdgeBuilder if available
      let weight = edge.data?.weight || 1;
      let minlen = 1;
      
      const relationshipType = edge.data?.relationshipType;
      
      // Special handling for virtual edges (these override smart weights)
      if (relationshipType === 'virtual-dependency') {
        weight = 1000; // EXTREMELY high weight to force ordering
        minlen = 1; // Standard spacing
        virtualEdgeCount++;
      } else if (relationshipType === 'puzzle-grouping') {
        weight = 500; // Medium-high weight for puzzle grouping
        minlen = 0; // Allow puzzles to be in same rank
        virtualEdgeCount++;
      } else if (relationshipType === 'virtual-alignment-same-rank') {
        weight = 100; // Strong but not overwhelming weight for alignment
        minlen = 0; // Key: allows same rank positioning for horizontal alignment
        virtualEdgeCount++;
      } else if (relationshipType === 'virtual-alignment-next-rank') {
        weight = 100; // Strong but not overwhelming weight for alignment
        minlen = 1; // Key: forces positioning in the next rank
        virtualEdgeCount++;
      } 
      // For regular edges, apply additional multipliers to smart weights
      else {
        // These multipliers stack with the smart weights from EdgeBuilder
        if (relationshipType === 'requirement') {
          weight *= 2; // Boost requirement edges (on top of smart weight)
          minlen = 1;
        } else if (relationshipType === 'reward') {
          weight *= 1.5; // Boost reward edges (on top of smart weight)
          minlen = 1;
        }
        
      }
      
      dagreGraph.setEdge(edge.source, edge.target, {
        weight,
        minlen,
        label: edge.data?.label,
      });
      edgeCount++;
    }
  });
  

  // Run Dagre layout
  try {
    dagre.layout(dagreGraph);
  } catch (error) {
    // logger.error('[Pure Dagre] Layout failed:', undefined, error instanceof Error ? error : new Error(String(error)));
    return nodes; // Return original nodes on failure
  }

  // Check positions of specific puzzles
  const queensNode = nodes.find(n => n.data.label?.includes('Queens/Sudoku'));
  const collabNode = nodes.find(n => n.data.label?.includes('Collab') && n.data.label?.includes('One Pagers'));
  
  if (queensNode && collabNode) {
    const queensDagreNode = dagreGraph.node(queensNode.id);
    const collabDagreNode = dagreGraph.node(collabNode.id);
    
    // logger.debug(`Queens/Sudoku position: x=${queensDagreNode?.x}, y=${queensDagreNode?.y}`);
    // logger.debug(`Collab One Pagers position: x=${collabDagreNode?.x}, y=${collabDagreNode?.y}`);
    
    // Check what edges are connected to these puzzles
    
    // Get all edges for Queens/Sudoku
    const queensIncoming = dagreGraph.inEdges(queensNode.id);
    const queensOutgoing = dagreGraph.outEdges(queensNode.id);
    
    // logger.debug(`Queens/Sudoku incoming edges (${queensIncoming?.length || 0}):`);
    queensIncoming?.forEach(e => {
      dagreGraph.edge(e);
    });
    
    // logger.debug(`Queens/Sudoku outgoing edges (${queensOutgoing?.length || 0}):`);
    queensOutgoing?.forEach(e => {
      dagreGraph.edge(e);
    });
    
    // Get all edges for Collab One Pagers
    const collabIncoming = dagreGraph.inEdges(collabNode.id);
    const collabOutgoing = dagreGraph.outEdges(collabNode.id);
    
    // logger.debug(`Collab One Pagers incoming edges (${collabIncoming?.length || 0}):`);
    collabIncoming?.forEach(() => {
      // Edge debugging - variables removed for unused warning cleanup
    });
    
    // logger.debug(`Collab One Pagers outgoing edges (${collabOutgoing?.length || 0}):`);
    collabOutgoing?.forEach(() => {
      // Edge debugging - variables removed for unused warning cleanup
    });
    
    if (queensDagreNode && collabDagreNode) {
      if (queensDagreNode.x > collabDagreNode.x) {
        // logger.error(`❌ LAYOUT ERROR: Queens/Sudoku (x=${queensDagreNode.x}) is to the RIGHT of Collab One Pagers (x=${collabDagreNode.x})`);
        // logger.debug('This violates the dependency ordering despite the virtual edge!');
      } else {
        // logger.debug(`✅ Correct ordering: Queens/Sudoku (x=${queensDagreNode.x}) is to the LEFT of Collab One Pagers (x=${collabDagreNode.x})`);
      }
    }
  }

  // Extract and apply positions
  let positionedNodes = extractPositions(nodes, dagreGraph);

  // Post-layout adjustment removed - alignment now handled entirely through virtual edges with proper minlen configuration


  // Element clustering removed in Phase 3

  // Log some metrics about the layout
  // const bounds = calculateBounds(positionedNodes);
  // logger.debug('[Pure Dagre] Layout complete:', undefined, {
  //   nodesPositioned: positionedNodes.length,
  //   bounds: {
  //     width: Math.round(bounds.maxX - bounds.minX),
  //     height: Math.round(bounds.maxY - bounds.minY),
  //   },
  //   dynamicSpacing: config.dynamicSpacing,
  //   clusteringApplied: config.clusterElements,
  // });
  
  // Layout quality metrics removed in Phase 3
  

  return positionedNodes;
}

/**
 * Create and configure Dagre graph instance with optimized settings
 * 
 * @function createDagreGraph
 * @description Initializes a new Dagre graph with configuration optimized for
 * puzzle-centric layouts. Sets up ranking algorithm, spacing, and alignment
 * to minimize edge crossings and create clear visual flow.
 * 
 * @param {Required<PureDagreLayoutOptions>} config - Complete configuration with defaults applied
 * 
 * @returns {dagre.graphlib.Graph} Configured Dagre graph instance ready for node/edge insertion
 * 
 * @internal
 * @complexity O(1) - Simple object initialization
 */
function createDagreGraph(
  config: Required<PureDagreLayoutOptions>
): dagre.graphlib.Graph {
  const g = new dagre.graphlib.Graph();
  
  // Calculate node separation based on dynamic spacing setting
  let nodeSeparation = config.elementSpacing;
  
  if (config.dynamicSpacing) {
    // Use tighter spacing for elements when dynamic spacing is enabled
    // This will be the default, and we'll override for puzzles later
    nodeSeparation = config.tightElementSpacing;
    // logger.debug('[Dynamic Spacing] Using tight element spacing:', undefined, nodeSeparation);
  }
  
  // Configure graph options for left-to-right flow
  g.setGraph({
    rankdir: 'LR', // Left to right
    ranksep: config.puzzleSpacing,
    nodesep: nodeSeparation,
    marginx: 50,
    marginy: 50,
    // Testing network-simplex for better optimization (was longest-path)
    ranker: 'network-simplex',
    // Align nodes to reduce edge crossings
    align: 'UR', // Top-Right alignment
  });
  
  g.setDefaultEdgeLabel(() => ({}));
  
  return g;
}

/**
 * Extract calculated positions from Dagre and apply to original nodes
 * 
 * @function extractPositions
 * @description Maps Dagre's calculated positions back to the original node objects,
 * converting from center-based to top-left corner positioning for React Flow compatibility.
 * 
 * @param {GraphNode[]} nodes - Original array of graph nodes
 * @param {dagre.graphlib.Graph} dagreGraph - Dagre graph with calculated positions
 * 
 * @returns {GraphNode[]} Nodes with updated position coordinates
 * 
 * @internal
 * @complexity O(n) where n = nodes.length
 */
function extractPositions(
  nodes: GraphNode[],
  dagreGraph: dagre.graphlib.Graph
): GraphNode[] {
  return nodes.map(node => {
    const dagreNode = dagreGraph.node(node.id);
    
    if (!dagreNode) {
      // logger.warn(`[Pure Dagre] No position calculated for node ${node.id}`);
      return node;
    }
    
    const width = node.width || getNodeWidth(node);
    const height = node.height || getNodeHeight(node);
    
    return {
      ...node,
      position: {
        x: dagreNode.x - width / 2,
        y: dagreNode.y - height / 2,
      },
      width,
      height,
    };
  });
}

/**
 * Calculate node width based on entity type
 * 
 * @function getNodeWidth
 * @description Determines the appropriate width for a node based on its entity type.
 * Puzzle nodes are widest to accommodate complexity, elements are medium-sized,
 * and characters/timeline events are more compact.
 * 
 * @param {GraphNode} node - The node to calculate width for
 * 
 * @returns {number} Width in pixels for the node
 * 
 * @internal
 * @complexity O(1) - Simple lookup operation
 * 
 * @example
 * ```typescript
 * const puzzleNode = { data: { metadata: { entityType: 'puzzle' } } };
 * const width = getNodeWidth(puzzleNode); // Returns 200
 * ```
 */
function getNodeWidth(node: GraphNode): number {
  const entityType = node.data.metadata.entityType;
  const baseWidths = {
    puzzle: 200,    // Larger for complex puzzle information
    element: 180,   // Medium size for story elements
    character: 160, // Compact for character nodes
    timeline: 160,  // Same as character for consistency
  };
  return baseWidths[entityType] || 160;
}

/**
 * Calculate node height based on entity type
 * 
 * @function getNodeHeight
 * @description Determines the appropriate height for a node based on its entity type.
 * All node types use consistent height for visual uniformity.
 * 
 * @param {GraphNode} node - The node to calculate height for
 * @returns {number} The height in pixels
 * 
 * @performance O(1) - Simple lookup operation
 * @complexity O(1) - Simple lookup operation
 * 
 * @example
 * ```typescript
 * const puzzleNode = { data: { metadata: { entityType: 'puzzle' } } };
 * const height = getNodeHeight(puzzleNode); // Returns 60
 * ```
 */
function getNodeHeight(node: GraphNode): number {
  const entityType = node.data.metadata.entityType;
  const baseHeights = {
    puzzle: 60,     // Standard height for readability
    element: 60,    // Same height for consistency
    character: 60,  // Same height for consistency
    timeline: 60,   // Same height for consistency
  };
  return baseHeights[entityType] || 60;
}

// /**
//  * Calculate bounding box of positioned nodes
//  * 
//  * @function calculateBounds
//  * @description Computes the minimum bounding rectangle that contains all nodes
//  * in the graph. Used for viewport calculations, centering, and layout metrics.
//  * 
//  * @param {GraphNode[]} nodes - Array of positioned nodes
//  * 
//  * @returns {Object} Bounding box coordinates
//  * @returns {number} minX - Leftmost x coordinate
//  * @returns {number} minY - Topmost y coordinate  
//  * @returns {number} maxX - Rightmost x coordinate
//  * @returns {number} maxY - Bottommost y coordinate
//  * 
//  * @internal
//  * @complexity O(n) where n = nodes.length
//  * 
//  * @example
//  * ```typescript
//  * const bounds = calculateBounds(positionedNodes);
//  * const graphWidth = bounds.maxX - bounds.minX;
//  * const graphHeight = bounds.maxY - bounds.minY;
//  * ```
//  */
// function calculateBounds(nodes: GraphNode[]): {
//   minX: number;
//   minY: number;
//   maxX: number;
//   maxY: number;
// } {
//   if (nodes.length === 0) {
//     return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
//   }
//   
//   let minX = Infinity;
//   let minY = Infinity;
//   let maxX = -Infinity;
//   let maxY = -Infinity;
//   
//   nodes.forEach(node => {
//     const x = node.position.x;
//     const y = node.position.y;
//     const width = node.width || 100;
//     const height = node.height || 50;
//     
//     minX = Math.min(minX, x);
//     minY = Math.min(minY, y);
//     maxX = Math.max(maxX, x + width);
//     maxY = Math.max(maxY, y + height);
//   });
//   
//   return { minX, minY, maxX, maxY };
// }


