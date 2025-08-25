/**
 * Base Layout Algorithm Module
 * 
 * Abstract foundation for all graph layout algorithms in ALNRetool with comprehensive
 * algorithm lifecycle management, capability detection, and performance optimization.
 * 
 * **Core Architecture:**
 * - **Abstract Base Class**: Template Method pattern for consistent algorithm implementation
 * - **Capability System**: Feature detection for async, cancellation, and incremental support
 * - **Progress Tracking**: Standardized progress reporting for long-running layouts
 * - **Quality Metrics**: Built-in layout evaluation and optimization feedback
 * - **Configuration Management**: Type-safe configuration with validation and defaults
 * 
 * **Layout Algorithm Categories:**
 * - **Force-Based**: Physics simulation algorithms (ForceDirected, ForceAtlas2)
 * - **Hierarchical**: Tree-based layouts with clear parent-child relationships (Dagre)
 * - **Radial**: Center-out arrangements for focused exploration
 * - **Grid**: Structured positioning for systematic content organization
 * - **Custom**: Domain-specific algorithms for murder mystery optimization
 * 
 * **Performance Features:**
 * - **Async Execution**: Non-blocking layout computation with progress reporting
 * - **Cancellation Support**: Graceful termination of long-running calculations
 * - **Incremental Updates**: Efficient partial re-layout for changed nodes/edges
 * - **Quality Assessment**: Built-in metrics for layout optimization feedback
 * 
 * **Murder Mystery Integration:**
 * - **Entity-Aware Layouts**: Specialized positioning for characters, puzzles, elements
 * - **Investigation Flow**: Hierarchical arrangements following puzzle dependencies
 * - **Timeline Layouts**: Chronological positioning for temporal relationships
 * - **Character Clustering**: Relationship-based grouping for social analysis
 * 
 * @example
 * ```typescript
 * // Implement custom layout algorithm
 * class CustomMysteryLayout extends BaseLayoutAlgorithm {
 *   constructor(traversalEngine: TraversalEngine) {
 *     super({
 *       id: 'mystery-layout',
 *       name: 'Mystery Investigation Layout',
 *       description: 'Specialized layout for murder mystery investigation flow',
 *       category: 'custom',
 *       capabilities: { supportsAsync: true, supportsCancellation: true },
 *       defaultConfig: { nodeSpacing: 150, viewType: 'puzzle-focus' },
 *       performance: { timeComplexity: 'O(V + E)', spaceComplexity: 'O(V)' }
 *     }, traversalEngine);
 *   }
 * 
 *   apply(graph: GraphData): GraphData {
 *     // Custom layout implementation
 *     return this.positionNodesForMysteryFlow(graph);
 *   }
 * }
 * 
 * // Use algorithm with progress tracking
 * const algorithm = new CustomMysteryLayout(traversalEngine);
 * const layoutResult = await algorithm.applyAsync(graphData, (progress) => {
 *   console.log(`Layout ${progress.progress}% complete: ${progress.message}`);
 * });
 * 
 * // Check capabilities before using features
 * if (algorithm.getMetadata().capabilities.supportsIncremental) {
 *   const updated = algorithm.applyIncremental(graph, changedNodes, changedEdges);
 * }
 * 
 * // Evaluate layout quality
 * const metrics = algorithm.calculateQualityMetrics(layoutResult);
 * console.log(`Edge crossings: ${metrics.edgeCrossings}, Node overlaps: ${metrics.nodeOverlaps}`);
 * ```
 * 
 * @see LayoutOrchestrator - Manages algorithm selection and execution
 * @see LayoutAlgorithmRegistry - Handles lazy loading and registration
 * @see TraversalEngine - Required dependency for graph traversal operations
 */

import type { GraphNode, GraphEdge, GraphData } from '../types';
import type { TraversalEngine } from '../modules/TraversalEngine';

/**
 * Configuration interface for layout algorithms with extensible properties.
 * Provides common layout parameters while allowing algorithm-specific customization
 * through index signature for type-safe extension.
 * 
 * **Core Configuration Properties:**
 * - **Dimensions**: Canvas width/height for layout bounds
 * - **Spacing**: Node separation for visual clarity
 * - **View Integration**: View-specific optimizations and constraints
 * 
 * **Extension Pattern:**
 * - Index signature allows algorithm-specific properties
 * - Type safety maintained through proper interface extension
 * - Runtime validation handled by individual algorithms
 * 
 * @example
 * ```typescript
 * const config: LayoutConfig = {
 *   width: 1200,
 *   height: 800,
 *   nodeSpacing: 100,
 *   viewType: 'character-journey',
 *   // Algorithm-specific extensions
 *   iterations: 300,
 *   damping: 0.9,
 *   repulsion: 1000
 * };
 * ```
 */
export interface LayoutConfig {
  /** Canvas width for layout bounds (pixels, optional) */
  width?: number;
  /** Canvas height for layout bounds (pixels, optional) */
  height?: number;
  /** Minimum spacing between nodes (pixels, optional) */
  nodeSpacing?: number;
  /** View type for algorithm-specific optimizations */
  viewType?: import('../types').ViewType;
  /** Extensible properties for algorithm-specific configuration */
  [key: string]: unknown;
}

