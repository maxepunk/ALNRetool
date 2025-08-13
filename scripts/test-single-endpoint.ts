#!/usr/bin/env tsx
import { config } from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load real environment
config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:3001';
const API_KEY = process.env.API_KEY || '';

async function testEndpoint(name: string, path: string) {
  console.log(`\n=== Testing ${name} ===`);
  
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-API-Key': API_KEY }
  });
  
  if (!res.ok) {
    console.log(`✗ Error: ${res.status} ${res.statusText}`);
    return false;
  }
  
  const data = await res.json();
  console.log(`✓ Status 200 OK`);
  console.log(`✓ Total items: ${data.data.length}`);
  
  if (data.data.length > 0) {
    const firstItem = data.data[0];
    
    // Check for name field
    if (!firstItem.hasOwnProperty('name')) {
      console.log(`✗ Item missing name field`);
      return false;
    }
    
    // Check name is string (can be empty)
    if (typeof firstItem.name !== 'string') {
      console.log(`✗ Name field should be a string, got: ${typeof firstItem.name}`);
      return false;
    }
    
    console.log(`✓ Has name field: "${firstItem.name}" (${firstItem.name.length} chars)`);
    
    // Endpoint specific checks
    if (name === 'Characters') {
      if (!firstItem.hasOwnProperty('type')) {
        console.log(`✗ Character missing type field`);
        return false;
      }
      if (!firstItem.hasOwnProperty('tier')) {
        console.log(`✗ Character missing tier field`);
        return false;
      }
      console.log(`✓ Has type: ${firstItem.type}`);
      console.log(`✓ Has tier: ${firstItem.tier}`);
    }
  }
  
  return true;
}

async function main() {
  // Start server
  const { spawn } = await import('child_process');
  const server = spawn('tsx', ['server/index.ts'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: '3001' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Wait for server
  await new Promise(resolve => {
    const timeout = setTimeout(() => {
      console.log('Server timeout, proceeding anyway...');
      resolve(undefined);
    }, 5000);
    
    server.stdout?.on('data', (data: Buffer) => {
      if (data.toString().includes('Server is running')) {
        clearTimeout(timeout);
        setTimeout(resolve, 1000);
      }
    });
  });
  
  try {
    const endpoints = [
      { name: 'Characters', path: '/api/notion/characters' },
      { name: 'Elements', path: '/api/notion/elements' },
      { name: 'Puzzles', path: '/api/notion/puzzles' },
      { name: 'Timeline', path: '/api/notion/timeline' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const endpoint of endpoints) {
      const success = await testEndpoint(endpoint.name, endpoint.path);
      if (success) passed++;
      else failed++;
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
  } finally {
    server.kill();
  }
}

main().catch(console.error);