# Strategy Test Coverage Analysis

## Executive Summary

Analysis of test coverage for the 4 graph strategies that are scheduled for removal:
- `PuzzleFocusStrategy`
- `CharacterJourneyStrategy`
- `NodeConnectionsStrategy` 
- `TimelineStrategy`

**Key Finding**: The strategies have been largely superseded by the declarative view system, with minimal direct test dependencies.

## Current Strategy Usage

### Direct Strategy References
The strategies are currently imported and used only in:
- `src/lib/graph/GraphContext.ts` (lines 16-19) - Main usage point

### Test Files Analysis

#### 1. Files with Strategy References
- **`src/lib/graph/config/__tests__/DeclarativeViews.test.ts`**
  - **Type**: Unit tests for declarative view configurations
  - **Strategy Dependency**: Imports `StrategyDependencies` interface (line 20)
  - **Impact**: LOW - Only uses interface, not concrete strategies
  - **Test Coverage**: Tests TimelineConfig, NodeConnectionsConfig, CharacterJourneyConfig, PuzzleFocusConfig
  - **Expected Breakage**: None - tests use ViewBuilder with declarative configs

- **`src/lib/graph/config/__tests__/ViewBuilder.test.ts`**
  - **Type**: Unit tests for ViewBuilder engine
  - **Strategy Dependency**: Imports `StrategyDependencies` interface (line 15)
  - **Impact**: LOW - Only uses interface for mocking
  - **Test Coverage**: Tests ViewBuilder.build() method with configurations
  - **Expected Breakage**: None - uses mocked dependencies

#### 2. Integration Tests
- **`src/lib/graph/__tests__/transformers/integration.test.ts`**
  - **Strategy Dependency**: None direct - uses `buildGraphData()` 
  - **Impact**: MEDIUM - Tests view-specific filtering with viewType parameters
  - **Affected Areas**: Lines 228-248 test view-specific filtering
  - **Expected Breakage**: Tests using `viewType: 'puzzle-focus'` and `viewType: 'character-journey'` may fail

#### 3. Performance/Benchmark Tests
- **`src/lib/graph/__tests__/ViewComponentFactory.benchmark.tsx`**
  - **Strategy Dependency**: Imports view configurations (lines 17-19)
  - **Impact**: MEDIUM - Tests component performance with strategy-based configs
  - **Test Coverage**: Performance benchmarks for PuzzleFocusConfig, CharacterJourneyConfig, TimelineConfig
  - **Expected Breakage**: May fail if configs are removed/restructured

#### 4. ViewContext Integration Tests
- **`src/contexts/__tests__/ViewContext.integration.test.tsx`**
  - **Strategy Dependency**: Indirect - uses ViewConfigHelpers
  - **Impact**: LOW - Uses helper functions that generate configs
  - **Expected Breakage**: None if helpers are updated

## Strategy Interface Dependencies

### Files Using StrategyDependencies Interface
```typescript
// Only these test files import the interface:
src/lib/graph/config/__tests__/DeclarativeViews.test.ts:20
src/lib/graph/config/__tests__/ViewBuilder.test.ts:15
```

Both files use the interface for:
- Creating mock dependencies for testing
- Type annotations for test setup
- **Impact**: LOW - Interface removal requires updating mocks

## Test Functionality Validation

### Tests That Validate Strategy-Related Functionality

#### 1. Node Connection Traversal
- **File**: `DeclarativeViews.test.ts` (lines 117-137)
- **What it tests**: BFS traversal for node connections
- **Current approach**: Uses ViewBuilder with NodeConnectionsConfig
- **Post-removal**: Should continue working with declarative config

#### 2. Timeline Filtering
- **File**: `DeclarativeViews.test.ts` (lines 78-114)
- **What it tests**: Date-based event filtering
- **Current approach**: Uses ViewBuilder with TimelineConfig
- **Post-removal**: Should continue working with declarative config

