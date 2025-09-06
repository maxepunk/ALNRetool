Complete Migration Plan - STATUS: 85% COMPLETE

  Current State Analysis (Updated 2025-09-05)

  PROBLEMS IDENTIFIED:
  1. ✓ FIXED: Race condition: isOptimistic flag cleared too early in onSettled
  2. IN PROGRESS: Redundancy: Both isOptimistic (boolean) and pendingMutationCount (number)
  3. ✓ FIXED: V3 now handles edge creation for relationships
  4. NEEDS FIX: Error handling strategy conflicts with React Query patterns
  5. ✓ FIXED: Edges now have pendingMutationCount in data

  Target Architecture

  ┌─────────────────────────────────────────────┐
  │         Unified Optimistic Tracking          │
  ├─────────────────────────────────────────────┤
  │  Nodes: metadata.pendingMutationCount       │
  │  Edges: data.pendingMutationCount           │
  │  Helper: isNodeOptimistic() → count > 0     │
  │  Helper: isEdgeOptimistic() → count > 0     │
  └─────────────────────────────────────────────┘

  PROGRESS STATUS:
  
  ✅ COMPLETED:
  - Created OptimisticStateManager class
  - Added edge creation for single and array relationships
  - Fixed applyBidirectionalUpdate to preserve edges
  - Fixed currentEntity capture timing
  - Tests properly await async operations
  - Edge pendingMutationCount implemented
  - Fixed onError to restore data from snapshot (React Query pattern)
  - Implemented handleArrayRelationship for array fields
  - All relationship tests passing (single, array, rollback)
  
  🔧 IN PROGRESS:
  - Fixing TypeScript errors with GraphNode.id access
  
  ❌ TODO:
  - Remove isOptimistic from types.ts
  - Update isNodeOptimistic helper
  - Delete V2 files and rename V3

  Implementation Strategy (Big Bang)

  Step 1: Type System Changes

  Files to modify:
  - src/lib/graph/types.ts
    - Remove isOptimistic from NodeMetadata
    - Add pendingMutationCount to GraphEdge.data
  - src/lib/graph/utils.ts
    - Update isNodeOptimistic() to ONLY check counter
    - Add isEdgeOptimistic() function

  Step 2: Create OptimisticStateManager

  New class in entityMutationsV3.ts:
  class OptimisticStateManager {
    // Increment/decrement for nodes and edges
    // Handle CREATE with _parentRelation
    // Support concurrent mutations
  }

  Step 3: Rewrite V3 Mutation Logic

  Changes to entityMutationsV3.ts:
  - Remove OptimisticUpdater class
  - Remove isOptimistic flag usage everywhere
  - Add edge creation for _parentRelation
  - Fix error handling (decrement, don't rollback)
  - Update ServerResponseUpdater for edges

  Step 4: Update ALL Tests

  Test files to modify:
  - test-node-corruption.test.ts - Check pendingMutationCount > 0
  - bug6-race-condition.test.ts - Check counter not flag
  - update-relationship-optimistic.test.ts - Check edge counters

  Step 5: Replace V2 with V3

  - Delete entityMutations.ts (V2)
  - Rename entityMutationsV3.ts → entityMutations.ts
  - Update exports in index.ts

  Critical Implementation Details

  1. Concurrent Mutation Handling:
  // Each mutation increments counter
  mutation1: count = 0 → 1
  mutation2: count = 1 → 2 (concurrent)
  mutation1 completes: count = 2 → 1
  mutation2 completes: count = 1 → 0

  2. Error Recovery (CORRECTED):
  onError: (err, vars, ctx) => {
    // Restore entity data from snapshot
    // Restore edges from snapshot
    // BUT preserve counters from concurrent mutations
    // This follows React Query v5 optimistic patterns
  }

  3. Edge Creation Pattern:
  if (payload._parentRelation) {
    const edge = {
      id: `e-${parentId}-${childId}`,
      source: parentId,
      target: childId,
      data: { pendingMutationCount: 1 }
    };
    edges.push(edge);
  }

  Risk Mitigation

  1. Type Safety: TypeScript will catch missing isOptimistic references
  3. Atomic Change: Do everything in one commit to avoid inconsistent state

  Success Criteria

  ✓ No references to isOptimistic remain
  ✓ Concurrent mutations tracked correctly
  ✓ Edge optimistic states work
  ✓ Error handling preserves state

  This approach:
  - Removes ALL technical debt at once
  - Unifies node and edge handling
  - Fixes the race condition permanently
  - Takes advantage of non-production environment