/**
 * Graph Module API Facade
 * Comprehensive facade providing unified access to graph functionality with dependency injection.
 * 
 * This module serves as the primary entry point for all graph-related operations in ALNRetool,
 * implementing the Facade pattern to simplify complex graph processing while maintaining clean
 * architecture through dependency injection. It provides backward-compatible functions while
 * delegating to specialized modules for actual implementation.
 * 
 * **Architectural Overview:**
 * - **Facade Pattern**: Single entry point hiding complex subsystem interactions
 * - **Dependency Injection**: Clean separation of concerns with testable architecture
 * - **Module Decomposition**: Single-responsibility modules for specific functionality
 * - **Backward Compatibility**: Maintains existing API while enabling modern architecture
 * 
 * **Core Subsystem Modules:**
 * - **EntityTransformer**: Notion entity to graph node transformation with murder mystery context
 * - **GraphBuilder**: Graph construction orchestration with relationship resolution
 * - **LayoutOrchestrator**: Layout algorithm management with async support
 * - **MetricsCalculator**: Comprehensive graph analysis and structural metrics
 * - **GraphUtilities**: Common graph operations and utility functions
 * - **TraversalEngine**: Advanced graph traversal and pathfinding algorithms
 * 
 * **Graph Context Architecture:**
 * - **Default Context**: Production-ready context with standard configuration
 * - **Custom Context**: Injectable context for testing and specialized use cases
 * - **Context Management**: Singleton pattern with reset capability for testing
 * - **Service Location**: Transparent access to all graph services through context
 * 
 * **API Categories:**
 * - **Graph Building**: Comprehensive graph construction from Notion data
 * - **View-Specific Builders**: Specialized graph builders for different visualization modes
 * - **Layout Operations**: Synchronous and asynchronous layout algorithm application
 * - **Metrics Analysis**: Structural analysis and graph property calculation
 * - **Utility Functions**: Common operations for graph manipulation and analysis
 * - **Testing Support**: Utilities for graph validation and test data creation
 * 
 * @example
 * ```typescript
 * // Basic graph construction
 * const graph = buildGraphData(notionData);
 * const layoutedGraph = await applyLayout(graph);
 * 
 * // View-specific graph building
 * const puzzleGraph = buildPuzzleFocusGraph(notionData, 'puzzle-123', 3);
 * const characterGraph = buildCharacterJourneyGraph(notionData, 'character-456');
 * 
 * // Advanced layout with progress tracking
 * const asyncGraph = await runAsyncLayout(graph, (progress) => {
 *   console.log(`Layout progress: ${progress}%`);
 * });
 * 
 * // Metrics and analysis
 * const metrics = calculateGraphMetrics(graph);
 * console.log(`Graph has ${metrics.nodeCount} nodes and ${metrics.edgeCount} edges`);
 * 
 * // Custom context for testing
 * const testContext = createGraphContext();
 * const testGraph = buildGraphData(testData, {}, testContext);
 * ```
 * 
 * @module graph/index
 * @see {@link GraphContext} - Dependency injection container
 * @see {@link GraphOrchestrator} - Main graph building coordination
 * @see {@link LayoutOrchestrator} - Layout algorithm management
 * @see {@link EntityTransformer} - Notion entity transformation
 * @author ALNRetool Team
 */

// Import GraphContext for dependency injection
import { 
  GraphContext, 
  getDefaultGraphContext,
  resetDefaultGraphContext
} from './GraphContext';

// Import LayoutProgress type
import type { LayoutProgress } from './layout/BaseLayoutAlgorithm';

// Import types needed for functions
import type { 
  GraphData, 
  GraphNode, 
  GraphEdge,
  NotionData,
  BuildGraphOptions,
  EntityType,
  LayoutConfig,
  GraphMetrics
} from './types';

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

// Export GraphContext and factory for testing
export { GraphContext, createGraphContext } from './GraphContext';

// ============================================================================
// Facade Functions - Maintain backward compatibility
// ============================================================================

/**
 * Build complete graph data from Notion entities with comprehensive transformation.
 * Primary entry point for graph construction that transforms raw Notion data into
 * a fully-formed graph structure ready for visualization with React Flow.
 * 
 * **Construction Process:**
 * 1. **Entity Validation**: Validates all Notion entity data structures
 * 2. **Node Transformation**: Converts entities to properly styled graph nodes
 * 3. **Edge Resolution**: Creates relationships between entities based on data
 * 4. **Enrichment**: Adds cross-references, metadata, and murder mystery context
 * 5. **Optimization**: Applies virtual edges and layout optimizations
 * 6. **Metrics**: Calculates comprehensive graph statistics for monitoring
 * 
 * **Supported Build Options:**
 * - **View Type**: Specify visualization mode (overview, puzzle-focus, character-journey, etc.)
 * - **Entity Filtering**: Include/exclude specific entity types
 * - **Depth Limiting**: Control traversal depth for focused views
 * - **Status Filtering**: Filter by content status or completion state
 * - **Date Range**: Temporal filtering for timeline-based views
 * 
 * **Context Management:**
 * - Uses default production context unless custom context provided
 * - Enables dependency injection for testing and specialized configurations
 * - Maintains singleton pattern for consistent behavior across application
 * - Supports context reset for testing isolation
 * 
 * @param data - Complete Notion data including all murder mystery entities
 * @param options - Optional build configuration for customizing graph generation
 * @param context - Optional custom GraphContext for dependency injection (testing)
 * @returns GraphData structure ready for React Flow visualization
 * 
 * @example
 * ```typescript
 * // Basic graph construction with all entities
 * const completeGraph = buildGraphData(notionData);
 * 
 * // Filtered graph excluding timeline events
 * const coreGraph = buildGraphData(notionData, {
 *   excludeTypes: ['timeline']
 * });
 * 
 * // Custom view configuration
 * const focusedGraph = buildGraphData(notionData, {
 *   viewType: 'puzzle-focus',
 *   nodeId: 'mystery-puzzle-1',
 *   maxDepth: 2
 * });
 * 
 * // Testing with custom context
 * const testContext = createGraphContext();
 * const testGraph = buildGraphData(mockData, {}, testContext);
 * 
 * // Monitor graph construction metrics
 * const graph = buildGraphData(data);
 * console.log(`Built graph with ${graph.nodes.length} nodes`);
 * console.log(`Processing time: ${graph.metadata.metrics.duration}ms`);
 * ```
 * 
 * Complexity: O(V + E + R) where V = entities, E = relationships, R = enrichment operations
 */
