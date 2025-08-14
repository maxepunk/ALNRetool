import { useQuery } from '@tanstack/react-query'
import { puzzlesApi, type PaginationParams } from '@/services/api'
import { queryKeys } from '@/lib/queryKeys'
import { QUERY_STALE_TIME } from '@/lib/queryClient'

/**
 * Hook options for fetching puzzles
 */
interface UsePuzzlesOptions extends PaginationParams {
  enabled?: boolean
  staleTime?: number
}

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
 * // Disabled until ready
 * const { data } = usePuzzles({ enabled: false })
 */
export function usePuzzles(options: UsePuzzlesOptions = {}) {
  const { limit, cursor, enabled = true, staleTime = QUERY_STALE_TIME } = options

  const query = useQuery({
    queryKey: queryKeys.puzzlesList({ limit, cursor }),
    queryFn: () => puzzlesApi.list({ limit, cursor }),
    enabled,
    staleTime,
    gcTime: staleTime * 2, // Keep in cache for 2x stale time
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  })

  // Extract pagination metadata from the response
  const response = query.data
  const puzzles = response?.data || undefined
  const nextCursor = response?.nextCursor || null
  const hasMore = response?.hasMore || false

  return {
    // Data
    data: puzzles,
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
 * Hook for fetching all puzzles (handles pagination internally)
 * Use with caution as this will fetch all pages sequentially
 * 
 * @param options - Query options (no pagination params)
 * @returns Query result with all puzzles
 * 
 * @example
 * const { data: allPuzzles, isLoading } = useAllPuzzles()
 */
export function useAllPuzzles(options: Omit<UsePuzzlesOptions, 'limit' | 'cursor'> = {}) {
  const { enabled = true, staleTime = QUERY_STALE_TIME } = options

  return useQuery({
    queryKey: queryKeys.puzzles(), // Different key from paginated version
    queryFn: () => puzzlesApi.listAll(),
    enabled,
    staleTime,
    gcTime: staleTime * 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  })
}