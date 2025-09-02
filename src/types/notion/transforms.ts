/**
 * Transform functions from raw Notion API data to clean app types
 * Pure functions for predictable transformations
 * 
 * @module types/notion/transforms
 * @description Provides pure functions to transform Notion's complex property
 * structure into clean, UI-friendly data types. All functions are idempotent
 * and handle missing/malformed data gracefully.
 */

import type { 
  NotionPage, 
  NotionProperty
} from './raw';

import type {
  Character,
  Element,
  Puzzle,
  TimelineEvent,
  SFPatterns,
  ElementBasicType,
  ElementStatus,
  Act
} from './app';

import {
  CharacterProperties,
  ElementProperties,
  PuzzleProperties,
  TimelineProperties
} from './schema-mapping';

/**
 * Normalizes a UUID string to the canonical 8-4-4-4-12 format with hyphens.
 * Handles both hyphenated and non-hyphenated UUID formats from Notion API.
 * 
 * @param id - The ID string to normalize
 * @returns The normalized UUID string with hyphens, or original if not a valid UUID
 */
function normalizeUuid(id: string): string {
  if (typeof id !== 'string') return id;
  
  // Remove any existing hyphens
  const cleanedId = id.replace(/-/g, '');
  
  // Check if it's a 32-character hex string (UUID without hyphens)
  if (cleanedId.length !== 32 || !/^[0-9a-f]+$/i.test(cleanedId)) {
    // Not a valid UUID format, return as-is
    return id;
  }
  
  // Insert hyphens at the correct positions: 8-4-4-4-12
  return `${cleanedId.substring(0, 8)}-${cleanedId.substring(8, 12)}-${cleanedId.substring(12, 16)}-${cleanedId.substring(16, 20)}-${cleanedId.substring(20)}`;
}

// Property extraction helpers
/**
 * Extracts plain text from a Notion title property
 * @param prop - Notion property that may be a title
 * @returns Plain text string or empty string if not a title
 */
export function getTitle(prop: NotionProperty | undefined): string {
  if (!prop || prop.type !== 'title') return '';
  return prop.title.map(t => t.plain_text).join('');
}

/**
 * Extracts plain text from a Notion rich text property
 * @param prop - Notion property that may be rich text
 * @returns Concatenated plain text or empty string
 */
export function getRichText(prop: NotionProperty | undefined): string {
  if (!prop || prop.type !== 'rich_text') return '';
  return prop.rich_text.map(t => t.plain_text).join('');
}

/**
 * Extracts the selected option from a Notion select property
 * @param prop - Notion property that may be a select
 * @returns Selected option name or null
 */
export function getSelect(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== 'select') return null;
  return prop.select?.name || null;
}

/**
 * Extracts all selected options from a Notion multi-select property
 * @param prop - Notion property that may be a multi-select
 * @returns Array of selected option names
 */
export function getMultiSelect(prop: NotionProperty | undefined): string[] {
  if (!prop || prop.type !== 'multi_select') return [];
  return prop.multi_select.map(s => s.name);
}

/**
 * Extracts the status from a Notion status property
 * @param prop - Notion property that may be a status
 * @returns Status name or null
 */
export function getStatus(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== 'status') return null;
  return prop.status?.name || null;
}

/**
 * Extracts related page IDs from a Notion relation property
 * @param prop - Notion property that may be a relation
 * @returns Array of related page IDs
 */
export function getRelationIds(prop: NotionProperty | undefined): string[] {
  if (!prop || prop.type !== 'relation') return [];
  // Normalize all relation IDs to ensure consistent format
  return prop.relation.map(r => normalizeUuid(r.id));
}

export function getRollupArray(prop: NotionProperty | undefined): NotionProperty[] {
  if (!prop || prop.type !== 'rollup') return [];
  
  // NOTE: The 'has_more' flag for rollups is only available on the `pages.properties.retrieve`
  // endpoint, not the standard `pages.retrieve` response. The best we can do here is warn
  // when we approach the known limit of 25 where pagination is likely to occur.
  if (prop.rollup.type === 'array') {
    if (prop.rollup.array.length >= 25) {
      // This file is shared client/server, so use console.warn.
      console.warn(`[Rollup Limit] Rollup property has 25 or more items. Results may be truncated by Notion API.`, {
        count: prop.rollup.array.length
      });
    }
    return prop.rollup.array;
  }
  return [];
}

