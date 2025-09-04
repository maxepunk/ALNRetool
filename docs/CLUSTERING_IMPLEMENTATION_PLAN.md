# Node Clustering Implementation Plan for ALNRetool

## Executive Summary
Implement client-side node clustering for ALNRetool that improves organization and navigation for the internal tool (2-3 users), grouping related nodes into collapsible clusters. Follows existing patterns from filterStore, integrates with the unified selection system, uses TanStack Query for computations, and avoids Dagre's compound graph issues through a two-pass layout approach.

## Table of Contents
- [Phase 0: Selection System Coordination](#phase-0-selection-system-coordination-prerequisite)
- [Phase 1: Core Infrastructure](#phase-1-core-infrastructure-day-1-2)
- [Phase 2: Layout Integration](#phase-2-layout-integration-day-3-4)
- [Phase 3: UI Components](#phase-3-ui-components-day-5)
- [Phase 4: System Integration](#phase-4-integration-day-6)
- [Phase 5: Testing](#phase-5-testing-day-7)
- [Success Metrics & Validation](#success-metrics--validation)

---

## Phase 0: Selection System Coordination (Prerequisite)

### CRITICAL: Coordinate with Unified Selection System
Before starting clustering implementation, ensure compatibility with the ongoing unified selection work in `UI_Improvements.md`.

```typescript
// Key integration points that must be addressed:

1. Selection State Synchronization
   - Cluster nodes must work with React Flow's node.selected
   - FilterStore.selectedNodeId must handle cluster IDs
   - Multi-selection (Cmd/Shift) must work with clusters

2. Selection Behaviors to Implement
   - Selecting a collapsed cluster should NOT select hidden children
   - Cmd+A should select visible nodes AND cluster nodes
   - Expanding a cluster with selected children should show them as selected
   - Collapsing a cluster with selected children should maintain their selection state

3. Clipboard Integration
   - Copying a cluster should copy its visible information
   - Hidden nodes should not be included in clipboard operations
   
4. Required Methods in ClusterStore
   handleNodeSelection: (nodeId: string) => {
     const cluster = findParentCluster(nodeId, clusters);
     if (cluster && !expandedClusters.has(cluster.id)) {
       // Auto-expand cluster when selecting hidden node via search/filter
       toggleCluster(cluster.id);
     }
   }
   
   getSelectableNodes: () => {
     // Return all visible nodes for selection operations
     const visible = new Set<string>();
     nodes.forEach(node => {
       if (!isHiddenByCluster(node.id)) {
         visible.add(node.id);
       }
     });
     clusters.forEach(cluster => visible.add(cluster.id));
     return visible;
   }
```

### TypeScript Definitions Required
```typescript
// src/lib/graph/types.ts - Add cluster support
export interface ClusterMetadata {
  isCluster: true;
  clusterType: 'puzzle' | 'character' | 'timeline' | 'element';
  childCount: number;
  childIds: string[];
}

export interface ClusterData extends BaseNodeData {
  metadata: ClusterMetadata;
  clustering: ClusterDefinition;
}

export type GraphNode = 
  | CharacterNode
  | PuzzleNode  
  | ElementNode
  | TimelineNode
  | ClusterNode; // New discriminated union member
  
export interface ClusterNode extends Node {
  type: 'cluster';
  data: ClusterData;
}
```

---

## Phase 1: Core Infrastructure (Day 1-2)

### 1.1 Cluster Store (Following filterStore pattern)
```typescript
// src/stores/clusterStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

interface ClusterDefinition {
  id: string;
  label: string;
  clusterType: 'puzzle' | 'character' | 'timeline' | 'element';
  childIds: string[];
  defaultExpanded: boolean;
}

interface ClusterState {
  // State
  expandedClusters: Set<string>;
  clusteringEnabled: boolean;
  clusteringRules: {
    puzzleChains: boolean;
    characterGroups: boolean;
    timelineSequences: boolean;
    minClusterSize: number;
  };
  
  // Computed clusters (memoized)
  clusters: Map<string, ClusterDefinition>;
  
  // Actions (following filterStore naming patterns)
  toggleCluster: (clusterId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  toggleClustering: () => void;
  setClusteringRule: (rule: keyof ClusteringRules, value: boolean) => void;
  computeClusters: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  clearAllClusters: () => void;
  
  // Selection integration methods
  handleNodeSelection: (nodeId: string) => void;
  getSelectableNodes: (nodes: GraphNode[]) => Set<string>;
  isNodeHiddenByCluster: (nodeId: string) => boolean;
}

export const useClusterStore = create<ClusterState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        expandedClusters: new Set(),
        clusteringEnabled: false, // Off by default like timeline
        clusteringRules: {
          puzzleChains: true,
          characterGroups: true,
          timelineSequences: true,
          minClusterSize: 3
        },
        clusters: new Map(),
        
        toggleCluster: (clusterId) => set(state => {
          const expanded = new Set(state.expandedClusters);
          if (expanded.has(clusterId)) {
            expanded.delete(clusterId);
          } else {
            expanded.add(clusterId);
          }
          return { expandedClusters: expanded };
        }),
        
        expandAll: () => set(state => ({
          expandedClusters: new Set(state.clusters.keys())
        })),
        
        collapseAll: () => set({ expandedClusters: new Set() }),
        
        toggleClustering: () => set(state => ({
          clusteringEnabled: !state.clusteringEnabled
        })),
        
        setClusteringRule: (rule, value) => set(state => ({
          clusteringRules: {
            ...state.clusteringRules,
            [rule]: value
          }
        })),
        
        computeClusters: (nodes, edges) => {
          const clusters = new Map();
          const rules = get().clusteringRules;
          
          // Implementation in Phase 2
          
          set({ clusters });
        },
        
        clearAllClusters: () => set({
          expandedClusters: new Set(),
          clusters: new Map()
        }),
        
        // Selection integration
        handleNodeSelection: (nodeId) => {
          const { clusters, expandedClusters } = get();
          for (const [clusterId, cluster] of clusters) {
            if (cluster.childIds.includes(nodeId) && !expandedClusters.has(clusterId)) {
              // Auto-expand cluster when selecting hidden node
              set(state => ({
                expandedClusters: new Set([...state.expandedClusters, clusterId])
              }));
              break;
            }
          }
        },
        
        getSelectableNodes: (nodes) => {
          const { clusters, expandedClusters } = get();
          const selectable = new Set<string>();
          
          // Add cluster nodes
          clusters.forEach((_, clusterId) => selectable.add(clusterId));
          
          // Add visible regular nodes
          nodes.forEach(node => {
            if (!get().isNodeHiddenByCluster(node.id)) {
              selectable.add(node.id);
            }
          });
          
          return selectable;
        },
        
        isNodeHiddenByCluster: (nodeId) => {
          const { clusters, expandedClusters } = get();
          for (const [clusterId, cluster] of clusters) {
            if (cluster.childIds.includes(nodeId) && !expandedClusters.has(clusterId)) {
              return true;
            }
          }
          return false;
        }
      }),
      {
        name: 'cluster-storage',
        storage: createJSONStorage(() => sessionStorage),
        // Custom serialization like filterStore
        partialize: (state) => ({
          ...state,
          expandedClusters: Array.from(state.expandedClusters),
          clusters: Array.from(state.clusters.entries())
        }),
        merge: (persisted: any, current) => ({
          ...current,
          ...persisted,
          expandedClusters: new Set(persisted.expandedClusters || []),
          clusters: new Map(persisted.clusters || [])
        })
      }
    )
  )
);

// Selector hooks following filterStore pattern
export const useClusteringEnabled = () => useClusterStore(state => state.clusteringEnabled);
export const useExpandedClusters = () => useClusterStore(state => state.expandedClusters);
export const useClusters = () => useClusterStore(state => state.clusters);
```

### 1.2 Clustering Engine (Pure functions like lib/graph)
```typescript
// src/lib/graph/clustering/clusterEngine.ts
import type { GraphNode, GraphEdge, EntityType } from '@/lib/graph/types';

export interface ClusteringRules {
  puzzleChains: boolean;
  characterGroups: boolean;
  timelineSequences: boolean;
  minClusterSize: number;
}

// Simple groupBy implementation (no lodash dependency)
function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const key = keyFn(item);
    (groups[key] = groups[key] || []).push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function computePuzzleChains(
  nodes: GraphNode[],
  edges: GraphEdge[],
  minSize: number
): Map<string, ClusterDefinition> {
  const clusters = new Map();
  const puzzleNodes = nodes.filter(n => n.data.metadata.entityType === 'puzzle');
  
  // Find parent-child puzzle relationships
  puzzleNodes.forEach(puzzle => {
    const subPuzzleIds = puzzle.data.metadata.subPuzzleIds || [];
    if (subPuzzleIds.length >= minSize) {
      clusters.set(`cluster-puzzle-${puzzle.id}`, {
        id: `cluster-puzzle-${puzzle.id}`,
        label: `${puzzle.data.label} Chain`,
        clusterType: 'puzzle',
        childIds: [puzzle.id, ...subPuzzleIds],
        defaultExpanded: false
      });
    }
  });
  
  return clusters;
}

export function computeCharacterGroups(
  nodes: GraphNode[],
  edges: GraphEdge[],
  minSize: number
): Map<string, ClusterDefinition> {
  const clusters = new Map();
  
  // Group owned elements with characters using ownership edges
  const ownershipEdges = edges.filter(e => 
    e.data?.relationshipType === 'ownership' || 
    e.data?.relationshipType === 'owner'
  );
  
  const characterOwnership = new Map<string, string[]>();
  
  ownershipEdges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (sourceNode?.data.metadata.entityType === 'character') {
      const owned = characterOwnership.get(sourceNode.id) || [];
      owned.push(targetNode.id);
      characterOwnership.set(sourceNode.id, owned);
    }
  });
  
  characterOwnership.forEach((ownedIds, charId) => {
    if (ownedIds.length >= minSize) {
      const charNode = nodes.find(n => n.id === charId);
      clusters.set(`cluster-char-${charId}`, {
        id: `cluster-char-${charId}`,
        label: `${charNode.data.label}'s Items`,
        clusterType: 'character',
        childIds: ownedIds,
        defaultExpanded: false
      });
    }
  });
  
  return clusters;
}

export function computeTimelineGroups(
  nodes: GraphNode[],
  edges: GraphEdge[],
  minSize: number
): Map<string, ClusterDefinition> {
  const clusters = new Map();
  const timelineNodes = nodes.filter(n => n.data.metadata.entityType === 'timeline');
  
  // Group by date
  const nodesByDate = groupBy(timelineNodes, node => {
    const timeline = node.data.entity as TimelineEvent;
    return timeline.date?.split('T')[0] || 'unknown';
  });
  
  Object.entries(nodesByDate).forEach(([date, dateNodes]) => {
    if (dateNodes.length >= minSize) {
      clusters.set(`cluster-timeline-${date}`, {
        id: `cluster-timeline-${date}`,
        label: `Events: ${date}`,
        clusterType: 'timeline',
        childIds: dateNodes.map(n => n.id),
        defaultExpanded: false
      });
    }
  });
  
  return clusters;
}

export function computeClusters(
  nodes: GraphNode[],
  edges: GraphEdge[],
  rules: ClusteringRules
): Map<string, ClusterDefinition> {
  const allClusters = new Map();
  
  if (rules.puzzleChains) {
    const puzzleClusters = computePuzzleChains(nodes, edges, rules.minClusterSize);
    puzzleClusters.forEach((cluster, id) => allClusters.set(id, cluster));
  }
  
  if (rules.characterGroups) {
    const charClusters = computeCharacterGroups(nodes, edges, rules.minClusterSize);
    charClusters.forEach((cluster, id) => allClusters.set(id, cluster));
  }
  
  if (rules.timelineSequences) {
    const timelineClusters = computeTimelineGroups(nodes, edges, rules.minClusterSize);
    timelineClusters.forEach((cluster, id) => allClusters.set(id, cluster));
  }
  
  return allClusters;
}
```

---

## Phase 2: Layout Integration (Day 3-4)

### 2.0 TanStack Query Integration for Cluster Computation
```typescript
// src/hooks/useClusterComputation.ts
import { useQuery } from '@tanstack/react-query';
import { computeClusters } from '@/lib/graph/clustering/clusterEngine';
import { useClusterStore } from '@/stores/clusterStore';

export function useClusterComputation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  enabled = true
) {
  const { clusteringRules, clusteringEnabled } = useClusterStore();
  
  return useQuery({
    queryKey: ['clusters', nodes.length, edges.length, clusteringRules],
    queryFn: () => computeClusters(nodes, edges, clusteringRules),
    staleTime: 5000, // 5 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
    enabled: enabled && clusteringEnabled && nodes.length > 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });
}

