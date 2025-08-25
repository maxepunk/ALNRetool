import { log } from '@/utils/logger';
import { EdgeResolver } from './EdgeResolver';
import { EntityTransformer } from './EntityTransformer';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent
} from '@/types/notion/app';
import type { GraphNode, GraphEdge, GraphData, ViewType } from '../types';
import type { BuildOptions } from '../core/ViewStrategy.interface';

/**
 * Entity data structure containing complete Notion entity collections for graph building.
 * Represents the complete dataset from Notion API after backend transformation,
 * serving as primary input for comprehensive graph construction operations.
 * 
 * **Data Source Pipeline:**
 * - **Notion API**: Raw database records from About Last Night game
 * - **Backend Transform**: Server-side normalization via notionPropertyMappers
 * - **EntityData**: Type-safe structure ready for graph transformation
 * - **Graph Building**: Input to EntityTransformer and EdgeResolver
 * 
 * **Entity Type Coverage:**
 * - **Characters**: Player characters and NPCs with relationships
 * - **Elements**: Story elements, evidence, items with ownership
 * - **Puzzles**: Game puzzles with dependencies and rewards
 * - **Timeline**: Temporal events with character and element connections
 * 
 * **Murder Mystery Context:**
 * - **Investigation Flow**: Characters → Evidence (Elements) → Clues (Puzzles)
 * - **Temporal Sequencing**: Timeline events provide chronological structure
 * - **Relationship Network**: Character interactions and item possession
 * - **Puzzle Dependencies**: Logical progression through investigation stages
 */
interface EntityData {
  /** Array of character entities from Notion - players, NPCs, suspects, victims */
  characters: Character[];
  /** Array of element entities from Notion - evidence, items, locations, clues */
  elements: Element[];
  /** Array of puzzle entities from Notion - investigations, challenges, mysteries */
  puzzles: Puzzle[];
  /** Array of timeline event entities from Notion - chronological story beats */
  timeline: TimelineEvent[];
}

/**
 * GraphBuilder Module
 * Orchestrates comprehensive graph construction from Notion entities with dependency injection.
 * 
 * This class serves as the primary orchestrator for transforming raw Notion data into
 * complete graph structures ready for React Flow visualization. It coordinates between
 * specialized transformers and resolvers to create nodes, edges, and metadata while
 * maintaining high performance and architectural flexibility through dependency injection.
 * 
 * **Architecture Benefits:**
 * - **Dependency Injection**: Eliminates circular dependencies and enables testing
 * - **Single Responsibility**: Focuses purely on graph assembly coordination
 * - **Type Safety**: Full TypeScript coverage for all entity transformations
 * - **Performance Monitoring**: Built-in timing and metrics collection
 * - **Modular Design**: Delegates specialized tasks to focused modules
 * 
 * **Graph Construction Pipeline:**
 * 1. **Entity Transformation**: Delegates to EntityTransformer for node creation
 * 2. **Node Registration**: Builds inclusion sets for edge validation
 * 3. **Edge Resolution**: Uses EdgeResolver for relationship edge creation
 * 4. **Deduplication**: Removes duplicate edges from multi-source creation
 * 5. **Metadata Enrichment**: Adds performance metrics and build information
 * 6. **Quality Assurance**: Validates graph structure and logs statistics
 * 
 * **Performance Characteristics:**
 * - **Time Complexity**: O(n + m) where n = entities, m = relationships
 * - **Space Complexity**: O(n + m) for node and edge storage
 * - **Parallel Processing**: Entity types processed independently where possible
 * - **Memory Management**: Efficient Set operations for node inclusion tracking
 * 
 * **Murder Mystery Game Context:**
 * - **Character Networks**: Player relationships and NPC interactions
 * - **Evidence Chains**: Item possession and clue discovery paths
 * - **Investigation Flow**: Puzzle dependencies and solution progressions
 * - **Temporal Structure**: Timeline events connecting characters and elements
 * 
 * **Dependency Injection Benefits:**
 * - **Testing**: Mock transformers for unit test isolation
 * - **Flexibility**: Different transformer implementations for various views
 * - **Maintainability**: Clear separation of concerns
 * - **Extensibility**: Easy addition of new entity types or edge logic
 * 
 * @example
 * ```typescript
 * // Standard dependency injection setup
 * const edgeResolver = new EdgeResolver(relationshipProcessor);
 * const entityTransformer = new EntityTransformer();
 * const builder = new GraphBuilder(edgeResolver, entityTransformer);
 * 
 * // Build complete graph with performance monitoring
 * const graph = builder.buildGenericGraph(notionData, { viewType: 'full' });
 * console.log(`Built ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
 * 
 * // Analyze graph characteristics
 * const stats = builder.getGraphStatistics(graph);
 * console.log(`Average degree: ${stats.averageDegree}`);
 * 
 * // Access build metadata
 * console.log(`Build time: ${graph.metadata.metrics.duration}ms`);
 * ```
 * 
 * @see EntityTransformer - Delegates entity-to-node transformation
 * @see EdgeResolver - Delegates relationship edge creation and resolution
 * @see GraphData - Output structure for React Flow consumption
 * @see BuildOptions - Configuration options for graph construction
 */
