export const perfLog = {
  apiCalls: 0,
  cacheUpdates: 0,
  renders: new Map<string, number>(),
  
  reset() {
    this.apiCalls = 0;
    this.cacheUpdates = 0;
    this.renders.clear();
  },
  
  report() {
    // Performance metrics available via perfLog in window object
    return {
      apiCalls: this.apiCalls,
      cacheUpdates: this.cacheUpdates,
      renders: Object.fromEntries(this.renders)
    };
  }
};

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).perfLog = perfLog;
}