// Usage in GraphView
const { data: computedClusters, isLoading: clustersLoading } = useClusterComputation(
  serverNodes,
  serverEdges
);

// Update store when clusters are computed
useEffect(() => {
  if (computedClusters) {
    useClusterStore.getState().clusters = computedClusters;
  }
}, [computedClusters]);
```

### 2.1 Enhanced Layout with Clustering (Modify existing dagre.ts)
```typescript
// src/lib/graph/layout/dagre.ts - Add new export
export function applyClusterAwareLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  clusters: Map<string, ClusterDefinition>,
  expandedClusters: Set<string>,
  options: PureDagreLayoutOptions = {}
): GraphNode[] {
  // Create cluster nodes
  const clusterNodes: GraphNode[] = Array.from(clusters.values()).map(cluster => ({
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
      clustering: {
        isCluster: true,
        clusterType: cluster.clusterType,
        childIds: cluster.childIds,
        childCount: cluster.childIds.length,
        // Preview data for collapsed state
        childPreviews: cluster.childIds.slice(0, 3).map(id => {
          const node = nodes.find(n => n.id === id);
          return {
            type: node?.data.metadata.entityType,
            label: node?.data.label
          };
        })
      }
    },
    width: 250, // Wider for cluster
    height: expandedClusters.has(cluster.id) ? 80 : 120 // Taller when collapsed for preview
  }));
  
  // Separate visible and hidden nodes
  const hiddenNodeIds = new Set<string>();
  clusters.forEach((cluster, clusterId) => {
    if (!expandedClusters.has(clusterId)) {
      cluster.childIds.forEach(id => hiddenNodeIds.add(id));
    }
  });
  
  const visibleNodes = nodes.filter(n => !hiddenNodeIds.has(n.id));
  const allVisibleNodes = [...clusterNodes, ...visibleNodes];
  
  // Create aggregated edges for collapsed clusters
  const aggregatedEdges = createAggregatedEdges(
    edges,
    clusters,
    expandedClusters,
    hiddenNodeIds
  );
  
  // Layout visible nodes with existing Dagre
  const layoutedNodes = applyPureDagreLayout(allVisibleNodes, aggregatedEdges, options);
  
  // Position hidden nodes relative to their cluster parent
  const hiddenNodes = nodes.filter(n => hiddenNodeIds.has(n.id)).map(node => {
    const parentCluster = findParentCluster(node.id, clusters);
    if (parentCluster) {
      const parentNode = layoutedNodes.find(n => n.id === parentCluster.id);
      if (parentNode) {
        return {
          ...node,
          position: {
            x: parentNode.position.x + 10, // Slightly offset
            y: parentNode.position.y + 10
          },
          hidden: true // React Flow will hide these
        };
      }
    }
    return node;
  });
  
  return [...layoutedNodes, ...hiddenNodes];
}

