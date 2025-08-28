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
    console.log('=== Performance Report ===');
    console.log(`API Calls: ${this.apiCalls}`);
    console.log(`Cache Updates: ${this.cacheUpdates}`);
    console.log('Component Renders:', Object.fromEntries(this.renders));
  }
};

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).perfLog = perfLog;
}