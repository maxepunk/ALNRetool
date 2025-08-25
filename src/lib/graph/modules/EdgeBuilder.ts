/**
 * EdgeBuilder Module
 * 
 * Centralizes edge creation logic with advanced weighting, style configuration, and relationship analysis.
 * Provides a comprehensive builder pattern for graph edge construction with intelligent weight calculation,
 * duplicate prevention, style customization, and element affinity analysis.
 * 
 * **Core Features:**
 * - **Smart Edge Weighting**: Intelligent weight calculation based on entity relationships and patterns
 * - **Style Configuration**: Comprehensive visual styling with relationship-specific appearances
 * - **Duplicate Prevention**: Edge deduplication using relationship-aware keys
 * - **Batch Operations**: Fan-in/fan-out patterns and bulk edge creation
 * - **Affinity Analysis**: Element dual-role detection and multi-puzzle relationships
 * - **Statistics & Insights**: Edge distribution analysis and weight categorization
 * 
 * **Advanced Weighting System:**
 * - **Dual-role Elements**: 3x weight for elements serving as both requirements and rewards
 * - **Multi-puzzle Elements**: 2x weight for elements connected to multiple puzzles
 * - **SF Pattern Elements**: 1.5x weight for elements with Science Fiction metadata
 * - **Parent-child Puzzles**: 5x weight for hierarchical puzzle relationships
 * - **Narrative Threads**: 2x weight for puzzles in shared story threads
 * - **Ownership Relations**: 1.5x weight for ownership connections
 * - **Timeline Relations**: 0.7x weight for temporal connections (less structural)
 * 
 * **Relationship Type Support:**
 * - requirement, reward, collaboration, ownership, owner, timeline
 * - virtual-dependency (invisible layout edges), puzzle-grouping, chain
 * 
 * @module EdgeBuilder
 * @see {@link GraphBuilder} for node construction
 * @see {@link VirtualEdgeInjector} for layout optimization edges
 * @see {@link EdgeResolver} for edge resolution algorithms
 */

import type { GraphEdge, RelationshipType, GraphNode } from '../types';
import { MarkerType } from '@xyflow/react';
import type { EdgeMarker } from '@xyflow/react';
import { logger } from '../utils/Logger'


/**
 * Edge style configurations by relationship type.
 * Defines comprehensive visual styling for each graph relationship category.
 * 
 * **Style Categories:**
 * - **requirement**: Red destructive color with closed arrow markers
 * - **reward**: Green emerald with dashed animation and closed arrows
 * - **collaboration**: Blue solid with closed arrows for partnerships
 * - **ownership/owner**: Purple with distinct ownership visualization
 * - **timeline**: Orange with dot markers for temporal connections
 * - **virtual-dependency**: Transparent for layout-only positioning
 * - **puzzle-grouping**: Border-themed with standard arrows
 * - **chain**: Violet with heavy stroke for puzzle sequences
 * 
 * **Visual Design System:**
 * - Uses shadcn CSS variables for consistent theming
 * - Marker sizing: 18-20px width/height for visibility
 * - Stroke widths: 2-3px based on relationship importance
 * - Animation for reward edges to indicate positive flow
 * - Labels positioned with background styling and padding
 * 
 * **Accessibility Features:**
 * - High contrast color combinations
 * - Distinct visual patterns (solid, dashed, dotted)
 * - Consistent marker styles for relationship recognition
 * - Readable label styling with background protection
 * 
 * @constant EDGE_STYLES
 * @type {Record<RelationshipType, EdgeStyleConfig>}
 * @see {@link RelationshipType} for type definitions
 * @see {@link EdgeMarker} for marker configuration options
 */
const EDGE_STYLES: Record<RelationshipType, {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  animated?: boolean;
  label?: string;
  markerEnd?: EdgeMarker;
}> = {
  requirement: {
    stroke: 'hsl(var(--destructive))', // Using shadcn CSS variable
    strokeWidth: 2,
    label: 'requires',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: 'hsl(var(--destructive))',
    },
  },
  reward: {
    stroke: '#10b981', // emerald-500
    strokeWidth: 2,
    strokeDasharray: '5,5',
    animated: true,
    label: 'rewards',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#10b981', // emerald-500
    },
  },
  collaboration: {
    stroke: '#3b82f6', // blue-500
    strokeWidth: 2,
    strokeDasharray: '3,3',
    label: 'collaborates',
    markerEnd: {
      type: MarkerType.Arrow,
      width: 15,
      height: 15,
      color: '#3b82f6', // blue-500
    },
  },
  timeline: {
    stroke: '#f59e0b', // amber-500
    strokeWidth: 2,
    strokeDasharray: '3,3',
    label: 'timeline',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: '#f59e0b', // amber-500
    },
  },
  owner: {
    stroke: 'hsl(var(--primary))', // Using primary theme color
    strokeWidth: 2,
    label: 'owns',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: 'hsl(var(--primary))',
    },
  },
  ownership: {
    stroke: 'hsl(var(--primary))', // Using primary theme color
    strokeWidth: 2,
    label: 'owns',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: 'hsl(var(--primary))',
    },
  },
  container: {
    stroke: 'hsl(var(--muted-foreground))', // Muted theme color
    strokeWidth: 2,
    strokeDasharray: 'none',
    label: 'contains',
  },
  'virtual-dependency': {
    stroke: 'transparent', // Invisible - for layout only
    strokeWidth: 0,
    label: '', // No label needed for virtual edges
  },
  'puzzle-grouping': {
    stroke: 'hsl(var(--border))', // Border theme color
    strokeWidth: 3,
    label: 'group',
    markerEnd: {
      type: MarkerType.Arrow,
      width: 18,
      height: 18,
      color: 'hsl(var(--border))',
    },
  },
  chain: {
    stroke: '#8b5cf6', // violet-500
    strokeWidth: 3,
    label: 'chain',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#8b5cf6', // violet-500
    },
  },
};

