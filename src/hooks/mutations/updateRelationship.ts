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
import { 
  updateEntityCaches, 
  type EntityType,
  type Entity 
} from '@/lib/cache/mutations';
import toast from 'react-hot-toast';

/**
 * Get the appropriate API based on entity type
 */
function getApiForType(entityType: string): any {
  switch (entityType) {
    case 'character':
    case 'characters':
      return charactersApi;
    case 'element':
    case 'elements':
      return elementsApi;
    case 'puzzle':
    case 'puzzles':
      return puzzlesApi;
    case 'timeline':
      return timelineApi;
    default:
      return null;
  }
}

/**
 * Convert singular entity type to plural for EntityType
 */
function toEntityType(type: string): EntityType {
  switch (type) {
    case 'character':
      return 'characters';
    case 'element':
      return 'elements';
    case 'puzzle':
      return 'puzzles';
    case 'timeline':
      return 'timeline';
    default:
      return 'timeline'; // fallback
  }
}

// Field mapping now handled by centralized cache utilities
// See: src/lib/cache/mutations.ts - FIELD_TO_ENTITY_TYPE_MAP

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
    
    onSuccess: async (updatedEntity: Entity, variables) => {
      // Convert parent type to EntityType format
      const parentEntityType = toEntityType(variables.parentType);
      
      // Surgically update the parent entity in cache
      updateEntityCaches(queryClient, parentEntityType, updatedEntity);
      
      // Note: Child entity caches don't need updating here since
      // the child entity itself hasn't changed - only the parent's
      // reference to it. If bidirectional updates are needed,
      // they should be handled by the backend or in a separate mutation.
      
      toast.success('Relationship updated');
    },
    
    onError: (error) => {
      console.error('[UpdateRelationship] Error:', error);
      toast.error('Failed to update relationship');
    }
  });
}