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
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent 
} from '@/types/notion/app';


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

// Mutation options with viewName for correct cache targeting
interface MutationOptions extends Partial<UseMutationOptions<any, MutationError, any>> {
  viewName?: string;
}

// Context for mutation rollback
interface MutationContext {
  previousGraphData?: any;
  queryKey: string[];
  tempId?: string;
  createdEdges?: string[];
}

// Node type mapping for correct entity type conversion
const ENTITY_TO_NODE_TYPE_MAP: Record<EntityType, string> = {
  'characters': 'character',
  'elements': 'element',
  'puzzles': 'puzzle',
  'timeline': 'timelineEvent'
};


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

// ============================================================================
// MUTATION FACTORY - Creates optimistic mutations for all entity types
// ============================================================================

/**
 * Factory function to create entity mutations with optimistic updates.
 * Eliminates code duplication across all 12 mutation hooks.
 * 
 * @param entityType - The type of entity (characters, elements, puzzles, timeline)
 * @param mutationType - The type of mutation (create, update, delete)
 * @returns Configured mutation hook with optimistic updates
 */
function createEntityMutation<T extends Entity | void = Entity>(
  entityType: EntityType,
  mutationType: MutationType
) {
  return function useEntityMutation(
    options?: MutationOptions & UseMutationOptions<T, MutationError, any>
  ) {
    const queryClient = useQueryClient();
    const apiModule = getApiModule(entityType);
    
    // Extract viewName with warning if not provided
    const viewName = options?.viewName;
    if (!viewName) {
      console.warn('[Mutation] No viewName provided, optimistic updates may not work correctly');
    }
    // Use consistent query key that matches what GraphView uses
    const queryKey = ['graph', 'complete', viewName || 'full-graph'];
    
    return useMutation<T, MutationError, any>({
      mutationFn: async (data): Promise<any> => {
        switch (mutationType) {
          case 'create':
            return await apiModule.create(data);
          case 'update':
            const { id, ...updateData } = data;
            return await apiModule.update(id, updateData);
          case 'delete':
            return await apiModule.delete(data);
          default:
            throw new Error(`Unknown mutation type: ${mutationType}`);
        }
      },
      
      onMutate: async (variables) => {
        // Cancel in-flight queries to prevent race conditions
        await queryClient.cancelQueries({ queryKey });
        
        // Snapshot specific view cache for rollback
        const previousData = queryClient.getQueryData(queryKey);
        
        // Generate unique temp ID for creates
        const tempId = mutationType === 'create' ? `temp-${Date.now()}` : undefined;
        const createdEdges: string[] = [];
        
        // Update specific view cache optimistically
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData) return oldData;
          
          const newData = { ...oldData };
          const nodes = [...(newData.nodes || [])];
          
          if (mutationType === 'create' && tempId) {
            // Create optimistic node with consistent tempId
            const newNode = {
              id: tempId,
              type: ENTITY_TO_NODE_TYPE_MAP[entityType],
              position: { x: 0, y: 0 },
              data: {
                label: variables.name || 'New Entity',
                type: ENTITY_TO_NODE_TYPE_MAP[entityType],
                id: tempId,
                entity: variables,
                metadata: {
                  entityType: ENTITY_TO_NODE_TYPE_MAP[entityType],
                  searchMatch: true,
                  isFocused: false,
                  isOptimistic: true, // Flag for visual feedback
                },
              },
            };
            nodes.push(newNode);
            
            // Add edge if parent relation exists
            // Ensure edges array exists before adding new edge
            if (!newData.edges) newData.edges = [];
            if (variables._parentRelation) {
              const edgeId = `e-${variables._parentRelation.parentId}-${tempId}`;
              const newEdge = {
                id: edgeId,
                source: variables._parentRelation.parentId,
                target: tempId,
                type: 'relation',
                data: {
                  relationField: variables._parentRelation.fieldKey,
                  isOptimistic: true
                }
              };
              newData.edges = [...(newData.edges || []), newEdge];
              createdEdges.push(edgeId);
            }
          } else if (mutationType === 'update') {
            // Update existing node optimistically
            const nodeIndex = nodes.findIndex(n => n.id === variables.id);
            if (nodeIndex !== -1) {
              nodes[nodeIndex] = {
                ...nodes[nodeIndex],
                data: {
                  ...nodes[nodeIndex].data,
                  entity: { ...nodes[nodeIndex].data.entity, ...variables },
                  label: variables.name || nodes[nodeIndex].data.label,
                  metadata: {
                    ...nodes[nodeIndex].data.metadata,
                    isOptimistic: true,
                  },
                },
              };
            }
          } else if (mutationType === 'delete') {
            // Remove node optimistically
            const nodeIndex = nodes.findIndex(n => n.id === variables);
            if (nodeIndex !== -1) {
              nodes.splice(nodeIndex, 1);
            }
            // Also remove related edges
            newData.edges = (newData.edges || []).filter(
              (e: any) => e.source !== variables && e.target !== variables
            );
          }
          
          return { ...newData, nodes };
        });
        
        return { 
          previousGraphData: previousData, 
          queryKey,
          tempId,
          createdEdges
        } as MutationContext;
      },
      
      onError: (error, variables, context) => {
        const ctx = context as MutationContext | undefined;
        
        if (!ctx) {
          // Cannot rollback without context, just show error
          toast.error(error.message || `Failed to ${mutationType} entity`);
          options?.onError?.(error, variables, context);
          return;
        }

        // 1. Handle CREATE failure: remove optimistic node and its associated edges
        // This branch is taken if it was a CREATE operation (no original ID, but a tempId was generated)
        if (!variables.id && ctx.tempId) {
          queryClient.setQueryData(ctx.queryKey, (old: any) => {
            if (!old) return old; // No old data, nothing to remove

            const newNodes = old.nodes.filter((n: any) => n.id !== ctx.tempId);
            let newEdges = (old.edges || []).filter((e: any) => 
              e.source !== ctx.tempId && e.target !== ctx.tempId // Use strict equality
            );

            // Also remove any edges explicitly marked as created optimistically
            if (ctx.createdEdges?.length) {
              newEdges = newEdges.filter((e: any) => !ctx.createdEdges!.includes(e.id));
            }

            return {
              ...old,
              nodes: newNodes,
              edges: newEdges
            };
          });
        } 
        // 2. Handle UPDATE/DELETE failure: restore previous state
        // This branch is taken if previousGraphData was successfully captured (can be null or actual data)
        else if (ctx.previousGraphData !== undefined) { // Check for explicit undefined, allowing null
          queryClient.setQueryData(ctx.queryKey, ctx.previousGraphData);
        } 
        // 3. Fallback: clean up optimistic artifacts if previousGraphData was not available
        // (e.g., onMutate failed before capturing, or other unexpected scenarios)
        else { 
          queryClient.setQueryData(ctx.queryKey, (current: any) => {
            if (!current) return current;
            
            return {
              ...current,
              nodes: current.nodes.map((node: any) => ({
                ...node,
                data: {
                  ...node.data,
                  metadata: {
                    ...node.data.metadata,
                    isOptimistic: false  // Remove all optimistic flags
                  }
                }
              })),
              // Remove optimistically created edges if any were tracked
              edges: ctx.createdEdges?.length 
                ? (current.edges || []).filter((e: any) => !ctx.createdEdges!.includes(e.id))
                : current.edges
            };
          });
        }
        
        // Show error toast
        const entityName = variables?.name || ENTITY_TO_NODE_TYPE_MAP[entityType];
        toast.error(error.message || `Failed to ${mutationType} ${entityName}`);
        options?.onError?.(error, variables, context);
      },
      
      onSuccess: async (data, variables, context) => {
        const ctx = context as MutationContext;
        
        // Manually update cache with server response instead of invalidating
        queryClient.setQueryData(ctx.queryKey, (oldData: any) => {
          if (!oldData) return oldData;
          
          let nodes = [...(oldData.nodes || [])];
          let edges = [...(oldData.edges || [])];
          
          if (mutationType === 'create' && ctx.tempId && data && 'id' in data) {
            // Find and replace temporary node with real data
            const nodeIndex = nodes.findIndex(n => n.id === ctx.tempId);
            if (nodeIndex !== -1) {
              // Replace with real data from server
              nodes[nodeIndex] = {
                ...nodes[nodeIndex],
                id: data.id,
                data: {
                  ...nodes[nodeIndex].data,
                  id: data.id,
                  entity: data,
                  label: ('name' in data ? data.name : null) || nodes[nodeIndex].data.label,
                  metadata: {
                    ...nodes[nodeIndex].data.metadata,
                    isOptimistic: false  // Remove optimistic flag
                  }
                }
              };
              
              // Update all edges to use real ID
              edges.forEach(edge => {
                if (edge.source === ctx.tempId) edge.source = data.id;
                if (edge.target === ctx.tempId) edge.target = data.id;
              });
            }
            // Update parent entity's relationship array if this was created from a relation field
            if (variables._parentRelation) {
              const { parentId, fieldKey } = variables._parentRelation;
              
              // Use map for immutable update instead of direct array mutation
              nodes = nodes.map((node) => {
                // If this isn't the parent node, return it unchanged
                if (node.id !== parentId) {
                  return node;
                }
                
                // It's the parent node, so update its relationship array
                const currentIds = node.data.entity[fieldKey] || [];
                
                // Return original node if ID already exists (avoid duplicates)
                if (currentIds.includes(data.id)) {
                  return node;
                }
                
                // Return updated parent node with new relationship
                return {
                  ...node,
                  data: {
                    ...node.data,
                    entity: {
                      ...node.data.entity,
                      [fieldKey]: [...currentIds, data.id]
                    }
                  }
                };
              });
              
              // After updating parent's array, create the edge
              if (data && 'id' in data) {
                // Determine edge type based on field name using explicit mapping
                // This mapping uses exact field names from the schema for precision
                const fieldKeyToEdgeType: Record<string, string> = {
                  // Character fields
                  'ownedElementIds': 'ownership',
                  'characterPuzzleIds': 'puzzle',
                  'eventIds': 'timeline',
                  
                  // Element fields
                  'ownerId': 'ownership',
                  'requiredForPuzzleIds': 'requirement',
                  'rewardedByPuzzleIds': 'reward',
                  'containerId': 'container',
                  'contentIds': 'container',
                  'timelineEventId': 'timeline',
                  'containerPuzzleId': 'puzzle',
                  
                  // Puzzle fields
                  'puzzleElementIds': 'requirement',
                  'rewardIds': 'reward',
                  'lockedItemId': 'container',
                  'parentItemId': 'dependency',
                  'subPuzzleIds': 'dependency',
                  'characterIds': 'character',
                  
                  // Timeline fields
                  'charactersInvolvedIds': 'character',
                  'memoryEvidenceIds': 'timeline',
                  
                  // Fallback patterns for common naming conventions
                  'elements': 'requirement',
                  'rewards': 'reward',
                  'characters': 'character',
                  'puzzles': 'puzzle',
                  'timeline': 'timeline',
                  'events': 'timeline'
                };
                
                // First try exact match, then try lowercase match, then default
                let edgeType = fieldKeyToEdgeType[fieldKey] || 
                               fieldKeyToEdgeType[fieldKey.toLowerCase()] || 
                               'relationship';
                
                // Add edge to the edges array
                // Use :: delimiter to avoid collisions when IDs contain hyphens
                // Format: e::parentId::fieldKey::childId ensures uniqueness
                const edgeId = `e::${parentId}::${fieldKey}::${data.id}`;
                const edgeIndex = edges.findIndex(e => e.id === edgeId);
                
                if (edgeIndex === -1) {
                  edges.push({
                    id: edgeId,
                    source: parentId,
                    target: data.id,
                    type: 'default',
                    data: {
                      relationshipType: edgeType,
                      fieldKey,
                      isOptimistic: false // Mark as not optimistic since it's from server data
                    }
                  });
                }
              }
            }
          } else if (mutationType === 'update' && data && 'id' in data) {
            // Update existing node and remove optimistic flag
            const nodeIndex = nodes.findIndex(n => n.id === variables.id);
            if (nodeIndex !== -1) {
              nodes[nodeIndex] = {
                ...nodes[nodeIndex],
                data: {
                  ...nodes[nodeIndex].data,
                  entity: data,
                  label: ('name' in data ? data.name : null) || nodes[nodeIndex].data.label,
                  metadata: {
                    ...nodes[nodeIndex].data.metadata,
                    isOptimistic: false
                  }
                }
              };
            }
          }
          // Delete operations don't need special handling here
          
          return { ...oldData, nodes, edges };
        });
        
        // Force cache invalidation for graph queries to ensure server's synthesized data is fetched
        await queryClient.invalidateQueries({ 
          queryKey: ['graph'],
          exact: false,
          refetchType: 'active' // Force active refetch
        });
        
        // Also invalidate the specific entity queries
        await queryClient.invalidateQueries({
          queryKey: [entityType],
          exact: false
        });
        
        // Show success toast
        const entityName = (data && 'name' in data ? data.name : null) || 
                          variables?.name || 
                          ENTITY_TO_NODE_TYPE_MAP[entityType];
        const action = mutationType === 'create' ? 'Created' : 
                       mutationType === 'update' ? 'Updated' : 'Deleted';
        toast.success(`${action} ${entityName}`);
        
        options?.onSuccess?.(data, variables, context);
      },
    });
  };
}


