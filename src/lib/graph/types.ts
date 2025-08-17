/**
 * Graph transformation types for React Flow visualization
 * Extends React Flow's base types with our domain-specific data
 */

import type { Node, Edge } from '@xyflow/react';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Union of all Notion entity types that can become nodes
 */
export type NotionEntity = Character | Element | Puzzle | TimelineEvent;

/**
 * String literal type for entity identification
 */
export type EntityType = 'character' | 'element' | 'puzzle' | 'timeline';

// ============================================================================
// SF_ Pattern Metadata
// ============================================================================

/**
 * Extracted SF_ pattern data from element descriptions
 * These patterns encode gameplay mechanics in the text
 */
export interface SFMetadata {
  /** Unique RFID identifier for the element */
  rfid?: string;
  
  /** Value rating from 1-5 (narrative importance & monetary multiplier) */
  valueRating?: number;
  
  /** Memory type affects monetary value multiplier */
  memoryType?: 'Personal' | 'Business' | 'Technical';
  
  /** Group name for collection bonuses */
  group?: string;
  
  /** Calculated multiplier from type and group */
  multiplier?: number;
}

// ============================================================================
// Node Metadata
// ============================================================================

/**
 * Error state for nodes with data issues
 */
export interface NodeError {
  type: 'missing_data' | 'invalid_relation' | 'parse_error' | 'missing_entity';
  message: string;
  field?: string;
  referencedBy?: string;
}

/**
 * Enhanced metadata for all graph nodes
 * Provides additional context beyond the raw entity data
 */
export interface NodeMetadata {
  /** Type of the entity this node represents */
  entityType: EntityType;
  
  /** Status from Element or derived for other types */
  status?: string;
  
  /** Character tier for importance visualization */
  tier?: 'Core' | 'Secondary' | 'Tertiary';
  
  /** Calculated importance score for sorting/sizing */
  importanceScore?: number;
  
  /** Parsed SF_ patterns from descriptions */
  sfPatterns?: SFMetadata;
  
  /** Error state for data integrity issues */
  errorState?: NodeError;
  
  /** Visual hints for the node renderer */
  visualHints?: {
    color?: string;
    icon?: string;
    size?: 'small' | 'medium' | 'large';
    shape?: string;
  };
  
  /** Owner information for elements (enriched from character lookup) */
  ownerName?: string;
  ownerTier?: 'Tier 1' | 'Tier 2' | 'Tier 3';
  
  /** Enriched relational data for details panel */
  enrichedData?: {
    /** Names of related entities for display */
    containerName?: string;
    parentPuzzleName?: string;
    rewardNames?: string[];
    requirementNames?: string[];
    timelineEventName?: string;
    /** Character connections for puzzles */
    characterNames?: string[];
    /** Element details for puzzles */
    elementDetails?: Array<{
      id: string;
      name: string;
      type: string;
      status?: string;
    }>;
    /** Collaborators for puzzle requirements */
    collaborators?: Array<{
      id: string;
      name: string;
      tier: string;
    }>;
    /** Whether this element requires collaboration */
    requiresCollaboration?: boolean;
    /** Timeline information for element discovery */
    timelineInfo?: {
      events: Array<{
        id: string;
        name: string;
        date?: string;
      }>;
      earliestDiscovery?: string;
    };
  };
  
  /** Lane information for swim lane layouts */
  laneInfo?: {
    laneType: string;
    laneIndex: number;
    laneBounds: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    };
    laneColor: string;
  };
}

// ============================================================================
// Node Data Structure
// ============================================================================

/**
 * Complete data payload for a graph node
 * @template T - The specific entity type for type safety
 */
export interface GraphNodeData<T extends NotionEntity = NotionEntity> extends Record<string, unknown> {
  /** Original entity data from Notion */
  entity: T;
  
  /** Display label for the node */
  label: string;
  
  /** Additional metadata for rendering and behavior */
  metadata: NodeMetadata;
}

/**
 * Special data structure for placeholder nodes (missing entities)
 */
