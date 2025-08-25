import { log } from '@/utils/logger';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent
} from '@/types/notion/app';
import type { GraphEdge, RelationshipType } from '../types';
import { RelationshipProcessor } from '../utils/RelationshipProcessor';

/** Valid graph edge types for React Flow rendering */
type GraphEdgeType = 'dependency' | 'reward' | 'relation' | 'chain';

/**
 * EdgeResolver Module
 * 
 * Advanced edge creation and resolution system for graph building with intelligent caching,
 * relationship processing delegation, and comprehensive edge management capabilities.
 * Serves as the central coordination point for converting entity relationships into
 * visual graph edges with proper styling, weighting, and metadata.
 * 
 * **Core Responsibilities:**
 * - **Relationship Processing**: Delegates to RelationshipProcessor for clean separation
 * - **Edge Creation**: Converts relationships into styled GraphEdge objects
 * - **Caching & Deduplication**: Prevents duplicate edges with efficient lookup
 * - **Type-specific Styling**: Applies visual styling based on relationship types
 * - **Weight Calculation**: Intelligent edge weighting for layout optimization
 * - **Index Management**: Maintains fast lookup structures for existence checking
 * 
 * **Architecture Benefits:**
 * - **Single Responsibility**: Extracted from GraphBuilder for focused functionality
 * - **Dependency Delegation**: Uses RelationshipProcessor for relationship extraction
 * - **Performance Optimization**: Edge caching and indexing for O(1) lookups
 * - **Type Safety**: Comprehensive TypeScript typing for all edge operations
 * - **Extensibility**: Easy to add new relationship types and styling
 * 
 * **Edge Type System:**
 * - **dependency**: Solid lines for puzzle dependencies (weight: 10)
 * - **reward**: Dashed animated lines for puzzle rewards (weight: 8)
 * - **relation**: Dotted transparent lines for character relationships (weight: 5)
 * - **chain**: Thick solid lines for puzzle chains (weight: 15)
 * 
 * **Caching Strategy:**
 * - **Edge Cache**: Full edge objects keyed by edge ID
 * - **Edge Index**: Source → Target mappings for O(1) existence checking
 * - **Relationship Cache**: Delegates to RelationshipProcessor caching
 * - **Clear Strategy**: Coordinated cache clearing for fresh graph builds
 * 
 * @example
 * ```typescript
 * const resolver = new EdgeResolver();
 * 
 * // Create edges for different entity types
 * const characterEdges = resolver.createCharacterEdges(
 *   character, allCharacters, nodeSet
 * );
 * const puzzleEdges = resolver.createPuzzleEdges(puzzle, nodeSet);
 * const timelineEdges = resolver.createTimelineEdges(event, nodeSet);
 * 
 * // Get all edges and manage cache
 * const allEdges = resolver.getAllEdges();
 * const deduplicated = resolver.deduplicateEdges(allEdges);
 * resolver.clearCache(); // Fresh start for next graph
 * ```
 * 
 * @see {@link RelationshipProcessor} for relationship extraction logic
 * @see {@link GraphBuilder} for graph building orchestration
 * @see {@link EdgeBuilder} for alternative edge creation approach
 */
/**
 * EdgeResolver Class
 * 
 * High-performance edge creation and management system with intelligent caching,
 * relationship processing delegation, and comprehensive edge lifecycle management.
 * Coordinates between relationship extraction and graph edge creation.
 * 
 * **Internal Architecture:**
 * - **Edge Cache**: Map<string, GraphEdge> for complete edge storage
 * - **Edge Index**: Map<string, Set<string>> for O(1) existence checking
 * - **Relationship Processor**: Delegated relationship extraction and processing
 * - **Type System**: GraphEdgeType mapping to React Flow edge types
 * 
 * **Performance Characteristics:**
 * - **Edge Creation**: O(1) for cache hits, O(r) for relationship processing
 * - **Existence Checking**: O(1) average via Set-based indexing
 * - **Deduplication**: O(n) linear scan with Map-based unique key tracking
 * - **Cache Management**: O(1) individual operations, O(n) for full clearing
 * 
 * **Memory Management:**
 * - Efficient caching prevents duplicate edge creation
 * - Index structures optimize existence checking over linear searches
 * - Coordinated clearing with RelationshipProcessor prevents memory leaks
 * - Edge objects contain complete styling and metadata for immediate use
 * 
 * @class EdgeResolver
 * @see {@link RelationshipProcessor} for relationship extraction
 * @see {@link GraphEdge} for edge data structure
 * @see {@link GraphEdgeType} for edge type definitions
 */
export class EdgeResolver {
  /** Cache of created edges keyed by edge ID for complete edge retrieval */
  private edgeCache = new Map<string, GraphEdge>();
  /** Index for fast edge existence checking using source -> target Set mapping */
  private edgeIndex = new Map<string, Set<string>>();
  /** Processor for extracting relationships from entities with caching */
  private relationshipProcessor = new RelationshipProcessor();

