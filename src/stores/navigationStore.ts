/**
 * Navigation History Store
 * 
 * Manages navigation history for the graph visualization,
 * tracking visited nodes with back/forward functionality.
 * Persists to sessionStorage for maintaining history within a session.
 * 
 * @module stores/navigationStore
 */

import { create } from 'zustand';
import { useMemo } from 'react';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Represents a single navigation history item
 */
export interface NavigationItem {
  nodeId: string;
  nodeName: string;
  nodeType: 'character' | 'element' | 'puzzle' | 'timeline';
  timestamp: number;
}

/**
 * Navigation store state interface
 */
interface NavigationState {
  // State
  history: NavigationItem[];
  currentIndex: number;
  maxHistory: number;
  
  // Computed values (getters)
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  getCurrentNode: () => NavigationItem | null;
  getRecentNodes: (count: number) => NavigationItem[];
  getVisibleBreadcrumbs: () => NavigationItem[];
  
  // Actions
  pushNode: (item: Omit<NavigationItem, 'timestamp'>) => void;
  goBack: () => string | null;
  goForward: () => string | null;
  navigateToIndex: (index: number) => string | null;
  clearHistory: () => void;
  
  // Internal helpers
  _trimHistory: () => void;
}

/**
 * Main navigation history store with session persistence
 */
export const useNavigationStore = create<NavigationState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        history: [],
        currentIndex: -1,
        maxHistory: 50,
        
        // Computed values
        canGoBack: () => {
          const state = get();
          return state.currentIndex > 0;
        },
        
        canGoForward: () => {
          const state = get();
          return state.currentIndex < state.history.length - 1;
        },
        
        getCurrentNode: () => {
          const state = get();
          if (state.currentIndex >= 0 && state.currentIndex < state.history.length) {
            return state.history[state.currentIndex] || null;
          }
          return null;
        },
        
        getRecentNodes: (count: number) => {
          const state = get();
          const startIndex = Math.max(0, state.currentIndex - count + 1);
          const endIndex = state.currentIndex + 1;
          return state.history.slice(startIndex, endIndex);
        },
        
        getVisibleBreadcrumbs: () => {
          const state = get();
          // Show last 5 nodes in the breadcrumb trail
          const maxVisible = 5;
          const startIndex = Math.max(0, state.currentIndex - maxVisible + 1);
          const endIndex = state.currentIndex + 1;
          return state.history.slice(startIndex, endIndex);
        },
        
        // Actions
        pushNode: (item) => {
          set((state) => {
            // Don't add duplicate consecutive entries
            const currentNode = state.getCurrentNode();
            if (currentNode && currentNode.nodeId === item.nodeId) {
              return state;
            }
            
            // When navigating to a new node, clear forward history
            const newHistory = state.history.slice(0, state.currentIndex + 1);
            
            // Add new item with timestamp
            const newItem: NavigationItem = {
              ...item,
              timestamp: Date.now(),
            };
            
            newHistory.push(newItem);
            
            // Trim if exceeds max
            if (newHistory.length > state.maxHistory) {
              newHistory.shift(); // Remove oldest
              return {
                history: newHistory,
                currentIndex: newHistory.length - 1,
              };
            }
            
            return {
              history: newHistory,
              currentIndex: newHistory.length - 1,
            };
          });
        },
        
        goBack: () => {
          const state = get();
          if (!state.canGoBack()) {
            return null;
          }
          
          const newIndex = state.currentIndex - 1;
          set({ currentIndex: newIndex });
          
          const node = state.history[newIndex];
          return node ? node.nodeId : null;
        },
        
        goForward: () => {
          const state = get();
          if (!state.canGoForward()) {
            return null;
          }
          
          const newIndex = state.currentIndex + 1;
          set({ currentIndex: newIndex });
          
          const node = state.history[newIndex];
          return node ? node.nodeId : null;
        },
        
        navigateToIndex: (index) => {
          const state = get();
          if (index < 0 || index >= state.history.length) {
            return null;
          }
          
          set({ currentIndex: index });
          const node = state.history[index];
          return node ? node.nodeId : null;
        },
        
        clearHistory: () => {
          set({
            history: [],
            currentIndex: -1,
          });
        },
        
        _trimHistory: () => {
          set((state) => {
            if (state.history.length <= state.maxHistory) {
              return state;
            }
            
            const trimCount = state.history.length - state.maxHistory;
            return {
              history: state.history.slice(trimCount),
              currentIndex: Math.max(0, state.currentIndex - trimCount),
            };
          });
        },
      }),
      {
        name: 'navigation-history',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          history: state.history,
          currentIndex: state.currentIndex,
        }),
      }
    )
  )
);

// Selector hooks for common use cases
export const useCanGoBack = () => useNavigationStore((state) => state.canGoBack());
export const useCanGoForward = () => useNavigationStore((state) => state.canGoForward());
export const useCurrentNode = () => useNavigationStore((state) => state.getCurrentNode());
export const useNavigationHistory = () => useNavigationStore((state) => state.history);

// Selector hook that properly memoizes the result to prevent infinite loops
export const useVisibleBreadcrumbs = () => {
  const history = useNavigationStore((state) => state.history);
  const currentIndex = useNavigationStore((state) => state.currentIndex);
  
  // Use React.useMemo to only recalculate when history or currentIndex changes
  // This prevents creating a new array reference on every render
  return useMemo(() => {
    const maxVisible = 5;
    const startIndex = Math.max(0, currentIndex - maxVisible + 1);
    const endIndex = currentIndex + 1;
    return history.slice(startIndex, endIndex);
  }, [history, currentIndex]);
};