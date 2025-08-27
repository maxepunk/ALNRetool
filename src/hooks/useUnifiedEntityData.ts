/**
 * Unified Entity Data Hook
 * 
 * Coordinates loading of all entity types with a single loading state
 * to prevent progressive rendering and ensure data consistency.
 * 
 * @module hooks/useUnifiedEntityData
 */

import { useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { charactersApi, elementsApi, puzzlesApi, timelineApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';
import type { ViewConfig } from '@/lib/viewConfigs';

export interface UnifiedEntityData {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
  isAllDataLoaded: boolean;
  hasAnyError: boolean;
  isAnyFetching: boolean;
  isInitialLoading: boolean;
  errors: (Error | null)[];
  refetchAll: () => void;
}

/**
 * Hook that fetches all entity types in parallel and provides
 * a unified loading state to prevent progressive rendering.
 * 
 * @param config - View configuration to determine which entities to fetch
 * @returns Unified entity data with single loading state
 */
export function useUnifiedEntityData(config: ViewConfig): UnifiedEntityData {
  // Track if this is the initial load vs a refetch
  const hasLoadedOnce = useRef(false);
  
  // Determine which entity types to fetch based on view config
  const shouldFetchCharacters = config.filters.entityTypes?.includes('all') || 
                                config.filters.entityTypes?.includes('character');
  const shouldFetchElements = config.filters.entityTypes?.includes('all') || 
                              config.filters.entityTypes?.includes('element');
  const shouldFetchPuzzles = config.filters.entityTypes?.includes('all') || 
                             config.filters.entityTypes?.includes('puzzle');
  const shouldFetchTimeline = config.filters.entityTypes?.includes('all') || 
                              config.filters.entityTypes?.includes('timeline');

  // Use useQueries to fetch all entities in parallel
  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.characters(),
        queryFn: () => charactersApi.listAll(),
        enabled: shouldFetchCharacters,
        staleTime: 30 * 1000, // 30 seconds (was 5 minutes)
        gcTime: 60 * 1000, // 1 minute (was 10 minutes)
        refetchOnWindowFocus: true, // Enable (was false)
      },
      {
        queryKey: queryKeys.elements(),
        queryFn: () => elementsApi.listAll(),
        enabled: shouldFetchElements,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
      },
      {
        queryKey: queryKeys.puzzles(),
        queryFn: () => puzzlesApi.listAll(),
        enabled: shouldFetchPuzzles,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
      },
      {
        queryKey: queryKeys.timeline(),
        queryFn: () => timelineApi.listAll(),
        enabled: shouldFetchTimeline,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
      },
    ],
  });

  // Calculate unified loading states
  const enabledQueries = queries.filter((_, index) => {
    if (index === 0) return shouldFetchCharacters;
    if (index === 1) return shouldFetchElements;
    if (index === 2) return shouldFetchPuzzles;
    if (index === 3) return shouldFetchTimeline;
    return false;
  });

  const isAllDataLoaded = enabledQueries.every(q => !q.isLoading && q.isSuccess);
  const hasAnyError = enabledQueries.some(q => q.isError);
  const isAnyFetching = enabledQueries.some(q => q.isFetching);
  
  // Track initial loading separately from refetching
  const isInitialLoading = !hasLoadedOnce.current && enabledQueries.some(q => q.isLoading);
  
  // Mark as loaded once all enabled queries succeed at least once
  if (!hasLoadedOnce.current && isAllDataLoaded) {
    hasLoadedOnce.current = true;
  }

  // Extract data with type safety
  const characters = shouldFetchCharacters && queries[0]?.data ? queries[0].data : [];
  const elements = shouldFetchElements && queries[1]?.data ? queries[1].data : [];
  const puzzles = shouldFetchPuzzles && queries[2]?.data ? queries[2].data : [];
  const timeline = shouldFetchTimeline && queries[3]?.data ? queries[3].data : [];

  // Collect errors for debugging
  const errors = queries.map(q => q.error);

  // Refetch all function
  const refetchAll = () => {
    enabledQueries.forEach(q => q.refetch());
  };

  return {
    characters,
    elements,
    puzzles,
    timeline,
    isAllDataLoaded,
    hasAnyError,
    isAnyFetching,
    isInitialLoading,
    errors,
    refetchAll,
  };
}