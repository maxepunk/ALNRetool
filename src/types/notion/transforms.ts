/**
 * Transform functions from raw Notion API data to clean app types
 * Pure functions for predictable transformations
 * 
 * @module types/notion/transforms
 * @description Provides pure functions to transform Notion's complex property
 * structure into clean, UI-friendly data types. All functions are idempotent
 * and handle missing/malformed data gracefully.
 */

import type { 
  NotionPage, 
  NotionProperty
} from './raw';

import type {
  Character,
  Element,
  Puzzle,
  TimelineEvent,
  SFPatterns,
  ElementBasicType,
  ElementStatus,
  Act
} from './app';

// Property extraction helpers
/**
 * Extracts plain text from a Notion title property
 * @param prop - Notion property that may be a title
 * @returns Plain text string or empty string if not a title
 */
export function getTitle(prop: NotionProperty | undefined): string {
  if (!prop || prop.type !== 'title') return '';
  return prop.title.map(t => t.plain_text).join('');
}

/**
 * Extracts plain text from a Notion rich text property
 * @param prop - Notion property that may be rich text
 * @returns Concatenated plain text or empty string
 */
export function getRichText(prop: NotionProperty | undefined): string {
  if (!prop || prop.type !== 'rich_text') return '';
  return prop.rich_text.map(t => t.plain_text).join('');
}

/**
 * Extracts the selected option from a Notion select property
 * @param prop - Notion property that may be a select
 * @returns Selected option name or null
 */
export function getSelect(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== 'select') return null;
  return prop.select?.name || null;
}

/**
 * Extracts all selected options from a Notion multi-select property
 * @param prop - Notion property that may be a multi-select
 * @returns Array of selected option names
 */
export function getMultiSelect(prop: NotionProperty | undefined): string[] {
  if (!prop || prop.type !== 'multi_select') return [];
  return prop.multi_select.map(s => s.name);
}

/**
 * Extracts the status from a Notion status property
 * @param prop - Notion property that may be a status
 * @returns Status name or null
 */
export function getStatus(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== 'status') return null;
  return prop.status?.name || null;
}

/**
 * Extracts related page IDs from a Notion relation property
 * @param prop - Notion property that may be a relation
 * @returns Array of related page IDs
 */
export function getRelationIds(prop: NotionProperty | undefined): string[] {
  if (!prop || prop.type !== 'relation') return [];
  return prop.relation.map(r => r.id);
}

export function getRollupArray(prop: NotionProperty | undefined): NotionProperty[] {
  if (!prop || prop.type !== 'rollup') return [];
  if (prop.rollup.type === 'array') {
    return prop.rollup.array;
  }
  return [];
}

export function getRollupStrings(prop: NotionProperty | undefined): string[] {
  const array = getRollupArray(prop);
  return array
    .map(item => {
      if (item.type === 'title') return getTitle(item);
      if (item.type === 'rich_text') return getRichText(item);
      if (item.type === 'select') return getSelect(item);
      return null;
    })
    .filter((s): s is string => s !== null);
}

export function getDate(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== 'date') return null;
  return prop.date?.start || null;
}

export function getFormula(prop: NotionProperty | undefined): string | number | boolean | null {
  if (!prop || prop.type !== 'formula') return null;
  const formula = prop.formula;
  if (formula.type === 'boolean') return formula.boolean;
  if (formula.type === 'string') return formula.string;
  if (formula.type === 'number') return formula.number;
  if (formula.type === 'date') return formula.date?.start || null;
  return null;
}

export function getUrl(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== 'url') return null;
  return prop.url;
}

