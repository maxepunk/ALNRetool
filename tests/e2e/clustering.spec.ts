import { test, expect } from '@playwright/test';

test.describe('Node Clustering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid^="node-"]');
  });

  test('enables clustering from sidebar and creates cluster nodes', async ({ page }) => {
    // Find clustering toggle switch
    const clusterToggle = page.getByRole('switch', { name: 'Toggle clustering' });

    // Enable clustering
    await clusterToggle.click();

    // Verify cluster nodes appear
    await expect(page.locator('[data-testid^="node-cluster-"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('expands and collapses clusters on click', async ({ page }) => {
    // Enable clustering
    await page.getByRole('switch', { name: 'Toggle clustering' }).click();

    // Find a cluster node
    const cluster = page.locator('[data-testid^="node-cluster-"]').first();
    await expect(cluster).toBeVisible({ timeout: 10000 });

    const initialNodeCount = await page.locator('[data-testid^="node-"]:visible').count();

    // Click to expand
    await cluster.getByRole('button', { name: /Expand cluster/i }).click();

    // Wait for animation and for nodes to appear
    await page.waitForTimeout(500);

    // Verify children are visible by checking if node count increased
    const expandedNodeCount = await page.locator('[data-testid^="node-"]:visible').count();
    expect(expandedNodeCount).toBeGreaterThan(initialNodeCount);

    // Click to collapse
    await cluster.getByRole('button', { name: /Collapse cluster/i }).click();
    await page.waitForTimeout(500);

    // Verify children are hidden by checking if node count decreased
    const collapsedNodeCount = await page.locator('[data-testid^="node-"]:visible').count();
    expect(collapsedNodeCount).toBe(initialNodeCount);
  });

  test('respects clustering rules checkboxes', async ({ page }) => {
    // Enable clustering
    await page.getByRole('switch', { name: 'Toggle clustering' }).click();
    await expect(page.locator('[data-testid^="node-cluster-"]').first()).toBeVisible({ timeout: 10000 });

    const initialClusterCount = await page.locator('[data-testid^="node-cluster-"]').count();
    expect(initialClusterCount).toBeGreaterThan(0);

    // Disable puzzle chains
    await page.getByLabel('Puzzle chains').uncheck();

    // Verify cluster count changes
    await expect(page.locator('[data-testid^="node-cluster-"]')).toHaveCount(initialClusterCount - 1, { timeout: 5000 });
  });

  test('Expand All and Collapse All buttons work', async ({ page }) => {
    // Enable clustering
    await page.getByRole('switch', { name: 'Toggle clustering' }).click();
    await expect(page.locator('[data-testid^="node-cluster-"]').first()).toBeVisible({ timeout: 10000 });

    const initialVisibleNodes = await page.locator('[data-testid^="node-"]:visible').count();

    // Expand All
    await page.getByRole('button', { name: 'Expand' }).click();
    await page.waitForTimeout(500);
    const expandedVisibleNodes = await page.locator('[data-testid^="node-"]:visible').count();
    expect(expandedVisibleNodes).toBeGreaterThan(initialVisibleNodes);

    // Collapse All
    await page.getByRole('button', { name: 'Collapse' }).click();
    await page.waitForTimeout(500);
    const collapsedVisibleNodes = await page.locator('[data-testid^="node-"]:visible').count();
    expect(collapsedVisibleNodes).toBe(initialVisibleNodes);
  });

  test('integrates with selection system (Cmd+A)', async ({ page }) => {
    // Enable clustering
    await page.getByRole('switch', { name: 'Toggle clustering' }).click();
    await expect(page.locator('[data-testid^="node-cluster-"]').first()).toBeVisible({ timeout: 10000 });

    // Use platform-specific modifier key
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

    // Test Cmd+A selects visible nodes and clusters
    await page.keyboard.press(`${modifier}+A`);

    const selectedNodesCount = await page.locator('.react-flow__node.selected').count();
    const visibleNodesCount = await page.locator('[data-testid^="node-"]:visible').count();

    // In this app, Cmd+A selects all nodes, even those not visible in the viewport
    // So we check against all nodes that are not hidden inside clusters.
    // The number of selected nodes should be equal to the number of visible nodes in the DOM
    expect(selectedNodesCount).toBe(visibleNodesCount);
    expect(selectedNodesCount).toBeGreaterThan(0);
  });

  test('selecting a collapsed cluster does not select its hidden children', async ({ page }) => {
    // Enable clustering
    await page.getByRole('switch', { name: 'Toggle clustering' }).click();
    await expect(page.locator('[data-testid^="node-cluster-"]').first()).toBeVisible({ timeout: 10000 });

    // Find a collapsed cluster
    const cluster = page.locator('[data-testid^="node-cluster-"]').first();

    // Click to select the cluster itself
    await cluster.click();

    // Verify only 1 node (the cluster) is selected
    const selectedNodesCount = await page.locator('.react-flow__node.selected').count();
    expect(selectedNodesCount).toBe(1);

    // Verify the selected node is the cluster
    await expect(cluster).toHaveClass(/selected/);
  });
});
