/**
 * Main Graph Builder
 * Orchestrates transformation of Notion data into React Flow graph
 * Combines entity transformers, relationship resolution, and layout
 */

import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent 
} from '@/types/notion/app';
import type { 
  GraphNode, 
  GraphEdge, 
  GraphData,
  LayoutConfig,
  ViewType
} from './types';

// Import transformers
import { transformCharacters } from './transformers/character';
import { transformElements } from './transformers/element';
import { transformPuzzles } from './transformers/puzzle';
import { transformTimelineEvents } from './transformers/timeline';

// Import relationship resolver
import { resolveAllRelationships, filterEdgesByType } from './relationships';

// Import layout functions
import { 
  applyDagreLayout, 
  applyHierarchicalLayout,
  calculateLayoutMetrics,
  LAYOUT_PRESETS 
} from './layouts';

// Re-export types and utilities for consumers
export * from './types';
export { extractSFMetadata, hasSFPatterns } from './patterns';
export { LAYOUT_PRESETS, applyDagreLayout } from './layouts';
export { filterEdgesByType, getConnectedEdges, calculateConnectivity } from './relationships';

// ============================================================================
// Main Data Structure
// ============================================================================

/**
 * Input data from Notion API (via React Query)
 */
export interface NotionData {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
}

/**
 * Performance metrics for debugging
 */
export interface TransformationMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  nodeCount: number;
  edgeCount: number;
  layoutMetrics: ReturnType<typeof calculateLayoutMetrics>;
  warnings: string[];
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform all entities to nodes
 */
function transformEntitiesToNodes(data: NotionData): {
  nodes: GraphNode[];
  metrics: { 
    byType: Record<string, number>;
    withErrors: number;
    withSFPatterns: number;
  };
} {
  console.group('Transforming entities to nodes');
  
  // Transform each entity type
  const characterNodes = transformCharacters(data.characters);
  const elementNodes = transformElements(data.elements);
  const puzzleNodes = transformPuzzles(data.puzzles);
  const timelineNodes = transformTimelineEvents(data.timeline);
  
  // Combine all nodes
  const allNodes: GraphNode[] = [
    ...characterNodes,
    ...elementNodes,
    ...puzzleNodes,
    ...timelineNodes,
  ];
  
  // Calculate metrics
  const metrics = {
    byType: {
      character: characterNodes.length,
      element: elementNodes.length,
      puzzle: puzzleNodes.length,
      timeline: timelineNodes.length,
    },
    withErrors: allNodes.filter(n => n.data.metadata.errorState).length,
    withSFPatterns: allNodes.filter(n => n.data.metadata.sfPatterns).length,
  };
  
  console.log('Node transformation complete:', metrics);
  console.groupEnd();
  
  return { nodes: allNodes, metrics };
}

// ============================================================================
// Layout Selection
// ============================================================================

/**
 * Get layout configuration for a specific view type
 */
function getLayoutForView(viewType?: ViewType): LayoutConfig {
  if (!viewType) return LAYOUT_PRESETS.default;
  
  switch (viewType) {
    case 'puzzle-focus':
      return LAYOUT_PRESETS.puzzleFocus;
    case 'character-journey':
      return LAYOUT_PRESETS.characterJourney;
    case 'content-status':
      return LAYOUT_PRESETS.contentStatus;
    default:
      return LAYOUT_PRESETS.default;
  }
}

/**
 * Apply appropriate layout based on view type and node count
 */
function applyLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  viewType?: ViewType
): GraphNode[] {
  const layoutConfig = getLayoutForView(viewType);
  
  // Use hierarchical layout for puzzle focus view
  if (viewType === 'puzzle-focus') {
    return applyHierarchicalLayout(nodes, edges, layoutConfig);
  }
  
  // Use standard Dagre layout for other views
  return applyDagreLayout(nodes, edges, layoutConfig);
}

// ============================================================================
// Main Builder Function
// ============================================================================

/**
 * Build complete graph data from Notion entities
 * This is the main entry point for React components
 */
