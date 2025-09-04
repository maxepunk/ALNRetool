import { useMemo, useEffect } from 'react';
import type { GraphNode, GraphEdge } from '@/lib/graph/types';
import type { Node, Edge } from '@xyflow/react';
import type { ViewConfig } from '@/lib/viewConfigs';
import { useLayoutEngine } from './graph/useLayoutEngine';
import { useClusterStore } from '@/stores/clusterStore';
import { getVisibleNodeIds } from '@/lib/graph/filtering';

interface UseGraphLayoutParams {
  nodes: Node[];
  edges: Edge[];
  viewConfig: ViewConfig;
  searchTerm: string;
  selectedNodeId: string | null;
  connectionDepth: number | null;
  entityVisibility: {
    character: boolean;
    element: boolean;
    puzzle: boolean;
    timeline: boolean;
  };
  characterType: string;
  characterSelectedTiers: Set<string>;
  puzzleSelectedActs: Set<string>;
  elementBasicTypes: Set<string>;
  elementStatus: Set<string>;
}

interface UseGraphLayoutResult {
  layoutedNodes: GraphNode[];
  filteredEdges: Edge[];
  totalUniverseNodes: number;
}

export const useGraphLayout = ({
  nodes,
  edges,
  viewConfig,
  searchTerm,
  selectedNodeId,
  connectionDepth,
  entityVisibility,
  characterType,
  characterSelectedTiers,
  puzzleSelectedActs,
  elementBasicTypes,
  elementStatus,
}: UseGraphLayoutParams): UseGraphLayoutResult => {
  
  const { clusteringEnabled, clusters, expandedClusters, rules, actions } = useClusterStore();

  const filteredNodes = useMemo(() => {
    return nodes
      .filter((node: any) => {
        if (node.data?.metadata?.isPlaceholder) return true;
        const label = node.data?.label;
        if (searchTerm && label && typeof label === 'string' && !label.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        
        const entityType = node.data?.metadata?.entityType;
        if (entityType && typeof entityType === 'string') {
          if (!entityVisibility[entityType as keyof typeof entityVisibility]) return false;
          
          const entity = node.data?.entity;
          if (entity) {
            switch (entityType) {
              case 'character':
                if (characterType && characterType !== 'all' && entity.type !== characterType) return false;
                if (characterSelectedTiers.size > 0 && !characterSelectedTiers.has(entity.tier || '')) return false;
                break;
              case 'puzzle':
                if (puzzleSelectedActs.size > 0) {
                  const puzzleTiming = (entity as any).timing || [];
                  if (!puzzleTiming.some((act: string) => act && puzzleSelectedActs.has(act))) return false;
                }
                break;
              case 'element':
                if (elementBasicTypes.size > 0 && !elementBasicTypes.has(entity.basicType || '')) return false;
                if (elementStatus.size > 0 && !elementStatus.has(entity.status || '')) return false;
                break;
            }
          }
        }
        return true;
      })
      .map(node => ({ ...node, type: node.type || 'default' } as GraphNode));
  }, [nodes, searchTerm, entityVisibility, characterType, characterSelectedTiers, puzzleSelectedActs, elementBasicTypes, elementStatus]);

  const allEdges = edges as any[];

  useEffect(() => {
    if (clusteringEnabled) {
      actions.recomputeClusters(filteredNodes, allEdges);
    }
  }, [clusteringEnabled, filteredNodes, allEdges, rules, actions]);

  const { processedNodes, visibleEdges } = useMemo(() => {
    const hiddenInClusterNodeIds = new Set<string>();
    if (clusteringEnabled) {
        clusters.forEach((cluster, clusterId) => {
            if (!expandedClusters.has(clusterId)) {
                cluster.childIds.forEach(id => hiddenInClusterNodeIds.add(id));
            }
        });
    }

    const baseNodeIdsForFocus = new Set(filteredNodes.map(n => n.id));
    const focusVisibleNodeIds = getVisibleNodeIds(baseNodeIdsForFocus, allEdges, selectedNodeId, connectionDepth || 0);

    const finalVisibleNodeIds = new Set<string>();
    const processed = filteredNodes.map(node => {
      const isSelected = node.id === selectedNodeId;
      const isFocusVisible = focusVisibleNodeIds.has(node.id);
      const isClusterHidden = hiddenInClusterNodeIds.has(node.id);
      const hidden = isClusterHidden ? !isSelected : !isFocusVisible;

      if (!hidden) finalVisibleNodeIds.add(node.id);

      return { ...node, hidden, data: { ...node.data, metadata: { ...node.data.metadata, isSelected }}};
    });

    const visible = allEdges.filter(edge => finalVisibleNodeIds.has(edge.source) && finalVisibleNodeIds.has(edge.target));

    return { processedNodes: processed, visibleEdges: visible };
  }, [filteredNodes, allEdges, selectedNodeId, connectionDepth, clusteringEnabled, clusters, expandedClusters]);

  const { layoutedNodes } = useLayoutEngine({
    nodes: processedNodes,
    edges: visibleEdges,
    viewConfig,
  });
  
  const totalUniverseNodes = nodes.length;
  
  const filteredEdges: Edge[] = useMemo(() => {
    return visibleEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      animated: edge.animated,
      style: edge.style,
      data: edge.data,
      label: edge.label,
    } satisfies Edge));
  }, [visibleEdges]);
  
  return { layoutedNodes, filteredEdges, totalUniverseNodes };
};
