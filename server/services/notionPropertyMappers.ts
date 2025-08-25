/**
 * Notion Property Mappers
 * 
 * Functions to convert application entity types back to Notion API property format.
 * Handles transformation from our normalized app types to Notion's property schema.
 * 
 * @module server/services/notionPropertyMappers
 * 
 * **Architecture:**
 * - Type-safe property conversion
 * - Preserves SF_ patterns in element descriptions
 * - Handles all Notion property types (title, rich_text, select, relation, etc.)
 * - Entity-specific converters for each database
 * 
 * **Usage:**
 * ```typescript
 * const properties = toNotionProperties('elements', {
 *   name: 'Updated Name',
 *   status: 'Active'
 * });
 * // Returns Notion-formatted properties ready for API
 * ```
 * 
 * **Property Type Mapping:**
 * - string → title/rich_text
 * - string → select (single option)
 * - string[] → multi_select
 * - string[] → relation (IDs)
 * - Date/string → date
 * - string → url
 * - File[] → files (external URLs)
 */

import type {
  Character,
  Element,
  Puzzle,
  TimelineEvent,
} from '../../src/types/notion/app.js';

/**
 * Convert plain text to Notion title property format.
 * Title properties are used for primary identifiers (Name fields).
 * 
 * @function toNotionTitle
 * @param {string} text - Plain text to convert
 * @returns {Object} Notion title property object
 * 
 * @example
 * toNotionTitle('My Item Name')
 * // Returns: { title: [{ type: 'text', text: { content: 'My Item Name' } }] }
 */
function toNotionTitle(text: string) {
  return {
    title: [
      {
        type: 'text',
        text: { content: text },
      },
    ],
  };
}

/**
 * Convert plain text to Notion rich text property format.
 * Rich text properties support formatting and are used for descriptions, notes, etc.
 * 
 * @function toNotionRichText
 * @param {string} text - Plain text to convert
 * @returns {Object} Notion rich text property object
 * 
 * @example
 * toNotionRichText('Description text')
 * // Returns: { rich_text: [{ type: 'text', text: { content: 'Description text' } }] }
 */
function toNotionRichText(text: string) {
  return {
    rich_text: [
      {
        type: 'text',
        text: { content: text },
      },
    ],
  };
}

/**
 * Convert a value to Notion select property format.
 * Select properties are single-choice dropdowns.
 * 
 * @function toNotionSelect
 * @param {string | null} value - Selected option or null
 * @returns {Object} Notion select property object
 * 
 * @example
 * toNotionSelect('Active')
 * // Returns: { select: { name: 'Active' } }
 */
function toNotionSelect(value: string | null) {
  return {
    select: value ? { name: value } : null,
  };
}

/**
 * Convert array to Notion multi-select property format.
 * Multi-select properties are multiple-choice tags.
 * 
 * @function toNotionMultiSelect
 * @param {string[]} values - Array of selected options
 * @returns {Object} Notion multi-select property object
 * 
 * @example
 * toNotionMultiSelect(['Tag1', 'Tag2'])
 * // Returns: { multi_select: [{ name: 'Tag1' }, { name: 'Tag2' }] }
 */
function toNotionMultiSelect(values: string[]) {
  return {
    multi_select: values.map(v => ({ name: v })),
  };
}

/**
 * Convert entity IDs to Notion relation property format.
 * Relations link to other database items.
 * 
 * @function toNotionRelation
 * @param {string[]} ids - Array of Notion page IDs
 * @returns {Object} Notion relation property object
 * 
 * @example
 * toNotionRelation(['abc123', 'def456'])
 * // Returns: { relation: [{ id: 'abc123' }, { id: 'def456' }] }
 */
function toNotionRelation(ids: string[]) {
  return {
    relation: ids.map(id => ({ id })),
  };
}

/**
 * Convert status string to Notion status property format.
 * Status properties are workflow states with colors.
 * 
 * @function toNotionStatus
 * @param {string} status - Status name
 * @returns {Object} Notion status property object
 */
function toNotionStatus(status: string) {
  return {
    status: { name: status },
  };
}

/**
 * Convert date string to Notion date property format.
 * Supports ISO 8601 date strings.
 * 
 * @function toNotionDate
 * @param {string | null} date - ISO date string or null
 * @returns {Object} Notion date property object
 */
