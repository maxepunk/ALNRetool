#!/usr/bin/env tsx
import { config } from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const BASE_URL = 'http://localhost:3001';
  const headers = {
    'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  // Get a single element directly from Notion to see rollup structure
  const elementId = '1dc2f33d-583f-8056-bf34-c6a9922067d8'; // Black Market Business card
  
  console.log('Fetching element directly from Notion API...\n');
  
  const res = await fetch(`https://api.notion.com/v1/pages/${elementId}`, { headers });
  
  if (!res.ok) {
    console.error('Error:', res.status, res.statusText);
    return;
  }
  
  const data = await res.json();
  
  // Check Associated Characters rollup field
  console.log('=== Associated Characters Field ===');
  const assocChars = data.properties['Associated Characters'];
  console.log('Type:', assocChars?.type);
  console.log('Full structure:', JSON.stringify(assocChars, null, 2));
  
  // Get a puzzle to check Owner rollup
  const puzzleId = '1dc2f33d-583f-80e6-8cbd-fd54cfe6f697'; // Ashe's talk-to-people math puzzle
  
  console.log('\n=== Fetching Puzzle Owner Field ===');
  const puzzleRes = await fetch(`https://api.notion.com/v1/pages/${puzzleId}`, { headers });
  
  if (puzzleRes.ok) {
    const puzzleData = await puzzleRes.json();
    const owner = puzzleData.properties['Owner'];
    console.log('Type:', owner?.type);
    console.log('Full structure:', JSON.stringify(owner, null, 2));
  }
}

main().catch(console.error);
