/**
 * Tests for filterStore to verify search/selection/depth behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useFilterStore } from './filterStore';

describe('FilterStore - Selection and Depth Behavior', () => {
  beforeEach(() => {
    // Reset store to initial state
    useFilterStore.setState({
      searchTerm: '',
      selectedNodeId: null,
      connectionDepth: 3,
    });
  });

  it('should preserve connectionDepth when node is deselected', () => {
    // Set a custom depth
    useFilterStore.getState().setConnectionDepth(5);
    expect(useFilterStore.getState().connectionDepth).toBe(5);
    
    // Select a node
    useFilterStore.getState().setSelectedNode('node-1');
    expect(useFilterStore.getState().selectedNodeId).toBe('node-1');
    expect(useFilterStore.getState().connectionDepth).toBe(5); // Should still be 5
    
    // Deselect the node
    useFilterStore.getState().setSelectedNode(null);
    expect(useFilterStore.getState().selectedNodeId).toBe(null);
    expect(useFilterStore.getState().connectionDepth).toBe(5); // Should STILL be 5, not reset to 0
  });

  it('should preserve selectedNodeId when search is cleared', () => {
    // Select a node
    useFilterStore.getState().setSelectedNode('node-1');
    expect(useFilterStore.getState().selectedNodeId).toBe('node-1');
    
    // Set search term
    useFilterStore.getState().setSearchTerm('test search');
    expect(useFilterStore.getState().searchTerm).toBe('test search');
    expect(useFilterStore.getState().selectedNodeId).toBe('node-1'); // Should still be selected
    
    // Clear search
    useFilterStore.getState().clearSearch();
    expect(useFilterStore.getState().searchTerm).toBe('');
    expect(useFilterStore.getState().selectedNodeId).toBe('node-1'); // Should STILL be selected
  });

  it('should handle all three states independently', () => {
    // Set all three states
    useFilterStore.getState().setSearchTerm('search term');
    useFilterStore.getState().setSelectedNode('node-1');
    useFilterStore.getState().setConnectionDepth(7);
    
    // Verify all are set
    expect(useFilterStore.getState().searchTerm).toBe('search term');
    expect(useFilterStore.getState().selectedNodeId).toBe('node-1');
    expect(useFilterStore.getState().connectionDepth).toBe(7);
    
    // Clear search - should not affect others
    useFilterStore.getState().clearSearch();
    expect(useFilterStore.getState().searchTerm).toBe('');
    expect(useFilterStore.getState().selectedNodeId).toBe('node-1');
    expect(useFilterStore.getState().connectionDepth).toBe(7);
    
    // Deselect node - should not affect depth
    useFilterStore.getState().setSelectedNode(null);
    expect(useFilterStore.getState().searchTerm).toBe('');
    expect(useFilterStore.getState().selectedNodeId).toBe(null);
    expect(useFilterStore.getState().connectionDepth).toBe(7);
    
    // Change depth - should not affect others
    useFilterStore.getState().setConnectionDepth(3);
    expect(useFilterStore.getState().searchTerm).toBe('');
    expect(useFilterStore.getState().selectedNodeId).toBe(null);
    expect(useFilterStore.getState().connectionDepth).toBe(3);
  });
});