function toNotionDate(date: string | null) {
  return {
    date: date ? { start: date } : null,
  };
}

/**
 * Convert URL string to Notion URL property format.
 * 
 * @function toNotionUrl
 * @param {string | null} url - URL string or null
 * @returns {Object} Notion URL property object
 */
function toNotionUrl(url: string | null) {
  return {
    url: url || null,
  };
}

/**
 * Convert file array to Notion files property format.
 * Files are stored as external URLs in Notion.
 * 
 * @function toNotionFiles
 * @param {Array} files - Array of file objects with name and URL
 * @returns {Object} Notion files property object
 * 
 * @example
 * toNotionFiles([{ name: 'image.png', url: 'https://example.com/image.png' }])
 */
function toNotionFiles(files: Array<{ name: string; url: string }>) {
  return {
    files: files.map(file => ({
      type: 'external',
      name: file.name,
      external: {
        url: file.url,
      },
    })),
  };
}

/**
 * Preserve SF_ patterns in element descriptions.
 * SF_ patterns are semantic markers used for puzzle connections.
 * This function ensures they remain intact during updates.
 * 
 * @function preserveSFPatterns
 * @param {string} description - Description containing SF_ patterns
 * @returns {string} Description with patterns preserved
 * 
 * @example
 * preserveSFPatterns('Contains SF_KEY_001 and SF_LOCK_002')
 * // Returns unchanged: 'Contains SF_KEY_001 and SF_LOCK_002'
 */
function preserveSFPatterns(description: string): string {
  // This function ensures SF_ patterns remain intact
  // The patterns are already in the description, just return it
  return description;
}

/**
 * Main converter function that routes to entity-specific converters.
 * Transforms app entity updates to Notion property format.
 * 
 * @function toNotionProperties
 * @param {string} entityType - Type of entity ('characters', 'elements', 'puzzles', 'timeline')
 * @param {Partial} updates - Partial entity object with fields to update
 * @returns {Record<string, any>} Notion-formatted properties object
 * @throws {Error} If entityType is unknown
 * 
 * @example
 * const props = toNotionProperties('elements', {
 *   name: 'Updated Element',
 *   status: 'Complete',
 *   requiredForPuzzleIds: ['puzzle-1', 'puzzle-2']
 * });
 * // Returns Notion properties ready for API update
 */
