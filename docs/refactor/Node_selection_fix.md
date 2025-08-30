Simplified Node Selection Implementation Plan (Revised)

     Core Principle: Remove Unnecessary Complexity

     Remove both focusedNodeId AND filterMode - they're over-engineered solutions to simple problems.

     The New Simple Model

     1. One selection state: selectedNodeId only
     2. Connection depth always works the same way:
       - If node selected: Show N connections from that node
       - If no node selected: Show N connections from ALL filtered nodes  
       - If depth = 0: Show only filtered nodes (no connections)
     3. No modes, no confusion

     Implementation Steps

     Step 1: Update FilterStore (src/stores/filterStore.ts)

     - Remove focusedNodeId field and setFocusedNode method
     - Remove filterMode field and setFilterMode method
     - Remove focusRespectFilters field (no longer needed without modes)
     - Remove auto-switching logic in node selection
     - Keep only selectedNodeId and setSelectedNode

     Step 2: Simplify Filtering Logic (src/lib/graph/filtering.ts)

     // Simplified getVisibleNodeIds function
     export function getVisibleNodeIds(
       filteredNodeIds: Set<string>,
       edges: Edge[],
       selectedNodeId: string | null,
       connectionDepth: number
     ): Set<string> {
       // No connection depth? Just show filtered nodes
       if (!connectionDepth || connectionDepth === 0) {
         return filteredNodeIds;
       }
       
       // Node selected? Show connections from that node
       if (selectedNodeId && filteredNodeIds.has(selectedNodeId)) {
         return getNodesWithinDepth(selectedNodeId, edges, connectionDepth);
       }
       
       // No selection? Show connections from ALL filtered nodes
       const connectedIds = new Set(filteredNodeIds);
       for (const nodeId of filteredNodeIds) {
         const connections = getNodesWithinDepth(nodeId, edges, connectionDepth);
         connections.forEach(id => connectedIds.add(id));
       }
       return connectedIds;
     }

     Step 3: Update GraphView (src/components/graph/GraphView.tsx)

     - Remove focusedNodeId, setFocusedNode calls
     - Remove filterMode, focusRespectFilters from filters
     - Simplify onNodeClick to just:
     const onNodeClick = (nodeId: string) => {
       setSelectedNode(nodeId); // Just open detail panel
     };
     - Fix handleDetailPanelClose to clear selection on delete

     Step 4: Update DepthSlider (src/components/sidebar/DepthSlider.tsx)

     - Remove mode badges (Pure Filter, Focus Mode, Connected)
     - Simplify descriptions:
     const getDescription = () => {
       if (selectedNodeId) {
         return `Showing ${connectionDepth} ${connectionDepth === 1 ? 'level' : 'levels'} from selected node`;
       } else if (connectionDepth === 0) {
         return 'Showing only filtered nodes';
       } else {
         return `Showing filtered nodes + ${connectionDepth} ${connectionDepth === 1 ? 'level' : 'levels'} of connections`;
       }
     };

     Step 5: Update Viewport Manager (src/hooks/useGraphState.ts)

     - Remove focusedNodeId parameter
     - Simplify priority system:
     const getCurrentPriority = () => {
       if (selectedNodeId) return 3; // Selected node
       if (searchTerm?.trim()) return 2; // Search results
       return 1; // All visible nodes
     };

     Step 6: Update Visibility Hook (src/hooks/graph/useGraphVisibility.ts)

     - Remove filterMode, focusedNodeId, focusRespectFilters parameters
     - Pass selectedNodeId instead for depth calculations
     - Update isFocused to use selectedNodeId

     Step 7: Update FilterStatusBar (src/components/graph/FilterStatusBar.tsx)

     - Remove filter mode display
     - Update to show selected node info instead of focused node
     - Simplify the status messages

     Step 8: Clean up Related Files

     - Remove filterMode from useFilterSelectors.ts
     - Remove filterMode from useGraphLayout.ts
     - Remove filterMode from URL state persistence
     - Update tests to remove mode-related logic

     Benefits

     1. Fixes deletion bug: No separate focus state to persist after deletion
     2. Predictable UX: Connection depth always works the same way
     3. No mode confusion: Users don't need to understand different filtering modes
     4. Cleaner mental model: Select a node → see its connections. Don't select → see all connections
     5. Less code: Removing ~100+ lines of mode management
     6. Easier to explain: "Depth slider shows N levels of connections from selected node or all filtered nodes"

     User Experience Flow

     1. Default state: See all filtered nodes + their connections (based on depth slider)
     2. Search for node: Viewport centers on results
     3. Click a node: Opens detail panel AND shows connections from that node only
     4. Close detail panel: Returns to showing all filtered nodes + connections
     5. Delete node: Automatically returns to default state (no orphaned focus)

     What We're NOT Changing

     - Search behavior (already works correctly)
     - Detail panel (already works correctly)
     - Connection depth slider UI (just simplifying the text)
     - Filter persistence (still saves to session storage)

     This approach delivers the exact UX you requested with significantly less complexity.