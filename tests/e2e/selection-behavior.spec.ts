import { test, expect } from '@playwright/test';

test.describe('Node Selection Behavior', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Wait for graph to load
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
    
    // Wait for layout to complete and fit to view
    await page.waitForTimeout(2000);
    
    // Trigger fit to view using the Controls button
    const fitButton = page.locator('.react-flow__controls-fitview');
    if (await fitButton.isVisible()) {
      await fitButton.click();
      await page.waitForTimeout(500); // Wait for animation
    }
  });

  test('single click selects only one node', async ({ page }) => {
    // Get first node
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.click();
    
    // Check that only one node is selected
    const selectedNodes = await page.locator('.react-flow__node.selected').count();
    expect(selectedNodes).toBe(1);
    
    // Click another node
    const secondNode = page.locator('.react-flow__node').nth(1);
    await secondNode.click();
    
    // Check that still only one node is selected (not both)
    const selectedAfterSecond = await page.locator('.react-flow__node.selected').count();
    expect(selectedAfterSecond).toBe(1);
  });

  test('multi-select with Shift key', async ({ page }) => {
    // Click first node
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.click();
    
    // Shift+click second node
    const secondNode = page.locator('.react-flow__node').nth(1);
    await page.keyboard.down('Shift');
    await secondNode.click();
    await page.keyboard.up('Shift');
    
    // Both should be selected
    const selectedNodes = await page.locator('.react-flow__node.selected').count();
    expect(selectedNodes).toBe(2);
  });

  test('Ctrl+A selects all nodes', async ({ page }) => {
    // Press Ctrl+A (or Cmd+A on Mac)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+a`);
    
    // All nodes should be selected
    const totalNodes = await page.locator('.react-flow__node').count();
    const selectedNodes = await page.locator('.react-flow__node.selected').count();
    expect(selectedNodes).toBe(totalNodes);
    expect(selectedNodes).toBeGreaterThan(0); // Ensure there are nodes
  });

  test('Escape clears selection', async ({ page }) => {
    // Select a node first
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.click();
    
    // Verify it's selected
    const selectedBefore = await page.locator('.react-flow__node.selected').count();
    expect(selectedBefore).toBe(1);
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // No nodes should be selected
    const selectedAfter = await page.locator('.react-flow__node.selected').count();
    expect(selectedAfter).toBe(0);
  });

  test('Ctrl+C shows copy toast notification', async ({ page }) => {
    // Select a node
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.click();
    
    // Press Ctrl+C
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+c`);
    
    // Look for toast notification
    const toast = page.locator('text=/Copied.*node/');
    await expect(toast).toBeVisible({ timeout: 3000 });
  });

  test('no erratic behavior on rapid clicks', async ({ page }) => {
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    
    if (nodeCount < 3) {
      test.skip();
      return;
    }
    
    // Rapidly click different nodes
    for (let i = 0; i < 5; i++) {
      const nodeIndex = i % 3; // Cycle through first 3 nodes
      await nodes.nth(nodeIndex).click();
      await page.waitForTimeout(50); // Small delay between clicks
      
      // Should always have exactly one selected
      const selectedCount = await page.locator('.react-flow__node.selected').count();
      expect(selectedCount).toBe(1);
    }
  });
});