/**
 * Layout Orchestrator V3 - Complete layout system with all 6 algorithms.
 * Manages layout application with smart algorithm selection and lazy loading.
 * 
 * This class serves as the central hub for all graph layout operations, providing
 * both synchronous and asynchronous layout application with progress tracking.
 * It implements lazy loading of layout algorithms to optimize initial load times
 * and memory usage, while providing intelligent algorithm selection based on
 * graph characteristics and view requirements.
 * 
 * @example
 * ```typescript
 * const orchestrator = new LayoutOrchestrator(traversalEngine);
 * await orchestrator.preloadCommonAlgorithms(['dagre', 'force']);
 * 
 * // Synchronous layout
 * const layoutGraph = orchestrator.applyLayout(graph, { layoutType: 'dagre' });
 * 
 * // Asynchronous with progress
 * const asyncGraph = await orchestrator.applyLayoutAsync(graph, config, progress => {
 *   console.log(`Layout progress: ${progress.progress}%`);
 * });
 * ```
 * 
 * @see BaseLayoutAlgorithm - Base class for all layout algorithms
 * @see ViewSpecificOptimizer - Provides view-specific layout optimizations
 * @see TraversalEngine - Required dependency for graph traversal operations
 */

import type { GraphData, LayoutConfig, ViewType } from '../types';
import { BaseLayoutAlgorithm } from '../layout/BaseLayoutAlgorithm';
import type { LayoutProgress } from '../layout/BaseLayoutAlgorithm';
import { ViewSpecificOptimizer } from '../layout/algorithms/ViewSpecificOptimizer';
import type { TraversalEngine } from './TraversalEngine';
import { logger } from '../utils/Logger'

/** Dynamic algorithm imports - constructors are lazy loaded on demand */
type AlgorithmConstructor = new (...args: any[]) => BaseLayoutAlgorithm;

/** Layout type categorization for determining optimization behavior */
const PHYSICS_BASED_LAYOUTS = ['force-atlas2', 'force'];
/** Semantic-based layouts that benefit from view-specific optimizations */
// const SEMANTIC_BASED_LAYOUTS = ['dagre', 'hierarchical', 'circular'];

/**
 * Supported layout algorithm identifiers.
 * Each algorithm provides different layout characteristics and performance profiles.
 */
export type LayoutAlgorithmId = 
  /** Hierarchical layout using Dagre algorithm - best for directed graphs */
  | 'dagre' 
  /** Physics-based force-directed layout - good for general graphs */
  | 'force' 
  /** Optimized force-directed layout for large networks */
  | 'force-atlas2' 
  /** Circular arrangement - good for cyclical relationships */
  | 'circular' 
  /** Regular grid pattern - uniform spacing and comparison */
  | 'grid' 
  /** Concentric circles around central node - hierarchical data */
  | 'radial'
  /** No layout applied - preserves existing positions */
  | 'none'
  /** Custom layout - user-defined positioning */
  | 'custom';

export class LayoutOrchestrator {
  /** Cache of instantiated layout algorithm instances */
  private algorithms: Map<string, BaseLayoutAlgorithm>;
  /** Cache of algorithm constructors for lazy loading */
  private algorithmCache: Map<string, AlgorithmConstructor>;
  /** Metadata for all available algorithms without loading them */
  private algorithmMetadata: Map<string, any>;
  /** Currently executing algorithm instance for cancellation support */
  private currentAlgorithm: BaseLayoutAlgorithm | null = null;
  /** Flag to prevent concurrent layout operations */
  private isProcessing = false;
  /** TraversalEngine dependency for graph analysis operations */
  private traversalEngine: TraversalEngine;

  /**
   * Initialize LayoutOrchestrator with required dependencies.
   * 
   * @param traversalEngine - TraversalEngine instance for graph analysis
   * 
   * @remarks
   * Initializes all internal caches and loads algorithm metadata without
   * instantiating any algorithms. This provides fast startup time while
   * maintaining comprehensive algorithm information for UI selection.
   */
  constructor(traversalEngine: TraversalEngine) {
    this.traversalEngine = traversalEngine;
    this.algorithms = new Map();
    this.algorithmCache = new Map();
    this.algorithmMetadata = new Map();
    this.initializeAlgorithmMetadata();
  }