// ============================================================================
// CHARACTER MUTATIONS
// ============================================================================

/**
 * Create a new character - uses optimistic mutation factory
 */
export const useCreateCharacter = (options?: MutationOptions) => 
  createEntityMutation<Character>('characters', 'create')(options);

/**
 * Update an existing character - uses optimistic mutation factory
 */
export const useUpdateCharacter = (options?: MutationOptions) => 
  createEntityMutation<Character>('characters', 'update')(options);

/**
 * Delete a character - uses optimistic mutation factory
 */
export const useDeleteCharacter = (options?: MutationOptions) => 
  createEntityMutation('characters', 'delete')(options);

// ============================================================================
// ELEMENT MUTATIONS
// ============================================================================

/**
 * Create a new element - uses optimistic mutation factory
 */
export const useCreateElement = (options?: MutationOptions) => 
  createEntityMutation<Element>('elements', 'create')(options);

/**
 * Update an existing element - uses optimistic mutation factory
 */
export const useUpdateElement = (options?: MutationOptions) => 
  createEntityMutation<Element>('elements', 'update')(options);

/**
 * Delete an element - uses optimistic mutation factory
 */
export const useDeleteElement = (options?: MutationOptions) => 
  createEntityMutation('elements', 'delete')(options);

// ============================================================================
// PUZZLE MUTATIONS
// ============================================================================

