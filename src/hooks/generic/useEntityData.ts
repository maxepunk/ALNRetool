/**
 * Generic Entity Data Fetching Hooks
 * 
 * Provides reusable React Query hooks for fetching paginated and complete
 * entity data from the Notion backend. Implements the repository pattern
 * with consistent caching, error handling, and loading states.
 * 
 * @module hooks/generic/useEntityData
 * 
 * **Architecture:**
 * - Generic hooks that work with any entity type
 * - TanStack Query v5 for server state management
 * - Automatic pagination handling
 * - Consistent caching strategy across all entities
 * - Type-safe with TypeScript generics
 * 
 * **Usage Pattern:**
 * Entity-specific hooks (useCharacters, usePuzzles, etc.) wrap these
 * generic hooks with their specific API implementations.
 * 
 * **Performance:**
 * - Stale-while-revalidate caching strategy
 * - Automatic background refetching
 * - Query deduplication
 * - Optimistic updates support
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/lib/queryClient';
import type { PaginationParams } from '@/services/api';
import type { APIResponse } from '@/types/notion/app';
// Logger removed in Phase 3


/**
 * Configuration options for entity data fetching.
 * Extends pagination parameters with React Query options.
 * 
 * @interface UseEntityDataOptions
 * @extends {PaginationParams}
 */
export interface UseEntityDataOptions extends PaginationParams {
  enabled?: boolean;
  staleTime?: number;
  [key: string]: any; // Allow additional filter params
}

/**
 * Standard interface for entity API implementations.
 * All entity APIs must implement these methods for compatibility.
 * 
 * @interface EntityAPI
 * @template T - Entity type (Character, Puzzle, Element, etc.)
 * @template P - Pagination parameters type
 */
export interface EntityAPI<T, P extends PaginationParams = PaginationParams> {
  list: (params?: P) => Promise<APIResponse<T>>;
  listAll: () => Promise<T[]>;
}

/**
 * Standardized return type for entity data queries.
 * Provides consistent interface across all entity types.
 * 
 * @interface EntityDataResult
 * @template T - Entity type
 * 
 * **Properties:**
 * - Data: entities array, cursor, hasMore flag
 * - States: loading, fetching, success, error flags
 * - Actions: refetch function for manual refresh
 */
export interface EntityDataResult<T> {
  // Data
  data: T[] | undefined;
  nextCursor: string | null | undefined;
  hasMore: boolean;
  
  // Query states
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  
  // Error handling
  error: Error | null;
  
  // Refetch function
  refetch: () => Promise<UseQueryResult<APIResponse<T>, Error>>;
}

/**
 * Generic hook for fetching paginated entity data from Notion.
 * Provides consistent data fetching pattern with caching and error handling.
 * 
 * @function useEntityData
 * @template T - Entity type (Character, Puzzle, Element, etc.)
 * @template P - Pagination parameters type
 * @param {EntityAPI<T, P>} api - Entity API object with list and listAll methods
 * @param {readonly unknown[]} queryKey - Base query key for caching
 * @param {UseEntityDataOptions} [options={}] - Pagination and query options
 * @returns {EntityDataResult<T>} Query result with entity data, loading states, and error handling
 * 
 * **Caching Strategy:**
 * - Cache key includes pagination params for granular caching
 * - Stale time from global config (default: 5 minutes)
 * - Garbage collection at 2x stale time
 * - Refetch on window focus and network reconnect
 * 
 * **Complexity:** O(1) for cache lookup, O(n) for data processing
 * 
 * @example
 * // Basic usage with pagination
 * const charactersResult = useEntityData(
 *   charactersApi,
 *   ['characters'],
 *   { limit: 10, cursor: 'abc' }
 * );
 * 
 * @example
 * // With custom filters
 * const puzzlesResult = useEntityData(
 *   puzzlesApi,
 *   ['puzzles'],
 *   { limit: 20, tier: 1, solved: false }
 * );
 */
export function useEntityData<T, P extends PaginationParams = PaginationParams>(
  api: EntityAPI<T, P>,
  queryKey: readonly unknown[],
  options: UseEntityDataOptions = {}
): EntityDataResult<T> {
  const { enabled = true, staleTime = QUERY_STALE_TIME, ...params } = options;

  const query = useQuery({
    queryKey: [...queryKey, 'list', params],
    queryFn: () => api.list(params as P),
    enabled,
    staleTime,
    gcTime: staleTime * 2, // Keep in cache for 2x stale time
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  });

  // Extract pagination metadata from the response
  const response = query.data;
  const entities = response?.data ?? undefined;
  const nextCursor = response?.nextCursor ?? null; // Keep null instead of undefined for consistency
  const hasMore = response?.hasMore ?? false;

  return {
    // Data
    data: entities,
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
  };
}

/**
 * Generic hook for fetching all entity data without pagination.
 * Handles pagination internally by fetching all pages sequentially.
 * 
 * @function useAllEntityData
 * @template T - Entity type
 * @param {EntityAPI<T>} api - Entity API object with listAll method
 * @param {readonly unknown[]} queryKey - Base query key for caching
 * @param {Omit<UseEntityDataOptions, 'limit' | 'cursor'>} [options={}] - Query options (excludes pagination)
 * @param {string} [debug] - Optional debug label for console logging
 * @returns {UseQueryResult<T[], Error>} Query result with all entities
 * 
 * **⚠️ Performance Warning:**
 * - Fetches ALL entities sequentially
 * - Can be slow for large datasets (100+ items)
 * - Consider using paginated version for better UX
 * - Cached separately from paginated queries
 * 
 * **Use Cases:**
 * - Dropdowns and select lists
 * - Initial graph rendering
 * - Export operations
 * - Relationship resolution
 * 
 * **Complexity:** O(p*n) where p = pages, n = items per page
 * 
 * @example
 * // Fetch all characters for dropdown
 * const { data: allCharacters, isLoading } = useAllEntityData(
 *   charactersApi,
 *   ['characters'],
 *   { enabled: true },
 *   'CharacterDropdown'
 * );
 * 
 * @example
 * // Conditional fetching
 * const { data: elements } = useAllEntityData(
 *   elementsApi,
 *   ['elements'],
 *   { enabled: userHasPermission }
 * );
 */
export function useAllEntityData<T>(
  api: EntityAPI<T>,
  queryKey: readonly unknown[],
  options: Omit<UseEntityDataOptions, 'limit' | 'cursor'> = {},
  debug?: string
) {
  const { enabled = true, staleTime = QUERY_STALE_TIME } = options;

  return useQuery({
    queryKey: [...queryKey, 'all'], // Different key from paginated version
    queryFn: async () => {
      if (debug) {
        console.debug(`[${debug}] Starting to fetch all entities`);
      }
      const result = await api.listAll();
      if (debug) {
        console.debug(`[${debug}] Fetched total entities:`, undefined, result.length);
      }
      return result;
    },
    enabled,
    staleTime,
    gcTime: staleTime * 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  });
}