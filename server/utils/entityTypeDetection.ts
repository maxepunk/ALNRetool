/**
 * Entity Type Detection Utility
 * 
 * Provides reliable entity type detection based on database IDs
 * instead of brittle property name checking.
 * 
 * TECHNICAL DEBT FIX: Replaces property-based detection with
 * database ID mapping for reliability and maintainability.
 */

import config from '../config/index.js';
import type { NotionPage } from '../../src/types/notion/raw.js';

export type EntityType = 'character' | 'element' | 'puzzle' | 'timeline';

/**
 * Database ID to entity type mapping
 * Built from environment configuration at startup
 */
const DATABASE_ID_TO_TYPE = new Map<string, EntityType>([
  [config.notionDatabaseIds.characters, 'character'],
  [config.notionDatabaseIds.elements, 'element'],
  [config.notionDatabaseIds.puzzles, 'puzzle'],
  [config.notionDatabaseIds.timeline, 'timeline']
]);

/**
 * Detect entity type from a Notion page using its parent database ID
 * 
 * @param page - Notion page object
 * @returns Entity type or null if not recognized
 */
export function detectEntityType(page: NotionPage): EntityType | null {
  // Check if page has a database parent
  if (page.parent?.type === 'database_id') {
    const dbId = page.parent.database_id;
    return DATABASE_ID_TO_TYPE.get(dbId) || null;
  }
  
  return null;
}

/**
 * Get entity type from database ID directly
 * 
 * @param databaseId - Notion database ID
 * @returns Entity type or null if not recognized
 */
export function getEntityTypeFromDatabaseId(databaseId: string): EntityType | null {
  return DATABASE_ID_TO_TYPE.get(databaseId) || null;
}

/**
 * Get database ID for an entity type
 * 
 * @param entityType - Entity type
 * @returns Database ID
 */
export function getDatabaseIdForType(entityType: EntityType): string {
  switch (entityType) {
    case 'character':
      return config.notionDatabaseIds.characters;
    case 'element':
      return config.notionDatabaseIds.elements;
    case 'puzzle':
      return config.notionDatabaseIds.puzzles;
    case 'timeline':
      return config.notionDatabaseIds.timeline;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Transform function mapping for entity types
 * Maps entity types to their transform functions
 */
export const ENTITY_TRANSFORMS = {
  character: 'transformCharacter',
  element: 'transformElement',
  puzzle: 'transformPuzzle',
  timeline: 'transformTimelineEvent'
} as const;