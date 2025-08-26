/**
 * URL State Management Tests
 * Tests for Phase 2: URL-first state management implementation
 */

import { describe, it, expect } from 'vitest';
import { 
  filterStateToUrl, 
  urlToFilterState, 
  buildUrlWithFilters
} from '../urlState';
import type { FilterState } from '@/stores/filterStore';

describe('URL State Management', () => {
  const mockFilterState: FilterState = {
    searchTerm: 'test search',
    selectedNodeId: 'node-789',
    focusedNodeId: 'node-789',
    connectionDepth: 5,
    activeView: 'node-connections',
    puzzleFilters: {
      selectedActs: new Set(['Act 0', 'Act 1']),
      selectedPuzzleId: 'puzzle-123',
      completionStatus: 'completed'
    },
    characterFilters: {
      selectedTiers: new Set(['Core', 'Secondary']),
      ownershipStatus: new Set(['Owned', 'Accessible']),
      characterType: 'Player',
      selectedCharacterId: 'char-456',
      highlightShared: true
    },
    contentFilters: {
      contentStatus: new Set(['draft', 'review']),
      hasIssues: true,
      lastEditedRange: 'week',
      elementBasicTypes: new Set(),
      elementStatus: new Set()
    },
    nodeConnectionsFilters: {
      nodeType: 'character'
    }
  };

  describe('filterStateToUrl', () => {
    it('should convert FilterState to URL parameters', () => {
      const params = filterStateToUrl(mockFilterState);
      
      expect(params.get('search')).toBe('test search');
      expect(params.get('depth')).toBe('5');
      expect(params.get('view')).toBe('node-connections');
      expect(params.get('acts')).toBe('Act 0,Act 1');
      expect(params.get('puzzle')).toBe('puzzle-123');
      expect(params.get('status')).toBe('completed');
      expect(params.get('tiers')).toBe('Core,Secondary');
      expect(params.get('ownership')).toBe('Owned,Accessible');
      expect(params.get('charType')).toBe('Player');
      expect(params.get('character')).toBe('char-456');
      expect(params.get('shared')).toBe('true');
      expect(params.get('content')).toBe('draft,review');
      expect(params.get('issues')).toBe('true');
      expect(params.get('edited')).toBe('week');
      expect(params.get('nodeType')).toBe('character');
      expect(params.get('selectedNodeId')).toBe('node-789');
      expect(params.get('focusedNodeId')).toBe('node-789');
    });

    it('should skip default values', () => {
      const minimalState: FilterState = {
        searchTerm: '',
        selectedNodeId: null,
        focusedNodeId: null,
        connectionDepth: 3, // Default value
        activeView: null,
        puzzleFilters: {
          selectedActs: new Set(),
          selectedPuzzleId: null,
          completionStatus: 'all' // Default value
        },
        characterFilters: {
          selectedTiers: new Set(),
          ownershipStatus: new Set(),
          characterType: 'all', // Default value
          selectedCharacterId: null,
          highlightShared: false
        },
        contentFilters: {
          contentStatus: new Set(),
          hasIssues: null,
          lastEditedRange: 'all', // Default value
          elementBasicTypes: new Set(),
          elementStatus: new Set()
        },
        nodeConnectionsFilters: null
      };
      
      const params = filterStateToUrl(minimalState);
      expect(params.toString()).toBe(''); // No parameters should be set
    });
  });

  describe('urlToFilterState', () => {
    it('should parse URL parameters to FilterState', () => {
      const params = new URLSearchParams({
        search: 'test search',
        depth: '5',
        view: 'node-connections',
        acts: 'Act 0,Act 1',
        puzzle: 'puzzle-123',
        status: 'completed',
        tiers: 'Core,Secondary',
        ownership: 'Owned,Accessible',
        charType: 'Player',
        character: 'char-456',
        shared: 'true',
        content: 'draft,review',
        issues: 'true',
        edited: 'week',
        nodeType: 'character',
        selectedNodeId: 'node-789',
        focusedNodeId: 'node-focused'
      });
      
      const state = urlToFilterState(params);
      
      expect(state.searchTerm).toBe('test search');
      expect(state.connectionDepth).toBe(5);
      expect(state.activeView).toBe('node-connections');
      expect(state.puzzleFilters?.selectedActs).toEqual(new Set(['Act 0', 'Act 1']));
      expect(state.puzzleFilters?.selectedPuzzleId).toBe('puzzle-123');
      expect(state.puzzleFilters?.completionStatus).toBe('completed');
      expect(state.characterFilters?.selectedTiers).toEqual(new Set(['Core', 'Secondary']));
      expect(state.characterFilters?.ownershipStatus).toEqual(new Set(['Owned', 'Accessible']));
      expect(state.characterFilters?.characterType).toBe('Player');
      expect(state.characterFilters?.selectedCharacterId).toBe('char-456');
      expect(state.characterFilters?.highlightShared).toBe(true);
      expect(state.contentFilters?.contentStatus).toEqual(new Set(['draft', 'review']));
      expect(state.contentFilters?.hasIssues).toBe(true);
      expect(state.contentFilters?.lastEditedRange).toBe('week');
      expect(state.nodeConnectionsFilters?.nodeType).toBe('character');
      expect(state.selectedNodeId).toBe('node-789');
      expect(state.focusedNodeId).toBe('node-focused');
    });

    it('should validate and filter invalid values', () => {
      const params = new URLSearchParams({
        depth: 'invalid',
        view: 'invalid-view',
        status: 'invalid-status',
        tiers: 'Invalid,Core,BadTier',
        ownership: 'BadOwnership,Owned',
        charType: 'InvalidType',
        content: 'badstatus,draft',
        issues: 'maybe',
        edited: 'invalid-range',
        nodeType: 'invalid-type'
      });
      
      const state = urlToFilterState(params);
      
      expect(state.connectionDepth).toBeUndefined(); // Invalid depth ignored
      expect(state.activeView).toBeUndefined(); // Invalid view ignored
      expect(state.puzzleFilters?.completionStatus).toBeUndefined(); // Invalid status ignored
      expect(state.characterFilters?.selectedTiers).toEqual(new Set(['Core'])); // Only valid tiers
      expect(state.characterFilters?.ownershipStatus).toEqual(new Set(['Owned'])); // Only valid ownership
      expect(state.characterFilters?.characterType).toBeUndefined(); // Invalid type ignored
      expect(state.contentFilters?.contentStatus).toEqual(new Set(['draft'])); // Only valid content status
      expect(state.contentFilters?.hasIssues).toBeUndefined(); // Invalid boolean ignored
      expect(state.contentFilters?.lastEditedRange).toBeUndefined(); // Invalid range ignored
      expect(state.nodeConnectionsFilters).toBeUndefined(); // Invalid nodeType ignored
    });
  });

  describe('buildUrlWithFilters', () => {
    it('should build URL with filter parameters', () => {
      const url = buildUrlWithFilters('/puzzle-focus', mockFilterState);
      expect(url).toContain('/puzzle-focus?');
      expect(url).toContain('search=test+search');
      expect(url).toContain('depth=5');
      expect(url).toContain('view=node-connections');
    });

    it('should return base path when no filters', () => {
      const minimalState: FilterState = {
        searchTerm: '',
        selectedNodeId: null,
        focusedNodeId: null,
        connectionDepth: 3,
        activeView: null,
        puzzleFilters: {
          selectedActs: new Set(),
          selectedPuzzleId: null,
          completionStatus: 'all'
        },
        characterFilters: {
          selectedTiers: new Set(),
          ownershipStatus: new Set(),
          characterType: 'all',
          selectedCharacterId: null,
          highlightShared: false
        },
        contentFilters: {
          contentStatus: new Set(),
          hasIssues: null,
          lastEditedRange: 'all',
          elementBasicTypes: new Set(),
          elementStatus: new Set()
        },
        nodeConnectionsFilters: null
      };
      
      const url = buildUrlWithFilters('/puzzle-focus', minimalState);
      expect(url).toBe('/puzzle-focus');
    });
  });

  describe('Round-trip consistency', () => {
    it('should maintain state through serialization and deserialization', () => {
      const params = filterStateToUrl(mockFilterState);
      const reconstructedState = urlToFilterState(params);
      
      // Test core properties
      expect(reconstructedState.searchTerm).toBe(mockFilterState.searchTerm);
      expect(reconstructedState.connectionDepth).toBe(mockFilterState.connectionDepth);
      expect(reconstructedState.activeView).toBe(mockFilterState.activeView);
      
      // Test Set comparisons
      expect(reconstructedState.puzzleFilters?.selectedActs).toEqual(mockFilterState.puzzleFilters.selectedActs);
      expect(reconstructedState.characterFilters?.selectedTiers).toEqual(mockFilterState.characterFilters.selectedTiers);
      expect(reconstructedState.characterFilters?.ownershipStatus).toEqual(mockFilterState.characterFilters.ownershipStatus);
      expect(reconstructedState.contentFilters?.contentStatus).toEqual(mockFilterState.contentFilters.contentStatus);
      
      // Test other properties
      expect(reconstructedState.puzzleFilters?.selectedPuzzleId).toBe(mockFilterState.puzzleFilters.selectedPuzzleId);
      expect(reconstructedState.characterFilters?.selectedCharacterId).toBe(mockFilterState.characterFilters.selectedCharacterId);
      expect(reconstructedState.selectedNodeId).toBe(mockFilterState.selectedNodeId);
      expect(reconstructedState.focusedNodeId).toBe(mockFilterState.focusedNodeId);
    });
  });
});