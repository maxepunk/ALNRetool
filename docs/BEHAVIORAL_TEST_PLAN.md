# Behavioral Test Plan for Edge Mutation Fixes

## Test Classification: [NET_NEW]
Creating comprehensive behavioral test suite for edge creation during entity mutations.

## Observable Behaviors to Test

### Behavior 1: Edge Creation on Relationship Addition
**User Journey:** Create a Character from a Puzzle's Characters field
**Observable Outcomes:**
1. Edge appears immediately in graph (optimistic)
2. Edge persists after server sync
3. Edge has correct visual properties
4. Both nodes show connection

### Behavior 2: Cache Invalidation and Refetch
**User Journey:** Modify a relationship and verify server data loads
**Observable Outcomes:**
1. Old edge disappears
2. Loading indicator appears
3. New edge appears with server data
4. No duplicate edges exist

### Behavior 3: Error Recovery
**User Journey:** Create relationship when server is unavailable
**Observable Outcomes:**
1. Optimistic edge appears
2. Error message displays
3. Edge reverts on failure
4. User can retry

### Behavior 4: Relationship Deletion
**User Journey:** Remove a Character from a Puzzle's Characters field
**Observable Outcomes:**
1. Edge disappears immediately (optimistic)
2. Edge remains removed after server sync
3. On error, edge reappears
4. Related nodes update correctly

### Behavior 5: Relationship Editing
**User Journey:** Re-assign an Element from one Character to another
**Observable Outcomes:**
1. Old edge disappears immediately
2. New edge appears immediately
3. Both changes persist after server sync
4. Rollback restores original state on error

### Behavior 6: Rapid Interactions
**User Journey:** Add multiple relationships in quick succession
**Observable Outcomes:**
1. All optimistic edges appear immediately
2. No edges are lost or duplicated
3. Final state matches all intended changes
4. Order of operations is preserved

## Playwright-Specific Test Implementation

### 1. Network Interception for Controlled Testing
```typescript
// Test optimistic updates by delaying server response
await page.route('**/api/notion/characters/**', async route => {
  await page.waitForTimeout(2000); // Delay to observe optimistic state
  await route.continue();
});

// Test error recovery by simulating server failure
await page.route('**/api/notion/puzzles/**', route => 
  route.fulfill({ status: 500, body: 'Server error' })
);
```

### 2. Web-First Assertions for Dynamic Content
```typescript
// Instead of manual waits, use Playwright's auto-waiting assertions
await expect(page.locator('[data-testid^="rf__edge-e::"]'))
  .toBeVisible(); // Auto-waits for element

// Assert edge count changes
await expect(page.locator('.react-flow__edge'))
  .toHaveCount(previousCount + 1);

// Verify edge properties with data attributes
await expect(page.locator(`[data-testid="rf__edge-${edgeId}"]`))
  .toHaveAttribute('data-relationship-type', 'puzzle');
```

### 3. Browser Context Isolation
```typescript
// Each test gets clean state
test.describe('Edge Creation', () => {
  let context: BrowserContext;
  
  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      // Mock authentication
      extraHTTPHeaders: {
        'X-API-Key': 'test-key'
      }
    });
  });
  
  test.afterEach(async () => {
    await context.close();
  });
});
```

### 4. Visual Regression with Screenshots
```typescript
// Capture graph state before and after
await page.screenshot({ 
  path: 'before-edge-creation.png',
  clip: graphBounds 
});

// Perform action
await createRelationship();

await page.screenshot({ 
  path: 'after-edge-creation.png',
  clip: graphBounds 
});

// Use visual comparison with stability options
await expect(page).toHaveScreenshot('edge-created.png', {
  animations: 'disabled',  // Disable animations
  threshold: 0.2,          // Allow 20% pixel difference
  maxDiffPixels: 100,      // Allow up to 100 different pixels
  mask: [page.locator('.react-flow__minimap')], // Mask dynamic areas
});
```

### 5. Tracing for Debugging
```typescript
// Enable tracing for failed tests
test('edge creation with retry', async ({ page }, testInfo) => {
  await page.context().tracing.start({ 
    screenshots: true, 
    snapshots: true 
  });
  
  try {
    // Test implementation
  } catch (error) {
    // Save trace on failure
    await page.context().tracing.stop({ 
      path: `trace-${testInfo.title}.zip` 
    });
    throw error;
  }
});
```

### 6. API Response Mocking for Edge Cases
```typescript
// Mock paginated responses to test boundary conditions
await page.route('**/api/graph/data', route => {
  const mockGraph = {
    nodes: generateNodes(100),
    edges: generateEdges(50),
    metadata: { hasMore: true }
  };
  route.fulfill({ json: mockGraph });
});

// Test with missing entity references
await page.route('**/api/notion/elements/*', route => {
  route.fulfill({ 
    json: { ...validElement, ownerId: 'non-existent-id' }
  });
});
```

