/**
 * Central type definitions for the graph module
 * These interfaces define contracts between graph submodules
 */

import type { Node, Edge } from '@xyflow/react';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent
} from '@/types/notion/app';

// Type alias for union of entity types
export type NotionEntity = Character | Element | Puzzle | TimelineEvent;

/**
 * NotionData type definition
 */
export interface NotionData {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
}

/**
 * Data integrity report type
 */
export interface DataIntegrityReport {
  missingReferences: {
    puzzles: string[];
    elements: string[];
    characters: string[];
    timeline: string[];
  };
  orphanedEntities: {
    puzzles: string[];
    elements: string[];
  };
  brokenRelationships: Array<{
    source: string;
    target: string;
    type: string;
    reason: string;
  }>;
}

// Re-export commonly used types for convenience
export type { 
  Node as ReactFlowNode, 
  Edge as ReactFlowEdge 
} from '@xyflow/react';

/**
 * Supported view types for graph visualization
 */
export type ViewType = 'puzzle-focus' | 'character-journey' | 'content-status' | 'node-connections';

/**
 * Entity types that can be represented as nodes
 */
export type EntityType = 'character' | 'element' | 'puzzle' | 'timeline';

/**
 * Relationship types between entities
 */
export type RelationshipType = 
  | 'requirement'
  | 'reward' 
  | 'collaboration'
  | 'timeline'
  | 'owner'
  | 'ownership'
  | 'container'
  | 'puzzle-grouping' // For puzzle chain grouping
  | 'virtual-dependency'; // For dual-role element layout

/**
 * Placeholder node data for missing entities
 */
export interface PlaceholderNodeData {
  label: string;
  metadata: {
    entityType: EntityType;
    entityId: string;
    isPlaceholder: true;
    missingReason?: string;
  };
  [key: string]: unknown; // Index signature for Record<string, unknown> constraint
}

/**
 * Visual hints for node rendering
 */
export interface VisualHints {
  color?: string;
  size?: 'small' | 'medium' | 'large';
  shape?: 'rectangle' | 'diamond' | 'circle';
  icon?: string;
  badge?: string;
}

/**
 * SF pattern metadata
 */
export interface SFMetadata {
  rfid?: string;
  valueRating?: number;
  memoryType?: 'Personal' | 'Public' | 'Mixed' | 'Business' | 'Technical';
  group?: string | {
    name: string;
    multiplier: string;
  };
  multiplier?: number; // For backward compatibility
}

/**
 * Node metadata containing entity-specific information
 */
export interface NodeMetadata {
  entityType: EntityType;
  entityId?: string; // Optional for placeholder nodes
  originalData?: Character | Element | Puzzle | TimelineEvent; // Optional for placeholder nodes
  dependencies?: string[];
  rewards?: string[];
  subPuzzleIds?: string[];
  isOrphan?: boolean;
  isParent?: boolean;
  isChild?: boolean;
  parentId?: string;
  timelineConnections?: string[];
  collaborators?: string[];
  visualHints?: VisualHints;
  errorState?: {
    hasError?: boolean; // Optional, defaults to true when message exists
    message?: string;
    missingEntities?: string[];
    type?: string; // Support legacy test usage
  };
  enrichedData?: Record<string, unknown>;
  sfPatterns?: SFMetadata;
  status?: string; // Element status
  ownerName?: string; // For elements owned by characters
  ownerTier?: string; // Owner's tier (Core, Supporting, etc.)
  // Force simulation properties
  vx?: number; // Velocity x for d3-force simulation
  vy?: number; // Velocity y for d3-force simulation
  tier?: string; // Node tier for grouping
  timestamp?: number; // Unix timestamp for timeline ordering
  time?: number; // Alternative time representation
}

/**
 * Data structure for graph nodes
 */
export interface GraphNodeData<T = any> {
  label: string;
  metadata: NodeMetadata;
  entity: T; // The original entity data (Character, Element, Puzzle, or TimelineEntry) - always required for non-placeholder nodes
  [key: string]: unknown; // Allow view-specific data
}

/**
 * Extended node type with our custom data
 */
export interface GraphNode<T = any> extends Omit<Node, 'data'> {
  id: string;
  position: { x: number; y: number };
  data: GraphNodeData<T>;
  type?: string;
  parentNode?: string;
  extent?: 'parent';
  expandParent?: boolean;
}

/**
 * Graph node with D3 force simulation properties
 * Used during force-directed layout calculations
 */
export interface SimulationGraphNode extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * Edge metadata type
 */