export function getRollupStrings(prop: NotionProperty | undefined): string[] {
  const array = getRollupArray(prop);
  return array
    .map(item => {
      if (item.type === 'title') return getTitle(item);
      if (item.type === 'rich_text') return getRichText(item);
      if (item.type === 'select') return getSelect(item);
      return null;
    })
    .filter((s): s is string => s !== null);
}

export function getDate(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== 'date') return null;
  return prop.date?.start || null;
}

export function getFormula(prop: NotionProperty | undefined): string | number | boolean | null {
  if (!prop || prop.type !== 'formula') return null;
  const formula = prop.formula;
  if (formula.type === 'boolean') return formula.boolean;
  if (formula.type === 'string') return formula.string;
  if (formula.type === 'number') return formula.number;
  if (formula.type === 'date') return formula.date?.start || null;
  return null;
}

export function getUrl(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== 'url') return null;
  return prop.url;
}

// SF_ pattern parser
export function parseSFPatterns(text: string): SFPatterns {
  const patterns: SFPatterns = {};
  
  // Extract RFID - handle both template and actual values
  const rfidMatch = text.match(/SF_RFID:\s*\[([^\]]+)\]/);
  if (rfidMatch?.[1]) {
    // Skip template placeholders like "unique identifier" or "TBD"
    const value = rfidMatch[1].trim();
    if (value && !value.match(/^(unique identifier|TBD|TODO)$/i)) {
      patterns.rfid = value;
    }
  }
  
  // Extract ValueRating - handle both number and placeholder
  const valueMatch = text.match(/SF_ValueRating:\s*\[([^\]]+)\]/);
  if (valueMatch?.[1]) {
    const value = valueMatch[1].trim();
    // Try to parse as number, skip if it's a range like "1-5"
    if (value.match(/^\d+$/)) {
      patterns.valueRating = parseInt(value, 10);
    }
  }
  
  // Extract MemoryType
  const memoryMatch = text.match(/SF_MemoryType:\s*\[([^\]]+)\]/);
  if (memoryMatch?.[1]) {
    const value = memoryMatch[1].trim();
    // Match actual memory types, ignoring multiplier syntax
    const typeMatch = value.match(/^(Personal|Business|Technical)/i);
    if (typeMatch) {
      patterns.memoryType = typeMatch[1] as SFPatterns['memoryType'];
    }
  }
  
  // Extract Group - handle group name with multiplier
  const groupMatch = text.match(/SF_Group:\s*\[([^\]]+)\]/);
  if (groupMatch?.[1]) {
    const value = groupMatch[1].trim();
    // Skip template placeholders
    if (value && !value.match(/^\{.*\}$/)) {
      // Parse group name and multiplier
      const groupParseMatch = value.match(/^(.+?)\s*\(x(\d+(?:-\d+)?)\)$/);
      if (groupParseMatch?.[1] && groupParseMatch[2]) {
        patterns.group = {
          name: groupParseMatch[1].trim(),
          multiplier: groupParseMatch[2]
        };
      } else {
        // Just the group name without multiplier
        patterns.group = {
          name: value,
          multiplier: '1'
        };
      }
    }
  }
  
  return patterns;
}

// Transform functions for each database type
export function transformCharacter(page: NotionPage): Character {
  const props = page.properties;
  
  return {
    id: normalizeUuid(page.id),
    name: getTitle(props[CharacterProperties.NAME]),
    entityType: 'character' as const,
    lastEdited: page.last_edited_time,
    type: (getSelect(props[CharacterProperties.TYPE]) || 'NPC') as Character['type'],
    tier: (getSelect(props[CharacterProperties.TIER]) || 'Tertiary') as Character['tier'],
    ownedElementIds: getRelationIds(props[CharacterProperties.OWNED_ELEMENTS]),
    associatedElementIds: getRelationIds(props[CharacterProperties.ASSOCIATED_ELEMENTS]),
    characterPuzzleIds: getRelationIds(props[CharacterProperties.CHARACTER_PUZZLES]),
    eventIds: getRelationIds(props[CharacterProperties.EVENTS]),
    connections: getRollupStrings(props[CharacterProperties.CONNECTIONS]),
    primaryAction: getRichText(props[CharacterProperties.PRIMARY_ACTION]),
    characterLogline: getRichText(props[CharacterProperties.CHARACTER_LOGLINE]),
    overview: getRichText(props[CharacterProperties.OVERVIEW]),
    emotionTowardsCEO: getRichText(props[CharacterProperties.EMOTION_TOWARDS_CEO])
  };
}

