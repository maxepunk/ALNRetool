import { timelineApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useEntityData, useAllEntityData, type UseEntityDataOptions } from './generic/useEntityData';
import type { TimelineEvent } from '@/types/notion/app';

/**
 * Custom hook for fetching timeline events from Notion
 * 
 * @param options - Pagination and query options
 * @returns Query result with timeline data, loading states, and error handling
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
export function useTimeline(options: UseEntityDataOptions = {}) {
  return useEntityData<TimelineEvent>(
    timelineApi,
    queryKeys.timeline(),
    options
  );
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
export function useAllTimeline(options: Omit<UseEntityDataOptions, 'limit' | 'cursor'> = {}) {
  return useAllEntityData<TimelineEvent>(
    timelineApi,
    queryKeys.timeline(),
    options,
    'useAllTimeline' // Debug label
  );
}