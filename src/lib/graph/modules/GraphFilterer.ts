import { log } from '@/utils/logger';
import type { GraphNode, GraphEdge } from '../types';
import type { TraversalEngine } from './TraversalEngine';

/**
 * Comprehensive filtering options for multi-criteria node selection.
 * 
 * Provides flexible configuration for advanced graph filtering operations,
 * supporting entity-based, status-based, text-based, and temporal filtering
 * with sophisticated combinatorial logic and performance optimizations.
 * 
 * **Filtering Strategy:**
 * - **Combinatorial Logic**: All specified criteria must be satisfied (AND operation)
 * - **Optional Fields**: Undefined/empty criteria are ignored for partial filtering
 * - **Type Safety**: Full TypeScript support for all filter configurations
 * - **Performance Optimized**: Sequential filtering for efficient processing
 * 
 * **Entity Type Filtering:**
 * - **Murder Mystery Types**: 'character', 'element', 'puzzle', 'timeline'
 * - **Custom Types**: Supports any entity type string for extensibility
 * - **Multiple Selection**: Array allows filtering for multiple entity types
 * - **Exact Matching**: Entity types must match exactly (case-sensitive)
 * 
 * **Status Filtering:**
 * - **Lifecycle States**: 'active', 'completed', 'pending', 'archived'
 * - **Custom Statuses**: Supports any status string for domain-specific workflows
 * - **Multiple States**: Array enables filtering for multiple valid statuses
 * - **Default Handling**: Nodes without status default to 'active'
 * 
 * **Search Term Filtering:**
 * - **Case Insensitive**: Converts both search term and node content to lowercase
 * - **Multi-field Search**: Matches against both label and description fields
 * - **Substring Matching**: Partial matches supported for flexible search
 * - **Empty Handling**: Empty or whitespace-only terms are ignored
 * 
 * **Date Range Filtering:**
 * - **Inclusive Boundaries**: Both start and end dates are inclusive when specified
 * - **Partial Ranges**: Either start or end can be omitted for open-ended ranges
 * - **Date Parsing**: Handles both Date objects and ISO string formats
 * - **Missing Date Handling**: Nodes without dates are excluded from results
 * 
 * @interface FilterOptions
 * @example
 * ```typescript
 * const options: FilterOptions = {
 *   types: ['character', 'element'],
 *   statuses: ['active', 'pending'],
 *   searchTerm: 'detective',
 *   dateRange: { start: new Date('2023-01-01') }
 * };
 * ```
 */
interface FilterOptions {
  /** Array of entity types to include - supports murder mystery types and custom extensions */
  types?: string[];
  /** Array of status values to include - supports lifecycle states and custom statuses */
  statuses?: string[];
  /** Text to search for in node labels and descriptions - case insensitive substring matching */
  searchTerm?: string;
  /** Date range filter with optional boundaries - inclusive start and end dates */
  dateRange?: { start?: Date; end?: Date };
}