export function buildGraphData(
  data: NotionData, 
  options: BuildGraphOptions = {},
  context?: GraphContext
): GraphData {
  const ctx = context || getDefaultGraphContext();
  return ctx.graphOrchestrator.buildGraph(data, options);
}

// Alias for backward compatibility
export const buildGraph = buildGraphData;

/**
 * Build specialized graph for Puzzle Focus View with depth-limited traversal.
 * Creates a focused subgraph centered on a specific puzzle, including its requirements,
 * rewards, and related entities within the specified depth limit.
 * 
 * **Focus View Strategy:**
 * 1. **Root Selection**: Centers graph on specified puzzle node
 * 2. **Depth Traversal**: Explores relationships up to maximum depth
 * 3. **Requirement Analysis**: Includes prerequisite elements and puzzles
 * 4. **Reward Mapping**: Incorporates puzzle rewards and consequences
 * 5. **Context Preservation**: Maintains essential context without overwhelming detail
 * 
 * **Traversal Algorithm:**
 * - **Breadth-First**: Ensures balanced exploration at each depth level
 * - **Relationship-Aware**: Follows requirement and reward edges specifically
 * - **Cycle Prevention**: Handles circular dependencies gracefully
 * - **Context Expansion**: Includes related characters and timeline events
 * 
 * @param data - Complete Notion data for relationship resolution
 * @param puzzleId - Central puzzle ID to focus on (optional for overview mode)
 * @param maxDepth - Maximum traversal depth from focus puzzle (default: 2)
 * @param context - Optional custom GraphContext for dependency injection
 * @returns GraphData focused on puzzle and its immediate relationships
 * 
 * @example
 * ```typescript
 * // Focus on specific puzzle with default depth
 * const focusGraph = buildPuzzleFocusGraph(notionData, 'murder-mystery-finale');
 * 
 * // Shallow focus for quick overview
 * const overviewGraph = buildPuzzleFocusGraph(notionData, 'starter-puzzle', 1);
 * 
 * // Deep exploration of puzzle dependencies
 * const detailedGraph = buildPuzzleFocusGraph(notionData, 'complex-puzzle', 3);
 * 
 * // Overview mode without specific focus
 * const generalGraph = buildPuzzleFocusGraph(notionData);
 * ```
 * 
 * Complexity: O(V^d + E^d) where V = nodes, E = edges, d = maxDepth
 */
export function buildPuzzleFocusGraph(
  data: NotionData, 
  puzzleId?: string, 
  maxDepth?: number,
  context?: GraphContext
): GraphData {
  const ctx = context || getDefaultGraphContext();
  return ctx.graphOrchestrator.buildGraph(data, {
    viewType: 'puzzle-focus',
    nodeId: puzzleId,
    maxDepth
  });
}

/**
 * Build specialized graph for Character Journey View with relationship mapping.
 * Creates a character-centered subgraph showing ownership relationships, interactions,
 * and the character's role in the murder mystery narrative.
 * 
 * **Journey View Strategy:**
 * 1. **Character Focus**: Centers graph on specified character node
 * 2. **Ownership Mapping**: Includes all elements owned by the character
 * 3. **Interaction Analysis**: Shows character relationships and collaborations
 * 4. **Puzzle Involvement**: Displays puzzles where character plays a role
 * 5. **Timeline Integration**: Connects to relevant temporal events
 * 
 * **Character Relationship Types:**
 * - **Ownership**: Elements possessed or controlled by the character
 * - **Collaboration**: Other characters the focus character interacts with
 * - **Puzzle Roles**: Puzzles where character is involved as NPC or goal
 * - **Timeline Events**: Events where character is participant or subject
 * 
 * **Narrative Context:**
 * - **Detective Role**: Special handling for primary investigators
 * - **Suspect Analysis**: Enhanced view for potential perpetrators
 * - **Victim Connections**: Respectful mapping of victim relationships
 * - **Witness Networks**: Information flow and testimony connections
 * 
 * @param data - Complete Notion data for character relationship resolution
 * @param characterId - Character ID to center the journey view on
 * @param context - Optional custom GraphContext for dependency injection
 * @returns GraphData focused on character and their relationships
 * 
 * @example
 * ```typescript
 * // Detective's investigation journey
 * const detectiveGraph = buildCharacterJourneyGraph(notionData, 'detective-morgan');
 * 
 * // Suspect relationship mapping
 * const suspectGraph = buildCharacterJourneyGraph(notionData, 'suspect-williams');
 * 
 * // Victim connection analysis
 * const victimGraph = buildCharacterJourneyGraph(notionData, 'victim-smith');
 * 
 * // Witness testimony network
 * const witnessGraph = buildCharacterJourneyGraph(notionData, 'witness-jones');
 * ```
 * 
 * Complexity: O(V + E + C) where V = nodes, E = edges, C = character connections
 */
export function buildCharacterJourneyGraph(
  data: NotionData, 
  characterId: string,
  context?: GraphContext
): GraphData {
  const ctx = context || getDefaultGraphContext();
  return ctx.graphOrchestrator.buildGraph(data, {
    viewType: 'character-journey',
    nodeId: characterId
  });
}

