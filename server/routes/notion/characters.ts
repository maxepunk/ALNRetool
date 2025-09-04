/**
 * Characters API Router
 * 
 * Express router for handling character entity CRUD operations.
 * Characters are the main actors in the murder mystery game.
 * 
 * @module server/routes/notion/characters
 * 
 * **Architecture:**
 * - Built on createEntityRouter factory pattern
 * - No inverse relations currently (ready for future expansion)
 * - Filter support for tiers, types, and dates
 * - Handles Player and NPC character types
 * 
 * **Endpoints:**
 * - GET /api/notion/characters - List characters with pagination
 * - GET /api/notion/characters/:id - Get single character
 * - PUT /api/notion/characters/:id - Update character
 * - DELETE /api/notion/characters/:id - Delete character
 * 
 * **Character Types:**
 * - Player: Playable characters
 * - NPC: Non-player characters
 * 
 * **Tier System:**
 * - Core: Essential characters
 * - Standard: Regular characters
 * - Extended: Optional characters
 */

import { createEntityRouter, type InverseRelation } from './createEntityRouter.js';
import { buildCharacterFilters } from '../../services/filterBuilder.js';
import { transformCharacter } from '../../../src/types/notion/transforms.js';
import { toNotionCharacterProperties } from '../../services/notionPropertyMappers.js';
import config from '../../config/index.js';

/**
 * Notion database ID for characters collection.
 * @constant {string}
 */
const CHARACTERS_DATABASE_ID = config.notionDatabaseIds.characters;

/**
 * Notion database ID for elements collection.
 * Used for inverse relation updates.
 * @constant {string}
 */
const ELEMENTS_DATABASE_ID = config.notionDatabaseIds.elements;

/**
 * Notion database ID for puzzles collection.
 * Used for inverse relation updates.
 * @constant {string}
 */
const PUZZLES_DATABASE_ID = config.notionDatabaseIds.puzzles;

/**
 * Inverse relation configuration for characters.
 * Defines how character updates propagate to related elements and puzzles.
 * 
 * @constant {InverseRelation[]} characterInverseRelations
 * 
 * **Relation Types:**
 * 1. **ownedElementIds**: Elements owned by this character
 *    - Updates Element.Owner field
 *    - Many-to-one bidirectional (many elements can have one owner)
 * 
 * 2. **characterPuzzleIds**: Puzzles this character can access
 *    - Note: Puzzles don't have a reciprocal "Characters" field in Notion
 *    - This is a one-way relationship from Character to Puzzle
 *    - Bidirectional is set to false as puzzles can't update back
 * 
 * Note: associatedElementIds is a rollup from timeline events
 * and cannot be directly edited, so no inverse relation is needed.
 * 
 * **Synchronization:**
 * When a character's owned elements change, the corresponding
 * element records are automatically updated to maintain consistency.
 * Character-puzzle relationships are one-way only.
 */
const characterInverseRelations: InverseRelation[] = [
  {
    sourceField: 'ownedElementIds',
    targetDatabaseId: ELEMENTS_DATABASE_ID,
    targetField: 'Owner',
    relationType: 'one-to-many',
    bidirectional: true
  }
  // Note: characterPuzzleIds cannot have a bidirectional inverse relation
  // because puzzles don't have a "Characters" field in the Notion schema.
  // The relationship is handled during creation via _parentRelation logic.
];

/**
 * Create Express router for character endpoints.
 * Configures all CRUD operations with proper transforms.
 * 
 * @constant {Router} router
 * 
 * **Configuration:**
 * - Transform: Converts Notion → App format
 * - ToNotionProps: Converts App → Notion format
 * - BuildFilters: Constructs Notion query filters
 * - InverseRelations: Bidirectional sync with Elements
 * 
 * **Request Flow:**
 * 1. Request hits router endpoint
 * 2. Pagination/filter validation
 * 3. Notion API query with filters
 * 4. Transform response to app format
 * 5. Handle inverse relations on mutations
 * 6. Return formatted response
 * 
 * **Filter Support:**
 * - tiers: Filter by character tier (Core, Standard, Extended)
 * - type: Filter by character type (Player, NPC)
 * - lastEdited: Filter by modification date
 * 
 * **Relationships:**
 * - ownedElementIds ↔ Element.Owner (many-to-one)
 * - associatedElementIds (read-only rollup from timeline)
 * 
 * @see {@link createEntityRouter} for factory implementation
 * @see {@link transformCharacter} for data transformation
 * @see {@link buildCharacterFilters} for filter construction
 */
const router = createEntityRouter({
  databaseId: CHARACTERS_DATABASE_ID,
  entityName: 'character',
  transform: transformCharacter,
  toNotionProps: toNotionCharacterProperties,
  buildFilters: buildCharacterFilters,
  inverseRelations: characterInverseRelations
});

export default router;