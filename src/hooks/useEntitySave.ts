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
import { 
  useUpdateCharacter, 
  useUpdateElement, 
  useUpdatePuzzle, 
  useUpdateTimelineEvent 
} from '@/hooks/mutations';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

/**
 * Union type for all entity types.
 * @typedef {Character | Element | Puzzle | TimelineEvent} Entity
 */
type Entity = Character | Element | Puzzle | TimelineEvent;

/**
 * Entity type discriminator.
 * @typedef {'character' | 'element' | 'puzzle' | 'timeline'} EntityType
 */
type EntityType = 'character' | 'element' | 'puzzle' | 'timeline';

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
  // Get all mutation hooks
  const updateCharacter = useUpdateCharacter();
  const updatePuzzle = useUpdatePuzzle();
  const updateElement = useUpdateElement();
  const updateTimeline = useUpdateTimelineEvent();

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

    // Call appropriate mutation based on entity type
    try {
      switch (type) {
        case 'character':
          await updateCharacter.mutateAsync({ 
            ...updates as Partial<Character>,
            id: entityId,
            version // Pass original version for If-Match header
          });
          break;
          
        case 'puzzle':
          await updatePuzzle.mutateAsync({ 
            ...updates as Partial<Puzzle>,
            id: entityId,
            version // Pass original version for If-Match header
          });
          break;
          
        case 'element':
          await updateElement.mutateAsync({ 
            ...updates as Partial<Element>,
            id: entityId,
            version // Pass original version for If-Match header
          });
          break;
          
        case 'timeline':
          await updateTimeline.mutateAsync({ 
            ...updates as Partial<TimelineEvent>,
            id: entityId,
            version // Pass original version for If-Match header
          });
          break;
          
        default:
          throw new Error(`Unknown entity type: ${type}`);
      }
    } catch (error) {
      console.error('Failed to save entity:', undefined, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [updateCharacter, updatePuzzle, updateElement, updateTimeline]);

  // Return save handler and loading states
  return {
    handleEntitySave,
    isSaving: 
      updateCharacter.isPending || 
      updatePuzzle.isPending || 
      updateElement.isPending || 
      updateTimeline.isPending,
    error: 
      updateCharacter.error || 
      updatePuzzle.error || 
      updateElement.error || 
      updateTimeline.error
  };
}

/**
 * Detect entity type from entity object.
 * Uses unique properties to identify entity type.
 * 
 * @function detectEntityType
 * @param {Partial<Entity>} entity - Entity object to analyze
 * @returns {EntityType|null} Detected type or null
 * 
 * **Detection Rules:**
 * - Character: Has 'tier' property
 * - Puzzle: Has 'descriptionSolution' property
 * - Element: Has 'descriptionText' but not 'descriptionSolution'
 * - Timeline: Has both 'date' and 'charactersInvolvedIds'
 * 
 * @example
 * detectEntityType({ tier: 'Core', name: 'Alice' }) // 'character'
 * detectEntityType({ descriptionSolution: '...' }) // 'puzzle'
 * detectEntityType({ descriptionText: '...' }) // 'element'
 * detectEntityType({ date: '2024-01-01', charactersInvolvedIds: [] }) // 'timeline'
 */
function detectEntityType(entity: Partial<Entity>): EntityType | null {
  if (!entity || typeof entity !== 'object') return null;

  // Type detection based on unique properties
  if ('tier' in entity) return 'character';
  if ('descriptionSolution' in entity) return 'puzzle';
  if ('descriptionText' in entity && !('descriptionSolution' in entity)) return 'element';
  if ('date' in entity && 'charactersInvolvedIds' in entity) return 'timeline';

  return null;
}

// Export for testing
export { detectEntityType };