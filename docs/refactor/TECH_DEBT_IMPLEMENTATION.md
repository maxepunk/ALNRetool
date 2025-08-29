# Technical Debt Elimination - Implementation Guide

## Overview
This document provides a step-by-step implementation guide for eliminating technical debt in ALNRetool. Each step includes expected errors, dependencies, and validation checkpoints.

**CRITICAL**: Follow steps IN ORDER. Some steps will temporarily break TypeScript/linting until subsequent steps are completed.

## ACTUAL Current State Baseline (As of entity-creation-feature branch)

### Build & Compilation
- ✅ **TypeScript**: CLEAN (0 errors) - The 98 errors in CLAUDE.md are outdated
- ✅ **Build**: PASSES - `npm run build` succeeds
- ⚠️ **Tests**: 92% passing (12 failures out of 147, mostly edge label issues in relationships.test.ts)
- ⚠️ **Linting**: 507 warnings (no errors, mostly about `any` types and nullish coalescing)

### Known Critical Issues
1. **Dual Cache Update Race Condition** [BLOCKS SYNC]
   - Location: entityMutations.ts lines 113-143
   - Impact: Entity appears twice, disappears, then reappears
   - User complaint: "synchronization issues between editing and rendering pipelines"

2. **N+1 Query Performance** [CAUSES 8-10s LOAD]
   - Location: server/routes/notion/base.ts lines 129-140  
   - Impact: 100+ sequential API calls on initial load
   - Each page with relations triggers multiple awaited API calls in a loop

3. **Sequential Data Loading** [CAUSES BLANK SCREEN]
   - Location: GraphView.tsx lines 141-160
   - Impact: 4 separate queries run sequentially, waterfall pattern
   - User sees blank screen for 2-3 seconds

### What's Actually Working
- Graph renders correctly (after loading)
- Entity CRUD works (with sync issues)
- Filters function properly  
- React Flow integration is solid
- Notion API integration works

## Pre-Implementation Checklist

### 1. Create Safety Net COMPLETE ✅
```bash
# Create backup branch
git checkout -b pre-cleanup-backup
git push origin pre-cleanup-backup

# Create implementation branch
git checkout -b tech-debt-elimination

# Document ACTUAL current state (not "ensure tests pass")
npm run test:run 2>&1 | tee baseline-test-results.txt
# Expected: 12 failures, 135 passing

npm run typecheck 2>&1 | tee baseline-typecheck.txt  
# Expected: CLEAN (0 errors)

npm run lint 2>&1 | grep -c "warning" | tee baseline-lint-count.txt
# Expected: ~507 warnings

# Document current broken behavior
echo "=== Known Issues Before Fix ===" > baseline-issues.md
echo "1. Dual cache updates cause entity sync issues" >> baseline-issues.md
echo "2. N+1 queries cause 8-10 second load times" >> baseline-issues.md
echo "3. Sequential data fetching causes blank screen" >> baseline-issues.md
echo "4. 12 test failures (edge label issues)" >> baseline-issues.md
```

### 2. Add Performance Monitoring (FIRST STEP - NO BREAKING CHANGES) COMPLETE ✅ 
Create new file `src/utils/performance.ts`:
```typescript
export const perfLog = {
  apiCalls: 0,
  cacheUpdates: 0,
  renders: new Map<string, number>(),
  
  reset() {
    this.apiCalls = 0;
    this.cacheUpdates = 0;
    this.renders.clear();
  },
  
  report() {
    console.log('=== Performance Report ===');
    console.log(`API Calls: ${this.apiCalls}`);
    console.log(`Cache Updates: ${this.cacheUpdates}`);
    console.log('Component Renders:', Object.fromEntries(this.renders));
  }
};

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).perfLog = perfLog;
}
```

**Expected**: No errors. This is additive only.
**Test**: `npm run typecheck` should still pass

---

## Phase 1: Remove Dual Cache Update Pattern (HIGH PRIORITY FIX) COMPLETE ✅

### Step 1.1: Understand the Problem COMPLETE ✅
**Current Issue**: When creating an entity with a parent relation, the cache is updated TWICE:
1. Once in `entityMutations.ts` lines 114-143 (client-side)
2. Once via server response triggering React Query's normal update

This causes:
- Race conditions
- Synchronization issues between editing and rendering pipelines
- Duplicate renders
- Inconsistent state

