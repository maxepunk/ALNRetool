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
import type { FilterState } from '@/stores/filterStore';

/**
 * Create graph nodes for puzzles
 */
export function createPuzzleNodes(
  puzzles: Puzzle[],
  filters: FilterState,
  viewConfig: { filters: { entityTypes?: string[] } }
): GraphNode[] {
  const shouldInclude = viewConfig.filters.entityTypes?.includes('all') ||
                       viewConfig.filters.entityTypes?.includes('puzzle');
  
  if (!shouldInclude) return [];

  return puzzles
    .filter(puzzle => {
      // Always show the focused node
      if (filters.focusedNodeId && puzzle.id === filters.focusedNodeId) {
        return true;
      }
      
      // Check entity visibility toggle
      if (!filters.entityVisibility.puzzles) {
        return false;
      }
      
      // Check act filter
      if (filters.puzzleFilters.selectedActs.size > 0) {
        const puzzleActs = puzzle.timing || [];
        const hasMatchingAct = puzzleActs.some((act) => {
          return act && filters.puzzleFilters.selectedActs.has(act);
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
          searchMatch: filters.searchTerm ? (
            puzzle.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            puzzle.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            puzzle.id.toLowerCase().includes(filters.searchTerm.toLowerCase())
          ) : true,
          isFocused: puzzle.id === filters.focusedNodeId,
        },
      },
    }));
}

/**
 * Create graph nodes for characters
 */
export function createCharacterNodes(
  characters: Character[],
  filters: FilterState,
  viewConfig: { filters: { entityTypes?: string[] } }
): GraphNode[] {
  const shouldInclude = viewConfig.filters.entityTypes?.includes('all') ||
                       viewConfig.filters.entityTypes?.includes('character');
  
  if (!shouldInclude) return [];

  return characters
    .filter(character => {
      // Always show the focused node
      if (filters.focusedNodeId && character.id === filters.focusedNodeId) {
        return true;
      }
      
      // Check entity visibility toggle
      if (!filters.entityVisibility.characters) {
        return false;
      }
      
      // Check tier filter
      if (filters.characterFilters.selectedTiers.size > 0) {
        const tier = character.tier || 'Standard';
        if (!filters.characterFilters.selectedTiers.has(tier as any)) {
          return false;
        }
      }
      
      // Check type filter
      if (filters.characterFilters.characterType !== 'all') {
        const type = character.type || 'Player';
        if (type !== filters.characterFilters.characterType) {
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
          searchMatch: filters.searchTerm ? (
            character.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            character.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            character.id.toLowerCase().includes(filters.searchTerm.toLowerCase())
          ) : true,
          isFocused: character.id === filters.focusedNodeId,
        },
      },
    }));
}

/**
 * Create graph nodes for elements
 */
export function createElementNodes(
  elements: Element[],
  filters: FilterState,
  viewConfig: { filters: { entityTypes?: string[] } }
): GraphNode[] {
  const shouldInclude = viewConfig.filters.entityTypes?.includes('all') ||
                       viewConfig.filters.entityTypes?.includes('element');
  
  if (!shouldInclude) return [];

  return elements
    .filter(element => {
      // Always show the focused node
      if (filters.focusedNodeId && element.id === filters.focusedNodeId) {
        return true;
      }
      
      // Check entity visibility toggle
      if (!filters.entityVisibility.elements) {
        return false;
      }
      
      // Check basic type filter
      if (filters.contentFilters.elementBasicTypes.size > 0) {
        const basicType = element.basicType || '';
        if (!filters.contentFilters.elementBasicTypes.has(basicType)) {
          return false;
        }
      }
      
      // Check status filter
      if (filters.contentFilters.elementStatus.size > 0) {
        const status = element.status || '';
        if (!filters.contentFilters.elementStatus.has(status)) {
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
          searchMatch: filters.searchTerm ? (
            element.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            element.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            element.id.toLowerCase().includes(filters.searchTerm.toLowerCase())
          ) : true,
          isFocused: element.id === filters.focusedNodeId,
        },
      },
    }));
}

/**
 * Create graph nodes for timeline events
 */
export function createTimelineNodes(
  timeline: TimelineEvent[],
  filters: FilterState,
  viewConfig: { filters: { entityTypes?: string[] } }
): GraphNode[] {
  const shouldInclude = viewConfig.filters.entityTypes?.includes('all') ||
                       viewConfig.filters.entityTypes?.includes('timeline');
  
  if (!shouldInclude) return [];

  return timeline
    .filter(event => {
      // Always show the focused node
      if (filters.focusedNodeId && event.id === filters.focusedNodeId) {
        return true;
      }
      
      // Check entity visibility toggle
      if (!filters.entityVisibility.timeline) {
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
          searchMatch: filters.searchTerm ? (
            event.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            event.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            event.id.toLowerCase().includes(filters.searchTerm.toLowerCase())
          ) : true,
          isFocused: event.id === filters.focusedNodeId,
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
  filters: FilterState,
  viewConfig: { filters: { entityTypes?: string[] } }
): GraphNode[] {
  return [
    ...createPuzzleNodes(puzzles, filters, viewConfig),
    ...createCharacterNodes(characters, filters, viewConfig),
    ...createElementNodes(elements, filters, viewConfig),
    ...createTimelineNodes(timeline, filters, viewConfig),
  ];
}