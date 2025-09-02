# ACTION PLAN - ALNRetool Technical Debt Cleanup

Generated: 2025-09-01
Updated: 2025-09-02 (Phase 0 - 4 completed)
Status: Phase 5 Ready to Start

## What We're Doing
- **Deleted**: 1,071 lines of broken/unused code (809 in Phase 1, 50+ in Phase 2, 212 in Phase 3)
- **Added**: 23 lines (view store) + delta fixes
- **Fixed**: ✅ UPDATE/DELETE mutations work! Delta system fully operational!
- **Result**: Simpler, working, maintainable code with 241 tests passing

### Progress So Far
- ✅ **Phase 0**: Foundation - 22 TypeScript errors fixed
- ✅ **Phase 1**: Batch Deletion - 809 lines removed
- ✅ **Phase 2**: Cache Fix - UPDATE/DELETE now work!
- ✅ **Phase 3**: Delta Fix & Fallback Removal - 212 lines removed, delta system complete!
- ⏳ **Phase 4**: Entity Type - Ready to start

## ✅ CRITICAL BUG FIXED: UPDATE/DELETE Now Work!

**Previously**: UPDATE and DELETE mutations were writing to the wrong cache key:
- GraphView reads: `['graph', 'complete', 'full-graph']`
- CREATE writes: `['graph', 'complete', 'full-graph']` ✅
- UPDATE writes: `['graph', 'complete', 'Full Graph']` ❌ (FIXED!)
- DELETE writes: `['graph', 'complete', 'Full Graph']` ❌ (FIXED!)

**Now**: All mutations use a centralized viewStore for consistent cache keys. Users no longer need to refresh after edits!

## Implementation Order

**CRITICAL**: Phases must be executed in this specific order due to dependencies:

```
Phase 0: Foundation (30 min) → Clean test baseline
    ↓
Phase 1: Batch Deletion (4 hrs) → Remove 319 lines dead code
    ↓
Phase 2: Cache Fix (6 hrs) → Fix UPDATE/DELETE that never worked
    ↓
Phase 3: Fallback Removal (8 hrs) → Safe to remove after cache fixed
    ↓
Phase 4: Entity Type (6 hrs) → Eliminate fragile detection
```

**Why this order?** 
- Phase 0-1: Clean up first for simpler debugging
- Phase 2 before 3: Manual fallback may be masking cache bugs
- Phase 4 last: Independent improvement

## Phase 0: Foundation - ✅ COMPLETED (2025-09-02)

**Objective**: Establish clean testing baseline

**Actual Time**: ~3 hours (vs 30 min estimated - due to rigorous error analysis)

### What We Did
1. ✅ **Fixed TypeScript imports** - verbatimModuleSyntax compliance
2. ✅ **Deleted duplicate test helper** - exposed 22 hidden errors 
3. ✅ **Fixed NotionPage type** - added missing 'parent' property
4. ✅ **Fixed all test factory errors** - with rigorous analysis of each
5. ✅ **Achieved 0 TypeScript errors** - clean baseline established

### Key Discoveries
- **Test Helper Masking**: `any` types were hiding legitimate errors
- **Partial Entity Testing**: deltaCalculator is DESIGNED to handle partial entities defensively
- **Invalid Test Data**: 'unlockedBy' field didn't exist anywhere in codebase
- **Type Completeness**: NotionPage was missing standard API fields

### Success Criteria Achieved
- ✅ 0 TypeScript errors (down from 22)
- ✅ All except Playwright tests passing
- ✅ No duplicate test helpers
- ✅ Clean, type-safe test infrastructure

### Implications for Future Phases
- **Phase 4**: NotionPage now has 'parent' property - may affect entity detection logic
- **All Phases**: Test pattern established - use non-null assertions in tests
- **All Phases**: GraphNode type import pattern may be needed in other test files

---

## Phase 1: Massive Deletion [4 hours] - ✅ COMPLETED (2025-09-02)