### Step 1.2: Remove Client-Side Parent Update COMPLETE ✅ 
**File**: `src/hooks/mutations/entityMutations.ts`
**Action**: Remove lines 113-143 (the entire `if (variables._parentRelation)` block)

```typescript
// DELETE THIS ENTIRE BLOCK (lines 113-143):
if (variables._parentRelation) {
  const { parentType, parentId, fieldKey } = variables._parentRelation;
  const parentQueryKey = getQueryKeyForType(parentType as EntityType);
  
  // Update parent entity in list cache
  queryClient.setQueryData(parentQueryKey, (oldData: any[] | undefined) => {
    // ... rest of the block
  });
  
  // Update parent individual cache  
  queryClient.setQueryData([...parentQueryKey, parentId], (oldParent: any) => {
    // ... rest of the block
  });
}

// REPLACE WITH THIS COMMENT:
// Parent relation updates are handled server-side atomically
// This prevents dual cache updates and race conditions
```

**Expected TypeScript Errors**: NONE
**Expected Linter Warnings**: Possibly unused `_parentRelation` in type - IGNORE for now
**Expected Runtime Behavior**: Parent relations still work because server handles the update

### Step 1.3: Verify Server-Side Handling COMPLETE ✅
**File**: `server/routes/notion/[entity].ts` files
**Check**: Ensure create endpoints properly handle parent relations

The server should already be updating parent relations in Notion, which then gets reflected when React Query refetches or invalidates.

### Step 1.4: Test Checkpoint COMPLETE ✅
```bash
# Start the app
npm run dev

# Test creation with parent relation:
1. Open browser DevTools Console
2. Type: window.perfLog.reset()
3. Create a new character with a parent element
4. Type: window.perfLog.report()
5. Should see exactly 1 cache update (not 2)
6. Parent should still show the child relation

# If test fails, check server logs for errors
```

**Commit**: `git commit -m "fix: remove dual cache update pattern in entity creation"`


**implementation details are available at @PHASE_1_COMPLETE.md**
---

## Phase 2: Clean Dead Code (LOW RISK) COMPLETE ✅

### Step 2.1: Remove Unused Imports COMPLETE ✅
```bash
# Auto-fix imports
npx eslint . --fix

# Find unused exports (save for reference)
npx ts-prune | grep -v "used in module" > unused-exports.txt
```

**Expected**: Many imports removed, no functional changes
**Test**: App should still compile and run

### Step 2.2: Delete Zombie Files COMPLETE ✅
Check if these files still exist and have no imports:
- `src/hooks/useCacheInvalidation.ts`
- `src/hooks/useSynthesizedData.ts`
- Any components in `src/components/old/` or `src/components/deprecated/`

```bash
# Find files with no imports
for file in $(find src -name "*.ts" -o -name "*.tsx"); do
  count=$(grep -c "import.*from.*$file" src -r 2>/dev/null || echo 0)
  if [ "$count" -eq 0 ]; then
    echo "Potentially unused: $file"
  fi
done
```

**Expected TypeScript Errors**: 
- Missing imports for deleted files - FIX IMMEDIATELY
- These are real errors that need addressing

**Commit**: `git commit -m "chore: remove dead code and unused imports"`


**implementation details are available at @PHASE_2_COMPLETE.md**
---

## Phase 3: Simplify Mutation Factory (MEDIUM COMPLEXITY) COMPLETE ✅

### Step 3.1: Create Explicit Hooks Alongside Factory COMPLETE ✅
**Strategy**: Keep factory working while adding explicit hooks. This prevents breaking changes.

**File**: Create new file `src/hooks/mutations/explicit.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { charactersApi, elementsApi, puzzlesApi, timelineApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

// Character mutations (explicit)
export function useCreateCharacterExplicit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: charactersApi.create,
    onSuccess: (character) => {
      // Single, simple cache update
      queryClient.setQueryData(
        queryKeys.characters(),
        (old: Character[] = []) => [...old, character]
      );
      queryClient.setQueryData(
        [...queryKeys.characters(), character.id],
        character
      );
    }
  });
}

export function useUpdateCharacterExplicit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Character> & { id: string }) => 
      charactersApi.update(id, data),
    onSuccess: (character) => {
      queryClient.setQueryData(
        queryKeys.characters(),
        (old: Character[] = []) => 
          old.map(c => c.id === character.id ? character : c)
      );
      queryClient.setQueryData(
        [...queryKeys.characters(), character.id],
        character
      );
    }
  });
}

// Repeat for Element, Puzzle, Timeline...
```