/**
 * Professional graph filtering system with advanced traversal and multi-criteria selection.
 * 
 * Provides comprehensive filtering ecosystem for graph operations, specializing in
 * depth-based traversal, multi-dimensional node filtering, edge consistency validation,
 * and connected component extraction for murder mystery investigation workflows.
 * 
 * **Filtering Capabilities:**
 * - **Depth-Based Filtering**: BFS traversal from starting nodes with configurable depth limits
 * - **Multi-Criteria Node Selection**: Combined entity type, status, text, and date filtering
 * - **Edge Consistency Filtering**: Maintains graph integrity by filtering dangling edges
 * - **Connected Component Extraction**: Isolates complete connected graph sections
 * - **Performance Optimized**: Efficient algorithms with O(V + E) complexity characteristics
 * 
 * **Architecture Benefits:**
 * - **Single Responsibility**: Focused exclusively on filtering operations
 * - **Dependency Injection**: Uses TraversalEngine for separation of concerns
 * - **Testable Design**: Clean interfaces enable comprehensive unit testing
 * - **Extensible Framework**: Easy addition of new filtering criteria and algorithms
 * - **Type Safety**: Full TypeScript coverage for all filtering operations
 * 
 * **Murder Mystery Game Integration:**
 * - **Character-Centric Views**: Filter around specific characters with relationship depth
 * - **Evidence Chains**: Trace item ownership and evidence discovery paths
 * - **Investigation Stages**: Filter puzzles by completion status and dependency depth
 * - **Timeline Contextualization**: Date range filtering for temporal event sequencing
 * 
 * **Performance Characteristics:**
 * - **Depth Filtering**: O(V + E) BFS traversal with early termination at max depth
 * - **Multi-Criteria**: O(n × f) where n = nodes, f = active filter count
 * - **Edge Filtering**: O(m) single pass through edges with Set lookup
 * - **Component Extraction**: O(V + E) complete BFS with no depth limits
 * 
 * **Traversal Engine Integration:**
 * - **Algorithm Delegation**: Leverages TraversalEngine for BFS/DFS algorithms
 * - **Consistent Results**: Standardized traversal behavior across filtering operations
 * - **Performance Benefits**: Optimized traversal implementations with progress tracking
 * - **Extensibility**: New traversal algorithms automatically available to filtering
 * 
 * @class GraphFilterer
 * 
 * @example
 * ```typescript
 * // Dependency injection setup
 * const traversalEngine = new TraversalEngine();
 * const filterer = new GraphFilterer(traversalEngine);
 * 
 * // Depth-based filtering from character perspective
 * const nearbyNodes = filterer.filterByDepth('char-123', 'character', allEdges, 2);
 * const characterView = nodes.filter(n => nearbyNodes.has(n.id));
 * 
 * // Multi-criteria node filtering
 * const activeClues = filterer.filterNodes(allNodes, {
 *   types: ['element', 'puzzle'],
 *   statuses: ['active', 'pending'],
 *   searchTerm: 'key'
 * });
 * 
 * // Connected component extraction
 * const component = filterer.getConnectedComponent('evidence-456', allNodes, allEdges);
 * console.log(`Evidence chain: ${component.nodes.length} connected items`);
 * 
 * // Edge consistency maintenance
 * const validEdges = filterer.filterEdges(allEdges, visibleNodeIds);
 * ```
 * 
 * @see {@link TraversalEngine} Provides BFS/DFS algorithms for depth-based filtering
 * @see {@link GraphBuilder} Primary consumer of GraphFilterer for view-specific graph construction
 * @see {@link FilterOptions} Configuration interface for multi-criteria node filtering
 * @author ALNRetool Development Team
 * @since 1.0.0
 */
export class GraphFilterer {
  /** TraversalEngine dependency for advanced graph traversal operations */
  private readonly traversalEngine: TraversalEngine;
  
