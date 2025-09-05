# Depth Filtering Bug Fix - Investigation & Resolution

## Date: 2025-01-09

### Problem Statement
Depth filtering was not working when a node was selected. Setting depth to 0 or 1 with a selected node did nothing - all nodes remained visible instead of showing only the selected node and its connections.

### Initial Investigation (Misdiagnosis)
- **Incorrect Assumption**: Thought the bug was in `filterStore.setSelectedNode` resetting `connectionDepth` to 0
- **Wrong Fix Applied**: Modified the store to preserve `connectionDepth` value when deselecting
- **Tests Created**: Built tests validating the WRONG behavior (depth preservation on deselection)

### Critical Discovery
User clarified the INTENDED behavior:
- Depth filtering should ONLY apply when a node is selected
- When no node is selected, ALL filtered nodes should be visible (no depth filtering)
- This was an intentional design choice, not a bug

### Root Cause Found
The real bug was in `/src/hooks/useGraphLayout.ts`:

```typescript
// BUG: Was passing filteredNodes instead of using visibility hook results
const { layoutedNodes } = useLayoutEngine({
  visibleNodes: filteredNodes,  // ❌ WRONG - bypassed depth filtering
  allEdges: layoutEdges,
  viewConfig,
});
```

The `useGraphVisibility` hook was correctly calculating which nodes should be visible based on selection and depth, but `useGraphLayout` was ignoring those results and passing the unfiltered nodes directly to the layout engine.

### Solution Implemented
Fixed `useGraphLayout.ts` to properly use the visibility hook's output:

```typescript
// Step 3: Apply visibility rules
const { visibleNodes, visibleEdges, allEdges: layoutEdges } = useGraphVisibility({
  filteredNodes,
  allEdges,
  selectedNodeId: selectedNodeId || null,
  connectionDepth: connectionDepth || null,
});

// Step 4: Apply layout to visible nodes (not filtered nodes!)
const { layoutedNodes } = useLayoutEngine({
  visibleNodes: visibleNodes,  // ✅ CORRECT - uses depth-filtered nodes
  allEdges: layoutEdges,
  viewConfig,
});
```

Also updated edge filtering to use pre-calculated `visibleEdges` from the visibility hook.

### Behavior Now Working As Intended
- **No selection**: All filtered nodes visible (no depth filtering applied)
- **Node selected, depth 0**: Only the selected node visible
- **Node selected, depth 1**: Selected node + immediate neighbors visible
- **Node selected, depth N**: Selected node + all nodes within N hops visible

### Lessons Learned
1. **Always verify design intent** before assuming something is a bug
2. **Test the intended behavior**, not the current implementation
3. **Follow the data flow** - the visibility calculation was correct, but results were being ignored
4. **Integration tests can mislead** if they test at the wrong level (mocking too much)

### Files Modified
- `/src/hooks/useGraphLayout.ts` - Fixed to use `visibleNodes` and `visibleEdges` from visibility hook
- `/src/stores/filterStore.ts` - Simplified `setSelectedNode` (though this change was correct for different reasons)

### Files Created (Testing)
- `/src/stores/filterStore.test.ts` - Unit tests for store behavior
- `/src/lib/graph/filtering.test.ts` - Unit tests for filtering logic
- `/src/stores/filterStore.buggy.test.ts` - Test demonstrating the misidentified "bug"

### Status
✅ **RESOLVED** - Depth filtering now works correctly with node selection