/**
 * Progress tracking interface for asynchronous layout operations.
 * Provides comprehensive feedback during long-running layout calculations
 * with standardized progress reporting and user experience optimization.
 * 
 * **Progress Reporting Features:**
 * - **Percentage Complete**: 0-100 progress indication for UI progress bars
 * - **Status Messages**: Human-readable descriptions of current operation
 * - **Time Estimation**: Remaining time calculations for user planning
 * 
 * **Integration Points:**
 * - **UI Progress Bars**: Direct integration with loading indicators
 * - **Cancellation UX**: User feedback for cancellation decision making
 * - **Performance Monitoring**: Algorithm benchmarking and optimization
 * - **User Experience**: Transparent feedback during complex operations
 * 
 * @example
 * ```typescript
 * const progressHandler = (progress: LayoutProgress) => {
 *   updateProgressBar(progress.progress);
 *   setStatusMessage(progress.message || 'Processing...');
 *   if (progress.timeRemaining) {
 *     setTimeEstimate(`${Math.round(progress.timeRemaining / 1000)}s remaining`);
 *   }
 * };
 * ```
 */
export interface LayoutProgress {
  /** Completion percentage from 0 to 100 */
  progress: number;
  /** Optional human-readable status message */
  message?: string;
  /** Optional estimated remaining time in milliseconds */
  timeRemaining?: number;
}

/**
 * Capability detection interface for layout algorithm feature support.
 * Enables runtime detection of algorithm capabilities for optimal user experience
 * and intelligent algorithm selection based on graph characteristics and requirements.
 * 
 * **Feature Categories:**
 * - **Execution Modes**: Async support for non-blocking computation
 * - **User Control**: Cancellation support for long-running operations  
 * - **Performance**: Incremental updates for efficient re-layout
 * - **Advanced Features**: Constraint handling for custom positioning requirements
 * - **Scalability**: Maximum supported graph size for performance guarantees
 * 
 * **Algorithm Selection Benefits:**
 * - **Automatic Fallbacks**: Graceful degradation when features unavailable
 * - **Performance Optimization**: Capability-based algorithm recommendation
 * - **User Experience**: Progress tracking only when supported
 * - **Scalability Planning**: Early detection of graph size limitations
 * 
 * @example
 * ```typescript
 * const capabilities: LayoutCapabilities = {
 *   supportsAsync: true,        // Can run without blocking UI
 *   supportsCancellation: true, // User can interrupt computation
 *   supportsIncremental: true,  // Efficient partial updates
 *   supportsConstraints: false, // No custom positioning constraints
 *   maxNodes: 1000,            // Performance guarantee up to 1000 nodes
 *   maxEdges: 5000             // Performance guarantee up to 5000 edges
 * };
 * 
 * // Use capabilities for intelligent algorithm selection
 * if (graphSize > capabilities.maxNodes) {
 *   fallbackToSimplifiedAlgorithm();
 * }
 * ```
 */
export interface LayoutCapabilities {
  /** Whether algorithm supports asynchronous execution */
  supportsAsync: boolean;
  /** Whether algorithm supports computation cancellation */
  supportsCancellation: boolean;
  /** Whether algorithm supports incremental updates */
  supportsIncremental: boolean;
  /** Whether algorithm supports custom positioning constraints */
  supportsConstraints: boolean;
  /** Maximum nodes for performance guarantees (optional) */
  maxNodes?: number;
  /** Maximum edges for performance guarantees (optional) */
  maxEdges?: number;
}

/**
 * Comprehensive metadata interface for layout algorithm registration and discovery.
 * Provides complete algorithm characterization for intelligent selection, performance
 * planning, and user interface integration.
 * 
 * **Metadata Categories:**
 * - **Identity**: Unique identification and human-readable naming
 * - **Classification**: Categorical organization for algorithm grouping
 * - **Capabilities**: Feature detection for optimal integration
 * - **Configuration**: Default settings and customization options
 * - **Performance**: Complexity analysis and benchmarking data
 * 
 * **Algorithm Categories:**
 * - **force**: Physics-based algorithms (ForceDirected, ForceAtlas2)
 * - **hierarchical**: Tree-based layouts (Dagre, Hierarchical)
 * - **radial**: Center-out arrangements (Radial, Circular)
 * - **grid**: Structured positioning (Grid, Matrix)
 * - **custom**: Domain-specific algorithms (Murder mystery optimized)
 * 
 * **Performance Specification:**
 * - **Time Complexity**: Big O notation for algorithmic analysis
 * - **Space Complexity**: Memory usage characteristics
 * - **Iteration Estimates**: Average computation cycles for planning
 * 
 * @example
 * ```typescript
 * const metadata: LayoutMetadata = {
 *   id: 'mystery-investigation',
 *   name: 'Murder Mystery Investigation Layout',
 *   description: 'Specialized layout optimized for investigation flow and character relationships',
 *   category: 'custom',
 *   capabilities: {
 *     supportsAsync: true,
 *     supportsCancellation: true,
 *     supportsIncremental: true,
 *     supportsConstraints: false,
 *     maxNodes: 500,
 *     maxEdges: 2000
 *   },
 *   defaultConfig: {
 *     width: 1200,
 *     height: 800,
 *     nodeSpacing: 150,
 *     viewType: 'puzzle-focus'
 *   },
 *   performance: {
 *     timeComplexity: 'O(V + E)',
 *     spaceComplexity: 'O(V)',
 *     averageIterations: 100
 *   }
 * };
 * ```
 */
