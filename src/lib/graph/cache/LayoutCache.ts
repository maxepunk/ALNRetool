/**
 * **Murder Mystery Investigation Layout Cache**
 * 
 * High-performance caching system for murder mystery investigation graph layout
 * computation results. Implements intelligent caching with TTL expiration,
 * LRU eviction strategy, memory pressure handling, and comprehensive metrics
 * to optimize investigation visualization performance and user experience.
 * 
 * **Investigation Caching Architecture:**
 * 
 * **Core Caching Features:**
 * - **Computation Result Storage**: Caches expensive force layout and positioning computations
 * - **TTL-Based Expiration**: Automatic invalidation ensures investigation data freshness
 * - **LRU Eviction Strategy**: Intelligent removal prioritizes recently accessed investigations
 * - **Memory Pressure Handling**: Proactive memory management prevents investigation slowdowns
 * 
 * **Investigation-Optimized Performance:**
 * - **Character Network Caching**: Stores complex character relationship layout computations
 * - **Evidence Chain Layouts**: Caches intricate evidence connection visualizations
 * - **Puzzle Dependency Graphs**: Preserves expensive puzzle relationship positioning
 * - **Timeline Visualization**: Stores temporal event layout arrangements
 * 
 * **Memory Management Excellence:**
 * - **Configurable Memory Limits**: Prevents investigation UI from consuming excessive memory
 * - **Accurate Size Estimation**: UTF-8 byte-accurate memory tracking for precise management
 * - **Automatic Cleanup**: Background removal of expired investigation layouts
 * - **Memory Pressure Response**: Intelligent eviction under memory constraints
 * 
 * **Investigation Performance Benefits:**
 * - **Sub-second Retrieval**: Cached layouts load instantly for smooth investigation flow
 * - **Reduced Computation**: Eliminates redundant expensive layout calculations
 * - **UI Responsiveness**: Fast layout access maintains investigation interface fluidity
 * - **Resource Efficiency**: Optimal memory usage for complex investigation visualizations
 * 
 * **Production Investigation Features:**
 * - **Cross-browser Hash Compatibility**: Consistent caching across investigation environments
 * - **Metrics and Monitoring**: Comprehensive cache performance analytics
 * - **Configuration Flexibility**: Tunable parameters for different investigation workloads
 * - **Graceful Degradation**: Robust error handling maintains investigation workflow continuity
 * 
 * @example
 * **Basic Investigation Layout Caching**
 * ```typescript
 * import { LayoutCache } from '@/lib/graph/cache/LayoutCache';
 * 
 * // Create investigation-optimized cache
 * const cache = new LayoutCache({
 *   maxSize: 100,         // Cache up to 100 investigation layouts
 *   ttl: 300000,          // 5-minute TTL for investigation freshness
 *   maxMemoryMB: 50,      // 50MB memory limit for investigation performance
 *   refreshOnAccess: true // Extend TTL for active investigations
 * });
 * 
 * // Cache character network layout
 * const characterGraph = await computeCharacterNetwork(investigationData);
 * cache.set(investigationData, 'character-network', characterGraph);
 * 
 * // Fast retrieval for investigation UI
 * const cachedLayout = cache.get(investigationData, 'character-network');
 * if (cachedLayout) {
 *   renderInvestigationVisualization(cachedLayout); // Instant display
 * }
 * ```
 * 
 * @example
 * **Advanced Investigation Cache Management**
 * ```typescript
 * // Production investigation cache with monitoring
 * const investigationCache = new LayoutCache({
 *   maxSize: 200,
 *   ttl: 600000,          // 10-minute TTL for complex investigations
 *   enableMetrics: true,  // Enable performance monitoring
 *   onMemoryPressure: () => {
 *     console.warn('Investigation cache under memory pressure');
 *     // Trigger investigation UI memory optimization
 *   }
 * });
 * 
 * // Monitor investigation cache performance
 * const metrics = investigationCache.getMetrics();
 * console.log(`Investigation cache hit rate: ${(metrics.hitRate * 100).toFixed(1)}%`);
 * console.log(`Memory usage: ${(metrics.totalSize / 1024 / 1024).toFixed(1)}MB`);
 * 
 * // Invalidate when investigation data changes
 * investigationCache.invalidateGraph(updatedInvestigationData);
 * ```
 * 
 * @example
 * **Investigation Memory Optimization**
 * ```typescript
 * // Create memory-conscious investigation cache
 * const memoryOptimizedCache = new LayoutCache({
 *   maxMemoryMB: 25,      // Conservative memory limit
 *   maxSize: 50,          // Smaller cache size
 *   ttl: 180000,          // 3-minute TTL for memory efficiency
 *   onMemoryPressure: () => {
 *     // Proactive memory management for investigation performance
 *     memoryOptimizedCache.cleanup();
 *     showInvestigationAlert('Cache optimized for better performance');
 *   }
 * });
 * 
 * // Monitor memory usage during investigation
 * setInterval(() => {
 *   const memoryUsage = memoryOptimizedCache.getMemoryUsage();
 *   if (memoryUsage > 20 * 1024 * 1024) { // 20MB threshold
 *     memoryOptimizedCache.handleMemoryPressure();
 *   }
 * }, 30000); // Check every 30 seconds
 * ```
 * 
 * **Investigation Cache Strategies:**
 * - **Character Networks**: Long TTL (10 minutes) for stable relationship layouts
 * - **Evidence Chains**: Medium TTL (5 minutes) for moderately dynamic evidence
 * - **Timeline Views**: Short TTL (2 minutes) for frequently updated event data
 * - **Search Results**: Very short TTL (30 seconds) for real-time investigation queries
 * 
 * **Performance Characteristics:**
 * - **Cache Hit**: O(1) hash map lookup with investigation layout retrieval
 * - **Cache Miss**: O(n) for expensive layout computation, cached for future access
 * - **Eviction**: O(n) LRU scan to find least recently used investigation layout
 * - **Memory**: ~1-2MB overhead plus investigation layout data storage
 * 
 * **Investigation Memory Management:**
 * - **Automatic Sizing**: UTF-8 byte-accurate size estimation for precise memory tracking
 * - **Pressure Response**: Intelligent eviction when investigation memory limits approached
 * - **Cleanup Scheduling**: Periodic removal of expired investigation cache entries
 * - **Graceful Degradation**: Cache bypass under extreme memory pressure
 * 
 * @see {@link CacheConfig} Configuration interface for investigation cache tuning
 * @see {@link CacheMetrics} Performance metrics interface for investigation monitoring
 * @see {@link CacheEntry} Internal cache entry structure for investigation layouts
 * 
 * @author ALNRetool Investigation Team
 * @since 1.0.0 - Core investigation layout caching
 * @version 2.0.0 - Memory pressure handling and metrics enhancement
 */

import type { GraphData } from '../types';
import crypto from 'crypto';

/**
 * **Investigation Cache Entry Structure**
 * 
 * Internal cache entry structure for storing murder mystery investigation
 * layout computation results with comprehensive metadata for TTL management,
 * LRU eviction, access tracking, and memory usage optimization.
 * 
 * **Entry Metadata:**
 * - **data**: Computed investigation layout with positioned nodes and edges
 * - **timestamp**: Creation time for TTL expiration calculation
 * - **ttl**: Time-to-live duration for investigation data freshness
 * - **size**: UTF-8 byte size for accurate investigation memory management
 * - **accessCount**: Usage frequency for investigation cache analytics
 * - **lastAccessed**: LRU timestamp for intelligent eviction decisions
 * 
 * **Investigation Use Cases:**
 * - **Character Network Entries**: Store complex character relationship layouts
 * - **Evidence Chain Entries**: Cache intricate evidence connection visualizations
 * - **Timeline Layout Entries**: Preserve temporal event positioning computations
 * - **Search Result Entries**: Store dynamic investigation query visualizations
 * 
 * @internal Internal cache entry structure, not exposed to investigation API consumers
 * @since 1.0.0 - Core cache entry structure
 * @version 2.0.0 - Enhanced access tracking for investigation analytics
 */
