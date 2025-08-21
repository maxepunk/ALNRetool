/**
 * Functions to convert app types back to Notion properties
 * Used for updating Notion pages via the API
 */

import type {
  Character,
  Element,
  Puzzle,
  TimelineEvent,
} from '../../src/types/notion/app.js';

// Helper functions for property types
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

function toNotionSelect(value: string | null) {
  return {
    select: value ? { name: value } : null,
  };
}

function toNotionMultiSelect(values: string[]) {
  return {
    multi_select: values.map(v => ({ name: v })),
  };
}

function toNotionRelation(ids: string[]) {
  return {
    relation: ids.map(id => ({ id })),
  };
}

function toNotionStatus(status: string) {
  return {
    status: { name: status },
  };
}

function toNotionDate(date: string | null) {
  return {
    date: date ? { start: date } : null,
  };
}

function toNotionUrl(url: string | null) {
  return {
    url: url || null,
  };
}

// Preserve SF_ patterns in element descriptions
function preserveSFPatterns(description: string): string {
  // This function ensures SF_ patterns remain intact
  // The patterns are already in the description, just return it
  return description;
}

// Entity-specific converters
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
    properties['Required for puzzles'] = toNotionRelation(updates.requiredForPuzzleIds);
  }
  
  if (updates.rewardedByPuzzleIds !== undefined) {
    properties['Rewarded by puzzles'] = toNotionRelation(updates.rewardedByPuzzleIds);
  }
  
  if (updates.associatedCharacterIds !== undefined) {
    properties['Associated characters'] = toNotionRelation(updates.associatedCharacterIds);
  }
  
  // Array fields (narrative threads)
  if (updates.narrativeThreads !== undefined) {
    properties['Narrative threads'] = toNotionMultiSelect(updates.narrativeThreads);
  }
  
  // Note: filesMedia is handled differently - files need to be uploaded via separate API
  // Note: sfPatterns, puzzleChain, isContainer are computed fields - not writable

  return properties;
}

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