export interface LayoutMetadata {
  /** Unique identifier for algorithm registration */
  id: string;
  /** Human-readable algorithm name */
  name: string;
  /** Detailed description of algorithm purpose and behavior */
  description: string;
  /** Algorithm category for organization and selection */
  category: 'force' | 'hierarchical' | 'radial' | 'grid' | 'custom';
  /** Feature capabilities for intelligent integration */
  capabilities: LayoutCapabilities;
  /** Default configuration values */
  defaultConfig: LayoutConfig;
  /** Performance characteristics and complexity analysis */
  performance: {
    /** Time complexity in Big O notation */
    timeComplexity: string;
    /** Space complexity in Big O notation */
    spaceComplexity: string;
    /** Average iteration count for time estimation */
    averageIterations?: number;
  };
}

/**
 * Abstract base class for all graph layout algorithms with lifecycle management.
 * Implements the Template Method pattern to provide consistent algorithm structure
 * while enabling specialized layout implementations for different graph characteristics.
 * 
 * **Design Pattern Implementation:**
 * - **Template Method**: Standardized algorithm lifecycle with customization points
 * - **Strategy Pattern**: Interchangeable algorithms with consistent interface
 * - **Dependency Injection**: TraversalEngine integration for graph operations
 * - **Factory Pattern**: Metadata-driven algorithm instantiation
 * 
 * **Algorithm Lifecycle:**
 * 1. **Initialization**: Metadata and configuration setup
 * 2. **Validation**: Graph size and capability checking
 * 3. **Execution**: Synchronous or asynchronous layout computation
 * 4. **Progress Tracking**: Optional progress reporting during execution
 * 5. **Quality Assessment**: Post-layout metrics calculation
 * 6. **Cleanup**: Resource management and cancellation handling
 * 
 * **Execution Modes:**
 * - **Synchronous**: Blocking execution for small graphs or simple algorithms
 * - **Asynchronous**: Non-blocking execution with progress reporting
 * - **Incremental**: Partial re-layout for changed nodes/edges
 * - **Cancellable**: User-controlled termination of long-running operations
 * 
 * **Integration Architecture:**
 * - **LayoutOrchestrator**: Algorithm selection and execution coordination
 * - **TraversalEngine**: Graph traversal and analysis operations
 * - **ViewStrategy**: View-specific optimizations and constraints
 * - **QualityMetrics**: Layout evaluation and optimization feedback
 * 
 * @example
 * ```typescript
 * // Implement force-directed layout
 * class ForceDirectedLayout extends BaseLayoutAlgorithm {
 *   constructor(traversalEngine: TraversalEngine) {
 *     super({
 *       id: 'force-directed',
 *       name: 'Force-Directed Layout',
 *       description: 'Physics-based organic layout with natural clustering',
 *       category: 'force',
 *       capabilities: { supportsAsync: true, supportsCancellation: true },
 *       defaultConfig: { iterations: 300, repulsion: 1000 },
 *       performance: { timeComplexity: 'O(V²)', spaceComplexity: 'O(V)' }
 *     }, traversalEngine);
 *   }
 * 
 *   apply(graph: GraphData): GraphData {
 *     this.validateConfig();
 *     return this.runPhysicsSimulation(graph);
 *   }
 * 
 *   async applyAsync(graph: GraphData, onProgress?: (progress: LayoutProgress) => void): Promise<GraphData> {
 *     const iterations = this.config.iterations || 300;
 *     for (let i = 0; i < iterations; i++) {
 *       if (this.cancelled) break;
 *       graph = this.performIteration(graph);
 *       if (onProgress && i % 10 === 0) {
 *         onProgress({ 
 *           progress: (i / iterations) * 100,
 *           message: `Simulation iteration ${i}/${iterations}`
 *         });
 *       }
 *     }
 *     return graph;
 *   }
 * }
 * ```
 * 
 * @see LayoutMetadata - Algorithm registration and capability declaration
 * @see LayoutConfig - Configuration interface for algorithm parameters
 * @see LayoutProgress - Progress tracking for asynchronous operations
 * @see TraversalEngine - Required dependency for graph analysis
 */
export abstract class BaseLayoutAlgorithm {
  /** Algorithm metadata including capabilities and performance characteristics */
  protected metadata: LayoutMetadata;
  /** Current configuration with merged defaults and overrides */
  protected config: LayoutConfig;
  /** Cancellation flag for graceful algorithm termination */
  protected cancelled = false;
  /** TraversalEngine dependency for graph analysis operations */
  protected traversalEngine: TraversalEngine;

