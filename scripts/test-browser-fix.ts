#!/usr/bin/env tsx
/**
 * Quick test to verify the ESM/CommonJS fix
 * Tests that the app loads without module errors
 */

import { spawn } from 'child_process';

const FRONTEND_URL = 'http://localhost:5173';
const TIMEOUT = 10000; // 10 seconds

console.log('🧪 Testing ESM/CommonJS fix...\n');

// Simple fetch test to verify the app loads
async function testFrontendLoad() {
  try {
    console.log(`📡 Fetching frontend at ${FRONTEND_URL}...`);
    const response = await fetch(FRONTEND_URL);
    
    if (!response.ok) {
      throw new Error(`Frontend returned status ${response.status}`);
    }
    
    const html = await response.text();
    
    // Check for the root div
    if (!html.includes('id="root"')) {
      throw new Error('Root element not found in HTML');
    }
    
    // Check that Vite's module scripts are present
    if (!html.includes('type="module"')) {
      throw new Error('Module scripts not found');
    }
    
    console.log('✅ Frontend HTML loaded successfully');
    console.log('✅ Module scripts present in HTML');
    
    // The real test is in the browser console
    console.log('\n📋 Next steps:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Check the browser console for errors');
    console.log('3. The app should load without module export errors');
    
    return true;
  } catch (error) {
    console.error('❌ Frontend test failed:', error);
    return false;
  }
}

// Run the test
testFrontendLoad().then(success => {
  if (success) {
    console.log('\n✨ Initial tests passed! Please check browser console.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Tests failed. Check server logs.');
    process.exit(1);
  }
});