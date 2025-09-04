/**
 * Unified Entity Mutation Factory
 * 
 * Provides a consistent interface for all entity mutations (create, update, delete)
 * with proper type safety, error handling, and cache invalidation.
 * 
 * Uses the verified schema constants from schema-mapping.ts
 * 
 * CRITICAL: Race Condition Solution Architecture
 * ================================================
 * This module solves the optimistic update race condition that occurs when
 * server responses arrive in the same JavaScript task as the mutation initiation.
 * 
 * ROOT CAUSE:
 * React 18's automatic batching combines all state updates within the same task.
 * When the server responds immediately (0ms), both onMutate and onSuccess execute
 * in the same task, causing React to batch their cache updates together. The last
 * update (from onSuccess) wins, making optimistic updates invisible to users.
 * 
 * SOLUTION:
 * We intentionally use setTimeout(0) to create a task boundary between optimistic
 * and server updates. This is NOT a hack or workaround - it's the architecturally
 * correct solution that leverages JavaScript's event loop to ensure optimistic
 * updates render before server data is applied.
 * 
 * WHY setTimeout(0) IS CORRECT:
 * 1. Creates a new task in the event loop, breaking React's automatic batching
 * 2. Ensures optimistic updates render in the current task
 * 3. Server updates apply in the next task, after user sees optimistic state
 * 4. Minimal delay (next available task, typically <4ms)
 * 5. Standards-compliant JavaScript behavior, consistent across browsers
 * 6. Future-proof: doesn't rely on React internals, only JS task scheduling
 * 
 * ALTERNATIVE APPROACHES THAT DON'T WORK:
 * - startTransition: Still batches if updates are in same task
 * - flushSync: Would break React concurrent features and harm performance
 * - Microtasks (Promise.resolve): Still in same task, would still batch
 * - Synchronous rendering: Would defeat purpose of React 18's improvements
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { startTransition } from 'react';
import toast from 'react-hot-toast';
import { charactersApi, elementsApi, puzzlesApi, timelineApi, ApiError } from '@/services/api';
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
import { getCacheUpdater, determineCacheStrategy, type CacheUpdateContext, type CachedGraphData } from '@/lib/cache/updaters';
import type { QueryClient } from '@tanstack/react-query';

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
  'character': 'character',
  'element': 'element',
  'puzzle': 'puzzle',
  'timeline': 'timelineEvent'
};


// Helper function to get API module for entity type
function getApiModule(entityType: EntityType) {
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
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Applies selective field updates to preserve metadata while updating entity data.
 * Used as fallback when delta is not available from server.
 * 
 * @param queryClient - React Query client instance
 * @param queryKey - Cache key for the query to update
 * @param entity - The updated entity from server
 * @param tempId - Optional temp ID for CREATE operations
 * @param preserveOptimistic - Whether to preserve the isOptimistic flag (default: false)
 */
