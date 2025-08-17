#!/usr/bin/env npx tsx
/**
 * Simple test to verify parent-child relationships are working
 */

import { config } from 'dotenv';

// Load environment variables
config();

// Test with mock data
const mockPuzzles = [
  { 
    id: 'puzzle-1',
    name: 'Test Puzzle 1',
    puzzleElementIds: ['element-1', 'element-2']
  },
  {
    id: 'puzzle-2', 
    name: 'Test Puzzle 2',
    puzzleElementIds: ['element-3']
  }
];

const mockElements = [
  { id: 'element-1', name: 'Element 1' },
  { id: 'element-2', name: 'Element 2' },
  { id: 'element-3', name: 'Element 3' },
  { id: 'element-4', name: 'Element 4' } // Orphan element
];

// Import after env is loaded
async function runTest() {
  const { buildGraphData } = await import('../src/lib/graph/index.js');
  
  console.log('🧪 Testing Parent-Child Relationships with Mock Data\n');
  
  // Build graph
  const graphData = buildGraphData(
    {
      characters: [],
      elements: mockElements as any,
      puzzles: mockPuzzles as any,
      timeline: []
    },
    {
      viewType: 'puzzle-focus',
      includeOrphans: false
    }
  );
  
  console.log(`📊 Graph built: ${graphData.nodes.length} nodes, ${graphData.edges.length} edges\n`);
  
  // Check parent-child relationships
  const nodesWithParents = graphData.nodes.filter(n => (n as any).parentId);
  console.log(`✅ ${nodesWithParents.length} nodes have parent IDs`);
  
  // Check ordering
  const nodeIndexMap = new Map(graphData.nodes.map((n, i) => [n.id, i]));
  let orderingErrors = 0;
  
  for (const node of graphData.nodes) {
    const parentId = (node as any).parentId;
    if (parentId) {
      const parentIndex = nodeIndexMap.get(parentId);
      const childIndex = nodeIndexMap.get(node.id);
      
      if (parentIndex === undefined) {
        console.error(`❌ Node ${node.id} references missing parent ${parentId}`);
        orderingErrors++;
      } else if (parentIndex !== undefined && childIndex !== undefined && parentIndex >= childIndex) {
        console.error(`❌ Parent ${parentId} (index ${parentIndex}) comes after child ${node.id} (index ${childIndex})`);
        orderingErrors++;
      }
    }
  }
  
  if (orderingErrors === 0) {
    console.log('✅ All parent nodes appear before their children');
  } else {
    console.log(`❌ Found ${orderingErrors} ordering violations`);
  }
  
  // List final node structure
  console.log('\n📋 Final Node Structure:');
  graphData.nodes.forEach((node, index) => {
    const parentId = (node as any).parentId;
    const indent = parentId ? '  └─ ' : '';
    console.log(`${index}: ${indent}${node.id} (${node.data.metadata.entityType})${parentId ? ` [parent: ${parentId}]` : ''}`);
  });
  
  return orderingErrors === 0;
}

runTest().then(success => {
  if (success) {
    console.log('\n🎉 Test passed! Parent-child relationships are working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Test failed. Please review the errors above.');
    process.exit(1);
  }
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});