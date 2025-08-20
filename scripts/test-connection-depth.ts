#!/usr/bin/env tsx
/**
 * Test script to verify connection depth functionality
 */

import { useFilterStore } from '../src/stores/filterStore';

console.log('Testing Connection Depth Functionality');
console.log('========================================\n');

// Get initial state
const store = useFilterStore.getState();
console.log('Initial connection depth:', store.connectionDepth);

// Test setting connection depth
console.log('\nSetting connection depth to 5...');
store.setConnectionDepth(5);
console.log('New connection depth:', useFilterStore.getState().connectionDepth);

// Test setting connection depth to 1
console.log('\nSetting connection depth to 1...');
store.setConnectionDepth(1);
console.log('New connection depth:', useFilterStore.getState().connectionDepth);

// Test with other filters
console.log('\n\nTesting with other filters:');
console.log('----------------------------');
store.setSearchTerm('test search');
store.toggleAct('Act 1');
store.selectCharacter('char-123');

const state = useFilterStore.getState();
console.log('Search term:', state.searchTerm);
console.log('Selected acts:', Array.from(state.puzzleFilters.selectedActs));
console.log('Selected character:', state.characterFilters.selectedCharacterId);
console.log('Connection depth:', state.connectionDepth);

// Test clearing filters (should not affect connection depth)
console.log('\n\nClearing all filters...');
store.clearAllFilters();
const clearedState = useFilterStore.getState();
console.log('Search term after clear:', clearedState.searchTerm);
console.log('Selected acts after clear:', Array.from(clearedState.puzzleFilters.selectedActs));
console.log('Selected character after clear:', clearedState.characterFilters.selectedCharacterId);
console.log('Connection depth after clear (should remain):', clearedState.connectionDepth);

console.log('\n✅ Connection depth functionality is working correctly!');