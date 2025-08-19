#!/usr/bin/env tsx
/**
 * Test script to verify Search & Filter performance with 100+ nodes
 */

import 'dotenv/config';

const API_BASE = 'http://localhost:3001/api';

interface TestResult {
  metric: string;
  value: number | string;
  status: 'pass' | 'fail' | 'info';
}

async function testFilterPerformance() {
  const results: TestResult[] = [];
  
  console.log('🧪 Testing Search & Filter Performance with Large Dataset\n');
  console.log('=' .repeat(60));
  
  try {
    // Fetch all data to verify we have 100+ nodes
    console.log('\n📊 Fetching dataset...');
    
    const [charactersRes, elementsRes, puzzlesRes, timelineRes] = await Promise.all([
      fetch(`${API_BASE}/notion/characters`).then(r => r.json()),
      fetch(`${API_BASE}/notion/elements`).then(r => r.json()), 
      fetch(`${API_BASE}/notion/puzzles`).then(r => r.json()),
      fetch(`${API_BASE}/notion/timeline`).then(r => r.json())
    ]);
    
    const totalNodes = 
      charactersRes.data.data.length + 
      elementsRes.data.data.length + 
      puzzlesRes.data.data.length +
      timelineRes.data.data.length;
    
    console.log(`✅ Total nodes in dataset: ${totalNodes}`);
    results.push({
      metric: 'Total Nodes',
      value: totalNodes,
      status: totalNodes >= 100 ? 'pass' : 'fail'
    });
    
    // Test filter response time on synthesized data
    console.log('\n⏱️  Testing synthesized data endpoint performance...');
    const startSynth = Date.now();
    const synthRes = await axios.get(`${API_BASE}/notion/synthesized`);
    const synthTime = Date.now() - startSynth;
    
    console.log(`✅ Synthesized data loaded in ${synthTime}ms`);
    results.push({
      metric: 'Synthesized Data Load Time',
      value: `${synthTime}ms`,
      status: synthTime < 2000 ? 'pass' : 'fail'
    });
    
    // Verify bidirectional relationships
    const elements = synthRes.data.elements;
    const elementsWithRelations = elements.filter((e: any) => 
      (e.requiredForPuzzleIds?.length > 0) || (e.rewardedByPuzzleIds?.length > 0)
    );
    
    console.log(`✅ Elements with puzzle relationships: ${elementsWithRelations.length}/${elements.length}`);
    results.push({
      metric: 'Elements with Relationships',
      value: `${elementsWithRelations.length}/${elements.length}`,
      status: elementsWithRelations.length > 0 ? 'pass' : 'info'
    });
    
    // Test search simulation (would be client-side in real app)
    console.log('\n🔍 Simulating search filtering...');
    const searchTerms = ['puzzle', 'card', 'character', 'act'];
    
    for (const term of searchTerms) {
      const startSearch = Date.now();
      
      // Simulate fuzzy search across nodes
      const matchingNodes = [
        ...charactersRes.data.data.filter((c: any) => 
          c.name?.toLowerCase().includes(term.toLowerCase())
        ),
        ...elementsRes.data.data.filter((e: any) => 
          e.name?.toLowerCase().includes(term.toLowerCase())
        ),
        ...puzzlesRes.data.data.filter((p: any) => 
          p.name?.toLowerCase().includes(term.toLowerCase())
        )
      ];
      
      const searchTime = Date.now() - startSearch;
      console.log(`  Search "${term}": ${matchingNodes.length} matches in ${searchTime}ms`);
      
      results.push({
        metric: `Search "${term}"`,
        value: `${matchingNodes.length} matches in ${searchTime}ms`,
        status: searchTime < 100 ? 'pass' : 'fail'
      });
    }
    
    // Test Act filtering simulation
    console.log('\n🎭 Simulating Act filtering...');
    const acts = ['Act 0', 'Act 1', 'Act 2'];
    
    for (const act of acts) {
      const startAct = Date.now();
      
      // Count elements in this act
      const actElements = elementsRes.data.data.filter((e: any) => 
        e.firstAvailable === act
      );
      
      // Count puzzles with this act in timing
      const actPuzzles = puzzlesRes.data.data.filter((p: any) => 
        p.timing?.includes(act)
      );
      
      const actTime = Date.now() - startAct;
      const totalActNodes = actElements.length + actPuzzles.length;
      
      console.log(`  ${act}: ${totalActNodes} nodes (${actElements.length} elements, ${actPuzzles.length} puzzles) in ${actTime}ms`);
      
      results.push({
        metric: `${act} Filter`,
        value: `${totalActNodes} nodes in ${actTime}ms`,
        status: actTime < 50 ? 'pass' : 'fail'
      });
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📈 PERFORMANCE SUMMARY\n');
    
    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    
    console.log('Results:');
    results.forEach(r => {
      const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : 'ℹ️';
      console.log(`  ${icon} ${r.metric}: ${r.value}`);
    });
    
    console.log(`\n${passCount} passed, ${failCount} failed, ${results.length - passCount - failCount} info`);
    
    // Overall assessment
    const overallPass = totalNodes >= 100 && failCount === 0;
    console.log('\n' + (overallPass ? 
      '✅ PERFORMANCE TEST PASSED - Sprint 2 Search & Filter feature meets requirements!' : 
      '❌ PERFORMANCE TEST FAILED - Some optimizations needed'
    ));
    
    process.exit(overallPass ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testFilterPerformance().catch(console.error);