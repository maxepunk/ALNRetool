/**
 * Graph Store - Graph visualization state and controls
 * 
 * Manages zoom levels, layout algorithms, node/edge visibility, and performance settings.
 * Does not persist as these are view-specific runtime states.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Node, Edge } from '@xyflow/react';

export type LayoutAlgorithm = 'dagre' | 'force' | 'circular' | 'hierarchical';
export type NodeSizeMode = 'uniform' | 'dynamic' | 'compact';

export interface GraphState {
  // Zoom and viewport
  zoomLevel: number;
  minZoom: number;
  maxZoom: number;
  fitViewPadding: number;
  
  // Layout settings
  layoutAlgorithm: LayoutAlgorithm;
  layoutDirection: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSeparation: number;
  rankSeparation: number;
  
  // Node settings
  nodeSize: NodeSizeMode;
  showNodeLabels: boolean;
  showNodeIcons: boolean;
  
  // Edge settings
  showEdgeLabels: boolean;
  animateEdges: boolean;
  edgeCurvature: 'straight' | 'smooth' | 'step';
  
  // Performance settings
  performanceMode: boolean;
  maxVisibleNodes: number;
  enableClustering: boolean;
  clusterThreshold: number;
  
  // Selection state
  selectedNodes: Set<string>;
  selectedEdges: Set<string>;
  hoveredNodeId: string | null;
  hoveredEdgeId: string | null;
  
  // Graph data cache (for performance)
  cachedNodes: Node[] | null;
  cachedEdges: Edge[] | null;
  lastLayoutTimestamp: number | null;
}export interface GraphActions {
  // Zoom actions
  setZoomLevel: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitView: () => void;
  
  // Layout actions
  setLayoutAlgorithm: (algorithm: LayoutAlgorithm) => void;
  setLayoutDirection: (direction: 'TB' | 'BT' | 'LR' | 'RL') => void;
  setNodeSeparation: (separation: number) => void;
  setRankSeparation: (separation: number) => void;
  triggerRelayout: () => void;
  
  // Node actions
  setNodeSize: (size: NodeSizeMode) => void;
  toggleNodeLabels: () => void;
  toggleNodeIcons: () => void;
  selectNode: (nodeId: string, multi?: boolean) => void;
  deselectNode: (nodeId: string) => void;
  clearNodeSelection: () => void;
  
  // Edge actions
  toggleEdgeLabels: () => void;
  toggleEdgeAnimation: () => void;
  setEdgeCurvature: (curvature: 'straight' | 'smooth' | 'step') => void;
  selectEdge: (edgeId: string, multi?: boolean) => void;
  deselectEdge: (edgeId: string) => void;
  clearEdgeSelection: () => void;
  
  // Hover actions
  setHoveredNode: (nodeId: string | null) => void;
  setHoveredEdge: (edgeId: string | null) => void;
  
  // Performance actions
  togglePerformanceMode: () => void;
  setMaxVisibleNodes: (max: number) => void;
  toggleClustering: () => void;
  setClusterThreshold: (threshold: number) => void;
  
  // Cache actions
  updateGraphCache: (nodes: Node[], edges: Edge[]) => void;
  clearGraphCache: () => void;
  
  // Batch actions
  applyGraphPreset: (preset: 'overview' | 'detailed' | 'compact' | 'performance') => void;
  resetGraphSettings: () => void;
}// Computed values
export interface GraphComputedValues {
  hasSelection: () => boolean;
  getSelectionCount: () => { nodes: number; edges: number };
  isNodeSelected: (nodeId: string) => boolean;
  isEdgeSelected: (edgeId: string) => boolean;
  shouldEnablePerformance: (nodeCount: number) => boolean;
}

type GraphStore = GraphState & GraphActions & GraphComputedValues;

const defaultGraphState: GraphState = {
  zoomLevel: 1,
  minZoom: 0.1,
  maxZoom: 4,
  fitViewPadding: 0.2,
  layoutAlgorithm: 'dagre',
  layoutDirection: 'LR',
  nodeSeparation: 100,
  rankSeparation: 300,
  nodeSize: 'uniform',
  showNodeLabels: true,
  showNodeIcons: true,
  showEdgeLabels: false,
  animateEdges: true,
  edgeCurvature: 'smooth',
  performanceMode: false,
  maxVisibleNodes: 500,
  enableClustering: false,
  clusterThreshold: 50,
  selectedNodes: new Set(),
  selectedEdges: new Set(),
  hoveredNodeId: null,
  hoveredEdgeId: null,
  cachedNodes: null,
  cachedEdges: null,
  lastLayoutTimestamp: null,
};/**
 * Main graph store without persistence (runtime state only)
 */
