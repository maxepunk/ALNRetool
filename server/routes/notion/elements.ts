/**
 * Elements API Router
 * 
 * Express router for handling element entity CRUD operations.
 * Implements bidirectional relationship synchronization with puzzles.
 * 
 * @module server/routes/notion/elements
 * 
 * **Architecture:**
 * - Built on createEntityRouter factory pattern
 * - Automatic inverse relation handling
 * - Bidirectional puzzle-element relationships
 * - Filter support for complex queries
 * 
 * **Endpoints:**
 * - GET /api/notion/elements - List elements with pagination
 * - GET /api/notion/elements/:id - Get single element
 * - PUT /api/notion/elements/:id - Update element
 * - DELETE /api/notion/elements/:id - Delete element
 * 
 * **Relationships:**
 * - requiredForPuzzleIds ↔ Puzzle.PuzzleElements (many-to-many)
 * - rewardedByPuzzleIds ↔ Puzzle.Rewards (many-to-many)
 */

import { createEntityRouter, type InverseRelation } from './createEntityRouter.js';
import { buildElementFilters } from '../../services/filterBuilder.js';
import { transformElement } from '../../../src/types/notion/transforms.js';
import { toNotionElementProperties } from '../../services/notionPropertyMappers.js';
import config from '../../config/index.js';

/**
 * Notion database ID for elements collection.
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
 * Inverse relation configuration for elements.
 * Defines how element updates propagate to related puzzles.
 * 
 * @constant {InverseRelation[]} elementInverseRelations
 * 
 * **Relation Types:**
 * 1. **requiredForPuzzleIds**: Elements required by puzzles
 *    - Updates Puzzle.PuzzleElements field
 *    - Many-to-many bidirectional
 * 
 * 2. **rewardedByPuzzleIds**: Elements rewarded by puzzles
 *    - Updates Puzzle.Rewards field
 *    - Many-to-many bidirectional
 * 
 * **Synchronization:**
 * When an element's puzzle relationships change, the corresponding
 * puzzle records are automatically updated to maintain consistency.
 */
const elementInverseRelations: InverseRelation[] = [
  {
    sourceField: 'requiredForPuzzleIds',
    targetDatabaseId: PUZZLES_DATABASE_ID,
    targetField: 'Puzzle Elements',
    relationType: 'many-to-many',
    bidirectional: true
  },
  {
    sourceField: 'rewardedByPuzzleIds',
    targetDatabaseId: PUZZLES_DATABASE_ID,
    targetField: 'Rewards',
    relationType: 'many-to-many',
    bidirectional: true
  }
];

/**
 * Create Express router for element endpoints.
 * Configures all CRUD operations with proper transforms and relations.
 * 
 * @constant {Router} router
 * 
 * **Configuration:**
 * - Transform: Converts Notion → App format
 * - ToNotionProps: Converts App → Notion format
 * - BuildFilters: Constructs Notion query filters
 * - InverseRelations: Bidirectional sync configuration
 * 
 * **Request Flow:**
 * 1. Request hits router endpoint
 * 2. Pagination/filter validation
 * 3. Notion API query with filters
 * 4. Transform response to app format
 * 5. Handle inverse relations on mutations
 * 6. Return formatted response
 * 
 * @see {@link createEntityRouter} for factory implementation
 * @see {@link transformElement} for data transformation
 */
const router = createEntityRouter({
  databaseId: ELEMENTS_DATABASE_ID,
  entityName: 'elements',
  transform: transformElement,
  toNotionProps: toNotionElementProperties,
  buildFilters: buildElementFilters,
  inverseRelations: elementInverseRelations
});

export default router;