import { puzzlesApi, type PuzzleFilterParams } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useEntityData, useAllEntityData, type UseEntityDataOptions } from './generic/useEntityData';
import type { Puzzle } from '@/types/notion/app';

/**
 * Puzzle hook options extending filter params
 */
export interface UsePuzzleOptions extends UseEntityDataOptions, Omit<PuzzleFilterParams, keyof UseEntityDataOptions> {}

/**
 * Custom hook for fetching puzzles from Notion
 * 
 * @param options - Pagination and query options
 * @returns Query result with puzzles data, loading states, and error handling
 * 
 * @example
 * // Basic usage
 * const { data, isLoading, error } = usePuzzles()
 * 
 * @example
 * // With pagination
 * const { data, nextCursor, hasMore } = usePuzzles({ limit: 10, cursor: 'abc' })
 * 
 * @example
 * // With filters
 * const { data } = usePuzzles({ acts: 'Act 1', lastEdited: 'week' })
 * 
 * @example
 * // Disabled until ready
 * const { data } = usePuzzles({ enabled: false })
 */
export function usePuzzles(options: UsePuzzleOptions = {}) {
  return useEntityData<Puzzle, PuzzleFilterParams>(
    puzzlesApi,
    queryKeys.puzzles(),
    options
  );
}

/**
 * Hook for fetching all puzzles (handles pagination internally)
 * Use with caution as this will fetch all pages sequentially
 * 
 * @param options - Query options (no pagination params)
 * @returns Query result with all puzzles
 * 
 * @example
 * const { data: allPuzzles, isLoading } = useAllPuzzles()
 */
export function useAllPuzzles(options: Omit<UseEntityDataOptions, 'limit' | 'cursor'> = {}) {
  return useAllEntityData<Puzzle>(
    puzzlesApi,
    queryKeys.puzzles(),
    options,
    'useAllPuzzles' // Debug label
  );
}