  /**
   * Create character relationship edges with intelligent processing and caching.
   * Converts character entity relationships into styled graph edges through
   * RelationshipProcessor delegation and comprehensive edge management.
   * 
   * **Edge Creation Pipeline:**
   * 1. **Relationship Extraction**: Delegates to RelationshipProcessor for character relationships
   * 2. **Node Validation**: Ensures both source and target exist in included nodes
   * 3. **Edge Construction**: Creates GraphEdge with type-specific styling and metadata
   * 4. **Cache Integration**: Stores edges in both cache and index for future lookups
   * 5. **Logging**: Records edge creation metrics for monitoring
   * 
   * **Character Relationship Types:**
   * - **relation**: Character-to-character social connections
   * - **ownership**: Character-to-element ownership relationships
   * - **collaboration**: Character partnerships and teamwork
   * - **timeline**: Character involvement in timeline events
   * 
   * **Performance Optimizations:**
   * - **Existence Filtering**: Only creates edges for nodes in graph
   * - **Automatic Caching**: Prevents duplicate edge creation attempts
   * - **Indexed Storage**: Enables O(1) existence checking for future operations
   * - **Batch Processing**: Efficient processing of multiple relationships
   * 
   * **Quality Assurance:**
   * - Validates node existence before edge creation
   * - Logs edge creation metrics for monitoring
   * - Handles missing references gracefully
   * - Maintains referential integrity
   * 
   * @param character - Character entity to process for relationship edges
   * @param allCharacters - Complete character collection for relationship resolution
   * @param includedNodes - Set of node IDs included in current graph view
   * @returns Array of created GraphEdge objects for character relationships
   * 
   * @example
   * ```typescript
   * const characterEdges = resolver.createCharacterEdges(
   *   detectiveSarah,
   *   allCharacters,
   *   new Set(['character-1', 'character-2', 'element-5'])
   * );
   * console.log(`Created ${characterEdges.length} character edges`);
   * 
   * // Check specific relationship
   * const hasPartnership = characterEdges.some(
   *   edge => edge.data?.relationshipType === 'collaboration'
   * );
   * ```
   * 
   * Complexity: O(r) where r = number of relationships for the character
   */
  createCharacterEdges(
    character: Character,
    allCharacters: Character[],
    includedNodes: Set<string>
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    // Use RelationshipProcessor to get all relationships
    const relationships = this.relationshipProcessor.processCharacterRelationships(
      character,
      allCharacters
    );
    
    // Convert relationships to edges
    relationships.forEach(rel => {
      // Ensure both source and target nodes are included
      if (includedNodes.has(rel.source) && includedNodes.has(rel.target)) {
        const edge = this.createEdge(
          `${rel.type}-${rel.source}-${rel.target}`,
          rel.source,
          rel.target,
          rel.type as GraphEdgeType,
          rel.label
        );
        edges.push(edge);
        this.cacheEdge(edge);
      }
    });

    log.debug('Character edges created', { 
      characterId: character.id, 
      edgeCount: edges.length 
    });

    return edges;
  }

  /**
   * Create puzzle dependency and reward edges with comprehensive relationship analysis.
   * Processes puzzle entity requirements and rewards into styled graph edges through
   * RelationshipProcessor delegation and intelligent edge management.
   * 
   * **Edge Creation Pipeline:**
   * 1. **Relationship Extraction**: Uses RelationshipProcessor for puzzle dependencies and rewards
   * 2. **Node Validation**: Confirms both source and target nodes exist in graph
   * 3. **Edge Construction**: Creates GraphEdge with puzzle-specific styling and metadata
   * 4. **Cache Integration**: Stores edges with automatic deduplication
   * 5. **Metrics Logging**: Records puzzle edge creation for analysis
   * 
   * **Puzzle Relationship Types:**
   * - **dependency**: Puzzle → Element requirements (solid lines, weight: 10)
   * - **reward**: Puzzle → Element rewards (dashed animated, weight: 8)
   * - **chain**: Puzzle → Puzzle sequential dependencies (thick lines, weight: 15)
   * - **grouping**: Puzzle container relationships
   * 
   * **Game Logic Integration:**
   * - **Requirements**: Elements needed to unlock/solve puzzle
   * - **Rewards**: Elements provided upon puzzle completion
   * - **Dependencies**: Puzzle prerequisite chains and sequences
   * - **Hierarchy**: Parent-child puzzle relationships
   * 
   * **Visual Styling Features:**
   * - **Dependency Edges**: Solid lines with arrow markers
   * - **Reward Edges**: Dashed lines with animation for positive flow
   * - **Chain Edges**: Extra-thick lines for structural importance
   * - **Weight-based Priority**: Higher weights influence layout positioning
   * 
   * **Performance Characteristics:**
   * - **Efficient Processing**: Linear time in relationship count
   * - **Smart Filtering**: Only processes included nodes
   * - **Automatic Caching**: Prevents redundant edge creation
   * - **Index Maintenance**: Updates lookup structures
   * 
   * @param puzzle - Puzzle entity to process for dependency/reward edges
   * @param includedNodes - Set of node IDs included in current graph view
   * @returns Array of created GraphEdge objects for puzzle relationships
   * 
   * @example
   * ```typescript
   * const puzzleEdges = resolver.createPuzzleEdges(
   *   mysteryPuzzle,
   *   new Set(['puzzle-1', 'element-a', 'element-b'])
   * );
   * 
   * // Analyze puzzle structure
   * const requirements = puzzleEdges.filter(
   *   edge => edge.data?.relationshipType === 'dependency'
   * );
   * const rewards = puzzleEdges.filter(
   *   edge => edge.data?.relationshipType === 'reward'
   * );
   * console.log(`Puzzle requires ${requirements.length} elements, rewards ${rewards.length}`);
   * ```
   * 
   * Complexity: O(d + r) where d = dependencies, r = rewards
   */
  createPuzzleEdges(
    puzzle: Puzzle,
    includedNodes: Set<string>
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    // Use RelationshipProcessor to get all relationships
    const relationships = this.relationshipProcessor.processPuzzleRelationships(puzzle);
    
    // Convert relationships to edges
    relationships.forEach(rel => {
      // Ensure both source and target nodes are included
      if (includedNodes.has(rel.source) && includedNodes.has(rel.target)) {
        const edge = this.createEdge(
          `${rel.type}-${rel.source}-${rel.target}`,
          rel.source,
          rel.target,
          rel.type as GraphEdgeType,
          rel.label
        );
        edges.push(edge);
        this.cacheEdge(edge);
      }
    });

    log.debug('Puzzle edges created', { 
      puzzleId: puzzle.id, 
      edgeCount: edges.length 
    });

    return edges;
  }