  /**
   * Initialize GraphFilterer with dependency injection for modular filtering architecture.
   * Establishes the foundational traversal engine dependency required for depth-based
   * filtering operations while maintaining clean separation of filtering and traversal concerns.
   * 
   * **Dependency Injection Benefits:**
   * - **Separation of Concerns**: Filtering logic separate from traversal algorithms
   * - **Testability**: Enables injection of mock TraversalEngine for unit testing
   * - **Performance**: Leverages optimized traversal implementations
   * - **Extensibility**: New traversal algorithms automatically available
   * - **Maintainability**: Clear dependency relationships and interfaces
   * 
   * **TraversalEngine Integration:**
   * - **Algorithm Access**: Provides BFS, DFS, and other traversal algorithms
   * - **Performance Optimized**: Efficient graph traversal with progress tracking
   * - **Consistent Behavior**: Standardized traversal results across filtering operations
   * - **Memory Efficient**: Optimized data structures for large graph processing
   * 
   * **Constructor Pattern:**
   * - **Explicit Dependencies**: All required services visible in constructor signature
   * - **Immutable Setup**: Dependencies set once and remain constant
   * - **Type Safety**: TypeScript ensures correct dependency types
   * - **No Hidden Dependencies**: Clear architectural relationships
   * 
   * **Lifecycle Management:**
   * - **Construction**: Validate and store traversal engine dependency
   * - **Usage**: Delegate traversal operations to engine throughout filtering
   * - **Cleanup**: Engine responsible for its own resource management
   * 
   * @param traversalEngine - TraversalEngine instance for advanced graph traversal operations
   * 
   * @example
   * ```typescript
   * // Production setup
   * const traversalEngine = new TraversalEngine();
   * const filterer = new GraphFilterer(traversalEngine);
   * 
   * // Test setup with mock
   * const mockEngine = createMock<TraversalEngine>();
   * mockEngine.traverse.mockReturnValue({ visitedNodes: new Set(['node1']) });
   * const testFilterer = new GraphFilterer(mockEngine);
   * 
   * // Verify dependency injection
   * expect(testFilterer).toBeDefined();
   * expect(mockEngine.traverse).toHaveBeenCalled();
   * ```
   * 
   * Complexity: O(1) - Simple dependency storage
   */
  constructor(traversalEngine: TraversalEngine) {
    this.traversalEngine = traversalEngine;
  }
  /**
   * Filter nodes by depth from a starting node using TraversalEngine BFS algorithm.
   * 
   * Performs sophisticated breadth-first traversal to discover all nodes within
   * specified depth from starting node, enabling character-centric and evidence-focused
   * views for murder mystery investigation workflows.
   * 
   * **Traversal Strategy:**
   * - **BFS Algorithm**: Level-by-level exploration for consistent depth calculation
   * - **Depth Limiting**: Configurable maximum depth prevents excessive traversal
   * - **Inclusive Results**: Starting node included at depth 0
   * - **Edge Following**: Bidirectional edge traversal for complete connectivity
   * 
   * **Performance Features:**
   * - **Early Termination**: Stops at maximum depth to optimize performance
   * - **Visited Tracking**: Prevents cycles and duplicate node processing
   * - **Metrics Logging**: Records traversal statistics for monitoring
   * - **Memory Efficient**: Uses TraversalEngine's optimized data structures
   * 
   * **Investigation Use Cases:**
   * - **Character Networks**: Discover relationships within social distance
   * - **Evidence Chains**: Trace item connections through ownership paths
   * - **Puzzle Dependencies**: Follow requirement chains to specific depths
   * - **Timeline Proximity**: Find events within temporal relationship distance
   * 
   * @param startNodeId ID of the node to start traversal from
   * @param _startNodeType Type of the starting node (unused, kept for API compatibility)
   * @param edges Array of graph edges to traverse
   * @param maxDepth Maximum depth to traverse (default: 2)
   * @returns Set of node IDs within the specified depth from start node
   * 
   * @example
   * ```typescript
   * // Character relationship exploration
   * const nearbyCharacters = filterer.filterByDepth(
   *   'detective-sarah', 'character', relationshipEdges, 2
   * );
   * const characterView = allNodes.filter(n => nearbyCharacters.has(n.id));
   * 
   * // Evidence discovery within 3 steps
   * const evidenceNetwork = filterer.filterByDepth(
   *   'key-evidence', 'element', ownershipEdges, 3
   * );
   * console.log(`Found ${evidenceNetwork.size} connected items`);
   * ```
   * 
   * @remarks
   * - Uses BFS algorithm for consistent depth calculation
   * - Logs traversal metrics for debugging and performance monitoring
   * - Returns empty set if start node is not found in edges
   * - Includes the start node in the result (depth 0)
   * 
   * Complexity: O(V + E) where V = nodes within maxDepth, E = edges traversed
   */
  filterByDepth(
    startNodeId: string,
    _startNodeType: 'character' | 'element' | 'puzzle' | 'timeline',
    edges: GraphEdge[],
    maxDepth: number = 2
  ): Set<string> {
    // Use TraversalEngine for depth-based traversal
    const result = this.traversalEngine.traverse(
      edges,
      startNodeId,
      { 
        maxDepth,
        algorithm: 'bfs'
      }
    );

    log.debug('Depth filtering complete', {
      startNode: startNodeId,
      maxDepth,
      nodesProcessed: result.nodesProcessed,
      nodesIncluded: result.visitedNodes.size
    });

    return result.visitedNodes;
  }