/**
 * EdgeBuilder Class
 * 
 * Comprehensive edge creation system with intelligent weighting, duplicate prevention,
 * and relationship analysis for graph construction. Provides builder pattern functionality
 * with advanced features for element affinity analysis and edge statistics.
 * 
 * **Core Responsibilities:**
 * - **Edge Creation**: Creates styled edges with relationship-specific configuration
 * - **Weight Calculation**: Intelligent weight assignment based on entity relationships
 * - **Duplicate Prevention**: Prevents duplicate edges using relationship-aware keys
 * - **Batch Operations**: Supports fan-in, fan-out, and bulk edge creation patterns
 * - **Analysis**: Provides element affinity analysis and connection insights
 * - **Statistics**: Tracks edge distribution, weight patterns, and graph metrics
 * 
 * **Smart Weighting Algorithm:**
 * The EdgeBuilder implements sophisticated edge weighting that considers:
 * - **Entity Relationships**: Dual-role elements get 3x weight multipliers
 * - **Multi-puzzle Connections**: Elements connected to multiple puzzles get 2x weight
 * - **SF Pattern Integration**: Elements with Science Fiction metadata get 1.5x boost
 * - **Puzzle Hierarchies**: Parent-child puzzle relationships get 5x weight
 * - **Narrative Connections**: Shared story threads get 2x weight
 * - **Relationship Types**: Ownership (1.5x), Timeline (0.7x) modifiers
 * 
 * **Duplicate Prevention System:**
 * Uses compound keys combining relationship type, source, and target for:
 * - Preventing duplicate edges in same relationship category
 * - Allowing multiple edge types between same nodes
 * - Efficient existence checking with Set-based lookup
 * 
 * **Builder Pattern Benefits:**
 * - **Fluent Interface**: Chain operations for complex edge creation
 * - **State Management**: Tracks created edges and prevents duplication
 * - **Batch Processing**: Efficient bulk operations with single tracking
 * - **Statistics Collection**: Real-time metrics during construction
 * 
 * @class EdgeBuilder
 * @see {@link createEdgeBuilder} for factory function
 * @see {@link mergeEdgeBuilders} for combining multiple builders
 * @see {@link GraphBuilder} for node construction integration
 */
export class EdgeBuilder {
  private edges: GraphEdge[] = [];
  private nodeMap: Map<string, GraphNode> = new Map();
  private edgeSet: Set<string> = new Set();

  /**
   * Initialize EdgeBuilder with optional existing edges and nodes for context.
   * Sets up internal tracking structures and incorporates existing graph state.
   * 
   * **Initialization Process:**
   * - **Edge Incorporation**: Copies existing edges and builds deduplication keys
   * - **Node Mapping**: Creates efficient node lookup for weight calculations
   * - **Key Generation**: Builds edge existence tracking for duplicate prevention
   * - **State Preparation**: Initializes internal collections for builder operations
   * 
   * **Existing Edge Handling:**
   * - Copies all provided edges to internal collection
   * - Generates relationship-aware keys for duplicate prevention
   * - Preserves original edge metadata and styling
   * - Enables incremental edge building on existing graphs
   * 
   * **Node Context Integration:**
   * - Maps nodes by ID for efficient weight calculation lookups
   * - Enables smart weighting based on entity relationships
   * - Supports element affinity analysis and dual-role detection
   * - Provides context for relationship-aware edge creation
   * 
   * @param existingEdges - Optional array of existing graph edges to incorporate
   * @param nodes - Optional array of graph nodes for relationship context
   * 
   * @example
   * ```typescript
   * // Create fresh builder
   * const builder = new EdgeBuilder();
   * 
   * // Initialize with existing graph state
   * const contextBuilder = new EdgeBuilder(existingEdges, graphNodes);
   * 
   * // Factory pattern with context
   * const builder2 = createEdgeBuilder(edges, nodes);
   * ```
   * 
   * Complexity: O(e + n) where e = existing edges, n = nodes
   */
  constructor(existingEdges?: GraphEdge[], nodes?: GraphNode[]) {
    if (existingEdges) {
      this.edges = [...existingEdges];
      existingEdges.forEach(edge => {
        this.edgeSet.add(this.getEdgeKey(edge.source, edge.target, edge.data?.relationshipType));
      });
    }
    
    if (nodes) {
      nodes.forEach(node => {
        this.nodeMap.set(node.id, node);
      });
    }
  }

  /**
   * Create an edge between two nodes
   */
  /**
   * Create a styled graph edge with intelligent weight calculation and duplicate prevention.
   * Core method for edge creation with comprehensive styling, validation, and smart weighting.
   * 
   * **Edge Creation Pipeline:**
   * 1. **Duplicate Check**: Prevents duplicate edges using relationship-aware keys
   * 2. **Node Validation**: Validates source/target existence if node context available
   * 3. **Weight Calculation**: Applies smart weighting based on entity relationships
   * 4. **Style Application**: Applies relationship-specific visual styling
   * 5. **Edge Construction**: Creates complete GraphEdge with metadata
   * 6. **Tracking Update**: Adds to internal collections for future operations
   * 
   * **Smart Weight Calculation:**
   * - **Base Weight**: Uses provided weight or defaults to 1
   * - **Element Affinity**: 3x for dual-role elements, 2x for multi-puzzle elements
   * - **SF Pattern Boost**: 1.5x for elements with Science Fiction metadata
   * - **Puzzle Hierarchy**: 5x for parent-child relationships, 2x for narrative threads
   * - **Relationship Modifiers**: Ownership (1.5x), Timeline (0.7x)
   * 
   * **Styling Features:**
   * - **Relationship Colors**: Distinct colors per relationship type
   * - **Stroke Patterns**: Solid, dashed, dotted based on relationship
   * - **Marker Styles**: Arrows, dots, custom markers with proper sizing
   * - **Animation Support**: Animated edges for reward relationships
   * - **Broken Edge Handling**: Special styling for invalid/broken connections
   * 
   * **Duplicate Prevention:**
   * - Uses compound key: `${relationshipType}-${source}-${target}`
   * - Allows different relationship types between same nodes
   * - Prevents exact duplicates within same relationship category
   * - Logs debug information for duplicate attempts
   * 
   * @param source - Source node ID for the edge
   * @param target - Target node ID for the edge
   * @param relationshipType - Type of relationship defining visual style
   * @param options - Optional configuration for weight, metadata, styling
   * @returns Created GraphEdge or null if duplicate detected
   * 
   * @example
   * ```typescript
   * // Basic edge creation
   * const edge = builder.createEdge('puzzle1', 'element1', 'requirement');
   * 
   * // Edge with custom weight and metadata
   * const edge2 = builder.createEdge('character1', 'element2', 'ownership', {
   *   weight: 3,
   *   metadata: { significance: 'high' },
   *   customStyle: { strokeWidth: 4 }
   * });
   * 
   * // Broken edge with special styling
   * const brokenEdge = builder.createEdge('old1', 'missing2', 'reward', {
   *   isBroken: true,
   *   metadata: { reason: 'Target node not found' }
   * });
   * ```
   * 
   * Complexity: O(1) average, O(log n) worst case for duplicate checking
   */
  public createEdge(
    source: string,
    target: string,
    relationshipType: RelationshipType,
    options?: {
      weight?: number;
      metadata?: Record<string, unknown>;
      isBroken?: boolean;
      customStyle?: Record<string, any>;
    }
  ): GraphEdge | null {
    // Check if edge already exists
    const edgeKey = this.getEdgeKey(source, target, relationshipType);
    if (this.edgeSet.has(edgeKey)) {
      console.debug(`Edge already exists: ${edgeKey}`);
      return null;
    }

    // Validate nodes exist if nodeMap is populated
    if (this.nodeMap.size > 0) {
      if (!this.nodeMap.has(source)) {
        logger.warn(`Source node not found for edge: ${source}`);
        return null;
      }
      if (!this.nodeMap.has(target)) {
        logger.warn(`Target node not found for edge: ${target}`);
        return null;
      }
    }

    // Get style configuration
    const styleConfig = EDGE_STYLES[relationshipType] || {
      stroke: '#6b7280',
      strokeWidth: 1,
    };

    // Create edge ID
    const id = `${relationshipType}-${source}-${target}`;

    // Calculate smart edge weight based on element affinity
    const weight = this.calculateSmartWeight(source, target, relationshipType, options?.weight);

    // Build edge style
    const style: React.CSSProperties = {
      stroke: options?.isBroken ? '#ef4444' : styleConfig.stroke,
      strokeWidth: styleConfig.strokeWidth,
      strokeDasharray: options?.isBroken ? '10,5' : styleConfig.strokeDasharray,
      opacity: options?.isBroken ? 0.5 : 1,
      ...options?.customStyle,
    };

    // Create edge
    const edge: GraphEdge = {
      id,
      source,
      target,
      type: 'default',
      animated: styleConfig.animated || false,
      style,
      markerEnd: styleConfig.markerEnd, // Add arrow marker
      label: styleConfig.label, // Add label at edge level for React Flow
      labelStyle: {
        fill: 'hsl(var(--foreground))',
        fontSize: 12,
        fontWeight: 500,
      },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 4,
      labelBgStyle: {
        fill: 'hsl(var(--background))',
        fillOpacity: 0.9,
      },
      data: {
        relationshipType,
        weight,
        metadata: {
          ...options?.metadata,
          isBroken: options?.isBroken || false,
          label: styleConfig.label,
        },
      },
    };

    // Add to tracking
    this.edges.push(edge);
    this.edgeSet.add(edgeKey);

    return edge;
  }

