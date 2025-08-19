/**
 * Timeline events API routes
 */

import { createEntityRouter } from './createEntityRouter.js';
import { transformTimelineEvent } from '../../../src/types/notion/transforms.js';
import { toNotionTimelineProperties } from '../../services/notionPropertyMappers.js';

const TIMELINE_DATABASE_ID = process.env.NOTION_TIMELINE_DB || 
  '1b52f33d-583f-80de-ae5a-d20020c120dd';

export default createEntityRouter({
  databaseId: TIMELINE_DATABASE_ID,
  entityName: 'timeline',
  transform: transformTimelineEvent,
  toNotionProps: toNotionTimelineProperties
});