**Expected TypeScript Errors**: NONE if types are correct
**Expected Behavior**: Both old and new hooks work side-by-side
 
### Step 3.2: Gradually Migrate Components COMPLETE ✅
**Strategy**: Update one component at a time

Example migration in `src/components/DetailPanel.tsx`:
```typescript
// OLD:
import { useUpdateCharacter } from '@/hooks/mutations';

// NEW:
import { useUpdateCharacterExplicit } from '@/hooks/mutations/explicit';

// Then rename in the component:
const updateMutation = useUpdateCharacterExplicit();
```

**Expected TypeScript Errors**: 
- Type mismatches if API changed - FIX AS YOU GO
- These indicate real API contract issues

### Step 3.3: Remove Factory After Full Migration
Only after ALL components migrated:
1. Delete the factory function from `entityMutations.ts`
2. Move explicit hooks to main file
3. Remove the old imports

**Test Checkpoint**: Each component should work after migration
**Commit**: `git commit -m "refactor: replace mutation factory with explicit hooks"`


**implementation details are available at @PHASE_3_COMPLETE.md**
---

## Phase 4: Fix N+1 Query (BACKEND PERFORMANCE)

### Step 4.1: Add Logging to Measure Impact COMPLETE ✅
**File**: `server/routes/notion/base.ts`

Add at top of file:
```typescript
let apiCallCounter = 0;
```

Add in `fetchCompleteRelationProperty`:
```typescript
console.log(`[PERF] Notion API call #${++apiCallCounter} - Fetching relation ${propertyId}`);
```

**Test Current Performance**:
1. Load the app
2. Check server console
3. Should see 100+ API calls

### Step 4.2: Implement Parallel Fetching COMPLETE ✅
**File**: `server/routes/notion/base.ts`
**Line**: ~129-140

```typescript
// OLD CODE (SEQUENTIAL):
for (const page of response.results) {
  for (const [propName, prop] of Object.entries(page.properties)) {
    if (prop.type === 'relation' && (prop as any).has_more) {
      const completeRelation = await fetchCompleteRelationProperty(page.id, prop.id);
      page.properties[propName] = completeRelation;
    }
  }
  pages.push(page);
}

// NEW CODE (PARALLEL):
// Collect all relation fetches needed
const relationFetches = response.results.flatMap(page => 
  Object.entries(page.properties)
    .filter(([_, prop]) => prop.type === 'relation' && (prop as any).has_more)
    .map(([propName, prop]) => ({
      pageId: page.id,
      propId: prop.id,
      propName,
      page
    }))
);

// Fetch all relations in parallel
const relationResults = await Promise.all(
  relationFetches.map(({ pageId, propId }) => 
    fetchCompleteRelationProperty(pageId, propId)
  )
);

// Apply results back to pages
relationFetches.forEach((fetch, index) => {
  fetch.page.properties[fetch.propName] = relationResults[index];
});

// Add pages to results
pages.push(...response.results);
```

**Expected TypeScript Errors**: Possible type assertions needed
**Expected Performance**: API calls drop from 100+ to <10
**Test**: Load app, check server console for call count

**Commit**: `git commit -m "fix: resolve N+1 query with parallel relation fetching"`


**implementation details are available at @PHASE_4_COMPLETE.md**
---

## Phase 5: Optimize Frontend Data Fetching COMPLETE ✅

### Step 5.1: Current Problem Analysis COMPLETE ✅
**File**: `src/components/graph/GraphView.tsx`
**Issue**: 4 sequential queries causing waterfall

### Step 5.2: Implement Parallel Queries COMPLETE ✅
```typescript
// OLD:
const { data: characters = [] } = useCharacters();
const { data: elements = [] } = useElements();
const { data: puzzles = [] } = usePuzzles();
const { data: timeline = [] } = useTimeline();

// NEW:
import { useQueries } from '@tanstack/react-query';

const results = useQueries({
  queries: [
    { queryKey: queryKeys.characters(), queryFn: charactersApi.getAll },
    { queryKey: queryKeys.elements(), queryFn: elementsApi.getAll },
    { queryKey: queryKeys.puzzles(), queryFn: puzzlesApi.getAll },
    { queryKey: queryKeys.timeline(), queryFn: timelineApi.getAll },
  ]
});

const [
  { data: characters = [] },
  { data: elements = [] },
  { data: puzzles = [] },
  { data: timeline = [] }
] = results;

