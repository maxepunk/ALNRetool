import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { charactersApi, synthesizedApi, timelineApi } from '@/services/api';
import { useFilterStore } from '@/stores/filterStore';
import { applyCharacterJourneyFilters } from '@/lib/filters';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

export interface CharacterJourneyData {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
}

/**
 * Hook to fetch all data needed for CharacterJourneyView
 * Combines synthesized data (for bidirectional relationships) with characters and timeline
 * Now applies filters from filterStore to the fetched data
 */
export function useCharacterJourneyData() {
  // Get filters from store
  const searchTerm = useFilterStore(state => state.searchTerm);
  const characterFilters = useFilterStore(state => state.characterFilters);
  const puzzleFilters = useFilterStore(state => state.puzzleFilters);
  const contentFilters = useFilterStore(state => state.contentFilters);
  
  // Fetch base data
  const query = useQuery({
    queryKey: ['characterJourney', 'all-data'],
    queryFn: async (): Promise<CharacterJourneyData> => {
      console.log('[useCharacterJourneyData] Fetching all data for character journey...');
      
      // Fetch all data in parallel
      const [synthesized, characters, timeline] = await Promise.all([
        synthesizedApi.getAll(),
        charactersApi.listAll(),
        timelineApi.listAll(),
      ]);
      
      console.log(`[useCharacterJourneyData] Data fetched:
        - Characters: ${characters.length}
        - Elements: ${synthesized.elements.length}
        - Puzzles: ${synthesized.puzzles.length}
        - Timeline: ${timeline.length}`);
      
      return {
        characters,
        elements: synthesized.elements,
        puzzles: synthesized.puzzles,
        timeline,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
  
  // Apply filters to the fetched data
  const filteredData = useMemo(() => {
    if (!query.data) return undefined;
    
    // Apply all filters
    const filtered = applyCharacterJourneyFilters(query.data, {
      searchTerm,
      characterFilters,
      puzzleFilters,
      contentFilters,
    });
    
    console.log(`[useCharacterJourneyData] Filters applied:
      - Characters: ${query.data.characters.length} → ${filtered.characters.length}
      - Elements: ${query.data.elements.length} → ${filtered.elements.length}
      - Puzzles: ${query.data.puzzles.length} → ${filtered.puzzles.length}
      - Timeline: ${query.data.timeline.length} → ${filtered.timeline.length}`);
    
    return filtered;
  }, [query.data, searchTerm, characterFilters, puzzleFilters, contentFilters]);
  
  return {
    ...query,
    data: filteredData,
  };
}