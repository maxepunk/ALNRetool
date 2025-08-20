/**
 * UI Store - User interface preferences and state
 * 
 * Manages sidebar state, filter panel visibility, animations, and other UI preferences.
 * Persists to localStorage for maintaining preferences across sessions.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  
  // Filter sections visibility
  filterSectionsExpanded: {
    search: boolean;
    acts: boolean;
    puzzles: boolean;
    characters: boolean;
    tiers: boolean;
    ownership: boolean;
    contentStatus: boolean;
    characterJourney: boolean;
  };
  
  // Animation preferences
  reducedMotion: boolean;
  enableGraphAnimations: boolean;
  
  // Theme preferences (future)
  theme: 'light' | 'dark' | 'system';
  
  // Layout preferences
  detailPanelPosition: 'right' | 'bottom';
  detailPanelSize: number;
}

export interface UIActions {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  
  // Filter section actions
  toggleFilterSection: (section: keyof UIState['filterSectionsExpanded']) => void;
  expandAllFilterSections: () => void;
  collapseAllFilterSections: () => void;
  
  // Animation preferences
  setReducedMotion: (reduced: boolean) => void;
  setEnableGraphAnimations: (enabled: boolean) => void;
  
  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Layout actions
  setDetailPanelPosition: (position: 'right' | 'bottom') => void;
  setDetailPanelSize: (size: number) => void;
  
  // Reset to defaults
  resetUIPreferences: () => void;
}

type UIStore = UIState & UIActions;

const defaultUIState: UIState = {
  sidebarCollapsed: false,
  sidebarWidth: 320,
  filterSectionsExpanded: {
    search: true,
    acts: true,
    puzzles: true,
    characters: true,
    tiers: true,
    ownership: true,
    contentStatus: true,
    characterJourney: true,
  },
  reducedMotion: false,
  enableGraphAnimations: true,
  theme: 'system',
  detailPanelPosition: 'right',
  detailPanelSize: 400,
};

/**
 * Main UI store with localStorage persistence
 */
export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...defaultUIState,

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      // Filter section actions
      toggleFilterSection: (section) => set((state) => ({
        filterSectionsExpanded: {
          ...state.filterSectionsExpanded,
          [section]: !state.filterSectionsExpanded[section]
        }
      })),
      expandAllFilterSections: () => set({
        filterSectionsExpanded: {
          search: true,
          acts: true,
          puzzles: true,
          characters: true,
          tiers: true,
          ownership: true,
          contentStatus: true,
          characterJourney: true,
        }
      }),
      collapseAllFilterSections: () => set({
        filterSectionsExpanded: {
          search: false,
          acts: false,
          puzzles: false,
          characters: false,
          tiers: false,
          ownership: false,
          contentStatus: false,
          characterJourney: false,
        }
      }),

      // Animation preferences
      setReducedMotion: (reduced) => set({ reducedMotion: reduced }),
      setEnableGraphAnimations: (enabled) => set({ enableGraphAnimations: enabled }),

      // Theme actions
      setTheme: (theme) => set({ theme }),

      // Layout actions
      setDetailPanelPosition: (position) => set({ detailPanelPosition: position }),
      setDetailPanelSize: (size) => set({ detailPanelSize: size }),

      // Reset to defaults
      resetUIPreferences: () => set(defaultUIState),
    }),
    {
      name: 'ui-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Selector hooks for common use cases
export const useSidebarCollapsed = () => useUIStore(state => state.sidebarCollapsed);
export const useSidebarWidth = () => useUIStore(state => state.sidebarWidth);
export const useFilterSectionsExpanded = () => useUIStore(state => state.filterSectionsExpanded);
export const useReducedMotion = () => useUIStore(state => state.reducedMotion);
export const useEnableGraphAnimations = () => useUIStore(state => state.enableGraphAnimations);
export const useTheme = () => useUIStore(state => state.theme);
export const useDetailPanelPosition = () => useUIStore(state => state.detailPanelPosition);
export const useDetailPanelSize = () => useUIStore(state => state.detailPanelSize);