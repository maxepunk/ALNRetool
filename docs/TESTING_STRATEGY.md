# ALNRetool Testing Strategy

**Last Updated**: January 19, 2025  
**Current Status**: Sprint 2 Near Completion

## Current Test Suite Status

### Metrics
- **Unit Tests**: 500+ passing - 99% pass rate
- **Integration Tests**: 23/23 passing (100% - backend API validation)
- **Graph Module**: 12+ focused modules with comprehensive tests
  - LayoutQualityMetrics: 100% test coverage
  - VirtualEdgeInjector: Full test suite
  - ElementClusterer: Collision detection tests
  - BaseTransformer: Pattern validation tests
- **Test Files**: 30+ files
- **Coverage**: ~90% of critical paths
- **Runtime**: ~10 seconds for unit tests, ~15 seconds for integration

### Code Quality
- **ESLint**: Clean build
- **TypeScript**: Strict mode compliant (all 126 errors fixed)
- **Build Status**: ✅ Production build working on Render.com
- **CI/CD**: GitHub Actions pipeline running on every push

### Recent Achievements
- Modularized graph system with comprehensive test coverage
- Implemented BaseTransformer pattern with full test suite
- Added mutation testing for two-way Notion sync
- Achieved TypeScript strict mode compliance
- Enhanced test infrastructure for DetailPanel components

## Testing Philosophy: Trophy Model

We adopt the **Trophy Model** over the traditional Testing Pyramid:

```
    Traditional Pyramid              Trophy Model (Our Choice)
          /\                              ____
         /E2E\                           /E2E \
        /------\                        /------\
       /  Integ \                      /        \
      /----------\                    / Integration\
     /    Unit    \                  /              \
    /--------------\                /    Unit Tests  \
```

### Why Trophy Model?

Our application architecture:
```
Notion API → Express Proxy → Transform → React Flow → User
           ↑               ↑           ↑            ↑
      Integration      Unit Tests  Integration     E2E
```

Most of our code is **integration/glue code**, not complex business logic.

## What We Test

### ✅ HIGH VALUE - Always Test

| Component | Test Type | Why | Current Status |
|-----------|-----------|-----|----------------|
| Graph Transformers | Unit | Pure functions, core business logic | ✅ Modularized with tests |
| BaseTransformer Pattern | Unit | Shared transformation logic | ✅ 100% coverage |
| VirtualEdgeInjector | Unit | Dual-role element handling | ✅ Full test suite |
| ElementClusterer | Unit | Collision detection algorithms | ✅ Comprehensive tests |
| LayoutQualityMetrics | Unit | Layout optimization | ✅ 100% coverage |
| SF_ Pattern Parser | Unit | Game mechanics parsing | ✅ 100% coverage |
| Relationship Resolver | Unit | Graph algorithms | ✅ 100% coverage |
| Express API Endpoints | Integration | Critical data flow | ✅ 23/23 passing |
| Notion API Integration | Integration | External dependency | ✅ 100% coverage |
| Mutation Hooks | Integration | Two-way sync logic | ✅ Tested with MSW |
| React Query Hooks | Integration | Data fetching logic | ✅ ~200 tests passing |
| Cache Layer | Integration | Performance critical | ✅ Fully tested |
| Error Handlers | Unit | User experience critical | ✅ Tested |
| DetailPanel Components | Component | Interactive editing UI | ✅ Tested |

### ❌ LOW VALUE - Don't Test

| Component | Why Skip | Alternative |
|-----------|----------|-------------|
| useGraphState | Thin React Flow wrapper | Test via E2E |
| useGraphLayout | Config wrapper | Test via E2E |
| useGraphInteractions | Event handler wrapper | Test via E2E |
| Node Components | Just render props to React Flow | Visual regression |
| Layout Configs | Static configuration | N/A |

### 🔄 PENDING DECISION - Under Review

| Component | Current State | Options |
|-----------|--------------|---------|
| AppLayout Tests (5) | Skipped | Fix, replace with E2E, or rewrite as integration |
| - Navigation pending | Tests React Router state | User experience feature |
| - Breadcrumb navigation | Tests navigation | User journey |
| - Keyboard focus | Accessibility | Required for a11y |
| - Error boundaries | Error handling | Critical for resilience |
| - Error reset | Recovery flow | User experience |

## Testing Patterns

### When to Write Unit Tests
```typescript
// YES: Pure business logic
function calculatePuzzleDifficulty(puzzle: Puzzle): number {
  // Complex algorithm
  return difficulty;
}

// NO: Library wrapper
function useGraphState() {
  return useReactFlow(); // Just wrapping library
}
```