// SF_ pattern parser
export function parseSFPatterns(text: string): SFPatterns {
  const patterns: SFPatterns = {};
  
  // Extract RFID - handle both template and actual values
  const rfidMatch = text.match(/SF_RFID:\s*\[([^\]]+)\]/);
  if (rfidMatch?.[1]) {
    // Skip template placeholders like "unique identifier" or "TBD"
    const value = rfidMatch[1].trim();
    if (value && !value.match(/^(unique identifier|TBD|TODO)$/i)) {
      patterns.rfid = value;
    }
  }
  
  // Extract ValueRating - handle both number and placeholder
  const valueMatch = text.match(/SF_ValueRating:\s*\[([^\]]+)\]/);
  if (valueMatch?.[1]) {
    const value = valueMatch[1].trim();
    // Try to parse as number, skip if it's a range like "1-5"
    if (value.match(/^\d+$/)) {
      patterns.valueRating = parseInt(value, 10);
    }
  }
  
  // Extract MemoryType
  const memoryMatch = text.match(/SF_MemoryType:\s*\[([^\]]+)\]/);
  if (memoryMatch?.[1]) {
    const value = memoryMatch[1].trim();
    // Match actual memory types, ignoring multiplier syntax
    const typeMatch = value.match(/^(Personal|Business|Technical)/i);
    if (typeMatch) {
      patterns.memoryType = typeMatch[1] as SFPatterns['memoryType'];
    }
  }
  
  // Extract Group - handle group name with multiplier
  const groupMatch = text.match(/SF_Group:\s*\[([^\]]+)\]/);
  if (groupMatch?.[1]) {
    const value = groupMatch[1].trim();
    // Skip template placeholders
    if (value && !value.match(/^\{.*\}$/)) {
      // Parse group name and multiplier
      const groupParseMatch = value.match(/^(.+?)\s*\(x(\d+(?:-\d+)?)\)$/);
      if (groupParseMatch?.[1] && groupParseMatch[2]) {
        patterns.group = {
          name: groupParseMatch[1].trim(),
          multiplier: groupParseMatch[2]
        };
      } else {
        // Just the group name without multiplier
        patterns.group = {
          name: value,
          multiplier: '1'
        };
      }
    }
  }
  
  return patterns;
}

// Transform functions for each database type
export function transformCharacter(page: NotionPage): Character {
  const props = page.properties;
  
  return {
    id: page.id,
    name: getTitle(props['Name']),
    lastEdited: page.last_edited_time,
    type: (getSelect(props['Type']) || 'NPC') as Character['type'],
    tier: (getSelect(props['Tier']) || 'Tertiary') as Character['tier'],
    ownedElementIds: getRelationIds(props['Owned Elements']),
    associatedElementIds: getRelationIds(props['Associated Elements']),
    characterPuzzleIds: getRelationIds(props['Character Puzzles']),
    eventIds: getRelationIds(props['Events']),
    connections: getRollupStrings(props['Connections']),
    primaryAction: getRichText(props['Primary Action']),
    characterLogline: getRichText(props['Character Logline']),
    overview: getRichText(props['Overview & Key Relationships']),
    emotionTowardsCEO: getRichText(props['Emotion towards CEO & others'])
  };
}

export function transformElement(page: NotionPage): Element {
  const props = page.properties;
  const descriptionText = getRichText(props['Description/Text']);
  
  return {
    id: page.id,
    name: getTitle(props['Name']),
    lastEdited: page.last_edited_time,
    descriptionText,
    sfPatterns: parseSFPatterns(descriptionText),
    basicType: (getSelect(props['Basic Type']) || 'Prop') as ElementBasicType,
    ownerId: getRelationIds(props['Owner'])[0],
    containerId: getRelationIds(props['Container'])[0],
    contentIds: getRelationIds(props['Contents']),
    timelineEventId: getRelationIds(props['Timeline Event'])[0],
    status: (getStatus(props['Status']) || 'Idea/Placeholder') as ElementStatus,
    firstAvailable: getSelect(props['First Available']) as Act,
    requiredForPuzzleIds: getRelationIds(props['Required for puzzles']),
    rewardedByPuzzleIds: getRelationIds(props['Rewarded by puzzles']),
    containerPuzzleId: getRelationIds(props['Container Puzzle'])[0],
    narrativeThreads: getMultiSelect(props['Narrative Threads']),
    associatedCharacterIds: getRollupStrings(props['Associated Characters']),
    puzzleChain: getRollupStrings(props['Puzzle Chain']),
    productionNotes: getRichText(props['Production/Puzzle Notes']),
    filesMedia: [], // TODO: Parse files when needed
    contentLink: getUrl(props['Content Link']) || undefined,
    isContainer: getFormula(props['Container?']) === true
  };
}