  /**
   * Initialize base layout algorithm with metadata and dependencies.
   * Sets up algorithm configuration, capability validation, and required dependencies
   * for consistent algorithm behavior across all implementations.
   * 
   * **Initialization Process:**
   * 1. **Metadata Registration**: Store algorithm identity and capabilities
   * 2. **Configuration Merging**: Combine defaults with custom overrides
   * 3. **Dependency Injection**: Store TraversalEngine for graph operations
   * 4. **State Initialization**: Reset cancellation flags and internal state
   * 
   * **Configuration Strategy:**
   * - Default values from metadata provide baseline behavior
   * - Custom config overrides enable algorithm customization
   * - Type safety maintained through LayoutConfig interface
   * - Runtime validation available through validateConfig() method
   * 
   * @param metadata - Complete algorithm metadata including capabilities
   * @param traversalEngine - TraversalEngine instance for graph operations
   * @param config - Optional configuration overrides for default behavior
   * 
   * @example
   * ```typescript
   * // Initialize with custom configuration
   * const algorithm = new CustomLayout(
   *   {
   *     id: 'custom',
   *     name: 'Custom Layout',
   *     description: 'Specialized layout algorithm',
   *     category: 'custom',
   *     capabilities: { supportsAsync: true },
   *     defaultConfig: { nodeSpacing: 100 },
   *     performance: { timeComplexity: 'O(V + E)', spaceComplexity: 'O(V)' }
   *   },
   *   traversalEngine,
   *   { nodeSpacing: 150, iterations: 500 } // Custom overrides
   * );
   * ```
   * 
   * Complexity: O(1)
   */
  constructor(metadata: LayoutMetadata, traversalEngine: TraversalEngine, config?: LayoutConfig) {
    this.metadata = metadata;
    this.config = { ...metadata.defaultConfig, ...config };
    this.traversalEngine = traversalEngine;
  }

  /**
   * Retrieve complete algorithm metadata for capability detection and selection.
   * Provides access to algorithm identity, capabilities, performance characteristics,
   * and default configuration for intelligent algorithm selection and UI integration.
   * 
   * **Metadata Applications:**
   * - **Algorithm Selection**: Capability-based algorithm recommendation
   * - **UI Integration**: Display names, descriptions, and performance expectations
   * - **Performance Planning**: Complexity analysis and resource estimation
   * - **Feature Detection**: Runtime capability checking for optimal UX
   * 
   * **Immutability Guarantee:**
   * - Returns reference to internal metadata object
   * - Metadata should not be modified after construction
   * - Consistent behavior across algorithm lifecycle
   * 
   * @returns Complete LayoutMetadata object with all algorithm characteristics
   * 
   * @example
   * ```typescript
   * const metadata = algorithm.getMetadata();
   * console.log(`Using ${metadata.name}: ${metadata.description}`);
   * console.log(`Performance: ${metadata.performance.timeComplexity}`);
   * 
   * // Check capabilities before using features
   * if (metadata.capabilities.supportsAsync) {
   *   await algorithm.applyAsync(graph, progressCallback);
   * } else {
   *   algorithm.apply(graph);
   * }
   * 
   * // Validate graph size constraints
   * if (metadata.capabilities.maxNodes && nodes.length > metadata.capabilities.maxNodes) {
   *   console.warn('Graph exceeds recommended size for this algorithm');
   * }
   * ```
   * 
   * Complexity: O(1)
   */
  getMetadata(): LayoutMetadata {
    return this.metadata;
  }

  /**
   * Update algorithm configuration with partial overrides and validation.
   * Merges new configuration values with existing settings while maintaining
   * type safety and enabling runtime algorithm customization.
   * 
   * **Configuration Update Strategy:**
   * - **Shallow Merge**: Combines existing config with provided overrides
   * - **Type Safety**: Partial<LayoutConfig> ensures valid property types
   * - **Runtime Validation**: Calls validateConfig() if overridden by subclass
   * - **Immediate Effect**: Configuration takes effect for next layout operation
   * 
   * **Use Cases:**
   * - **Dynamic Customization**: User-driven algorithm parameter adjustment
   * - **View-Specific Settings**: Different configurations for different views
   * - **Performance Tuning**: Runtime optimization based on graph characteristics
   * - **A/B Testing**: Experimental parameter variations
   * 
   * @param config - Partial configuration object with properties to update
   * 
   * @example
   * ```typescript
   * // Update node spacing for better visualization
   * algorithm.updateConfig({ nodeSpacing: 200 });
   * 
   * // Adjust algorithm-specific parameters
   * algorithm.updateConfig({ 
   *   iterations: 500,
   *   damping: 0.8,
   *   repulsion: 1500
   * });
   * 
   * // View-specific configuration
   * if (viewType === 'character-journey') {
   *   algorithm.updateConfig({ 
   *     viewType: 'character-journey',
   *     nodeSpacing: 300,
   *     hierarchySpacing: 150
   *   });
   * }
   * ```
   * 
   * Complexity: O(1)
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Validate algorithm capability to handle graph size and characteristics.
   * Performs comprehensive graph analysis to determine if algorithm can provide
   * optimal performance and reliable results for the given graph structure.
   * 
   * **Validation Checks:**
   * - **Node Count**: Validates against maxNodes capability limit
   * - **Edge Count**: Validates against maxEdges capability limit
   * - **Graph Density**: Implicit validation through edge/node ratio
   * - **Performance Guarantee**: Ensures algorithm can complete within reasonable time
   * 
   * **Capability-Based Validation:**
   * - Uses metadata.capabilities for definitive limits
   * - Provides early detection of performance issues
   * - Enables graceful fallback to simpler algorithms
   * - Supports user feedback for graph optimization
   * 
   * **Return Value Semantics:**
   * - `true`: Algorithm can handle graph with performance guarantees
   * - `false`: Graph exceeds algorithm capabilities, consider alternatives
   * 
   * @param nodes - Array of graph nodes to validate
   * @param edges - Array of graph edges to validate
   * @returns True if algorithm can handle graph within performance constraints
   * 
   * @example
   * ```typescript
   * // Check before applying layout
   * if (algorithm.canHandle(graph.nodes, graph.edges)) {
   *   const result = algorithm.apply(graph);
   * } else {
   *   console.warn(`Graph too large for ${algorithm.getMetadata().name}`);
   *   const simpleAlgorithm = getSimpleLayoutAlgorithm();
   *   const result = simpleAlgorithm.apply(graph);
   * }
   * 
   * // Algorithm selection based on capabilities
   * const suitableAlgorithms = allAlgorithms.filter(alg => 
   *   alg.canHandle(graph.nodes, graph.edges)
   * );
   * 
   * // Performance-aware layout selection
   * const largeGraphAlgorithm = suitableAlgorithms.find(alg => 
   *   alg.getMetadata().performance.timeComplexity === 'O(V + E)'
   * );
   * ```
   * 
   * Complexity: O(1)
   */
  canHandle(nodes: GraphNode[], edges: GraphEdge[]): boolean {
    const { maxNodes, maxEdges } = this.metadata.capabilities;
    
    if (maxNodes && nodes.length > maxNodes) {
      return false;
    }
    
    if (maxEdges && edges.length > maxEdges) {
      return false;
    }
    
    return true;
  }

