/**
 * CacheCoordinator Service
 * 
 * Manages cache consistency across frontend and backend boundaries.
 * Provides version-based cache invalidation and cross-boundary synchronization
 * to ensure data consistency when entities are updated.
 * 
 * @module server/services/CacheCoordinator
 * 
 * **Architecture:**
 * - Singleton pattern for global cache coordination
 * - Version management for cache invalidation
 * - Atomic invalidation of related entities
 * - Cross-boundary synchronization via headers
 * - Queue-based invalidation processing
 * 
 * **Features:**
 * - Entity-specific invalidation
 * - Related entity cascade invalidation
 * - Global cache clearing
 * - Version tracking per entity
 * - Invalidation event queue
 * 
 * **Usage:**
 * ```typescript
 * const coordinator = CacheCoordinator.getInstance(cache);
 * await coordinator.invalidateEntity('elements', 'element-123');
 * ```
 */

import NodeCache from 'node-cache';
import crypto from 'crypto';
import { log } from '../utils/logger.js';

/**
 * Represents a cache invalidation event.
 * @interface InvalidationEvent
 * 
 * @property {string} type - Type of invalidation (entity, related, all)
 * @property {string} entityType - Entity type being invalidated
 * @property {string} [entityId] - Specific entity ID
 * @property {string[]} [relatedIds] - Related entity IDs to invalidate
 * @property {number} timestamp - When invalidation occurred
 * @property {string} version - New version after invalidation
 */
interface InvalidationEvent {
  type: 'entity' | 'related' | 'all';
  entityType: string;
  entityId?: string;
  relatedIds?: string[];
  timestamp: number;
  version: string;
}

/**
 * Cache metadata for version tracking.
 * @interface CacheMetadata
 * 
 * @property {string} version - Global cache version
 * @property {number} lastInvalidation - Timestamp of last invalidation
 * @property {number} invalidationCount - Total invalidations performed
 * @property {Map} entityVersions - Per-entity version tracking
 */
interface CacheMetadata {
  version: string;
  lastInvalidation: number;
  invalidationCount: number;
  entityVersions: Map<string, string>;
}

/**
 * CacheCoordinator class - Singleton cache management service.
 * Coordinates cache invalidation across the application boundaries.
 * 
 * @class CacheCoordinator
 * @singleton
 * 
 * **Responsibilities:**
 * - Track cache versions globally and per-entity
 * - Process invalidation events atomically
 * - Maintain invalidation history
 * - Provide version headers for cross-boundary sync
 */
export class CacheCoordinator {
  private static instance: CacheCoordinator;
  private version: string;
  private metadata: CacheMetadata;
  private invalidationQueue: InvalidationEvent[] = [];
  private cache: NodeCache;

  private constructor(cache: NodeCache) {
    this.cache = cache;
    this.version = this.generateVersion();
    this.metadata = {
      version: this.version,
      lastInvalidation: Date.now(),
      invalidationCount: 0,
      entityVersions: new Map()
    };
  }

  /**
   * Get singleton instance of CacheCoordinator.
   * Creates instance on first call, returns existing instance on subsequent calls.
   * 
   * @static
   * @param {NodeCache} cache - NodeCache instance to coordinate
   * @returns {CacheCoordinator} Singleton instance
   * 
   * @example
   * const coordinator = CacheCoordinator.getInstance(cache);
   */
  static getInstance(cache: NodeCache): CacheCoordinator {
    if (!CacheCoordinator.instance) {
      CacheCoordinator.instance = new CacheCoordinator(cache);
    }
    return CacheCoordinator.instance;
  }

