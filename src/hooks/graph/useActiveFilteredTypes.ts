/**
 * Hook to detect which entity types have active filters
 * Used for focus mode - only expand depth from actively filtered entity types
 * 
 * @module hooks/graph/useActiveFilteredTypes
 * 
 * **Purpose:**
 * Determines which entity types have active filters applied, enabling
 * focus mode where depth expansion only occurs from filtered entity types
 * rather than all visible nodes.
 * 
 * **Logic:**
 * - Characters: Active if type, tier, or ownership filters are set
 * - Puzzles: Active if act or completion filters are set
 * - Elements: Active if type, status, content, issues, or date filters are set
 * - Timeline: No filters, only visibility toggle
 */

import { useMemo } from 'react';

interface FilterParams {
  // Entity visibility
  entityVisibility?: {
    character: boolean;
    puzzle: boolean;
    element: boolean;
    timeline: boolean;
  };
  
  // Character filters
  characterType?: 'all' | 'Player' | 'NPC';
  characterSelectedTiers?: Set<string>;
  characterOwnershipStatus?: Set<'Owned' | 'Accessible' | 'Shared' | 'Locked'>;
  
  // Puzzle filters
  puzzleSelectedActs?: Set<string>;
  puzzleCompletionStatus?: 'all' | 'completed' | 'incomplete';
  
  // Element filters
  elementBasicTypes?: Set<string>;
  elementStatus?: Set<string>;
  elementContentStatus?: Set<'draft' | 'review' | 'approved' | 'published'>;
  elementHasIssues?: boolean | null;
  elementLastEditedRange?: 'today' | 'week' | 'month' | 'all';
}

/**
 * Detects which entity types have active filters
 * 
 * @param filters - All filter parameters from useGraphLayout
 * @returns Set of entity type strings that have active filters AND are visible
 * 
 * @example
 * ```typescript
 * const activeTypes = useActiveFilteredTypes({
 *   entityVisibility: { character: true, puzzle: true, element: true, timeline: true },
 *   characterType: 'NPC',
 *   puzzleCompletionStatus: 'all'
 * });
 * // Returns: Set(['character'])
 * ```
 */
export function useActiveFilteredTypes(filters: FilterParams): Set<string> {
  return useMemo(() => {
    const activeTypes = new Set<string>();
    
    // Character filters active AND visible?
    // Same logic as useCharacterFilterCount but just detection
    const hasCharacterFilters = 
      (filters.characterType && filters.characterType !== 'all') ||
      (filters.characterSelectedTiers && filters.characterSelectedTiers.size > 0 && filters.characterSelectedTiers.size < 3) ||
      (filters.characterOwnershipStatus && filters.characterOwnershipStatus.size > 0);
    
    // Only add if filters are active AND entity type is visible
    if (hasCharacterFilters && filters.entityVisibility?.character !== false) {
      activeTypes.add('character');
    }
    
    // Puzzle filters active AND visible?
    // Acts: active if some but not all selected (0 < size < 3, since there are only 3 acts)
    // Completion: active if not 'all'
    const hasPuzzleFilters = 
      (filters.puzzleSelectedActs && filters.puzzleSelectedActs.size > 0 && filters.puzzleSelectedActs.size < 3) ||
      (filters.puzzleCompletionStatus && filters.puzzleCompletionStatus !== 'all');
    
    // Only add if filters are active AND entity type is visible
    if (hasPuzzleFilters && filters.entityVisibility?.puzzle !== false) {
      activeTypes.add('puzzle');
    }
    
    // Element filters active AND visible?
    // Basic types: active if some but not all selected (0 < size < 7)
    // Others: active if set to non-default values
    const hasElementFilters = 
      (filters.elementBasicTypes && filters.elementBasicTypes.size > 0 && filters.elementBasicTypes.size < 7) ||
      (filters.elementStatus && filters.elementStatus.size > 0) ||
      (filters.elementContentStatus && filters.elementContentStatus.size > 0) ||
      (filters.elementHasIssues !== null && filters.elementHasIssues !== undefined) ||
      (filters.elementLastEditedRange && filters.elementLastEditedRange !== 'all');
    
    // Only add if filters are active AND entity type is visible
    if (hasElementFilters && filters.entityVisibility?.element !== false) {
      activeTypes.add('element');
    }
    
    // Note: Timeline doesn't have filters, only visibility toggle
    // So timeline never appears in activeTypes
    
    return activeTypes;
  }, [
    filters.entityVisibility,
    filters.characterType,
    filters.characterSelectedTiers,
    filters.characterOwnershipStatus,
    filters.puzzleSelectedActs,
    filters.puzzleCompletionStatus,
    filters.elementBasicTypes,
    filters.elementStatus,
    filters.elementContentStatus,
    filters.elementHasIssues,
    filters.elementLastEditedRange
  ]);
}