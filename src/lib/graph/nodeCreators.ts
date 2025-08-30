/**
 * Node Creation Utilities
 * 
 * Modular functions for creating graph nodes from entities.
 * Extracted from GraphView to improve maintainability and testability.
 * 
 * @module lib/graph/nodeCreators
 */

import type { GraphNode } from './types';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

// Type for entity visibility toggles
type EntityVisibility = {
  characters: boolean;
  puzzles: boolean;
  elements: boolean;
  timeline: boolean;
};

/**
 * Create graph nodes for puzzles
 */
export function createPuzzleNodes(
  puzzles: Puzzle[],
  searchTerm: string,
  entityVisibility: EntityVisibility,
  puzzleSelectedActs: Set<string>,
  viewConfig: { filters: { entityTypes?: string[] } }
): GraphNode[] {
  const shouldInclude = viewConfig.filters.entityTypes?.includes('all') ||
                       viewConfig.filters.entityTypes?.includes('puzzle');
  
  if (!shouldInclude) return [];

  return puzzles
    .filter(puzzle => {
      // Check entity visibility toggle
      if (!entityVisibility.puzzles) {
        return false;
      }
      
      // Check act filter
      if (puzzleSelectedActs.size > 0) {
        const puzzleActs = puzzle.timing || [];
        const hasMatchingAct = puzzleActs.some((act) => {
          return act && puzzleSelectedActs.has(act);
        });
        
        if (!hasMatchingAct) {
          return false;
        }
      }
      
      return true;
    })
    .map(puzzle => ({
      id: puzzle.id,
      type: 'puzzle',
      position: { x: 0, y: 0 },
      data: {
        label: puzzle.name,
        type: 'puzzle',
        id: puzzle.id,
        entity: puzzle,
        metadata: {
          entityType: 'puzzle',
          searchMatch: searchTerm ? (
            puzzle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            puzzle.id.toLowerCase().includes(searchTerm.toLowerCase())
          ) : true,
          isFocused: false,
        },
      },
    }));
}

/**
 * Create graph nodes for characters
 */
export function createCharacterNodes(
  characters: Character[],
  searchTerm: string,
  entityVisibility: EntityVisibility,
  characterType: string,
  characterSelectedTiers: Set<string>,
  viewConfig: { filters: { entityTypes?: string[] } }
): GraphNode[] {
  const shouldInclude = viewConfig.filters.entityTypes?.includes('all') ||
                       viewConfig.filters.entityTypes?.includes('character');
  
  if (!shouldInclude) return [];

  return characters
    .filter(character => {
      // Check entity visibility toggle
      if (!entityVisibility.characters) {
        return false;
      }
      
      // Check tier filter
      if (characterSelectedTiers.size > 0) {
        const tier = character.tier || 'Standard';
        if (!characterSelectedTiers.has(tier as any)) {
          return false;
        }
      }
      
      // Check type filter
      if (characterType !== 'all') {
        const type = character.type || 'Player';
        if (type !== characterType) {
          return false;
        }
      }
      
      return true;
    })
    .map(character => ({
      id: character.id,
      type: 'character',
      position: { x: 0, y: 0 },
      data: {
        label: character.name,
        type: 'character',
        id: character.id,
        entity: character,
        metadata: {
          entityType: 'character',
          searchMatch: searchTerm ? (
            character.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            character.id.toLowerCase().includes(searchTerm.toLowerCase())
          ) : true,
          isFocused: false,
        },
      },
    }));
}

/**
 * Create graph nodes for elements
 */
export function createElementNodes(
  elements: Element[],
  searchTerm: string,
  entityVisibility: EntityVisibility,
  elementBasicTypes: Set<string>,
  elementStatus: Set<string>,
  viewConfig: { filters: { entityTypes?: string[] } }
): GraphNode[] {
  const shouldInclude = viewConfig.filters.entityTypes?.includes('all') ||
                       viewConfig.filters.entityTypes?.includes('element');
  
  if (!shouldInclude) return [];

  return elements
    .filter(element => {
      // Check entity visibility toggle
      if (!entityVisibility.elements) {
        return false;
      }
      
      // Check basic type filter
      if (elementBasicTypes.size > 0) {
        const basicType = element.basicType || '';
        if (!elementBasicTypes.has(basicType)) {
          return false;
        }
      }
      
      // Check status filter
      if (elementStatus.size > 0) {
        const status = element.status || '';
        if (!elementStatus.has(status)) {
          return false;
        }
      }
      
      return true;
    })
    .map(element => ({
      id: element.id,
      type: 'element',
      position: { x: 0, y: 0 },
      data: {
        label: element.name,
        type: 'element',
        id: element.id,
        entity: element,
        metadata: {
          entityType: 'element',
          searchMatch: searchTerm ? (
            element.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            element.id.toLowerCase().includes(searchTerm.toLowerCase())
          ) : true,
          isFocused: false,
        },
      },
    }));
}

/**
 * Create graph nodes for timeline events
 */
export function createTimelineNodes(
  timeline: TimelineEvent[],
  searchTerm: string,
  entityVisibility: EntityVisibility,
  viewConfig: { filters: { entityTypes?: string[] } }
): GraphNode[] {
  const shouldInclude = viewConfig.filters.entityTypes?.includes('all') ||
                       viewConfig.filters.entityTypes?.includes('timeline');
  
  if (!shouldInclude) return [];

  return timeline
    .filter(_ => {
      // Check entity visibility toggle
      if (!entityVisibility.timeline) {
        return false;
      }
      
      return true;
    })
    .map(event => ({
      id: event.id,
      type: 'timeline',
      position: { x: 0, y: 0 },
      data: {
        label: event.name,
        type: 'timeline',
        id: event.id,
        entity: event,
        metadata: {
          entityType: 'timeline',
          searchMatch: searchTerm ? (
            event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.id.toLowerCase().includes(searchTerm.toLowerCase())
          ) : true,
          isFocused: false,
        },
      },
    }));
}

/**
 * Create all graph nodes from entities
 */
export function createAllNodes(
  characters: Character[],
  elements: Element[],
  puzzles: Puzzle[],
  timeline: TimelineEvent[],
  // Individual filter parameters
  searchTerm: string,
  entityVisibility: EntityVisibility,
  characterType: string,
  characterSelectedTiers: Set<string>,
  puzzleSelectedActs: Set<string>,
  elementBasicTypes: Set<string>,
  elementStatus: Set<string>,
  // Note: connectionDepth and selectedNodeId
  // are used for filtering AFTER node creation in useGraphLayout, not here
  viewConfig: { filters: { entityTypes?: string[] } }
): GraphNode[] {
  return [
    ...createPuzzleNodes(puzzles, searchTerm, entityVisibility, puzzleSelectedActs, viewConfig),
    ...createCharacterNodes(characters, searchTerm, entityVisibility, characterType, characterSelectedTiers, viewConfig),
    ...createElementNodes(elements, searchTerm, entityVisibility, elementBasicTypes, elementStatus, viewConfig),
    ...createTimelineNodes(timeline, searchTerm, entityVisibility, viewConfig),
  ];
}