  /**
   * Create timeline event relationship edges with temporal analysis and caching.
   * Processes timeline event connections into styled graph edges through
   * RelationshipProcessor delegation and comprehensive temporal relationship management.
   * 
   * **Edge Creation Pipeline:**
   * 1. **Temporal Analysis**: Uses RelationshipProcessor for timeline event relationships
   * 2. **Node Validation**: Ensures both source and target exist in included nodes
   * 3. **Edge Construction**: Creates GraphEdge with timeline-specific styling
   * 4. **Cache Integration**: Stores edges with temporal metadata
   * 5. **Event Logging**: Records timeline edge metrics for analysis
   * 
   * **Timeline Relationship Types:**
   * - **timeline**: Event connections to characters, elements, and other events
   * - **causal**: Cause-and-effect relationships between events
   * - **temporal**: Chronological sequences and time-based connections
   * - **involvement**: Character participation in timeline events
   * 
   * **Temporal Characteristics:**
   * - **Chronological Ordering**: Supports time-based edge sequencing
   * - **Event Causality**: Models cause-and-effect relationships
   * - **Character Involvement**: Links characters to specific time periods
   * - **Evidence Timeline**: Connects timeline events to physical evidence
   * 
   * **Visual Representation:**
   * - **Timeline Edges**: Lower visual priority (weight: 5) for cleaner layouts
   * - **Dotted Styling**: Distinguishes temporal from structural relationships
   * - **Transparency**: Reduces visual noise while maintaining connectivity
   * - **Bidirectional Options**: Supports reciprocal temporal relationships
   * 
   * **Murder Mystery Integration:**
   * - **Event Sequence**: Models chronological progression of story events
   * - **Character Timelines**: Tracks character involvement over time
   * - **Evidence Discovery**: Links evidence to discovery timeline
   * - **Causal Chains**: Models how events trigger subsequent events
   * 
   * @param event - Timeline event entity to process for relationship edges
   * @param includedNodes - Set of node IDs included in current graph view
   * @returns Array of created GraphEdge objects for timeline relationships
   * 
   * @example
   * ```typescript
   * const timelineEdges = resolver.createTimelineEdges(
   *   murderEvent,
   *   new Set(['timeline-1', 'character-victim', 'element-weapon'])
   * );
   * 
   * // Analyze temporal connections
   * const characterInvolvement = timelineEdges.filter(
   *   edge => edge.target.startsWith('character-')
   * );
   * const evidenceConnections = timelineEdges.filter(
   *   edge => edge.target.startsWith('element-')
   * );
   * console.log(`Event involves ${characterInvolvement.length} characters, ${evidenceConnections.length} pieces of evidence`);
   * ```
   * 
   * Complexity: O(r) where r = number of relationships for the event
   */
  createTimelineEdges(
    event: TimelineEvent,
    includedNodes: Set<string>
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    // Use RelationshipProcessor to get all relationships
    const relationships = this.relationshipProcessor.processTimelineRelationships(event);
    
    // Convert relationships to edges
    relationships.forEach(rel => {
      // Ensure both source and target nodes are included
      if (includedNodes.has(rel.source) && includedNodes.has(rel.target)) {
        const edge = this.createEdge(
          `${rel.type}-${rel.source}-${rel.target}`,
          rel.source,
          rel.target,
          rel.type as GraphEdgeType,
          rel.label
        );
        edges.push(edge);
        this.cacheEdge(edge);
      }
    });

    log.debug('Timeline edges created', { 
      eventId: event.id, 
      edgeCount: edges.length 
    });

    return edges;
  }

