/**
 * Consolidated Filter Selectors Hook
 * 
 * Replaces 14+ individual useFilterStore subscriptions with a single subscription.
 * This significantly reduces re-renders in GraphView by subscribing once to all needed values.
 * 
 * @module hooks/useFilterSelectors
 * 
 * **Performance Optimization:**
 * - Before: 14 separate subscriptions = 14 potential re-render triggers
 * - After: 1 grouped subscription = 1 re-render trigger
 * - Uses shallow equality check to prevent unnecessary updates
 * 
 * **Pattern:**
 * Following React best practice of grouping related state subscriptions
 * to minimize component re-renders and improve performance.
 */

import { useFilterStore } from '@/stores/filterStore';
import { useShallow } from 'zustand/react/shallow';

/**
 * Consolidated filter state for graph rendering
 */
export interface FilterSelectors {
  // Search and selection
  searchTerm: string;
  selectedNodeId: string | null;
  
  // Graph filtering
  connectionDepth: number | null;
  
  // Entity visibility
  entityVisibility: {
    character: boolean;
    puzzle: boolean;
    element: boolean;
    timeline: boolean;
  };
  
  // Character filters
  characterSelectedTiers: Set<string>;
  characterType: 'all' | 'Player' | 'NPC';
  characterOwnershipStatus: Set<'Owned' | 'Accessible' | 'Shared' | 'Locked'>;
  characterHighlightShared: boolean;
  
  // Puzzle filters
  puzzleSelectedActs: Set<string>;
  puzzleCompletionStatus: 'all' | 'completed' | 'incomplete';
  
  // Content filters
  elementBasicTypes: Set<string>;
  elementStatus: Set<string>;
  elementContentStatus: Set<'draft' | 'review' | 'approved' | 'published'>;
  elementHasIssues: boolean | null;
  elementLastEditedRange: 'today' | 'week' | 'month' | 'all';
  
  // Actions (not part of filter state, but needed by GraphView)
  setSelectedNode: (nodeId: string | null) => void;
  hasActiveFilters: () => boolean;
}

/**
 * Hook to get all filter values with a single subscription.
 * Uses shallow equality to prevent unnecessary re-renders.
 * 
 * @returns {FilterSelectors} All filter values and actions needed by GraphView
 * 
 * @example
 * ```typescript
 * // Before (14+ subscriptions):
 * const searchTerm = useFilterStore(state => state.searchTerm);
 * const selectedNodeId = useFilterStore(state => state.selectedNodeId);
 * const focusedNodeId = useFilterStore(state => state.focusedNodeId);
 * // ... 11 more individual subscriptions
 * 
 * // After (1 subscription):
 * const filters = useFilterSelectors();
 * // Access as: filters.searchTerm, filters.selectedNodeId, etc.
 * ```
 * 
 * **Performance Impact:**
 * - Reduces selector evaluations by ~93% (from 14 to 1)
 * - Prevents cascading re-renders from multiple state changes
 * - Maintains same functionality with better performance
 */
export function useFilterSelectors(): FilterSelectors {
  return useFilterStore(useShallow((state) => ({
    // Search and selection
    searchTerm: state.searchTerm,
    selectedNodeId: state.selectedNodeId,
    
    // Graph filtering
    connectionDepth: state.connectionDepth,
    
    // Entity visibility
    entityVisibility: state.entityVisibility,
    
    // Character filters
    characterSelectedTiers: state.characterFilters.selectedTiers,
    characterType: state.characterFilters.characterType,
    characterOwnershipStatus: state.characterFilters.ownershipStatus,
    characterHighlightShared: state.characterFilters.highlightShared,
    
    // Puzzle filters
    puzzleSelectedActs: state.puzzleFilters.selectedActs,
    puzzleCompletionStatus: state.puzzleFilters.completionStatus,
    
    // Content filters
    elementBasicTypes: state.contentFilters.elementBasicTypes,
    elementStatus: state.contentFilters.elementStatus,
    elementContentStatus: state.contentFilters.contentStatus,
    elementHasIssues: state.contentFilters.hasIssues,
    elementLastEditedRange: state.contentFilters.lastEditedRange,
    
    // Actions
    setSelectedNode: state.setSelectedNode,
    hasActiveFilters: state.hasActiveFilters,
  })));
}

/**
 * Hook to get only the filter values (without actions).
 * Useful for hooks that only need to read filter state.
 * 
 * @returns Filter values without action functions
 */
export function useFilterValues() {
  return useFilterStore(useShallow((state) => ({
    searchTerm: state.searchTerm,
    selectedNodeId: state.selectedNodeId,
    connectionDepth: state.connectionDepth,
    entityVisibility: state.entityVisibility,
    characterSelectedTiers: state.characterFilters.selectedTiers,
    characterType: state.characterFilters.characterType,
    characterOwnershipStatus: state.characterFilters.ownershipStatus,
    characterHighlightShared: state.characterFilters.highlightShared,
    puzzleSelectedActs: state.puzzleFilters.selectedActs,
    puzzleCompletionStatus: state.puzzleFilters.completionStatus,
    elementBasicTypes: state.contentFilters.elementBasicTypes,
    elementStatus: state.contentFilters.elementStatus,
    elementContentStatus: state.contentFilters.contentStatus,
    elementHasIssues: state.contentFilters.hasIssues,
    elementLastEditedRange: state.contentFilters.lastEditedRange,
  })));
}

/**
 * Hook to get only the filter actions (without state).
 * Useful for components that only need to trigger filter changes.
 * 
 * @returns Filter action functions
 */
export function useFilterActions() {
  return useFilterStore(useShallow((state) => ({
    setSelectedNode: state.setSelectedNode,
    setSearchTerm: state.setSearchTerm,
    setConnectionDepth: state.setConnectionDepth,
    toggleEntityVisibility: state.toggleEntityVisibility,
    hasActiveFilters: state.hasActiveFilters,
  })));
}