import { charactersApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useEntityData, useAllEntityData, type UseEntityDataOptions } from './generic/useEntityData';
import type { Character } from '@/types/notion/app';

/**
 * Custom hook for fetching characters from Notion
 * 
 * @param options - Pagination and query options
 * @returns Query result with characters data, loading states, and error handling
 * 
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useCharacters()
 * 
 * @example
 * // With pagination
 * const { data, nextCursor, hasMore } = useCharacters({ limit: 10, cursor: 'abc' })
 * 
 * @example
 * // Disabled until ready
 * const { data } = useCharacters({ enabled: false })
 */
export function useCharacters(options: UseEntityDataOptions = {}) {
  return useEntityData<Character>(
    charactersApi,
    queryKeys.characters(),
    options
  );
}

/**
 * Hook for fetching all characters (handles pagination internally)
 * Use with caution as this will fetch all pages sequentially
 * 
 * @param options - Query options (no pagination params)
 * @returns Query result with all characters
 * 
 * @example
 * const { data: allCharacters, isLoading } = useAllCharacters()
 */
export function useAllCharacters(options: Omit<UseEntityDataOptions, 'limit' | 'cursor'> = {}) {
  return useAllEntityData<Character>(
    charactersApi,
    queryKeys.characters(),
    options,
    'useAllCharacters' // Debug label
  );
}