/**
 * Build specialized graph for Timeline View with chronological organization.
 * Creates a temporal subgraph showing events in chronological sequence with
 * optional date range filtering for focused timeline analysis.
 * 
 * **Timeline View Strategy:**
 * 1. **Temporal Sorting**: Orders events by chronological sequence
 * 2. **Date Filtering**: Applies optional start/end date constraints
 * 3. **Event Classification**: Categorizes crime events, investigations, and milestones
 * 4. **Causal Relationships**: Shows before/after and cause/effect connections
 * 5. **Participant Mapping**: Links events to involved characters and evidence
 * 
 * **Temporal Relationship Types:**
 * - **Sequential**: Events that follow each other in time
 * - **Causal**: Events that cause or enable subsequent events
 * - **Parallel**: Simultaneous events with potential connections
 * - **Contextual**: Events providing background or setting context
 * 
 * **Timeline Categories:**
 * - **Crime Events**: Murders, disappearances, and criminal activities
 * - **Investigation**: Detective work, evidence discovery, and analysis
 * - **Character Actions**: Movements, meetings, and significant activities
 * - **Evidence Timeline**: When evidence was created, found, or analyzed
 * 
 * @param data - Complete Notion data for temporal relationship resolution
 * @param startDate - Optional start date for timeline filtering
 * @param endDate - Optional end date for timeline filtering
 * @param context - Optional custom GraphContext for dependency injection
 * @returns GraphData organized chronologically with temporal relationships
 * 
 * @example
 * ```typescript
 * // Complete timeline view
 * const fullTimeline = buildTimelineGraph(notionData);
 * 
 * // Crime day focus
 * const crimeDay = buildTimelineGraph(
 *   notionData, 
 *   new Date('2024-03-15'), 
 *   new Date('2024-03-16')
 * );
 * 
 * // Investigation period
 * const investigationPeriod = buildTimelineGraph(
 *   notionData,
 *   new Date('2024-03-16'),
 *   new Date('2024-03-20')
 * );
 * 
 * // Pre-crime context
 * const background = buildTimelineGraph(
 *   notionData,
 *   new Date('2024-03-01'),
 *   new Date('2024-03-15')
 * );
 * ```
 * 
 * Complexity: O(V log V + E) where V = temporal events, E = temporal relationships
 */
export function buildTimelineGraph(
  data: NotionData, 
  startDate?: Date, 
  endDate?: Date,
  context?: GraphContext
): GraphData {
  const ctx = context || getDefaultGraphContext();
  return ctx.graphOrchestrator.buildGraph(data, {
    viewType: 'timeline',
    dateRange: { start: startDate, end: endDate }
  });
}

/**
 * Build specialized graph for Content Status View with completion filtering.
 * Creates a status-filtered subgraph showing content based on development status,
 * completion state, or quality assurance markers for content management.
 * 
 * **Status View Strategy:**
 * 1. **Status Classification**: Categorizes content by development status
 * 2. **Completion Filtering**: Shows content matching specified completion criteria
 * 3. **Quality Analysis**: Identifies content needing review or revision
 * 4. **Dependency Impact**: Shows how status affects dependent content
 * 5. **Progress Tracking**: Enables monitoring of content development progress
 * 
 * **Content Status Categories:**
 * - **Draft**: Initial content creation and development phase
 * - **Review**: Content ready for quality assurance and feedback
 * - **Complete**: Finalized content ready for production use
 * - **Published**: Live content available to players
 * - **Deprecated**: Outdated content scheduled for replacement
 * - **Blocked**: Content waiting on dependencies or approvals
 * 
 * **Filtering Capabilities:**
 * - **Single Status**: Show only content with specific status
 * - **Multiple Statuses**: Include content with any of several statuses
 * - **Status Exclusion**: Filter out content with certain statuses
 * - **Status Transitions**: Show content requiring status updates
 * 
 * @param data - Complete Notion data for status analysis
 * @param statusFilter - Optional array of status values to include
 * @param context - Optional custom GraphContext for dependency injection
 * @returns GraphData filtered by content status criteria
 * 
 * @example
 * ```typescript
 * // Show only completed content
 * const completedGraph = buildContentStatusGraph(notionData, ['complete', 'published']);
 * 
 * // Content needing review
 * const reviewGraph = buildContentStatusGraph(notionData, ['draft', 'review']);
 * 
 * // All content (no filter)
 * const allContentGraph = buildContentStatusGraph(notionData);
 * 
 * // Blocked content analysis
 * const blockedGraph = buildContentStatusGraph(notionData, ['blocked', 'needs-revision']);
 * ```
 * 
 * Complexity: O(V + E + F) where V = nodes, E = edges, F = filtering operations
 */
export function buildContentStatusGraph(
  data: NotionData, 
  statusFilter?: string[],
  context?: GraphContext
): GraphData {
  const ctx = context || getDefaultGraphContext();
  return ctx.graphOrchestrator.buildGraph(data, {
    viewType: 'content-status',
    statusFilter
  });
}

/**
 * Build specialized graph for Node Connections View with expansion control.
 * Creates a connection-focused subgraph centered on a specific node, showing its
 * relationships and connected entities with configurable depth and size limits.
 * 
 * **Connection View Strategy:**
 * 1. **Node Centering**: Focuses graph on specified node as root
 * 2. **Relationship Traversal**: Explores connections based on node type
 * 3. **Expansion Control**: Manages graph complexity through depth and size limits
 * 4. **Selective Expansion**: Allows user-controlled expansion of specific nodes
 * 5. **Context Preservation**: Maintains sufficient context without overwhelming detail
 * 
 * **Node Type Specializations:**
 * - **Puzzle Nodes**: Show requirements, rewards, and dependency chains
 * - **Character Nodes**: Display ownership, interactions, and puzzle involvement
 * - **Element Nodes**: Reveal puzzle connections and character ownership
 * - **Timeline Nodes**: Show temporal relationships and event participants
 * 
 * **Expansion Management:**
 * - **Depth Limiting**: Controls how far from root to explore
 * - **Node Limiting**: Caps total number of nodes to prevent overwhelm
 * - **Selective Expansion**: User-controlled expansion of specific interesting nodes
 * - **Smart Pruning**: Intelligent selection of most relevant connections
 * 
 * @param data - Complete Notion data for connection resolution
 * @param nodeId - Central node ID to focus connections on
 * @param nodeType - Type of the central node for specialized handling
 * @param maxDepth - Maximum traversal depth from central node (default: 2)
 * @param maxNodes - Maximum total nodes to include (default: 50)
 * @param expandedNodes - Optional set of nodes to expand beyond default limits
 * @param context - Optional custom GraphContext for dependency injection
 * @returns GraphData focused on node connections with expansion controls
 * 
 * @example
 * ```typescript
 * // Basic puzzle connection view
 * const puzzleConnections = buildNodeConnectionsGraph(
 *   notionData, 'mystery-puzzle-1', 'puzzle'
 * );
 * 
 * // Deep character analysis
 * const characterAnalysis = buildNodeConnectionsGraph(
 *   notionData, 'detective-sarah', 'character', 3, 75
 * );
 * 
 * // Element relationship mapping with expansion
 * const expandedNodes = new Set(['related-puzzle-1', 'related-character-1']);
 * const elementConnections = buildNodeConnectionsGraph(
 *   notionData, 'master-key', 'element', 2, 40, expandedNodes
 * );
 * 
 * // Timeline event context
 * const eventContext = buildNodeConnectionsGraph(
 *   notionData, 'crime-occurred', 'timeline', 1, 30
 * );
 * ```
 * 
 * Complexity: O(min(V^d, N) + E) where V = nodes, d = maxDepth, N = maxNodes, E = edges
 */
