/**
 * Cache Update Utilities
 * 
 * TECHNICAL DEBT FIX: Centralized cache update logic replacing
 * scattered implementations throughout mutation hooks.
 * Implements strategy pattern for different update approaches.
 */

import type { QueryClient } from '@tanstack/react-query';
import type { GraphNode } from '@/lib/graph/types';
import type { Entity, CacheUpdateStrategy } from '@/types/mutations';
// TODO: Import GraphDelta from server types once client-server types are unified
import type { GraphDelta } from '../../../server/types/delta';
import type { Edge } from '@xyflow/react';

// Graph data shape in cache
export interface CachedGraphData {
  nodes: GraphNode[];
  edges: Edge[];
  metadata?: {
    lastFetch?: number;
    version?: number;
  };
}

// Cache update context
export interface CacheUpdateContext<T extends Entity = Entity> {
  queryClient: QueryClient;
  queryKey: string[];
  strategy: CacheUpdateStrategy;
  entity: T;
  delta?: GraphDelta;
  tempId?: string;
  operation: 'create' | 'update' | 'delete';
  previousState?: CachedGraphData; // For rollback support
}

/**
 * Base cache updater interface
 * All strategies must implement this interface
 */
export interface CacheUpdater {
  update<T extends Entity>(context: CacheUpdateContext<T>): Promise<void>;
  rollback<T extends Entity>(context: CacheUpdateContext<T>): void;
}

/**
 * Invalidation Strategy: Full refetch (legacy approach)
 * Simple but causes loading states and network overhead
 */
export class InvalidateCacheUpdater implements CacheUpdater {
  async update<T extends Entity>(context: CacheUpdateContext<T>): Promise<void> {
    const { queryClient, queryKey } = context;
    
    // Invalidate all graph queries to force refetch
    await queryClient.invalidateQueries({
      queryKey: ['graph'],
      exact: false,
      refetchType: 'active'
    });
    
    // Also invalidate specific entity queries
    const entityType = queryKey[0];
    if (entityType) {
      await queryClient.invalidateQueries({
        queryKey: [entityType],
        exact: false
      });
    }
  }
  
  rollback<T extends Entity>(context: CacheUpdateContext<T>): void {
    // Invalidation doesn't need rollback - just refetch
    this.update(context);
  }
}

/**
 * Optimistic Strategy: Manual cache updates (current approach)
 * Provides instant UI updates but complex to maintain
 */
export class OptimisticCacheUpdater implements CacheUpdater {
  async update<T extends Entity>(context: CacheUpdateContext<T>): Promise<void> {
    const { queryClient, queryKey, entity, operation, tempId } = context;
    
    queryClient.setQueryData(queryKey, (oldData: CachedGraphData | undefined) => {
      if (!oldData) return oldData;
      
      let nodes = [...oldData.nodes];
      let edges = [...oldData.edges];
      
      switch (operation) {
        case 'create':
          // Replace temp node with real entity
          if (tempId) {
            const nodeIndex = nodes.findIndex(n => n.id === tempId);
            if (nodeIndex !== -1 && 'id' in entity && nodes[nodeIndex]) {
              const currentNode = nodes[nodeIndex];
              nodes[nodeIndex] = {
                ...currentNode,
                id: entity.id,
                data: {
                  ...currentNode.data,
                  id: entity.id,
                  entity,
                  metadata: {
                    ...(currentNode.data?.metadata || {})
                    // Remove isOptimistic - not part of NodeMetadata type
                  }
                }
              };
              
              // Update edges to use real ID
              edges = edges.map(edge => {
                if (edge.source === tempId || edge.target === tempId) {
                  return {
                    ...edge,
                    id: edge.id.replace(tempId, entity.id),
                    source: edge.source === tempId ? entity.id : edge.source,
                    target: edge.target === tempId ? entity.id : edge.target,
                    data: {
                      ...edge.data
                      // Remove isOptimistic - not part of edge data type
                    }
                  };
                }
                return edge;
              });
            }
          }
          break;
          
        case 'update':
          // Update existing node
          const updateIndex = nodes.findIndex(n => n.id === entity.id);
          if (updateIndex !== -1 && nodes[updateIndex]) {
            const nodeToUpdate = nodes[updateIndex];
            // OPTIMISTIC FIX: Preserve isOptimistic flag if it exists
            const existingIsOptimistic = nodeToUpdate.data?.metadata?.isOptimistic;
            nodes[updateIndex] = {
              ...nodeToUpdate,
              data: {
                ...nodeToUpdate.data,
                entity,
                metadata: {
                  ...(nodeToUpdate.data?.metadata || {}),
                  // Preserve isOptimistic if it was true
                  ...(existingIsOptimistic ? { isOptimistic: true } : {})
                }
              }
            };
          }
          break;
          
        case 'delete':
          // Already handled optimistically
          break;
      }
      
      return { ...oldData, nodes, edges };
    });
  }
  
