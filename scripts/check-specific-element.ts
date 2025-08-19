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
const TARGET_ELEMENT_ID = '1dc2f33d-583f-8056-bf34-c6a9922067d8'; // Black Market Business card

async function main() {
  console.log('Fetching Black Market Business card data...\n');
  
  // First fetch all elements to find it
  const res = await fetch(`${BASE_URL}/api/notion/elements?limit=100`, {
    headers: { 
      'X-API-Key': API_KEY,
      'Origin': 'http://localhost:5173',
      'Referer': 'http://localhost:5173/'
    }
  });
  
  if (!res.ok) {
    console.log(`Error: ${res.status} ${res.statusText}`);
    return;
  }
  
  const data = await res.json();
  
  // Find the specific element
  const targetElement = data.data.find((e: any) => e.id === TARGET_ELEMENT_ID);
  
  if (targetElement) {
    console.log('=== Black Market Business card Found ===');
    console.log('Name:', targetElement.name);
    console.log('ID:', targetElement.id);
    console.log('Description:', targetElement.descriptionText);
    
    console.log('\n=== ALL Properties ===');
    console.log(JSON.stringify(targetElement, null, 2));
    
    console.log('\n=== Relationship Fields Analysis ===');
    const relationFields = [
      'ownerId',
      'containerId', 
      'contentIds',
      'timelineEventId',
      'requiredForPuzzleIds',
      'rewardedByPuzzleIds',
      'containerPuzzleId',
      'associatedCharacterIds'
    ];
    
    relationFields.forEach(field => {
      const value = targetElement[field];
      console.log(`${field}:`, 
        value === null ? 'null' : 
        value === undefined ? 'UNDEFINED' :
        Array.isArray(value) ? `[${value.length} items] ${JSON.stringify(value)}` :
        `"${value}"`
      );
    });
    
    // Check for any other fields that might contain "Ashe Motoko"
    console.log('\n=== Searching for "Ashe Motoko" in all fields ===');
    Object.entries(targetElement).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('Ashe')) {
        console.log(`Found in ${key}: "${value}"`);
      }
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'string' && item.includes('Ashe')) {
            console.log(`Found in ${key}[${index}]: "${item}"`);
          }
        });
      }
    });
  } else {
    console.log(`Element with ID ${TARGET_ELEMENT_ID} not found in first 100`);
    
    // Try fetching page 2
    console.log('\nTrying page 2...');
    const res2 = await fetch(`${BASE_URL}/api/notion/elements?limit=100&cursor=${data.nextCursor}`, {
      headers: { 
        'X-API-Key': API_KEY,
        'Origin': 'http://localhost:5173',
        'Referer': 'http://localhost:5173/'
      }
    });
    
    if (res2.ok) {
      const data2 = await res2.json();
      const targetElement2 = data2.data.find((e: any) => e.id === TARGET_ELEMENT_ID);
      
      if (targetElement2) {
        console.log('Found in page 2!');
        console.log(JSON.stringify(targetElement2, null, 2));
      } else {
        console.log('Not found in page 2 either');
      }
    }
  }
}

main().catch(console.error);