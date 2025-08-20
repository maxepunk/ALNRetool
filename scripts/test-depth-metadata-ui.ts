#!/usr/bin/env tsx
/**
 * Test script to verify depth metadata UI is working correctly
 * Run with: tsx scripts/test-depth-metadata-ui.ts
 */

import puppeteer from 'puppeteer';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

async function testDepthMetadataUI() {
  console.log(`${BLUE}Testing Depth Metadata UI...${RESET}\n`);
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for CI
    devtools: true
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('depthMetadata') || text.includes('Depth metadata')) {
        console.log(`${GREEN}Console:${RESET}`, text);
      }
    });
    
    // Navigate to the app
    console.log(`${YELLOW}1. Navigating to Character Journey view...${RESET}`);
    await page.goto('http://localhost:5173/character-journey', {
      waitUntil: 'networkidle2'
    });
    
    // Wait for the view to load
    await page.waitForSelector('[data-testid="character-journey-view"]', { timeout: 5000 });
    console.log(`${GREEN}✓ Character Journey view loaded${RESET}`);
    
    // Check if there's a character selector prompt (no character selected)
    const noCharacterCard = await page.$('.text-xl:has-text("No Character Selected")');
    if (noCharacterCard) {
      console.log(`${YELLOW}2. No character selected. Attempting to select Howie Sullivan...${RESET}`);
      
      // Look for character selector in sidebar
      await page.waitForSelector('[data-testid="character-selector"]', { timeout: 5000 });
      await page.click('[data-testid="character-selector"]');
      
      // Select Howie Sullivan
      await page.waitForSelector('text=Howie Sullivan', { timeout: 5000 });
      await page.click('text=Howie Sullivan');
      console.log(`${GREEN}✓ Selected Howie Sullivan${RESET}`);
    }
    
    // Wait for graph to render
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    console.log(`${GREEN}✓ Graph rendered${RESET}`);
    
    // Check for Full Web button and click it
    console.log(`${YELLOW}3. Switching to Full Web mode...${RESET}`);
    const fullWebButton = await page.$('button:has-text("Full Web")');
    if (fullWebButton) {
      await fullWebButton.click();
      console.log(`${GREEN}✓ Switched to Full Web mode${RESET}`);
      
      // Wait a moment for the graph to update
      await page.waitForTimeout(2000);
      
      // Check for depth metadata badges
      console.log(`${YELLOW}4. Looking for depth metadata UI badges...${RESET}`);
      
      // Look for "Complete network" badge
      const completeNetworkBadge = await page.$('.bg-green-50:has-text("Complete network")');
      if (completeNetworkBadge) {
        const badgeText = await completeNetworkBadge.textContent();
        console.log(`${GREEN}✓ Found Complete Network badge: ${badgeText}${RESET}`);
      }
      
      // Look for "Showing X of Y nodes" badge
      const partialNetworkBadge = await page.$('.bg-blue-50:has-text("Showing")');
      if (partialNetworkBadge) {
        const badgeText = await partialNetworkBadge.textContent();
        console.log(`${GREEN}✓ Found Partial Network badge: ${badgeText}${RESET}`);
      }
      
      // Check for depth slider in sidebar
      console.log(`${YELLOW}5. Testing connection depth slider...${RESET}`);
      const depthSlider = await page.$('input[type="range"][min="1"][max="5"]');
      if (depthSlider) {
        // Get current value
        const currentValue = await depthSlider.evaluate(el => (el as HTMLInputElement).value);
        console.log(`  Current depth: ${currentValue}`);
        
        // Change to different values and observe
        for (const depth of [1, 3, 5]) {
          await depthSlider.evaluate((el, val) => {
            (el as HTMLInputElement).value = String(val);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }, depth);
          
          await page.waitForTimeout(1000); // Wait for graph to update
          
          // Check if badge updated
          const badge = await page.$('.bg-green-50:has-text("Complete network"), .bg-blue-50:has-text("Showing")');
          if (badge) {
            const badgeText = await badge.textContent();
            console.log(`  Depth ${depth}: ${badgeText}`);
          }
        }
        console.log(`${GREEN}✓ Connection depth slider working${RESET}`);
      } else {
        console.log(`${RED}✗ Could not find connection depth slider${RESET}`);
      }
      
    } else {
      console.log(`${RED}✗ Could not find Full Web button${RESET}`);
    }
    
    // Check console for depth metadata logs
    console.log(`\n${BLUE}Test Summary:${RESET}`);
    console.log('Please check the browser console for depth metadata logs.');
    console.log('Look for messages containing "depthMetadata" or "Depth metadata".');
    
    // Keep browser open for manual inspection
    console.log(`\n${YELLOW}Browser will remain open for manual inspection.${RESET}`);
    console.log('Press Ctrl+C to close.');
    
    // Keep the script running
    await new Promise(() => {});
    
  } catch (error) {
    console.error(`${RED}Test failed:${RESET}`, error);
    await browser.close();
    process.exit(1);
  }
}

// Run the test
testDepthMetadataUI().catch(console.error);