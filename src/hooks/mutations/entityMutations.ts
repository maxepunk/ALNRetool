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

// Mutation options with viewName for correct cache targeting
interface MutationOptions extends Partial<UseMutationOptions<any, MutationError, any>> {
  viewName?: string;
}

// Extended context for local use (includes BaseMutationContext fields)
interface MutationContext extends BaseMutationContext {
  // Additional fields specific to this implementation
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
    
    // Extract viewName with warning if not provided
    const viewName = options?.viewName;
    if (!viewName) {
      console.warn('[Mutation] No viewName provided, optimistic updates may not work correctly');
    }
    // Use consistent query key that matches what GraphView uses
    const queryKey = ['graph', 'complete', viewName || 'full-graph'];
    
    return useMutation<MutationResponse<T extends Entity ? T : Entity>, MutationError, any>({
      mutationFn: async (data): Promise<MutationResponse<T extends Entity ? T : Entity>> => {
        let response;
        switch (mutationType) {
          case 'create':
            const createPayload: CreatePayload<Entity> = {
              data: data,
              parentRelation: data._parentRelation
            };
            response = await apiModule.create(createPayload.data);
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
            response = await apiModule.update(updatePayload.id, updatePayload.data, updateHeaders);
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
        
        // Wrap response in MutationResponse format if not already
        if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
          return response as MutationResponse<T extends Entity ? T : Entity>;
        }
        // Legacy format - wrap in MutationResponse
        return {
          success: true,
          data: response as (T extends Entity ? T : Entity)
        };
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
            // Handle both string ID and object with version
            const deleteId = typeof variables === 'string' ? variables : variables.id;
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
          createdEdges
        } as MutationContext;
      },
      
      onError: (error, variables, context) => {
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
        
        // STEP 1/7: Delta detection for UPDATE, CREATE, and DELETE mutations
        const responseData: any = data && typeof data === 'object' ? data : {};
        const hasDelta = responseData.delta && (mutationType === 'update' || mutationType === 'create' || mutationType === 'delete');
        let deltaAppliedSuccessfully = false;
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
              previousState: ctx.previousGraphData, // For rollback if needed
              viewName: options?.viewName
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
            deltaAppliedSuccessfully = true;
            
            // Skip the manual cache update below since delta handled it
            // But still run invalidation as fallback for now (Step 5 will remove this)
          } catch (error) {
            console.error(`[Delta] Failed to apply delta for ${entityType} ${mutationType.toUpperCase()}:`, error);
            // Fall through to manual update + invalidation
          }
        } else if (mutationType === 'update' || mutationType === 'create' || mutationType === 'delete') {
          console.log(`[Delta] NOT available for ${entityType} ${mutationType.toUpperCase()} - will use manual update + invalidation`);
        }
        