function createAggregatedEdges(
  edges: GraphEdge[],
  clusters: Map<string, ClusterDefinition>,
  expandedClusters: Set<string>,
  hiddenNodeIds: Set<string>
): GraphEdge[] {
  const aggregatedEdges: GraphEdge[] = [];
  const edgeGroups = new Map<string, GraphEdge[]>();
  
  edges.forEach(edge => {
    const sourceHidden = hiddenNodeIds.has(edge.source);
    const targetHidden = hiddenNodeIds.has(edge.target);
    
    if (!sourceHidden && !targetHidden) {
      // Both visible - keep edge as-is
      aggregatedEdges.push(edge);
    } else if (sourceHidden && !targetHidden) {
      // Source in cluster, target visible
      const cluster = findParentCluster(edge.source, clusters);
      if (cluster) {
        const key = `${cluster.id}-${edge.target}`;
        const group = edgeGroups.get(key) || [];
        group.push(edge);
        edgeGroups.set(key, group);
      }
    } else if (!sourceHidden && targetHidden) {
      // Source visible, target in cluster
      const cluster = findParentCluster(edge.target, clusters);
      if (cluster) {
        const key = `${edge.source}-${cluster.id}`;
        const group = edgeGroups.get(key) || [];
        group.push(edge);
        edgeGroups.set(key, group);
      }
    }
  });
  
  // Create aggregated edges with badges
  edgeGroups.forEach((edges, key) => {
    const [source, target] = key.split('-');
    aggregatedEdges.push({
      id: `aggregated-${key}`,
      source,
      target,
      type: 'aggregated',
      data: {
        relationshipType: 'aggregated',
        weight: Math.max(...edges.map(e => e.data?.weight || 1)),
        edgeCount: edges.length,
        label: edges.length > 1 ? `${edges.length} connections` : undefined
      },
      style: {
        strokeWidth: Math.min(edges.length, 5),
        stroke: '#94a3b8'
      }
    });
  });
  
  return aggregatedEdges;
}

