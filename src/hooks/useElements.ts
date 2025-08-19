import { elementsApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useEntityData, useAllEntityData, type UseEntityDataOptions } from './generic/useEntityData';
import type { Element } from '@/types/notion/app';

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
export function useElements(options: UseEntityDataOptions = {}) {
  return useEntityData<Element>(
    elementsApi,
    queryKeys.elements(),
    options
  );
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
export function useAllElements(options: Omit<UseEntityDataOptions, 'limit' | 'cursor'> = {}) {
  return useAllEntityData<Element>(
    elementsApi,
    queryKeys.elements(),
    options,
    'useAllElements' // Debug label
  );
}