export function toNotionProperties(
  entityType: 'characters' | 'elements' | 'puzzles' | 'timeline',
  updates: Partial<Character | Element | Puzzle | TimelineEvent>
): Record<string, any> {
  switch (entityType) {
    case 'characters':
      return toNotionCharacterProperties(updates as Partial<Character>);
    case 'elements':
      return toNotionElementProperties(updates as Partial<Element>);
    case 'puzzles':
      return toNotionPuzzleProperties(updates as Partial<Puzzle>);
    case 'timeline':
      return toNotionTimelineProperties(updates as Partial<TimelineEvent>);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Convert Character entity updates to Notion properties.
 * Maps Character fields to Notion database columns.
 * 
 * @function toNotionCharacterProperties
 * @param {Partial<Character>} updates - Character fields to update
 * @returns {Record<string, any>} Notion properties for Character database
 * 
 * **Field Mappings:**
 * - name → Name (title)
 * - type → Player or NPC (select)
 * - tier → Tier (select)
 * - primaryAction → Primary action (rich_text)
 * - characterLogline → Character logline (rich_text)
 * - overview → Overview (rich_text)
 * - emotionTowardsCEO → Emotion towards CEO (rich_text)
 * - ownedElementIds → Owned elements (relation)
 * - associatedElementIds → Associated elements (relation)
 * - characterPuzzleIds → Character puzzles (relation)
 * - eventIds → Events (relation)
 * - connections → Character Connections (relation)
 */
export function toNotionCharacterProperties(updates: Partial<Character>) {
  const properties: Record<string, any> = {};

  // Map app fields to Notion properties
  if (updates.name !== undefined) {
    properties['Name'] = toNotionTitle(updates.name);
  }
  
  if (updates.type !== undefined) {
    properties['Player or NPC'] = toNotionSelect(updates.type);
  }
  
  if (updates.tier !== undefined) {
    properties['Tier'] = toNotionSelect(updates.tier);
  }
  
  if (updates.primaryAction !== undefined) {
    properties['Primary action'] = toNotionRichText(updates.primaryAction || '');
  }
  
  if (updates.characterLogline !== undefined) {
    properties['Character logline'] = toNotionRichText(updates.characterLogline || '');
  }
  
  if (updates.overview !== undefined) {
    properties['Overview'] = toNotionRichText(updates.overview || '');
  }
  
  if (updates.emotionTowardsCEO !== undefined) {
    properties['Emotion towards CEO'] = toNotionRichText(updates.emotionTowardsCEO || '');
  }
  
  // Relation fields
  if (updates.ownedElementIds !== undefined) {
    properties['Owned elements'] = toNotionRelation(updates.ownedElementIds);
  }
  
  if (updates.associatedElementIds !== undefined) {
    properties['Associated elements'] = toNotionRelation(updates.associatedElementIds);
  }
  
  if (updates.characterPuzzleIds !== undefined) {
    properties['Character puzzles'] = toNotionRelation(updates.characterPuzzleIds);
  }
  
  if (updates.eventIds !== undefined) {
    properties['Events'] = toNotionRelation(updates.eventIds);
  }
  
  if (updates.connections !== undefined) {
    properties['Character Connections'] = toNotionRelation(updates.connections);
  }

  return properties;
}

/**
 * Convert Element entity updates to Notion properties.
 * Maps Element fields to Notion database columns.
 * Preserves SF_ patterns in descriptions for puzzle connectivity.
 * 
 * @function toNotionElementProperties
 * @param {Partial<Element>} updates - Element fields to update
 * @returns {Record<string, any>} Notion properties for Element database
 * 
 * **Field Mappings:**
 * - name → Name (title)
 * - descriptionText → Description (rich_text, SF_ patterns preserved)
 * - basicType → Basic Type (select)
 * - status → Status (status)
 * - firstAvailable → First Available (select)
 * - productionNotes → Production Notes (rich_text)
 * - contentLink → Content Link (url)
 * - ownerId → Owner (relation, single)
 * - containerId → Container (relation, single)
 * - contentIds → Contents (relation, multiple)
 * - requiredForPuzzleIds → Required For (Puzzle) (relation)
 * - rewardedByPuzzleIds → Rewarded by (Puzzle) (relation)
 * - associatedCharacterIds → Associated characters (relation)
 * - narrativeThreads → Narrative threads (multi_select)
 * - filesMedia → Files & media (files)
 * 
 * **Note:** sfPatterns, puzzleChain, isContainer are computed fields (read-only)
 */
export function toNotionElementProperties(updates: Partial<Element>) {
  const properties: Record<string, any> = {};

  if (updates.name !== undefined) {
    properties['Name'] = toNotionTitle(updates.name);
  }
  
  if (updates.descriptionText !== undefined) {
    // Preserve SF_ patterns when updating description
    properties['Description'] = toNotionRichText(
      preserveSFPatterns(updates.descriptionText)
    );
  }
  
  if (updates.basicType !== undefined) {
    properties['Basic Type'] = toNotionSelect(updates.basicType);
  }
  
  if (updates.status !== undefined) {
    properties['Status'] = toNotionStatus(updates.status);
  }
  
  if (updates.firstAvailable !== undefined) {
    properties['First Available'] = toNotionSelect(updates.firstAvailable);
  }
  
  if (updates.productionNotes !== undefined) {
    properties['Production Notes'] = toNotionRichText(updates.productionNotes || '');
  }
  
  if (updates.contentLink !== undefined) {
    properties['Content Link'] = toNotionUrl(updates.contentLink || null);
  }
  
  // Relation fields
  if (updates.ownerId !== undefined) {
    properties['Owner'] = toNotionRelation(updates.ownerId ? [updates.ownerId] : []);
  }
  
  if (updates.containerId !== undefined) {
    properties['Container'] = toNotionRelation(updates.containerId ? [updates.containerId] : []);
  }
  
  if (updates.contentIds !== undefined) {
    properties['Contents'] = toNotionRelation(updates.contentIds);
  }
  
  if (updates.requiredForPuzzleIds !== undefined) {
    properties['Required For (Puzzle)'] = toNotionRelation(updates.requiredForPuzzleIds);
  }
  
  if (updates.rewardedByPuzzleIds !== undefined) {
    properties['Rewarded by (Puzzle)'] = toNotionRelation(updates.rewardedByPuzzleIds);
  }
  
  if (updates.associatedCharacterIds !== undefined) {
    properties['Associated characters'] = toNotionRelation(updates.associatedCharacterIds);
  }
  
  // Array fields (narrative threads)
  if (updates.narrativeThreads !== undefined) {
    properties['Narrative threads'] = toNotionMultiSelect(updates.narrativeThreads);
  }
  
  // Files field
  if (updates.filesMedia !== undefined) {
    properties['Files & media'] = toNotionFiles(updates.filesMedia);
  }
  
  // Note: sfPatterns, puzzleChain, isContainer are computed fields - not writable

  return properties;
}

/**
 * Convert Puzzle entity updates to Notion properties.
 * Maps Puzzle fields to Notion database columns.
 * 
 * @function toNotionPuzzleProperties
 * @param {Partial<Puzzle>} updates - Puzzle fields to update
 * @returns {Record<string, any>} Notion properties for Puzzle database
 * 
 * **Field Mappings:**
 * - name → Name (title)
 * - descriptionSolution → Description/Solution (rich_text)
 * - assetLink → Asset Link (url)
 * - puzzleElementIds → Puzzle elements (relation)
 * - lockedItemId → Locked item (relation, single)
 * - rewardIds → Rewards (relation, multiple)
 * - parentItemId → Parent item (relation, single)
 * - subPuzzleIds → Sub-puzzles (relation, multiple)
 */
export function toNotionPuzzleProperties(updates: Partial<Puzzle>) {
  const properties: Record<string, any> = {};

  if (updates.name !== undefined) {
    properties['Name'] = toNotionTitle(updates.name);
  }
  
  if (updates.descriptionSolution !== undefined) {
    properties['Description/Solution'] = toNotionRichText(updates.descriptionSolution || '');
  }
  
  if (updates.assetLink !== undefined) {
    properties['Asset Link'] = toNotionUrl(updates.assetLink || null);
  }
  
  // Relation fields
  if (updates.puzzleElementIds !== undefined) {
    properties['Puzzle elements'] = toNotionRelation(updates.puzzleElementIds);
  }
  
  if (updates.lockedItemId !== undefined) {
    properties['Locked item'] = toNotionRelation(updates.lockedItemId ? [updates.lockedItemId] : []);
  }
  
  if (updates.rewardIds !== undefined) {
    properties['Rewards'] = toNotionRelation(updates.rewardIds);
  }
  
  if (updates.parentItemId !== undefined) {
    properties['Parent item'] = toNotionRelation(updates.parentItemId ? [updates.parentItemId] : []);
  }
  
  if (updates.subPuzzleIds !== undefined) {
    properties['Sub-puzzles'] = toNotionRelation(updates.subPuzzleIds);
  }

  return properties;
}

/**
 * Convert TimelineEvent entity updates to Notion properties.
 * Maps TimelineEvent fields to Notion database columns.
 * 
 * @function toNotionTimelineProperties
 * @param {Partial<TimelineEvent>} updates - Timeline event fields to update
 * @returns {Record<string, any>} Notion properties for Timeline database
 * 
 * **Field Mappings:**
 * - description → Description (title)
 * - date → Date (date)
 * - notes → Notes (rich_text)
 * - charactersInvolvedIds → Characters involved (relation)
 * - memoryEvidenceIds → Memory/Evidence (relation)
 */
export function toNotionTimelineProperties(updates: Partial<TimelineEvent>) {
  const properties: Record<string, any> = {};

  if (updates.description !== undefined) {
    properties['Description'] = toNotionTitle(updates.description);
  }
  
  if (updates.date !== undefined) {
    properties['Date'] = toNotionDate(updates.date);
  }
  
  if (updates.notes !== undefined) {
    properties['Notes'] = toNotionRichText(updates.notes || '');
  }
  
  // Relation fields
  if (updates.charactersInvolvedIds !== undefined) {
    properties['Characters involved'] = toNotionRelation(updates.charactersInvolvedIds);
  }
  
  if (updates.memoryEvidenceIds !== undefined) {
    properties['Memory/Evidence'] = toNotionRelation(updates.memoryEvidenceIds);
  }

  return properties;
}