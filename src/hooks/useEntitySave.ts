/**
 * Shared hook for handling entity saves across all views
 * 
 * This provides a unified interface for saving any entity type,
 * abstracting away the individual mutation hooks and entity type detection.
 * 
 * Benefits:
 * - Single responsibility: Views don't need to know about multiple hooks
 * - DRY: Entity type detection logic in one place
 * - Consistent: All views use the same save handler
 * - Testable: One hook to test instead of three implementations
 */

import { useCallback } from 'react';
import { 
  useUpdateCharacter, 
  useUpdateElement, 
  useUpdatePuzzle, 
  useUpdateTimelineEvent 
} from '@/hooks/mutations';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';
import { logger } from '@/lib/graph/utils/Logger';

type Entity = Character | Element | Puzzle | TimelineEvent;
type EntityType = 'character' | 'element' | 'puzzle' | 'timeline';

/**
 * Hook that provides a unified entity save handler
 * 
 * @returns A function that saves any entity type with automatic type detection
 */
export function useEntitySave() {
  // Get all mutation hooks
  const updateCharacter = useUpdateCharacter();
  const updatePuzzle = useUpdatePuzzle();
  const updateElement = useUpdateElement();
  const updateTimeline = useUpdateTimelineEvent();

  // Create unified save handler
  const handleEntitySave = useCallback(async (
    updates: Partial<Entity>,
    entity?: Entity | null,
    entityType?: EntityType
  ): Promise<void> => {
    // Log in dev mode
    if (import.meta.env.DEV) {
      logger.debug('Saving entity updates:', undefined, { updates, entityType });
    }

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

    // Call appropriate mutation based on entity type
    try {
      switch (type) {
        case 'character':
          await updateCharacter.mutateAsync({ 
            id: entityId, 
            updates: updates as Partial<Character> 
          });
          break;
          
        case 'puzzle':
          await updatePuzzle.mutateAsync({ 
            id: entityId, 
            updates: updates as Partial<Puzzle> 
          });
          break;
          
        case 'element':
          await updateElement.mutateAsync({ 
            id: entityId, 
            updates: updates as Partial<Element> 
          });
          break;
          
        case 'timeline':
          await updateTimeline.mutateAsync({ 
            id: entityId, 
            updates: updates as Partial<TimelineEvent> 
          });
          break;
          
        default:
          throw new Error(`Unknown entity type: ${type}`);
      }
      
      if (import.meta.env.DEV) {
        logger.debug('Entity saved successfully:', undefined, { entityId, type });
      }
    } catch (error) {
      logger.error('Failed to save entity:', undefined, error instanceof Error ? error : new Error(String(error)));
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
 * Detect entity type from entity object
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