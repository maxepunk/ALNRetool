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

import { createEntityRouter, type InverseRelation } from './createEntityRouter.js';
import { transformTimelineEvent } from '../../../src/types/notion/transforms.js';
import { toNotionTimelineProperties } from '../../services/notionPropertyMappers.js';
import config from '../../config/index.js';
import type { TimelineEvent } from '../../../src/types/notion/app.js';

/**
 * Notion database ID for timeline events collection.
 * @constant {string}
 */
const TIMELINE_DATABASE_ID = config.notionDatabaseIds.timeline;

/**
 * Notion database ID for characters collection.
 * Used for inverse relation updates.
 * @constant {string}
 */
const CHARACTERS_DATABASE_ID = config.notionDatabaseIds.characters;

/**
 * Notion database ID for elements collection.
 * Used for inverse relation updates.
 * @constant {string}
 */
const ELEMENTS_DATABASE_ID = config.notionDatabaseIds.elements;

/**
 * Inverse relation configuration for timeline events.
 * Defines how timeline updates propagate to related characters and elements.
 * 
 * @constant {InverseRelation[]} timelineInverseRelations
 * 
 * **Relation Types:**
 * 1. **charactersInvolvedIds**: Characters involved in this timeline event
 *    - Updates Character.Events field
 *    - Many-to-many bidirectional
 * 
 * 2. **memoryEvidenceIds**: Elements that are memories/evidence from this event
 *    - Updates Element.TimelineEvent field
 *    - Many-to-one bidirectional (many elements can reference one timeline event)
 * 
 * **Synchronization:**
 * When a timeline event's relationships change, the corresponding
 * character and element records are automatically updated to maintain consistency.
 */
const timelineInverseRelations: InverseRelation[] = [
  {
    sourceField: 'charactersInvolvedIds',
    targetDatabaseId: CHARACTERS_DATABASE_ID,
    targetField: 'Events',
    relationType: 'many-to-many',
    bidirectional: true
  },
  {
    sourceField: 'memoryEvidenceIds',
    targetDatabaseId: ELEMENTS_DATABASE_ID,
    targetField: 'Timeline Event',
    relationType: 'many-to-many',  // Many elements can be evidence from many timeline events
    bidirectional: true
  }
];

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
 * - InverseRelations: Bidirectional sync with Characters and Elements
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
export default createEntityRouter<TimelineEvent>({
  databaseId: TIMELINE_DATABASE_ID,
  entityName: 'timeline',
  entityType: 'timeline',
  transform: transformTimelineEvent,
  toNotionProps: toNotionTimelineProperties,
  inverseRelations: timelineInverseRelations
});