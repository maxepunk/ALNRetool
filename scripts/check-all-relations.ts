#!/usr/bin/env tsx
import { config } from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:3001';
const API_KEY = process.env.NOTION_API_KEY || '';

async function main() {
  console.log('Checking ALL relationship fields in synthesized data...\n');
  
  // Fetch synthesized data
  const res = await fetch(`${BASE_URL}/api/notion/synthesized`, {
    headers: { 
      'X-API-Key': API_KEY,
      'Origin': 'http://localhost:5173',
      'Referer': 'http://localhost:5173/'
    }
  });
  
  if (!res.ok) {
    console.log(`Error: ${res.status} ${res.statusText}`);
    return;
  }
  
  const data = await res.json();
  
  console.log('=== ELEMENT RELATIONSHIPS ===');
  console.log('Total elements:', data.elements.length);
  
  // Check all element relationship fields
  const elementFields = {
    'ownerId': data.elements.filter((e: any) => e.ownerId),
    'containerId': data.elements.filter((e: any) => e.containerId),
    'containerPuzzleId': data.elements.filter((e: any) => e.containerPuzzleId),
    'contentIds': data.elements.filter((e: any) => e.contentIds && e.contentIds.length > 0),
    'timelineEventId': data.elements.filter((e: any) => e.timelineEventId),
    'requiredForPuzzleIds': data.elements.filter((e: any) => e.requiredForPuzzleIds && e.requiredForPuzzleIds.length > 0),
    'rewardedByPuzzleIds': data.elements.filter((e: any) => e.rewardedByPuzzleIds && e.rewardedByPuzzleIds.length > 0),
    'associatedCharacterIds': data.elements.filter((e: any) => e.associatedCharacterIds && e.associatedCharacterIds.length > 0)
  };
  
  Object.entries(elementFields).forEach(([field, items]) => {
    console.log(`${field}: ${items.length} elements`);
  });
  
  console.log('\n=== PUZZLE RELATIONSHIPS ===');
  console.log('Total puzzles:', data.puzzles.length);
  
  // Check all puzzle relationship fields  
  const puzzleFields = {
    'ownerId': data.puzzles.filter((p: any) => p.ownerId),
    'parentItemId': data.puzzles.filter((p: any) => p.parentItemId),
    'subPuzzleIds': data.puzzles.filter((p: any) => p.subPuzzleIds && p.subPuzzleIds.length > 0),
    'puzzleElementIds': data.puzzles.filter((p: any) => p.puzzleElementIds && p.puzzleElementIds.length > 0),
    'rewardIds': data.puzzles.filter((p: any) => p.rewardIds && p.rewardIds.length > 0),
    'lockedItemId': data.puzzles.filter((p: any) => p.lockedItemId)
  };
  
  Object.entries(puzzleFields).forEach(([field, items]) => {
    console.log(`${field}: ${items.length} puzzles`);
  });
  
  // Check data types for owner fields
  console.log('\n=== OWNER FIELD DATA TYPES ===');
  if (puzzleFields.ownerId.length > 0) {
    const firstOwner = puzzleFields.ownerId[0].ownerId;
    const isUUID = /^[0-9a-f-]{36}$/i.test(firstOwner);
    console.log(`Puzzle ownerIds are: ${isUUID ? 'UUIDs' : 'Names/Text'}`);
    console.log(`Example: "${firstOwner}"`);
  }
  
  if (elementFields.ownerId.length > 0) {
    const firstOwner = elementFields.ownerId[0].ownerId;
    const isUUID = /^[0-9a-f-]{36}$/i.test(firstOwner);
    console.log(`Element ownerIds are: ${isUUID ? 'UUIDs' : 'Names/Text'}`);
    console.log(`Example: "${firstOwner}"`);
  }
  
  // Check if associatedCharacterIds are IDs or names
  console.log('\n=== ASSOCIATED CHARACTER DATA TYPES ===');
  if (elementFields.associatedCharacterIds.length > 0) {
    const firstAssoc = elementFields.associatedCharacterIds[0].associatedCharacterIds[0];
    const isUUID = /^[0-9a-f-]{36}$/i.test(firstAssoc);
    console.log(`associatedCharacterIds are: ${isUUID ? 'UUIDs' : 'Names/Text'}`);
    console.log(`Example: "${firstAssoc}"`);
  }
  
  // Check Black Market Business card specifically
  console.log('\n=== BLACK MARKET BUSINESS CARD ===');
  const blackMarket = data.elements.find((e: any) => e.name === 'Black Market Business card');
  if (blackMarket) {
    console.log('All relationships:');
    console.log('- ownerId:', blackMarket.ownerId || 'null');
    console.log('- containerId:', blackMarket.containerId || 'null');
    console.log('- containerPuzzleId:', blackMarket.containerPuzzleId || 'null');
    console.log('- contentIds:', JSON.stringify(blackMarket.contentIds || []));
    console.log('- associatedCharacterIds:', JSON.stringify(blackMarket.associatedCharacterIds || []));
    console.log('- requiredForPuzzleIds:', JSON.stringify(blackMarket.requiredForPuzzleIds || []));
    console.log('- rewardedByPuzzleIds:', JSON.stringify(blackMarket.rewardedByPuzzleIds || []));
    console.log('- timelineEventId:', blackMarket.timelineEventId || 'null');
  }
  
  // Check a puzzle with sub-puzzles
  console.log('\n=== PUZZLE WITH SUB-PUZZLES ===');
  const puzzleWithSubs = data.puzzles.find((p: any) => p.subPuzzleIds && p.subPuzzleIds.length > 0);
  if (puzzleWithSubs) {
    console.log(`Puzzle: "${puzzleWithSubs.name}"`);
    console.log(`Sub-puzzles: ${JSON.stringify(puzzleWithSubs.subPuzzleIds)}`);
  }
  
  // Check a puzzle with parent item
  console.log('\n=== PUZZLE WITH PARENT ITEM ===');
  const puzzleWithParent = data.puzzles.find((p: any) => p.parentItemId);
  if (puzzleWithParent) {
    console.log(`Puzzle: "${puzzleWithParent.name}"`);
    console.log(`Parent item: ${puzzleWithParent.parentItemId}`);
  }
}

main().catch(console.error);