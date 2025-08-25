/**
 * Professional layout algorithm registry and smart selection system for ALNRetool.
 * 
 * Provides centralized management of layout algorithms with intelligent selection
 * based on graph characteristics, view types, and performance requirements.
 * Follows singleton pattern with lazy loading for optimal memory usage.
 * 
 * Key features:
 * - Lazy-loading layout algorithm registry with metadata
 * - Intelligent algorithm selection based on graph properties
 * - View-specific default algorithm mapping
 * - Performance vs quality trade-off optimization
 * - Hierarchy and clustering detection for algorithm matching
 * - Comprehensive performance statistics tracking
 * 
 * @example
 * ```typescript
 * // Get optimal algorithm for character network
 * const registry = LayoutAlgorithmRegistry.getInstance();
 * const algorithm = registry.getOptimal(
 *   characterNodes, 
 *   relationshipEdges, 
 *   'character-journey',
 *   true // prefer async for large networks
 * );
 * 
 * // Apply selected algorithm
 * const layoutNodes = await algorithm.apply(nodes, edges, options);
 * ```
 * 
 * @author ALNRetool Development Team
 * @since 1.0.0
 */


import type { GraphNode, GraphEdge, ViewType } from '../types';
import { logger } from '../utils/Logger'


/** Performance classification for layout algorithms */
export type LayoutPerformance = 'fast' | 'medium' | 'slow';

/** Quality classification for layout algorithms */
export type LayoutQuality = 'low' | 'medium' | 'high' | 'best';

/**
 * Metadata interface for layout algorithm registration and selection.
 * 
 * Contains comprehensive algorithm characteristics used for intelligent
 * selection based on graph properties and performance requirements.
 * 
 * @interface LayoutAlgorithmMetadata
 */
export interface LayoutAlgorithmMetadata {
  /** Human-readable algorithm name */
  name: string;
  
  /** Detailed algorithm description and use cases */
  description: string;
  
  /** Performance classification (fast/medium/slow) */
  performance: LayoutPerformance;
  
  /** Layout quality classification (low/medium/high/best) */
  quality: LayoutQuality;
  
  /** Array of view types this algorithm works best for */
  bestFor: string[];
  
  /** Maximum recommended nodes for good performance */
  maxNodes?: number;
  
  /** Whether algorithm handles node clustering effectively */
  supportsClustering?: boolean;
  
  /** Whether algorithm supports hierarchical/DAG structures */
  supportsHierarchy?: boolean;
  
  /** Whether algorithm supports asynchronous execution */
  supportsAsync?: boolean;
  
  /** Algorithm category for classification and filtering */
  category: 'hierarchical' | 'force' | 'radial' | 'grid' | 'custom';
}

/**
 * Complete layout algorithm interface with metadata and execution methods.
 * 
 * Extends LayoutAlgorithmMetadata with actual algorithm execution and
 * capability detection methods for full algorithm implementation.
 * 
 * @interface LayoutAlgorithm
 * @extends LayoutAlgorithmMetadata
 */
export interface LayoutAlgorithm extends LayoutAlgorithmMetadata {
  /** 
   * Apply layout algorithm to nodes and edges
   * @param nodes Array of graph nodes to position
   * @param edges Array of graph edges for relationship info
   * @param options Optional algorithm-specific configuration
   * @returns Positioned nodes or Promise for async algorithms
   */
  apply: (nodes: GraphNode[], edges: GraphEdge[], options?: any) => GraphNode[] | Promise<GraphNode[]>;
  
  /** 
   * Check if algorithm supports given graph characteristics
   * @param nodeCount Number of nodes in graph
   * @param edgeCount Number of edges in graph
   * @param viewType Specific view type for algorithm matching
   * @returns True if algorithm can handle the graph
   */
  supports: (nodeCount: number, edgeCount: number, viewType: ViewType) => boolean;
  
  /** 
   * Get default options optimized for graph size
   * @param nodeCount Number of nodes for option optimization
   * @param edgeCount Number of edges for option optimization
   * @returns Algorithm-specific default options
   */
  getDefaultOptions?: (nodeCount: number, edgeCount: number) => any;
}

