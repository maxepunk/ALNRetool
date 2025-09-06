#CHANGELOG
##IMPORTANT: MOST RECENT ENTRY GOES AT THE TOP OF THE DOCUMENT
##Previous Changelog at CHANGELOG.md.bk

## [2025-01-06] Mutation Pipeline Critical Fixes - Implementation Plan

### Objective
Fix critical race conditions and data loss issues in the mutation pipeline from Notion to UI, focusing on surgical fixes using existing React Query patterns rather than rebuilding architecture.

### Critical Issues Identified
1. **Edge Race Condition** (entityMutations.ts:800): Concurrent mutations overwrite each other's edge changes
2. **Data Loss in Merger** (entityMerger.ts): Cannot distinguish intentional empty arrays from missing fields  
3. **Counter Desync**: pendingMutationCount can desync during concurrent mutations
4. **Performance Bottleneck**: Sequential API calls in inverse relations

### Implementation Plan

#### Phase 1: Fix Edge Race Condition [2-3 hours]
**Problem**: Line 800 wholesale replaces edges, causing mutations to overwrite each other's changes
**Solution**: Track which edges each mutation touches and only update those specific edges

Tasks:
- [ ] Add mutationId generation using uuid package
- [ ] Extend OptimisticContext to include touchedEdgeIds Set
- [ ] Modify onMutate to track which edges are created/modified
- [ ] Update onSuccess to only decrement counters for touched edges
- [ ] Update onError to only restore edges touched by failed mutation
- [ ] Add tests for concurrent edge mutations

#### Phase 2: Fix EntityMerger Data Loss [1-2 hours]
**Problem**: smartMergeEntityUpdate cannot tell if empty array is intentional or missing
**Solution**: Use requestBody to detect which fields were actually sent by client

Tasks:
- [ ] Modify smartMergeEntityUpdate to check requestBody for field presence
- [ ] Use FIELD_TO_NOTION_PROPERTY mapping to handle field name transformations
- [ ] Only merge fields that exist in requestBody
- [ ] Add validation to ensure no unexpected data loss
- [ ] Add tests for partial update scenarios

#### Phase 3: Robust Counter Tracking [3-4 hours]  
**Problem**: Multiple mutations on same entity can cause counter desync
**Solution**: Track mutation IDs with counters for accurate increment/decrement

**Detailed Implementation Plan**:
- NodeMetadata will store Set<string> of active mutation IDs
- pendingMutationCount will be derived from Set.size
- Each mutation adds its ID on start, removes on complete/error
- Prevents double-decrement or missed decrements
- Handles partial failures correctly (only affected mutations change)

Tasks:
- [ ] Extend NodeMetadata to include pendingMutationIds: Set<string>
- [ ] Extend EdgeData to include pendingMutationIds: Set<string>
- [ ] Modify OptimisticStateManager methods to accept mutationId parameter
- [ ] Update increment to add mutation ID to set
- [ ] Update decrement to remove specific mutation ID
- [ ] Ensure counter always equals set size for consistency
- [ ] Update all call sites to pass mutationId from context
- [ ] Handle backward compatibility when mutationId missing
- [ ] Add tests for concurrent mutations on same entity
- [ ] Add tests for partial failure scenarios

#### Phase 4: Parallelize Inverse Relations [1 hour]
**Problem**: Sequential await in loop causes unnecessary delays
**Solution**: Use Promise.all for parallel execution

Tasks:
- [ ] Refactor updateInverseRelations to batch API calls
- [ ] Use Promise.allSettled for error resilience
- [ ] Add proper error handling for partial failures
- [ ] Add performance tests to verify improvement

#### Phase 5: Comprehensive Testing [4-5 hours]
**Problem**: Need confidence that fixes work correctly
**Solution**: Thorough test coverage of all scenarios

Tasks:
- [ ] Test concurrent mutations on same entity
- [ ] Test concurrent mutations on different entities
- [ ] Test rapid sequential mutations
- [ ] Test mutation failures and rollbacks
- [ ] Test edge case scenarios
- [ ] Verify UI components reflect correct optimistic state
- [ ] Performance benchmarks for improvements

