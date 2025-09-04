import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ClusterDefinition, GraphNode } from '@/lib/graph/types';
import type { Edge } from '@xyflow/react';
import { computeClusters } from '@/lib/graph/clustering/clusterEngine';

interface ClusteringRules {
  puzzleChains: boolean;
  characterGroups: boolean;
  timelineSequences: boolean;
  minClusterSize: number;
}

interface ClusterState {
  // State
  expandedClusters: Set<string>;
  clusteringEnabled: boolean;
  clusteringRules: ClusteringRules;

  // Computed clusters (memoized)
  clusters: Map<string, ClusterDefinition>;

  // Actions (following filterStore naming patterns)
  toggleCluster: (clusterId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  toggleClustering: () => void;
  setClusteringRule: (rule: keyof ClusteringRules, value: boolean | number) => void;
  updateClusters: (nodes: GraphNode[], edges: Edge[]) => void;
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

        updateClusters: (nodes, edges) => {
          const { clusteringRules, clusteringEnabled } = get();
          if (!clusteringEnabled) {
            set({ clusters: new Map() });
            return;
          }
          const newClusters = computeClusters(nodes, edges, clusteringRules);
          set({ clusters: newClusters });
        },

        clearAllClusters: () => set({
          expandedClusters: new Set(),
          clusters: new Map()
        }),

        // Selection integration
        handleNodeSelection: (nodeId) => {
          const { clusters, expandedClusters, toggleCluster } = get();
          for (const [clusterId, cluster] of clusters) {
            if (cluster.childIds.includes(nodeId) && !expandedClusters.has(clusterId)) {
              // Auto-expand cluster when selecting hidden node
              toggleCluster(clusterId);
              break;
            }
          }
        },

        getSelectableNodes: (nodes) => {
          const { clusters, isNodeHiddenByCluster } = get();
          const selectable = new Set<string>();

          // Add cluster nodes
          clusters.forEach((_, clusterId) => selectable.add(clusterId));

          // Add visible regular nodes
          nodes.forEach(node => {
            if (!isNodeHiddenByCluster(node.id)) {
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
export const useClusteringRules = () => useClusterStore(state => state.clusteringRules);
