# E2E Testing Documentation

## Overview

The e2e tests use Playwright to test the complete user journey for critical features like edge mutations, relationship management, and graph interactions.

## Architecture

### Test Infrastructure

1. **Playwright Configuration** (`playwright.config.ts`)
   - Runs tests in Chromium and slow-network mode
   - Auto-starts dev server before tests
   - Captures screenshots/video on failure
   - Uses data-testid attributes for element selection

2. **API Mocking** (`tests/e2e/helpers/mock-api.ts`)
   - Uses Playwright's route handlers to intercept API calls
   - Provides consistent test data across all tests
   - Simulates server errors and network delays
   - Maintains stateful mock database during test execution

3. **Test Data**
   - Initial state defined in `mock-api.ts`
   - Includes pre-configured characters, elements, puzzles
   - Deterministic ID generation for new entities
   - Resets between tests for isolation

## Writing E2E Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { setupApiMocking, simulateServerError } from './helpers/mock-api';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocking for all tests
    await setupApiMocking(page);
  });

  test.afterEach(async () => {
    // Reset mock database for next test
    resetMockDb();
  });

  test('should do something', async ({ page }) => {
    await page.goto('/graph');
    // Test implementation
  });
});
```

### Testing Patterns

#### 1. Optimistic Updates
```typescript
// Create action that triggers optimistic update
await createCharacterFromPuzzle(page);

// Verify optimistic UI update happens immediately
await expect(edgeLocator).toBeVisible();

// Wait for server confirmation
await page.waitForResponse(response => 
  response.url().includes('/api/notion/characters') && 
  response.status() === 200
);

// Verify UI persists after server sync
await expect(edgeLocator).toBeVisible();
```

#### 2. Error Recovery
```typescript
// Simulate server error
await simulateServerError(page, '/api/notion/characters');

// Perform action
await createCharacterFromPuzzle(page);

// Verify error handling
await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();

// Verify rollback
await expect(originalState).toBeRestored();
```

#### 3. Race Condition Testing
```typescript
// Perform multiple rapid actions
for (const item of items) {
  await performAction(item);
  // Don't wait - continue immediately
}

// Verify all actions complete correctly
for (const item of items) {
  await expect(resultFor(item)).toBeVisible();
}
```

## Running Tests

```bash
# Run all e2e tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/edge-mutations.spec.ts

# Run with UI (interactive mode)
npx playwright test --ui

# Run with specific reporter
npx playwright test --reporter=html

# Debug mode
npx playwright test --debug

# Run specific test by name
npx playwright test -g "creates edge when adding character"
```

## Test Data Reference

### Pre-configured Entities

The mock API provides these initial entities:

**Characters:**
- `character-test-1`: NPC, Secondary tier, owns element-test-1
- `character-test-2`: Player, Core tier

**Elements:**
- `element-test-1`: Prop, owned by character-test-1

**Puzzles:**
- `puzzle-test-1`: Empty puzzle ready for testing relationships

### ID Generation

New entities get deterministic IDs:
- Characters: `character-100`, `character-101`, ...
- Elements: `element-100`, `element-101`, ...
- Puzzles: `puzzle-100`, `puzzle-101`, ...

## Common Issues

### Tests Timing Out

If tests timeout looking for elements:
1. Ensure the dev server is running (`npm run dev`)
2. Check that data-testid attributes are rendered
3. Add appropriate wait conditions:
   ```typescript
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('.react-flow__node');
   ```

### Mocking Not Working

If API calls aren't being intercepted:
1. Ensure `setupApiMocking(page)` is called in beforeEach
2. Check route patterns match actual API paths
3. Verify the mock-api helper is imported correctly

### Flaky Tests

To reduce flakiness:
1. Use explicit waits instead of arbitrary timeouts
2. Wait for specific conditions, not just element visibility
3. Ensure proper test isolation with resetMockDb()
4. Use stable selectors (data-testid preferred)

## Integration with MSW

The e2e tests were designed to work with MSW (Mock Service Worker) but currently use Playwright's built-in route handlers. The MSW handlers in `src/test/mocks/notion-handlers.ts` define the same test data structure and could be integrated in the future by:

1. Setting up MSW in the browser context
2. Using the same handler definitions
3. Enabling request interception at the service worker level

This would provide consistency between unit tests (which use MSW) and e2e tests.