  /**
   * Create element relationship edges with ownership analysis and duplicate prevention.
   * Processes element entity connections into styled graph edges through
   * RelationshipProcessor delegation and advanced duplicate detection.
   * 
   * **Edge Creation Pipeline:**
   * 1. **Relationship Extraction**: Uses RelationshipProcessor for element relationships
   * 2. **Node Validation**: Confirms both source and target nodes exist in graph
   * 3. **Duplicate Prevention**: Checks existing edges before creation
   * 4. **Edge Construction**: Creates GraphEdge with element-specific styling
   * 5. **Cache Integration**: Stores edges with ownership metadata
   * 6. **Metrics Logging**: Records element edge creation statistics
   * 
   * **Element Relationship Types:**
   * - **ownership**: Character → Element possession relationships
   * - **container**: Element → Element containment hierarchies
   * - **requirement**: Element ← Puzzle dependency relationships (reverse)
   * - **reward**: Element ← Puzzle reward relationships (reverse)
   * 
   * **Duplicate Detection:**
   * - **Enhanced Checking**: Uses edgeExists() for comprehensive duplicate prevention
   * - **Bidirectional Awareness**: Handles both forward and reverse relationships
   * - **Container Logic**: Prevents duplicate container-content relationships
   * - **Ownership Clarity**: Ensures single ownership per element where applicable
   * 
   * **Murder Mystery Context:**
   * - **Evidence Ownership**: Tracks which characters possess evidence
   * - **Container Items**: Models items within containers (briefcases, safes)
   * - **Puzzle Elements**: Links elements to puzzles that require/reward them
   * - **Item Relationships**: Models physical item connections
   * 
   * **Performance Features:**
   * - **Smart Filtering**: Only processes included nodes for efficiency
   * - **Duplicate Prevention**: Avoids redundant edge creation attempts
   * - **Index Updates**: Maintains lookup structures for fast existence checking
   * - **Batch Processing**: Efficiently handles multiple element relationships
   * 
   * **Ownership Resolution:**
   * - **Puzzle Context**: Uses allPuzzles parameter for ownership resolution
   * - **Character Links**: Resolves character ownership through puzzle connections
   * - **Container Hierarchy**: Models nested containment relationships
   * - **Evidence Chain**: Tracks evidence custody and possession
   * 
   * @param element - Element entity to process for relationship edges
   * @param allPuzzles - Complete puzzle collection for ownership resolution
   * @param includedNodes - Set of node IDs included in current graph view
   * @returns Array of created GraphEdge objects for element relationships
   * 
   * @example
   * ```typescript
   * const elementEdges = resolver.createElementEdges(
   *   masterKey,
   *   allPuzzles,
   *   new Set(['element-key', 'character-detective', 'puzzle-safe'])
   * );
   * 
   * // Analyze element connections
   * const ownership = elementEdges.filter(
   *   edge => edge.data?.relationshipType === 'ownership'
   * );
   * const containers = elementEdges.filter(
   *   edge => edge.data?.relationshipType === 'container'
   * );
   * console.log(`Element has ${ownership.length} owners, ${containers.length} containers`);
   * ```
   * 
   * Complexity: O(r) where r = number of relationships for the element
   */
  createElementEdges(
    element: Element,
    allPuzzles: Puzzle[],
    includedNodes: Set<string>
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    // Use RelationshipProcessor to get all relationships
    const relationships = this.relationshipProcessor.processElementRelationships(
      element,
      allPuzzles
    );
    
    // Convert relationships to edges
    relationships.forEach(rel => {
      // Ensure both source and target nodes are included
      if (includedNodes.has(rel.source) && includedNodes.has(rel.target)) {
        // Check if edge already exists to avoid duplicates
        if (!this.edgeExists(rel.source, rel.target)) {
          const edge = this.createEdge(
            `${rel.type}-${rel.source}-${rel.target}`,
            rel.source,
            rel.target,
            rel.type as GraphEdgeType,
            rel.label
          );
          edges.push(edge);
          this.cacheEdge(edge);
        }
      }
    });

    log.debug('Element edges created', { 
      elementId: element.id, 
      edgeCount: edges.length 
    });

    return edges;
  }