/**
 * Create a new puzzle - uses optimistic mutation factory
 */
export const useCreatePuzzle = (options?: MutationOptions) => 
  createEntityMutation<Puzzle>('puzzles', 'create')(options);

/**
 * Update an existing puzzle - uses optimistic mutation factory
 */
export const useUpdatePuzzle = (options?: MutationOptions) => 
  createEntityMutation<Puzzle>('puzzles', 'update')(options);

/**
 * Delete a puzzle - uses optimistic mutation factory
 */
export const useDeletePuzzle = (options?: MutationOptions) => 
  createEntityMutation('puzzles', 'delete')(options);

// ============================================================================
// TIMELINE MUTATIONS
// ============================================================================

/**
 * Create a new timeline event - uses optimistic mutation factory
 */
export const useCreateTimeline = (options?: MutationOptions) => 
  createEntityMutation<TimelineEvent>('timeline', 'create')(options);

/**
 * Update an existing timeline event - uses optimistic mutation factory
 */
export const useUpdateTimeline = (options?: MutationOptions) => 
  createEntityMutation<TimelineEvent>('timeline', 'update')(options);

/**
 * Delete a timeline event - uses optimistic mutation factory
 */
export const useDeleteTimeline = (options?: MutationOptions) => 
  createEntityMutation('timeline', 'delete')(options);

// Aliases for backward compatibility
export const useCreateTimelineEvent = (options?: MutationOptions) => useCreateTimeline(options);
export const useUpdateTimelineEvent = (options?: MutationOptions) => useUpdateTimeline(options);
export const useDeleteTimelineEvent = (options?: MutationOptions) => useDeleteTimeline(options);

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
          // Pass complete update including any metadata
          return apiModule.update(update.id, update);
        })
      );
      
      return results as T[];
    },
    
    onSuccess: async (response) => {
      // Simple: just invalidate the graph after batch update
      await queryClient.invalidateQueries({ 
        queryKey: ['graph'] 
      });
      
      toast.success(`Updated ${response.length} entities`);
    }
  });
}