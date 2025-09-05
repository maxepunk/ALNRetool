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
 * Supports both sync and async operations via union return type
 */
export interface CacheUpdater {
  update<T extends Entity>(context: CacheUpdateContext<T>): Promise<void> | void;
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
  update<T extends Entity>(context: CacheUpdateContext<T>): void {
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
                  }
                }
              };
              
              // Update edges to use real ID with robust parsing
              let edgesUpdated = 0;
              let edgeUpdateErrors: string[] = [];
              
              edges = edges.map(edge => {
                if (edge.source === tempId || edge.target === tempId) {
                  // Update source and target
                  const newSource = edge.source === tempId ? entity.id : edge.source;
                  const newTarget = edge.target === tempId ? entity.id : edge.target;
                  
                  // Update edge ID based on format with error recovery
                  let newEdgeId = edge.id;
                  try {
                    if (edge.id.includes('::')) {
                      // Format: e::source::fieldKey::target
                      const parts = edge.id.split('::');
                      if (parts.length === 4 && parts[1] && parts[3]) {
                        parts[1] = parts[1] === tempId ? entity.id : parts[1];
                        parts[3] = parts[3] === tempId ? entity.id : parts[3];
                        newEdgeId = parts.join('::');
                      } else {
                        // Fallback: Try to preserve as much structure as possible
                        edgeUpdateErrors.push(`Invalid field-based edge format: ${edge.id}, attempting recovery`);
                        // Generate a new ID based on source and target
                        const fieldKey = parts[2] || 'unknown';
                        newEdgeId = `e::${newSource}::${fieldKey}::${newTarget}`;
                      }
                    } else if (edge.id.startsWith('e-')) {
                      // Format: e-source-target
                      // Only replace if it's a complete segment
                      const segments = edge.id.split('-');
                      newEdgeId = segments.map(seg => seg === tempId ? entity.id : seg).join('-');
                    } else {
                      // Unknown format - create a safe fallback ID
                      edgeUpdateErrors.push(`Unknown edge ID format: ${edge.id}, using fallback`);
                      // Generate a simple format ID as fallback
                      newEdgeId = `e-${newSource}-${newTarget}`;
                    }
                  } catch (error) {
                    // Last resort fallback if any error occurs
                    console.error(`[Optimistic] Failed to update edge ID ${edge.id}:`, error);
                    edgeUpdateErrors.push(`Critical error updating edge ${edge.id}: ${error}`);
                    // Generate a safe fallback that won't break the graph
                    newEdgeId = `e-${newSource}-${newTarget}-${Date.now()}`;
                  }
                  
                  // Validate the update was successful
                  if (newEdgeId !== edge.id) {
                    edgesUpdated++;
                    console.log(`[Optimistic] Updated edge ${edge.id} to ${newEdgeId}`);
                  }
                  
                  return {
                    ...edge,
                    id: newEdgeId,
                    source: newSource,
                    target: newTarget,
                    data: {
                      ...edge.data
                    }
                  };
                }
                return edge;
              });
              
              // Log validation results
              if (edgesUpdated > 0) {
                console.log(`[Optimistic] Successfully updated ${edgesUpdated} edge(s)`);
              }
              if (edgeUpdateErrors.length > 0) {
                console.warn('[Optimistic] Edge update errors:', edgeUpdateErrors);
              }
            }
          }
          break;
          
        case 'update':
          // Update existing node
          const updateIndex = nodes.findIndex(n => n.id === entity.id);
          if (updateIndex !== -1 && nodes[updateIndex]) {
            const nodeToUpdate = nodes[updateIndex];
            // Note: pendingMutationCount and isOptimistic are managed by mutation hooks, not here
            nodes[updateIndex] = {
              ...nodeToUpdate,
              data: {
                ...nodeToUpdate.data,
                entity,
                metadata: {
                  ...(nodeToUpdate.data?.metadata || {})
                  // Don't preserve isOptimistic - mutation hooks handle this
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
  update<T extends Entity>(context: CacheUpdateContext<T>): void {
    const { queryClient, queryKey, delta, operation, tempId, entity } = context;
    
    if (!delta) {
      // Fallback to invalidation if no delta available
      console.warn('No delta available, falling back to invalidation');
      const invalidator = new InvalidateCacheUpdater();
      invalidator.update(context); // Don't return, just call it
      return;
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
      
      // Create lookup maps for O(1) operations
      const nodeMap = new Map(oldData.nodes.map(n => [n.id, n]));
      const edgeMap = new Map(oldData.edges.map(e => [e.id, e]));
      
      // CRITICAL FIX: Handle temp ID replacement for CREATE operations
      // The server doesn't know about client-side temp IDs, so we must
      // replace them with the real ID from the delta entity
      if (operation === 'create' && tempId && entity && 'id' in entity) {
        const realId = entity.id;
        
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
            // Preserve client-side UI flags (isOptimistic, isFocused, searchMatch)
            const existingMetadata = existingNode.data?.metadata || {};
            
            // Destructure to exclude data property from spread
            const { data: updateData, ...updateWithoutData } = update;
            
            const mergedNode = {
              ...existingNode,
              ...updateWithoutData,  // Spread everything except data
              data: {
                ...existingNode.data,     // Original cache data
                ...(updateData || {}),    // Server updates
                // CRITICAL FIX: Deep merge entity to prevent data loss on partial updates
                // Server sends complete entities in UPDATE deltas, merge to preserve client-side state
                entity: {
                  ...(existingNode.data?.entity || {}),
                  ...(updateData?.entity || {})
                },
                metadata: {
                  ...(existingNode.data?.metadata || {}),
                  ...(updateData?.metadata || {}),
                  // CRITICAL: Preserve mutation state that's managed by mutation hooks
                  pendingMutationCount: existingMetadata.pendingMutationCount,
                  // Preserve UI state flags that should persist across updates
                  isFocused: existingMetadata.isFocused,
                  searchMatch: existingMetadata.searchMatch
                }
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
          // Add new node from delta
          // Note: pendingMutationCount is managed by mutation hooks, not here
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
 * Handles both sync and async updaters
 */
export async function measureCacheUpdate<T extends Entity>(
  updater: CacheUpdater,
  context: CacheUpdateContext<T>
): Promise<number> {
  const start = performance.now();
  const result = updater.update(context);
  // Handle both sync and async updaters
  if (result instanceof Promise) {
    await result;
  }
  return performance.now() - start;
}