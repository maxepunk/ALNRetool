#!/usr/bin/env tsx
import { config } from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load real environment
config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:3001';
const API_KEY = process.env.API_KEY ?? '';

// The specific IDs we're looking for (from the Bar Damage Receipt)
const TARGET_IDS = {
  element: '2052f33d-583f-817c-aa1a-d412bf90481a', // Bar Damage Receipt
  owner: '1b62f33d-583f-8022-9a6f-c558cbb376a8', // Jamie Woods
  container: '1dd2f33d-583f-80f5-b6d9-cde8ab34fd80', // The Bar Safe
  timeline: '1b52f33d-583f-80a4-b9bc-fac38efacb0c', // Timeline event
};

async function fetchWithPagination(endpoint: string) {
  const allItems: any[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  let pageCount = 0;

  while (hasMore) {
    const url = cursor 
      ? `${BASE_URL}${endpoint}?limit=100&cursor=${cursor}`
      : `${BASE_URL}${endpoint}?limit=100`;
      
    const res = await fetch(url, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    if (!res.ok) {
      console.error(`Error fetching ${endpoint}: ${res.status} ${res.statusText}`);
      break;
    }
    
    const data = await res.json();
    allItems.push(...data.data);
    cursor = data.nextCursor;
    hasMore = data.hasMore;
    pageCount++;
    
    console.log(`  Page ${pageCount}: ${data.data.length} items (total: ${allItems.length})`);
  }
  
  return allItems;
}

async function main() {
  // Start server
  const { spawn } = await import('child_process');
  const server = spawn('tsx', ['server/index.ts'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: '3001' },
    stdio: 'pipe'
  });
  
  // Wait for server to start
  await new Promise(resolve => {
    server.stdout?.on('data', (data) => {
      if (data.toString().includes('Server running')) {
        resolve(undefined);
      }
    });
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    console.log('=== Fetching All Data with Pagination ===\n');
    
    // Fetch all data
    console.log('Fetching Characters...');
    const characters = await fetchWithPagination('/api/notion/characters');
    
    console.log('Fetching Elements...');
    const elements = await fetchWithPagination('/api/notion/elements');
    
    console.log('Fetching Puzzles...');
    const puzzles = await fetchWithPagination('/api/notion/puzzles');
    
    console.log('Fetching Timeline...');
    const timeline = await fetchWithPagination('/api/notion/timeline');
    
    console.log('\n=== Summary ===');
    console.log(`Total Characters: ${characters.length}`);
    console.log(`Total Elements: ${elements.length}`);
    console.log(`Total Puzzles: ${puzzles.length}`);
    console.log(`Total Timeline Events: ${timeline.length}`);
    
    console.log('\n=== Looking for Specific Entities ===');
    
    // Find the target element
    const targetElement = elements.find((e: any) => e.id === TARGET_IDS.element);
    if (targetElement) {
      console.log('\n✓ Found Bar Damage Receipt:', targetElement.name);
      console.log('  ownerId:', targetElement.ownerId);
      console.log('  containerId:', targetElement.containerId);
      console.log('  timelineEventId:', targetElement.timelineEventId);
    } else {
      console.log('\n✗ Bar Damage Receipt NOT found in elements');
    }
    
    // Find owner (Jamie Woods)
    const owner = characters.find((c: any) => c.id === TARGET_IDS.owner);
    if (owner) {
      console.log('\n✓ Found Owner (Jamie Woods):', owner.name);
    } else {
      console.log('\n✗ Owner (Jamie Woods) NOT found in characters');
      // Search in first few characters
      console.log('First 5 character IDs:');
      characters.slice(0, 5).forEach((c: any) => {
        console.log(`  ${c.id}: ${c.name}`);
      });
    }
    
    // Find container (The Bar Safe)
    const container = elements.find((e: any) => e.id === TARGET_IDS.container);
    if (container) {
      console.log('\n✓ Found Container (The Bar Safe):', container.name);
    } else {
      console.log('\n✗ Container (The Bar Safe) NOT found in elements');
      // Check if it's beyond the first 100
      const containerIndex = elements.findIndex((e: any) => e.id === TARGET_IDS.container);
      if (containerIndex > -1) {
        console.log(`  Actually found at index ${containerIndex} (beyond first 100)`);
      }
    }
    
    // Find timeline event
    const timelineEvent = timeline.find((t: any) => t.id === TARGET_IDS.timeline);
    if (timelineEvent) {
      console.log('\n✓ Found Timeline Event:', timelineEvent.name || timelineEvent.description);
    } else {
      console.log('\n✗ Timeline Event NOT found');
    }
    
    // Simulate the findEntityById function
    console.log('\n=== Simulating findEntityById Function ===');
    const findEntityById = (id: string) => {
      return characters.find((c: any) => c.id === id) ||
             elements.find((e: any) => e.id === id) ||
             puzzles.find((p: any) => p.id === id) ||
             timeline.find((t: any) => t.id === id);
    };
    
    console.log('Looking up ownerId:', TARGET_IDS.owner);
    const foundOwner = findEntityById(TARGET_IDS.owner);
    console.log('  Result:', foundOwner ? `Found: ${foundOwner.name}` : 'NOT FOUND');
    
    console.log('Looking up containerId:', TARGET_IDS.container);
    const foundContainer = findEntityById(TARGET_IDS.container);
    console.log('  Result:', foundContainer ? `Found: ${foundContainer.name}` : 'NOT FOUND');
    
    console.log('Looking up timelineEventId:', TARGET_IDS.timeline);
    const foundTimeline = findEntityById(TARGET_IDS.timeline);
    console.log('  Result:', foundTimeline ? `Found: ${foundTimeline.name || foundTimeline.description}` : 'NOT FOUND');
    
  } finally {
    server.kill();
  }
}

main().catch(console.error);