#!/usr/bin/env tsx
/**
 * Debug script to check specific entities that are showing as missing required fields
 * Fetches raw data from Notion API to verify if fields are actually missing
 */

import dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

if (!process.env.NOTION_API_KEY) {
  console.error(chalk.red('❌ NOTION_API_KEY not found in .env file'));
  process.exit(1);
}

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// IDs from the console errors
const problematicEntities = {
  character: '2302f33d-583f-802a-8f25-c21e0bafd9cf',
  elements: [
    '2302f33d-583f-80cf-8ae9-df3b683f7758',
    '1f92f33d-583f-801d-9171-d080a6010340'
  ],
  puzzle: '2302f33d-583f-8028-8630-d80d347400f2',
  timelines: [
    '2052f33d-583f-80cc-93c7-f9be3002fd59',
    '2002f33d-583f-80aa-bf17-c35fd1c34dd8'
  ]
};

async function fetchAndInspectPage(pageId: string, entityType: string) {
  console.log(chalk.cyan(`\n${'='.repeat(60)}`));
  console.log(chalk.cyan(`Fetching ${entityType}: ${pageId}`));
  console.log(chalk.cyan('='.repeat(60)));
  
  try {
    const page = await notion.pages.retrieve({ page_id: pageId }) as PageObjectResponse;
    
    // Check if page is archived
    if (page.archived) {
      console.log(chalk.yellow('⚠️  Page is ARCHIVED'));
    }
    
    // Look for title property (usually "Name" or "Title" or "Puzzle" or "Description")
    const properties = page.properties;
    console.log(chalk.green('\n📝 Properties found:'));
    
    // Check all potential title fields
    const titleFields = ['Name', 'Title', 'Puzzle', 'Description'];
    let foundTitle = false;
    
    for (const fieldName of titleFields) {
      if (properties[fieldName]) {
        const prop = properties[fieldName];
        console.log(chalk.blue(`\n  ${fieldName} (${prop.type}):`));
        
        if (prop.type === 'title' && 'title' in prop) {
          if (prop.title.length === 0) {
            console.log(chalk.red('    ❌ EMPTY TITLE ARRAY'));
          } else {
            foundTitle = true;
            const titleText = prop.title.map((t: any) => t.plain_text).join('');
            if (titleText.trim() === '') {
              console.log(chalk.yellow(`    ⚠️  Title exists but is blank/whitespace: "${titleText}"`));
            } else {
              console.log(chalk.green(`    ✅ "${titleText}"`));
            }
          }
        }
      }
    }
    
    if (!foundTitle) {
      console.log(chalk.red('\n  ❌ No title property found in any expected field'));
    }
    
    // For timeline entries, check the Date field
    if (entityType === 'timeline') {
      console.log(chalk.blue('\n  Date field:'));
      if (properties['Date']) {
        const dateProp = properties['Date'];
        if (dateProp.type === 'date' && 'date' in dateProp) {
          if (!dateProp.date) {
            console.log(chalk.red('    ❌ Date property exists but is NULL'));
          } else if (!dateProp.date.start) {
            console.log(chalk.red('    ❌ Date exists but has no start value'));
          } else {
            console.log(chalk.green(`    ✅ ${dateProp.date.start}`));
          }
        }
      } else {
        console.log(chalk.red('    ❌ No Date property found'));
      }
    }
    
    // Show all property names for debugging
    console.log(chalk.gray('\n  All properties in this page:'));
    Object.keys(properties).forEach(key => {
      const prop = properties[key];
      console.log(chalk.gray(`    - ${key} (${prop.type})`));
    });
    
    // For debugging: show raw title properties
    console.log(chalk.magenta('\n🔍 Raw title field data:'));
    for (const fieldName of titleFields) {
      if (properties[fieldName] && properties[fieldName].type === 'title') {
        console.log(chalk.gray(`  ${fieldName}:`), JSON.stringify(properties[fieldName], null, 2));
      }
    }
    
  } catch (error: any) {
    console.log(chalk.red(`❌ Error fetching ${entityType} ${pageId}:`));
    console.log(chalk.red(`   ${error.message}`));
    if (error.code === 'object_not_found') {
      console.log(chalk.yellow('   This page may have been deleted or you lack access'));
    }
  }
}

async function main() {
  console.log(chalk.bold.white('\n🔍 Debugging Missing Fields in Notion Data\n'));
  
  // Check character
  await fetchAndInspectPage(problematicEntities.character, 'character');
  
  // Check elements
  for (const elementId of problematicEntities.elements) {
    await fetchAndInspectPage(elementId, 'element');
  }
  
  // Check puzzle
  await fetchAndInspectPage(problematicEntities.puzzle, 'puzzle');
  
  // Check timelines
  for (const timelineId of problematicEntities.timelines) {
    await fetchAndInspectPage(timelineId, 'timeline');
  }
  
  console.log(chalk.bold.green('\n✅ Diagnostic complete\n'));
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});