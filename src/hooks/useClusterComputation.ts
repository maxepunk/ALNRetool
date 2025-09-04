import { useQuery } from '@tanstack/react-query';
import { computeClusters } from '@/lib/graph/clustering/clusterEngine';
import { useClusterStore } from '@/stores/clusterStore';
import type { GraphNode, GraphEdge } from '@/lib/graph/types';

export function useClusterComputation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  enabled = true
) {
  const { clusteringRules, clusteringEnabled } = useClusterStore();

  return useQuery({
    queryKey: ['clusters', nodes, edges, clusteringRules],
    queryFn: () => computeClusters(nodes, edges, clusteringRules),
    staleTime: 5000, // 5 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
    enabled: enabled && clusteringEnabled && nodes.length > 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