export const useGraphStore = create<GraphStore>()(
  subscribeWithSelector(
    (set, get) => ({
      ...defaultGraphState,

      // Zoom actions
      setZoomLevel: (zoom) => set({ 
        zoomLevel: Math.max(get().minZoom, Math.min(get().maxZoom, zoom)) 
      }),
      zoomIn: () => set((state) => ({ 
        zoomLevel: Math.min(state.maxZoom, state.zoomLevel * 1.2) 
      })),
      zoomOut: () => set((state) => ({ 
        zoomLevel: Math.max(state.minZoom, state.zoomLevel / 1.2) 
      })),
      resetZoom: () => set({ zoomLevel: 1 }),
      fitView: () => {
        // This would typically trigger a React Flow fitView call
        // Just update our state to indicate the intent
        set({ zoomLevel: 1 });
      },

      // Layout actions
      setLayoutAlgorithm: (algorithm) => set({ 
        layoutAlgorithm: algorithm,
        lastLayoutTimestamp: Date.now()
      }),
      setLayoutDirection: (direction) => set({ 
        layoutDirection: direction,
        lastLayoutTimestamp: Date.now()
      }),
      setNodeSeparation: (separation) => set({ nodeSeparation: separation }),
      setRankSeparation: (separation) => set({ rankSeparation: separation }),
      triggerRelayout: () => set({ lastLayoutTimestamp: Date.now() }),      // Node actions
      setNodeSize: (size) => set({ nodeSize: size }),
      toggleNodeLabels: () => set((state) => ({ showNodeLabels: !state.showNodeLabels })),
      toggleNodeIcons: () => set((state) => ({ showNodeIcons: !state.showNodeIcons })),
      selectNode: (nodeId, multi = false) => set((state) => {
        const newSelection = multi ? new Set(state.selectedNodes) : new Set<string>();
        newSelection.add(nodeId);
        return { selectedNodes: newSelection };
      }),
      deselectNode: (nodeId) => set((state) => {
        const newSelection = new Set(state.selectedNodes);
        newSelection.delete(nodeId);
        return { selectedNodes: newSelection };
      }),
      clearNodeSelection: () => set({ selectedNodes: new Set() }),

      // Edge actions
      toggleEdgeLabels: () => set((state) => ({ showEdgeLabels: !state.showEdgeLabels })),
      toggleEdgeAnimation: () => set((state) => ({ animateEdges: !state.animateEdges })),
      setEdgeCurvature: (curvature) => set({ edgeCurvature: curvature }),
      selectEdge: (edgeId, multi = false) => set((state) => {
        const newSelection = multi ? new Set(state.selectedEdges) : new Set<string>();
        newSelection.add(edgeId);
        return { selectedEdges: newSelection };
      }),
      deselectEdge: (edgeId) => set((state) => {
        const newSelection = new Set(state.selectedEdges);
        newSelection.delete(edgeId);
        return { selectedEdges: newSelection };
      }),
      clearEdgeSelection: () => set({ selectedEdges: new Set() }),      // Hover actions
      setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),
      setHoveredEdge: (edgeId) => set({ hoveredEdgeId: edgeId }),

      // Performance actions
      togglePerformanceMode: () => set((state) => ({ 
        performanceMode: !state.performanceMode 
      })),
      setMaxVisibleNodes: (max) => set({ maxVisibleNodes: max }),
      toggleClustering: () => set((state) => ({ 
        enableClustering: !state.enableClustering 
      })),
      setClusterThreshold: (threshold) => set({ clusterThreshold: threshold }),

      // Cache actions
      updateGraphCache: (nodes, edges) => set({ 
        cachedNodes: nodes,
        cachedEdges: edges,
        lastLayoutTimestamp: Date.now()
      }),
      clearGraphCache: () => set({ 
        cachedNodes: null,
        cachedEdges: null 
      }),      // Batch actions
      applyGraphPreset: (preset) => {
        switch (preset) {
          case 'overview':
            set({
              zoomLevel: 0.5,
              nodeSize: 'compact',
              showNodeLabels: false,
              showEdgeLabels: false,
              animateEdges: false,
              performanceMode: true,
            });
            break;
          case 'detailed':
            set({
              zoomLevel: 1.5,
              nodeSize: 'dynamic',
              showNodeLabels: true,
              showNodeIcons: true,
              showEdgeLabels: true,
              animateEdges: true,
              performanceMode: false,
            });
            break;
          case 'compact':
            set({
              nodeSeparation: 50,
              rankSeparation: 150,
              nodeSize: 'compact',
              showNodeIcons: false,
            });
            break;
          case 'performance':
            set({
              performanceMode: true,
              animateEdges: false,
              showEdgeLabels: false,
              enableClustering: true,
              maxVisibleNodes: 200,
            });
            break;
        }
      },
      resetGraphSettings: () => set(defaultGraphState),      // Computed values
      hasSelection: () => {
        const state = get();
        return state.selectedNodes.size > 0 || state.selectedEdges.size > 0;
      },
      getSelectionCount: () => {
        const state = get();
        return {
          nodes: state.selectedNodes.size,
          edges: state.selectedEdges.size,
        };
      },
      isNodeSelected: (nodeId) => get().selectedNodes.has(nodeId),
      isEdgeSelected: (edgeId) => get().selectedEdges.has(edgeId),
      shouldEnablePerformance: (nodeCount) => {
        const state = get();
        return nodeCount > state.maxVisibleNodes || state.performanceMode;
      },
    })
  )
);

// Selector hooks for common use cases
export const useZoomLevel = () => useGraphStore(state => state.zoomLevel);
export const useLayoutAlgorithm = () => useGraphStore(state => state.layoutAlgorithm);
export const useSelectedNodes = () => useGraphStore(state => state.selectedNodes);
export const useSelectedEdges = () => useGraphStore(state => state.selectedEdges);
export const usePerformanceMode = () => useGraphStore(state => state.performanceMode);
export const useHoveredNodeId = () => useGraphStore(state => state.hoveredNodeId);
export const useHoveredEdgeId = () => useGraphStore(state => state.hoveredEdgeId);
export const useGraphCache = () => useGraphStore(state => ({
  nodes: state.cachedNodes,
  edges: state.cachedEdges,
  timestamp: state.lastLayoutTimestamp
}));