/**
 * Centralized registry for layout algorithms with intelligent selection.
 * 
 * Implements singleton pattern for global algorithm management with lazy loading,
 * smart algorithm selection based on graph characteristics, and performance
 * optimization for murder mystery investigation workflows.
 * 
 * Algorithm selection factors:
 * - Graph size and edge density
 * - View type requirements (puzzle-focus, character-journey, etc.)
 * - Performance vs quality trade-offs
 * - Hierarchy and clustering detection
 * - Asynchronous execution preferences
 * 
 * @class LayoutAlgorithmRegistry
 * @singleton
 * 
 * @example
 * ```typescript
 * // Get registry instance
 * const registry = LayoutAlgorithmRegistry.getInstance();
 * 
 * // Register custom algorithm
 * registry.register(customMysteryAlgorithm);
 * 
 * // Get optimal algorithm for investigation network
 * const algorithm = registry.getOptimal(
 *   characters, connections, 'character-journey', true
 * );
 * ```
 */
export class LayoutAlgorithmRegistry {
  /** Singleton instance for global registry access */
  private static instance: LayoutAlgorithmRegistry;
  
  /** Map of algorithm names to algorithm implementations */
  private algorithms: Map<string, LayoutAlgorithm>;
  
  /** Map of view types to their default algorithm names */
  private viewDefaults: Map<ViewType, string>;

  /**
   * Private constructor for singleton pattern implementation.
   * 
   * Initializes algorithm storage and view-specific defaults for
   * murder mystery investigation workflows.
   */
  private constructor() {
    this.algorithms = new Map();
    this.viewDefaults = new Map();
    this.initializeDefaults();
  }

  /**
   * Get singleton registry instance with lazy initialization.
   * 
   * Creates registry instance on first access for optimal memory usage
   * and global algorithm management across the application.
   * 
   * @returns Singleton LayoutAlgorithmRegistry instance
   * 
   * @example
   * ```typescript
   * const registry = LayoutAlgorithmRegistry.getInstance();
   * const dagreAlgo = registry.getByName('dagre');
   * ```
   */
  static getInstance(): LayoutAlgorithmRegistry {
    if (!LayoutAlgorithmRegistry.instance) {
      LayoutAlgorithmRegistry.instance = new LayoutAlgorithmRegistry();
    }
    return LayoutAlgorithmRegistry.instance;
  }

  /**
   * Register a new layout algorithm in the global registry.
   * 
   * Adds algorithm to the available algorithms pool for intelligent selection
   * and direct access by name. Includes debug logging for registration tracking.
   * 
   * @param algorithm Complete layout algorithm implementation with metadata
   * 
   * @example
   * ```typescript
   * registry.register({
   *   name: 'mystery-circular',
   *   description: 'Circular layout for suspect relationships',
   *   performance: 'fast',
   *   quality: 'high',
   *   bestFor: ['character-journey'],
   *   category: 'radial',
   *   apply: (nodes, edges) => circularLayout(nodes, edges)
   * });
   * ```
   */
  register(algorithm: LayoutAlgorithm): void {
    logger.debug(`📊 Registering layout algorithm: ${algorithm.name}`);
    this.algorithms.set(algorithm.name, algorithm);
  }

  /**
   * Get registered algorithm by exact name match.
   * 
   * Retrieves specific algorithm implementation from the registry
   * for direct usage when algorithm choice is predetermined.
   * 
   * @param name Exact algorithm name as registered
   * @returns Algorithm implementation or undefined if not found
   * 
   * @example
   * ```typescript
   * const dagreAlgo = registry.getByName('dagre');
   * if (dagreAlgo) {
   *   const positioned = dagreAlgo.apply(nodes, edges);
   * }
   * ```
   */
  getByName(name: string): LayoutAlgorithm | undefined {
    return this.algorithms.get(name);
  }

  /**
   * Get all registered algorithms as an array.
   * 
   * Returns complete list of available algorithms for UI selection,
   * filtering, or batch operations across all registered algorithms.
   * 
   * @returns Array of all registered layout algorithms
   * 
   * @example
   * ```typescript
   * const allAlgorithms = registry.getAll();
   * const fastAlgos = allAlgorithms.filter(a => a.performance === 'fast');
   * ```
   */
  getAll(): LayoutAlgorithm[] {
    return Array.from(this.algorithms.values());
  }

