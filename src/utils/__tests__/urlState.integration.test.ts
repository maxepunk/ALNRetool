/**
 * URL State Integration Tests
 * 
 * Tests the integration between URL state utilities and browser navigation
 * Validates Phase 2: URL-first state management functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  filterStateToUrl, 
  updateBrowserUrl,
  parseUrlFilters,
  createShareableUrl 
} from '../urlState';
import type { FilterState } from '@/stores/filterStore';

// Mock window object for URL manipulation
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn()
};

const mockLocation = {
  pathname: '/node-connections',
  search: '',
  href: 'http://localhost:5173/node-connections'
};

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true
});

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('URL State Integration', () => {
  beforeEach(() => {
    // Reset mocks
    mockHistory.pushState.mockClear();
    mockHistory.replaceState.mockClear();
    mockLocation.search = '';
    mockLocation.href = 'http://localhost:5173/node-connections';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const sampleFilterState: FilterState = {
    searchTerm: 'integration test',
    selectedNodeId: 'char-123',
    connectionDepth: 4,
    activeView: 'node-connections',
    entityVisibility: {
      character: true,
      puzzle: true,
      element: true,
      timeline: true
    },
    puzzleFilters: {
      selectedActs: new Set(['Act 1']),
      selectedPuzzleId: 'test-puzzle',
      completionStatus: 'incomplete'
    },
    characterFilters: {
      selectedTiers: new Set(['Core']),
      ownershipStatus: new Set(['Owned']),
      characterType: 'Player',
      selectedCharacterId: 'test-character',
      highlightShared: false
    },
    contentFilters: {
      contentStatus: new Set(['draft']),
      hasIssues: null,
      lastEditedRange: 'today',
      elementBasicTypes: new Set(),
      elementStatus: new Set()
    },
    nodeConnectionsFilters: {
      nodeType: 'character'
    }
  };

  describe('URL State Persistence', () => {
    it('should persist state to browser URL correctly', () => {
      // Update browser URL with filter state
      updateBrowserUrl(sampleFilterState, false);

      // Verify pushState was called with correct parameters
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('search=integration+test')
      );
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('depth=4')
      );
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('nodeType=character')
      );
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('selectedNodeId=char-123')
      );
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('selectedNodeId=char-123')
      );
    });

    it('should use replaceState when replace=true', () => {
      updateBrowserUrl(sampleFilterState, true);

      expect(mockHistory.replaceState).toHaveBeenCalledTimes(1);
      expect(mockHistory.pushState).not.toHaveBeenCalled();
    });

    it('should handle empty state correctly', () => {
      const emptyState: FilterState = {
        searchTerm: '',
        selectedNodeId: null,
        connectionDepth: 3, // default
        activeView: null,
        entityVisibility: {
          character: true,
          puzzle: true,
          element: true,
          timeline: true
        },
        puzzleFilters: {
          selectedActs: new Set(),
          selectedPuzzleId: null,
          completionStatus: 'all' // default
        },
        characterFilters: {
          selectedTiers: new Set(),
          ownershipStatus: new Set(),
          characterType: 'all', // default
          selectedCharacterId: null,
          highlightShared: false
        },
        contentFilters: {
          contentStatus: new Set(),
          hasIssues: null,
          lastEditedRange: 'all', // default
          elementBasicTypes: new Set(),
          elementStatus: new Set()
        },
        nodeConnectionsFilters: null
      };

      updateBrowserUrl(emptyState, false);

      // Should update to pathname only (no query string)
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/node-connections'
      );
    });
  });

  describe('URL Parsing Integration', () => {
    it('should parse URL with parameters correctly', () => {
      const testUrl = 'http://localhost:5173/node-connections?search=test&depth=5&nodeType=puzzle&selectedNodeId=puzzle-456&selectedNodeId=puzzle-456';
      
      const filters = parseUrlFilters(testUrl);
      
      expect(filters.searchTerm).toBe('test');
      expect(filters.connectionDepth).toBe(5);
      expect(filters.nodeConnectionsFilters?.nodeType).toBe('puzzle');
      expect(filters.selectedNodeId).toBe('puzzle-456');
      expect(filters.selectedNodeId).toBe('puzzle-456');
    });

    it('should handle malformed URLs gracefully', () => {
      const malformedUrl = 'not-a-valid-url';
      
      const filters = parseUrlFilters(malformedUrl);
      
      // Should return empty object for invalid URL
      expect(filters).toEqual({});
    });

    it('should handle current window location', () => {
      // Set up mock location with search params
      mockLocation.search = '?search=current&depth=2';
      mockLocation.href = 'http://localhost:5173/node-connections?search=current&depth=2';
      
      const filters = parseUrlFilters(); // Should use window.location.href
      
      expect(filters.searchTerm).toBe('current');
      expect(filters.connectionDepth).toBe(2);
    });
  });

  describe('Shareable URL Generation', () => {
    it('should create shareable URLs with all parameters', () => {
      const shareableUrl = createShareableUrl(sampleFilterState, '/custom-path');
      
      expect(shareableUrl).toContain('/custom-path?');
      expect(shareableUrl).toContain('search=integration+test');
      expect(shareableUrl).toContain('depth=4');
      expect(shareableUrl).toContain('nodeType=character');
      expect(shareableUrl).toContain('selectedNodeId=char-123');
      expect(shareableUrl).toContain('selectedNodeId=char-123');
    });

    it('should use current pathname when no base path provided', () => {
      mockLocation.pathname = '/current-view';
      
      const shareableUrl = createShareableUrl(sampleFilterState);
      
      expect(shareableUrl).toContain('/current-view?');
    });
  });

  describe('Round-trip Browser Navigation', () => {
    it('should maintain state through serialize -> navigate -> deserialize cycle', () => {
      // Step 1: Convert state to URL params
      const urlParams = filterStateToUrl(sampleFilterState);
      const queryString = urlParams.toString();
      
      // Step 2: Simulate browser navigation (update location)
      mockLocation.search = `?${queryString}`;
      mockLocation.href = `http://localhost:5173/node-connections?${queryString}`;
      
      // Step 3: Parse the "new" URL back to state
      const reconstructedFilters = parseUrlFilters();
      
      // Step 4: Verify all key properties are preserved
      expect(reconstructedFilters.searchTerm).toBe(sampleFilterState.searchTerm);
      expect(reconstructedFilters.connectionDepth).toBe(sampleFilterState.connectionDepth);
      expect(reconstructedFilters.activeView).toBe(sampleFilterState.activeView);
      
      // Test Set-based properties
      expect(reconstructedFilters.puzzleFilters?.selectedActs).toEqual(sampleFilterState.puzzleFilters.selectedActs);
      expect(reconstructedFilters.characterFilters?.selectedTiers).toEqual(sampleFilterState.characterFilters.selectedTiers);
      
      // Test node connections  
      expect(reconstructedFilters.nodeConnectionsFilters?.nodeType).toBe(sampleFilterState.nodeConnectionsFilters!.nodeType);
      expect(reconstructedFilters.selectedNodeId).toBe(sampleFilterState.selectedNodeId);
      expect(reconstructedFilters.selectedNodeId).toBe(sampleFilterState.selectedNodeId);
    });
  });

  describe('Browser History Integration', () => {
    it('should support back/forward navigation state reconstruction', () => {
      // Simulate a sequence of navigation states
      const states = [
        { search: 'first', depth: 3, nodeType: 'character', selectedNodeId: 'char-1' },
        { search: 'second', depth: 4, nodeType: 'puzzle', selectedNodeId: 'puzzle-1' },
        { search: 'third', depth: 5, nodeType: 'element', selectedNodeId: 'element-1' }
      ];
      
      const reconstructedStates = states.map(({ search, depth, nodeType, selectedNodeId }) => {
        // Simulate URL from browser history
        const mockUrl = `http://localhost:5173/view?search=${search}&depth=${depth}&nodeType=${nodeType}&selectedNodeId=${selectedNodeId}`;
        return parseUrlFilters(mockUrl);
      });
      
      // Verify each state is correctly reconstructed
      expect(reconstructedStates[0]!.searchTerm).toBe('first');
      expect(reconstructedStates[0]!.connectionDepth).toBe(3);
      expect(reconstructedStates[0]!.nodeConnectionsFilters?.nodeType).toBe('character');
      expect(reconstructedStates[0]!.selectedNodeId).toBe('char-1');
      expect(reconstructedStates[0]!.selectedNodeId).toBe('char-1');
      
      expect(reconstructedStates[1]!.searchTerm).toBe('second');
      expect(reconstructedStates[1]!.connectionDepth).toBe(4);
      expect(reconstructedStates[1]!.nodeConnectionsFilters?.nodeType).toBe('puzzle');
      expect(reconstructedStates[1]!.selectedNodeId).toBe('puzzle-1');
      expect(reconstructedStates[1]!.selectedNodeId).toBe('puzzle-1');
      
      expect(reconstructedStates[2]!.searchTerm).toBe('third');
      expect(reconstructedStates[2]!.connectionDepth).toBe(5);
      expect(reconstructedStates[2]!.nodeConnectionsFilters?.nodeType).toBe('element');
      expect(reconstructedStates[2]!.selectedNodeId).toBe('element-1');
      expect(reconstructedStates[2]!.selectedNodeId).toBe('element-1');
    });
  });
});