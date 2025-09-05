/**
 * Utility functions for graph operations
 */

import type { NodeMetadata } from './types';

/**
 * Checks if a node is in an optimistic state (has pending mutations)
 * 
 * Backwards-compatible helper that works with both:
 * - New pendingMutationCount (preferred)
 * - Legacy isOptimistic boolean (deprecated)
 * 
 * @param metadata - The node metadata to check
 * @returns True if the node has pending mutations, false otherwise
 */
export const isNodeOptimistic = (metadata: NodeMetadata | undefined): boolean => {
  if (!metadata) return false;
  
  // Check new counter first (preferred)
  if (metadata.pendingMutationCount !== undefined) {
    return metadata.pendingMutationCount > 0;
  }
  
  // Fallback to legacy boolean for backwards compatibility
  return metadata.isOptimistic || false;
};

/**
 * Gets the number of pending mutations for a node
 * 
 * @param metadata - The node metadata to check
 * @returns Number of pending mutations (0 if none or using legacy boolean)
 */
export const getPendingMutationCount = (metadata: NodeMetadata | undefined): number => {
  if (!metadata) return 0;
  
  // Return actual count if available
  if (metadata.pendingMutationCount !== undefined) {
    return metadata.pendingMutationCount;
  }
  
  // Convert legacy boolean to count (0 or 1)
  return metadata.isOptimistic ? 1 : 0;
};