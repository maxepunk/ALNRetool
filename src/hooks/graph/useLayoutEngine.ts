/**
 * useLayoutEngine Hook
 * 
 * Applies layout algorithm to position nodes.
 * Part of the decomposed useGraphLayout architecture.
 * 
 * @module hooks/graph/useLayoutEngine
 * 
 * **Purpose:**
 * Extract layout logic from monolithic useGraphLayout.
 * Positions nodes using Dagre algorithm with caching.
 * 
 * **Performance:**
 * - Memoized to prevent unnecessary recalculation
 * - Uses LayoutCache for position persistence
 * - Only recalculates when nodes/edges/config change
 */

import { useMemo } from 'react';
import type { GraphNode, GraphEdge } from '@/lib/graph/types';
import type { ViewConfig } from '@/lib/viewConfigs';
import { applyPureDagreLayout, applyClusterAwareLayout } from '@/lib/graph/layout/dagre';
import { useClusterStore } from '@/stores/clusterStore';

interface UseLayoutEngineParams {
  // Nodes and edges to layout
  visibleNodes: GraphNode[];
  visibleEdges: GraphEdge[];
  
  // Layout configuration
  viewConfig: ViewConfig;
}

interface UseLayoutEngineResult {
  layoutedNodes: GraphNode[];
}

/**
 * Hook to apply layout algorithm to nodes.
 * Encapsulates the layout logic from useGraphLayout.
 * 
 * @param params - Nodes, edges, and layout configuration
 * @returns Nodes with calculated positions
 * 
 * @example
 * ```typescript
 * const { layoutedNodes } = useLayoutEngine({
 *   visibleNodes,
 *   visibleEdges,
 *   viewConfig
 * });
 * ```
 */
export function useLayoutEngine({
  visibleNodes,
  visibleEdges,
  viewConfig,
}: UseLayoutEngineParams): UseLayoutEngineResult {
  const { clusteringEnabled, clusters, expandedClusters } = useClusterStore();

  // Extract layout properties for stable dependencies
  const layoutDirection = viewConfig.layout.direction || 'LR';
  const nodeSpacing = viewConfig.layout.spacing?.nodeSpacing || 100;
  const rankSpacing = viewConfig.layout.spacing?.rankSpacing || 300;

  return useMemo(() => {
    if (visibleNodes.length === 0) {
      return { layoutedNodes: [] };
    }
    
    const layoutConfig = {
      direction: (layoutDirection === 'LR' || layoutDirection === 'TB') ? layoutDirection : 'LR' as const,
      nodeSpacing: nodeSpacing,
      rankSpacing: rankSpacing
    };
    
    let layoutedNodes: GraphNode[];

    if (clusteringEnabled && clusters.size > 0) {
      layoutedNodes = applyClusterAwareLayout(
        visibleNodes,
        visibleEdges,
        clusters,
        expandedClusters,
        layoutConfig
      );
    } else {
      layoutedNodes = applyPureDagreLayout(
        visibleNodes,
        visibleEdges,
        layoutConfig
      );
    }
    
    return { layoutedNodes };
  }, [
    visibleNodes,
    visibleEdges,
    layoutDirection,
    nodeSpacing,
    rankSpacing,
    clusteringEnabled,
    clusters,
    expandedClusters,
  ]);
}