#### 3. Character Journey Mapping
- **File**: `DeclarativeViews.test.ts` (lines 139-161)
- **What it tests**: Character relationship traversal
- **Current approach**: Uses ViewBuilder with CharacterJourneyConfig
- **Post-removal**: Should continue working with declarative config

#### 4. Puzzle Chain Analysis
- **File**: `DeclarativeViews.test.ts` (lines 163-182)
- **What it tests**: Puzzle dependency traversal
- **Current approach**: Uses ViewBuilder with PuzzleFocusConfig
- **Post-removal**: Should continue working with declarative config

## Coverage Reports

No recent coverage reports found in `/coverage` directory. To generate current coverage:
```bash
npm run test:coverage
```

## Expected Impact Assessment

### HIGH RISK - Tests Likely to Break
None identified. The test architecture has been well-designed to decouple from strategies.

### MEDIUM RISK - Tests Requiring Updates
1. **Integration Test View Filtering** (`integration.test.ts:228-248`)
   - **Issue**: Uses `viewType` parameters that may map to strategies
   - **Fix**: Update to use declarative config IDs or filter expressions

2. **Performance Benchmarks** (`ViewComponentFactory.benchmark.tsx`)
   - **Issue**: References strategy-based configurations
   - **Fix**: Update imports to use declarative configs

### LOW RISK - Tests Requiring Minor Changes
1. **Strategy Interface Mocks** (DeclarativeViews.test.ts, ViewBuilder.test.ts)
   - **Issue**: Import `StrategyDependencies` interface
   - **Fix**: Remove interface import, update mock structure

2. **ViewContext Integration** (`ViewContext.integration.test.tsx`)
   - **Issue**: May indirectly reference strategy-based configs
   - **Fix**: Verify helper functions generate correct declarative configs

## Recommendations

### Pre-Removal Testing
1. **Run Full Test Suite**: `npm run test:run`
2. **Generate Coverage Report**: `npm run test:coverage`
3. **Run Integration Tests**: `npm run test:integration`
4. **Performance Benchmarks**: Check if benchmark tests pass

### Test Fixes Required

#### 1. Update Interface Dependencies
```typescript
// Remove from test files:
import type { StrategyDependencies } from '../../core/ViewStrategy.interface';

// Replace with direct module dependencies or remove if unused
```

#### 2. Update Integration Test View Types
```typescript
// Change from:
const puzzleGraph = buildGraphData(mockNotionData, {
  viewType: 'puzzle-focus',
  maxDepth: 2
}, context);

// To:
const puzzleGraph = buildGraphData(mockNotionData, {
  configId: 'puzzle-focus',
  maxDepth: 2
}, context);
```

#### 3. Update Performance Test Imports
```typescript
// Change from:
import { PuzzleFocusConfig } from '@/lib/graph/config/views/PuzzleFocusConfig';

// To: (if configs remain)
import { PuzzleFocusConfig } from '@/lib/graph/config/views/PuzzleFocusConfig';
// Or use ViewConfigHelpers if configs are generated
```

### Post-Removal Validation

1. **Verify Declarative System Coverage**
   - Ensure all strategy functionality is covered by declarative configs
   - Test that ViewBuilder properly processes all config types

2. **Update Test Descriptions**
   - Remove references to "strategy" in test names and descriptions
   - Update to reflect declarative approach

3. **Integration Test Updates**
   - Verify view filtering still works with new system
   - Test performance impact of declarative vs strategy approach

## Conclusion

**Risk Level**: LOW to MEDIUM

The test suite is well-architected and largely decoupled from the strategy implementations. Most tests use either:
1. **Declarative configs** - Will continue working
2. **Mocked dependencies** - Easy to update
3. **High-level API calls** - Should remain compatible

The primary risk is in integration tests that use view type filtering, which may need updates to work with the new declarative system. Performance benchmarks may also need configuration updates.

**Recommended approach**: Remove strategies incrementally, updating tests as failures occur, rather than trying to predict all changes needed.