  /**
   * Create multiple edges at once using batch processing for efficiency.
   * Processes array of edge definitions with consistent error handling and tracking.
   * 
   * **Batch Processing Benefits:**
   * - **Efficiency**: Single traversal with batch validation and creation
   * - **Consistency**: Uniform error handling across all edges
   * - **Tracking**: Updates internal collections once after all creations
   * - **Filtering**: Automatically excludes null results from duplicates
   * 
   * **Error Handling:**
   * - **Individual Failures**: Continues processing even if some edges fail
   * - **Duplicate Skipping**: Silently skips duplicate edges (logged in createEdge)
   * - **Validation Errors**: Node validation failures result in null edges
   * - **Partial Success**: Returns successfully created edges even if some fail
   * 
   * **Use Cases:**
   * - **Bulk Import**: Processing multiple relationships from data sources
   * - **Pattern Creation**: Creating systematic edge patterns (hierarchies, chains)
   * - **Relationship Mapping**: Converting relationship arrays to graph edges
   * - **Template Application**: Applying edge templates to multiple node sets
   * 
   * @param edgeDefinitions - Array of edge specifications with source, target, type, and options
   * @returns Array of successfully created GraphEdge objects (excludes duplicates/failures)
   * 
   * @example
   * ```typescript
   * // Batch create requirement edges
   * const edges = builder.createEdges([
   *   { source: 'puzzle1', target: 'element1', relationshipType: 'requirement' },
   *   { source: 'puzzle1', target: 'element2', relationshipType: 'requirement' },
   *   { source: 'puzzle2', target: 'element1', relationshipType: 'reward', 
   *     options: { weight: 2, metadata: { priority: 'high' } } }
   * ]);
   * 
   * // Process relationship data
   * const relationshipEdges = puzzleData.requirements.map(req => ({
   *   source: req.puzzleId,
   *   target: req.elementId,
   *   relationshipType: 'requirement' as const,
   *   options: { weight: req.importance }
   * }));
   * const created = builder.createEdges(relationshipEdges);
   * ```
   * 
   * Complexity: O(n) where n = edgeDefinitions.length
   */
  public createEdges(
    edgeDefinitions: Array<{
      source: string;
      target: string;
      relationshipType: RelationshipType;
      options?: Parameters<EdgeBuilder['createEdge']>[3];
    }>
  ): GraphEdge[] {
    const newEdges: GraphEdge[] = [];

    edgeDefinitions.forEach(def => {
      const edge = this.createEdge(
        def.source,
        def.target,
        def.relationshipType,
        def.options
      );
      if (edge) {
        newEdges.push(edge);
      }
    });

    return newEdges;
  }


  /**
   * Create fan-out edges from one source node to multiple target nodes.
   * Efficient pattern for one-to-many relationships like puzzle requirements.
   * 
   * **Fan-Out Pattern:**
   * - **Single Source**: One node connects to many targets
   * - **Uniform Relationship**: Same relationship type for all connections
   * - **Consistent Options**: Same styling and metadata applied to all edges
   * - **Duplicate Prevention**: Each edge individually checked for existence
   * 
   * **Common Use Cases:**
   * - **Puzzle Requirements**: One puzzle requires multiple elements
   * - **Character Ownership**: One character owns multiple elements
   * - **Timeline Events**: One event involves multiple characters
   * - **Container Contents**: One container holds multiple items
   * 
   * **Implementation Details:**
   * - Iterates through targets, creating edge from source to each
   * - Applies same options and relationship type to all edges
   * - Filters out null results from duplicates or validation failures
   * - Returns successfully created edges for further processing
   * 
   * @param source - Source node ID for all edges
   * @param targets - Array of target node IDs
   * @param relationshipType - Relationship type for all edges
   * @param options - Optional configuration applied to all edges
   * @returns Array of successfully created GraphEdge objects
   * 
   * @example
   * ```typescript
   * // Puzzle requiring multiple elements
   * const requirementEdges = builder.createFanOutEdges(
   *   'mystery-puzzle-1',
   *   ['clue-letter', 'witness-statement', 'dna-evidence'],
   *   'requirement'
   * );
   * 
   * // Character owning multiple items
   * const ownershipEdges = builder.createFanOutEdges(
   *   'detective-sarah',
   *   ['badge', 'notebook', 'phone'],
   *   'ownership',
   *   { weight: 2, metadata: { context: 'starting-equipment' } }
   * );
   * ```
   * 
   * Complexity: O(t) where t = targets.length
   */
  public createFanOutEdges(
    source: string,
    targets: string[],
    relationshipType: RelationshipType,
    options?: Parameters<EdgeBuilder['createEdge']>[3]
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];

    targets.forEach(target => {
      const edge = this.createEdge(source, target, relationshipType, options);
      if (edge) {
        edges.push(edge);
      }
    });

