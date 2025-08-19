/**
 * Puzzles API routes
 */

import { createEntityRouter } from './createEntityRouter.js';
import { transformPuzzle } from '../../../src/types/notion/transforms.js';
import { toNotionPuzzleProperties } from '../../services/notionPropertyMappers.js';

const PUZZLES_DATABASE_ID = process.env.NOTION_PUZZLES_DB || 
  '1b62f33d-583f-80cc-87cf-d7d6c4b0b265';

export default createEntityRouter({
  databaseId: PUZZLES_DATABASE_ID,
  entityName: 'puzzles',
  transform: transformPuzzle,
  toNotionProps: toNotionPuzzleProperties
});