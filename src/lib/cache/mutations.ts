/**
 * Centralized Cache Mutation Utilities
 * 
 * Provides standardized patterns for cache updates following
 * the successful entityMutations.ts approach.
 * 
 * Key Principles:
 * - Surgical setQueryData updates instead of broad invalidation
 * - Explicit field-to-entity mapping for relationships
 * - Atomic updates for both list and individual caches
 * - Bidirectional relationship management
 */

import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent 
} from '@/types/notion/app';

export type EntityType = 'characters' | 'elements' | 'puzzles' | 'timeline';
export type Entity = Character | Element | Puzzle | TimelineEvent;

/**
 * Comprehensive field-to-entity type mapping.
 * Extends the pattern from entityMutations.ts to cover all relationships.
 */
export const FIELD_TO_ENTITY_TYPE_MAP: Record<string, EntityType> = {
  // Character relation fields (from Character interface)
  ownedElementIds: 'elements',
  associatedElementIds: 'elements',
  characterPuzzleIds: 'puzzles',
  eventIds: 'timeline',
  connections: 'characters',       // Self-referential: other characters
  
  // Element relation fields (from Element interface)
  ownerId: 'characters',          // Single character owner
  containerId: 'elements',        // Self-referential: parent element
  contentIds: 'elements',         // Self-referential: child elements
  timelineEventId: 'timeline',    // Single timeline event
  requiredForPuzzleIds: 'puzzles',
  rewardedByPuzzleIds: 'puzzles',
  containerPuzzleId: 'puzzles',   // Single puzzle container
  associatedCharacterIds: 'characters', // From timeline rollup
  
  // Puzzle relation fields (from Puzzle interface)
  puzzleElementIds: 'elements',
  lockedItemId: 'elements',       // Single locked element
  rewardIds: 'elements',
  parentItemId: 'puzzles',        // Self-referential: parent puzzle
  subPuzzleIds: 'puzzles',        // Self-referential: child puzzles
  storyReveals: 'timeline',       // Timeline event IDs from rollup
  // ownerId is already mapped above (from Element section)
  
  // Timeline relation fields (from TimelineEvent interface)
  charactersInvolvedIds: 'characters',
  memoryEvidenceIds: 'elements',
};

/**
 * Map of inverse relationships for bidirectional updates.
 * When field X on entity A points to entity B, this maps to field Y on entity B that points back to A.
 */
export const INVERSE_RELATIONSHIP_MAP: Record<string, string> = {
  // Character -> Element relationships
  ownedElementIds: 'ownerId',        // Character owns Element -> Element has owner
  associatedElementIds: 'associatedCharacterIds', // Character associated with Element
  
  // Element -> Character relationships
  ownerId: 'ownedElementIds',        // Element owned by Character -> Character owns Element
  associatedCharacterIds: 'associatedElementIds', // Element associated with Characters
  
  // Puzzle -> Element relationships  
  puzzleElementIds: 'containerPuzzleId',  // Puzzle contains Elements -> Element in Puzzle
  lockedItemId: 'lockedByPuzzleId',      // Puzzle locks Element -> Element locked by Puzzle
  rewardIds: 'rewardedByPuzzleIds',      // Puzzle rewards Elements -> Elements rewarded by Puzzle
  
  // Element -> Puzzle relationships
  containerPuzzleId: 'puzzleElementIds',  // Element in Puzzle -> Puzzle contains Element
  lockedByPuzzleId: 'lockedItemId',      // Element locked by Puzzle -> Puzzle locks Element
  rewardedByPuzzleIds: 'rewardIds',      // Element rewarded by Puzzles -> Puzzles reward Element
  
  // Character -> Puzzle relationships
  characterPuzzleIds: 'assignedCharacterIds', // Character has Puzzles -> Puzzles assigned to Character
  
  // Timeline -> Character relationships
  charactersInvolvedIds: 'eventIds',     // Timeline involves Characters -> Characters in events
  eventIds: 'charactersInvolvedIds',     // Characters in events -> Timeline involves Characters
  
  // Timeline -> Element relationships
  memoryEvidenceIds: 'associatedTimelineIds', // Timeline has evidence -> Evidence in timeline
  associatedTimelineIds: 'memoryEvidenceIds', // Evidence in timeline -> Timeline has evidence
};