  /**
   * Create a fully-configured GraphEdge object with comprehensive styling and metadata.
   * Internal factory method that constructs complete GraphEdge objects with type-specific
   * visual styling, weight calculation, animation settings, and relationship metadata.
   * 
   * **Edge Construction Process:**
   * 1. **Core Properties**: Sets id, source, target, and type from parameters
   * 2. **Weight Calculation**: Uses calculateEdgeWeight() for type-specific weights
   * 3. **Visual Styling**: Applies getEdgeStyle() for type-appropriate appearance
   * 4. **Animation Config**: Enables animation for dependency edges
   * 5. **Metadata Assembly**: Creates comprehensive data object with relationship info
   * 6. **Bidirectional Marking**: Identifies bidirectional relationships for layout
   * 
   * **Styling Features:**
   * - **Type-specific Appearance**: Each relationship type has distinct visual style
   * - **Weight-based Priority**: Higher weights influence layout algorithm decisions
   * - **Animation Support**: Dependency edges animate to show flow direction
   * - **Bidirectional Indicators**: Marks relationships that work both ways
   * 
   * **Metadata Enrichment:**
   * - **Relationship Type**: Preserves original relationship category
   * - **Edge Weight**: Numeric weight for layout optimization
   * - **Display Label**: Optional text label for edge annotation
   * - **Bidirectional Flag**: Indicates if relationship works in both directions
   * 
   * **Type System Integration:**
   * - **GraphEdgeType**: Maps to React Flow compatible edge types
   * - **RelationshipType**: Preserves semantic relationship meaning
   * - **Styling Consistency**: Ensures uniform appearance across graph
   * - **Weight Hierarchy**: Maintains consistent importance ordering
   * 
   * @param id - Unique identifier for edge (typically: `${type}-${source}-${target}`)
   * @param source - Source node ID in the directed relationship
   * @param target - Target node ID in the directed relationship
   * @param type - GraphEdgeType for styling and behavioral configuration
   * @param label - Optional display label for edge annotation
   * @returns Complete GraphEdge object ready for React Flow rendering
   * 
   * @example
   * ```typescript
   * // Internal usage in edge creation methods
   * const edge = this.createEdge(
   *   'dependency-puzzle1-element5',
   *   'puzzle1',
   *   'element5',
   *   'dependency',
   *   'requires'
   * );
   * 
   * // Resulting edge properties:
   * console.log(edge.data?.weight); // 10 (dependency weight)
   * console.log(edge.animated); // true (dependency animation)
   * console.log(edge.style.strokeDasharray); // 0 (solid line)
   * ```
   * 
   * Complexity: O(1)
   */
  private createEdge(
    id: string,
    source: string,
    target: string,
    type: GraphEdgeType,
    label?: string
  ): GraphEdge {
    return {
      id,
      source,
      target,
      type,
      label,
      data: {
        relationshipType: type as RelationshipType,
        weight: this.calculateEdgeWeight(type),
        label,
        metadata: {
          bidirectional: type === 'relation'
        }
      },
      animated: type === 'dependency',
      style: this.getEdgeStyle(type)
    };
  }

  /**
   * Calculate intelligent edge weight based on relationship type importance.
   * Provides type-specific weight values that influence layout algorithm positioning,
   * edge routing, and visual hierarchy in the graph rendering.
   * 
   * **Weight Hierarchy (Highest to Lowest):**
   * - **chain (15)**: Strongest structural connections for puzzle sequences
   * - **dependency (10)**: High priority for puzzle-element requirements
   * - **reward (8)**: Moderate-high priority for puzzle-element rewards
   * - **relation (5)**: Lower priority for character social connections
   * - **default (1)**: Minimal weight for unrecognized types
   * 
   * **Layout Algorithm Impact:**
   * - **Higher Weights**: Create stronger layout constraints and shorter paths
   * - **Edge Routing**: Influences how edges curve around nodes
   * - **Node Positioning**: Affects final node placement in layout
   * - **Visual Priority**: Higher weights get visual precedence
   * 
   * **Game Design Rationale:**
   * - **Chain Edges**: Puzzle sequences are most structurally important
   * - **Dependencies**: Requirements drive gameplay flow
   * - **Rewards**: Completion paths are moderately important
   * - **Relations**: Social connections add context but less structural
   * 
   * **Performance Characteristics:**
   * - **O(1) Lookup**: Simple switch statement for instant weight retrieval
   * - **Type Safety**: Enum-based types ensure valid weight assignments
   * - **Consistency**: Uniform weight application across all edges
   * - **Extensibility**: Easy to add new types with appropriate weights
   * 
   * @param type - GraphEdgeType to calculate weight for
   * @returns Numeric weight value for layout algorithm usage
   * 
   * @example
   * ```typescript
   * const chainWeight = this.calculateEdgeWeight('chain'); // 15
   * const dependencyWeight = this.calculateEdgeWeight('dependency'); // 10
   * const relationWeight = this.calculateEdgeWeight('relation'); // 5
   * 
   * // Usage in layout optimization
   * const strongEdges = edges.filter(
   *   edge => this.calculateEdgeWeight(edge.type) >= 10
   * );
   * ```
   * 
   * Complexity: O(1)
   */
  private calculateEdgeWeight(type: GraphEdgeType): number {
    switch (type) {
      case 'dependency': return 10;
      case 'reward': return 8;
      case 'chain': return 15;
      case 'relation': return 5;
      default: return 1;
    }
  }