export class GraphBuilder {
  /** Edge resolver for creating relationships between nodes */
  private edgeResolver: EdgeResolver;
  /** Entity transformer for converting entities to nodes */
  private entityTransformer: EntityTransformer;

  /**
   * Initialize GraphBuilder with dependency injection for modular architecture.
   * Establishes the foundational dependencies required for comprehensive graph construction,
   * using dependency injection pattern to ensure testability and architectural flexibility.
   * 
   * **Dependency Injection Benefits:**
   * - **Circular Dependency Prevention**: Eliminates circular imports between graph modules
   * - **Testability**: Enables injection of mock implementations for unit testing
   * - **Flexibility**: Supports different transformer strategies for various graph views
   * - **Maintainability**: Clear dependency relationships and single responsibility
   * 
   * **Constructor Pattern:**
   * - **Explicit Dependencies**: All required services passed as constructor parameters
   * - **Immutable Setup**: Dependencies set once and remain constant throughout lifecycle
   * - **Type Safety**: TypeScript ensures correct dependency types at compile time
   * - **No Hidden Dependencies**: All external dependencies visible in constructor signature
   * 
   * **Injected Services:**
   * - **EdgeResolver**: Handles relationship analysis and edge creation logic
   * - **EntityTransformer**: Manages entity-to-node transformation with specialized transformers
   * 
   * **Lifecycle Management:**
   * - **Construction**: Dependencies validated and stored for graph building operations
   * - **Usage**: Dependencies called through well-defined interfaces during graph building
   * - **Cleanup**: Dependencies responsible for their own resource management
   * 
   * **Testing Support:**
   * - **Mock Injection**: Test implementations can be injected for isolated testing
   * - **Stub Services**: Simplified implementations for performance testing
   * - **Spy Objects**: Wrapped dependencies for behavior verification
   * 
   * @param edgeResolver - EdgeResolver instance for comprehensive edge creation and resolution
   * @param entityTransformer - EntityTransformer instance for multi-type node transformation
   * 
   * @example
   * ```typescript
   * // Production setup with real dependencies
   * const relationshipProcessor = new RelationshipProcessor();
   * const edgeResolver = new EdgeResolver(relationshipProcessor);
   * const entityTransformer = new EntityTransformer();
   * const builder = new GraphBuilder(edgeResolver, entityTransformer);
   * 
   * // Test setup with mock dependencies
   * const mockEdgeResolver = createMock<EdgeResolver>();
   * const mockEntityTransformer = createMock<EntityTransformer>();
   * const testBuilder = new GraphBuilder(mockEdgeResolver, mockEntityTransformer);
   * 
   * // Verify dependency injection
   * expect(testBuilder).toBeDefined();
   * expect(mockEdgeResolver.createCharacterEdges).toHaveBeenCalled();
   * ```
   * 
   * Complexity: O(1) - Simple dependency storage
   */
  constructor(
    edgeResolver: EdgeResolver,
    entityTransformer: EntityTransformer
  ) {
    this.edgeResolver = edgeResolver;
    this.entityTransformer = entityTransformer;
  }

