/**
 * ViewConfiguration Interface
 * 
 * Declarative configuration schema for graph views.
 * Replaces imperative strategy code with data-driven definitions.
 */

import type { NotionData, GraphData, GraphNode, GraphEdge } from '../types';
import type { UIConfiguration } from './types/UIConfiguration';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

/**
 * Union type for all entities that can be used in node selection
 */
export type Entity = Character | Element | Puzzle | TimelineEvent;

/**
 * Node selection types for declarative configuration
 */
export type NodeSelectionType = 'basic' | 'related' | 'filtered' | 'traversed';

/**
 * Individual node selection configuration
 */
export interface NodeSelection {
  type: NodeSelectionType;
  entityType?: 'character' | 'element' | 'puzzle' | 'timeline';
  ids?: string[];
  from?: string;
  relation?: string;
  depth?: number;
  where?: (entity: Entity) => boolean;
  maxNodes?: number;
}

/**
 * Edge configuration for declarative edge creation
 */
export interface EdgeConfiguration {
  entityType: 'character' | 'element' | 'puzzle' | 'timeline';
  includeTypes?: string[];
  excludeTypes?: string[];
  customEdges?: (data: NotionData, includedNodeIds: Set<string>) => GraphEdge[];
}

/**
 * Layout configuration options
 */
export interface LayoutConfiguration {
  algorithm?: 'dagre' | 'force';
  direction?: 'LR' | 'TB' | 'RL' | 'BT';
  rankSeparation?: number;
  nodeSeparation?: number;
}

/**
 * Template variables for dynamic configuration
 */
export interface TemplateVariables {
  [key: string]: string | number | Date | undefined;
}

/**
 * Hook functions for customization
 */
export interface ViewHooks {
  beforeNodeSelection?: (config: ViewConfiguration, data: NotionData) => void;
  afterNodeCreation?: (nodes: GraphNode[], data: NotionData) => GraphNode[];
  beforeEdgeCreation?: (nodes: GraphNode[], data: NotionData) => void;
  afterEdgeCreation?: (edges: GraphEdge[], data: NotionData) => GraphEdge[];
  afterLayout?: (graph: GraphData) => GraphData;
}

/**
 * Complete view configuration
 */
export interface ViewConfiguration {
  id: string;
  name: string;
  description?: string;
  
  // Node selection configuration
  nodes: {
    include: NodeSelection[];
    exclude?: NodeSelection[];
  };
  
  // Edge creation configuration
  edges: EdgeConfiguration[];
  
  // Layout configuration
  layout?: LayoutConfiguration;
  
  // Template variables for runtime substitution
  variables?: TemplateVariables;
  
  // Custom hooks for advanced logic
  hooks?: ViewHooks;
  
  // UI configuration for component generation
  ui?: UIConfiguration;
  
  // Performance hints
  performance?: {
    maxNodes?: number;
    maxEdges?: number;
    cacheKey?: string;
    cacheTTL?: number;
  };
}

/**
 * View configuration metadata for runtime
 */
export interface ViewConfigurationMetadata {
  id: string;
  name: string;
  description?: string;
  requiredVariables: string[];
  supportedEntityTypes: Set<string>;
  estimatedComplexity: 'low' | 'medium' | 'high';
}