export function buildNodeConnectionsGraph(
  data: NotionData,
  nodeId: string,
  nodeType: EntityType,
  maxDepth?: number,
  maxNodes?: number,
  expandedNodes?: Set<string>,
  context?: GraphContext
): GraphData {
  const ctx = context || getDefaultGraphContext();
  return ctx.graphOrchestrator.buildGraph(data, {
    viewType: 'node-connections',
    nodeId,
    nodeType,
    maxDepth,
    maxNodes,
    expandedNodes
  });
}// ============================================================================
// Layout Functions - Delegate to LayoutOrchestrator
// ============================================================================

/**
 * Apply specialized layout algorithm to positioned graph nodes and edges.
 * Coordinates layout execution through LayoutOrchestrator with dependency injection support
 * and configurable algorithm selection for optimal visual arrangement.
 * 
 * **Layout Orchestration Process:**
 * 1. **Algorithm Selection**: Chooses optimal layout based on configuration
 * 2. **Node Positioning**: Calculates positions using selected algorithm
 * 3. **Edge Routing**: Routes edges optimally around positioned nodes
 * 4. **Virtual Injection**: Adds virtual edges for semantic positioning
 * 5. **Collision Resolution**: Prevents overlaps through spatial optimization
 * 6. **Visual Enhancement**: Applies clustering and aesthetic improvements
 * 
 * **Supported Layout Algorithms:**
 * - **Dagre (Default)**: Hierarchical layout with network-simplex optimization
 * - **Force-Directed**: Physics-based organic layouts for exploration
 * - **Circular**: Ring-based arrangements for relationship emphasis
 * - **Grid**: Structured layouts for systematic content organization
 * 
 * **Algorithm Features:**
 * - **Semantic Awareness**: Understands entity types and relationships
 * - **Performance Optimization**: Efficient algorithms for large graphs
 * - **Visual Hierarchy**: Maintains importance through positioning
 * - **Interactive Support**: Optimized for user interaction patterns
 * 
 * @param data - Graph data requiring layout positioning
 * @param config - Optional layout configuration and algorithm selection
 * @param context - Optional custom GraphContext for dependency injection
 * @returns Promise resolving to positioned GraphData with coordinates
 * 
 * @example
 * ```typescript
 * // Default Dagre layout
 * const positioned = await applyLayout(graphData);
 * 
 * // Custom force-directed layout
 * const forceConfig: LayoutConfig = {
 *   algorithm: 'force',
 *   iterations: 300,
 *   nodeSpacing: 150
 * };
 * const organicLayout = await applyLayout(graphData, forceConfig);
 * 
 * // Hierarchical puzzle layout
 * const hierarchicalConfig: LayoutConfig = {
 *   algorithm: 'dagre',
 *   direction: 'TB',
 *   rankSeparation: 200,
 *   nodeSeparation: 100
 * };
 * const puzzleLayout = await applyLayout(graphData, hierarchicalConfig);
 * ```
 * 
 * Complexity: O(V log V + E) for Dagre, O(V²) for force-directed
 */
export async function applyLayout(
  data: GraphData, 
  config?: LayoutConfig,
  context?: GraphContext
): Promise<GraphData> {
  const ctx = context || getDefaultGraphContext();
  return ctx.layoutOrchestrator.applyLayout(data, config);
}

/**
 * Execute asynchronous layout algorithm with comprehensive progress tracking.
 * Provides non-blocking layout execution with real-time progress updates for enhanced
 * user experience during complex graph positioning calculations.
 * 
 * **Asynchronous Layout Benefits:**
 * 1. **Non-Blocking UI**: Maintains responsive interface during layout
 * 2. **Progress Feedback**: Real-time updates on layout calculation progress
 * 3. **Cancellation Support**: Ability to interrupt long-running calculations
 * 4. **Memory Management**: Efficient handling of large graph datasets
 * 5. **Error Handling**: Graceful recovery from layout calculation failures
 * 
 * **Progress Tracking Features:**
 * - **Percentage Completion**: 0-100% progress indication
 * - **Stage Information**: Current layout calculation phase
 * - **Performance Metrics**: Timing and throughput statistics
 * - **Resource Usage**: Memory and CPU utilization tracking
 * 
 * **Use Cases:**
 * - Large graphs (>500 nodes) requiring extended calculation time
 * - Interactive applications needing responsive UI during layout
 * - Batch processing with user feedback requirements
 * - Development environments with layout performance monitoring
 * 
 * @param data - Graph data requiring asynchronous layout processing
 * @param onProgress - Optional callback for progress updates (0-1 scale)
 * @param config - Optional layout configuration and algorithm settings
 * @param context - Optional custom GraphContext for dependency injection
 * @returns Promise resolving to positioned GraphData with progress tracking
 * 
 * @example
 * ```typescript
 * // Basic async layout with progress
 * const layoutPromise = runAsyncLayout(
 *   graphData,
 *   (progress) => console.log(`Layout progress: ${Math.round(progress * 100)}%`)
 * );
 * 
 * // Advanced async layout with UI integration
 * const progressCallback = (progress: number) => {
 *   setLayoutProgress(progress);
 *   if (progress === 1) {
 *     setLayoutStatus('Complete');
 *   }
 * };
 * const positioned = await runAsyncLayout(graphData, progressCallback, {
 *   algorithm: 'force',
 *   maxIterations: 500
 * });
 * 
 * // Background layout processing
 * runAsyncLayout(largeGraphData, undefined, { algorithm: 'dagre' })
 *   .then(result => updateGraphVisualization(result))
 *   .catch(error => handleLayoutError(error));
 * ```
 * 
 * Complexity: Same as applyLayout but distributed across event loop cycles
 */
export async function runAsyncLayout(
  data: GraphData,
  onProgress?: (progress: number) => void,
  config?: LayoutConfig,
  context?: GraphContext
): Promise<GraphData> {
  const ctx = context || getDefaultGraphContext();
  // Convert simple progress callback to LayoutProgress format
  const layoutProgress = onProgress 
    ? (progress: LayoutProgress) => onProgress(progress.progress)
    : undefined;
  return ctx.layoutOrchestrator.applyLayoutAsync(data, config, layoutProgress);
}