  /**
   * Initialize algorithm metadata without loading the actual algorithms.
   * This allows us to provide available algorithms list without importing heavy libraries.
   * 
   * @remarks
   * Populates algorithmMetadata with comprehensive information about each
   * supported algorithm including capabilities, performance characteristics,
   * and limitations. This metadata is used for:
   * - UI algorithm selection dropdowns
   * - Smart algorithm recommendations
   * - Performance-based filtering
   * - Capability checking without loading algorithms
   * 
   * Complexity: O(1) - Fixed set of algorithm definitions
   */
  private initializeAlgorithmMetadata(): void {
    // Store metadata for each algorithm without instantiating them
    this.algorithmMetadata.set('dagre', {
      id: 'dagre',
      name: 'Dagre',
      description: 'A hierarchical layout using Dagre algorithm. Best for directed acyclic graphs and workflows.',
      category: 'hierarchical',
      capabilities: {
        supportsAsync: false,
        supportsCancellation: false,
        supportsIncremental: false,
        supportsConstraints: true,
        maxNodes: 10000,
        maxEdges: 50000
      },
      performance: {
        timeComplexity: 'O(V + E)',
        spaceComplexity: 'O(V + E)'
      }
    });

    this.algorithmMetadata.set('force', {
      id: 'force',
      name: 'Force-Directed',
      description: 'A physics-based layout using D3-force simulation. Good for general graphs with organic appearance.',
      category: 'force-directed',
      capabilities: {
        supportsAsync: true,
        supportsCancellation: true,
        supportsIncremental: true,
        supportsConstraints: false,
        maxNodes: 5000,
        maxEdges: 25000
      },
      performance: {
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(n)'
      }
    });

    this.algorithmMetadata.set('force-atlas2', {
      id: 'force-atlas2',
      name: 'ForceAtlas2',
      description: 'An optimized force-directed algorithm inspired by Gephi\'s ForceAtlas2. Excellent for large networks.',
      category: 'force-directed',
      capabilities: {
        supportsAsync: true,
        supportsCancellation: true,
        supportsIncremental: true,
        supportsConstraints: false,
        maxNodes: 10000,
        maxEdges: 50000
      },
      performance: {
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(n)'
      }
    });

    this.algorithmMetadata.set('circular', {
      id: 'circular',
      name: 'Circular',
      description: 'Arranges nodes in a circular pattern. Good for showing cyclical relationships.',
      category: 'geometric',
      capabilities: {
        supportsAsync: false,
        supportsCancellation: false,
        supportsIncremental: false,
        supportsConstraints: false,
        maxNodes: 1000,
        maxEdges: 5000
      },
      performance: {
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      }
    });

    this.algorithmMetadata.set('grid', {
      id: 'grid',
      name: 'Grid',
      description: 'Arranges nodes in a regular grid pattern. Good for uniform spacing and comparison.',
      category: 'geometric',
      capabilities: {
        supportsAsync: false,
        supportsCancellation: false,
        supportsIncremental: false,
        supportsConstraints: false,
        maxNodes: 10000,
        maxEdges: 0
      },
      performance: {
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      }
    });

    this.algorithmMetadata.set('radial', {
      id: 'radial',
      name: 'Radial',
      description: 'Arranges nodes in concentric circles around a central node. Good for hierarchical data.',
      category: 'geometric',
      capabilities: {
        supportsAsync: false,
        supportsCancellation: false,
        supportsIncremental: false,
        supportsConstraints: false,
        maxNodes: 2000,
        maxEdges: 10000
      },
      performance: {
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)'
      }
    });
  }

  /**
   * Lazily load and cache algorithm constructor.
   * Downloads and imports algorithm modules on-demand for memory efficiency.
   * 
   * @param algorithmId - ID of the algorithm to load
   * @returns Promise resolving to algorithm constructor or null if not found
   * 
   * @remarks
   * - Uses dynamic imports to load algorithm modules only when needed
   * - Caches constructors to avoid repeated imports
   * - Handles import failures gracefully with null return
   * - Logs successful loads and errors for debugging
   * 
   * @example
   * ```typescript
   * const Constructor = await orchestrator.getAlgorithmConstructor('dagre');
   * if (Constructor) {
   *   const algorithm = new Constructor(traversalEngine);
   * }
   * ```
   * 
   * Complexity: O(1) for cached, O(import) for first load
   */
  private async getAlgorithmConstructor(algorithmId: string): Promise<AlgorithmConstructor | null> {
    // Check if already cached
    if (this.algorithmCache.has(algorithmId)) {
      return this.algorithmCache.get(algorithmId)!;
    }

    try {
      let AlgorithmClass: AlgorithmConstructor;
      
      switch (algorithmId) {
        case 'dagre': {
          const module = await import('../layout/algorithms/DagreLayoutAlgorithm');
          AlgorithmClass = module.DagreLayoutAlgorithm;
          break;
        }
        case 'force': {
          const module = await import('../layout/algorithms/ForceLayoutAlgorithm');
          AlgorithmClass = module.ForceLayoutAlgorithm;
          break;
        }
        case 'force-atlas2': {
          const module = await import('../layout/algorithms/ForceAtlas2Algorithm');
          AlgorithmClass = module.ForceAtlas2Algorithm;
          break;
        }
        case 'circular': {
          const module = await import('../layout/algorithms/CircularLayoutAlgorithm');
          AlgorithmClass = module.CircularLayoutAlgorithm;
          break;
        }
        case 'grid': {
          const module = await import('../layout/algorithms/GridLayoutAlgorithm');
          AlgorithmClass = module.GridLayoutAlgorithm;
          break;
        }
        case 'radial': {
          const module = await import('../layout/algorithms/RadialLayoutAlgorithm');
          AlgorithmClass = module.RadialLayoutAlgorithm;
          break;
        }
        default:
          logger.warn(`Unknown algorithm: ${algorithmId}`);
          return null;
      }

      // Cache the constructor
      this.algorithmCache.set(algorithmId, AlgorithmClass);
      logger.debug(`[LayoutOrchestrator] Lazy loaded algorithm: ${algorithmId}`);
      
      return AlgorithmClass;
    } catch (error) {
      logger.error(`Failed to load algorithm ${algorithmId}:`, undefined, error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Get or create algorithm instance with caching.
   * Manages algorithm lifecycle by reusing instances when possible.
   * 
   * @param algorithmId - ID of the algorithm to get or create
   * @returns Promise resolving to algorithm instance or null if load failed
   * 
   * @remarks
   * - Returns cached instance if already created
   * - Lazy loads constructor and instantiates if not cached
   * - Passes traversalEngine dependency to algorithm constructor
   * - Caches instances for future reuse
   * 
   * @example
   * ```typescript
   * const dagreAlg = await orchestrator.getAlgorithm('dagre');
   * const graph = dagreAlg?.apply(inputGraph);
   * ```
   * 
   * Complexity: O(1) for cached instances, O(construction) for new instances
   */
  private async getAlgorithm(algorithmId: string): Promise<BaseLayoutAlgorithm | null> {
    // Check if already instantiated
    if (this.algorithms.has(algorithmId)) {
      return this.algorithms.get(algorithmId)!;
    }

    // Load constructor and create instance
    const AlgorithmConstructor = await this.getAlgorithmConstructor(algorithmId);
    if (!AlgorithmConstructor) {
      return null;
    }

    const algorithm = new AlgorithmConstructor(this.traversalEngine);
    this.algorithms.set(algorithmId, algorithm);
    
    return algorithm;
  }

  /**
   * Get all available algorithms for UI selection.
   * Uses pre-loaded metadata without instantiating algorithms.
   * 
   * @returns Array of algorithm information objects for UI display
   * 
   * @remarks
   * Provides comprehensive algorithm information for user interfaces:
   * - Algorithm ID for programmatic selection
   * - Human-readable name and description
   * - Category for grouping (hierarchical, force-directed, geometric)
   * - Performance characteristics (time/space complexity)
   * 
   * This method is safe to call frequently as it only accesses cached metadata.
   * 
   * @example
   * ```typescript
   * const algorithms = orchestrator.getAvailableAlgorithms();
   * algorithms.forEach(alg => {
   *   console.log(`${alg.name}: ${alg.description}`);
   *   console.log(`Complexity: ${alg.performance.timeComplexity}`);
   * });
   * ```
   * 
   * Complexity: O(n) where n = number of available algorithms
   */
  getAvailableAlgorithms(): Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    performance: {
      timeComplexity: string;
      spaceComplexity: string;
    };
  }> {
    const result: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      performance: {
        timeComplexity: string;
        spaceComplexity: string;
      };
    }> = [];

    this.algorithmMetadata.forEach(metadata => {
      result.push({
        id: metadata.id,
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        performance: metadata.performance
      });
    });

    return result;
  }

  /**
   * Apply layout to graph based on configuration (synchronous).
   * Uses only pre-loaded algorithms for immediate layout application.
   * 
   * @param graph - Graph data to apply layout to
   * @param config - Optional layout configuration
   * @returns Graph with updated node positions
   * 
   * @remarks
   * - Only works with algorithms that are already loaded/cached
   * - Falls back to dagre if specified algorithm is not loaded
   * - Returns unchanged graph if no suitable algorithm available
   * - Applies view-specific optimizations for semantic layouts
   * - Skips physics-based layout optimizations to preserve natural positioning
   * 
   * For guaranteed algorithm availability, use applyLayoutAsync() instead.
   * 
   * @example
   * ```typescript
   * // Ensure algorithm is pre-loaded first
   * await orchestrator.preloadCommonAlgorithms(['dagre']);
   * const layoutGraph = orchestrator.applyLayout(graph, { layoutType: 'dagre' });
   * ```
   * 
   * Complexity: Depends on selected algorithm (typically O(V + E) to O(V²))
   */
  applyLayout(graph: GraphData, config?: LayoutConfig): GraphData {
    // Handle empty graph
    if (!graph.nodes.length) {
      return graph;
    }

    // Get layout type from config
    const layoutType = config?.layoutType || 'dagre';
    
    // Handle special cases
    if (layoutType === 'none') {
      return graph;
    }

    if (layoutType === 'custom') {
      // Custom layout preserves existing positions
      return graph;
    }

    // Check if algorithm is already loaded
    const algorithm = this.algorithms.get(layoutType);
    if (!algorithm) {
      // Try dagre as fallback if it's loaded
      const fallback = this.algorithms.get('dagre');
      if (!fallback) {
        logger.warn(`Algorithm ${layoutType} not loaded and sync loading not available. Use applyLayoutAsync instead.`);
        return graph; // Return unchanged graph instead of throwing
      }
      logger.warn(`Unknown layout type: ${layoutType}, falling back to dagre`);
      return this.applyLayoutWithAlgorithm(graph, fallback, config, layoutType);
    }

    return this.applyLayoutWithAlgorithm(graph, algorithm, config, layoutType);
  }

  /**
   * Apply layout with a specific algorithm instance.
   * Internal method that handles the actual layout application and optimization.
   * 
   * @param graph - Graph data to apply layout to
   * @param algorithm - Pre-loaded algorithm instance to use
   * @param config - Optional layout configuration
   * @param layoutType - Algorithm type for optimization decisions
   * @returns Graph with updated node positions and optimizations
   * 
   * @remarks
   * - Applies base algorithm layout synchronously
   * - Conditionally applies view-specific optimizations
   * - Skips optimizations for physics-based layouts to preserve natural flow
   * - Logs sample positions for debugging and verification
   * 
   * Complexity: O(algorithm) + O(optimization) where optimization is typically O(V)
   */
  private applyLayoutWithAlgorithm(
    graph: GraphData, 
    algorithm: BaseLayoutAlgorithm, 
    config?: LayoutConfig,
    layoutType?: string
  ): GraphData {
    // Apply the layout synchronously
    let result = algorithm.apply(graph);
    
    // Apply view-specific optimizations only for semantic-based layouts
    const viewType = config?.viewType;
    if (viewType && typeof viewType === 'string' && viewType !== 'none' && this.isValidViewType(viewType)) {
      const actualLayoutType = layoutType || algorithm.getMetadata().id;
      // Skip view-specific optimization for physics-based layouts
      if (!PHYSICS_BASED_LAYOUTS.includes(actualLayoutType)) {
        result = ViewSpecificOptimizer.optimize(result, viewType);
        logger.debug(`[LayoutOrchestrator] Applied view-specific optimizations for ${viewType}`);
      } else {
        logger.debug(`[LayoutOrchestrator] Skipping view-specific optimizations for physics-based layout: ${actualLayoutType}`);
      }
    }
    
    // Debug: Log a sample of positions to verify they're different
    if (result.nodes.length > 0) {
      const sampleNodes = result.nodes.slice(0, 3);
      const actualLayoutType = layoutType || algorithm.getMetadata().id;
      logger.debug(`[LayoutOrchestrator] Applied ${actualLayoutType} layout. Sample positions:`, undefined, sampleNodes.map(n => ({ id: n.id, x: n.position?.x, y: n.position?.y }))
      );
    }
    
    return result;
  }

  /**
   * Pre-load common algorithms to enable synchronous access.
   * Should be called during application initialization for optimal performance.
   * 
   * @param algorithmIds - Array of algorithm IDs to pre-load (default: ['dagre', 'force'])
   * @returns Promise that resolves when all algorithms are loaded
   * 
   * @remarks
   * - Loads specified algorithms in parallel for efficiency
   * - Enables synchronous applyLayout() calls after completion
   * - Logs loading progress and failures for debugging
   * - Gracefully handles individual algorithm load failures
   * - Recommended to call with most frequently used algorithms
   * 
   * @example
   * ```typescript
   * // During app initialization
   * await orchestrator.preloadCommonAlgorithms(['dagre', 'force', 'circular']);
   * 
   * // Later, synchronous layout calls work immediately
   * const graph = orchestrator.applyLayout(data, { layoutType: 'dagre' });
   * ```
   * 
   * Complexity: O(k * load_time) where k = number of algorithms to load
   */
  async preloadCommonAlgorithms(algorithmIds: string[] = ['dagre', 'force']): Promise<void> {
    const loadPromises = algorithmIds.map(async (id) => {
      try {
        await this.getAlgorithm(id);
        logger.debug(`[LayoutOrchestrator] Pre-loaded algorithm: ${id}`);
      } catch (error) {
        logger.error(`Failed to pre-load algorithm ${id}:`, undefined, error instanceof Error ? error : new Error(String(error)));
      }
    });

    await Promise.all(loadPromises);
    logger.debug(`[LayoutOrchestrator] Pre-loading complete`);
  }

  /**
   * Apply layout asynchronously with progress tracking and lazy loading.
   * Main method for layout application with comprehensive progress reporting.
   * 
   * @param graph - Graph data to apply layout to
   * @param config - Optional layout configuration
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to graph with updated node positions
   * 
   * @throws Error if another layout operation is already in progress
   * 
   * @remarks
   * - Supports lazy loading of algorithms on demand
   * - Provides detailed progress reporting through callback
   * - Automatically falls back to dagre on algorithm load failures
   * - Applies view-specific optimizations when appropriate
   * - Prevents concurrent operations with processing flag
   * - Includes comprehensive error handling and recovery
   * 
   * Progress phases: 'loading', 'loaded', 'applying', 'optimizing', 'complete'
   * 
   * @example
   * ```typescript
   * const graph = await orchestrator.applyLayoutAsync(data, 
   *   { layoutType: 'force-atlas2', viewType: 'character-journey' },
   *   (progress) => {
   *     console.log(`${progress.phase}: ${progress.progress}% - ${progress.message}`);
   *   }
   * );
   * ```
   * 
   * Complexity: O(load_time) + O(algorithm) + O(optimization)
   */
  async applyLayoutAsync(
    graph: GraphData,
    config?: LayoutConfig,
    onProgress?: (progress: LayoutProgress) => void
  ): Promise<GraphData> {
    if (this.isProcessing) {
      throw new Error('Layout is already in progress');
    }

    this.isProcessing = true;

    try {
      // Handle empty graph
      if (!graph.nodes.length) {
        return graph;
      }

      // Get layout type from config
      const layoutType = config?.layoutType || 'dagre';
      
      // Handle special cases
      if (layoutType === 'none' || layoutType === 'custom') {
        return graph;
      }

      // Report loading progress
      if (onProgress) {
        onProgress({ 
          phase: 'loading',
          progress: 5, 
          message: `Loading ${layoutType} algorithm...` 
        } as LayoutProgress & { phase: string });
      }

      // Lazily load the appropriate algorithm
      const algorithm = await this.getAlgorithm(layoutType);
      if (!algorithm) {
        logger.warn(`Unknown layout type: ${layoutType}, falling back to dagre`);
        
        if (onProgress) {
          onProgress({ 
            phase: 'loading',
            progress: 10, 
            message: 'Loading fallback dagre algorithm...' 
          } as LayoutProgress & { phase: string });
        }
        
        const fallback = await this.getAlgorithm('dagre');
        if (!fallback) {
          throw new Error('Failed to load fallback dagre algorithm');
        }
        this.currentAlgorithm = fallback;
        return await fallback.applyAsync(graph, onProgress);
      }

      this.currentAlgorithm = algorithm;
      
      // Report algorithm loaded
      if (onProgress) {
        onProgress({ 
          phase: 'loaded',
          progress: 15, 
          message: `${layoutType} algorithm loaded` 
        } as LayoutProgress & { phase: string });
      }
      
      // Apply the layout asynchronously
      let result = await algorithm.applyAsync(graph, onProgress);
      
      // Apply view-specific optimizations if view type is provided
      const viewType = config?.viewType;
      if (viewType && typeof viewType === 'string' && viewType !== 'none' && this.isValidViewType(viewType)) {
        // Skip view-specific optimization for physics-based layouts
        if (!PHYSICS_BASED_LAYOUTS.includes(layoutType)) {
          result = ViewSpecificOptimizer.optimize(result, viewType);
          logger.debug(`[LayoutOrchestrator] Applied view-specific optimizations for ${viewType}`);
        } else {
          logger.debug(`[LayoutOrchestrator] Skipping view-specific optimizations for physics-based layout: ${layoutType}`);
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Layout application failed:', undefined, error instanceof Error ? error : new Error(String(error)));
      
      // Try to apply fallback dagre layout
      try {
        if (onProgress) {
          onProgress({ 
            phase: 'fallback',
            progress: 10, 
            message: 'Applying fallback layout...' 
          } as LayoutProgress & { phase: string });
        }
        
        const fallback = await this.getAlgorithm('dagre');
        if (fallback) {
          this.currentAlgorithm = fallback;
          return await fallback.applyAsync(graph, onProgress);
        }
      } catch (fallbackError) {
        logger.error('Fallback layout also failed:', undefined, fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)));
      }
      
      throw error;
    } finally {
      this.isProcessing = false;
      this.currentAlgorithm = null;
    }
  }

  /**
   * Cancel ongoing layout operation.
   * Stops any currently executing algorithm and cleans up state.
   * 
   * @returns Promise that resolves when cancellation is complete
   * 
   * @remarks
   * - Calls cancel() on the currently executing algorithm if it supports cancellation
   * - Resets processing flags and current algorithm reference
   * - Safe to call even if no operation is in progress
   * - Particularly useful for long-running physics-based algorithms
   * 
   * @example
   * ```typescript
   * // Start long-running layout
   * const layoutPromise = orchestrator.applyLayoutAsync(largeGraph, 
   *   { layoutType: 'force-atlas2' });
   * 
   * // Cancel if user navigates away
   * await orchestrator.cancelLayout();
   * ```
   * 
   * Complexity: O(1) + O(algorithm_cleanup)
   */
  async cancelLayout(): Promise<void> {
    if (this.currentAlgorithm) {
      this.currentAlgorithm.cancel();
      this.currentAlgorithm = null;
    }
    this.isProcessing = false;
  }

  /**
   * Check if a string is a valid ViewType.
   * Type guard function for runtime ViewType validation.
   * 
   * @param viewType - String to validate as ViewType
   * @returns True if the string is a valid ViewType
   * 
   * @remarks
   * Validates against the complete list of supported view types.
   * Used internally to ensure type safety when processing user input.
   * 
   * Complexity: O(1) - Array includes lookup
   */
  private isValidViewType(viewType: string): viewType is ViewType {
    return ['puzzle-focus', 'character-journey', 'content-status', 'node-connections', 'timeline', 'full-network'].includes(viewType);
  }

  /**
   * Get optimal layout for view type based on graph characteristics.
   * Provides intelligent algorithm selection based on view requirements and graph properties.
   * 
   * @param viewType - Type of view being displayed
   * @param nodeCount - Number of nodes in the graph
   * @param edgeCount - Number of edges in the graph
   * @returns Recommended algorithm ID for the given parameters
   * 
   * @remarks
   * Selection logic:
   * - character-journey: Force layouts for organic feel, atlas2 for dense graphs
   * - timeline: Always dagre for chronological ordering
   * - Default: dagre for reliable hierarchical layout
   * 
   * Edge density calculation influences force algorithm selection.
   * 
   * @example
   * ```typescript
   * const optimal = orchestrator.getOptimalLayoutForView(
   *   'character-journey', 150, 300
   * );
   * // Returns 'force-atlas2' for dense character network
   * ```
   * 
   * Complexity: O(1) - Simple conditional logic
   */
  getOptimalLayoutForView(viewType: ViewType, nodeCount: number, edgeCount: number): string {
    // Smart algorithm selection based on view and graph characteristics
    const edgeDensity = nodeCount > 0 ? edgeCount / nodeCount : 0;

    switch (viewType) {
      // Removed puzzle-chain case - not in ViewType
        
      case 'character-journey':
        // Character journeys benefit from force-directed for organic feel
        return edgeDensity > 2 ? 'force-atlas2' : 'force';
        
      case 'timeline':
        // Timeline view should use hierarchical
        return 'dagre';
        
      // Removed overview case - not in ViewType
        
      default:
        return 'dagre';
    }
  }

  /**
   * Check if layout supports async processing.
   * Uses cached metadata to avoid loading the algorithm.
   * 
   * @param layoutType - Algorithm type to check
   * @returns True if the algorithm supports asynchronous processing
   * 
   * @remarks
   * - Queries algorithm capabilities without instantiation
   * - Returns false for unknown algorithms
   * - Used to determine whether progress tracking is available
   * - Physics-based algorithms typically support async processing
   * 
   * @example
   * ```typescript
   * if (orchestrator.supportsAsync('force-atlas2')) {
   *   // Can provide progress updates
   *   await orchestrator.applyLayoutAsync(graph, config, onProgress);
   * } else {
   *   // Synchronous only
   *   const result = orchestrator.applyLayout(graph, config);
   * }
   * ```
   * 
   * Complexity: O(1) - Map lookup
   */
  supportsAsync(layoutType: string): boolean {
    const metadata = this.algorithmMetadata.get(layoutType);
    return metadata ? metadata.capabilities.supportsAsync : false;
  }

  /**
   * Update algorithm configuration dynamically.
   * This will load the algorithm if not already loaded.
   * 
   * @param algorithmId - ID of the algorithm to configure
   * @param config - New configuration object to apply
   * @returns Promise that resolves when configuration is applied
   * 
   * @remarks
   * - Lazy loads algorithm if not already instantiated
   * - Passes configuration directly to algorithm instance
   * - Configuration format depends on specific algorithm
   * - Used for runtime algorithm tuning and optimization
   * 
   * @example
   * ```typescript
   * await orchestrator.updateAlgorithmConfig('force', {
   *   strength: -300,
   *   iterations: 500,
   *   alphaDecay: 0.02
   * });
   * ```
   * 
   * Complexity: O(1) for loaded algorithms, O(load_time) for new algorithms
   */
  async updateAlgorithmConfig(algorithmId: string, config: any): Promise<void> {
    const algorithm = await this.getAlgorithm(algorithmId);
    if (algorithm) {
      algorithm.updateConfig(config);
    }
  }

  /**
   * Get algorithm metadata without loading the algorithm.
   * Provides comprehensive algorithm information from cached metadata.
   * 
   * @param algorithmId - ID of the algorithm to get metadata for
   * @returns Algorithm metadata object or null if not found
   * 
   * @remarks
   * Returns detailed algorithm information including:
   * - Capabilities (async support, cancellation, constraints)
   * - Performance characteristics (complexity, limits)
   * - Category and descriptive information
   * 
   * Safe to call frequently as it only accesses cached data.
   * 
   * @example
   * ```typescript
   * const metadata = orchestrator.getAlgorithmMetadata('force-atlas2');
   * if (metadata) {
   *   console.log(`Max nodes: ${metadata.capabilities.maxNodes}`);
   *   console.log(`Complexity: ${metadata.performance.timeComplexity}`);
   * }
   * ```
   * 
   * Complexity: O(1) - Map lookup
   */
  getAlgorithmMetadata(algorithmId: string) {
    return this.algorithmMetadata.get(algorithmId) || null;
  }

  /**
   * Get layout configuration for a specific view.
   * Backward compatibility method for legacy API support.
   * 
   * @param viewType - View type to get configuration for
   * @returns Layout configuration object with recommended settings
   * 
   * @remarks
   * - Provides backward compatibility with older API versions
   * - Uses optimal algorithm selection internally
   * - Returns sensible defaults for spacing and direction
   * - Maps modern algorithm IDs to legacy naming conventions
   * 
   * @deprecated Consider using getOptimalLayoutForView() for new code
   * 
   * @example
   * ```typescript
   * const config = orchestrator.getLayoutForView('character-journey');
   * const graph = orchestrator.applyLayout(data, config);
   * ```
   * 
   * Complexity: O(1) - Simple configuration generation
   */
  getLayoutForView(viewType: ViewType): LayoutConfig {
    const layoutType = this.getOptimalLayoutForView(viewType, 50, 100);
    return {
      layoutType: layoutType as any,
      algorithm: layoutType === 'dagre' ? 'pure-dagre' : layoutType as any,
      direction: 'LR',
      spacing: {
        nodeSpacing: 100,
        rankSpacing: 300
      }
    };
  }

  /**
   * Apply Dagre layout - backward compatibility method.
   * Convenience method that forces dagre algorithm usage.
   * 
   * @param graph - Graph data to apply layout to
   * @param config - Optional layout configuration
   * @returns Graph with dagre layout applied
   * 
   * @remarks
   * Simple wrapper around applyLayout() with layoutType forced to 'dagre'.
   * Maintained for backward compatibility with legacy code.
   * 
   * @deprecated Use applyLayout(graph, { ...config, layoutType: 'dagre' }) instead
   * 
   * Complexity: Same as applyLayout() - typically O(V + E)
   */
  applyDagreLayout(graph: GraphData, config?: LayoutConfig): GraphData {
    return this.applyLayout(graph, { ...config, layoutType: 'dagre' });
  }

  /**
   * Apply Pure Dagre layout - backward compatibility method.
   * Alias for dagre layout application.
   * 
   * @param graph - Graph data to apply layout to
   * @param config - Optional layout configuration
   * @returns Graph with dagre layout applied
   * 
   * @remarks
   * Legacy alias for dagre layout - functionally identical to applyDagreLayout().
   * The "pure" designation refers to using vanilla Dagre without modifications.
   * 
   * @deprecated Use applyLayout(graph, { ...config, layoutType: 'dagre' }) instead
   * 
   * Complexity: Same as applyLayout() - typically O(V + E)
   */
  applyPureDagreLayout(graph: GraphData, config?: LayoutConfig): GraphData {
    return this.applyLayout(graph, { ...config, layoutType: 'dagre' });
  }

  /**
   * Cancel force layout - backward compatibility method.
   * Legacy method for canceling any ongoing layout operation.
   * 
   * @returns Promise that resolves when cancellation is complete
   * 
   * @remarks
   * Originally specific to force layouts but now cancels any active algorithm.
   * Maintained for backward compatibility with existing code.
   * 
   * @deprecated Use cancelLayout() instead for clearer intent
   * 
   * Complexity: Same as cancelLayout() - O(1) + O(algorithm_cleanup)
   */
  async cancelForceLayout(): Promise<void> {
    return this.cancelLayout();
  }
}

// Export singleton instance
// Singleton removed - use dependency injection via GraphContext instead
// This promotes better testability and eliminates global state dependencies