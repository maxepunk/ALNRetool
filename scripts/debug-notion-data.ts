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

async function fetchAndInspect(endpoint: string) {
  console.log(`\n=== Fetching ${endpoint} ===`);
  
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'X-API-Key': API_KEY }
  });
  
  if (!res.ok) {
    console.log(`Error: ${res.status} ${res.statusText}`);
    return;
  }
  
  const data = await res.json();
  console.log(`Total items: ${data.data.length}`);
  
  if (data.data.length > 0) {
    console.log('\nFirst item:');
    const item = data.data[0];
    console.log(`  id: ${item.id}`);
    console.log(`  name: "${item.name}" (type: ${typeof item.name}, length: ${item.name?.length})`);
    
    // Check for empty names
    const emptyNames = data.data.filter((i: any) => !i.name || i.name === '');
    console.log(`\nItems with empty names: ${emptyNames.length}`);
    if (emptyNames.length > 0) {
      console.log('First empty name item:', emptyNames[0]);
    }
  }
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
    server.stdout?.on('data', (data: Buffer) => {
      if (data.toString().includes('Server is running')) {
        setTimeout(resolve, 1000);
      }
    });
  });
  
  try {
    await fetchAndInspect('/api/notion/characters');
    await fetchAndInspect('/api/notion/elements');
    await fetchAndInspect('/api/notion/puzzles');
    await fetchAndInspect('/api/notion/timeline');
  } finally {
    server.kill();
  }
}

main().catch(console.error);