## Test Scenarios

### Scenario 1: Happy Path - Create Character from Puzzle
```typescript
test('creates edge when adding character to puzzle', async ({ page }) => {
  // Setup: Navigate to puzzle detail
  await page.goto('/graph');
  await page.click('[data-testid="node-puzzle-1"]');
  
  // Open relation field
  await page.click('[data-testid="field-characterIds"]');
  await page.click('[data-testid="add-new-character"]');
  
  // Fill character form
  await page.fill('[name="name"]', 'Test Character');
  await page.selectOption('[name="type"]', 'NPC');
  
  // Use locator-based assertion for consistency
  const edgeLocator = page.locator('[data-testid^="rf__edge-e::puzzle-1::characterIds::"]');
  
  await page.click('[data-testid="save-button"]');
  
  // Verify optimistic edge appears immediately (auto-waits)
  await expect(edgeLocator).toBeVisible();
  
  // Wait for server response
  await page.waitForResponse('**/api/notion/characters');
  
  // Verify edge persists with correct properties
  await expect(edge).toHaveAttribute('data-relationship-type', 'puzzle');
  await expect(edge).toBeVisible();
});
```

### Scenario 2: Error Recovery
```typescript
test('reverts edge on server error', async ({ page }) => {
  // Simulate server error
  await page.route('**/api/notion/characters', route => 
    route.fulfill({ status: 500 })
  );
  
  // Count initial edges
  const initialEdges = await page.locator('.react-flow__edge').count();
  
  // Attempt to create relationship
  await createCharacterFromPuzzle(page);
  
  // Verify optimistic edge appears
  await expect(page.locator('.react-flow__edge'))
    .toHaveCount(initialEdges + 1);
  
  // Wait for error and rollback
  await expect(page.locator('[data-testid="error-toast"]'))
    .toBeVisible();
  
  // Verify edge is removed after rollback
  await expect(page.locator('.react-flow__edge'))
    .toHaveCount(initialEdges);
});
```

### Scenario 3: Error Recovery with Retry
```typescript
test('allows retry after server error', async ({ page }) => {
  let attemptCount = 0;
  
  // First attempt fails, second succeeds
  await page.route('**/api/notion/characters', async route => {
    attemptCount++;
    if (attemptCount === 1) {
      await route.fulfill({ status: 500 });
    } else {
      await route.continue();
    }
  });
  
  // Attempt to create relationship
  await createCharacterFromPuzzle(page);
  
  // Verify error toast
  await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
  
  // Click retry button
  await page.click('[data-testid="retry-button"]');
  
  // Verify edge now exists and persists
  const edgeLocator = page.locator('[data-testid^="rf__edge-e::"]');
  await expect(edgeLocator).toBeVisible();
  
  // Verify success toast
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
});
```

### Scenario 4: Relationship Deletion
```typescript
test('removes edge when deleting relationship', async ({ page }) => {
  // Setup: Ensure relationship exists
  await page.goto('/graph');
  await page.click('[data-testid="node-puzzle-1"]');
  
  // Find and remove character relationship
  const characterField = page.locator('[data-testid="field-characterIds"]');
  await characterField.click();
  
  const removeButton = page.locator('[data-testid="remove-character-1"]');
  await removeButton.click();
  
  // Verify edge disappears immediately
  const edgeLocator = page.locator('[data-testid="rf__edge-e::puzzle-1::characterIds::character-1"]');
  await expect(edgeLocator).not.toBeVisible();
  
  // Wait for server confirmation
  await page.waitForResponse('**/api/notion/puzzles/**');
  
  // Verify edge remains removed
  await expect(edgeLocator).not.toBeVisible();
});
```

### Scenario 5: Relationship Editing
```typescript
test('moves edge when re-assigning relationship', async ({ page }) => {
  // Setup: Element owned by Character 1
  await page.goto('/graph');
  await page.click('[data-testid="node-element-1"]');
  
  // Change owner from Character 1 to Character 2
  await page.selectOption('[name="ownerId"]', 'character-2');
  await page.click('[data-testid="save-button"]');
  
  // Verify old edge disappears immediately
  const oldEdge = page.locator('[data-testid="rf__edge-e::character-1::ownedElementIds::element-1"]');
  await expect(oldEdge).not.toBeVisible();
  
  // Verify new edge appears immediately
  const newEdge = page.locator('[data-testid="rf__edge-e::character-2::ownedElementIds::element-1"]');
  await expect(newEdge).toBeVisible();
  
  // Wait for server sync
  await page.waitForResponse('**/api/notion/elements/**');
  
  // Verify final state
  await expect(oldEdge).not.toBeVisible();
  await expect(newEdge).toBeVisible();
});
```

