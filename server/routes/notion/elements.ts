/**
 * Elements API routes
 */

import { createEntityRouter } from './createEntityRouter.js';
import { transformElement } from '../../../src/types/notion/transforms.js';
import { toNotionElementProperties } from '../../services/notionPropertyMappers.js';

const ELEMENTS_DATABASE_ID = process.env.NOTION_ELEMENTS_DB || 
  '18c2f33d-583f-8020-91bc-d84c7dd94306';

export default createEntityRouter({
  databaseId: ELEMENTS_DATABASE_ID,
  entityName: 'elements',
  transform: transformElement,
  toNotionProps: toNotionElementProperties
});