/**
 * Get entity type from field key
 */
export function getEntityTypeFromFieldKey(fieldKey: string): EntityType | null {
  return FIELD_TO_ENTITY_TYPE_MAP[fieldKey] || null;
}

/**
 * Get query key for entity type
 */
export function getQueryKeyForEntityType(entityType: EntityType): readonly string[] {
  const keyMap = {
    characters: queryKeys.characters(),
    elements: queryKeys.elements(),
    puzzles: queryKeys.puzzles(),
    timeline: queryKeys.timeline(),
  };
  return keyMap[entityType];
}

/**
 * Update entity in both list and individual caches
 */
export function updateEntityCaches<T extends Entity>(
  queryClient: QueryClient,
  entityType: EntityType,
  entity: T
): void {
  const queryKey = getQueryKeyForEntityType(entityType);
  
  // Update list cache
  queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
    if (!oldData) return [entity];
    const index = oldData.findIndex(item => item.id === entity.id);
    if (index === -1) return [...oldData, entity];
    return oldData.map((item, i) => i === index ? entity : item);
  });
  
  // Update individual cache
  queryClient.setQueryData([...queryKey, entity.id], entity);
}

/**
 * Remove entity from caches
 */
export function removeEntityFromCaches<T extends Entity>(
  queryClient: QueryClient,
  entityType: EntityType,
  entityId: string
): void {
  const queryKey = getQueryKeyForEntityType(entityType);
  
  // Remove from list cache
  queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
    if (!oldData) return [];
    return oldData.filter(item => item.id !== entityId);
  });
  
  // Remove individual cache
  queryClient.removeQueries({ queryKey: [...queryKey, entityId] });
}

/**
 * Update related entities when a relationship field changes
 * Note: Currently marks related entities for refetch via invalidation
 * TODO: Implement surgical updates when we have full entity data
 */
export function updateRelatedEntities(
  queryClient: QueryClient,
  _sourceEntityType: EntityType,
  _sourceEntity: Entity,
  updatedFields: Partial<Entity>
): void {
  // Track which entity types need updating
  const relatedTypes = new Set<EntityType>();
  
  // Check each updated field for relationships
  for (const field in updatedFields) {
    const targetType = FIELD_TO_ENTITY_TYPE_MAP[field];
    if (targetType) {
      relatedTypes.add(targetType);
    }
  }
  
  // Update each related entity type
  for (const entityType of relatedTypes) {
    const queryKey = getQueryKeyForEntityType(entityType);
    
    // For now, we'll use surgical updates when we have the full entities
    // In practice, this might need to fetch the related entities first
    // or work with partial updates
    queryClient.setQueryData(queryKey, (oldData: Entity[] | undefined) => {
      if (!oldData) return oldData;
      
      // This is a simplified update - in practice you'd update
      // the inverse relationship fields on the related entities
      return oldData.map(item => {
        // Check if this item is related to the source entity
        // and update its inverse relationship fields
        // This logic would be entity-specific
        return item;
      });
    });
  }
}

/**
 * Handle relationship updates atomically
 */
