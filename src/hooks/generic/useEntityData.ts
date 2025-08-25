/**
 * Generic hooks for entity data fetching
 * Consolidates duplicate patterns across entity-specific hooks
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/lib/queryClient';
import type { PaginationParams } from '@/services/api';
import type { APIResponse } from '@/types/notion/app';
import { logger } from '@/lib/graph/utils/Logger'


/**
 * Hook options for fetching entities
 */
export interface UseEntityDataOptions extends PaginationParams {
  enabled?: boolean;
  staleTime?: number;
  [key: string]: any; // Allow additional filter params
}

/**
 * Entity API interface that all entity APIs must implement
 */
export interface EntityAPI<T, P extends PaginationParams = PaginationParams> {
  list: (params?: P) => Promise<APIResponse<T>>;
  listAll: () => Promise<T[]>;
}

/**
 * Return type for paginated entity data
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
 * Generic hook for fetching paginated entity data from Notion
 * 
 * @param api - Entity API object with list and listAll methods
 * @param queryKey - Base query key for caching
 * @param options - Pagination and query options
 * @returns Query result with entity data, loading states, and error handling
 * 
 * @example
 * const charactersResult = useEntityData(
 *   charactersApi,
 *   ['characters'],
 *   { limit: 10, cursor: 'abc' }
 * )
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
 * Generic hook for fetching all entity data (handles pagination internally)
 * Use with caution as this will fetch all pages sequentially
 * 
 * @param api - Entity API object with list and listAll methods
 * @param queryKey - Base query key for caching
 * @param options - Query options (no pagination params)
 * @param debug - Optional debug label for console logging
 * @returns Query result with all entities
 * 
 * @example
 * const { data: allCharacters, isLoading } = useAllEntityData(
 *   charactersApi,
 *   ['characters'],
 *   { enabled: true }
 * )
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
        logger.debug(`[${debug}] Starting to fetch all entities`);
      }
      const result = await api.listAll();
      if (debug) {
        logger.debug(`[${debug}] Fetched total entities:`, undefined, result.length);
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