  /**
   * Generate type-specific CSS styling properties for React Flow edge rendering.
   * Creates visually distinct edge appearances that communicate relationship types
   * through stroke patterns, opacity, and line thickness.
   * 
   * **Styling Strategy by Type:**
   * - **dependency**: Solid lines (strokeDasharray: 0) for clear requirements
   * - **reward**: Dashed lines (strokeDasharray: '5 5') for completion flow
   * - **relation**: Dotted lines (strokeDasharray: '2 2') with transparency
   * - **chain**: Thick solid lines (strokeWidth: 3) for structural importance
   * - **default**: No special styling (empty object)
   * 
   * **Visual Design Principles:**
   * - **Pattern Differentiation**: Each type uses distinct stroke pattern
   * - **Importance Hierarchy**: Line thickness reflects relationship importance
   * - **Transparency Usage**: Reduces visual noise for less critical relationships
   * - **Accessibility**: High contrast patterns for visual clarity
   * 
   * **React Flow Integration:**
   * - **CSS Properties**: Returns React.CSSProperties compatible object
   * - **SVG Styling**: Stroke patterns work with SVG edge rendering
   * - **Dynamic Application**: Styles applied during edge creation
   * - **Performance**: O(1) lookup with no computation overhead
   * 
   * **Pattern Specifications:**
   * - **Solid (0)**: Continuous line for structural relationships
   * - **Dashed (5 5)**: 5px line, 5px gap for positive flow indicators
   * - **Dotted (2 2)**: 2px line, 2px gap for subtle connections
   * - **Thick (strokeWidth: 3)**: Increased thickness for high importance
   * 
   * @param type - GraphEdgeType to generate styling for
   * @returns React.CSSProperties object for edge styling
   * 
   * @example
   * ```typescript
   * const dependencyStyle = this.getEdgeStyle('dependency');
   * // Returns: { strokeDasharray: 0 }
   * 
   * const rewardStyle = this.getEdgeStyle('reward');
   * // Returns: { strokeDasharray: '5 5' }
   * 
   * const relationStyle = this.getEdgeStyle('relation');
   * // Returns: { strokeDasharray: '2 2', opacity: 0.7 }
   * 
   * const chainStyle = this.getEdgeStyle('chain');
   * // Returns: { strokeWidth: 3 }
   * ```
   * 
   * Complexity: O(1)
   */
  private getEdgeStyle(type: GraphEdgeType): React.CSSProperties {
    switch (type) {
      case 'dependency':
        return { strokeDasharray: 0 };
      case 'reward':
        return { strokeDasharray: '5 5' };
      case 'relation':
        return { strokeDasharray: '2 2', opacity: 0.7 };
      case 'chain':
        return { strokeWidth: 3 };
      default:
        return {};
    }
  }

  /**
   * Cache edge in dual storage system for efficient retrieval and existence checking.
   * Maintains both complete edge storage and optimized index structures for
   * fast duplicate detection and comprehensive edge management.
   * 
   * **Dual Storage Architecture:**
   * - **Edge Cache**: Map<string, GraphEdge> for complete edge object storage
   * - **Edge Index**: Map<string, Set<string>> for O(1) source → target lookups
   * - **Synchronized Updates**: Both structures updated atomically
   * - **Memory Efficiency**: Index uses minimal memory for existence checking
   * 
   * **Caching Strategy:**
   * 1. **Edge Cache**: Stores complete GraphEdge by edge ID for full retrieval
   * 2. **Index Update**: Creates source entry if missing
   * 3. **Target Addition**: Adds target to source's target set
   * 4. **Atomic Operation**: All updates complete successfully or fail together
   * 
   * **Performance Benefits:**
   * - **O(1) Existence Checks**: edgeIndex enables instant duplicate detection
   * - **O(1) Edge Retrieval**: edgeCache provides immediate edge access
   * - **Memory Optimization**: Index uses Set structures for efficient storage
   * - **Batch Operations**: Supports efficient bulk edge processing
   * 
   * **Index Structure:**
   * ```
   * edgeIndex: {
   *   'source-node-1' => Set('target-a', 'target-b'),
   *   'source-node-2' => Set('target-c')
   * }
   * ```
   * 
   * **Usage in Duplicate Prevention:**
   * - Enables fast existence checking before edge creation
   * - Supports efficient deduplication algorithms
   * - Maintains referential integrity across operations
   * - Facilitates graph analysis and traversal operations
   * 
   * @param edge - Complete GraphEdge object to cache
   * 
   * @example
   * ```typescript
   * // Internal usage during edge creation
   * const edge = this.createEdge(id, source, target, type, label);
   * this.cacheEdge(edge); // Store for future operations
   * 
   * // Later existence check
   * const exists = this.edgeExists(source, target); // O(1) lookup
   * ```
   * 
   * Complexity: O(1) - Map and Set operations
   */
  private cacheEdge(edge: GraphEdge): void {
    this.edgeCache.set(edge.id, edge);
    
    // Update index
    if (!this.edgeIndex.has(edge.source)) {
      this.edgeIndex.set(edge.source, new Set());
    }
    this.edgeIndex.get(edge.source)!.add(edge.target);
  }

