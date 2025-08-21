/**
 * CacheCoordinator Service
 * 
 * Manages cache consistency across frontend and backend boundaries
 * - Version management for cache invalidation
 * - Atomic invalidation of related entities
 * - Cross-boundary synchronization
 */

import NodeCache from 'node-cache';
import crypto from 'crypto';

interface InvalidationEvent {
  type: 'entity' | 'related' | 'all';
  entityType: string;
  entityId?: string;
  relatedIds?: string[];
  timestamp: number;
  version: string;
}

interface CacheMetadata {
  version: string;
  lastInvalidation: number;
  invalidationCount: number;
  entityVersions: Map<string, string>;
}

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

  static getInstance(cache: NodeCache): CacheCoordinator {
    if (!CacheCoordinator.instance) {
      CacheCoordinator.instance = new CacheCoordinator(cache);
    }
    return CacheCoordinator.instance;
  }

  /**
   * Generate a unique version identifier
   */
  private generateVersion(): string {
    return crypto
      .createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 12);
  }

  /**
   * Invalidate a specific entity and all related caches
   */
  async invalidateEntity(entityType: string, entityId: string): Promise<void> {
    console.log(`[CacheCoordinator] Invalidating ${entityType}:${entityId}`);
    
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
   * Invalidate all related entities based on relationships
   */
  async invalidateRelated(
    entityType: string,
    entityId: string,
    relatedEntities: Array<{ type: string; ids: string[] }>
  ): Promise<void> {
    console.log(`[CacheCoordinator] Invalidating related entities for ${entityType}:${entityId}`);
    
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
   * Process a single invalidation event
   */
  private async processInvalidation(event: InvalidationEvent): Promise<void> {
    // Clear specific cache keys
    const keysToDelete: string[] = [];
    
    if (event.entityId) {
      // Specific entity
      keysToDelete.push(`${event.entityType}:${event.entityId}`);
      keysToDelete.push(`${event.entityType}:detail:${event.entityId}`);
    } else {
      // All entities of type
      const allKeys = this.cache.keys();
      keysToDelete.push(...allKeys.filter(key => key.startsWith(`${event.entityType}:`)));
    }
    
    // Delete from cache
    for (const key of keysToDelete) {
      this.cache.del(key);
      console.log(`[CacheCoordinator] Deleted cache key: ${key}`);
    }
  }

  /**
   * Get current cache version
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Get entity-specific version
   */
  getEntityVersion(entityType: string, entityId: string): string | undefined {
    return this.metadata.entityVersions.get(`${entityType}:${entityId}`);
  }

  /**
   * Validate client version against current version
   */
  validateVersion(clientVersion: string): boolean {
    return clientVersion === this.version;
  }

  /**
   * Validate entity-specific version
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
   * Get cache metadata for monitoring
   */
  getMetadata(): CacheMetadata {
    return {
      ...this.metadata,
      entityVersions: new Map(this.metadata.entityVersions)
    };
  }

  /**
   * Get invalidation history
   */
  getInvalidationHistory(limit: number = 100): InvalidationEvent[] {
    return this.invalidationQueue.slice(-limit);
  }

  /**
   * Clear all caches and reset version
   */
  async clearAll(): Promise<void> {
    console.log('[CacheCoordinator] Clearing all caches');
    
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
   * Invalidate cache for specific filters
   */
  async invalidateFilters(entityType: string, filters: Record<string, any>): Promise<void> {
    console.log(`[CacheCoordinator] Invalidating filtered cache for ${entityType}`, filters);
    
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
   * Batch invalidation for performance
   */
  async batchInvalidate(
    invalidations: Array<{ entityType: string; entityId: string }>
  ): Promise<void> {
    console.log(`[CacheCoordinator] Batch invalidating ${invalidations.length} entities`);
    
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
    console.log(`[CacheCoordinator] Batch invalidation completed in ${duration}ms`);
  }
}

export default CacheCoordinator;