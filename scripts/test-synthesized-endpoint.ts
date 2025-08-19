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
  console.log('Testing synthesized endpoint...\n');
  
  const res = await fetch(`${BASE_URL}/api/notion/synthesized`, {
    headers: { 
      'X-API-Key': API_KEY,
      'Origin': 'http://localhost:5173',
      'Referer': 'http://localhost:5173/'
    }
  });
  
  if (!res.ok) {
    console.error(`Error: ${res.status} ${res.statusText}`);
    return;
  }
  
  const data = await res.json();
  
  console.log(`Total elements: ${data.totalElements}`);
  console.log(`Total puzzles: ${data.totalPuzzles}`);
  
  // Check Black Market Business card
  const blackMarketCard = data.elements.find((e: any) => e.id === '1dc2f33d-583f-8056-bf34-c6a9922067d8');
  if (blackMarketCard) {
    console.log('\n=== Black Market Business card ===');
    console.log('Name:', blackMarketCard.name);
    console.log('Owner ID:', blackMarketCard.ownerId);
    console.log('Rewarded by puzzles:', blackMarketCard.rewardedByPuzzleIds);
    console.log('Required for puzzles:', blackMarketCard.requiredForPuzzleIds);
    
    // Find the puzzles that reward this card
    if (blackMarketCard.rewardedByPuzzleIds?.length > 0) {
      console.log('\n=== Puzzles that reward this card ===');
      for (const puzzleId of blackMarketCard.rewardedByPuzzleIds) {
        const puzzle = data.puzzles.find((p: any) => p.id === puzzleId);
        if (puzzle) {
          console.log(`- ${puzzle.name} (${puzzle.id})`);
        }
      }
    }
  }
  
  // Check statistics
  const elementsWithPuzzleRefs = data.elements.filter((e: any) => 
    (e.requiredForPuzzleIds?.length > 0) || (e.rewardedByPuzzleIds?.length > 0)
  );
  
  console.log('\n=== Statistics ===');
  console.log(`Elements with puzzle relationships: ${elementsWithPuzzleRefs.length} / ${data.totalElements}`);
  
  // Show first 5 elements with relationships
  console.log('\n=== Sample elements with puzzle relationships ===');
  elementsWithPuzzleRefs.slice(0, 5).forEach((e: any) => {
    console.log(`- ${e.name}:`);
    if (e.requiredForPuzzleIds?.length > 0) {
      console.log(`  Required for ${e.requiredForPuzzleIds.length} puzzle(s)`);
    }
    if (e.rewardedByPuzzleIds?.length > 0) {
      console.log(`  Rewarded by ${e.rewardedByPuzzleIds.length} puzzle(s)`);
    }
  });
}

main().catch(console.error);