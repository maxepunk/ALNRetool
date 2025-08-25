/**
 * Filter Store - Core filtering logic for the entire application
 * 
 * Manages all filter state including search, acts, puzzles, characters, and view-specific filters.
 * Persists to sessionStorage for maintaining state across page refreshes.
 * Provides route-aware filter presets and computed values.
 * 
 * @module stores/filterStore
 * 
 * **Architecture:**
 * - Zustand store with persistence middleware
 * - Session storage for cross-refresh state
 * - URL synchronization for shareable filters
 * - View-specific filter segregation
 * - Computed values for filter status
 * 
 * **Features:**
 * - Universal search across all entities
 * - View-specific filter sets
 * - Connection depth control for graph
 * - Filter presets for common queries
 * - Active filter counting and display
 * - URL state synchronization
 * 
 * **Performance:**
 * - Memoized computed values
 * - Selective re-renders via subscribeWithSelector
 * - Batched state updates
 * 
 * **Usage:**
 * ```typescript
 * const { searchTerm, setSearchTerm } = useFilterStore();
 * const hasFilters = useFilterStore(state => state.hasActiveFilters());
 * const puzzleFilters = useFilterStore(state => state.puzzleFilters);
 * ```
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { urlToFilterState, filterStateToUrl, updateBrowserUrl } from '@/utils/urlState';

/**
 * Puzzle-specific filter configuration.
 * @interface PuzzleFilters
 * 
 * @property {Set<string>} selectedActs - Active act filters (Act1, Act2, etc.)
 * @property {string|null} selectedPuzzleId - Currently focused puzzle ID
 * @property {'all'|'completed'|'incomplete'} completionStatus - Completion filter
 */
export interface PuzzleFilters {
  selectedActs: Set<string>;
  selectedPuzzleId: string | null;
  completionStatus: 'all' | 'completed' | 'incomplete';
}

/**
 * Character-specific filter configuration.
 * @interface CharacterFilters
 * 
 * @property {Set} selectedTiers - Character tier filters (Core/Secondary/Tertiary)
 * @property {Set} ownershipStatus - Ownership status filters
 * @property {'all'|'Player'|'NPC'} characterType - Character type filter
 * @property {string|null} selectedCharacterId - Currently focused character
 * @property {boolean} highlightShared - Highlight shared ownership elements
 */
export interface CharacterFilters {
  selectedTiers: Set<'Core' | 'Secondary' | 'Tertiary'>;
  ownershipStatus: Set<'Owned' | 'Accessible' | 'Shared' | 'Locked'>;
  characterType: 'all' | 'Player' | 'NPC';
  selectedCharacterId: string | null;
  highlightShared: boolean;
}

/**
 * Content status filter configuration.
 * @interface ContentFilters
 * 
 * @property {Set} contentStatus - Content workflow status filters
 * @property {boolean|null} hasIssues - Filter for content with issues
 * @property {'today'|'week'|'month'|'all'} lastEditedRange - Time range filter
 */
export interface ContentFilters {
  contentStatus: Set<'draft' | 'review' | 'approved' | 'published'>;
  hasIssues: boolean | null;
  lastEditedRange: 'today' | 'week' | 'month' | 'all';
}

/**
 * Node connections view filter configuration.
 * @interface NodeConnectionsFilters
 * 
 * @property {'character'|'puzzle'|'element'|'timeline'} nodeType - Node type focus
 * @property {string|null} selectedNodeId - Selected node for connection analysis
 */
export interface NodeConnectionsFilters {
  nodeType: 'character' | 'puzzle' | 'element' | 'timeline';
  selectedNodeId: string | null;
}

/**
 * Complete filter state interface.
 * @interface FilterState
 * 
 * @property {string} searchTerm - Universal search term
 * @property {number} connectionDepth - Graph traversal depth (hops)
 * @property {PuzzleFilters} puzzleFilters - Puzzle view filters
 * @property {CharacterFilters} characterFilters - Character view filters
 * @property {ContentFilters} contentFilters - Content status filters
 * @property {NodeConnectionsFilters|null} nodeConnectionsFilters - Node analysis filters
 * @property {string|null} activeView - Currently active view for context
 */
