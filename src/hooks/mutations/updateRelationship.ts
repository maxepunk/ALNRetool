/**
 * Update Relationship Mutation Hook
 * 
 * Handles updating parent entity relationships when a new entity
 * is created from a relation field editor.
 * 
 * @module hooks/mutations/updateRelationship
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { charactersApi, elementsApi, puzzlesApi, timelineApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';

/**
 * Get the appropriate API based on entity type
 */
function getApiForType(entityType: string): any {
  switch (entityType) {
    case 'character':
      return charactersApi;
    case 'element':
      return elementsApi;
    case 'puzzle':
      return puzzlesApi;
    case 'timeline':
      return timelineApi;
    default:
      return null;
  }
}

/**
 * Map field keys to their target entity types
 * Used to invalidate the correct caches when relationships change
 */
function getEntityTypeFromFieldKey(fieldKey: string): string | null {
  const fieldMap: Record<string, string> = {
    // Character fields
    'ownedElementIds': 'element',
    'associatedElementIds': 'element',
    'characterPuzzleIds': 'puzzle',
    'eventIds': 'timeline',
    'connections': 'character',
    // Element fields
    'ownerId': 'character',
    'containerId': 'element',
    'contentIds': 'element',
    'timelineEventId': 'timeline',
    'requiredForPuzzleIds': 'puzzle',
    'rewardedByPuzzleIds': 'puzzle',
    'containerPuzzleId': 'puzzle',
    'associatedCharacterIds': 'character',
    // Puzzle fields
    'puzzleElementIds': 'element',
    'lockedItemId': 'element',
    'rewardIds': 'element',
    'parentItemId': 'puzzle',
    'subPuzzleIds': 'puzzle',
    // Timeline fields
    'charactersInvolvedIds': 'character',
    'memoryEvidenceIds': 'element',
  };
  return fieldMap[fieldKey] || null;
}

/**
 * Hook for updating entity relationships.
 * Used when creating a new entity from a relation field.
 * 
 * @example
 * ```tsx
 * const updateRelationship = useUpdateRelationship();
 * 
 * await updateRelationship.mutateAsync({
 *   parentType: 'puzzle',
 *   parentId: 'abc123',
 *   fieldKey: 'prerequisites',
 *   newEntityId: 'xyz789'
 * });
 * ```
 */
export function useUpdateRelationship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      parentType,
      parentId,
      fieldKey,
      newEntityId
    }: {
      parentType: string;
      parentId: string;
      fieldKey: string;
      newEntityId: string;
    }) => {
      console.log('[UpdateRelationship] Updating relationship', {
        parentType,
        parentId,
        fieldKey,
        newEntityId
      });
      
      const api = getApiForType(parentType);
      if (!api) {
        throw new Error(`Unknown entity type: ${parentType}`);
      }
      
      // Get the query key for the parent entity type
      const queryKey = 
        parentType === 'character' ? queryKeys.characters() :
        parentType === 'element' ? queryKeys.elements() :
        parentType === 'puzzle' ? queryKeys.puzzles() :
        queryKeys.timeline();
      
      // Get current parent entity from cache
      const cachedData = queryClient.getQueryData<any[]>(queryKey);
      const parent = cachedData?.find((entity: any) => entity.id === parentId);
      
      if (!parent) {
        throw new Error(`Parent entity not found in cache: ${parentId}`);
      }
      
      // Update the relationship field
      const currentValue = parent[fieldKey];
      let updatedValue: any;
      
      if (Array.isArray(currentValue)) {
        // Multi-relation field - add to array
        updatedValue = [...currentValue, newEntityId];
      } else if (typeof currentValue === 'string' || currentValue === null || currentValue === undefined) {
        // Single-relation field - replace value
        updatedValue = newEntityId;
      } else {
        // Unknown field type
        console.warn(`[UpdateRelationship] Unknown field type for ${fieldKey}:`, typeof currentValue);
        updatedValue = newEntityId;
      }
      
      console.log('[UpdateRelationship] Updating field', {
        fieldKey,
        currentValue,
        updatedValue
      });
      
      // Save the update
      return api.update(parentId, {
        ...parent,
        [fieldKey]: updatedValue
      });
    },
    
    onSuccess: async (_, variables) => {
      console.log('[UpdateRelationship] Success', variables);
      
      // Get proper query key for parent entity
      const queryKey = 
        variables.parentType === 'character' ? queryKeys.characters() :
        variables.parentType === 'element' ? queryKeys.elements() :
        variables.parentType === 'puzzle' ? queryKeys.puzzles() :
        queryKeys.timeline();
      
      // Invalidate parent entity type
      await queryClient.invalidateQueries({ queryKey });
      
      // Invalidate specific entity
      await queryClient.invalidateQueries({
        queryKey: [...queryKey, variables.parentId]
      });
      
      // CRITICAL: Invalidate graph to trigger re-render
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.graphData() 
      });
      
      // Invalidate the child entity type too (the new relationship target)
      const childType = getEntityTypeFromFieldKey(variables.fieldKey);
      if (childType) {
        const childQueryKey = 
          childType === 'character' ? queryKeys.characters() :
          childType === 'element' ? queryKeys.elements() :
          childType === 'puzzle' ? queryKeys.puzzles() :
          queryKeys.timeline();
        await queryClient.invalidateQueries({ queryKey: childQueryKey });
      }
      
      toast.success('Relationship updated');
    },
    
    onError: (error) => {
      console.error('[UpdateRelationship] Error:', error);
      toast.error('Failed to update relationship');
    }
  });
}