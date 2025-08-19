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

async function main() {
  console.log('Fetching puzzle data to check relationships...\n');
  
  // Fetch puzzles
  const res = await fetch(`${BASE_URL}/api/notion/puzzles?limit=100`, {
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
  console.log(`Total puzzles fetched: ${data.data.length}`);
  
  // Find puzzles with element relationships
  const puzzlesWithElements = data.data.filter((p: any) => 
    (p.requiredElementIds && p.requiredElementIds.length > 0) ||
    (p.rewardIds && p.rewardIds.length > 0)
  );
  
  console.log(`\nPuzzles with element relationships: ${puzzlesWithElements.length}`);
  
  // Show first puzzle with relationships
  if (puzzlesWithElements.length > 0) {
    const puzzle = puzzlesWithElements[0];
    console.log('\n=== Example Puzzle ===');
    console.log('Name:', puzzle.name);
    console.log('ID:', puzzle.id);
    
    console.log('\n=== Relationship Fields ===');
    console.log('requiredElementIds:', JSON.stringify(puzzle.requiredElementIds || []));
    console.log('  Count:', (puzzle.requiredElementIds || []).length);
    
    console.log('rewardIds:', JSON.stringify(puzzle.rewardIds || []));
    console.log('  Count:', (puzzle.rewardIds || []).length);
    
    console.log('containerIds:', JSON.stringify(puzzle.containerIds || []));
    console.log('  Count:', (puzzle.containerIds || []).length);
    
    console.log('ownerId:', puzzle.ownerId || 'null');
    console.log('associatedCharacterIds:', JSON.stringify(puzzle.associatedCharacterIds || []));
    
    // Now fetch elements to see the reverse relationships
    console.log('\n=== Checking Reverse Relationships ===');
    const elemRes = await fetch(`${BASE_URL}/api/notion/elements?limit=100`, {
      headers: { 
        'X-API-Key': API_KEY,
        'Origin': 'http://localhost:5173',
        'Referer': 'http://localhost:5173/'
      }
    });
    
    const elemData = await elemRes.json();
    
    // Find elements that reference this puzzle
    const elementsReferencingPuzzle = elemData.data.filter((e: any) => 
      (e.requiredForPuzzleIds && e.requiredForPuzzleIds.includes(puzzle.id)) ||
      (e.rewardedByPuzzleIds && e.rewardedByPuzzleIds.includes(puzzle.id))
    );
    
    console.log(`Elements that reference puzzle "${puzzle.name}":`);
    console.log(`  Found ${elementsReferencingPuzzle.length} elements`);
    
    if (elementsReferencingPuzzle.length > 0) {
      elementsReferencingPuzzle.slice(0, 3).forEach((e: any) => {
        console.log(`  - ${e.name}:`);
        console.log(`    requiredForPuzzleIds: ${JSON.stringify(e.requiredForPuzzleIds)}`);
        console.log(`    rewardedByPuzzleIds: ${JSON.stringify(e.rewardedByPuzzleIds)}`);
      });
    }
  }
}

main().catch(console.error);