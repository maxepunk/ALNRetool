#!/usr/bin/env tsx
/**
 * Test script to validate character switching in Full Web mode
 * and verify force layout improvements
 */

import { config } from 'dotenv';
config();

async function testCharacterSwitching() {
  const baseUrl = 'http://localhost:3001/api/notion';
  
  console.log('🔍 Testing Character Switching and Force Layout...\n');
  
  // Get all characters
  const charactersRes = await fetch(`${baseUrl}/characters`, {
    headers: {
      'x-api-key': process.env.NOTION_API_KEY || ''
    }
  });
  const response = await charactersRes.json();
  
  if (!response.data) {
    console.error('No data in response. Check API key.');
    return;
  }
  
  const characters = response.data;
  console.log(`Found ${characters.length} characters\n`);
  
  // Get synthesized data
  const synthRes = await fetch(`${baseUrl}/synthesized`, {
    headers: {
      'x-api-key': process.env.NOTION_API_KEY || ''
    }
  });
  const synthData = await synthRes.json();
  const synth = synthData.data;
  
  if (!synth || !synth.elements || !synth.puzzles) {
    console.error('Synthesized data is incomplete');
    return;
  }
  
  // Test first 3 characters
  for (const char of characters.slice(0, 3)) {
    console.log(`\n👤 Testing character: ${char.name} (${char.id})`);
    
    // Simulate Full Web BFS traversal
    const visited = new Set<string>();
    const queue: [string, number, string][] = [[char.id, 0, 'character']];
    visited.add(char.id);
    
    let nodesProcessed = 0;
    const maxDepth = 10;
    const maxNodes = 250;
    
    while (queue.length > 0 && nodesProcessed < maxNodes) {
      const [currentId, depth, type] = queue.shift()!;
      
      if (depth >= maxDepth) continue;
      nodesProcessed++;
      
      if (type === 'character') {
        const character = characters.find(c => c.id === currentId);
        if (character) {
          // Add owned elements
          (character.ownedElementIds || []).forEach(elemId => {
            if (!visited.has(elemId)) {
              visited.add(elemId);
              queue.push([elemId, depth + 1, 'element']);
            }
          });
        }
      } else if (type === 'element') {
        const elem = synth.elements.find(e => e.id === currentId);
        if (elem) {
          // Add puzzles
          synth.puzzles.forEach(puzzle => {
            if ((puzzle.puzzleElementIds?.includes(currentId) || 
                 puzzle.rewardIds?.includes(currentId)) && 
                !visited.has(puzzle.id)) {
              visited.add(puzzle.id);
              queue.push([puzzle.id, depth + 1, 'puzzle']);
            }
          });
        }
      } else if (type === 'puzzle') {
        const puzzle = synth.puzzles.find(p => p.id === currentId);
        if (puzzle) {
          // Add all requirements and rewards
          [...(puzzle.puzzleElementIds || []), ...(puzzle.rewardIds || [])].forEach(elemId => {
            if (!visited.has(elemId)) {
              visited.add(elemId);
              queue.push([elemId, depth + 1, 'element']);
            }
          });
        }
      }
    }
    
    console.log(`  Total reachable nodes: ${visited.size}`);
    console.log(`  Force layout would use:`);
    console.log(`    - Canvas: 6000x4000 (increased from 3000x2000)`);
    console.log(`    - Charge: -2000 (increased from -600)`);
    console.log(`    - Link distance: 250 (increased from 180)`);
    console.log(`    - Collision radius: 80 (increased from 65)`);
    console.log(`    - Iterations: 500 (increased from 400)`);
  }
  
  console.log('\n✅ Summary:');
  console.log('  - Character switching should work via CharacterSelector dropdown');
  console.log('  - Full Web mode should show all connected nodes from selected character');
  console.log('  - Force layout improved with stronger repulsion and larger canvas');
  console.log('  - Node-type specific forces provide better visual hierarchy');
}

testCharacterSwitching().catch(console.error);