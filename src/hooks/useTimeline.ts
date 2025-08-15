import { useQuery } from '@tanstack/react-query'
import { timelineApi, type PaginationParams } from '@/services/api'
import { queryKeys } from '@/lib/queryKeys'
import { QUERY_STALE_TIME } from '@/lib/queryClient'

/**
 * Hook options for fetching timeline events
 */
interface UseTimelineOptions extends PaginationParams {
  enabled?: boolean
  staleTime?: number
}

/**
 * Custom hook for fetching timeline events from Notion
 * 
 * @param options - Pagination and query options
 * @returns Query result with timeline events data, loading states, and error handling
 * 
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useTimeline()
 * 
 * @example
 * // With pagination
 * const { data, nextCursor, hasMore } = useTimeline({ limit: 10, cursor: 'abc' })
 * 
 * @example
 * // Disabled until ready
 * const { data } = useTimeline({ enabled: false })
 */
export function useTimeline(options: UseTimelineOptions = {}) {
  const { limit, cursor, enabled = true, staleTime = QUERY_STALE_TIME } = options

  const query = useQuery({
    queryKey: queryKeys.timelineList({ limit, cursor }),
    queryFn: () => timelineApi.list({ limit, cursor }),
    enabled,
    staleTime,
    gcTime: staleTime * 2, // Keep in cache for 2x stale time
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  })

  // Extract pagination metadata from the response
  const response = query.data
  const events = response?.data ?? undefined
  const nextCursor = response?.nextCursor ?? null
  const hasMore = response?.hasMore ?? false

  return {
    // Data
    data: events,
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
 * Hook for fetching all timeline events (handles pagination internally)
 * Use with caution as this will fetch all pages sequentially
 * 
 * @param options - Query options (no pagination params)
 * @returns Query result with all timeline events
 * 
 * @example
 * const { data: allEvents, isLoading } = useAllTimeline()
 */
export function useAllTimeline(options: Omit<UseTimelineOptions, 'limit' | 'cursor'> = {}) {
  const { enabled = true, staleTime = QUERY_STALE_TIME } = options

  return useQuery({
    queryKey: queryKeys.timeline(), // Different key from paginated version
    queryFn: () => timelineApi.listAll(),
    enabled,
    staleTime,
    gcTime: staleTime * 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  })
}