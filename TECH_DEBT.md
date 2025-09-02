# Technical Debt Tickets

Generated: 2025-09-01
Status: VERIFIED - All issues confirmed as still pending
Updated: Added missing tickets from zen chat review

## Priority 1: CRITICAL - Data Integrity

### Ticket #1: Rollup Property Pagination Limit
**Severity**: HIGH  
**Impact**: Data loss - rollup properties truncate at 25 items  
**Evidence**: See code comment referencing `TECH_DEBT #1` in transforms.ts getRollupStrings function  
```typescript
// NOTE: The 'has_more' flag for rollups is only available on the `pages.properties.retrieve`
// endpoint, not the standard `pages.retrieve` response. The best we can do here is warn
// when we approach the known limit of 25 where pagination is likely to occur.
```

**Current Behavior**: 
- Rollup arrays silently truncate at 25 items
- Only console.warn when limit reached
- No way to fetch remaining items

**Required Fix**:
1. Refactor transform functions to use `pages.properties.retrieve` endpoint
2. Implement pagination for rollup properties when has_more=true
3. Add caching to avoid excessive API calls
4. Design cache invalidation strategy for related entities
5. Update all 4 entity transforms (Character, Element, Puzzle, Timeline)

**Acceptance Criteria**:
- All rollup items fetched, not just first 25
- Performance impact < 200ms per entity
- Cache rollup results for 5 minutes
- Unit tests for pagination logic

---

## Priority 2: HIGH - System Stability

### Ticket #2: Property-Based Entity Detection Fragile to Schema Changes
**Severity**: HIGH  
**Impact**: Silent failures if Notion schema changes  
**Evidence**: See code comment referencing `TECH_DEBT #2` in graphStateCapture.ts generateEdgesForEntities function  
```typescript
const characters = allEntities.filter(e => e && 'tier' in e && 'type' in e);
const elements = allEntities.filter(e => e && 'basicType' in e && 'status' in e);
```

**Current Behavior**:
- Uses property names to detect entity types
- Will break if properties renamed in Notion
- No error handling for misidentification

**Required Fix**:
1. Use database IDs from entityTypeDetection.ts pattern
2. Add validation that entity came from expected database
3. Add error logging for unidentified entities
4. Update both graphStateCapture.ts occurrences (lines 188-191 and generateEdgesForEntities lines 51-85)
5. Refactor generateEdgesForEntities to use typed entities or centralized utility

**Acceptance Criteria**:
- Entity detection uses database IDs, not properties
- Graceful handling of unknown entities
- Performance unchanged
- Tests for entity type detection

---

### Ticket #3: Placeholder Nodes Corrupt Delta Calculations
**Severity**: MEDIUM  
**Impact**: Incorrect cache invalidation when placeholders transition to real entities  
**Evidence**: See code comment referencing `TECH_DEBT #3` in deltaCalculator.ts calculateGraphDelta function  

**Current Behavior**:
- Placeholder nodes included in delta calculations
- Placeholder→real transitions marked as updates
- Can cause unnecessary cache invalidation

**Required Fix**:
1. Skip placeholder nodes in delta calculation
2. Handle placeholder→real as creation, not update
3. Handle real→placeholder as deletion
4. Add logging for placeholder transitions

**Acceptance Criteria**:
- Placeholders excluded from normal delta comparison
- Transitions handled correctly
- No false positive cache invalidations
- Integration test for placeholder scenarios

---

### Ticket #4: Test Delta Calculation Fallback Mechanism
**Severity**: MEDIUM  
**Impact**: Untested error handling could cause silent failures  
**Evidence**: See code comment referencing `TECH_DEBT #4` in deltaCalculator.ts calculateGraphDelta catch block  

**Current Behavior**:
- Delta calculation has try-catch fallback
- On error, returns full invalidation delta
- This critical path has no test coverage

**Required Fix**:
1. Create integration test that forces delta calculation error
2. Test various error scenarios (null nodes, corrupt edges, etc.)
3. Verify fallback returns correct full invalidation structure
4. Add logging to track fallback frequency in production

**Acceptance Criteria**:
- Integration test forces calculateGraphDelta to throw
- Verify catch block triggered and logged
- Verify returned delta has all nodes/edges in updated arrays
- Test coverage for error path > 80%

---

### Ticket #8: UPDATE Block Deep Nesting Causes Repeated Confusion
**Severity**: MEDIUM  
**Impact**: Developer time wasted on false syntax errors  
**Evidence**: See warning comment at line 430 in entityMutations.ts  

**Current Behavior**:
- UPDATE block has 3 levels of nesting within setQueryData callback
- Visually confusing brace structure has caused multiple "fix" attempts
- Developers repeatedly try to fix non-existent syntax errors
- Combined with wrong TypeScript compilation context, creates debugging cycles

**Required Fix**:
1. Extract UPDATE logic into separate helper function
2. Reduce nesting to maximum 2 levels
3. Use early returns to flatten structure
4. Add comprehensive comments on control flow

**Acceptance Criteria**:
- Maximum nesting depth of 2 within any function
- Clear visual structure that doesn't confuse developers
- No changes to actual behavior
- Tests still pass

---

## Priority 3: MEDIUM - Developer Experience

### Ticket #5: Missing Centralized Entity Type Mapping Utility
**Severity**: MEDIUM  
**Impact**: Duplicated brittle code for entity type detection  
**Evidence**: `/CHANGELOG.md:216` - TODO noted during Bug 5 fix  

**Current Behavior**:
- Entity type detection duplicated in multiple places
- Inconsistent approaches (property-based vs DB ID)
- Risk of divergence over time

