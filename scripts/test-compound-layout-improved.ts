#!/usr/bin/env tsx
/**
 * Test compound layout with parent-child relationships
 */

import { applyCompoundLayout } from '../src/lib/graph/compoundLayout';
import { resolveParentChildRelationships } from '../src/lib/graph/parentChild';
import type { GraphNode, GraphEdge } from '../src/lib/graph/types';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Create sample data with parent-child potential
const sampleNodes: GraphNode[] = [
  // Parent puzzle node
  {
    id: 'puzzle-1',
    type: 'puzzleNode',
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
        nodeType: 'puzzleNode',
      },
    },
  },
  // Element nodes that belong to puzzle-1
  {
    id: 'element-1',
    type: 'elementNode',
    position: { x: 0, y: 0 },
    data: {
      entity: {
        id: 'element-1',
        name: 'Element 1',
        puzzleId: 'puzzle-1', // This element belongs to puzzle-1
      } as any,
      label: 'Element 1',
      metadata: {
        entityType: 'element',
        nodeType: 'elementNode',
      },
    },
  },
  {
    id: 'element-2',
    type: 'elementNode',
    position: { x: 0, y: 0 },
    data: {
      entity: {
        id: 'element-2',
        name: 'Element 2',
        puzzleId: 'puzzle-1', // This element belongs to puzzle-1
      } as any,
      label: 'Element 2',
      metadata: {
        entityType: 'element',
        nodeType: 'elementNode',
      },
    },
  },
  // Another puzzle with more elements
  {
    id: 'puzzle-2',
    type: 'puzzleNode',
    position: { x: 0, y: 0 },
    data: {
      entity: {
        id: 'puzzle-2',
        name: 'Secondary Puzzle',
        puzzleElementIds: ['element-3', 'element-4', 'element-5'],
        subPuzzleIds: [],
        parentItemId: null,
      } as any,
      label: 'Secondary Puzzle',
      metadata: {
        entityType: 'puzzle',
        nodeType: 'puzzleNode',
      },
    },
  },
  {
    id: 'element-3',
    type: 'elementNode',
    position: { x: 0, y: 0 },
    data: {
      entity: {
        id: 'element-3',
        name: 'Element 3',
        puzzleId: 'puzzle-2',
      } as any,
      label: 'Element 3',
      metadata: {
        entityType: 'element',
        nodeType: 'elementNode',
      },
    },
  },
  {
    id: 'element-4',
    type: 'elementNode',
    position: { x: 0, y: 0 },
    data: {
      entity: {
        id: 'element-4',
        name: 'Element 4',
        puzzleId: 'puzzle-2',
      } as any,
      label: 'Element 4',
      metadata: {
        entityType: 'element',
        nodeType: 'elementNode',
      },
    },
  },
  {
    id: 'element-5',
    type: 'elementNode',
    position: { x: 0, y: 0 },
    data: {
      entity: {
        id: 'element-5',
        name: 'Element 5',
        puzzleId: 'puzzle-2',
      } as any,
      label: 'Element 5',
      metadata: {
        entityType: 'element',
        nodeType: 'elementNode',
      },
    },
  },
];

const sampleEdges: GraphEdge[] = [
  {
    id: 'edge-1',
    source: 'puzzle-1',
    target: 'puzzle-2',
    type: 'dependency',
    animated: false,
  },
];

console.log('Testing improved compound layout with parent-child relationships...');
console.log('Initial nodes:', sampleNodes.length);
console.log('Initial edges:', sampleEdges.length);

// Step 1: Resolve parent-child relationships
const nodesWithParents = resolveParentChildRelationships(sampleNodes, {
  viewType: 'puzzle-focus',
  preserveSharedElements: false,
});

console.log('\nAfter parent-child resolution:');
const parentNodes = nodesWithParents.filter(n => !(n as any).parentId);
const childNodes = nodesWithParents.filter(n => (n as any).parentId);
console.log('Parent nodes:', parentNodes.length);
console.log('Child nodes:', childNodes.length);

childNodes.forEach(child => {
  console.log(`  - ${child.id} -> parent: ${(child as any).parentId}`);
});

// Step 2: Apply compound layout
const layoutedNodes = applyCompoundLayout(nodesWithParents, sampleEdges);

console.log('\n✅ Layout successful!');
console.log('Layouted nodes:', layoutedNodes.length);

// Log positions and sizes
console.log('\nParent nodes with sizes:');
parentNodes.forEach(node => {
  const layoutedNode = layoutedNodes.find(n => n.id === node.id);
  if (layoutedNode) {
    console.log(`- ${layoutedNode.id}: pos(${layoutedNode.position.x}, ${layoutedNode.position.y}) size(${layoutedNode.width}x${layoutedNode.height})`);
  }
});

console.log('\nChild nodes with relative positions:');
childNodes.forEach(node => {
  const layoutedNode = layoutedNodes.find(n => n.id === node.id);
  if (layoutedNode) {
    console.log(`- ${layoutedNode.id}: pos(${layoutedNode.position.x}, ${layoutedNode.position.y}) parent: ${(layoutedNode as any).parentId}`);
  }
});

// Create visualization data for debugging
const visualizationData = {
  nodes: layoutedNodes.map(n => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
    width: n.width || 160,
    height: n.height || 60,
    parentId: (n as any).parentId,
    type: n.data.metadata.entityType,
  })),
  edges: sampleEdges,
};

// Generate SVG visualization
const svgWidth = 1200;
const svgHeight = 800;
let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
svg += '<rect width="100%" height="100%" fill="#f8f8f8"/>';

// Draw parent nodes first
visualizationData.nodes
  .filter(n => !n.parentId)
  .forEach(node => {
    const color = node.type === 'puzzle' ? '#e3f2fd' : '#f3e5f5';
    svg += `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="${color}" stroke="#999" stroke-width="2" rx="5"/>`;
    svg += `<text x="${node.x + node.width/2}" y="${node.y + 30}" text-anchor="middle" font-family="Arial" font-size="14">${node.id}</text>`;
  });

// Draw child nodes
visualizationData.nodes
  .filter(n => n.parentId)
  .forEach(node => {
    // Find parent to calculate absolute position
    const parent = visualizationData.nodes.find(p => p.id === node.parentId);
    if (parent) {
      const absX = parent.x + node.x;
      const absY = parent.y + node.y;
      const color = '#fff3e0';
      svg += `<rect x="${absX}" y="${absY}" width="${node.width}" height="${node.height}" fill="${color}" stroke="#666" stroke-width="1" rx="3"/>`;
      svg += `<text x="${absX + node.width/2}" y="${absY + 30}" text-anchor="middle" font-family="Arial" font-size="12">${node.id}</text>`;
    }
  });

svg += '</svg>';

// Save visualization
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `compound-layout-improved-${timestamp}.svg`;
writeFileSync(filename, svg);
console.log(`\n📊 Visualization saved to: ${filename}`);

// Also save as JSON for further analysis
const jsonFilename = `compound-layout-improved-${timestamp}.json`;
writeFileSync(jsonFilename, JSON.stringify(visualizationData, null, 2));
console.log(`📄 Data saved to: ${jsonFilename}`);