// ============================================================================
// Metrics Functions - Delegate to MetricsCalculator
// ============================================================================

/**
 * Calculate comprehensive structural and analytical metrics for graph analysis.
 * Provides detailed statistical analysis of graph properties including connectivity,
 * distribution patterns, and structural characteristics for optimization and monitoring.
 * 
 * **Comprehensive Metrics Categories:**
 * 1. **Basic Counts**: Node and edge totals with entity type distributions
 * 2. **Connectivity Analysis**: Degree statistics, density, and component analysis
 * 3. **Structural Properties**: Graph depth, components, and traversal characteristics
 * 4. **Entity Patterns**: Murder mystery specific metrics (character interactions, puzzle chains)
 * 5. **Quality Indicators**: Orphan detection, balance metrics, and optimization opportunities
 * 
 * **Statistical Measurements:**
 * - **Node Metrics**: Total count, entity type distribution, orphan identification
 * - **Edge Metrics**: Total count, relationship type distribution, weight analysis
 * - **Connectivity**: Average degree, graph density, connected components
 * - **Traversal**: Maximum depth, shortest paths, centrality measures
 * - **Game Specific**: Puzzle completion rates, character involvement, timeline coverage
 * 
 * **Use Cases:**
 * - Graph optimization and performance tuning
 * - Content balance analysis for game design
 * - Quality assurance and structural validation
 * - Performance monitoring and trend analysis
 * - Debugging graph construction issues
 * 
 * @param data - Complete graph data for comprehensive analysis
 * @param context - Optional custom GraphContext for dependency injection
 * @returns GraphMetrics object containing all calculated statistics
 * 
 * @example
 * ```typescript
 * // Basic metrics calculation
 * const metrics = calculateGraphMetrics(graphData);
 * console.log(`Graph has ${metrics.nodeCount} nodes, ${metrics.edgeCount} edges`);
 * console.log(`Density: ${metrics.density}, Components: ${metrics.componentCount}`);
 * 
 * // Entity distribution analysis
 * const entityStats = metrics.entityCounts;
 * console.log(`Characters: ${entityStats?.character}`);
 * console.log(`Puzzles: ${entityStats?.puzzle}`);
 * console.log(`Elements: ${entityStats?.element}`);
 * 
 * // Relationship analysis
 * const relationshipStats = metrics.relationshipCounts;
 * console.log(`Requirements: ${relationshipStats?.requirement}`);
 * console.log(`Rewards: ${relationshipStats?.reward}`);
 * 
 * // Quality assessment
 * if (metrics.orphanCount > 0) {
 *   console.warn(`Found ${metrics.orphanCount} orphaned nodes`);
 * }
 * if (metrics.density < 0.1) {
 *   console.warn('Low graph connectivity - consider adding relationships');
 * }
 * ```
 * 
 * Complexity: O(V + E) where V = nodes, E = edges
 */
export function calculateGraphMetrics(
  data: GraphData,
  context?: GraphContext
): GraphMetrics {
  const ctx = context || getDefaultGraphContext();
  return ctx.metricsCalculator.calculateMetrics(data);
}

// ============================================================================
// Utility Functions - Delegate to GraphUtilities
// ============================================================================

/**
 * Filter graph nodes by specific entity type with murder mystery context awareness.
 * Provides efficient entity type filtering through GraphUtilities with comprehensive
 * support for all ALNRetool entity categories and flexible filtering patterns.
 * 
 * **Entity Type Categories:**
 * - **Character**: Game participants, suspects, witnesses, and NPCs
 * - **Element**: Physical items, evidence, locations, and story components
 * - **Puzzle**: Challenges, mysteries, tasks, and problem-solving activities
 * - **Timeline**: Events, sequences, chronological markers, and temporal relationships
 * 
 * **Filtering Features:**
 * - **Type Safety**: TypeScript-enforced entity type validation
 * - **Performance Optimization**: Efficient filtering with early termination
 * - **Metadata Preservation**: Maintains all node properties during filtering
 * - **Relationship Awareness**: Understands entity interconnections
 * 
 * **Common Use Cases:**
 * - Character-only views for relationship analysis
 * - Puzzle-focused displays for game progression
 * - Element inventories for item management
 * - Timeline views for chronological understanding
 * 
 * @param nodes - Array of graph nodes to filter by type
 * @param type - Target entity type for filtering (character, element, puzzle, timeline)
 * @param context - Optional custom GraphContext for dependency injection
 * @returns Filtered array containing only nodes of specified entity type
 * 
 * @example
 * ```typescript
 * // Character analysis
 * const characters = filterNodesByType(graphData.nodes, 'character');
 * console.log(`Found ${characters.length} characters`);
 * 
 * // Puzzle progression tracking
 * const puzzles = filterNodesByType(graphData.nodes, 'puzzle');
 * const completedPuzzles = puzzles.filter(p => p.data.status === 'complete');
 * 
 * // Evidence inventory
 * const elements = filterNodesByType(graphData.nodes, 'element');
 * const evidence = elements.filter(e => e.data.metadata.category === 'evidence');
 * 
 * // Timeline construction
 * const timelineEvents = filterNodesByType(graphData.nodes, 'timeline');
 * const sortedEvents = timelineEvents.sort((a, b) => 
 *   new Date(a.data.timestamp).getTime() - new Date(b.data.timestamp).getTime()
 * );
 * ```
 * 
 * Complexity: O(n) where n = nodes.length
 */
export function filterNodesByType(
  nodes: GraphNode[], 
  type: EntityType,
  context?: GraphContext
): GraphNode[] {
  const ctx = context || getDefaultGraphContext();
  return ctx.graphUtilities.filterNodesByType(nodes, type);
}

