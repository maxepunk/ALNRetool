/**
 * Bug 7 Test: Parent Entity Cache Refresh on Child Deletion
 * 
 * Verifies that DELETE mutations properly clean up parent relationship arrays
 * when children are deleted.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { useEntityMutation } from './entityMutations';
import { elementsApi } from '@/services/api';

// Mock the API
vi.mock('@/services/api');

// ViewStore mock no longer needed - mutations use unified cache key

describe('Bug 7: Parent Entity Cache Refresh', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should remove deleted child ID from parent relationship arrays', async () => {
    // Setup: Mock graph data with parent-child relationship
    const graphData = {
      nodes: [
        {
          id: 'char-1',
          type: 'character',
          data: {
            entity: {
              id: 'char-1',
              name: 'Parent Character',
              ownedElementIds: ['elem-1', 'elem-2'], // Parent has 2 children
              lastEdited: '2024-01-01',
              version: 1,
            },
            label: 'Parent Character',
          },
        },
        {
          id: 'elem-1',
          type: 'element',
          data: {
            entity: {
              id: 'elem-1',
              name: 'Child Element 1',
              ownerId: 'char-1',
              lastEdited: '2024-01-01',
              version: 1,
            },
            label: 'Child Element 1',
          },
        },
        {
          id: 'elem-2',
          type: 'element',
          data: {
            entity: {
              id: 'elem-2',
              name: 'Child Element 2',
              ownerId: 'char-1',
              lastEdited: '2024-01-01',
              version: 1,
            },
            label: 'Child Element 2',
          },
        },
      ],
      edges: [
        {
          id: 'e-char-1-elem-1',
          source: 'char-1',
          target: 'elem-1',
          type: 'ownership',
          data: {
            relationField: 'ownedElementIds',
          },
        },
        {
          id: 'e-char-1-elem-2',
          source: 'char-1',
          target: 'elem-2',
          type: 'ownership',
          data: {
            relationField: 'ownedElementIds',
          },
        },
      ],
    };

    // Pre-populate cache
    queryClient.setQueryData(['graph', 'complete'], graphData);

    // Mock successful delete
    vi.mocked(elementsApi).delete = vi.fn().mockResolvedValue({
      success: true,
      data: null,
    });

    // Render hook
    const wrapper = ({ children }: { children: ReactNode }) => 
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(
      () => useEntityMutation('element', 'delete'),
      { wrapper }
    );

    // Act: Delete child element
    await act(async () => {
      result.current.mutate('elem-1');
    });

    // Wait for optimistic update
    await waitFor(() => {
      const updatedData = queryClient.getQueryData(['graph', 'complete']) as any;
      
      // Assert: Parent's relationship array should be updated
      const parentNode = updatedData.nodes.find((n: any) => n.id === 'char-1');
      expect(parentNode).toBeDefined();
      
      // Parent should only have elem-2 now, elem-1 should be removed
      expect(parentNode.data.entity.ownedElementIds).toEqual(['elem-2']);
      
      // Child node should be removed
      const deletedNode = updatedData.nodes.find((n: any) => n.id === 'elem-1');
      expect(deletedNode).toBeUndefined();
      
      // Edge should be removed
      const deletedEdge = updatedData.edges.find((e: any) => e.target === 'elem-1');
      expect(deletedEdge).toBeUndefined();
    });
  });

  it('should handle multiple parent relationships when deleting a child', async () => {
    // Setup: Element with multiple parent relationships
    const graphData = {
      nodes: [
        {
          id: 'puzzle-1',
          type: 'puzzle',
          data: {
            entity: {
              id: 'puzzle-1',
              name: 'Puzzle 1',
              puzzleElementIds: ['elem-1', 'elem-2'],
              rewardIds: ['elem-1', 'elem-3'], // elem-1 is both requirement AND reward
              lastEdited: '2024-01-01',
              version: 1,
            },
            label: 'Puzzle 1',
          },
        },
        {
          id: 'elem-1',
          type: 'element',
          data: {
            entity: {
              id: 'elem-1',
              name: 'Multi-Parent Element',
              requiredForPuzzleIds: ['puzzle-1'],
              rewardedByPuzzleIds: ['puzzle-1'],
              lastEdited: '2024-01-01',
              version: 1,
            },
            label: 'Multi-Parent Element',
          },
        },
      ],
      edges: [
        {
          id: 'e-puzzle-1-elem-1-req',
          source: 'puzzle-1',
          target: 'elem-1',
          type: 'requirement',
          data: {
            relationField: 'puzzleElementIds',
          },
        },
        {
          id: 'e-puzzle-1-elem-1-reward',
          source: 'puzzle-1',
          target: 'elem-1',
          type: 'reward',
          data: {
            relationField: 'rewardIds',
          },
        },
      ],
    };

    // Pre-populate cache
    queryClient.setQueryData(['graph', 'complete'], graphData);

    // Mock successful delete
    vi.mocked(elementsApi).delete = vi.fn().mockResolvedValue({
      success: true,
      data: null,
    });

    // Render hook
    const wrapper = ({ children }: { children: ReactNode }) => 
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(
      () => useEntityMutation('element', 'delete'),
      { wrapper }
    );

    // Act: Delete element with multiple parent relationships
    await act(async () => {
      result.current.mutate('elem-1');
    });

    // Wait for optimistic update
    await waitFor(() => {
      const updatedData = queryClient.getQueryData(['graph', 'complete']) as any;
      
      // Assert: Both parent relationship arrays should be updated
      const puzzleNode = updatedData.nodes.find((n: any) => n.id === 'puzzle-1');
      expect(puzzleNode).toBeDefined();
      
      // elem-1 should be removed from both arrays
      expect(puzzleNode.data.entity.puzzleElementIds).toEqual(['elem-2']);
      expect(puzzleNode.data.entity.rewardIds).toEqual(['elem-3']);
      
      // All edges to elem-1 should be removed
      const deletedEdges = updatedData.edges.filter((e: any) => e.target === 'elem-1');
      expect(deletedEdges).toHaveLength(0);
    });
  });
});