import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { useEntityMutation } from './entityMutations';
import { elementsApi } from '@/services/api';

// Mock the API module to control mutation responses
vi.mock('@/services/api');

// ViewStore mock no longer needed - mutations use unified cache key

// Spy on console.warn to verify developer warnings
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

/**
 * Creates a React Query client and provider wrapper for testing hooks.
 * @param queryClient - The QueryClient instance.
 * @returns A wrapper component.
 */
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// Define a consistent initial state for the graph cache
const initialGraphData = {
  nodes: [
    {
      id: 'elem-1',
      type: 'element',
      data: {
        entity: {
          id: 'elem-1',
          name: 'Original Name',
          version: 1,
        },
        label: 'Original Name',
        metadata: {},
      },
    },
  ],
  edges: [],
};

describe('Bug 6: Update Mutation Race Condition', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => React.ReactElement;

  beforeEach(() => {
    // Create a new QueryClient for each test to ensure isolation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    wrapper = createWrapper(queryClient);
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockClear();
  });

  it('should update the unified cache key regardless of view changes during mutation', async () => {
    // Arrange
    const queryKey = ['graph', 'complete'];
    // With unified cache, there's only one cache key for all views

    // Pre-populate the single unified cache
    queryClient.setQueryData(queryKey, JSON.parse(JSON.stringify(initialGraphData)));

    // Mock a slow API response that we can resolve manually
    let resolveMutation: (value: unknown) => void;
    const mutationPromise = new Promise(resolve => {
      resolveMutation = resolve;
    });
    vi.mocked(elementsApi).update = vi.fn().mockReturnValue(mutationPromise);

    const updatedEntity = { id: 'elem-1', name: 'Updated Name', version: 2 };

    // Act 1: Render the hook and trigger the mutation
    const { result } = renderHook(
      () => useEntityMutation('element', 'update'),
      { 
        wrapper
      }
    );
    
    act(() => {
      result.current.mutate({ id: 'elem-1', name: 'Updated Name' });
    });

    // Assert 1: The optimistic update should affect the unified cache
    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      expect(data.nodes[0].data.entity.name).toBe('Updated Name');
      expect(data.nodes[0].data.metadata.isOptimistic).toBe(true);
    });

    // Act 2: Resolve the mutation's promise
    await act(async () => {
      resolveMutation({ 
        success: true, 
        data: updatedEntity,
        delta: {
          entity: updatedEntity,
          changes: {
            nodes: {
              created: [],
              updated: [{
                id: updatedEntity.id,
                type: 'element',
                position: { x: 0, y: 0 },
                data: {
                  id: updatedEntity.id,
                  label: updatedEntity.name,
                  entity: updatedEntity,
                  metadata: { entityType: 'element', isOptimistic: false }
                }
              }],
              deleted: []
            },
            edges: {
              created: [],
              updated: [],
              deleted: []
            }
          }
        }
      });
      await mutationPromise; // Ensure the promise settlement propagates
    });

    // Assert 2: The onSuccess callback should update the unified cache
    await waitFor(() => {
      const finalData = queryClient.getQueryData(queryKey) as any;
      expect(finalData.nodes[0].data.entity.name).toBe('Updated Name');
      expect(finalData.nodes[0].data.entity.version).toBe(2);
      expect(finalData.nodes[0].data.metadata.isOptimistic).toBe(false); // Optimistic flag is cleared
    });
  });

  it('should complete cache update even if the component unmounts during mutation', async () => {
    // Arrange
    const queryKey = ['graph', 'complete'];
    queryClient.setQueryData(queryKey, JSON.parse(JSON.stringify(initialGraphData)));

    let resolveMutation: (value: unknown) => void;
    const mutationPromise = new Promise(resolve => {
      resolveMutation = resolve;
    });
    vi.mocked(elementsApi).update = vi.fn().mockReturnValue(mutationPromise);

    const updatedEntity = { id: 'elem-1', name: 'Updated After Unmount', version: 2 };
    const updateDelta = {
      entity: updatedEntity,
      changes: {
        nodes: {
          created: [],
          updated: [{
            id: updatedEntity.id,
            type: 'element',
            position: { x: 0, y: 0 },
            data: {
              id: updatedEntity.id,
              label: updatedEntity.name,
              entity: updatedEntity,
              metadata: { entityType: 'element', isOptimistic: false }
            }
          }],
          deleted: []
        },
        edges: {
          created: [],
          updated: [],
          deleted: []
        }
      }
    };

    // Act 1: Render hook and trigger the mutation.
    const { unmount, result } = renderHook(
      () => useEntityMutation('element', 'update'),
      { wrapper }
    );
    
    act(() => {
      result.current.mutate({ id: 'elem-1', name: 'Updated After Unmount' });
    });

    // Assert 1: Verify the optimistic update was applied.
    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      expect(data.nodes[0].data.entity.name).toBe('Updated After Unmount');
    });

    // Act 2: Unmount the component while the mutation is in-flight.
    unmount();

    // Act 3: Resolve the mutation after the component is gone.
    await act(async () => {
      resolveMutation({ success: true, data: updatedEntity, delta: updateDelta });
      await mutationPromise;
    });

    // Assert 2: The cache, which lives outside the component, should still be
    // updated correctly by the mutation's 'onSuccess' handler.
    await waitFor(() => {
      const finalData = queryClient.getQueryData(queryKey) as any;
      expect(finalData.nodes[0].data.entity.name).toBe('Updated After Unmount');
      expect(finalData.nodes[0].data.entity.version).toBe(2);
      expect(finalData.nodes[0].data.metadata.isOptimistic).toBe(false);
    });
  });

  it('should use unified cache key for all mutations', async () => {
    // Arrange - unified cache key for all views
    const queryKey = ['graph', 'complete'];
    queryClient.setQueryData(queryKey, JSON.parse(JSON.stringify(initialGraphData)));
    
    const updatedEntity = { id: 'elem-1', name: 'Updated via ViewStore', version: 2 };
    vi.mocked(elementsApi).update = vi.fn().mockResolvedValue({ 
      success: true, 
      data: updatedEntity,
      delta: {
        entity: updatedEntity,
        changes: {
          nodes: {
            created: [],
            updated: [{
              id: updatedEntity.id,
              type: 'element',
              position: { x: 0, y: 0 },
              data: {
                id: updatedEntity.id,
                label: updatedEntity.name,
                entity: updatedEntity,
                metadata: { entityType: 'element', isOptimistic: false }
              }
            }],
            deleted: []
          },
          edges: {
            created: [],
            updated: [],
            deleted: []
          }
        }
      }
    });

    // Act: Render the hook with unified cache key
    const { result } = renderHook(
      () => useEntityMutation('element', 'update'),
      { wrapper }
    );
    
    await act(async () => {
      await result.current.mutateAsync({ id: 'elem-1', name: 'Updated via ViewStore' });
    });

    // Assert: The cache should be updated using the unified key
    await waitFor(() => {
      const data = queryClient.getQueryData(queryKey) as any;
      expect(data.nodes[0].data.entity.name).toBe('Updated via ViewStore');
      expect(data.nodes[0].data.entity.version).toBe(2);
    });
  });
});