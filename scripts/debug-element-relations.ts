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

// The specific element ID from the user's test
const TARGET_ELEMENT_ID = '2052f33d-583f-817c-aa1a-d412bf90481a';

async function fetchElements() {
  console.log('\n=== Fetching Elements ===');
  
  const res = await fetch(`${BASE_URL}/api/elements?limit=100`, {
    headers: { 'X-API-Key': API_KEY }
  });
  
  if (!res.ok) {
    console.log(`Error: ${res.status} ${res.statusText}`);
    return null;
  }
  
  const data = await res.json();
  console.log(`Total elements: ${data.data.length}`);
  
  // Find the specific element
  const targetElement = data.data.find((e: any) => e.id === TARGET_ELEMENT_ID);
  
  if (targetElement) {
    console.log('\n=== Target Element Found ===');
    console.log('Name:', targetElement.name);
    console.log('ID:', targetElement.id);
    console.log('\n=== Relationship Fields ===');
    console.log('ownerId:', targetElement.ownerId);
    console.log('containerId:', targetElement.containerId);
    console.log('contentIds:', targetElement.contentIds);
    console.log('timelineEventId:', targetElement.timelineEventId);
    console.log('requiredForPuzzleIds:', targetElement.requiredForPuzzleIds);
    console.log('rewardedByPuzzleIds:', targetElement.rewardedByPuzzleIds);
    console.log('containerPuzzleId:', targetElement.containerPuzzleId);
    console.log('associatedCharacterIds:', targetElement.associatedCharacterIds);
    
    console.log('\n=== Full Element Data ===');
    console.log(JSON.stringify(targetElement, null, 2));
  } else {
    console.log(`Element with ID ${TARGET_ELEMENT_ID} not found`);
    
    // Show a few element IDs for reference
    console.log('\nAvailable element IDs:');
    data.data.slice(0, 5).forEach((e: any) => {
      console.log(`  - ${e.id}: ${e.name}`);
    });
  }
  
  return data.data;
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
    await fetchElements();
  } finally {
    server.kill();
  }
}

main().catch(console.error);