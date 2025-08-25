/**
 * ViewStrategy Interface Module
 * Strategic type definitions for murder mystery investigation graph building operations.
 * 
 * This module provides the foundational type definitions that power ALNRetool's
 * view-specific graph construction system. It defines the contract for building
 * investigation-focused graph visualizations through declarative configuration
 * and dependency injection patterns.
 * 
 * **Core Architecture:**
 * - **BuildOptions**: Comprehensive configuration for investigation graph construction
 * - **StrategyDependencies**: Dependency injection container for graph building modules
 * - **ViewConfiguration Support**: Type-safe declarative graph building parameters
 * - **Investigation Context**: Murder mystery specific filtering and expansion options
 * 
 * **Murder Mystery Integration:**
 * - **Character Investigation**: Multi-tier character analysis with role-based filtering
 * - **Evidence Tracking**: Element filtering by status and ownership patterns
 * - **Puzzle Dependencies**: Depth-aware puzzle chain exploration and visualization
 * - **Timeline Analysis**: Temporal filtering with date range constraints
 * - **Relationship Mapping**: Comprehensive entity connection discovery
 * 
 * **Dependency Injection Benefits:**
 * - **Clean Architecture**: Separates concerns between strategy and implementation
 * - **Testable Components**: Enables easy mocking and testing of graph operations
 * - **Flexible Composition**: Allows different combinations of graph building strategies
 * - **Performance Optimization**: Supports lazy loading and selective module instantiation
 * 
 * @example
 * ```typescript
 * // Character-focused investigation build
 * const characterOptions: BuildOptions = {
 *   viewType: 'character-journey',
 *   nodeId: 'char-marcus-blackwood',
 *   nodeType: 'character',
 *   maxDepth: 3,
 *   maxNodes: 50,
 *   characterFilters: {
 *     types: ['suspect', 'witness'],
 *     tiers: ['1', '2']
 *   },
 *   expansionDepth: 2
 * };
 * 
 * // Evidence analysis with temporal constraints
 * const evidenceOptions: BuildOptions = {
 *   viewType: 'content-status',
 *   statusFilter: ['found', 'analyzed'],
 *   dateRange: {
 *     start: new Date('2023-10-31'),
 *     end: new Date('2023-11-01')
 *   },
 *   maxNodes: 75
 * };
 * 
 * // Dependency injection for graph building
 * const dependencies: StrategyDependencies = {
 *   entityTransformer,     // Character/element/puzzle transformation
 *   edgeResolver,          // Relationship discovery and weighting
 *   graphFilterer,         // Multi-dimensional filtering operations
 *   traversalEngine,       // Graph analysis and pathfinding
 *   layoutOrchestrator     // Visual arrangement and optimization
 * };
 * ```
 * 
 * @see {@link EntityTransformer} - Entity-specific transformation strategies
 * @see {@link EdgeResolver} - Relationship discovery and edge creation
 * @see {@link GraphFilterer} - Multi-dimensional filtering operations
 * @see {@link TraversalEngine} - Graph analysis and traversal algorithms
 * @see {@link LayoutOrchestrator} - Layout coordination and optimization
 * 
 * @author ALNRetool Development Team
 * @since 1.0.0
 * @module ViewStrategy.interface
 */

import type { EntityTransformer } from '../modules/EntityTransformer';
import type { EdgeResolver } from '../modules/EdgeResolver';
import type { GraphFilterer } from '../modules/GraphFilterer';
import type { TraversalEngine } from '../modules/TraversalEngine';
import type { LayoutOrchestrator } from '../modules/LayoutOrchestrator';

