/**
 * Filter utility functions for applying filters to entity data
 * Central location for all filtering logic used across the application
 */

import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';
import type { CharacterFilters, PuzzleFilters, ContentFilters } from '@/stores/filterStore';

/**
 * Helper to filter entities by last edited date
 */
function filterByLastEdited<T extends { lastEdited?: string }>(
  entities: T[],
  range: 'all' | 'today' | 'week' | 'month' | '24h' | '7d' | '30d'
): T[] {
  if (range === 'all') return entities;
  
  const now = new Date();
  const cutoffDate = new Date();
  
  switch (range) {
    case 'today':
    case '24h':
      cutoffDate.setHours(now.getHours() - 24);
      break;
    case 'week':
    case '7d':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case 'month':
    case '30d':
      cutoffDate.setDate(now.getDate() - 30);
      break;
  }
  
  return entities.filter(entity => {
    if (!entity.lastEdited) return false;
    const editedDate = new Date(entity.lastEdited);
    return editedDate >= cutoffDate;
  });
}

/**
 * Apply character filters to a list of characters
 */
export function applyCharacterFilters(
  characters: Character[],
  filters: CharacterFilters,
  elements?: Element[]
): Character[] {
  let filtered = [...characters];

  // Filter by tiers
  if (filters.selectedTiers.size > 0) {
    filtered = filtered.filter(char => 
      char.tier && filters.selectedTiers.has(char.tier)
    );
  }

  // Filter by ownership status (based on element ownership)
  // Uses element relationships to determine ownership
  if (filters.ownershipStatus.size > 0 && elements) {
    filtered = filtered.filter(char => {
      // Check if character owns any elements
      const ownedElements = elements.filter(elem => elem.ownerId === char.id);
      const hasOwnedElements = ownedElements.length > 0;
      
      // Check if character has associated elements (accessible but not owned)
      const hasAssociatedElements = char.associatedElementIds && char.associatedElementIds.length > 0;
      
      // Check if elements are shared (owned elements that are also containers)
      const hasSharedElements = ownedElements.some(elem => elem.contentIds && elem.contentIds.length > 0);
      
      // Check if character has puzzle-locked elements
      const hasLockedElements = char.characterPuzzleIds && char.characterPuzzleIds.length > 0;
      
      // Check which statuses apply to this character
      const matchesOwned = filters.ownershipStatus.has('Owned') && hasOwnedElements;
      const matchesAccessible = filters.ownershipStatus.has('Accessible') && hasAssociatedElements;
      const matchesShared = filters.ownershipStatus.has('Shared') && hasSharedElements;
      const matchesLocked = filters.ownershipStatus.has('Locked') && hasLockedElements;
      
      return matchesOwned || matchesAccessible || matchesShared || matchesLocked;
    });
  }

  // Filter by character type (Player/NPC)
  if (filters.characterType !== 'all') {
    filtered = filtered.filter(char => {
      const isPlayer = char.type === 'Player';
      return filters.characterType === 'Player' ? isPlayer : !isPlayer;
    });
  }

  // Filter by selected character
  if (filters.selectedCharacterId) {
    filtered = filtered.filter(char => char.id === filters.selectedCharacterId);
  }

  return filtered;
}

/**
 * Derive puzzle completion status from elements
 * @param puzzle - The puzzle to check
 * @param elements - All available elements
 * @returns 'completed' | 'in-progress' | 'not-started'
 */
export function derivePuzzleStatus(
  puzzle: Puzzle,
  elements: Element[]
): 'completed' | 'in-progress' | 'not-started' {
  if (!puzzle.puzzleElementIds || puzzle.puzzleElementIds.length === 0) {
    // Puzzle has no required elements, consider it not started
    return 'not-started';
  }
  
  // Get all elements required for this puzzle
  const requiredElements = elements.filter(elem => 
    puzzle.puzzleElementIds.includes(elem.id)
  );
  
  if (requiredElements.length === 0) {
    // No matching elements found
    return 'not-started';
  }
  
  // Check element statuses
  // Consider elements with these statuses as "complete" for puzzle purposes
  const solvedElements = requiredElements.filter(elem => 
    elem.status === 'Writing Complete' || 
    elem.status === 'Design Complete' || 
    elem.status === 'in space playtest ready'
  );
  
  if (solvedElements.length === requiredElements.length) {
    return 'completed';
  } else if (solvedElements.length > 0) {
    return 'in-progress';
  } else {
    return 'not-started';
  }
}

/**
 * Apply puzzle filters to a list of puzzles
 */