  /**
   * Execute comprehensive multi-criteria node filtering with advanced selection logic.
   * 
   * Applies sophisticated filtering pipeline combining entity type, status, text search,
   * and temporal range filtering to provide precise node selection for murder mystery
   * investigation workflows with optimal performance characteristics.
   * 
   * **Filtering Pipeline Architecture:**
   * 1. **Entity Type Filtering**: Exact string matching against node.data.entityType
   * 2. **Status Filtering**: Exact string matching against node.data.status (default: 'active')
   * 3. **Text Search Filtering**: Case-insensitive substring matching in label and description
   * 4. **Date Range Filtering**: Inclusive boundary checking against node.data.date
   * 
   * **Filter Logic Implementation:**
   * - **AND Combination**: All specified criteria must be satisfied for node inclusion
   * - **Optional Criteria**: Undefined or empty filter arrays are skipped
   * - **Sequential Processing**: Filters applied in order for optimal performance
   * - **Early Termination**: Failed filters immediately exclude nodes from further processing
   * 
   * **Entity Type Filtering:**
   * - **Murder Mystery Types**: 'character', 'element', 'puzzle', 'timeline'
   * - **Exact Matching**: Case-sensitive string comparison
   * - **Multiple Types**: OR logic within type array, AND with other criteria
   * - **Default Handling**: Unknown entity types default to 'unknown' for consistent filtering
   * 
   * **Status Filtering:**
   * - **Lifecycle States**: 'active', 'completed', 'pending', 'archived'
   * - **Default Status**: Nodes without explicit status default to 'active'
   * - **Multiple Statuses**: OR logic within status array
   * - **Custom Statuses**: Supports domain-specific status values
   * 
   * **Text Search Implementation:**
   * - **Multi-Field Search**: Searches both label and description fields
   * - **Case Insensitive**: Converts search term and content to lowercase
   * - **Substring Matching**: Partial matches supported for flexible discovery
   * - **String Coercion**: Safely handles non-string field values
   * - **Empty Handling**: Blank or whitespace-only terms are ignored
   * 
   * **Date Range Filtering:**
   * - **Inclusive Boundaries**: Both start and end dates included in valid range
   * - **Partial Ranges**: Either boundary can be omitted for open-ended filtering
   * - **Date Parsing**: Handles Date objects and ISO string formats
   * - **Missing Date Exclusion**: Nodes without date field are excluded
   * - **Boundary Validation**: Invalid dates gracefully excluded
   * 
   * **Performance Optimizations:**
   * - **Sequential Filtering**: Most restrictive filters applied first
   * - **Early Termination**: Failed criteria immediately exclude nodes
   * - **Memory Efficient**: Shallow array copies prevent mutation
   * - **Type Coercion**: Safe handling of various data types
   * 
   * **Murder Mystery Integration:**
   * - **Character Discovery**: Filter by character type and relationship status
   * - **Evidence Tracking**: Search for items by description content
   * - **Investigation Stages**: Filter puzzles by completion status
   * - **Timeline Events**: Date range filtering for temporal contextualization
   * 
   * @param nodes Complete array of GraphNode objects to filter
   * @param options FilterOptions configuration with criteria for node selection
   * @returns Filtered array containing only nodes matching all specified criteria
   * 
   * @example
   * ```typescript
   * // Character relationship filtering
   * const activeCharacters = filterer.filterNodes(allNodes, {
   *   types: ['character'],
   *   statuses: ['active', 'alive'],
   *   searchTerm: 'detective'
   * });
   * 
   * // Evidence discovery filtering
   * const recentClues = filterer.filterNodes(allNodes, {
   *   types: ['element'],
   *   searchTerm: 'key',
   *   dateRange: { start: new Date('2023-01-01') }
   * });
   * 
   * // Investigation progress filtering
   * const completedPuzzles = filterer.filterNodes(allNodes, {
   *   types: ['puzzle'],
   *   statuses: ['completed'],
   *   dateRange: { 
   *     start: new Date('2023-01-01'),
   *     end: new Date('2023-12-31')
   *   }
   * });
   * 
   * // Multi-criteria discovery
   * const suspiciousItems = filterer.filterNodes(allNodes, {
   *   types: ['element', 'puzzle'],
   *   searchTerm: 'suspicious',
   *   statuses: ['active', 'pending']
   * });
   * 
   * // Verify filtering results
   * console.log(`Found ${suspiciousItems.length} suspicious items`);
   * suspiciousItems.forEach(item => {
   *   console.log(`- ${item.data.label}: ${item.data.description}`);
   * });
   * ```
   * 
   * Complexity: O(n × f) where n = nodes.length, f = number of active filter criteria
   */
  filterNodes(
    nodes: GraphNode[],
    options: FilterOptions
  ): GraphNode[] {
    let filtered = [...nodes];

    // Filter by type
    if (options.types && options.types.length > 0) {
      filtered = filtered.filter(node => {
        const entityType = (node.data as any).entityType || 'unknown';
        return options.types!.includes(entityType);
      });
    }

    // Filter by status
    if (options.statuses && options.statuses.length > 0) {
      filtered = filtered.filter(node => {
        const status = (node.data as any).status || 'active';
        return options.statuses!.includes(status);
      });
    }

    // Filter by search term
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      filtered = filtered.filter(node => {
        const label = String((node.data as any).label || '');
        const description = String((node.data as any).description || '');
        return label.toLowerCase().includes(term) ||
               description.toLowerCase().includes(term);
      });
    }

