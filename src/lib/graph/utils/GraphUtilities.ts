/**
 * GraphUtilities
 * 
 * Common utility functions for graph operations.
 * Eliminates code duplication across strategy classes.
 */

import { log } from '@/utils/logger';

/**
 * Generic deduplication utilities for graph nodes and edges
 */
export class GraphUtilities {
  /**
   * Deduplicate an array of items by their ID property.
   * Keeps the first occurrence of each unique ID.
   * 
   * @param items - Array of items with an 'id' property
   * @returns Deduplicated array maintaining original order
   */
  static deduplicateNodes<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    const result = items.filter(item => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
    
    log.debug('GraphUtilities.deduplicateNodes', {
      input: items.length,
      output: result.length,
      duplicatesRemoved: items.length - result.length
    });
    
    return result;
  }

  /**
   * Deduplicate an array of edges by their ID property.
   * Keeps the first occurrence of each unique ID.
   * 
   * @param edges - Array of edges with an 'id' property
   * @returns Deduplicated array maintaining original order
   */
  static deduplicateEdges<T extends { id: string }>(edges: T[]): T[] {
    const seen = new Set<string>();
    const result = edges.filter(edge => {
      if (seen.has(edge.id)) {
        return false;
      }
      seen.add(edge.id);
      return true;
    });
    
    log.debug('GraphUtilities.deduplicateEdges', {
      input: edges.length,
      output: result.length,
      duplicatesRemoved: edges.length - result.length
    });
    
    return result;
  }

  /**
   * Deduplicate edges by source-target pairs.
   * Useful when edge IDs might differ but represent the same connection.
   * 
   * @param edges - Array of edges with source and target properties
   * @returns Deduplicated array keeping first occurrence of each pair
   */
  static deduplicateEdgesByPair<T extends { source: string; target: string }>(
    edges: T[]
  ): T[] {
    const seen = new Set<string>();
    const result = edges.filter(edge => {
      const key = `${edge.source}->${edge.target}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    
    log.debug('GraphUtilities.deduplicateEdgesByPair', {
      input: edges.length,
      output: result.length,
      duplicatesRemoved: edges.length - result.length
    });
    
    return result;
  }

  /**
   * Filter items to only include those with IDs in the provided set.
   * 
   * @param items - Array of items with an 'id' property
   * @param includedIds - Set of IDs to include
   * @returns Filtered array containing only items with included IDs
   */
  static filterByIncludedIds<T extends { id: string }>(
    items: T[],
    includedIds: Set<string>
  ): T[] {
    return items.filter(item => includedIds.has(item.id));
  }

  /**
   * Create a Set of IDs from an array of items.
   * 
   * @param items - Array of items with an 'id' property
   * @returns Set containing all unique IDs
   */
  static extractIds<T extends { id: string }>(items: T[]): Set<string> {
    return new Set(items.map(item => item.id));
  }

  /**
   * Merge multiple arrays and deduplicate by ID.
   * 
   * @param arrays - Multiple arrays to merge
   * @returns Single deduplicated array
   */
  static mergeAndDeduplicate<T extends { id: string }>(...arrays: T[][]): T[] {
    const merged = arrays.flat();
    return GraphUtilities.deduplicateNodes(merged);
  }
}