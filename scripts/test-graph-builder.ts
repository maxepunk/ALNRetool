#!/usr/bin/env tsx
/**
 * Test buildFullConnectionGraph function directly
 */

import { graphBuilder } from '../src/lib/graph/modules/GraphBuilder';

// Create test data
const testData = {
  characters: [
    { id: 'char1', name: 'Alice', ownedElementIds: ['elem1', 'elem2'] },
    { id: 'char2', name: 'Bob', ownedElementIds: ['elem3'] }
  ],
  elements: [
    { id: 'elem1', title: 'Element 1', name: 'Element 1', timelineEventId: 'time1' },
    { id: 'elem2', title: 'Element 2', name: 'Element 2' },
    { id: 'elem3', title: 'Element 3', name: 'Element 3' }
  ],
  puzzles: [
    { id: 'puzz1', title: 'Puzzle 1', puzzleElementIds: ['elem1'], rewardIds: ['elem2'] },
    { id: 'puzz2', title: 'Puzzle 2', puzzleElementIds: ['elem2'], rewardIds: ['elem3'] }
  ],
  timeline: [
    { id: 'time1', title: 'Event 1', date: '2024-01-01', charactersInvolvedIds: ['char1'] }
  ]
};

console.log('🔍 Testing buildFullConnectionGraph\n');
console.log('Test data:', {
  characters: testData.characters.length,
  elements: testData.elements.length,
  puzzles: testData.puzzles.length,
  timeline: testData.timeline.length
});

// Test 1: Character node
console.log('\n=== Test 1: Character Node ===');
try {
  const result = graphBuilder.buildFullConnectionGraph(
    testData,
    'char1',
    'character',
    { maxDepth: 3, maxNodes: 250 }
  );
  
  console.log('✅ Result:', {
    nodes: result.nodes.length,
    edges: result.edges.length,
    depthMetadata: result.depthMetadata
  });
  
  if (result.nodes.length > 0) {
    console.log('Node types:', result.nodes.map(n => n.type).filter((v, i, a) => a.indexOf(v) === i));
    console.log('First node:', result.nodes[0]);
  } else {
    console.error('❌ No nodes generated!');
  }
} catch (error) {
  console.error('❌ Error:', error);
}

// Test 2: Puzzle node
console.log('\n=== Test 2: Puzzle Node ===');
try {
  const result = graphBuilder.buildFullConnectionGraph(
    testData,
    'puzz1',
    'puzzle',
    { maxDepth: 3, maxNodes: 250 }
  );
  
  console.log('✅ Result:', {
    nodes: result.nodes.length,
    edges: result.edges.length,
    depthMetadata: result.depthMetadata
  });
  
  if (result.nodes.length > 0) {
    console.log('Node types:', result.nodes.map(n => n.type).filter((v, i, a) => a.indexOf(v) === i));
  } else {
    console.error('❌ No nodes generated!');
  }
} catch (error) {
  console.error('❌ Error:', error);
}

// Test 3: Element node
console.log('\n=== Test 3: Element Node ===');
try {
  const result = graphBuilder.buildFullConnectionGraph(
    testData,
    'elem1',
    'element',
    { maxDepth: 3, maxNodes: 250 }
  );
  
  console.log('✅ Result:', {
    nodes: result.nodes.length,
    edges: result.edges.length,
    depthMetadata: result.depthMetadata
  });
  
  if (result.nodes.length > 0) {
    console.log('Node types:', result.nodes.map(n => n.type).filter((v, i, a) => a.indexOf(v) === i));
  } else {
    console.error('❌ No nodes generated!');
  }
} catch (error) {
  console.error('❌ Error:', error);
}

// Test 4: Timeline node
console.log('\n=== Test 4: Timeline Node ===');
try {
  const result = graphBuilder.buildFullConnectionGraph(
    testData,
    'time1',
    'timeline',
    { maxDepth: 3, maxNodes: 250 }
  );
  
  console.log('✅ Result:', {
    nodes: result.nodes.length,
    edges: result.edges.length,
    depthMetadata: result.depthMetadata
  });
  
  if (result.nodes.length > 0) {
    console.log('Node types:', result.nodes.map(n => n.type).filter((v, i, a) => a.indexOf(v) === i));
  } else {
    console.error('❌ No nodes generated!');
  }
} catch (error) {
  console.error('❌ Error:', error);
}