### Success Criteria
- No edge overwrites during concurrent mutations
- No data loss during partial updates
- Accurate pendingMutationCount in all scenarios
- 50%+ performance improvement in inverse relations
- All existing tests pass
- New tests provide 90%+ coverage of mutation paths

### Risk Mitigation
- Each phase is independently testable
- Changes are surgical, not architectural
- Existing patterns preserved (React Query lifecycle)
- Rollback plan: Git revert if issues found

---

## Implementation Progress

### [2025-01-06 10:02] Phase 2 Complete: EntityMerger Data Loss Fixed ✅

**Problem Solved**: smartMergeEntityUpdate couldn't distinguish between intentional empty arrays and missing fields

**Root Cause Analysis**:
- Transform functions return empty arrays/strings for missing Notion properties
- Original logic checked `if (!(key in updatePayload))` but keys didn't match
- Request body uses different field names than transformed entities
- Result: All relationship data was lost when updating unrelated fields

**Implementation Details**:
1. **Added intelligent field detection**:
   - Created `wasFieldInRequest()` helper function
   - Handles field name variations (e.g., 'owner' vs 'ownerId')
   - Checks common abbreviations and mappings
   - Supports both array and single relationship fields

2. **Fixed undefined handling**:
   - Changed from skipping all undefined values
   - Now only skips undefined if field wasn't in request
   - Allows explicit null/undefined clearing when intended

3. **Preservation logic**:
   - Empty arrays preserve existing data unless explicitly cleared
   - Empty strings preserve existing text unless explicitly cleared
   - Undefined relationships preserve existing unless explicitly cleared

**Testing**:
- Created comprehensive test suite in entityMerger.test.ts
- 7 new tests covering all edge cases
- All 11 existing behavioral tests still pass
- Verified backward compatibility when requestBody not provided

**Files Modified**:
- server/utils/entityMerger.ts (core fix)
- server/utils/entityMerger.test.ts (new test suite)

**Time Taken**: 1 hour (better than 1-2 hour estimate)

**Known Limitations**:
- Field name variation mapping only covers 4 known cases
- Could be extended if frontend sends different field names
- Safe fallback: preserves data when field detection misses

**Future Enhancement Opportunity**:
- Log unrecognized field patterns in production to discover actual variations
- Current implementation is sufficient due to safe fallback behavior

---

### [2025-01-06 11:50] Phase 3 Complete: Mutation ID Tracking for Counter Accuracy ✅

**Problem Solved**: Multiple concurrent mutations on same entity causing counter desync

**Critical Discovery During Implementation**:
- Test was calling `useEntityMutation` with wrong parameters
- Was passing object: `useEntityMutation({ entityType: 'character', mutationType: 'update' })`
- Should be individual params: `useEntityMutation('character', 'update')`
- This caused onMutate to never fire, masking the real implementation

**Implementation Details**:

1. **Type Extensions** (Modified from plan):
   ```typescript
   NodeMetadata {
     pendingMutationCount?: number;  // Derived from array length
     pendingMutationIds?: string[];  // Array instead of Set (JSON serialization)
   }
   ```
   - Used arrays instead of Sets due to JSON serialization issues
   - `JSON.stringify(new Set(['a','b']))` returns `{}` (empty object)
   - Arrays serialize correctly and maintain functionality

2. **OptimisticStateManager Updates**:
   - Added 4 new methods: `addNodeMutationId`, `removeNodeMutationId`, `addEdgeMutationId`, `removeEdgeMutationId`
   - Each method accepts optional mutationId parameter
   - Uses Set internally for deduplication, converts to Array for storage
   - Counter always equals array.length for consistency
   - Backward compatibility: Falls back to simple increment/decrement when mutationId missing

3. **Critical Rollback Fix**:
   - Original issue: Failed mutations restored entire entity, overwriting concurrent changes
   - Fix: Only restore fields that the failed mutation actually modified
   ```typescript
   // Only restore the fields that THIS mutation changed
   Object.keys(payload).forEach(key => {
     if (key !== 'id' && nodeToRestore.data.entity[key] !== undefined) {
       restoredEntity[key] = nodeToRestore.data.entity[key];
     }
   });
   ```

