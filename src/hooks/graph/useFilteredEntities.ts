/**
 * useFilteredEntities Hook
 * 
 * Handles entity filtering with memoized selectors.
 * Part of the decomposed useGraphLayout architecture.
 * 
 * @module hooks/graph/useFilteredEntities
 * 
 * **Purpose:**
 * Extract node creation and filtering logic from monolithic useGraphLayout.
 * Creates filtered nodes based on entity visibility and filter criteria.
 * 
 * **Performance:**
 * - Memoized to prevent unnecessary recalculation
 * - Only recalculates when entities or filters change
 * - Reduces dependency count from 25 to ~10
 */

import { useMemo } from 'react';
import { createAllNodes } from '@/lib/graph/nodeCreators';
import type { GraphNode } from '@/lib/graph/types';
import type { Character, Puzzle, TimelineEvent, Element } from '@/types/notion/app';
import type { ViewConfig } from '@/lib/viewConfigs';

interface UseFilteredEntitiesParams {
  // Entity data
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
  
  // View configuration
  viewConfig: ViewConfig;
  
  // Filter criteria
  searchTerm: string;
  entityVisibility: {
    characters: boolean;
    elements: boolean;
    puzzles: boolean;
    timeline: boolean;
  };
  
  // Character filters
  characterType: string;
  characterSelectedTiers: Set<string>;
  
  // Puzzle filters
  puzzleSelectedActs: Set<string>;
  
  // Element filters
  elementBasicTypes: Set<string>;
  elementStatus: Set<string>;
}

/**
 * Hook to create filtered nodes from entities.
 * Encapsulates the node creation logic from useGraphLayout.
 * 
 * @param params - Entity data and filter criteria
 * @returns Filtered nodes ready for relationship processing
 * 
 * @example
 * ```typescript
 * const filteredNodes = useFilteredEntities({
 *   characters,
 *   elements,
 *   puzzles,
 *   timeline,
 *   viewConfig,
 *   searchTerm,
 *   entityVisibility,
 *   // ... filter criteria
 * });
 * ```
 */
export function useFilteredEntities({
  characters,
  elements,
  puzzles,
  timeline,
  viewConfig,
  searchTerm,
  entityVisibility,
  characterType,
  characterSelectedTiers,
  puzzleSelectedActs,
  elementBasicTypes,
  elementStatus,
}: UseFilteredEntitiesParams): GraphNode[] {
  return useMemo(() => {
    // Delegate to existing nodeCreators function
    // This maintains consistency with current implementation
    return createAllNodes(
      characters,
      elements,
      puzzles,
      timeline,
      searchTerm,
      entityVisibility,
      characterType,
      characterSelectedTiers,
      puzzleSelectedActs,
      elementBasicTypes,
      elementStatus,
      viewConfig
    );
  }, [
    // Entity arrays
    characters,
    elements,
    puzzles,
    timeline,
    // Filter parameters
    searchTerm,
    // Entity visibility
    entityVisibility.characters,
    entityVisibility.elements,
    entityVisibility.puzzles,
    entityVisibility.timeline,
    // Character filters
    characterType,
    Array.from(characterSelectedTiers).join(','),
    // Puzzle filters
    Array.from(puzzleSelectedActs).join(','),
    // Element filters
    Array.from(elementBasicTypes).join(','),
    Array.from(elementStatus).join(','),
    // View config
    JSON.stringify(viewConfig)
  ]);
}