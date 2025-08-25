/**
 * ViewCache
 * 
 * Performance optimization layer for view configurations.
 * Caches built graphs with TTL and invalidation support.
 */

import { log } from '@/utils/logger';
import type { GraphData } from '../types';
import type { ViewConfiguration, TemplateVariables } from './ViewConfiguration';

interface CacheEntry {
  data: GraphData;
  timestamp: number;
  ttl: number;
  hits: number;
}

export class ViewCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default
  private maxCacheSize = 50; // Maximum number of cached entries
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Generate cache key from configuration and variables
   */
  generateKey(
    config: ViewConfiguration,
    variables?: TemplateVariables
  ): string {
    const baseKey = config.performance?.cacheKey || config.id;
    const variableKey = variables 
      ? JSON.stringify(variables, Object.keys(variables).sort())
      : '';
    return `${baseKey}:${variableKey}`;
  }

  /**
   * Get cached graph data
   */
  get(
    config: ViewConfiguration,
    variables?: TemplateVariables
  ): GraphData | undefined {
    const key = this.generateKey(config, variables);
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if entry is expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      log.debug(`ViewCache: Entry expired for ${key}`);
      return undefined;
    }

    // Update hit count
    entry.hits++;
    
    log.debug(`ViewCache: Cache hit for ${key} (hits: ${entry.hits})`);
    return entry.data;
  }

  /**
   * Set cached graph data
   */
  set(
    config: ViewConfiguration,
    variables: TemplateVariables | undefined,
    data: GraphData
  ): void {
    const key = this.generateKey(config, variables);
    const ttl = config.performance?.cacheTTL || this.defaultTTL;

    // Check cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    };

    this.cache.set(key, entry);
    log.debug(`ViewCache: Cached ${key} with TTL ${ttl}ms`);
  }

  /**
   * Invalidate cache entry
   */
  invalidate(
    config: ViewConfiguration,
    variables?: TemplateVariables
  ): boolean {
    const key = this.generateKey(config, variables);
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      log.debug(`ViewCache: Invalidated ${key}`);
    }
    
    return deleted;
  }

  /**
   * Invalidate all entries for a configuration
   */
  invalidateConfig(configId: string): number {
    let count = 0;
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (key.startsWith(`${configId}:`)) {
        keysToDelete.push(key);
        count++;
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (count > 0) {
      log.info(`ViewCache: Invalidated ${count} entries for config ${configId}`);
    }
    
    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    log.info(`ViewCache: Cleared ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: Array<{
      key: string;
      age: number;
      hits: number;
      ttl: number;
    }>;
    totalHits: number;
    averageHits: number;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      hits: entry.hits,
      ttl: entry.ttl
    }));

    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);
    const averageHits = entries.length > 0 ? totalHits / entries.length : 0;

    return {
      size: this.cache.size,
      entries,
      totalHits,
      averageHits
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    this.cache.forEach((entry, key) => {
      const accessTime = entry.timestamp + (entry.hits * 60000); // Boost by hits
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      log.debug(`ViewCache: Evicted LRU entry ${oldestKey}`);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      log.debug(`ViewCache: Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    // Clean up every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Stop periodic cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }

  /**
   * Warm up cache with a graph
   */
  warmUp(
    config: ViewConfiguration,
    variables: TemplateVariables | undefined,
    data: GraphData
  ): void {
    this.set(config, variables, data);
    log.info(`ViewCache: Warmed up cache for ${config.id}`);
  }

  /**
   * Check if cache has valid entry
   */
  has(
    config: ViewConfiguration,
    variables?: TemplateVariables
  ): boolean {
    const data = this.get(config, variables);
    return data !== undefined;
  }
}