4. **Testing**:
   - All 3 tests passing:
     - ✅ Multiple concurrent mutations on same entity (counter goes 0→3→2→1→0)
     - ✅ Partial failure scenarios (failed mutation reverts only its changes)
     - ✅ No duplicate mutation IDs in tracking arrays

**Files Modified**:
- src/lib/graph/types.ts (added pendingMutationIds to interfaces)
- src/hooks/mutations/entityMutations.ts (core implementation)
- src/hooks/mutations/concurrent-mutations.test.tsx (fixed and validated)

**Time Taken**: 1.5 hours (better than 3-4 hour estimate)

**Validation**:
- Counter accurately tracks concurrent mutations
- Each mutation has unique ID (UUID v4)
- Failed mutations only revert their own changes
- Successful mutations complete independently
- No race conditions or counter desync

---

### [2025-01-06 09:47] Phase 1 Complete: Edge Race Condition Fixed ✅

**Problem Solved**: Concurrent mutations were overwriting each other's edge changes at line 800 of entityMutations.ts

**Implementation Details**:
1. **Added mutation tracking infrastructure**:
   - Imported uuid v4 for unique mutation ID generation
   - Extended OptimisticContext interface with `mutationId` and `touchedEdgeIds`
   - Each mutation now gets a unique ID and tracks which edges it creates/modifies

2. **Modified edge creation logic**:
   - Updated OptimisticUpdater.apply() to accept touchedEdgeIds parameter
   - All edge creation/modification methods now populate touchedEdgeIds Set
   - Tracks edge IDs in handleCreate, handleUpdate, and handleDelete methods

3. **Fixed the race condition in onSuccess**:
   - Line 850: Removed wholesale edge replacement (`context?.optimisticEdges || old.edges`)
   - Now only decrements counters for edges in touchedEdgeIds
   - Each mutation only affects its own edges, preventing overwrites

4. **Updated onError for proper rollback**:
   - Only restores edges touched by the failed mutation
   - Preserves other concurrent mutations' changes
   - Maintains counter accuracy across failures

**Testing**:
- All 11 existing mutation tests pass
- Added new test file: concurrent-edge-mutations.test.ts
- Verifies concurrent mutations don't interfere with each other
- Tests failure scenarios with partial rollback

**Files Modified**:
- src/hooks/mutations/entityMutations.ts (core fix)
- src/hooks/mutations/concurrent-edge-mutations.test.ts (new test)

**Time Taken**: 2 hours (as estimated)

---

### [2025-01-06 14:03] Phase 4 Complete: Inverse Relations Parallelized ✅

**Problem Solved**: Sequential API calls in updateInverseRelations causing performance bottleneck

**Implementation Details**:
1. **Refactored to Promise.allSettled pattern**:
   - Collected all update operations into promises array
   - Executed in parallel instead of nested sequential loops
   - Maintained error resilience with allSettled

2. **Enhanced error handling**:
   - Individual failures don't block other operations
   - Added summary logging for succeeded/failed counts
   - Distinguished "add" vs "remove" failures in logs

3. **Performance improvement verified**:
   - Test shows 90% improvement (509ms → 50ms for 10 operations)
   - Real-world: 3 relations × 5 IDs = 15 operations
   - Old: ~1500ms sequential
   - New: ~500ms with Bottleneck's 3 concurrent limit

**Testing**:
- Created performance test suite in inverse-relations.performance.test.ts
- 3 tests covering:
  - Parallel execution timing
  - Partial failure handling
  - Performance comparison (sequential vs parallel)
- All tests passing with measured 90% improvement

**Files Modified**:
- server/routes/notion/createEntityRouter.ts (parallelized updateInverseRelations)
- server/routes/notion/inverse-relations.performance.test.ts (new test suite)

**Time Taken**: 30 minutes (better than 1 hour estimate)

---
