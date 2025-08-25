/**
 * Factory function for creating typed entity mutation hooks
 * Provides optimistic updates, error rollback, cache invalidation, and CSRF protection
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
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
        return apiService.update(id, updates);
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
        
        // Call custom error handler
        onError?.(error, variables, context);
      },
      
      // Invalidate and refetch on success
      onSuccess: (data) => {
        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey });
        
        // Also invalidate related queries
        // This handles cross-entity relationships
        if (entityType === 'puzzles') {
          queryClient.invalidateQueries({ queryKey: ['notion', 'elements'] });
        } else if (entityType === 'elements') {
          queryClient.invalidateQueries({ queryKey: ['notion', 'puzzles'] });
        } else if (entityType === 'characters') {
          queryClient.invalidateQueries({ queryKey: ['notion', 'puzzles'] });
          queryClient.invalidateQueries({ queryKey: ['notion', 'timeline'] });
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