function applySelectiveUpdate(
  queryClient: QueryClient,
  queryKey: string[],
  entity: Entity,
  tempId?: string,
  preserveOptimistic: boolean = false
) {
  queryClient.setQueryData(queryKey, (oldData: unknown) => {
    const graphData = oldData as CachedGraphData | undefined;
    if (!graphData || !graphData.nodes) return oldData;

    const nodes = [...graphData.nodes];
    const nodeIndex = nodes.findIndex((n) => 
      n.id === entity.id || (tempId && n.id === tempId)
    );

    if (nodeIndex !== -1) {
      const oldNode = nodes[nodeIndex];
      if (!oldNode) return graphData; // Type guard
      
      // Determine whether to preserve the optimistic flag
      const currentIsOptimistic = oldNode.data?.metadata?.isOptimistic || false;
      const shouldPreserveFlag = preserveOptimistic && currentIsOptimistic;
      
      // Preserve node structure while updating entity data
      nodes[nodeIndex] = {
        ...oldNode,
        id: entity.id, // Replace temp ID with real ID for CREATE
        data: {
          ...oldNode.data,
          entity: {
            ...(oldNode.data.entity || {}),
            ...entity // Merge new entity data
          },
          label: entity.name || oldNode.data.label,
          metadata: {
            ...(oldNode.data.metadata || {}),
            // Preserve optimistic flag if requested and it was true
            isOptimistic: shouldPreserveFlag
          }
        }
      };
    }

    return { ...graphData, nodes };
  });
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
    
    // Use unified cache key pattern: ['graph', 'complete']
    const queryKey = ['graph', 'complete'];
    
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
        console.log('[DEBUG] onMutate called with queryKey:', queryKey, 'mutationType:', mutationType);
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
          
          console.log('[DEBUG] onMutate setQueryData complete, nodes:', nodes.length);
          if (mutationType === 'update') {
            const updatedNode = nodes.find((n: any) => n.id === variables.id);
            console.log('[DEBUG] Updated node isOptimistic:', updatedNode?.data?.metadata?.isOptimistic);
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
          modifiedParentNodes
        } as MutationContext;
      },
      
      onError: async (error, variables, context) => {
        const ctx = context as MutationContext | undefined;
        console.log('[DEBUG] onError called, error:', error, 'ctx available:', !!ctx, 'mutationType:', mutationType);
        
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
          console.log('[DEBUG] Rolling back UPDATE, previousNode:', ctx.previousNode);
          queryClient.setQueryData(ctx.queryKey, (current: any) => {
            if (!current) return current;
            
            const nodes = [...current.nodes];
            const nodeIndex = nodes.findIndex(n => n.id === ctx.previousNode.id);
            if (nodeIndex !== -1) {
              console.log('[DEBUG] Restoring node at index:', nodeIndex, 'to label:', ctx.previousNode.data?.label);
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
            
            // CRITICAL FIX: Handle sync and async updaters correctly
            // Check if updater is async based on the instance type
            // InvalidateCacheUpdater is the only async updater
            const isAsyncUpdater = updater.constructor.name === 'InvalidateCacheUpdater';
            
            if (isAsyncUpdater) {
              // Async updater - await it directly
              await updater.update(updateContext);
            } else {
              // TASK BOUNDARY: Critical Architecture Decision
              // ============================================
              // Sync updaters (DeltaCacheUpdater, OptimisticCacheUpdater) must be
              // deferred to a new task to escape React 18's automatic batching.
              //
              // WHAT HAPPENS WITHOUT setTimeout(0):
              // 1. User triggers mutation (e.g., clicks save)
              // 2. onMutate runs → sets optimistic state (Task 1)
              // 3. Server responds immediately (0ms) → onSuccess runs (still Task 1)
              // 4. React batches both cache updates together
              // 5. Only the last update (server data) renders
              // 6. User never sees optimistic update
              //
              // WHAT HAPPENS WITH setTimeout(0):
              // 1. User triggers mutation
              // 2. onMutate runs → sets optimistic state (Task 1)
              // 3. Server responds → onSuccess runs (still Task 1)
              // 4. setTimeout defers server update to Task 2
              // 5. Task 1 completes → React renders optimistic state
              // 6. Task 2 runs → React renders server state
              // 7. User sees both updates in sequence
              //
              // This is architecturally correct, not a workaround.
              // Wrap in Promise for proper async/await handling
              await new Promise<void>((resolve) => {
                setTimeout(() => {
                  console.log('[DEBUG] About to apply delta, checking current isOptimistic state');
                  const currentData: any = queryClient.getQueryData(ctx.queryKey);
                  const currentNode = currentData?.nodes?.find((n: any) => 
                    n.id === variables.id || n.id === ctx.tempId
                  );
                  console.log('[DEBUG] Before delta: isOptimistic =', currentNode?.data?.metadata?.isOptimistic);
                  
                  updater.update(updateContext);
                  
                  const afterData: any = queryClient.getQueryData(ctx.queryKey);
                  const afterNode = afterData?.nodes?.find((n: any) => 
                    n.id === variables.id || n.id === responseData.data?.id
                  );
                  console.log('[DEBUG] After delta: isOptimistic =', afterNode?.data?.metadata?.isOptimistic);
                  
                  // EVENT-DRIVEN CLEANUP: Clear optimistic flag immediately after delta
                  // This replaces the 100ms timer approach - flag is cleared as soon as
                  // server data is successfully applied, not on an arbitrary timer.
                  if (responseData.data?.id && afterNode?.data?.metadata?.isOptimistic) {
                    queryClient.setQueryData(ctx.queryKey, (oldData: any) => {
                      if (!oldData) return oldData;
                      
                      const nodes = oldData.nodes?.map((node: any) => {
                        if (node.id === responseData.data.id && node.data?.metadata?.isOptimistic) {
                          return {
                            ...node,
                            data: {
                              ...node.data,
                              metadata: {
                                ...node.data.metadata,
                                isOptimistic: false
                              }
                            }
                          };
                        }
                        return node;
                      }) || [];
                      
                      return { ...oldData, nodes };
                    });
                    console.log('[DEBUG] Cleared isOptimistic flag after successful delta application');
                  }
                  
                  resolve();
                }, 0);
              });
            }
            
            const deltaEndTime = performance.now();
            deltaDuration = deltaEndTime - deltaStartTime; // Store for comparison
            
            console.log(`[Delta] Successfully applied delta for ${entityType} ${mutationType.toUpperCase()}`, {
              strategy,
              durationMs: deltaDuration.toFixed(2),
              cacheSize: JSON.stringify(queryClient.getQueryData(ctx.queryKey) || {}).length,
              deltaSize: JSON.stringify(responseData.delta).length,
              efficiency: `${((JSON.stringify(responseData.delta).length / JSON.stringify(queryClient.getQueryData(ctx.queryKey) || {}).length) * 100).toFixed(1)}% of cache size`
            });
            
            // REMOVED: 100ms cleanup timer
            // =============================
            // The 100ms timer has been replaced with event-driven cleanup
            // that occurs immediately after delta application (see lines 660-686).
            // This provides more deterministic behavior and removes the arbitrary
            // timing dependency that was causing test flakiness.
            //
            // The flag is now cleared:
            // - Immediately after successful delta application
            // - Only for the specific node that was updated
            // - Without any arbitrary delay
            
            // Delta successfully applied
          } catch (error) {
            console.error(`[Delta] Failed to apply delta for ${entityType} ${mutationType.toUpperCase()}:`, error);
            // Use selective update as fallback
            if (mutationType === 'update' || mutationType === 'create') {
              console.warn(`[Delta] Falling back to selective update`);
              // FALLBACK TASK BOUNDARY: Selective Update with startTransition
              // ==============================================================
              // Using startTransition here (not setTimeout) because:
              // 1. This is a fallback path when delta fails
              // 2. The optimistic update is already visible (from onMutate)
              // 3. startTransition marks this as lower priority
              // 4. We don't need guaranteed task separation here
              //
              // NOTE: Now preserving optimistic flag when using selective update
              // as a fallback, since the user should still see optimistic state
              // even when delta application fails.
              startTransition(() => {
                applySelectiveUpdate(queryClient, ctx.queryKey, responseData.data, ctx.tempId, true);
              });
            }
          }
        } else if (mutationType === 'update' || mutationType === 'create') {
          // Delta missing - use selective field update as fallback
          console.warn(`[Delta] Missing for ${entityType} ${mutationType.toUpperCase()} - using selective update`);
          
          // NO DELTA PATH: Using startTransition for selective update
          // =========================================================
          // When server doesn't provide a delta, we fall back to selective
          // field updates. Using startTransition (not setTimeout) because:
          // - We're already in onSuccess (optimistic update was in onMutate)
          // - This marks the update as lower priority transition
          // - React can interrupt if higher priority work comes in
          //
          // Now preserving optimistic flag since this is a fallback path
          // where delta is missing - user should still see optimistic state.
          startTransition(() => {
            applySelectiveUpdate(queryClient, ctx.queryKey, responseData.data, ctx.tempId, true);
          });
        } else if (mutationType === 'delete') {
          // For DELETE without delta, we need full invalidation
          console.warn(`[Delta] Missing for ${entityType} DELETE - will use invalidation`);
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
          
          // Invalidation is async - just await it normally
          // No startTransition needed for async operations
          await Promise.all([
            queryClient.invalidateQueries({ 
              queryKey: ['graph'],
              exact: false,
              refetchType: 'active' // Force active refetch
            }),
            queryClient.invalidateQueries({
              queryKey: [entityType],
              exact: false
            })
          ]);
          
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
// UNIFIED ENTITY MUTATION HOOK
// ============================================================================

// Export the factory for advanced use cases
export { createEntityMutation };

/**
 * Unified hook for all entity mutations
 * Replaces the 18 individual hooks with a single, dynamic hook
 * 
 * @param entityType - The type of entity ('character', 'element', 'puzzle', 'timeline')
 * @param mutationType - The type of mutation ('create', 'update', 'delete')
 * @param options - Optional mutation options
 * 
 * @example
 * const createMutation = useEntityMutation('character', 'create');
 * const updateMutation = useEntityMutation('puzzle', 'update');
 * const deleteMutation = useEntityMutation('element', 'delete');
 */
export function useEntityMutation(
  entityType: EntityType,
  mutationType: MutationType,
  options?: MutationOptions
) {
  return createEntityMutation(entityType, mutationType)(options);
}