/**
 * Comprehensive configuration options for murder mystery investigation graph construction.
 * 
 * Provides complete control over graph building process including view-specific parameters,
 * filtering criteria, expansion constraints, and investigation-focused customization.
 * This interface enables declarative graph construction optimized for different
 * investigation workflows and analysis scenarios.
 * 
 * **Configuration Categories:**
 * - **View Strategy**: Defines the primary investigation perspective and layout approach
 * - **Node Focus**: Specifies the central entity for relationship exploration
 * - **Expansion Control**: Limits traversal depth and graph size for performance
 * - **Content Filtering**: Multi-dimensional filtering by status, type, and temporal constraints
 * - **Character Analysis**: Specialized filtering for suspect and witness investigation
 * 
 * **Investigation Workflows:**
 * - **Character Journey**: Follow suspect relationships and interactions
 * - **Evidence Analysis**: Track item ownership, location, and discovery status
 * - **Puzzle Dependencies**: Explore investigation task relationships and prerequisites
 * - **Timeline Investigation**: Temporal analysis with chronological constraints
 * - **Network Analysis**: Comprehensive relationship mapping and clustering
 * 
 * **Performance Optimization:**
 * - **Depth Limits**: Prevent infinite traversal in complex relationship networks
 * - **Node Limits**: Control memory usage and rendering performance
 * - **Selective Expansion**: Focus on relevant entities for specific investigation needs
 * - **Status Filtering**: Reduce noise by filtering irrelevant or incomplete data
 * 
 * @interface BuildOptions
 * 
 * @example
 * ```typescript
 * // Comprehensive character investigation configuration
 * const characterInvestigation: BuildOptions = {
 *   viewType: 'character-journey',
 *   nodeId: 'char-detective-sarah',
 *   nodeType: 'character',
 *   maxDepth: 4,                    // Deep relationship exploration
 *   maxNodes: 100,                  // Large investigation network
 *   expandedNodes: new Set(['char-marcus', 'char-witness-1']),
 *   characterFilters: {
 *     types: ['suspect', 'witness', 'victim'],
 *     tiers: ['1', '2']             // Focus on primary suspects
 *   },
 *   expansionDepth: 3               // Moderate expansion for each character
 * };
 * 
 * // Evidence tracking with temporal constraints
 * const evidenceAnalysis: BuildOptions = {
 *   viewType: 'content-status',
 *   statusFilter: ['discovered', 'analyzed', 'verified'],
 *   dateRange: {
 *     start: new Date('2023-10-31T20:00:00Z'),  // Murder timeframe
 *     end: new Date('2023-11-01T06:00:00Z')
 *   },
 *   maxNodes: 50,
 *   maxDepth: 2
 * };
 * 
 * // Focused puzzle dependency analysis
 * const puzzleChain: BuildOptions = {
 *   viewType: 'puzzle-focus',
 *   nodeId: 'puzzle-gather-evidence',
 *   nodeType: 'puzzle',
 *   maxDepth: 5,                    // Deep dependency chain
 *   expansionDepth: 1,              // Limited lateral expansion
 *   maxNodes: 30                    // Focused investigation path
 * };
 * ```
 * 
 * @see {@link GraphFilterer} - Implements multi-dimensional filtering operations
 * @see {@link TraversalEngine} - Handles depth-limited graph traversal
 * @see {@link EntityTransformer} - Processes character and evidence transformations
 */