export interface FilterState {
  // Universal filters
  searchTerm: string;
  
  // Graph view settings (universal across views)
  connectionDepth: number;
  
  // View-specific filters
  puzzleFilters: PuzzleFilters;
  characterFilters: CharacterFilters;
  contentFilters: ContentFilters;
  nodeConnectionsFilters: NodeConnectionsFilters | null;
  
  // Current active view (for route-aware filtering)
  activeView: 'puzzle-focus' | 'character-journey' | 'content-status' | 'node-connections' | 'timeline' | 'full-network' | null;
}

/**
 * Filter action methods interface.
 * All methods for manipulating filter state.
 * @interface FilterActions
 */
export interface FilterActions {
  // Universal filter actions
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  
  // Graph view settings actions
  setConnectionDepth: (depth: number) => void;
  
  // Puzzle filter actions
  toggleAct: (act: string) => void;
  selectPuzzle: (puzzleId: string | null) => void;
  setCompletionStatus: (status: 'all' | 'completed' | 'incomplete') => void;
  clearPuzzleFilters: () => void;
  
  // Character filter actions
  toggleTier: (tier: 'Core' | 'Secondary' | 'Tertiary') => void;
  toggleOwnership: (status: 'Owned' | 'Accessible' | 'Shared' | 'Locked') => void;
  setCharacterType: (type: 'all' | 'Player' | 'NPC') => void;
  selectCharacter: (characterId: string | null) => void;
  setHighlightShared: (highlight: boolean) => void;
  clearCharacterFilters: () => void;
  
  // Content filter actions
  toggleContentStatus: (status: 'draft' | 'review' | 'approved' | 'published') => void;
  setHasIssues: (hasIssues: boolean | null) => void;
  setLastEditedRange: (range: 'today' | 'week' | 'month' | 'all') => void;
  clearContentFilters: () => void;
  
  // Node connections filter actions
  setNodeType: (type: 'character' | 'puzzle' | 'element' | 'timeline') => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  clearNodeConnectionsFilters: () => void;
  
  // View management
  setActiveView: (view: 'puzzle-focus' | 'character-journey' | 'content-status' | 'node-connections' | 'timeline' | 'full-network' | null) => void;
  
  // Global actions
  clearAllFilters: () => void;
  applyPreset: (preset: 'recent' | 'my-work' | 'needs-review' | 'critical-path') => void;
  
  // URL-driven state management (Phase 2)
  hydrateFromUrl: (urlParams: URLSearchParams) => void;
  syncToUrl: (replace?: boolean) => void;
  getUrlParams: () => URLSearchParams;
  
  // Generic filter methods (for new generic FilterPanel)
  getFilter: (key: string) => any;
  setFilter: (key: string, value: any) => void;
}

/**
 * Computed filter values interface.
 * Methods that derive information from filter state.
 * @interface FilterComputedValues
 * 
 * @property {Function} hasActiveFilters - Check if any filters are active
 * @property {Function} activeFilterCount - Count total active filters
 * @property {Function} getActiveFiltersForView - Get filter descriptions for current view
 */
export interface FilterComputedValues {
  hasActiveFilters: () => boolean;
  activeFilterCount: () => number;
  getActiveFiltersForView: () => string[];
}

/**
 * Complete filter store type combining state, actions, and computed values.
 * @typedef {FilterState & FilterActions & FilterComputedValues} FilterStore
 */
type FilterStore = FilterState & FilterActions & FilterComputedValues;

