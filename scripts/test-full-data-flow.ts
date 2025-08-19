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

async function fetchAllWithPagination(endpoint: string) {
  const allItems: any[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const url = cursor 
      ? `${BASE_URL}${endpoint}?limit=100&cursor=${cursor}`
      : `${BASE_URL}${endpoint}?limit=100`;
      
    const res = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
        'Origin': 'http://localhost:5173',
        'Referer': 'http://localhost:5173/'
      }
    });
    
    if (!res.ok) {
      console.error(`Error fetching ${endpoint}: ${res.status}`);
      break;
    }
    
    const data = await res.json();
    allItems.push(...data.data);
    cursor = data.nextCursor;
    hasMore = data.hasMore;
  }
  
  return allItems;
}

async function main() {
  console.log('=== Testing Full Data Flow ===\n');
  
  // Fetch all elements with pagination
  console.log('Fetching all elements...');
  const elements = await fetchAllWithPagination('/api/notion/elements');
  console.log(`Total elements: ${elements.length}`);
  
  // Find elements that should have puzzle relationships
  const elementsWithPuzzleRelations = elements.filter(e => 
    (e.requiredForPuzzleIds && e.requiredForPuzzleIds.length > 0) ||
    (e.rewardedByPuzzleIds && e.rewardedByPuzzleIds.length > 0)
  );
  
  console.log(`\nElements with puzzle relationships: ${elementsWithPuzzleRelations.length}`);
  
  if (elementsWithPuzzleRelations.length > 0) {
    // Show first few examples
    console.log('\n=== Examples of Elements with Puzzle Relationships ===');
    elementsWithPuzzleRelations.slice(0, 3).forEach((element, index) => {
      console.log(`\n${index + 1}. ${element.name} (ID: ${element.id})`);
      
      if (element.requiredForPuzzleIds && element.requiredForPuzzleIds.length > 0) {
        console.log(`   Required for ${element.requiredForPuzzleIds.length} puzzles:`);
        console.log(`   IDs: ${JSON.stringify(element.requiredForPuzzleIds)}`);
      }
      
      if (element.rewardedByPuzzleIds && element.rewardedByPuzzleIds.length > 0) {
        console.log(`   Rewarded by ${element.rewardedByPuzzleIds.length} puzzles:`);
        console.log(`   IDs: ${JSON.stringify(element.rewardedByPuzzleIds)}`);
      }
    });
    
    // Now fetch puzzles to verify the relationships exist
    console.log('\n=== Verifying Puzzle Relationships ===');
    const puzzles = await fetchAllWithPagination('/api/notion/puzzles');
    console.log(`Total puzzles: ${puzzles.length}`);
    
    // For the first element with puzzle relations, verify the puzzles exist
    const testElement = elementsWithPuzzleRelations[0];
    console.log(`\nVerifying puzzles for element: ${testElement.name}`);
    
    if (testElement.requiredForPuzzleIds) {
      testElement.requiredForPuzzleIds.forEach((puzzleId: string) => {
        const puzzle = puzzles.find(p => p.id === puzzleId);
        if (puzzle) {
          console.log(`  ✓ Found puzzle: ${puzzle.name} (${puzzleId})`);
          // Check if puzzle has this element in its requirements
          if (puzzle.requiredElementIds && puzzle.requiredElementIds.includes(testElement.id)) {
            console.log(`    ✓ Puzzle correctly lists this element as required`);
          } else {
            console.log(`    ✗ Puzzle does NOT list this element in requiredElementIds`);
            console.log(`      Puzzle's requiredElementIds: ${JSON.stringify(puzzle.requiredElementIds)}`);
          }
        } else {
          console.log(`  ✗ Puzzle ${puzzleId} NOT found!`);
        }
      });
    }
  } else {
    console.log('\n✗ No elements found with puzzle relationships!');
    console.log('This might indicate a data transformation issue.');
  }
}

main().catch(console.error);