  /**
   * Get all algorithms matching specified category.
   * 
   * Filters registered algorithms by category for targeted algorithm
   * selection based on layout approach (force, hierarchical, etc.).
   * 
   * @param category Algorithm category to filter by
   * @returns Array of algorithms in the specified category
   * 
   * @example
   * ```typescript
   * const forceAlgorithms = registry.getByCategory('force');
   * const hierarchical = registry.getByCategory('hierarchical');
   * ```
   */
  getByCategory(category: string): LayoutAlgorithm[] {
    return this.getAll().filter(algo => algo.category === category);
  }

  /**
   * Get optimal algorithm using intelligent selection based on graph characteristics.
   * 
   * Implements sophisticated algorithm selection using multiple factors:
   * - Graph size and edge density analysis
   * - View type requirements and best practices
   * - Performance vs quality trade-offs
   * - Hierarchy and clustering detection
   * - Asynchronous execution preferences
   * 
   * Selection scoring system:
   * - View type match: +10 points
   * - Performance/quality balance based on graph size
   * - Hierarchy support for DAG structures: +5 points
   * - Dense graph optimization: +3 points
   * - Clustering support: +3 points
   * 
   * @param nodes Array of graph nodes for analysis
   * @param edges Array of graph edges for density calculation
   * @param viewType Specific view type for optimal algorithm matching
   * @param preferAsync Whether to prefer asynchronous algorithms
   * @returns Optimal algorithm or undefined if none suitable
   * 
   * @example
   * ```typescript
   * // Get optimal algorithm for large character network
   * const algorithm = registry.getOptimal(
   *   characters,           // 150+ character nodes
   *   relationships,        // Dense relationship network
   *   'character-journey',  // Investigation view type
   *   true                 // Prefer async for responsiveness
   * );
   * ```
   */
  getOptimal(
    nodes: GraphNode[], 
    edges: GraphEdge[], 
    viewType: ViewType,
    preferAsync: boolean = false
  ): LayoutAlgorithm | undefined {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    const edgeDensity = edgeCount / (nodeCount * (nodeCount - 1) / 2);

    // Filter algorithms that support this graph
    const candidates = this.getAll().filter(algo => 
      algo.supports(nodeCount, edgeCount, viewType) &&
      (!algo.maxNodes || nodeCount <= algo.maxNodes) &&
      (!preferAsync || algo.supportsAsync)
    );

    if (candidates.length === 0) {
      // Fall back to default for view
      const defaultName = this.viewDefaults.get(viewType);
      return defaultName ? this.getByName(defaultName) : undefined;
    }

    // Score algorithms based on suitability
    const scored = candidates.map(algo => {
      let score = 0;

      // View type match
      if (algo.bestFor.includes(viewType)) {
        score += 10;
      }

      // Performance vs quality trade-off based on graph size
      if (nodeCount < 50) {
        // Small graphs: prioritize quality
        score += algo.quality === 'best' ? 5 : 
                 algo.quality === 'high' ? 3 : 
                 algo.quality === 'medium' ? 1 : 0;
      } else if (nodeCount < 150) {
        // Medium graphs: balance
        score += algo.performance === 'fast' ? 2 : 
                 algo.performance === 'medium' ? 3 : 0;
        score += algo.quality === 'high' ? 2 : 
                 algo.quality === 'medium' ? 3 : 0;
      } else {
        // Large graphs: prioritize performance
        score += algo.performance === 'fast' ? 5 : 
                 algo.performance === 'medium' ? 2 : 0;
      }

      // Hierarchy detection for DAG-like structures
      if (this.hasHierarchy(nodes, edges) && algo.supportsHierarchy) {
        score += 5;
      }

      // Dense graphs benefit from force layouts
      if (edgeDensity > 0.3 && algo.category === 'force') {
        score += 3;
      }

      // Clustering detection
      if (this.hasClusters(nodes) && algo.supportsClustering) {
        score += 3;
      }

      return { algo, score };
    });

    // Sort by score and return best
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.algo;
  }

  /**
   * Set default algorithm for specific view type.
   * 
   * Configures view-specific algorithm defaults for fallback selection
   * when optimal algorithm selection fails or no suitable algorithm found.
   * 
   * @param viewType View type to configure default for
   * @param algorithmName Name of algorithm to use as default
   * 
   * @example
   * ```typescript
   * // Set force algorithm as default for character journeys
   * registry.setViewDefault('character-journey', 'force-atlas2');
   * ```
   */
  setViewDefault(viewType: ViewType, algorithmName: string): void {
    this.viewDefaults.set(viewType, algorithmName);
  }

