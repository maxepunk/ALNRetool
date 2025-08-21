#!/usr/bin/env tsx

/**
 * Test that the backend now accepts limit=500 after validation fix
 */

async function testHighLimit() {
  const API_URL = 'http://localhost:3001/api/notion';
  
  console.log('🧪 Testing backend with limit=500...\n');

  const endpoints = [
    { name: 'Puzzles', url: `${API_URL}/puzzles?limit=500` },
    { name: 'Characters', url: `${API_URL}/characters?limit=500` },
    { name: 'Elements', url: `${API_URL}/elements?limit=500` },
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint.name}...`);
    
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'Origin': 'http://localhost:5173',
          'Referer': 'http://localhost:5173/',
        },
      });

      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ Success! Returned ${data.data?.length || 0} items`);
        console.log(`  Has more: ${data.hasMore || false}`);
      } else {
        const error = await response.text();
        console.log(`  ❌ Error: ${error}`);
      }
    } catch (error) {
      console.error(`  ❌ Request failed:`, error);
    }
    
    console.log();
  }

  // Also test the synthesized endpoint
  console.log('Testing Synthesized endpoint...');
  try {
    const response = await fetch(`${API_URL}/synthesized`, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Referer': 'http://localhost:5173/',
      },
    });

    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Success!`);
      console.log(`  Puzzles: ${data.puzzles?.length || 0}`);
      console.log(`  Characters: ${data.characters?.length || 0}`);
      console.log(`  Elements: ${data.elements?.length || 0}`);
      console.log(`  Timeline: ${data.timeline?.length || 0}`);
    }
  } catch (error) {
    console.error(`  ❌ Request failed:`, error);
  }

  console.log('\n✅ Test complete!');
}

// Run test
testHighLimit().catch(console.error);