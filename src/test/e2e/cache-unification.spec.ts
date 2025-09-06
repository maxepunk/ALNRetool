import { test, expect } from '@playwright/test';

/**
 * E2E Test for Cache Unification
 * 
 * Validates that the unified cache correctly shares data across all views.
 * Tests the fix for cache fragmentation issue where 5 duplicate caches
 * were storing the same data.
 * 
 * Success criteria:
 * - Only one request to /api/graph/complete on initial load
 * - View switches via URL navigation do not trigger new requests
 * - Cache key ['graph', 'complete'] is truly unified
 */

test.describe('Cache Unification', () => {
  test('unified cache prevents duplicate API requests across view switches', async ({ page }) => {
    // Track all requests to the graph endpoint
    const graphRequests: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/graph/complete')) {
        graphRequests.push(`${request.method()} ${request.url()}`);
        console.log(`[Request ${graphRequests.length}] ${request.method()} ${request.url()}`);
      }
    });

    // Step 1: Initial load with full-graph view
    console.log('Loading full-graph view...');
    await page.goto('http://localhost:5173/graph/full-graph');
    
    // Wait for graph to load (React Flow nodes appear)
    await page.waitForSelector('.react-flow__node', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    
    // Should have exactly 1 request from initial load
    expect(graphRequests.length).toBe(1);
    console.log('✓ Initial load made 1 request');
    
    // Step 2: Navigate to characters-only view using SPA navigation
    console.log('Navigating to characters-only view via SPA...');
    await page.evaluate(() => {
      // Use browser's history API for SPA navigation
      window.history.pushState({}, '', '/graph/characters-only');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(1000); // Give React Router time to update
    
    // Should STILL have only 1 request (cache hit)
    expect(graphRequests.length).toBe(1);
    console.log('✓ View switch to characters-only: no new request (cache hit)');
    
    // Step 3: Navigate to puzzles-only view via SPA
    console.log('Navigating to puzzles-only view via SPA...');
    await page.evaluate(() => {
      window.history.pushState({}, '', '/graph/puzzles-only');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(1000);
    
    // Should STILL have only 1 request
    expect(graphRequests.length).toBe(1);
    console.log('✓ View switch to puzzles-only: no new request (cache hit)');
    
    // Step 4: Navigate to elements-only view via SPA
    console.log('Navigating to elements-only view via SPA...');
    await page.evaluate(() => {
      window.history.pushState({}, '', '/graph/elements-only');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(1000);
    
    // Should STILL have only 1 request
    expect(graphRequests.length).toBe(1);
    console.log('✓ View switch to elements-only: no new request (cache hit)');
    
    // Step 5: Navigate back to full-graph via SPA
    console.log('Navigating back to full-graph view via SPA...');
    await page.evaluate(() => {
      window.history.pushState({}, '', '/graph/full-graph');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(1000);
    
    // Should STILL have only 1 request
    expect(graphRequests.length).toBe(1);
    console.log('✓ Return to full-graph: no new request (cache hit)');
    
    // Success summary
    console.log(`
    ✅ CACHE UNIFICATION VALIDATED
    ================================
    Total view switches: 4
    Total API requests: ${graphRequests.length}
    Expected: 1 (initial load only)
    Result: OPTIMAL - Unified cache working correctly!
    `);
  });

  test('verifies server cache headers', async ({ page }) => {
    // First request should be cache miss
    await page.goto('http://localhost:5173/graph/full-graph');
    await page.waitForSelector('.react-flow__node', { timeout: 30000 });
    
    // Monitor the actual API response
    const apiResponse1 = await page.waitForResponse(
      response => response.url().includes('/api/graph/complete'),
      { timeout: 30000 }
    );
    
    const headers1 = apiResponse1.headers();
    console.log('First load - X-Cache-Hit:', headers1['x-cache-hit']);
    expect(headers1['x-cache-hit']).toBe('false');
    
    // Force a full page reload
    await page.reload();
    await page.waitForSelector('.react-flow__node', { timeout: 30000 });
    
    // Second request should be cache hit (server-side cache)
    const apiResponse2 = await page.waitForResponse(
      response => response.url().includes('/api/graph/complete'),
      { timeout: 30000 }
    );
    
    const headers2 = apiResponse2.headers();
    console.log('After reload - X-Cache-Hit:', headers2['x-cache-hit']);
    expect(headers2['x-cache-hit']).toBe('true');
    
    // Also check the metadata.cached field in response
    const responseData = await apiResponse2.json();
    if (responseData.metadata) {
      expect(responseData.metadata.cached).toBe(true);
      console.log('✓ metadata.cached field is correctly set to true');
    }
  });
});