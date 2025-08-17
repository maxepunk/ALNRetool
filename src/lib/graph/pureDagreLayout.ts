/**
 * @module pureDagreLayout
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
import type { GraphNode, GraphEdge } from './types';

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
};

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
  
  console.group('[Pure Dagre] Applying layout with natural flow');
  console.log('Configuration:', config);
  console.log('Input:', { nodes: nodes.length, edges: edges.length });

  // Create and configure Dagre graph
  const dagreGraph = createDagreGraph(config);

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
  
  edges.forEach(edge => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      // Adjust edge weight based on relationship type for better layout
      let weight = 1;
      let minlen = 1;
      
      const relationshipType = edge.data?.relationshipType;
      if (relationshipType === 'requirement') {
        weight = 10; // High weight for requirement edges
        minlen = 1;
      } else if (relationshipType === 'reward') {
        weight = 10; // High weight for reward edges
        minlen = 1;
      } else if (relationshipType === 'chain') {
        weight = 100; // Very high weight for puzzle chains
        minlen = 2; // Extra spacing between chained puzzles
      }
      
      dagreGraph.setEdge(edge.source, edge.target, {
        weight,
        minlen,
        label: edge.data?.label,
      });
      edgeCount++;
    }
  });
  
  console.log(`Added ${edgeCount} edges to Dagre graph`);

  // Run Dagre layout
  try {
    dagre.layout(dagreGraph);
  } catch (error) {
    console.error('[Pure Dagre] Layout failed:', error);
    return nodes; // Return original nodes on failure
  }

  // Extract and apply positions
  const positionedNodes = extractPositions(nodes, dagreGraph);

  // Log some metrics about the layout
  const bounds = calculateBounds(positionedNodes);
  console.log('[Pure Dagre] Layout complete:', {
    nodesPositioned: positionedNodes.length,
    bounds: {
      width: Math.round(bounds.maxX - bounds.minX),
      height: Math.round(bounds.maxY - bounds.minY),
    },
  });
  console.groupEnd();

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
function createDagreGraph(config: Required<PureDagreLayoutOptions>): dagre.graphlib.Graph {
  const g = new dagre.graphlib.Graph();
  
  // Configure graph options for left-to-right flow
  g.setGraph({
    rankdir: 'LR', // Left to right
    ranksep: config.puzzleSpacing,
    nodesep: config.elementSpacing,
    marginx: 50,
    marginy: 50,
    // Use network-simplex for better edge crossing minimization
    ranker: config.optimizeEdgeCrossings ? 'network-simplex' : 'longest-path',
    // Align nodes to reduce edge crossings
    align: 'DL', // Down-Left alignment
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
      console.warn(`[Pure Dagre] No position calculated for node ${node.id}`);
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
 * Heights are proportional to typical content density, with puzzles being tallest
 * to display dependencies and rewards.
 * 
 * @param {GraphNode} node - The node to calculate height for
 * 
 * @returns {number} Height in pixels for the node
 * 
 * @internal
 * @complexity O(1) - Simple lookup operation
 * 
 * @example
 * ```typescript
 * const elementNode = { data: { metadata: { entityType: 'element' } } };
 * const height = getNodeHeight(elementNode); // Returns 80
 * ```
 */
function getNodeHeight(node: GraphNode): number {
  const entityType = node.data.metadata.entityType;
  const baseHeights = {
    puzzle: 120,    // Taller to show puzzle complexity
    element: 80,    // Standard height for elements
    character: 100, // Medium height for character info
    timeline: 80,   // Compact for timeline events
  };
  return baseHeights[entityType] || 80;
}

/**
 * Calculate bounding box of positioned nodes
 * 
 * @function calculateBounds
 * @description Computes the minimum bounding rectangle that contains all nodes
 * in the graph. Used for viewport calculations, centering, and layout metrics.
 * 
 * @param {GraphNode[]} nodes - Array of positioned nodes
 * 
 * @returns {Object} Bounding box coordinates
 * @returns {number} minX - Leftmost x coordinate
 * @returns {number} minY - Topmost y coordinate  
 * @returns {number} maxX - Rightmost x coordinate
 * @returns {number} maxY - Bottommost y coordinate
 * 
 * @internal
 * @complexity O(n) where n = nodes.length
 * 
 * @example
 * ```typescript
 * const bounds = calculateBounds(positionedNodes);
 * const graphWidth = bounds.maxX - bounds.minX;
 * const graphHeight = bounds.maxY - bounds.minY;
 * ```
 */
function calculateBounds(nodes: GraphNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  nodes.forEach(node => {
    const x = node.position.x;
    const y = node.position.y;
    const width = node.width || 100;
    const height = node.height || 50;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });
  
  return { minX, minY, maxX, maxY };
}

