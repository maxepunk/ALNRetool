import { useQuery } from '@tanstack/react-query'
import { charactersApi, type PaginationParams } from '@/services/api'
import { queryKeys } from '@/lib/queryKeys'
import { QUERY_STALE_TIME } from '@/lib/queryClient'

/**
 * Hook options for fetching characters
 */
interface UseCharactersOptions extends PaginationParams {
  enabled?: boolean
  staleTime?: number
}

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
export function useCharacters(options: UseCharactersOptions = {}) {
  const { limit, cursor, enabled = true, staleTime = QUERY_STALE_TIME } = options

  const query = useQuery({
    queryKey: queryKeys.charactersList({ limit, cursor }),
    queryFn: () => charactersApi.list({ limit, cursor }),
    enabled,
    staleTime,
    gcTime: staleTime * 2, // Keep in cache for 2x stale time
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  })

  // Extract pagination metadata from the response
  const response = query.data
  const characters = response?.data ?? undefined
  const nextCursor = response?.nextCursor ?? undefined
  const hasMore = response?.hasMore ?? false

  return {
    // Data
    data: characters,
    nextCursor,
    hasMore,
    
    // Query states
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    isError: query.isError,
    
    // Error handling
    error: query.error,
    
    // Refetch function
    refetch: query.refetch,
  }
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
export function useAllCharacters(options: Omit<UseCharactersOptions, 'limit' | 'cursor'> = {}) {
  const { enabled = true, staleTime = QUERY_STALE_TIME } = options

  return useQuery({
    queryKey: queryKeys.characters(), // Different key from paginated version
    queryFn: () => charactersApi.listAll(),
    enabled,
    staleTime,
    gcTime: staleTime * 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  })
}