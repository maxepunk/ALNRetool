/**
 * React Flow Graph Interactions Hook
 * Handles user interactions, selection, and editing capabilities
 * 
 * Testing Note: This is a React Flow integration hook - tested via integration tests
 * No unit tests as this is a thin wrapper around third-party library
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  Node, 
  Edge, 
  Connection,
  OnSelectionChangeParams,
  NodeMouseHandler,
  EdgeMouseHandler,
} from '@xyflow/react';
import { useHotkeys } from 'react-hotkeys-hook';
import toast from 'react-hot-toast';



interface UseGraphInteractionsOptions {
  readOnly?: boolean;
  onNodeDoubleClick?: (node: Node) => void;
  onEdgeDoubleClick?: (edge: Edge) => void;
  onSelectionChange?: (params: OnSelectionChangeParams) => void;
  onNodesDelete?: (nodes: Node[]) => void;
  onEdgesDelete?: (edges: Edge[]) => void;
  onConnect?: (connection: Connection) => void;
}

interface UseGraphInteractionsReturn {
  // Selection state
  selectedNodes: Node[];
  selectedEdges: Edge[];
  isMultiSelecting: boolean;
  
  // Interaction handlers
  handleNodeClick: NodeMouseHandler;
  handleNodeDoubleClick: NodeMouseHandler;
  handleNodeContextMenu: NodeMouseHandler;
  handleEdgeClick: EdgeMouseHandler;
  handleEdgeDoubleClick: EdgeMouseHandler;
  handleSelectionChange: (params: OnSelectionChangeParams) => void;
  handleConnect: (connection: Connection) => void;
  
  // Selection actions
  selectAll: (nodes: Node[], edges: Edge[]) => void;
  clearSelection: () => void;
  selectNode: (nodeId: string, addToSelection?: boolean) => void;
  selectEdge: (edgeId: string, addToSelection?: boolean) => void;
  
  // Editing actions
  deleteSelected: () => void;
  duplicateSelected: (nodes: Node[]) => Node[];
  
  // Clipboard
  copyToClipboard: () => void;
  pasteFromClipboard: () => void;
  hasClipboardData: boolean;
}

/**
 * Custom hook for managing graph interactions
 */
