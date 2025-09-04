import { test, expect, Page, BrowserContext } from '@playwright/test';
import { setupApiMocking, simulateServerError, resetMockDb } from './helpers/mock-api';

/**
 * E2E Tests for Edge Mutation Fixes
 * 
 * Tests the complete user journey for relationship management:
 * - Optimistic edge creation
 * - Server synchronization
 * - Cache invalidation
 * - Error recovery
 */

// Test data factory - matches mock-api.ts initial state
const testData = {
  puzzle: {
    id: 'puzzle-test-1',
    name: 'Test Puzzle',
    characterIds: []
  },
  character: {
    name: 'Test Character',
    type: 'NPC',
    tier: 'Secondary'
  },
  element: {
    id: 'element-test-1',
    name: 'Test Element',
    ownerId: 'character-test-1'
  }
};

// Helper functions
async function createCharacterFromPuzzle(page: Page, characterName: string = testData.character.name) {
  await page.click('[data-testid="field-characterIds"]');
  await page.click('[data-testid="add-new-character"]');
  await page.fill('[name="name"]', characterName);
  await page.selectOption('[name="type"]', testData.character.type);
  await page.selectOption('[name="tier"]', testData.character.tier);
  await page.click('[data-testid="save-button"]');
}

async function navigateToPuzzle(page: Page, puzzleId: string) {
  await page.goto('/graph');
  
  // Wait for the graph to load and render nodes
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('.react-flow__node', { timeout: 10000 });
  
  // Small delay to ensure React Flow has finished rendering
  await page.waitForTimeout(500);
  
  // Now try to click the puzzle node
  const puzzleNode = page.locator(`[data-testid="node-${puzzleId}"]`);
  await puzzleNode.waitFor({ state: 'visible', timeout: 5000 });
  await puzzleNode.click();
  
  await page.waitForSelector('[data-testid="detail-panel"]', { timeout: 5000 });
}

test.describe('Edge Creation', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      extraHTTPHeaders: {
        'X-API-Key': process.env.API_KEY || 'test-key'
      }
    });
    page = await context.newPage();
    
    // Set up API mocking for all tests
    await setupApiMocking(page);
  });

  test.afterEach(async () => {
    await page.close();
    await context.close();
    // Reset mock database for next test
    resetMockDb();
  });

  test('creates edge when adding character to puzzle', async () => {
    // Navigate to puzzle
    await navigateToPuzzle(page, testData.puzzle.id);
    
    // Setup edge locator before action
    const edgeLocator = page.locator(`[data-testid^="rf__edge-e::${testData.puzzle.id}::characterIds::"]`);
    
    // Create character relationship
    await createCharacterFromPuzzle(page);
    
    // Verify optimistic edge appears immediately
    await expect(edgeLocator).toBeVisible();
    
    // Wait for server response
    await page.waitForResponse(response => 
      response.url().includes('/api/notion/characters') && 
      response.status() === 200
    );
    
    // Verify edge persists with correct properties
    await expect(edgeLocator).toHaveAttribute('data-relationship-type', 'puzzle');
    await expect(edgeLocator).toBeVisible();
  });

  test('reverts edge on server error', async () => {
    // Simulate server error for character creation
    await simulateServerError(page, '/api/notion/characters');
    
    await navigateToPuzzle(page, testData.puzzle.id);
    
    // Count initial edges
    const initialEdges = await page.locator('.react-flow__edge').count();
    
    // Attempt to create relationship
    await createCharacterFromPuzzle(page);
    
    // Verify optimistic edge appears
    await expect(page.locator('.react-flow__edge')).toHaveCount(initialEdges + 1);
    
    // Wait for error toast
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
    
    // Verify edge is removed after rollback
    await expect(page.locator('.react-flow__edge')).toHaveCount(initialEdges);
  });

  test('allows retry after server error', async () => {
    let attemptCount = 0;
    
    // First attempt fails, second succeeds
    await page.route('**/api/notion/characters', async route => {
      if (route.request().method() === 'POST') {
        attemptCount++;
        if (attemptCount === 1) {
          await route.fulfill({ 
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' })
          });
        } else {
          // Second attempt succeeds - create a new character
          const body = await route.request().postDataJSON();
          const newCharacter = {
            id: `character-${attemptCount}`,
            ...body,
            version: 1
          };
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: newCharacter })
          });
        }
      } else {
        await route.continue();
      }
    });
    
    await navigateToPuzzle(page, testData.puzzle.id);
    
    // First attempt
    await createCharacterFromPuzzle(page);
    
    // Verify error toast
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
    
    // Click retry button
    await page.click('[data-testid="retry-button"]');
    
    // Verify edge now exists and persists
    const edgeLocator = page.locator(`[data-testid^="rf__edge-e::${testData.puzzle.id}::"]`);
    await expect(edgeLocator).toBeVisible();
    
    // Verify success toast
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });
});

