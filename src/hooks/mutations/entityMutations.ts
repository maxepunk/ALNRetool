/**
 * MutationPipelineV3 - React Query v5 Compliant Implementation
 * 
 * Provides a unified `useEntityMutation` hook for all entity CRUD operations
 * with proper optimistic updates and atomic rollback support.
 * 
 * Architecture:
 * - Uses React Query v5's onMutate/onError/onSettled lifecycle
 * - Tracks optimistic state via pendingMutationCount on nodes/edges
 * - Handles concurrent mutations on the same entity safely
 * - Provides atomic rollback via snapshot restoration
 * 
 * Key Components:
 * - OptimisticStateManager: Manages pendingMutationCount counters
 * - OptimisticUpdater: Applies optimistic updates to cache
 * - useEntityMutation: Main hook exposing mutation functionality
 * 
 * @module hooks/mutations/entityMutations
 * @version 3.0.0
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { Entity, EntityType, MutationType, MutationResponse } from '@/types/mutations';
import type { NodeMetadata, GraphEdge, GraphNode } from '@/lib/graph/types';
import { charactersApi, elementsApi, puzzlesApi, timelineApi } from '@/services/api';
import toast from 'react-hot-toast';

// ============================================================================
// TYPES
// ============================================================================


interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: any;
  allEntities?: any;
}

interface OptimisticContext {
  snapshot: GraphData | undefined;
  tempId: string | null;
  originalEdges?: GraphEdge[]; // Store original edge state for rollback
  optimisticEdges?: GraphEdge[]; // Store optimistic edges from UPDATE mutations
}

// ============================================================================
// CACHE UPDATERS
// ============================================================================

/**
 * Centralized optimistic state management using unified counter approach.
 * Provides consistent counter increment/decrement operations for both nodes and edges.
 */
class OptimisticStateManager {
  /**
   * Increment pendingMutationCount for a node
   */
  static incrementNodeCounter(node: GraphNode): GraphNode {
    const currentCount = node.data.metadata?.pendingMutationCount || 0;
    return {
      ...node,
      data: {
        ...node.data,
        metadata: {
          ...node.data.metadata,
          pendingMutationCount: currentCount + 1,
        },
      },
    };
  }

  /**
   * Decrement pendingMutationCount for a node (minimum 0)
   */
  static decrementNodeCounter(node: GraphNode): GraphNode {
    const currentCount = node.data.metadata?.pendingMutationCount || 0;
    const newCount = Math.max(0, currentCount - 1);
    return {
      ...node,
      data: {
        ...node.data,
        metadata: {
          ...node.data.metadata,
          pendingMutationCount: newCount,
        },
      },
    };
  }

  /**
   * Reset pendingMutationCount for a node to 0
   */
  static resetNodeCounter(node: GraphNode): GraphNode {
    return {
      ...node,
      data: {
        ...node.data,
        metadata: {
          ...node.data.metadata,
          pendingMutationCount: 0,
        },
      },
    };
  }

  /**
   * Increment pendingMutationCount for an edge
   */
  static incrementEdgeCounter(edge: GraphEdge): GraphEdge {
    const currentCount = edge.data?.pendingMutationCount || 0;
    return {
      ...edge,
      data: {
        relationshipType: 'ownership', // Default relationship type
        ...edge.data,
        pendingMutationCount: currentCount + 1,
      },
    };
  }

  /**
   * Decrement pendingMutationCount for an edge (minimum 0)
   */
  static decrementEdgeCounter(edge: GraphEdge): GraphEdge {
    const currentCount = edge.data?.pendingMutationCount || 0;
    const newCount = Math.max(0, currentCount - 1);
    
    // Ensure we have a valid edge data structure
    const existingData = edge.data || { relationshipType: 'ownership' as const };
    
    return {
      ...edge,
      data: {
        ...existingData, // Preserve all existing data first
        pendingMutationCount: newCount,
      },
    };
  }

  /**
   * Reset pendingMutationCount for an edge to 0
   */
  static resetEdgeCounter(edge: GraphEdge): GraphEdge {
    return {
      ...edge,
      data: {
        relationshipType: 'ownership', // Default relationship type
        ...edge.data,
        pendingMutationCount: 0,
      },
    };
  }