**Required Fix**:
1. Create `/server/utils/entityTypeMapping.ts`
2. Centralize all entity type detection logic
3. Support both directions: entity→type and type→collection
4. Replace all inline detection with utility

**Acceptance Criteria**:
- Single source of truth for entity type detection
- All existing code migrated to use utility
- TypeScript type safety enforced
- Unit tests with 100% coverage

---

## Priority 4: LOW - Known Limitations

### Ticket #6: H2 Version Control 1-Second Granularity
**Severity**: LOW  
**Impact**: Version control fails for updates within same second  
**Evidence**: `/CHANGELOG.md:393-404` - Notion API limitation  

**Current Behavior**:
- Uses Notion's last_edited_time (1-second granularity)
- Concurrent edits within 1 second not detected
- Works for realistic user editing patterns

**Potential Mitigations**:
1. Add client-side debouncing (min 1 second between saves)
2. Implement optimistic locking with sequence numbers
3. Add warning UI for rapid concurrent edits
4. Document limitation clearly for users

**Note**: H2 version control IS implemented (see code comment referencing `TECH_DEBT #6` in createEntityRouter.ts), but has this Notion API limitation - no perfect fix possible without Notion changes.

---

## Additional Context

### Already Fixed (Verified)
- Bug 1: Parameter order in captureGraphState ✅
- Bug 2: Entity type detection for filtering ✅  
- Bug 3: Standalone entity filter ✅
- Bug 4: Edge generation property names ✅
- Bug 5: Race condition with inverse relations ✅
- Bug 8: H2 version control implemented (with 1-second limitation) ✅
- deltaCalculator refactored to type-aware helpers ✅

### Ticket #7: Duplicate Test Helper Definitions
**Severity**: LOW  
**Impact**: Code confusion and maintenance overhead  
**Evidence**: See code comment referencing `TECH_DEBT #7` in deltaCalculator.test.ts  

**Current Behavior**:
- `createGraphNode` defined at line 85 (unused, simpler version)
- `createGraphNode` redefined at line 380 (used by all integration tests, complex version)
- `calculator` variable defined at line 15 and redefined at line 373
- `beforeEach` setup duplicated at lines 17 and 375

**Problems**:
1. Top-level `createGraphNode` (lines 85-90) is dead code - never used
2. Integration test version (lines 380-393) shadows the top-level one
3. The two versions create different object shapes (integration version adds label, metadata, lowercases type)
4. Duplicate calculator setup is unnecessary - outer beforeEach already runs for all tests

**Required Fix**:
1. Remove unused top-level `createGraphNode` helper (lines 85-90)
2. Remove duplicate calculator definition and beforeEach from integration tests (lines 373-377)
3. Consider moving the integration test's createGraphNode to top level IF other tests need it
4. Add comment explaining why createGraphNode differs from simpler entity helpers

**Acceptance Criteria**:
- No shadowed variables in test file
- No dead code
- Clear helper organization
- Tests still pass

---

### Ticket #9: TypeScript Compilation Errors (Non-blocking)
**Severity**: LOW-MEDIUM  
**Impact**: False confidence in type safety, but app still runs  
**Evidence**: npm run typecheck shows multiple errors  
**Date Found**: 2025-09-01

**Current Errors (not blocking H6 work)**:
1. **Duplicate ApiError definitions** (entityMutations.test.ts:7, 52)
   - Two mock ApiError classes with same name
   - Should consolidate into single test helper
   
2. **Unused imports** (multiple test files)
   - `act` imported but never used
   - Various entity types imported but unused
   - Should clean up imports
   
3. **Test type mismatches** (useEntitySave.test.ts:111)
   - Mock puzzle missing required properties
   - Should use proper test builders
   
4. **Missing module** (mutations.ts:9)
   - Cannot find '@/types/graph'
   - File exists but import path may be wrong

**Not Fixing Now Because**:
- None block our H6 implementation
- Risk of introducing new bugs in unrelated code
- Would add days to timeline for minimal benefit
- App runs correctly despite these errors

**When to Fix**:
- During dedicated technical debt sprint
- When touching these specific files for features
- Before major version release

---

### Related to Phase 3 Work
- Bug 6 → Phase 3.1 (property names vs DB IDs) - Ticket #2
- Bug 7 → Phase 3.2 (placeholder handling) - Ticket #3
- Phase 3.3 needs clarification on "async timing issues"

### Testing Recommendations
1. Add integration tests for each ticket before fixing
2. Use tests as acceptance criteria validation
3. Run full regression suite after each fix
4. Monitor production metrics for impact

---

## Priority 3: MEDIUM - Feature Gaps

### Ticket #10: Batch Mutation Lacks Optimistic Updates
**Severity**: MEDIUM
**Impact**: Poor UX - no immediate feedback for batch operations
**Evidence**: zen chat review identified missing implementation in useBatchEntityMutation

**Current Behavior**:
- No `onMutate` handler for optimistic cache updates
- No `onError` rollback for atomic mode failures
- Uses simple invalidation instead of granular updates
- Partial success mode confuses success/error states

**Required Fix**:
1. Add `onMutate` handler similar to individual mutations
2. Implement cache snapshot and rollback for atomic mode
3. Add granular cache updates for partial success mode
4. Fix success/error state handling for Promise.allSettled
5. Consolidate toast notifications for better UX

**Acceptance Criteria**:
- All 13 failing batch mutation tests pass
- Optimistic updates visible immediately
- Atomic rollback works correctly
- Partial success updates only successful items
- Empty array input handled gracefully

**Test Coverage**: Already written - 10 comprehensive test cases covering all scenarios