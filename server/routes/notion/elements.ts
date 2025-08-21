/**
 * Elements API routes with bidirectional inverse relations
 */

import { createEntityRouter, type InverseRelation } from './createEntityRouter.js';
import { buildElementFilters } from '../../services/filterBuilder.js';
import { transformElement, elementToNotionProps } from '../../../src/types/notion/transforms.js';

const ELEMENTS_DATABASE_ID = process.env.NOTION_ELEMENTS_DB || 
  '18c2f33d-583f-8020-91bc-d84c7dd94306';

const PUZZLES_DATABASE_ID = process.env.NOTION_PUZZLES_DB || 
  '1b62f33d-583f-80cc-87cf-d7d6c4b0b265';

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