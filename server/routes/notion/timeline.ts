/**
 * Timeline events API routes
 */

import { createEntityRouter } from './createEntityRouter.js';
import { transformTimelineEvent } from '../../../src/types/notion/transforms.js';
import { toNotionTimelineProperties } from '../../services/notionPropertyMappers.js';
import config from '../../config/index.js';

const TIMELINE_DATABASE_ID = config.notionDatabaseIds.timeline;

export default createEntityRouter({
  databaseId: TIMELINE_DATABASE_ID,
  entityName: 'timeline',
  transform: transformTimelineEvent,
  toNotionProps: toNotionTimelineProperties
});