export function transformPuzzle(page: NotionPage): Puzzle {
  const props = page.properties;
  
  return {
    id: page.id,
    name: getTitle(props['Puzzle']),
    lastEdited: page.last_edited_time,
    descriptionSolution: getRichText(props['Description/Solution']),
    puzzleElementIds: getRelationIds(props['Puzzle Elements']),
    lockedItemId: getRelationIds(props['Locked Item'])[0],
    ownerId: getRollupStrings(props['Owner'])[0],
    rewardIds: getRelationIds(props['Rewards']),
    parentItemId: getRelationIds(props['Parent item'])[0],
    subPuzzleIds: getRelationIds(props['Sub-Puzzles']),
    storyReveals: getRollupStrings(props['Story Reveals']),
    timing: getRollupStrings(props['Timing']) as Act[],
    narrativeThreads: getRollupStrings(props['Narrative Threads']),
    assetLink: getUrl(props['Asset Link']) || undefined
  };
}

export function transformTimelineEvent(page: NotionPage): TimelineEvent {
  const props = page.properties;
  const description = getTitle(props['Description']);
  
  return {
    id: page.id,
    name: description || 'Untitled Event', // Add name field
    lastEdited: page.last_edited_time,
    description: description || '',
    date: getDate(props['Date']) || '',
    charactersInvolvedIds: getRelationIds(props['Characters Involved']),
    memoryEvidenceIds: getRelationIds(props['Memory/Evidence']),
    memTypes: getRollupStrings(props['mem type']) as ElementBasicType[],
    notes: getRichText(props['Notes']),
    lastEditedTime: page.last_edited_time
  };
}
/**
 * Convert Element entity to Notion properties for updates
 */
export function elementToNotionProps(element: Partial<Element>): any {
  const properties: any = {};
  
  if (element.name !== undefined) {
    properties['Name'] = {
      title: [{ text: { content: element.name } }]
    };
  }
  
  if (element.descriptionText !== undefined) {
    properties['Description/Text'] = {
      rich_text: [{ text: { content: element.descriptionText } }]
    };
  }
  
  if (element.basicType !== undefined) {
    properties['Basic Type'] = {
      select: { name: element.basicType }
    };
  }
  
  if (element.status !== undefined) {
    properties['Status'] = {
      status: { name: element.status }
    };
  }
  
  if (element.firstAvailable !== undefined) {
    properties['First Available'] = {
      select: { name: element.firstAvailable }
    };
  }
  
  if (element.narrativeThreads !== undefined) {
    properties['Narrative Threads'] = {
      multi_select: element.narrativeThreads.map(thread => ({ name: thread }))
    };
  }
  
  if (element.productionNotes !== undefined) {
    properties['Production/Puzzle Notes'] = {
      rich_text: [{ text: { content: element.productionNotes } }]
    };
  }
  
  if (element.contentLink !== undefined) {
    properties['Content Link'] = {
      url: element.contentLink
    };
  }
  
  // Handle relation fields
  if (element.ownerId !== undefined) {
    properties['Owner'] = {
      relation: element.ownerId ? [{ id: element.ownerId }] : []
    };
  }
  
  if (element.containerId !== undefined) {
    properties['Container'] = {
      relation: element.containerId ? [{ id: element.containerId }] : []
    };
  }
  
  if (element.contentIds !== undefined) {
    properties['Contents'] = {
      relation: element.contentIds.map(id => ({ id }))
    };
  }
  
  if (element.timelineEventId !== undefined) {
    properties['Timeline Event'] = {
      relation: element.timelineEventId ? [{ id: element.timelineEventId }] : []
    };
  }
  
  if (element.requiredForPuzzleIds !== undefined) {
    properties['Required for puzzles'] = {
      relation: element.requiredForPuzzleIds.map(id => ({ id }))
    };
  }
  
  if (element.rewardedByPuzzleIds !== undefined) {
    properties['Rewarded by puzzles'] = {
      relation: element.rewardedByPuzzleIds.map(id => ({ id }))
    };
  }
  
  if (element.containerPuzzleId !== undefined) {
    properties['Container Puzzle'] = {
      relation: element.containerPuzzleId ? [{ id: element.containerPuzzleId }] : []
    };
  }
  
  return properties;
}