        // Manually update cache with server response instead of invalidating
        // Skip this if delta was applied successfully for UPDATE, CREATE, or DELETE
        //
        // ⚠️ WARNING: Deep nesting ahead! This block has caused repeated confusion.
        // The structure is: if { setQueryData( (oldData) => { if-else-if chains with 3 levels of nesting } ) }
        // Each closing brace is now clearly commented. Do NOT "fix" the braces - they are correct!
        // To verify structure, use: npm run typecheck (NOT npx tsc directly!)
        if (!deltaAppliedSuccessfully || (mutationType !== 'update' && mutationType !== 'create' && mutationType !== 'delete')) {
          queryClient.setQueryData(ctx.queryKey, (oldData: any) => {
          if (!oldData) return oldData;
          
          let nodes = [...(oldData.nodes || [])];
          let edges = [...(oldData.edges || [])];
          
          if (mutationType === 'create' && ctx.tempId && data) {
            // Extract entity from MutationResponse
            const entity = 'data' in data ? data.data : data;
            if (entity && 'id' in entity) {
              // Find and replace temporary node with real data
              const nodeIndex = nodes.findIndex(n => n.id === ctx.tempId);
              if (nodeIndex !== -1) {
                // Replace with real data from server
                nodes[nodeIndex] = {
                  ...nodes[nodeIndex],
                  id: entity.id,
                  data: {
                    ...nodes[nodeIndex].data,
                    id: entity.id,
                    entity: entity,
                    label: ('name' in entity ? entity.name : null) || nodes[nodeIndex].data.label,
                  metadata: {
                    ...nodes[nodeIndex].data.metadata,
                    isOptimistic: false  // Remove optimistic flag
                  }
                }
              };
              
                // Update all edges to use real ID - unified operation for proper ID sync
                edges = edges.map(edge => {
                  // Check if this edge involves the temp ID
                  if (edge.source === ctx.tempId || edge.target === ctx.tempId) {
                    const newSource = edge.source === ctx.tempId ? entity.id : edge.source;
                    const newTarget = edge.target === ctx.tempId ? entity.id : edge.target;
                  
                  // Reconstruct edge ID to match new source/target
                  // Edge ID format: e::{source}::{fieldKey}::{target}
                  const fieldKey = edge.data?.fieldKey || 'relationship';
                  const newEdgeId = `e::${newSource}::${fieldKey}::${newTarget}`;
                  
                  return {
                    ...edge,
                    id: newEdgeId, // CRITICAL: Update edge ID to reflect new nodes
                    source: newSource,
                    target: newTarget,
                    data: {
                      ...edge.data,
                      isOptimistic: false // Remove optimistic flag from edges
                    }
                  };
                }
                return edge;
              });
            }
            // Update parent entity's relationship array if this was created from a relation field
            if (variables._parentRelation) {
              const { parentId, fieldKey } = variables._parentRelation;
              
              // Find parent node index for efficient update
              const parentNodeIndex = nodes.findIndex(node => node.id === parentId);
              if (parentNodeIndex !== -1) {
                const parentNode = nodes[parentNodeIndex];
                const currentIds = parentNode.data.entity[fieldKey] || [];
                
                  // Only update if ID doesn't already exist (avoid duplicates)
                  if (!currentIds.includes(entity.id)) {
                  // Create new nodes array with updated parent
                  nodes = [
                    ...nodes.slice(0, parentNodeIndex),
                    {
                      ...parentNode,
                      data: {
                        ...parentNode.data,
                        entity: {
                          ...parentNode.data.entity,
                            [fieldKey]: [...currentIds, entity.id]
                        }
                      }
                    },
                    ...nodes.slice(parentNodeIndex + 1)
                  ];
                }
              }
              
                // After updating parent's array, create the edge
                if (entity && 'id' in entity) {
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
                
                  // Check if edge already exists (may have been updated by unified operation above)
                  const finalEdgeId = `e::${parentId}::${fieldKey}::${entity.id}`;
                const existingFinalEdgeIndex = edges.findIndex(e => e.id === finalEdgeId);
                
                // If unified update already handled this edge, nothing more to do
                if (existingFinalEdgeIndex === -1) {
                  // Edge doesn't exist yet, check for optimistic edge to replace
                  // (this would be an edge created directly with parent, not with temp node)
                  const optimisticEdgeIndex = edges.findIndex(e => 
                    e.source === parentId && 
                    e.target === ctx.tempId && 
                    e.data?.fieldKey === fieldKey
                  );
                  
                  if (optimisticEdgeIndex !== -1) {
                    // Replace the optimistic edge with the confirmed one
                    edges = [
                      ...edges.slice(0, optimisticEdgeIndex),
                      {
                        id: finalEdgeId,
                        source: parentId,
                        target: entity.id,
                        type: 'default',
                        data: {
                          relationshipType: edgeType,
                          fieldKey,
                          isOptimistic: false // Mark as confirmed
                        }
                      },
                      ...edges.slice(optimisticEdgeIndex + 1)
                    ];
                  } else {
                    // No optimistic edge found, create new edge
                    edges = [...edges, {
                      id: finalEdgeId,
                      source: parentId,
                      target: entity.id,
                      type: 'default',
                      data: {
                        relationshipType: edgeType,
                        fieldKey,
                        isOptimistic: false
                      }
                    }];
                    }
                  }
                }
              }
            }
          } else if (mutationType === 'update' && data) {
            // Extract entity from MutationResponse
            const entity = 'data' in data ? data.data : data;
            
            if (entity && 'id' in entity) {
              // Find the node to update
              const nodeIndex = nodes.findIndex(n => n.id === variables.id);
              if (nodeIndex !== -1) {
                // Update the node and remove the optimistic flag
                nodes[nodeIndex] = {
                  ...nodes[nodeIndex],
                  data: {
                    ...nodes[nodeIndex].data,
                    entity: entity,
                    label: ('name' in entity ? entity.name : null) || nodes[nodeIndex].data.label,
                    metadata: {
                      ...nodes[nodeIndex].data.metadata,
                      isOptimistic: false
                    }
                  }
                };
              } // Closes: if (nodeIndex !== -1)
            } // Closes: if (entity && 'id' in entity)
          } // Closes: else if (mutationType === 'update' && data)
          
          // Delete operations don't need special handling in this manual update block,
          // as the optimistic removal in onMutate is sufficient.
          
          return { ...oldData, nodes, edges };
        });
        } // End of conditional manual cache update
        
