/**
 * Utility functions for graph operations
 */

import type { NodeMetadata, GraphEdge } from './types';

/**
 * Checks if a node is in an optimistic state (has pending mutations)
 * 
 * Uses unified pendingMutationCount approach for optimistic state tracking.
 * 
 * @param metadata - The node metadata to check
 * @returns True if the node has pending mutations, false otherwise
 */
export const isNodeOptimistic = (metadata: NodeMetadata | undefined): boolean => {
  if (!metadata) return false;
  
  // Use counter-only approach (unified optimistic tracking)
  return (metadata.pendingMutationCount || 0) > 0;
};

/**
 * Gets the number of pending mutations for a node
 * 
 * @param metadata - The node metadata to check
 * @returns Number of pending mutations (0 if none)
 */
export const getPendingMutationCount = (metadata: NodeMetadata | undefined): number => {
  if (!metadata) return 0;
  
  // Return counter value (unified optimistic tracking)
  return metadata.pendingMutationCount || 0;
};

/**
 * Checks if an edge is in an optimistic state (has pending mutations)
 * 
 * Uses unified pendingMutationCount approach for optimistic state tracking.
 * 
 * @param edge - The graph edge to check
 * @returns True if the edge has pending mutations, false otherwise
 */
export const isEdgeOptimistic = (edge: GraphEdge | undefined): boolean => {
  if (!edge?.data) return false;
  
  // Use counter-only approach (unified optimistic tracking)
  return (edge.data.pendingMutationCount || 0) > 0;
};