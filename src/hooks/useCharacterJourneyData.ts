import { useQuery } from '@tanstack/react-query';
import { charactersApi, synthesizedApi, timelineApi } from '@/services/api';
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
 */
export function useCharacterJourneyData() {
  return useQuery({
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
}