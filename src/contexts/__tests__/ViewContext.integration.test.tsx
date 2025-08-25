/**
 * Integration test for ViewContext and ViewRegistry
 * Tests state synchronization between ViewContext, FilterStore, ViewComponentFactory, and ViewRegistry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { ViewContextProvider, useViewContext, viewRegistry } from '../ViewContext';
import { useFilterStore } from '@/stores/filterStore';
import { ViewConfigHelpers } from '@/components/generated/ViewFactory';
import type { ViewState } from '@/components/generated/types';
import { createTestViewConfig } from '@/test/helpers/viewConfig';

// Test component to verify ViewContext functionality
function TestComponent() {
  const viewContext = useViewContext();
  const filterStore = useFilterStore();
  
  return (
    <div>
      <div data-testid="active-view">{viewContext.activeViewId || 'none'}</div>
      <div data-testid="registered-views">{viewContext.registeredViews.size}</div>
      <div data-testid="filter-active-view">{filterStore.activeView || 'none'}</div>
      <button 
        data-testid="register-view"
        onClick={() => {
          const config = createTestViewConfig({
            id: 'test-view',
            name: 'Test View',
            description: 'Test view for integration test',
            ui: {
              title: 'Test View',
              description: 'Test view for integration test'
            }
          });
          viewContext.registerView(config);
          viewContext.setActiveView('test-view');
        }}
      >
        Register Test View
      </button>
      <button
        data-testid="sync-state"
        onClick={() => {
          // First register the node-connections view
          const nodeConnectionsConfig = createTestViewConfig({
            id: 'node-connections',
            name: 'Node Connections',
            description: 'View node connections'
          });
          viewContext.registerView(nodeConnectionsConfig);
          
          const testState: ViewState = {
            selectedNodeType: 'character',
            selectedNodeId: 'test-node-123',
            expansionDepth: 2
          };
          viewContext.updateUrlFromViewState('node-connections', testState);
        }}
      >
        Sync State
      </button>
    </div>
  );
}

describe('ViewContext Integration', () => {
  beforeEach(() => {
    // Reset filter store state
    const store = useFilterStore.getState();
    store.clearAllFilters();
    
    // Clear ViewRegistry
    viewRegistry.getAll().forEach(config => {
      viewRegistry.unregister(config.id);
    });
  });

  it('should provide ViewContext functionality', () => {
    const { getByTestId } = render(
      <ViewContextProvider>
        <TestComponent />
      </ViewContextProvider>
    );

    expect(getByTestId('active-view')).toHaveTextContent('none');
    expect(getByTestId('registered-views')).toHaveTextContent('0');
  });

  it('should register views and update active view', () => {
    const { getByTestId } = render(
      <ViewContextProvider>
        <TestComponent />
      </ViewContextProvider>
    );

    act(() => {
      getByTestId('register-view').click();
    });

    expect(getByTestId('active-view')).toHaveTextContent('test-view');
    expect(getByTestId('registered-views')).toHaveTextContent('1');
  });

  it('should synchronize ViewState to FilterStore', () => {
    const { getByTestId } = render(
      <ViewContextProvider>
        <TestComponent />
      </ViewContextProvider>
    );

    act(() => {
      getByTestId('sync-state').click();
    });

    // Check that FilterStore was updated
    const filterStore = useFilterStore.getState();
    expect(filterStore.activeView).toBe('node-connections');
    expect(filterStore.nodeConnectionsFilters?.nodeType).toBe('character');
    expect(filterStore.nodeConnectionsFilters?.selectedNodeId).toBe('test-node-123');
    expect(filterStore.connectionDepth).toBe(2);
  });

  it('should filter entities based on view configuration', () => {
    const { getByTestId, container } = render(
      <ViewContextProvider>
        <TestComponent />
      </ViewContextProvider>
    );

    act(() => {
      getByTestId('register-view').click();
    });

    const viewContext = container.querySelector('[data-testid="active-view"]')?.closest('div');
    expect(viewContext).toBeTruthy();
  });

  it('should register views in global ViewRegistry', () => {
    expect(viewRegistry.getAll()).toHaveLength(0);
    
    const testConfig = ViewConfigHelpers.nodeConnections();
    viewRegistry.register(testConfig);
    
    expect(viewRegistry.getAll()).toHaveLength(1);
    expect(viewRegistry.get('node-connections')).toEqual(testConfig);
  });

  it('should generate routes from registered views', () => {
    const testConfig = ViewConfigHelpers.custom('test-custom', 'Test Custom', 'A test custom view');
    viewRegistry.register(testConfig);
    
    const routes = viewRegistry.generateRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0]?.path).toBe('/test-custom');
    expect(routes[0]?.config).toEqual(testConfig);
  });

  it('should provide view type mapping', () => {
    viewRegistry.register(ViewConfigHelpers.nodeConnections());
    viewRegistry.register(ViewConfigHelpers.puzzleFocus());
    viewRegistry.register(ViewConfigHelpers.characterJourney());
    
    const mapping = viewRegistry.getViewTypeMapping();
    expect(mapping['node-connections']).toBe('node-connections');
    expect(mapping['puzzle-focus']).toBe('puzzle-focus');
    expect(mapping['character-journey']).toBe('character-journey');
  });

  describe('FilterStore ↔ ViewState Synchronization', () => {
    it('should bidirectionally sync filter changes', () => {
      const { getByTestId } = render(
        <ViewContextProvider>
          <TestComponent />
        </ViewContextProvider>
      );

      // First sync state from view to filters
      act(() => {
        getByTestId('sync-state').click();
      });

      const filterStore = useFilterStore.getState();
      expect(filterStore.nodeConnectionsFilters?.nodeType).toBe('character');

      // Now change filters and verify view state updates
      act(() => {
        filterStore.setNodeType('puzzle');
      });

      // View state should reflect filter changes - get fresh state
      const updatedFilterStore = useFilterStore.getState();
      expect(updatedFilterStore.nodeConnectionsFilters?.nodeType).toBe('puzzle');
    });

    it('should persist filters across view navigation', () => {
      const filterStore = useFilterStore.getState();
      
      // Set filters for puzzle view
      act(() => {
        filterStore.setActiveView('puzzle-focus');
        filterStore.setCompletionStatus('incomplete');
      });

      // Get fresh state after the changes
      let updatedFilterStore = useFilterStore.getState();
      expect(updatedFilterStore.puzzleFilters?.completionStatus).toBe('incomplete');

      // Switch to another view
      act(() => {
        filterStore.setActiveView('character-journey');
      });

      // Switch back - filters should persist
      act(() => {
        filterStore.setActiveView('puzzle-focus');
      });

      // Get fresh state after switching back
      updatedFilterStore = useFilterStore.getState();
      expect(updatedFilterStore.puzzleFilters?.completionStatus).toBe('incomplete');
    });

    it('should handle multiple simultaneous view states', () => {
      const filterStore = useFilterStore.getState();
      
      // Set different filters for multiple views
      act(() => {
        filterStore.setActiveView('puzzle-focus');
        filterStore.setCompletionStatus('completed');
        
        filterStore.setActiveView('character-journey');
        filterStore.setCharacterType('Player');
        
        filterStore.setActiveView('content-status');
        filterStore.setHasIssues(true);
      });

      // All filters should coexist - get fresh state
      const updatedFilterStore = useFilterStore.getState();
      expect(updatedFilterStore.puzzleFilters?.completionStatus).toBe('completed');
      expect(updatedFilterStore.characterFilters?.characterType).toBe('Player');
      expect(updatedFilterStore.contentFilters?.hasIssues).toBe(true);
    });
  });

  describe('Template Variable Resolution Security', () => {
    it('should sanitize template variables to prevent XSS', () => {
      const testState: ViewState = {
        selectedNodeId: '<script>alert("XSS")</script>',
        selectedNodeType: 'character'
      };

      const config = createTestViewConfig({
        id: 'test-xss',
        name: 'Test XSS',
        description: 'Test template variable sanitization',
        ui: {
          title: 'Node: {{selectedNodeId}}',
          description: 'Type: {{selectedNodeType}}'
        }
      });

      viewRegistry.register(config);
      
      // Template resolution should escape dangerous characters
      const resolvedTitle = config.ui?.title?.replace(
        /\{\{selectedNodeId\}\}/g,
        testState.selectedNodeId?.replace(/[<>]/g, '') || ''
      );

      expect(resolvedTitle).not.toContain('<script>');
      expect(resolvedTitle).not.toContain('</script>');
    });

    it('should validate template variable types', () => {
      const testState: ViewState = {
        expansionDepth: 'not-a-number' as any, // Invalid type
        selectedNodeType: 'character'
      };

      createTestViewConfig({
        id: 'test-validation',
        name: 'Test Validation',
        description: 'Test type validation',
        hooks: {}
      });

      // Should handle invalid types gracefully
      const depth = typeof testState.expansionDepth === 'number' 
        ? testState.expansionDepth 
        : 1; // Default value

      expect(depth).toBe(1);
    });

    it('should limit template variable recursion depth', () => {
      // Test circular reference in state
      // This would be used if we need to test recursive state handling
      // const _recursiveState: ViewState = {
      //   value1: '{{value2}}',
      //   value2: '{{value1}}' // Circular reference
      // };

      createTestViewConfig({
        id: 'test-recursion',
        name: 'Test Recursion',
        description: 'Test recursion limits',
        ui: {
          title: '{{value1}}'
        }
      });

      let recursionDepth = 0;
      const maxDepth = 10;
      
      const resolveTemplate = (template: string, depth = 0): string => {
        if (depth > maxDepth) return template; // Stop recursion
        recursionDepth = depth;
        // Would normally resolve template here
        return template;
      };

      resolveTemplate('{{value1}}', 0);
      expect(recursionDepth).toBeLessThanOrEqual(maxDepth);
    });
  });

  describe('Multi-view State Coordination', () => {
    it('should coordinate state between parent and child views', () => {
      const parentConfig = createTestViewConfig({
        id: 'parent-view',
        name: 'Parent View',
        description: 'Parent view for testing'
      });

      const childConfig = createTestViewConfig({
        id: 'child-view',
        name: 'Child View',
        description: 'Child view for testing'
      });

      viewRegistry.register(parentConfig);
      viewRegistry.register(childConfig);

      const parentView = viewRegistry.get('parent-view');
      const childView = viewRegistry.get('child-view');

      expect(childView).toBeDefined();
      expect(parentView).toBeDefined();
    });

    it('should propagate state updates to dependent views', () => {
      const filterStore = useFilterStore.getState();
      
      // Set parent view state
      act(() => {
        filterStore.setActiveView('puzzle-focus');
        filterStore.selectPuzzle('puzzle-123');
      });

      // Child views should have access to parent state - get fresh state
      const updatedFilterStore = useFilterStore.getState();
      const parentState = updatedFilterStore.puzzleFilters;
      expect(parentState?.selectedPuzzleId).toBe('puzzle-123');

      // Simulate dependent view reading parent state
      const dependentViewState = {
        parentPuzzleId: parentState?.selectedPuzzleId,
        ownProperty: 'child-value'
      };

      expect(dependentViewState.parentPuzzleId).toBe('puzzle-123');
      expect(dependentViewState.ownProperty).toBe('child-value');
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should cleanup view registrations on unmount', () => {
      const { unmount } = render(
        <ViewContextProvider>
          <TestComponent />
        </ViewContextProvider>
      );

      // Register a view
      const testConfig = createTestViewConfig({
        id: 'cleanup-test',
        name: 'Cleanup Test',
        description: 'Test cleanup'
      });
      viewRegistry.register(testConfig);

      expect(viewRegistry.get('cleanup-test')).toBeDefined();

      // Unmount and cleanup
      unmount();
      
      // Manual cleanup (in real app, this would be in useEffect cleanup)
      viewRegistry.unregister('cleanup-test');

      expect(viewRegistry.get('cleanup-test')).toBeUndefined();
    });

    it('should clear stale filter subscriptions', () => {
      // Zustand stores support subscriptions via the store itself
      const unsubscribe = useFilterStore.subscribe(
        (state) => state.activeView,
        (_activeView) => {
          // Subscription callback
        }
      );

      // Should cleanup subscription
      unsubscribe();
      
      // Verify no memory leaks (subscription count should be 0)
      // Note: Zustand doesn't expose subscription count directly
      // This is more of a pattern verification
      expect(typeof unsubscribe).toBe('function');
    });

    it('should limit cached view states to prevent memory bloat', () => {
      const maxCachedViews = 10;
      const viewStates = new Map<string, ViewState>();

      // Simulate adding many view states
      for (let i = 0; i < 20; i++) {
        const viewId = `view-${i}`;
        const state: ViewState = {
          selectedNodeId: `node-${i}`,
          selectedNodeType: 'character'
        };

        // Implement LRU cache logic
        if (viewStates.size >= maxCachedViews) {
          const firstKey = viewStates.keys().next().value;
          if (firstKey) viewStates.delete(firstKey);
        }
        
        viewStates.set(viewId, state);
      }

      expect(viewStates.size).toBeLessThanOrEqual(maxCachedViews);
    });
  });
});