/**
 * Test script to debug timeline fetching issue
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

async function testTimelineFetch() {
  console.log('Testing timeline fetch...');
  console.log('Database ID:', TIMELINE_DATABASE_ID);
  
  try {
    // First, let's try to fetch the database itself
    const database = await notion.databases.retrieve({
      database_id: TIMELINE_DATABASE_ID
    });
    
    console.log('Database found:', database.title);
    
    // Now try to query it
    const response = await notion.databases.query({
      database_id: TIMELINE_DATABASE_ID,
      page_size: 10
    });
    
    console.log('Query response:');
    console.log('- Results count:', response.results.length);
    console.log('- Has more:', response.has_more);
    console.log('- Next cursor:', response.next_cursor);
    
    if (response.results.length > 0) {
      console.log('\nFirst timeline event:');
      const firstEvent = response.results[0] as any;
      console.log('- ID:', firstEvent.id);
      console.log('- Properties:', Object.keys(firstEvent.properties));
      
      // Check for the Description property
      if (firstEvent.properties.Description) {
        console.log('- Description type:', firstEvent.properties.Description.type);
        console.log('- Description value:', firstEvent.properties.Description);
      }
    } else {
      console.log('\n⚠️ No timeline events found in the database!');
      console.log('This explains why timeline events show as "unknown" in the graph.');
    }
    
    // Let's also check if we can find the specific event referenced in errors
    const specificEventId = '1b52f33d-583f-80f0-a1f3-ecb9b9cdd040';
    try {
      const page = await notion.pages.retrieve({
        page_id: specificEventId
      });
      console.log('\n✅ Specific event found:', specificEventId);
      console.log('- Page exists in Notion');
      console.log('- Parent database:', (page as any).parent?.database_id);
    } catch (error) {
      console.log('\n❌ Specific event not found:', specificEventId);
      console.log('- Error:', (error as Error).message);
    }
    
  } catch (error) {
    console.error('Error fetching timeline:', error);
    if ((error as any).code === 'object_not_found') {
      console.error('The timeline database was not found. Check the database ID.');
    } else if ((error as any).code === 'unauthorized') {
      console.error('The API key does not have access to this database.');
    }
  }
}

testTimelineFetch().catch(console.error);