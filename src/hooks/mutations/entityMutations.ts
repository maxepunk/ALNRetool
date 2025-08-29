/**
 * Unified Entity Mutation Factory
 * 
 * Provides a consistent interface for all entity mutations (create, update, delete)
 * with proper type safety, error handling, and cache invalidation.
 * 
 * Uses the verified schema constants from schema-mapping.ts
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { charactersApi, elementsApi, puzzlesApi, timelineApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { 
  updateRelatedEntities,
  removeEntityFromCaches
} from '@/lib/cache/mutations';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent 
} from '@/types/notion/app';

// Import performance logging utility if available
const perfLog = typeof window !== 'undefined' ? (window as any).perfLog : null;

// Entity type union
export type EntityType = 'characters' | 'elements' | 'puzzles' | 'timeline';
export type Entity = Character | Element | Puzzle | TimelineEvent;

// Mutation types
export type MutationType = 'create' | 'update' | 'delete';

// Parent relation metadata for atomic creation
export type ParentRelationMetadata = {
  _parentRelation?: {
    parentType: string;
    parentId: string;
    fieldKey: string;
  };
};

// Generic mutation payload
export interface MutationPayload<T extends Entity> {
  type: MutationType;
  entityType: EntityType;
  id?: string;
  data: Partial<T> & ParentRelationMetadata;
  inverseRelations?: Array<{
    entityId: string;
    field: string;
    action: 'add' | 'remove';
  }>;
}

// Error response
interface MutationError {
  message: string;
  code?: string;
  details?: unknown;
}


// Helper function to get API module for entity type
function getApiModule(entityType: EntityType) {
  switch (entityType) {
    case 'characters':
      return charactersApi;
    case 'elements':
      return elementsApi;
    case 'puzzles':
      return puzzlesApi;
    case 'timeline':
      return timelineApi;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

// Helper function to get query key for entity type
function getQueryKeyForType(entityType: EntityType) {
  switch (entityType) {
    case 'characters':
      return queryKeys.characters();
    case 'elements':
      return queryKeys.elements();
    case 'puzzles':
      return queryKeys.puzzles();
    case 'timeline':
      return queryKeys.timeline();
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

// ============================================================================
// CHARACTER MUTATIONS
// ============================================================================

/**
 * Create a new character
 */