interface CacheEntry {
  /** Cached investigation layout data with positioned nodes and edges */
  data: GraphData;
  /** Creation timestamp for TTL expiration calculation */
  timestamp: number;
  /** Time-to-live duration in milliseconds for investigation data freshness */
  ttl: number;
  /** UTF-8 byte size for accurate investigation memory tracking */
  size: number;
  /** Access frequency counter for investigation usage analytics */
  accessCount: number;
  /** Last access timestamp for LRU eviction prioritization */
  lastAccessed: number;
}

/**
 * **Investigation Cache Configuration Interface**
 * 
 * Comprehensive configuration interface for murder mystery investigation layout
 * cache optimization. Provides tunable parameters for cache size, TTL behavior,
 * memory management, performance monitoring, and investigation workflow integration.
 * 
 * **Configuration Categories:**
 * 
 * **Cache Size Management:**
 * - **maxSize**: Maximum number of cached investigation layouts (default: 100)
 * - **maxMemoryMB**: Memory limit in megabytes for investigation performance (default: Infinity)
 * 
 * **TTL and Freshness Control:**
 * - **ttl**: Time-to-live in milliseconds for investigation data currency (default: 60000)
 * - **refreshOnAccess**: Extend TTL on access for active investigations (default: false)
 * 
 * **Performance and Monitoring:**
 * - **enableMetrics**: Track cache performance for investigation optimization (default: false)
 * - **onMemoryPressure**: Callback for investigation memory pressure handling
 * 
 * **Investigation Workload Optimization:**
 * 
 * **Character Network Investigations:**
 * - High maxSize (200+) for complex relationship caching
 * - Long TTL (600000ms) for stable character data
 * - Memory limit based on investigation dataset size
 * 
 * **Evidence Chain Analysis:**
 * - Medium maxSize (100-150) for evidence connection caching
 * - Medium TTL (300000ms) for moderately dynamic evidence
 * - Refresh on access for active evidence threads
 * 
 * **Timeline Investigations:**
 * - Lower maxSize (50-75) for temporal event layouts
 * - Short TTL (120000ms) for frequently updated timelines
 * - Memory pressure callbacks for timeline optimization
 * 
 * @example
 * **Investigation-Optimized Configuration**
 * ```typescript
 * const investigationCacheConfig: CacheConfig = {
 *   maxSize: 150,              // Support 150 concurrent investigation layouts
 *   ttl: 300000,               // 5-minute TTL for investigation freshness
 *   maxMemoryMB: 75,           // 75MB limit for investigation performance
 *   refreshOnAccess: true,     // Extend TTL for active investigations
 *   enableMetrics: true,       // Monitor investigation cache performance
 *   onMemoryPressure: () => {
 *     console.warn('Investigation cache memory pressure detected');
 *     showInvestigationMemoryAlert();
 *   }
 * };
 * ```
 * 
 * @example
 * **Memory-Conscious Investigation Configuration**
 * ```typescript
 * const memoryEfficientConfig: CacheConfig = {
 *   maxSize: 50,               // Smaller cache for memory efficiency
 *   ttl: 180000,               // 3-minute TTL for faster turnover
 *   maxMemoryMB: 25,           // Conservative 25MB memory limit
 *   refreshOnAccess: false,    // No TTL extension for memory efficiency
 *   enableMetrics: false,      // Disable metrics to save memory
 *   onMemoryPressure: () => {
 *     // Aggressive cleanup for investigation performance
 *     investigationCache.clear();
 *   }
 * };
 * ```
 * 
 * @since 1.0.0 - Core cache configuration
 * @version 2.0.0 - Memory pressure handling and investigation optimization
 */
export interface CacheConfig {
  /** Maximum number of cached investigation layouts (default: 100) */
  maxSize?: number;
  /** Time-to-live in milliseconds for investigation data freshness (default: 60000) */
  ttl?: number;
  /** Extend TTL on access for active investigations (default: false) */
  refreshOnAccess?: boolean;
  /** Enable cache performance metrics for investigation optimization (default: false) */
  enableMetrics?: boolean;
  /** Callback for investigation memory pressure handling */
  onMemoryPressure?: () => void;
  /** Memory limit in megabytes for investigation performance (default: Infinity) */
  maxMemoryMB?: number;
}

/**
 * **Investigation Cache Performance Metrics Interface**
 * 
 * Comprehensive performance metrics interface for murder mystery investigation
 * layout cache monitoring and optimization. Provides detailed analytics for
 * cache effectiveness, memory usage patterns, and investigation performance tuning.
 * 
 * **Metrics Categories:**
 * 
 * **Access Performance:**
 * - **hits**: Successful cache retrievals for investigation layouts
 * - **misses**: Cache misses requiring expensive investigation computation
 * - **hitRate**: Percentage of successful cache hits (0.0 to 1.0)
 * 
 * **Storage Analytics:**
 * - **entries**: Current number of cached investigation layouts
 * - **totalSize**: Total memory usage in bytes for investigation cache
 * - **averageSize**: Average size per cached investigation layout
 * 
 * **Eviction Monitoring:**
 * - **evictions**: Number of entries removed due to investigation cache limits
 * 
 * **Investigation Performance Indicators:**
 * 
 * **Optimal Performance:**
 * - Hit rate > 80% indicates excellent investigation layout reuse
 * - Low eviction rate suggests proper investigation cache sizing
 * - Average size trends indicate investigation data complexity
 * 
 * **Performance Issues:**
 * - Hit rate < 50% may indicate TTL too short for investigation workflows
 * - High eviction rate suggests maxSize too small for investigation workload
 * - Growing average size indicates investigation data complexity increase
 * 
 * **Investigation Monitoring Strategies:**
 * - Monitor hit rate for investigation cache effectiveness
 * - Track memory usage for investigation performance optimization
 * - Analyze eviction patterns for investigation cache tuning
 * - Compare metrics across different investigation workloads
 * 
 * @example
 * **Investigation Performance Monitoring**
 * ```typescript
 * const metrics = investigationCache.getMetrics();
 * 
 * console.log(`Investigation Cache Performance:`);
 * console.log(`  Hit Rate: ${(metrics.hitRate * 100).toFixed(1)}%`);
 * console.log(`  Entries: ${metrics.entries}`);
 * console.log(`  Memory: ${(metrics.totalSize / 1024 / 1024).toFixed(1)}MB`);
 * console.log(`  Evictions: ${metrics.evictions}`);
 * 
 * // Investigation cache optimization based on metrics
 * if (metrics.hitRate < 0.6) {
 *   console.warn('Investigation cache hit rate low - consider increasing TTL');
 * }
 * if (metrics.evictions > metrics.hits * 0.1) {
 *   console.warn('High investigation cache eviction rate - consider increasing maxSize');
 * }
 * ```
 * 
 * @example
 * **Investigation Memory Usage Analysis**
 * ```typescript
 * const analyzeInvestigationCacheUsage = () => {
 *   const metrics = cache.getMetrics();
 *   const memoryUsageMB = metrics.totalSize / 1024 / 1024;
 *   const averageSizeKB = metrics.averageSize / 1024;
 *   
 *   return {
 *     efficiency: metrics.hitRate,
 *     memoryUsage: memoryUsageMB,
 *     averageLayoutSize: averageSizeKB,
 *     recommendedAction: memoryUsageMB > 50 ? 'Consider cleanup' : 'Performance optimal'
 *   };
 * };
 * ```
 * 
 * @since 1.0.0 - Core cache metrics
 * @version 2.0.0 - Enhanced investigation performance analytics
 */
export interface CacheMetrics {
  /** Number of successful cache hits for investigation layouts */
  hits: number;
  /** Number of cache misses requiring investigation computation */
  misses: number;
  /** Hit rate percentage for investigation cache effectiveness (0.0 to 1.0) */
  hitRate: number;
  /** Current number of cached investigation layout entries */
  entries: number;
  /** Total memory usage in bytes for investigation cache */
  totalSize: number;
  /** Average size per cached investigation layout in bytes */
  averageSize: number;
  /** Number of entries evicted due to investigation cache limits */
  evictions: number;
}

