#!/usr/bin/env tsx
/**
 * Test compound layout with sample data
 */

import { applyCompoundLayout } from '../src/lib/graph/compoundLayout';
import type { GraphNode, GraphEdge } from '../src/lib/graph/types';

// Create sample data that mimics the real structure
const sampleNodes: GraphNode[] = [
  // Parent puzzle node
  {
    id: 'puzzle-1',
    type: 'puzzle',
    position: { x: 0, y: 0 },
    data: {
      entity: {
        id: 'puzzle-1',
        name: 'Main Puzzle',
        puzzleElementIds: ['element-1', 'element-2'],
        subPuzzleIds: [],
        parentItemId: null,
      } as any,
      label: 'Main Puzzle',
      metadata: {
        entityType: 'puzzle',
      },
    },
  },
  // Element nodes
  {
    id: 'element-1',
    type: 'element',
    position: { x: 0, y: 0 },
    data: {
      entity: {
        id: 'element-1',
        name: 'Element 1',
      } as any,
      label: 'Element 1',
      metadata: {
        entityType: 'element',
      },
    },
  },
  {
    id: 'element-2',
    type: 'element',
    position: { x: 0, y: 0 },
    data: {
      entity: {
        id: 'element-2',
        name: 'Element 2',
      } as any,
      label: 'Element 2',
      metadata: {
        entityType: 'element',
      },
    },
  },
  // Another puzzle that shares an element
  {
    id: 'puzzle-2',
    type: 'puzzle',
    position: { x: 0, y: 0 },
    data: {
      entity: {
        id: 'puzzle-2',
        name: 'Secondary Puzzle',
        puzzleElementIds: ['element-2', 'element-3'],
        subPuzzleIds: [],
        parentItemId: null,
      } as any,
      label: 'Secondary Puzzle',
      metadata: {
        entityType: 'puzzle',
      },
    },
  },
  {
    id: 'element-3',
    type: 'element',
    position: { x: 0, y: 0 },
    data: {
      entity: {
        id: 'element-3',
        name: 'Element 3',
      } as any,
      label: 'Element 3',
      metadata: {
        entityType: 'element',
      },
    },
  },
];

const sampleEdges: GraphEdge[] = [
  {
    id: 'edge-1',
    source: 'element-1',
    target: 'puzzle-1',
    type: 'requirement',
    data: {
      relationshipType: 'requirement',
    },
  },
  {
    id: 'edge-2',
    source: 'element-2',
    target: 'puzzle-1',
    type: 'requirement',
    data: {
      relationshipType: 'requirement',
    },
  },
  {
    id: 'edge-3',
    source: 'element-2',
    target: 'puzzle-2',
    type: 'requirement',
    data: {
      relationshipType: 'requirement',
    },
  },
  {
    id: 'edge-4',
    source: 'element-3',
    target: 'puzzle-2',
    type: 'requirement',
    data: {
      relationshipType: 'requirement',
    },
  },
];

console.log('Testing compound layout with sample data...');
console.log('Initial nodes:', sampleNodes.length);
console.log('Initial edges:', sampleEdges.length);

try {
  const layoutedNodes = applyCompoundLayout(sampleNodes, sampleEdges);
  
  console.log('\n✅ Layout successful!');
  console.log('Layouted nodes:', layoutedNodes.length);
  
  // Check parent-child relationships
  const nodesWithParents = layoutedNodes.filter(n => (n as any).parentId);
  console.log('Nodes with parents:', nodesWithParents.length);
  
  // Log the final structure
  layoutedNodes.forEach(node => {
    const parentId = (node as any).parentId;
    console.log(`- ${node.id}: pos(${Math.round(node.position.x)}, ${Math.round(node.position.y)})${parentId ? ` parent=${parentId}` : ''}`);
  });
  
} catch (error) {
  console.error('\n❌ Layout failed:', error);
  if (error instanceof Error) {
    console.error('Stack:', error.stack);
  }
  process.exit(1);
}