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
  const allData: any[] = [];
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
    allData.push(...data.data);
    cursor = data.nextCursor || undefined;
    hasMore = data.hasMore;
  }
  
  return allData;
}

async function main() {
  console.log('Fetching all data with pagination...\n');
  
  // Fetch all data
  const [puzzles, elements] = await Promise.all([
    fetchAllWithPagination('/api/notion/puzzles'),
    fetchAllWithPagination('/api/notion/elements')
  ]);
  
  console.log(`Total puzzles: ${puzzles.length}`);
  console.log(`Total elements: ${elements.length}`);
  
  // Check puzzle -> element relationships
  console.log('\n=== Checking Puzzle → Element Relationships ===');
  
  let inconsistencies = 0;
  let puzzlesWithRelations = 0;
  
  for (const puzzle of puzzles) {
    const hasRelations = (puzzle.requiredElementIds?.length > 0) || (puzzle.rewardIds?.length > 0);
    if (hasRelations) {
      puzzlesWithRelations++;
      
      // Check required elements
      if (puzzle.requiredElementIds?.length > 0) {
        for (const elementId of puzzle.requiredElementIds) {
          const element = elements.find(e => e.id === elementId);
          if (element) {
            if (!element.requiredForPuzzleIds?.includes(puzzle.id)) {
              console.log(`❌ Inconsistency: Puzzle "${puzzle.name}" requires element "${element.name}" but element doesn't reference puzzle back`);
              console.log(`   Puzzle.requiredElementIds includes: ${elementId}`);
              console.log(`   Element.requiredForPuzzleIds: ${JSON.stringify(element.requiredForPuzzleIds || [])}`);
              inconsistencies++;
            }
          } else {
            console.log(`⚠️  Puzzle "${puzzle.name}" references non-existent element ID: ${elementId}`);
          }
        }
      }
      
      // Check reward elements
      if (puzzle.rewardIds?.length > 0) {
        for (const elementId of puzzle.rewardIds) {
          const element = elements.find(e => e.id === elementId);
          if (element) {
            if (!element.rewardedByPuzzleIds?.includes(puzzle.id)) {
              console.log(`❌ Inconsistency: Puzzle "${puzzle.name}" rewards element "${element.name}" but element doesn't reference puzzle back`);
              console.log(`   Puzzle.rewardIds includes: ${elementId}`);
              console.log(`   Element.rewardedByPuzzleIds: ${JSON.stringify(element.rewardedByPuzzleIds || [])}`);
              inconsistencies++;
            }
          } else {
            console.log(`⚠️  Puzzle "${puzzle.name}" references non-existent element ID: ${elementId}`);
          }
        }
      }
    }
  }
  
  console.log(`\nPuzzles with relationships: ${puzzlesWithRelations}`);
  console.log(`Total inconsistencies found: ${inconsistencies}`);
  
  // Find elements with puzzle relationships
  console.log('\n=== Elements with Puzzle Relationships ===');
  const elementsWithPuzzleRefs = elements.filter(e => 
    (e.requiredForPuzzleIds?.length > 0) || 
    (e.rewardedByPuzzleIds?.length > 0)
  );
  
  console.log(`Elements referencing puzzles: ${elementsWithPuzzleRefs.length}`);
  
  if (elementsWithPuzzleRefs.length > 0) {
    console.log('\nFirst 5 examples:');
    elementsWithPuzzleRefs.slice(0, 5).forEach(e => {
      console.log(`- "${e.name}":`);
      if (e.requiredForPuzzleIds?.length > 0) {
        console.log(`  Required for ${e.requiredForPuzzleIds.length} puzzles`);
      }
      if (e.rewardedByPuzzleIds?.length > 0) {
        console.log(`  Rewarded by ${e.rewardedByPuzzleIds.length} puzzles`);
      }
    });
  }
}

main().catch(console.error);