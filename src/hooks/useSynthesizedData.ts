import { useQuery } from '@tanstack/react-query';
import { synthesizedApi } from '@/services/api';
import type { SynthesizedFilterParams } from '@/services/api';

/**
 * React Query hook for fetching all entities with synthesized bidirectional relationships
 * This provides properly linked puzzle-element relationships that work in both directions
 */
export function useSynthesizedData(filters?: SynthesizedFilterParams) {
  return useQuery({
    queryKey: ['synthesized', filters || 'all'],
    queryFn: () => synthesizedApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Helper hook to get just elements from synthesized data
 */
export function useSynthesizedElements() {
  const { data, ...rest } = useSynthesizedData();
  return {
    data: data?.elements,
    ...rest
  };
}

/**
 * Helper hook to get just puzzles from synthesized data
 */
export function useSynthesizedPuzzles() {
  const { data, ...rest } = useSynthesizedData();
  return {
    data: data?.puzzles,
    ...rest
  };
}