export interface PlaceholderNodeData extends Record<string, unknown> {
  /** No entity data for placeholders */
  entity: null;
  
  /** Display label for the node */
  label: string;
  
  /** Additional metadata for rendering and behavior */
  metadata: NodeMetadata;
}

/**
 * Custom node type extending React Flow's Node
 * @template T - The specific entity type for type safety
 */
export type GraphNode<T extends NotionEntity = NotionEntity> = Node<GraphNodeData<T>>;

// ============================================================================
// Edge Types
// ============================================================================

/**
 * Types of relationships between entities
 */
export type RelationshipType = 
  | 'ownership'      // Character owns Element
  | 'requirement'    // Puzzle requires Element
  | 'reward'         // Puzzle rewards Element
  | 'timeline'       // Element reveals Timeline event
  | 'chain'          // Puzzle chains to another Puzzle
  | 'container';     // Element contains other Elements

/**
 * Metadata for graph edges
 */
export interface EdgeMetadata extends Record<string, unknown> {
  /** Type of relationship this edge represents */
  relationshipType: RelationshipType;
  
  /** Visual weight/importance (0-1) */
  strength?: number;
  
  /** Optional label for the edge */
  label?: string;
  
  /** Whether this is a bidirectional relationship */
  bidirectional?: boolean;
  
  /** Whether this edge references missing entities */
  isBroken?: boolean;
}

/**
 * Custom edge type extending React Flow's Edge
 */
export type GraphEdge = Edge<EdgeMetadata>;

// ============================================================================
// View Types
// ============================================================================

/**
 * Supported view types for different graph layouts
 */
export type ViewType = 'puzzle-focus' | 'character-journey' | 'content-status';

// ============================================================================
// Graph Data Structure
// ============================================================================

/**
 * Graph transformation metrics
 */
export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  startTime: number;
  endTime: number;
  duration: number;
  layoutMetrics: {
    width: number;
    height: number;
    density: number;
    overlap: number;
  };
}

/**
 * Complete graph data ready for React Flow
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  
  /** Optional metadata about the graph itself */
  metadata?: {
    metrics?: GraphMetrics;
    viewType?: ViewType;
    timestamp?: string;
    nodeCount?: number;
    edgeCount?: number;
    generatedAt?: Date;
    dataVersion?: string;
  };
}

// ============================================================================
// Transformer Types
// ============================================================================

/**
 * Function signature for entity transformers
 */
export type EntityTransformer<T extends NotionEntity> = (
  entity: T,
  index: number
) => GraphNode<T> | null;

/**
 * Configuration for graph layout
 */
export interface LayoutConfig {
  /** Direction: 'LR' (left-right) or 'TB' (top-bottom) */
  direction: 'LR' | 'TB';
  
  /** Space between ranks (horizontal or vertical groups) */
  rankSeparation: number;
  
  /** Space between nodes in the same rank */
  nodeSeparation: number;
  
  /** Whether to center the graph */
  center?: boolean;
}

// ============================================================================
// Lookup Maps for Relationship Resolution
// ============================================================================

/**
 * Maps for efficient ID-based lookups during relationship resolution
 */
export interface EntityLookupMaps {
  characters: Map<string, Character>;
  elements: Map<string, Element>;
  puzzles: Map<string, Puzzle>;
  timeline: Map<string, TimelineEvent>;
}

// ============================================================================
// Type Guards
// ============================================================================
// Note: Runtime type guards moved to ./guards.ts per architecture principle:
// "No index.ts re-exports" and clean separation of types from runtime code

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract entity type from GraphNode
 */
export type NodeEntity<N> = N extends GraphNode<infer T> ? T : never;

/**
 * Options for building the graph
 */
export interface BuildGraphOptions {
  /** Include nodes with errors */
  includeErrors?: boolean;
  
  /** Filter by entity types */
  entityTypes?: EntityType[];
  
  /** Filter by status */
  statuses?: string[];
  
  /** Layout configuration */
  layout?: LayoutConfig;
}