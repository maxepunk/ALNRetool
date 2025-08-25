/**
 * React Flow Graph State Management Hook
 * Manages nodes, edges, and interactions for the graph visualization
 * 
 * Testing Note: This is a React Flow integration hook - tested via integration tests
 * No unit tests as this is a thin wrapper around third-party library
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeMouseHandler,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import type { GraphData } from '@/lib/graph/types';
import { logger } from '@/lib/graph/utils/Logger'


interface UseGraphStateOptions {
  initialGraphData: GraphData;
  onNodeClick?: (node: Node) => void;
  onSelectionChange?: (params: OnSelectionChangeParams) => void;
  onConnect?: (connection: Connection) => void;
}

interface UseGraphStateReturn {
  // State
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  
  // Handlers  
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  handleNodeClick: NodeMouseHandler;
  handleNodeMouseEnter: NodeMouseHandler;
  handleNodeMouseLeave: NodeMouseHandler;
  handleConnect: (params: Connection) => void;
  
  // Actions
  setSelectedNode: (nodeId: string | null) => void;
  highlightConnections: (nodeId: string) => void;
  resetHighlights: () => void;
  updateGraphData: (newData: GraphData) => void;
  
  // Utilities
  getConnectedNodes: (nodeId: string) => string[];
  getNodeById: (nodeId: string) => Node | undefined;
}

/**
 * Custom hook for managing React Flow graph state
 */
export function useGraphState({
  initialGraphData,
  onNodeClick,
  onSelectionChange: _onSelectionChange,
  onConnect,
}: UseGraphStateOptions): UseGraphStateReturn {
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraphData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraphData.edges);
  
  // Local state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // React Flow instance (for programmatic control)
  const reactFlowInstance = useReactFlow();
  
  // Update nodes and edges when graph data changes
  useEffect(() => {
    logger.debug('[useGraphState] Updating with new graph data:', { 
      nodes: initialGraphData.nodes.length,
      edges: initialGraphData.edges.length
     });
    setNodes(initialGraphData.nodes);
    setEdges(initialGraphData.edges);
  }, [initialGraphData, setNodes, setEdges]);
  
  // Get connected node IDs for a given node
  const getConnectedNodes = useCallback((nodeId: string): string[] => {
    const connected = new Set<string>();
    
    edges.forEach(edge => {
      if (edge.source === nodeId) {
        connected.add(edge.target);
      } else if (edge.target === nodeId) {
        connected.add(edge.source);
      }
    });
    
    return Array.from(connected);
  }, [edges]);
  
  // Get node by ID
  const getNodeById = useCallback((nodeId: string): Node | undefined => {
    return nodes.find(n => n.id === nodeId);
  }, [nodes]);
  
  // Highlight connections for a node
  const highlightConnections = useCallback((nodeId: string) => {
    const connectedNodeIds = getConnectedNodes(nodeId);
    
    // Update edges - highlight connected ones
    setEdges((eds) =>
      eds.map((edge) => {
        const isConnected = edge.source === nodeId || edge.target === nodeId;
        return {
          ...edge,
          animated: isConnected,
          style: {
            ...edge.style,
            strokeWidth: isConnected ? 2 : 1,
            opacity: isConnected ? 1 : 0.3,
          },
        };
      })
    );
    
    // Update nodes - dim non-connected ones
    setNodes((nds) =>
      nds.map((node) => {
        const isHighlighted = node.id === nodeId || connectedNodeIds.includes(node.id);
        return {
          ...node,
          style: {
            ...node.style,
            opacity: isHighlighted ? 1 : 0.3,
          },
        };
      })
    );
  }, [getConnectedNodes, setEdges, setNodes]);
  
  // Reset all highlights
  const resetHighlights = useCallback(() => {
    // Reset edge styles
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: false,
        style: {
          ...edge.style,
          strokeWidth: 1,
          opacity: 1,
        },
      }))
    );
    
    // Reset node opacity
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        style: {
          ...node.style,
          opacity: 1,
        },
      }))
    );
  }, [setEdges, setNodes]);
  
  // Handle node click
  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
    onNodeClick?.(node);
  }, [onNodeClick]);
  
  // Handle node hover
  const handleNodeMouseEnter: NodeMouseHandler = useCallback((_event, node) => {
    setHoveredNodeId(node.id);
    highlightConnections(node.id);
  }, [highlightConnections]);
  
  // Handle node mouse leave
  const handleNodeMouseLeave: NodeMouseHandler = useCallback(() => {
    setHoveredNodeId(null);
    resetHighlights();
  }, [resetHighlights]);
  
  // Handle connection creation
  const handleConnect = useCallback((params: Connection) => {
    logger.debug('Connection attempt:', undefined, params);
    onConnect?.(params);
    // Future: Handle creating new relationships
  }, [onConnect]);
  
  // Set selected node programmatically
  const setSelectedNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    
    if (nodeId) {
      // Center the view on the selected node
      const node = getNodeById(nodeId);
      if (node && reactFlowInstance) {
        reactFlowInstance.setCenter(node.position.x, node.position.y, {
          duration: 800,
          zoom: 1.5,
        });
      }
    }
  }, [getNodeById, reactFlowInstance]);
  
  // Update graph data
  const updateGraphData = useCallback((newData: GraphData) => {
    setNodes(newData.nodes);
    setEdges(newData.edges);
  }, [setNodes, setEdges]);
  
  return {
    // State
    nodes,
    edges,
    selectedNodeId,
    hoveredNodeId,
    
    // Handlers (cast to handle type variance)
    onNodesChange: onNodesChange as (changes: NodeChange[]) => void,
    onEdgesChange: onEdgesChange as (changes: EdgeChange[]) => void,
    handleNodeClick,
    handleNodeMouseEnter,
    handleNodeMouseLeave,
    handleConnect,
    
    // Actions
    setSelectedNode,
    highlightConnections,
    resetHighlights,
    updateGraphData,
    
    // Utilities
    getConnectedNodes,
    getNodeById,
  };
}

