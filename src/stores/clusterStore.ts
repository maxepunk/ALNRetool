import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GraphNode, GraphEdge, ClusterDefinition } from '@/lib/graph/types';

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

  // Computed clusters
  clusters: Map<string, ClusterDefinition>;

  // Actions
  toggleCluster: (clusterId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  toggleClustering: () => void;
  setClusteringRule: (rule: keyof ClusteringRules, value: boolean | number) => void;
  setClusters: (clusters: Map<string, ClusterDefinition>) => void;
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
        clusteringEnabled: false,
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

        expandAll: () => set(state => {
            if (state.clusters.size > 0) {
                return { expandedClusters: new Set(state.clusters.keys()) };
            }
            return {};
        }),

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

        setClusters: (clusters) => set({ clusters }),

        clearAllClusters: () => set({
          expandedClusters: new Set(),
          clusters: new Map()
        }),

        // Selection integration
        handleNodeSelection: (nodeId) => {
          const { clusters, expandedClusters, toggleCluster } = get();
          for (const [clusterId, cluster] of clusters.entries()) {
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
          for (const [clusterId, cluster] of clusters.entries()) {
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

// Selector hooks
export const useClusteringEnabled = () => useClusterStore(state => state.clusteringEnabled);
export const useExpandedClusters = () => useClusterStore(state => state.expandedClusters);
export const useClusters = () => useClusterStore(state => state.clusters);
export const useClusteringRules = () => useClusterStore(state => state.clusteringRules);