export type EdgeMetadata = {
  relationshipType: RelationshipType;
  weight?: number;
  strength?: number;
  label?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Extended edge type with our custom data
 */
export interface GraphEdge extends Omit<Edge, 'data'> {
  id: string;
  source: string;
  target: string;
  data?: {
    relationshipType: RelationshipType;
    weight?: number;
    strength?: number; // For collaboration edges
    label?: string; // For edge labels
    metadata?: Record<string, unknown>;
    isVirtual?: boolean; // For layout-only edges (not rendered)
  };
  animated?: boolean;
  style?: React.CSSProperties;
}

/**
 * Depth metadata for connection graphs
 */
export interface DepthMetadata {
  depthDistribution: Map<number, number>; // depth level -> node count at that depth
  maxReachableDepth: number; // Maximum depth in the complete network
  totalReachableNodes: number; // Total nodes in the complete connected component
  isCompleteNetwork: boolean; // Whether current depth includes all reachable nodes
  nodesAtCurrentDepth: number; // Nodes included with current depth setting
  currentDepthLimit: number; // The depth limit used to generate this graph
}

/**
 * Complete graph data structure
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  integrityReport?: DataIntegrityReport;
  depthMetadata?: DepthMetadata; // Metadata about depth distribution
  metadata?: {
    metrics?: {
      startTime: number;
      endTime: number;
      duration: number;
      nodeCount: number;
      edgeCount: number;
      warnings?: string[];
      layoutMetrics?: any;
    };
    viewType?: ViewType;
    timestamp?: string;
  };
}

/**
 * Options for building graph data
 */
export interface BuildGraphOptions {
  viewType?: ViewType;
  filterRelationships?: RelationshipType[];
  includeOrphans?: boolean;
  enableIntegrityChecking?: boolean;
  excludeEntityTypes?: EntityType[];
  layoutConfig?: LayoutConfig;
}

/**
 * Configuration for layout algorithms
 */
export interface LayoutConfig {
  algorithm?: 'dagre' | 'pure-dagre' | 'elk' | 'custom' | 'none' | 'force' | 'force-clustered';
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  spacing?: {
    nodeSpacing?: number;
    rankSpacing?: number;
    edgePadding?: number;
  };
  alignment?: 'UL' | 'UR' | 'DL' | 'DR';
  [key: string]: unknown; // Algorithm-specific options
}

/**
 * Lookup maps for efficient entity access
 */
export interface EntityLookupMaps {
  characters: Map<string, Character>;
  elements: Map<string, Element>;
  puzzles: Map<string, Puzzle>;
  timeline: Map<string, TimelineEvent>;
}

/**
 * Metrics about the graph structure
 */
export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  orphanCount: number;
  componentCount: number;
  maxDepth: number;
  avgDegree: number;
  density: number;
  entityCounts: Record<EntityType, number>;
  relationshipCounts: Record<RelationshipType, number>;
}

/**
 * Contract for entity transformation
 */
export interface EntityTransformer<T = any> {
  transformCharacters(characters: Character[]): GraphNode<Character>[];
  transformElements(elements: Element[]): GraphNode<Element>[];
  transformPuzzles(puzzles: Puzzle[]): GraphNode<Puzzle>[];
  transformTimeline(timeline: TimelineEvent[]): GraphNode<TimelineEvent>[];
  transformEntities(data: NotionData, excludeTypes?: EntityType[]): GraphNode<T>[];
}

/**
 * Contract for graph building
 */
export interface GraphBuilder {
  buildGraphData(data: NotionData, options?: BuildGraphOptions): GraphData;
  buildPuzzleFocusGraph(data: NotionData): GraphData;
  buildCharacterJourneyGraph(data: NotionData): GraphData;
  buildContentStatusGraph(data: NotionData): GraphData;
}

/**
 * Contract for layout orchestration
 */
export interface LayoutOrchestrator {
  applyLayout(graph: GraphData, config?: LayoutConfig): GraphData;
  applyDagreLayout(graph: GraphData, config?: LayoutConfig): GraphData;
  applyPureDagreLayout(graph: GraphData, config?: LayoutConfig): GraphData;
  getLayoutForView(viewType: ViewType): LayoutConfig;
}

/**
 * Contract for metrics calculation
 */
export interface MetricsCalculator {
  calculateMetrics(graph: GraphData): GraphMetrics;
  calculateNodeMetrics(nodes: GraphNode[]): Partial<GraphMetrics>;
  calculateEdgeMetrics(edges: GraphEdge[]): Partial<GraphMetrics>;
  calculateConnectivity(graph: GraphData): Partial<GraphMetrics>;
}

/**
 * Contract for utility functions
 */
export interface GraphUtilities {
  findNodeById(nodes: GraphNode[], id: string): GraphNode | undefined;
  findEdgeById(edges: GraphEdge[], id: string): GraphEdge | undefined;
  getConnectedNodes(node: GraphNode, graph: GraphData): GraphNode[];
  getNodeDegree(node: GraphNode, edges: GraphEdge[]): number;
  detectCycles(graph: GraphData): string[][];
  topologicalSort(graph: GraphData): GraphNode[];
  findOrphans(graph: GraphData): GraphNode[];
  mergeGraphs(...graphs: GraphData[]): GraphData;
}

/**
 * Type guards for runtime validation
 */
export const isGraphNode = (node: unknown): node is GraphNode => {
  return (
    typeof node === 'object' &&
    node !== null &&
    'id' in node &&
    'data' in node &&
    typeof (node as GraphNode).data === 'object' &&
    'metadata' in (node as GraphNode).data &&
    'entityType' in (node as GraphNode).data.metadata
  );
};

export const isGraphEdge = (edge: unknown): edge is GraphEdge => {
  return (
    typeof edge === 'object' &&
    edge !== null &&
    'id' in edge &&
    'source' in edge &&
    'target' in edge
  );
};

export const isEntityType = (type: unknown): type is EntityType => {
  return (
    typeof type === 'string' &&
    ['character', 'element', 'puzzle', 'timeline'].includes(type)
  );
};

export const isRelationshipType = (type: unknown): type is RelationshipType => {
  return (
    typeof type === 'string' &&
    ['requirement', 'reward', 'chain', 'collaboration', 'timeline', 'owner', 'ownership', 'container', 'virtual-dependency'].includes(type)
  );
};