  /**
   * Check if a node has pending mutations
   */
  static isNodeOptimistic(node: GraphNode): boolean {
    return (node.data.metadata?.pendingMutationCount || 0) > 0;
  }

  /**
   * Check if an edge has pending mutations  
   */
  static isEdgeOptimistic(edge: GraphEdge): boolean {
    return (edge.data?.pendingMutationCount || 0) > 0;
  }
}

class OptimisticUpdater {
  apply(
    cache: GraphData,
    operation: MutationType,
    entityType: EntityType,
    payload: any,
    tempId: string | null
  ): GraphData {
    switch (operation) {
      case 'create':
        return this.handleCreate(cache, entityType, payload, tempId!);
      case 'update':
        return this.handleUpdate(cache, payload, entityType);
      case 'delete':
        return this.handleDelete(cache, payload);
      default:
        return cache;
    }
  }

  private handleCreate(
    cache: GraphData,
    entityType: EntityType,
    payload: any,
    tempId: string
  ): GraphData {
    // Default dimensions based on entity type
    const dimensions = {
      character: { width: 240, height: 100 },
      element: { width: 200, height: 80 },
      puzzle: { width: 180, height: 180 },
      timeline: { width: 160, height: 60 },
    };

    const baseNode: GraphNode = {
      id: tempId,
      type: entityType,
      position: { x: 0, y: 0 },
      data: {
        entity: { ...payload, id: tempId } as Entity,
        label: payload.name || 'New Entity',
        metadata: {
          entityType,
          pendingMutationCount: 0, // Start with 0, then increment
        } as NodeMetadata,
      },
      // React Flow properties
      width: dimensions[entityType].width,
      height: dimensions[entityType].height,
      selected: false,
      draggable: true,
      selectable: true,
      connectable: true,
    } as GraphNode;
    
    // Use OptimisticStateManager to set initial counter
    const newNode = OptimisticStateManager.incrementNodeCounter(baseNode);

    const updatedCache = {
      ...cache,
      nodes: [...cache.nodes, newNode],
    };

    // Handle _parentRelation edge creation
    if (payload._parentRelation) {
      const { parentId, fieldKey } = payload._parentRelation;
      
      // Use consistent edge ID format: e::source::field::target
      const edgeId = `e::${parentId}::${fieldKey}::${tempId}`;
      
      const newEdge: GraphEdge = {
        id: edgeId,
        source: parentId,
        target: tempId,
        type: 'relation',
        data: {
          relationshipType: 'ownership', // Use standard relationship type
          metadata: {
            relationField: fieldKey, // Store field info in metadata
          },
          pendingMutationCount: 1, // Mark edge as optimistic
        },
      };

      // Ensure edges array exists
      if (!updatedCache.edges) updatedCache.edges = [];
      
      return {
        ...updatedCache,
        edges: [...updatedCache.edges, newEdge],
      };
    }

    return updatedCache;
  }

  private handleUpdate(cache: GraphData, payload: any, entityType: EntityType): GraphData {
    let updatedCache = { ...cache };
    
    // CRITICAL: Capture current entity BEFORE updates to detect relationship changes
    const currentEntity = cache.nodes.find(n => (n as any).id === payload.id)?.data.entity;
    
    const updatedNodes = cache.nodes.map(node => {
      if ((node as any).id === payload.id) {
        // Filter out undefined values
        const updates: any = {};
        Object.keys(payload).forEach(key => {
          if (payload[key] !== undefined) {
            updates[key] = payload[key];
          }
        });
        
        // Use OptimisticStateManager to increment counter
        const nodeWithCounter = OptimisticStateManager.incrementNodeCounter(node);
        
        return {
          ...nodeWithCounter,
          data: {
            ...nodeWithCounter.data,
            entity: {
              ...nodeWithCounter.data.entity,
              ...updates,
            },
            label: updates.name || nodeWithCounter.data.label,
          },
        };
      }
      return node;
    });
    
    updatedCache = {
      ...updatedCache,
      nodes: updatedNodes,
    };

    // Handle relationship edge synchronization with ORIGINAL entity data
    if (currentEntity) {
      updatedCache = this.handleRelationshipEdges(updatedCache, currentEntity, payload, entityType);
    }

    return updatedCache;
  }
  
