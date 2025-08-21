import NodeCache from 'node-cache';
import { CacheCoordinator } from './CacheCoordinator';

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  ksize: number;
  vsize: number;
}

/**
 * Server-side caching service to reduce Notion API load
 * 
 * Features:
 * - 5-minute TTL (matches React Query frontend cache)
 * - Automatic memory management (1000 keys max)
 * - Statistics tracking for monitoring
 * - Pattern-based cache clearing
 * 
 * @example
 * ```typescript
 * const data = cacheService.get(key);
 * if (!data) {
 *   const freshData = await fetchFromNotion();
 *   cacheService.set(key, freshData);
 * }
 * ```
 */
export class CacheService {
  private cache: NodeCache;
  private coordinator: CacheCoordinator;
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly MAX_KEYS = 1000;
  private readonly CHECK_PERIOD = 600; // 10 minutes

  constructor(ttl?: number) {
    this.cache = new NodeCache({
      stdTTL: ttl || this.DEFAULT_TTL,
      maxKeys: this.MAX_KEYS,
      checkperiod: this.CHECK_PERIOD,
      deleteOnExpire: true,
      useClones: false, // Performance optimization
    });
    this.coordinator = CacheCoordinator.getInstance(this.cache);
  }

  /**
   * Generate a cache key from endpoint and query parameters
   * Format: {endpoint}:{limit}:{cursor}
   * 
   * @example
   * getCacheKey('characters', { limit: 20, cursor: null })
   * // Returns: 'characters:20:null'
   */
  getCacheKey(endpoint: string, params: { limit?: number; cursor?: string | null }): string {
    const limit = params.limit || 20;
    // Notion cursors are base64 encoded and can contain '/', '+', '='.
    // Using encodeURIComponent is safer and more standard for URL components.
    const cursor = params.cursor ? encodeURIComponent(params.cursor) : 'null';
    return `${endpoint}:${limit}:${cursor}`;
  }

  /**
   * Get cached data by key
   */
  get<T = any>(key: string): T | null {
    try {
      const value = this.cache.get<T>(key);
      return value !== undefined ? value : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cache data with optional custom TTL
   */
  set<T = any>(key: string, value: T, ttl?: number): boolean {
    try {
      return this.cache.set(key, value, ttl || this.DEFAULT_TTL);
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Clear cache by pattern or all
   * @param pattern - Optional pattern to match keys (e.g., 'characters:*')
   */
  clear(pattern?: string): number {
    if (!pattern) {
      // Clear all - get count before flush
      const initialKeys = this.cache.keys().length;
      this.cache.flushAll();
      return initialKeys; // Return count of keys that were cleared
    }

    // Clear by pattern
    const keys = this.cache.keys();
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let cleared = 0;

    keys.forEach((key) => {
      if (regex.test(key)) {
        this.cache.del(key);
        cleared++;
      }
    });

    return cleared; // Correctly return the count of cleared keys
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const stats = this.cache.getStats();
    return {
      hits: stats.hits,
      misses: stats.misses,
      keys: stats.keys,
      ksize: stats.ksize,
      vsize: stats.vsize,
    };
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get TTL for a key (in seconds)
   */
  getTTL(key: string): number | undefined {
    const ttl = this.cache.getTtl(key);
    if (ttl) {
      // Convert from milliseconds to seconds
      return Math.floor((ttl - Date.now()) / 1000);
    }
    return undefined;
  }

  /**
   * Touch a key to reset its TTL
   * Note: node-cache doesn't have a touch method, so we re-set with current value
   */
  touch(key: string): boolean {
    const value = this.cache.get(key);
    if (value !== undefined) {
      return this.cache.set(key, value);
    }
    return false;
  }

  /**
   * Invalidate cache entries matching a pattern
   * @param pattern - Pattern to match keys (e.g., 'notion_characters_*')
   */
  invalidatePattern(pattern: string): number {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let deletedCount = 0;
    
    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.del(key);
        deletedCount++;
      }
    });
    
    return deletedCount;
  }

  /**
   * Get cache version for validation
   */
  getVersion(): string {
    return this.coordinator.getVersion();
  }

  /**
   * Validate client cache version
   */
  validateVersion(clientVersion: string): boolean {
    return this.coordinator.validateVersion(clientVersion);
  }

  /**
   * Invalidate entity and related caches
   */
  async invalidateEntity(entityType: string, entityId: string): Promise<void> {
    await this.coordinator.invalidateEntity(entityType, entityId);
  }

  /**
   * Invalidate related entities
   */
  async invalidateRelated(
    entityType: string,
    entityId: string,
    relatedEntities: Array<{ type: string; ids: string[] }>
  ): Promise<void> {
    await this.coordinator.invalidateRelated(entityType, entityId, relatedEntities);
  }

  /**
   * Get cache metadata for monitoring
   */
  getCacheMetadata() {
    return this.coordinator.getMetadata();
  }

  /**
   * Batch invalidate multiple entities
   */
  async batchInvalidate(
    invalidations: Array<{ entityType: string; entityId: string }>
  ): Promise<void> {
    await this.coordinator.batchInvalidate(invalidations);
  }

  /**
   * Get entity-specific version
   */
  getEntityVersion(entityType: string, entityId: string): string | undefined {
    return this.coordinator.getEntityVersion(entityType, entityId);
  }
}

// Singleton instance for application-wide caching
export const cacheService = new CacheService();