export interface BuildOptions {
  /** 
   * Investigation view strategy identifier for specialized graph construction.
   * 
   * Determines the primary investigation perspective and layout optimization strategy.
   * Each view type applies specific filtering, expansion, and visualization approaches
   * optimized for different investigation workflows and analysis scenarios.
   * 
   * **Supported Investigation Views:**
   * - **'character-journey'**: Character-centric relationship exploration and interaction mapping
   * - **'puzzle-focus'**: Task-oriented investigation workflow with dependency visualization
   * - **'content-status'**: Evidence and item analysis with status-based organization
   * - **'timeline'**: Temporal investigation with chronological event ordering
   * - **'node-connections'**: Comprehensive relationship network analysis
   * - **'full-network'**: Complete investigation overview with all entity types
   * 
   * @example
   * ```typescript
   * // Character relationship investigation
   * { viewType: 'character-journey' }
   * 
   * // Evidence status tracking
   * { viewType: 'content-status' }
   * 
   * // Comprehensive network analysis
   * { viewType: 'full-network' }
   * ```
   * 
   * @see {@link GraphFilterer} - Applies view-specific filtering strategies
   */
  viewType?: string;
  /** 
   * Central entity identifier for focused investigation graph construction.
   * 
   * Specifies the primary entity around which the investigation graph will be built.
   * The graph construction process will use this entity as the starting point for
   * relationship traversal and expansion, creating a focused view of connected
   * characters, evidence, puzzles, and timeline events.
   * 
   * **Entity Examples:**
   * - **Character IDs**: 'char-marcus-blackwood', 'char-detective-sarah'
   * - **Evidence IDs**: 'element-murder-weapon', 'element-witness-statement'
   * - **Puzzle IDs**: 'puzzle-gather-alibis', 'puzzle-analyze-evidence'
   * - **Timeline IDs**: 'timeline-murder-night', 'timeline-discovery'
   * 
   * @example
   * ```typescript
   * // Focus on primary suspect
   * { nodeId: 'char-marcus-blackwood', nodeType: 'character' }
   * 
   * // Analyze specific evidence item
   * { nodeId: 'element-bloody-knife', nodeType: 'element' }
   * 
   * // Explore investigation task
   * { nodeId: 'puzzle-reconstruct-timeline', nodeType: 'puzzle' }
   * ```
   * 
   * @see {@link TraversalEngine} - Performs relationship traversal from central node
   */
  nodeId?: string;
  /** 
   * Entity type classification for the central investigation node.
   * 
   * Specifies the type of the central entity to optimize traversal strategies
   * and relationship discovery. Different entity types have distinct relationship
   * patterns and expansion behaviors in murder mystery investigations.
   * 
   * **Entity Type Behaviors:**
   * - **'character'**: Explores interpersonal relationships, ownership, and interactions
   * - **'element'**: Traces evidence chains, ownership history, and discovery relationships
   * - **'puzzle'**: Maps investigation task dependencies, prerequisites, and rewards
   * - **'timeline'**: Analyzes temporal relationships and chronological connections
   * 
   * **Relationship Patterns:**
   * - **Character relationships**: collaboration, ownership, interaction, witness
   * - **Element relationships**: ownership, container, discovery, evidence
   * - **Puzzle relationships**: requirement, reward, chain, dependency
   * - **Timeline relationships**: temporal, sequence, causation, reference
   * 
   * @example
   * ```typescript
   * // Character-focused investigation
   * { nodeId: 'char-suspect', nodeType: 'character' }
   * 
   * // Evidence analysis
   * { nodeId: 'evidence-weapon', nodeType: 'element' }
   * 
   * // Task dependency mapping
   * { nodeId: 'task-interview', nodeType: 'puzzle' }
   * 
   * // Timeline event analysis
   * { nodeId: 'event-murder', nodeType: 'timeline' }
   * ```
   * 
   * @see {@link EntityTransformer} - Handles type-specific entity transformations
   */
  nodeType?: 'character' | 'element' | 'puzzle' | 'timeline';
  /** 
   * Maximum traversal depth for relationship exploration in investigation network.
   * 
   * Controls how far the graph construction process will traverse from the central
   * entity when discovering connected relationships. Higher depths provide more
   * comprehensive views but may impact performance and visual clarity.
   * 
   * **Depth Guidelines:**
   * - **Depth 1**: Direct relationships only (immediate connections)
   * - **Depth 2-3**: Local investigation cluster (recommended for focused analysis)
   * - **Depth 4-5**: Extended network analysis (comprehensive but complex)
   * - **Depth 6+**: Full network exploration (use with caution)
   * 
   * **Investigation Scenarios:**
   * - **Quick Analysis**: maxDepth: 2 for rapid suspect relationship overview
   * - **Standard Investigation**: maxDepth: 3-4 for thorough evidence analysis
   * - **Complex Networks**: maxDepth: 5+ for comprehensive relationship mapping
   * 
   * **Performance Considerations:**
   * - Higher depths exponentially increase node count and processing time
   * - Consider combining with maxNodes limit for performance optimization
   * - Deep traversal may reveal noise relationships irrelevant to investigation
   * 
   * @default 3
   * 
   * @example
   * ```typescript
   * // Quick suspect overview
   * { maxDepth: 2, nodeId: 'char-suspect' }
   * 
   * // Thorough evidence analysis
   * { maxDepth: 4, nodeType: 'element' }
   * 
   * // Comprehensive network mapping
   * { maxDepth: 6, maxNodes: 100 }
   * ```
   * 
   * @see {@link TraversalEngine} - Implements depth-limited graph traversal
   */
  maxDepth?: number;
  /** 
   * Maximum number of nodes to include in investigation graph for performance optimization.
   * 
   * Provides hard limit on graph size to ensure responsive rendering and analysis.
   * The graph construction process will prioritize most relevant entities based on
   * relationship strength, investigation importance, and proximity to central focus.
   * 
   * **Size Guidelines:**
   * - **Small Focus**: 20-50 nodes for specific investigation questions
   * - **Standard Analysis**: 50-100 nodes for comprehensive relationship mapping
   * - **Large Investigation**: 100-200 nodes for complex network analysis
   * - **Performance Limit**: 500+ nodes may impact rendering and interaction
   * 
   * **Node Prioritization:**
   * - Nodes closer to central entity (lower traversal depth) are prioritized
   * - Entities with higher relationship counts get preference
   * - Investigation-critical entities (suspects, key evidence) are preserved
   * - Less connected entities may be filtered out when limit is reached
   * 
   * **Investigation Balance:**
   * - Consider investigation complexity vs. performance requirements
   * - Use in combination with depth limits for optimal results
   * - Higher limits provide completeness at cost of performance
   * 
   * @default 100
   * 
   * @example
   * ```typescript
   * // Focused investigation
   * { maxNodes: 30, viewType: 'character-journey' }
   * 
   * // Standard evidence analysis
   * { maxNodes: 75, viewType: 'content-status' }
   * 
   * // Comprehensive network view
   * { maxNodes: 150, viewType: 'full-network' }
   * ```
   * 
   * @see {@link GraphFilterer} - Implements node prioritization and filtering
   */
  maxNodes?: number;
  /** 
   * Set of entity IDs that should be expanded beyond standard traversal limits.
   * 
   * Allows specific entities to bypass normal depth and expansion constraints,
   * ensuring critical investigation entities are fully explored regardless of
   * their position in the relationship network. Useful for preserving important
   * suspects, key evidence, or pivotal investigation tasks.
   * 
   * **Expansion Benefits:**
   * - **Critical Entity Preservation**: Ensure key suspects are fully connected
   * - **Evidence Chain Completion**: Maintain complete ownership and discovery paths
   * - **Investigation Focus**: Highlight specific entities of interest
   * - **Constraint Override**: Bypass normal depth limits for selected entities
   * 
   * **Use Cases:**
   * - Primary suspects requiring comprehensive relationship mapping
   * - Key evidence items with complex ownership or discovery chains
   * - Central investigation tasks with extensive dependency networks
   * - Timeline events with broad impact on multiple investigation threads
   * 
   * **Performance Impact:**
   * - Expanded nodes may significantly increase final graph size
   * - Consider impact on maxNodes limit and rendering performance
   * - Balance investigation completeness with visual clarity
   * 
   * @example
   * ```typescript
   * // Ensure primary suspects are fully expanded
   * {
   *   expandedNodes: new Set([
   *     'char-marcus-blackwood',    // Primary suspect
   *     'char-sarah-detective',     // Lead investigator
   *     'element-murder-weapon'     // Critical evidence
   *   ]),
   *   maxDepth: 3
   * }
   * 
   * // Preserve key investigation tasks
   * {
   *   expandedNodes: new Set([
   *     'puzzle-gather-evidence',
   *     'puzzle-interview-witnesses'
   *   ]),
   *   viewType: 'puzzle-focus'
   * }
   * ```
   * 
   * @see {@link TraversalEngine} - Handles expanded node traversal logic
   */
  expandedNodes?: Set<string>;
  /** 
   * Investigation status filter for evidence and task-based entity filtering.
   * 
   * Filters graph entities based on their current investigation status,
   * allowing focus on specific stages of evidence analysis or task completion.
   * Essential for tracking investigation progress and identifying gaps.
   * 
   * **Common Investigation Statuses:**
   * - **Evidence Statuses**: 'discovered', 'collected', 'analyzed', 'verified', 'inconclusive'
   * - **Task Statuses**: 'pending', 'in-progress', 'completed', 'blocked', 'failed'
   * - **Character Statuses**: 'suspect', 'cleared', 'person-of-interest', 'witness'
   * - **Timeline Statuses**: 'confirmed', 'estimated', 'disputed', 'unknown'
   * 
   * **Investigation Workflows:**
   * - **Active Investigation**: ['pending', 'in-progress'] for current work
   * - **Evidence Review**: ['analyzed', 'verified'] for confirmed findings
   * - **Gap Analysis**: ['unknown', 'inconclusive'] for investigation holes
   * - **Progress Tracking**: ['completed'] for accomplished investigation tasks
   * 
   * **Multi-Status Logic:**
   * - Array represents OR logic (entity matches any status in array)
   * - Empty array or undefined includes all statuses
   * - Use strategic combinations for focused investigation views
   * 
   * @example
   * ```typescript
   * // Focus on active evidence analysis
   * { statusFilter: ['discovered', 'collected', 'analyzed'] }
   * 
   * // Review completed investigation tasks
   * { statusFilter: ['completed', 'verified'] }
   * 
   * // Identify investigation gaps
   * { statusFilter: ['unknown', 'inconclusive', 'pending'] }
   * 
   * // Track current suspects
   * { statusFilter: ['suspect', 'person-of-interest'] }
   * ```
   * 
   * @see {@link GraphFilterer} - Implements status-based filtering logic
   */
  statusFilter?: string[];
  /** 
   * Temporal filtering constraints for timeline-based investigation analysis.
   * 
   * Filters graph entities based on their temporal associations, enabling
   * focused analysis of specific time periods critical to the investigation.
   * Essential for timeline reconstruction, alibi verification, and temporal
   * relationship analysis in murder mystery investigations.
   * 
   * **Date Range Components:**
   * - **start**: Beginning of investigation time period (inclusive)
   * - **end**: End of investigation time period (inclusive)
   * - **Partial Ranges**: Support start-only or end-only constraints
   * 
   * **Investigation Applications:**
   * - **Murder Timeframe**: Focus on critical hours around the crime
   * - **Discovery Period**: Analyze evidence discovery and initial investigation
   * - **Alibi Windows**: Examine specific time periods for suspect verification
   * - **Event Sequences**: Track chronological development of investigation
   * 
   * **Entity Temporal Associations:**
   * - **Timeline Events**: Direct temporal entities with specific timestamps
   * - **Evidence Discovery**: Items with discovery or analysis dates
   * - **Character Actions**: Activities with temporal associations
   * - **Investigation Tasks**: Puzzles with time-based constraints or completion
   * 
   * **Filtering Logic:**
   * - Entities with timestamps within range are included
   * - Entities without temporal data may be excluded or included based on view strategy
   * - Range boundaries are inclusive for comprehensive analysis
   * 
   * @example
   * ```typescript
   * // Murder night timeframe (Halloween 2023)
   * {
   *   dateRange: {
   *     start: new Date('2023-10-31T20:00:00Z'),
   *     end: new Date('2023-11-01T02:00:00Z')
   *   },
   *   viewType: 'timeline'
   * }
   * 
   * // Evidence discovery period
   * {
   *   dateRange: {
   *     start: new Date('2023-11-01T06:00:00Z'),
   *     end: new Date('2023-11-03T18:00:00Z')
   *   },
   *   statusFilter: ['discovered', 'collected']
   * }
   * 
   * // Open-ended investigation (from crime onwards)
   * {
   *   dateRange: {
   *     start: new Date('2023-10-31T22:30:00Z')
   *   }
   * }
   * ```
   * 
   * @see {@link GraphFilterer} - Handles temporal filtering operations
   * @see {@link TraversalEngine} - Manages timeline-based entity traversal
   */
  dateRange?: { start?: Date; end?: Date };
  /** 
   * Specialized character filtering configuration for suspect and witness analysis.
   * 
   * Provides granular control over character inclusion based on investigation
   * roles and importance tiers. Essential for focusing analysis on relevant
   * characters while managing graph complexity in large cast investigations.
   * 
   * **Character Type Categories:**
   * - **Investigation Roles**: 'suspect', 'witness', 'victim', 'investigator'
   * - **Character Relationships**: 'family', 'friend', 'colleague', 'stranger'
   * - **Investigation Status**: 'cleared', 'person-of-interest', 'unknown'
   * - **Story Roles**: 'protagonist', 'antagonist', 'supporting', 'background'
   * 
   * **Tier System (Investigation Importance):**
   * - **Tier 1**: Primary suspects and key witnesses (highest priority)
   * - **Tier 2**: Secondary suspects and important witnesses
   * - **Tier 3**: Background characters and minor witnesses
   * - **Tier 4**: Peripheral characters with minimal investigation relevance
   * 
   * **Filtering Strategy:**
   * - **types**: OR logic for character roles (matches any type in array)
   * - **tiers**: OR logic for importance levels (matches any tier in array)
   * - **Combined Logic**: Character must match both type AND tier criteria
   * - **Empty Arrays**: Include all characters for that dimension
   * 
   * **Investigation Workflows:**
   * - **Primary Investigation**: Focus on Tier 1-2 suspects and witnesses
   * - **Comprehensive Review**: Include all tiers for complete analysis
   * - **Background Analysis**: Examine Tier 3-4 for overlooked connections
   * - **Role-Specific**: Focus on specific character types (e.g., only suspects)
   * 
   * @example
   * ```typescript
   * // Focus on primary investigation targets
   * {
   *   characterFilters: {
   *     types: ['suspect', 'witness'],
   *     tiers: ['1', '2']
   *   },
   *   viewType: 'character-journey'
   * }
   * 
   * // Comprehensive suspect analysis
   * {
   *   characterFilters: {
   *     types: ['suspect', 'person-of-interest'],
   *     tiers: ['1', '2', '3']
   *   },
   *   maxDepth: 4
   * }
   * 
   * // Background character exploration
   * {
   *   characterFilters: {
   *     types: ['family', 'friend', 'colleague'],
   *     tiers: ['3', '4']
   *   },
   *   maxNodes: 50
   * }
   * 
   * // Victim relationship analysis
   * {
   *   characterFilters: {
   *     types: ['victim', 'family', 'friend']
   *   },
   *   nodeId: 'char-victim',
   *   maxDepth: 3
   * }
   * ```
   * 
   * @see {@link GraphFilterer} - Implements character-specific filtering logic
   * @see {@link EntityTransformer} - Handles character transformation and classification
   */
  characterFilters?: {
    /** Character role types for investigation focus filtering */
    types?: string[];
    /** Investigation importance tiers for priority-based filtering */
    tiers?: string[];
  };
  /** 
   * Individual entity expansion depth for granular relationship exploration control.
   * 
   * Defines how deeply each discovered entity should be explored for additional
   * relationships beyond the initial traversal. Provides fine-grained control
   * over graph expansion while maintaining overall traversal depth limits.
   * 
   * **Expansion vs. Traversal Depth:**
   * - **maxDepth**: Controls initial traversal distance from central entity
   * - **expansionDepth**: Controls relationship exploration for each discovered entity
   * - **Combined Effect**: Total depth = maxDepth + expansionDepth
   * 
   * **Expansion Strategies:**
   * - **Conservative (1-2)**: Minimal expansion for clean, focused graphs
   * - **Moderate (2-3)**: Balanced exploration for thorough investigation
   * - **Aggressive (3+)**: Deep expansion for comprehensive relationship mapping
   * 
   * **Investigation Applications:**
   * - **Character Networks**: Expand each character to show all relationships
   * - **Evidence Chains**: Follow each evidence item's complete ownership history
   * - **Puzzle Dependencies**: Explore full dependency trees for each task
   * - **Timeline Connections**: Map all temporal relationships for each event
   * 
   * **Performance Considerations:**
   * - Higher expansion depths can exponentially increase graph size
   * - Consider memory and rendering performance with deep expansions
   * - Balance investigation completeness with visual clarity and responsiveness
   * 
   * @default 2
   * 
   * @example
   * ```typescript
   * // Focused character analysis with minimal expansion
   * {
   *   nodeId: 'char-suspect',
   *   maxDepth: 2,
   *   expansionDepth: 1,    // Just direct relationships for each character
   *   characterFilters: { types: ['suspect'] }
   * }
   * 
   * // Comprehensive evidence analysis
   * {
   *   viewType: 'content-status',
   *   maxDepth: 3,
   *   expansionDepth: 3,    // Deep exploration of each evidence item
   *   statusFilter: ['analyzed']
   * }
   * 
   * // Balanced investigation network
   * {
   *   viewType: 'full-network',
   *   maxDepth: 3,
   *   expansionDepth: 2,    // Moderate expansion for comprehensive view
   *   maxNodes: 100
   * }
   * ```
   * 
   * @see {@link TraversalEngine} - Implements expansion depth logic
   * @see {@link GraphFilterer} - Manages expansion constraints and filtering
   */
  expansionDepth?: number;
}