### Scenario 6: Rapid Interactions
```typescript
test('handles rapid relationship creation without race conditions', async ({ page }) => {
  await page.goto('/graph');
  await page.click('[data-testid="node-puzzle-1"]');
  
  // Track API calls
  const apiCalls: string[] = [];
  await page.route('**/api/notion/characters', async route => {
    apiCalls.push(await route.request().postData() || '');
    await route.continue();
  });
  
  // Create multiple characters rapidly
  const characterNames = ['Char1', 'Char2', 'Char3'];
  
  for (const name of characterNames) {
    await page.click('[data-testid="add-new-character"]');
    await page.fill('[name="name"]', name);
    await page.click('[data-testid="save-button"]');
    // Don't wait for response - continue immediately
  }
  
  // All edges should appear
  for (const name of characterNames) {
    const edge = page.locator(`[data-testid*="${name}"]`);
    await expect(edge).toBeVisible();
  }
  
  // Verify all API calls were made
  expect(apiCalls.length).toBe(3);
  
  // Wait for all responses
  await page.waitForLoadState('networkidle');
  
  // Verify final state has all edges
  const edges = await page.locator('[data-testid^="rf__edge-e::puzzle-1::characterIds::"]').count();
  expect(edges).toBe(3);
});
```

### Scenario 7: Cache Invalidation
```typescript
test('invalidates cache and refetches on update', async ({ page }) => {
  let apiCallCount = 0;
  
  // Track API calls
  await page.route('**/api/graph/data', async route => {
    apiCallCount++;
    await route.continue();
  });
  
  // Initial load
  await page.goto('/graph');
  expect(apiCallCount).toBe(1);
  
  // Create relationship
  await createCharacterFromPuzzle(page);
  
  // Verify cache invalidation triggered refetch
  await page.waitForResponse('**/api/graph/data');
  expect(apiCallCount).toBe(2);
  
  // Verify new edge is in refetched data
  const edges = await page.locator('.react-flow__edge').count();
  expect(edges).toBeGreaterThan(0);
});
```

## Implementation Priority

1. **Critical Path Tests** (Must have):
   - Edge creation on relationship addition
   - Cache invalidation verification
   - Error recovery and rollback

2. **Integration Tests** (Should have):
   - Multiple simultaneous relationships
   - Cross-entity relationships
   - Pagination boundary cases

3. **Edge Cases** (Nice to have):
   - Network interruption during save
   - Concurrent user modifications
   - Large graph performance

## Success Criteria

- [ ] All optimistic updates are visually observable
- [ ] Server sync completes without duplicates
- [ ] Errors gracefully revert state
- [ ] Cache properly invalidates
- [ ] No race conditions in rapid interactions
- [ ] Visual regression tests pass

## Test Data Requirements

```typescript
// Minimal test data factory
export const testData = {
  puzzle: {
    id: 'puzzle-1',
    name: 'Test Puzzle',
    characterIds: []
  },
  character: {
    name: 'Test Character',
    type: 'NPC',
    tier: 'Secondary'
  },
  expectedEdge: {
    id: 'e::puzzle-1::characterIds::',
    type: 'puzzle',
    source: 'puzzle-1',
    target: null // Will be set after creation
  }
};
```

## Execution Strategy

1. **Setup Phase**:
   - Start test server with known seed data
   - Configure Playwright with proper viewport
   - Enable request interception

2. **Test Phase**:
   - Run tests in parallel where possible
   - Use browser contexts for isolation
   - Capture traces for failures

3. **Verification Phase**:
   - Visual regression comparison
   - Performance metrics validation
   - Error log analysis

## Playwright Configuration

```typescript
// playwright.config.ts additions
export default {
  use: {
    // Capture video on failure
    video: 'retain-on-failure',
    
    // Enable tracing for debugging
    trace: 'on-first-retry',
    
    // Set viewport for consistent graph rendering
    viewport: { width: 1920, height: 1080 },
    
    // Custom test attributes
    testIdAttribute: 'data-testid'
  },
  
  // Parallel execution for speed
  workers: 4,
  
  // Retry flaky tests
  retries: 2,
  
  // Network conditions
  projects: [
    {
      name: 'fast-network',
      use: { 
        // Default - no throttling
      }
    },
    {
      name: 'slow-network',
      use: {
        // Simulate slow network
        offline: false,
        downloadThroughput: 50 * 1024,
        uploadThroughput: 20 * 1024,
        latency: 500
      }
    }
  ]
};
```

## Why This Approach is Superior

1. **Playwright-Specific Benefits**:
   - Auto-waiting eliminates flaky timing issues
   - Network interception enables precise testing
   - Visual regression catches rendering bugs
   - Tracing provides debugging superpowers

2. **Behavioral Focus**:
   - Tests what users see, not implementation
   - Validates complete user journeys
   - Ensures visual feedback is correct

3. **Comprehensive Coverage**:
   - Happy paths for confidence
   - Error paths for resilience
   - Edge cases for robustness

4. **Maintainable**:
   - Tests are readable and declarative
   - Isolated contexts prevent test pollution
   - Reusable helpers reduce duplication