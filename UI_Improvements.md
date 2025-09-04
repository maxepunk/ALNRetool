FINISHING WORK:
 Phase 1: Complete Refactoring (45 minutes)

✻ Thinking…

  Let me complete the approach section properly.

● 1. Fix Event Handlers (Priority 1):
    - Rewrite handleNodeClick to use setNodes with React Flow state
    - Rewrite handleEdgeClick to use setEdges with React Flow state
    - Fix selectNode and selectEdge to manipulate React Flow state
    - Use pattern: Get current state → Modify → Set back to React Flow
  2. Remove Duplicate State (Priority 2):
    - Delete lines 92-93 (useState declarations)
    - Remove lines 199-200 in handleSelectionChange
    - Update deleteSelected to use getSelectedNodes()
    - Update duplicateSelected to use getSelectedNodes()
  3. Verify Compilation (Priority 3):
    - Run npm run typecheck
    - Run npm run lint
    - Fix any errors that arise

  Phase 2: Browser Testing (15 minutes)

  4. Manual Testing:
    - Start dev server
    - Open browser to localhost:5173
    - Load a graph with 50+ nodes
    - Test each keyboard shortcut:
        - Cmd/Ctrl+A → Verify ALL nodes get blue selection outline
      - Cmd/Ctrl+C → Verify toast notification appears
      - Escape → Verify all selections clear
      - Delete → Verify selected nodes can be deleted
    - Test multi-select:
        - Hold Shift and click multiple nodes
      - Verify selection accumulates
  5. Performance Testing:
    - Load graph with 200+ nodes
    - Select all with Cmd+A
    - Verify no lag or freezing

  Phase 3: Documentation (10 minutes)

  6. Update Records:
    - Update CHANGELOG with complete fix details
    - Create comprehensive commit message
    - Note any discovered issues for future work


