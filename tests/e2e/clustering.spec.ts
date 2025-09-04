import { test, expect } from '@playwright/test';

test.describe('Node Clustering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/graph');
    await page.waitForSelector('[data-testid^="node-"]');
  });

  test('enables clustering from sidebar', async ({ page }) => {
    // Find clustering toggle
    const clusterToggle = page.locator('label:has-text("Clustering")').locator('..').locator('button[role="switch"]');

    // Enable clustering
    await clusterToggle.click();

    // Verify cluster nodes appear
    await expect(page.locator('[data-testid^="node-cluster-"]').first()).toBeVisible();
  });

  test('expands and collapses clusters', async ({ page }) => {
    // Enable clustering
    const clusterToggle = page.locator('label:has-text("Clustering")').locator('..').locator('button[role="switch"]');
    await clusterToggle.click();

    // Find a cluster node
    const cluster = page.locator('[data-testid^="node-cluster-"]').first();
    await expect(cluster).toBeVisible();

    // Click to expand
    await cluster.getByRole('button', { name: /expand cluster/i }).click();

    // Wait for animation
    await page.waitForTimeout(350);

    // Verify children are visible
    const childrenCount = await page.locator('[data-testid^="node-"]:not([data-testid*="cluster"])').count();
    expect(childrenCount).toBeGreaterThan(0);

    // Click to collapse
    await cluster.getByRole('button', { name: /collapse cluster/i }).click();
    await page.waitForTimeout(350);

    // Verify children are hidden
    const visibleChildren = await page.locator('[data-testid^="node-"]:not([data-testid*="cluster"]):visible').count();
    expect(visibleChildren).toBe(0);
  });

  test('respects clustering rules', async ({ page }) => {
    // Enable clustering
    const clusterToggle = page.locator('label:has-text("Clustering")').locator('..').locator('button[role="switch"]');
    await clusterToggle.click();

    // Disable puzzle chains
    await page.locator('label[for="puzzleChains"]').click();

    // Verify puzzle clusters are removed
    await expect(page.locator('[data-testid*="cluster-puzzle"]')).not.toBeVisible();

    // Character and timeline clusters should still be visible
    await expect(page.locator('[data-testid*="cluster-char"]')).toBeVisible();
  });

  test('integrates with selection system', async ({ page }) => {
    // Enable clustering
    const clusterToggle = page.locator('label:has-text("Clustering")').locator('..').locator('button[role="switch"]');
    await clusterToggle.click();

    // Test Cmd+A selects visible nodes and clusters
    await page.keyboard.press('Meta+A');
    const selectedNodes = await page.locator('.selected').count();
    const visibleNodes = await page.locator('[data-testid^="node-"]:visible').count();
    expect(selectedNodes).toBe(visibleNodes);

    // Test selecting collapsed cluster doesn't select hidden children
    const cluster = page.locator('[data-testid^="node-cluster-"]').first();
    await cluster.click();

    // Verify only cluster is selected, not hidden children
    const clusterSelected = await cluster.evaluate(el => el.classList.contains('selected'));
    expect(clusterSelected).toBe(true);

    // Expand cluster and verify children maintain selection state
    await cluster.getByRole('button', { name: /expand cluster/i }).click();
    await page.waitForTimeout(350);

    // Children should not be automatically selected
    const childrenSelected = await page.locator('[data-testid^="node-"]:not([data-testid*="cluster"]).selected').count();
    expect(childrenSelected).toBe(0);
  });

  test('handles clipboard with clusters', async ({ page }) => {
    // Enable clustering
    const clusterToggle = page.locator('label:has-text("Clustering")').locator('..').locator('button[role="switch"]');
    await clusterToggle.click();

    // Select a cluster
    const cluster = page.locator('[data-testid^="node-cluster-"]').first();
    await cluster.click();

    // Copy to clipboard
    await page.keyboard.press('Meta+C');

    // Verify clipboard operation succeeded (check for toast notification)
    await expect(page.locator('text=Copied')).toBeVisible();
  });
});
