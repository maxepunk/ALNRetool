/**
 * Frontend Cache Version Manager
 * 
 * Tracks cache versions from the backend and coordinates
 * invalidation with React Query when versions mismatch
 */

import { QueryClient } from '@tanstack/react-query';

export class CacheVersionManager {
  private static instance: CacheVersionManager;
  private currentVersion: string | null = null;
  private entityVersions: Map<string, string> = new Map();
  private queryClient: QueryClient | null = null;
  
  private constructor() {}
  
  static getInstance(): CacheVersionManager {
    if (!CacheVersionManager.instance) {
      CacheVersionManager.instance = new CacheVersionManager();
    }
    return CacheVersionManager.instance;
  }
  
  /**
   * Initialize with QueryClient
   */
  initialize(queryClient: QueryClient): void {
    this.queryClient = queryClient;
  }
  
  /**
   * Process cache version from response headers
   */
  processResponseHeaders(headers: Headers): void {
    const version = headers.get('X-Cache-Version');
    const entityVersion = headers.get('X-Entity-Version');
    const entityType = headers.get('X-Entity-Type');
    
    if (version && version !== this.currentVersion) {
      console.log(`[CacheVersionManager] Version changed: ${this.currentVersion} → ${version}`);
      this.handleVersionChange(this.currentVersion, version);
      this.currentVersion = version;
    }
    
    if (entityVersion && entityType) {
      const currentEntityVersion = this.entityVersions.get(entityType);
      if (currentEntityVersion && currentEntityVersion !== entityVersion) {
        console.log(`[CacheVersionManager] Entity version changed for ${entityType}: ${currentEntityVersion} → ${entityVersion}`);
        this.invalidateEntityQueries(entityType);
      }
      this.entityVersions.set(entityType, entityVersion);
    }
  }
  
  /**
   * Handle global version change
   */
  private handleVersionChange(oldVersion: string | null, _newVersion: string): void {
    if (!this.queryClient) return;
    
    // If this is not the first version we've seen, invalidate all queries
    if (oldVersion !== null) {
      console.log('[CacheVersionManager] Invalidating all queries due to version change');
      this.queryClient.invalidateQueries();
    }
  }
  
  /**
   * Invalidate queries for specific entity type
   */
  private invalidateEntityQueries(entityType: string): void {
    if (!this.queryClient) return;
    
    console.log(`[CacheVersionManager] Invalidating queries for ${entityType}`);
    this.queryClient.invalidateQueries({ queryKey: ['notion', entityType] });
    
    // Also invalidate related entity types
    switch (entityType) {
      case 'puzzles':
        this.queryClient.invalidateQueries({ queryKey: ['notion', 'elements'] });
        this.queryClient.invalidateQueries({ queryKey: ['notion', 'characters'] });
        break;
      case 'elements':
        this.queryClient.invalidateQueries({ queryKey: ['notion', 'puzzles'] });
        break;
      case 'characters':
        this.queryClient.invalidateQueries({ queryKey: ['notion', 'timeline'] });
        break;
    }
  }
  
  /**
   * Get current cache version
   */
  getCurrentVersion(): string | null {
    return this.currentVersion;
  }
  
  /**
   * Get entity-specific version
   */
  getEntityVersion(entityType: string): string | null {
    return this.entityVersions.get(entityType) || null;
  }
  
  /**
   * Check if version is valid
   */
  isVersionValid(version: string): boolean {
    return version === this.currentVersion;
  }
  
  /**
   * Reset all versions (for logout/refresh)
   */
  reset(): void {
    this.currentVersion = null;
    this.entityVersions.clear();
    if (this.queryClient) {
      this.queryClient.invalidateQueries();
    }
  }
  
  /**
   * Add version headers to request
   */
  getRequestHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.currentVersion) {
      headers['X-Client-Cache-Version'] = this.currentVersion;
    }
    
    return headers;
  }
}

export const cacheVersionManager = CacheVersionManager.getInstance();