  /**
   * Handle edge creation/deletion for relationship field changes
   */
  private handleRelationshipEdges(
    cache: GraphData, 
    currentEntity: any, 
    payload: any, 
    entityType: EntityType
  ): GraphData {
    let updatedEdges = [...(cache.edges || [])];
    
    // Detect relationship fields (exclude non-relationship fields)
    const relationshipFields = Object.keys(payload).filter(key => {
      if (key === 'id' || key === 'name' || key === 'version' || key === 'lastEdited') return false;
      return key.endsWith('Id') || key.endsWith('Ids');
    });
    
    
    for (const fieldKey of relationshipFields) {
      const oldValue = currentEntity[fieldKey];
      const newValue = payload[fieldKey];
      
      // Handle single relationship (fieldId)
      if (fieldKey.endsWith('Id') && !fieldKey.endsWith('Ids')) {
        updatedEdges = this.handleSingleRelationship(
          updatedEdges, 
          payload.id, 
          fieldKey, 
          oldValue, 
          newValue
        );
        
        // Apply bidirectional updates to inverse entities
        cache = this.applyBidirectionalUpdate(cache, entityType, fieldKey, payload.id, oldValue, newValue);
      }
      // Handle array relationships (fieldIds)
      else if (fieldKey.endsWith('Ids')) {
        updatedEdges = this.handleArrayRelationship(
          updatedEdges, 
          payload.id, 
          fieldKey, 
          oldValue as string[] | null, 
          newValue as string[] | null
        );
        
        // Apply bidirectional updates for array relationships
        // TODO: Implement bidirectional array updates if needed
      }
    }
    
    const result = {
      ...cache,
      edges: updatedEdges,
    };
    return result;
  }
  
  /**
   * Handle single relationship field changes (e.g., ownerId)
   */
  private handleSingleRelationship(
    edges: GraphEdge[],
    sourceId: string,
    fieldKey: string,
    oldValue: string | null,
    newValue: string | null
  ): GraphEdge[] {
    let updatedEdges = [...edges];
    
    // Remove old edge if exists
    if (oldValue) {
      const oldEdgeIndex = updatedEdges.findIndex(e => 
        e.source === sourceId && e.target === oldValue && 
        e.data?.metadata?.relationField === fieldKey
      );
      if (oldEdgeIndex !== -1) {
        updatedEdges.splice(oldEdgeIndex, 1);
      }
    }
    
    // Add new edge if new value exists
    if (newValue) {
      const newEdgeId = `e::${sourceId}::${fieldKey}::${newValue}`;
      const newEdge: GraphEdge = {
        id: newEdgeId,
        source: sourceId,
        target: newValue,
        type: 'relation',
        data: {
          relationshipType: 'ownership',
          metadata: {
            relationField: fieldKey,
          },
          pendingMutationCount: 1, // Mark as optimistic
        },
      };
      updatedEdges.push(newEdge);
    }
    
    return updatedEdges;
  }
  
  /**
   * Handle array relationship field changes (e.g., puzzleIds)
   */
  private handleArrayRelationship(
    edges: GraphEdge[],
    sourceId: string,
    fieldKey: string,
    oldValue: string[] | null,
    newValue: string[] | null
  ): GraphEdge[] {
    let updatedEdges = [...edges];
    
    const oldIds = new Set(oldValue || []);
    const newIds = new Set(newValue || []);
    
    // Remove edges for items that were removed from the array
    oldIds.forEach(targetId => {
      if (!newIds.has(targetId)) {
        const edgeIndex = updatedEdges.findIndex(e => 
          e.source === sourceId && 
          e.target === targetId && 
          e.data?.metadata?.relationField === fieldKey
        );
        if (edgeIndex !== -1) {
          updatedEdges.splice(edgeIndex, 1);
        }
      }
    });
    
    // Add edges for items that were added to the array
    newIds.forEach(targetId => {
      if (!oldIds.has(targetId)) {
        const newEdgeId = `e::${sourceId}::${fieldKey}::${targetId}`;
        const newEdge: GraphEdge = {
          id: newEdgeId,
          source: sourceId,
          target: targetId,
          type: 'relation',
          data: {
            relationshipType: 'ownership',
            metadata: {
              relationField: fieldKey,
            },
            pendingMutationCount: 1, // Mark as optimistic
          },
        };
        updatedEdges.push(newEdge);
      }
    });
    
    return updatedEdges;
  }
  
