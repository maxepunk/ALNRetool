#!/usr/bin/env tsx

/**
 * Test the fix for Element updates returning proper JSON
 * Tests both direct updates and inverse relation updates
 */

async function testElementUpdate() {
  const API_URL = 'http://localhost:3001/api/notion/elements';
  const TEST_ELEMENT_ID = '2042f33d-583f-813d-8b79-ef6594c0166c'; // Replace with valid ID

  console.log('🧪 Testing Element update endpoint...\n');

  // Test 1: Direct field update (should work normally)
  console.log('Test 1: Direct field update');
  try {
    const response = await fetch(`${API_URL}/${TEST_ELEMENT_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173',
        'Referer': 'http://localhost:5173/',
      },
      body: JSON.stringify({
        name: 'Test Element Update ' + new Date().toISOString(),
      }),
    });

    console.log('  Status:', response.status, response.statusText);
    console.log('  Content-Type:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('  Response length:', text.length, 'bytes');
    
    if (text) {
      try {
        const data = JSON.parse(text);
        console.log('  ✅ Valid JSON response');
        console.log('  Element ID:', data.id);
        console.log('  Element Name:', data.name);
      } catch (err) {
        console.log('  ❌ Invalid JSON:', err.message);
        console.log('  Response:', text.substring(0, 200));
      }
    } else {
      console.log('  ❌ Empty response body');
    }
  } catch (error) {
    console.error('  ❌ Request failed:', error);
  }

  console.log('\n---\n');

  // Test 2: Inverse relation update (tests the new code path)
  console.log('Test 2: Inverse relation update');
  try {
    const response = await fetch(`${API_URL}/${TEST_ELEMENT_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173',
        'Referer': 'http://localhost:5173/',
      },
      body: JSON.stringify({
        requiredForPuzzleIds: [], // Inverse relation field
      }),
    });

    console.log('  Status:', response.status, response.statusText);
    console.log('  Content-Type:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('  Response length:', text.length, 'bytes');
    
    if (text) {
      try {
        const data = JSON.parse(text);
        console.log('  ✅ Valid JSON response');
        console.log('  Element ID:', data.id);
        console.log('  Element Name:', data.name);
        
        // Check if inverse relation handler was triggered
        if (data.puzzlesUpdated) {
          console.log('  Puzzles updated:', data.puzzlesUpdated);
        }
      } catch (err) {
        console.log('  ❌ Invalid JSON:', err.message);
        console.log('  Response:', text.substring(0, 200));
      }
    } else {
      console.log('  ❌ Empty response body');
    }
  } catch (error) {
    console.error('  ❌ Request failed:', error);
  }

  console.log('\n✅ Tests complete');
}

// Run tests
testElementUpdate().catch(console.error);