/**
 * Murder Mystery Investigation Layout Cache System
 * 
 * High-performance caching system for murder mystery investigation graph layouts.
 * Provides intelligent caching, memory management, and performance optimization
 * for complex investigation visualizations with sophisticated TTL and eviction policies.
 * 
 * **Cache Architecture:**
 * 
 * **Core Components:**
 * - **LayoutCache**: Advanced caching engine with memory pressure handling
 * - **CacheConfig**: Comprehensive configuration interface for cache tuning
 * - **CacheMetrics**: Performance monitoring and analytics for cache effectiveness
 * - **Singleton Instance**: Production-ready default cache with optimized settings
 * 
 * **Investigation-Optimized Configuration:**
 * 
 * **Memory Management:**
 * - **50MB Memory Limit**: Accommodates complex investigation graphs with thousands of entities
 * - **1000 Entry Limit**: Supports extensive investigation sessions with multiple case variations
 * - **Intelligent Eviction**: LRU-based removal prioritizing recently accessed investigation layouts
 * 
 * **Performance Optimization:**
 * - **5-Minute TTL**: Balances cache freshness with investigation workflow continuity
 * - **Refresh-on-Access**: Extends cache lifetime for active investigation sessions
 * - **Memory Pressure Handling**: Proactive eviction prevents performance degradation
 * 
 * **Investigation Use Cases:**
 * 
 * **Case Analysis Workflows:**
 * - **Puzzle Dependency Caching**: Stores complex puzzle relationship layouts
 * - **Character Network Caching**: Preserves expensive social network computations
 * - **Evidence Chain Layouts**: Caches intricate evidence relationship visualizations
 * - **Timeline Arrangement**: Stores temporal event positioning for rapid access
 * 
 * **Performance Benefits:**
 * - **Sub-Second Layout Retrieval**: Cached layouts load instantly for smooth investigation
 * - **Memory Efficiency**: Intelligent eviction maintains optimal memory usage
 * - **Session Continuity**: Cache persistence across investigation workflows
 * - **Collaborative Support**: Shared cache for multi-investigator sessions
 * 
 * **Production Features:**
 * - **Development Metrics**: Detailed cache performance analytics in development mode
 * - **Production Optimization**: Streamlined configuration for production deployment
 * - **Error Recovery**: Graceful handling of memory pressure and cache failures
 * - **Logging Integration**: Comprehensive monitoring and debugging support
 * 
 * @example
 * ```typescript
 * import { layoutCache, LayoutCache, CacheConfig } from '@/lib/graph/cache';
 * 
 * // Use default singleton for standard investigation workflows
 * const cachedLayout = layoutCache.get('puzzle-chain-case-123');
 * if (!cachedLayout) {
 *   const newLayout = await computeComplexLayout(investigationData);
 *   layoutCache.set('puzzle-chain-case-123', newLayout);
 * }
 * 
 * // Create custom cache for specialized investigation scenarios
 * const customCache = new LayoutCache({
 *   maxMemoryMB: 100,
 *   ttl: 10 * 60 * 1000, // 10 minutes for long investigation sessions
 *   enableMetrics: true
 * });
 * 
 * // Monitor cache performance for investigation optimization
 * const metrics = layoutCache.getMetrics();
 * console.log(`Cache hit rate: ${metrics.hitRate}%`);
 * console.log(`Memory usage: ${metrics.memoryUsage}MB`);
 * ```
 * 
 * @see {@link LayoutCache} Core caching engine with advanced memory management
 * @see {@link CacheConfig} Configuration interface for cache optimization
 * @see {@link CacheMetrics} Performance monitoring and analytics
 * @author ALNRetool Development Team
 * @since 1.0.0
 * @version 2.0.0
 */

export { LayoutCache } from './LayoutCache';
export type { CacheConfig, CacheMetrics } from './LayoutCache';

// Create a singleton instance with production-ready configuration
import { LayoutCache } from './LayoutCache';



/**
 * Production-Ready Investigation Layout Cache Singleton
 * 
 * Optimized cache instance configured for murder mystery investigation workflows.
 * Provides intelligent caching with memory pressure handling, TTL management,
 * and performance monitoring tailored for complex investigation visualizations.
 * 
 * **Configuration Highlights:**
 * - **50MB Memory Pool**: Accommodates large investigation graphs with complex relationships
 * - **1000 Entry Capacity**: Supports extensive investigation sessions with multiple cases
 * - **5-Minute TTL**: Balances data freshness with investigation workflow continuity
 * - **Access-Based Refresh**: Extends cache lifetime for active investigation elements
 * - **Development Metrics**: Detailed performance analytics for optimization
 * - **Memory Pressure Response**: Proactive logging and eviction during high memory usage
 * 
 * **Investigation Performance:**
 * - **Instant Layout Retrieval**: Sub-second access for previously computed layouts
 * - **Memory Efficiency**: LRU eviction maintains optimal resource utilization
 * - **Session Persistence**: Maintains layout cache across investigation workflows
 * - **Collaborative Ready**: Shared cache supports multi-investigator environments
 * 
 * @constant layoutCache
 * @since 1.0.0
 */
// 50MB max memory, 5 minute TTL, max 1000 entries
export const layoutCache = new LayoutCache({
  /** Maximum memory allocation for investigation layout caching (50MB) */
  maxMemoryMB: 50,
  /** Maximum number of cached investigation layouts (1000 entries) */
  maxSize: 1000,
  /** Cache entry time-to-live for investigation continuity (5 minutes) */
  ttl: 5 * 60 * 1000, // 5 minutes
  /** Extend cache lifetime on access for active investigations */
  refreshOnAccess: true,
  /** Enable detailed metrics in development for cache optimization */
  enableMetrics: import.meta.env?.PROD !== true,
  /** Memory pressure callback for proactive investigation cache management */
  onMemoryPressure: () => {
    console.warn('Layout cache memory pressure detected, evicting entries');
  }
});

/**
 * Default Investigation Layout Cache Export
 * 
 * Convenience export providing direct access to the optimized investigation
 * layout cache singleton. Use this for standard murder mystery investigation
 * workflows requiring high-performance layout caching and retrieval.
 * 
 * @default layoutCache
 * @since 1.0.0
 */
// Export singleton for convenience
export default layoutCache;