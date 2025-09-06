/**
 * Entity Mutation Hooks
 * 
 * Provides a unified hook for all entity mutations (create, update, delete)
 * across all entity types (character, element, puzzle, timeline).
 * 
 * @module hooks/mutations
 * 
 * **Architecture:**
 * - Single unified hook replaces 18 individual hooks
 * - Factory-based hook generation for type safety
 * - React Query mutation pattern
 * - Optimistic updates with rollback
 * - Automatic cache invalidation
 * - Error handling with recovery
 * 
 * **Usage:**
 * ```typescript
 * import { useEntityMutation } from '@/hooks/mutations';
 * 
 * // Create mutation
 * const createMutation = useEntityMutation('character', 'create');
 * await createMutation.mutateAsync({ name: 'New Character' });
 * 
 * // Update mutation
 * const updateMutation = useEntityMutation('element', 'update');
 * await updateMutation.mutateAsync({ id: 'elem-123', name: 'Updated' });
 * 
 * // Delete mutation
 * const deleteMutation = useEntityMutation('puzzle', 'delete');
 * await deleteMutation.mutateAsync({ id: 'puzzle-456' });
 * ```
 */

// Export the unified hook and necessary types
export { 
  useEntityMutation,
  type EntityType,
  type MutationType,
  type Entity
} from './entityMutations';