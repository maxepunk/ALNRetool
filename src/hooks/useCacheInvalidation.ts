/**
 * Targeted Cache Invalidation Hook
 * 
 * Provides granular cache invalidation to prevent over-fetching.
 * Instead of invalidating all queries, targets specific entities and their relationships.
 */

import { useQueryClient } from '@tanstack/react-query';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  
  /**
   * Invalidate specific entity and related queries
   */
  const invalidateEntity = async (
    entityType: 'character' | 'element' | 'puzzle' | 'timeline',
    entityId: string
  ) => {
    // Invalidate the specific entity query
    await queryClient.invalidateQueries({
      queryKey: [entityType, entityId]
    });
    
    // Invalidate list queries that might contain this entity
    await queryClient.invalidateQueries({
      queryKey: [entityType + 's']
    });
    
    // Invalidate synthesized data if it's an element or puzzle
    if (entityType === 'element' || entityType === 'puzzle') {
      await queryClient.invalidateQueries({
        queryKey: ['synthesized']
      });
    }
  };
  
  /**
   * Invalidate related entities based on relationship changes
   */
  const invalidateRelationships = async (
    sourceType: 'character' | 'element' | 'puzzle' | 'timeline',
    sourceId: string,
    relatedIds: string[],
    relationType: 'owner' | 'requirement' | 'reward' | 'timeline'
  ) => {
    // Invalidate source entity
    await invalidateEntity(sourceType, sourceId);
    
    // Invalidate related entities based on relationship type
    switch (relationType) {
      case 'owner':
        // Invalidate characters that own elements
        for (const id of relatedIds) {
          await queryClient.invalidateQueries({
            queryKey: ['character', id]
          });
        }
        break;
        
      case 'requirement':
      case 'reward':
        // Invalidate puzzles and elements
        await queryClient.invalidateQueries({
          queryKey: ['puzzles']
        });
        await queryClient.invalidateQueries({
          queryKey: ['elements']
        });
        break;
        
      case 'timeline':
        // Invalidate timeline events
        for (const id of relatedIds) {
          await queryClient.invalidateQueries({
            queryKey: ['timeline', id]
          });
        }
        break;
    }
  };
  
  /**
   * Smart invalidation after mutation
   */
  const invalidateAfterMutation = async (
    entityType: 'character' | 'element' | 'puzzle' | 'timeline',
    entity: Partial<Character | Element | Puzzle | TimelineEvent>,
    changedFields: string[]
  ) => {
    // Always invalidate the entity itself
    if (entity.id) {
      await invalidateEntity(entityType, entity.id);
    }
    
    // Check which fields changed and invalidate accordingly
    const relationFields = [
      'ownerId', 'requiredForPuzzleIds', 'rewardedByPuzzleIds',
      'characterIds', 'puzzleId', 'elementIds'
    ];
    
    const hasRelationChanges = changedFields.some(field => 
      relationFields.includes(field)
    );
    
    if (hasRelationChanges) {
      // Invalidate synthesized data for relationship changes
      await queryClient.invalidateQueries({
        queryKey: ['synthesized']
      });
      
      // Invalidate graph data
      await queryClient.invalidateQueries({
        queryKey: ['graph']
      });
    } else {
      // For non-relation changes, only invalidate the specific type
      await queryClient.invalidateQueries({
        queryKey: [entityType + 's']
      });
    }
  };
  
  /**
   * Invalidate view-specific queries
   */
  const invalidateView = async (
    viewType: 'puzzle-focus' | 'character-journey' | 'content-status'
  ) => {
    switch (viewType) {
      case 'puzzle-focus':
        await queryClient.invalidateQueries({
          queryKey: ['puzzles']
        });
        await queryClient.invalidateQueries({
          queryKey: ['elements']
        });
        break;
        
      case 'character-journey':
        await queryClient.invalidateQueries({
          queryKey: ['characters']
        });
        await queryClient.invalidateQueries({
          queryKey: ['synthesized']
        });
        break;
        
      case 'content-status':
        await queryClient.invalidateQueries({
          queryKey: ['elements']
        });
        break;
    }
  };
  
  /**
   * Batch invalidation for multiple entities
   */
  const invalidateBatch = async (
    invalidations: Array<{
      type: 'character' | 'element' | 'puzzle' | 'timeline';
      id: string;
    }>
  ) => {
    // Group by type for efficient invalidation
    const grouped = invalidations.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type]!.push(item.id);
      return acc;
    }, {} as Record<string, string[]>);
    
    // Invalidate each group
    for (const [type, ids] of Object.entries(grouped)) {
      // Invalidate the list query once for each type
      await queryClient.invalidateQueries({
        queryKey: [type + 's']
      });
      
      // Invalidate individual entities
      for (const id of ids) {
        await queryClient.invalidateQueries({
          queryKey: [type, id]
        });
      }
    }
    
    // If elements or puzzles were invalidated, also invalidate synthesized
    if (grouped.element || grouped.puzzle) {
      await queryClient.invalidateQueries({
        queryKey: ['synthesized']
      });
    }
  };
  
  return {
    invalidateEntity,
    invalidateRelationships,
    invalidateAfterMutation,
    invalidateView,
    invalidateBatch
  };
}