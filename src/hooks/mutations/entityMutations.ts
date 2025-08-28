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
import { charactersApi, elementsApi, puzzlesApi, timelineApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { 
  getRelatedEntityTypes as getRelatedTypes,
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

// Helper function for getting related entity types
function getRelatedEntityTypes(entityType: EntityType, updatedFields: string[]): EntityType[] {
  return Array.from(getRelatedTypes(entityType, updatedFields));
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
      return await charactersApi.create(data as any);
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
      
      options?.onSuccess?.(character, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      console.error('Character creation failed:', error);
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
      return await charactersApi.update(id, data as any);
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
      
      // Handle relationship invalidation if needed
      const relatedTypes = getRelatedTypes('characters', Object.keys(variables));
      for (const type of relatedTypes) {
        const key = type === 'elements' ? queryKeys.elements() :
                   type === 'puzzles' ? queryKeys.puzzles() :
                   type === 'timeline' ? queryKeys.timeline() :
                   queryKeys.characters();
        await queryClient.invalidateQueries({ queryKey: key });
      }
      
      options?.onSuccess?.(character, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      console.error('Character update failed:', error);
      options?.onError?.(error, variables, context);
    }
  });
}

// Character delete not implemented yet
export function useDeleteCharacter() {
  throw new Error('Delete not implemented for characters');
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
      return await elementsApi.create(data as any);
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
      
      options?.onSuccess?.(element, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      console.error('Element creation failed:', error);
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
      return await elementsApi.update(id, data as any);
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
      
      // Handle relationship invalidation if needed
      const relatedTypes = getRelatedTypes('elements', Object.keys(variables));
      for (const type of relatedTypes) {
        const key = type === 'characters' ? queryKeys.characters() :
                   type === 'puzzles' ? queryKeys.puzzles() :
                   type === 'timeline' ? queryKeys.timeline() :
                   queryKeys.elements();
        await queryClient.invalidateQueries({ queryKey: key });
      }
      
      options?.onSuccess?.(element, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      console.error('Element update failed:', error);
      options?.onError?.(error, variables, context);
    }
  });
}

// Element delete not implemented yet
export function useDeleteElement() {
  throw new Error('Delete not implemented for elements');
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
      return await puzzlesApi.create(data as any);
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
      
      options?.onSuccess?.(puzzle, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      console.error('Puzzle creation failed:', error);
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
      return await puzzlesApi.update(id, data as any);
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
      
      // Handle relationship invalidation if needed
      const relatedTypes = getRelatedTypes('puzzles', Object.keys(variables));
      for (const type of relatedTypes) {
        const key = type === 'characters' ? queryKeys.characters() :
                   type === 'elements' ? queryKeys.elements() :
                   type === 'timeline' ? queryKeys.timeline() :
                   queryKeys.puzzles();
        await queryClient.invalidateQueries({ queryKey: key });
      }
      
      options?.onSuccess?.(puzzle, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      console.error('Puzzle update failed:', error);
      options?.onError?.(error, variables, context);
    }
  });
}

// Puzzle delete not implemented yet
export function useDeletePuzzle() {
  throw new Error('Delete not implemented for puzzles');
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
      return await timelineApi.create(data as any);
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
      
      options?.onSuccess?.(event, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      console.error('Timeline event creation failed:', error);
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
      return await timelineApi.update(id, data as any);
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
      
      // Handle relationship invalidation if needed
      const relatedTypes = getRelatedTypes('timeline', Object.keys(variables));
      for (const type of relatedTypes) {
        const key = type === 'characters' ? queryKeys.characters() :
                   type === 'elements' ? queryKeys.elements() :
                   type === 'puzzles' ? queryKeys.puzzles() :
                   queryKeys.timeline();
        await queryClient.invalidateQueries({ queryKey: key });
      }
      
      options?.onSuccess?.(event, variables, undefined);
    },
    
    onError: (error, variables, context) => {
      console.error('Timeline event update failed:', error);
      options?.onError?.(error, variables, context);
    }
  });
}

// Timeline delete not implemented yet
export function useDeleteTimeline() {
  throw new Error('Delete not implemented for timeline');
}

// Aliases for backward compatibility
export const useCreateTimelineEvent = useCreateTimeline;
export const useUpdateTimelineEvent = useUpdateTimeline;
export const useDeleteTimelineEvent = useDeleteTimeline;

/**
 * Generic mutation hook that determines type at runtime
 */
export function useEntityMutation(
  entityType: EntityType,
  mutationType: MutationType
) {
  switch (entityType) {
    case 'characters':
      if (mutationType === 'create') return useCreateCharacter();
      if (mutationType === 'update') return useUpdateCharacter();
      if (mutationType === 'delete') return useDeleteCharacter();
      break;
    case 'elements':
      if (mutationType === 'create') return useCreateElement();
      if (mutationType === 'update') return useUpdateElement();
      if (mutationType === 'delete') return useDeleteElement();
      break;
    case 'puzzles':
      if (mutationType === 'create') return useCreatePuzzle();
      if (mutationType === 'update') return useUpdatePuzzle();
      if (mutationType === 'delete') return useDeletePuzzle();
      break;
    case 'timeline':
      if (mutationType === 'create') return useCreateTimeline();
      if (mutationType === 'update') return useUpdateTimeline();
      if (mutationType === 'delete') return useDeleteTimeline();
      break;
  }
  
  throw new Error(`Unknown entity type: ${entityType} or mutation type: ${mutationType}`);
}

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
          return apiModule.update(update.id, update as any);
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
      
      // Check if any updates involved relationship fields
      const hasRelationshipChanges = variables.some(update => {
        const relatedTypes = getRelatedEntityTypes(entityType, Object.keys(update));
        return relatedTypes.length > 0;
      });
      
      // If relationships changed, invalidate related entity types
      // For relationship changes in batch updates, invalidate related entities
      // This is intentional - see comment in single entity mutation above
      // TODO: Phase 3 will optimize this with version-based coordination
      if (hasRelationshipChanges) {
        const allRelatedTypes = new Set<EntityType>();
        for (const update of variables) {
          const relatedTypes = getRelatedEntityTypes(entityType, Object.keys(update));
          relatedTypes.forEach(type => allRelatedTypes.add(type));
        }
        
        for (const type of allRelatedTypes) {
          await queryClient.invalidateQueries({ 
            queryKey: getQueryKeyForType(type)
          });
        }
      }
    }
  });
}