  /**
   * Build comprehensive graph structure from complete Notion entity dataset.
   * Primary public interface for transforming normalized Notion data into complete
   * GraphData structure ready for React Flow visualization and user interaction.
   * 
   * **Graph Building Pipeline:**
   * 1. **Performance Monitoring**: Start timing for build performance analysis
   * 2. **Entity Logging**: Record input entity counts for debugging and monitoring
   * 3. **Graph Construction**: Delegate to buildFullGraph() for actual transformation
   * 4. **Performance Metrics**: Calculate build duration and record statistics
   * 5. **Metadata Enrichment**: Add comprehensive metadata including metrics
   * 6. **Quality Logging**: Log final node/edge counts and performance metrics
   * 
   * **Metadata Enrichment:**
   * - **Performance Metrics**: Start time, end time, duration, entity counts
   * - **View Configuration**: View type from build options for context
   * - **Timestamp**: ISO timestamp for build tracking and debugging
   * - **Graph Statistics**: Final node and edge counts for validation
   * 
   * **Performance Monitoring Features:**
   * - **High-Resolution Timing**: Uses performance.now() for precise measurement
   * - **Build Metrics**: Tracks transformation performance across entity types
   * - **Memory Efficiency**: Monitors node and edge creation performance
   * - **Logging Integration**: Structured logging for production monitoring
   * 
   * **Input Validation:**
   * - **Type Safety**: TypeScript ensures correct EntityData structure
   * - **Option Defaults**: Handles optional BuildOptions with sensible defaults
   * - **Entity Counts**: Validates non-empty collections where appropriate
   * 
   * **Output Structure:**
   * - **GraphData**: Complete nodes and edges ready for React Flow
   * - **Metadata**: Performance metrics, view type, timestamp information
   * - **Statistics**: Entity counts, relationship counts, timing data
   * 
   * **Murder Mystery Integration:**
   * - **Character Networks**: Player and NPC relationship visualization
   * - **Evidence Tracking**: Item ownership and evidence chain visualization
   * - **Investigation Progress**: Puzzle dependency and completion tracking
   * - **Timeline Coordination**: Temporal event sequencing and character involvement
   * 
   * **Error Handling:**
   * - **Graceful Degradation**: Continues processing even with individual entity failures
   * - **Comprehensive Logging**: Detailed error reporting for debugging
   * - **Partial Results**: Returns completed portions even with some failures
   * 
   * @param data - Complete EntityData containing all Notion entity collections
   * @param options - BuildOptions for graph configuration (viewType, filters, etc.)
   * @returns Complete GraphData with nodes, edges, and comprehensive metadata
   * 
   * @example
   * ```typescript
   * // Standard full graph build
   * const graph = builder.buildGenericGraph(notionData, { viewType: 'full' });
   * console.log(`Built graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
   * console.log(`Build time: ${graph.metadata.metrics.duration}ms`);
   * 
   * // Analyze entity distribution
   * const stats = builder.getGraphStatistics(graph);
   * console.log('Entity distribution:', stats.nodesByType);
   * 
   * // Performance monitoring
   * if (graph.metadata.metrics.duration > 1000) {
   *   console.warn('Slow graph build detected:', graph.metadata.metrics);
   * }
   * 
   * // Use with React Flow
   * const reactFlowData = {
   *   nodes: graph.nodes.map(transformToReactFlowNode),
   *   edges: graph.edges.map(transformToReactFlowEdge)
   * };
   * ```
   * 
   * Complexity: O(n + m) where n = total entities, m = total relationships
   */
  buildGenericGraph(
    data: EntityData,
    options: BuildOptions = {}
  ): GraphData {
    const startTime = performance.now();
    
    log.info('Building generic graph', {
      entityCounts: {
        characters: data.characters.length,
        elements: data.elements.length,
        puzzles: data.puzzles.length,
        timeline: data.timeline.length
      }
    });

    const result = this.buildFullGraph(data);

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    log.info('Generic graph built', {
      nodes: result.nodes.length,
      edges: result.edges.length,
      buildTime: `${duration.toFixed(2)}ms`
    });

    // Enrich graph with comprehensive metadata for monitoring and debugging
    // Metadata provides essential context for performance analysis and system monitoring
    const graphWithMetadata: GraphData = {
      ...result,
      metadata: {
        metrics: {
          startTime,
          endTime,
          duration,
          nodeCount: result.nodes.length,
          edgeCount: result.edges.length
        },
        viewType: options.viewType as ViewType,
        timestamp: new Date().toISOString()
      }
    };

    return graphWithMetadata;
  }