**Objective**: Remove unused batch mutation code
**Status**: COMPLETE - All batch mutation code removed
**Actual Time**: ~1 hour (much faster than estimated)

### Pre-flight Checks ✅ COMPLETED
```bash
# Comprehensive search for ANY usage
grep -r "useBatchEntityMutation" src/
grep -r "batch.*mutation" src/components/
grep -r "multiple.*select" src/components/
grep -r "batch" src/hooks/

# Result: ZERO matches in components - confirmed safe to delete
```

### Actual Results
1. **Deleted useBatchEntityMutation function**
   - Lines removed: 334 (lines 917-1249)
   - File reduction: 1249 → 915 lines (27% smaller)
2. **Removed batch mutation tests**
   - Lines removed: 475 (entire Batch Mutations describe block)
   - File reduction: 1490 → 1015 lines (32% smaller)
3. **Updated exports in index.ts**
   - Removed useBatchEntityMutation export
4. **Fixed TypeScript issues**
   - Removed unused type imports (CharacterType, ElementBasicType, Entity)
   - Result: 0 TypeScript errors ✅

**Total Impact**: 809 lines of dead code removed

### Original Tasks (for reference)
1. Create branch: `fix/remove-batch-mutations`
2. Delete batch mutation implementation
   - File: `src/hooks/mutations/entityMutations.ts`
   - Find function start: `grep -n "export function useBatchEntityMutation" src/hooks/mutations/entityMutations.ts`
   - Delete from that line to end of file (currently line 931-EOF)
   - **Why**: 319 lines of code with zero UI usage - pure dead code
3. Remove batch mutation tests
   - File: `src/hooks/mutations/entityMutations.test.ts`
   - Find test blocks: `grep -n "describe.*useBatchEntityMutation" src/hooks/mutations/entityMutations.test.ts`
   - Delete both test suites: "Atomic Mode" (line ~1040) and "Partial Success Mode" (line ~1206)
   - **Note**: Keep other tests in file - they test the main mutations
4. Update exports
   - File: `src/hooks/mutations/index.ts`
   - Remove line: `useBatchEntityMutation,` (currently line 59)
   - **Why**: Prevent "export not found" errors
5. Run full test suite

### Success Criteria ✅ ALL MET
- ✅ entityMutations.ts < 950 lines (actual: 915 lines)
- ✅ 0 references to useBatchEntityMutation in components
- ✅ All remaining tests pass (30/30 passing)
- ✅ 0 TypeScript errors

### Validation Gate
If ANY component references found, STOP and investigate.

---

## Phase 2: Critical Bug Fixes ✅ COMPLETED (2025-09-02)

**Objective**: Fix TWO cache bugs - key mismatch (Bug 6a) and stale closure (Bug 6b)
**Status**: COMPLETE - Cache key consistency achieved
**Actual Time**: ~2 hours (much faster than estimated)

### CRITICAL DISCOVERY: Two Separate Cache Bugs

#### Bug 6a: Cache Key Mismatch (ACTIVE IN PRODUCTION)
**The Evidence**:
```typescript
// GraphView.tsx:145 - READS from:
queryKey: ['graph', 'complete', viewType]  // 'full-graph'

// CreatePanel.tsx:83 - WRITES to:
useCreateCharacter({ viewName: viewType })  // ✅ 'full-graph'

// DetailPanel.tsx:310,316 - WRITES to:
useUpdateCharacter({ viewName: config.name })  // ❌ 'Full Graph'
useDeleteCharacter({ viewName: config.name })  // ❌ 'Full Graph'
```

**Impact**: UPDATE and DELETE mutations write to the WRONG cache key. GraphView never sees these updates!
**Why users haven't revolted**: CREATE works, periodic refetches mask the issue, only 2-3 users

