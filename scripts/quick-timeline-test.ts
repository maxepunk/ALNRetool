#!/usr/bin/env tsx
import { config } from 'dotenv';
config();

const API_KEY = process.env.API_KEY;

async function quickTest() {
  console.log('Quick Timeline Test\n');
  
  // Direct test without test server
  const start = Date.now();
  
  try {
    const response = await fetch('http://localhost:3001/api/notion/timeline?limit=5', {
      headers: { 'X-API-Key': API_KEY }
    });
    
    const duration = Date.now() - start;
    const data = await response.json();
    
    console.log(`Response in ${duration}ms`);
    console.log(`Status: ${response.status}`);
    console.log(`Items: ${data.data?.length ?? 0}`);
    console.log(`Has more: ${data.hasMore}`);
    
    if (duration < 2000) {
      console.log('\n✅ PASS: Under 2 seconds!');
    } else {
      console.log(`\n⚠️  WARNING: ${duration}ms (target <2000ms)`);
    }
  } catch (error) {
    console.error('Failed:', error.message);
    console.log('\nMake sure server is running: npm run dev:server');
  }
}

quickTest();