/**
 * Convert Puzzle entity to Notion properties for updates
 */
export function puzzleToNotionProps(puzzle: Partial<Puzzle>): any {
  const properties: any = {};
  
  if (puzzle.name !== undefined) {
    properties['Puzzle'] = {
      title: [{ text: { content: puzzle.name } }]
    };
  }
  
  if (puzzle.descriptionSolution !== undefined) {
    properties['Description/Solution'] = {
      rich_text: [{ text: { content: puzzle.descriptionSolution } }]
    };
  }
  
  if (puzzle.assetLink !== undefined) {
    properties['Asset Link'] = {
      url: puzzle.assetLink
    };
  }
  
  // Handle relation fields
  if (puzzle.puzzleElementIds !== undefined) {
    properties['Puzzle Elements'] = {
      relation: puzzle.puzzleElementIds.map((id: string) => ({ id }))
    };
  }
  
  if (puzzle.lockedItemId !== undefined) {
    properties['Locked Item'] = {
      relation: puzzle.lockedItemId ? [{ id: puzzle.lockedItemId }] : []
    };
  }
  
  if (puzzle.rewardIds !== undefined) {
    properties['rewardElements'] = {
      relation: puzzle.rewardIds.map((id: string) => ({ id }))
    };
  }
  
  if (puzzle.parentItemId !== undefined) {
    properties['Parent Item'] = {
      relation: puzzle.parentItemId ? [{ id: puzzle.parentItemId }] : []
    };
  }
  
  if (puzzle.subPuzzleIds !== undefined) {
    properties['Sub-puzzles'] = {
      relation: puzzle.subPuzzleIds.map((id: string) => ({ id }))
    };
  }
  
  return properties;
}

/**
 * Convert Character entity to Notion properties for updates
 */
export function characterToNotionProps(character: Partial<Character>): any {
  const properties: any = {};
  
  if (character.name !== undefined) {
    properties['Name'] = {
      title: [{ text: { content: character.name } }]
    };
  }
  
  if (character.tier !== undefined) {
    properties['Tier'] = {
      select: { name: character.tier }
    };
  }
  
  if (character.primaryAction !== undefined) {
    properties['Primary Action'] = {
      rich_text: [{ text: { content: character.primaryAction } }]
    };
  }
  
  if (character.characterLogline !== undefined) {
    properties['Character Logline'] = {
      rich_text: [{ text: { content: character.characterLogline } }]
    };
  }
  
  if (character.overview !== undefined) {
    properties['Overview & Key Relationships'] = {
      rich_text: [{ text: { content: character.overview } }]
    };
  }
  
  if (character.emotionTowardsCEO !== undefined) {
    properties['Emotion towards CEO & others'] = {
      rich_text: [{ text: { content: character.emotionTowardsCEO } }]
    };
  }
  
  // Handle relation fields
  if (character.characterPuzzleIds !== undefined) {
    properties['Character Puzzles'] = {
      relation: character.characterPuzzleIds.map((id: string) => ({ id }))
    };
  }
  
  if (character.eventIds !== undefined) {
    properties['Events'] = {
      relation: character.eventIds.map((id: string) => ({ id }))
    };
  }
  
  return properties;
}