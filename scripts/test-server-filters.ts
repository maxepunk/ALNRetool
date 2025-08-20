#!/usr/bin/env tsx

/**
 * Test script to verify server-side filtering functionality
 * Tests query parameter parsing and Notion API filtering
 */

const API_BASE = 'http://localhost:3001/api/notion';

async function testEndpoint(endpoint: string, params: Record<string, string>, description: string) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;
  
  console.log(`\nTesting: ${description}`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Referer': 'http://localhost:5173/',
        'Origin': 'http://localhost:5173'
      }
    });
    if (!response.ok) {
      console.log(`✗ Failed with status: ${response.status}`);
      const error = await response.text();
      console.log(`Error: ${error}`);
      return;
    }
    
    const data = await response.json();
    console.log(`✓ Success - Returned ${data.data?.length || 0} items`);
    
    // Show first item if available
    if (data.data?.length > 0) {
      const first = data.data[0];
      console.log(`  First item: ${first.name || first.title || 'Unknown'}`);
    }
  } catch (error) {
    console.log(`✗ Error: ${error}`);
  }
}

async function runTests() {
  console.log('Testing Server-Side Filtering');
  console.log('=============================');
  
  // Test puzzle filters
  await testEndpoint('/puzzles', {}, 'All puzzles (no filter)');
  await testEndpoint('/puzzles', { acts: 'Act 1' }, 'Puzzles in Act 1');
  await testEndpoint('/puzzles', { acts: 'Act 1,Act 2' }, 'Puzzles in Act 1 or Act 2');
  await testEndpoint('/puzzles', { lastEdited: 'week' }, 'Puzzles edited in last week');
  await testEndpoint('/puzzles', { acts: 'Act 1', lastEdited: 'month' }, 'Combined: Act 1 + last month');
  
  // Test character filters
  await testEndpoint('/characters', {}, 'All characters (no filter)');
  await testEndpoint('/characters', { tiers: 'Core' }, 'Core tier characters');
  await testEndpoint('/characters', { tiers: 'Core,Secondary' }, 'Core or Secondary characters');
  await testEndpoint('/characters', { type: 'players' }, 'Player characters only');
  await testEndpoint('/characters', { type: 'npcs' }, 'NPC characters only');
  await testEndpoint('/characters', { lastEdited: 'today' }, 'Characters edited today');
  await testEndpoint('/characters', { type: 'players', tiers: 'Core' }, 'Combined: Players + Core tier');
  
  // Test element filters
  await testEndpoint('/elements', {}, 'All elements (no filter)');
  await testEndpoint('/elements', { status: 'complete' }, 'Complete elements');
  await testEndpoint('/elements', { status: 'draft,review' }, 'Draft or Review elements');
  await testEndpoint('/elements', { lastEdited: '30d' }, 'Elements edited in last 30 days');
  
  // Test pagination with filters
  await testEndpoint('/puzzles', { acts: 'Act 1', limit: '5' }, 'Paginated: Act 1 puzzles (limit 5)');
  
  console.log('\n=== Server filter tests complete ===');
}

// Run tests
runTests().catch(console.error);