export function applyPuzzleFilters(
  puzzles: Puzzle[],
  filters: PuzzleFilters,
  elements?: Element[]
): Puzzle[] {
  let filtered = [...puzzles];

  // Filter by selected acts
  if (filters.selectedActs.size > 0) {
    filtered = filtered.filter(puzzle => {
      // Check if puzzle's timing matches any selected act
      if (!puzzle.timing || puzzle.timing.length === 0) return false;
      return puzzle.timing.some(act => 
        act && Array.from(filters.selectedActs).some(selectedAct => 
          act.toLowerCase().includes(selectedAct.toLowerCase())
        )
      );
    });
  }

  // Filter by completion status (derived from elements)
  if (filters.completionStatus !== 'all' && elements) {
    filtered = filtered.filter(puzzle => {
      const status = derivePuzzleStatus(puzzle, elements);
      
      // Map our detailed status to the filter's binary status
      if (filters.completionStatus === 'completed') {
        return status === 'completed';
      } else if (filters.completionStatus === 'incomplete') {
        return status === 'in-progress' || status === 'not-started';
      }
      
      return true; // 'all' case (shouldn't reach here due to outer if)
    });
  }

  // Filter by selected puzzle
  if (filters.selectedPuzzleId) {
    // Include the selected puzzle and its related puzzles
    const selectedPuzzle = puzzles.find(p => p.id === filters.selectedPuzzleId);
    if (selectedPuzzle) {
      const relatedIds = new Set([filters.selectedPuzzleId]);
      
      // Add sub-puzzles
      selectedPuzzle.subPuzzleIds?.forEach(id => relatedIds.add(id));
      
      // Add parent puzzle
      if (selectedPuzzle.parentItemId) {
        relatedIds.add(selectedPuzzle.parentItemId);
      }
      
      // Find puzzles that have this puzzle as a sub-puzzle
      puzzles.forEach(puzzle => {
        if (filters.selectedPuzzleId && puzzle.subPuzzleIds?.includes(filters.selectedPuzzleId)) {
          relatedIds.add(puzzle.id);
        }
      });
      
      filtered = filtered.filter(puzzle => relatedIds.has(puzzle.id));
    }
  }

  return filtered;
}

/**
 * Apply content filters to elements
 */
export function applyContentFilters(
  elements: Element[],
  filters: ContentFilters
): Element[] {
  let filtered = [...elements];

  // Filter by element basic types (Memory Token, Prop, Document, etc.)
  if (filters.elementBasicTypes.size > 0) {
    filtered = filtered.filter(element => {
      if (!element.basicType) return false;
      return filters.elementBasicTypes.has(element.basicType);
    });
  }

  // Filter by element status (production status)
  if (filters.elementStatus.size > 0) {
    filtered = filtered.filter(element => {
      if (!element.status) return false;
      return filters.elementStatus.has(element.status);
    });
  }

  // Filter by content status (this seems to be a different field, keeping for compatibility)
  if (filters.contentStatus.size > 0) {
    filtered = filtered.filter(element => {
      // Map element properties to content status
      // This is a simplified mapping - adjust based on actual Element properties
      const status = element.status || 'draft';
      return filters.contentStatus.has(status as any);
    });
  }

  // Filter by has issues
  if (filters.hasIssues !== null) {
    filtered = filtered.filter(element => {
      // Check if element has any issues (simplified logic)
      const hasIssue = !element.descriptionText || 
                       element.descriptionText.includes('TODO') ||
                       element.descriptionText.includes('FIXME');
      return filters.hasIssues ? hasIssue : !hasIssue;
    });
  }

  // Filter by last edited range
  if (filters.lastEditedRange !== 'all') {
    filtered = filterByLastEdited(filtered, filters.lastEditedRange);
  }

  return filtered;
}

/**
 * Apply search filter across any entity type
 */
export function applySearchFilter<T extends { name?: string; [key: string]: any }>(
  entities: T[],
  searchTerm: string,
  searchableFields: (keyof T)[] = ['name']
): T[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return entities;
  }

  const searchLower = searchTerm.toLowerCase().trim();
  
  return entities.filter(entity => {
    // Search across specified fields
    return searchableFields.some(field => {
      const value = entity[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchLower);
      }
      if (Array.isArray(value)) {
        return value.some((item: any) => 
          typeof item === 'string' && item.toLowerCase().includes(searchLower)
        );
      }
      return false;
    });
  });
}

/**
 * Apply search to puzzles with multiple fields
 */
export function searchPuzzles(puzzles: Puzzle[], searchTerm: string): Puzzle[] {
  return applySearchFilter(puzzles, searchTerm, [
    'name',
    'descriptionSolution'
  ]);
}

/**
 * Apply search to characters with multiple fields
 */
export function searchCharacters(characters: Character[], searchTerm: string): Character[] {
  return applySearchFilter(characters, searchTerm, [
    'name',
    'overview',
    'characterLogline',
    'primaryAction'
  ]);
}

/**
 * Apply search to elements with multiple fields
 */
