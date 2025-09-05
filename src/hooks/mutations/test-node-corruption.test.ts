import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { useEntityMutation } from './entityMutations';
import { puzzlesApi } from '@/services/api';

// Mock the API module
vi.mock('@/services/api');

describe('UPDATE Mutation: Node Corruption Bug', () => {
  let queryClient: QueryClient;
  
  const createWrapper = (queryClient: QueryClient) => {
    return ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should NOT corrupt node when updating only specific fields', async () => {
    // Arrange - initial graph with complete puzzle node
    const initialData = {
      nodes: [
        {
          id: 'puzzle-1',
          type: 'puzzle',
          data: {
            entity: {
              id: 'puzzle-1',
              name: 'Test Puzzle',  // IMPORTANT: name field exists
              description: 'A test puzzle',
              ownerId: 'char-1',
              rewardIds: ['elem-1', 'elem-2'],
              version: 1,
            },
            label: 'Test Puzzle',
            metadata: {
              entityType: 'puzzle',
            },
          },
        },
      ],
      edges: [],
    };

    const queryKey = ['graph', 'complete'];
    queryClient.setQueryData(queryKey, JSON.parse(JSON.stringify(initialData)));

    // Mock API response
    vi.mocked(puzzlesApi).update = vi.fn().mockResolvedValue({
      success: true,
      data: { 
        id: 'puzzle-1', 
        name: 'Test Puzzle',  // Server returns complete entity
        description: 'A test puzzle',
        ownerId: 'char-1',
        rewardIds: ['elem-3', 'elem-4'],  // Updated field
        version: 2,
      },
    });

    // Act - update ONLY rewardIds (partial update)
    const { result } = renderHook(
      () => useEntityMutation('puzzle', 'update'),
      { wrapper: createWrapper(queryClient) }
    );

    act(() => {
      // THIS IS THE CRITICAL TEST: Only sending partial fields
      result.current.mutate({
        id: 'puzzle-1',
        rewardIds: ['elem-3', 'elem-4'],
        // Note: NO name field sent!
        // version might be undefined
      });
    });

    // Assert - check that node is NOT corrupted after optimistic update
    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      const puzzleNode = data.nodes.find((n: any) => n.id === 'puzzle-1');
      
      // The node should still have ALL required fields
      expect(puzzleNode).toBeDefined();
      expect(puzzleNode.type).toBe('puzzle');  // Should NOT be 'placeholder'
      expect(puzzleNode.data.entity.name).toBe('Test Puzzle');  // Name should be preserved!
      expect(puzzleNode.data.entity.description).toBe('A test puzzle');  // Other fields preserved
      expect(puzzleNode.data.entity.rewardIds).toEqual(['elem-3', 'elem-4']);  // Updated field applied
      
      // The node should be marked as optimistic
      expect(puzzleNode.data.metadata.isOptimistic).toBe(true);
    });
  });

  it('should NOT overwrite fields with undefined values', async () => {
    // Arrange
    const initialData = {
      nodes: [
        {
          id: 'puzzle-1',
          type: 'puzzle',
          data: {
            entity: {
              id: 'puzzle-1',
              name: 'Test Puzzle',
              version: 1,
            },
            label: 'Test Puzzle',
            metadata: {
              entityType: 'puzzle',
            },
          },
        },
      ],
      edges: [],
    };

    const queryKey = ['graph', 'complete'];
    queryClient.setQueryData(queryKey, JSON.parse(JSON.stringify(initialData)));

    // Mock API
    vi.mocked(puzzlesApi).update = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'puzzle-1', name: 'Updated Name', version: 2 },
    });

    // Act - send update with undefined version
    const { result } = renderHook(
      () => useEntityMutation('puzzle', 'update'),
      { wrapper: createWrapper(queryClient) }
    );

    act(() => {
      result.current.mutate({
        id: 'puzzle-1',
        name: 'Updated Name',
        version: undefined,  // Explicitly undefined
      });
    });

    // Assert
    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      const puzzleNode = data.nodes.find((n: any) => n.id === 'puzzle-1');
      
      // Version should NOT be overwritten with undefined
      expect(puzzleNode.data.entity.version).not.toBeUndefined();
      expect(puzzleNode.data.entity.version).toBe(1);  // Should keep original
      expect(puzzleNode.data.entity.name).toBe('Updated Name');  // Should update name
    });
  });
});