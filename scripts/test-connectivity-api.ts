#!/usr/bin/env tsx
/**
 * Test connectivity via the API to understand why Full Web shows so many nodes
 */

import { config } from 'dotenv';
config();

async function testConnectivity() {
  const baseUrl = 'http://localhost:3001/api/notion';
  
  console.log('🔍 Testing Full Web connectivity...\n');
  
  // Get all characters first
  const charactersRes = await fetch(`${baseUrl}/characters`, {
    headers: {
      'x-api-key': process.env.NOTION_API_KEY || ''
    }
  });
  const response = await charactersRes.json();
  console.log('API Response:', response);
  
  if (!response.data) {
    console.error('No data in response. Check API key.');
    return;
  }
  
  const characters = response.data;
  console.log(`Found ${characters.length} characters\n`);
  
  // Test connectivity for first 3 characters
  for (const char of characters.slice(0, 3)) {
    console.log(`\n👤 Testing character: ${char.name} (${char.id})`);
    console.log(`   Tier: ${char.tier || 'Unknown'}`);
    console.log(`   Owned elements: ${char.ownedElementIds?.length || 0}`);
    
    // Get synthesized data to simulate what Full Web would see
    const synthRes = await fetch(`${baseUrl}/synthesized`, {
      headers: {
        'x-api-key': process.env.NOTION_API_KEY || ''
      }
    });
    const synthData = await synthRes.json();
    const synth = synthData.data;
    
    // Simple connectivity check - count how many elements this character can reach
    const reachableElements = new Set<string>();
    const reachablePuzzles = new Set<string>();
    
    // Direct ownership
    (char.ownedElementIds || []).forEach(id => reachableElements.add(id));
    
    // Elements lead to puzzles
    synth.elements.forEach((elem: any) => {
      if (reachableElements.has(elem.id)) {
        // Find puzzles that use this element
        synth.puzzles.forEach((puzzle: any) => {
          if (puzzle.puzzleElementIds?.includes(elem.id) || puzzle.rewardIds?.includes(elem.id)) {
            reachablePuzzles.add(puzzle.id);
            // Puzzles lead to more elements
            (puzzle.rewardIds || []).forEach((rewId: string) => reachableElements.add(rewId));
          }
        });
      }
    });
    
    console.log(`   Reachable at depth 2:`);
    console.log(`     - Elements: ${reachableElements.size}`);
    console.log(`     - Puzzles: ${reachablePuzzles.size}`);
    
    // Do one more hop to see explosion
    const elementsAfter3Hops = new Set(reachableElements);
    reachablePuzzles.forEach(puzzleId => {
      const puzzle = synth.puzzles.find((p: any) => p.id === puzzleId);
      if (puzzle) {
        [...(puzzle.puzzleElementIds || []), ...(puzzle.rewardIds || [])].forEach((id: string) => {
          elementsAfter3Hops.add(id);
        });
      }
    });
    
    console.log(`   Reachable at depth 3:`);
    console.log(`     - Elements: ${elementsAfter3Hops.size}`);
  }
  
  console.log('\n💡 Analysis: If characters can reach many elements in just 2-3 hops,');
  console.log('   the Full Web view (depth 10) will include almost everything.');
}

testConnectivity().catch(console.error);