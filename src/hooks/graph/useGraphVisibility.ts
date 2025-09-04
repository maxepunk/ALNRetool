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
import type { GraphNode, GraphEdge, ClusterDefinition } from '@/lib/graph/types';
import { getVisibleNodeIds } from '@/lib/graph/filtering';
import { useClusterStore } from '@/stores/clusterStore';

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
  const { clusters, expandedClusters, clusteringEnabled } = useClusterStore();

  return useMemo(() => {
    // Early return for non-clustering mode
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
        .filter((node): node is GraphNode => node !== undefined);

      const visibleEdges = allEdges.filter(
        edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
      );

      return { visibleNodeIds, visibleNodes, visibleEdges };
    }
    
    // Clustering mode
    const visibleNodeIds = new Set<string>();
    const hiddenByCluster = new Set<string>();

    // Process clusters
    clusters.forEach((cluster, clusterId) => {
      // Always show cluster node itself
      visibleNodeIds.add(clusterId);

      if (expandedClusters.has(clusterId)) {
        // Show children if expanded
        cluster.childIds.forEach(childId => {
          if (filteredNodes.find(n => n.id === childId)) {
            visibleNodeIds.add(childId);
          }
        });
      } else {
        // Hide children if collapsed
        cluster.childIds.forEach(childId => hiddenByCluster.add(childId));
      }
    });

    // Add non-clustered filtered nodes
    filteredNodes.forEach(node => {
      if (!hiddenByCluster.has(node.id) && !isInAnyCluster(node.id, clusters)) {
        visibleNodeIds.add(node.id);
      }
    });

    // Apply connection depth from visible nodes
    if (selectedNodeId && connectionDepth > 0) {
      const connected = getVisibleNodeIds(
        visibleNodeIds,
        allEdges,
        selectedNodeId,
        connectionDepth
      );
      connected.forEach(id => visibleNodeIds.add(id));
    }

    // Build final nodes with metadata
    const allNodesMap = new Map([
      ...filteredNodes.map(n => [n.id, n] as [string, GraphNode]),
      // Add cluster nodes
      ...Array.from(clusters.values()).map(cluster => {
        const clusterNode: GraphNode = {
          id: cluster.id,
          type: 'cluster',
          position: { x: 0, y: 0 },
          data: {
            label: cluster.label,
            metadata: {
              entityType: 'cluster' as any,
              entityId: cluster.id,
              isCluster: true
            },
            entity: {} as any,
            clustering: cluster
          }
        };
        return [cluster.id, clusterNode] as [string, GraphNode];
      })
    ]);
    
    const visibleNodes = Array.from(visibleNodeIds)
      .map(nodeId => allNodesMap.get(nodeId))
      .filter((node): node is GraphNode => node !== undefined)
      .map(node => ({
        ...node,
        data: {
          ...node.data,
          metadata: {
            ...node.data.metadata,
            isFiltered: true,
            isSelected: node.id === selectedNodeId
          }
        },
        hidden: hiddenByCluster.has(node.id) // Mark for React Flow
      }));
    
    // Create aggregated edges for clusters
    const visibleEdges = createVisibleEdges(
      allEdges,
      visibleNodeIds,
      hiddenByCluster,
      clusters,
      expandedClusters
    );
    
    return { visibleNodeIds, visibleNodes, visibleEdges };
  }, [
    filteredNodes,
    allEdges,
    selectedNodeId,
    connectionDepth,
    clusters,
    expandedClusters,
    clusteringEnabled
  ]);
}

function isInAnyCluster(nodeId: string, clusters: Map<string, ClusterDefinition>): boolean {
  for (const cluster of clusters.values()) {
    if (cluster.childIds.includes(nodeId)) {
      return true;
    }
  }
  return false;
}

function createVisibleEdges(
  allEdges: GraphEdge[],
  visibleNodeIds: Set<string>,
  hiddenByCluster: Set<string>,
  clusters: Map<string, ClusterDefinition>,
  expandedClusters: Set<string>
): GraphEdge[] {
  const visibleEdges: GraphEdge[] = [];

  allEdges.forEach(edge => {
    const sourceParent = findParentCluster(edge.source, clusters);
    const targetParent = findParentCluster(edge.target, clusters);

    const isSourceVisible = visibleNodeIds.has(edge.source) || (sourceParent && expandedClusters.has(sourceParent.id));
    const isTargetVisible = visibleNodeIds.has(edge.target) || (targetParent && expandedClusters.has(targetParent.id));

    if (isSourceVisible && isTargetVisible) {
      visibleEdges.push(edge);
    }
  });

  return visibleEdges;
}

function findParentCluster(nodeId: string, clusters: Map<string, ClusterDefinition>): ClusterDefinition | undefined {
  for (const cluster of clusters.values()) {
    if (cluster.childIds.includes(nodeId)) {
      return cluster;
    }
  }
  return undefined;
}