  /**
   * Get default algorithm name for specific view type.
   * 
   * Retrieves configured default algorithm name for view type,
   * used as fallback when optimal selection cannot find suitable algorithm.
   * 
   * @param viewType View type to get default algorithm for
   * @returns Default algorithm name or undefined if not configured
   * 
   * @example
   * ```typescript
   * const defaultAlgo = registry.getViewDefault('puzzle-focus');
   * // Returns: 'dagre' (hierarchical default)
   * ```
   */
  getViewDefault(viewType: ViewType): string | undefined {
    return this.viewDefaults.get(viewType);
  }

  /**
   * Initialize default view-to-algorithm mappings for murder mystery workflows.
   * 
   * Sets up optimized algorithm defaults for each investigation view type
   * based on best practices for murder mystery visualization and analysis.
   * 
   * Default mappings:
   * - puzzle-focus: dagre (hierarchical puzzle dependencies)
   * - character-journey: force (character relationship networks)
   * - node-connections: radial (focused connection analysis)
   * - content-status: grid (systematic content organization)
   */
  private initializeDefaults(): void {
    this.viewDefaults.set('puzzle-focus', 'dagre');
    this.viewDefaults.set('character-journey', 'force');
    this.viewDefaults.set('node-connections', 'radial');
    this.viewDefaults.set('content-status', 'grid');
  }

  /**
   * Detect hierarchical structure in graph for algorithm selection.
   * 
   * Analyzes edge types to identify DAG-like structures that benefit
   * from hierarchical layout algorithms like Dagre.
   * 
   * @param _nodes Graph nodes (unused in current implementation)
   * @param edges Graph edges to analyze for hierarchy indicators
   * @returns True if hierarchical structure detected
   * 
   * @example
   * ```typescript
   * // Detects puzzle dependency chains
   * const hasHierarchy = registry.hasHierarchy(nodes, puzzleEdges);
   * // Returns true for dependency/requirement edge types
   * ```
   */
  private hasHierarchy(_nodes: GraphNode[], edges: GraphEdge[]): boolean {
    // Simple check: look for dependency edges
    return edges.some(e => e.type === 'dependency' || e.type === 'requirement');
  }

  /**
   * Detect natural clustering in nodes for algorithm selection.
   * 
   * Analyzes node metadata to identify clustering information that
   * benefits from clustering-aware layout algorithms.
   * 
   * @param nodes Graph nodes to analyze for clustering indicators
   * @returns True if clustering structure detected
   * 
   * @example
   * ```typescript
   * // Detects investigation clusters or character tiers
   * const hasClusters = registry.hasClusters(characterNodes);
   * // Returns true if nodes have tier or cluster metadata
   * ```
   */
  private hasClusters(nodes: GraphNode[]): boolean {
    // Check if nodes have tier or cluster metadata
    return nodes.some(n => n.data?.metadata?.tier || n.data?.cluster);
  }

  /**
   * Get performance statistics for registered algorithms.
   * 
   * Returns usage metrics for algorithm performance monitoring
   * and optimization. Currently placeholder for future metrics collection.
   * 
   * @returns Performance statistics map with algorithm names as keys
   * 
   * @example
   * ```typescript
   * const stats = registry.getPerformanceStats();
   * console.log(stats['dagre']?.avgTime); // Average execution time
   * ```
   */
  getPerformanceStats(): Record<string, { avgTime: number; count: number }> {
    // This would be populated by actual usage metrics
    // For now, return empty
    return {};
  }

  /**
   * Clear all registered algorithms and reset to defaults.
   * 
   * Removes all registered algorithms and reinitializes view defaults.
   * Primarily used for testing and development scenarios.
   * 
   * @example
   * ```typescript
   * // Clear registry for testing
   * registry.clear();
   * console.log(registry.getAll().length); // 0
   * ```
   */
  clear(): void {
    this.algorithms.clear();
    this.initializeDefaults();
  }
}

// Export singleton instance
export const layoutAlgorithmRegistry = LayoutAlgorithmRegistry.getInstance();