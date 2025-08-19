import { useQuery } from '@tanstack/react-query'
import { elementsApi, type PaginationParams } from '@/services/api'
import { queryKeys } from '@/lib/queryKeys'
import { QUERY_STALE_TIME } from '@/lib/queryClient'

/**
 * Hook options for fetching elements
 */
interface UseElementsOptions extends PaginationParams {
  enabled?: boolean
  staleTime?: number
}

/**
 * Custom hook for fetching elements from Notion
 * 
 * @param options - Pagination and query options
 * @returns Query result with elements data, loading states, and error handling
 * 
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useElements()
 * 
 * @example
 * // With pagination
 * const { data, nextCursor, hasMore } = useElements({ limit: 10, cursor: 'abc' })
 * 
 * @example
 * // Disabled until ready
 * const { data } = useElements({ enabled: false })
 */
export function useElements(options: UseElementsOptions = {}) {
  const { limit, cursor, enabled = true, staleTime = QUERY_STALE_TIME } = options

  const query = useQuery({
    queryKey: queryKeys.elementsList({ limit, cursor }),
    queryFn: () => elementsApi.list({ limit, cursor }),
    enabled,
    staleTime,
    gcTime: staleTime * 2, // Keep in cache for 2x stale time
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  })

  // Extract pagination metadata from the response
  const response = query.data
  const elements = response?.data ?? undefined
  const nextCursor = response?.nextCursor ?? null
  const hasMore = response?.hasMore ?? false

  return {
    // Data
    data: elements,
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
 * Hook for fetching all elements (handles pagination internally)
 * Use with caution as this will fetch all pages sequentially
 * 
 * @param options - Query options (no pagination params)
 * @returns Query result with all elements
 * 
 * @example
 * const { data: allElements, isLoading } = useAllElements()
 */
export function useAllElements(options: Omit<UseElementsOptions, 'limit' | 'cursor'> = {}) {
  const { enabled = true, staleTime = QUERY_STALE_TIME } = options

  return useQuery({
    queryKey: queryKeys.elements(), // Different key from paginated version
    queryFn: async () => {
      console.log('[useAllElements] Starting to fetch all elements');
      const result = await elementsApi.listAll();
      console.log('[useAllElements] Fetched total elements:', result.length);
      return result;
    },
    enabled,
    staleTime,
    gcTime: staleTime * 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  })
}