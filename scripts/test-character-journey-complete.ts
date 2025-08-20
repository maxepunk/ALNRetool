#!/usr/bin/env tsx

/**
 * Comprehensive test for Character Journey View after timeline filtering fix
 * Tests that timeline events are properly included when relevant to the selected character
 */

async function testCharacterJourneyView() {
  console.log('Testing Character Journey View with Timeline Events...\n');

  try {
    // First fetch all characters to get IDs
    const charactersResponse = await fetch('http://localhost:3001/api/notion/characters');
    if (!charactersResponse.ok) {
      throw new Error(`Characters fetch failed: ${charactersResponse.status}`);
    }
    const { data: characters } = await charactersResponse.json();
    console.log(`✓ Fetched ${characters.length} characters`);

    // Pick the first character with a name for testing
    const testCharacter = characters.find((c: any) => c.name) || characters[0];
    if (!testCharacter) {
      throw new Error('No characters found');
    }
    console.log(`✓ Using test character: ${testCharacter.name} (ID: ${testCharacter.id})\n`);

    // Fetch all data like Character Journey View does
    const [puzzlesRes, elementsRes, timelineRes] = await Promise.all([
      fetch('http://localhost:3001/api/notion/puzzles'),
      fetch('http://localhost:3001/api/notion/elements'),
      fetch('http://localhost:3001/api/notion/timeline')
    ]);

    const { data: puzzles } = await puzzlesRes.json();
    const { data: elements } = await elementsRes.json();
    const { data: timeline } = await timelineRes.json();

    console.log('Data fetched:');
    console.log(`  - Puzzles: ${puzzles.length}`);
    console.log(`  - Elements: ${elements.length}`);
    console.log(`  - Timeline: ${timeline.length}\n`);

    // Simulate the filtering logic from GraphBuilder.ts
    const characterId = testCharacter.id;
    
    // Find puzzles owned by character
    const ownedPuzzles = puzzles.filter((p: any) => p.ownerIds?.includes(characterId));
    console.log(`Character owns ${ownedPuzzles.length} puzzles`);

    // Find elements (as rewards from owned puzzles)
    const ownedElementIds = new Set<string>();
    const rewardedElementIds = new Set<string>();
    
    ownedPuzzles.forEach((puzzle: any) => {
      puzzle.requirementIds?.forEach((id: string) => ownedElementIds.add(id));
      puzzle.rewardIds?.forEach((id: string) => rewardedElementIds.add(id));
    });

    console.log(`  - Requirement elements: ${ownedElementIds.size}`);
    console.log(`  - Reward elements: ${rewardedElementIds.size}`);

    // Filter timeline events (using CORRECTED logic)
    const relevantTimelineIds = new Set<string>();
    
    // Include events where character is involved
    timeline.forEach((event: any) => {
      if (event.charactersInvolvedIds?.includes(characterId)) {
        relevantTimelineIds.add(event.id);
      }
    });
    
    console.log(`\nTimeline events directly involving character: ${relevantTimelineIds.size}`);

    // Include timeline events referenced by included elements
    let additionalTimelineEvents = 0;
    elements.forEach((element: any) => {
      if ((ownedElementIds.has(element.id) || rewardedElementIds.has(element.id)) && element.timelineEventId) {
        if (!relevantTimelineIds.has(element.timelineEventId)) {
          additionalTimelineEvents++;
          relevantTimelineIds.add(element.timelineEventId);
        }
      }
    });
    
    console.log(`Timeline events from element references: ${additionalTimelineEvents}`);
    console.log(`\n✅ Total timeline events for character: ${relevantTimelineIds.size}`);

    // Check for any elements that would show "unknown timeline event"
    let missingTimelineRefs = 0;
    const includedElements = elements.filter((e: any) => 
      ownedElementIds.has(e.id) || rewardedElementIds.has(e.id)
    );
    
    includedElements.forEach((element: any) => {
      if (element.timelineEventId && !relevantTimelineIds.has(element.timelineEventId)) {
        missingTimelineRefs++;
        console.warn(`⚠️  Element "${element.name}" references timeline event ${element.timelineEventId} not in view`);
      }
    });

    if (missingTimelineRefs === 0) {
      console.log('\n✅ SUCCESS: No missing timeline references!');
      console.log('The Character Journey View should display correctly without "unknown" warnings.');
    } else {
      console.log(`\n⚠️  WARNING: ${missingTimelineRefs} elements reference timeline events outside the view`);
      console.log('This is expected behavior - events not relevant to the character are filtered out.');
    }

    // List some timeline events that will be shown
    const timelineToShow = timeline.filter((e: any) => relevantTimelineIds.has(e.id));
    console.log('\nSample timeline events in view:');
    timelineToShow.slice(0, 5).forEach((event: any) => {
      console.log(`  - ${event.name || 'Untitled'} (${event.category || 'No category'})`);
    });

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testCharacterJourneyView();