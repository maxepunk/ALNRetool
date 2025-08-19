/**
 * Entity-specific mutation hooks
 * Generated using the createEntityMutation factory
 */

import { createEntityMutation } from './createEntityMutation';
import { charactersApi, elementsApi, puzzlesApi, timelineApi } from '@/services/api';

/**
 * Hook for updating character entities
 */
export const useUpdateCharacter = createEntityMutation({
  entityType: 'characters',
  apiService: charactersApi,
  queryKey: ['notion', 'characters'] as const,
});

/**
 * Hook for updating element entities
 */
export const useUpdateElement = createEntityMutation({
  entityType: 'elements',
  apiService: elementsApi,
  queryKey: ['notion', 'elements'] as const,
});

/**
 * Hook for updating puzzle entities
 */
export const useUpdatePuzzle = createEntityMutation({
  entityType: 'puzzles',
  apiService: puzzlesApi,
  queryKey: ['notion', 'puzzles'] as const,
});

/**
 * Hook for updating timeline event entities
 */
export const useUpdateTimelineEvent = createEntityMutation({
  entityType: 'timeline',
  apiService: timelineApi,
  queryKey: ['notion', 'timeline'] as const,
});

// Re-export utilities from factory
export { getErrorMessage, requiresSFPattern, validateUpdates } from './createEntityMutation';