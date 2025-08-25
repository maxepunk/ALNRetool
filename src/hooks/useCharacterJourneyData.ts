import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { charactersApi, synthesizedApi, timelineApi } from '@/services/api';
import { useFilterStore } from '@/stores/filterStore';
import { applyCharacterJourneyFilters } from '@/lib/filters';
import { 
  extractServerSideFilters, 
  extractClientSideFilters,
  createFilterCacheKey
} from '@/lib/filters/filterClassifier';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';
import type { SynthesizedFilterParams } from '@/services/api';
import { logger } from '@/lib/graph/utils/Logger'


export interface CharacterJourneyData {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
}

/**
 * Hook to fetch all data needed for CharacterJourneyView
 * Combines synthesized data (for bidirectional relationships) with characters and timeline
 * 
 * NEW: Implements hybrid filtering approach
 * - Server-side filters are passed to API and included in cache key
 * - Client-side filters are applied post-fetch for instant UI updates
 * - This reduces data transfer and improves cache efficiency
 */
export function useCharacterJourneyData() {
  // Get filters from store
  const searchTerm = useFilterStore(state => state.searchTerm);
  const characterFilters = useFilterStore(state => state.characterFilters);
  const puzzleFilters = useFilterStore(state => state.puzzleFilters);
  const contentFilters = useFilterStore(state => state.contentFilters);
  
  // Extract server-side and client-side filters
  const serverFilters = useMemo(() => 
    extractServerSideFilters(characterFilters, puzzleFilters, contentFilters),
    [characterFilters, puzzleFilters, contentFilters]
  );
  
  // Create cache key from server-side filters
  const filterCacheKey = useMemo(() => 
    createFilterCacheKey(serverFilters),
    [serverFilters]
  );
  
  // Prepare synthesized API filters
  const synthesizedFilters: SynthesizedFilterParams | undefined = useMemo(() => {
    const hasFilters = serverFilters.elements.status || serverFilters.elements.lastEdited;
    if (!hasFilters) return undefined;
    
    return {
      elementStatus: serverFilters.elements.status,
      elementLastEdited: serverFilters.elements.lastEdited,
      // Puzzle filters are limited by Notion API
      puzzleLastEdited: serverFilters.puzzles.lastEdited,
    };
  }, [serverFilters]);
  
  // Fetch data with server-side filters applied
  const query = useQuery({
    // Include server-side filters in cache key for granular caching
    queryKey: ['characterJourney', 'hybrid-filtered', filterCacheKey],
    queryFn: async (): Promise<CharacterJourneyData> => {
      logger.debug('[useCharacterJourneyData] Fetching with hybrid filtering...');
      logger.debug('[useCharacterJourneyData] Server-side filters:', undefined, serverFilters);
      
      // Fetch data with server-side filters applied
      const [synthesized, characters, timeline] = await Promise.all([
        synthesizedApi.getAll(synthesizedFilters),
        charactersApi.listAll(serverFilters.characters),
        timelineApi.listAll(), // Timeline doesn't have server-side filters yet
      ]);
      
      logger.debug(`[useCharacterJourneyData] Server-filtered data fetched:
        - Characters: ${characters.length} (after server filters)
        - Elements: ${synthesized.elements.length} (after server filters)
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
  
  // Apply client-side filters to the server-filtered data
  const filteredData = useMemo(() => {
    if (!query.data) return undefined;
    
    // Extract client-side only filters
    const clientFilters = extractClientSideFilters(
      searchTerm,
      characterFilters,
      puzzleFilters,
      contentFilters
    );
    
    // Apply client-side filters (complex filters that require cross-entity data)
    const filtered = applyCharacterJourneyFilters(query.data, {
      searchTerm: clientFilters.searchTerm,
      characterFilters: {
        ...characterFilters,
        // These are already applied server-side, so clear them for client filtering
        selectedTiers: new Set(),
        characterType: 'all',
      },
      puzzleFilters,
      contentFilters: {
        ...contentFilters,
        // These are already applied server-side, so clear them for client filtering
        contentStatus: new Set(),
        lastEditedRange: 'all',
      },
    });
    
    logger.debug(`[useCharacterJourneyData] Client-side filters applied:
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