export function useCreateCharacter(
  options?: UseMutationOptions<Character, MutationError, Partial<Character> & ParentRelationMetadata>
) {
  const queryClient = useQueryClient();
  
  return useMutation<Character, MutationError, Partial<Character> & ParentRelationMetadata>({
    mutationFn: async (data) => {
      // Extract parent relation metadata if present
      const { _parentRelation, ...entityData } = data;
      
      // Validate relationships in parallel if needed
      const needsElementValidation = entityData.ownedElementIds?.length || entityData.associatedElementIds?.length;
      const needsPuzzleValidation = entityData.characterPuzzleIds?.length;
      
      if (needsElementValidation || needsPuzzleValidation) {
        // Fetch both element and puzzle lists in parallel
        const [elements, puzzles] = await Promise.all([
          needsElementValidation ? elementsApi.listAll() : Promise.resolve([]),
          needsPuzzleValidation ? puzzlesApi.listAll() : Promise.resolve([])
        ]);
        
        // Validate element relationships
        if (needsElementValidation) {
          const elementIds = elements.map(e => e.id);
          
          const invalidOwned = entityData.ownedElementIds?.filter(id => !elementIds.includes(id)) || [];
          const invalidAssoc = entityData.associatedElementIds?.filter(id => !elementIds.includes(id)) || [];
          
          if (invalidOwned.length > 0) {
            throw new Error(`Invalid owned element IDs: ${invalidOwned.join(', ')}`);
          }
          if (invalidAssoc.length > 0) {
            throw new Error(`Invalid associated element IDs: ${invalidAssoc.join(', ')}`);
          }
        }
        
        // Validate puzzle relationships
        if (needsPuzzleValidation) {
          const puzzleIds = puzzles.map(p => p.id);
          
          const invalidPuzzles = entityData.characterPuzzleIds!.filter(id => !puzzleIds.includes(id));
          if (invalidPuzzles.length > 0) {
            throw new Error(`Invalid puzzle IDs: ${invalidPuzzles.join(', ')}`);
          }
        }
      }
      
      return await charactersApi.create(entityData);
    },
    
    onSuccess: (character, variables) => {
      // Track cache updates for performance monitoring
      if (perfLog) {
        perfLog.cacheUpdates++;
      }
      
      // Add to list cache
      queryClient.setQueryData(
        queryKeys.characters(),
        (old: Character[] = []) => [...old, character]
      );
      
      // Set individual cache
      queryClient.setQueryData(
        queryKeys.character(character.id),
        character
      );
      
      // Parent relation updates are handled server-side atomically
      // This prevents dual cache updates and race conditions
      
      toast.success(`Created ${character.name || 'character'}`);
      options?.onSuccess?.(character, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      toast.error(error.message || 'Failed to create character');
      options?.onError?.(error, variables, context);
    }
  });
}

/**
 * Update an existing character
 */
export function useUpdateCharacter(
  options?: UseMutationOptions<Character, MutationError, Partial<Character> & { id: string }>
) {
  const queryClient = useQueryClient();
  
  return useMutation<Character, MutationError, Partial<Character> & { id: string }>({
    mutationFn: async ({ id, ...data }) => {
      return await charactersApi.update(id, data);
    },
    
    onSuccess: async (character, variables) => {
      // Update list cache
      queryClient.setQueryData(
        queryKeys.characters(),
        (old: Character[] = []) => 
          old.map(c => c.id === character.id ? character : c)
      );
      
      // Update individual cache
      queryClient.setQueryData(
        queryKeys.character(character.id),
        character
      );
      
      // Update related entities with bidirectional relationships
      const updatedFields = Object.entries(variables).reduce<Partial<Character>>((acc, [key, value]) => {
        if (key !== 'id' && value !== undefined) {
          return { ...acc, [key]: value };
        }
        return acc;
      }, {});
      
      if (Object.keys(updatedFields).length > 0) {
        updateRelatedEntities(queryClient, 'characters', character, updatedFields);
      }
      
      toast.success(`Updated ${character.name || 'character'}`);
      options?.onSuccess?.(character, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      toast.error(error.message || 'Failed to update character');
      options?.onError?.(error, variables, context);
    }
  });
}

/**
 * Delete a character
 */
export function useDeleteCharacter(
  options?: UseMutationOptions<void, MutationError, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation<void, MutationError, string>({
    mutationFn: async (id: string) => {
      return await charactersApi.delete(id);
    },
    
    onSuccess: (_, id) => {
      // Remove from caches
      removeEntityFromCaches(queryClient, 'characters', id);
      
      toast.success('Character deleted');
      options?.onSuccess?.(undefined, id, undefined);
    },
    
    onError: (error, id, context) => {
      toast.error(error.message || 'Failed to delete character');
      options?.onError?.(error, id, context);
    }
  });
}

// ============================================================================
// ELEMENT MUTATIONS
// ============================================================================

/**
 * Create a new element
 */
export function useCreateElement(
  options?: UseMutationOptions<Element, MutationError, Partial<Element> & ParentRelationMetadata>
) {
  const queryClient = useQueryClient();
  
  return useMutation<Element, MutationError, Partial<Element> & ParentRelationMetadata>({
    mutationFn: async (data) => {
      // Extract parent relation metadata if present
      const { _parentRelation, ...entityData } = data;
      return await elementsApi.create(entityData);
    },
    
    onSuccess: (element, variables) => {
      if (perfLog) {
        perfLog.cacheUpdates++;
      }
      
      // Add to list cache
      queryClient.setQueryData(
        queryKeys.elements(),
        (old: Element[] = []) => [...old, element]
      );
      
      // Set individual cache
      queryClient.setQueryData(
        queryKeys.element(element.id),
        element
      );
      
      toast.success(`Created ${element.name || 'element'}`);
      options?.onSuccess?.(element, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      toast.error(error.message || 'Failed to create element');
      options?.onError?.(error, variables, context);
    }
  });
}

/**
 * Update an existing element
 */
export function useUpdateElement(
  options?: UseMutationOptions<Element, MutationError, Partial<Element> & { id: string }>
) {
  const queryClient = useQueryClient();
  
  return useMutation<Element, MutationError, Partial<Element> & { id: string }>({
    mutationFn: async ({ id, ...data }) => {
      return await elementsApi.update(id, data);
    },
    
    onSuccess: async (element, variables) => {
      // Update list cache
      queryClient.setQueryData(
        queryKeys.elements(),
        (old: Element[] = []) => 
          old.map(e => e.id === element.id ? element : e)
      );
      
      // Update individual cache
      queryClient.setQueryData(
        queryKeys.element(element.id),
        element
      );
      
      // Update related entities with bidirectional relationships
      const updatedFields = Object.entries(variables).reduce<Partial<Element>>((acc, [key, value]) => {
        if (key !== 'id' && value !== undefined) {
          return { ...acc, [key]: value };
        }
        return acc;
      }, {});
      
      if (Object.keys(updatedFields).length > 0) {
        updateRelatedEntities(queryClient, 'elements', element, updatedFields);
      }
      
      toast.success(`Updated ${element.name || 'element'}`);
      options?.onSuccess?.(element, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      toast.error(error.message || 'Failed to update element');
      options?.onError?.(error, variables, context);
    }
  });
}

/**
 * Delete an element
 */
export function useDeleteElement(
  options?: UseMutationOptions<void, MutationError, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation<void, MutationError, string>({
    mutationFn: async (id: string) => {
      return await elementsApi.delete(id);
    },
    
    onSuccess: (_, id) => {
      // Remove from caches
      removeEntityFromCaches(queryClient, 'elements', id);
      
      toast.success('Element deleted');
      options?.onSuccess?.(undefined, id, undefined);
    },
    
    onError: (error, id, context) => {
      toast.error(error.message || 'Failed to delete element');
      options?.onError?.(error, id, context);
    }
  });
}

// ============================================================================
// PUZZLE MUTATIONS
// ============================================================================

/**
 * Create a new puzzle
 */
export function useCreatePuzzle(
  options?: UseMutationOptions<Puzzle, MutationError, Partial<Puzzle> & ParentRelationMetadata>
) {
  const queryClient = useQueryClient();
  
  return useMutation<Puzzle, MutationError, Partial<Puzzle> & ParentRelationMetadata>({
    mutationFn: async (data) => {
      // Extract parent relation metadata if present
      const { _parentRelation, ...entityData } = data;
      
      // Validate relationships - using Promise.all pattern for consistency and future expansion
      const needsElementValidation = entityData.rewardIds?.length || entityData.puzzleElementIds?.length;
      
      if (needsElementValidation) {
        // Fetch element list (could add more validations in parallel in future)
        const [elements] = await Promise.all([
          elementsApi.listAll()
        ]);
        
        const elementIds = elements.map(e => e.id);
        
        // Validate reward elements
        if (entityData.rewardIds?.length) {
          const invalidRewards = entityData.rewardIds.filter(id => !elementIds.includes(id));
          if (invalidRewards.length > 0) {
            throw new Error(`Invalid reward element IDs: ${invalidRewards.join(', ')}`);
          }
        }
        
        // Validate puzzle elements (requirements)
        if (entityData.puzzleElementIds?.length) {
          const invalidRequirements = entityData.puzzleElementIds.filter(id => !elementIds.includes(id));
          if (invalidRequirements.length > 0) {
            throw new Error(`Invalid puzzle element IDs: ${invalidRequirements.join(', ')}`);
          }
        }
      }
      
      return await puzzlesApi.create(entityData);
    },
    
    onSuccess: (puzzle, variables) => {
      if (perfLog) {
        perfLog.cacheUpdates++;
      }
      
      // Add to list cache
      queryClient.setQueryData(
        queryKeys.puzzles(),
        (old: Puzzle[] = []) => [...old, puzzle]
      );
      
      // Set individual cache
      queryClient.setQueryData(
        queryKeys.puzzle(puzzle.id),
        puzzle
      );
      
      toast.success(`Created ${puzzle.name || 'puzzle'}`);
      options?.onSuccess?.(puzzle, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      toast.error(error.message || 'Failed to create puzzle');
      options?.onError?.(error, variables, context);
    }
  });
}

/**
 * Update an existing puzzle
 */
export function useUpdatePuzzle(
  options?: UseMutationOptions<Puzzle, MutationError, Partial<Puzzle> & { id: string }>
) {
  const queryClient = useQueryClient();
  
  return useMutation<Puzzle, MutationError, Partial<Puzzle> & { id: string }>({
    mutationFn: async ({ id, ...data }) => {
      return await puzzlesApi.update(id, data);
    },
    
    onSuccess: async (puzzle, variables) => {
      // Update list cache
      queryClient.setQueryData(
        queryKeys.puzzles(),
        (old: Puzzle[] = []) => 
          old.map(p => p.id === puzzle.id ? puzzle : p)
      );
      
      // Update individual cache
      queryClient.setQueryData(
        queryKeys.puzzle(puzzle.id),
        puzzle
      );
      
      // Update related entities with bidirectional relationships
      const updatedFields = Object.entries(variables).reduce<Partial<Puzzle>>((acc, [key, value]) => {
        if (key !== 'id' && value !== undefined) {
          return { ...acc, [key]: value };
        }
        return acc;
      }, {});
      
      if (Object.keys(updatedFields).length > 0) {
        updateRelatedEntities(queryClient, 'puzzles', puzzle, updatedFields);
      }
      
      toast.success(`Updated ${puzzle.name || 'puzzle'}`);
      options?.onSuccess?.(puzzle, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      toast.error(error.message || 'Failed to update puzzle');
      options?.onError?.(error, variables, context);
    }
  });
}

/**
 * Delete a puzzle
 */
export function useDeletePuzzle(
  options?: UseMutationOptions<void, MutationError, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation<void, MutationError, string>({
    mutationFn: async (id: string) => {
      return await puzzlesApi.delete(id);
    },
    
    onSuccess: (_, id) => {
      // Remove from caches
      removeEntityFromCaches(queryClient, 'puzzles', id);
      
      toast.success('Puzzle deleted');
      options?.onSuccess?.(undefined, id, undefined);
    },
    
    onError: (error, id, context) => {
      toast.error(error.message || 'Failed to delete puzzle');
      options?.onError?.(error, id, context);
    }
  });
}

// ============================================================================
// TIMELINE MUTATIONS
// ============================================================================

/**
 * Create a new timeline event
 */
export function useCreateTimeline(
  options?: UseMutationOptions<TimelineEvent, MutationError, Partial<TimelineEvent> & ParentRelationMetadata>
) {
  const queryClient = useQueryClient();
  
  return useMutation<TimelineEvent, MutationError, Partial<TimelineEvent> & ParentRelationMetadata>({
    mutationFn: async (data) => {
      // Extract parent relation metadata if present
      const { _parentRelation, ...entityData } = data;
      return await timelineApi.create(entityData);
    },
    
    onSuccess: (event, variables) => {
      if (perfLog) {
        perfLog.cacheUpdates++;
      }
      
      // Add to list cache
      queryClient.setQueryData(
        queryKeys.timeline(),
        (old: TimelineEvent[] = []) => [...old, event]
      );
      
      // Set individual cache
      queryClient.setQueryData(
        queryKeys.timelineEvent(event.id),
        event
      );
      
      toast.success('Created timeline event');
      options?.onSuccess?.(event, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      toast.error(error.message || 'Failed to create timeline event');
      options?.onError?.(error, variables, context);
    }
  });
}

/**
 * Update an existing timeline event
 */
export function useUpdateTimeline(
  options?: UseMutationOptions<TimelineEvent, MutationError, Partial<TimelineEvent> & { id: string }>
) {
  const queryClient = useQueryClient();
  
  return useMutation<TimelineEvent, MutationError, Partial<TimelineEvent> & { id: string }>({
    mutationFn: async ({ id, ...data }) => {
      return await timelineApi.update(id, data);
    },
    
    onSuccess: async (event, variables) => {
      // Update list cache
      queryClient.setQueryData(
        queryKeys.timeline(),
        (old: TimelineEvent[] = []) => 
          old.map(e => e.id === event.id ? event : e)
      );
      
      // Update individual cache
      queryClient.setQueryData(
        queryKeys.timelineEvent(event.id),
        event
      );
      
      // Update related entities with bidirectional relationships
      const updatedFields = Object.entries(variables).reduce<Partial<TimelineEvent>>((acc, [key, value]) => {
        if (key !== 'id' && value !== undefined) {
          return { ...acc, [key]: value };
        }
        return acc;
      }, {});
      
      if (Object.keys(updatedFields).length > 0) {
        updateRelatedEntities(queryClient, 'timeline', event, updatedFields);
      }
      
      toast.success('Updated timeline event');
      options?.onSuccess?.(event, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      toast.error(error.message || 'Failed to update timeline event');
      options?.onError?.(error, variables, context);
    }
  });
}

/**
 * Delete a timeline event
 */
export function useDeleteTimeline(
  options?: UseMutationOptions<void, MutationError, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation<void, MutationError, string>({
    mutationFn: async (id: string) => {
      return await timelineApi.delete(id);
    },
    
    onSuccess: (_, id) => {
      // Remove from caches
      removeEntityFromCaches(queryClient, 'timeline', id);
      
      toast.success('Timeline event deleted');
      options?.onSuccess?.(undefined, id, undefined);
    },
    
    onError: (error, id, context) => {
      toast.error(error.message || 'Failed to delete timeline event');
      options?.onError?.(error, id, context);
    }
  });
}

// Aliases for backward compatibility
export const useCreateTimelineEvent = useCreateTimeline;
export const useUpdateTimelineEvent = useUpdateTimeline;
export const useDeleteTimelineEvent = useDeleteTimeline;

// Note: Generic entity mutation hook was removed as it violated React's rules of hooks
// by calling hooks conditionally. Use the specific hooks directly instead:
// useCreateCharacter, useUpdateCharacter, useDeleteCharacter, etc.

/**
 * Batch mutation for updating multiple entities
 */
export function useBatchEntityMutation<T extends Entity>(
  entityType: EntityType
) {
  const queryClient = useQueryClient();
  
  return useMutation<T[], MutationError, (Partial<T> & ParentRelationMetadata)[]>({
    mutationFn: async (updates: (Partial<T> & ParentRelationMetadata)[]) => {
      const apiModule = getApiModule(entityType);
      const results = await Promise.all(
        updates.map(update => {
          if (!update.id) throw new Error('ID required for batch update');
          const { _parentRelation, ...entityData } = update;
          return apiModule.update(update.id, entityData);
        })
      );
      
      return results as T[];
    },
    
    onSuccess: async (response, variables) => {
      const entityQueryKey = getQueryKeyForType(entityType);
      const updatedEntities = response; // Response is the array directly
      
      // Surgical batch update in list cache
      queryClient.setQueryData(entityQueryKey, (oldData: T[] | undefined) => {
        if (!oldData) return updatedEntities;
        
        // Create map of updated entities for efficient lookup
        const updateMap = new Map(updatedEntities.map(e => [e.id, e]));
        
        // Replace updated entities in the list
        return oldData.map(item => updateMap.get(item.id) || item);
      });
      
      // Update individual entity caches
      for (const entity of updatedEntities) {
        queryClient.setQueryData([...entityQueryKey, entity.id], entity);
      }
      
      // Update related entities for each updated entity
      // Use surgical cache updates instead of broad invalidation
      for (let i = 0; i < updatedEntities.length; i++) {
        const entity = updatedEntities[i];
        const originalUpdate = variables[i];
        
        // Skip if no matching update or entity
        if (!entity || !originalUpdate) continue;
        
        // Extract the fields that were actually updated (excluding id and metadata)
        const updatedFields = Object.entries(originalUpdate).reduce<Partial<T>>((acc, [key, value]) => {
          if (key !== 'id' && key !== '_parentRelation' && value !== undefined) {
            return { ...acc, [key]: value };
          }
          return acc;
        }, {});
        
        // If any fields were updated, surgically update related entities
        if (Object.keys(updatedFields).length > 0) {
          updateRelatedEntities(queryClient, entityType, entity, updatedFields);
        }
      }
    }
  });
}