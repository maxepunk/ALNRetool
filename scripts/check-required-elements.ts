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
  console.log('Checking puzzle required elements...\n');
  
  // Fetch puzzles
  const res = await fetch(`${BASE_URL}/api/notion/puzzles?limit=100`, {
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
  console.log(`Total puzzles: ${data.data.length}\n`);
  
  // Check which puzzles have required elements
  const puzzlesWithRequiredElements = data.data.filter((p: any) => 
    p.requiredElementIds && p.requiredElementIds.length > 0
  );
  
  console.log(`Puzzles with required elements: ${puzzlesWithRequiredElements.length}`);
  
  if (puzzlesWithRequiredElements.length > 0) {
    console.log('\n=== Puzzles with Required Elements ===');
    puzzlesWithRequiredElements.forEach((puzzle: any) => {
      console.log(`\n"${puzzle.name}":`);
      console.log(`  requiredElementIds: ${JSON.stringify(puzzle.requiredElementIds)}`);
    });
  }
  
  // Check other puzzle fields that might contain element references
  console.log('\n=== Checking All Puzzle Fields ===');
  const samplePuzzle = data.data[0];
  if (samplePuzzle) {
    console.log(`Sample puzzle: "${samplePuzzle.name}"`);
    console.log('Fields with element references:');
    Object.entries(samplePuzzle).forEach(([key, value]) => {
      if (key.toLowerCase().includes('element') || key.toLowerCase().includes('reward') || key.toLowerCase().includes('required')) {
        console.log(`  ${key}: ${JSON.stringify(value)}`);
      }
    });
  }
  
  // Now check the synthesized endpoint
  console.log('\n=== Checking Synthesized Data ===');
  const synthRes = await fetch(`${BASE_URL}/api/notion/synthesized`, {
    headers: { 
      'X-API-Key': API_KEY,
      'Origin': 'http://localhost:5173',
      'Referer': 'http://localhost:5173/'
    }
  });
  
  if (synthRes.ok) {
    const synthData = await synthRes.json();
    
    // Check puzzles with required elements in synthesized data
    const synthPuzzlesWithRequired = synthData.puzzles.filter((p: any) => 
      p.requiredElementIds && p.requiredElementIds.length > 0
    );
    
    console.log(`\nSynthesized puzzles with required elements: ${synthPuzzlesWithRequired.length}`);
    
    // Check if any elements have requiredForPuzzleIds
    const elementsRequiredForPuzzles = synthData.elements.filter((e: any) => 
      e.requiredForPuzzleIds && e.requiredForPuzzleIds.length > 0
    );
    
    console.log(`Elements marked as required for puzzles: ${elementsRequiredForPuzzles.length}`);
    
    if (elementsRequiredForPuzzles.length > 0) {
      console.log('\nFirst 5 elements required for puzzles:');
      elementsRequiredForPuzzles.slice(0, 5).forEach((e: any) => {
        console.log(`- "${e.name}" required for: ${JSON.stringify(e.requiredForPuzzleIds)}`);
      });
    }
  }
}

main().catch(console.error);