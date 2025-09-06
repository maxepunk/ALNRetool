/**
 * Test suite for Phase 3: Mutation ID tracking for accurate counter management
 * Verifies that concurrent mutations on the same entity don't cause counter desync
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEntityMutation } from './entityMutations';
import type { Character } from '@/types/notion/app';
import type { GraphData } from '@/lib/graph/types';
import React from 'react';

// Mock the API calls
vi.mock('@/services/api', () => ({
  charactersApi: {
    update: vi.fn(),
  },
  elementsApi: {
    update: vi.fn(),
  },
  puzzlesApi: {
    update: vi.fn(),
  },
  timelineApi: {
    update: vi.fn(),
  },
}));

import { charactersApi } from '@/services/api';

describe('Concurrent Mutations with Mutation ID Tracking', () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should handle multiple concurrent mutations on the same entity without counter desync', async () => {
    // GIVEN: Initial graph with one character
    const initialCharacter: Character = {
      id: 'char-1',
      name: 'Alice',
      entityType: 'character',
      type: 'NPC',
      tier: 'Core',
      ownedElementIds: [],
      associatedElementIds: [],
      characterPuzzleIds: [],
      eventIds: [],
      connections: [],
      primaryAction: 'Investigating',
      characterLogline: 'The detective',
      overview: 'Complex backstory',
      emotionTowardsCEO: 'Suspicious'
    };

    const initialGraph: GraphData = {
      nodes: [{
        id: 'char-1',
        type: 'character',
        position: { x: 0, y: 0 },
        data: {
          entity: initialCharacter,
          label: 'Alice',
          metadata: {
            entityType: 'character',
            pendingMutationCount: 0,
            pendingMutationIds: []
          }
        }
      }],
      edges: []
    };

    queryClient.setQueryData(['graph', 'complete'], initialGraph);

    // WHEN: Three concurrent mutations are triggered on the same entity
    const { result: result1 } = renderHook(
      () => useEntityMutation('character', 'update'),
      { wrapper }
    );
    
    const { result: result2 } = renderHook(
      () => useEntityMutation('character', 'update'),
      { wrapper }
    );
    
    const { result: result3 } = renderHook(
      () => useEntityMutation('character', 'update'),
      { wrapper }
    );

    // Mock API to delay responses - must return promise that resolves to { data: entity }
    let resolveUpdate1: (value: any) => void;
    let resolveUpdate2: (value: any) => void;
    let resolveUpdate3: (value: any) => void;
    
    // Create promises that resolve to the correct structure
    const promise1 = new Promise(resolve => { 
      resolveUpdate1 = (data) => resolve({ data }); 
    });
    const promise2 = new Promise(resolve => { 
      resolveUpdate2 = (data) => resolve({ data }); 
    });
    const promise3 = new Promise(resolve => { 
      resolveUpdate3 = (data) => resolve({ data }); 
    });
    
    (charactersApi.update as any)
      .mockReturnValueOnce(promise1)
      .mockReturnValueOnce(promise2)
      .mockReturnValueOnce(promise3);

    // Trigger all three mutations
    act(() => {
      console.log('Triggering mutations...');
      console.log('result1.current:', result1.current);
      console.log('About to call mutate on result1');
      result1.current.mutate({ id: 'char-1', name: 'Alice Update 1' });
      console.log('About to call mutate on result2');
      result2.current.mutate({ id: 'char-1', primaryAction: 'Searching' });
      console.log('About to call mutate on result3');
      result3.current.mutate({ id: 'char-1', overview: 'New backstory' });
      console.log('All mutations triggered');
    });

    // THEN: After optimistic updates, pendingMutationCount should be 3
    await waitFor(() => {
      const graph = queryClient.getQueryData<GraphData>(['graph', 'complete']);
      console.log('Graph after mutations:', graph);
      const node = graph?.nodes.find(n => n.id === 'char-1');
      console.log('Node after mutations:', node);
      console.log('Node metadata:', node?.data.metadata);
      console.log('pendingMutationCount:', node?.data.metadata?.pendingMutationCount);
      console.log('pendingMutationIds:', node?.data.metadata?.pendingMutationIds);
      expect(node?.data.metadata?.pendingMutationCount).toBe(3);
      expect(node?.data.metadata?.pendingMutationIds?.length).toBe(3);
    });

    // WHEN: First mutation completes successfully  
    act(() => {
      resolveUpdate1!({ ...initialCharacter, name: 'Alice Update 1' });
    });

    await waitFor(() => {
      const graph = queryClient.getQueryData<GraphData>(['graph', 'complete']);
      const node = graph?.nodes.find(n => n.id === 'char-1');
      expect(node?.data.metadata?.pendingMutationCount).toBe(2);
      expect(node?.data.metadata?.pendingMutationIds?.length).toBe(2);
    });

    // WHEN: Third mutation completes (out of order)
    act(() => {
      resolveUpdate3!({ ...initialCharacter, overview: 'New backstory' });
    });

    await waitFor(() => {
      const graph = queryClient.getQueryData<GraphData>(['graph', 'complete']);
      const node = graph?.nodes.find(n => n.id === 'char-1');
      expect(node?.data.metadata?.pendingMutationCount).toBe(1);
      expect(node?.data.metadata?.pendingMutationIds?.length).toBe(1);
    });

    // WHEN: Second mutation completes
    act(() => {
      resolveUpdate2!({ ...initialCharacter, primaryAction: 'Searching' });
    });

    await waitFor(() => {
      const graph = queryClient.getQueryData<GraphData>(['graph', 'complete']);
      const node = graph?.nodes.find(n => n.id === 'char-1');
      expect(node?.data.metadata?.pendingMutationCount).toBe(0);
      expect(node?.data.metadata?.pendingMutationIds?.length).toBe(0);
    });
  });

  it('should handle partial failures in concurrent mutations correctly', async () => {
    // GIVEN: Initial graph with one character
    const initialCharacter: Character = {
      id: 'char-1',
      name: 'Bob',
      entityType: 'character',
      type: 'NPC',
      tier: 'Core',
      ownedElementIds: [],
      associatedElementIds: [],
      characterPuzzleIds: [],
      eventIds: [],
      connections: [],
      primaryAction: 'Waiting',
      characterLogline: 'The witness',
      overview: 'Mysterious past',
      emotionTowardsCEO: 'Neutral'
    };

    const initialGraph: GraphData = {
      nodes: [{
        id: 'char-1',
        type: 'character',
        position: { x: 0, y: 0 },
        data: {
          entity: initialCharacter,
          label: 'Bob',
          metadata: {
            entityType: 'character',
            pendingMutationCount: 0,
            pendingMutationIds: []
          }
        }
      }],
      edges: []
    };

    queryClient.setQueryData(['graph', 'complete'], initialGraph);

    // WHEN: Two mutations start
    const { result: result1 } = renderHook(
      () => useEntityMutation('character', 'update'),
      { wrapper }
    );
    
    const { result: result2 } = renderHook(
      () => useEntityMutation('character', 'update'),
      { wrapper }
    );

    // Mock API responses
    let rejectUpdate1: (error: Error) => void;
    let resolveUpdate2: (value: any) => void;
    
    const promise1 = new Promise((_, reject) => { rejectUpdate1 = reject; });
    const promise2 = new Promise(resolve => { 
      resolveUpdate2 = (data) => resolve({ data }); 
    });
    
    (charactersApi.update as any)
      .mockReturnValueOnce(promise1)
      .mockReturnValueOnce(promise2);

    // Trigger both mutations
    act(() => {
      result1.current.mutate({ id: 'char-1', name: 'Bob Update 1' });
      result2.current.mutate({ id: 'char-1', primaryAction: 'Running' });
    });

    // THEN: Both should be pending
    await waitFor(() => {
      const graph = queryClient.getQueryData<GraphData>(['graph', 'complete']);
      const node = graph?.nodes.find(n => n.id === 'char-1');
      expect(node?.data.metadata?.pendingMutationCount).toBe(2);
    });

    // WHEN: First mutation fails
    act(() => {
      rejectUpdate1!(new Error('Network error'));
    });

    // THEN: Counter should decrease by 1, entity data should be restored for failed mutation
    await waitFor(() => {
      const graph = queryClient.getQueryData<GraphData>(['graph', 'complete']);
      const node = graph?.nodes.find(n => n.id === 'char-1');
      expect(node?.data.metadata?.pendingMutationCount).toBe(1);
      expect(node?.data.entity.name).toBe('Bob'); // Original name restored
      expect(node?.data.entity.primaryAction).toBe('Running'); // Still optimistically updated
    });

    // WHEN: Second mutation succeeds
    act(() => {
      resolveUpdate2!({ ...initialCharacter, primaryAction: 'Running' });
    });

    // THEN: Counter should be 0
    await waitFor(() => {
      const graph = queryClient.getQueryData<GraphData>(['graph', 'complete']);
      const node = graph?.nodes.find(n => n.id === 'char-1');
      expect(node?.data.metadata?.pendingMutationCount).toBe(0);
      expect(node?.data.entity.primaryAction).toBe('Running'); // Successfully updated
    });
  });

  it('should not allow duplicate mutation IDs in tracking arrays', async () => {
    // This test verifies Set-like behavior even though we use arrays
    const initialGraph: GraphData = {
      nodes: [{
        id: 'char-1',
        type: 'character',
        position: { x: 0, y: 0 },
        data: {
          entity: { id: 'char-1', name: 'Test' } as Character,
          label: 'Test',
          metadata: {
            entityType: 'character',
            pendingMutationCount: 0,
            pendingMutationIds: []
          }
        }
      }],
      edges: []
    };

    queryClient.setQueryData(['graph', 'complete'], initialGraph);

    // Directly test the OptimisticStateManager logic
    // by triggering a mutation and checking the state
    const { result } = renderHook(
      () => useEntityMutation('character', 'update'),
      { wrapper }
    );

    (charactersApi.update as any).mockReturnValue(
      new Promise(() => {}) // Never resolves, keeps it pending
    );

    act(() => {
      result.current.mutate({ id: 'char-1', name: 'Updated' });
    });

    await waitFor(() => {
      const graph = queryClient.getQueryData<GraphData>(['graph', 'complete']);
      const node = graph?.nodes.find(n => n.id === 'char-1');
      const ids = node?.data.metadata?.pendingMutationIds || [];
      
      // Check that there's exactly one ID and no duplicates
      expect(ids.length).toBe(1);
      expect(new Set(ids).size).toBe(ids.length); // No duplicates
    });
  });
});