/**
 * Main filter store with persistence and computed values.
 * Uses Zustand with persistence middleware for session storage.
 * 
 * @constant useFilterStore
 * @type {StoreApi<FilterStore>}
 * 
 * **Persistence:**
 * - Stored in sessionStorage as 'aln-filter-store'
 * - Survives page refreshes within session
 * - Cleared on browser/tab close
 * 
 * **Performance Optimizations:**
 * - subscribeWithSelector for granular subscriptions
 * - Computed values prevent unnecessary recalculations
 * - Set operations for efficient collection management
 * 
 * @example
 * // Basic usage
 * const searchTerm = useFilterStore(state => state.searchTerm);
 * const setSearchTerm = useFilterStore(state => state.setSearchTerm);
 * 
 * // Computed values
 * const hasFilters = useFilterStore(state => state.hasActiveFilters());
 * 
 * // Selective subscription
 * const puzzleActs = useFilterStore(
 *   state => state.puzzleFilters.selectedActs,
 *   shallow
 * );
 */
export const useFilterStore = create<FilterStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        searchTerm: '',
        connectionDepth: 3, // Default to 3 hops
        puzzleFilters: {
          selectedActs: new Set(),
          selectedPuzzleId: null,
          completionStatus: 'all',
        },
        characterFilters: {
          selectedTiers: new Set(),
          ownershipStatus: new Set(),
          characterType: 'all',
          selectedCharacterId: null,
          highlightShared: false,
        },
        contentFilters: {
          contentStatus: new Set(),
          hasIssues: null,
          lastEditedRange: 'all',
        },
        nodeConnectionsFilters: null,
        activeView: null,

        // Universal filter actions
        setSearchTerm: (term) => set({ searchTerm: term }),
        clearSearch: () => set({ searchTerm: '' }),

        // Graph view settings actions
        setConnectionDepth: (depth) => set({ connectionDepth: depth }),

        // Puzzle filter actions
        toggleAct: (act) => set((state) => {
          const newActs = new Set(state.puzzleFilters.selectedActs);
          if (newActs.has(act)) {
            newActs.delete(act);
          } else {
            newActs.add(act);
          }
          return {
            puzzleFilters: { ...state.puzzleFilters, selectedActs: newActs }
          };
        }),
        selectPuzzle: (puzzleId) => set((state) => ({
          puzzleFilters: { ...state.puzzleFilters, selectedPuzzleId: puzzleId }
        })),
        setCompletionStatus: (status) => set((state) => ({
          puzzleFilters: { ...state.puzzleFilters, completionStatus: status }
        })),
        clearPuzzleFilters: () => set(() => ({
          puzzleFilters: {
            selectedActs: new Set(),
            selectedPuzzleId: null,
            completionStatus: 'all',
          }
        })),        // Character filter actions
        toggleTier: (tier) => set((state) => {
          const newTiers = new Set(state.characterFilters.selectedTiers);
          if (newTiers.has(tier)) {
            newTiers.delete(tier);
          } else {
            newTiers.add(tier);
          }
          return {
            characterFilters: { ...state.characterFilters, selectedTiers: newTiers }
          };
        }),
        toggleOwnership: (status) => set((state) => {
          const newStatus = new Set(state.characterFilters.ownershipStatus);
          if (newStatus.has(status)) {
            newStatus.delete(status);
          } else {
            newStatus.add(status);
          }
          return {
            characterFilters: { ...state.characterFilters, ownershipStatus: newStatus }
          };
        }),
        setCharacterType: (type) => set((state) => ({
          characterFilters: { ...state.characterFilters, characterType: type }
        })),
        selectCharacter: (characterId) => set((state) => ({
          characterFilters: { ...state.characterFilters, selectedCharacterId: characterId }
        })),
        setHighlightShared: (highlight) => set((state) => ({
          characterFilters: { ...state.characterFilters, highlightShared: highlight }
        })),
        clearCharacterFilters: () => set(() => ({
          characterFilters: {
            selectedTiers: new Set(),
            ownershipStatus: new Set(),
            characterType: 'all',
            selectedCharacterId: null,
            highlightShared: false,
          }
        })),        // Content filter actions
        toggleContentStatus: (status) => set((state) => {
          const newStatus = new Set(state.contentFilters.contentStatus);
          if (newStatus.has(status)) {
            newStatus.delete(status);
          } else {
            newStatus.add(status);
          }
          return {
            contentFilters: { ...state.contentFilters, contentStatus: newStatus }
          };
        }),
        setHasIssues: (hasIssues) => set((state) => ({
          contentFilters: { ...state.contentFilters, hasIssues }
        })),
        setLastEditedRange: (range) => set((state) => ({
          contentFilters: { ...state.contentFilters, lastEditedRange: range }
        })),
        clearContentFilters: () => set(() => ({
          contentFilters: {
            contentStatus: new Set(),
            hasIssues: null,
            lastEditedRange: 'all',
          }
        })),

        // Node connections filter actions
        setNodeType: (type) => set((state) => ({
          nodeConnectionsFilters: {
            ...(state.nodeConnectionsFilters || { selectedNodeId: null }),
            nodeType: type
          }
        })),
        setSelectedNodeId: (nodeId) => set((state) => ({
          nodeConnectionsFilters: {
            ...(state.nodeConnectionsFilters || { nodeType: 'character' }),
            selectedNodeId: nodeId
          }
        })),
        clearNodeConnectionsFilters: () => set({ nodeConnectionsFilters: null }),

        // View management
        setActiveView: (view) => set({ activeView: view }),

        // Global actions
        clearAllFilters: () => set({
          searchTerm: '',
          puzzleFilters: {
            selectedActs: new Set(),
            selectedPuzzleId: null,
            completionStatus: 'all',
          },
          characterFilters: {
            selectedTiers: new Set(),
            ownershipStatus: new Set(),
            characterType: 'all',
            selectedCharacterId: null,
            highlightShared: false,
          },
          contentFilters: {
            contentStatus: new Set(),
            hasIssues: null,
            lastEditedRange: 'all',
          },
          nodeConnectionsFilters: null
        }),        // Apply preset filters
        applyPreset: (preset) => {
          switch (preset) {
            case 'recent':
              set({
                searchTerm: '',
                contentFilters: {
                  ...get().contentFilters,
                  lastEditedRange: 'week'
                }
              });
              break;
            case 'my-work':
              // This would need user context to filter properly
              set({
                characterFilters: {
                  ...get().characterFilters,
                  ownershipStatus: new Set(['Owned'])
                }
              });
              break;
            case 'needs-review':
              set({
                contentFilters: {
                  ...get().contentFilters,
                  contentStatus: new Set(['review']),
                  hasIssues: true
                }
              });
              break;
            case 'critical-path':
              set({
                puzzleFilters: {
                  ...get().puzzleFilters,
                  selectedActs: new Set(['Act 0', 'Act 1'])
                }
              });
              break;
          }
        },
        
        // URL-driven state management (Phase 2)
        hydrateFromUrl: (urlParams) => {
          const urlState = urlToFilterState(urlParams);
          
          // Merge URL state with current state, giving URL precedence
          const currentState = get();
          const mergedState = { ...currentState };
          
          // Apply URL state with validation
          if (urlState.searchTerm !== undefined) {
            mergedState.searchTerm = urlState.searchTerm;
          }
          
          if (urlState.connectionDepth !== undefined) {
            mergedState.connectionDepth = urlState.connectionDepth;
          }
          
          if (urlState.activeView !== undefined) {
            mergedState.activeView = urlState.activeView;
          }
          
          // Merge puzzle filters
          if (urlState.puzzleFilters) {
            mergedState.puzzleFilters = {
              ...currentState.puzzleFilters,
              ...urlState.puzzleFilters
            };
          }
          
          // Merge character filters
          if (urlState.characterFilters) {
            mergedState.characterFilters = {
              ...currentState.characterFilters,
              ...urlState.characterFilters
            };
          }
          
          // Merge content filters
          if (urlState.contentFilters) {
            mergedState.contentFilters = {
              ...currentState.contentFilters,
              ...urlState.contentFilters
            };
          }
          
          // Set node connections filters
          if (urlState.nodeConnectionsFilters) {
            mergedState.nodeConnectionsFilters = urlState.nodeConnectionsFilters;
          }
          
          // Apply the merged state
          set(mergedState);
        },
        
        syncToUrl: (replace = false) => {
          const state = get();
          updateBrowserUrl(state, replace);
        },
        
        getUrlParams: () => {
          const state = get();
          return filterStateToUrl(state);
        },
        
        // Generic filter methods (for new generic FilterPanel)
        getFilter: (key: string) => {
          const state = get();
          switch (key) {
            // Character filters
            case 'tiers':
              return Array.from(state.characterFilters.selectedTiers);
            case 'characterTypes':
              return state.characterFilters.characterType;
            
            // Puzzle filters  
            case 'acts':
              return Array.from(state.puzzleFilters.selectedActs);
            case 'completionStatus':
              return state.puzzleFilters.completionStatus;
              
            // Graph depth
            case 'depth':
              return state.connectionDepth;
              
            // Search
            case 'search':
              return state.searchTerm;
              
            default:
              return null;
          }
        },
        
        setFilter: (key: string, value: any) => {
          const state = get();
          switch (key) {
            // Character filters
            case 'tiers':
              if (Array.isArray(value)) {
                set({
                  characterFilters: {
                    ...state.characterFilters,
                    selectedTiers: new Set(value)
                  }
                });
              }
              break;
              
            case 'characterTypes':
              if (typeof value === 'string') {
                set({
                  characterFilters: {
                    ...state.characterFilters,
                    characterType: value as 'all' | 'Player' | 'NPC'
                  }
                });
              }
              break;
            
            // Puzzle filters
            case 'acts':
              if (Array.isArray(value)) {
                set({
                  puzzleFilters: {
                    ...state.puzzleFilters,
                    selectedActs: new Set(value)
                  }
                });
              }
              break;
              
            case 'completionStatus':
              if (typeof value === 'string') {
                set({
                  puzzleFilters: {
                    ...state.puzzleFilters,
                    completionStatus: value as 'all' | 'completed' | 'incomplete'
                  }
                });
              }
              break;
              
            case 'depth':
              if (typeof value === 'number') {
                set({ connectionDepth: value });
              }
              break;
              
            // Search
            case 'search':
              if (typeof value === 'string') {
                set({ searchTerm: value });
              }
              break;
              
            default:
              console.warn(`Unknown filter key: ${key}`);
              break;
          }
        },
        
        // Computed values
        hasActiveFilters: () => {
          const state = get();
          return !!(
            state.searchTerm ||
            state.puzzleFilters.selectedActs.size > 0 ||
            state.puzzleFilters.selectedPuzzleId ||
            state.puzzleFilters.completionStatus !== 'all' ||
            state.characterFilters.selectedTiers.size > 0 ||
            state.characterFilters.ownershipStatus.size > 0 ||
            state.characterFilters.characterType !== 'all' ||
            state.characterFilters.selectedCharacterId ||
            state.characterFilters.highlightShared ||
            state.contentFilters.contentStatus.size > 0 ||
            state.contentFilters.hasIssues !== null ||
            state.contentFilters.lastEditedRange !== 'all' ||
            state.nodeConnectionsFilters?.selectedNodeId
          );
        },

        activeFilterCount: () => {
          const state = get();
          let count = 0;
          
          if (state.searchTerm) count++;
          count += state.puzzleFilters.selectedActs.size;
          if (state.puzzleFilters.selectedPuzzleId) count++;
          if (state.puzzleFilters.completionStatus !== 'all') count++;
          count += state.characterFilters.selectedTiers.size;
          count += state.characterFilters.ownershipStatus.size;
          if (state.characterFilters.characterType !== 'all') count++;
          if (state.characterFilters.selectedCharacterId) count++;
          if (state.characterFilters.highlightShared) count++;
          count += state.contentFilters.contentStatus.size;
          if (state.contentFilters.hasIssues !== null) count++;
          if (state.contentFilters.lastEditedRange !== 'all') count++;
          if (state.nodeConnectionsFilters?.selectedNodeId) count++;
          
          return count;
        },        getActiveFiltersForView: () => {
          const state = get();
          const filters: string[] = [];
          
          // Always include search if active
          if (state.searchTerm) {
            filters.push(`Search: ${state.searchTerm}`);
          }
          
          // Add view-specific filters based on activeView
          switch (state.activeView) {
            case 'puzzle-focus':
              state.puzzleFilters.selectedActs.forEach(act => 
                filters.push(`Act: ${act}`)
              );
              if (state.puzzleFilters.selectedPuzzleId) {
                filters.push('Puzzle selected');
              }
              if (state.puzzleFilters.completionStatus !== 'all') {
                filters.push(`Status: ${state.puzzleFilters.completionStatus}`);
              }
              break;
              
            case 'character-journey':
              state.characterFilters.selectedTiers.forEach(tier => 
                filters.push(`Tier: ${tier}`)
              );
              state.characterFilters.ownershipStatus.forEach(status => 
                filters.push(`Ownership: ${status}`)
              );
              if (state.characterFilters.characterType !== 'all') {
                filters.push(`Type: ${state.characterFilters.characterType}`);
              }
              if (state.characterFilters.selectedCharacterId) {
                filters.push('Character selected');
              }
              break;
              
            case 'content-status':
              state.contentFilters.contentStatus.forEach(status => 
                filters.push(`Status: ${status}`)
              );
              if (state.contentFilters.hasIssues !== null) {
                filters.push(state.contentFilters.hasIssues ? 'Has issues' : 'No issues');
              }
              if (state.contentFilters.lastEditedRange !== 'all') {
                filters.push(`Edited: ${state.contentFilters.lastEditedRange}`);
              }
              break;
              
            case 'node-connections':
              if (state.nodeConnectionsFilters?.nodeType) {
                filters.push(`Type: ${state.nodeConnectionsFilters.nodeType}`);
              }
              if (state.nodeConnectionsFilters?.selectedNodeId) {
                filters.push('Node selected');
              }
              break;
          }
          
          return filters;
        }
      }),
      {
        name: 'filter-storage',
        storage: createJSONStorage(() => sessionStorage),
        // Custom serialization for Sets
        partialize: (state) => ({
          ...state,
          puzzleFilters: {
            ...state.puzzleFilters,
            selectedActs: Array.from(state.puzzleFilters.selectedActs)
          },
          characterFilters: {
            ...state.characterFilters,
            selectedTiers: Array.from(state.characterFilters.selectedTiers),
            ownershipStatus: Array.from(state.characterFilters.ownershipStatus)
          },
          contentFilters: {
            ...state.contentFilters,
            contentStatus: Array.from(state.contentFilters.contentStatus)
          }
        }),
        // Custom deserialization for Sets
        merge: (persisted: any, current) => ({
          ...current,
          ...persisted,
          puzzleFilters: {
            ...persisted.puzzleFilters,
            selectedActs: new Set(persisted.puzzleFilters?.selectedActs || [])
          },
          characterFilters: {
            ...persisted.characterFilters,
            selectedTiers: new Set(persisted.characterFilters?.selectedTiers || []),
            ownershipStatus: new Set(persisted.characterFilters?.ownershipStatus || [])
          },
          contentFilters: {
            ...persisted.contentFilters,
            contentStatus: new Set(persisted.contentFilters?.contentStatus || [])
          }
        })
      }
    )
  )
);

// Selector hooks for common use cases
export const useSearchTerm = () => useFilterStore(state => state.searchTerm);
export const usePuzzleFilters = () => useFilterStore(state => state.puzzleFilters);
export const useCharacterFilters = () => useFilterStore(state => state.characterFilters);
export const useContentFilters = () => useFilterStore(state => state.contentFilters);
export const useNodeConnectionsFilters = () => useFilterStore(state => state.nodeConnectionsFilters);
export const useActiveView = () => useFilterStore(state => state.activeView);
export const useHasActiveFilters = () => useFilterStore(state => state.hasActiveFilters());
export const useActiveFilterCount = () => useFilterStore(state => state.activeFilterCount());

// URL-driven filter hooks (Phase 2)
export const useUrlFilters = () => {
  return {
    hydrateFromUrl: useFilterStore(state => state.hydrateFromUrl),
    syncToUrl: useFilterStore(state => state.syncToUrl),
    getUrlParams: useFilterStore(state => state.getUrlParams)
  };
};