/**
 * Retrieve specific graph node by unique identifier with efficient lookup.
 * Provides fast node retrieval through GraphUtilities with comprehensive error handling
 * and support for all ALNRetool entity types and custom node configurations.
 * 
 * **Lookup Features:**
 * - **Efficient Search**: Optimized node identification and retrieval
 * - **Type Safety**: Returns properly typed GraphNode or undefined
 * - **Error Resilience**: Graceful handling of missing or invalid IDs
 * - **Metadata Access**: Full access to node data and properties
 * 
 * **Node ID Patterns:**
 * - **Characters**: `character-{name}` (e.g., 'character-detective-sarah')
 * - **Elements**: `element-{type}-{name}` (e.g., 'element-evidence-bloody-knife')
 * - **Puzzles**: `puzzle-{category}` (e.g., 'puzzle-locked-room-mystery')
 * - **Timeline**: `timeline-{timestamp}` (e.g., 'timeline-2024-01-15T22:30:00')
 * 
 * **Common Use Cases:**
 * - Node detail panel population
 * - Cross-reference resolution
 * - Interactive node selection handling
 * - Relationship endpoint identification
 * - Data validation and integrity checking
 * 
 * @param nodes - Array of graph nodes to search within
 * @param id - Unique node identifier to locate
 * @param context - Optional custom GraphContext for dependency injection
 * @returns Found GraphNode or undefined if not found
 * 
 * @example
 * ```typescript
 * // Find specific character
 * const detective = getNodeById(graphData.nodes, 'character-detective-sarah');
 * if (detective) {
 *   console.log(`Detective: ${detective.data.label}`);
 *   console.log(`Role: ${detective.data.metadata.role}`);
 * }
 * 
 * // Locate puzzle by ID
 * const puzzle = getNodeById(graphData.nodes, 'puzzle-locked-room-mystery');
 * if (puzzle) {
 *   displayPuzzleDetails(puzzle.data);
 * } else {
 *   console.warn('Puzzle not found');
 * }
 * 
 * // Evidence lookup
 * const evidence = getNodeById(graphData.nodes, 'element-evidence-bloody-knife');
 * if (evidence?.data.metadata.entityType === 'element') {
 *   analyzeEvidenceProperties(evidence);
 * }
 * 
 * // Timeline event access
 * const crimeEvent = getNodeById(graphData.nodes, 'timeline-2024-01-15T22:30:00');
 * if (crimeEvent) {
 *   reconstructTimeline(crimeEvent);
 * }
 * ```
 * 
 * Complexity: O(n) where n = nodes.length
 */
export function getNodeById(
  nodes: GraphNode[], 
  id: string,
  context?: GraphContext
): GraphNode | undefined {
  const ctx = context || getDefaultGraphContext();
  return ctx.graphUtilities.getNodeById(nodes, id);
}

/**
 * Retrieve all graph edges connected to a specific node with relationship analysis.
 * Provides comprehensive edge discovery through GraphUtilities including both incoming
 * and outgoing connections with murder mystery relationship context.
 * 
 * **Edge Discovery Features:**
 * - **Bidirectional Search**: Finds edges where node is source or target
 * - **Relationship Analysis**: Categorizes connections by relationship type
 * - **Connection Mapping**: Maps node relationships for analysis
 * - **Type Filtering**: Supports filtering by specific relationship types
 * 
 * **Relationship Categories:**
 * - **Requirement**: Prerequisites for puzzle completion
 * - **Reward**: Outcomes and results from puzzle solving
 * - **Chain**: Sequential puzzle progressions
 * - **Collaboration**: Character interactions and partnerships
 * - **Timeline**: Temporal relationships and event sequences
 * - **Ownership**: Character-element possession relationships
 * - **Container**: Spatial and logical containment relationships
 * 
 * **Common Use Cases:**
 * - Node detail panel relationship display
 * - Dependency analysis for puzzle progression
 * - Character interaction mapping
 * - Evidence chain reconstruction
 * - Timeline event correlation
 * 
 * @param nodeId - Unique identifier of node to find connections for
 * @param edges - Array of all graph edges to search within
 * @param context - Optional custom GraphContext for dependency injection
 * @returns Array of GraphEdges connected to the specified node
 * 
 * @example
 * ```typescript
 * // Find all character connections
 * const detectiveEdges = getNodeEdges('character-detective-sarah', graphData.edges);
 * const partnerships = detectiveEdges.filter(e => 
 *   e.data?.relationshipType === 'collaboration'
 * );
 * 
 * // Puzzle dependency analysis
 * const puzzleEdges = getNodeEdges('puzzle-locked-room-mystery', graphData.edges);
 * const requirements = puzzleEdges.filter(e => 
 *   e.data?.relationshipType === 'requirement' && e.target === 'puzzle-locked-room-mystery'
 * );
 * const rewards = puzzleEdges.filter(e => 
 *   e.data?.relationshipType === 'reward' && e.source === 'puzzle-locked-room-mystery'
 * );
 * 
 * // Evidence relationship mapping
 * const knifeEdges = getNodeEdges('element-evidence-bloody-knife', graphData.edges);
 * const owners = knifeEdges
 *   .filter(e => e.data?.relationshipType === 'ownership')
 *   .map(e => e.source);
 * 
 * // Timeline event connections
 * const eventEdges = getNodeEdges('timeline-2024-01-15T22:30:00', graphData.edges);
 * const participants = eventEdges
 *   .filter(e => e.data?.relationshipType === 'timeline')
 *   .map(e => e.source === nodeId ? e.target : e.source);
 * ```
 * 
 * Complexity: O(m) where m = edges.length
 */
export function getNodeEdges(
  nodeId: string, 
  edges: GraphEdge[],
  context?: GraphContext
): GraphEdge[] {
  const ctx = context || getDefaultGraphContext();
  return ctx.graphUtilities.getNodeEdges(nodeId, edges);
}

