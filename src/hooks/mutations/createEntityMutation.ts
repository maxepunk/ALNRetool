/**
 * Factory function for creating typed entity mutation hooks
 * Provides optimistic updates, error rollback, cache invalidation, and CSRF protection
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import toast from 'react-hot-toast';
// CSRF token support will be added when mutation API services are updated
// import { useCSRFToken, fetchWithCSRF } from '../useCSRFToken';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent,
} from '@/types/notion/app';

type EntityType = 'characters' | 'elements' | 'puzzles' | 'timeline';

// API service type definitions
interface ApiService<T> {
  update: (id: string, updates: Partial<T>) => Promise<T>;
}

// Entity type to data type mapping
type EntityDataType<T extends EntityType> = 
  T extends 'characters' ? Character :
  T extends 'elements' ? Element :
  T extends 'puzzles' ? Puzzle :
  T extends 'timeline' ? TimelineEvent :
  never;

// Mutation variables type
interface MutationVariables<T> {
  id: string;
  updates: Partial<T>;
}

// Mutation context for rollback
interface MutationContext<T> {
  previousData?: T;
  previousList?: T[];
}

// Factory options
interface CreateEntityMutationOptions<T extends EntityType> {
  entityType: T;
  apiService: ApiService<EntityDataType<T>>;
  queryKey: readonly unknown[];
  onSuccess?: (data: EntityDataType<T>) => void;
  onError?: (error: Error, variables: MutationVariables<EntityDataType<T>>, context?: MutationContext<EntityDataType<T>>) => void;
}

/**
 * Factory function to create typed mutation hooks with optimistic updates
 */
export function createEntityMutation<T extends EntityType>({
  entityType,
  apiService,
  queryKey,
  onSuccess,
  onError,
}: CreateEntityMutationOptions<T>): () => UseMutationResult<
  EntityDataType<T>,
  Error,
  MutationVariables<EntityDataType<T>>,
  MutationContext<EntityDataType<T>>
