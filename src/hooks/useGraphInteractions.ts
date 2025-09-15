/**
 * React Flow Graph Interactions Hook
 * Handles user interactions, selection, and editing capabilities
 * 
 * Testing Note: This is a React Flow integration hook - tested via integration tests
 * No unit tests as this is a thin wrapper around third-party library
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  useReactFlow,
  type Node, 
  type Edge, 
  type Connection,
  type OnSelectionChangeParams,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from '@xyflow/react';
import { useHotkeys } from 'react-hotkeys-hook';
import toast from 'react-hot-toast';
import { useFilterStore } from '@/stores/filterStore';
import { useNavigationStore } from '@/stores/navigationStore';



interface UseGraphInteractionsOptions {
  readOnly?: boolean;
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
  handleNodeContextMenu: NodeMouseHandler;
  handleEdgeClick: EdgeMouseHandler;
  handleEdgeDoubleClick: EdgeMouseHandler;
  handleSelectionChange: (params: OnSelectionChangeParams) => void;
  handleConnect: (connection: Connection) => void;
  
  // Selection actions
  selectAll: () => void;
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
  onEdgeDoubleClick,
  onSelectionChange,
  onNodesDelete,
  onEdgesDelete,
  onConnect,
}: UseGraphInteractionsOptions = {}): UseGraphInteractionsReturn {
  // React Flow API access
  const { getNodes, setNodes, getEdges, setEdges } = useReactFlow();
  const setSelectedNode = useFilterStore(state => state.setSelectedNode);
  
  // Get selected nodes/edges directly from React Flow (computed values)
  const getSelectedNodes = useCallback(() => {
    return getNodes().filter(n => n.selected);
  }, [getNodes]);
  
  const getSelectedEdges = useCallback(() => {
    return getEdges().filter(e => e.selected);
  }, [getEdges]);
  
  // Multi-select state
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
  
  // Handle node context menu
  const handleNodeContextMenu: NodeMouseHandler = useCallback((event, _node) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Could open a context menu here
  }, []);
  
  // Handle edge click - don't manipulate selection, let React Flow handle it
  const handleEdgeClick: EdgeMouseHandler = useCallback((_event, _edge) => {
    // Don't call stopPropagation - let React Flow handle the event naturally
    // React Flow will update edge.selected internally and fire onSelectionChange
  }, []);
  
  // Handle edge double click
  const handleEdgeDoubleClick: EdgeMouseHandler = useCallback((event, edge) => {
    event.stopPropagation();
    
    if (!readOnly) {
      onEdgeDoubleClick?.(edge);
    }
  }, [readOnly, onEdgeDoubleClick]);
  
  // Handle selection change - syncs with FilterStore
  const handleSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    // Sync with FilterStore (use first selected node for focus)
    if (params.nodes.length > 0 && params.nodes[0]) {
      setSelectedNode(params.nodes[0].id);
    } else {
      setSelectedNode(null);
    }
    
    // Call user's handler
    onSelectionChange?.(params);
  }, [setSelectedNode, onSelectionChange]);
  
  // Handle connection
  const handleConnect = useCallback((connection: Connection) => {
    if (!readOnly) {
      onConnect?.(connection);
    } else {
      toast.error('Graph is in read-only mode');
    }
  }, [readOnly, onConnect]);
  
  // Select all - now properly updates React Flow's visual state
  const selectAll = useCallback(() => {
    // Performance optimization for large graphs
    requestAnimationFrame(() => {
      // Update React Flow state for visual selection
      setNodes(currentNodes => currentNodes.map(node => ({
        ...node,
        selected: true
      })));
      
      setEdges(currentEdges => currentEdges.map(edge => ({
        ...edge,
        selected: true
      })));
      
      // Manual FilterStore sync required - React Flow doesn't fire onSelectionChange 
      // for programmatic setNodes calls (confirmed behavior)
      const allNodes = getNodes();
      if (allNodes.length > 0 && allNodes[0]) {
        setSelectedNode(allNodes[0].id);
      }
    });
  }, [setNodes, setEdges, getNodes, setSelectedNode]);
  
  // Clear selection - now properly clears React Flow's visual state
  const clearSelection = useCallback(() => {
    // Update React Flow state
    setNodes(nodes => nodes.map(node => ({
      ...node,
      selected: false
    })));
    
    setEdges(edges => edges.map(edge => ({
      ...edge,
      selected: false
    })));
    
    // Manual FilterStore sync required - React Flow doesn't fire onSelectionChange 
    // for programmatic setNodes calls (confirmed behavior)
    setSelectedNode(null);
  }, [setNodes, setEdges, setSelectedNode]);
  
  // Select specific node
  const selectNode = useCallback((nodeId: string, addToSelection = false) => {
    if (addToSelection) {
      // Toggle the specific node's selection
      setNodes(nodes => {
        const updatedNodes = nodes.map(n => {
          if (n.id === nodeId) {
            return { ...n, selected: !n.selected };
          }
          return n;
        });
        
        // Update FilterStore with first selected node
        const firstSelected = updatedNodes.find(n => n.selected);
        setSelectedNode(firstSelected?.id || null);
        
        return updatedNodes;
      });
    } else {
      // Clear all selections and select only this node
      setNodes(nodes => nodes.map(n => ({
        ...n,
        selected: n.id === nodeId
      })));
      setEdges(edges => edges.map(e => ({
        ...e,
        selected: false
      })));
      
      // Update FilterStore immediately
      setSelectedNode(nodeId);
    }
  }, [setNodes, setEdges, setSelectedNode]);
  
  // Select specific edge
  const selectEdge = useCallback((edgeId: string, addToSelection = false) => {
    if (addToSelection) {
      // Toggle the specific edge's selection
      setEdges(edges => edges.map(e => {
        if (e.id === edgeId) {
          return { ...e, selected: !e.selected };
        }
        return e;
      }));
    } else {
      // Clear all selections and select only this edge
      setEdges(edges => edges.map(e => ({
        ...e,
        selected: e.id === edgeId
      })));
      setNodes(nodes => nodes.map(n => ({
        ...n,
        selected: false
      })));
    }
  }, [setNodes, setEdges]);
  
  // Handle node click - properly manage selection state
  const handleNodeClick: NodeMouseHandler = useCallback((event, node) => {
    event.stopPropagation(); // Prevent canvas deselection
    
    // Check if multi-selecting (Shift, Cmd, or Ctrl key)
    const addToSelection = event.shiftKey || event.metaKey || event.ctrlKey;
    
    // Update selection through our unified system
    selectNode(node.id, addToSelection);
    
    // Note: selectNode will update React Flow's visual state
    // and handleSelectionChange will sync with FilterStore
  }, [selectNode]);
  
  // Delete selected items
  const deleteSelected = useCallback(() => {
    if (readOnly) {
      toast.error('Cannot delete in read-only mode');
      return;
    }
    
    const selectedNodes = getSelectedNodes();
    const selectedEdges = getSelectedEdges();
    
    if (selectedNodes.length > 0) {
      onNodesDelete?.(selectedNodes);
      toast.success(`Deleted ${selectedNodes.length} node(s)`);
    }
    
    if (selectedEdges.length > 0) {
      onEdgesDelete?.(selectedEdges);
      toast.success(`Deleted ${selectedEdges.length} edge(s)`);
    }
    
    clearSelection();
  }, [readOnly, getSelectedNodes, getSelectedEdges, onNodesDelete, onEdgesDelete, clearSelection]);
  
  // Duplicate selected nodes
  const duplicateSelected = useCallback((_nodes: Node[]): Node[] => {
    if (readOnly) {
      toast.error('Cannot duplicate in read-only mode');
      return [];
    }
    
    const selectedNodes = getSelectedNodes();
    const duplicatedNodes = selectedNodes.map((node: Node) => ({
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
  }, [readOnly, getSelectedNodes]);
  
  // Copy to clipboard - now uses system clipboard with fallback
  const copyToClipboard = useCallback(async () => {
    const selected = getSelectedNodes();
    if (selected.length === 0) {
      toast.error('Nothing selected to copy');
      return;
    }
    
    // Create user-friendly text format
    const text = selected.map(n => `${n.id}: ${(n.data as any).label || n.id}`).join('\n');
    
    try {
      // Try modern Clipboard API first (works in HTTPS/localhost)
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${selected.length} node(s) to clipboard`);
    } catch (err) {
      // Fallback for non-HTTPS or permission denied
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        toast.success(`Copied ${selected.length} node(s) to clipboard`);
      } catch (fallbackErr) {
        toast.error('Failed to copy to clipboard');
      }
      
      document.body.removeChild(textarea);
    }
    
    // Also store in internal clipboard for paste functionality
    clipboardRef.current = {
      nodes: [...selected],
      edges: [...getSelectedEdges()],
    };
    setHasClipboardData(true);
  }, [getSelectedNodes, getSelectedEdges]);
  
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
    selectAll();
  }, [selectAll]);
  
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
  
  // Navigation history shortcuts
  useHotkeys('[', () => {
    const navigationStore = useNavigationStore.getState();
    const nodeId = navigationStore.goBack();
    if (nodeId) {
      setSelectedNode(nodeId);
    }
  }, [setSelectedNode]);
  
  useHotkeys(']', () => {
    const navigationStore = useNavigationStore.getState();
    const nodeId = navigationStore.goForward();
    if (nodeId) {
      setSelectedNode(nodeId);
    }
  }, [setSelectedNode]);
  
  return {
    // Selection state (computed from React Flow)
    selectedNodes: getSelectedNodes(),
    selectedEdges: getSelectedEdges(),
    isMultiSelecting,
    
    // Interaction handlers
    handleNodeClick,
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