function findParentCluster(
  nodeId: string,
  clusters: Map<string, ClusterDefinition>
): ClusterDefinition | undefined {
  for (const cluster of clusters.values()) {
    if (cluster.childIds.includes(nodeId)) {
      return cluster;
    }
  }
  return undefined;
}
```

### 2.2 Enhanced Visibility Hook
```typescript
// src/hooks/graph/useGraphVisibility.ts - Enhance existing
import { useClusterStore } from '@/stores/clusterStore';

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
```

---

## Phase 3: UI Components (Day 5)

### 3.1 Cluster Node Component
```typescript
// src/components/graph/nodes/ClusterNode.tsx
import { memo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useClusterStore } from '@/stores/clusterStore';

interface ClusterNodeProps {
  id: string;
  data: {
    label: string;
    clustering: {
      isCluster: boolean;
      clusterType: 'puzzle' | 'character' | 'timeline' | 'element';
      childIds: string[];
      childCount: number;
      childPreviews?: Array<{
        type: string;
        label: string;
      }>;
    };
    aggregatedEdges?: {
      count: number;
    };
  };
}

const ClusterNode = memo(({ id, data }: ClusterNodeProps) => {
  const expandedClusters = useClusterStore(state => state.expandedClusters);
  const toggleCluster = useClusterStore(state => state.toggleCluster);
  const isExpanded = expandedClusters.has(id);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCluster(id);
  }, [id, toggleCluster]);
  
  return (
    <div
      data-testid={`node-${id}`}
      className={cn(
        "cluster-node relative bg-white/90 backdrop-blur",
        "border-2 rounded-lg p-3 min-w-[200px] shadow-lg",
        "transition-all duration-200 hover:shadow-xl",
        // Type-specific styling
        data.clustering.clusterType === 'puzzle' && "border-purple-400 bg-purple-50/90",
        data.clustering.clusterType === 'character' && "border-blue-400 bg-blue-50/90",
        data.clustering.clusterType === 'timeline' && "border-green-400 bg-green-50/90",
        data.clustering.clusterType === 'element' && "border-amber-400 bg-amber-50/90",
        // State styling
        isExpanded ? "border-solid" : "border-dashed"
      )}
    >
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
      
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handleClick}
          className="flex items-center gap-1 hover:bg-black/5 rounded px-1 -ml-1 transition-colors"
          aria-label={isExpanded ? "Collapse cluster" : "Expand cluster"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="font-semibold text-sm">{data.label}</span>
        </button>
        
        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3 text-gray-500" />
          <Badge variant="secondary" className="text-xs">
            {data.clustering.childCount}
          </Badge>
        </div>
      </div>
      
      {/* Collapsed preview */}
      {!isExpanded && data.clustering.childPreviews && (
        <div className="flex gap-1 mt-2">
          {data.clustering.childPreviews.slice(0, 3).map((child, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-8 rounded border flex items-center justify-center text-xs",
                child.type === 'puzzle' && "bg-purple-200 border-purple-300",
                child.type === 'character' && "bg-blue-200 border-blue-300",
                child.type === 'element' && "bg-amber-200 border-amber-300",
                child.type === 'timeline' && "bg-green-200 border-green-300"
              )}
              title={child.label}
            >
              {child.label[0]}
            </div>
          ))}
          {data.clustering.childCount > 3 && (
            <div className="w-8 h-8 rounded border bg-gray-100 border-gray-300 flex items-center justify-center text-xs text-gray-600">
              +{data.clustering.childCount - 3}
            </div>
          )}
        </div>
      )}
      
      {/* Edge aggregation badge */}
      {data.aggregatedEdges && data.aggregatedEdges.count > 0 && (
        <div className="absolute -right-2 -top-2 bg-white rounded-full border shadow-sm">
          <Badge size="sm" variant="outline" className="text-xs">
            {data.aggregatedEdges.count}
          </Badge>
        </div>
      )}
    </div>
  );
});

