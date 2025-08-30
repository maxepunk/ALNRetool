/**
 * useGraphVisibility Hook
 * 
 * Applies visibility rules based on filter mode and focus.
 * Part of the decomposed useGraphLayout architecture.
 * 
 * @module hooks/graph/useGraphVisibility
 * 
 * **Purpose:**
 * Extract visibility logic from monolithic useGraphLayout.
 * Determines which nodes should be visible based on filter mode,
 * focused node, and connection depth.
 * 
 * **Performance:**
 * - Memoized to prevent unnecessary recalculation
 * - Only recalculates when filter mode or focus changes
 * - Reduces dependency count by isolating visibility logic
 */

import { useMemo } from 'react';
import type { GraphNode, GraphEdge } from '@/lib/graph/types';
import { getVisibleNodeIds } from '@/lib/graph/filtering';

interface UseGraphVisibilityParams {
  // Nodes and edges to process
  filteredNodes: GraphNode[];
  allEdges: GraphEdge[];
  
  // Visibility controls
  selectedNodeId: string | null;
  connectionDepth: number | null;
}

interface UseGraphVisibilityResult {
  visibleNodeIds: Set<string>;
  visibleNodes: GraphNode[];
  visibleEdges: GraphEdge[];
}

/**
 * Hook to apply visibility rules to nodes and edges.
 * Encapsulates the visibility logic from useGraphLayout.
 * 
 * @param params - Nodes, edges, and visibility controls
 * @returns Visible nodes and edges based on selection and depth
 * 
 * @example
 * ```typescript
 * const { visibleNodes, visibleEdges } = useGraphVisibility({
 *   filteredNodes,
 *   allEdges,
 *   selectedNodeId,
 *   connectionDepth
 * });
 * ```
 */
export function useGraphVisibility({
  filteredNodes,
  allEdges,
  selectedNodeId,
  connectionDepth,
}: UseGraphVisibilityParams): UseGraphVisibilityResult {
  return useMemo(() => {
    // Step 1: Get IDs of filtered nodes
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    
    // Step 2: Apply visibility rules based on selection and depth
    const visibleNodeIds = getVisibleNodeIds(
      filteredNodeIds,
      allEdges,
      selectedNodeId,
      connectionDepth || 0
    );
    
    // Step 3: Build final nodes with metadata
    const nodeMap = new Map(filteredNodes.map(n => [n.id, n]));
    const visibleNodes = Array.from(visibleNodeIds)
      .map(nodeId => nodeMap.get(nodeId))
      .filter((node): node is GraphNode => node !== undefined)
      .map(node => ({
        ...node,
        data: {
          ...node.data,
          metadata: {
            ...node.data.metadata,
            isFiltered: filteredNodeIds.has(node.id),
            isSelected: node.id === selectedNodeId
          }
        }
      }));
    
    // Step 4: Filter edges for visible nodes
    const visibleEdges = allEdges.filter(
      edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
    
    return {
      visibleNodeIds,
      visibleNodes,
      visibleEdges
    };
  }, [
    // Nodes and edges
    filteredNodes,
    allEdges,
    // Visibility controls
    selectedNodeId,
    connectionDepth
  ]);
}