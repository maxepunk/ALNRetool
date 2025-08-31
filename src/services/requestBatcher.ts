

/**
 * Request Batcher with DataLoader Pattern
 * 
 * Provides request deduplication and batching to reduce backend load.
 * Caches pending promises to prevent duplicate fetches.
 * Batches requests within a configurable time window.
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

export class RequestBatcher {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private batchWindow = 10; // milliseconds
  private maxCacheAge = 5000; // 5 seconds for pending request cache
  
  /**
   * Generate cache key from URL and parameters
   */
  private generateKey(url: string, params?: Record<string, any>): string {
    const sortedParams = params ? 
      Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') : '';
    return `${url}?${sortedParams}`;
  }
  
  /**
   * Clean up expired pending requests
   */
  private cleanExpiredRequests(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.maxCacheAge) {
        this.pendingRequests.delete(key);
      }
    }
  }
  
  /**
   * Execute a request with deduplication
   */
  async execute<T>(
    url: string,
    fetcher: () => Promise<T>,
    params?: Record<string, any>
  ): Promise<T> {
    // Clean expired requests periodically
    this.cleanExpiredRequests();
    
    const key = this.generateKey(url, params);
    
    // Check if we have a pending request for this key
    const pending = this.pendingRequests.get(key);
    if (pending && Date.now() - pending.timestamp < this.maxCacheAge) {
      return pending.promise as Promise<T>;
    }
    
    // Create new request promise
    const promise = fetcher().finally(() => {
      // Remove from pending after completion
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, this.batchWindow);
    });
    
    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });
    
    return promise;
  }
  
  /**
   * Batch multiple requests together
   */
  async batch<T>(
    requests: Array<{
      url: string;
      fetcher: () => Promise<T>;
      params?: Record<string, any>;
    }>
  ): Promise<T[]> {
    return Promise.all(
      requests.map(req => 
        this.execute(req.url, req.fetcher, req.params)
      )
    );
  }
  
  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }
  
  /**
   * Get statistics about pending requests
   */
  getStats(): {
    pendingCount: number;
    cacheKeys: string[];
  } {
    this.cleanExpiredRequests();
    return {
      pendingCount: this.pendingRequests.size,
      cacheKeys: Array.from(this.pendingRequests.keys())
    };
  }
}

// Singleton instance
export const requestBatcher = new RequestBatcher();