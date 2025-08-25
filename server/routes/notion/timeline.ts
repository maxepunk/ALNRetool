/**
 * Timeline Events API Router
 * 
 * Express router for handling timeline event CRUD operations.
 * Timeline events represent chronological story points in the murder mystery.
 * 
 * @module server/routes/notion/timeline
 * 
 * **Architecture:**
 * - Built on createEntityRouter factory pattern
 * - No filtering support (simple chronological list)
 * - No inverse relations currently
 * - Date-based ordering for chronological display
 * 
 * **Endpoints:**
 * - GET /api/notion/timeline - List timeline events with pagination
 * - GET /api/notion/timeline/:id - Get single timeline event
 * - PUT /api/notion/timeline/:id - Update timeline event
 * - DELETE /api/notion/timeline/:id - Delete timeline event
 * 
 * **Event Properties:**
 * - description: Event title/description
 * - date: When the event occurred
 * - notes: Additional details
 * - charactersInvolvedIds: Related characters
 * - memoryEvidenceIds: Related evidence/memories
 */

import { createEntityRouter } from './createEntityRouter.js';
import { transformTimelineEvent } from '../../../src/types/notion/transforms.js';
import { toNotionTimelineProperties } from '../../services/notionPropertyMappers.js';
import config from '../../config/index.js';

/**
 * Notion database ID for timeline events collection.
 * @constant {string}
 */
const TIMELINE_DATABASE_ID = config.notionDatabaseIds.timeline;

/**
 * Create Express router for timeline event endpoints.
 * Minimal configuration as timeline events are straightforward.
 * 
 * @constant {Router} router
 * 
 * **Configuration:**
 * - Transform: Converts Notion → App format
 * - ToNotionProps: Converts App → Notion format
 * - No filters: Timeline events are typically shown in chronological order
 * - No inverse relations: Relationships are one-way references
 * 
 * **Request Flow:**
 * 1. Request hits router endpoint
 * 2. Pagination validation
 * 3. Notion API query (no filters)
 * 4. Transform response to app format
 * 5. Return formatted response
 * 
 * **Usage Notes:**
 * Timeline events are typically displayed in chronological order
 * based on their date field. Filtering is usually done client-side
 * by character involvement or date range.
 * 
 * @see {@link createEntityRouter} for factory implementation
 * @see {@link transformTimelineEvent} for data transformation
 * @see {@link toNotionTimelineProperties} for property mapping
 */
export default createEntityRouter({
  databaseId: TIMELINE_DATABASE_ID,
  entityName: 'timeline',
  transform: transformTimelineEvent,
  toNotionProps: toNotionTimelineProperties
});