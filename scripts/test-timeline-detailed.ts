/**
 * Detailed timeline analysis to find the data issue
 */

import dotenv from 'dotenv';
import { Client } from '@notionhq/client';

// Load environment variables
dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const TIMELINE_DATABASE_ID = process.env.NOTION_TIMELINE_DB || 
  '1b52f33d-583f-80de-ae5a-d20020c120dd';

async function analyzeTimeline() {
  console.log('Analyzing timeline events...\n');
  
  try {
    // Fetch all timeline events (up to 100)
    const allEvents = [];
    let cursor = undefined;
    let hasMore = true;
    
    while (hasMore && allEvents.length < 100) {
      const response = await notion.databases.query({
        database_id: TIMELINE_DATABASE_ID,
        page_size: 100,
        start_cursor: cursor
      }) as any;
      
      allEvents.push(...response.results);
      cursor = response.next_cursor;
      hasMore = response.has_more;
      
      if (!cursor) break;
    }
    
    console.log(`Total timeline events fetched: ${allEvents.length}\n`);
    
    // Analyze Description field
    let emptyDescriptions = 0;
    let validDescriptions = 0;
    const sampleEvents = [];
    
    for (const event of allEvents) {
      const desc = event.properties.Description;
      if (desc && desc.title && desc.title.length > 0) {
        validDescriptions++;
        if (sampleEvents.length < 3) {
          sampleEvents.push({
            id: event.id,
            description: desc.title[0]?.plain_text || 'No text'
          });
        }
      } else {
        emptyDescriptions++;
      }
    }
    
    console.log('Description field analysis:');
    console.log(`- Valid descriptions: ${validDescriptions}`);
    console.log(`- Empty descriptions: ${emptyDescriptions}`);
    console.log(`- Percentage with data: ${(validDescriptions / allEvents.length * 100).toFixed(1)}%\n`);
    
    if (sampleEvents.length > 0) {
      console.log('Sample events with descriptions:');
      sampleEvents.forEach(e => {
        console.log(`  - ${e.id}: "${e.description}"`);
      });
    }
    
    // Check what happens with our transform function
    console.log('\n\nTesting transform function...');
    const firstEvent = allEvents[0];
    
    function getTitle(prop: any): string | null {
      if (!prop || !prop.title || prop.title.length === 0) {
        return null;
      }
      return prop.title[0]?.plain_text || null;
    }
    
    const description = getTitle(firstEvent.properties.Description);
    console.log('First event transformed:');
    console.log('- Raw Description:', JSON.stringify(firstEvent.properties.Description, null, 2));
    console.log('- Transformed:', description);
    console.log('- Final name:', description || 'Untitled Event');
    
    // Check the specific problematic event
    const problematicId = '1b52f33d-583f-80f0-a1f3-ecb9b9cdd040';
    const problematicEvent = allEvents.find(e => e.id === problematicId);
    
    if (problematicEvent) {
      console.log(`\n\nProblematic event ${problematicId}:`);
      console.log('- Description:', JSON.stringify(problematicEvent.properties.Description, null, 2));
      console.log('- Date:', JSON.stringify(problematicEvent.properties.Date, null, 2));
      console.log('- Notes:', JSON.stringify(problematicEvent.properties.Notes, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeTimeline().catch(console.error);