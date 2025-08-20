/**
 * @module graph/index
 * @description Facade for Graph Module
 * 
 * This file provides backward compatibility while delegating to the new modular architecture.
 * All functionality has been decomposed into single-responsibility modules:
 * - EntityTransformer: Handles entity-to-node transformations
 * - GraphBuilder: Orchestrates graph construction
 * - LayoutOrchestrator: Manages layout algorithms
 * - MetricsCalculator: Computes graph metrics
 * - GraphUtilities: Provides utility functions
 * 
 * @architecture Refactored in Sprint 2 Phase 1 - Monolith decomposition
 * @author ALNRetool Team
 */

// Import modular components
import { entityTransformer } from './modules/EntityTransformer';
import { graphBuilder } from './modules/GraphBuilder';
import { layoutOrchestrator } from './modules/LayoutOrchestrator';
import { metricsCalculator } from './modules/MetricsCalculator';
import { graphUtilities } from './modules/GraphUtilities';

// Import types needed for functions
import type { GraphData, GraphNode, GraphEdge } from './types';

// Re-export types for convenience
export type {
  GraphNode,
  GraphEdge,
  GraphData,
  GraphNodeData,
  ViewType,
  EntityType,
  RelationshipType,
  BuildGraphOptions,
  LayoutConfig,
  GraphMetrics,
  NodeMetadata,
  SFMetadata,
  EntityLookupMaps,
  VisualHints,
  PlaceholderNodeData
} from './types';

// Re-export NotionData and NotionEntity from types
export type { NotionData, NotionEntity } from './types';

// Re-export entity types from notion/app  
export type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

// Re-export type guards
export {
  isGraphNode,
  isGraphEdge,
  isEntityType,
  isRelationshipType
} from './types';

// Import and re-export existing utilities
export { extractSFMetadata, hasSFPatterns } from './patterns';
export { LAYOUT_PRESETS } from './layouts';
export { filterEdgesByType, getConnectedEdges, calculateConnectivity } from './relationships';
export { hasError, isEntityType as isEntity } from './guards';

// ============================================================================
// Facade Functions - Maintain backward compatibility
// ============================================================================

/**
 * Build complete graph data from Notion entities
 * Delegates to GraphBuilder module
 */
export function buildGraphData(data: any, options: any = {}) {
  return graphBuilder.buildGraphData(data, options);
}

// Alias for backward compatibility
export const buildGraph = buildGraphData;

/**
 * Build a graph for the Puzzle Focus View
 * Delegates to GraphBuilder module
 */
export function buildPuzzleFocusGraph(data: any) {
  return graphBuilder.buildPuzzleFocusGraph(data);
}

/**
 * Build a graph for the Character Journey View
 * Delegates to GraphBuilder module
 */
export function buildCharacterJourneyGraph(data: any, characterId?: string, filters?: any) {
  return graphBuilder.buildCharacterJourneyGraph(data, characterId, filters);
}

/**
 * Build full connection web graph using BFS traversal
 * Shows ALL transitive connections from a starting character
 * Delegates to GraphBuilder module
 */
export function buildFullConnectionGraph(
  data: any, 
  characterId: string,
  options?: { maxDepth?: number; maxNodes?: number; expandedNodes?: Set<string> }
) {
  return graphBuilder.buildFullConnectionGraph(data, characterId, options);
}

/**
 * Build a graph for the Content Status View
 * Delegates to GraphBuilder module
 */
export function buildContentStatusGraph(data: any) {
  return graphBuilder.buildContentStatusGraph(data);
}

/**
 * Apply layout to a graph
 * Delegates to LayoutOrchestrator module
 */
export function applyLayout(nodes: any[], edges: any[], viewType?: any) {
  const graph = { nodes, edges };
  const config = layoutOrchestrator.getLayoutForView(viewType);
  const result = layoutOrchestrator.applyLayout(graph, config);
  return result.nodes;
}

/**
 * Apply Dagre layout
 * Delegates to LayoutOrchestrator module
 */
export function applyDagreLayout(nodes: any[], edges: any[], config?: any) {
  const graph = { nodes, edges };
  const result = layoutOrchestrator.applyDagreLayout(graph, config);
  return result.nodes;
}

/**
 * Apply pure Dagre layout
 * Delegates to LayoutOrchestrator module
 */
export function applyPureDagreLayout(nodes: any[], edges: any[], config?: any) {
  const graph = { nodes, edges };
  const result = layoutOrchestrator.applyPureDagreLayout(graph, config);
  return result.nodes;
}

/**
 * Transform entities to nodes
 * Delegates to EntityTransformer module
 */
export function transformEntitiesToNodes(data: any) {
  const nodes = entityTransformer.transformEntities(data);
  
  // Calculate metrics for backward compatibility
  const metrics = {
    byType: {
      character: nodes.filter(n => n.data.metadata.entityType === 'character').length,
      element: nodes.filter(n => n.data.metadata.entityType === 'element').length,
      puzzle: nodes.filter(n => n.data.metadata.entityType === 'puzzle').length,
      timeline: nodes.filter(n => n.data.metadata.entityType === 'timeline').length,
    },
    withErrors: nodes.filter(n => n.data.metadata.errorState).length,
    withSFPatterns: nodes.filter(n => n.data.metadata.sfPatterns).length,
  };
  
  return { nodes, metrics };
}

/**
 * Calculate graph metrics
 * Delegates to MetricsCalculator module
 */
export function calculateMetrics(graph: any) {
  return metricsCalculator.calculateMetrics(graph);
}

/**
 * Get graph statistics
 * Delegates to MetricsCalculator module
 */
export function getGraphStatistics(data: any) {
  const metrics = metricsCalculator.calculateMetrics(data);
  
  return {
    totalNodes: metrics.nodeCount,
    totalEdges: metrics.edgeCount,
    nodesByType: metrics.entityCounts,
    edgesByType: metrics.relationshipCounts,
    avgConnectivity: metrics.avgDegree,
    hasOrphans: metrics.orphanCount > 0,
  };
}

/**
 * Validate graph data structure
 * Delegates to GraphUtilities module
 */
export function validateGraphData(data: any) {
  return graphUtilities.validateGraph(data);
}

/**
 * Create an empty graph
 */
export function createEmptyGraph(): GraphData {
  return {
    nodes: [] as GraphNode[],
    edges: [] as GraphEdge[],
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
 * Find node by ID
 * Delegates to GraphUtilities module
 */
export function findNodeById(nodes: any[], id: string) {
  return graphUtilities.findNodeById(nodes, id);
}

/**
 * Find orphan nodes
 * Delegates to GraphUtilities module
 */
export function findOrphans(graph: any) {
  return graphUtilities.findOrphans(graph);
}

/**
 * Get connected nodes
 * Delegates to GraphUtilities module
 */
export function getConnectedNodes(node: any, graph: any) {
  return graphUtilities.getConnectedNodes(node, graph);
}

/**
 * Detect cycles in graph
 * Delegates to GraphUtilities module
 */
export function detectCycles(graph: any) {
  return graphUtilities.detectCycles(graph);
}

/**
 * Topological sort
 * Delegates to GraphUtilities module
 */
export function topologicalSort(graph: any) {
  return graphUtilities.topologicalSort(graph);
}

/**
 * Merge multiple graphs
 * Delegates to GraphUtilities module
 */
export function mergeGraphs(...graphs: any[]) {
  return graphUtilities.mergeGraphs(...graphs);
}

// ============================================================================
// Export module instances for advanced usage
// ============================================================================

export {
  entityTransformer,
  graphBuilder,
  layoutOrchestrator,
  metricsCalculator,
  graphUtilities
};