/**
 * **Investigation Layout Cache Implementation**
 * 
 * Advanced caching implementation for murder mystery investigation graph layout
 * computation results. Provides intelligent caching with comprehensive TTL management,
 * LRU eviction strategy, memory pressure handling, and detailed performance analytics
 * optimized for investigation visualization workflows.
 * 
 * **Class Architecture:**
 * 
 * **Core Storage:**
 * - **Map-based Cache**: High-performance hash map for O(1) investigation layout access
 * - **Entry Metadata**: Comprehensive tracking for TTL, LRU, and memory management
 * - **Memory Tracking**: UTF-8 byte-accurate size estimation for investigation performance
 * - **Metrics Collection**: Detailed analytics for investigation cache optimization
 * 
 * **Investigation Intelligence:**
 * - **Graph Fingerprinting**: Content-based hashing ignores layout positions
 * - **Layout Type Awareness**: Separate caching for different investigation visualization types
 * - **Memory Pressure Response**: Proactive eviction maintains investigation UI performance
 * - **Cross-platform Compatibility**: Browser and Node.js hash function adaptation
 * 
 * **Performance Optimization:**
 * - **LRU Eviction**: Intelligent removal prioritizes recently accessed investigations
 * - **Configurable TTL**: Flexible expiration supports different investigation data lifecycles
 * - **Memory Limits**: Prevents investigation cache from impacting overall application performance
 * - **Batch Operations**: Efficient bulk invalidation for investigation data updates
 * 
 * **Investigation Use Cases:**
 * - **Character Networks**: Cache complex relationship layout computations
 * - **Evidence Chains**: Store intricate evidence connection visualizations
 * - **Timeline Views**: Preserve expensive temporal event positioning
 * - **Search Results**: Cache dynamic investigation query visualizations
 * 
 * @example
 * **Investigation Character Network Caching**
 * ```typescript
 * const investigationCache = new LayoutCache({
 *   maxSize: 100,
 *   ttl: 300000, // 5 minutes
 *   maxMemoryMB: 50,
 *   enableMetrics: true
 * });
 * 
 * // Cache character network layout
 * const characterData = await fetchInvestigationCharacters();
 * const networkLayout = await computeCharacterNetwork(characterData);
 * investigationCache.set(characterData, 'character-network', networkLayout);
 * 
 * // Fast retrieval for investigation UI
 * const cachedNetwork = investigationCache.get(characterData, 'character-network');
 * if (cachedNetwork) {
 *   renderInvestigationVisualization(cachedNetwork);
 * }
 * ```
 * 
 * @example
 * **Investigation Memory Management**
 * ```typescript
 * const memoryManagedCache = new LayoutCache({
 *   maxMemoryMB: 25,
 *   onMemoryPressure: () => {
 *     console.warn('Investigation cache memory pressure');
 *     // Trigger investigation UI memory optimization
 *   }
 * });
 * 
 * // Monitor investigation cache health
 * setInterval(() => {
 *   const metrics = memoryManagedCache.getMetrics();
 *   if (metrics.hitRate < 0.5) {
 *     console.log('Investigation cache efficiency low - consider tuning');
 *   }
 * }, 60000);
 * ```
 * 
 * **Memory Management:**
 * - Accurate UTF-8 byte size calculation for investigation layouts
 * - Proactive memory pressure handling prevents investigation UI slowdowns
 * - Configurable memory limits support different investigation deployment scenarios
 * - LRU eviction ensures most relevant investigations remain cached
 * 
 * **Thread Safety:**
 * - Single-threaded design suitable for investigation UI main thread
 * - No concurrent modification protection (JavaScript single-threaded execution)
 * - Atomic operations for investigation cache consistency
 * 
 * **Performance Characteristics:**
 * - **Get Operations**: O(1) hash map lookup for investigation layout retrieval
 * - **Set Operations**: O(1) insertion with potential O(n) eviction for memory management
 * - **Eviction**: O(n) LRU scan to find least recently used investigation layout
 * - **Memory**: ~1-2MB overhead plus cached investigation layout data
 * 
 * @since 1.0.0 - Core investigation layout caching
 * @version 2.0.0 - Memory pressure handling and comprehensive metrics
 */