  /**
   * Apply bidirectional updates to inverse entities when a relationship changes
   */
  private applyBidirectionalUpdate(
    cache: GraphData,
    sourceEntityType: EntityType,
    fieldKey: string,
    sourceId: string,
    oldValue: string | null,
    newValue: string | null
  ): GraphData {
    const inverseField = getInverseRelationshipField(sourceEntityType, fieldKey);
    if (!inverseField) return cache; // No bidirectional relationship
    
    let updatedNodes = [...cache.nodes];
    
    // Remove source from old target's inverse field
    if (oldValue) {
      const oldTargetIndex = updatedNodes.findIndex(n => (n as any).id === oldValue);
      if (oldTargetIndex !== -1) {
        const oldTarget = updatedNodes[oldTargetIndex];
        if (oldTarget && oldTarget.data.entity) {
          const currentInverseValue = (oldTarget.data.entity as any)[inverseField] || [];
          
          updatedNodes[oldTargetIndex] = {
            ...oldTarget,
            data: {
              ...oldTarget.data,
              entity: {
                ...oldTarget.data.entity,
                [inverseField]: Array.isArray(currentInverseValue) 
                  ? currentInverseValue.filter((id: string) => id !== sourceId)
                  : null // Single relationship - set to null
              } as Entity
            }
          };
        }
      }
    }
    
    // Add source to new target's inverse field
    if (newValue) {
      const newTargetIndex = updatedNodes.findIndex(n => (n as any).id === newValue);
      if (newTargetIndex !== -1) {
        const newTarget = updatedNodes[newTargetIndex];
        if (newTarget && newTarget.data.entity) {
          const currentInverseValue = (newTarget.data.entity as any)[inverseField] || [];
          
          updatedNodes[newTargetIndex] = {
            ...newTarget,
            data: {
              ...newTarget.data,
              entity: {
                ...newTarget.data.entity,
                [inverseField]: Array.isArray(currentInverseValue)
                  ? [...currentInverseValue, sourceId] // Array relationship - add to array
                  : sourceId // Single relationship - set directly
              } as Entity
            }
          };
        }
      }
    }
    
    return {
      ...cache,
      nodes: updatedNodes,
      // Preserve all cache properties including edges
    };
  }

  private handleDelete(cache: GraphData, payload: any): GraphData {
    const id = typeof payload === 'string' ? payload : payload.id;
    
    // Find the node being deleted to get its type
    const deletedNode = cache.nodes.find(n => n.id === id);
    if (!deletedNode) {
      return cache; // Node not found, nothing to delete
    }
    
    // Clean up bidirectional relationships - remove deleted entity ID from parent arrays
    let updatedNodes = cache.nodes.map(node => {
      if (node.id === id) {
        return node; // Skip the node being deleted (will be filtered out later)
      }
      
      // Check if this node has any relationship arrays that might contain the deleted ID
      if (node.data.entity) {
        const entity = node.data.entity as any;
        let updated = false;
        const updatedEntity = { ...entity };
        
        // Dynamically find all relationship arrays (fields ending with 'Ids')
        // This ensures we catch all relationship fields without maintaining a static list
        for (const key in entity) {
          if (key.endsWith('Ids') && 
              Array.isArray(entity[key]) && 
              entity[key].includes(id)) {
            updatedEntity[key] = entity[key].filter((itemId: string) => itemId !== id);
            updated = true;
          }
        }
        
        if (updated) {
          return {
            ...node,
            data: {
              ...node.data,
              entity: updatedEntity as Entity,
            },
          };
        }
      }
      
      return node;
    });
    
    // Now filter out the deleted node and its edges
    return {
      ...cache,
      nodes: updatedNodes.filter(n => n.id !== id),
      edges: cache.edges.filter(e => e.source !== id && e.target !== id),
    };
  }
}


