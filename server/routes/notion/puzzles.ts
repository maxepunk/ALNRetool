/**
 * Puzzles API routes with bidirectional inverse relations
 */

import { createEntityRouter, type InverseRelation } from './createEntityRouter.js';
import { buildPuzzleFilters } from '../../services/filterBuilder.js';
import { transformPuzzle, puzzleToNotionProps } from '../../../src/types/notion/transforms.js';

const PUZZLES_DATABASE_ID = process.env.NOTION_PUZZLES_DB || 
  '1b62f33d-583f-80cc-87cf-d7d6c4b0b265';

const ELEMENTS_DATABASE_ID = process.env.NOTION_ELEMENTS_DB || 
  '18c2f33d-583f-8020-91bc-d84c7dd94306';

// Define inverse relations for puzzles
const puzzleInverseRelations: InverseRelation[] = [
  {
    sourceField: 'rewardIds',
    targetDatabaseId: ELEMENTS_DATABASE_ID,
    targetField: 'Rewarded by puzzles',
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