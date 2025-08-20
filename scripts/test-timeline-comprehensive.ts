/**
 * Comprehensive timeline investigation
 */

import dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const TIMELINE_DATABASE_ID = process.env.NOTION_TIMELINE_DB || 
  '1b52f33d-583f-80de-ae5a-d20020c120dd';

async function comprehensiveTest() {
  console.log('=== COMPREHENSIVE TIMELINE ANALYSIS ===\n');
  
  // Test 1: Direct Notion API call
  console.log('1. DIRECT NOTION API TEST');
  console.log('--------------------------');
  try {
    const directResponse = await notion.databases.query({
      database_id: TIMELINE_DATABASE_ID,
      page_size: 3
    }) as any;
    
    console.log(`✓ Fetched ${directResponse.results.length} events directly`);
    
    for (let i = 0; i < Math.min(3, directResponse.results.length); i++) {
      const event = directResponse.results[i];
      const desc = event.properties.Description;
      console.log(`  Event ${i + 1}: ID=${event.id.substring(0, 8)}...`);
      console.log(`    - Title array length: ${desc?.title?.length || 0}`);
      if (desc?.title?.length > 0) {
        const text = desc.title.map((t: any) => t.plain_text).join('');
        console.log(`    - Combined text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      }
    }
  } catch (error) {
    console.error('✗ Direct API failed:', (error as Error).message);
  }
  
  // Test 2: Server endpoint test
  console.log('\n2. SERVER ENDPOINT TEST');
  console.log('------------------------');
  try {
    const serverResponse = await fetch('http://localhost:3001/api/notion/timeline?limit=3', {
      headers: { 'Origin': 'http://localhost:5173' }
    });
    
    if (serverResponse.ok) {
      const data = await serverResponse.json() as any;
      console.log(`✓ Server returned ${data.data?.length || 0} events`);
      
      for (let i = 0; i < Math.min(3, data.data?.length || 0); i++) {
        const event = data.data[i];
        console.log(`  Event ${i + 1}: ID=${event.id.substring(0, 8)}...`);
        console.log(`    - Name: "${event.name}"`);
        console.log(`    - Description: "${event.description}"`);
      }
    } else {
      console.error(`✗ Server returned ${serverResponse.status}: ${serverResponse.statusText}`);
    }
  } catch (error) {
    console.error('✗ Server request failed:', (error as Error).message);
  }
  
  // Test 3: Frontend data flow
  console.log('\n3. FRONTEND DATA FLOW TEST');
  console.log('---------------------------');
  try {
    // First get all timeline events
    const allResponse = await fetch('http://localhost:3001/api/notion/timeline?limit=100', {
      headers: { 'Origin': 'http://localhost:5173' }
    });
    
    if (allResponse.ok) {
      const allData = await allResponse.json() as any;
      const totalEvents = allData.data?.length || 0;
      
      // Check for specific event that was showing as "unknown"
      const targetId = '1b52f33d-583f-80f0-a1f3-ecb9b9cdd040';
      const targetEvent = allData.data?.find((e: any) => e.id === targetId);
      
      console.log(`✓ Total events in frontend data: ${totalEvents}`);
      console.log(`  Target event ${targetId.substring(0, 8)}... found: ${targetEvent ? 'YES' : 'NO'}`);
      
      if (targetEvent) {
        console.log(`    - Name: "${targetEvent.name}"`);
        console.log(`    - Description: "${targetEvent.description}"`);
      }
      
      // Count events by name
      const nameCounts: Record<string, number> = {};
      for (const event of allData.data || []) {
        nameCounts[event.name] = (nameCounts[event.name] || 0) + 1;
      }
      
      console.log('\n  Event name distribution:');
      for (const [name, count] of Object.entries(nameCounts)) {
        console.log(`    - "${name}": ${count} events`);
      }
    }
  } catch (error) {
    console.error('✗ Frontend flow test failed:', (error as Error).message);
  }
  
  // Test 4: Check if it's a caching issue
  console.log('\n4. CACHE BYPASS TEST');
  console.log('---------------------');
  try {
    const noCacheResponse = await fetch('http://localhost:3001/api/notion/timeline?limit=3', {
      headers: { 
        'Origin': 'http://localhost:5173',
        'X-Cache-Bypass': 'true'
      }
    });
    
    if (noCacheResponse.ok) {
      const data = await noCacheResponse.json() as any;
      console.log(`✓ Cache-bypassed response: ${data.data?.length || 0} events`);
      
      if (data.data?.length > 0) {
        const firstEvent = data.data[0];
        console.log(`  First event name: "${firstEvent.name}"`);
      }
    }
  } catch (error) {
    console.error('✗ Cache bypass test failed:', (error as Error).message);
  }
  
  console.log('\n=== ANALYSIS COMPLETE ===');
}

comprehensiveTest().catch(console.error);