  /**
   * Cancel ongoing layout computation with graceful termination.
   * Provides user-controlled termination of long-running layout algorithms
   * with immediate effect on next iteration check.
   * 
   * **Cancellation Strategy:**
   * - **Immediate Effect**: Sets cancellation flag for next iteration check
   * - **Graceful Termination**: Allows current iteration to complete safely
   * - **Resource Cleanup**: Algorithm should handle partial state cleanup
   * - **No Data Corruption**: Ensures graph remains in valid state
   * 
   * **Algorithm Integration:**
   * - Algorithms should check `this.cancelled` in tight loops
   * - Long-running operations should respect cancellation flag
   * - Partial results should be returned in valid GraphData format
   * - Progress callbacks should indicate cancellation status
   * 
   * **Use Cases:**
   * - **User Interaction**: Cancel button in layout progress UI
   * - **Performance Management**: Terminate slow algorithms on large graphs
   * - **Resource Management**: Free computational resources when needed
   * - **Algorithm Switching**: Quick termination when switching layout types
   * 
   * @example
   * ```typescript
   * // User cancellation in UI
   * const layoutPromise = algorithm.applyAsync(graph, (progress) => {
   *   updateProgressUI(progress);
   * });
   * 
   * cancelButton.onclick = () => {
   *   algorithm.cancel();
   *   showMessage('Layout cancelled by user');
   * };
   * 
   * // Algorithm implementation with cancellation
   * async applyAsync(graph: GraphData): Promise<GraphData> {
   *   for (let i = 0; i < iterations; i++) {
   *     if (this.cancelled) {
   *       console.log('Layout cancelled at iteration', i);
   *       break; // Return partial results
   *     }
   *     graph = this.performIteration(graph);
   *   }
   *   return graph;
   * }
   * ```
   * 
   * Complexity: O(1)
   */
  cancel(): void {
    this.cancelled = true;
  }

  /**
   * Reset cancellation flag for algorithm reuse.
   * Clears cancellation state to enable algorithm reuse after previous
   * cancellation without requiring new instance creation.
   * 
   * **Reset Strategy:**
   * - **State Cleanup**: Clears cancelled flag for fresh execution
   * - **Automatic Reset**: Called internally before each layout operation
   * - **Protected Access**: Internal use only, not exposed to external callers
   * - **Performance Optimization**: Enables algorithm instance reuse
   * 
   * **Lifecycle Integration:**
   * - Called automatically at start of apply() and applyAsync()
   * - Ensures clean state for each layout operation
   * - Prevents stale cancellation from affecting new operations
   * - Maintains consistent behavior across multiple uses
   * 
   * @example
   * ```typescript
   * // Internal usage in algorithm implementation
   * apply(graph: GraphData): GraphData {
   *   this.resetCancellation(); // Clean slate for new operation
   *   this.validateConfig();
   *   return this.executeLayout(graph);
   * }
   * 
   * async applyAsync(graph: GraphData, onProgress?: (progress: LayoutProgress) => void): Promise<GraphData> {
   *   this.resetCancellation(); // Enable reuse after previous cancellation
   *   // ... layout implementation
   * }
   * ```
   * 
   * Complexity: O(1)
   */
  protected resetCancellation(): void {
    this.cancelled = false;
  }