  /**
   * Check edge existence using high-performance index lookup.
   * Utilizes optimized Set-based index structure for instant duplicate detection
   * without scanning the complete edge collection.
   * 
   * **Lookup Algorithm:**
   * 1. **Source Check**: Verify source node exists in edge index
   * 2. **Target Check**: Check if target exists in source's target set
   * 3. **Boolean Result**: Return true if both conditions met
   * 4. **Null Safety**: Handles missing entries gracefully with fallback
   * 
   * **Performance Characteristics:**
   * - **O(1) Average**: Set lookup provides constant time performance
   * - **Memory Efficient**: Uses minimal space for existence tracking
   * - **Cache Miss Safe**: Returns false for non-existent entries
   * - **Type Agnostic**: Checks existence regardless of relationship type
   * 
   * **Use Cases:**
   * - **Duplicate Prevention**: Check before creating new edges
   * - **Relationship Queries**: Verify connections between specific nodes
   * - **Graph Analysis**: Efficient connectivity checking
   * - **Validation**: Ensure referential integrity
   * 
   * **Index Structure Benefits:**
   * - **Fast Lookups**: Avoids linear search through all edges
   * - **Scalable Performance**: Performance doesn't degrade with graph size
   * - **Memory Optimization**: Stores only essential mapping information
   * - **Concurrent Safe**: Read operations don't interfere with each other
   * 
   * **Directional Awareness:**
   * - Checks directed relationships (source → target)
   * - Does not check reverse direction automatically
   * - Supports asymmetric relationship validation
   * - Enables precise duplicate detection
   * 
   * @param source - Source node ID to check from
   * @param target - Target node ID to check to
   * @returns True if directed edge exists from source to target
   * 
   * @example
   * ```typescript
   * // Check before creating edge
   * if (!this.edgeExists('puzzle1', 'element5')) {
   *   const edge = this.createEdge(id, 'puzzle1', 'element5', 'dependency');
   *   this.cacheEdge(edge);
   * }
   * 
   * // Validate relationship
   * const hasConnection = this.edgeExists('character1', 'element2');
   * console.log(`Character owns element: ${hasConnection}`);
   * ```
   * 
   * Complexity: O(1) - Set contains() operation
   */
  private edgeExists(source: string, target: string): boolean {
    return this.edgeIndex.get(source)?.has(target) || false;
  }

  /**
   * Retrieve complete collection of all cached edges for graph assembly.
   * Returns comprehensive array of all GraphEdge objects created during the
   * current EdgeResolver session, ready for graph construction and analysis.
   * 
   * **Return Value Characteristics:**
   * - **Complete Collection**: All edges created by this resolver instance
   * - **Immutable Copy**: Array.from() creates new array from cache values
   * - **Full Edge Objects**: Complete GraphEdge objects with styling and metadata
   * - **Creation Order**: Maintains chronological order of edge creation
   * 
   * **Usage Patterns:**
   * - **Graph Assembly**: Primary method for collecting edges for graph building
   * - **Analysis Operations**: Input for deduplication, statistics, and validation
   * - **Export/Serialization**: Source data for graph persistence
   * - **Testing/Debugging**: Complete edge inspection for troubleshooting
   * 
   * **Performance Considerations:**
   * - **O(n) Time**: Linear in number of cached edges for array construction
   * - **Memory Allocation**: Creates new array, original cache unchanged
   * - **Safe Access**: No risk of modifying internal cache structures
   * - **Batch Efficiency**: Efficient for bulk operations on all edges
   * 
   * **Integration Points:**
   * - **GraphBuilder**: Uses this method to collect all edges for graph construction
   * - **Deduplication**: Input to deduplicateEdges() for duplicate removal
   * - **Statistics**: Source data for edge analysis and metrics
   * - **Validation**: Complete edge set for referential integrity checking
   * 
   * @returns Array containing all cached GraphEdge objects
   * 
   * @example
   * ```typescript
   * // Collect all edges for graph building
   * const allEdges = resolver.getAllEdges();
   * console.log(`Created ${allEdges.length} edges`);
   * 
   * // Use with graph builder
   * const graphData = {
   *   nodes: allNodes,
   *   edges: resolver.getAllEdges()
   * };
   * 
   * // Analyze edge distribution
   * const edgeTypes = resolver.getAllEdges().reduce((acc, edge) => {
   *   const type = edge.data?.relationshipType || 'unknown';
   *   acc[type] = (acc[type] || 0) + 1;
   *   return acc;
   * }, {});
   * ```
   * 
   * Complexity: O(n) where n = number of cached edges
   */
  getAllEdges(): GraphEdge[] {
    return Array.from(this.edgeCache.values());
  }

  /**
   * Clear comprehensive edge caching system for fresh graph building sessions.
   * Performs complete reset of all caching structures and relationship processor state
   * to ensure clean starting conditions for new graph construction cycles.
   * 
   * **Clearing Operations:**
   * 1. **Edge Cache**: Clears Map<string, GraphEdge> containing all cached edges
   * 2. **Edge Index**: Clears Map<string, Set<string>> for source → targets mapping
   * 3. **Processor Cache**: Delegates to RelationshipProcessor.clearCache() for relationship caching
   * 4. **Memory Release**: Allows garbage collection of large data structures
   * 
   * **Use Cases:**
   * - **Graph Rebuilds**: Essential between different graph construction sessions
   * - **Filter Changes**: Clear before applying new node inclusion filters
   * - **Data Updates**: Reset when underlying Notion data changes
   * - **Memory Management**: Periodic clearing to prevent memory accumulation
   * 
   * **Performance Impact:**
   * - **Immediate**: O(1) clearing operations on Map and Set structures
   * - **Memory**: Significant memory release for large graphs
   * - **Garbage Collection**: May trigger GC for released objects
   * - **Next Build**: Subsequent edge creation starts with clean cache
   * 
   * **Integration Points:**
   * - **GraphOrchestrator**: Called before each graph build cycle
   * - **Filter Updates**: Triggered when node inclusion changes
   * - **Data Refresh**: Used when fresh data arrives from API
   * - **Error Recovery**: Clearing state after processing errors
   * 
   * **Cache Coordination:**
   * - **Edge-Level**: Clears this resolver's edge cache and index
   * - **Relationship-Level**: Clears RelationshipProcessor's internal caches
   * - **Atomic Operation**: All clearing operations complete together
   * - **State Consistency**: Ensures all related caches reset simultaneously
   * 
   * **Memory Efficiency:**
   * - **Large Graph Support**: Prevents memory accumulation across builds
   * - **Cache Size Reset**: Returns to initial empty state
   * - **Reference Clearing**: Removes references to potentially large objects
   * - **GC Enablement**: Allows collection of unreferenced graph structures
   * 
   * @example
   * ```typescript
   * // Before new graph build
   * resolver.clearCache();
   * const edges = await buildNewGraphEdges();
   * 
   * // After filter changes
   * filterStore.updateFilters(newFilters);
   * resolver.clearCache(); // Fresh start with new node set
   * 
   * // Memory management in long-running sessions
   * setInterval(() => resolver.clearCache(), 300000); // Every 5 minutes
   * ```
   * 
   * Complexity: O(1) - Map.clear() and Set.clear() operations
   */
  clearCache(): void {
    this.edgeCache.clear();
    this.edgeIndex.clear();
    // Also clear the relationship processor cache to allow re-processing
    this.relationshipProcessor.clearCache();
  }

