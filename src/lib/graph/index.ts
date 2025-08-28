/**
 * Simplified Graph Module API
 * Phase 3 cleanup - removed complex orchestration in favor of direct imports
 */

// Types are re-exported below, no need for separate imports here

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
export { LAYOUT_PRESETS } from './layouts';
export { filterEdgesByType, getConnectedEdges, calculateConnectivity } from './relationships';
export { hasError, isEntityType as isEntity } from './guards';

// Removed unused utility functions - direct implementations are used instead

// Note: Complex build functions removed in Phase 3
// Use direct imports from transformers and builders instead