test.describe('Relationship Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocking for all tests in this describe block
    await setupApiMocking(page);
  });

  test.afterEach(async () => {
    // Reset mock database for next test
    resetMockDb();
  });

  test('removes edge when deleting relationship', async ({ page }) => {
    // Setup: Ensure relationship exists
    await page.goto('/graph');
    await page.click(`[data-testid="node-${testData.puzzle.id}"]`);
    
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

  test('moves edge when re-assigning relationship', async ({ page }) => {
    // Setup: Element owned by Character 1
    await page.goto('/graph');
    await page.click(`[data-testid="node-${testData.element.id}"]`);
    
    // Change owner from Character 1 to Character 2
    await page.selectOption('[name="ownerId"]', 'character-test-2');
    await page.click('[data-testid="save-button"]');
    
    // Verify old edge disappears immediately
    const oldEdge = page.locator('[data-testid="rf__edge-e::character-test-1::ownedElementIds::element-test-1"]');
    await expect(oldEdge).not.toBeVisible();
    
    // Verify new edge appears immediately
    const newEdge = page.locator('[data-testid="rf__edge-e::character-test-2::ownedElementIds::element-test-1"]');
    await expect(newEdge).toBeVisible();
    
    // Wait for server sync
    await page.waitForResponse('**/api/notion/elements/**');
    
    // Verify final state
    await expect(oldEdge).not.toBeVisible();
    await expect(newEdge).toBeVisible();
  });
});

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocking for all tests in this describe block
    await setupApiMocking(page);
  });

  test.afterEach(async () => {
    // Reset mock database for next test
    resetMockDb();
  });

  test('handles rapid relationship creation without race conditions', async ({ page }) => {
    await navigateToPuzzle(page, testData.puzzle.id);
    
    // Track API calls
    const apiCalls: string[] = [];
    await page.route('**/api/notion/characters', async route => {
      const postData = route.request().postData();
      if (postData) apiCalls.push(postData);
      await route.continue();
    });
    
    // Create multiple characters rapidly
    const characterNames = ['Rapid1', 'Rapid2', 'Rapid3'];
    
    for (const name of characterNames) {
      await page.click('[data-testid="field-characterIds"]');
      await page.click('[data-testid="add-new-character"]');
      await page.fill('[name="name"]', name);
      await page.selectOption('[name="type"]', 'NPC');
      await page.selectOption('[name="tier"]', 'Secondary');
      await page.click('[data-testid="save-button"]');
      // Don't wait - continue immediately
    }
    
    // All edges should appear
    for (const name of characterNames) {
      const edge = page.locator(`[data-testid*="${name}"]`);
      await expect(edge).toBeVisible({ timeout: 10000 });
    }
    
    // Verify all API calls were made
    expect(apiCalls.length).toBe(3);
    
    // Wait for all responses
    await page.waitForLoadState('networkidle');
    
    // Verify final state has all edges
    const edges = await page.locator(`[data-testid^="rf__edge-e::${testData.puzzle.id}::characterIds::"]`).count();
    expect(edges).toBe(3);
  });

  test('invalidates cache and refetches on update', async ({ page }) => {
    let graphApiCallCount = 0;
    
    // Track graph API calls
    await page.route('**/api/graph/complete', async route => {
      graphApiCallCount++;
      await route.continue();
    });
    
    // Initial load
    await page.goto('/graph');
    await page.waitForResponse('**/api/graph/complete');
    expect(graphApiCallCount).toBe(1);
    
    // Navigate to puzzle and create relationship
    await navigateToPuzzle(page, testData.puzzle.id);
    await createCharacterFromPuzzle(page);
    
    // Wait for cache invalidation to trigger refetch
    await page.waitForResponse(response => 
      response.url().includes('/api/graph/complete') && 
      graphApiCallCount > 1
    );
    
    // Verify cache was invalidated
    expect(graphApiCallCount).toBeGreaterThanOrEqual(2);
    
    // Verify new edge is in refetched data
    const edges = await page.locator('.react-flow__edge').count();
    expect(edges).toBeGreaterThan(0);
  });
});

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocking for all tests in this describe block
    await setupApiMocking(page);
  });

  test.afterEach(async () => {
    // Reset mock database for next test
    resetMockDb();
  });

  test('edge rendering remains consistent', async ({ page }) => {
    await page.goto('/graph');
    
    // Wait for graph to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Allow animations to complete
    
    // Get graph bounds for clipping
    const graphElement = await page.locator('.react-flow').boundingBox();
    
    // Take baseline screenshot
    await expect(page).toHaveScreenshot('graph-baseline.png', {
      clip: graphElement || undefined,
      animations: 'disabled',
      threshold: 0.2,
      maxDiffPixels: 100,
      mask: [page.locator('.react-flow__minimap')]
    });
    
    // Create a relationship
    await navigateToPuzzle(page, testData.puzzle.id);
    await createCharacterFromPuzzle(page, 'Visual Test Character');
    
    // Return to graph view
    await page.click('[data-testid="close-detail-panel"]');
    await page.waitForTimeout(500);
    
    // Take screenshot with new edge
    await expect(page).toHaveScreenshot('graph-with-edge.png', {
      clip: graphElement || undefined,
      animations: 'disabled',
      threshold: 0.2,
      maxDiffPixels: 100,
      mask: [page.locator('.react-flow__minimap')]
    });
  });
});