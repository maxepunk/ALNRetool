/**
 * Test if timeline filtering fix is working
 */

async function testTimelineFix() {
  console.log('Testing Timeline Filtering Fix...\n');
  
  try {
    // Test the character journey data endpoint
    const response = await fetch('http://localhost:3001/api/notion/timeline?limit=100', {
      headers: { 'Origin': 'http://localhost:5173' }
    });
    
    if (response.ok) {
      const data = await response.json() as any;
      const totalEvents = data.data?.length || 0;
      
      console.log(`✓ Timeline API returns ${totalEvents} events`);
      
      // Check if events have proper names
      let namedEvents = 0;
      let untitledEvents = 0;
      
      for (const event of data.data || []) {
        if (event.name && event.name !== 'Untitled Event') {
          namedEvents++;
        } else {
          untitledEvents++;
        }
      }
      
      console.log(`  - Named events: ${namedEvents}`);
      console.log(`  - Untitled events: ${untitledEvents}`);
      
      // Check if charactersInvolvedIds field exists and is populated
      let eventsWithCharacters = 0;
      for (const event of data.data || []) {
        if (event.charactersInvolvedIds && event.charactersInvolvedIds.length > 0) {
          eventsWithCharacters++;
        }
      }
      
      console.log(`  - Events with charactersInvolvedIds: ${eventsWithCharacters}`);
      
      if (totalEvents > 0 && namedEvents > 0) {
        console.log('\n✅ Timeline data looks good! The fix should work.');
      } else {
        console.log('\n⚠️ Timeline data might still have issues.');
      }
      
    } else {
      console.error(`✗ Server returned ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('✗ Request failed:', (error as Error).message);
  }
  
  console.log('\nTo fully test the fix:');
  console.log('1. Open http://localhost:5173 in your browser');
  console.log('2. Navigate to Character Journey view');
  console.log('3. Select a character');
  console.log('4. Check browser console for timeline-related messages');
  console.log('5. Look for timeline events in the graph (they should appear now)');
}

testTimelineFix().catch(console.error);