/**
 * Dependency injection container for murder mystery investigation graph building components.
 * 
 * Defines the complete set of specialized modules required for constructing
 * investigation-focused graph visualizations. Each dependency handles a specific
 * aspect of the graph building pipeline, from entity transformation to visual
 * layout optimization.
 * 
 * **Dependency Injection Benefits:**
 * - **Modular Architecture**: Clean separation of concerns between graph building phases
 * - **Testable Components**: Easy mocking and unit testing of individual modules
 * - **Flexible Composition**: Different combinations for various investigation strategies
 * - **Performance Optimization**: Lazy loading and selective module instantiation
 * - **Configuration Management**: Module-specific configuration and optimization
 * 
 * **Graph Building Pipeline:**
 * 1. **EntityTransformer**: Convert raw investigation data into graph nodes
 * 2. **EdgeResolver**: Discover and create relationships between entities
 * 3. **GraphFilterer**: Apply investigation-specific filtering and constraints
 * 4. **TraversalEngine**: Navigate relationship networks and perform analysis
 * 5. **LayoutOrchestrator**: Optimize visual arrangement and positioning
 * 
 * **Investigation Specialization:**
 * - **Character Analysis**: Relationship mapping and social network construction
 * - **Evidence Tracking**: Ownership chains and discovery relationship analysis
 * - **Puzzle Dependencies**: Investigation task workflow and prerequisite mapping
 * - **Timeline Construction**: Temporal relationship analysis and chronological ordering
 * - **Multi-Modal Integration**: Coordinated analysis across all entity types
 * 
 * **Module Coordination:**
 * - Dependencies work together through well-defined interfaces
 * - Shared context and configuration across all modules
 * - Consistent error handling and validation strategies
 * - Performance monitoring and optimization coordination
 * 
 * @interface StrategyDependencies
 * 
 * @example
 * ```typescript
 * // Complete dependency injection setup for investigation
 * const dependencies: StrategyDependencies = {
 *   entityTransformer: new EntityTransformer({
 *     characterTypeMapping: murderMysteryCharacterTypes,
 *     evidenceClassification: evidenceCategories
 *   }),
 *   
 *   edgeResolver: new EdgeResolver({
 *     relationshipWeights: investigationRelationshipPriority,
 *     virtualEdgeStrategy: 'comprehensive'
 *   }),
 *   
 *   graphFilterer: new GraphFilterer({
 *     defaultFilters: standardInvestigationFilters,
 *     performanceOptimizations: true
 *   }),
 *   
 *   traversalEngine: new TraversalEngine({
 *     pathfindingAlgorithm: 'bidirectional-bfs',
 *     cycleDetection: true
 *   }),
 *   
 *   layoutOrchestrator: new LayoutOrchestrator({
 *     defaultAlgorithm: 'dagre',
 *     viewOptimizations: investigationViewOptimizations
 *   })
 * };
 * 
 * // Use dependencies in graph construction
 * const investigationGraph = await buildGraphFromDependencies(
 *   rawInvestigationData,
 *   buildOptions,
 *   dependencies
 * );
 * ```
 * 
 * @see {@link EntityTransformer} - Entity transformation and node creation
 * @see {@link EdgeResolver} - Relationship discovery and edge construction
 * @see {@link GraphFilterer} - Multi-dimensional filtering and constraint application
 * @see {@link TraversalEngine} - Graph navigation and analysis algorithms
 * @see {@link LayoutOrchestrator} - Visual layout coordination and optimization
 */
