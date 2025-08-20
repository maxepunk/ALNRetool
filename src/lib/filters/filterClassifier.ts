/**
 * Filter Classifier - Determines which filters can be applied server-side vs client-side
 * 
 * This module is critical for the hybrid filtering architecture, ensuring optimal
 * performance by pushing filters to the Notion API where possible while maintaining
 * client-side filtering for complex/derived filters.
 */

import type { CharacterFilters, PuzzleFilters, ContentFilters } from '@/stores/filterStore';
import type { CharacterFilterParams, PuzzleFilterParams, ElementFilterParams } from '@/services/api';

/**
 * Filters that can be applied server-side (Notion API supports these)
 */
export interface ServerSideFilters {
  characters: CharacterFilterParams;
  puzzles: PuzzleFilterParams;
  elements: ElementFilterParams;
}

/**
 * Filters that must be applied client-side (require cross-entity data or complex logic)
 */
export interface ClientSideFilters {
  // Search across all text fields
  searchTerm?: string;
  
  // Character-specific client filters
  ownershipStatus?: Set<'Owned' | 'Accessible' | 'Shared' | 'Locked'>;
  selectedCharacterId?: string | null;
  highlightShared?: boolean;
  
  // Puzzle-specific client filters
  selectedPuzzleId?: string | null;
  completionStatus?: 'all' | 'completed' | 'incomplete';
  selectedActs?: Set<string>; // Acts are rollup fields, can't filter server-side
  
  // Content-specific client filters
  hasIssues?: boolean | null;
}

/**
 * Extract server-side filterable parameters from character filters
 */
export function extractServerCharacterFilters(
  filters: CharacterFilters
): Partial<CharacterFilterParams> {
  const serverFilters: Partial<CharacterFilterParams> = {};
  
  // Tiers can be filtered server-side
  if (filters.selectedTiers.size > 0) {
    serverFilters.tiers = Array.from(filters.selectedTiers).join(',');
  }
  
  // Character type can be filtered server-side
  if (filters.characterType !== 'all') {
    serverFilters.type = filters.characterType === 'Player' ? 'players' : 'npcs';
  }
  
  return serverFilters;
}

/**
 * Extract server-side filterable parameters from puzzle filters
 */
export function extractServerPuzzleFilters(
  _filters: PuzzleFilters
): Partial<PuzzleFilterParams> {
  const serverFilters: Partial<PuzzleFilterParams> = {};
  
  // NOTE: Acts (timing) cannot be filtered server-side because it's a rollup field
  // Completion status requires element data, so it's client-side only
  
  // Currently no puzzle filters can be pushed server-side due to Notion limitations
  return serverFilters;
}

/**
 * Extract server-side filterable parameters from content filters
 */
export function extractServerContentFilters(
  filters: ContentFilters
): Partial<ElementFilterParams> {
  const serverFilters: Partial<ElementFilterParams> = {};
  
  // Status can be filtered server-side
  if (filters.contentStatus.size > 0) {
    serverFilters.status = Array.from(filters.contentStatus).join(',');
  }
  
  // Last edited range can be filtered server-side
  if (filters.lastEditedRange !== 'all') {
    serverFilters.lastEdited = filters.lastEditedRange;
  }
  
  // hasIssues requires text analysis, so it's client-side only
  
  return serverFilters;
}

/**
 * Extract all server-side filters from the filter store state
 */
export function extractServerSideFilters(
  characterFilters: CharacterFilters,
  puzzleFilters: PuzzleFilters,
  contentFilters: ContentFilters
): ServerSideFilters {
  return {
    characters: extractServerCharacterFilters(characterFilters),
    puzzles: extractServerPuzzleFilters(puzzleFilters),
    elements: extractServerContentFilters(contentFilters),
  };
}

/**
 * Extract client-side only filters from the filter store state
 */
export function extractClientSideFilters(
  searchTerm: string,
  characterFilters: CharacterFilters,
  puzzleFilters: PuzzleFilters,
  contentFilters: ContentFilters
): ClientSideFilters {
  return {
    // Universal client-side filters
    searchTerm: searchTerm || undefined,
    
    // Character client-side filters
    ownershipStatus: characterFilters.ownershipStatus.size > 0 
      ? characterFilters.ownershipStatus 
      : undefined,
    selectedCharacterId: characterFilters.selectedCharacterId,
    highlightShared: characterFilters.highlightShared || undefined,
    
    // Puzzle client-side filters
    selectedPuzzleId: puzzleFilters.selectedPuzzleId,
    completionStatus: puzzleFilters.completionStatus !== 'all' 
      ? puzzleFilters.completionStatus 
      : undefined,
    selectedActs: puzzleFilters.selectedActs.size > 0 
      ? puzzleFilters.selectedActs 
      : undefined,
    
    // Content client-side filters
    hasIssues: contentFilters.hasIssues,
  };
}

/**
 * Check if any server-side filters are active
 */
export function hasServerSideFilters(serverFilters: ServerSideFilters): boolean {
  return !!(
    Object.keys(serverFilters.characters).length > 0 ||
    Object.keys(serverFilters.puzzles).length > 0 ||
    Object.keys(serverFilters.elements).length > 0
  );
}

/**
 * Check if any client-side filters are active
 */
export function hasClientSideFilters(clientFilters: ClientSideFilters): boolean {
  return !!(
    clientFilters.searchTerm ||
    clientFilters.ownershipStatus ||
    clientFilters.selectedCharacterId ||
    clientFilters.highlightShared ||
    clientFilters.selectedPuzzleId ||
    clientFilters.completionStatus ||
    clientFilters.selectedActs ||
    clientFilters.hasIssues !== null
  );
}

/**
 * Create a cache key suffix from server-side filters
 * This ensures different filter combinations are cached separately
 */
export function createFilterCacheKey(serverFilters: ServerSideFilters): string {
  const parts: string[] = [];
  
  // Add character filters to key
  if (serverFilters.characters.tiers) {
    parts.push(`tiers:${serverFilters.characters.tiers}`);
  }
  if (serverFilters.characters.type) {
    parts.push(`type:${serverFilters.characters.type}`);
  }
  if (serverFilters.characters.lastEdited) {
    parts.push(`char-edited:${serverFilters.characters.lastEdited}`);
  }
  
  // Add element filters to key
  if (serverFilters.elements.status) {
    parts.push(`status:${serverFilters.elements.status}`);
  }
  if (serverFilters.elements.lastEdited) {
    parts.push(`elem-edited:${serverFilters.elements.lastEdited}`);
  }
  
  // Puzzle filters are currently empty but structure is here for future
  if (serverFilters.puzzles.lastEdited) {
    parts.push(`puz-edited:${serverFilters.puzzles.lastEdited}`);
  }
  
  return parts.length > 0 ? parts.join('|') : 'no-filters';
}