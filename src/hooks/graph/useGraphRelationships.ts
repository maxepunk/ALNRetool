/**
 * useGraphRelationships Hook
 * 
 * Creates edges from entity relationships.
 * Part of the decomposed useGraphLayout architecture.
 * 
 * @module hooks/graph/useGraphRelationships
 * 
 * **Purpose:**
 * Extract edge creation logic from monolithic useGraphLayout.
 * Generates all edges based on entity relationships.
 * 
 * **Performance:**
 * - Memoized to prevent unnecessary recalculation
 * - Only recalculates when entities change
 * - Reduces dependency count by isolating edge logic
 */

import { useMemo } from 'react';
import type { GraphEdge } from '@/lib/graph/types';
import { resolveAllRelationships } from '@/lib/graph/relationships';
import type { Character, Puzzle, TimelineEvent, Element } from '@/types/notion/app';

interface UseGraphRelationshipsParams {
  // Entity data for relationship resolution
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
}

/**
 * Hook to create edges from entity relationships.
 * Encapsulates the edge creation logic from useGraphLayout.
 * 
 * @param params - Entity data for relationship resolution
 * @returns Array of edges representing all entity relationships
 * 
 * @example
 * ```typescript
 * const allEdges = useGraphRelationships({
 *   characters,
 *   elements,
 *   puzzles,
 *   timeline
 * });
 * ```
 */
export function useGraphRelationships({
  characters,
  elements,
  puzzles,
  timeline,
}: UseGraphRelationshipsParams): GraphEdge[] {
  return useMemo(() => {
    // Delegate to existing relationships function
    // This maintains consistency with current implementation
    return resolveAllRelationships(characters, elements, puzzles, timeline);
  }, [
    // Only recalculate when entity data changes
    characters,
    elements,
    puzzles,
    timeline
  ]);
}