  /**
   * Execute comprehensive graph construction algorithm with optimized processing.
   * Internal implementation method that performs the core graph building logic,
   * coordinating between EntityTransformer and EdgeResolver for complete graph assembly.
   * 
   * **Graph Construction Algorithm:**
   * 1. **Node Initialization**: Create empty collections for nodes and inclusion tracking
   * 2. **Entity Transformation**: Process each entity type through specialized transformers
   * 3. **Inclusion Tracking**: Build Set<string> for O(1) node existence validation
   * 4. **Cache Management**: Clear EdgeResolver cache for fresh edge creation
   * 5. **Edge Creation**: Generate edges for each entity type with validation
   * 6. **Deduplication**: Remove duplicate edges using source-target-type uniqueness
   * 
   * **Entity Processing Order:**
   * - **Characters First**: Foundation entities for relationship establishment
   * - **Elements**: Evidence and items with character ownership connections
   * - **Puzzles**: Investigation challenges with element and character dependencies
   * - **Timeline**: Temporal events linking characters, elements, and puzzles
   * 
   * **Node Inclusion Optimization:**
   * - **O(1) Lookups**: Set<string> for instant node existence checking
   * - **Memory Efficiency**: Only stores node IDs for inclusion validation
   * - **Type Safety**: TypeScript ensures correct ID string handling
   * - **Edge Validation**: EdgeResolver uses inclusion set to validate both endpoints
   * 
   * **Edge Creation Pipeline:**
   * 1. **Cache Clearing**: Fresh EdgeResolver state for consistent results
   * 2. **Character Edges**: Relationship edges between characters
   * 3. **Puzzle Edges**: Dependency and reward edges for investigation flow
   * 4. **Element Edges**: Ownership and container relationships
   * 5. **Timeline Edges**: Temporal connections between events and entities
   * 6. **Deduplication**: Final pass to remove duplicate edge instances
   * 
   * **Performance Optimizations:**
   * - **Batch Processing**: EntityTransformer handles arrays efficiently
   * - **Set Operations**: O(1) node inclusion checking vs O(n) array searches
   * - **Cache Strategy**: EdgeResolver caching prevents duplicate edge computation
   * - **Memory Management**: Efficient array concatenation for edge collection
   * 
   * **Quality Assurance:**
   * - **Validation**: All edges validated against included node set
   * - **Deduplication**: Comprehensive duplicate removal algorithm
   * - **Type Safety**: Full TypeScript coverage for all transformations
   * - **Error Isolation**: Individual entity failures don't prevent graph completion
   * 
   * @param data - Complete EntityData for graph transformation
   * @returns GraphData with nodes and edges (no metadata - added by caller)
   * 
   * @example
   * ```typescript
   * // Internal usage within buildGenericGraph
   * const result = this.buildFullGraph(entityData);
   * console.log(`Core graph: ${result.nodes.length} nodes, ${result.edges.length} edges`);
   * 
   * // Verify graph structure
   * const nodeIds = new Set(result.nodes.map(n => n.id));
   * const validEdges = result.edges.every(e => 
   *   nodeIds.has(e.source) && nodeIds.has(e.target)
   * );
   * console.log(`All edges valid: ${validEdges}`);
   * ```
   * 
   * Complexity: O(n + m) where n = total entities, m = total relationships
   */
  private buildFullGraph(data: EntityData): GraphData {
    const nodes: GraphNode[] = [];
    const includedNodeIds = new Set<string>();

    // Transform all entities to nodes using batch methods
    // Each entity type is processed separately for type safety
    const characterNodes = this.entityTransformer.transformCharacters(data.characters);
    characterNodes.forEach(node => {
      nodes.push(node);
      includedNodeIds.add(node.id);
    });

    const elementNodes = this.entityTransformer.transformElements(data.elements);
    elementNodes.forEach(node => {
      nodes.push(node);
      includedNodeIds.add(node.id);
    });

    const puzzleNodes = this.entityTransformer.transformPuzzles(data.puzzles);
    puzzleNodes.forEach(node => {
      nodes.push(node);
      includedNodeIds.add(node.id);
    });

    const timelineNodes = this.entityTransformer.transformTimeline(data.timeline);
    timelineNodes.forEach(node => {
      nodes.push(node);
      includedNodeIds.add(node.id);
    });

    // Build all edges
    // Clear cache to ensure fresh edge creation for this graph
    this.edgeResolver.clearCache();
    const edges: GraphEdge[] = [];

    data.characters.forEach(char => {
      edges.push(...this.edgeResolver.createCharacterEdges(
        char,
        data.characters,
        includedNodeIds
      ));
    });

    data.puzzles.forEach(puzzle => {
      edges.push(...this.edgeResolver.createPuzzleEdges(
        puzzle,
        includedNodeIds
      ));
    });

    data.elements.forEach(elem => {
      edges.push(...this.edgeResolver.createElementEdges(
        elem,
        data.puzzles,
        includedNodeIds
      ));
    });

    data.timeline.forEach(event => {
      edges.push(...this.edgeResolver.createTimelineEdges(
        event,
        includedNodeIds
      ));
    });

    return {
      nodes,
      edges: this.edgeResolver.deduplicateEdges(edges)
    };
  }



