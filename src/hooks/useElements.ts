import { elementsApi, type ElementFilterParams } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useEntityData, useAllEntityData, type UseEntityDataOptions } from './generic/useEntityData';
import type { Element } from '@/types/notion/app';

/**
 * Element hook options extending filter params
 */
export interface UseElementOptions extends UseEntityDataOptions, Omit<ElementFilterParams, keyof UseEntityDataOptions> {}

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
 * // With filters
 * const { data } = useElements({ status: 'complete', lastEdited: 'week' })
 * 
 * @example
 * // Disabled until ready
 * const { data } = useElements({ enabled: false })
 */
export function useElements(options: UseElementOptions = {}) {
  return useEntityData<Element, ElementFilterParams>(
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