#!/usr/bin/env tsx
import { config } from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:3001';
const API_KEY = process.env.NOTION_API_KEY || '';
const TARGET_ELEMENT_ID = '2052f33d-583f-817c-aa1a-d412bf90481a'; // Bar Damage Receipt

async function main() {
  console.log('Fetching element data...\n');
  
  const res = await fetch(`${BASE_URL}/api/notion/elements?limit=100`, {
    headers: { 
      'X-API-Key': API_KEY,
      'Origin': 'http://localhost:5173',
      'Referer': 'http://localhost:5173/'
    }
  });
  
  if (!res.ok) {
    console.log(`Error: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log('Response:', text);
    return;
  }
  
  const data = await res.json();
  console.log(`Total elements fetched: ${data.data.length}`);
  
  // Find the specific element
  const targetElement = data.data.find((e: any) => e.id === TARGET_ELEMENT_ID);
  
  if (targetElement) {
    console.log('\n=== Bar Damage Receipt Found ===');
    console.log('Name:', targetElement.name);
    console.log('ID:', targetElement.id);
    
    console.log('\n=== Single Relationship Fields (IDs) ===');
    console.log('ownerId:', targetElement.ownerId || 'null');
    console.log('containerId:', targetElement.containerId || 'null');
    console.log('timelineEventId:', targetElement.timelineEventId || 'null');
    console.log('containerPuzzleId:', targetElement.containerPuzzleId || 'null');
    
    console.log('\n=== Array Relationship Fields ===');
    console.log('requiredForPuzzleIds:', JSON.stringify(targetElement.requiredForPuzzleIds || []));
    console.log('  Length:', (targetElement.requiredForPuzzleIds || []).length);
    
    console.log('rewardedByPuzzleIds:', JSON.stringify(targetElement.rewardedByPuzzleIds || []));
    console.log('  Length:', (targetElement.rewardedByPuzzleIds || []).length);
    
    console.log('associatedCharacterIds:', JSON.stringify(targetElement.associatedCharacterIds || []));
    console.log('  Length:', (targetElement.associatedCharacterIds || []).length);
    
    console.log('contentIds:', JSON.stringify(targetElement.contentIds || []));
    console.log('  Length:', (targetElement.contentIds || []).length);
    
    // Check if arrays are truly empty or null
    console.log('\n=== Data Type Check ===');
    console.log('requiredForPuzzleIds type:', typeof targetElement.requiredForPuzzleIds);
    console.log('requiredForPuzzleIds is array:', Array.isArray(targetElement.requiredForPuzzleIds));
    console.log('rewardedByPuzzleIds type:', typeof targetElement.rewardedByPuzzleIds);
    console.log('rewardedByPuzzleIds is array:', Array.isArray(targetElement.rewardedByPuzzleIds));
    
  } else {
    console.log(`Element with ID ${TARGET_ELEMENT_ID} not found`);
  }
}

main().catch(console.error);