export function searchElements(elements: Element[], searchTerm: string): Element[] {
  return applySearchFilter(elements, searchTerm, [
    'name',
    'descriptionText',
    'productionNotes'
  ]);
}

/**
 * Apply search to timeline events
 */
export function searchTimeline(events: TimelineEvent[], searchTerm: string): TimelineEvent[] {
  return applySearchFilter(events, searchTerm, [
    'name',
    'description',
    'notes'
  ]);
}

/**
 * Combined filter application for character journey data
 */
export interface CharacterJourneyFilters {
  searchTerm?: string;
  characterFilters?: CharacterFilters;
  puzzleFilters?: PuzzleFilters;
  contentFilters?: ContentFilters;
}

/**
 * Check if a newly created entity would pass the current filters
 * Used for optimistic updates to avoid showing entities that would be filtered out
 */
export function wouldEntityPassFilters<T extends { id: string; name?: string }>(
  entity: T,
  entityType: 'character' | 'element' | 'puzzle' | 'timeline',
  filters: {
    characterFilters?: CharacterFilters;
    puzzleFilters?: PuzzleFilters;
    contentFilters?: ContentFilters;
    searchTerm?: string;
  }
): boolean {
  // Check search filter first (applies to all entity types)
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase().trim();
    const name = (entity as any).name || '';
    if (!name.toLowerCase().includes(searchLower)) {
      return false;
    }
  }

  // Check entity-specific filters
  switch (entityType) {
    case 'character': {
      const char = entity as unknown as Character;
      if (!filters.characterFilters) return true;
      
      // Check tier filter
      if (filters.characterFilters.selectedTiers.size > 0) {
        if (!char.tier || !filters.characterFilters.selectedTiers.has(char.tier)) {
          return false;
        }
      }
      
      // Check character type filter
      if (filters.characterFilters.characterType !== 'all') {
        const isPlayer = char.type === 'Player';
        const shouldBePlayer = filters.characterFilters.characterType === 'Player';
        if (isPlayer !== shouldBePlayer) {
          return false;
        }
      }
      
      // Skip ownership status check for new entities (no relationships yet)
      // Skip selected character check (new entity can't be the selected one)
      
      return true;
    }
    
    case 'puzzle': {
      const puzzle = entity as unknown as Puzzle;
      if (!filters.puzzleFilters) return true;
      
      // Check act filter
      if (filters.puzzleFilters.selectedActs.size > 0) {
        if (!puzzle.timing || puzzle.timing.length === 0) {
          return false;
        }
        const hasMatchingAct = puzzle.timing.some(act => 
          act && Array.from(filters.puzzleFilters!.selectedActs).some(selectedAct => 
            act.toLowerCase().includes(selectedAct.toLowerCase())
          )
        );
        if (!hasMatchingAct) {
          return false;
        }
      }
      
      // Skip completion status check (new puzzles have no status yet)
      // Skip selected puzzle check (new entity can't be the selected one)
      
      return true;
    }
    
    case 'element': {
      const element = entity as unknown as Element;
      if (!filters.contentFilters) return true;
      
      // Check element status filter
      if (filters.contentFilters.elementStatus.size > 0) {
        if (!element.status || !filters.contentFilters.elementStatus.has(element.status)) {
          return false;
        }
      }
      
      // Check element type filter
      if (filters.contentFilters.elementBasicTypes.size > 0) {
        if (!element.basicType || !filters.contentFilters.elementBasicTypes.has(element.basicType)) {
          return false;
        }
      }
      
      // Skip has issues check (too complex for new entities)
      // Skip last edited range (new entities are always "now")
      
      return true;
    }
    
    case 'timeline': {
      // Timeline events typically have no filters
      return true;
    }
    
    default:
      return true;
  }
}

export function applyCharacterJourneyFilters(
  data: {
    characters: Character[];
    elements: Element[];
    puzzles: Puzzle[];
    timeline: TimelineEvent[];
  },
  filters: CharacterJourneyFilters
) {
  let result = { ...data };

  // Apply character filters (with elements for ownership checking)
  if (filters.characterFilters) {
    result.characters = applyCharacterFilters(result.characters, filters.characterFilters, data.elements);
  }

  // Apply puzzle filters (with elements for status derivation)
  if (filters.puzzleFilters) {
    result.puzzles = applyPuzzleFilters(result.puzzles, filters.puzzleFilters, data.elements);
  }

  // Apply content filters to elements
  if (filters.contentFilters) {
    result.elements = applyContentFilters(result.elements, filters.contentFilters);
  }

  // Apply search across all entities
  if (filters.searchTerm) {
    result.characters = searchCharacters(result.characters, filters.searchTerm);
    result.elements = searchElements(result.elements, filters.searchTerm);
    result.puzzles = searchPuzzles(result.puzzles, filters.searchTerm);
    result.timeline = searchTimeline(result.timeline, filters.searchTerm);
  }

  return result;
}