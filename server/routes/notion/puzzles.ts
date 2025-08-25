/**
 * Puzzles API Router
 * 
 * Express router for handling puzzle entity CRUD operations.
 * Implements bidirectional relationship synchronization with elements.
 * 
 * @module server/routes/notion/puzzles
 * 
 * **Architecture:**
 * - Built on createEntityRouter factory pattern
 * - Automatic inverse relation handling
 * - Bidirectional element-puzzle relationships
 * - Filter support for acts, status, and date queries
 * 
 * **Endpoints:**
 * - GET /api/notion/puzzles - List puzzles with pagination
 * - GET /api/notion/puzzles/:id - Get single puzzle
 * - PUT /api/notion/puzzles/:id - Update puzzle
 * - DELETE /api/notion/puzzles/:id - Delete puzzle
 * 
 * **Relationships:**
 * - puzzleElementIds ↔ Element.RequiredFor (many-to-many)
 * - rewardIds ↔ Element.RewardedBy (many-to-many)
 */

import { createEntityRouter, type InverseRelation } from './createEntityRouter.js';
import { buildPuzzleFilters } from '../../services/filterBuilder.js';
import { transformPuzzle, puzzleToNotionProps } from '../../../src/types/notion/transforms.js';
import config from '../../config/index.js';

/**
 * Notion database ID for puzzles collection.
 * @constant {string}
 */
const PUZZLES_DATABASE_ID = config.notionDatabaseIds.puzzles;

/**
 * Notion database ID for elements collection.
 * Used for inverse relation updates.
 * @constant {string}
 */
const ELEMENTS_DATABASE_ID = config.notionDatabaseIds.elements;

/**
 * Inverse relation configuration for puzzles.
 * Defines how puzzle updates propagate to related elements.
 * 
 * @constant {InverseRelation[]} puzzleInverseRelations
 * 
 * **Relation Types:**
 * 1. **puzzleElementIds**: Elements required for puzzle
 *    - Updates Element.RequiredFor field
 *    - Many-to-many bidirectional
 * 
 * 2. **rewardIds**: Elements rewarded by puzzle
 *    - Updates Element.RewardedBy field
 *    - Many-to-many bidirectional
 * 
 * **Synchronization:**
 * When a puzzle's element relationships change, the corresponding
 * element records are automatically updated to maintain consistency.
 * This ensures data integrity across the bidirectional relationships.
 */
const puzzleInverseRelations: InverseRelation[] = [
  {
    sourceField: 'puzzleElementIds',
    targetDatabaseId: ELEMENTS_DATABASE_ID,
    targetField: 'Required for (Puzzle)',
    relationType: 'many-to-many',
    bidirectional: true
  },
  {
    sourceField: 'rewardIds',
    targetDatabaseId: ELEMENTS_DATABASE_ID,
    targetField: 'Rewarded by (Puzzle)',
    relationType: 'many-to-many',
    bidirectional: true
  }
];

/**
 * Create Express router for puzzle endpoints.
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
 * **Filter Support:**
 * - acts: Filter by game act (Act1, Act2, Act3)
 * - status: Filter by puzzle status
 * - lastEdited: Filter by modification date
 * 
 * @see {@link createEntityRouter} for factory implementation
 * @see {@link transformPuzzle} for data transformation
 * @see {@link buildPuzzleFilters} for filter construction
 */
const router = createEntityRouter({
  databaseId: PUZZLES_DATABASE_ID,
  entityName: 'puzzles',
  transform: transformPuzzle,
  toNotionProps: puzzleToNotionProps,
  buildFilters: buildPuzzleFilters,
  inverseRelations: puzzleInverseRelations
});

export default router;