/**
 * Hook for filtering graph data based on view type
 */
export function useGraphFilter(
  graphData: GraphData,
  filters: {
    nodeTypes?: string[];
    edgeTypes?: string[];
    searchQuery?: string;
  }
): GraphData {
  return useMemo(() => {
    let filteredNodes = graphData.nodes;
    let filteredEdges = graphData.edges;
    
    // Filter nodes by type
    if (filters.nodeTypes && filters.nodeTypes.length > 0) {
      filteredNodes = filteredNodes.filter(node => 
        filters.nodeTypes!.includes(node.type || 'default')
      );
    }
    
    // Filter nodes by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter(node =>
        node.data.label?.toLowerCase().includes(query) ||
        node.id.toLowerCase().includes(query)
      );
    }
    
    // Filter edges to only include those between visible nodes
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    filteredEdges = filteredEdges.filter(edge =>
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
    
    // Filter edges by type
    if (filters.edgeTypes && filters.edgeTypes.length > 0) {
      filteredEdges = filteredEdges.filter(edge =>
        filters.edgeTypes!.includes(edge.data?.relationshipType || 'default')
      );
    }
    
    return {
      ...graphData,
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }, [graphData, filters.nodeTypes, filters.edgeTypes, filters.searchQuery]);
}

/**
 * Hook for managing graph zoom and viewport
 */
export function useGraphViewport() {
  const { getViewport, setViewport, fitView, zoomIn, zoomOut } = useReactFlow();
  
  const handleZoomToFit = useCallback(() => {
    fitView({ padding: 0.2, duration: 800 });
  }, [fitView]);
  
  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);
  
  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);
  
  const handleResetView = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 });
  }, [setViewport]);
  
  return {
    viewport: getViewport(),
    zoomToFit: handleZoomToFit,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    resetView: handleResetView,
  };
}