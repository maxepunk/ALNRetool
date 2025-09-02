/**
 * View Store - Single Source of Truth for Current View
 * 
 * Fixes Bug 6a: Cache key mismatch between components
 * - GraphView reads from: ['graph', 'complete', 'full-graph']
 * - DetailPanel was writing to: ['graph', 'complete', 'Full Graph']
 * 
 * This store ensures all components use the same view identifier
 * that matches the URL parameter (e.g., 'full-graph', 'puzzles-only')
 */

import { create } from 'zustand';

interface ViewStore {
  /** Current view type from URL (e.g., 'full-graph', 'puzzles-only') */
  currentViewType: string;
  
  /** Update the current view type */
  setViewType: (viewType: string) => void;
}

export const useViewStore = create<ViewStore>((set) => ({
  currentViewType: 'full-graph',
  setViewType: (viewType) => set({ currentViewType: viewType }),
}));