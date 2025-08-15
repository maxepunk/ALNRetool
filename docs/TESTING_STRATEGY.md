# ALNRetool Testing Strategy

**Document Created**: January 15, 2025  
**Current Status**: Sprint 1 Refactor In Progress

## Current Test Suite Status

### Metrics
- **Unit Tests**: 504 passing, 5 skipped (509 total)
- **Integration Tests**: 23 passing (backend API)
- **Test Files**: 25 files
- **Coverage**: ~97% of business logic
- **Runtime**: ~6.5 seconds

### Code Quality
- **ESLint**: 0 errors, 91 warnings (nullish coalescing preferences)
- **TypeScript**: 11 errors (all in test files, not production)
- **Build Status**: Client build failing (Rollup circular dependency)

### Recent Changes
- Deleted `/src/hooks/__tests__/useGraphState.test.tsx` (9 tests)
- Added documentation to React Flow integration hooks
- Removed empty test directory

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
| Graph Transformers | Unit | Pure functions, core business logic | ✅ 123/123 passing |
| SF_ Pattern Parser | Unit | Game mechanics parsing | ✅ 100% coverage |
| Relationship Resolver | Unit | Graph algorithms | ✅ 100% coverage |
| Express API Endpoints | Integration | Critical data flow | ✅ 23/23 passing |
| Notion API Integration | Integration | External dependency | ✅ 100% coverage |
| React Query Hooks | Integration | Data fetching logic | ✅ ~200 tests passing |
| Cache Layer | Integration | Performance critical | ✅ Fully tested |
| Error Handlers | Unit | User experience critical | ✅ Tested |

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

## Sprint-by-Sprint Testing Goals

### Sprint 1 (Current)
- [x] Unit tests for transformers
- [x] Integration tests for API
- [x] React Query tests
- [ ] Fix build issues
- [ ] Document testing strategy

### Sprint 2 (Mutations)
- [ ] Integration tests for optimistic updates
- [ ] Mutation error recovery tests
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

### Build Failure
- **Error**: Vite/Rollup - "Cannot add property 0, object is not extensible"
- **Location**: ConditionalExpression.getLiteralValueAtPath in Rollup
- **Type**: Likely circular dependency or recursive property access
- **Impact**: Cannot create production build (dev server works)
- **Next Step**: Investigate and fix (Priority 0)
- **Workaround**: Dev server (`npm run dev`) still functions

### TypeScript Errors
- **Count**: 11 errors in test files
- **Type**: Missing undefined checks
- **Impact**: Tests run but TypeScript fails
- **Next Step**: Add null checks (Priority 2)

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