#!/usr/bin/env tsx
/**
 * Test script for NodeConnectionsView functionality
 * Tests that the view can render connections for all node types
 */

import 'dotenv/config';

const BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface TestResult {
  nodeType: string;
  success: boolean;
  nodeCount?: number;
  error?: string;
}

async function testNodeType(nodeType: string, sampleNodeId: string): Promise<TestResult> {
  try {
    // Fetch all entities of this type
    const response = await fetch(`${BASE_URL}/api/notion/${nodeType}s?limit=100`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${nodeType}s: ${response.status}`);
    }
    
    const data = await response.json();
    const entities = data.data || [];
    
    if (entities.length === 0) {
      return {
        nodeType,
        success: false,
        error: `No ${nodeType}s found in database`
      };
    }
    
    // Use provided sample or first entity
    const testEntity = sampleNodeId 
      ? entities.find((e: any) => e.id === sampleNodeId) || entities[0]
      : entities[0];
    
    console.log(`✓ Testing ${nodeType}: ${testEntity.name || testEntity.description || testEntity.id}`);
    console.log(`  - Total ${nodeType}s available: ${entities.length}`);
    console.log(`  - Sample ID: ${testEntity.id}`);
    
    return {
      nodeType,
      success: true,
      nodeCount: entities.length
    };
  } catch (error) {
    return {
      nodeType,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function main() {
  console.log('🧪 Testing NodeConnectionsView with all node types\n');
  console.log('=' .repeat(50));
  
  // Test each node type
  const testCases = [
    { type: 'character', sampleId: '1902f33d-583f-8012-84d2-fe59bb826bb8' }, // Ashe Motoko
    { type: 'puzzle', sampleId: '18c2f33d-583f-807f-b4ef-c16c90a23b1c' }, // Sample puzzle
    { type: 'element', sampleId: '18c2f33d-583f-80fa-9b62-d956d039e42e' }, // Sample element
    { type: 'timeline', sampleId: null } // Will use first available
  ];
  
  const results: TestResult[] = [];
  
  for (const testCase of testCases) {
    const result = await testNodeType(testCase.type, testCase.sampleId || '');
    results.push(result);
    console.log();
  }
  
  // Summary
  console.log('=' .repeat(50));
  console.log('\n📊 Test Summary:\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log('✅ Successful node types:');
    successful.forEach(r => {
      console.log(`   - ${r.nodeType}: ${r.nodeCount} entities available`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed node types:');
    failed.forEach(r => {
      console.log(`   - ${r.nodeType}: ${r.error}`);
    });
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Navigate to http://localhost:5173/node-connections');
  console.log('2. Select each node type from the dropdown');
  console.log('3. Select an entity and verify the graph renders');
  console.log('4. Test different depth levels (1-5 hops)');
  console.log('5. Click on nodes to open the detail panel');
  
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(console.error);
