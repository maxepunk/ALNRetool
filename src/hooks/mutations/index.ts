/**
 * Entity Mutation Hooks
 * 
 * Provides React hooks for updating entities in Notion via the API.
 * All hooks are generated using the unified entityMutations factory.
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
 *   name: 'New Name'
 * });
 * ```
 */

// Re-export all mutation hooks from the unified factory
export {
  // Character mutations
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
  
  // Element mutations
  useCreateElement,
  useUpdateElement,
  useDeleteElement,
  
  // Puzzle mutations
  useCreatePuzzle,
  useUpdatePuzzle,
  useDeletePuzzle,
  
  // Timeline mutations (with aliases for backward compatibility)
  useCreateTimeline,
  useCreateTimeline as useCreateTimelineEvent,
  useUpdateTimeline,
  useUpdateTimeline as useUpdateTimelineEvent,
  useDeleteTimeline,
  useDeleteTimeline as useDeleteTimelineEvent,
  
  // Generic mutations
  useBatchEntityMutation,
  
  // Types
  type EntityType,
  type MutationType,
  type Entity,
  type MutationPayload
} from './entityMutations';