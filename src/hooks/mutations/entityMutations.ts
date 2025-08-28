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

/**
 * Factory function to create entity-specific mutation hooks
 */
export function createEntityMutation<T extends Entity>(
  entityType: EntityType,
  mutationType: MutationType
) {
  return function useEntityMutation(
    options?: UseMutationOptions<T, MutationError, Partial<T> & ParentRelationMetadata>
  ) {
    const queryClient = useQueryClient();

    return useMutation<T, MutationError, Partial<T> & ParentRelationMetadata>({
      mutationFn: async (data: Partial<T> & ParentRelationMetadata) => {
        // Get the appropriate API module
        const apiModule = getApiModule(entityType);
        
        let result: any;
        switch (mutationType) {
          case 'create':
            result = await apiModule.create(data as any);
            break;
          case 'update':
            if (!data.id) throw new Error('ID required for update');
            result = await apiModule.update(data.id, data as any);
            break;
          case 'delete':
            if (!data.id) throw new Error('ID required for delete');
            // Most APIs don't have delete yet, throw error
            throw new Error(`Delete not implemented for ${entityType}`);
          default:
            throw new Error(`Unknown mutation type: ${mutationType}`);
        }
        
        // Return the entity directly - API already returns unwrapped entities
        return result as T;
      },
      
      onSuccess: async (response, variables) => {
        const entityQueryKey = getQueryKeyForType(entityType);
        const entity = response; // Response is the entity directly, not wrapped
        
        // Surgical cache update based on mutation type
        if (mutationType === 'create') {
          // Track cache updates for performance monitoring
          if (perfLog) {
            perfLog.cacheUpdates++;
          }
          
          // Add new entity to list cache
          queryClient.setQueryData(entityQueryKey, (oldData: T[] | undefined) => {
            if (!oldData) return [entity];
            return [...oldData, entity];
          });
          
          // Set individual entity cache
          queryClient.setQueryData([...entityQueryKey, entity.id], entity);
          
          // Parent relation updates are handled server-side atomically
          // This prevents dual cache updates and race conditions
        } 
        else if (mutationType === 'update') {
          // Update entity in list cache
          queryClient.setQueryData(entityQueryKey, (oldData: T[] | undefined) => {
            if (!oldData) return [entity];
            return oldData.map(item => item.id === entity.id ? entity : item);
          });
          
          // Update individual entity cache
          queryClient.setQueryData([...entityQueryKey, entity.id], entity);
        }
        else if (mutationType === 'delete' && variables?.id) {
          // Remove entity from list cache
          queryClient.setQueryData(entityQueryKey, (oldData: T[] | undefined) => {
            if (!oldData) return [];
            return oldData.filter(item => item.id !== variables.id);
          });
          
          // Remove individual entity cache
          queryClient.removeQueries({ 
            queryKey: [...entityQueryKey, variables.id],
            exact: true
          });
        }
        
        // For relationship changes, we still use invalidation for related entities
        // This is intentional: We don't have the full related entity data here to do
        // surgical updates. The backend handles bidirectional updates, so we need to
        // refetch to get the latest state of related entities.
        // TODO: Phase 3 will add version-based cache coordination to optimize this
        if (variables && mutationType === 'update') {
          const relatedTypes = getRelatedEntityTypes(variables);
          for (const type of relatedTypes) {
            await queryClient.invalidateQueries({ 
              queryKey: getQueryKeyForType(type)
            });
          }
        }
        
        // Removed graph data invalidation that caused infinite re-render loop
        // Graph will update naturally when entity queries are invalidated
        
        // Call custom onSuccess if provided
        options?.onSuccess?.(response, variables, undefined);
      },
      
      onError: (error, variables, context) => {
        console.error(`${entityType} ${mutationType} failed:`, error);
        
        // Call custom onError if provided
        options?.onError?.(error, variables, context);
      },
      
      // Rest of options passed through (but onSuccess, onError are handled above)
    });
  };
}

/**
 * Get the appropriate API module for an entity type
 */
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

/**
 * Get the proper query key for an entity type
 * Ensures consistency across the application
 */
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

// Field mapping and related entity detection now handled by centralized cache utilities
// See: src/lib/cache/mutations.ts

/**
 * Helper wrapper for centralized getRelatedEntityTypes
 */
function getRelatedEntityTypes(updates: Partial<Entity>): EntityType[] {
  const updatedFields = Object.keys(updates);
  // Pass entityType as 'characters' as a placeholder - the function will check the actual fields
  return Array.from(getRelatedTypes('characters', updatedFields));
}

// Pre-configured hooks for each entity type and operation

// Character mutations
export const useCreateCharacter = createEntityMutation<Character>('characters', 'create');
export const useUpdateCharacter = createEntityMutation<Character>('characters', 'update');
export const useDeleteCharacter = createEntityMutation<Character>('characters', 'delete');

// Element mutations
export const useCreateElement = createEntityMutation<Element>('elements', 'create');
export const useUpdateElement = createEntityMutation<Element>('elements', 'update');
export const useDeleteElement = createEntityMutation<Element>('elements', 'delete');

// Puzzle mutations
export const useCreatePuzzle = createEntityMutation<Puzzle>('puzzles', 'create');
export const useUpdatePuzzle = createEntityMutation<Puzzle>('puzzles', 'update');
export const useDeletePuzzle = createEntityMutation<Puzzle>('puzzles', 'delete');

// Timeline mutations
export const useCreateTimeline = createEntityMutation<TimelineEvent>('timeline', 'create');
export const useUpdateTimeline = createEntityMutation<TimelineEvent>('timeline', 'update');
export const useDeleteTimeline = createEntityMutation<TimelineEvent>('timeline', 'delete');

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
        const relatedTypes = getRelatedEntityTypes(update);
        return relatedTypes.length > 0;
      });
      
      // If relationships changed, invalidate related entity types
      // For relationship changes in batch updates, invalidate related entities
      // This is intentional - see comment in single entity mutation above
      // TODO: Phase 3 will optimize this with version-based coordination
      if (hasRelationshipChanges) {
        const allRelatedTypes = new Set<EntityType>();
        for (const update of variables) {
          const relatedTypes = getRelatedEntityTypes(update);
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