    return edges;
  }

  /**
   * Create fan-in edges from multiple source nodes to one target node.
   * Efficient pattern for many-to-one relationships like puzzle rewards.
   * 
   * **Fan-In Pattern:**
   * - **Multiple Sources**: Many nodes connect to single target
   * - **Uniform Relationship**: Same relationship type for all connections
   * - **Consistent Options**: Same styling and metadata applied to all edges
   * - **Duplicate Prevention**: Each edge individually checked for existence
   * 
   * **Common Use Cases:**
   * - **Puzzle Rewards**: Multiple puzzles reward the same element
   * - **Character Dependencies**: Multiple elements belong to one character
   * - **Timeline Convergence**: Multiple events lead to same outcome
   * - **Container Assembly**: Multiple items combine into one container
   * 
   * **Implementation Details:**
   * - Iterates through sources, creating edge from each to target
   * - Applies same options and relationship type to all edges
   * - Filters out null results from duplicates or validation failures
   * - Returns successfully created edges for further processing
   * 
   * @param sources - Array of source node IDs
   * @param target - Target node ID for all edges
   * @param relationshipType - Relationship type for all edges
   * @param options - Optional configuration applied to all edges
   * @returns Array of successfully created GraphEdge objects
   * 
   * @example
   * ```typescript
   * // Multiple puzzles rewarding same element
   * const rewardEdges = builder.createFanInEdges(
   *   ['basic-puzzle-1', 'basic-puzzle-2', 'basic-puzzle-3'],
   *   'master-key',
   *   'reward'
   * );
   * 
   * // Multiple clues pointing to same conclusion
   * const conclusionEdges = builder.createFanInEdges(
   *   ['fingerprint-analysis', 'dna-match', 'witness-id'],
   *   'suspect-identified',
   *   'collaboration',
   *   { weight: 3, metadata: { confidence: 'high' } }
   * );
   * ```
   * 
   * Complexity: O(s) where s = sources.length
   */
  public createFanInEdges(
    sources: string[],
    target: string,
    relationshipType: RelationshipType,
    options?: Parameters<EdgeBuilder['createEdge']>[3]
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];

    sources.forEach(source => {
      const edge = this.createEdge(source, target, relationshipType, options);
      if (edge) {
        edges.push(edge);
      }
    });

    return edges;
  }

  /**
   * Get all created edges from the builder.
   * Returns complete collection of edges created during builder lifetime.
   * 
   * **Return Value:**
   * - **Complete Collection**: All edges created by this builder instance
   * - **Immutable Reference**: Direct reference to internal array (modify with caution)
   * - **Chronological Order**: Edges in creation order for debugging/analysis
   * - **Includes Metadata**: All edges include complete styling and metadata
   * 
   * **Use Cases:**
   * - **Graph Assembly**: Adding edges to GraphBuilder or React Flow
   * - **Analysis**: Examining created edge patterns and relationships
   * - **Debugging**: Inspecting edge creation results
   * - **Export**: Serializing edges for storage or transfer
   * 
   * @returns Array of all GraphEdge objects created by this builder
   * 
   * @example
   * ```typescript
   * // Get all edges for graph assembly
   * const allEdges = builder.getEdges();
   * graphBuilder.addEdges(allEdges);
   * 
   * // Analyze edge count
   * console.log(`Created ${builder.getEdges().length} edges`);
   * 
   * // Export for serialization
   * const edgeData = builder.getEdges().map(edge => ({
   *   source: edge.source,
   *   target: edge.target,
   *   type: edge.data?.relationshipType
   * }));
   * ```
   * 
   * Complexity: O(1)
   */
  public getEdges(): GraphEdge[] {
    return this.edges;
  }

  /**
   * Get comprehensive edge statistics and distribution analysis.
   * Provides detailed metrics about created edges for monitoring and optimization.
   * 
   * **Statistics Categories:**
   * - **Total Count**: Overall number of edges created
   * - **Type Distribution**: Breakdown by relationship type
   * - **Broken Edge Count**: Number of edges marked as broken/invalid
   * - **Weight Analysis**: Average weight and distribution categories
   * - **Quality Metrics**: Insights for graph optimization
   * 
   * **Weight Distribution Categories:**
   * - **very-high**: Weight ≥ 5 (critical structural connections)
   * - **high**: Weight ≥ 3 (important relationships)
   * - **medium**: Weight ≥ 2 (moderate significance)
   * - **low-boost**: Weight > 1 (slight importance boost)
   * - **standard**: Weight = 1 (default relationships)
   * 
   * **Analysis Applications:**
   * - **Performance Monitoring**: Track edge creation patterns over time
   * - **Graph Optimization**: Identify weight distribution for layout tuning
   * - **Quality Assurance**: Monitor broken edge ratios
   * - **Relationship Insights**: Understand relationship type usage
   * 
   * @returns Comprehensive statistics object with counts, distributions, and metrics
   * 
   * @example
   * ```typescript
   * const stats = builder.getStatistics();
   * console.log(`Created ${stats.total} edges:`);
   * console.log(`- Requirements: ${stats.byType.requirement || 0}`);
   * console.log(`- Rewards: ${stats.byType.reward || 0}`);
   * console.log(`- Average weight: ${stats.averageWeight.toFixed(2)}`);
   * console.log(`- Broken edges: ${stats.broken}`);
   * 
   * // Check for optimization opportunities
   * if (stats.weightDistribution['very-high'] > stats.total * 0.1) {
   *   console.log('High concentration of very-high weight edges');
   * }
   * ```
   * 
   * Complexity: O(n) where n = number of edges
   */
  public getStatistics(): {
    total: number;
    byType: Record<RelationshipType, number>;
    broken: number;
    averageWeight: number;
    weightDistribution: Record<string, number>;
  } {
    const stats = {
      total: this.edges.length,
      byType: {} as Record<RelationshipType, number>,
      broken: 0,
      averageWeight: 0,
      weightDistribution: {} as Record<string, number>,
    };

    let totalWeight = 0;

    this.edges.forEach(edge => {
      const type = edge.data?.relationshipType;
      if (type) {
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      }
      if (edge.data?.metadata?.isBroken) {
        stats.broken++;
      }
      
      // Track weight statistics
      const weight = edge.data?.weight || 1;
      totalWeight += weight;
      
      // Categorize weights
      const weightCategory = 
        weight >= 5 ? 'very-high' :
        weight >= 3 ? 'high' :
        weight >= 2 ? 'medium' :
        weight > 1 ? 'low-boost' :
        'standard';
      
      stats.weightDistribution[weightCategory] = 
        (stats.weightDistribution[weightCategory] || 0) + 1;
    });

    stats.averageWeight = stats.total > 0 ? totalWeight / stats.total : 0;

    return stats;
  }

  /**
   * Analyze element affinity patterns in the graph for relationship insights.
   * Identifies dual-role elements, multi-puzzle connections, and high-affinity relationships.
   * 
   * **Analysis Categories:**
   * - **Dual-role Elements**: Elements serving as both requirements and rewards
   * - **Multi-puzzle Elements**: Elements connected to multiple puzzles
   * - **High Affinity Edges**: Edges with weight ≥ 2 indicating strong connections
   * 
   * **Dual-Role Detection:**
   * - Elements with both `requiredForPuzzleIds` and `rewardedByPuzzleIds`
   * - Critical game balance elements that create puzzle interconnection
   * - Indicators of complex narrative relationships
   * - Potential bottlenecks in puzzle progression
   * 
   * **Multi-Puzzle Analysis:**
   * - Elements involved in multiple puzzle relationships (requirement or reward)
   * - Total puzzle connections > 1 indicates shared significance
   * - Important for understanding element reuse patterns
   * - Key elements in puzzle dependency networks
   * 
   * **High Affinity Identification:**
   * - Edges with weight ≥ 2 from smart weighting algorithm
   * - Indicates stronger structural or narrative importance
   * - Useful for layout optimization and visual emphasis
   * - Helps identify critical graph pathways
   * 
   * @returns Analysis object with element categories and high-affinity edges
   * 
   * @example
   * ```typescript
   * const affinity = builder.analyzeElementAffinity();
   * 
   * console.log(`Dual-role elements: ${affinity.dualRoleElements.length}`);
   * console.log(`Multi-puzzle elements: ${affinity.multiPuzzleElements.length}`);
   * console.log(`High-affinity edges: ${affinity.highAffinityEdges.length}`);
   * 
   * // Identify potential bottlenecks
   * affinity.dualRoleElements.forEach(elementId => {
   *   console.log(`Critical element: ${elementId}`);
   * });
   * 
   * // Analyze high-importance connections
   * const criticalEdges = affinity.highAffinityEdges.filter(
   *   edge => (edge.data?.weight || 1) >= 3
   * );
   * ```
   * 
   * Complexity: O(n + e) where n = nodes, e = edges
   */
  public analyzeElementAffinity(): {
    dualRoleElements: string[];
    multiPuzzleElements: string[];
    highAffinityEdges: GraphEdge[];
  } {
    const dualRoleElements: Set<string> = new Set();
    const multiPuzzleElements: Set<string> = new Set();
    const highAffinityEdges: GraphEdge[] = [];

    // Check all nodes for dual-role and multi-puzzle elements
    this.nodeMap.forEach((node) => {
      if (node.data.metadata.entityType === 'element') {
        const element = node.data.entity;
        
        // Check for dual-role elements
        if (element.requiredForPuzzleIds?.length > 0 && 
            element.rewardedByPuzzleIds?.length > 0) {
          dualRoleElements.add(node.id);
        }
        
        // Check for multi-puzzle elements
        const totalPuzzleConnections = 
          (element.requiredForPuzzleIds?.length || 0) + 
          (element.rewardedByPuzzleIds?.length || 0);
        
        if (totalPuzzleConnections > 1) {
          multiPuzzleElements.add(node.id);
        }
      }
    });

    // Find high affinity edges (weight >= 2)
    this.edges.forEach(edge => {
      if ((edge.data?.weight || 1) >= 2) {
        highAffinityEdges.push(edge);
      }
    });

    return {
      dualRoleElements: Array.from(dualRoleElements),
      multiPuzzleElements: Array.from(multiPuzzleElements),
      highAffinityEdges,
    };
  }

  /**
   * Clear all edges and reset builder state.
   * Removes all created edges and resets internal tracking for fresh start.
   * 
   * **Reset Operations:**
   * - **Edge Collection**: Clears all created edges array
   * - **Deduplication Set**: Resets edge existence tracking
   * - **Node Map**: Preserves node context for continued operations
   * - **Statistics**: Resets all counts and metrics to zero
   * 
   * **Use Cases:**
   * - **Builder Reuse**: Clear state to reuse same builder instance
   * - **Memory Management**: Free memory used by edge collections
   * - **Testing**: Reset state between test cases
   * - **Iterative Building**: Clear and rebuild with different parameters
   * 
   * **Preserved State:**
   * - Node map remains intact for weight calculations
   * - EDGE_STYLES configuration unchanged
   * - Builder instance methods remain available
   * 
   * @example
   * ```typescript
   * // Clear for reuse
   * builder.clear();
   * 
   * // Rebuild with different approach
   * builder.createEdge('new1', 'new2', 'requirement');
   * 
   * // Memory cleanup in long-running processes
   * if (builder.getEdges().length > 10000) {
   *   builder.clear();
   * }
   * ```
   * 
   * Complexity: O(1)
   */
  public clear(): void {
    this.edges = [];
    this.edgeSet.clear();
  }

  /**
   * Calculate intelligent edge weight based on entity relationships and patterns.
   * Implements sophisticated weight calculation considering element affinity, puzzle hierarchies,
   * Science Fiction metadata, and relationship-specific modifiers.
   * 
   * **Weight Calculation Algorithm:**
   * 1. **Base Weight**: Start with provided weight or default to 1
   * 2. **Element Affinity**: Analyze dual-role and multi-puzzle connections
   * 3. **SF Pattern Boost**: Apply Science Fiction metadata multipliers
   * 4. **Puzzle Hierarchy**: Detect parent-child and narrative relationships
   * 5. **Relationship Modifiers**: Apply type-specific weight adjustments
   * 6. **Final Normalization**: Return calculated weight for layout algorithms
   * 
   * **Element-to-Puzzle Weighting:**
   * - **Dual-role Elements**: 3x multiplier (requirement AND reward)
   * - **Multi-requirement Elements**: 2x multiplier (required by multiple puzzles)
   * - **SF Pattern Elements**: 1.5x multiplier (Science Fiction metadata present)
   * 
   * **Puzzle-to-Element Weighting:**
   * - **Dual-role Targets**: 3x multiplier (element is requirement AND reward)
   * - **Multi-reward Elements**: 2x multiplier (rewarded by multiple puzzles)
   * 
   * **Puzzle-to-Puzzle Weighting:**
   * - **Parent-child Relationships**: 5x multiplier (hierarchical dependencies)
   * - **Narrative Thread Sharing**: 2x multiplier (common story elements)
   * 
   * **Relationship Type Modifiers:**
   * - **Ownership/Owner**: 1.5x multiplier (moderate structural importance)
   * - **Timeline**: 0.7x multiplier (less structurally important)
   * - **Other Types**: No modifier (maintains base weight)
   * 
   * @param source - Source node ID for relationship analysis
   * @param target - Target node ID for relationship analysis
   * @param relationshipType - Type of relationship for modifier application
   * @param baseWeight - Optional base weight (defaults to 1)
   * @returns Calculated smart weight for layout optimization
   * 
   * @example
   * ```typescript
   * // Dual-role element weight calculation
   * const weight1 = this.calculateSmartWeight('element1', 'puzzle2', 'requirement');
   * // If element1 is both requirement and reward: weight1 = 1 * 3 = 3
   * 
   * // Parent-child puzzle relationship
   * const weight2 = this.calculateSmartWeight('parent-puzzle', 'child-puzzle', 'requirement');
   * // If hierarchical relationship exists: weight2 = 1 * 5 = 5
   * 
   * // Timeline relationship with modifier
   * const weight3 = this.calculateSmartWeight('event1', 'character1', 'timeline', 2);
   * // Timeline modifier applied: weight3 = 2 * 0.7 = 1.4
   * ```
   * 
   * Complexity: O(1) average, O(k) where k = narrative threads in worst case
   */
  private calculateSmartWeight(
    source: string,
    target: string,
    relationshipType: RelationshipType,
    baseWeight?: number
  ): number {
    // Start with base weight or default
    let weight = baseWeight || 1;

    // Get nodes if available
    const sourceNode = this.nodeMap.get(source);
    const targetNode = this.nodeMap.get(target);

    if (!sourceNode || !targetNode) {
      return weight;
    }

    // Phase 3: Smart edge weighting for element affinity
    // Elements that serve multiple purposes should have stronger connections
    
    // Check if this is an element-to-puzzle edge
    if (sourceNode.data.metadata.entityType === 'element' && 
        targetNode.data.metadata.entityType === 'puzzle') {
      
      const element = sourceNode.data.entity;
      
      // Dual-role elements (both requirement and reward) get higher weight
      if (element.requiredForPuzzleIds?.length > 0 && 
          element.rewardedByPuzzleIds?.length > 0) {
        weight *= 3; // Triple weight for dual-role elements
      }
      
      // Elements required by multiple puzzles get higher weight
      else if (element.requiredForPuzzleIds?.length > 1) {
        weight *= 2; // Double weight for multi-puzzle requirements
      }
      
      // Elements with SF patterns get slightly higher weight
      if (element.sfPatterns && Object.keys(element.sfPatterns).length > 0) {
        weight *= 1.5; // 50% boost for SF pattern elements
      }
    }
    
    // Check if this is a puzzle-to-element edge
    else if (sourceNode.data.metadata.entityType === 'puzzle' && 
             targetNode.data.metadata.entityType === 'element') {
      
      const element = targetNode.data.entity;
      
      // Elements that are rewards and also requirements get higher weight
      if (element.requiredForPuzzleIds?.length > 0 && 
          element.rewardedByPuzzleIds?.length > 0) {
        weight *= 3; // Triple weight for dual-role elements
      }
      
      // Elements rewarded by multiple puzzles get higher weight
      else if (element.rewardedByPuzzleIds?.length > 1) {
        weight *= 2; // Double weight for multi-puzzle rewards
      }
    }
    
    // Check for puzzle-to-puzzle connections (dependencies)
    else if (sourceNode.data.metadata.entityType === 'puzzle' && 
             targetNode.data.metadata.entityType === 'puzzle') {
      
      const sourcePuzzle = sourceNode.data.entity;
      const targetPuzzle = targetNode.data.entity;
      
      // Parent-child puzzle relationships get highest weight
      if (sourcePuzzle.subPuzzleIds?.includes(target) || 
          targetPuzzle.parentItemId === source) {
        weight *= 5; // Very high weight for parent-child
      }
      
      // Puzzles in the same narrative thread get higher weight
      const commonThreads = sourcePuzzle.narrativeThreads?.filter((thread: string) =>
        targetPuzzle.narrativeThreads?.includes(thread)
      );
      if (commonThreads?.length > 0) {
        weight *= 2; // Double weight for narrative connections
      }
    }
    
    // Ownership edges get moderate weight boost
    if (relationshipType === 'ownership' || relationshipType === 'owner') {
      weight *= 1.5;
    }
    
    // Timeline edges get lower weight (they're less structurally important)
    if (relationshipType === 'timeline') {
      weight *= 0.7;
    }

    return weight;
  }

  /**
   * Generate unique edge key for duplicate prevention and efficient lookups.
   * Creates compound key combining relationship type with source and target nodes.
   * 
   * **Key Format:** `${relationshipType || 'default'}-${source}-${target}`
   * 
   * **Key Components:**
   * - **Relationship Type**: Allows different edge types between same nodes
   * - **Source Node ID**: Starting point of the directed edge
   * - **Target Node ID**: Ending point of the directed edge
   * - **Separator**: Hyphen delimiter for component separation
   * 
   * **Design Benefits:**
   * - **Uniqueness**: Prevents exact duplicates within relationship categories
   * - **Flexibility**: Allows multiple relationship types between same nodes
   * - **Efficiency**: String-based key for fast Set operations
   * - **Debugging**: Human-readable key format for troubleshooting
   * 
   * **Use Cases:**
   * - **Duplicate Prevention**: Check existence before creating edges
   * - **Edge Removal**: Identify specific edges for deletion
   * - **Relationship Querying**: Find specific relationship types
   * - **Debugging**: Log and trace edge creation patterns
   * 
   * @param source - Source node ID
   * @param target - Target node ID
   * @param relationshipType - Optional relationship type (defaults to 'default')
   * @returns Unique string key for edge identification
   * 
   * @example
   * ```typescript
   * // Different relationship types allowed
   * const key1 = this.getEdgeKey('puzzle1', 'element1', 'requirement');
   * // Returns: "requirement-puzzle1-element1"
   * 
   * const key2 = this.getEdgeKey('puzzle1', 'element1', 'reward');
   * // Returns: "reward-puzzle1-element1"
   * 
   * // Default type handling
   * const key3 = this.getEdgeKey('node1', 'node2');
   * // Returns: "default-node1-node2"
   * ```
   * 
   * Complexity: O(1)
   */
  private getEdgeKey(
    source: string,
    target: string,
    relationshipType?: RelationshipType | string
  ): string {
    return `${relationshipType || 'default'}-${source}-${target}`;
  }

  /**
   * Check if a specific edge already exists in the builder.
   * Efficient existence check using relationship-aware key lookup.
   * 
   * **Existence Checking:**
   * - Uses compound key for precise edge identification
   * - Distinguishes between different relationship types
   * - Fast Set-based lookup for O(1) average performance
   * - Returns boolean result for conditional logic
   * 
   * **Use Cases:**
   * - **Pre-creation Validation**: Avoid duplicate edge attempts
   * - **Conditional Logic**: Branch behavior based on edge existence
   * - **Graph Analysis**: Query specific relationship presence
   * - **Debugging**: Verify edge creation success
   * 
   * **Relationship Awareness:**
   * - Same source/target pair can have multiple edge types
   * - Only checks for specific relationship type if provided
   * - Defaults to 'default' relationship type if unspecified
   * 
   * @param source - Source node ID to check
   * @param target - Target node ID to check
   * @param relationshipType - Optional relationship type for specific checking
   * @returns True if edge exists, false otherwise
   * 
   * @example
   * ```typescript
   * // Check specific relationship
   * if (!builder.hasEdge('puzzle1', 'element1', 'requirement')) {
   *   builder.createEdge('puzzle1', 'element1', 'requirement');
   * }
   * 
   * // Conditional edge creation
   * const sourceTargetPairs = [['a', 'b'], ['b', 'c'], ['c', 'd']];
   * sourceTargetPairs.forEach(([src, tgt]) => {
   *   if (!builder.hasEdge(src, tgt, 'collaboration')) {
   *     builder.createEdge(src, tgt, 'collaboration');
   *   }
   * });
   * 
   * // Verify creation
   * const exists = builder.hasEdge('new1', 'new2', 'ownership');
   * console.log(exists ? 'Edge found' : 'Edge missing');
   * ```
   * 
   * Complexity: O(1) average, O(n) worst case for hash collision
   */
  public hasEdge(
    source: string,
    target: string,
    relationshipType?: RelationshipType
  ): boolean {
    const key = this.getEdgeKey(source, target, relationshipType);
    return this.edgeSet.has(key);
  }

  /**
   * Remove a specific edge from the builder.
   * Precisely removes edge using relationship-aware identification.
   * 
   * **Removal Process:**
   * 1. **Existence Check**: Verify edge exists using compound key
   * 2. **Key Removal**: Remove from deduplication tracking set
   * 3. **Edge Filtering**: Remove from edge collection array
   * 4. **Success Indication**: Return boolean result
   * 
   * **Precise Targeting:**
   * - Uses compound key for exact edge identification
   * - Requires relationship type for specific removal
   * - Preserves other relationship types between same nodes
   * - Maintains edge collection integrity
   * 
   * **Use Cases:**
   * - **Edge Correction**: Remove incorrectly created edges
   * - **Dynamic Updates**: Update relationships by removing and recreating
   * - **Graph Modification**: Edit existing graph structures
   * - **Cleanup Operations**: Remove temporary or invalid edges
   * 
   * @param source - Source node ID of edge to remove
   * @param target - Target node ID of edge to remove
   * @param relationshipType - Optional relationship type for precise removal
   * @returns True if edge was found and removed, false if not found
   * 
   * @example
   * ```typescript
   * // Remove specific edge
   * const removed = builder.removeEdge('puzzle1', 'element1', 'requirement');
   * console.log(removed ? 'Edge removed' : 'Edge not found');
   * 
   * // Conditional removal
   * if (builder.hasEdge('old1', 'old2', 'ownership')) {
   *   builder.removeEdge('old1', 'old2', 'ownership');
   *   console.log('Ownership edge removed');
   * }
   * 
   * // Bulk removal pattern
   * const edgesToRemove = [['a', 'b'], ['c', 'd']];
   * edgesToRemove.forEach(([src, tgt]) => {
   *   builder.removeEdge(src, tgt, 'timeline');
   * });
   * ```
   * 
   * Complexity: O(n) where n = number of edges (for array filtering)
   */
  public removeEdge(
    source: string,
    target: string,
    relationshipType?: RelationshipType
  ): boolean {
    const key = this.getEdgeKey(source, target, relationshipType);
    
    if (!this.edgeSet.has(key)) {
      return false;
    }

    this.edgeSet.delete(key);
    this.edges = this.edges.filter(edge => 
      !(edge.source === source && 
        edge.target === target && 
        edge.data?.relationshipType === relationshipType)
    );

    return true;
  }

  /**
   * Filter edges by relationship types for selective processing.
   * Returns subset of edges matching specified relationship categories.
   * 
   * **Filtering Logic:**
   * - **Type Matching**: Includes edges with matching relationship types
   * - **Multiple Types**: Supports array of types for flexible filtering
   * - **Exact Matching**: Uses precise type comparison
   * - **Preservation**: Original edge collection remains unchanged
   * 
   * **Use Cases:**
   * - **Category Analysis**: Examine specific relationship types
   * - **Selective Export**: Export only certain edge categories
   * - **Layout Optimization**: Process specific edge types separately
   * - **Debugging**: Isolate edge types for troubleshooting
   * 
   * **Performance Considerations:**
   * - Creates new array with filtered results
   * - O(n) filtering operation across all edges
   * - Type checking uses safe comparison with fallback
   * 
   * @param types - Array of relationship types to include in results
   * @returns New array containing only edges of specified types
   * 
   * @example
   * ```typescript
   * // Get only requirement edges
   * const requirements = builder.filterByType(['requirement']);
   * console.log(`Found ${requirements.length} requirement edges`);
   * 
   * // Get structural edges (requirements and rewards)
   * const structural = builder.filterByType(['requirement', 'reward']);
   * 
   * // Get relationship edges for character analysis
   * const relationships = builder.filterByType([
   *   'collaboration', 'ownership', 'timeline'
   * ]);
   * 
   * // Process each category separately
   * const categories = ['requirement', 'reward', 'ownership'];
   * categories.forEach(type => {
   *   const edges = builder.filterByType([type as RelationshipType]);
   *   console.log(`${type}: ${edges.length} edges`);
   * });
   * ```
   * 
   * Complexity: O(n) where n = number of edges
   */
  public filterByType(types: RelationshipType[]): GraphEdge[] {
    return this.edges.filter(edge => 
      types.includes(edge.data?.relationshipType as RelationshipType)
    );
  }

  /**
   * Get all edges connected to a specific node, categorized by direction.
   * Returns incoming and outgoing edges for comprehensive node analysis.
   * 
   * **Edge Categorization:**
   * - **Incoming**: Edges where this node is the target (other nodes → this node)
   * - **Outgoing**: Edges where this node is the source (this node → other nodes)
   * - **Bidirectional Analysis**: Complete picture of node connectivity
   * 
   * **Use Cases:**
   * - **Node Analysis**: Understand node's role in graph structure
   * - **Dependency Tracking**: Find what node depends on and what depends on it
   * - **Relationship Mapping**: Map all relationships for specific entity
   * - **Graph Traversal**: Get neighboring nodes and relationship types
   * 
   * **Analysis Applications:**
   * - **Element Analysis**: Find which puzzles require/reward specific elements
   * - **Character Connections**: Map character's relationships and ownership
   * - **Puzzle Dependencies**: Understand puzzle requirement and reward chains
   * - **Timeline Connections**: Find events connected to specific entities
   * 
   * @param nodeId - ID of the node to analyze for connections
   * @returns Object with incoming and outgoing edge arrays
   * 
   * @example
   * ```typescript
   * // Analyze element connections
   * const elementEdges = builder.getNodeEdges('master-key');
   * console.log(`Master key required by: ${elementEdges.incoming.length} puzzles`);
   * console.log(`Master key rewards: ${elementEdges.outgoing.length} connections`);
   * 
   * // Find puzzle dependencies
   * const puzzleEdges = builder.getNodeEdges('final-puzzle');
   * const requirements = puzzleEdges.outgoing.filter(
   *   edge => edge.data?.relationshipType === 'requirement'
   * );
   * console.log(`Final puzzle requires: ${requirements.length} elements`);
   * 
   * // Map character relationships
   * const characterEdges = builder.getNodeEdges('detective-sarah');
   * const owned = characterEdges.outgoing.filter(
   *   edge => edge.data?.relationshipType === 'ownership'
   * );
   * console.log(`Sarah owns: ${owned.length} items`);
   * ```
   * 
   * Complexity: O(n) where n = number of edges
   */
  public getNodeEdges(nodeId: string): {
    incoming: GraphEdge[];
    outgoing: GraphEdge[];
  } {
    return {
      incoming: this.edges.filter(edge => edge.target === nodeId),
      outgoing: this.edges.filter(edge => edge.source === nodeId),
    };
  }
}