export interface StrategyDependencies {
  /** 
   * Entity transformation module for converting raw investigation data into graph nodes.
   * 
   * Handles the conversion of characters, evidence, puzzles, and timeline events
   * from their source data format into standardized graph node representations.
   * Applies murder mystery specific transformations and metadata enrichment.
   * 
   * **Transformation Responsibilities:**
   * - **Character Processing**: Convert character data into suspect/witness nodes
   * - **Evidence Transformation**: Process items and clues into evidence nodes
   * - **Puzzle Conversion**: Transform investigation tasks into puzzle nodes
   * - **Timeline Processing**: Convert events into temporal graph nodes
   * - **Metadata Enrichment**: Add investigation-specific properties and classifications
   * 
   * @see {@link EntityTransformer} - Implementation details and configuration options
   */
  entityTransformer: EntityTransformer;
  /** 
   * Edge resolution module for discovering and creating relationships between investigation entities.
   * 
   * Analyzes entity data to identify implicit and explicit relationships, creating
   * weighted graph edges that represent the connections between characters, evidence,
   * puzzles, and timeline events in the murder mystery investigation.
   * 
   * **Relationship Discovery:**
   * - **Character Relationships**: Interpersonal connections, interactions, and social networks
   * - **Evidence Relationships**: Ownership, discovery, containment, and forensic connections
   * - **Puzzle Relationships**: Dependencies, prerequisites, rewards, and investigation workflows
   * - **Timeline Relationships**: Temporal connections, causation, and sequence relationships
   * - **Cross-Type Relationships**: Character-evidence, puzzle-timeline, and hybrid connections
   * 
   * @see {@link EdgeResolver} - Implementation details and relationship weighting strategies
   */
  edgeResolver: EdgeResolver;
  /** 
   * Multi-dimensional filtering module for applying investigation-specific constraints.
   * 
   * Handles complex filtering operations including status-based filtering, temporal
   * constraints, character role filtering, and investigation priority management.
   * Essential for creating focused investigation views from comprehensive data.
   * 
   * **Filtering Capabilities:**
   * - **Status Filtering**: Filter by evidence analysis status, task completion, character clearance
   * - **Temporal Filtering**: Date range constraints for timeline-based investigation
   * - **Character Filtering**: Role-based and tier-based character inclusion/exclusion
   * - **Depth Filtering**: Traversal depth limits and expansion constraints
   * - **Priority Filtering**: Investigation importance and relevance-based filtering
   * 
   * @see {@link GraphFilterer} - Implementation details and filtering strategy configuration
   */
  graphFilterer: GraphFilterer;
  /** 
   * Graph traversal and analysis engine for relationship navigation and pathfinding.
   * 
   * Provides sophisticated graph analysis capabilities including depth-limited traversal,
   * shortest path finding, cycle detection, and connected component analysis.
   * Essential for investigating relationship networks and analyzing entity connections.
   * 
   * **Traversal Capabilities:**
   * - **Depth-Limited Search**: Controlled exploration of relationship networks
   * - **Pathfinding Algorithms**: Shortest paths between investigation entities
   * - **Cycle Detection**: Identify circular relationships and dependencies
   * - **Component Analysis**: Find disconnected investigation clusters
   * - **Relationship Analysis**: Measure connectivity and relationship strength
   * 
   * @see {@link TraversalEngine} - Implementation details and algorithm configuration
   */
  traversalEngine: TraversalEngine;
  /** 
   * Layout coordination module for optimizing visual arrangement and positioning.
   * 
   * Manages the selection and application of layout algorithms to create visually
   * effective investigation graphs. Coordinates between different layout strategies
   * and applies view-specific optimizations for different investigation workflows.
   * 
   * **Layout Coordination:**
   * - **Algorithm Selection**: Choose optimal layout based on graph characteristics
   * - **View Optimization**: Apply investigation-specific visual arrangements
   * - **Performance Management**: Balance visual quality with rendering performance
   * - **Progressive Layout**: Support for large graphs with incremental positioning
   * - **Quality Metrics**: Evaluate and optimize layout effectiveness
   * 
   * @see {@link LayoutOrchestrator} - Implementation details and layout strategy configuration
   */
  layoutOrchestrator: LayoutOrchestrator;
}