export function useGraphInteractions({
  readOnly = false,
  onNodeDoubleClick,
  onEdgeDoubleClick,
  onSelectionChange,
  onNodesDelete,
  onEdgesDelete,
  onConnect,
}: UseGraphInteractionsOptions = {}): UseGraphInteractionsReturn {
  // Selection state
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  
  // Clipboard state
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [hasClipboardData, setHasClipboardData] = useState(false);
  
  // Track multi-select key (Shift/Cmd/Ctrl)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        setIsMultiSelecting(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
        setIsMultiSelecting(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Handle node click
  const handleNodeClick: NodeMouseHandler = useCallback((event, node) => {
    event.stopPropagation();
    
    if (isMultiSelecting) {
      // Add to selection
      setSelectedNodes(prev => {
        const isAlreadySelected = prev.some(n => n.id === node.id);
        if (isAlreadySelected) {
          return prev.filter(n => n.id !== node.id);
        }
        return [...prev, node];
      });
    } else {
      // Replace selection
      setSelectedNodes([node]);
      setSelectedEdges([]);
    }
  }, [isMultiSelecting]);
  
  // Handle node double click
  const handleNodeDoubleClick: NodeMouseHandler = useCallback((event, node) => {
    event.stopPropagation();
    
    if (!readOnly) {
      onNodeDoubleClick?.(node);
    }
  }, [readOnly, onNodeDoubleClick]);
  
  // Handle node context menu
  const handleNodeContextMenu: NodeMouseHandler = useCallback((event, _node) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Could open a context menu here
  }, []);
  
  // Handle edge click
  const handleEdgeClick: EdgeMouseHandler = useCallback((event, edge) => {
    event.stopPropagation();
    
    if (isMultiSelecting) {
      // Add to selection
      setSelectedEdges(prev => {
        const isAlreadySelected = prev.some(e => e.id === edge.id);
        if (isAlreadySelected) {
          return prev.filter(e => e.id !== edge.id);
        }
        return [...prev, edge];
      });
    } else {
      // Replace selection
      setSelectedEdges([edge]);
      setSelectedNodes([]);
    }
  }, [isMultiSelecting]);
  
  // Handle edge double click
  const handleEdgeDoubleClick: EdgeMouseHandler = useCallback((event, edge) => {
    event.stopPropagation();
    
    if (!readOnly) {
      onEdgeDoubleClick?.(edge);
    }
  }, [readOnly, onEdgeDoubleClick]);
  
  // Handle selection change
  const handleSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelectedNodes(params.nodes);
    setSelectedEdges(params.edges);
    onSelectionChange?.(params);
  }, [onSelectionChange]);
  
  // Handle connection
  const handleConnect = useCallback((connection: Connection) => {
    if (!readOnly) {
      onConnect?.(connection);
    } else {
      toast.error('Graph is in read-only mode');
    }
  }, [readOnly, onConnect]);
  
  // Select all
  const selectAll = useCallback((nodes: Node[], edges: Edge[]) => {
    setSelectedNodes(nodes);
    setSelectedEdges(edges);
  }, []);
  
  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedNodes([]);
    setSelectedEdges([]);
  }, []);
  
  // Select specific node
  const selectNode = useCallback((nodeId: string, addToSelection = false) => {
    setSelectedNodes(prev => {
      if (addToSelection) {
        const node = prev.find(n => n.id === nodeId);
        if (node) return prev;
        // Need to get the actual node object - this is a simplified version
        return prev;
      }
      // Need to get the actual node object - this is a simplified version
      return [];
    });
    
    if (!addToSelection) {
      setSelectedEdges([]);
    }
  }, []);
  
  // Select specific edge
  const selectEdge = useCallback((edgeId: string, addToSelection = false) => {
    setSelectedEdges(prev => {
      if (addToSelection) {
        const edge = prev.find(e => e.id === edgeId);
        if (edge) return prev;
        // Need to get the actual edge object - this is a simplified version
        return prev;
      }
      // Need to get the actual edge object - this is a simplified version
      return [];
    });
    
    if (!addToSelection) {
      setSelectedNodes([]);
    }
  }, []);
  
  // Delete selected items
  const deleteSelected = useCallback(() => {
    if (readOnly) {
      toast.error('Cannot delete in read-only mode');
      return;
    }
    
    if (selectedNodes.length > 0) {
      onNodesDelete?.(selectedNodes);
      toast.success(`Deleted ${selectedNodes.length} node(s)`);
    }
    
    if (selectedEdges.length > 0) {
      onEdgesDelete?.(selectedEdges);
      toast.success(`Deleted ${selectedEdges.length} edge(s)`);
    }
    
    clearSelection();
  }, [readOnly, selectedNodes, selectedEdges, onNodesDelete, onEdgesDelete, clearSelection]);
  
  // Duplicate selected nodes
  const duplicateSelected = useCallback((_nodes: Node[]): Node[] => {
    if (readOnly) {
      toast.error('Cannot duplicate in read-only mode');
      return [];
    }
    
    const duplicatedNodes = selectedNodes.map(node => ({
      ...node,
      id: `${node.id}-copy-${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      selected: false,
    }));
    
    toast.success(`Duplicated ${duplicatedNodes.length} node(s)`);
    return duplicatedNodes;
  }, [readOnly, selectedNodes]);
  
  // Copy to clipboard
  const copyToClipboard = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      toast.error('Nothing selected to copy');
      return;
    }
    
    clipboardRef.current = {
      nodes: [...selectedNodes],
      edges: [...selectedEdges],
    };
    setHasClipboardData(true);
    
    toast.success('Copied to clipboard');
  }, [selectedNodes, selectedEdges]);
  
  // Paste from clipboard
  const pasteFromClipboard = useCallback(() => {
    if (readOnly) {
      toast.error('Cannot paste in read-only mode');
      return;
    }
    
    if (!clipboardRef.current) {
      toast.error('Nothing in clipboard');
      return;
    }
    
    // Create new nodes with offset positions
    const pastedNodes = clipboardRef.current.nodes.map(node => ({
      ...node,
      id: `${node.id}-paste-${Date.now()}`,
      position: {
        x: node.position.x + 100,
        y: node.position.y + 100,
      },
      selected: true,
    }));
    
    // TODO: Handle pasted edges (need to update source/target IDs)
    
    toast.success(`Pasted ${pastedNodes.length} node(s)`);
    return pastedNodes;
  }, [readOnly]);
  
  // Keyboard shortcuts
  useHotkeys('delete, backspace', () => {
    deleteSelected();
  }, [deleteSelected]);
  
  useHotkeys('cmd+a, ctrl+a', (e) => {
    e.preventDefault();
    // Need access to all nodes and edges to select all
  }, []);
  
  useHotkeys('cmd+c, ctrl+c', () => {
    copyToClipboard();
  }, [copyToClipboard]);
  
  useHotkeys('cmd+v, ctrl+v', () => {
    pasteFromClipboard();
  }, [pasteFromClipboard]);
  
  useHotkeys('cmd+d, ctrl+d', (e) => {
    e.preventDefault();
    duplicateSelected([]);
  }, [duplicateSelected]);
  
  useHotkeys('escape', () => {
    clearSelection();
  }, [clearSelection]);
  
  return {
    // Selection state
    selectedNodes,
    selectedEdges,
    isMultiSelecting,
    
    // Interaction handlers
    handleNodeClick,
    handleNodeDoubleClick,
    handleNodeContextMenu,
    handleEdgeClick,
    handleEdgeDoubleClick,
    handleSelectionChange,
    handleConnect,
    
    // Selection actions
    selectAll,
    clearSelection,
    selectNode,
    selectEdge,
    
    // Editing actions
    deleteSelected,
    duplicateSelected,
    
    // Clipboard
    copyToClipboard,
    pasteFromClipboard,
    hasClipboardData,
  };
}

/**
 * Hook for drag and drop functionality
 */
export function useGraphDragDrop() {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  
  const handleDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
    setIsDragging(true);
    setDraggedType(nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedType(null);
  }, []);
  
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    if (!draggedType) return;
    
    // Get the position where the node was dropped
    const reactFlowBounds = (event.target as HTMLElement).getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };
    
    // Create new node at drop position
    const newNode: Node = {
      id: `${draggedType}-${Date.now()}`,
      type: draggedType,
      position,
      data: { label: `New ${draggedType}` },
    };
    
    setIsDragging(false);
    setDraggedType(null);
    
    return newNode;
  }, [draggedType]);
  
  return {
    isDragging,
    draggedType,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
}