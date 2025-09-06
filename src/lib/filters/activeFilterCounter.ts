/**
 * Active Filter Counter Utilities
 * Helpers to count active filters per section for UI badges
 */

import { useFilterStore } from '@/stores/filterStore';

/**
 * Count active character filters
 */
export function useCharacterFilterCount(): number {
  const store = useFilterStore();
  let count = 0;
  
  // Character type filter
  if (store.characterFilters.characterType !== 'all') count++;
  
  // Character tier filters
  if (store.characterFilters.selectedTiers.size < 3) count++; // Less than all 3 tiers
  
  // Ownership status filters
  if (store.characterFilters.ownershipStatus.size > 0) count++;
  
  // Selected character filter
  if (store.characterFilters.selectedCharacterId) count++;
  
  // Highlight shared filter
  if (store.characterFilters.highlightShared) count++;
  
  return count;
}

/**
 * Count active puzzle filters
 */
export function usePuzzleFilterCount(): number {
  const store = useFilterStore();
  let count = 0;
  
  // Act filters
  if (store.puzzleFilters.selectedActs.size > 0 && store.puzzleFilters.selectedActs.size < 4) count++;
  
  // Completion filter
  if (store.puzzleFilters.completionStatus !== 'all') count++;
  
  // Selected puzzle filter
  if (store.puzzleFilters.selectedPuzzleId) count++;
  
  return count;
}

/**
 * Count active element filters
 */
export function useElementFilterCount(): number {
  const store = useFilterStore();
  let count = 0;
  
  // Basic type filters
  if (store.contentFilters.elementBasicTypes.size > 0 && store.contentFilters.elementBasicTypes.size < 7) count++;
  
  // Production status filters
  if (store.contentFilters.elementStatus.size > 0) count++;
  
  // Content status filters  
  if (store.contentFilters.contentStatus.size > 0) count++;
  
  // Has issues filter
  if (store.contentFilters.hasIssues !== null) count++;
  
  // Last edited filter
  if (store.contentFilters.lastEditedRange !== 'all') count++;
  
  return count;
}

/**
 * Count active graph control filters
 */
export function useGraphControlCount(): number {
  const store = useFilterStore();
  let count = 0;
  
  // Depth filter (only count if not default of 3)
  if (store.connectionDepth !== 3) count++;
  
  // Selected node filter
  if (store.selectedNodeId) count++;
  
  return count;
}

/**
 * Count active entity visibility toggles
 */
export function useEntityVisibilityCount(): number {
  const store = useFilterStore();
  let count = 0;
  
  // Count if any entity type is hidden
  if (!store.entityVisibility.character) count++;
  if (!store.entityVisibility.element) count++;
  if (!store.entityVisibility.puzzle) count++;
  if (!store.entityVisibility.timeline) count++;
  
  return count;
}