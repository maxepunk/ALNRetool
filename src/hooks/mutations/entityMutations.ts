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
import { charactersApi, elementsApi, puzzlesApi, timelineApi, ApiError } from '@/services/api';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent 
} from '@/types/notion/app';
import type {
  EntityType,
  Entity,
  MutationType,
  CreatePayload,
  UpdatePayload,
  DeletePayload,
  MutationResponse,
  MutationContext as BaseMutationContext
} from '@/types/mutations';
import { getCacheUpdater, determineCacheStrategy, type CacheUpdateContext } from '@/lib/cache/updaters';
import { useViewStore } from '@/stores/viewStore';

// Parent relation metadata for atomic creation (kept for backward compatibility)
export type ParentRelationMetadata = {
  _parentRelation?: {
    parentType: string;
    parentId: string;
    fieldKey: string;
  };
};

// Re-export for backward compatibility
export type { EntityType, Entity, MutationType } from '@/types/mutations';

// Error response
interface MutationError {
  message: string;
  code?: string;
  details?: unknown;
}

// Mutation options for optimistic updates and cache targeting
interface MutationOptions extends Partial<UseMutationOptions<any, MutationError, any>> {
  // Using viewStore for single source of truth instead of viewName parameter
}

// Extended context for local use (includes BaseMutationContext fields)
interface MutationContext extends BaseMutationContext {
  // Bug 8 Fix: Granular rollback fields
  previousNode?: any; // Original node state before UPDATE
  deletedNode?: any; // Node that was deleted (for DELETE)
  deletedEdges?: any[]; // Edges that were deleted (for DELETE)
  modifiedParentNodes?: Array<{ id: string; previousState: any }>; // Parent nodes modified during mutation
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
    options?: MutationOptions & UseMutationOptions<MutationResponse<T extends Entity ? T : Entity>, MutationError, any>
  ) {
    const queryClient = useQueryClient();
    const apiModule = getApiModule(entityType);
    
    // Get current view type from store for cache key consistency
    // Use consistent query key that matches what GraphView uses
    // Get current view from store instead of parameter (fixes Bug 6a)
    const currentViewType = useViewStore.getState().currentViewType;
    const queryKey = ['graph', 'complete', currentViewType || 'full-graph'];
    
    return useMutation<MutationResponse<T extends Entity ? T : Entity>, MutationError, any>({
      mutationFn: async (data): Promise<MutationResponse<T extends Entity ? T : Entity>> => {
        let response;
        switch (mutationType) {
          case 'create':
            const createPayload: CreatePayload<Entity> = {
              data: data,
              parentRelation: data._parentRelation
            };
            response = await apiModule.create(createPayload.data as any);
            break;
          case 'update':
            const updatePayload: UpdatePayload<Entity> = {
              id: data.id,
              data: { ...data },
              // H2: Use lastEdited as version for optimistic locking
              version: (data as any).lastEdited || (data as any).version // Support both for backward compatibility
            };
            delete updatePayload.data.id;
            delete (updatePayload.data as any).version;
            delete (updatePayload.data as any).lastEdited; // Don't send lastEdited in update body
            // H2: Pass lastEdited as If-Match header for optimistic locking
            // Version is now a string (lastEdited timestamp) with RFC 7232 quotes
            const updateHeaders = updatePayload.version !== undefined 
              ? { 'If-Match': `"${updatePayload.version}"` }
              : undefined;
            response = await apiModule.update(updatePayload.id, updatePayload.data as any, updateHeaders);
            break;
          case 'delete':
            // Standardize to DeletePayload format
            let deletePayload: DeletePayload;
            if (typeof data === 'string') {
              // TECHNICAL DEBT: Backward compatibility - convert string to object
              deletePayload = { id: data };
            } else {
              deletePayload = data as DeletePayload;
            }
            // H2: Version header for DELETE operations
            const deleteHeaders = deletePayload.version !== undefined 
              ? { 'If-Match': `"${deletePayload.version}"` }
              : undefined;
            response = await apiModule.delete(deletePayload.id, deleteHeaders);
            break;
          default:
            throw new Error(`Unknown mutation type: ${mutationType}`);
        }
        
        // API now returns MutationResponse directly for mutations
        // For DELETE operations, construct a MutationResponse if needed
        if (mutationType === 'delete' && !response) {
          return {
            success: true,
            data: { id: data.id || data } as (T extends Entity ? T : Entity)
          };
        }
        
        // All mutations now return MutationResponse from API
        return response as MutationResponse<T extends Entity ? T : Entity>;
      },
      
      onMutate: async (variables) => {
        // Cancel in-flight queries to prevent race conditions
        await queryClient.cancelQueries({ queryKey });
        
        // Snapshot specific view cache for rollback
        const previousData = queryClient.getQueryData(queryKey);
        
        
        // Generate unique temp ID for creates
        const tempId = mutationType === 'create' ? `temp-${Date.now()}` : undefined;
        const createdEdges: string[] = [];
        
        // Bug 8 Fix: Capture granular state for rollback
        let previousNode: any;
        let deletedNode: any;
        let deletedEdges: any[] = [];
        const modifiedParentNodes: Array<{ id: string; previousState: any }> = [];
        
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
              // Use consistent edge ID format with delta: e::source::field::target
              const edgeId = `e::${variables._parentRelation.parentId}::${variables._parentRelation.fieldKey}::${tempId}`;
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
              // Bug 8 Fix: Capture previous state for granular rollback
              previousNode = { ...nodes[nodeIndex] };
              
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
            // Handle both string ID and object with version
            const deleteId = typeof variables === 'string' ? variables : variables.id;
            
            // Bug 8 Fix: Capture deleted node and edges for granular rollback
            const nodeToDelete = nodes.find(n => n.id === deleteId);
            if (nodeToDelete) {
              deletedNode = { ...nodeToDelete };
            }
            
            // Capture edges that will be deleted
            deletedEdges = (newData.edges || []).filter(
              (e: any) => e.source === deleteId || e.target === deleteId
            );
            
            // Bug 7 Fix: Clean up parent entity relationship arrays
            // Find all edges where this entity is the target (child)
            const incomingEdges = (newData.edges || []).filter((e: any) => e.target === deleteId);
            
            // Update parent nodes to remove this child from their relationship arrays
            for (const edge of incomingEdges) {
              const parentNodeIndex = nodes.findIndex(n => n.id === edge.source);
              if (parentNodeIndex !== -1 && edge.data?.relationField) {
                const parentNode = nodes[parentNodeIndex];
                
                // Bug 8 Fix: Capture parent's previous state
                modifiedParentNodes.push({
                  id: parentNode.id,
                  previousState: { ...parentNode }
                });
                const fieldKey = edge.data.relationField;
                const currentIds = parentNode.data.entity[fieldKey] || [];
                
                // Remove the deleted ID from parent's relationship array
                const updatedIds = currentIds.filter((id: string) => id !== deleteId);
                
                // Only update if the ID was actually present
                if (updatedIds.length < currentIds.length) {
                  nodes[parentNodeIndex] = {
                    ...parentNode,
                    data: {
                      ...parentNode.data,
                      entity: {
                        ...parentNode.data.entity,
                        [fieldKey]: updatedIds
                      }
                    }
                  };
                }
              }
            }
            
            // Remove node optimistically
            const nodeIndex = nodes.findIndex(n => n.id === deleteId);
            if (nodeIndex !== -1) {
              nodes.splice(nodeIndex, 1);
            }
            // Also remove related edges
            newData.edges = (newData.edges || []).filter(
              (e: any) => e.source !== deleteId && e.target !== deleteId
            );
          }
          
          return { ...newData, nodes };
        });
        
        return { 
          previousGraphData: previousData, 
          queryKey,
          tempId,
          createdEdges,
          // Bug 8 Fix: Include granular state for rollback
          previousNode,
          deletedNode,
          deletedEdges,
          modifiedParentNodes,
          // OPTIMISTIC FIX: Track when optimistic update started
          optimisticStartTime: Date.now()
        } as MutationContext;
      },
      
      onError: async (error, variables, context) => {
        const ctx = context as MutationContext | undefined;
        
        // Check for version conflict (409 Conflict)
        if (error instanceof ApiError && error.statusCode === 409) {
          toast.error(
            'This item has been modified by another user. Please refresh the page and try again.',
            { duration: 5000 } // Show for longer since it's important
          );
          // Still call the original onError if provided
          options?.onError?.(error, variables, context);
          // Don't do rollback for conflicts - user needs to refresh
          return;
        }
        
        if (!ctx) {
          // Cannot rollback without context, just show error
          toast.error(error.message || `Failed to ${mutationType} entity`);
          options?.onError?.(error, variables, context);
          return;
        }
        
        // OPTIMISTIC FIX: Ensure minimum display time for optimistic updates
        // This ensures users see the optimistic update even with immediate error responses
        const optimisticStartTime = ctx.optimisticStartTime || Date.now();
        const elapsedTime = Date.now() - optimisticStartTime;
        const minDisplayTime = 50; // Minimum time to show optimistic update
        
        if (elapsedTime < minDisplayTime) {
          const remainingTime = minDisplayTime - elapsedTime;
          await new Promise(resolve => setTimeout(resolve, remainingTime));
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
        // 2. Handle UPDATE/DELETE failure with granular rollback (Bug 8 Fix)
        else if (mutationType === 'update' && ctx.previousNode) {
          // Granular rollback for UPDATE: restore only the specific node
          queryClient.setQueryData(ctx.queryKey, (current: any) => {
            if (!current) return current;
            
            const nodes = [...current.nodes];
            const nodeIndex = nodes.findIndex(n => n.id === ctx.previousNode.id);
            if (nodeIndex !== -1) {
              nodes[nodeIndex] = ctx.previousNode;
            }
            
            return { ...current, nodes };
          });
        }
        else if (mutationType === 'delete' && (ctx.deletedNode || ctx.modifiedParentNodes?.length)) {
          // Granular rollback for DELETE: restore deleted node and parent relationships
          queryClient.setQueryData(ctx.queryKey, (current: any) => {
            if (!current) return current;
            
            let nodes = [...current.nodes];
            let edges = [...(current.edges || [])];
            
            // Restore deleted node
            if (ctx.deletedNode) {
              nodes.push(ctx.deletedNode);
            }
            
            // Restore deleted edges
            if (ctx.deletedEdges?.length) {
              edges = [...edges, ...ctx.deletedEdges];
            }
            
            // Restore modified parent nodes
            if (ctx.modifiedParentNodes?.length) {
              for (const parent of ctx.modifiedParentNodes) {
                const parentIndex = nodes.findIndex(n => n.id === parent.id);
                if (parentIndex !== -1) {
                  nodes[parentIndex] = parent.previousState;
                }
              }
            }
            
            return { ...current, nodes, edges };
          });
        }
        // 3. Fallback to full restore if granular data not available
        else if (ctx.previousGraphData !== undefined) {
          queryClient.setQueryData(ctx.queryKey, ctx.previousGraphData);
        } 
        // 4. Final fallback: clean up optimistic artifacts if no rollback data available
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
        
        // STEP 1/7: Delta detection for UPDATE, CREATE, and DELETE mutations
        const responseData: any = data && typeof data === 'object' ? data : {};
        const hasDelta = responseData.delta && (mutationType === 'update' || mutationType === 'create' || mutationType === 'delete');
        // Delta application now always succeeds for CRUD operations or throws
        let deltaDuration = 0; // For performance comparison
        
        if (hasDelta) {
          console.log(`[Delta] Available for ${entityType} ${mutationType.toUpperCase()}:`, {
            entityId: variables.id,
            entityName: variables.name,
            deltaSize: JSON.stringify(responseData.delta).length,
            changes: {
              nodes: {
                updated: responseData.delta.changes?.nodes?.updated?.length || 0,
                created: responseData.delta.changes?.nodes?.created?.length || 0,
                deleted: responseData.delta.changes?.nodes?.deleted?.length || 0,
              },
              edges: {
                updated: responseData.delta.changes?.edges?.updated?.length || 0,
                created: responseData.delta.changes?.edges?.created?.length || 0,
                deleted: responseData.delta.changes?.edges?.deleted?.length || 0,
              }
            }
          });
          
          // STEP 2/7: Apply delta using CacheUpdater for UPDATE, CREATE, and DELETE mutations
          try {
            const strategy = determineCacheStrategy(responseData.delta, false); // Don't prefer optimistic when we have delta
            const updater = getCacheUpdater(strategy);
            
            const updateContext: CacheUpdateContext = {
              queryClient,
              queryKey: ctx.queryKey,
              strategy,
              entity: responseData.data,
              delta: responseData.delta,
              operation: mutationType as 'create' | 'update' | 'delete', // Now supports all mutations
              tempId: ctx.tempId, // For CREATE, this is the temp node to replace
              previousState: ctx.previousGraphData // For rollback if needed
            };
            
            console.log(`[Delta] Applying ${strategy} strategy for ${entityType} ${mutationType.toUpperCase()}`);
            
            // STEP 3: Add performance metrics for delta application
            const deltaStartTime = performance.now();
            await updater.update(updateContext);
            const deltaEndTime = performance.now();
            deltaDuration = deltaEndTime - deltaStartTime; // Store for comparison
            
            console.log(`[Delta] Successfully applied delta for ${entityType} ${mutationType.toUpperCase()}`, {
              strategy,
              durationMs: deltaDuration.toFixed(2),
              cacheSize: JSON.stringify(queryClient.getQueryData(ctx.queryKey) || {}).length,
              deltaSize: JSON.stringify(responseData.delta).length,
              efficiency: `${((JSON.stringify(responseData.delta).length / JSON.stringify(queryClient.getQueryData(ctx.queryKey) || {}).length) * 100).toFixed(1)}% of cache size`
            });
            
            // No need for delayed cleanup - delta should bring clean data from server
            // The isOptimistic flag is only for temporary visual feedback during the mutation
            
            // Delta successfully applied
          } catch (error) {
            console.error(`[Delta] Failed to apply delta for ${entityType} ${mutationType.toUpperCase()}:`, error);
            // Fall through to manual update + invalidation
          }
        } else if (mutationType === 'update' || mutationType === 'create' || mutationType === 'delete') {
          // CRITICAL: Delta should ALWAYS be present for successful CRUD operations
          // If we get here, it means the server didn't return delta, which is a bug
          console.error(`[Delta] MISSING for successful ${entityType} ${mutationType.toUpperCase()} - this should not happen!`);
        }
        
        // Manual fallback removed - DeltaCacheUpdater handles all CRUD operations
        
        // Only invalidate if delta wasn't available or failed to apply
        // Delta handles all cache updates when available, making invalidation unnecessary
        let invalidationDuration = 0;
        const shouldInvalidate = !hasDelta && (mutationType === 'create' || mutationType === 'delete');
        if (shouldInvalidate) {
          // Force cache invalidation for graph queries to ensure server's synthesized data is fetched
          // STEP 3: Add performance metrics for invalidation comparison
          const invalidationStartTime = performance.now();
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
          const invalidationEndTime = performance.now();
          invalidationDuration = invalidationEndTime - invalidationStartTime;
        }
        
        if (mutationType === 'update' || mutationType === 'create' || mutationType === 'delete') {
          console.log(`[Delta] Final ${mutationType.toUpperCase()} metrics for ${entityType}`, {
            deltaWasAvailable: hasDelta,
            deltaWasApplied: hasDelta,
            invalidationSkipped: !shouldInvalidate,
            timings: hasDelta ? {
              deltaDurationMs: deltaDuration.toFixed(2),
              invalidationDurationMs: '0.00 (skipped)',
              totalDurationMs: deltaDuration.toFixed(2)
            } : {
              deltaDurationMs: 'N/A',
              invalidationDurationMs: invalidationDuration.toFixed(2),
              totalDurationMs: invalidationDuration.toFixed(2)
            },
            networkSavings: hasDelta ? 
              'Avoided 2+ network requests (graph + entity queries)' :
              'No savings - full invalidation performed'
          });
        }
        
        // Show success toast
        const responseEntity = data && 'data' in data ? data.data : data;
        const entityName = (responseEntity && 'name' in responseEntity ? responseEntity.name : null) || 
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