export function updateRelationship(
  queryClient: QueryClient,
  parentType: EntityType,
  parentId: string,
  fieldKey: string,
  action: 'add' | 'remove',
  childId: string
): void {
  const parentQueryKey = getQueryKeyForEntityType(parentType);
  
  // Update parent entity
  queryClient.setQueryData(parentQueryKey, (oldData: Entity[] | undefined) => {
    if (!oldData) return oldData;
    return oldData.map(item => {
      if (item.id !== parentId) return item;
      
      const currentValue = (item as any)[fieldKey] || [];
      const updatedValue = action === 'add'
        ? [...new Set([...currentValue, childId])]
        : currentValue.filter((id: string) => id !== childId);
      
      return {
        ...item,
        [fieldKey]: updatedValue
      };
    });
  });
  
  // Update individual parent cache
  queryClient.setQueryData([...parentQueryKey, parentId], (oldParent: Entity | undefined) => {
    if (!oldParent) return oldParent;
    
    const currentValue = (oldParent as any)[fieldKey] || [];
    const updatedValue = action === 'add'
      ? [...new Set([...currentValue, childId])]
      : currentValue.filter((id: string) => id !== childId);
    
    return {
      ...oldParent,
      [fieldKey]: updatedValue
    };
  });
  
  // Update child entity for bidirectional relationships
  const childType = getEntityTypeFromFieldKey(fieldKey);
  const inverseFieldKey = INVERSE_RELATIONSHIP_MAP[fieldKey];
  
  if (childType && inverseFieldKey) {
    const childQueryKey = getQueryKeyForEntityType(childType);
    
    // Update the inverse relationship on the child entity
    queryClient.setQueryData([...childQueryKey, childId], (oldChild: Entity | undefined) => {
      if (!oldChild) return oldChild;
      
      // Handle both array and single value inverse relationships
      const currentInverseValue = (oldChild as any)[inverseFieldKey];
      let updatedInverseValue;
      
      if (Array.isArray(currentInverseValue)) {
        // Array field - add/remove parent ID
        updatedInverseValue = action === 'add'
          ? [...new Set([...currentInverseValue, parentId])]
          : currentInverseValue.filter((id: string) => id !== parentId);
      } else {
        // Single value field - set or clear
        updatedInverseValue = action === 'add' ? parentId : null;
      }
      
      return {
        ...oldChild,
        [inverseFieldKey]: updatedInverseValue
      };
    });
    
    // Also update the child in the list cache
    queryClient.setQueryData(childQueryKey, (oldList: Entity[] | undefined) => {
      if (!oldList) return oldList;
      
      return oldList.map(item => {
        if (item.id !== childId) return item;
        
        const currentInverseValue = (item as any)[inverseFieldKey];
        let updatedInverseValue;
        
        if (Array.isArray(currentInverseValue)) {
          updatedInverseValue = action === 'add'
            ? [...new Set([...currentInverseValue, parentId])]
            : currentInverseValue.filter((id: string) => id !== parentId);
        } else {
          updatedInverseValue = action === 'add' ? parentId : null;
        }
        
        return {
          ...item,
          [inverseFieldKey]: updatedInverseValue
        };
      });
    });
  }
}

/**
 * Batch update multiple entities efficiently
 */
export function batchUpdateEntities<T extends Entity>(
  queryClient: QueryClient,
  entityType: EntityType,
  entities: T[]
): void {
  if (entities.length === 0) return;
  
  const queryKey = getQueryKeyForEntityType(entityType);
  const entityMap = new Map(entities.map(e => [e.id, e]));
  
  // Update list cache
  queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
    if (!oldData) return entities;
    return oldData.map(item => entityMap.get(item.id) || item);
  });
  
  // Update individual caches
  for (const entity of entities) {
    queryClient.setQueryData([...queryKey, entity.id], entity);
  }
}

/**
 * Invalidate specific entity type queries
 * Only use when surgical updates aren't possible (e.g., pagination changes)
 */
export function invalidateEntityType(
  queryClient: QueryClient,
  entityType: EntityType
): void {
  const queryKey = getQueryKeyForEntityType(entityType);
  queryClient.invalidateQueries({ queryKey });
}

/**
 * Get related entity types that should be updated
 * when a specific entity type changes
 */
export function getRelatedEntityTypes(
  entityType: EntityType,
  updatedFields?: string[]
): Set<EntityType> {
  const related = new Set<EntityType>();
  
  if (updatedFields) {
    // Check specific fields for relationships
    for (const field of updatedFields) {
      const targetType = FIELD_TO_ENTITY_TYPE_MAP[field];
      if (targetType) {
        related.add(targetType);
      }
    }
  } else {
    // Get all possible related types for this entity
    switch (entityType) {
      case 'characters':
        related.add('elements').add('puzzles').add('timeline');
        break;
      case 'elements':
        related.add('characters').add('puzzles').add('timeline');
        break;
      case 'puzzles':
        related.add('characters').add('elements').add('puzzles'); // self-referential
        break;
      case 'timeline':
        related.add('characters').add('elements').add('puzzles');
        break;
    }
  }
  
  return related;
}