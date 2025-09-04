/**
 * Entity Save Hook
 * 
 * Shared hook for handling entity saves across all views.
 * Provides a unified interface for saving any entity type,
 * abstracting away the individual mutation hooks and entity type detection.
 * 
 * @module hooks/useEntitySave
 * 
 * **Architecture:**
 * - Single responsibility: Views don't need to know about multiple hooks
 * - DRY: Entity type detection logic in one place
 * - Consistent: All views use the same save handler
 * - Testable: One hook to test instead of multiple implementations
 * 
 * **Features:**
 * - Automatic entity type detection
 * - Unified error handling
 * - Consolidated loading states
 * - TypeScript type safety
 * 
 * **Usage:**
 * ```typescript
 * const { handleEntitySave, isSaving, error } = useEntitySave();
 * 
 * // Save with automatic type detection
 * await handleEntitySave(updates, entity);
 * 
 * // Save with explicit type
 * await handleEntitySave(updates, null, 'element');
 * ```
 */

import { useCallback } from 'react';
import { createEntityMutation, type EntityType as MutationEntityType } from '@/hooks/mutations';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

/**
 * Union type for all entity types.
 * @typedef {Character | Element | Puzzle | TimelineEvent} Entity
 */
type Entity = Character | Element | Puzzle | TimelineEvent;

/**
 * Entity type discriminator.
 * Using the type from mutations module for consistency.
 */
type EntityType = MutationEntityType;

/**
 * Hook that provides a unified entity save handler.
 * Automatically detects entity type and routes to appropriate mutation.
 * 
 * @function useEntitySave
 * @returns {Object} Save handler and status
 * @returns {Function} returns.handleEntitySave - Unified save function
 * @returns {boolean} returns.isSaving - Any mutation in progress
 * @returns {Error|null} returns.error - Any mutation error
 * 
 * **Type Detection:**
 * - Characters: Have 'tier' property
 * - Puzzles: Have 'descriptionSolution' property
 * - Elements: Have 'descriptionText' (but not 'descriptionSolution')
 * - Timeline: Have 'date' and 'charactersInvolvedIds'
 * 
 * @example
 * // In DetailPanel or any component
 * const { handleEntitySave, isSaving } = useEntitySave();
 * 
 * const onSave = async () => {
 *   try {
 *     await handleEntitySave(formData, selectedEntity);
 *     toast.success('Saved successfully');
 *   } catch (error) {
 *     toast.error('Save failed');
 *   }
 * };
 */
export function useEntitySave() {
  // Create mutation hooks for all entity types upfront (Rules of Hooks)
  const characterMutation = createEntityMutation('character', 'update')();
  const puzzleMutation = createEntityMutation('puzzle', 'update')();
  const elementMutation = createEntityMutation('element', 'update')();
  const timelineMutation = createEntityMutation('timeline', 'update')();

  /**
   * Unified save handler for all entity types.
   * Detects entity type and routes to correct mutation.
   * 
   * @param {Partial<Entity>} updates - Fields to update
   * @param {Entity|null} [entity] - Original entity for type detection
   * @param {EntityType} [entityType] - Explicit type override
   * @returns {Promise<void>}
   * @throws {Error} If entity ID missing or type cannot be determined
   */
  const handleEntitySave = useCallback(async (
    updates: Partial<Entity>,
    entity?: Entity | null,
    entityType?: EntityType
  ): Promise<void> => {

    // Get entity ID and type
    const entityId = (updates as any).id || (entity as any)?.id;
    if (!entityId) {
      throw new Error('Entity ID is required for updates');
    }

    // Detect entity type if not provided
    const type = entityType || detectEntityType(entity || updates);
    if (!type) {
      throw new Error('Could not determine entity type');
    }

    // Extract version from original entity for optimistic locking
    const version = (entity as any)?.version;

    // Select the appropriate mutation based on entity type
    const mutation = 
      type === 'character' ? characterMutation :
      type === 'puzzle' ? puzzleMutation :
      type === 'element' ? elementMutation :
      type === 'timeline' ? timelineMutation :
      null;
      
    if (!mutation) {
      throw new Error(`Unknown entity type: ${type}`);
    }
    
    // Call the mutation
    try {
      await mutation.mutateAsync({
        ...updates,
        id: entityId,
        version // Pass original version for If-Match header
      });
    } catch (error) {
      console.error('Failed to save entity:', undefined, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [characterMutation, puzzleMutation, elementMutation, timelineMutation]);

  // Return save handler and loading states
  return {
    handleEntitySave,
    isSaving: 
      characterMutation.isPending || 
      puzzleMutation.isPending || 
      elementMutation.isPending || 
      timelineMutation.isPending,
    error: 
      characterMutation.error || 
      puzzleMutation.error || 
      elementMutation.error || 
      timelineMutation.error
  };
}

/**
 * Detect entity type from entity object.
 * Uses entityType field first, falls back to property detection for backward compatibility.
 * 
 * @function detectEntityType
 * @param {Partial<Entity>} entity - Entity object to analyze
 * @returns {EntityType|null} Detected type or null
 * 
 * **Detection Rules:**
 * - Primary: Use entityType field if present
 * - Fallback: Property-based detection for older data
 * 
 * @example
 * detectEntityType({ entityType: 'character', name: 'Alice' }) // 'character'
 * detectEntityType({ tier: 'Core', name: 'Alice' }) // 'character' (fallback)
 */
function detectEntityType(entity: Partial<Entity>): EntityType | null {
  if (!entity || typeof entity !== 'object') return null;

  // Primary: Use entityType field if present
  if ('entityType' in entity) {
    return entity.entityType as EntityType;
  }

  // Fallback: Type detection based on unique properties (for backward compatibility)
  if ('tier' in entity) return 'character';
  if ('descriptionSolution' in entity) return 'puzzle';
  if ('descriptionText' in entity && !('descriptionSolution' in entity)) return 'element';
  if ('date' in entity && 'charactersInvolvedIds' in entity) return 'timeline';

  return null;
}

// Export for testing
export { detectEntityType };