        // STEP 5/7: Only invalidate if delta was not successfully applied
        // Skip invalidation for successful UPDATE, CREATE, and DELETE deltas to avoid redundant network calls
        const shouldInvalidate = (mutationType !== 'update' && mutationType !== 'create' && mutationType !== 'delete') || !deltaAppliedSuccessfully;
        
        let invalidationDuration = 0;
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
            deltaWasApplied: deltaAppliedSuccessfully,
            invalidationSkipped: deltaAppliedSuccessfully,
            timings: deltaAppliedSuccessfully ? {
              deltaDurationMs: deltaDuration.toFixed(2),
              invalidationDurationMs: '0.00 (skipped)',
              totalDurationMs: deltaDuration.toFixed(2)
            } : {
              deltaDurationMs: 'N/A',
              invalidationDurationMs: invalidationDuration.toFixed(2),
              totalDurationMs: invalidationDuration.toFixed(2)
            },
            networkSavings: deltaAppliedSuccessfully ? 
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

/**
 * Batch mutation for updating multiple entities
 * 
 * @param entityType - Type of entities to update
 * @param options - Configuration options
 * @param options.allowPartialSuccess - If true, uses Promise.allSettled for independent updates.
 *                                       If false (default), uses Promise.all for atomic updates.
 * 
 * @example
 * // Atomic updates (fail together)
 * const mutation = useBatchEntityMutation('characters');
 * 
 * // Independent updates (partial success allowed)  
 * const mutation = useBatchEntityMutation('characters', { allowPartialSuccess: true });
 */
export function useBatchEntityMutation<T extends Entity>(
  entityType: EntityType,
  options?: { allowPartialSuccess?: boolean }
) {
  const queryClient = useQueryClient();
  const allowPartial = options?.allowPartialSuccess ?? false;
  
  return useMutation<
    T[] | { successful: T[]; failed: Array<{ update: Partial<T>; error: Error }> },
    MutationError,
    (Partial<T> & ParentRelationMetadata)[]
  >({
    mutationFn: async (updates: (Partial<T> & ParentRelationMetadata)[]) => {
      const apiModule = getApiModule(entityType);
      
      // Validate all updates have IDs
      updates.forEach(update => {
        if (!update.id) throw new Error('ID required for batch update');
      });

      if (allowPartial) {
        // Independent updates - use allSettled for partial success
        const results = await Promise.allSettled(
          updates.map(update => {
            // Extract version for If-Match header (same as individual mutations)
            const version = (update as any).lastEdited || (update as any).version;
            const updateData = { ...update };
            delete updateData.id;
            delete (updateData as any).version;
            delete (updateData as any).lastEdited;
            
            const headers = version !== undefined 
              ? { 'If-Match': `"${version}"` }
              : undefined;
              
            return apiModule.update(update.id!, updateData, headers)
              .then(result => ({ update, result }))
              .catch(error => Promise.reject({ update, error }));
          })
        );
        
        const successful: T[] = [];
        const failed: Array<{ update: Partial<T>; error: Error }> = [];
        
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            successful.push(result.value.result as T);
          } else {
            failed.push({
              update: result.reason.update,
              error: result.reason.error
            });
          }
        });
        
        return { successful, failed };
      } else {
        // Atomic updates - use Promise.all (current behavior)
        const results = await Promise.all(
          updates.map(update => {
            // Extract version for If-Match header (same as individual mutations)
            const version = (update as any).lastEdited || (update as any).version;
            const updateData = { ...update };
            delete updateData.id;
            delete (updateData as any).version;
            delete (updateData as any).lastEdited;
            
            const headers = version !== undefined 
              ? { 'If-Match': `"${version}"` }
              : undefined;
              
            return apiModule.update(update.id!, updateData, headers);
          })
        );
        return results as T[];
      }
    },
    
    onSuccess: async (response) => {
      // Invalidate graph cache after any successful updates
      await queryClient.invalidateQueries({ 
        queryKey: ['graph'] 
      });
      
      // Provide appropriate feedback based on mode
      if (allowPartial && typeof response === 'object' && 'successful' in response) {
        const { successful, failed } = response;
        if (successful.length > 0) {
          toast.success(`Updated ${successful.length} entities`);
        }
        if (failed.length > 0) {
          toast.error(`Failed to update ${failed.length} entities. Check console for details.`);
          // Log details for debugging
          console.error('Batch update failures:', failed.map(f => ({
            id: f.update.id,
            error: f.error.message
          })));
        }
      } else {
        // Atomic mode - all succeeded
        const entities = response as T[];
        toast.success(`Updated ${entities.length} entities`);
      }
    },
    
    onError: async (error) => {
      // In atomic mode, all updates failed
      toast.error('Batch update failed. No changes were saved.');
      console.error('Batch update error:', error);
    }
  });
}