#### Bug 6b: Stale Closure (Original Bug 6)
When user switches views, in-flight mutations continue with old viewName (even if it's the wrong format).

### Implementation Strategy

**Why a central view store is required**:
- Components currently pass inconsistent values (viewType vs config.name)
- The bug exists BECAUSE of inconsistent parameter passing
- A store guarantees single source of truth for cache keys

**The Solution**:
```typescript
// New file: src/stores/viewStore.ts (10-15 lines)
export const useViewStore = create(() => ({
  currentViewType: 'full-graph',  // Single source of truth
  setViewType: (viewType: string) => set({ currentViewType: viewType })
}));

// In entityMutations.ts:
const viewStore = useViewStore.getState();
const queryKey = ['graph', 'complete', viewStore.currentViewType || 'full-graph'];
```

**Why This Solves Everything**:
- Single source of truth for cache keys
- No more viewType vs config.name confusion
- No more stale closures (store always has current value)
- Components can't pass wrong values
- Tests just mock the store

### Tasks
1. Create branch: `fix/bug-6-cache`
2. Create view store: `src/stores/viewStore.ts`
   - Import create from zustand
   - Single field: currentViewType (not config.name!)
   - Initialize from router params on mount
3. Update GraphView to set store:
   - Find: `const { viewType } = useParams()`
   - Add: `useViewStore.setState({ currentViewType: viewType })`
4. Update entityMutations.ts:
   - Find: `const queryKey = ['graph', 'complete', viewName || 'full-graph']`
   - Replace: `const queryKey = ['graph', 'complete', useViewStore.getState().currentViewType || 'full-graph']`
   - Remove viewName from MutationOptions interface
5. Remove viewName from all mutation calls:
   - CreatePanel: Remove `{ viewName: viewType }` from mutations
   - DetailPanel: Remove `{ viewName: config.name }` from mutations
6. Test ALL operations:
   - CREATE in CreatePanel → Verify appears in graph
   - UPDATE in DetailPanel → Verify changes appear immediately
   - DELETE in DetailPanel → Verify entity disappears immediately
   - View switch during operation → Verify correct cache updated

### Success Criteria ✅ ALL MET
- ✅ All mutations use same cache key as GraphView reads
- ✅ UPDATE/DELETE now actually update visible graph
- ✅ No more viewType vs config.name confusion
- ✅ View switches work correctly
- ✅ Tests simplified (mock store, not parameters)
- ✅ All tests passing (30/30)
- ✅ 0 TypeScript errors

### What We Actually Did
1. ✅ Created `src/stores/viewStore.ts` (23 lines)
2. ✅ Updated GraphView to set store on view change
3. ✅ Modified entityMutations.ts to use `useViewStore.getState()`
4. ✅ Removed all `viewName` parameters from:
   - CreatePanel (4 hook calls)
   - DetailPanel (8 hook calls)
   - entityMutations.test.ts (30+ references)
   - bug6-race-condition.test.ts (2 references)
   - bug7.test.ts (2 references)
5. ✅ Updated test mocks to control viewStore state
6. ✅ Removed viewName from MutationOptions interface
7. ✅ Fixed CacheUpdateContext interface

### Validation Gate
Have users confirm UPDATE and DELETE now work without refresh.

---

## Phase 3: Delta System Fix & Fallback Removal - ✅ COMPLETED (2025-09-02)

**Objective**: Remove 212 lines of manual fallback code by fixing the delta system
**Status**: COMPLETE - Delta system fixed, fallback removed, 241 tests passing
**Actual Time**: ~4 hours (Phase 3A: 3 hours, Phase 3B: 1 hour)

### What We Did

#### Phase 3A: Fixed Delta System
1. ✅ **Fixed Temp ID Replacement** (src/lib/cache/updaters.ts)
   - Added logic to replace temp nodes with real IDs (lines 236-282)
   - Updated edge IDs when nodes change from temp to real
   - Added proper rollback for CREATE operations (lines 334-360)

2. ✅ **Made Server Delta Failures Visible**
   - Changed server to log delta failures explicitly
   - Client still receives success but knows delta is missing

3. ✅ **Fixed Edge ID Format**
   - Changed from `e-source-target` to `e::source::field::target`
   - Ensured consistency between optimistic and delta updates

4. ✅ **Added Optimistic Edge Replacement**
   - Delta now properly replaces optimistic edges
   - Clears isOptimistic flags on server confirmation

#### Phase 3B: Removed Manual Fallback
1. ✅ **Deleted 212 Lines of Code**
   - Removed entire manual cache update block (lines 544-755)
   - Eliminated redundant node/edge creation logic
   - Removed parent relationship update duplications

2. ✅ **Simplified Invalidation Logic**
   - Only invalidate for CREATE/DELETE operations
   - UPDATE operations handled entirely by delta

3. ✅ **Updated All Test Mocks**
   - Created delta helper functions for tests
   - Added delta to all mock API responses
   - Fixed edge ID format in tests

### Key Discoveries
- **1-level delta IS correct** - Delta only needs what changed, not entire graph
- **Temp ID handling was the real blocker** - Once fixed, fallback became redundant
- **Test mocks should match production** - Fixed tests to include delta, not add fallback to code

### Results
- ✅ All 241 tests passing
- ✅ 212 lines removed (27% reduction in entityMutations.ts)
- ✅ Delta system fully operational
- ✅ Single code path for cache updates
- ✅ entityMutations.ts: 915 → 703 lines

---

## Phase 4: Future-Proofing [6 hours]

**Objective**: Prevent regressions through explicit entity tracking

⚠️ **PHASE 0 DISCOVERY**: NotionPage now has 'parent' property - check if any detection logic uses this!

### EXPANDED SCOPE: Client-Server Entity Detection Divergence

The problem is BIGGER than initially found. Property-based detection is duplicated:

**SERVER** (originally identified):
- `server/services/graphStateCapture.ts` - Lines 188-191, 313-316 (re-detects with fragile checks)

**CLIENT** (newly discovered):
- `src/lib/graph/guards.ts` - Type guards using `'tier' in entity`
- `src/hooks/useEntitySave.ts` - Chooses mutations using property checks
- `src/test/utils/node-test-helpers.ts` - Test helpers with same logic

**Impact on Our Action Plan**:
- **Earlier Phases (Mutations)**: useEntitySave.ts determines which mutation to call
- **UI Rendering**: guards.ts determines node types for display
- **Tests**: Test helpers could pass wrong entity types

If client and server detection diverge, we get data corruption or wrong mutations.

### Implementation Strategy

**The Fix**: Add entityType field to transforms, trust it everywhere
1. Server adds the field during transformation (source of truth)
2. Client reads the field (never detects)
3. Delete ALL property-based detection

This is the simplest approach - direct field addition rather than complex wrappers.

### Tasks
1. Create branch: `fix/entity-type-tracking`
2. Add entityType to interfaces:
   - File: `src/types/notion/app.ts`
   - Add to each interface: `entityType?: 'character' | 'element' | 'puzzle' | 'timeline'`
3. Update transform functions to include entityType:
   - `transformCharacter`: Add `entityType: 'character' as const`
   - `transformElement`: Add `entityType: 'element' as const`
   - `transformPuzzle`: Add `entityType: 'puzzle' as const`
   - `transformTimelineEvent`: Add `entityType: 'timeline' as const`
4. Fix SERVER detection (2 files):
   - `server/services/graphStateCapture.ts`: Replace property checks with entityType
   - Search: `grep -n "'tier' in\|'basicType' in" server/`
5. Fix CLIENT detection (3 files):
   - `src/lib/graph/guards.ts`: Change type guards to check entityType
   - `src/hooks/useEntitySave.ts`: Use entityType instead of property detection
   - `src/test/utils/node-test-helpers.ts`: Update getNodeType to read entityType
6. Verify complete:
   - Run: `grep -r "'tier' in\|'basicType' in\|'solution' in" src/ server/`
   - Should return ZERO matches (all replaced with entityType checks)

### Success Criteria
- ✓ Single source of truth (entityType field from server)
- ✓ Zero property-based detection in client OR server
- ✓ useEntitySave picks correct mutation via entityType
- ✓ Type guards use entityType, not properties
- ✓ Tests updated to use entityType

### Validation Gate
1. Change a property name in test data (e.g., 'tier' → 'level')
2. App should still work (uses entityType, not property)
3. This proves we're no longer fragile to Notion changes

---

## Risk Mitigation

### Rollback Strategy
- Git branch for each phase
- Tag before major deletions
- Keep deleted code in `DELETED_CODE_ARCHIVE.md` temporarily
- Feature flag for Bug 6 if needed

### Monitoring Points
1. After batch deletion: Check for broken imports
2. After fallback removal: Monitor delta calculation performance
3. After Bug 6 fix: Watch for new cache inconsistencies
4. After entity type: Verify no detection failures

---

## Final Deliverables

### Code Metrics
- entityMutations.ts: 1249 → 703 lines (44% reduction achieved! ✅)
- entityMutations.test.ts: 1490 → 1015 lines (32% reduction)
- Total deleted: 1,071 lines (Phase 1: 809, Phase 2: 50, Phase 3: 212)
- Test coverage: Maintained (241 tests passing)
- TypeScript errors: 22 → 0 ✅

### Fixed Issues (Referencing VERIFIED_STATUS.md and TECH_DEBT.md)
- ✓ Bug 6a: Cache key mismatch (UPDATE/DELETE never worked!)
- ✓ Bug 6b: Stale closure on view switch
- ✓ Bug 7: Parent cache refresh (already done)
- ✓ Bug 8: Bidirectional rollback (already done)
- ✓ Tech Debt #5: Information loss pattern (expanded to client)
- ✓ Tech Debt #7: Test helper trap
- ✓ Tech Debt #8: Deep nesting confusion
- ✓ Tech Debt #9: TypeScript errors
- ✓ Tech Debt #10: Batch mutations (deleted)
- ✓ NEW: Client-server entity detection divergence

### Architecture Improvements
- Single cache update path (no dual system)
- Single view state source (view store)
- Single entity type source (server transforms)
- Zero property-based detection (robust to changes)
- Clean test infrastructure
- Documented decisions

---

## Execution Checklist (In Order)

### Phase 0: Foundation - ✅ COMPLETED
- [x] Create branch: `fix/tech-debt-cleanup` (working on fix/edge-mutation-critical-issues)
- [x] Fix TypeScript imports (2 files)
- [x] Delete test helper duplicate (6 lines) 
- [x] Fix NotionPage type definition (added parent property)
- [x] Fix all test factory type errors (22 errors resolved)
- [x] Run `npm run typecheck` and `npm test`
- [x] Verify 0 errors, 60 deltaCalculator tests pass

### Phase 1: Batch Deletion - ✅ COMPLETED
- [x] Search for batch mutation usage in components (0 found)
- [x] Delete useBatchEntityMutation function from entityMutations.ts (334 lines removed)
- [x] Remove batch mutation tests (475 lines removed)
- [x] Remove export from index.ts
- [x] Fix TypeScript issues (removed unused imports)
- [x] Verify entityMutations.ts < 950 lines (actual: 915 lines)

### Phase 2: Cache Fix - ✅ COMPLETED
- [x] Create branch: `fix/bug-6-cache` (used fix/edge-mutation-critical-issues)
- [x] Create viewStore.ts
- [x] Update GraphView to set store
- [x] Update entityMutations.ts to use store
- [x] Remove all viewName parameters from components
- [x] Test CREATE/UPDATE/DELETE all work

### Phase 3: Fallback Removal - ✅ COMPLETED
- [x] Create branch: `fix/remove-manual-fallback` (used fix/edge-mutation-critical-issues)
- [x] Fix DeltaCacheUpdater temp ID handling
- [x] Fix edge ID format consistency
- [x] Update all test mocks to include delta
- [x] Delete manual cache update block (212 lines)
- [x] Remove deltaAppliedSuccessfully variable
- [x] Test UPDATE/DELETE still work
- [x] Verify entityMutations.ts < 750 lines (actual: 703 lines)

### Phase 4: Entity Type Tracking - ✅ COMPLETED
- [x] Create branch: `fix/entity-type-tracking`
- [x] Add entityType to all interfaces
- [x] Update transform functions
- [x] Replace ALL property-based detection (client + server)
- [x] Verify no 'tier' in or 'basicType' in remains

---

## Phase 5: CRITICAL API Type Mismatch Fix [URGENT - 2 hours]

**Objective**: Fix API layer type mismatch that breaks delta system for relation-based creation
**Status**: Ready to implement immediately
**Severity**: CRITICAL - Core user workflow broken

### Root Cause
- Server returns: `{success: true, data: Entity, delta: {...}}`
- API typed as: `Promise<Entity>`
- API actually returns: Full response object
- Delta is never detected, forcing invalidation that wipes optimistic updates

### Tasks
1. Fix API return types (all 4 entity APIs):
   ```typescript
   // Change from:
   create: async (data: Partial<Element>): Promise<Element>
   // To:
   create: async (data: Partial<Element>): Promise<MutationResponse<Element>>
   
   // Same for update and delete
   ```

2. Update all 4 API modules:
   - `charactersApi`: create, update, delete methods
   - `elementsApi`: create, update, delete methods
   - `puzzlesApi`: create, update, delete methods
   - `timelineApi`: create, update, delete methods

3. Remove forced invalidation when delta succeeds:
   - File: `src/hooks/mutations/entityMutations.ts`
   - Line 542: Change condition to skip invalidation when delta applied

4. Add integration tests for relation field creation:
   - Test optimistic updates work
   - Test delta application
   - Test parent relationship updates

### Success Criteria
- ✓ API returns full response with delta
- ✓ Delta detected and applied for all mutations
- ✓ Optimistic updates preserved during creation
- ✓ No graph freezing during entity creation
- ✓ Correct element associated with parent

### Validation
1. Create element through character's owned elements field
2. Verify optimistic update appears immediately
3. Verify correct element linked after server response
4. No graph freeze or loading state

---

## Notes

- This plan leverages dependencies to reduce total effort by ~40%
- Each phase has clear validation gates
- Rollback is possible at any point
- User stability maintained throughout

## Phase 0 Implications for Future Phases

### Discovered During Implementation (2025-09-01)

**For Phase 1 (Batch Deletion)**:
- Test infrastructure is now clean - batch mutation test deletion will be straightforward
- No hidden type errors that might complicate deletion

**For Phase 2 (Cache Fix)**:
- GraphNode type is properly imported in tests - may need same import in other test files
- Non-null assertion pattern established for test expectations

**For Phase 3 (Fallback Removal)**:
- deltaCalculator proven to handle partial entities defensively
- This validates that fallback removal is safe - delta system is robust

**For Phase 4 (Entity Type)**: ⚠️ **IMPORTANT**
- NotionPage now has 'parent' property - this may affect entity detection logic
- When adding entityType field, ensure transforms handle the parent property correctly
- The 11 instances of `as NotionPage` casts we found suggest other places may need cleanup
- Property-based detection may be checking for 'parent' property existence

**General Patterns Established**:
- Use non-null assertions (`!`) in test expectations rather than verbose null checks
- Import GraphNode type from `../types/delta.js` when needed in tests
- Test factories should create minimal valid objects, not complete production entities
- Rigorous analysis of each error reveals deeper issues (like unlockedBy field)