#!/usr/bin/env tsx
/**
 * Server-side test script to analyze connectivity in the game world
 */

import { config } from 'dotenv';
config();

import NotionService from '../server/services/notion';

async function analyzeConnectivity() {
  console.log('🔍 Analyzing game world connectivity...\n');
  
  const notionService = new NotionService();
  
  // Fetch all data
  const [characters, elements, puzzles, timeline] = await Promise.all([
    notionService.listCharacters(),
    notionService.listElements(),
    notionService.listPuzzles(),
    notionService.listTimeline(),
  ]);
  
  console.log('📊 Data loaded:');
  console.log(`  - Characters: ${characters.length}`);
  console.log(`  - Elements: ${elements.length}`);
  console.log(`  - Puzzles: ${puzzles.length}`);
  console.log(`  - Timeline: ${timeline.length}`);
  console.log(`  - Total entities: ${characters.length + elements.length + puzzles.length + timeline.length}\n`);
  
  // Analyze connectivity for first 3 characters
  for (const character of characters.slice(0, 3)) {
    console.log(`\n👤 Character: ${character.name}`);
    console.log(`  - Owned elements: ${character.ownedElementIds?.length || 0}`);
    
    // Simulate BFS traversal (simplified)
    const visited = new Set<string>();
    const queue: [string, number, string][] = [[character.id, 0, 'character']];
    visited.add(character.id);
    
    const depthCounts = new Map<number, number>();
    let maxDepth = 0;
    
    while (queue.length > 0) {
      const [currentId, depth, type] = queue.shift()!;
      
      if (depth > 5) continue; // Limit depth for testing
      
      depthCounts.set(depth, (depthCounts.get(depth) || 0) + 1);
      maxDepth = Math.max(maxDepth, depth);
      
      // Process based on type
      if (type === 'character') {
        const char = characters.find(c => c.id === currentId);
        if (char) {
          // Add owned elements
          (char.ownedElementIds || []).forEach(elemId => {
            if (!visited.has(elemId)) {
              visited.add(elemId);
              queue.push([elemId, depth + 1, 'element']);
            }
          });
        }
      } else if (type === 'element') {
        const elem = elements.find(e => e.id === currentId);
        if (elem) {
          // Add puzzles that require or reward this element
          puzzles.forEach(puzzle => {
            if ((puzzle.puzzleElementIds?.includes(currentId) || puzzle.rewardIds?.includes(currentId)) && !visited.has(puzzle.id)) {
              visited.add(puzzle.id);
              queue.push([puzzle.id, depth + 1, 'puzzle']);
            }
          });
        }
      } else if (type === 'puzzle') {
        const puzzle = puzzles.find(p => p.id === currentId);
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
    
    console.log(`  - Total reachable nodes (depth <= 5): ${visited.size}`);
    console.log('  - Nodes by depth:');
    for (let d = 0; d <= maxDepth; d++) {
      const count = depthCounts.get(d) || 0;
      console.log(`      Depth ${d}: ${count} nodes`);
    }
  }
  
  console.log('\n🌐 Connectivity Analysis Summary:');
  console.log('  Testing how interconnected the game world is...');
}

analyzeConnectivity().catch(console.error);