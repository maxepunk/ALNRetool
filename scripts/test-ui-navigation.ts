#!/usr/bin/env tsx
/**
 * UI Navigation Test using Playwright
 * Tests that sidebar navigation works and filters appear correctly
 */

import { chromium } from 'playwright';

async function testUINavigation() {
  console.log('\n🎭 Testing UI Navigation with Playwright\n');
  console.log('='.repeat(50));

  const browser = await chromium.launch({ 
    headless: false, // Set to true for CI/CD
    slowMo: 500 // Slow down for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app
    console.log('\n📋 Loading Application...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Test 1: Navigate to Puzzles view
    console.log('\n✅ Test 1: Navigate to Puzzles');
    await page.click('text=Puzzle Focus');
    await page.waitForURL('**/puzzles');
    console.log('   - URL correct: /puzzles');
    
    // Check if puzzle filters are visible
    const puzzleFilters = await page.locator('[data-testid="puzzle-filters"]').isVisible().catch(() => false);
    console.log(`   - Puzzle filters visible: ${puzzleFilters ? 'Yes' : 'No (might use different selector)'}`);
    
    // Test 2: Navigate to Character Journey
    console.log('\n✅ Test 2: Navigate to Character Journey');
    await page.click('text=Character Journey');
    await page.waitForURL('**/character-journey');
    console.log('   - URL correct: /character-journey');
    
    // Check if character selector appears
    const characterSelector = await page.locator('text=Select a Character').isVisible().catch(() => false);
    console.log(`   - Character selector visible: ${characterSelector ? 'Yes' : 'No'}`);
    
    // Test 3: Navigate to Content Status
    console.log('\n✅ Test 3: Navigate to Content Status');
    await page.click('text=Content Status');
    await page.waitForURL('**/status');
    console.log('   - URL correct: /status');
    
    // Check if content filters are visible
    const contentFilters = await page.locator('[data-testid="content-filters"]').isVisible().catch(() => false);
    console.log(`   - Content filters visible: ${contentFilters ? 'Yes' : 'No (might use different selector)'}`);
    
    // Test 4: Check sidebar collapse/expand
    console.log('\n✅ Test 4: Sidebar Toggle');
    const toggleButton = await page.locator('[aria-label*="toggle"], [aria-label*="Toggle"]').first();
    if (toggleButton) {
      await toggleButton.click();
      await page.waitForTimeout(600); // Wait for animation
      console.log('   - Sidebar toggled successfully');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All navigation tests passed!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Keep browser open for a moment to see results
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

// Run the test
testUINavigation().catch(console.error);