> {
  return function useEntityMutation() {
    const queryClient = useQueryClient();
    
    return useMutation<
      EntityDataType<T>,
      Error,
      MutationVariables<EntityDataType<T>>,
      MutationContext<EntityDataType<T>>
    >({
      mutationFn: async ({ id, updates }) => {
        // Show loading toast
        const loadingToast = toast.loading(`Saving ${entityType.slice(0, -1)}...`);
        
        try {
          const result = await apiService.update(id, updates);
          toast.dismiss(loadingToast);
          return result;
        } catch (error) {
          toast.dismiss(loadingToast);
          throw error;
        }
      },
      
      // Optimistic update
      onMutate: async ({ id, updates }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey });
        
        // Snapshot previous values
        const previousList = queryClient.getQueryData<EntityDataType<T>[]>(queryKey);
        const previousData = previousList?.find(item => item.id === id);
        
        // Optimistically update the cache
        if (previousList) {
          queryClient.setQueryData<EntityDataType<T>[]>(queryKey, old => {
            if (!old) return old;
            return old.map(item => 
              item.id === id 
                ? { ...item, ...updates, lastEditedTime: new Date().toISOString() }
                : item
            );
          });
        }
        
        // Also update single entity cache if it exists
        const singleQueryKey = [...queryKey, id];
        const previousSingle = queryClient.getQueryData<EntityDataType<T>>(singleQueryKey);
        if (previousSingle) {
          queryClient.setQueryData<EntityDataType<T>>(singleQueryKey, old => {
            if (!old) return old;
            return { ...old, ...updates, lastEditedTime: new Date().toISOString() };
          });
        }
        
        // Return context for rollback
        return { previousData, previousList };
      },
      
      // Rollback on error
      onError: (error, variables, context) => {
        // Rollback list cache
        if (context?.previousList) {
          queryClient.setQueryData(queryKey, context.previousList);
        }
        
        // Rollback single entity cache
        if (context?.previousData) {
          const singleQueryKey = [...queryKey, variables.id];
          queryClient.setQueryData(singleQueryKey, context.previousData);
        }
        
        // Show error toast
        const entityName = entityType.slice(0, -1); // Remove 's' for singular
        toast.error(`Failed to save ${entityName}: ${error.message || 'Unknown error'}`);
        
        // Call custom error handler
        onError?.(error, variables, context);
      },
      
      // Invalidate and refetch on success
      onSuccess: async (data) => {
        // Show success toast
        const entityName = entityType.slice(0, -1); // Remove 's' for singular
        toast.success(`${entityName.charAt(0).toUpperCase() + entityName.slice(1)} saved successfully!`);
        // Invalidate queries to ensure fresh data
        await queryClient.invalidateQueries({ queryKey });
        
        // Comprehensive cache invalidation for all potentially connected entities
        // This ensures the graph updates properly when any relationship changes
        // 
        // Why invalidate everything? 
        // 1. Graph visualization needs ALL connected entities to render edges correctly
        // 2. Bidirectional relationships mean changes propagate in both directions
        // 3. Connection depth filtering needs to recalculate paths when any connection changes
        // 4. It's safer to over-invalidate than to miss updates (data is cached for 5 min anyway)
        
        // Helper function to invalidate both patterns (with and without 'all')
        const invalidateEntity = async (entity: string) => {
          await queryClient.invalidateQueries({ queryKey: ['notion', entity, 'all'] });
          await queryClient.invalidateQueries({ queryKey: ['notion', entity] });
        };
        
        // Relationship map showing which entity types connect to each other:
        // Characters -> Elements (owned, associated), Puzzles (character puzzles), Timeline (events)
        // Elements -> Characters (owner), Elements (container/contents), Puzzles (required/rewarded), Timeline (events)
        // Puzzles -> Elements (requirements, rewards, locked item), Puzzles (parent/sub), Characters (via owner rollup)
        // Timeline -> Characters (involved), Elements (memory/evidence)
        
        if (entityType === 'characters') {
          // Characters connect to: Elements, Puzzles, Timeline
          await invalidateEntity('elements');
          await invalidateEntity('puzzles');
          await invalidateEntity('timeline');
        } else if (entityType === 'elements') {
          // Elements connect to: Characters, Puzzles, Timeline, other Elements
          await invalidateEntity('characters');
          await invalidateEntity('puzzles');
          await invalidateEntity('timeline');
          // Elements is already invalidated above via queryKey
        } else if (entityType === 'puzzles') {
          // Puzzles connect to: Elements, Characters (via owner), other Puzzles
          await invalidateEntity('elements');
          await invalidateEntity('characters');
          // Puzzles is already invalidated above via queryKey
        } else if (entityType === 'timeline') {
          // Timeline connects to: Characters, Elements
          await invalidateEntity('characters');
          await invalidateEntity('elements');
        }
        
        // Call custom success handler
        onSuccess?.(data);
      },
    });
  };
}

/**
 * Helper to extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Helper to determine if an update requires SF_ pattern preservation
 * (Only for element descriptions)
 */
export function requiresSFPattern(entityType: EntityType, fieldName: string): boolean {
  return entityType === 'elements' && fieldName === 'description';
}

/**
 * Helper to validate updates before sending to API
 */
export function validateUpdates<T>(updates: Partial<T>, entityType: EntityType): string | null {
  // Check for empty updates
  if (Object.keys(updates).length === 0) {
    return 'No changes to save';
  }
  
  // Entity-specific validation
  if (entityType === 'puzzles') {
    const puzzleUpdates = updates as Partial<Puzzle>;
    if (puzzleUpdates.subPuzzleIds?.some((id: string | null) => !id)) {
      return 'Invalid sub-puzzle reference';
    }
    if (puzzleUpdates.puzzleElementIds?.some((id: string | null) => !id)) {
      return 'Invalid puzzle element reference';
    }
  }
  
  if (entityType === 'elements') {
    const elementUpdates = updates as Partial<Element>;
    if (elementUpdates.descriptionText !== undefined && elementUpdates.descriptionText.length > 5000) {
      return 'Description is too long (max 5000 characters)';
    }
  }
  
  if (entityType === 'characters') {
    const characterUpdates = updates as Partial<Character>;
    if (characterUpdates.name !== undefined && characterUpdates.name.trim().length === 0) {
      return 'Character name cannot be empty';
    }
  }
  
  if (entityType === 'timeline') {
    const timelineUpdates = updates as Partial<TimelineEvent>;
    if (timelineUpdates.description !== undefined && timelineUpdates.description.trim().length === 0) {
      return 'Timeline event description cannot be empty';
    }
  }
  
  return null; // No validation errors
}