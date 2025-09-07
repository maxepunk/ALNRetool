import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGraphLayout } from './useGraphLayout';
import type { GraphNode } from '@/lib/graph/types';

// Mock the dependencies
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: any) => value
}));

vi.mock('./graph/useGraphVisibility', () => ({
  useGraphVisibility: ({ filteredNodes, allEdges, activeFilteredTypes, connectionDepth }: any) => {
    // Simulate the real focus mode behavior from useGraphVisibility.ts
    let visibleNodes = filteredNodes;
    
    // Focus mode: at depth 0 with active filters, only show seed nodes (nodes marked with isFromFilteredType)
    if (activeFilteredTypes && activeFilteredTypes.size > 0) {
      if (connectionDepth === 0) {
        // At depth 0, ONLY show seed nodes (those with isFromFilteredType = true)
        visibleNodes = filteredNodes.filter((n: any) => n.data?.isFromFilteredType === true);
      } else {
        // At depth > 0, would normally expand from seed nodes to include connected nodes
        // Since our test has no edges, we can't simulate expansion properly
        // In a real scenario, this would include seed nodes + their connected neighbors
        visibleNodes = filteredNodes.filter((n: any) => n.data?.isFromFilteredType === true);
      }
    }
    // When no active filters, show all filtered nodes (normal behavior)
    
    // Filter edges to only include those between visible nodes
    const visibleNodeIds = new Set(visibleNodes.map((n: any) => n.id));
    const visibleEdges = (allEdges || []).filter((e: any) => 
      visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
    
    return {
      visibleNodes,
      visibleEdges,
      allEdges: allEdges || []
    };
  }
}));

vi.mock('./graph/useLayoutEngine', () => ({
  useLayoutEngine: ({ visibleNodes }: any) => ({
    layoutedNodes: visibleNodes
  })
}));

vi.mock('./graph/useActiveFilteredTypes', () => ({
  useActiveFilteredTypes: ({ 
    entityVisibility,
    characterType, 
    characterSelectedTiers, 
    characterOwnershipStatus,
    puzzleSelectedActs,
    puzzleCompletionStatus,
    elementBasicTypes,
    elementStatus,
    elementContentStatus,
    elementHasIssues,
    elementLastEditedRange
  }: any) => {
    const activeTypes = new Set<string>();
    
    // Check which entity types have active filters (EXACTLY matching real implementation)
    // Characters: active when SOME but not ALL filters are selected AND visible
    if ((characterType && characterType !== 'all') || 
        (characterSelectedTiers && characterSelectedTiers.size > 0 && characterSelectedTiers.size < 3) ||
        (characterOwnershipStatus && characterOwnershipStatus.size > 0)) {
      if (entityVisibility?.character !== false) {
        activeTypes.add('character');
      }
    }
    
    // Puzzles: active when SOME but not ALL filters are selected (3 acts total) AND visible
    if ((puzzleCompletionStatus && puzzleCompletionStatus !== 'all') ||
        (puzzleSelectedActs && puzzleSelectedActs.size > 0 && puzzleSelectedActs.size < 3)) {
      if (entityVisibility?.puzzle !== false) {
        activeTypes.add('puzzle');
      }
    }
    
    // Elements: active when SOME but not ALL filters are selected AND visible
    if ((elementBasicTypes && elementBasicTypes.size > 0 && elementBasicTypes.size < 7) ||
        (elementStatus && elementStatus.size > 0) ||
        (elementContentStatus && elementContentStatus.size > 0) ||
        (elementHasIssues !== null && elementHasIssues !== undefined) ||
        (elementLastEditedRange && elementLastEditedRange !== 'all')) {
      if (entityVisibility?.element !== false) {
        activeTypes.add('element');
      }
    }
    
    return activeTypes;
  }
}));

describe('useGraphLayout - Focus Mode Filtering', () => {
  const mockCharacter = {
    id: 'char1',
    type: 'character',
    position: { x: 0, y: 0 },
    data: {
      label: 'Locked Character',
      metadata: { entityType: 'character' },
      entity: {
        type: 'NPC',
        tier: 'A',
        ownedElementIds: [],
        characterPuzzleIds: [],
        connections: []
      }
    }
  };

  const mockPuzzle = {
    id: 'puzzle1',
    type: 'puzzle',
    position: { x: 100, y: 0 },
    data: {
      label: 'Test Puzzle',
      metadata: { entityType: 'puzzle' },
      entity: {
        timing: ['Act 1'],
        rewardIds: []
      }
    }
  };

  const mockElement = {
    id: 'elem1',
    type: 'element',
    position: { x: 200, y: 0 },
    data: {
      label: 'Test Element',
      metadata: { entityType: 'element' },
      entity: {
        basicType: 'Item',
        status: 'Done'
      }
    }
  };

  const defaultParams = {
    nodes: [mockCharacter, mockPuzzle, mockElement] as GraphNode[],
    edges: [],
    viewConfig: { 
      name: 'Test View',
      description: 'Test view for focus mode',
      filters: { entityTypes: ['all'] as ('all' | 'timeline' | 'puzzle' | 'character' | 'element')[] },
      layout: { 
        algorithm: 'dagre' as const,
        direction: 'LR' as const
      }
    },
    entityVisibility: {
      character: true,
      puzzle: true,
      element: true,
      timeline: true
    },
    connectionDepth: 0
  };

  it('should exclude unfiltered entity types when character filter is active', () => {
    const { result } = renderHook(() => 
      useGraphLayout({
        ...defaultParams,
        characterOwnershipStatus: new Set(['Locked']) // Active character filter
      })
    );

    // Should only include the locked character, not puzzles or elements
    expect(result.current.reactFlowNodes).toHaveLength(1);
    expect(result.current.reactFlowNodes[0]?.id).toBe('char1');
  });

  it('should show all visible entities when no filters are active', () => {
    const { result } = renderHook(() => 
      useGraphLayout({
        ...defaultParams
        // No active filters
      })
    );

    // Should include all visible entities
    expect(result.current.reactFlowNodes).toHaveLength(3);
  });

  it('should only show filtered puzzle when puzzle filter is active', () => {
    const { result } = renderHook(() => 
      useGraphLayout({
        ...defaultParams,
        puzzleCompletionStatus: 'incomplete' // Active puzzle filter
      })
    );

    // Should only include the incomplete puzzle
    expect(result.current.reactFlowNodes).toHaveLength(1);
    expect(result.current.reactFlowNodes[0]?.id).toBe('puzzle1');
  });

  it('should show nodes from multiple entity types when each has active filters', () => {
    const { result } = renderHook(() => 
      useGraphLayout({
        ...defaultParams,
        characterOwnershipStatus: new Set(['Locked']), // Active character filter
        puzzleCompletionStatus: 'incomplete' // Active puzzle filter
      })
    );

    // Should include both character and puzzle, but not element
    expect(result.current.reactFlowNodes).toHaveLength(2);
    const nodeIds = result.current.reactFlowNodes.map(n => n.id);
    expect(nodeIds).toContain('char1');
    expect(nodeIds).toContain('puzzle1');
    expect(nodeIds).not.toContain('elem1');
  });

  it('should respect entity visibility toggles', () => {
    const { result } = renderHook(() => 
      useGraphLayout({
        ...defaultParams,
        entityVisibility: {
          character: true,
          puzzle: false, // Puzzle visibility OFF
          element: true,
          timeline: true
        },
        characterOwnershipStatus: new Set(['Locked']) // Active character filter
      })
    );

    // Should only show character (puzzle hidden by visibility, element excluded by focus mode)
    expect(result.current.reactFlowNodes).toHaveLength(1);
    expect(result.current.reactFlowNodes[0]?.id).toBe('char1');
  });
});