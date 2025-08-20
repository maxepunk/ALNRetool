/**
 * Filter Store - Core filtering logic for the entire application
 * 
 * Manages all filter state including search, acts, puzzles, characters, and view-specific filters.
 * Persists to sessionStorage for maintaining state across page refreshes.
 * Provides route-aware filter presets and computed values.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

// Filter types for different views
export interface PuzzleFilters {
  selectedActs: Set<string>;
  selectedPuzzleId: string | null;
  completionStatus: 'all' | 'completed' | 'incomplete';
}

export interface CharacterFilters {
  selectedTiers: Set<'Core' | 'Secondary' | 'Tertiary'>;
  ownershipStatus: Set<'Owned' | 'Accessible' | 'Shared' | 'Locked'>;
  characterType: 'all' | 'Player' | 'NPC';
  selectedCharacterId: string | null;
  highlightShared: boolean;
}

export interface ContentFilters {
  contentStatus: Set<'draft' | 'review' | 'approved' | 'published'>;
  hasIssues: boolean | null;
  lastEditedRange: 'today' | 'week' | 'month' | 'all';
}

export interface FilterState {
  // Universal filters
  searchTerm: string;
  
  // View-specific filters
  puzzleFilters: PuzzleFilters;
  characterFilters: CharacterFilters;
  contentFilters: ContentFilters;
  
  // Current active view (for route-aware filtering)
  activeView: 'puzzle-focus' | 'character-journey' | 'content-status' | null;
}export interface FilterActions {
  // Universal filter actions
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  
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
  
  // View management
  setActiveView: (view: 'puzzle-focus' | 'character-journey' | 'content-status' | null) => void;
  
  // Global actions
  clearAllFilters: () => void;
  applyPreset: (preset: 'recent' | 'my-work' | 'needs-review' | 'critical-path') => void;
}

// Computed values
export interface FilterComputedValues {
  hasActiveFilters: () => boolean;
  activeFilterCount: () => number;
  getActiveFiltersForView: () => string[];
}type FilterStore = FilterState & FilterActions & FilterComputedValues;

/**
 * Main filter store with persistence and computed values
 */
export const useFilterStore = create<FilterStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
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
        activeView: null,

        // Universal filter actions
        setSearchTerm: (term) => set({ searchTerm: term }),
        clearSearch: () => set({ searchTerm: '' }),

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
          }
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
        },        // Computed values
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
            state.contentFilters.lastEditedRange !== 'all'
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
export const useActiveView = () => useFilterStore(state => state.activeView);
export const useHasActiveFilters = () => useFilterStore(state => state.hasActiveFilters());
export const useActiveFilterCount = () => useFilterStore(state => state.activeFilterCount());