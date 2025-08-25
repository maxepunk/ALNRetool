/**
 * Puzzles API routes with bidirectional inverse relations
 */

import { createEntityRouter, type InverseRelation } from './createEntityRouter.js';
import { buildPuzzleFilters } from '../../services/filterBuilder.js';
import { transformPuzzle, puzzleToNotionProps } from '../../../src/types/notion/transforms.js';
import config from '../../config/index.js';

const PUZZLES_DATABASE_ID = config.notionDatabaseIds.puzzles;

const ELEMENTS_DATABASE_ID = config.notionDatabaseIds.elements;

// Define inverse relations for puzzles
const puzzleInverseRelations: InverseRelation[] = [
  {
    sourceField: 'rewardIds',
    targetDatabaseId: ELEMENTS_DATABASE_ID,
    targetField: 'Rewarded by (Puzzle)',
    relationType: 'many-to-many',
    bidirectional: true
  }
];

// Create router with enhanced configuration
const router = createEntityRouter({
  databaseId: PUZZLES_DATABASE_ID,
  entityName: 'puzzles',
  transform: transformPuzzle,
  toNotionProps: puzzleToNotionProps,
  buildFilters: buildPuzzleFilters,
  inverseRelations: puzzleInverseRelations
});

export default router;