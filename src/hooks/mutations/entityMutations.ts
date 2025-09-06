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
import { v4 as uuidv4 } from 'uuid';

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
  mutationId: string; // Unique identifier for this mutation
  touchedEdgeIds: Set<string>; // Track which edges this mutation created/modified
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
   * Add a mutation ID to node's tracking list
   */
  static addNodeMutationId(node: GraphNode, mutationId?: string): GraphNode {
    if (!mutationId) {
      // Fallback to simple increment for backward compatibility
      return this.incrementNodeCounter(node);
    }
    
    const currentIds = node.data.metadata?.pendingMutationIds || [];
    const idSet = new Set(currentIds);
    idSet.add(mutationId);
    const newIds = Array.from(idSet);
    
    return {
      ...node,
      data: {
        ...node.data,
        metadata: {
          ...node.data.metadata,
          pendingMutationIds: newIds,
          pendingMutationCount: newIds.length,
        },
      },
    };
  }

  /**
   * Remove a mutation ID from node's tracking list
   */
  static removeNodeMutationId(node: GraphNode, mutationId?: string): GraphNode {
    if (!mutationId) {
      // Fallback to simple decrement for backward compatibility
      return this.decrementNodeCounter(node);
    }
    
    const currentIds = node.data.metadata?.pendingMutationIds || [];
    const idSet = new Set(currentIds);
    idSet.delete(mutationId);
    const newIds = Array.from(idSet);
    
    return {
      ...node,
      data: {
        ...node.data,
        metadata: {
          ...node.data.metadata,
          pendingMutationIds: newIds,
          pendingMutationCount: newIds.length,
        },
      },
    };
  }

  /**
   * Increment pendingMutationCount for a node (legacy method, kept for compatibility)
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
   * Decrement pendingMutationCount for a node (legacy method, kept for compatibility)
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
   * Add a mutation ID to edge's tracking list
   */
  static addEdgeMutationId(edge: GraphEdge, mutationId?: string): GraphEdge {
    if (!mutationId) {
      // Fallback to simple increment for backward compatibility
      return this.incrementEdgeCounter(edge);
    }
    
    const existingData = edge.data || { relationshipType: 'ownership' as const };
    const currentIds = existingData.pendingMutationIds || [];
    const idSet = new Set(currentIds);
    idSet.add(mutationId);
    const newIds = Array.from(idSet);
    
    return {
      ...edge,
      data: {
        ...existingData,
        pendingMutationIds: newIds,
        pendingMutationCount: newIds.length,
      },
    };
  }

  /**
   * Remove a mutation ID from edge's tracking list
   */
  static removeEdgeMutationId(edge: GraphEdge, mutationId?: string): GraphEdge {
    if (!mutationId) {
      // Fallback to simple decrement for backward compatibility
      return this.decrementEdgeCounter(edge);
    }
    
    const existingData = edge.data || { relationshipType: 'ownership' as const };
    const currentIds = existingData.pendingMutationIds || [];
    const idSet = new Set(currentIds);
    idSet.delete(mutationId);
    const newIds = Array.from(idSet);
    
    return {
      ...edge,
      data: {
        ...existingData,
        pendingMutationIds: newIds,
        pendingMutationCount: newIds.length,
      },
    };
  }

  /**
   * Increment pendingMutationCount for an edge (legacy method, kept for compatibility)
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
   * Decrement pendingMutationCount for an edge (legacy method, kept for compatibility)
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
    tempId: string | null,
    touchedEdgeIds?: Set<string>,
    mutationId?: string
  ): GraphData {
    switch (operation) {
      case 'create':
        return this.handleCreate(cache, entityType, payload, tempId!, touchedEdgeIds, mutationId);
      case 'update':
        return this.handleUpdate(cache, payload, entityType, touchedEdgeIds, mutationId);
      case 'delete':
        return this.handleDelete(cache, payload, touchedEdgeIds, mutationId);
      default:
        return cache;
    }
  }

  private handleCreate(
    cache: GraphData,
    entityType: EntityType,
    payload: any,
    tempId: string,
    touchedEdgeIds?: Set<string>,
    mutationId?: string
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
    
    // Use OptimisticStateManager to track this mutation
    const newNode = OptimisticStateManager.addNodeMutationId(baseNode, mutationId);

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

      // Track this edge as touched by this mutation
      if (touchedEdgeIds) {
        touchedEdgeIds.add(edgeId);
      }

      // Ensure edges array exists
      if (!updatedCache.edges) updatedCache.edges = [];
      
      return {
        ...updatedCache,
        edges: [...updatedCache.edges, newEdge],
      };
    }

    return updatedCache;
  }

  private handleUpdate(cache: GraphData, payload: any, entityType: EntityType, touchedEdgeIds?: Set<string>, mutationId?: string): GraphData {
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
        
        // Use OptimisticStateManager to track this mutation
        const nodeWithCounter = OptimisticStateManager.addNodeMutationId(node, mutationId);
        
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
      updatedCache = this.handleRelationshipEdges(updatedCache, currentEntity, payload, entityType, touchedEdgeIds);
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
    entityType: EntityType,
    touchedEdgeIds?: Set<string>
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
          newValue,
          touchedEdgeIds
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
          newValue as string[] | null,
          touchedEdgeIds
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
    newValue: string | null,
    touchedEdgeIds?: Set<string>
  ): GraphEdge[] {
    let updatedEdges = [...edges];
    
    // Remove old edge if exists
    if (oldValue) {
      const oldEdgeIndex = updatedEdges.findIndex(e => 
        e.source === sourceId && e.target === oldValue && 
        e.data?.metadata?.relationField === fieldKey
      );
      if (oldEdgeIndex !== -1) {
        const removedEdge = updatedEdges[oldEdgeIndex];
        // Track the removed edge
        if (touchedEdgeIds && removedEdge?.id) {
          touchedEdgeIds.add(removedEdge.id);
        }
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
      // Track the new edge
      if (touchedEdgeIds) {
        touchedEdgeIds.add(newEdgeId);
      }
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
    newValue: string[] | null,
    touchedEdgeIds?: Set<string>
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
          const removedEdge = updatedEdges[edgeIndex];
          // Track the removed edge
          if (touchedEdgeIds && removedEdge?.id) {
            touchedEdgeIds.add(removedEdge.id);
          }
          updatedEdges.splice(edgeIndex, 1);
        }
      }
    });
    
    // Add edges for items that were added to the array
    newIds.forEach(targetId => {
      if (!oldIds.has(targetId)) {
        const newEdgeId = `e::${sourceId}::${fieldKey}::${targetId}`;
        // Track the new edge
        if (touchedEdgeIds) {
          touchedEdgeIds.add(newEdgeId);
        }
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

  private handleDelete(cache: GraphData, payload: any, touchedEdgeIds?: Set<string>, _mutationId?: string): GraphData {
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
    
    // Track edges that will be removed
    if (touchedEdgeIds) {
      cache.edges.forEach(edge => {
        if (edge.source === id || edge.target === id) {
          touchedEdgeIds.add(edge.id);
        }
      });
    }
    
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
 * Maps relationship fields to their inverse counterparts for optimistic updates.
 * The server also handles these, but we need them for immediate UI feedback.
 */