  rollback<T extends Entity>(context: CacheUpdateContext<T>): void {
    const { queryClient, queryKey, tempId, operation, previousState } = context;
    
    if (operation === 'create' && tempId) {
      // Remove optimistic node and edges
      queryClient.setQueryData(queryKey, (oldData: CachedGraphData | undefined) => {
        if (!oldData) return oldData;
        
        const nodes = oldData.nodes.filter(n => n.id !== tempId);
        const edges = oldData.edges.filter(e => 
          e.source !== tempId && e.target !== tempId
        );
        
        return { ...oldData, nodes, edges };
      });
    } else if (previousState !== undefined) {
      // For update/delete, restore the previous state
      queryClient.setQueryData(queryKey, previousState);
    } else {
      // Fallback if previous state isn't available
      console.warn('Rollback for update/delete failed: no previous state provided. Falling back to invalidation.');
      const invalidator = new InvalidateCacheUpdater();
      invalidator.update(context);
    }
  }
}

/**
 * Delta Strategy: Apply incremental changes (new approach)
 * Efficient and accurate, minimal network overhead
 */
export class DeltaCacheUpdater implements CacheUpdater {
  async update<T extends Entity>(context: CacheUpdateContext<T>): Promise<void> {
    const { queryClient, queryKey, delta, operation, tempId, entity } = context;
    
    if (!delta) {
      // Fallback to invalidation if no delta available
      console.warn('No delta available, falling back to invalidation');
      const invalidator = new InvalidateCacheUpdater();
      return invalidator.update(context);
    }
    
    queryClient.setQueryData(queryKey, (oldData: CachedGraphData | undefined) => {
      if (!oldData) return oldData;
      
      // CRITICAL: Version check to prevent cache corruption
      // TODO: Uncomment when GraphDelta type includes fromVersion/toVersion
      // const cacheVersion = oldData.metadata?.version ?? 0;
      // if (delta.fromVersion !== undefined && cacheVersion !== delta.fromVersion) {
      //   console.error(
      //     `Cache version mismatch! Cache: v${cacheVersion}, Delta from: v${delta.fromVersion}. ` +
      //     `Cannot apply delta - cache would be corrupted. Returning unchanged cache.`
      //   );
      //   // Return unchanged data to prevent corruption
      //   // The mutation handler should detect this and trigger invalidation
      //   return oldData;
      // }
      
      // WARNING: Delta application on filtered views
      // Check if this is a filtered view based on the query key
      const viewType = queryKey[2]; // ['graph', 'complete', viewType]
      if (viewType && viewType !== 'full-graph') {
        console.warn(
          `Applying delta to filtered view '${viewType}'. ` +
          `This may add nodes that don't match the filter criteria.`
        );
      }
      
      // Create lookup maps for O(1) operations
      const nodeMap = new Map(oldData.nodes.map(n => [n.id, n]));
      const edgeMap = new Map(oldData.edges.map(e => [e.id, e]));
      
      // CRITICAL FIX: Handle temp ID replacement for CREATE operations
      // The server doesn't know about client-side temp IDs, so we must
      // replace them with the real ID from the delta entity
      let preservedOptimisticFlag = false;
      if (operation === 'create' && tempId && entity && 'id' in entity) {
        const realId = entity.id;
        
        // OPTIMISTIC FIX: Preserve the isOptimistic flag from temp node
        const tempNode = nodeMap.get(tempId);
        if (tempNode?.data?.metadata && 'isOptimistic' in tempNode.data.metadata) {
          preservedOptimisticFlag = tempNode.data.metadata.isOptimistic === true;
        }
        
        // Remove the temp node if it exists
        if (nodeMap.has(tempId)) {
          nodeMap.delete(tempId);
          console.log(`[Delta] Replacing temp node ${tempId} with real ID ${realId}`);
        }
        
        // Update all edges that reference the temp ID
        for (const [edgeId, edge] of edgeMap) {
          let updated = false;
          let newEdge = { ...edge };
          
          if (edge.source === tempId) {
            newEdge.source = realId;
            updated = true;
          }
          if (edge.target === tempId) {
            newEdge.target = realId;
            updated = true;
          }
          
          if (updated) {
            // Update edge ID to reflect new node IDs
            // Handle both edge ID formats: simple and field-based
            let newEdgeId = edgeId;
            if (edgeId.includes('::')) {
              // Format: e::source::fieldKey::target
              const parts = edgeId.split('::');
              if (parts.length === 4 && parts[1] && parts[3]) {
                parts[1] = parts[1] === tempId ? realId : parts[1];
                parts[3] = parts[3] === tempId ? realId : parts[3];
                newEdgeId = parts.join('::');
              }
            } else if (edgeId.startsWith('e-')) {
              // Format: e-source-target
              newEdgeId = edgeId.replace(tempId, realId);
            }
            
            // Remove old edge and add updated one
            edgeMap.delete(edgeId);
            edgeMap.set(newEdgeId, { ...newEdge, id: newEdgeId });
            console.log(`[Delta] Updated edge ${edgeId} to ${newEdgeId}`);
          }
        }
      }
      
      // Apply node changes
      if (delta.changes.nodes) {
        // Update existing nodes - MERGE updates, don't replace
        delta.changes.nodes.updated?.forEach(update => {
          const existingNode = nodeMap.get(update.id);
          if (existingNode) {
            // Deep merge the update with existing node
            // Let the server data overwrite metadata (including clearing isOptimistic)
            const mergedNode = {
              ...existingNode,
              ...update,
              data: {
                ...existingNode.data,
                ...(update.data || {})
              }
            } as GraphNode;
            nodeMap.set(update.id, mergedNode);
          } else {
            // Node doesn't exist, just add it
            nodeMap.set(update.id, update as GraphNode);
          }
        });
        
        // Add new nodes
        delta.changes.nodes.created?.forEach(node => {
          // Don't apply the preserved flag here - let the server data come through clean
          // The flag cleanup will be handled by setTimeout in onSuccess
          nodeMap.set(node.id, node as GraphNode);
        });
        
        // Remove deleted nodes
        delta.changes.nodes.deleted?.forEach(nodeId => {
          nodeMap.delete(nodeId);
        });
      }
      
      // Apply edge changes
      if (delta.changes.edges) {
        // Update existing edges
        delta.changes.edges.updated?.forEach(edge => {
          edgeMap.set(edge.id, edge);
        });
        
        // Add new edges - check for optimistic edges to replace
        delta.changes.edges.created?.forEach(edge => {
          // For CREATE operations, check if this edge replaces an optimistic one with temp ID
          if (operation === 'create' && tempId) {
            // Look for optimistic edge that matches but has temp ID
            const optimisticEdgeId = Array.from(edgeMap.keys()).find(id => {
              // Check if edge ID contains the temp ID and matches the pattern
              if (id.includes(tempId)) {
                // Extract parts to compare structure
                if (id.includes('::') && edge.id.includes('::')) {
                  const oldParts = id.split('::');
                  const newParts = edge.id.split('::');
                  // Check if same source and field, just different target (temp vs real)
                  return oldParts[1] === newParts[1] && oldParts[2] === newParts[2];
                }
                return false;
              }
              return false;
            });
            
            if (optimisticEdgeId) {
              console.log(`[Delta] Replacing optimistic edge ${optimisticEdgeId} with ${edge.id}`);
              edgeMap.delete(optimisticEdgeId);
            }
          }
          
          edgeMap.set(edge.id, edge);
        });
        
        // Remove deleted edges
        delta.changes.edges.deleted?.forEach(edgeId => {
          edgeMap.delete(edgeId);
        });
      }
      
      return {
        ...oldData,
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(edgeMap.values()),
        metadata: {
          ...oldData.metadata,
          lastFetch: Date.now(),
          // TODO: Use delta.toVersion when available
          version: ((oldData.metadata?.version ?? 0) + 1)
        }
      };
    });
  }
  
