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

import { createEntityRouter } from './createEntityRouter.js';
import { buildCharacterFilters } from '../../services/filterBuilder.js';
import { transformCharacter, characterToNotionProps } from '../../../src/types/notion/transforms.js';
import config from '../../config/index.js';

/**
 * Notion database ID for characters collection.
 * @constant {string}
 */
const CHARACTERS_DATABASE_ID = config.notionDatabaseIds.characters;

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
 * - InverseRelations: Empty array (no inverse relations yet)
 * 
 * **Request Flow:**
 * 1. Request hits router endpoint
 * 2. Pagination/filter validation
 * 3. Notion API query with filters
 * 4. Transform response to app format
 * 5. Return formatted response
 * 
 * **Filter Support:**
 * - tiers: Filter by character tier (Core, Standard, Extended)
 * - type: Filter by character type (Player, NPC)
 * - lastEdited: Filter by modification date
 * 
 * **Future Expansion:**
 * The inverse relations array is empty but the infrastructure is ready
 * for future bidirectional relationships with other entities.
 * 
 * @see {@link createEntityRouter} for factory implementation
 * @see {@link transformCharacter} for data transformation
 * @see {@link buildCharacterFilters} for filter construction
 */
const router = createEntityRouter({
  databaseId: CHARACTERS_DATABASE_ID,
  entityName: 'characters',
  transform: transformCharacter,
  toNotionProps: characterToNotionProps,
  buildFilters: buildCharacterFilters,
  inverseRelations: [] // No inverse relations for characters yet
});

export default router;