function getInverseRelationshipField(sourceEntityType: EntityType, fieldKey: string): string | null {
  // Create a key combining entity type and field for lookup
  const lookupKey = `${sourceEntityType}:${fieldKey}`;
  
  // Mapping of source field to inverse field based on actual Notion schema
  const inverseFieldMap: Record<string, string> = {
    // Puzzle -> Character (owner relationship)
    'puzzle:ownerId': 'characterPuzzleIds',
    
    // Element -> Character (owner relationship)  
    'element:ownerId': 'ownedElementIds',
    
    // Timeline -> Character (characters involved)
    'timeline:charactersInvolvedIds': 'eventIds',
    
    // Element -> Puzzle relationships
    'element:requiredForPuzzleIds': 'puzzleElementIds',
    'element:rewardedByPuzzleIds': 'rewardIds',
    
    // Element -> Element (container relationships)
    'element:containerId': 'contentIds',
    'element:contentIds': 'containerId',
    
    // Puzzle -> Element relationships
    'puzzle:puzzleElementIds': 'requiredForPuzzleIds',
    'puzzle:rewardIds': 'rewardedByPuzzleIds',
    'puzzle:lockedItemId': 'containerPuzzleId',
    
    // Puzzle -> Puzzle (parent/sub relationships)
    'puzzle:parentItemId': 'subPuzzleIds',
    'puzzle:subPuzzleIds': 'parentItemId',
    
    // Character -> Element relationships
    'character:ownedElementIds': 'ownerId',
    
    // Character -> Timeline relationships
    'character:eventIds': 'charactersInvolvedIds',
  };
  
  return inverseFieldMap[lookupKey] || null;
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
      
      // Generate unique mutation ID for tracking
      const mutationId = uuidv4();
      
      // Generate temp ID for creates
      const tempId = mutationType === 'create' 
        ? `temp-${Date.now()}-${Math.random()}` 
        : null;
      
      // Track which edges this mutation creates/modifies
      const touchedEdgeIds = new Set<string>();
      
      // Optimistically update the cache
      queryClient.setQueryData<GraphData>(queryKey, (old) => {
        if (!old) return old;
        const updated = optimisticUpdater.apply(old, mutationType, entityType, payload, tempId, touchedEdgeIds, mutationId);
        
        
        return updated;
      });
      
      // Get the updated data after optimistic update
      const updatedData = queryClient.getQueryData<GraphData>(queryKey);
      
      // Return context with snapshot and optimistic edges for UPDATE mutations
      return { 
        snapshot, 
        tempId,
        originalEdges: snapshot?.edges, // Store original edges for rollback
        optimisticEdges: mutationType === 'update' ? updatedData?.edges : undefined, // Store optimistic edges to preserve in onSuccess
        mutationId,
        touchedEdgeIds
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
          // Only touch edges that this mutation created
          const updatedEdges = old.edges.map(edge => {
            // Only update edges touched by this mutation
            if (context?.touchedEdgeIds?.has(edge.id)) {
              // Update temp IDs to real IDs
              let updatedEdge = { ...edge };
              if (edge.target === context.tempId) {
                updatedEdge.target = data.id;
              }
              if (edge.source === context.tempId) {
                updatedEdge.source = data.id;
              }
              // Remove mutation ID for this edge
              return OptimisticStateManager.removeEdgeMutationId(updatedEdge, context.mutationId);
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
              // Remove mutation ID for completed mutation
              return OptimisticStateManager.removeNodeMutationId(merged, context?.mutationId);
            }
            return node;
          });

          // CRITICAL FIX: Only decrement edges touched by THIS mutation
          // This prevents race conditions when multiple mutations are in flight
          const updatedEdges = old.edges.map((edge: GraphEdge) => {
            // Only decrement if this mutation touched this specific edge
            if (context?.touchedEdgeIds?.has(edge.id)) {
              return OptimisticStateManager.removeEdgeMutationId(edge, context?.mutationId);
            }
            return edge;
          });

          return {
            ...old,
            nodes: updatedNodes,
            edges: updatedEdges,
          };
        } else if (mutationType === 'delete') {
          // Remove deleted node and decrement counters on touched edges
          const updatedEdges = old.edges.map((edge: GraphEdge) => {
            // Decrement counter if this mutation touched this edge
            if (context?.touchedEdgeIds?.has(edge.id)) {
              return OptimisticStateManager.removeEdgeMutationId(edge, context?.mutationId);
            }
            return edge;
          });
          
          return {
            ...old,
            nodes: old.nodes.filter(n => n.id !== data.id),
            edges: updatedEdges.filter(e => e.source !== data.id && e.target !== data.id),
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
          // Must handle bidirectional updates by restoring ALL affected nodes
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
                // Remove this mutation's ID from the tracking list
                const currentIds = node.data.metadata?.pendingMutationIds || [];
                const idSet = new Set(currentIds);
                if (context?.mutationId) {
                  idSet.delete(context.mutationId);
                }
                const newIds = Array.from(idSet);
                
                // Only restore the fields that THIS mutation changed
                // Keep changes from other concurrent mutations
                const restoredEntity = { ...node.data.entity };
                
                // Restore only the fields that were in the failed mutation's payload
                Object.keys(payload).forEach(key => {
                  if (key !== 'id' && nodeToRestore.data.entity[key] !== undefined) {
                    restoredEntity[key] = nodeToRestore.data.entity[key];
                  }
                });
                
                return {
                  ...node,
                  data: {
                    ...node.data,
                    entity: restoredEntity,
                    metadata: {
                      ...node.data.metadata,
                      pendingMutationIds: newIds,
                      pendingMutationCount: newIds.length
                    }
                  }
                };
              }
              
              // Check if this node was bidirectionally updated (find it in snapshot)
              const snapshotNode = context.snapshot?.nodes.find((n: GraphNode) => 
                (n as any).id === nodeId
              );
              
              if (snapshotNode && JSON.stringify(snapshotNode.data.entity) !== JSON.stringify(node.data.entity)) {
                // This node was modified by bidirectional update, restore it
                const currentIds = node.data.metadata?.pendingMutationIds || [];
                const idSet = new Set(currentIds);
                if (context?.mutationId) {
                  idSet.delete(context.mutationId);
                }
                const newIds = Array.from(idSet);
                
                return {
                  ...snapshotNode,
                  data: {
                    ...snapshotNode.data,
                    metadata: {
                      ...snapshotNode.data.metadata,
                      pendingMutationIds: newIds,
                      pendingMutationCount: newIds.length
                    }
                  }
                };
              }
              
              return node;
            });
            
            // CRITICAL FIX: Only restore edges touched by THIS mutation
            // This ensures concurrent mutations aren't affected by this rollback
            const restoredEdges = old.edges.map(edge => {
              // Only restore edges that this mutation touched
              if (context.touchedEdgeIds?.has(edge.id)) {
                // Find the original edge in snapshot
                const originalEdge = context.snapshot?.edges.find((e: GraphEdge) => e.id === edge.id);
                if (originalEdge) {
                  // Restore the original edge but remove mutation ID
                  const currentIds = edge.data?.pendingMutationIds || [];
                  const idSet = new Set(currentIds);
                  if (context?.mutationId) {
                    idSet.delete(context.mutationId);
                  }
                  const newIds = Array.from(idSet);
                  return {
                    ...originalEdge,
                    data: {
                      ...originalEdge.data,
                      pendingMutationIds: newIds,
                      pendingMutationCount: newIds.length
                    }
                  };
                }
                // If edge was created by this mutation, remove it by returning null
                return null;
              }
              // Keep edges not touched by this mutation unchanged
              return edge;
            }).filter(e => e !== null) as GraphEdge[];
            
            // Add back any edges that were removed by this mutation
            if (context.touchedEdgeIds && context.snapshot) {
              context.snapshot.edges.forEach((snapEdge: GraphEdge) => {
                if (context.touchedEdgeIds.has(snapEdge.id) && !restoredEdges.find(e => e.id === snapEdge.id)) {
                  restoredEdges.push(snapEdge);
                }
              });
            }
            
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
              // Restore edges touched by this mutation
              const restoredEdges = [...old.edges];
              
              // Add back edges that were removed
              if (context.touchedEdgeIds) {
                context.snapshot.edges.forEach((snapEdge: GraphEdge) => {
                  if (context.touchedEdgeIds.has(snapEdge.id) && !restoredEdges.find(e => e.id === snapEdge.id)) {
                    // Remove mutation ID since the deletion failed
                    const updatedEdge = OptimisticStateManager.removeEdgeMutationId(snapEdge, context?.mutationId);
                    restoredEdges.push(updatedEdge);
                  }
                });
              }
              
              return {
                ...old,
                nodes: [...old.nodes, OptimisticStateManager.removeNodeMutationId(nodeToRestore, context?.mutationId)],
                edges: restoredEdges,
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