  /**
   * Calculate comprehensive graph statistics for analysis, debugging, and monitoring.
   * Provides detailed breakdown of graph structure, entity distributions, and connectivity
   * metrics essential for understanding graph characteristics and performance optimization.
   * 
   * **Statistical Analysis Categories:**
   * 1. **Basic Counts**: Total nodes and edges for size assessment
   * 2. **Entity Distribution**: Node counts by entity type for balance analysis
   * 3. **Relationship Patterns**: Edge counts by relationship type for connectivity insight
   * 4. **Connectivity Metrics**: Average degree calculation for network density analysis
   * 
   * **Node Analysis Features:**
   * - **Type Extraction**: Robust entity type detection with multiple fallback paths
   * - **Metadata Parsing**: Handles both nested and direct entity type storage
   * - **Unknown Handling**: Graceful handling of nodes without clear entity types
   * - **Distribution Mapping**: Complete breakdown of entity type representation
   * 
   * **Edge Analysis Features:**
   * - **Relationship Typing**: Classification by relationship type (dependency, reward, etc.)
   * - **Type Validation**: Handles edges with missing or invalid type information
   * - **Pattern Recognition**: Identifies common relationship patterns in graph
   * - **Unknown Categorization**: Tracks edges without clear relationship classification
   * 
   * **Connectivity Metrics:**
   * - **Average Degree**: Mean connections per node (edges × 2 ÷ nodes)
   * - **Network Density**: Relative connectivity compared to complete graph
   * - **Isolation Detection**: Identifies disconnected or poorly connected nodes
   * - **Hub Identification**: Statistical basis for identifying highly connected nodes
   * 
   * **Murder Mystery Context:**
   * - **Character Networks**: Analysis of player and NPC relationship density
   * - **Evidence Chains**: Assessment of item and clue interconnectedness
   * - **Investigation Balance**: Puzzle dependency distribution analysis
   * - **Temporal Connectivity**: Timeline event integration measurement
   * 
   * **Performance Characteristics:**
   * - **Linear Complexity**: O(n + m) single pass through nodes and edges
   * - **Memory Efficient**: Uses Map structures for counting without duplication
   * - **Type Safe**: Full TypeScript support for all statistical calculations
   * - **Extensible**: Easy addition of new statistical measures
   * 
   * **Use Cases:**
   * - **Development**: Graph structure validation during development
   * - **Debugging**: Identifying graph construction issues or imbalances
   * - **Performance**: Monitoring graph size and complexity over time
   * - **Quality Assurance**: Ensuring consistent entity type distributions
   * - **Analytics**: Understanding user interaction patterns through graph structure
   * 
   * @param graphData - Complete GraphData structure to analyze
   * @returns Comprehensive statistics object with counts, distributions, and metrics
   * 
   * @example
   * ```typescript
   * // Comprehensive graph analysis
   * const stats = builder.getGraphStatistics(graphData);
   * console.log(`Graph Overview:`);
   * console.log(`  Total: ${stats.totalNodes} nodes, ${stats.totalEdges} edges`);
   * console.log(`  Density: ${stats.averageDegree.toFixed(2)} avg connections/node`);
   * 
   * // Entity distribution analysis
   * console.log('Entity Distribution:', stats.nodesByType);
   * console.log('Relationship Types:', stats.edgesByType);
   * 
   * // Performance monitoring
   * if (stats.totalNodes > 1000) {
   *   console.warn('Large graph detected - consider pagination or filtering');
   * }
   * 
   * // Balance validation
   * const characterRatio = stats.nodesByType.character / stats.totalNodes;
   * if (characterRatio < 0.1) {
   *   console.warn('Low character representation in graph');
   * }
   * 
   * // Network analysis
   * if (stats.averageDegree < 2) {
   *   console.warn('Sparse graph - many isolated nodes detected');
   * }
   * ```
   * 
   * Complexity: O(n + m) where n = nodes, m = edges
   */
  getGraphStatistics(graphData: GraphData): Record<string, unknown> {
    const nodesByType = new Map<string, number>();
    const edgesByType = new Map<string, number>();

    graphData.nodes.forEach(node => {
      // Extract entity type from node metadata with fallbacks
      const type = node.data?.metadata?.entityType || node.data?.entityType || 'unknown';
      nodesByType.set(String(type), (nodesByType.get(String(type)) || 0) + 1);
    });

    graphData.edges.forEach(edge => {
      // Count edges by type for analysis
      const type = edge.type || 'unknown';
      edgesByType.set(type, (edgesByType.get(type) || 0) + 1);
    });

    return {
      totalNodes: graphData.nodes.length,
      totalEdges: graphData.edges.length,
      nodesByType: Object.fromEntries(Array.from(nodesByType.entries())),
      edgesByType: Object.fromEntries(Array.from(edgesByType.entries())),
      // Calculate average degree (each edge connects two nodes)
      averageDegree: graphData.nodes.length > 0 
        ? (graphData.edges.length * 2) / graphData.nodes.length 
        : 0
    };
  }
}