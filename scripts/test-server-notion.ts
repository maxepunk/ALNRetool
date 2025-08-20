/**
 * Test the Notion service directly to see what it's getting
 */

import dotenv from 'dotenv';
dotenv.config();

// Import the server's notion service
import { notion } from '../server/services/notion.js';

const TIMELINE_DATABASE_ID = process.env.NOTION_TIMELINE_DB || 
  '1b52f33d-583f-80de-ae5a-d20020c120dd';

async function testServerNotion() {
  console.log('Testing server Notion client...\n');
  
  try {
    const response = await notion.databases.query({
      database_id: TIMELINE_DATABASE_ID,
      page_size: 5
    }) as any;
    
    console.log(`Fetched ${response.results.length} timeline events\n`);
    
    // Check the first event
    if (response.results.length > 0) {
      const firstEvent = response.results[0];
      console.log('First event ID:', firstEvent.id);
      console.log('Description property:', JSON.stringify(firstEvent.properties.Description, null, 2));
      
      // Check if it's the problematic event
      const problematic = response.results.find((r: any) => 
        r.id === '1b52f33d-583f-80f0-a1f3-ecb9b9cdd040'
      );
      
      if (problematic) {
        console.log('\nProblematic event found!');
        console.log('Description:', JSON.stringify(problematic.properties.Description, null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testServerNotion().catch(console.error);