  /**
   * Generate a unique version identifier.
   * Uses SHA256 hash of timestamp and random value.
   * 
   * @private
   * @returns {string} 12-character version hash
   */
  private generateVersion(): string {
    return crypto
      .createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 12);
  }

  /**
   * Invalidate a specific entity and all related caches.
   * Creates invalidation event and updates version tracking.
   * 
   * @async
   * @param {string} entityType - Type of entity (elements, puzzles, etc.)
   * @param {string} entityId - Entity ID to invalidate
   * @returns {Promise<void>}
   * 
   * @example
   * await coordinator.invalidateEntity('elements', 'abc-123');
   */
  async invalidateEntity(entityType: string, entityId: string): Promise<void> {
    log.info('[CacheCoordinator] Invalidating entity', { entityType, entityId });
    
    // Create invalidation event
    const event: InvalidationEvent = {
      type: 'entity',
      entityType,
      entityId,
      timestamp: Date.now(),
      version: this.generateVersion()
    };
    
    // Queue the invalidation
    this.invalidationQueue.push(event);
    
    // Process invalidation
    await this.processInvalidation(event);
    
    // Update metadata
    this.metadata.lastInvalidation = Date.now();
    this.metadata.invalidationCount++;
    this.metadata.entityVersions.set(`${entityType}:${entityId}`, event.version);
    
    // Update global version
    this.version = this.generateVersion();
    this.metadata.version = this.version;
  }

  /**
   * Invalidate all related entities based on relationships.
   * Cascades invalidation to all connected entities.
   * 
   * @async
   * @param {string} entityType - Primary entity type
   * @param {string} entityId - Primary entity ID
   * @param {Array} relatedEntities - Related entities to invalidate
   * @returns {Promise<void>}
   * 
   * @example
   * await coordinator.invalidateRelated('puzzles', 'puzzle-1', [
   *   { type: 'elements', ids: ['elem-1', 'elem-2'] }
   * ]);
   */
  async invalidateRelated(
    entityType: string,
    entityId: string,
    relatedEntities: Array<{ type: string; ids: string[] }>
  ): Promise<void> {
    log.info('[CacheCoordinator] Invalidating related entities', { entityType, entityId, relatedEntities });
    
    const relatedIds: string[] = [];
    
    for (const related of relatedEntities) {
      for (const id of related.ids) {
        relatedIds.push(`${related.type}:${id}`);
        
        // Create individual invalidation events
        const event: InvalidationEvent = {
          type: 'related',
          entityType: related.type,
          entityId: id,
          timestamp: Date.now(),
          version: this.generateVersion()
        };
        
        this.invalidationQueue.push(event);
        await this.processInvalidation(event);
        
        // Update entity version
        this.metadata.entityVersions.set(`${related.type}:${id}`, event.version);
      }
    }
    
    // Update metadata
    this.metadata.lastInvalidation = Date.now();
    this.metadata.invalidationCount += relatedIds.length;
    
    // Update global version
    this.version = this.generateVersion();
    this.metadata.version = this.version;
  }

  /**
   * Process a single invalidation event.
   * Deletes cache keys matching the invalidation pattern.
   * 
   * @private
   * @async
   * @param {InvalidationEvent} event - Invalidation event to process
   * @returns {Promise<void>}
   * 
   * **Key Patterns:**
   * - Collection: `entityType:limit:cursor`
   * - Single: `entityType_entityId:limit:cursor`
   */
  private async processInvalidation(event: InvalidationEvent): Promise<void> {
    // Clear specific cache keys - must match getCacheKey format
    const keysToDelete: string[] = [];
    const allKeys = this.cache.keys();
    
    if (event.entityId) {
      // For specific entity, clear:
      // 1. Collection keys: entityType:*:* (e.g., "puzzles:20:null")
      // 2. Single entity keys: entityType_entityId:*:* (e.g., "puzzles_123:20:null")
      const entityPattern = new RegExp(`^${event.entityType}:`);
      const singleEntityPattern = new RegExp(`^${event.entityType}_${event.entityId}:`);
      
      for (const key of allKeys) {
        if (entityPattern.test(key) || singleEntityPattern.test(key)) {
          keysToDelete.push(key);
        }
      }
    } else {
      // All entities of type - clear all keys starting with entityType:
      const entityPattern = new RegExp(`^${event.entityType}:`);
      keysToDelete.push(...allKeys.filter(key => entityPattern.test(key)));
    }
    
    // Delete from cache
    for (const key of keysToDelete) {
      this.cache.del(key);
      log.debug('[CacheCoordinator] Deleted cache key', { key });
    }
  }

  /**
   * Get current global cache version.
   * Used for cross-boundary cache synchronization.
   * 
   * @returns {string} Current cache version
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Get entity-specific version.
   * Returns version for a specific entity if it has been invalidated.
   * 
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {string | undefined} Entity version or undefined
   */
  getEntityVersion(entityType: string, entityId: string): string | undefined {
    return this.metadata.entityVersions.get(`${entityType}:${entityId}`);
  }

  /**
   * Validate client version against current version.
   * Checks if client cache is still valid.
   * 
   * @param {string} clientVersion - Version from client
   * @returns {boolean} True if versions match
   */
  validateVersion(clientVersion: string): boolean {
    return clientVersion === this.version;
  }

  /**
   * Validate entity-specific version.
   * Checks if client's entity cache is still valid.
   * 
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {string} clientVersion - Client's entity version
   * @returns {boolean} True if versions match
   */
  validateEntityVersion(
    entityType: string,
    entityId: string,
    clientVersion: string
  ): boolean {
    const currentVersion = this.getEntityVersion(entityType, entityId);
    return currentVersion === clientVersion;
  }

  /**
   * Get cache metadata for monitoring.
   * Returns copy of metadata for inspection without mutation.
   * 
   * @returns {CacheMetadata} Cache metadata copy
   */
  getMetadata(): CacheMetadata {
    return {
      ...this.metadata,
      entityVersions: new Map(this.metadata.entityVersions)
    };
  }

  /**
   * Get invalidation history.
   * Returns recent invalidation events for debugging.
   * 
   * @param {number} [limit=100] - Maximum events to return
   * @returns {InvalidationEvent[]} Recent invalidation events
   */
  getInvalidationHistory(limit: number = 100): InvalidationEvent[] {
    return this.invalidationQueue.slice(-limit);
  }

  /**
   * Clear all caches and reset version.
   * Nuclear option - invalidates everything.
   * 
   * @async
   * @returns {Promise<void>}
   * 
   * **Effects:**
   * - Flushes all cache entries
   * - Resets version tracking
   * - Clears invalidation history
   * - Generates new global version
   */
  async clearAll(): Promise<void> {
    log.info('[CacheCoordinator] Clearing all caches');
    
    // Clear node-cache
    this.cache.flushAll();
    
    // Reset metadata
    this.version = this.generateVersion();
    this.metadata = {
      version: this.version,
      lastInvalidation: Date.now(),
      invalidationCount: 0,
      entityVersions: new Map()
    };
    
    // Clear invalidation queue
    this.invalidationQueue = [];
    
    // Create clear-all event
    const event: InvalidationEvent = {
      type: 'all',
      entityType: 'all',
      timestamp: Date.now(),
      version: this.version
    };
    
    this.invalidationQueue.push(event);
  }

  /**
   * Invalidate cache for specific filters.
   * Clears cached results for filtered queries.
   * 
   * @async
   * @param {string} entityType - Entity type
   * @param {Record<string, any>} filters - Filter parameters
   * @returns {Promise<void>}
   * 
   * @example
   * await coordinator.invalidateFilters('puzzles', { act: 'Act1' });
   */
  async invalidateFilters(entityType: string, filters: Record<string, any>): Promise<void> {
    log.info('[CacheCoordinator] Invalidating filtered cache', { entityType, filters });
    
    // Build filter key
    const filterKey = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
    
    const cacheKey = `${entityType}:filter:${filterKey}`;
    
    // Delete from cache
    this.cache.del(cacheKey);
    
    // Update version
    this.version = this.generateVersion();
    this.metadata.version = this.version;
    this.metadata.lastInvalidation = Date.now();
    this.metadata.invalidationCount++;
  }

  /**
   * Batch invalidation for performance.
   * Invalidates multiple entities in a single operation.
   * 
   * @async
   * @param {Array} invalidations - Array of entities to invalidate
   * @returns {Promise<void>}
   * 
   * **Performance:**
   * - More efficient than individual invalidations
   * - Single version update after all invalidations
   * - Reduces overhead for bulk operations
   * 
   * @example
   * await coordinator.batchInvalidate([
   *   { entityType: 'elements', entityId: 'elem-1' },
   *   { entityType: 'elements', entityId: 'elem-2' },
   *   { entityType: 'puzzles', entityId: 'puzzle-1' }
   * ]);
   */
  async batchInvalidate(
    invalidations: Array<{ entityType: string; entityId: string }>
  ): Promise<void> {
    log.info('[CacheCoordinator] Batch invalidating entities', { count: invalidations.length });
    
    const startTime = Date.now();
    
    for (const { entityType, entityId } of invalidations) {
      // Create invalidation event
      const event: InvalidationEvent = {
        type: 'entity',
        entityType,
        entityId,
        timestamp: Date.now(),
        version: this.generateVersion()
      };
      
      this.invalidationQueue.push(event);
      await this.processInvalidation(event);
      
      // Update entity version
      this.metadata.entityVersions.set(`${entityType}:${entityId}`, event.version);
    }
    
    // Update metadata
    this.metadata.lastInvalidation = Date.now();
    this.metadata.invalidationCount += invalidations.length;
    
    // Update global version
    this.version = this.generateVersion();
    this.metadata.version = this.version;
    
    const duration = Date.now() - startTime;
    log.info('[CacheCoordinator] Batch invalidation completed', { durationMs: duration });
  }
}

export default CacheCoordinator;