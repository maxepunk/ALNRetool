CACHE UNIFICATION PLAN

  Overview

  Transform from 5 duplicate view-specific caches to single unified cache, eliminating entity visibility bugs and reducing memory by 80%.

  CURRENT STATE:                    TARGET STATE:
  ┌─────────────────┐              ┌─────────────────┐
  │ View: full-graph│              │                 │
  │ Cache: 3-5MB    │              │  UNIFIED CACHE  │
  ├─────────────────┤              │                 │
  │ View: characters│              │ ['graph',       │
  │ Cache: 3-5MB    │   ────►      │  'complete']    │
  ├─────────────────┤              │                 │
  │ View: puzzles   │              │   Single 3-5MB  │
  │ Cache: 3-5MB    │              │                 │
  ├─────────────────┤              └─────────────────┘
  │ View: elements  │                      ▲
  │ Cache: 3-5MB    │                      │
  ├─────────────────┤              All views read from
  │ View: timeline  │              single source of truth
  │ Cache: 3-5MB    │
  └─────────────────┘
  Total: 15-25MB                   Total: 3-5MB

  Pre-Implementation Search Results (COMPLETED)

  Total Files Identified: 15 source files containing cache patterns
  Files Requiring Changes: 10 files
  Reference Files (no changes): 5 files

  View Types Found:
  - 'full-graph'
  - 'characters-only'  
  - 'puzzles-only'
  - 'elements-only'
  - 'timeline-only'

  Implementation Phases

  PHASE 1: Update Cache Writers (CRITICAL PATH)

  Purpose: Ensure all mutations write to unified cache to prevent data loss

  Files to Modify:

  1. /src/hooks/mutations/entityMutations.ts ✅ VERIFIED
  // Line 63 - REMOVE:
  import { useViewStore } from '@/stores/viewStore';

  // Lines 196-198 - REPLACE:
  // OLD:
  const currentViewType = useViewStore.getState().currentViewType;
  const queryKey = ['graph', 'complete', currentViewType || 'full-graph'];

  // NEW:
  const queryKey = ['graph', 'complete'];
  
  2. /src/lib/cache/updaters.ts ✅ VERIFIED  
  // Lines 283-289 - REMOVE ENTIRE BLOCK:
  const viewType = queryKey[2];
  if (viewType && viewType !== 'full-graph') {
    console.warn(`Applying delta to filtered view...`);
  }

  Verification:

  - Run dev server
  - Test CREATE/UPDATE/DELETE mutations
  - Console should show: [DEBUG] Mutation queryKey: ['graph', 'complete']

  ---
  PHASE 2: Update Cache Readers

  Purpose: Make GraphView read from unified cache

  Files to Modify:

  1. /src/components/graph/GraphView.tsx ✅ VERIFIED
  // Line 151 - CHANGE:
  queryKey: ['graph', 'complete', viewType],
  // TO:
  queryKey: ['graph', 'complete'],

  Verification:

  - Switch between views
  - All entities visible in all views
  - Network tab empty on view switch

  ---
  PHASE 3: Server Optimization

  Purpose: Eliminate redundant server-side caching

  Files to Modify:

  1. /server/routes/graph.ts ✅ VERIFIED
  // Lines 13-15 - SIMPLIFY:
  const cacheKey = 'graph_complete';
  // Remove viewConfig from cache key
  
  2. /server/routes/notion/createEntityRouter.ts ✅ VERIFIED (NEW)
  // Update cache invalidation pattern
  // Search for 'graph_complete' and simplify

  Verification:

  - Clear server cache
  - Restart server
  - Single cache entry in logs

  ---
  PHASE 4: Test Suite Updates

  Purpose: Update all tests to use unified cache key

  Files to Update:

  - src/hooks/mutations/entityMutations.test.ts (if exists)
  - src/test/integration/entity-mutations-behavior.test.tsx ✅ VERIFIED
  - src/test/integration/filter-behavior.test.tsx ✅ VERIFIED (NEW)
  - src/hooks/mutations/bug6-race-condition.test.ts ✅ VERIFIED
  - src/hooks/mutations/bug7.test.ts ✅ VERIFIED  
  - src/lib/cache/updaters.test.ts ✅ VERIFIED (NEW)

  Pattern to Apply:

  // FIND:
  const queryKey = ['graph', 'complete', 'test-view'];
  // REPLACE WITH:
  const queryKey = ['graph', 'complete'];

  Remove ViewStore Mocks:

  // DELETE ENTIRELY:
  vi.mock('@/stores/viewStore', () => ({
    useViewStore: {
      getState: () => ({ currentViewType: 'test-view' })
    }
  }));

  ---
  PHASE 5: Final Cleanup

  Purpose: Remove debug code and document changes

  Tasks:

  1. Remove temporary performance logging
  2. Clean up debug console.logs
  3. Update CHANGELOG.md
  4. Run npm run typecheck
  5. Run npm run lint

  Success Validation Script

  1. Clear browser storage
  2. Load app in "characters-only" view
  3. Create character "Test Alice"
  4. Switch to "puzzles-only" view
  5. Create puzzle "Test Puzzle"
  6. Add "Test Alice" to puzzle
  7. Switch to "full-graph" view
  8. VERIFY: Both entities and relationship visible
  9. Switch to "timeline-only" view
  10. VERIFY: No network request (cache hit)

  Risk Mitigation

  Rollback Strategy:

  Phase 1 issue → Revert entityMutations.ts only
  Phase 2 issue → Revert GraphView.tsx only
  Full rollback → git stash and reassess

  Edge Cases Handled:

  - View switch during mutation → Unified cache eliminates issue
  - Concurrent mutations → TempId mechanism unchanged
  - Failed delta application → Invalidation now works correctly
  - Component unmount → React Query handles, improved by unification

  Expected Outcomes

  Technical:

  - Memory: 15-25MB → 3-5MB (80% reduction)
  - Cache Entries: 5 → 1
  - View Switches: No refetch needed
  - Code Lines: ~50 lines removed

  Functional:

  - Entities visible across all views immediately
  - Relationships update everywhere
  - No "disappearing" entities on view switch
  - Consistent state across application

  Implementation Progress Tracking

  ✅ Pre-Implementation Search: COMPLETE
  ⏳ Phase 1: Cache Writers - READY TO START
  ⏳ Phase 2: Cache Readers - PENDING
  ⏳ Phase 3: Server Cache - PENDING
  ⏳ Phase 4: Test Updates - PENDING
  ⏳ Phase 5: Final Cleanup - PENDING

  Additional Files Discovered During Search

  Reference Files (No Changes Needed):
  - src/stores/viewStore.ts - View state management
  - src/lib/graph/types.ts - Type definitions
  - src/services/graphApi.ts - Graph API client
  - scripts/test-cache-simplification.ts - Validation script
  - server/index.ts - Server initialization

  Files with Historical References (May Need Cleanup):
  - Various .bak files containing old cache patterns
  - Documentation files in docs/refactor/
  - CHANGELOG.md entries documenting the issue

  Search Patterns Used:
  1. ['graph', 'complete', viewType] - Main cache key pattern
  2. currentViewType|viewType|viewMode - Variable names
  3. 'full-graph'|'characters-only'|etc - View type values
  4. graph_complete - Server cache pattern
  5. queryKey.*=.*\[ - Dynamic cache key construction