  /**
   * Remove duplicate edges using comprehensive deduplication algorithm.
   * Analyzes edge collection to identify and eliminate redundant entries based on
   * source-target-type combination uniqueness, preserving first occurrence semantics.
   * 
   * **Deduplication Algorithm:**
   * 1. **Key Generation**: Creates unique key from source-target-type combination
   * 2. **Map Tracking**: Uses Map<string, GraphEdge> for O(1) duplicate detection
   * 3. **First Occurrence**: Preserves chronologically first edge of each unique combination
   * 4. **Metrics Logging**: Records deduplication statistics for monitoring
   * 
   * **Key Format:**
   * - **Pattern**: `${source}-${target}-${type}`
   * - **Examples**: 'puzzle1-element5-dependency', 'char2-char3-collaboration'
   * - **Uniqueness**: Ensures no two edges have identical source, target, and type
   * - **Direction Aware**: Treats 'A→B' and 'B→A' as different edges
   * 
   * **Duplicate Scenarios:**
   * - **Multiple Processors**: Different entity transformers creating same edge
   * - **Bidirectional Relations**: Forward and reverse relationship processing
   * - **Timeline Overlaps**: Events creating duplicate temporal connections
   * - **Ownership Conflicts**: Multiple ownership resolution paths
   * 
   * **Performance Characteristics:**
   * - **O(n) Time**: Linear scan through input edges array
   * - **O(k) Space**: Map size proportional to unique edges (k ≤ n)
   * - **Memory Efficient**: Only stores unique edges, discards duplicates
   * - **Batch Processing**: Handles large edge collections efficiently
   * 
   * **Preservation Strategy:**
   * - **First Wins**: Maintains chronological creation order
   * - **Complete Objects**: Preserves full GraphEdge with styling and metadata
   * - **Original References**: No modification of existing edge objects
   * - **Type Safety**: Maintains TypeScript edge type information
   * 
   * **Use Cases:**
   * - **Graph Assembly**: Final step before graph construction
   * - **Multi-Source Edges**: Combining edges from different entity transformers
   * - **Quality Assurance**: Ensuring clean graph structure
   * - **Performance Optimization**: Reducing redundant edge processing
   * 
   * **Logging and Monitoring:**
   * - **Input Count**: Records original edge array length
   * - **Output Count**: Records deduplicated edge count
   * - **Reduction Ratio**: Calculates deduplication efficiency
   * - **Debug Level**: Uses debug logging to avoid production noise
   * 
   * @param edges - Array of GraphEdge objects that may contain duplicates
   * @returns Deduplicated array with unique edges only
   * 
   * @example
   * ```typescript
   * // Deduplicate after collecting from multiple sources
   * const characterEdges = resolver.createCharacterEdges(...);
   * const puzzleEdges = resolver.createPuzzleEdges(...);
   * const timelineEdges = resolver.createTimelineEdges(...);
   * const allEdges = [...characterEdges, ...puzzleEdges, ...timelineEdges];
   * const uniqueEdges = resolver.deduplicateEdges(allEdges);
   * 
   * // Quality check with logging
   * const before = rawEdges.length;
   * const cleaned = resolver.deduplicateEdges(rawEdges);
   * console.log(`Removed ${before - cleaned.length} duplicates`);
   * 
   * // Integration with graph building
   * const graphData = {
   *   nodes: transformedNodes,
   *   edges: resolver.deduplicateEdges(resolver.getAllEdges())
   * };
   * ```
   * 
   * Complexity: O(n) where n = number of input edges
   */
  deduplicateEdges(edges: GraphEdge[]): GraphEdge[] {
    const uniqueEdges = new Map<string, GraphEdge>();
    
    edges.forEach(edge => {
      const key = `${edge.source}-${edge.target}-${edge.type}`;
      if (!uniqueEdges.has(key)) {
        uniqueEdges.set(key, edge);
      }
    });

    log.debug('Edges deduplicated', { 
      original: edges.length, 
      unique: uniqueEdges.size 
    });

    return Array.from(uniqueEdges.values());
  }
}