/**
 * Centralized Notion Schema Property Mapping
 * 
 * Single source of truth for all Notion property names.
 * This DTO layer decouples frontend from direct Notion schema dependencies.
 * Changes to Notion property names only require updates here.
 */

/**
 * Character Database Property Names
 */
export const CharacterProperties = {
  // Basic fields
  NAME: 'Name',
  TYPE: 'Player or NPC',
  TIER: 'Tier',
  
  // Relations
  OWNED_ELEMENTS: 'Owned Elements',
  ASSOCIATED_ELEMENTS: 'Associated Elements',
  CHARACTER_PUZZLES: 'Character Puzzles',
  EVENTS: 'Events',
  CONNECTIONS: 'Connections',
  
  // Text fields
  PRIMARY_ACTION: 'Primary Action',
  CHARACTER_LOGLINE: 'Character Logline',
  OVERVIEW: 'Overview & Key Relationships',
  EMOTION_TOWARDS_CEO: 'Emotion towards CEO & others'
} as const;

/**
 * Element Database Property Names
 */
export const ElementProperties = {
  // Basic fields
  NAME: 'Name',
  DESCRIPTION: 'Description/Text',
  BASIC_TYPE: 'Basic Type',
  STATUS: 'Status',
  FIRST_AVAILABLE: 'First Available',
  
  // Relations
  OWNER: 'Owner',
  CONTAINER: 'Container',
  CONTENTS: 'Contents',
  TIMELINE_EVENT: 'Timeline Event',
  REQUIRED_FOR: 'Required For',
  REWARDED_BY: 'Rewarded By',
  ASSOCIATED_CHARACTERS: 'Associated Characters',
  
  // Additional fields
  NARRATIVE_THREADS: 'Narrative Threads',
  PRODUCTION_NOTES: 'Production/Puzzle Notes',
  CONTENT_LINK: 'Content Link'
} as const;

/**
 * Puzzle Database Property Names
 */
export const PuzzleProperties = {
  // Basic fields
  PUZZLE: 'Puzzle',
  DESCRIPTION_SOLUTION: 'Description/Solution',
  
  // Relations
  PUZZLE_ELEMENTS: 'Puzzle Elements',
  LOCKED_ITEM: 'Locked Item',
  REWARDS: 'Rewards',
  PARENT_ITEM: 'Parent item',
  SUB_PUZZLES: 'Sub-Puzzles',
  
  // Additional fields
  ASSET_LINK: 'Asset Link'
} as const;

/**
 * Timeline Database Property Names
 */
export const TimelineProperties = {
  // Basic fields
  DESCRIPTION: 'Description',
  DATE: 'Date',
  
  // Relations
  CHARACTERS_INVOLVED: 'Characters Involved',
  MEMORY_EVIDENCE: 'Memory/Evidence',
  
  // Additional fields
  NOTES: 'Notes'
} as const;

/**
 * Type guards for property mapping
 */
export type CharacterPropertyKey = keyof typeof CharacterProperties;
export type ElementPropertyKey = keyof typeof ElementProperties;
export type PuzzlePropertyKey = keyof typeof PuzzleProperties;
export type TimelinePropertyKey = keyof typeof TimelineProperties;

/**
 * Get property name for a given key
 */
export function getCharacterProperty(key: CharacterPropertyKey): string {
  return CharacterProperties[key];
}

export function getElementProperty(key: ElementPropertyKey): string {
  return ElementProperties[key];
}

export function getPuzzleProperty(key: PuzzlePropertyKey): string {
  return PuzzleProperties[key];
}

export function getTimelineProperty(key: TimelinePropertyKey): string {
  return TimelineProperties[key];
}

/**
 * Database type for property resolution
 */
export const DatabaseType = {
  CHARACTER: 'character',
  ELEMENT: 'element',
  PUZZLE: 'puzzle',
  TIMELINE: 'timeline'
} as const;

export type DatabaseType = typeof DatabaseType[keyof typeof DatabaseType];

/**
 * Generic property resolver
 */
export function getNotionProperty(
  database: DatabaseType,
  key: string
): string {
  switch (database) {
    case 'character':
      return CharacterProperties[key as CharacterPropertyKey];
    case 'element':
      return ElementProperties[key as ElementPropertyKey];
    case 'puzzle':
      return PuzzleProperties[key as PuzzlePropertyKey];
    case 'timeline':
      return TimelineProperties[key as TimelinePropertyKey];
    default:
      throw new Error(`Unknown database type: ${database}`);
  }
}