  rollback<T extends Entity>(context: CacheUpdateContext<T>): void {
    const { previousState, queryClient, queryKey, operation, tempId } = context;
    
    // CRITICAL: Handle CREATE rollback by removing temp node
    // WHY: CREATE operations add temp nodes that must be removed on failure
    if (operation === 'create' && tempId) {
      queryClient.setQueryData(queryKey, (oldData: CachedGraphData | undefined) => {
        if (!oldData) return oldData;
        
        // Remove the optimistic node and any edges referencing it
        const nodes = oldData.nodes.filter(n => n.id !== tempId);
        const edges = oldData.edges.filter(e => 
          e.source !== tempId && e.target !== tempId
        );
        
        return { ...oldData, nodes, edges };
      });
    } else if (previousState) {
      // For UPDATE/DELETE, restore the previous state
      queryClient.setQueryData(queryKey, previousState);
    } else {
      // Fallback to invalidation only for UPDATE/DELETE without previous state
      console.warn('Delta rollback without previous state - falling back to invalidation');
      const invalidator = new InvalidateCacheUpdater();
      invalidator.update(context);
    }
  }
}

/**
 * Factory function to get the appropriate cache updater
 * based on strategy and available data
 */
export function getCacheUpdater(strategy: CacheUpdateStrategy): CacheUpdater {
  switch (strategy) {
    case 'delta':
      return new DeltaCacheUpdater();
    case 'optimistic':
      return new OptimisticCacheUpdater();
    case 'invalidate':
    default:
      return new InvalidateCacheUpdater();
  }
}

/**
 * Helper to determine best strategy based on context
 * Prefers delta if available, falls back to optimistic or invalidate
 */
export function determineCacheStrategy(
  delta?: GraphDelta,
  preferOptimistic: boolean = true
): CacheUpdateStrategy {
  if (delta) {
    return 'delta';
  }
  if (preferOptimistic) {
    return 'optimistic';
  }
  return 'invalidate';
}

/**
 * Utility to measure cache update performance
 * Returns duration in milliseconds
 */
export async function measureCacheUpdate<T extends Entity>(
  updater: CacheUpdater,
  context: CacheUpdateContext<T>
): Promise<number> {
  const start = performance.now();
  await updater.update(context);
  return performance.now() - start;
}