export function buildGraphData(
  data: NotionData,
  options: {
    viewType?: ViewType;
    filterRelationships?: string[];
    includeOrphans?: boolean;
  } = {}
): GraphData {
  const startTime = performance.now();
  const warnings: string[] = [];
  
  console.group('Building graph data');
  console.log('Input data:', {
    characters: data.characters.length,
    elements: data.elements.length,
    puzzles: data.puzzles.length,
    timeline: data.timeline.length,
  });
  console.log('Options:', options);
  
  // Step 1: Transform entities to nodes
  const { nodes: allNodes } = transformEntitiesToNodes(data);
  
  if (allNodes.length === 0) {
    console.warn('No nodes created from input data');
    warnings.push('No nodes created from input data');
  }
  
  // Step 2: Resolve relationships to edges
  const allEdges = resolveAllRelationships(
    data.characters,
    data.elements,
    data.puzzles,
    data.timeline
  );
  
  // Step 3: Filter edges if requested
  let filteredEdges = allEdges;
  if (options.filterRelationships && options.filterRelationships.length > 0) {
    filteredEdges = filterEdgesByType(
      allEdges, 
      options.filterRelationships as any
    );
    console.log(`Filtered edges from ${allEdges.length} to ${filteredEdges.length}`);
  }
  
  // Step 4: Filter orphan nodes if requested
  let filteredNodes = allNodes;
  if (!options.includeOrphans) {
    const connectedNodeIds = new Set<string>();
    filteredEdges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    const orphanCount = filteredNodes.length;
    filteredNodes = filteredNodes.filter(node => connectedNodeIds.has(node.id));
    const removedCount = orphanCount - filteredNodes.length;
    
    if (removedCount > 0) {
      console.log(`Removed ${removedCount} orphan nodes`);
    }
  }
  
  // Step 5: Apply layout
  const positionedNodes = applyLayout(
    filteredNodes,
    filteredEdges,
    options.viewType
  );
  
  // Step 6: Calculate metrics
  const endTime = performance.now();
  const layoutMetrics = calculateLayoutMetrics(positionedNodes);
  
  const metrics: TransformationMetrics = {
    startTime,
    endTime,
    duration: endTime - startTime,
    nodeCount: positionedNodes.length,
    edgeCount: filteredEdges.length,
    layoutMetrics,
    warnings,
  };
  
  console.log('Graph build complete:', {
    duration: `${metrics.duration.toFixed(2)}ms`,
    nodes: metrics.nodeCount,
    edges: metrics.edgeCount,
    layout: metrics.layoutMetrics,
  });
  console.groupEnd();
  
  // Return complete graph data
  return {
    nodes: positionedNodes,
    edges: filteredEdges,
    metadata: {
      metrics,
      viewType: options.viewType,
      timestamp: new Date().toISOString(),
    },
  };
}

// Export buildGraph as an alias for buildGraphData for backwards compatibility
export const buildGraph = buildGraphData;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create an empty graph
 */
export function createEmptyGraph(): GraphData {
  return {
    nodes: [],
    edges: [],
    metadata: {
      metrics: {
        startTime: 0,
        endTime: 0,
        duration: 0,
        nodeCount: 0,
        edgeCount: 0,
        layoutMetrics: {
          width: 0,
          height: 0,
          density: 0,
          overlap: 0,
        },
        warnings: [],
      },
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Validate graph data structure
 */
export function validateGraphData(data: GraphData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check nodes
  if (!Array.isArray(data.nodes)) {
    errors.push('Nodes must be an array');
  } else {
    data.nodes.forEach((node, i) => {
      if (!node.id) errors.push(`Node at index ${i} missing ID`);
      if (!node.position) {
        errors.push(`Node ${node.id} missing position`);
      } else if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        errors.push(`Node ${node.id} has invalid position`);
      }
    });
  }
  
  // Check edges
  if (!Array.isArray(data.edges)) {
    errors.push('Edges must be an array');
  } else {
    const nodeIds = new Set(data.nodes.map(n => n.id));
    data.edges.forEach((edge, i) => {
      if (!edge.id) errors.push(`Edge at index ${i} missing ID`);
      if (!edge.source) errors.push(`Edge ${edge.id} missing source`);
      if (!edge.target) errors.push(`Edge ${edge.id} missing target`);
      
      // Check if source and target nodes exist
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

/**
 * Get summary statistics for a graph
 */
export function getGraphStatistics(data: GraphData) {
  const nodesByType = new Map<string, number>();
  const edgesByType = new Map<string, number>();
  
  // Count nodes by type
  data.nodes.forEach(node => {
    const type = node.data.metadata.entityType;
    nodesByType.set(type, (nodesByType.get(type) || 0) + 1);
  });
  
  // Count edges by type
  data.edges.forEach(edge => {
    const type = edge.data?.relationshipType || 'unknown';
    edgesByType.set(type, (edgesByType.get(type) || 0) + 1);
  });
  
  // Calculate connectivity
  const avgConnectivity = data.nodes.length > 0
    ? (data.edges.length * 2) / data.nodes.length
    : 0;
  
  return {
    totalNodes: data.nodes.length,
    totalEdges: data.edges.length,
    nodesByType: Object.fromEntries(nodesByType),
    edgesByType: Object.fromEntries(edgesByType),
    avgConnectivity: Math.round(avgConnectivity * 100) / 100,
    hasOrphans: data.nodes.some(node => {
      const hasConnection = data.edges.some(edge => 
        edge.source === node.id || edge.target === node.id
      );
      return !hasConnection;
    }),
  };
}

// ============================================================================
// Export Convenience Functions
// ============================================================================

/**
 * Build a graph for the Puzzle Focus View
 */
export function buildPuzzleFocusGraph(data: NotionData): GraphData {
  return buildGraphData(data, {
    viewType: 'puzzle-focus',
    filterRelationships: ['requirement', 'reward', 'chain'],
    includeOrphans: false,
  });
}

/**
 * Build a graph for the Character Journey View
 */
export function buildCharacterJourneyGraph(data: NotionData): GraphData {
  return buildGraphData(data, {
    viewType: 'character-journey',
    filterRelationships: ['ownership', 'timeline'],
    includeOrphans: false,
  });
}

/**
 * Build a graph for the Content Status View
 */
export function buildContentStatusGraph(data: NotionData): GraphData {
  return buildGraphData(data, {
    viewType: 'content-status',
    includeOrphans: true, // Show all content regardless of connections
  });
}