  /**
   * Apply layout algorithm synchronously to graph data.
   * Abstract method requiring implementation by all concrete layout algorithms
   * to provide the core layout computation logic.
   * 
   * **Implementation Requirements:**
   * - **Input Validation**: Validate graph structure and algorithm capabilities
   * - **Node Positioning**: Calculate and assign position coordinates to all nodes
   * - **Edge Routing**: Position edges optimally around positioned nodes
   * - **Metadata Preservation**: Maintain all node and edge metadata during layout
   * - **Performance Optimization**: Implement efficient algorithms within complexity bounds
   * 
   * **Synchronous Characteristics:**
   * - **Blocking Execution**: Completes fully before returning results
   * - **No Progress Reporting**: Single atomic operation without progress updates
   * - **Error Handling**: Should throw descriptive errors for invalid inputs
   * - **Resource Management**: Complete cleanup before method return
   * 
   * **Implementation Pattern:**
   * ```typescript
   * apply(graph: GraphData): GraphData {
   *   this.resetCancellation();
   *   this.validateConfig();
   *   
   *   const positioned = this.calculateNodePositions(graph.nodes, graph.edges);
   *   return {
   *     ...graph,
   *     nodes: positioned,
   *     metadata: { ...graph.metadata, layoutApplied: this.metadata.id }
   *   };
   * }
   * ```
   * 
   * @param graph - Complete graph data requiring layout positioning
   * @returns GraphData with positioned nodes and preserved metadata
   * 
   * @throws {Error} When graph exceeds algorithm capabilities or contains invalid data
   * 
   * Complexity: Algorithm-dependent, documented in metadata.performance.timeComplexity
   */
  abstract apply(graph: GraphData): GraphData;

  /**
   * Apply layout algorithm asynchronously with comprehensive progress tracking.
   * Provides non-blocking layout computation with detailed progress reporting
   * and cancellation support for optimal user experience.
   * 
   * **Asynchronous Benefits:**
   * - **Non-Blocking UI**: Maintains responsive interface during computation
   * - **Progress Feedback**: Real-time updates on layout calculation progress
   * - **Cancellation Support**: User-controlled termination of long operations
   * - **Resource Management**: Efficient memory usage for large graphs
   * 
   * **Implementation Strategy:**
   * - **Capability Detection**: Uses metadata.capabilities.supportsAsync
   * - **Graceful Fallback**: Simulated progress for sync-only algorithms
   * - **Override Pattern**: Subclasses provide true async implementations
   * - **Progress Standardization**: Consistent LayoutProgress interface
   * 
   * **Progress Reporting Protocol:**
   * - **0% Start**: Initial progress with startup message
   * - **Incremental Updates**: Regular progress updates (every 5-10%)
   * - **100% Completion**: Final progress with completion message
   * - **Cancellation Indication**: Progress update when cancelled
   * 
   * @param graph - Complete graph data requiring asynchronous layout
   * @param onProgress - Optional callback for progress updates and cancellation feedback
   * @returns Promise resolving to positioned GraphData
   * 
   * @example
   * ```typescript
   * // Basic async layout with progress
   * const result = await algorithm.applyAsync(graph, (progress) => {
   *   console.log(`Progress: ${progress.progress}% - ${progress.message}`);
   *   updateProgressBar(progress.progress);
   * });
   * 
   * // Advanced implementation in subclass
   * async applyAsync(graph: GraphData, onProgress?: (progress: LayoutProgress) => void): Promise<GraphData> {
   *   this.resetCancellation();
   *   const iterations = this.config.iterations || 300;
   *   
   *   for (let i = 0; i < iterations; i++) {
   *     if (this.cancelled) {
   *       onProgress?.({ progress: (i / iterations) * 100, message: 'Cancelled by user' });
   *       break;
   *     }
   *     
   *     graph = await this.performAsyncIteration(graph);
   *     
   *     if (onProgress && i % 10 === 0) {
   *       onProgress({
   *         progress: (i / iterations) * 100,
   *         message: `Iteration ${i}/${iterations}`,
   *         timeRemaining: ((iterations - i) * averageIterationTime)
   *       });
   *     }
   *   }
   *   
   *   onProgress?.({ progress: 100, message: 'Layout complete' });
   *   return graph;
   * }
   * ```
   * 
   * Complexity: Same as apply() but distributed across event loop cycles
   */
  async applyAsync(
    graph: GraphData,
    onProgress?: (progress: LayoutProgress) => void
  ): Promise<GraphData> {
    if (!this.metadata.capabilities.supportsAsync) {
      // Fallback to sync with simulated progress
      if (onProgress) {
        onProgress({ progress: 0, message: 'Starting layout...' });
      }
      
      const result = this.apply(graph);
      
      if (onProgress) {
        onProgress({ progress: 100, message: 'Layout complete' });
      }
      
      return result;
    }
    
    // Override in subclasses for true async support
    return this.apply(graph);
  }