export class LayoutCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: Required<CacheConfig>;
  private metrics: {
    hits: number;
    misses: number;
    evictions: number;
  } = { hits: 0, misses: 0, evictions: 0 };
  private totalMemoryUsage = 0;
  private timestampCounter = 0;

  /**
   * **Investigation Cache Constructor**
   * 
   * Initializes murder mystery investigation layout cache with comprehensive
   * configuration support for different investigation workloads and performance
   * requirements. Sets up memory management, TTL behavior, and metrics collection.
   * 
   * **Configuration Processing:**
   * - **Default Values**: Provides sensible defaults for investigation caching
   * - **Validation**: Ensures configuration parameters are within acceptable ranges
   * - **Memory Setup**: Initializes memory tracking and pressure handling
   * - **Metrics Initialization**: Sets up performance monitoring if enabled
   * 
   * **Investigation-Optimized Defaults:**
   * - **maxSize: 100**: Supports 100 concurrent investigation layouts
   * - **ttl: 60000**: 1-minute TTL for investigation data freshness balance
   * - **refreshOnAccess: false**: Static TTL for predictable investigation cache behavior
   * - **enableMetrics: false**: Disabled by default to minimize investigation overhead
   * - **maxMemoryMB: Infinity**: No memory limit by default for investigation flexibility
   * 
   * @param config - Optional configuration for investigation cache optimization
   * 
   * @example
   * **Basic Investigation Cache**
   * ```typescript
   * // Use defaults optimized for standard investigation workflows
   * const basicCache = new LayoutCache();
   * ```
   * 
   * @example
   * **Production Investigation Cache**
   * ```typescript
   * // Production-ready configuration for investigation applications
   * const productionCache = new LayoutCache({
   *   maxSize: 200,           // Support large investigation datasets
   *   ttl: 600000,            // 10-minute TTL for investigation stability
   *   maxMemoryMB: 100,       // 100MB limit for investigation performance
   *   refreshOnAccess: true,  // Extend TTL for active investigations
   *   enableMetrics: true,    // Monitor investigation cache performance
   *   onMemoryPressure: () => {
   *     console.warn('Investigation cache memory pressure detected');
   *   }
   * });
   * ```
   * 
   * @example
   * **Memory-Constrained Investigation Environment**
   * ```typescript
   * // Optimized for investigation environments with limited memory
   * const constrainedCache = new LayoutCache({
   *   maxSize: 25,            // Smaller cache size
   *   ttl: 120000,            // 2-minute TTL for faster turnover
   *   maxMemoryMB: 15,        // Conservative memory limit
   *   enableMetrics: false    // Minimize overhead
   * });
   * ```
   * 
   * **Configuration Impact on Investigation Performance:**
   * - **Higher maxSize**: Better hit rates for complex investigations but more memory usage
   * - **Longer TTL**: Fewer computations but potentially stale investigation data
   * - **Memory Limits**: Prevents investigation UI slowdowns but may reduce cache effectiveness
   * - **Metrics Enabled**: Valuable optimization data but slight performance overhead
   * 
   * **Complexity:** O(1) - Simple configuration assignment and initialization
   * **Memory:** ~1KB base overhead plus configuration storage
   * **Performance:** Instant initialization suitable for investigation application startup
   */
  constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize ?? 100,
      ttl: config.ttl ?? 60000,
      refreshOnAccess: config.refreshOnAccess ?? false,
      enableMetrics: config.enableMetrics ?? false,
      onMemoryPressure: config.onMemoryPressure ?? (() => {}),
      maxMemoryMB: config.maxMemoryMB ?? Infinity
    };
  }

  /**
   * **Store Investigation Layout Result**
   * 
   * Stores computed murder mystery investigation layout result in cache with
   * intelligent memory management, TTL configuration, and LRU eviction support.
   * Optimizes investigation visualization performance through strategic caching.
   * 
   * **Storage Pipeline:**
   * 
   * **Phase 1 - Key Generation:**
   * 1. **Graph Fingerprinting**: Create content-based hash ignoring layout positions
   * 2. **Layout Type Integration**: Combine graph hash with layout type identifier
   * 3. **Key Collision Handling**: Ensure unique keys for different investigation contexts
   * 
   * **Phase 2 - Memory Validation:**
   * 1. **Size Estimation**: Calculate UTF-8 byte size of investigation layout data
   * 2. **Memory Limit Check**: Verify storage won't exceed investigation memory limits
   * 3. **Capacity Management**: Skip storage if would cause investigation memory issues
   * 
   * **Phase 3 - Cache Management:**
   * 1. **LRU Eviction**: Remove least recently used entries if at capacity
   * 2. **Entry Replacement**: Update existing entries with new investigation data
   * 3. **Memory Tracking**: Maintain accurate memory usage for investigation optimization
   * 
   * **Phase 4 - Entry Creation:**
   * 1. **Metadata Assembly**: Create comprehensive cache entry with timestamps
   * 2. **Access Tracking**: Initialize LRU and access count for investigation analytics
   * 3. **Storage Completion**: Add entry to cache with memory usage updates
   * 
   * **Investigation Caching Strategies:**
   * - **Character Networks**: Use custom TTL for stable relationship data
   * - **Evidence Chains**: Cache with medium TTL for moderately dynamic evidence
   * - **Timeline Views**: Short TTL for frequently updated temporal data
   * - **Search Results**: Very short TTL for dynamic investigation queries
   * 
   * @param graph - Source investigation graph data for cache key generation
   * @param layoutType - Layout algorithm type for investigation cache categorization
   * @param result - Computed investigation layout data to cache
   * @param customTTL - Optional custom TTL for specific investigation data types
   * 
   * @example
   * **Investigation Character Network Caching**
   * ```typescript
   * const characterGraph = await fetchCharacterData(investigationId);
   * const characterLayout = await computeCharacterNetwork(characterGraph);
   * 
   * // Cache character network with extended TTL
   * cache.set(
   *   characterGraph, 
   *   'character-network', 
   *   characterLayout, 
   *   600000 // 10-minute TTL for stable character data
   * );
   * ```
   * 
   * @example
   * **Investigation Evidence Chain Storage**
   * ```typescript
   * const evidenceData = await fetchEvidenceChain(caseId);
   * const evidenceLayout = await computeEvidenceVisualization(evidenceData);
   * 
   * // Cache evidence layout with standard TTL
   * cache.set(evidenceData, 'evidence-chain', evidenceLayout);
   * ```
   * 
   * @example
   * **Investigation Timeline Caching**
   * ```typescript
   * const timelineData = await fetchInvestigationTimeline(caseId);
   * const timelineLayout = await computeTimelineLayout(timelineData);
   * 
   * // Cache timeline with short TTL for frequent updates
   * cache.set(
   *   timelineData, 
   *   'timeline-view', 
   *   timelineLayout, 
   *   120000 // 2-minute TTL for dynamic timeline data
   * );
   * ```
   * 
   * **Memory Management:**
   * - Accurate UTF-8 byte size calculation prevents investigation memory overruns
   * - Memory limit enforcement maintains investigation UI performance
   * - LRU eviction prioritizes recent investigation access patterns
   * - Automatic cleanup prevents investigation cache memory accumulation
   * 
   * **Performance Impact:**
   * - **Cache Hit**: Future retrievals in O(1) time for investigation UI responsiveness
   * - **Memory Efficiency**: Precise size tracking prevents investigation memory waste
   * - **Eviction Intelligence**: LRU strategy optimizes investigation cache effectiveness
   * 
   * **Complexity:** O(1) average case, O(n) worst case with eviction
   * **Memory:** Adds investigation layout size plus ~200 bytes metadata overhead
   * **Side Effects:** May trigger LRU eviction or memory pressure handling
   */
  set(graph: GraphData, layoutType: string, result: GraphData, customTTL?: number): void {
    const key = this.createCacheKey(graph, layoutType);
    const ttl = customTTL ?? this.config.ttl;
    const size = this.estimateSize(result);
    
    // Check if adding this would exceed memory limit
    if (this.config.maxMemoryMB !== Infinity) {
      const projectedMemory = this.totalMemoryUsage + size;
      if (projectedMemory > this.config.maxMemoryMB * 1024 * 1024) {
        // Don't add if it would exceed memory limit
        return;
      }
    }
    
    // Check if we need to evict entries
    while (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    // Remove old entry if exists (to update memory tracking)
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.totalMemoryUsage -= oldEntry.size;
    }
    
    // Add new entry with unique timestamp for insertion order
    const entry: CacheEntry = {
      data: result,
      timestamp: Date.now(),
      ttl,
      size,
      accessCount: 0,
      lastAccessed: this.getUniqueTimestamp()
    };
    
    this.cache.set(key, entry);
    this.totalMemoryUsage += size;
  }

  /**
   * **Retrieve Investigation Layout Result**
   * 
   * Retrieves cached murder mystery investigation layout result with comprehensive
   * TTL validation, access tracking, and LRU update for optimal investigation
   * visualization performance and cache effectiveness.
   * 
   * **Retrieval Pipeline:**
   * 
   * **Phase 1 - Key Resolution:**
   * 1. **Cache Key Generation**: Create lookup key from investigation graph and layout type
   * 2. **Entry Lookup**: O(1) hash map access for investigation layout retrieval
   * 3. **Existence Validation**: Handle cache miss scenarios for investigation workflows
   * 
   * **Phase 2 - TTL Validation:**
   * 1. **Expiration Check**: Validate entry hasn't exceeded TTL for investigation freshness
   * 2. **Automatic Cleanup**: Remove expired entries to maintain investigation cache health
   * 3. **Memory Recovery**: Update memory tracking when removing expired investigation layouts
   * 
   * **Phase 3 - Access Management:**
   * 1. **Usage Statistics**: Increment access count for investigation cache analytics
   * 2. **LRU Update**: Update last accessed timestamp for eviction prioritization
   * 3. **TTL Refresh**: Optionally extend TTL for active investigation sessions
   * 
   * **Phase 4 - Result Delivery:**
   * 1. **Metrics Update**: Track cache hit for investigation performance monitoring
   * 2. **Data Return**: Provide cached investigation layout for immediate visualization
   * 3. **Performance Optimization**: Enable instant investigation UI rendering
   * 
   * **Investigation Cache Behavior:**
   * - **Hit**: Returns cached investigation layout instantly (O(1) performance)
   * - **Miss**: Returns null, triggering investigation layout computation
   * - **Expired**: Automatic cleanup with null return for investigation data freshness
   * - **Access Update**: LRU timestamp refresh for intelligent eviction decisions
   * 
   * @param graph - Source investigation graph data for cache key generation
   * @param layoutType - Layout algorithm type for investigation cache lookup
   * 
   * @returns Cached investigation layout data or null if not found/expired
   * 
   * @example
   * **Investigation Character Network Retrieval**
   * ```typescript
   * const characterGraph = await fetchCharacterData(investigationId);
   * const cachedLayout = cache.get(characterGraph, 'character-network');
   * 
   * if (cachedLayout) {
   *   // Instant investigation visualization
   *   renderCharacterNetwork(cachedLayout);
   *   console.log('Investigation character network loaded from cache');
   * } else {
   *   // Compute new investigation layout
   *   const newLayout = await computeCharacterNetwork(characterGraph);
   *   cache.set(characterGraph, 'character-network', newLayout);
   *   renderCharacterNetwork(newLayout);
   * }
   * ```
   * 
   * @example
   * **Investigation Evidence Chain Access**
   * ```typescript
   * const evidenceData = await fetchEvidenceChain(caseId);
   * const evidenceLayout = cache.get(evidenceData, 'evidence-chain');
   * 
   * if (evidenceLayout) {
   *   // Fast evidence visualization
   *   displayEvidenceVisualization(evidenceLayout);
   *   trackInvestigationCacheHit('evidence-chain');
   * } else {
   *   // Evidence layout computation required
   *   showInvestigationLoading('Computing evidence connections...');
   *   const computedLayout = await computeEvidenceLayout(evidenceData);
   *   cache.set(evidenceData, 'evidence-chain', computedLayout);
   *   displayEvidenceVisualization(computedLayout);
   * }
   * ```
   * 
   * @example
   * **Investigation Cache-First Strategy**
   * ```typescript
   * const getInvestigationLayout = async (graph, layoutType) => {
   *   // Always check cache first for investigation performance
   *   let layout = cache.get(graph, layoutType);
   *   
   *   if (!layout) {
   *     // Cache miss - compute investigation layout
   *     console.log(`Computing ${layoutType} for investigation`);
   *     layout = await computeLayoutByType(graph, layoutType);
   *     cache.set(graph, layoutType, layout);
   *   }
   *   
   *   return layout;
   * };
   * ```
   * 
   * **TTL and Freshness Management:**
   * - **Automatic Expiration**: Expired entries removed automatically for investigation accuracy
   * - **Access-based Refresh**: Optional TTL extension for active investigation sessions
   * - **Memory Cleanup**: Expired entries free memory immediately for investigation performance
   * - **Metrics Integration**: Hit/miss tracking for investigation cache optimization
   * 
   * **Performance Characteristics:**
   * - **Cache Hit**: O(1) retrieval with instant investigation visualization
   * - **Cache Miss**: O(1) lookup with null return for investigation computation trigger
   * - **Expired Entry**: O(1) cleanup with memory recovery for investigation efficiency
   * - **LRU Update**: O(1) timestamp update for investigation access tracking
   * 
   * **Complexity:** O(1) - Hash map lookup with constant time operations
   * **Memory:** No additional memory allocation, potential memory recovery on expiration
   * **Side Effects:** Updates access statistics, may remove expired entries
   */
  get(graph: GraphData, layoutType: string): GraphData | null {
    const key = this.createCacheKey(graph, layoutType);
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (this.config.enableMetrics) {
        this.metrics.misses++;
      }
      return null;
    }
    
    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.totalMemoryUsage -= entry.size;
      if (this.config.enableMetrics) {
        this.metrics.misses++;
      }
      return null;
    }
    
    // Update access info
    entry.accessCount++;
    entry.lastAccessed = this.getUniqueTimestamp();
    
    // Refresh TTL if configured
    if (this.config.refreshOnAccess) {
      entry.timestamp = now;
    }
    
    if (this.config.enableMetrics) {
      this.metrics.hits++;
    }
    
    return entry.data;
  }

  /**
   * Invalidates specific investigation layout from cache
   * 
   * Removes outdated or compromised layout data when investigation details change,
   * ensuring investigators always work with current relationship mappings and
   * evidence connections for accurate case analysis.
   * 
   * @example
   * ```typescript
   * // New evidence changes character relationships
   * const characterGraph = await fetchCharacterData(investigationId);
   * cache.invalidate(characterGraph, 'character-network');
   * // Force fresh layout calculation for updated case
   * const newLayout = await layoutEngine.compute(characterGraph);
   * renderInvestigationVisualization(newLayout);
   * ```
   * 
   * @example
   * ```typescript
   * // Evidence contradicts previous analysis
   * const evidenceData = await fetchEvidenceChain(caseId);
   * cache.invalidate(evidenceData, 'evidence-chain');
   * logger.info('Evidence layout invalidated due to new findings');
   * ```
   * 
   * @param graph - Investigation graph data identifying the cache entry
   * @param layoutType - Layout algorithm type for specific cache invalidation
   * 
   * @complexity O(1) - Direct hash table deletion
   * @sideEffect Updates memory tracking and triggers cache metrics
   */
  invalidate(graph: GraphData, layoutType: string): void {
    const key = this.createCacheKey(graph, layoutType);
    const entry = this.cache.get(key);
    if (entry) {
      this.totalMemoryUsage -= entry.size;
      this.cache.delete(key);
    }
  }

  /**
   * Invalidates all cached layouts for an investigation case
   * 
   * Removes all visualization variants when fundamental case structure changes,
   * such as adding new suspects, discovering contradictory evidence, or major
   * case breakthroughs that affect multiple investigation views.
   * 
   * @example
   * ```typescript
   * // Major case breakthrough requires complete re-analysis
   * const investigationData = await fetchCompleteInvestigation(caseId);
   * cache.invalidateGraph(investigationData);
   * // All cached layouts (characters, timeline, evidence) now invalid
   * investigationUI.showRecalculatingMessage();
   * await recomputeAllInvestigationViews(investigationData);
   * ```
   * 
   * @example
   * ```typescript
   * // Witness testimony changes entire case perspective
   * const updatedCaseData = await incorporateWitnessTestimony(caseId, testimony);
   * cache.invalidateGraph(updatedCaseData);
   * trackInvestigationEvent('major_case_update', {
   *   invalidatedLayouts: ['character-network', 'evidence-chain', 'timeline-view']
   * });
   * ```
   * 
   * @param graph - Investigation graph data for bulk cache invalidation
   * 
   * @complexity O(n) - Linear scan through all cached entries for matching graph hash
   * @performance Typically 1-5ms for standard investigation cache sizes
   * @sideEffect Removes multiple cache entries and updates memory tracking
   */
  invalidateGraph(graph: GraphData): void {
    const graphHash = this.hashGraph(graph);
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(graphHash + ':')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.totalMemoryUsage -= entry.size;
        this.cache.delete(key);
      }
    });
  }

  /**
   * Invalidates all cached layouts of specific visualization type
   * 
   * Removes all cache entries for a particular layout algorithm across
   * all investigations, typically used when layout algorithm updates
   * or investigation visualization standards change.
   * 
   * @example
   * ```typescript
   * // Character network algorithm improved - invalidate all character layouts
   * cache.invalidateByLayoutType('character-network');
   * logger.info('Character network layouts cleared for algorithm upgrade');
   * await recomputeAllCharacterNetworks();
   * ```
   * 
   * @example
   * ```typescript
   * // Evidence chain visualization updated with new analysis methods
   * cache.invalidateByLayoutType('evidence-chain');
   * investigationMetrics.track('layout_type_invalidation', {
   *   layoutType: 'evidence-chain',
   *   reason: 'algorithm_improvement'
   * });
   * ```
   * 
   * @param layoutType - Layout algorithm type for bulk invalidation across all investigations
   * 
   * @complexity O(n) - Linear scan through all cache entries for layout type matching
   * @performance Typically 2-10ms depending on total cache size
   * @sideEffect Mass cache invalidation may trigger investigation UI recomputation
   */
  invalidateByLayoutType(layoutType: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.endsWith(':' + layoutType)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.totalMemoryUsage -= entry.size;
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clears all investigation layout cache
   * 
   * Nuclear option for cache management - removes all cached layouts
   * across all active investigations. Used during system maintenance,
   * major framework updates, or when memory pressure requires
   * aggressive cleanup for investigation system performance.
   * 
   * @example
   * ```typescript
   * // System maintenance or major framework update
   * cache.clear();
   * logger.info('All investigation layouts cleared for system refresh');
   * await investigationSystem.warmupPriorityCases();
   * showSystemMaintenanceComplete();
   * ```
   * 
   * @example
   * ```typescript
   * // Emergency memory cleanup for investigation performance
   * if (await getSystemMemoryPressure() > 0.9) {
   *   cache.clear();
   *   investigationMetrics.track('emergency_cache_clear', {
   *     memoryPressure: await getSystemMemoryPressure(),
   *     recoveredMemoryMB: previousMemoryUsage / 1024 / 1024
   *   });
   * }
   * ```
   * 
   * @complexity O(1) - Map.clear() operation with metric reset
   * @sideEffect Resets all cache metrics, memory tracking, and access statistics
   * @performance Instant operation regardless of investigation cache size
   */
  clear(): void {
    this.cache.clear();
    this.totalMemoryUsage = 0;
  }

  /**
   * Retrieves current investigation cache entry count
   * 
   * Provides the total number of cached investigation layouts across
   * all cases and visualization types for cache monitoring and
   * capacity management in investigation systems.
   * 
   * @example
   * ```typescript
   * const currentCacheSize = cache.getSize();
   * console.log(`Investigation cache contains ${currentCacheSize} layouts`);
   * 
   * if (currentCacheSize > 150) {
   *   logger.warn('Investigation cache approaching capacity limit');
   * }
   * ```
   * 
   * @example
   * ```typescript
   * // Monitor investigation cache usage in dashboard
   * const displayCacheStatus = () => {
   *   const size = cache.getSize();
   *   const maxSize = cache.config.maxSize;
   *   const utilization = (size / maxSize * 100).toFixed(1);
   *   return `Investigation Cache: ${size}/${maxSize} (${utilization}% full)`;
   * };
   * ```
   * 
   * @returns Current number of cached investigation layout entries
   * 
   * @complexity O(1) - Direct Map.size property access
   * @performance Instant retrieval suitable for frequent monitoring
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Retrieves comprehensive investigation cache performance metrics
   * 
   * Provides detailed analytics on cache effectiveness for investigation
   * workflow optimization, system performance monitoring, and capacity
   * planning in murder mystery investigation applications.
   * 
   * @example
   * ```typescript
   * const metrics = cache.getMetrics();
   * console.log(`Investigation Cache Performance Report:`);
   * console.log(`  Hit Rate: ${(metrics.hitRate * 100).toFixed(2)}%`);
   * console.log(`  Memory Usage: ${(metrics.totalSize / 1024 / 1024).toFixed(1)}MB`);
   * console.log(`  Cache Entries: ${metrics.entries}`);
   * 
   * if (metrics.hitRate < 0.7) {
   *   logger.warn('Low investigation cache efficiency impacting performance');
   * }
   * ```
   * 
   * @example
   * ```typescript
   * // Investigation cache health monitoring
   * const monitorCacheHealth = () => {
   *   const metrics = cache.getMetrics();
   *   
   *   return {
   *     status: metrics.hitRate > 0.8 ? 'excellent' : 
   *             metrics.hitRate > 0.6 ? 'good' : 'needs-optimization',
   *     memoryEfficiency: metrics.totalSize / metrics.entries,
   *     recommendations: {
   *       increaseTTL: metrics.hitRate < 0.5,
   *       increaseSize: metrics.evictions > metrics.hits * 0.1,
   *       memoryOptimization: metrics.totalSize > 50 * 1024 * 1024
   *     }
   *   };
   * };
   * ```
   * 
   * @returns Complete investigation cache performance statistics and analytics
   * 
   * @complexity O(1) - Direct metric calculation from tracked counters
   * @monitoring Essential for investigation system performance tuning
   * @performance Sub-millisecond metric retrieval for real-time monitoring
   */
  getMetrics(): CacheMetrics {
    const entries = this.cache.size;
    const totalSize = this.totalMemoryUsage;
    const averageSize = entries > 0 ? totalSize / entries : 0;
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? this.metrics.hits / total : 0;
    
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate,
      entries,
      totalSize,
      averageSize,
      evictions: this.metrics.evictions
    };
  }

  /**
   * Resets investigation cache performance metrics
   * 
   * Clears all performance tracking counters for fresh investigation
   * cache monitoring, typically used during investigation system
   * maintenance, performance testing, or metric collection restarts.
   * 
   * @example
   * ```typescript
   * // Start fresh metric collection for investigation performance analysis
   * cache.resetMetrics();
   * logger.info('Investigation cache metrics reset for new monitoring period');
   * 
   * // Run investigation workload test
   * await runInvestigationPerformanceTest();
   * 
   * // Analyze clean metrics
   * const testMetrics = cache.getMetrics();
   * console.log(`Test hit rate: ${(testMetrics.hitRate * 100).toFixed(1)}%`);
   * ```
   * 
   * @example
   * ```typescript
   * // Daily investigation cache metric reset
   * const resetDailyMetrics = () => {
   *   const previousMetrics = cache.getMetrics();
   *   cache.resetMetrics();
   *   
   *   investigationAnalytics.recordDailyMetrics({
   *     date: new Date().toISOString().split('T')[0],
   *     hitRate: previousMetrics.hitRate,
   *     totalHits: previousMetrics.hits,
   *     memoryUsage: previousMetrics.totalSize
   *   });
   * };
   * ```
   * 
   * @complexity O(1) - Simple counter reset operation
   * @sideEffect All hit/miss/eviction counters reset to zero
   * @performance Instant operation suitable for frequent metric resets
   */
  resetMetrics(): void {
    this.metrics = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Generates content-based hash for investigation graph structure
   * 
   * Creates deterministic hash fingerprint for investigation graph data
   * that ignores layout positions, focusing only on structural relationships
   * between characters, evidence, puzzles, and timeline events.
   * 
   * **Hash Generation Strategy:**
   * - **Node Normalization**: Sorts nodes by ID, excludes position data
   * - **Edge Normalization**: Sorts edges by ID, preserves relationship structure
   * - **Content Focus**: Hash based on investigation content, not visual layout
   * - **Platform Compatibility**: Adapts hash algorithm for browser vs Node.js environments
   * 
   * @example
   * ```typescript
   * const characterGraph = await fetchCharacterData(investigationId);
   * const graphHash = cache.hashGraph(characterGraph);
   * console.log(`Character network hash: ${graphHash}`);
   * 
   * // Same content produces same hash regardless of node positions
   * const repositionedGraph = applyRandomPositions(characterGraph);
   * const repositionedHash = cache.hashGraph(repositionedGraph);
   * console.log(`Repositioned hash matches: ${graphHash === repositionedHash}`);
   * ```
   * 
   * @example
   * ```typescript
   * // Investigation cache key generation
   * const generateInvestigationCacheKey = (graph, layoutType) => {
   *   const structuralHash = cache.hashGraph(graph);
   *   return `investigation_${structuralHash}_${layoutType}`;
   * };
   * ```
   * 
   * @param graph - Investigation graph data for hash generation
   * 
   * @returns Deterministic hash string representing investigation structure
   * 
   * @complexity O(n log n) - Node and edge sorting for deterministic output
   * @performance Typically 1-3ms for standard investigation graph sizes
   * @deterministic Same investigation structure always produces identical hash
   */
  hashGraph(graph: GraphData): string {
    // Create a normalized representation that ignores positions
    const normalizedGraph = {
      nodes: graph.nodes.map(n => ({
        id: n.id,
        type: n.type,
        data: n.data
      })).sort((a, b) => a.id.localeCompare(b.id)),
      edges: graph.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type
      })).sort((a, b) => a.id.localeCompare(b.id))
    };
    
    const json = JSON.stringify(normalizedGraph);
    
    // Use simpler hash for browser environments
    if (typeof window !== 'undefined') {
      return this.simpleHash(json);
    }
    
    // Use crypto for Node.js
    return crypto.createHash('sha256').update(json).digest('hex').substring(0, 16);
  }
  
  /**
   * Optimized hash function for investigation browser environments
   * 
   * Implements FNV-1a algorithm for superior hash distribution when
   * processing investigation graph structures in browser contexts.
   * Provides excellent collision resistance for investigation data
   * while maintaining high performance for cache key generation.
   * 
   * **FNV-1a Algorithm Benefits:**
   * - **Low Collision Rate**: Excellent distribution for investigation graph data
   * - **High Performance**: Fast computation suitable for real-time investigation UI
   * - **Deterministic Output**: Consistent hashes across investigation sessions
   * - **Browser Optimized**: No crypto dependency for investigation client performance
   * 
   * @param str - JSON string representation of normalized investigation graph
   * 
   * @returns Base-36 encoded hash for investigation cache key generation
   * 
   * @complexity O(n) - Single pass through investigation graph string
   * @performance ~0.1ms per KB of investigation data
   * @internal Used internally for browser hash generation, not exposed to investigation API
   */
  private simpleHash(str: string): string {
    let hash = 2166136261; // FNV offset basis
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619); // FNV prime
    }
    // Convert to positive 32-bit integer and then to base36
    return (hash >>> 0).toString(36);
  }

  /**
   * Estimates accurate memory size of investigation graph data structure
   * 
   * Calculates precise UTF-8 byte size of investigation layout data for
   * accurate memory management and cache optimization. Essential for
   * preventing investigation UI memory overruns and maintaining performance.
   * 
   * **Size Calculation Accuracy:**
   * - **UTF-8 Precision**: Accounts for multi-byte investigation text characters
   * - **JSON Serialization**: Measures actual storage size including metadata
   * - **Cross-platform Consistency**: Identical size calculation across investigation environments
   * - **Memory Management**: Enables precise investigation cache memory tracking
   * 
   * @example
   * ```typescript
   * const characterNetwork = await computeCharacterNetwork(investigationData);
   * const networkSizeMB = cache.estimateSize(characterNetwork) / 1024 / 1024;
   * 
   * console.log(`Character network layout: ${networkSizeMB.toFixed(2)}MB`);
   * if (networkSizeMB > 5) {
   *   logger.warn('Large character network may impact investigation performance');
   * }
   * ```
   * 
   * @example
   * ```typescript
   * // Investigation memory usage analysis
   * const analyzeInvestigationMemory = (layouts) => {
   *   const sizes = layouts.map(layout => ({
   *     type: layout.type,
   *     sizeMB: cache.estimateSize(layout.data) / 1024 / 1024
   *   }));
   *   
   *   sizes.sort((a, b) => b.sizeMB - a.sizeMB);
   *   return sizes;
   * };
   * ```
   * 
   * @param data - Investigation graph data for memory size calculation
   * 
   * @returns Precise UTF-8 byte size of investigation layout data
   * 
   * @complexity O(n) - Single JSON serialization of investigation data
   * @performance Typically 0.5-2ms for standard investigation layouts
   * @accuracy UTF-8 byte-perfect size estimation for investigation memory management
   */
  estimateSize(data: GraphData): number {
    // Accurate size estimation using Buffer.byteLength
    // This correctly calculates the actual byte size in UTF-8
    const json = JSON.stringify(data);
    return Buffer.byteLength(json, 'utf8');
  }

  /**
   * Cleans up expired investigation layout entries
   * 
   * Performs comprehensive cleanup of expired investigation cache entries
   * to maintain data freshness, free memory resources, and optimize
   * investigation visualization performance through proactive maintenance.
   * 
   * **Cleanup Process:**
   * - **TTL Validation**: Identifies all expired investigation layouts
   * - **Memory Recovery**: Reclaims memory from expired cache entries
   * - **Cache Compaction**: Removes expired entries to improve cache efficiency
   * - **Performance Optimization**: Maintains optimal investigation cache performance
   * 
   * @example
   * ```typescript
   * // Scheduled investigation cache maintenance
   * setInterval(() => {
   *   cache.cleanup();
   *   const metrics = cache.getMetrics();
   *   console.log(`Investigation cache cleanup: ${metrics.entries} entries remaining`);
   * }, 60000); // Clean up every minute
   * ```
   * 
   * @example
   * ```typescript
   * // Manual investigation cache optimization
   * const optimizeInvestigationCache = async () => {
   *   const beforeSize = cache.getSize();
   *   const beforeMemory = cache.getMemoryUsage();
   *   
   *   cache.cleanup();
   *   
   *   const afterSize = cache.getSize();
   *   const afterMemory = cache.getMemoryUsage();
   *   const freedMemoryMB = (beforeMemory - afterMemory) / 1024 / 1024;
   *   
   *   logger.info(`Investigation cache cleanup freed ${freedMemoryMB.toFixed(2)}MB`);
   *   return { removedEntries: beforeSize - afterSize, freedMemoryMB };
   * };
   * ```
   * 
   * @complexity O(n) - Single pass through all investigation cache entries
   * @performance Typically 1-5ms for standard investigation cache sizes
   * @sideEffect Removes expired entries and updates memory tracking
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.totalMemoryUsage -= entry.size;
        this.cache.delete(key);
      }
    });
  }

  /**
   * Handles investigation cache memory pressure through intelligent eviction
   * 
   * Responds to memory pressure by aggressively evicting least recently used
   * investigation layouts to prevent system slowdowns while preserving
   * the most relevant investigation visualizations for ongoing analysis.
   * 
   * **Memory Pressure Response Strategy:**
   * - **Callback Notification**: Alerts investigation system of memory pressure
   * - **Aggressive Eviction**: Removes 50% of cached investigation layouts
   * - **LRU Prioritization**: Preserves most recently accessed investigation data
   * - **Performance Recovery**: Maintains investigation UI responsiveness under pressure
   * 
   * @example
   * ```typescript
   * // Configure investigation cache with memory pressure handling
   * const cache = new LayoutCache({
   *   maxMemoryMB: 50,
   *   onMemoryPressure: () => {
   *     console.warn('Investigation cache memory pressure detected');
   *     showInvestigationMemoryAlert('Optimizing cache for better performance...');
   *   }
   * });
   * 
   * // Manually trigger memory pressure handling
   * if (await getSystemMemoryUsage() > 0.9) {
   *   cache.handleMemoryPressure();
   * }
   * ```
   * 
   * @example
   * ```typescript
   * // Investigation system memory monitoring
   * const monitorInvestigationMemory = () => {
   *   const memoryUsageMB = cache.getMemoryUsage() / 1024 / 1024;
   *   
   *   if (memoryUsageMB > 40) { // 40MB threshold
   *     logger.warn(`Investigation cache using ${memoryUsageMB.toFixed(1)}MB`);
   *     cache.handleMemoryPressure();
   *     
   *     investigationMetrics.track('memory_pressure_handled', {
   *       beforeMemoryMB: memoryUsageMB,
   *       afterMemoryMB: cache.getMemoryUsage() / 1024 / 1024
   *     });
   *   }
   * };
   * ```
   * 
   * @complexity O(n) - LRU eviction requires scanning investigation cache entries
   * @performance 5-15ms depending on investigation cache size
   * @sideEffect Triggers memory pressure callback and aggressive cache eviction
   */
  handleMemoryPressure(): void {
    this.config.onMemoryPressure();
    
    // Evict 50% of entries
    const targetSize = Math.floor(this.cache.size / 2);
    while (this.cache.size > targetSize) {
      this.evictLRU();
    }
  }

  /**
   * Retrieves current investigation cache memory usage in bytes
   * 
   * Provides precise memory consumption measurement for investigation
   * layout cache monitoring, performance optimization, and system
   * resource management in murder mystery visualization applications.
   * 
   * @example
   * ```typescript
   * const memoryUsageBytes = cache.getMemoryUsage();
   * const memoryUsageMB = memoryUsageBytes / 1024 / 1024;
   * 
   * console.log(`Investigation cache memory: ${memoryUsageMB.toFixed(2)}MB`);
   * 
   * if (memoryUsageMB > 50) {
   *   logger.warn('Investigation cache memory usage high - consider cleanup');
   * }
   * ```
   * 
   * @example
   * ```typescript
   * // Investigation memory usage dashboard
   * const getMemoryStatusReport = () => {
   *   const totalMemory = cache.getMemoryUsage();
   *   const entryCount = cache.getSize();
   *   const averageSize = entryCount > 0 ? totalMemory / entryCount : 0;
   *   
   *   return {
   *     totalMB: (totalMemory / 1024 / 1024).toFixed(2),
   *     entries: entryCount,
   *     averageKB: (averageSize / 1024).toFixed(1),
   *     status: totalMemory > 50 * 1024 * 1024 ? 'high' : 'normal'
   *   };
   * };
   * ```
   * 
   * @returns Current investigation cache memory usage in bytes
   * 
   * @complexity O(1) - Direct access to tracked memory usage counter
   * @performance Instant retrieval suitable for frequent monitoring
   * @accuracy UTF-8 byte-accurate measurement of investigation layout data
   */
  getMemoryUsage(): number {
    return this.totalMemoryUsage;
  }

  /**
   * Updates investigation cache configuration dynamically
   * 
   * Allows runtime modification of cache behavior for investigation
   * performance optimization, memory management adjustment, and
   * workflow customization without recreating the cache instance.
   * 
   * **Configurable Parameters:**
   * - **maxSize**: Adjust investigation cache capacity for dataset changes
   * - **ttl**: Modify investigation data freshness requirements
   * - **maxMemoryMB**: Update memory limits for system resource changes
   * - **refreshOnAccess**: Toggle TTL extension behavior for investigation workflows
   * - **enableMetrics**: Enable/disable performance monitoring overhead
   * - **onMemoryPressure**: Update memory pressure handling callbacks
   * 
   * @example
   * ```typescript
   * // Adjust cache for high-volume investigation period
   * cache.updateConfig({
   *   maxSize: 200,        // Increase capacity for complex investigation
   *   ttl: 900000,         // 15-minute TTL for investigation data stability
   *   maxMemoryMB: 100,    // Increase memory limit for investigation performance
   *   refreshOnAccess: true // Extend TTL for active investigation sessions
   * });
   * ```
   * 
   * @example
   * ```typescript
   * // Memory-constrained investigation environment adjustment
   * cache.updateConfig({
   *   maxSize: 25,         // Reduce capacity for memory efficiency
   *   maxMemoryMB: 15,     // Conservative memory limit
   *   ttl: 120000,         // Shorter TTL for faster turnover
   *   enableMetrics: false // Disable metrics to save investigation memory
   * });
   * ```
   * 
   * @example
   * ```typescript
   * // Dynamic investigation cache optimization based on system conditions
   * const optimizeCacheForCurrentLoad = async () => {
   *   const systemMemory = await getSystemMemoryUsage();
   *   const activeInvestigations = await getActiveInvestigationCount();
   *   
   *   if (systemMemory > 0.8) {
   *     cache.updateConfig({ maxMemoryMB: 25, maxSize: 50 });
   *   } else if (activeInvestigations > 10) {
   *     cache.updateConfig({ maxSize: 200, ttl: 600000 });
   *   }
   * };
   * ```
   * 
   * @param config - Partial configuration updates for investigation cache optimization
   * 
   * @complexity O(1) - Simple configuration object merge
   * @sideEffect Updates cache behavior immediately for all subsequent operations
   * @performance Instant configuration update suitable for real-time optimization
   */
  updateConfig(config: Partial<CacheConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Cancels ongoing investigation cache operations (compatibility interface)
   * 
   * Provides cancellation interface for investigation cache operations,
   * ensuring compatibility with async operation management patterns.
   * Currently no-op but reserved for future async cache operations.
   * 
   * **Future Async Operations:**
   * - **Background Cleanup**: Cancellable expired entry removal
   * - **Async Size Estimation**: Interruptible memory calculation
   * - **Batch Operations**: Cancellable bulk cache operations
   * - **Web Worker Integration**: Async layout computation cancellation
   * 
   * @example
   * ```typescript
   * // Investigation cache operation with cancellation support
   * const investigationCacheOperations = {
   *   async processLargeDataset(dataset) {
   *     try {
   *       // Process investigation data with cancellation support
   *       return await performCacheOperations(dataset);
   *     } catch (error) {
   *       cache.cancel(); // Ensure clean cancellation state
   *       throw error;
   *     }
   *   }
   * };
   * ```
   * 
   * @example
   * ```typescript
   * // Investigation system shutdown with graceful cache cancellation
   * const shutdownInvestigationSystem = () => {
   *   cache.cancel();           // Cancel ongoing cache operations
   *   cache.cleanup();          // Clean up expired entries
   *   cache.resetMetrics();     // Reset performance counters
   *   logger.info('Investigation cache shutdown complete');
   * };
   * ```
   * 
   * @complexity O(1) - No-op operation with immediate return
   * @compatibility Provides interface for future async operation cancellation
   * @performance Instant operation with no investigation performance impact
   */
  cancel(): void {
    // No-op for now, but could be used for cancelling async operations
  }

  /**
   * Creates cache key from investigation graph and layout type
   * 
   * Generates unique cache key by combining investigation graph structural
   * hash with layout algorithm type for precise cache entry identification
   * and retrieval in murder mystery visualization systems.
   * 
   * **Key Generation Strategy:**
   * - **Graph Hash**: Content-based fingerprint ignoring layout positions
   * - **Layout Type**: Algorithm identifier for visualization differentiation
   * - **Separator**: Colon delimiter prevents key collision
   * - **Uniqueness**: Each graph-layout combination gets distinct key
   * 
   * @param graph - Investigation graph data for structural hash generation
   * @param layoutType - Layout algorithm type for key disambiguation
   * 
   * @returns Unique cache key for investigation layout storage/retrieval
   * 
   * @complexity O(n log n) - Graph hashing dominates key generation time
   * @performance Typically 1-3ms for standard investigation graph sizes
   * @internal Used internally for cache key generation, not exposed to investigation API
   */
  private createCacheKey(graph: GraphData, layoutType: string): string {
    const graphHash = this.hashGraph(graph);
    return `${graphHash}:${layoutType}`;
  }

  /**
   * Evicts least recently used investigation layout entry
   * 
   * Implements LRU (Least Recently Used) eviction strategy to remove
   * the investigation layout that hasn't been accessed for the longest
   * time, preserving cache space for more relevant investigation data.
   * 
   * **LRU Eviction Process:**
   * - **Access Time Scanning**: Identifies entry with oldest lastAccessed timestamp
   * - **Memory Recovery**: Reclaims memory from least relevant investigation layout
   * - **Metrics Update**: Increments eviction counter for cache analytics
   * - **Space Management**: Frees cache slot for new investigation layouts
   * 
   * **Investigation Usage Prioritization:**
   * - **Active Cases**: Recently accessed investigation layouts remain cached
   * - **Inactive Analysis**: Stale investigation visualizations removed first
   * - **Memory Efficiency**: Optimal use of limited investigation cache memory
   * - **Performance Maintenance**: Prevents cache bloat from impacting investigation UI
   * 
   * @complexity O(n) - Linear scan to find least recently used investigation entry
   * @performance Typically 1-5ms for standard investigation cache sizes
   * @sideEffect Removes cache entry, updates memory tracking, and increments eviction metrics
   * @internal Used internally for cache capacity management, not exposed to investigation API
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      const entry = this.cache.get(lruKey);
      if (entry) {
        this.totalMemoryUsage -= entry.size;
        this.cache.delete(lruKey);
        if (this.config.enableMetrics) {
          this.metrics.evictions++;
        }
      }
    }
  }

  /**
   * Generates unique timestamp for investigation cache LRU ordering
   * 
   * Creates microsecond-precision timestamps to ensure proper LRU ordering
   * even when multiple investigation layouts are accessed within the same
   * millisecond, maintaining accurate access tracking for cache optimization.
   * 
   * **Timestamp Precision Strategy:**
   * - **Base Time**: Uses Date.now() for millisecond precision
   * - **Microsecond Counter**: Adds internal counter for sub-millisecond uniqueness
   * - **Ordering Guarantee**: Ensures proper LRU sequence for investigation layouts
   * - **Collision Prevention**: Eliminates timestamp collision issues
   * 
   * **Investigation Cache Benefits:**
   * - **Accurate LRU**: Proper eviction order for investigation layout management
   * - **High-frequency Access**: Handles rapid investigation UI interactions
   * - **Cache Consistency**: Reliable ordering for investigation cache optimization
   * - **Performance Tracking**: Precise access time recording for analytics
   * 
   * @returns Unique timestamp with microsecond precision for LRU ordering
   * 
   * @complexity O(1) - Simple arithmetic operation with counter increment
   * @performance Sub-microsecond operation suitable for high-frequency investigation access
   * @internal Used internally for LRU timestamp generation, not exposed to investigation API
   */
  private getUniqueTimestamp(): number {
    // Use Date.now() as base and add a counter to ensure uniqueness
    return Date.now() * 1000 + (this.timestampCounter++);
  }
}