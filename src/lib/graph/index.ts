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
  ViewType,
  RelationshipType,
  PlaceholderNodeData
} from './types';
import type { Node } from '@xyflow/react';

// Import transformers
import { transformCharacters } from './transformers/character';
import { transformElements } from './transformers/element';
import { transformPuzzles } from './transformers/puzzle';
import { transformTimelineEvents } from './transformers/timeline';

// Import relationship resolver
import { 
  resolveAllRelationships, 
  resolveRelationshipsWithIntegrity,
  filterEdgesByType,
  type DataIntegrityReport 
} from './relationships';

// Import layout functions
import { 
  applyDagreLayout, 
  applyHierarchicalLayout,
  calculateLayoutMetrics,
  LAYOUT_PRESETS 
} from './layouts';

// Explicit exports per architecture principle: "No index.ts re-exports"
// Types are imported directly from './types' by consumers
// Only export runtime utilities here

// Pattern utilities
export { extractSFMetadata, hasSFPatterns } from './patterns';

// Layout utilities  
export { LAYOUT_PRESETS, applyDagreLayout } from './layouts';

// Relationship utilities
export { filterEdgesByType, getConnectedEdges, calculateConnectivity } from './relationships';

// Type guards (runtime functions)
export { hasError, isEntityType } from './guards';

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
    filterRelationships?: RelationshipType[];
    includeOrphans?: boolean;
    enableIntegrityChecking?: boolean; // New option for robust mode
  } = {}
): GraphData & { integrityReport?: DataIntegrityReport } {
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
  
  // Step 2: Resolve relationships to edges (with integrity checking if enabled)
  let allEdges: GraphEdge[];
  let placeholderNodes: Node<PlaceholderNodeData>[] = [];
  let integrityReport: DataIntegrityReport | undefined;
  
  if (options.enableIntegrityChecking !== false) { // Default to true for robustness
    const integrityResult = resolveRelationshipsWithIntegrity(
      data.characters,
      data.elements,
      data.puzzles,
      data.timeline
    );
    allEdges = integrityResult.edges;
    placeholderNodes = integrityResult.placeholderNodes;
    integrityReport = integrityResult.report;
    
    // Add warnings for missing entities
    if (integrityResult.report.missingEntities.size > 0) {
      warnings.push(`Found ${integrityResult.report.missingEntities.size} missing entities`);
    }
    if (integrityResult.report.brokenRelationships > 0) {
      warnings.push(`Found ${integrityResult.report.brokenRelationships} broken relationships`);
    }
  } else {
    // Use original resolution for backward compatibility
    allEdges = resolveAllRelationships(
      data.characters,
      data.elements,
      data.puzzles,
      data.timeline
    );
  }
  
  // Step 3: Filter edges by relationship type if requested
  let filteredByTypeEdges = allEdges;
  if (options.filterRelationships && options.filterRelationships.length > 0) {
    filteredByTypeEdges = filterEdgesByType(
      allEdges, 
      options.filterRelationships
    );
    console.log(`Filtered edges by type from ${allEdges.length} to ${filteredByTypeEdges.length}`);
  }
  
  // Step 4: Combine regular nodes with placeholder nodes
  // Cast placeholder nodes to GraphNode since they follow the same Node interface
  const combinedNodes: (GraphNode | Node<PlaceholderNodeData>)[] = [...allNodes, ...placeholderNodes];
  
  // Step 5: Determine which nodes to keep based on orphan filtering
  let nodesToKeep: (GraphNode | Node<PlaceholderNodeData>)[] = combinedNodes;
  if (!options.includeOrphans) {
    // Find nodes that are connected by edges
    const connectedNodeIds = new Set<string>();
    filteredByTypeEdges.forEach(edge => {
      // Check if source and target nodes exist before marking as connected
      if (combinedNodes.some(n => n.id === edge.source)) {
        connectedNodeIds.add(edge.source);
      }
      if (combinedNodes.some(n => n.id === edge.target)) {
        connectedNodeIds.add(edge.target);
      }
    });
    
    const orphanCount = nodesToKeep.length;
    nodesToKeep = nodesToKeep.filter(node => connectedNodeIds.has(node.id));
    const removedCount = orphanCount - nodesToKeep.length;
    
    if (removedCount > 0) {
      console.log(`Removed ${removedCount} orphan nodes (including placeholders)`);
    }
  }
  
  // Step 6: Filter edges to only include those between kept nodes
  const keptNodeIds = new Set(nodesToKeep.map(n => n.id));
  const finalEdges = filteredByTypeEdges.filter(edge => {
    const sourceExists = keptNodeIds.has(edge.source);
    const targetExists = keptNodeIds.has(edge.target);
    
    if (!sourceExists || !targetExists) {
      // This is expected when orphan nodes are filtered out
      return false;
    }
    
    return true;
  });
  
  if (finalEdges.length < filteredByTypeEdges.length) {
    const droppedCount = filteredByTypeEdges.length - finalEdges.length;
    console.log(`Dropped ${droppedCount} edges due to node filtering`);
  }
  
  // Step 7: Apply layout
  // Cast to GraphNode[] for layout (they all follow Node interface)
  const positionedNodes = applyLayout(
    nodesToKeep as GraphNode[],
    finalEdges,
    options.viewType
  );
  
  // Step 8: Calculate metrics
  const endTime = performance.now();
  const layoutMetrics = calculateLayoutMetrics(positionedNodes);
  
  const metrics: TransformationMetrics = {
    startTime,
    endTime,
    duration: endTime - startTime,
    nodeCount: positionedNodes.length,
    edgeCount: finalEdges.length,
    layoutMetrics,
    warnings,
  };
  
  console.log('Graph build complete:', {
    duration: `${metrics.duration.toFixed(2)}ms`,
    nodes: metrics.nodeCount,
    edges: metrics.edgeCount,
    layout: metrics.layoutMetrics,
    placeholders: placeholderNodes.length,
    integrityScore: integrityReport?.integrityScore,
  });
  console.groupEnd();
  
  // Return complete graph data with integrity report
  const result: GraphData & { integrityReport?: DataIntegrityReport } = {
    nodes: positionedNodes,
    edges: finalEdges,
    metadata: {
      metrics,
      viewType: options.viewType,
      timestamp: new Date().toISOString(),
    },
  };
  
  if (integrityReport) {
    result.integrityReport = integrityReport;
  }
  
  return result;
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
        }
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