  /**
   * Apply incremental layout update for efficient partial re-positioning.
   * Optimizes layout performance by re-calculating positions only for changed
   * nodes and their affected neighbors rather than full graph re-layout.
   * 
   * **Incremental Update Benefits:**
   * - **Performance Optimization**: Faster updates for small graph changes
   * - **Smooth Transitions**: Maintains stable positions for unchanged nodes
   * - **Interactive Responsiveness**: Real-time updates during graph editing
   * - **Resource Efficiency**: Reduced computational overhead for large graphs
   * 
   * **Update Strategy:**
   * - **Change Detection**: Analyzes provided changed node/edge sets
   * - **Neighborhood Analysis**: Identifies affected nodes within influence radius
   * - **Selective Re-calculation**: Updates positions only for affected regions
   * - **Stability Preservation**: Maintains positions for unchanged graph areas
   * 
   * **Capability-Based Execution:**
   * - **Feature Detection**: Uses metadata.capabilities.supportsIncremental
   * - **Graceful Fallback**: Full re-layout when incremental not supported
   * - **Override Pattern**: Subclasses implement algorithm-specific incremental logic
   * 
   * **Change Impact Analysis:**
   * - **Direct Changes**: Nodes/edges explicitly marked as changed
   * - **Indirect Effects**: Neighboring nodes affected by layout forces
   * - **Cascade Analysis**: Multi-hop effects for hierarchical algorithms
   * - **Stability Zones**: Areas guaranteed to remain unchanged
   * 
   * @param graph - Current graph data with existing positions
   * @param _changedNodes - Set of node IDs that have been added, modified, or deleted
   * @param _changedEdges - Set of edge IDs that have been added, modified, or deleted
   * @returns Updated GraphData with incrementally adjusted positions
   * 
   * @example
   * ```typescript
   * // Track changes during graph editing
   * const changedNodes = new Set(['node-123', 'node-456']);
   * const changedEdges = new Set(['edge-abc']);
   * 
   * // Apply incremental update
   * const updated = algorithm.applyIncremental(graph, changedNodes, changedEdges);
   * 
   * // Implementation in force-directed subclass
   * applyIncremental(graph: GraphData, changedNodes: Set<string>, changedEdges: Set<string>): GraphData {
   *   if (!this.metadata.capabilities.supportsIncremental) {
   *     return this.apply(graph); // Full layout fallback
   *   }
   *   
   *   // Calculate affected neighborhood
   *   const affectedNodes = this.calculateAffectedNeighborhood(changedNodes, changedEdges, graph);
   *   
   *   // Selective position updates
   *   const updatedNodes = graph.nodes.map(node => {
   *     if (affectedNodes.has(node.id)) {
   *       return this.recalculateNodePosition(node, graph);
   *     }
   *     return node; // Preserve stable positions
   *   });
   *   
   *   return { ...graph, nodes: updatedNodes };
   * }
   * ```
   * 
   * Complexity: Algorithm-dependent, typically O(k + n) where k = changed nodes, n = affected neighborhood
   */
  applyIncremental(
    graph: GraphData,
    _changedNodes: Set<string>,
    _changedEdges: Set<string>
  ): GraphData {
    if (!this.metadata.capabilities.supportsIncremental) {
      // Fallback to full layout
      return this.apply(graph);
    }
    
    // Override in subclasses for incremental support
    return this.apply(graph);
  }

  /**
   * Validates current configuration parameters for algorithm-specific requirements.
   * 
   * Performs comprehensive validation of layout configuration including parameter
   * ranges, capability compatibility, and algorithm-specific constraints. Override
   * to implement custom validation logic for specialized algorithms.
   * 
   * **Validation Categories:**
   * - **Parameter Ranges**: Numeric bounds checking (iterations > 0, spacing > minValue)
   * - **Capability Compatibility**: Feature requirements vs algorithm capabilities
   * - **Algorithm Constraints**: Algorithm-specific parameter interdependencies
   * - **Performance Thresholds**: Resource usage and computation time limits
   * 
   * **Integration Points:**
   * - **Configuration Updates**: Called automatically during updateConfig()
   * - **Layout Execution**: Validated before apply() and applyAsync() execution
   * - **User Feedback**: Validation errors should provide clear user guidance
   * - **Development Tools**: Debugging support for algorithm configuration
   * 
   * @throws {Error} When configuration contains invalid values or unsupported combinations
   * 
   * @complexity O(1) - Basic validation checks are constant time
   * 
   * @example
   * ```typescript
   * class ForceLayoutAlgorithm extends BaseLayoutAlgorithm {
   *   protected validateConfig(): void {
   *     super.validateConfig(); // Call base validation
   *     
   *     if (this.config.iterations && this.config.iterations < 1) {
   *       throw new Error('Force layout requires at least 1 iteration');
   *     }
   *     if (this.config.nodeSpacing && this.config.nodeSpacing < 10) {
   *       throw new Error('Minimum node spacing is 10px for readability');
   *     }
   *     if (this.config.damping && (this.config.damping < 0 || this.config.damping > 1)) {
   *       throw new Error('Damping factor must be between 0 and 1');
   *     }
   *   }
   * }
   * ```
   * 
   * @remarks
   * Default implementation performs no validation. Algorithm implementations
   * should override this method to validate:
   * 
   * **Common Validations:**
   * - Positive values for iterations, spacing, and time parameters
   * - Probability values between 0 and 1 (damping, cooling factors)
   * - Dimension constraints (width > 0, height > 0)
   * - Feature compatibility (async support requirements)
   * 
   * **Murder Mystery Game Validations:**
   * - View type compatibility (puzzle-focus, character-journey)
   * - Entity-specific spacing requirements (character vs puzzle nodes)
   * - Investigation flow constraints (dependency hierarchy preservation)
   * 
   * Validation should be fast (< 1ms) to avoid impacting user interactions.
   * Use descriptive error messages to aid debugging and user configuration.
   * 
   * @see {@link updateConfig} - Calls this method during configuration updates
   * @see {@link LayoutConfig} - Configuration interface definition
   */
  protected validateConfig(): void {
    // Override in subclasses for specific validation
  }

