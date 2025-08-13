#!/usr/bin/env tsx
/**
 * Performance test for Timeline endpoint
 * Validates that pagination fixes prevent timeout
 */

import { config } from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TestServer } from './utils/test-server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load real environment
config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:3001';
const API_KEY = process.env.API_KEY || 'test-api-key';

async function testTimelinePerformance() {
  console.log('Testing Timeline Endpoint Performance...\n');
  
  const testServer = new TestServer({ 
    port: 3001,
    verbose: false,
    startupTimeout: 30000
  });

  try {
    // Start server
    await testServer.start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test Timeline endpoint with default limit (now 20 items)
    console.log('Testing /api/notion/timeline (default limit=20)...');
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/notion/timeline`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    const duration = Date.now() - startTime;
    const data = await response.json();
    
    console.log(`✓ Response in ${duration}ms`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Items returned: ${data.data?.length || 0}`);
    console.log(`  Has more: ${data.hasMore}`);
    console.log(`  Next cursor: ${data.nextCursor ? 'Present' : 'None'}`);
    
    // Test with explicit small limit
    console.log('\nTesting /api/notion/timeline?limit=10...');
    const startTime2 = Date.now();
    
    const response2 = await fetch(`${BASE_URL}/api/notion/timeline?limit=10`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    const duration2 = Date.now() - startTime2;
    const data2 = await response2.json();
    
    console.log(`✓ Response in ${duration2}ms`);
    console.log(`  Items returned: ${data2.data?.length || 0}`);
    
    // Performance check
    if (duration < 2000) {
      console.log('\n✅ PASS: Timeline responds in under 2 seconds');
    } else {
      console.log(`\n❌ FAIL: Timeline took ${duration}ms (target: <2000ms)`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await testServer.stop();
  }
}

testTimelinePerformance().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});