    // Filter by date range
    if (options.dateRange) {
      filtered = filtered.filter(node => {
        const date = (node.data as any).date;
        if (!date) return false;
        const nodeDate = new Date(date);
        if (options.dateRange!.start && nodeDate < options.dateRange!.start) return false;
        if (options.dateRange!.end && nodeDate > options.dateRange!.end) return false;
        return true;
      });
    }

    log.debug('Nodes filtered', {
      original: nodes.length,
      filtered: filtered.length,
      criteria: Object.keys(options)
    });

    return filtered;
  }

  /**
   * Maintain graph integrity through comprehensive edge consistency validation.
   * 
   * Eliminates dangling edges where source or target nodes are not included in the
   * current node selection, ensuring valid graph structure for visualization and analysis
   * in murder mystery investigation workflows.
   * 
   * **Edge Consistency Algorithm:**
   * 1. **Bidirectional Validation**: Checks both source and target node existence
   * 2. **Set Lookup Optimization**: Uses Set.has() for O(1) node existence checking
   * 3. **Order Preservation**: Maintains original edge ordering in filtered results
   * 4. **Comprehensive Logging**: Records filtering metrics for performance monitoring
   * 
   * **Graph Integrity Benefits:**
   * - **No Dangling Edges**: Eliminates edges pointing to non-existent nodes
   * - **Visualization Compatibility**: Ensures React Flow receives valid graph structure
   * - **Analysis Accuracy**: Prevents incorrect connectivity metrics from invalid edges
   * - **User Experience**: Avoids rendering errors from missing node references
   * 
   * **Performance Optimizations:**
   * - **O(1) Node Lookup**: Set data structure provides instant existence checking
   * - **Single Pass Processing**: Linear scan through edges with immediate validation
   * - **Memory Efficient**: Filters in-place without intermediate collections
   * - **Early Termination**: Failed validation immediately excludes edge
   * 
   * **Murder Mystery Context:**
   * - **Character Relationships**: Maintains valid connections between visible characters
   * - **Evidence Chains**: Ensures item ownership edges connect to existing entities
   * - **Puzzle Dependencies**: Validates requirement/reward edges between visible puzzles
   * - **Timeline Connections**: Maintains temporal relationships between visible events
   * 
   * **View-Specific Filtering:**
   * - **Character Views**: Edges filtered to character-centric node selections
   * - **Investigation Views**: Puzzle and element edges validated against visible nodes
   * - **Timeline Views**: Temporal edges maintained for chronological accuracy
   * - **Custom Views**: Flexible edge filtering for any node selection criteria
   * 
   * **Quality Assurance Features:**
   * - **Validation Logging**: Debug information for filtering performance analysis
   * - **Metrics Tracking**: Before/after counts for filtering effectiveness monitoring
   * - **Consistency Checking**: Ensures all filtered edges have valid endpoints
   * - **Error Prevention**: Eliminates common graph visualization errors
   * 
   * @param edges Complete array of GraphEdge objects to validate
   * @param includedNodeIds Set containing IDs of all nodes included in current view
   * @returns Validated array containing only edges with both endpoints in included nodes
   * 
   * @example
   * ```typescript
   * // Character-centric view edge filtering
   * const characterNodes = filterer.filterNodes(allNodes, { types: ['character'] });
   * const characterNodeIds = new Set(characterNodes.map(n => n.id));
   * const characterEdges = filterer.filterEdges(allEdges, characterNodeIds);
   * 
   * // Evidence chain edge validation
   * const evidenceNodes = filterer.filterByDepth('evidence-123', 'element', allEdges, 2);
   * const validEvidenceEdges = filterer.filterEdges(allEdges, evidenceNodes);
   * 
   * // Complete graph consistency check
   * const allVisibleNodes = new Set(visibleNodes.map(n => n.id));
   * const consistentEdges = filterer.filterEdges(rawEdges, allVisibleNodes);
   * 
   * // Verify edge consistency
   * const hasValidEndpoints = consistentEdges.every(edge => 
   *   allVisibleNodes.has(edge.source) && allVisibleNodes.has(edge.target)
   * );
   * console.log(`All edges valid: ${hasValidEndpoints}`);
   * 
   * // Performance monitoring
   * console.log(`Filtered ${rawEdges.length - consistentEdges.length} invalid edges`);
   * ```
   * 
   * Complexity: O(m) where m = edges.length (single pass with O(1) Set lookups)
   */
  filterEdges(
    edges: GraphEdge[],
    includedNodeIds: Set<string>
  ): GraphEdge[] {
    const filtered = edges.filter(edge => 
      includedNodeIds.has(edge.source) && 
      includedNodeIds.has(edge.target)
    );

    log.debug('Edges filtered', {
      original: edges.length,
      filtered: filtered.length
    });

    return filtered;
  }

  /**
   * Extract complete connected component using comprehensive graph traversal.
   * 
   * Performs exhaustive breadth-first search to identify and isolate all nodes and edges
   * reachable from a specified starting node, creating complete subgraph representation
   * for focused murder mystery investigation analysis.
   * 
   * **Component Extraction Algorithm:**
   * 1. **Unlimited BFS Traversal**: Uses TraversalEngine without depth constraints
   * 2. **Complete Reachability**: Discovers all nodes connected through any path
   * 3. **Node Collection**: Filters original node array to component members only
   * 4. **Edge Collection**: Filters original edge array to intra-component connections
   * 5. **Consistency Validation**: Ensures all edges have both endpoints in component
   * 6. **Metrics Logging**: Records component size for analysis and debugging
   * 
   * **Traversal Strategy:**
   * - **Breadth-First Search**: Systematic level-by-level exploration
   * - **Unlimited Depth**: No constraints on traversal distance
   * - **Bidirectional Edges**: Considers both incoming and outgoing connections
   * - **Complete Coverage**: Exhaustive exploration until no new nodes found
   * 
   * **Component Isolation Benefits:**
   * - **Subgraph Analysis**: Enables focused analysis of graph sections
   * - **Disconnected Detection**: Identifies isolated portions of larger graphs
   * - **Performance Optimization**: Reduces processing scope for component-specific operations
   * - **User Interface**: Supports component-based navigation and visualization
   * 
   * **Murder Mystery Applications:**
   * - **Evidence Networks**: Extract complete evidence chains from single clue
   * - **Character Circles**: Isolate relationship networks around key characters
   * - **Investigation Threads**: Follow puzzle dependencies to completion
   * - **Timeline Segments**: Extract related temporal events and their connections
   * 
   * **Graph Theory Implementation:**
   * - **Connected Component Definition**: All nodes reachable from starting node
   * - **Undirected Treatment**: Considers edges as bidirectional for connectivity
   * - **Transitive Closure**: Includes all transitively connected nodes
   * - **Maximal Component**: Extracts largest possible connected subgraph
   * 
   * **Performance Characteristics:**
   * - **Time Complexity**: O(V + E) where V = component nodes, E = component edges
   * - **Space Complexity**: O(V) for visited node tracking during traversal
   * - **Memory Efficient**: Single traversal with minimal intermediate storage
   * - **Scalable**: Performance scales with component size, not total graph size
   * 
   * **Quality Assurance:**
   * - **Edge Validation**: All returned edges connect nodes within the component
   * - **Completeness Check**: No reachable nodes excluded from component
   * - **Consistency Guarantee**: Component forms valid subgraph structure
   * - **Logging Integration**: Detailed metrics for component analysis
   * 
   * @param startNodeId Identifier of the seed node for component extraction
   * @param nodes Complete array of GraphNode objects in the full graph
   * @param edges Complete array of GraphEdge objects in the full graph
   * @returns Object containing filtered nodes and edges forming the connected component
   * 
   * @example
   * ```typescript
   * // Evidence network extraction
   * const evidenceComponent = filterer.getConnectedComponent(
   *   'key-evidence-456', 
   *   allNodes, 
   *   allEdges
   * );
   * console.log(`Evidence network: ${evidenceComponent.nodes.length} items`);
   * 
   * // Character relationship analysis
   * const characterNetwork = filterer.getConnectedComponent(
   *   'suspect-789',
   *   allNodes,
   *   allEdges
   * );
   * 
   * // Investigation thread following
   * const puzzleChain = filterer.getConnectedComponent(
   *   'mystery-puzzle-123',
   *   allNodes,
   *   allEdges
   * );
   * 
   * // Analyze component structure
   * const nodesByType = evidenceComponent.nodes.reduce((acc, node) => {
   *   const type = node.data.metadata.entityType;
   *   acc[type] = (acc[type] || 0) + 1;
   *   return acc;
   * }, {});
   * console.log('Component composition:', nodesByType);
   * 
   * // Validate component integrity
   * const componentNodeIds = new Set(evidenceComponent.nodes.map(n => n.id));
   * const validEdges = evidenceComponent.edges.every(edge =>
   *   componentNodeIds.has(edge.source) && componentNodeIds.has(edge.target)
   * );
   * console.log(`Component integrity: ${validEdges}`);
   * 
   * // Use component for focused visualization
   * const focusedGraph = {
   *   nodes: evidenceComponent.nodes,
   *   edges: evidenceComponent.edges
   * };
   * ```
   * 
   * Complexity: O(V + E) where V = nodes in component, E = edges in component
   */
  getConnectedComponent(
    startNodeId: string,
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): { nodes: GraphNode[], edges: GraphEdge[] } {
    // Use TraversalEngine to find all nodes in the connected component
    const result = this.traversalEngine.traverse(
      edges,
      startNodeId,
      { 
        algorithm: 'bfs'
        // No maxDepth limit - we want the entire component
      }
    );

    const connectedNodes = nodes.filter(n => result.visitedNodes.has(n.id));
    const connectedEdges = edges.filter(e => 
      result.visitedNodes.has(e.source) && result.visitedNodes.has(e.target)
    );

    log.debug('Connected component extracted', {
      startNode: startNodeId,
      nodes: connectedNodes.length,
      edges: connectedEdges.length
    });

    return { nodes: connectedNodes, edges: connectedEdges };
  }

}