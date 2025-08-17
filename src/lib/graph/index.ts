/**
 * @module graph/index
 * @description Main Graph Builder Module
 * 
 * Orchestrates the transformation of Notion data into React Flow graphs.
 * This module serves as the central hub for:
 * - Entity transformation (characters, elements, puzzles, timeline)
 * - Relationship resolution with integrity checking
 * - Layout application using pure Dagre with semantic ranking
 * 
 * @architecture
 * The graph building pipeline follows a multi-stage approach:
 * 1. Transform Notion entities → Graph nodes
 * 2. Resolve relationships → Graph edges with integrity checking
 * 3. Apply layout algorithm → Positioned nodes using pure Dagre
 * 4. Calculate metrics → Performance and quality measurements
 * 
 * @since Sprint 2 - Refactored to use pure Dagre layout
 * @author ALNRetool Team
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
  buildLookupMaps,
  type DataIntegrityReport
} from './relationships';

// Import layout functions
import { 
  applyDagreLayout, 
  applyHierarchicalLayout,
  calculateLayoutMetrics,
  LAYOUT_PRESETS 
} from './layouts';

// Import pure Dagre layout with semantic ranking
import { applyPureDagreLayout } from './pureDagreLayout';

// Parent-child resolver removed - handled by puzzle-centric layout

// Explicit exports per architecture principle: "No index.ts re-exports"
// Types are imported directly from './types' by consumers
// Only export runtime utilities here

// Pattern utilities
export { extractSFMetadata, hasSFPatterns } from './patterns';

// Layout utilities  
export { LAYOUT_PRESETS, applyDagreLayout, applyHierarchicalLayout } from './layouts';
export { applyPureDagreLayout } from './pureDagreLayout';

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
 * Transform all Notion entities to graph nodes
 * 
 * @function transformEntitiesToNodes
 * @description Converts raw Notion data into React Flow compatible nodes.
 * Each entity type has its own transformer that handles specific metadata
 * and enrichment with relational data from lookup maps.
 * 
 * @param {NotionData} data - Raw data from Notion API containing all entity types
 * 
 * @returns {Object} Transformation result
 * @returns {GraphNode[]} nodes - Array of transformed graph nodes
 * @returns {Object} metrics - Statistics about the transformation
 * @returns {Record<string, number>} metrics.byType - Node count by entity type
 * @returns {number} metrics.withErrors - Count of nodes with error states
 * @returns {number} metrics.withSFPatterns - Count of nodes with SF_ patterns
 * 
 * @internal
 * @complexity O(n) where n = total number of entities across all types
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
  
  // Build lookup maps for enriching nodes with relational data
  const lookupMaps = buildLookupMaps(
    data.characters,
    data.elements,
    data.puzzles,
    data.timeline
  );
  
  // Transform each entity type (passing lookup maps for enrichment)
  const characterNodes = transformCharacters(data.characters);
  const elementNodes = transformElements(data.elements, lookupMaps);
  const puzzleNodes = transformPuzzles(data.puzzles, lookupMaps);
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
 * Apply appropriate layout algorithm based on view type
 * 
 * @function applyLayout
 * @description Selects and applies the optimal layout algorithm for the current view.
 * Uses pure Dagre with semantic ranking for puzzle-focus view to achieve the
 * requirements→puzzles→rewards flow pattern. Falls back to standard layouts for other views.
 * 
 * @param {GraphNode[]} nodes - Nodes to position
 * @param {GraphEdge[]} edges - Edges defining relationships
 * @param {ViewType} [viewType] - Current view type determining layout strategy
 * 
 * @returns {GraphNode[]} Nodes with calculated positions
 * 
 * @layout-strategies
 * - puzzle-focus: Pure Dagre with LR direction and semantic ranking
 * - character-journey: Hierarchical layout with timeline emphasis
 * - content-status: Standard Dagre with status-based clustering
 * - default: Basic Dagre layout
 * 
 * @since Sprint 2 - Replaced hybrid layout with pure Dagre for puzzle-focus
 */
function applyLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  viewType?: ViewType
): GraphNode[] {
  const layoutConfig = getLayoutForView(viewType);
  
  console.log('Layout decision:', {
    viewType,
    nodeCount: nodes.length,
    edgeCount: edges.length
  });
  
  // Use pure Dagre layout for puzzle focus view
  // This creates the natural left-to-right flow: requirements → puzzles → rewards
  if (viewType === 'puzzle-focus') {
    console.log('[Layout] Using Pure Dagre with semantic ranking');
    return applyPureDagreLayout(nodes, edges, {
      direction: 'LR',
      rankSeparation: 300,      // Horizontal spacing between columns
      nodeSeparation: 100,      // Vertical spacing within columns
      puzzleSpacing: 300,       // Extra spacing for puzzle chains
      elementSpacing: 100,      // Standard element spacing
      useFractionalRanks: true, // Enable for dual-role elements
      optimizeEdgeCrossings: true, // Use network-simplex algorithm
    });
  }
  
  // Use hierarchical layout for character journey
  if (viewType === 'character-journey') {
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
 * 
 * @function buildGraphData
 * @description Main entry point for React components to transform Notion data into
 * a React Flow graph. Orchestrates the entire pipeline from entity transformation
 * through relationship resolution to layout application.
 * 
 * @param {NotionData} data - Raw data from Notion API
 * @param {Object} [options={}] - Configuration options
 * @param {ViewType} [options.viewType] - View type determining layout strategy
 * @param {RelationshipType[]} [options.filterRelationships] - Filter edges by type
 * @param {boolean} [options.includeOrphans=false] - Include unconnected nodes
 * @param {boolean} [options.enableIntegrityChecking=true] - Enable robust mode with placeholders
 * @param {string[]} [options.excludeEntityTypes] - Entity types to exclude from graph
 * 
 * @returns {GraphData & {integrityReport?: DataIntegrityReport}} Complete graph with optional integrity report
 * 
 * @pipeline
 * 1. Transform entities → nodes with metadata
 * 2. Filter by entity type if specified
 * 3. Resolve relationships → edges with integrity checking
 * 4. Filter edges by relationship type
 * 5. Create group nodes for puzzle chains (puzzle-focus only)
 * 6. Filter orphan nodes if requested
 * 7. Apply layout algorithm (pure Dagre for puzzle-focus)
 * 8. Calculate metrics and return
 * 
 * @example
 * ```typescript
 * const graphData = buildGraphData(notionData, {
 *   viewType: 'puzzle-focus',
 *   filterRelationships: ['requirement', 'reward'],
 *   includeOrphans: false
 * });
 * ```
 * 
 * @since Sprint 2 - Added pure Dagre layout support
 */
export function buildGraphData(
  data: NotionData,
  options: {
    viewType?: ViewType;
    filterRelationships?: RelationshipType[];
    includeOrphans?: boolean;
    enableIntegrityChecking?: boolean; // New option for robust mode
    excludeEntityTypes?: string[]; // Filter out specific entity types
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
  
  // Step 1.5: Filter out excluded entity types if specified
  let filteredNodes = allNodes;
  if (options.excludeEntityTypes && options.excludeEntityTypes.length > 0) {
    filteredNodes = allNodes.filter(node => 
      !options.excludeEntityTypes!.includes(node.data.metadata.entityType)
    );
    const filteredCount = allNodes.length - filteredNodes.length;
    if (filteredCount > 0) {
      console.log(`Filtered out ${filteredCount} nodes by entity type:`, options.excludeEntityTypes);
    }
  }
  
  // Step 2: Skip parent-child relationships for puzzle-centric layout
  // Puzzle-centric layout handles its own organization
  const nodesWithParents = filteredNodes;
  
  // Step 3: Resolve relationships to edges (with integrity checking if enabled)
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
  
  // Step 3.5: Create group nodes for puzzle chains (only in puzzle-focus view)
  const groupNodes: GraphNode[] = [];
  if (options.viewType === 'puzzle-focus') {
    // Find parent puzzles that have sub-puzzles
    const parentPuzzles = data.puzzles.filter(p => p.subPuzzleIds && p.subPuzzleIds.length > 0);
    
    parentPuzzles.forEach(parent => {
      // Create a group node for each puzzle chain
      const groupNode: GraphNode = {
        id: `group-${parent.id}`,
        type: 'group',
        position: { x: 0, y: 0 }, // Will be positioned by layout
        data: {
          entity: parent, // Pass the parent puzzle as entity
          metadata: {
            entityType: 'puzzle',
            visualHints: {
              size: 'large',
            },
          },
          label: `${parent.name} Chain`,
          chainStatus: parent.puzzleElementIds && parent.puzzleElementIds.length > 0 ? 'ready' : 'draft',
          childCount: parent.subPuzzleIds.length,
          width: 400,
          height: 300,
        } as any,
      };
      groupNodes.push(groupNode);
    });
    
    if (groupNodes.length > 0) {
      console.log(`Created ${groupNodes.length} group nodes for puzzle chains`);
    }
  }
  
  // Step 4: Combine regular nodes with placeholder and group nodes
  // Cast placeholder nodes to GraphNode since they follow the same Node interface
  const combinedNodes: (GraphNode | Node<PlaceholderNodeData>)[] = [...nodesWithParents, ...placeholderNodes, ...groupNodes];
  
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
    
    // For puzzle-focus views, preserve entire parent-child chains
    if (options.viewType === 'puzzle-focus') {
      // Helper function to preserve parent-child chains
      const preserveParentChildChain = (nodeId: string) => {
        const node = combinedNodes.find(n => n.id === nodeId);
        if (!node) return;
        
        connectedNodeIds.add(nodeId);
        
        // If node has a parent, preserve the parent too
        const parentId = (node as any).parentId;
        if (parentId && !connectedNodeIds.has(parentId)) {
          preserveParentChildChain(parentId);
        }
        
        // If node is a parent, preserve all its children
        const children = combinedNodes.filter(n => (n as any).parentId === nodeId);
        children.forEach(child => {
          if (!connectedNodeIds.has(child.id)) {
            connectedNodeIds.add(child.id);
          }
        });
      };
      
      // Apply parent-child preservation to all nodes with parent relationships
      combinedNodes.forEach(node => {
        const parentId = (node as any).parentId;
        const hasChildren = combinedNodes.some(n => (n as any).parentId === node.id);
        
        // If node is part of a parent-child relationship, preserve the chain
        if (parentId || hasChildren) {
          preserveParentChildChain(node.id);
        }
      });
    }
    
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
    excludeEntityTypes: ['timeline'], // Filter out timeline nodes for cleaner visualization
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