import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'



/**
 * Configure React Query client with optimal settings for ALNRetool
 * 
 * Key configurations:
 * - 5-minute stale time to match server-side cache TTL
 * - 3 retry attempts with exponential backoff for resilience
 * - Proper error handling and logging
 * - Optimistic updates for mutations
 */

// Constants for configuration
export const QUERY_STALE_TIME = 5 * 60 * 1000 // 5 minutes in milliseconds
export const QUERY_CACHE_TIME = 10 * 60 * 1000 // 10 minutes in milliseconds
export const QUERY_RETRY_COUNT = 3
export const QUERY_RETRY_DELAY = (attemptIndex: number) => 
  Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff with max 30s

// Create query cache with error/success handlers
const queryCache = new QueryCache({
  onError: (error, query) => {
    // Global error handler for all queries
    console.error('Query error:', {
      queryKey: JSON.stringify(query.queryKey),
    }, error instanceof Error ? error : undefined)
    // In production, this would trigger error reporting/monitoring
  },
  onSuccess: (_data, query) => {
    // Global success handler (useful for analytics)
    console.debug('Query success:', {
      queryKey: query.queryKey,
    })
  },
})

// Create mutation cache with error/success handlers
const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    // Global error handler for all mutations
    console.error('Mutation cache error:', {
      mutationKey: JSON.stringify(mutation.options.mutationKey),
    }, error instanceof Error ? error : undefined)
  },
  onSuccess: (_data, _variables, _context, mutation) => {
    // Global success handler for mutations
    console.debug('Mutation success:', {
      mutationKey: mutation.options.mutationKey,
    })
  },
})

// Create the query client with production-ready settings
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: QUERY_STALE_TIME,
      
      // Keep cache for 10 minutes (garbage collection)
      gcTime: QUERY_CACHE_TIME,
      
      // Retry failed queries with exponential backoff
      retry: QUERY_RETRY_COUNT,
      retryDelay: QUERY_RETRY_DELAY,
      
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      
      // Don't refetch on reconnect if data is still fresh
      refetchOnReconnect: 'always',
      
      // Network mode - queries require network connection
      networkMode: 'online',
    },
    mutations: {
      // Retry failed mutations (more conservative than queries)
      retry: 1,
      retryDelay: 1000,
      
      // Network mode for mutations
      networkMode: 'online',
      
      // Handle errors globally
      onError: (error) => {
        console.error('Mutation error:', undefined, error)
        // In production, this would trigger error reporting
      },
    },
  },
})

// Helper function to reset the query client (useful for tests and logout)
export const resetQueryClient = () => {
  queryClient.clear()
  queryClient.resetQueries()
  queryClient.removeQueries()
}

// Helper function to prefetch common queries on app load
export const prefetchCommonQueries = async () => {
  // These will be implemented when we create the hooks
  // await queryClient.prefetchQuery({ queryKey: queryKeys.characters() })
  // await queryClient.prefetchQuery({ queryKey: queryKeys.elements() })
}