### When to Write Integration Tests
```typescript
// YES: Data flow
test('fetches and transforms Notion data', async () => {
  const data = await fetchCharacters();
  expect(data).toMatchSchema();
});

// YES: API endpoints
test('GET /api/notion/puzzles returns data', async () => {
  const response = await request(app).get('/api/notion/puzzles');
  expect(response.status).toBe(200);
});
```

### When to Write E2E Tests
```typescript
// YES: Critical user journeys
test('user can view and interact with puzzle graph', async () => {
  await page.goto('/puzzles');
  await page.click('[data-testid="puzzle-node"]');
  await expect(page.locator('[data-testid="details-panel"]')).toBeVisible();
});
```

## New Testing Patterns (Sprint 2)

### Modular Testing Strategy
With the graph module refactoring, we introduced focused testing per module:

```typescript
// Each module has its own test file
describe('VirtualEdgeInjector', () => {
  test('detects dual-role elements', () => {
    const elements = [/* test data */];
    const injector = new VirtualEdgeInjector();
    const result = injector.detectDualRoleElements(elements, puzzles);
    expect(result).toHaveLength(2);
  });
});
```

### BaseTransformer Pattern Testing
Shared transformation logic is tested once at the base level:

```typescript
// Test base functionality once
describe('BaseTransformer', () => {
  test('validates entities consistently', () => {
    const transformer = new ConcreteTransformer();
    expect(transformer.validateEntity(invalidEntity)).toBe(false);
  });
});
```

### Mutation Testing with Optimistic Updates
Test two-way sync with mock responses:

```typescript
// Test optimistic updates and rollback
test('handles failed mutations with rollback', async () => {
  server.use(
    rest.put('/api/notion/puzzles/:id', (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );
  
  const { result } = renderHook(() => useMutatePuzzle());
  await act(async () => {
    await result.current.mutateAsync(updatedPuzzle);
  });
  
  // Verify rollback occurred
  expect(queryClient.getQueryData(['puzzles'])).toEqual(originalData);
});
```

## Sprint-by-Sprint Testing Goals

### Sprint 1 (Complete)
- [x] Unit tests for transformers
- [x] Integration tests for API
- [x] React Query tests
- [x] Fix build issues
- [x] Document testing strategy

### Sprint 2 (Near Complete)
- [x] Modular graph tests (12+ modules)
- [x] BaseTransformer pattern tests
- [x] Mutation hook tests
- [x] DetailPanel component tests
- [x] TypeScript strict mode compliance
- [ ] E2E tests for critical paths

### Sprint 2 (Mutations)
- [x] Integration tests for optimistic updates
- [x] Mutation error recovery tests
- [ ] One E2E test for complete flow

### Sprint 3 (Visual Polish)
- [ ] Visual regression tests (Percy/Chromatic)
- [ ] Accessibility tests (axe-core)
- [ ] Performance benchmarks

### Sprint 4+ (Scale)
- [ ] Load testing (50+ users)
- [ ] Stress testing (500+ nodes)
- [ ] Security testing

## Success Metrics

| Metric | Current | Target | Why |
|--------|---------|--------|-----|
| Test Runtime | ~6.5s | <30s | Fast feedback loop |
| Test Maintenance | Unknown | <1hr/sprint | Developer velocity |
| Coverage (meaningful) | ~97% | 95%+ | Focus on value, not % |
| Bug Escape Rate | N/A | <5% critical | Quality measure |
| Build Success | ❌ | ✅ | Must ship |

## Decisions Log

### January 15, 2025
- **Decision**: Adopt Trophy Model testing strategy
- **Rationale**: Most code is integration/glue, not complex logic
- **Action**: Deleted useGraphState.test.tsx (9 low-value tests)
- **Result**: Clearer testing boundaries, less mock complexity

## Known Issues

### Skipped Tests
- **Count**: 5 in AppLayout.test.tsx
- **Type**: Navigation, accessibility, error handling
- **Decision**: Pending - may have value, need investigation

## Migration Guide

### For Developers

**Before writing a test, ask:**
1. Is this testing my code or the library?
2. Would an integration test be better?
3. What user value does this test verify?

**If the answer is "testing the library"** → Don't write the test

**If the answer is "testing integration"** → Write an integration test

**If the answer is "testing user journey"** → Write an E2E test

### For Code Review

**Reject tests that:**
- Mock everything to test nothing
- Test implementation details
- Test third-party libraries
- Have more mock setup than actual test

**Approve tests that:**
- Test business logic
- Test user journeys
- Test data transformations
- Are readable and maintainable