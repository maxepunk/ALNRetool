Objective (from Step 1)

  Ensure integration tests properly test FilterPanel vs EntityTypeToggle behavior aligned with
  production usage, identifying all gaps and misalignments that could impact development.

  Validated Context (from Steps 4-7)

  Production Structure (Sidebar.tsx):
  1. EntityTypeToggle - Controls entity type visibility (show/hide all)
  2. CharacterFilterPanel - Filters characters by tier and type
  3. PuzzleFilterPanel - Filters puzzles by act and completion
  4. ElementFilterPanel - Filters elements by type and status
  5. DepthSlider - Controls connection depth

  Current Test Structure Problems:
  1. Component Mismatch: Tests use generic FilterPanel with custom configs instead of pre-configured
   panels
  2. Incorrect Filter Keys: Tests use wrong keys like 'characterSelectedTiers' instead of nested
  structure 'characterFilters.selectedTiers'
  3. Missing Coverage: No tests for DepthSlider, no e2e tests, no unit tests
  4. Incomplete Scenarios: Missing interaction tests between EntityTypeToggle and FilterPanels

  Critical Findings

  ✅ What's Correct:
  - First test correctly uses EntityTypeToggle for entity visibility
  - Test behaviors are comprehensive (visibility, URL sync, persistence, status)
  - Mock structure now includes ReactFlowProvider

  ❌ What's Wrong:
  1. Tests 2-5 use wrong component structure:
  // CURRENT (WRONG):
  <FilterPanel
    title="Character Filters"
    filters={{ characterSelectedTiers: {...} }}
  />

  // SHOULD BE:
  <CharacterFilterPanel />
  2. Filter keys don't match store structure:
  // WRONG: 'tiers', 'acts', 'basicTypes'
  // RIGHT: 'characterFilters.selectedTiers', 'puzzleFilters.selectedActs', 
  'contentFilters.elementBasicTypes'
  3. Missing test coverage:
    - No tests for pre-configured panels with correct behavior
    - No tests for DepthSlider
    - No e2e tests for full user workflow
    - No unit tests for individual components

  Recommendations

  Immediate Fixes (Priority 1):

  1. Fix filter-behavior.test.tsx structure:
  // Replace generic FilterPanel with actual components
  import { CharacterFilterPanel, PuzzleFilterPanel, ElementFilterPanel } from
  '@/components/sidebar/FilterPanel';
  import EntityTypeToggle from '@/components/filters/EntityTypeToggle';
  import { DepthSlider } from '@/components/sidebar/DepthSlider';
  2. Create proper test structure matching production:
  renderWithProviders(
    <div>
      <EntityTypeToggle />
      <CharacterFilterPanel />
      <PuzzleFilterPanel />
      <ElementFilterPanel />
      <DepthSlider />
      <GraphView />
    </div>
  );
  3. Fix filter key access in tests:
  // Instead of checking URL for 'tiers=Core'
  // Check for proper nested structure or use store methods correctly
  const state = useFilterStore.getState();
  expect(state.characterFilters.selectedTiers.has('Core')).toBe(true);

  New Tests Needed (Priority 2):

  1. Component interaction test:
    - Test that EntityTypeToggle hiding characters also hides filtered character results
    - Test that filters only apply to visible entity types
  2. Individual panel tests:
    - CharacterFilterPanel: Test tier and type filtering
    - PuzzleFilterPanel: Test act and completion filtering
    - ElementFilterPanel: Test basicType and status filtering
    - DepthSlider: Test connection depth changes
  3. E2E test suite:
  // tests/e2e/filter-behavior.spec.ts
  - Full user workflow: Apply filters → See results → Navigate → Filters persist
  - Filter combination scenarios
  - Performance with many filters

  Test Organization (Priority 3):

  1. Create unit tests:
    - src/components/filters/EntityTypeToggle.test.tsx
    - src/components/sidebar/FilterPanel.test.tsx
    - src/components/sidebar/DepthSlider.test.tsx
  2. Reorganize integration tests:
    - filter-visibility.test.tsx - EntityTypeToggle behavior
    - filter-granular.test.tsx - FilterPanel behaviors
    - filter-persistence.test.tsx - URL and storage
    - filter-interactions.test.tsx - Component interactions

  Risk Mitigation

  1. Current Risk: Tests passing but not testing actual production behavior
    - Mitigation: Update tests immediately to use correct components
  2. Future Risk: Tests becoming misaligned again
    - Mitigation: Add lint rule to prevent direct FilterPanel usage in tests
  3. Coverage Risk: Missing edge cases
    - Mitigation: Add coverage requirements for filter components (minimum 80%)

  Success Criteria

  ✅ All integration tests use actual production components
  ✅ Filter keys match store structure exactly
  ✅ Coverage for all filter components >80%
  ✅ E2E tests cover complete user workflows
  ✅ No generic FilterPanel usage in tests (only pre-configured panels)
  ✅ Tests fail when production behavior breaks