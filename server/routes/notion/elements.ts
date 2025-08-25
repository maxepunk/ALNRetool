/**
 * Elements API routes with bidirectional inverse relations
 */

import { createEntityRouter, type InverseRelation } from './createEntityRouter.js';
import { buildElementFilters } from '../../services/filterBuilder.js';
import { transformElement, elementToNotionProps } from '../../../src/types/notion/transforms.js';
import config from '../../config/index.js';

const ELEMENTS_DATABASE_ID = config.notionDatabaseIds.elements;

const PUZZLES_DATABASE_ID = config.notionDatabaseIds.puzzles;

// Define inverse relations for elements
const elementInverseRelations: InverseRelation[] = [
  {
    sourceField: 'requiredForPuzzleIds',
    targetDatabaseId: PUZZLES_DATABASE_ID,
    targetField: 'requiredElements',
    relationType: 'many-to-many',
    bidirectional: true
  },
  {
    sourceField: 'rewardedByPuzzleIds',
    targetDatabaseId: PUZZLES_DATABASE_ID,
    targetField: 'rewardElements',
    relationType: 'many-to-many',
    bidirectional: true
  }
];

// Create router with enhanced configuration
const router = createEntityRouter({
  databaseId: ELEMENTS_DATABASE_ID,
  entityName: 'elements',
  transform: transformElement,
  toNotionProps: elementToNotionProps,
  buildFilters: buildElementFilters,
  inverseRelations: elementInverseRelations
});

export default router;