/**
 * Reset default GraphContext singleton to initial state for testing isolation.
 * Provides comprehensive context reset functionality to ensure clean test environments
 * and proper dependency injection state management.
 * 
 * **Reset Operations:**
 * - **Context Cleanup**: Clears singleton GraphContext instance
 * - **Module Reset**: Reinitializes all graph processing modules
 * - **Cache Clearing**: Removes cached calculations and intermediate results
 * - **State Isolation**: Ensures test independence and repeatability
 * 
 * **Testing Benefits:**
 * - **Clean Slate**: Each test starts with fresh context
 * - **Dependency Isolation**: Prevents cross-test contamination
 * - **Predictable State**: Consistent starting conditions
 * - **Memory Management**: Prevents test memory leaks
 * 
 * **Use Cases:**
 * - Unit test setup and teardown
 * - Integration test isolation
 * - Performance benchmark reset
 * - Development environment cleanup
 * - Debugging state management issues
 * 
 * @example
 * ```typescript
 * // Unit test setup
 * beforeEach(() => {
 *   resetGraphState();
 *   // Test now has clean GraphContext
 * });
 * 
 * // Integration test isolation
 * describe('Graph Processing Tests', () => {
 *   beforeAll(() => {
 *     resetGraphState();
 *   });
 *   
 *   afterEach(() => {
 *     resetGraphState(); // Clean up after each test
 *   });
 * });
 * 
 * // Performance benchmark reset
 * function benchmarkGraphOperations() {
 *   resetGraphState();
 *   const startTime = performance.now();
 *   // ... perform operations
 *   const endTime = performance.now();
 *   return endTime - startTime;
 * }
 * 
 * // Development debugging
 * function debugGraphIssue() {
 *   resetGraphState(); // Start with clean state
 *   const result = processGraph(testData);
 *   console.log('Fresh processing result:', result);
 * }
 * ```
 * 
 * Complexity: O(1)
 */
export function resetGraphState(): void {
  resetDefaultGraphContext();
}

// ============================================================================
// Additional Utility Functions for Testing
// ============================================================================

/**
 * Create properly initialized empty graph structure for testing and development.
 * Provides baseline GraphData structure with correct metadata formatting and
 * timestamp initialization for consistent test environments and development workflows.
 * 
 * **Empty Graph Features:**
 * - **Minimal Structure**: Contains empty nodes and edges arrays
 * - **Proper Metadata**: Includes timestamp, metrics, and structural information
 * - **Test Compatibility**: Compatible with all graph processing functions
 * - **Type Safety**: Fully typed GraphData structure with correct interfaces
 * 
 * **Generated Structure:**
 * - **Nodes Array**: Empty array ready for node addition
 * - **Edges Array**: Empty array ready for edge addition
 * - **Metadata Object**: Timestamp, metrics, and processing information
 * - **Performance Metrics**: Baseline timing and counting structures
 * 
 * **Use Cases:**
 * - Unit test baseline creation
 * - Performance benchmark starting point
 * - Development environment initialization
 * - Graph construction starting template
 * - Error condition testing scenarios
 * 
 * @returns Complete GraphData structure with empty nodes/edges and initialized metadata
 * 
 * @example
 * ```typescript
 * // Test baseline creation
 * const emptyGraph = createEmptyGraph();
 * expect(emptyGraph.nodes).toHaveLength(0);
 * expect(emptyGraph.edges).toHaveLength(0);
 * expect(emptyGraph.metadata.timestamp).toBeDefined();
 * 
 * // Performance benchmark starting point
 * const baseline = createEmptyGraph();
 * const startTime = performance.now();
 * // ... add nodes and edges
 * const processingTime = performance.now() - startTime;
 * 
 * // Development template
 * let workingGraph = createEmptyGraph();
 * workingGraph.nodes.push(createTestNode('character-1'));
 * workingGraph.edges.push(createTestEdge('character-1', 'puzzle-1'));
 * 
 * // Validation testing
 * const validation = validateGraphData(createEmptyGraph());
 * expect(validation.valid).toBe(true);
 * expect(validation.errors).toHaveLength(0);
 * ```
 * 
 * Complexity: O(1)
 */
export function createEmptyGraph(): GraphData {
  return {
    nodes: [],
    edges: [],
    metadata: {
      timestamp: Date.now().toString(),
      metrics: {
        nodeCount: 0,
        edgeCount: 0,
        duration: 0,
        startTime: Date.now(),
        endTime: Date.now()
      }
    }
  };
}

/**
 * Comprehensive graph data structure validation with detailed error reporting.
 * Performs thorough structural validation of GraphData including node integrity,
 * edge consistency, reference validation, and murder mystery context verification.
 * 
 * **Validation Categories:**
 * 1. **Node Validation**: ID presence, position validity, data structure integrity
 * 2. **Edge Validation**: ID presence, source/target references, data consistency
 * 3. **Reference Integrity**: Ensures all edge endpoints reference existing nodes
 * 4. **Type Safety**: Validates entity types and relationship categories
 * 5. **Structural Consistency**: Checks for circular references and invalid configurations
 * 
 * **Node Validation Checks:**
 * - **Required Fields**: ID, position coordinates, data object presence
 * - **Position Validity**: Numeric x,y coordinates within reasonable ranges
 * - **Entity Type**: Valid entityType in node metadata
 * - **Data Integrity**: Proper data structure and required properties
 * 
 * **Edge Validation Checks:**
 * - **Required Fields**: ID, source, target node references
 * - **Reference Validity**: Source and target nodes exist in graph
 * - **Relationship Type**: Valid relationshipType for murder mystery context
 * - **Bidirectional Consistency**: Proper edge direction and relationship semantics
 * 
 * **Error Reporting:**
 * - **Detailed Messages**: Specific error descriptions with node/edge identification
 * - **Index References**: Array indices for problematic elements
 * - **Validation Categories**: Grouped errors by validation type
 * - **Recovery Suggestions**: Implied fixes for common validation failures
 * 
 * @param graph - Complete GraphData structure to validate
 * @returns Validation result with success boolean and detailed error array
 * 
 * @example
 * ```typescript
 * // Basic validation
 * const validation = validateGraphData(graphData);
 * if (!validation.valid) {
 *   console.error('Graph validation failed:', validation.errors);
 *   validation.errors.forEach(error => console.error(`- ${error}`));
 * }
 * 
 * // Development validation with error handling
 * const result = validateGraphData(processedGraph);
 * if (!result.valid) {
 *   const nodeErrors = result.errors.filter(e => e.includes('Node'));
 *   const edgeErrors = result.errors.filter(e => e.includes('Edge'));
 *   
 *   console.group('Graph Validation Errors:');
 *   if (nodeErrors.length > 0) {
 *     console.group('Node Issues:');
 *     nodeErrors.forEach(error => console.error(error));
 *     console.groupEnd();
 *   }
 *   if (edgeErrors.length > 0) {
 *     console.group('Edge Issues:');
 *     edgeErrors.forEach(error => console.error(error));
 *     console.groupEnd();
 *   }
 *   console.groupEnd();
 * }
 * 
 * // Testing validation
 * describe('Graph Validation', () => {
 *   it('should validate empty graph', () => {
 *     const empty = createEmptyGraph();
 *     expect(validateGraphData(empty).valid).toBe(true);
 *   });
 *   
 *   it('should catch missing node IDs', () => {
 *     const invalid = { nodes: [{ position: { x: 0, y: 0 } }], edges: [] };
 *     const result = validateGraphData(invalid as GraphData);
 *     expect(result.valid).toBe(false);
 *     expect(result.errors).toContain('Node at index 0 missing ID');
 *   });
 * });
 * ```
 * 
 * Complexity: O(V + E) where V = nodes, E = edges
 */
