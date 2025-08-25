/**
 * Entity Mutation Hooks
 * 
 * Provides React hooks for updating entities in Notion via the API.
 * All hooks are generated using the createEntityMutation factory for consistency.
 * 
 * @module hooks/mutations
 * 
 * **Architecture:**
 * - Factory-based hook generation
 * - React Query mutation pattern
 * - Optimistic updates with rollback
 * - Automatic cache invalidation
 * - Error handling with recovery
 * 
 * **Features:**
 * - Type-safe entity updates
 * - Loading states
 * - Error messages
 * - Success callbacks
 * - Cache synchronization
 * 
 * **Usage:**
 * ```typescript
 * const { mutate } = useUpdateElement();
 * mutate({
 *   id: 'element-123',
 *   updates: { name: 'New Name' }
 * });
 * ```
 */

import { createEntityMutation } from './createEntityMutation';
import { charactersApi, elementsApi, puzzlesApi, timelineApi } from '@/services/api';

/**
 * Hook for updating character entities.
 * Handles updates to character properties in Notion.
 * 
 * @function useUpdateCharacter
 * @returns {UseMutationResult} React Query mutation hook
 * 
 * **Updatable Fields:**
 * - name, type, tier
 * - primaryAction, characterLogline, overview
 * - emotionTowardsCEO
 * - Relationship fields (ownedElementIds, etc.)
 * 
 * @example
 * const { mutate, isLoading, error } = useUpdateCharacter();
 * mutate({
 *   id: 'char-123',
 *   updates: { 
 *     name: 'Updated Character',
 *     tier: 'Core'
 *   }
 * });
 */
export const useUpdateCharacter = createEntityMutation({
  entityType: 'characters',
  apiService: charactersApi,
  queryKey: ['notion', 'characters', 'all'] as const,
});

/**
 * Hook for updating element entities.
 * Handles updates to element properties with SF_ pattern preservation.
 * 
 * @function useUpdateElement
 * @returns {UseMutationResult} React Query mutation hook
 * 
 * **Updatable Fields:**
 * - name, descriptionText, basicType
 * - status, firstAvailable
 * - productionNotes, contentLink
 * - Relationship fields (ownerId, containerId, etc.)
 * - narrativeThreads, filesMedia
 * 
 * **Note:** SF_ patterns in descriptions are preserved automatically
 * 
 * @example
 * const { mutate } = useUpdateElement();
 * mutate({
 *   id: 'elem-456',
 *   updates: { 
 *     status: 'Complete',
 *     descriptionText: 'Contains SF_KEY_001'
 *   }
 * });
 */
export const useUpdateElement = createEntityMutation({
  entityType: 'elements',
  apiService: elementsApi,
  queryKey: ['notion', 'elements', 'all'] as const,
});

/**
 * Hook for updating puzzle entities.
 * Handles updates to puzzle properties and relationships.
 * 
 * @function useUpdatePuzzle
 * @returns {UseMutationResult} React Query mutation hook
 * 
 * **Updatable Fields:**
 * - name, descriptionSolution
 * - assetLink
 * - Relationship fields (puzzleElementIds, lockedItemId, etc.)
 * 
 * **Bidirectional Relations:**
 * Updates to puzzleElementIds or rewardIds automatically
 * update the corresponding element records.
 * 
 * @example
 * const { mutate } = useUpdatePuzzle();
 * mutate({
 *   id: 'puzzle-789',
 *   updates: { 
 *     name: 'Updated Puzzle',
 *     puzzleElementIds: ['elem-1', 'elem-2']
 *   }
 * });
 */
export const useUpdatePuzzle = createEntityMutation({
  entityType: 'puzzles',
  apiService: puzzlesApi,
  queryKey: ['notion', 'puzzles', 'all'] as const,
});

/**
 * Hook for updating timeline event entities.
 * Handles updates to timeline event properties.
 * 
 * @function useUpdateTimelineEvent
 * @returns {UseMutationResult} React Query mutation hook
 * 
 * **Updatable Fields:**
 * - description, date, notes
 * - charactersInvolvedIds
 * - memoryEvidenceIds
 * 
 * @example
 * const { mutate } = useUpdateTimelineEvent();
 * mutate({
 *   id: 'event-321',
 *   updates: { 
 *     description: 'Important Event',
 *     date: '2024-01-15'
 *   }
 * });
 */
export const useUpdateTimelineEvent = createEntityMutation({
  entityType: 'timeline',
  apiService: timelineApi,
  queryKey: ['notion', 'timeline', 'all'] as const,
});

// Re-export utilities from factory
export { getErrorMessage, requiresSFPattern, validateUpdates } from './createEntityMutation';