📋 Unified Selection System Implementation Plan

  1. Architecture Overview

  // Three states become ONE unified system:
  // - React Flow's node.selected (visual truth)
  // - FilterStore's selectedNodeId (first selected for focus)
  // - useGraphInteractions tracking (removed - use React Flow directly)

  2. Core Changes to useGraphInteractions.ts

  import { useReactFlow } from '@xyflow/react';

  export function useGraphInteractions(options) {
    const { getNodes, setNodes, getEdges, setEdges } = useReactFlow();
    const { setSelectedNode } = useFilterStore();

    // Remove local state - React Flow is source of truth
    // const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
    // const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);

    // Get selected directly from React Flow
    const getSelectedNodes = useCallback(() => {
      return getNodes().filter(n => n.selected);
    }, [getNodes]);

    const getSelectedEdges = useCallback(() => {
      return getEdges().filter(e => e.selected);
    }, [getEdges]);

    // Unified selection handler
    const updateSelection = useCallback((nodeIds: string[], edgeIds: string[] = []) => {
      // Update React Flow state (visual)
      setNodes(nodes => nodes.map(node => ({
        ...node,
        selected: nodeIds.includes(node.id)
      })));

      setEdges(edges => edges.map(edge => ({
        ...edge,
        selected: edgeIds.includes(edge.id)
      })));

      // Update FilterStore (first selected for focus)
      if (nodeIds.length > 0) {
        setSelectedNode(nodeIds[0]);
      } else {
        setSelectedNode(null);
      }
    }, [setNodes, setEdges, setSelectedNode]);

    // Fixed selectAll
    const selectAll = useCallback(() => {
      const nodes = getNodes();
      const edges = getEdges();

      // Performance optimization for large graphs
      requestAnimationFrame(() => {
        setNodes(nodes.map(n => ({ ...n, selected: true })));
        setEdges(edges.map(e => ({ ...e, selected: true })));
        if (nodes.length > 0) {
          setSelectedNode(nodes[0].id);
        }
      });
    }, [getNodes, getEdges, setNodes, setEdges, setSelectedNode]);

    // Fixed clearSelection
    const clearSelection = useCallback(() => {
      setNodes(nodes => nodes.map(n => ({ ...n, selected: false })));
      setEdges(edges => edges.map(e => ({ ...e, selected: false })));
      setSelectedNode(null);
    }, [setNodes, setEdges, setSelectedNode]);

    // System clipboard with fallback
    const copyToClipboard = useCallback(async () => {
      const selected = getSelectedNodes();
      if (selected.length === 0) {
        toast.error('Nothing selected to copy');
        return;
      }

      const text = selected.map(n => `${n.id}: ${n.data.label}`).join('\n');

      try {
        // Try modern API first
        await navigator.clipboard.writeText(text);
        toast.success(`Copied ${selected.length} nodes to clipboard`);
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
          toast.success(`Copied ${selected.length} nodes to clipboard`);
        } catch (fallbackErr) {
          toast.error('Failed to copy to clipboard');
        }

        document.body.removeChild(textarea);
      }
    }, [getSelectedNodes]);

    // Handle selection change from React Flow
    const handleSelectionChange = useCallback((params: OnSelectionChangeParams) => {
      // Sync with FilterStore
      if (params.nodes.length > 0) {
        setSelectedNode(params.nodes[0].id);
      } else {
        setSelectedNode(null);
      }

      // Call user's handler
      onSelectionChange?.(params);
    }, [setSelectedNode, onSelectionChange]);

    return {
      // Selection state getters (computed from React Flow)
      selectedNodes: getSelectedNodes(),
      selectedEdges: getSelectedEdges(),

      // Unified handlers
      updateSelection,
      selectAll,
      clearSelection,
      copyToClipboard,
      handleSelectionChange,

      // ... other handlers
    };
  }

  3. Update GraphView.tsx Integration

  // In GraphView.tsx
  const {
    selectedNodes,
    selectedEdges,
    selectAll,
    clearSelection,
    copyToClipboard,
    handleSelectionChange,
    // ... other handlers
  } = useGraphInteractions({
    onSelectionChange: handleSelectionChange,
    // Remove allNodes/allEdges - not needed with useReactFlow
  });

  // React Flow component
  <ReactFlow
    nodes={reactFlowNodes}
    edges={reactFlowEdges}
    onSelectionChange={handleSelectionChange} // Sync with our state
    // ... other props
  />

  4. Keyboard Shortcuts (Already wired, will work with fixed handlers)

  // In useGraphInteractions
  useHotkeys('cmd+a, ctrl+a', (e) => {
    e.preventDefault();
    selectAll();
  }, [selectAll]);

  useHotkeys('cmd+c, ctrl+c', () => {
    copyToClipboard();
  }, [copyToClipboard]);

  useHotkeys('escape', () => {
    clearSelection();
  }, [clearSelection]);

  useHotkeys('delete, backspace', () => {
    deleteSelected();
  }, [deleteSelected]);

  5. Performance Optimizations

  // For large selections, batch updates
  const selectNodesInRange = useCallback((startId: string, endId: string) => {
    const nodes = getNodes();
    const startIdx = nodes.findIndex(n => n.id === startId);
    const endIdx = nodes.findIndex(n => n.id === endId);

    if (startIdx === -1 || endIdx === -1) return;

    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    const selectedIds = nodes.slice(from, to + 1).map(n => n.id);

    // Batch update for performance
    requestAnimationFrame(() => {
      updateSelection(selectedIds);
    });
  }, [getNodes, updateSelection]);

  6. Migration Steps

  1. Add useReactFlow import to useGraphInteractions
  2. Remove local state arrays (selectedNodes, selectedEdges)
  3. Implement getSelectedNodes/Edges as computed values
  4. Update all handlers to use React Flow's setNodes/setEdges
  5. Sync with FilterStore in handleSelectionChange
  6. Add clipboard fallback for non-HTTPS
  7. Test each shortcut in the browser

  Risk Mitigation

  - Performance: Use requestAnimationFrame for large selections
  - Clipboard: Implement fallback for non-HTTPS contexts
  - Compatibility: Keep existing API surface, just fix internals
  - Testing: Update tests to check React Flow state, not local state

  Success Criteria

  ✅ Cmd+A visually selects all nodes (blue outlines appear)
  ✅ Cmd+C copies node data to system clipboard (can paste externally)
  ✅ Click selection updates both visual and FilterStore state
  ✅ Delete removes selected nodes with visual feedback
  ✅ Escape clears all selection visually
  ✅ Multi-selection with Shift/Cmd works correctly
  ✅ FilterStore.selectedNodeId stays in sync with first selected node
  ✅ Performance acceptable with 200+ nodes