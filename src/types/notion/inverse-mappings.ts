/**
 * Inverse Relation Mappings for Notion Database Bidirectional Synchronization
 * 
 * Defines how updates to one database propagate to related databases.
 * Uses the verified field names from schema-mapping.ts
 */

import { 
  CharacterProperties,
  ElementProperties, 
  PuzzleProperties,
  TimelineProperties 
} from './schema-mapping';

/**
 * Inverse relation configuration type
 */
export interface InverseRelation {
  sourceField: string;           // Field in source entity
  targetDatabaseId: string;      // Target database ID
  targetField: string;           // Field in target database
  relationType: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  bidirectional: boolean;        // Whether the relation updates both ways
}

/**
 * Character inverse relations
 * When a character's relations change, these define what needs updating
 */
export const CHARACTER_INVERSE_RELATIONS: InverseRelation[] = [
  {
    sourceField: 'ownedElementIds',
    targetDatabaseId: 'elements',  // Will be replaced with actual ID
    targetField: ElementProperties.OWNER,
    relationType: 'one-to-many',
    bidirectional: true
  },
  // Note: associatedElementIds is a rollup from timeline events, not directly editable
  // characterPuzzleIds relation doesn't have a clear inverse
  // eventIds relation to timeline events
  {
    sourceField: 'eventIds',
    targetDatabaseId: 'timeline',
    targetField: TimelineProperties.CHARACTERS_INVOLVED,
    relationType: 'many-to-many',
    bidirectional: true
  }
];

/**
 * Element inverse relations
 * When an element's relations change, these define what needs updating
 */
export const ELEMENT_INVERSE_RELATIONS: InverseRelation[] = [
  // Element -> Puzzle relations
  {
    sourceField: 'requiredForPuzzleIds',
    targetDatabaseId: 'puzzles',
    targetField: PuzzleProperties.PUZZLE_ELEMENTS,
    relationType: 'many-to-many',
    bidirectional: true
  },
  {
    sourceField: 'rewardedByPuzzleIds',
    targetDatabaseId: 'puzzles',
    targetField: PuzzleProperties.REWARDS,
    relationType: 'many-to-many',
    bidirectional: true
  },
  // Element -> Character relations
  {
    sourceField: 'ownerId',
    targetDatabaseId: 'characters',
    targetField: CharacterProperties.OWNED_ELEMENTS,
    relationType: 'many-to-one',
    bidirectional: true
  },
  // Element -> Element relations (container/contents)
  {
    sourceField: 'containerId',
    targetDatabaseId: 'elements',
    targetField: ElementProperties.CONTENTS,
    relationType: 'many-to-one',
    bidirectional: true
  },
  {
    sourceField: 'contentIds',
    targetDatabaseId: 'elements',
    targetField: ElementProperties.CONTAINER,
    relationType: 'one-to-many',
    bidirectional: true
  },
  // Element -> Timeline relations
  {
    sourceField: 'timelineEventId',
    targetDatabaseId: 'timeline',
    targetField: TimelineProperties.MEMORY_EVIDENCE,
    relationType: 'many-to-one',
    bidirectional: true
  }
];

/**
 * Puzzle inverse relations
 * When a puzzle's relations change, these define what needs updating
 */
export const PUZZLE_INVERSE_RELATIONS: InverseRelation[] = [
  // Puzzle -> Element relations
  {
    sourceField: 'puzzleElementIds',
    targetDatabaseId: 'elements',
    targetField: ElementProperties.REQUIRED_FOR_PUZZLE,
    relationType: 'many-to-many',
    bidirectional: true
  },
  {
    sourceField: 'rewardIds',
    targetDatabaseId: 'elements',
    targetField: ElementProperties.REWARDED_BY_PUZZLE,
    relationType: 'many-to-many',
    bidirectional: true
  },
  {
    sourceField: 'lockedItemId',
    targetDatabaseId: 'elements',
    targetField: ElementProperties.CONTAINER_PUZZLE,
    relationType: 'one-to-one',
    bidirectional: true
  },
  // Puzzle -> Puzzle relations (parent/sub-puzzles)
  {
    sourceField: 'parentItemId',
    targetDatabaseId: 'puzzles',
    targetField: PuzzleProperties.SUB_PUZZLES,
    relationType: 'many-to-one',
    bidirectional: true
  },
  {
    sourceField: 'subPuzzleIds',
    targetDatabaseId: 'puzzles',
    targetField: PuzzleProperties.PARENT_ITEM,
    relationType: 'one-to-many',
    bidirectional: true
  }
];

/**
 * Timeline inverse relations
 * When a timeline event's relations change, these define what needs updating
 */
export const TIMELINE_INVERSE_RELATIONS: InverseRelation[] = [
  // Timeline -> Character relations
  {
    sourceField: 'charactersInvolvedIds',
    targetDatabaseId: 'characters',
    targetField: CharacterProperties.EVENTS,
    relationType: 'many-to-many',
    bidirectional: true
  },
  // Timeline -> Element relations
  {
    sourceField: 'memoryEvidenceIds',
    targetDatabaseId: 'elements',
    targetField: ElementProperties.TIMELINE_EVENT,
    relationType: 'one-to-many',
    bidirectional: true
  }
];

/**
 * Get inverse relations for an entity type
 */
export function getInverseRelations(
  entityType: 'characters' | 'elements' | 'puzzles' | 'timeline'
): InverseRelation[] {
  switch (entityType) {
    case 'characters':
      return CHARACTER_INVERSE_RELATIONS;
    case 'elements':
      return ELEMENT_INVERSE_RELATIONS;
    case 'puzzles':
      return PUZZLE_INVERSE_RELATIONS;
    case 'timeline':
      return TIMELINE_INVERSE_RELATIONS;
    default:
      return [];
  }
}

/**
 * Replace database name with actual ID
 * This should be called at runtime with config values
 */
export function resolveInverseRelations(
  relations: InverseRelation[],
  databaseIds: Record<string, string>
): InverseRelation[] {
  return relations.map(rel => ({
    ...rel,
    targetDatabaseId: databaseIds[rel.targetDatabaseId] || rel.targetDatabaseId
  }));
}