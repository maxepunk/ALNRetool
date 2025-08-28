/**
 * Cache Synchronization Hook
 * 
 * Provides cache version synchronization between frontend and backend.
 * Monitors cache version changes and triggers necessary invalidations
 * to ensure data consistency across boundaries.
 * 
 * @module hooks/useCacheSync
 */

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cacheVersionManager } from '@/lib/cache/CacheVersionManager';

/**
 * Options for cache synchronization
 */
interface UseCacheSyncOptions {
  /**
   * Enable automatic version checking on interval
   */
  autoSync?: boolean;
  /**
   * Interval for automatic version checking (ms)
   * Default: 30000 (30 seconds)
   */
  syncInterval?: number;
  /**
   * Callback when version mismatch detected
   */
  onVersionMismatch?: (oldVersion: string | null, newVersion: string) => void;
  /**
   * Entity types to monitor for version changes
   */
  entityTypes?: string[];
}

/**
 * Hook for cache synchronization with backend
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { checkVersion, currentVersion, isStale } = useCacheSync({
 *     autoSync: true,
 *     syncInterval: 30000,
 *     onVersionMismatch: (oldVersion, newVersion) => {
 *       console.log('Cache version changed:', oldVersion, '->', newVersion);
 *     }
 *   });
 * 
 *   // Manually check version
 *   const handleRefresh = () => {
 *     checkVersion();
 *   };
 * }
 * ```
 */
export function useCacheSync(options: UseCacheSyncOptions = {}) {
  const {
    autoSync = false,
    syncInterval = 30000,
    onVersionMismatch,
    entityTypes = []
  } = options;

  const queryClient = useQueryClient();

  /**
   * Manually check cache version with backend
   * Makes a lightweight request to check version headers
   */
  const checkVersion = useCallback(async () => {
    try {
      // Make a lightweight request to check cache version
      const response = await fetch('/api/cache/version', {
        method: 'HEAD',
        headers: {
          'X-Client-Cache-Version': cacheVersionManager.getCurrentVersion() || ''
        }
      });

      // Process version headers
      const serverVersion = response.headers.get('X-Cache-Version');
      const clientVersion = cacheVersionManager.getCurrentVersion();

      if (serverVersion && serverVersion !== clientVersion) {
        console.debug(`[useCacheSync] Version mismatch detected: ${clientVersion} -> ${serverVersion}`);
        
        // Call the callback if provided
        onVersionMismatch?.(clientVersion, serverVersion);
        
        // The CacheVersionManager will handle invalidation
        // when it processes the headers
      }

      // Check entity-specific versions
      for (const entityType of entityTypes) {
        const entityVersionHeader = response.headers.get(`X-Entity-Version-${entityType}`);
        if (entityVersionHeader) {
          const currentEntityVersion = cacheVersionManager.getEntityVersion(entityType);
          if (currentEntityVersion && currentEntityVersion !== entityVersionHeader) {
            console.debug(`[useCacheSync] Entity version mismatch for ${entityType}: ${currentEntityVersion} -> ${entityVersionHeader}`);
            // CacheVersionManager handles the invalidation
          }
        }
      }
    } catch (error) {
      console.error('[useCacheSync] Failed to check cache version:', error);
    }
  }, [onVersionMismatch, entityTypes]);

  /**
   * Force invalidate all queries
   */
  const forceInvalidate = useCallback(() => {
    queryClient.invalidateQueries();
    cacheVersionManager.reset();
  }, [queryClient]);

  /**
   * Check if cache is potentially stale
   */
  const isStale = useCallback((): boolean => {
    const version = cacheVersionManager.getCurrentVersion();
    return version === null;
  }, []);

  // Set up automatic version checking
  useEffect(() => {
    if (!autoSync) return;

    const interval = setInterval(checkVersion, syncInterval);

    // Check immediately on mount
    checkVersion();

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, checkVersion]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.debug('[useCacheSync] Network reconnected, checking cache version');
      checkVersion();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [checkVersion]);

  // Listen for visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.debug('[useCacheSync] Tab became visible, checking cache version');
        checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkVersion]);

  return {
    /**
     * Current cache version
     */
    currentVersion: cacheVersionManager.getCurrentVersion(),
    /**
     * Manually check cache version
     */
    checkVersion,
    /**
     * Force invalidate all caches
     */
    forceInvalidate,
    /**
     * Check if cache is potentially stale
     */
    isStale: isStale(),
    /**
     * Get version for specific entity type
     */
    getEntityVersion: (entityType: string) => cacheVersionManager.getEntityVersion(entityType),
    /**
     * Check if a version is valid
     */
    isVersionValid: (version: string) => cacheVersionManager.isVersionValid(version),
  };
}

/**
 * Hook to use cache sync at app level
 * This is a convenience hook for app-wide cache synchronization
 */
export function useAppCacheSync() {
  return useCacheSync({
    autoSync: true,
    syncInterval: 30000, // Check every 30 seconds
    entityTypes: ['characters', 'elements', 'puzzles', 'timeline'],
    onVersionMismatch: (oldVersion, newVersion) => {
      console.log(`Cache version updated from ${oldVersion} to ${newVersion}`);
      // Could show a toast notification here
    }
  });
}