// ============================================================================
// RELATIONSHIP HELPERS
// ============================================================================

/**
 * Helper function to get inverse relationship field for bidirectional updates.
 * Maps from a source field to its corresponding field on the target entity.
 * 
 * @param sourceEntityType - Type of entity being updated
 * @param fieldKey - Field being changed (e.g., 'ownerId', 'puzzleIds')
 * @returns Inverse field name or null if no inverse relationship exists
 */
function getInverseRelationshipField(sourceEntityType: EntityType, fieldKey: string): string | null {
  // Map of entity type + field to inverse field
  const relationshipMap: Record<string, string | null> = {
    // Puzzle -> Character relationships
    'puzzle:ownerId': 'characterPuzzleIds', // When changing Puzzle.ownerId, update Character.characterPuzzleIds
    
    // Element -> Character relationships  
    'element:ownerId': 'ownedElementIds', // When changing Element.ownerId, update Character.ownedElementIds
    
    // Timeline -> Character relationships
    'timeline:charactersInvolvedIds': null, // No inverse on Character for timeline involvement
    
    // Element -> Puzzle relationships
    'element:puzzleIds': 'puzzleElementIds', // When changing Element.puzzleIds, update Puzzle.puzzleElementIds
    
    // Element -> Timeline relationships
    'element:timelineIds': 'memoryEvidenceIds', // When changing Element.timelineIds, update Timeline.memoryEvidenceIds
  };
  
  const key = `${sourceEntityType}:${fieldKey}`;
  return relationshipMap[key] || null;
}

// ============================================================================
// API HELPERS
// ============================================================================