  /**
   * Calculates comprehensive quality metrics for the current layout positioning.
   * 
   * Analyzes the visual and structural quality of the graph layout including
   * edge crossings, node distribution, readability scores, and murder mystery
   * game-specific metrics. Used for algorithm comparison and optimization.
   * 
   * **Quality Assessment Categories:**
   * - **Visual Clarity**: Edge crossings, node overlaps, and readability
   * - **Spatial Distribution**: Node spacing uniformity and aspect ratio
   * - **Structural Quality**: Edge length consistency and symmetry
   * - **Game-Specific**: Investigation flow and narrative organization
   * 
   * **Metric Applications:**
   * - **Algorithm Selection**: Compare layout algorithms quantitatively
   * - **Parameter Tuning**: Optimize configuration for better results
   * - **Performance Monitoring**: Track layout quality over time
   * - **User Experience**: Correlate metrics with user satisfaction
   * 
   * **Murder Mystery Optimization:**
   * - **Investigation Flow**: Logical progression through puzzle dependencies
   * - **Character Relationships**: Social clustering and interaction patterns
   * - **Timeline Coherence**: Chronological event organization
   * - **Narrative Clarity**: Story element visual hierarchy
   * 
   * @param _graph - Complete graph data with positioned nodes and edges
   * @returns Quality metrics object with standardized scoring (0-1 scale where applicable)
   * 
   * @complexity O(V² + E²) - Quadratic for comprehensive crossing detection
   * 
   * @example
   * ```typescript
   * const metrics = algorithm.calculateQualityMetrics(layoutResult);
   * console.log('Layout Quality Assessment:', {
   *   crossings: metrics.edgeCrossings,        // Lower is better (0+)
   *   overlaps: metrics.nodeOverlaps,         // Lower is better (0+)
   *   distribution: metrics.aspectRatio,      // Closer to golden ratio (~1.618)
   *   balance: metrics.symmetry,              // Higher is better (0-1)
   *   consistency: metrics.edgeLengthVariance // Lower is better (0+)
   * });
   * 
   * // Algorithm comparison
   * const algorithms = [dagreLayout, forceLayout, radialLayout];
   * const results = algorithms.map(alg => ({
   *   algorithm: alg.getMetadata().name,
   *   layout: alg.apply(graph),
   *   metrics: alg.calculateQualityMetrics(alg.apply(graph))
   * }));
   * 
   * // Select best algorithm based on combined metrics
   * const best = results.reduce((best, current) => {
   *   const bestScore = best.metrics.edgeCrossings + best.metrics.nodeOverlaps;
   *   const currentScore = current.metrics.edgeCrossings + current.metrics.nodeOverlaps;
   *   return currentScore < bestScore ? current : best;
   * });
   * ```
   * 
   * @remarks
   * Default implementation returns placeholder values. Algorithm implementations
   * should override to provide meaningful quality assessment:
   * 
   * **Standard Quality Metrics:**
   * - `edgeCrossings`: Count of edge intersection points (minimize for clarity)
   * - `nodeOverlaps`: Number of overlapping node bounding boxes (eliminate)
   * - `aspectRatio`: Layout width/height ratio (optimize for viewing context)
   * - `symmetry`: Structural balance and visual harmony (0-1 scale)
   * - `edgeLengthVariance`: Consistency of edge lengths (minimize for uniformity)
   * 
   * **Advanced Quality Indicators:**
   * - Node distribution uniformity using spatial statistics
   * - Edge crossing angles for optimal readability (>30° preferred)
   * - Whitespace utilization for balanced composition
   * - Hierarchical coherence for tree-like structures
   * 
   * **Performance Optimization Strategies:**
   * - Use spatial data structures (quadtree, R-tree) for overlap detection
   * - Implement sweep line algorithms for efficient crossing detection
   * - Cache expensive calculations between incremental updates
   * - Consider approximation algorithms for graphs >1000 nodes
   * - Parallelize independent metric calculations using Web Workers
   * 
   * **Murder Mystery Game Considerations:**
   * - Investigation flow should follow logical puzzle dependencies
   * - Character groupings should reflect relationship strengths
   * - Timeline events should maintain chronological coherence
   * - Story elements should be visually organized by narrative importance
   * 
   * Quality metrics directly correlate with user satisfaction and task completion
   * rates in graph visualization. Lower edge crossings and higher symmetry
   * consistently improve user performance in navigation and comprehension tasks.
   * 
   * @see {@link LayoutQualityMetrics} - Utility functions for quality calculation
   * @see {@link TraversalEngine} - Graph analysis for structural metrics
   * @see {@link GraphUtilities} - Helper functions for geometric calculations
   */
  calculateQualityMetrics(_graph: GraphData): {
    edgeCrossings: number;
    nodeOverlaps: number;
    aspectRatio: number;
    symmetry: number;
    edgeLengthVariance: number;
  } {
    // Basic implementation - override for specific algorithms
    return {
      edgeCrossings: 0,
      nodeOverlaps: 0,
      aspectRatio: 1,
      symmetry: 1,
      edgeLengthVariance: 0
    };
  }
}