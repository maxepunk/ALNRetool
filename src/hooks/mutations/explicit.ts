/**
 * Explicit Entity Mutation Hooks
 * 
 * Direct, simple mutation hooks for each entity type without factory abstraction.
 * Created alongside factory pattern for gradual migration (Phase 3 of tech debt elimination).
 * 
 * Benefits over factory pattern:
 * - Better type safety
 * - Easier to debug
 * - Simpler to test
 * - More explicit and readable
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { charactersApi, elementsApi, puzzlesApi, timelineApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { getRelatedEntityTypes } from '@/lib/cache/mutations';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent 
} from '@/types/notion/app';

// Performance logging utility
const perfLog = typeof window !== 'undefined' ? (window as any).perfLog : null;

// Error type
interface MutationError {
  message: string;
  code?: string;
  details?: unknown;
}

// Parent relation metadata for atomic creation
export type ParentRelationMetadata = {
  _parentRelation?: {
    parentType: string;
    parentId: string;
    fieldKey: string;
  };
};

// ============================================================================
// CHARACTER MUTATIONS
// ============================================================================

/**
 * Create a new character
 */
export function useCreateCharacterExplicit(
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
export function useUpdateCharacterExplicit(
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
      const relatedTypes = getRelatedEntityTypes('characters', Object.keys(variables));
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

// ============================================================================
// ELEMENT MUTATIONS
// ============================================================================

/**
 * Create a new element
 */
export function useCreateElementExplicit(
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
export function useUpdateElementExplicit(
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
      const relatedTypes = getRelatedEntityTypes('elements', Object.keys(variables));
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

// ============================================================================
// PUZZLE MUTATIONS
// ============================================================================

/**
 * Create a new puzzle
 */
export function useCreatePuzzleExplicit(
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
export function useUpdatePuzzleExplicit(
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
      const relatedTypes = getRelatedEntityTypes('puzzles', Object.keys(variables));
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

// ============================================================================
// TIMELINE MUTATIONS
// ============================================================================

/**
 * Create a new timeline event
 */
export function useCreateTimelineEventExplicit(
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
export function useUpdateTimelineEventExplicit(
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
      const relatedTypes = getRelatedEntityTypes('timeline', Object.keys(variables));
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