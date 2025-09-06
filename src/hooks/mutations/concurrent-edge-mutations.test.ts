import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { useEntityMutation } from './entityMutations';
import { puzzlesApi } from '@/services/api';

// Mock the API modules
vi.mock('@/services/api');

/**
 * Test suite for concurrent edge mutations race condition fix
 * Verifies that multiple mutations affecting different edges don't overwrite each other
 */
describe('Concurrent Edge Mutations', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => React.ReactElement;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    wrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle concurrent mutations on different relationships without race conditions', async () => {
    // Initial graph state with a character and two puzzles
    const initialGraphData = {
      nodes: [
        {
          id: 'char-1',
          type: 'character',
          data: {
            entity: {
              id: 'char-1',
              name: 'Test Character',
              characterPuzzleIds: [],
              ownedElementIds: [],
            },
            label: 'Test Character',
            metadata: { entityType: 'character', pendingMutationCount: 0 },
          },
        },
        {
          id: 'puzzle-1',
          type: 'puzzle',
          data: {
            entity: {
              id: 'puzzle-1',
              name: 'Puzzle 1',
              ownerId: null,
            },
            label: 'Puzzle 1',
            metadata: { entityType: 'puzzle', pendingMutationCount: 0 },
          },
        },
        {
          id: 'puzzle-2',
          type: 'puzzle',
          data: {
            entity: {
              id: 'puzzle-2',
              name: 'Puzzle 2',
              ownerId: null,
            },
            label: 'Puzzle 2',
            metadata: { entityType: 'puzzle', pendingMutationCount: 0 },
          },
        },
      ],
      edges: [],
    };

    const queryKey = ['graph', 'complete'];
    queryClient.setQueryData(queryKey, JSON.parse(JSON.stringify(initialGraphData)));

    // Mock API responses with delays to simulate concurrent processing
    let resolveMutation1: (value: unknown) => void;
    let resolveMutation2: (value: unknown) => void;
    
    const mutation1Promise = new Promise(resolve => {
      resolveMutation1 = resolve;
    });
    
    const mutation2Promise = new Promise(resolve => {
      resolveMutation2 = resolve;
    });

    // Track which mutation is being called
    let callCount = 0;
    vi.mocked(puzzlesApi).update = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return mutation1Promise;
      } else {
        return mutation2Promise;
      }
    });

    // Render hooks for both mutations
    const { result: hook1 } = renderHook(
      () => useEntityMutation('puzzle', 'update'),
      { wrapper }
    );
    
    const { result: hook2 } = renderHook(
      () => useEntityMutation('puzzle', 'update'),
      { wrapper }
    );

    // Start both mutations concurrently
    act(() => {
      // Mutation 1: Set puzzle-1's owner to char-1
      hook1.current.mutate({ id: 'puzzle-1', ownerId: 'char-1' });
      // Mutation 2: Set puzzle-2's owner to char-1
      hook2.current.mutate({ id: 'puzzle-2', ownerId: 'char-1' });
    });

    // Wait for optimistic updates to be applied
    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      // Should have 2 new edges (one for each puzzle-character relationship)
      expect(data.edges).toHaveLength(2);
      // Both edges should be marked as optimistic
      expect(data.edges[0].data.pendingMutationCount).toBeGreaterThan(0);
      expect(data.edges[1].data.pendingMutationCount).toBeGreaterThan(0);
    });

    // Verify the edges are distinct
    const optimisticData = queryClient.getQueryData(queryKey) as any;
    const edge1 = optimisticData.edges.find((e: any) => e.source === 'puzzle-1');
    const edge2 = optimisticData.edges.find((e: any) => e.source === 'puzzle-2');
    
    expect(edge1).toBeDefined();
    expect(edge2).toBeDefined();
    expect(edge1.id).not.toBe(edge2.id);
    expect(edge1.target).toBe('char-1');
    expect(edge2.target).toBe('char-1');

    // Complete mutation 1
    act(() => {
      resolveMutation1!({
        data: {
          id: 'puzzle-1',
          name: 'Puzzle 1',
          ownerId: 'char-1',
        },
      });
    });

    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      // Still should have 2 edges
      expect(data.edges).toHaveLength(2);
      // Edge 1 should have counter decremented, edge 2 still optimistic
      const edge1After = data.edges.find((e: any) => e.source === 'puzzle-1');
      const edge2After = data.edges.find((e: any) => e.source === 'puzzle-2');
      expect(edge1After.data.pendingMutationCount).toBe(0);
      expect(edge2After.data.pendingMutationCount).toBeGreaterThan(0);
    });

    // Complete mutation 2
    act(() => {
      resolveMutation2!({
        data: {
          id: 'puzzle-2',
          name: 'Puzzle 2',
          ownerId: 'char-1',
        },
      });
    });

    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      // Should still have both edges
      expect(data.edges).toHaveLength(2);
      // Both edges should now have counters at 0
      const finalEdge1 = data.edges.find((e: any) => e.source === 'puzzle-1');
      const finalEdge2 = data.edges.find((e: any) => e.source === 'puzzle-2');
      expect(finalEdge1.data.pendingMutationCount).toBe(0);
      expect(finalEdge2.data.pendingMutationCount).toBe(0);
      // Both edges should still exist and be correct
      expect(finalEdge1.target).toBe('char-1');
      expect(finalEdge2.target).toBe('char-1');
    });
  });

  it('should handle concurrent mutations with one failure correctly', async () => {
    // Initial graph state
    const initialGraphData = {
      nodes: [
        {
          id: 'char-1',
          type: 'character',
          data: {
            entity: {
              id: 'char-1',
              name: 'Test Character',
              characterPuzzleIds: [],
            },
            label: 'Test Character',
            metadata: { entityType: 'character', pendingMutationCount: 0 },
          },
        },
        {
          id: 'puzzle-1',
          type: 'puzzle',
          data: {
            entity: {
              id: 'puzzle-1',
              name: 'Puzzle 1',
              ownerId: null,
            },
            label: 'Puzzle 1',
            metadata: { entityType: 'puzzle', pendingMutationCount: 0 },
          },
        },
        {
          id: 'puzzle-2',
          type: 'puzzle',
          data: {
            entity: {
              id: 'puzzle-2',
              name: 'Puzzle 2',
              ownerId: null,
            },
            label: 'Puzzle 2',
            metadata: { entityType: 'puzzle', pendingMutationCount: 0 },
          },
        },
      ],
      edges: [],
    };

    const queryKey = ['graph', 'complete'];
    queryClient.setQueryData(queryKey, JSON.parse(JSON.stringify(initialGraphData)));

    // Mock API responses
    let resolveMutation1: (value: unknown) => void;
    let rejectMutation2: (error: Error) => void;
    
    const mutation1Promise = new Promise(resolve => {
      resolveMutation1 = resolve;
    });
    
    const mutation2Promise = new Promise((_, reject) => {
      rejectMutation2 = reject;
    });

    let callCount = 0;
    vi.mocked(puzzlesApi).update = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return mutation1Promise;
      } else {
        return mutation2Promise;
      }
    });

    // Render hooks
    const { result: hook1 } = renderHook(
      () => useEntityMutation('puzzle', 'update'),
      { wrapper }
    );
    
    const { result: hook2 } = renderHook(
      () => useEntityMutation('puzzle', 'update'),
      { wrapper }
    );

    // Start both mutations
    act(() => {
      hook1.current.mutate({ id: 'puzzle-1', ownerId: 'char-1' });
      hook2.current.mutate({ id: 'puzzle-2', ownerId: 'char-1' });
    });

    // Wait for optimistic updates
    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      expect(data.edges).toHaveLength(2);
    });

    // Complete mutation 1 successfully
    act(() => {
      resolveMutation1!({
        data: {
          id: 'puzzle-1',
          name: 'Puzzle 1',
          ownerId: 'char-1',
        },
      });
    });

    // Fail mutation 2
    act(() => {
      rejectMutation2!(new Error('Network error'));
    });

    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      // Should have only 1 edge (mutation 1's edge)
      expect(data.edges).toHaveLength(1);
      // The remaining edge should be from mutation 1
      const remainingEdge = data.edges[0];
      expect(remainingEdge.source).toBe('puzzle-1');
      expect(remainingEdge.target).toBe('char-1');
      expect(remainingEdge.data.pendingMutationCount).toBe(0);
    });
  });
});