/**
 * Factory function for creating EdgeBuilder instances with optional context.
 * Provides convenient initialization with existing graph state.
 * 
 * **Factory Benefits:**
 * - **Convenience**: Simple function call vs constructor instantiation
 * - **Context Integration**: Immediate incorporation of existing graph state
 * - **Type Safety**: Proper TypeScript inference and parameter validation
 * - **Consistent Interface**: Standardized creation pattern across codebase
 * 
 * **Parameter Handling:**
 * - **Optional Context**: Both parameters optional for flexible initialization
 * - **Edge Integration**: Existing edges incorporated with deduplication tracking
 * - **Node Context**: Node mapping enables smart weight calculation
 * - **State Preservation**: All existing graph relationships maintained
 * 
 * **Use Cases:**
 * - **Fresh Builder**: Create new builder without existing state
 * - **Context Builder**: Initialize with existing graph for incremental building
 * - **Testing**: Create isolated builders for unit tests
 * - **Integration**: Create builders in graph building pipelines
 * 
 * @param existingEdges - Optional array of existing edges to incorporate
 * @param nodes - Optional array of nodes for relationship context
 * @returns New EdgeBuilder instance ready for edge creation
 * 
 * @example
 * ```typescript
 * // Create fresh builder
 * const builder = createEdgeBuilder();
 * 
 * // Create with existing context
 * const contextBuilder = createEdgeBuilder(currentEdges, graphNodes);
 * 
 * // Use in pipeline
 * const pipeline = [
 *   (builder: EdgeBuilder) => builder.createEdge('a', 'b', 'requirement'),
 *   (builder: EdgeBuilder) => builder.createEdge('b', 'c', 'reward')
 * ];
 * const builder2 = createEdgeBuilder();
 * pipeline.forEach(fn => fn(builder2));
 * ```
 * 
 * Complexity: O(e + n) where e = existing edges, n = nodes
 */