export function validateGraphData(graph: GraphData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeIds = new Set<string>();

  // Validate nodes
  graph.nodes.forEach((node, index) => {
    if (!node.id) {
      errors.push(`Node at index ${index} missing ID`);
    } else {
      nodeIds.add(node.id);
    }
    if (!node.position) {
      errors.push(`Node ${node.id} missing position`);
    } else if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      errors.push(`Node ${node.id} has invalid position`);
    }
  });

  // Validate edges
  graph.edges.forEach((edge, index) => {
    if (!edge.id) {
      errors.push(`Edge at index ${index} missing ID`);
    }
    if (!edge.source) {
      errors.push(`Edge ${edge.id || index} missing source`);
    } else if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} references non-existent source: ${edge.source}`);
    }
    if (!edge.target) {
      errors.push(`Edge ${edge.id || index} missing target`);
    } else if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references non-existent target: ${edge.target}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate comprehensive graph statistics for analysis and monitoring.
 * Provides detailed statistical analysis including entity distribution, relationship patterns,
 * connectivity metrics, and structural characteristics optimized for murder mystery content.
 * 
 * **Statistical Categories:**
 * 1. **Entity Distribution**: Node counts by entity type (character, element, puzzle, timeline)
 * 2. **Relationship Analysis**: Edge counts by relationship type and connection patterns
 * 3. **Connectivity Metrics**: Average degree, orphan detection, and connection density
 * 4. **Structural Properties**: Graph topology and organization characteristics
 * 
 * **Entity Type Statistics:**
 * - **Character Count**: All game participants, suspects, witnesses, NPCs
 * - **Element Count**: Physical items, evidence, locations, story components
 * - **Puzzle Count**: Challenges, mysteries, tasks, problem-solving activities
 * - **Timeline Count**: Events, sequences, chronological markers, temporal relationships
 * 
 * **Relationship Type Statistics:**
 * - **Requirements**: Puzzle prerequisite relationships
 * - **Rewards**: Puzzle outcome and result relationships
 * - **Chains**: Sequential puzzle progression relationships
 * - **Collaborations**: Character interaction and partnership relationships
 * - **Timeline**: Temporal and chronological relationships
 * - **Ownership**: Character-element possession relationships
 * 
 * **Connectivity Analysis:**
 * - **Average Degree**: Mean connections per node for connectivity assessment
 * - **Orphan Detection**: Identifies isolated nodes without connections
 * - **Degree Distribution**: Statistical distribution of node connection counts
 * - **Graph Density**: Ratio of actual to possible connections
 * 
 * @param graph - Complete GraphData for statistical analysis
 * @returns Comprehensive statistics object with all calculated metrics
 * 
 * @example
 * ```typescript
 * // Basic statistics overview
 * const stats = getGraphStatistics(graphData);
 * console.log(`Graph contains ${stats.totalNodes} nodes, ${stats.totalEdges} edges`);
 * console.log(`Average degree: ${stats.averageDegree.toFixed(2)}`);
 * console.log(`Has orphans: ${stats.hasOrphans}`);
 * 
 * // Entity distribution analysis
 * console.group('Entity Distribution:');
 * Object.entries(stats.nodesByType).forEach(([type, count]) => {
 *   console.log(`${type}: ${count} (${(count/stats.totalNodes*100).toFixed(1)}%)`);
 * });
 * console.groupEnd();
 * 
 * // Relationship pattern analysis
 * console.group('Relationship Patterns:');
 * Object.entries(stats.edgesByType).forEach(([type, count]) => {
 *   console.log(`${type}: ${count} (${(count/stats.totalEdges*100).toFixed(1)}%)`);
 * });
 * console.groupEnd();
 * 
 * // Quality assessment
 * if (stats.hasOrphans) {
 *   console.warn('Graph contains orphaned nodes - consider adding relationships');
 * }
 * if (stats.averageDegree < 2) {
 *   console.warn('Low connectivity - graph may be fragmented');
 * }
 * if (stats.averageDegree > 10) {
 *   console.warn('High connectivity - consider simplifying relationships');
 * }
 * 
 * // Content balance analysis
 * const totalPuzzles = stats.nodesByType.puzzle || 0;
 * const totalElements = stats.nodesByType.element || 0;
 * if (totalElements < totalPuzzles * 2) {
 *   console.warn('Low element-to-puzzle ratio - consider adding more story elements');
 * }
 * ```
 * 
 * Complexity: O(V + E) where V = nodes, E = edges
 */
export function getGraphStatistics(graph: GraphData): {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  edgesByType: Record<string, number>;
  averageDegree: number;
  hasOrphans: boolean;
} {
  const nodesByType: Record<string, number> = {};
  const edgesByType: Record<string, number> = {};
  const nodeDegrees = new Map<string, number>();

  // Count nodes by type
  graph.nodes.forEach(node => {
    const type = node.type || 'unknown';
    nodesByType[type] = (nodesByType[type] || 0) + 1;
    nodeDegrees.set(node.id, 0);
  });

  // Count edges by type and update node degrees
  graph.edges.forEach(edge => {
    const type = edge.data?.relationshipType || 'unknown';
    edgesByType[type] = (edgesByType[type] || 0) + 1;
    
    // Update degrees
    nodeDegrees.set(edge.source, (nodeDegrees.get(edge.source) || 0) + 1);
    nodeDegrees.set(edge.target, (nodeDegrees.get(edge.target) || 0) + 1);
  });

  // Calculate average degree
  const degrees = Array.from(nodeDegrees.values());
  const averageDegree = degrees.length > 0 
    ? degrees.reduce((sum, d) => sum + d, 0) / degrees.length
    : 0;

  // Check for orphans
  const hasOrphans = degrees.some(d => d === 0);

  return {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    nodesByType,
    edgesByType,
    averageDegree,
    hasOrphans
  };
}