export function transformElement(page: NotionPage): Element {
  const props = page.properties;
  const descriptionText = getRichText(props[ElementProperties.DESCRIPTION]);
  
  return {
    id: normalizeUuid(page.id),
    name: getTitle(props[ElementProperties.NAME]),
    entityType: 'element' as const,
    lastEdited: page.last_edited_time,
    descriptionText,
    sfPatterns: parseSFPatterns(descriptionText),
    basicType: (getSelect(props[ElementProperties.BASIC_TYPE]) || 'Prop') as ElementBasicType,
    ownerId: getRelationIds(props[ElementProperties.OWNER])[0],
    containerId: getRelationIds(props[ElementProperties.CONTAINER])[0],
    contentIds: getRelationIds(props[ElementProperties.CONTENTS]),
    timelineEventId: getRelationIds(props[ElementProperties.TIMELINE_EVENT])[0],
    status: (getStatus(props[ElementProperties.STATUS]) || 'Idea/Placeholder') as ElementStatus,
    firstAvailable: getSelect(props[ElementProperties.FIRST_AVAILABLE]) as Act,
    requiredForPuzzleIds: getRelationIds(props[ElementProperties.REQUIRED_FOR_PUZZLE]),
    rewardedByPuzzleIds: getRelationIds(props[ElementProperties.REWARDED_BY_PUZZLE]),
    containerPuzzleId: getRelationIds(props[ElementProperties.CONTAINER_PUZZLE])[0],
    narrativeThreads: getMultiSelect(props[ElementProperties.NARRATIVE_THREADS]),
    associatedCharacterIds: getRollupStrings(props[ElementProperties.ASSOCIATED_CHARACTERS]),
    puzzleChain: getRollupStrings(props[ElementProperties.PUZZLE_CHAIN]),
    productionNotes: getRichText(props[ElementProperties.PRODUCTION_NOTES]),
    filesMedia: [], // TODO: Parse files when needed
    contentLink: getUrl(props[ElementProperties.CONTENT_LINK]) || undefined,
    isContainer: getFormula(props[ElementProperties.IS_CONTAINER]) === true
  };
}

export function transformPuzzle(page: NotionPage): Puzzle {
  const props = page.properties;
  
  return {
    id: normalizeUuid(page.id),
    name: getTitle(props[PuzzleProperties.PUZZLE]),
    entityType: 'puzzle' as const,
    lastEdited: page.last_edited_time,
    descriptionSolution: getRichText(props[PuzzleProperties.DESCRIPTION_SOLUTION]),
    puzzleElementIds: getRelationIds(props[PuzzleProperties.PUZZLE_ELEMENTS]),
    lockedItemId: getRelationIds(props[PuzzleProperties.LOCKED_ITEM])[0],
    ownerId: getRollupStrings(props[PuzzleProperties.OWNER])[0],
    rewardIds: getRelationIds(props[PuzzleProperties.REWARDS]),
    parentItemId: getRelationIds(props[PuzzleProperties.PARENT_ITEM])[0],
    subPuzzleIds: getRelationIds(props[PuzzleProperties.SUB_PUZZLES]),
    storyReveals: getRollupStrings(props[PuzzleProperties.STORY_REVEALS]),
    timing: getRollupStrings(props[PuzzleProperties.TIMING]) as Act[],
    narrativeThreads: getRollupStrings(props[PuzzleProperties.NARRATIVE_THREADS]),
    assetLink: getUrl(props[PuzzleProperties.ASSET_LINK]) || undefined
  };
}

export function transformTimelineEvent(page: NotionPage): TimelineEvent {
  const props = page.properties;
  const description = getTitle(props[TimelineProperties.DESCRIPTION]);
  
  return {
    id: normalizeUuid(page.id),
    name: description || 'Untitled Event', // Add name field
    entityType: 'timeline' as const,
    lastEdited: page.last_edited_time,
    description: description || '',
    date: getDate(props[TimelineProperties.DATE]) || '',
    charactersInvolvedIds: getRelationIds(props[TimelineProperties.CHARACTERS_INVOLVED]),
    memoryEvidenceIds: getRelationIds(props[TimelineProperties.MEMORY_EVIDENCE]),
    memTypes: getRollupStrings(props[TimelineProperties.MEM_TYPE]) as ElementBasicType[],
    notes: getRichText(props[TimelineProperties.NOTES]),
    lastEditedTime: page.last_edited_time
  };
}
// Note: Property mapping functions moved to server/services/notionPropertyMappers.ts
// The backend handles all Notion property transformations to maintain a single source of truth