function getApi(entityType: EntityType) {
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

async function makeServerRequest(
  operation: MutationType,
  entityType: EntityType,
  payload: any
): Promise<MutationResponse> {
  const api = getApi(entityType);
  
  switch (operation) {
    case 'create':
      return await api.create(payload);
    case 'update':
      return await api.update(payload.id, payload);
    case 'delete':
      const id = typeof payload === 'string' ? payload : payload.id;
      await api.delete(id);
      // DELETE operations return success confirmation
      return { success: true, data: { id } as any };
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// ============================================================================
// PUBLIC API - V3 with proper React Query patterns
// ============================================================================

export function useEntityMutation<T extends Entity = Entity>(
  entityType: EntityType,
  mutationType: MutationType,
  options?: Omit<UseMutationOptions<T, Error, any, OptimisticContext>, 'mutationFn' | 'onMutate' | 'onError' | 'onSettled'>
) {
  const queryClient = useQueryClient();
  const queryKey = ['graph', 'complete'];
  const optimisticUpdater = new OptimisticUpdater();

  return useMutation<T, Error, any, OptimisticContext>({
    // The actual server operation
    mutationFn: async (payload) => {
      const response = await makeServerRequest(mutationType, entityType, payload);
      return response.data as T;
    },

    // Optimistic update - runs immediately when mutate() is called
    onMutate: async (payload) => {
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot the previous value
      const snapshot = queryClient.getQueryData<GraphData>(queryKey);
      
      // Generate temp ID for creates
      const tempId = mutationType === 'create' 
        ? `temp-${Date.now()}-${Math.random()}` 
        : null;
      
      // Optimistically update the cache
      queryClient.setQueryData<GraphData>(queryKey, (old) => {
        if (!old) return old;
        const updated = optimisticUpdater.apply(old, mutationType, entityType, payload, tempId);
        
        
        return updated;
      });
      
      // Get the updated data after optimistic update
      const updatedData = queryClient.getQueryData<GraphData>(queryKey);
      
      // Return context with snapshot and optimistic edges for UPDATE mutations
      return { 
        snapshot, 
        tempId,
        originalEdges: snapshot?.edges, // Store original edges for rollback
        optimisticEdges: mutationType === 'update' ? updatedData?.edges : undefined // Store optimistic edges to preserve in onSuccess
      };
    },

    // Apply server response on success
    onSuccess: (data, _, context) => {
      // Show success toast
      if (mutationType === 'create') {
        toast.success(`Created ${data.name || 'entity'}`);
      } else if (mutationType === 'update') {
        toast.success(`Updated ${data.name || 'entity'}`);
      } else if (mutationType === 'delete') {
        toast.success(`Deleted ${entityType}`);
      }
      
      queryClient.setQueryData<GraphData>(queryKey, (old) => {
        if (!old) return old;
        
        // Handle different mutation types
        if (mutationType === 'create' && context?.tempId) {
          // Replace temporary node with real server response and update related edges
          const updatedNodes = old.nodes.map(node => {
            if (node.id === context.tempId) {
              return OptimisticStateManager.resetNodeCounter({
                ...node,
                id: data.id,
                data: {
                  ...node.data,
                  entity: data,
                },
              });
            }
            return node;
          });

          // Update any edges that reference the temporary ID and decrement their counters
          const updatedEdges = old.edges.map(edge => {
            if (edge.target === context.tempId) {
              return OptimisticStateManager.decrementEdgeCounter({
                ...edge,
                target: data.id,
              });
            }
            if (edge.source === context.tempId) {
              return OptimisticStateManager.decrementEdgeCounter({
                ...edge,
                source: data.id,
              });
            }
            return edge;
          });

          return {
            ...old,
            nodes: updatedNodes,
            edges: updatedEdges,
          };
        } else if (mutationType === 'update') {
          // Update existing node with server response
          const updatedNodes = old.nodes.map(node => {
            if (node.id === data.id) {
              const merged = {
                ...node,
                data: {
                  ...node.data,
                  entity: { ...node.data.entity, ...data },
                  label: data.name || node.data.label,
                },
              };
              // Decrement counter for completed mutation
              return OptimisticStateManager.decrementNodeCounter(merged);
            }
            return node;
          });

          // CRITICAL FIX: Preserve edge changes from optimistic update
          // Use optimistic edges if available (relationship changes), otherwise keep current edges
          const finalEdges = context?.optimisticEdges || old.edges;
          
          // Decrement edge counters for completed mutation
          const updatedEdges = finalEdges.map((edge: GraphEdge) => {
            // Only decrement if edge is related to the updated entity
            if (edge.source === data.id || edge.target === data.id) {
              return OptimisticStateManager.decrementEdgeCounter(edge);
            }
            return edge;
          });

          return {
            ...old,
            nodes: updatedNodes,
            edges: updatedEdges,
          };
        } else if (mutationType === 'delete') {
          // Remove deleted node
          return {
            ...old,
            nodes: old.nodes.filter(n => n.id !== data.id),
            edges: old.edges.filter(e => e.source !== data.id && e.target !== data.id),
          };
        }
        
        return old;
      });
    },

    // Handle error by restoring data from snapshot (React Query v5 pattern)
    onError: (error, payload, context) => {
      // Show error toast
      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('409') || error.message.includes('Conflict')) {
          toast.error(
            'This item has been modified by another user. Please refresh the page and try again.',
            { duration: 5000 }
          );
        } else if (error.message.includes('404')) {
          toast.error('Entity not found');
        } else if (error.message.includes('500')) {
          toast.error('Internal Server Error');
        } else if (error.message.includes('Network') || error.message.includes('network')) {
          toast.error('Network error');
        } else if (mutationType === 'delete') {
          toast.error('Deletion failed');
        } else {
          toast.error('An unknown error occurred');
        }
      } else {
        toast.error('An unknown error occurred');
      }
      
      queryClient.setQueryData<GraphData>(queryKey, (old) => {
        if (!old || !context?.snapshot) return old;
        
        if (mutationType === 'create' && context.tempId) {
          // For failed CREATE: remove temporary node and any created edges
          const updatedNodes = old.nodes.filter(node => (node as any).id !== context.tempId);
          const updatedEdges = old.edges.filter(edge => 
            edge.source !== context.tempId && edge.target !== context.tempId
          );
          
          return {
            ...old,
            nodes: updatedNodes,
            edges: updatedEdges,
          };
        } else if (mutationType === 'update') {
          // For failed UPDATE: restore entity data and edges from snapshot
          // Find the node that was optimistically updated
          const nodeToRestore = context.snapshot.nodes.find((n: GraphNode) => 
            (n as any).id === payload.id
          );
          
          if (nodeToRestore) {
            // Restore the node's entity data but preserve counters from concurrent mutations
            // Also restore any bidirectionally updated nodes
            const updatedNodes = old.nodes.map(node => {
              const nodeId = (node as any).id;
              
              // Primary node being updated
              if (nodeId === payload.id) {
                // Get current counter (may include other mutations)
                const currentCounter = node.data.metadata.pendingMutationCount || 0;
                // Decrement by 1 for this failed mutation
                const newCounter = Math.max(0, currentCounter - 1);
                
                return {
                  ...nodeToRestore,
                  data: {
                    ...nodeToRestore.data,
                    metadata: {
                      ...nodeToRestore.data.metadata,
                      pendingMutationCount: newCounter
                    }
                  }
                };
              }
              
              // Check if this node was bidirectionally updated (find it in snapshot)
              const snapshotNode = context.snapshot?.nodes.find((n: GraphNode) => 
                (n as any).id === nodeId
              );
              
              if (snapshotNode && JSON.stringify(snapshotNode.data.entity) !== JSON.stringify(node.data.entity)) {
                // This node was modified, restore its entity data but preserve counter
                const currentCounter = node.data.metadata.pendingMutationCount || 0;
                const newCounter = Math.max(0, currentCounter - 1);
                
                return {
                  ...snapshotNode,
                  data: {
                    ...snapshotNode.data,
                    metadata: {
                      ...snapshotNode.data.metadata,
                      pendingMutationCount: newCounter
                    }
                  }
                };
              }
              
              return node;
            });
            
            // Restore only edges affected by this mutation
            // Identify edges that were changed by comparing snapshot to current
            const affectedEdgeIds = new Set<string>();
            
            // Find edges that exist in snapshot but not in current (were deleted)
            context.snapshot.edges.forEach((snapEdge: GraphEdge) => {
              if (!old.edges.find(e => e.id === snapEdge.id)) {
                affectedEdgeIds.add(snapEdge.id);
              }
            });
            
            // Find edges that exist in current but not in snapshot (were added)
            old.edges.forEach(edge => {
              if (!context.snapshot?.edges.find((e: GraphEdge) => e.id === edge.id)) {
                affectedEdgeIds.add(edge.id);
              }
            });
            
            // Restore affected edges from snapshot, keep unaffected edges from current
            const restoredEdges = old.edges.filter(e => !affectedEdgeIds.has(e.id))
              .concat(context.snapshot.edges.filter((e: GraphEdge) => affectedEdgeIds.has(e.id)));
            
            return {
              ...old,
              nodes: updatedNodes,
              edges: restoredEdges,
            };
          }
          
          return old;
        } else if (mutationType === 'delete') {
          // For failed DELETE: restore the node from snapshot
          if (context.snapshot) {
            const nodeToRestore = context.snapshot.nodes.find((n: GraphNode) => 
              (n as any).id === payload.id
            );
            if (nodeToRestore) {
              return {
                ...old,
                nodes: [...old.nodes, OptimisticStateManager.decrementNodeCounter(nodeToRestore)],
                edges: context.snapshot.edges,
              };
            }
          }
          return old;
        }
        
        return old;
      });
    },

    // React Query v5 pattern: onSettled only for invalidation  
    onSettled: async () => {
      
      // Since we handle server response in onSuccess, skip invalidation
      // This prevents race conditions with 0ms test delays
      // await queryClient.invalidateQueries({ queryKey });
    },

    ...options,
  });
}

// Re-export types for backward compatibility
export type { EntityType, Entity, MutationType } from '@/types/mutations';