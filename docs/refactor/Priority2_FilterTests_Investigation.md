# Priority 2: Filter Tests Investigation Log

## Date: 2025-01-04

## Objective
Implement Priority 2 from the test alignment plan: Component interaction tests between EntityTypeToggle and FilterPanels.

## Investigation Timeline & Discoveries

### Phase 1: Initial Implementation Attempt
**Decision**: Create new test file `src/test/integration/filter-interactions.test.tsx`

**Discoveries**:
1. **Import Path Issues**: Test utilities were in wrong location
   - Error: `../utils/test-utils` doesn't exist
   - Fix: Changed to `../test-utils`
   
2. **Missing Component Import**: GraphView wasn't imported
   - Error: GraphView is not defined
   - Fix: Added `import GraphView from '@/components/graph/GraphView'`

### Phase 2: Store Structure Misalignment
**Discovery**: Filter store structure was incomplete in tests

**Issues Found**:
- Missing `ownershipStatus` in characterFilters
- Missing `contentStatus` in contentFilters  
- Missing `hasIssues` in contentFilters
- Missing `lastEditedRange` in contentFilters
- Missing `elementBasicTypes` in contentFilters
- Missing `elementStatus` in contentFilters
- Missing `selectedCharacterId` in characterFilters

**Decision**: Add complete store initialization in beforeEach:
```typescript
useFilterStore.setState({
  entityVisibility: {
    character: true,
    puzzle: true,
    element: true,
    timeline: true
  },
  characterFilters: {
    selectedTiers: new Set(['Core', 'Secondary', 'Tertiary']),
    ownershipStatus: new Set(),
    characterType: 'all',
    selectedCharacterId: null
  },
  puzzleFilters: {
    selectedActs: new Set(['Act 0', 'Act 1', 'Act 2']),
    completionStatus: 'all'
  },
  contentFilters: {
    contentStatus: new Set(),
    hasIssues: null,
    lastEditedRange: 'all',
    elementBasicTypes: new Set(),
    elementStatus: new Set()
  }
});
```

### Phase 3: Component Rendering Issues
**Discovery**: renderWithProviders wasn't exported from test-utils

**Decision**: Implement renderWithProviders directly in test file
```typescript
function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ViewContextProvider>
          {component}
        </ViewContextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### Phase 4: Selector Strategy Issues
**Critical Discovery**: Test selectors were completely wrong

**User Feedback**: "what are we missing?"

**Investigation Results**:
- Was looking for: `role="region"` with aria-label
- Actual components: Don't have role="region", use direct label selectors
- CharacterFilterPanel renders checkboxes with labels, not regions

**Decision**: Change selector strategy:
```typescript
// Wrong approach:
const characterPanel = screen.getByRole('region', { name: /character filters/i });
const tierCheckboxes = within(characterPanel).getAllByRole('checkbox');

// Correct approach:
const secondaryCheckbox = screen.getByLabelText('Secondary');
await user.click(secondaryCheckbox);
```

### Phase 5: The Node Filtering Mystery
**Major Discovery**: Character and puzzle nodes aren't rendering despite being in mock data

**Investigation Using Zen Tracer**:
1. Mock API returns 4 nodes correctly:
   - 2 character nodes (char-alice, char-bob)
   - 1 puzzle node (puzzle-1)
   - 1 element node (elem-1)

2. Console logs show:
   ```
   Mock API returning nodes: [
     { id: 'char-alice', type: 'character' },
     { id: 'char-bob', type: 'character' },
     { id: 'puzzle-1', type: 'puzzle' },
     { id: 'elem-1', type: 'element' }
   ]
   ReactFlow received nodes: []
   ReactFlow received nodes: []
   ReactFlow received nodes: [{ id: 'elem-1', type: 'element' }]
   ```

3. **Root Cause Hypothesis**: The filtering logic in `useGraphLayout` is incorrectly filtering nodes

### Phase 6: Filter Logic Investigation
**Key Discovery**: Filter sets with size > 0 mean "only show these items"

**Code Analysis from useGraphLayout.ts**:
```typescript
// Line 135-137: Character tier filter
if (characterSelectedTiers.size > 0 && !characterSelectedTiers.has(entity.tier || '')) {
  return false;
}

// Line 142-144: Puzzle act filter  
if (puzzleSelectedActs.size > 0 && !puzzleSelectedActs.has(entity.act || '')) {
  return false;
}
```

**Problem Identified**: 
- Our mock entities have properties like `tier: 'Core'` and `timing: ['Act 1']`
- But the filter checks `entity.act` (doesn't exist) instead of `entity.timing`
- The filtering logic expects `act` as a string, but mock provides `timing` as an array

## Critical Findings

1. **Mock Data Structure Mismatch**:
   - Mock puzzles have `timing: ['Act 1']` 
   - Filter logic checks `entity.act`
   - This mismatch causes all puzzles to be filtered out

2. **Filter State Initialization**:
   - Setting filters to include all values (Set(['Core', 'Secondary', 'Tertiary']))
   - This means "show only these" not "exclude these"
   - Empty set means "show all"

3. **Component Structure**:
   - Production uses pre-configured panels (CharacterFilterPanel, etc.)
   - These don't have container regions, just direct checkbox/label pairs

4. **React Flow Mock**:
   - Successfully mocks node rendering
   - Shows exactly what nodes reach the component
   - Helpful for debugging filtering issues

## Decisions Made

1. **Test Structure**: Use integration tests to verify component interactions
2. **Mock Strategy**: Mock React Flow to verify node visibility changes
3. **Selector Strategy**: Use direct label selectors, not role-based queries
4. **Debug Approach**: Add console.log statements to trace data flow
5. **Investigation Tool**: Use zen tracer for precision debugging

## Current Status

**Blocked On**: Character and puzzle nodes being filtered out despite correct filter settings

**Next Steps**:
1. Fix mock data structure to match production expectations (act vs timing)
2. Verify filter logic alignment between mock and production
3. Complete component interaction tests once filtering works
4. Proceed with individual panel tests
5. Implement E2E test suite

## Lessons Learned

1. **Always verify mock data structure matches production**
2. **Test selectors should match actual component rendering**
3. **Filter logic can be inverted (include vs exclude)**
4. **Console logging in mocks helps trace data flow**
5. **Zen tracer is valuable for understanding execution paths**

## TODO Items Remaining

- [ ] Fix puzzle node filtering issue (act vs timing property)
- [ ] Complete "EntityTypeToggle affects FilterPanel results" test
- [ ] Complete "filters only apply to visible entity types" test  
- [ ] Create CharacterFilterPanel test
- [ ] Create PuzzleFilterPanel test
- [ ] Create ElementFilterPanel test
- [ ] Create DepthSlider test
- [ ] Create E2E filter behavior test
- [ ] Test E2E user workflow
- [ ] Test E2E filter combinations
- [ ] Verify all tests pass
- [ ] Update CHANGELOG with Priority 2 completion

## Technical Debt Identified

1. **Property Name Inconsistency**: `act` vs `timing` in puzzle entities
2. **Filter Logic Complexity**: Mixed concerns in useGraphLayout
3. **Test Utils**: renderWithProviders should be centralized
4. **Mock Alignment**: Need systematic way to ensure mocks match production