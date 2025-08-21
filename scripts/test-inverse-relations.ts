/**
 * Test script for inverse relation handling
 * Tests that updating Element's inverse relation fields correctly updates Puzzles
 */

import dotenv from 'dotenv';
dotenv.config();

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api';
const API_KEY = process.env.NOTION_API_KEY;

if (!API_KEY) {
  console.error('❌ NOTION_API_KEY not found in environment');
  process.exit(1);
}

// Test element and puzzle IDs (real IDs from the database)
const TEST_ELEMENT_ID = '2052f33d-583f-8177-9ef1-cf83eb762f15'; // Sofia's Memory
const TEST_PUZZLE_ID = '2302f33d-583f-8028-8630-d80d347400f2'; // Test puzzle

// Headers to bypass auth in development
const DEV_HEADERS = {
  'Origin': 'http://localhost:5173',
  'Referer': 'http://localhost:5173/'
};

async function fetchElement(id: string) {
  const response = await fetch(`${API_BASE_URL}/notion/elements/${id}`, {
    headers: { ...DEV_HEADERS }
  });
  return response.json();
}

async function fetchPuzzle(id: string) {
  const response = await fetch(`${API_BASE_URL}/notion/puzzles/${id}`, {
    headers: { ...DEV_HEADERS }
  });
  return response.json();
}

async function updateElement(id: string, updates: any) {
  const response = await fetch(`${API_BASE_URL}/notion/elements/${id}`, {
    method: 'PUT',
    headers: {
      ...DEV_HEADERS,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Update failed: ${response.status} - ${error}`);
  }
  
  return response.json();
}

async function testInverseRelations() {
  console.log('🧪 Testing Inverse Relation Handling\n');
  console.log('=====================================\n');
  
  try {
    // Step 1: Fetch current state
    console.log('📖 Step 1: Fetching current state...');
    const element = await fetchElement(TEST_ELEMENT_ID);
    const puzzle = await fetchPuzzle(TEST_PUZZLE_ID);
    
    console.log(`Element "${element.name}":`);
    console.log(`  - Required for puzzles: ${element.requiredForPuzzleIds?.length || 0} puzzles`);
    console.log(`  - Rewarded by puzzles: ${element.rewardedByPuzzleIds?.length || 0} puzzles`);
    
    console.log(`\nPuzzle "${puzzle.name}":`);
    console.log(`  - Puzzle elements: ${puzzle.puzzleElementIds?.length || 0} elements`);
    console.log(`  - Rewards: ${puzzle.rewardIds?.length || 0} elements`);
    
    // Step 2: Test adding element to puzzle's required elements
    console.log('\n✏️ Step 2: Testing inverse relation update...');
    console.log(`Adding element to puzzle "${puzzle.name}" via inverse relation...`);
    
    const currentRequired = element.requiredForPuzzleIds || [];
    const newRequired = currentRequired.includes(TEST_PUZZLE_ID) 
      ? currentRequired.filter((id: string) => id !== TEST_PUZZLE_ID)
      : [...currentRequired, TEST_PUZZLE_ID];
    
    const updateResult = await updateElement(TEST_ELEMENT_ID, {
      requiredForPuzzleIds: newRequired
    });
    
    // Check for partial success
    if (updateResult.errors) {
      console.log('⚠️ Partial update completed:');
      console.log('  Errors:', updateResult.errors);
      console.log('  Puzzles updated:', updateResult.puzzlesUpdated);
    } else {
      console.log('✅ Update successful!');
    }
    
    // Step 3: Verify the change
    console.log('\n🔍 Step 3: Verifying changes...');
    const updatedPuzzle = await fetchPuzzle(TEST_PUZZLE_ID);
    
    const elementInPuzzle = updatedPuzzle.puzzleElementIds?.includes(TEST_ELEMENT_ID);
    
    if (newRequired.includes(TEST_PUZZLE_ID)) {
      if (elementInPuzzle) {
        console.log('✅ Success! Element is now in puzzle\'s required elements');
      } else {
        console.log('❌ Failed! Element was not added to puzzle\'s required elements');
      }
    } else {
      if (!elementInPuzzle) {
        console.log('✅ Success! Element was removed from puzzle\'s required elements');
      } else {
        console.log('❌ Failed! Element was not removed from puzzle\'s required elements');
      }
    }
    
    console.log('\n📊 Final State:');
    console.log(`Element "${updateResult.element?.name || element.name}":`);
    console.log(`  - Required for: ${updateResult.element?.requiredForPuzzleIds || newRequired}`);
    console.log(`Puzzle "${updatedPuzzle.name}":`);
    console.log(`  - Puzzle elements: ${updatedPuzzle.puzzleElementIds}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testInverseRelations()
  .then(() => {
    console.log('\n✨ Test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });