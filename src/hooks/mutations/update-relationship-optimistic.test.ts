import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { useEntityMutation } from './entityMutations';
import { puzzlesApi, elementsApi } from '@/services/api';

// Mock the API module
vi.mock('@/services/api');

/**
 * Test suite for UPDATE mutations with relationship changes
 * Verifies that edges are updated optimistically when relationships change
 */
describe('UPDATE Mutation: Optimistic Relationship Updates', () => {
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

  it('should update edges optimistically when changing a single relationship', async () => {
    // Arrange - initial graph with puzzle and two characters
    const initialData = {
      nodes: [
        {
          id: 'puzzle-1',
          type: 'puzzle',
          data: {
            entity: {
              id: 'puzzle-1',
              name: 'Test Puzzle',
              ownerId: 'char-1', // Initial owner
            },
            label: 'Test Puzzle',
            metadata: {},
          },
        },
        {
          id: 'char-1',
          type: 'character',
          data: {
            entity: {
              id: 'char-1',
              name: 'Old Owner',
              characterPuzzleIds: ['puzzle-1'],
            },
            label: 'Old Owner',
            metadata: {},
          },
        },
        {
          id: 'char-2',
          type: 'character',
          data: {
            entity: {
              id: 'char-2',
              name: 'New Owner',
              characterPuzzleIds: [],
            },
            label: 'New Owner',
            metadata: {},
          },
        },
      ],
      edges: [
        {
          id: 'e::puzzle-1::ownerId::char-1',
          source: 'puzzle-1',
          target: 'char-1',
          type: 'relation',
          data: { 
            metadata: { relationField: 'ownerId' },
            pendingMutationCount: 0
          },
        },
      ],
    };

    const queryKey = ['graph', 'complete'];
    queryClient.setQueryData(queryKey, JSON.parse(JSON.stringify(initialData)));

    // Mock successful API response
    vi.mocked(puzzlesApi).update = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'puzzle-1', name: 'Test Puzzle', ownerId: 'char-2' },
      delta: {
        changes: {
          nodes: { created: [], updated: [], deleted: [] },
          edges: {
            created: [{ id: 'e::puzzle-1::ownerId::char-2' }],
            updated: [],
            deleted: [{ id: 'e::puzzle-1::ownerId::char-1' }],
          },
        },
      },
    });

    // Act - update puzzle owner
    const { result } = renderHook(
      () => useEntityMutation('puzzle', 'update'),
      { wrapper: createWrapper(queryClient) }
    );

    act(() => {
      result.current.mutate({
        id: 'puzzle-1',
        name: 'Test Puzzle',
        ownerId: 'char-2', // Change owner from char-1 to char-2
      });
    });

    // Assert - check optimistic updates
    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      
      // Puzzle node should be updated
      const puzzleNode = data.nodes.find((n: any) => n.id === 'puzzle-1');
      expect(puzzleNode.data.entity.ownerId).toBe('char-2');
      // Note: pendingMutationCount may already be 0 if server responds quickly

      // Old edge should be removed
      const oldEdge = data.edges.find((e: any) => 
        e.id === 'e::puzzle-1::ownerId::char-1'
      );
      expect(oldEdge).toBeUndefined();

      // New edge should be created
      const newEdge = data.edges.find((e: any) => 
        e.id === 'e::puzzle-1::ownerId::char-2'
      );
      expect(newEdge).toBeDefined();
      expect(newEdge.source).toBe('puzzle-1');
      expect(newEdge.target).toBe('char-2');
      expect(newEdge.data.pendingMutationCount).toBe(0); // Should be 0 after successful mutation

      // Bidirectional updates: old owner should have puzzle removed
      const oldOwner = data.nodes.find((n: any) => n.id === 'char-1');
      expect(oldOwner.data.entity.characterPuzzleIds).toEqual([]);

      // New owner should have puzzle added
      const newOwner = data.nodes.find((n: any) => n.id === 'char-2');
      expect(newOwner.data.entity.characterPuzzleIds).toEqual(['puzzle-1']);
    });
  });

  it('should update edges for array relationships', async () => {
    // Arrange - element with multiple puzzle relationships
    const initialData = {
      nodes: [
        {
          id: 'elem-1',
          type: 'element',
          data: {
            entity: {
              id: 'elem-1',
              name: 'Test Element',
              puzzleIds: ['puzzle-1', 'puzzle-2'], // Initial puzzles
            },
            label: 'Test Element',
            metadata: {},
          },
        },
      ],
      edges: [
        {
          id: 'e::elem-1::puzzleIds::puzzle-1',
          source: 'elem-1',
          target: 'puzzle-1',
          type: 'relation',
          data: { 
            metadata: { relationField: 'puzzleIds' },
            pendingMutationCount: 0
          },
        },
        {
          id: 'e::elem-1::puzzleIds::puzzle-2',
          source: 'elem-1',
          target: 'puzzle-2',
          type: 'relation',
          data: { 
            metadata: { relationField: 'puzzleIds' },
            pendingMutationCount: 0
          },
        },
      ],
    };

    const queryKey = ['graph', 'complete'];
    queryClient.setQueryData(queryKey, JSON.parse(JSON.stringify(initialData)));

    // Mock API - use elementsApi for element mutations
    vi.mocked(elementsApi).update = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'elem-1', name: 'Test Element', puzzleIds: ['puzzle-2', 'puzzle-3'] },
    });

    // Act - update element's puzzle relationships
    const { result } = renderHook(
      () => useEntityMutation('element', 'update'),
      { wrapper: createWrapper(queryClient) }
    );

    act(() => {
      result.current.mutate({
        id: 'elem-1',
        puzzleIds: ['puzzle-2', 'puzzle-3'], // Remove puzzle-1, add puzzle-3
      });
    });

    // Assert
    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;

      // Edge to puzzle-1 should be removed
      const edge1 = data.edges.find((e: any) => 
        e.id === 'e::elem-1::puzzleIds::puzzle-1'
      );
      expect(edge1).toBeUndefined();

      // Edge to puzzle-2 should remain
      const edge2 = data.edges.find((e: any) => 
        e.id === 'e::elem-1::puzzleIds::puzzle-2'
      );
      expect(edge2).toBeDefined();

      // New edge to puzzle-3 should be added
      const edge3 = data.edges.find((e: any) => 
        e.id === 'e::elem-1::puzzleIds::puzzle-3'
      );
      expect(edge3).toBeDefined();
      expect(edge3.data.pendingMutationCount).toBe(0); // Should be 0 after successful mutation
    });
  });

  it('should apply optimistic updates immediately even for mutations that will fail', async () => {
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
              ownerId: 'char-1',
            },
            label: 'Test Puzzle',
            metadata: {},
          },
        },
        {
          id: 'char-1',
          type: 'character',
          data: {
            entity: {
              id: 'char-1',
              name: 'Old Owner',
              characterPuzzleIds: ['puzzle-1'],
            },
            label: 'Old Owner',
            metadata: {},
          },
        },
        {
          id: 'char-2',
          type: 'character',
          data: {
            entity: {
              id: 'char-2',
              name: 'New Owner',
              characterPuzzleIds: [],
            },
            label: 'New Owner',
            metadata: {},
          },
        },
      ],
      edges: [
        {
          id: 'e::puzzle-1::ownerId::char-1',
          source: 'puzzle-1',
          target: 'char-1',
          type: 'relation',
          data: { 
            metadata: { relationField: 'ownerId' },
            pendingMutationCount: 0
          },
        },
      ],
    };

    const queryKey = ['graph', 'complete'];
    queryClient.setQueryData(queryKey, JSON.parse(JSON.stringify(initialData)));

    // Mock API with controlled promise that we'll reject later
    let rejectMutation: (error: Error) => void;
    const mutationPromise = new Promise((_, reject) => {
      rejectMutation = reject;
    });
    vi.mocked(puzzlesApi).update = vi.fn().mockReturnValue(mutationPromise);

    // Act
    const { result } = renderHook(
      () => useEntityMutation('puzzle', 'update'),
      { wrapper: createWrapper(queryClient) }
    );

    // Trigger mutation
    result.current.mutate({
      id: 'puzzle-1',
      ownerId: 'char-2', // Try to change owner
    });

    // Assert - Check optimistic update was applied immediately
    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      
      // New edge should be created optimistically
      const newEdge = data.edges.find((e: any) => 
        e.id === 'e::puzzle-1::ownerId::char-2'
      );
      expect(newEdge).toBeDefined();
      expect(newEdge.data.pendingMutationCount).toBe(1); // Should be 1 during optimistic phase
      
      // Old edge should be removed optimistically
      const oldEdge = data.edges.find((e: any) => 
        e.id === 'e::puzzle-1::ownerId::char-1'
      );
      expect(oldEdge).toBeUndefined();
      
      // Node should be updated optimistically
      const puzzleNode = data.nodes.find((n: any) => n.id === 'puzzle-1');
      expect(puzzleNode.data.entity.ownerId).toBe('char-2');
      expect(puzzleNode.data.metadata.pendingMutationCount).toBe(1);
      
      // Bidirectional updates should be applied optimistically
      const oldOwner = data.nodes.find((n: any) => n.id === 'char-1');
      expect(oldOwner.data.entity.characterPuzzleIds).toEqual([]);
      
      const newOwner = data.nodes.find((n: any) => n.id === 'char-2');
      expect(newOwner.data.entity.characterPuzzleIds).toContain('puzzle-1');
    }, { timeout: 100 });

    // Cleanup - reject the promise to prevent hanging
    rejectMutation!(new Error('Update failed'));
    
    // Wait for error to be processed before test ends
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should restore original state after mutation failure', async () => {
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
              ownerId: 'char-1',
            },
            label: 'Test Puzzle',
            metadata: {},
          },
        },
        {
          id: 'char-1',
          type: 'character',
          data: {
            entity: {
              id: 'char-1',
              name: 'Old Owner',
              characterPuzzleIds: ['puzzle-1'],
            },
            label: 'Old Owner',
            metadata: {},
          },
        },
        {
          id: 'char-2',
          type: 'character',
          data: {
            entity: {
              id: 'char-2',
              name: 'New Owner',
              characterPuzzleIds: [],
            },
            label: 'New Owner',
            metadata: {},
          },
        },
      ],
      edges: [
        {
          id: 'e::puzzle-1::ownerId::char-1',
          source: 'puzzle-1',
          target: 'char-1',
          type: 'relation',
          data: { 
            metadata: { relationField: 'ownerId' },
            pendingMutationCount: 0
          },
        },
      ],
    };

    const queryKey = ['graph', 'complete'];
    queryClient.setQueryData(queryKey, JSON.parse(JSON.stringify(initialData)));

    // Mock API failure - immediate rejection for predictable rollback
    vi.mocked(puzzlesApi).update = vi.fn().mockRejectedValue(new Error('Update failed'));

    // Act
    const { result } = renderHook(
      () => useEntityMutation('puzzle', 'update'),
      { wrapper: createWrapper(queryClient) }
    );

    // Trigger mutation
    result.current.mutate({
      id: 'puzzle-1',
      ownerId: 'char-2', // Try to change owner
    });

    // Assert - Wait for rollback to complete and verify original state is restored
    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      
      // Original edge should be restored
      const oldEdge = data.edges.find((e: any) => 
        e.id === 'e::puzzle-1::ownerId::char-1'
      );
      expect(oldEdge).toBeDefined();
      expect(oldEdge.data.pendingMutationCount).toBe(0); // Should be 0 after rollback

      // Optimistic edge should be removed
      const newEdge = data.edges.find((e: any) => 
        e.id === 'e::puzzle-1::ownerId::char-2'
      );
      expect(newEdge).toBeUndefined();

      // Node should be restored to original state
      const puzzleNode = data.nodes.find((n: any) => n.id === 'puzzle-1');
      expect(puzzleNode.data.entity.ownerId).toBe('char-1');
      expect(puzzleNode.data.metadata.pendingMutationCount).toBe(0);
      
      // Bidirectional updates should be reverted
      const oldOwner = data.nodes.find((n: any) => n.id === 'char-1');
      expect(oldOwner.data.entity.characterPuzzleIds).toContain('puzzle-1');
      
      const newOwner = data.nodes.find((n: any) => n.id === 'char-2');
      expect(newOwner.data.entity.characterPuzzleIds).toEqual([]);
    });
  });
});