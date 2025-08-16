/**
 * Dagre Layout Configuration
 * Automatic graph layout using the Dagre algorithm
 * Handles horizontal and vertical layouts with different spacing options
 */

import dagre from 'dagre';
import type { GraphNode, GraphEdge, LayoutConfig, EntityType } from './types';

// ============================================================================
// Layout Configurations
// ============================================================================

/**
 * Predefined layout configurations for different views
 */
export const LAYOUT_PRESETS = {
  /**
   * Puzzle Focus View - Horizontal flow showing puzzle chains
   * Elements -> Puzzles -> Rewards -> Timeline
   */
  puzzleFocus: {
    direction: 'LR' as const,
    rankSeparation: 200,
    nodeSeparation: 50,
    center: true,
  },
  
  /**
   * Character Journey View - Vertical tree showing ownership
   * Character at top, owned items below
   */
  characterJourney: {
    direction: 'TB' as const,
    rankSeparation: 150,
    nodeSeparation: 75,
    center: true,
  },
  
  /**
   * Content Status View - Compact horizontal grouping
   * Groups by status with minimal spacing
   */
  contentStatus: {
    direction: 'LR' as const,
    rankSeparation: 100,
    nodeSeparation: 30,
    center: false,
  },
  
  /**
   * Default layout for general use
   */
  default: {
    direction: 'LR' as const,
    rankSeparation: 150,
    nodeSeparation: 50,
    center: true,
  },
} as const satisfies Record<string, LayoutConfig>;

// ============================================================================
// Node Size Configuration
// ============================================================================

/**
 * Default node dimensions by entity type
 * Used by Dagre to calculate spacing
 */
const NODE_DIMENSIONS: Record<EntityType, { width: number; height: number }> = {
  character: { width: 200, height: 80 },
  element: { width: 160, height: 60 },
  puzzle: { width: 140, height: 70 }, // Diamond shape needs more height
  timeline: { width: 120, height: 40 },
};

/**
 * Adjust dimensions based on node metadata
 */
function getNodeDimensions(node: GraphNode): { width: number; height: number } {
  const baseSize = NODE_DIMENSIONS[node.data.metadata.entityType];
  const visualSize = node.data.metadata.visualHints?.size;
  
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
 * Create and configure a Dagre graph instance
 */
function createDagreGraph(config: LayoutConfig): dagre.graphlib.Graph {
  const g = new dagre.graphlib.Graph();
  
  // Set graph options - simpler configuration to avoid issues
  g.setGraph({
    rankdir: config.direction,
    ranksep: config.rankSeparation,
    nodesep: config.nodeSeparation,
    marginx: 50,
    marginy: 50,
    // Removed advanced options that might cause issues
    // ranker: 'tight-tree', 
    // acyclicer: 'greedy',
  });
  
  // Default edge label (required by Dagre)
  g.setDefaultEdgeLabel(() => ({}));
  
  return g;
}

// ============================================================================
// Layout Application
// ============================================================================

/**
 * Apply Dagre layout to nodes and return positioned nodes
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
    console.warn('No nodes provided to dagre layout');
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
      console.warn(`Edge source not found in nodes: ${edge.source}`);
      invalidEdgeCount++;
      return;
    }
    if (!validNodeIds.has(edge.target)) {
      console.warn(`Edge target not found in nodes: ${edge.target}`);
      invalidEdgeCount++;
      return;
    }
    
    dagreGraph.setEdge(edge.source, edge.target, {
      // Weight affects edge routing
      weight: edge.data?.strength || 1,
    });
  });
  
  if (invalidEdgeCount > 0) {
    console.warn(`Skipped ${invalidEdgeCount} invalid edges in dagre layout`);
  }
  
  // Run layout algorithm
  try {
    // Add safety check before layout
    if (dagreGraph.nodeCount() === 0) {
      console.warn('No nodes in graph, skipping dagre layout');
      return applyFallbackLayout(nodes);
    }
    dagre.layout(dagreGraph);
  } catch (error) {
    console.error('Dagre layout failed:', error);
    // Fall back to simple grid layout
    return applyFallbackLayout(nodes);
  }
  
  // Extract positions and apply to nodes
  const positionedNodes = nodes.map(node => {
    const dagreNode = dagreGraph.node(node.id);
    
    if (!dagreNode) {
      console.warn(`Node ${node.id} not found in Dagre graph`);
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
  
  console.log(`Added ${nodesAdded} nodes to dagre graph`);
  
  // Add edges - only if both source and target exist
  let invalidEdgeCount = 0;
  edges.forEach(edge => {
    if (!validNodeIds.has(edge.source)) {
      console.warn(`Hierarchical edge source not found: ${edge.source}`);
      invalidEdgeCount++;
      return;
    }
    if (!validNodeIds.has(edge.target)) {
      console.warn(`Hierarchical edge target not found: ${edge.target}`);
      invalidEdgeCount++;
      return;
    }
    
    dagreGraph.setEdge(edge.source, edge.target, {
      weight: edge.data?.strength || 1,
    });
  });
  
  if (invalidEdgeCount > 0) {
    console.warn(`Skipped ${invalidEdgeCount} invalid edges in hierarchical layout`);
  }
  
  // Check if we have any nodes before running layout
  if (nodesAdded === 0) {
    console.warn('No nodes added to dagre graph, returning empty layout');
    return nodes;
  }
  
  // Run layout
  try {
    // Add safety check before layout
    if (dagreGraph.nodeCount() === 0) {
      console.warn('No nodes in hierarchical graph, skipping dagre layout');
      return applyFallbackLayout(nodes);
    }
    dagre.layout(dagreGraph);
  } catch (error) {
    console.error('Hierarchical layout failed:', error);
    console.error('Graph state:', {
      nodeCount: dagreGraph.nodeCount(),
      edgeCount: dagreGraph.edgeCount(),
      nodes: dagreGraph.nodes(),
      edges: dagreGraph.edges()
    });
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