export function createEdgeBuilder(
  existingEdges?: GraphEdge[],
  nodes?: GraphNode[]
): EdgeBuilder {
  return new EdgeBuilder(existingEdges, nodes);
}

/**
 * Merge multiple EdgeBuilder instances into a single consolidated builder.
 * Combines edges from multiple builders while preventing duplicates.
 * 
 * **Merge Process:**
 * 1. **Create Target**: New EdgeBuilder instance for merged results
 * 2. **Edge Extraction**: Get all edges from each source builder
 * 3. **Duplicate Prevention**: Check existence before adding each edge
 * 4. **Recreation**: Recreate edges in target builder with full metadata
 * 5. **Result**: Single builder containing all unique edges
 * 
 * **Duplicate Handling:**
 * - Uses EdgeBuilder's built-in duplicate prevention
 * - Preserves first occurrence of duplicate edges
 * - Maintains original edge metadata and styling
 * - Logs duplicate attempts for debugging
 * 
 * **Use Cases:**
 * - **Pipeline Merging**: Combine results from parallel processing
 * - **Category Combination**: Merge builders focused on different edge types
 * - **Progressive Building**: Combine incremental builder results
 * - **Testing**: Merge test builders for comprehensive validation
 * 
 * **Performance Considerations:**
 * - O(e₁ + e₂ + ... + eₙ) where eᵢ = edges in builder i
 * - Creates new edges rather than sharing references
 * - Memory overhead for complete edge recreation
 * - Efficient duplicate checking using Set-based keys
 * 
 * @param builders - Variable number of EdgeBuilder instances to merge
 * @returns New EdgeBuilder containing all unique edges from input builders
 * 
 * @example
 * ```typescript
 * // Merge parallel processing results
 * const requirementBuilder = createEdgeBuilder();
 * const rewardBuilder = createEdgeBuilder();
 * const ownershipBuilder = createEdgeBuilder();
 * 
 * // ... populate each builder with specific edge types
 * 
 * const mergedBuilder = mergeEdgeBuilders(
 *   requirementBuilder,
 *   rewardBuilder,
 *   ownershipBuilder
 * );
 * 
 * // Use merged results
 * const allEdges = mergedBuilder.getEdges();
 * const stats = mergedBuilder.getStatistics();
 * console.log(`Merged ${stats.total} edges from ${arguments.length} builders`);
 * 
 * // Pipeline pattern
 * const builders = categories.map(category => {
 *   const builder = createEdgeBuilder();
 *   // ... populate with category-specific edges
 *   return builder;
 * });
 * const final = mergeEdgeBuilders(...builders);
 * ```
 * 
 * Complexity: O(Σeᵢ) where eᵢ = edges in each builder
 */
export function mergeEdgeBuilders(...builders: EdgeBuilder[]): EdgeBuilder {
  const mergedBuilder = new EdgeBuilder();
  
  builders.forEach(builder => {
    const edges = builder.getEdges();
    edges.forEach(edge => {
      if (!mergedBuilder.hasEdge(
        edge.source,
        edge.target,
        edge.data?.relationshipType as RelationshipType
      )) {
        mergedBuilder.createEdge(
          edge.source,
          edge.target,
          edge.data?.relationshipType as RelationshipType,
          {
            weight: edge.data?.weight,
            metadata: edge.data?.metadata,
            isBroken: edge.data?.metadata?.isBroken as boolean,
            customStyle: edge.style as Record<string, any>,
          }
        );
      }
    });
  });
  
  return mergedBuilder;
}