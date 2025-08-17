#!/usr/bin/env tsx
/**
 * Test script to verify parent-child relationship fix
 * Tests that parent nodes are properly established and ordered
 */

import { config } from 'dotenv';
import { buildGraphData } from '../src/lib/graph/index.js';
import { NotionService } from '../server/services/notion.js';
import { transformCharacter, transformElement, transformPuzzle, transformTimelineEvent } from '../src/types/notion/transforms.js';

// Load environment variables
config();

interface TestResult {
  passed: boolean;
  message: string;
  details?: any;
}

async function testParentChildRelationships(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  try {
    console.log('🔍 Testing Parent-Child Relationship Fix...\n');
    
    // Initialize Notion service
    const notionService = new NotionService();
    
    // Fetch real data from Notion
    console.log('📥 Fetching data from Notion...');
    const [charactersData, elementsData, puzzlesData, timelineData] = await Promise.all([
      notionService.queryDatabase('characters', { limit: 100 }),
      notionService.queryDatabase('elements', { limit: 100 }),
      notionService.queryDatabase('puzzles', { limit: 100 }),
      notionService.queryDatabase('timeline', { limit: 100 }),
    ]);
    
    // Transform the data
    const characters = charactersData.data.map(transformCharacter);
    const elements = elementsData.data.map(transformElement);
    const puzzles = puzzlesData.data.map(transformPuzzle);
    const timeline = timelineData.data.map(transformTimelineEvent);
    
    console.log(`📊 Data loaded: ${characters.length} characters, ${elements.length} elements, ${puzzles.length} puzzles, ${timeline.length} timeline events\n`);
    
    // Build graph with puzzle-focus view (uses compound layout)
    console.log('🔨 Building graph with puzzle-focus view...');
    const graphData = buildGraphData(
      { characters, elements, puzzles, timeline },
      { viewType: 'puzzle-focus', includeOrphans: false }
    );
    
    console.log(`📈 Graph built: ${graphData.nodes.length} nodes, ${graphData.edges.length} edges\n`);
    
    // Test 1: Check if any nodes have parentId set
    const nodesWithParents = graphData.nodes.filter(node => (node as any).parentId);
    results.push({
      passed: nodesWithParents.length > 0,
      message: `Parent-child relationships established`,
      details: `${nodesWithParents.length} nodes have parent IDs`,
    });
    
    // Test 2: Verify parent nodes come before children in array
    let parentBeforeChildTest = true;
    const nodeIndexById = new Map(graphData.nodes.map((node, index) => [node.id, index]));
    
    for (const node of graphData.nodes) {
      const parentId = (node as any).parentId;
      if (parentId) {
        const parentIndex = nodeIndexById.get(parentId);
        const childIndex = nodeIndexById.get(node.id);
        
        if (parentIndex === undefined) {
          parentBeforeChildTest = false;
          results.push({
            passed: false,
            message: `Missing parent node`,
            details: `Node ${node.id} references parent ${parentId} which doesn't exist`,
          });
        } else if (parentIndex !== undefined && childIndex !== undefined && parentIndex >= childIndex) {
          parentBeforeChildTest = false;
          results.push({
            passed: false,
            message: `Parent-child ordering violation`,
            details: `Parent ${parentId} (index ${parentIndex}) comes after child ${node.id} (index ${childIndex})`,
          });
        }
      }
    }
    
    if (parentBeforeChildTest) {
      results.push({
        passed: true,
        message: `Parent-child ordering is correct`,
        details: `All parent nodes appear before their children`,
      });
    }
    
    // Test 3: Check if puzzles with puzzleElementIds have become containers
    const containerPuzzles = puzzles.filter(p => p.puzzleElementIds && p.puzzleElementIds.length > 0);
    const containerNodes = graphData.nodes.filter(node => {
      if (node.data.metadata.entityType !== 'puzzle') return false;
      const hasChildren = graphData.nodes.some(n => (n as any).parentId === node.id);
      return hasChildren;
    });
    
    results.push({
      passed: containerNodes.length > 0,
      message: `Puzzle containers created`,
      details: `${containerNodes.length} puzzles are containers (out of ${containerPuzzles.length} with elements)`,
    });
    
    // Test 4: Check for orphaned parent references
    const allNodeIds = new Set(graphData.nodes.map(n => n.id));
    const orphanedReferences = nodesWithParents.filter(node => {
      const parentId = (node as any).parentId;
      return !allNodeIds.has(parentId);
    });
    
    results.push({
      passed: orphanedReferences.length === 0,
      message: `No orphaned parent references`,
      details: orphanedReferences.length > 0 
        ? `${orphanedReferences.length} nodes reference non-existent parents`
        : `All parent references are valid`,
    });
    
    // Test 5: Check that element nodes are properly nested
    const nestedElements = elements.filter(element => {
      const node = graphData.nodes.find(n => n.id === element.id);
      return node && (node as any).parentId;
    });
    
    results.push({
      passed: nestedElements.length > 0,
      message: `Elements nested in puzzles`,
      details: `${nestedElements.length} elements are nested (out of ${elements.length} total)`,
    });
    
  } catch (error) {
    results.push({
      passed: false,
      message: 'Test execution failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
  
  return results;
}

// Run tests
async function main() {
  console.log('========================================');
  console.log('Parent-Child Relationship Fix Test Suite');
  console.log('========================================\n');
  
  const results = await testParentChildRelationships();
  
  console.log('\n========================================');
  console.log('Test Results:');
  console.log('========================================\n');
  
  let passedCount = 0;
  let failedCount = 0;
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
    
    if (result.passed) {
      passedCount++;
    } else {
      failedCount++;
    }
  });
  
  console.log('\n========================================');
  console.log(`Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log('========================================\n');
  
  if (failedCount === 0) {
    console.log('🎉 All tests passed! Parent-child relationships are working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please review the details above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});