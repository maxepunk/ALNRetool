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
import { useClusterStore } from '@/stores/clusterStore';

export function useGraphVisibility({
  filteredNodes,
  allEdges,
  selectedNodeId,
  connectionDepth,
}: UseGraphVisibilityParams): UseGraphVisibilityResult {
  const { clusters, expandedClusters, clusteringEnabled } = useClusterStore();

  return useMemo(() => {
    // --- Default Non-Clustering Logic ---
    if (!clusteringEnabled || clusters.size === 0) {
      const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
      const visibleNodeIds = getVisibleNodeIds(
        filteredNodeIds,
        allEdges,
        selectedNodeId,
        connectionDepth || 0
      );

      const nodeMap = new Map(filteredNodes.map(n => [n.id, n]));
      const visibleNodes = Array.from(visibleNodeIds)
        .map(nodeId => nodeMap.get(nodeId))
        .filter((node): node is GraphNode => node !== undefined)
        .map(node => ({
          ...node,
          data: {
            ...node.data,
            metadata: { ...node.data.metadata, isSelected: node.id === selectedNodeId }
          }
        }));

      const visibleEdges = allEdges.filter(
        edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
      );

      return { visibleNodeIds, visibleNodes, visibleEdges };
    }

    // --- Clustering Logic ---
    
    // 1. Determine which nodes are hidden inside collapsed clusters
    const hiddenNodeIds = new Set<string>();
    clusters.forEach((cluster, clusterId) => {
        if (!expandedClusters.has(clusterId)) {
            cluster.childIds.forEach(id => hiddenNodeIds.add(id));
        }
    });

    // 2. Determine base set of visible nodes for connection depth calculation
    // This includes all nodes that are not inside a collapsed cluster.
    const baseVisibleNodeIds = new Set(
        filteredNodes.filter(n => !hiddenNodeIds.has(n.id)).map(n => n.id)
    );

    // 3. Apply connection depth logic
    const finalVisibleNodeIds = getVisibleNodeIds(
        baseVisibleNodeIds,
        allEdges,
        selectedNodeId,
        connectionDepth || 0
    );
    
    // 4. Construct the final list of nodes to be passed to the layout engine
    const nodeMap = new Map(filteredNodes.map(n => [n.id, n]));
    const visibleNodes = Array.from(finalVisibleNodeIds)
        .map(id => nodeMap.get(id))
        .filter((n): n is GraphNode => !!n)
        .map(node => ({
            ...node,
            data: { ...node.data, metadata: { ...node.data.metadata, isSelected: node.id === selectedNodeId } }
        }));
    
    // 5. Filter edges to only include those connecting the final visible nodes.
    // Edge aggregation will be handled by the layout engine.
    const visibleEdges = allEdges.filter(
        edge => finalVisibleNodeIds.has(edge.source) && finalVisibleNodeIds.has(edge.target)
    );

    return {
      visibleNodeIds: finalVisibleNodeIds,
      visibleNodes,
      visibleEdges,
    };
  }, [
    filteredNodes,
    allEdges,
    selectedNodeId,
    connectionDepth,
    clusters,
    expandedClusters,
    clusteringEnabled,
  ]);
}