ClusterNode.displayName = 'ClusterNode';
export default ClusterNode;
```

### 3.2 Cluster Controls Component
```typescript
// src/components/sidebar/ClusterControls.tsx
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Layers, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClusterStore } from '@/stores/clusterStore';
import { useUIStore } from '@/stores/uiStore';

export function ClusterControls() {
  const {
    clusteringEnabled,
    toggleClustering,
    expandAll,
    collapseAll,
    clusteringRules,
    setClusteringRule,
    clusters
  } = useClusterStore();
  
  const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed);
  const isOpen = !sidebarCollapsed;
  
  // Collapsed sidebar view
  if (!isOpen) {
    return (
      <div className="px-3 py-2">
        <Button
          size="icon"
          variant={clusteringEnabled ? "default" : "ghost"}
          onClick={toggleClustering}
          title="Toggle clustering"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  // Full sidebar view
  return (
    <div className="space-y-2">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1">
          <Layers className="h-3 w-3" />
          Clustering
        </Label>
        <Switch
          checked={clusteringEnabled}
          onCheckedChange={toggleClustering}
          aria-label="Toggle clustering"
        />
      </div>
      
      {/* Controls - only shown when enabled */}
      {clusteringEnabled && (
        <div className={cn(
          "space-y-2 pl-4 transition-all duration-200",
          !clusteringEnabled && "opacity-50 pointer-events-none"
        )}>
          {/* Expand/Collapse buttons */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={expandAll}
              className="flex-1"
              disabled={clusters.size === 0}
            >
              <Maximize2 className="h-3 w-3 mr-1" />
              Expand
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={collapseAll}
              className="flex-1"
              disabled={clusters.size === 0}
            >
              <Minimize2 className="h-3 w-3 mr-1" />
              Collapse
            </Button>
          </div>
          
          {/* Clustering rules */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="puzzleChains"
                checked={clusteringRules.puzzleChains}
                onCheckedChange={(checked) => 
                  setClusteringRule('puzzleChains', !!checked)
                }
              />
              <Label
                htmlFor="puzzleChains"
                className="text-xs cursor-pointer"
              >
                Puzzle chains
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="characterGroups"
                checked={clusteringRules.characterGroups}
                onCheckedChange={(checked) => 
                  setClusteringRule('characterGroups', !!checked)
                }
              />
              <Label
                htmlFor="characterGroups"
                className="text-xs cursor-pointer"
              >
                Character items
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="timelineSequences"
                checked={clusteringRules.timelineSequences}
                onCheckedChange={(checked) => 
                  setClusteringRule('timelineSequences', !!checked)
                }
              />
              <Label
                htmlFor="timelineSequences"
                className="text-xs cursor-pointer"
              >
                Timeline groups
              </Label>
            </div>
          </div>
          
          {/* Cluster count */}
          {clusters.size > 0 && (
            <div className="text-xs text-muted-foreground">
              {clusters.size} cluster{clusters.size !== 1 ? 's' : ''} created
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Phase 4: Integration (Day 6)

### 4.1 GraphView Integration
```typescript
// src/components/graph/GraphView.tsx - Modifications

// Line 47 - Import cluster components
import ClusterNode from './nodes/ClusterNode';
import { useClusterStore } from '@/stores/clusterStore';
import { applyClusterAwareLayout } from '@/lib/graph/layout/dagre';
import { computeClusters } from '@/lib/graph/clustering/clusterEngine';

// Line 92 - Add cluster node type
const nodeTypes = {
  puzzle: withTestId(PuzzleNode),
  character: withTestId(CharacterNode),
  element: withTestId(ElementNode),
  timeline: withTestId(TimelineNode),
  cluster: withTestId(ClusterNode), // NEW
};

// Inside GraphViewContent component (around line 284)
// Add clustering state
const { 
  clusteringEnabled, 
  expandedClusters, 
  clusteringRules,
  computeClusters: updateClusters 
} = useClusterStore();

// Compute clusters when nodes/edges change
useEffect(() => {
  if (clusteringEnabled && serverNodes.length > 0) {
    const clusters = computeClusters(serverNodes, serverEdges, clusteringRules);
    updateClusters(serverNodes, serverEdges);
  }
}, [serverNodes, serverEdges, clusteringEnabled, clusteringRules, updateClusters]);

// Modify useGraphLayout call (line 284)
const { layoutedNodes, filteredEdges, totalUniverseNodes } = useGraphLayout({
  nodes: serverNodes,
  edges: serverEdges,
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
  // NEW - Clustering parameters
  clusteringEnabled,
  expandedClusters,
  clusteringRules
});
```

### 4.2 Sidebar Integration
```typescript
// src/components/layout/Sidebar.tsx - Line 14
import { ClusterControls } from '../sidebar/ClusterControls';

// Line 78 - Add after DepthSlider
<DepthSlider />
<Separator className="my-2 opacity-30" />
<ClusterControls />
```

### 4.3 Enhanced useGraphLayout Hook
```typescript
// src/hooks/useGraphLayout.ts - Enhance to support clustering
import { useClusterStore } from '@/stores/clusterStore';
import { computeClusters } from '@/lib/graph/clustering/clusterEngine';
import { applyClusterAwareLayout } from '@/lib/graph/layout/dagre';

export function useGraphLayout({
  nodes,
  edges,
  viewConfig,
  // ... existing params
  clusteringEnabled,
  expandedClusters,
  clusteringRules
}: UseGraphLayoutParams & {
  clusteringEnabled?: boolean;
  expandedClusters?: Set<string>;
  clusteringRules?: ClusteringRules;
}): UseGraphLayoutResult {
  
  return useMemo(() => {
    // ... existing filtering logic
    
    // Compute clusters if enabled
    let clusters = new Map();
    if (clusteringEnabled && clusteringRules) {
      clusters = computeClusters(filteredNodes, edges, clusteringRules);
    }
    
    // Apply layout
    let layoutedNodes: GraphNode[];
    if (clusteringEnabled && clusters.size > 0) {
      layoutedNodes = applyClusterAwareLayout(
        filteredNodes,
        edges,
        clusters,
        expandedClusters || new Set(),
        layoutOptions
      );
    } else {
      layoutedNodes = applyPureDagreLayout(filteredNodes, edges, layoutOptions);
    }
    
    // ... rest of existing logic
    
    return { layoutedNodes, filteredEdges, totalUniverseNodes };
  }, [
    nodes,
    edges,
    viewConfig,
    // ... existing deps
    clusteringEnabled,
    expandedClusters,
    clusteringRules
  ]);
}
```

---

## Phase 5: Testing (Day 7)

### 5.1 Unit Tests
```typescript
// src/lib/graph/clustering/clusterEngine.test.ts
import { describe, test, expect } from 'vitest';
import { computePuzzleChains, computeCharacterGroups, computeTimelineGroups } from './clusterEngine';

describe('Clustering Engine', () => {
  describe('computePuzzleChains', () => {
    test('groups puzzles with sub-puzzles', () => {
      const nodes = [
        createTestNode('puzzle-1', 'puzzle', { subPuzzleIds: ['puzzle-2', 'puzzle-3'] }),
        createTestNode('puzzle-2', 'puzzle'),
        createTestNode('puzzle-3', 'puzzle')
      ];
      
      const clusters = computePuzzleChains(nodes, [], 2);
      
      expect(clusters.size).toBe(1);
      expect(clusters.get('cluster-puzzle-puzzle-1')).toMatchObject({
        clusterType: 'puzzle',
        childIds: expect.arrayContaining(['puzzle-1', 'puzzle-2', 'puzzle-3'])
      });
    });
    
    test('respects minimum size threshold', () => {
      const nodes = [
        createTestNode('puzzle-1', 'puzzle', { subPuzzleIds: ['puzzle-2'] })
      ];
      
      const clusters = computePuzzleChains(nodes, [], 3);
      expect(clusters.size).toBe(0);
    });
  });
  
  describe('computeCharacterGroups', () => {
    test('groups owned elements with characters', () => {
      const nodes = [
        createTestNode('char-1', 'character'),
        createTestNode('elem-1', 'element'),
        createTestNode('elem-2', 'element'),
        createTestNode('elem-3', 'element')
      ];
      
      const edges = [
        createTestEdge('char-1', 'elem-1', 'ownership'),
        createTestEdge('char-1', 'elem-2', 'ownership'),
        createTestEdge('char-1', 'elem-3', 'ownership')
      ];
      
      const clusters = computeCharacterGroups(nodes, edges, 3);
      
      expect(clusters.size).toBe(1);
      expect(clusters.get('cluster-char-char-1')).toMatchObject({
        clusterType: 'character',
        childIds: expect.arrayContaining(['elem-1', 'elem-2', 'elem-3'])
      });
    });
  });
});
```

### 5.2 Integration Tests
```typescript
// src/components/graph/nodes/ClusterNode.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import ClusterNode from './ClusterNode';
import { useClusterStore } from '@/stores/clusterStore';

vi.mock('@/stores/clusterStore');

describe('ClusterNode', () => {
  test('renders cluster information', () => {
    const mockData = {
      label: 'Test Cluster',
      clustering: {
        isCluster: true,
        clusterType: 'puzzle',
        childIds: ['node-1', 'node-2', 'node-3'],
        childCount: 3
      }
    };
    
    render(
      <ReactFlowProvider>
        <ClusterNode id="cluster-1" data={mockData} />
      </ReactFlowProvider>
    );
    
    expect(screen.getByText('Test Cluster')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
  
  test('toggles expansion on click', () => {
    const toggleCluster = vi.fn();
    vi.mocked(useClusterStore).mockReturnValue({
      expandedClusters: new Set(),
      toggleCluster
    });
    
    render(
      <ReactFlowProvider>
        <ClusterNode id="cluster-1" data={mockData} />
      </ReactFlowProvider>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /expand cluster/i }));
    expect(toggleCluster).toHaveBeenCalledWith('cluster-1');
  });
});
```

### 5.3 E2E Tests
```typescript
// tests/e2e/clustering.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Node Clustering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/graph');
    await page.waitForSelector('[data-testid^="node-"]');
  });
  
  test('enables clustering from sidebar', async ({ page }) => {
    // Find clustering toggle
    const clusterToggle = page.locator('text=Clustering').locator('..//input[@role="switch"]');
    
    // Enable clustering
    await clusterToggle.click();
    
    // Verify cluster nodes appear
    await expect(page.locator('[data-testid^="node-cluster-"]').first()).toBeVisible();
  });
  
  test('expands and collapses clusters', async ({ page }) => {
    // Enable clustering
    await page.locator('text=Clustering').locator('..//input[@role="switch"]').click();
    
    // Find a cluster node
    const cluster = page.locator('[data-testid^="node-cluster-"]').first();
    await expect(cluster).toBeVisible();
    
    // Click to expand
    await cluster.click();
    
    // Wait for animation
    await page.waitForTimeout(350);
    
    // Verify children are visible
    const childrenCount = await page.locator('[data-testid^="node-"]:not([data-testid*="cluster"])').count();
    expect(childrenCount).toBeGreaterThan(0);
    
    // Click to collapse
    await cluster.click();
    await page.waitForTimeout(350);
    
    // Verify children are hidden
    const visibleChildren = await page.locator('[data-testid^="node-"]:not([data-testid*="cluster"]):visible').count();
    expect(visibleChildren).toBeLessThan(childrenCount);
  });
  
  test('respects clustering rules', async ({ page }) => {
    // Enable clustering
    await page.locator('text=Clustering').locator('..//input[@role="switch"]').click();
    
    // Disable puzzle chains
    await page.locator('text=Puzzle chains').locator('..//input[@type="checkbox"]').uncheck();
    
    // Verify puzzle clusters are removed
    await expect(page.locator('[data-testid*="cluster-puzzle"]')).not.toBeVisible();
    
    // Character and timeline clusters should still be visible
    await expect(page.locator('[data-testid*="cluster-char"]')).toBeVisible();
  });
  
  test('integrates with selection system', async ({ page }) => {
    // Enable clustering
    await page.locator('text=Clustering').locator('..//input[@role="switch"]').click();
    
    // Test Cmd+A selects visible nodes and clusters
    await page.keyboard.press('Meta+A');
    const selectedNodes = await page.locator('.selected').count();
    const visibleNodes = await page.locator('[data-testid^="node-"]:visible').count();
    expect(selectedNodes).toBe(visibleNodes);
    
    // Test selecting collapsed cluster doesn't select hidden children
    const cluster = page.locator('[data-testid^="node-cluster-"]:not(.expanded)').first();
    await cluster.click();
    
    // Verify only cluster is selected, not hidden children
    const clusterSelected = await cluster.evaluate(el => el.classList.contains('selected'));
    expect(clusterSelected).toBe(true);
    
    // Expand cluster and verify children maintain selection state
    await cluster.click(); // Toggle expansion
    await page.waitForTimeout(350);
    
    // Children should not be automatically selected
    const childrenSelected = await page.locator('[data-testid^="node-"]:not([data-testid*="cluster"]).selected').count();
    expect(childrenSelected).toBe(0);
  });
  
  test('handles clipboard with clusters', async ({ page }) => {
    // Enable clustering
    await page.locator('text=Clustering').locator('..//input[@role="switch"]').click();
    
    // Select a cluster
    const cluster = page.locator('[data-testid^="node-cluster-"]').first();
    await cluster.click();
    
    // Copy to clipboard
    await page.keyboard.press('Meta+C');
    
    // Verify clipboard operation succeeded (check for toast notification)
    await expect(page.locator('text=Copied')).toBeVisible();
  });
});
```

---

## Success Metrics & Validation

### Validation Checklist

✅ **Selection System Integration** - Works seamlessly with unified selection (Cmd+A, multi-select, clipboard)  
✅ **No breaking changes** - All existing functionality preserved  
✅ **Follows existing patterns** - filterStore, useGraphLayout, sidebar structure  
✅ **TanStack Query integration** - Uses existing caching infrastructure  
✅ **TypeScript support** - Proper discriminated unions and type safety  
✅ **Avoids Dagre issues** - Two-pass layout instead of compound graphs  
✅ **Proper Set/Map serialization** - Array conversion like filterStore  
✅ **Complete test coverage** - Unit, integration, and E2E tests including selection scenarios  
✅ **Edge aggregation** - Count badges and visual grouping  
✅ **User control** - Toggleable rules, expand/collapse all, keyboard shortcuts  
✅ **Accessibility** - Full keyboard navigation and ARIA labels  

### Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 0 | Prerequisite | Selection System Coordination |
| Phase 1 | Day 1-2 | ClusterStore with Selection Handling |
| Phase 2 | Day 3-4 | TanStack Query & Layout Integration |
| Phase 3 | Day 5 | ClusterNode, ClusterControls Components |
| Phase 4 | Day 6 | GraphView & Sidebar Integration |
| Phase 5 | Day 7 | Complete Test Suite with Selection Tests |

### Risk Mitigation

1. **Selection conflicts**: Coordinate with unified selection work first
2. **Layout jumps**: Two-pass layout prevents instability
3. **State sync**: Zustand subscribeWithSelector for efficient updates
4. **Testing**: MSW handlers for cluster data structures
5. **Accessibility**: ARIA labels, keyboard navigation support
6. **Over-engineering**: Focus on UX for 50-100 nodes, not performance

## Key Architecture Decisions

1. **Client-side clustering**: Maximum flexibility, no server changes required
2. **Two-pass layout**: Avoids Dagre compound graph bugs proactively
3. **Zustand store**: Consistent with existing state management patterns
4. **TanStack Query**: Leverages existing caching infrastructure for expensive computations
5. **Selection integration**: Full compatibility with unified selection system
6. **Cluster-aware visibility**: Enhanced hook handles parent-child relationships
7. **Edge aggregation**: Visual badges for collapsed cluster connections

## UI Integration Points

1. **Sidebar**: ClusterControls after DepthSlider
2. **GraphView**: Extended useGraphLayout with clustering state via TanStack Query
3. **Node Types**: Register ClusterNode component with proper TypeScript
4. **Existing Filters**: Work alongside clustering (orthogonal features)
5. **Selection System**: Full integration with useGraphInteractions

## Important Notes

- **Internal Tool Focus**: Optimized for 2-3 users with ~50-100 nodes
- **Selection Priority**: Must coordinate with ongoing unified selection work
- **No Over-Engineering**: Removed performance monitoring and 400-500 node targets
- **User Experience**: Focus on organization and navigation, not performance

This plan is **ready for implementation** after coordinating with the unified selection system work.