/**
 * Quick test script to verify filter synchronization
 * Run this in the browser console to test Zustand stores
 */

// Test filter store
const testFilterStore = () => {
  // Access the stores from window (they should be exposed in dev mode)
  const { useFilterStore, useUIStore, useGraphStore } = window as any;
  
  if (!useFilterStore) {
    console.error('Stores not found on window. Make sure you\'re in development mode.');
    return;
  }
  
  console.log('Testing Filter Store...');
  const filterState = useFilterStore.getState();
  console.log('Current filter state:', filterState);
  
  // Test setting search term
  console.log('Setting search term to "test"...');
  filterState.setSearchTerm('test');
  console.log('New search term:', useFilterStore.getState().searchTerm);
  
  // Test toggling acts
  console.log('Toggling Act 1...');
  filterState.toggleAct('Act 1');
  console.log('Selected acts:', Array.from(useFilterStore.getState().puzzleFilters.selectedActs));
  
  // Test character filters
  console.log('Testing character filters...');
  filterState.toggleTier('Core');
  console.log('Selected tiers:', Array.from(useFilterStore.getState().characterFilters.selectedTiers));
  
  // Test clearing filters
  console.log('Clearing all filters...');
  filterState.clearAllFilters();
  console.log('Filters after clear:', useFilterStore.getState());
  
  console.log('✅ Filter store test complete!');
};

// Test UI store
const testUIStore = () => {
  const { useUIStore } = window as any;
  
  if (!useUIStore) {
    console.error('UI Store not found');
    return;
  }
  
  console.log('Testing UI Store...');
  const uiState = useUIStore.getState();
  console.log('Current UI state:', uiState);
  
  // Test toggling sidebar
  console.log('Toggling sidebar...');
  uiState.toggleSidebar();
  console.log('Sidebar collapsed:', useUIStore.getState().sidebarCollapsed);
  
  // Test filter section toggle
  console.log('Toggling search section...');
  uiState.toggleFilterSection('search');
  console.log('Search expanded:', useUIStore.getState().filterSectionsExpanded.search);
  
  console.log('✅ UI store test complete!');
};

// Test graph store
const testGraphStore = () => {
  const { useGraphStore } = window as any;
  
  if (!useGraphStore) {
    console.error('Graph Store not found');
    return;
  }
  
  console.log('Testing Graph Store...');
  const graphState = useGraphStore.getState();
  console.log('Current graph state:', graphState);
  
  // Test zoom
  console.log('Testing zoom in...');
  graphState.zoomIn();
  console.log('Zoom level:', useGraphStore.getState().zoomLevel);
  
  // Test layout change
  console.log('Changing layout to force...');
  graphState.setLayoutAlgorithm('force');
  console.log('Layout algorithm:', useGraphStore.getState().layoutAlgorithm);
  
  console.log('✅ Graph store test complete!');
};

// Export for use
export { testFilterStore, testUIStore, testGraphStore };

// Instructions
console.log(`
To test filter synchronization, copy and paste these functions into the browser console:

1. Test filter store: testFilterStore()
2. Test UI store: testUIStore()  
3. Test graph store: testGraphStore()

Or run all tests:
testFilterStore(); testUIStore(); testGraphStore();
`);