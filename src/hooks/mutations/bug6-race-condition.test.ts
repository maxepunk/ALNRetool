import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { useUpdateElement } from './entityMutations';
import { elementsApi } from '@/services/api';

// Mock the API module to control mutation responses
vi.mock('@/services/api');

// Mock viewStore to control which view is "current" during tests
let mockCurrentViewType = 'view-A';
vi.mock('@/stores/viewStore', () => ({
  useViewStore: {
    getState: () => ({
      currentViewType: mockCurrentViewType,
      setViewType: vi.fn()
    })
  }
}));

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

  it('should update the correct cache key when view changes during an in-flight mutation', async () => {
    // Arrange
    const viewA_QueryKey = ['graph', 'complete', 'view-A'];
    const viewB_QueryKey = ['graph', 'complete', 'view-B'];

    // Pre-populate the cache for two separate views with identical initial data
    queryClient.setQueryData(viewA_QueryKey, JSON.parse(JSON.stringify(initialGraphData)));
    queryClient.setQueryData(viewB_QueryKey, JSON.parse(JSON.stringify(initialGraphData)));

    // Mock a slow API response that we can resolve manually
    let resolveMutation: (value: unknown) => void;
    const mutationPromise = new Promise(resolve => {
      resolveMutation = resolve;
    });
    vi.mocked(elementsApi).update = vi.fn().mockReturnValue(mutationPromise);

    const updatedEntity = { id: 'elem-1', name: 'Updated Name From View A', version: 2 };

    // Act 1: Render the hook with viewStore set to 'view-A' and trigger the mutation.
    mockCurrentViewType = 'view-A';
    const { result } = renderHook(
      () => useUpdateElement(), // uses viewStore
      { 
        wrapper
      }
    );
    
    act(() => {
      result.current.mutate({ id: 'elem-1', name: 'Updated Name From View A' });
    });

    // Assert 1: The optimistic update should only affect the cache for 'view-A'.
    await waitFor(() => {
      const viewAData = queryClient.getQueryData(viewA_QueryKey) as any;
      expect(viewAData.nodes[0].data.entity.name).toBe('Updated Name From View A');
      expect(viewAData.nodes[0].data.metadata.isOptimistic).toBe(true);

      const viewBData = queryClient.getQueryData(viewB_QueryKey) as any;
      expect(viewBData.nodes[0].data.entity.name).toBe('Original Name'); // 'view-B' remains unchanged.
    });

    // Act 2: Simulate a rapid view switch to 'view-B' by changing the store.
    // The original mutation is still in-flight.
    mockCurrentViewType = 'view-B';

    // Act 3: Resolve the original mutation's promise.
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

    // Assert 2: The 'onSuccess' callback from the original mutation should update
    // the 'view-A' cache and leave the 'view-B' cache untouched.
    await waitFor(() => {
      const finalViewAData = queryClient.getQueryData(viewA_QueryKey) as any;
      expect(finalViewAData.nodes[0].data.entity.name).toBe('Updated Name From View A');
      expect(finalViewAData.nodes[0].data.entity.version).toBe(2);
      expect(finalViewAData.nodes[0].data.metadata.isOptimistic).toBe(false); // Optimistic flag is cleared

      const finalViewBData = queryClient.getQueryData(viewB_QueryKey) as any;
      expect(finalViewBData.nodes[0].data.entity.name).toBe('Original Name'); // 'view-B' is still pristine.
    });
  });

  it('should complete cache update even if the component unmounts during mutation', async () => {
    // Arrange
    const queryKey = ['graph', 'complete', 'view-A'];
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
    mockCurrentViewType = 'view-A';
    const { unmount, result } = renderHook(
      () => useUpdateElement(), // uses viewStore
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

  it('should use view from viewStore for cache key', async () => {
    // Arrange - viewStore provides 'view-A' as the current view
    const viewQueryKey = ['graph', 'complete', 'view-A'];
    queryClient.setQueryData(viewQueryKey, JSON.parse(JSON.stringify(initialGraphData)));
    
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

    // Act: Render the hook which gets view from viewStore
    const { result } = renderHook(
      () => useUpdateElement(), // Uses viewStore internally
      { wrapper }
    );
    
    await act(async () => {
      await result.current.mutateAsync({ id: 'elem-1', name: 'Updated via ViewStore' });
    });

    // Assert: The cache should be updated using the view from viewStore
    await waitFor(() => {
      const data = queryClient.getQueryData(viewQueryKey) as any;
      expect(data.nodes[0].data.entity.name).toBe('Updated via ViewStore');
      expect(data.nodes[0].data.entity.version).toBe(2);
    });
  });
});