const isLoading = results.some(r => r.isLoading);
const isError = results.some(r => r.isError);
```

**Expected TypeScript Errors**: 
- Type inference might need help: `as Character[]` etc.
- API response type mismatches - FIX THESE

**Commit**: `git commit -m "perf: parallel data fetching for initial load"`

---

## Phase 6: Clean Memoization COMPLETE ✅

### Step 6.1: Fix JSON.stringify Anti-Pattern
**File**: `src/hooks/graph/useFilteredEntities.ts`
**Line**: ~123-131

```typescript
// OLD (causes re-renders):
const filterKey = JSON.stringify({
  searchTerm,
  characterType,
  characterSelectedTiers: Array.from(characterSelectedTiers),
  // ...
});

// NEW (stable reference):
const filterKey = useMemo(() => ({
  searchTerm,
  characterType,
  characterTiers: characterSelectedTiers.size,
  puzzleActs: puzzleSelectedActs.size,
  elementTypes: elementBasicTypes.size,
  elementStatuses: elementStatus.size,
}), [
  searchTerm,
  characterType,
  characterSelectedTiers.size,
  puzzleSelectedActs.size,
  elementBasicTypes.size,
  elementStatus.size
]);
```

**Expected**: Fewer re-renders, better performance
**Test**: Use React DevTools Profiler to verify

**Commit**: `git commit -m "perf: optimize memoization dependencies"`

---

## Validation Checklist

After each phase, run:
```bash
npm run test:run        # All tests pass?
npm run typecheck       # No TS errors?
npm run lint           # Clean linting?
npm run dev            # App loads?
```

Manual testing:
- [ ] Create entity with parent relation
- [ ] Update entity properties  
- [ ] Delete entity (if implemented)
- [ ] Filter changes update graph
- [ ] No console errors
- [ ] No infinite re-renders

Performance validation:
- [ ] Initial load <2 seconds
- [ ] API calls <10 on load
- [ ] Cache updates: 1 per mutation
- [ ] Smooth graph interactions

---

## Rollback Strategy

If any phase causes critical issues:
```bash
# Rollback to last known good commit
git reset --hard HEAD~1

# Or rollback to backup branch
git checkout pre-cleanup-backup
git checkout -b tech-debt-attempt-2
```

---

## Common Pitfalls to Avoid

1. **Don't fix TypeScript errors with `any`** - They indicate real issues
2. **Don't skip test checkpoints** - Each phase should leave app working
3. **Don't combine phases** - Sequential dependencies exist
4. **Don't ignore console warnings** - They often indicate race conditions
5. **Don't assume server handles things** - Verify with logs

---

## Success Metrics

Track these before and after:

| Metric | Before | Target | Actual |
|--------|--------|--------|--------|
| Initial Load Time | ~8s | <2s | TBD |
| API Calls on Load | 100+ | <10 | TBD |
| Cache Updates per Mutation | 2 | 1 | TBD |
| Re-renders per Action | 10+ | 2-3 | TBD |
| Total Lines of Code | 12,000 | 8,000 | TBD |
| TypeScript Errors | 98 | 0 | TBD |

---

## Notes During Implementation

### Expected Temporary Issues
- **After Phase 3 Step 1**: Both old and new hooks exist - this is OK temporarily
- **During Phase 4**: Server logs will be verbose - remove after testing
- **During Phase 5**: Loading states might flicker - will stabilize after parallel queries

### Dependencies Between Changes
- Phase 1 MUST complete before testing any mutations
- Phase 3 can happen in parallel with Phase 2
- Phase 4 is independent (backend only)
- Phase 5 depends on Phase 4 for full benefit
- Phase 6 can happen anytime

### Do NOT Attempt These Yet
- Removing the factory pattern completely (wait until all components migrated)
- Deleting test files (even if they look unused)
- Changing the Notion API integration patterns
- Modifying the GraphContext provider
- Touching React Flow internals

---

## Questions to Answer Before Starting Each Phase

1. Are all tests currently passing?
2. Is the current state committed?
3. Do I understand what errors to expect?
4. Do I have a rollback plan?
5. Can I test this phase in isolation?

---

## Final Note

This refactoring is about SIMPLIFICATION, not perfection. Every line of code removed is a potential bug eliminated. When in doubt, choose the simpler solution.

Remember: The goal is a codebase that a solo developer can easily maintain and extend. If you can't explain a piece of code in one sentence, it's too complex.