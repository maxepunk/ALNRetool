import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGraphFilters } from './useGraphFilters';
import type { Node, Edge } from '@xyflow/react';
import type { Element, Puzzle } from '@/types/notion/app';

describe('useGraphFilters', () => {
  // Clear sessionStorage before each test
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  const mockNodes: Node[] = [
    { id: 'p1', type: 'puzzleNode', position: { x: 0, y: 0 }, data: { label: 'Puzzle 1', entity: { id: 'p1', name: 'Puzzle 1' } } },
    { id: 'p2', type: 'puzzleNode', position: { x: 100, y: 0 }, data: { label: 'Puzzle 2', entity: { id: 'p2', name: 'Puzzle 2' } } },
    { id: 'e1', type: 'elementNode', position: { x: 200, y: 0 }, data: { label: 'Element 1', entity: { id: 'e1', name: 'Element 1' } } },
    { id: 'e2', type: 'elementNode', position: { x: 300, y: 0 }, data: { label: 'Element 2', entity: { id: 'e2', name: 'Element 2' } } },
  ];

  const mockEdges: Edge[] = [
    { id: 'e1-p1', source: 'e1', target: 'p1', type: 'dependency' },
    { id: 'p1-e2', source: 'p1', target: 'e2', type: 'reward' },
  ];

  const mockElements: Element[] = [
    { id: 'e1', name: 'Element 1', firstAvailable: 'Act 0' } as Element,
    { id: 'e2', name: 'Element 2', firstAvailable: 'Act 1' } as Element,
  ];

  const mockPuzzles: Puzzle[] = [
    { id: 'p1', name: 'Puzzle 1', timing: ['Act 0'] } as Puzzle,
    { id: 'p2', name: 'Puzzle 2', timing: ['Act 1', 'Act 2'] } as Puzzle,
  ];

  it('initializes with empty filter state', () => {
    const { result } = renderHook(() =>
      useGraphFilters(mockNodes, mockEdges, mockElements, mockPuzzles)
    );

    expect(result.current.filterState.searchTerm).toBe('');
    expect(result.current.filterState.selectedActs.size).toBe(0);
    expect(result.current.filterState.selectedPuzzleId).toBeNull();
    expect(result.current.filteredNodes).toEqual(mockNodes);
    expect(result.current.filteredEdges).toEqual(mockEdges);
  });

  it('filters nodes by search term', () => {
    const { result } = renderHook(() =>
      useGraphFilters(mockNodes, mockEdges, mockElements, mockPuzzles)
    );

    act(() => {
      result.current.onFilterChange({
        searchTerm: 'puzzle 1',
        selectedActs: new Set(),
        selectedPuzzleId: null,
      });
    });

    // Should include Puzzle 1 and its connected nodes
    const nodeIds = result.current.filteredNodes.map(n => n.id);
    expect(nodeIds).toContain('p1');
    expect(nodeIds).toContain('e1'); // Connected to p1
    expect(nodeIds).toContain('e2'); // Connected to p1
  });

  it('filters by Act selection', () => {
    const { result } = renderHook(() =>
      useGraphFilters(mockNodes, mockEdges, mockElements, mockPuzzles)
    );

    act(() => {
      result.current.onFilterChange({
        searchTerm: '',
        selectedActs: new Set(['Act 0']),
        selectedPuzzleId: null,
      });
    });

    // Should include Act 0 elements and puzzles
    const nodeIds = result.current.filteredNodes.map(n => n.id);
    expect(nodeIds).toContain('e1'); // Element in Act 0
    expect(nodeIds).toContain('p1'); // Puzzle in Act 0
  });

  it('isolates puzzle with dependencies', () => {
    const { result } = renderHook(() =>
      useGraphFilters(mockNodes, mockEdges, mockElements, mockPuzzles)
    );

    act(() => {
      result.current.onFilterChange({
        searchTerm: '',
        selectedActs: new Set(),
        selectedPuzzleId: 'p1',
      });
    });

    // Should include p1 and its connected nodes
    const nodeIds = result.current.filteredNodes.map(n => n.id);
    expect(nodeIds).toContain('p1');
    expect(nodeIds).toContain('e1'); // Requirement
    expect(nodeIds).toContain('e2'); // Reward
    expect(nodeIds).not.toContain('p2'); // Not connected
  });

  it('persists filter state to sessionStorage', () => {
    const { result } = renderHook(() =>
      useGraphFilters(mockNodes, mockEdges, mockElements, mockPuzzles)
    );

    const newFilterState = {
      searchTerm: 'test',
      selectedActs: new Set(['Act 1']),
      selectedPuzzleId: 'p1',
    };

    act(() => {
      result.current.onFilterChange(newFilterState);
    });

    // Check sessionStorage
    const stored = JSON.parse(sessionStorage.getItem('alnretool-graph-filters') || '{}');
    expect(stored.searchTerm).toBe('test');
    expect(stored.selectedActs).toEqual(['Act 1']);
    expect(stored.selectedPuzzleId).toBe('p1');
  });

  it('restores filter state from sessionStorage', () => {
    // Pre-populate sessionStorage
    sessionStorage.setItem('alnretool-graph-filters', JSON.stringify({
      searchTerm: 'restored',
      selectedActs: ['Act 2'],
      selectedPuzzleId: 'p2',
    }));

    const { result } = renderHook(() =>
      useGraphFilters(mockNodes, mockEdges, mockElements, mockPuzzles)
    );

    expect(result.current.filterState.searchTerm).toBe('restored');
    expect(result.current.filterState.selectedActs.has('Act 2')).toBe(true);
    expect(result.current.filterState.selectedPuzzleId).toBe('p2');
  });

  it('clears all filters', () => {
    const { result } = renderHook(() =>
      useGraphFilters(mockNodes, mockEdges, mockElements, mockPuzzles)
    );

    // Set some filters first
    act(() => {
      result.current.onFilterChange({
        searchTerm: 'test',
        selectedActs: new Set(['Act 0', 'Act 1']),
        selectedPuzzleId: 'p1',
      });
    });

    // Clear filters
    act(() => {
      result.current.onClearFilters();
    });

    expect(result.current.filterState.searchTerm).toBe('');
    expect(result.current.filterState.selectedActs.size).toBe(0);
    expect(result.current.filterState.selectedPuzzleId).toBeNull();
    expect(result.current.filteredNodes).toEqual(mockNodes);
  });
});