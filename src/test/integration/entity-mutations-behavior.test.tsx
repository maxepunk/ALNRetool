/**
 * Behavioral Tests for Entity Mutations
 * 
 * Tests user-visible behavior of mutation hooks:
 * - Optimistic updates in cache
 * - Toast notifications
 * - Error recovery and rollback
 * - Concurrent edit handling
 * 
 * CRITICAL BUG EXPOSED BY THESE TESTS:
 * =====================================
 * When servers respond immediately (no network latency), optimistic updates
 * are NOT visible to users due to a race condition. The server response
 * overwrites the cache before React can render the optimistic state.
 * 
 * EXPECTED TEST FAILURES (until bug is properly fixed):
 * - "updates cache optimistically then applies server delta" 
 * - "creates optimistic node with temp ID then replaces with server ID"
 * 
 * These failures are INTENTIONAL - they document the actual bug.
 * The tests use immediate responses to match real-world scenarios
 * (local servers, cached responses, fast networks).
 * 
 * Current partial fix: Only ERROR cases have minimum display time.
 * SUCCESS cases still have the race condition.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import toast from 'react-hot-toast';
import React from 'react';
import {
  useUpdateCharacter,
  useCreateElement,
  useDeletePuzzle,
  useUpdateElement
} from '@/hooks/mutations/entityMutations';
import type { Character, Element } from '@/types/notion/app';

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock viewStore for consistent view type
vi.mock('@/stores/viewStore', () => ({
  useViewStore: {
    getState: () => ({
      currentViewType: 'test-view',
      setViewType: vi.fn()
    })
  }
}));

// Test data with proper enum values
const mockCharacter: Character = {
  id: 'char-1',
  entityType: 'character',
  name: 'Alice',
  type: 'major' as any, // Bypass TS for test
  tier: 'primary' as any, // Bypass TS for test
  primaryAction: 'Investigate',
  characterLogline: 'The detective',
  overview: 'Lead investigator',
  emotionTowardsCEO: 'Suspicious',
  ownedElementIds: [],
  associatedElementIds: [],
  characterPuzzleIds: [],
  eventIds: [],
  connections: [],
  lastEdited: '2024-01-15T10:00:00Z'
};

const mockElement: Element = {
  id: 'elem-1',
  entityType: 'element',
  name: 'Murder Weapon',
  basicType: 'physical' as any, // Bypass TS for test
  status: 'active' as any, // Bypass TS for test
  ownerId: 'char-1',
  associatedCharacterIds: [],
  puzzles: [],
  timeline: [],
  lastEdited: '2024-01-15T11:00:00Z'
};

// Additional handlers for entity mutations testing
// MSW v2 matches URLs regardless of query parameters
const mutationHandlers = [
  // Get graph data
  http.get('http://localhost:3001/api/graph/complete', () => {
    return HttpResponse.json({
      nodes: [
        {
          id: 'char-1',
          type: 'character',
          position: { x: 0, y: 0 },
          data: {
            id: 'char-1',
            label: 'Alice',
            entity: mockCharacter,
            metadata: { entityType: 'character', isOptimistic: false }
          }
        }
      ],
      edges: []
    });
  }),

  // Update character handlers - both with and without include_delta
  http.put('http://localhost:3001/api/notion/characters/:id', async ({ request, params }) => {
    const headers = request.headers;
    const ifMatch = headers.get('If-Match');
    const body = await request.json() as any;
    
    // REMOVED artificial delay - tests should expose the race condition bug
    // Real servers can respond immediately (especially cached/local responses)
    
    // Simulate conflict
    if (ifMatch === '"old-version"') {
      return HttpResponse.json(
        { 
          error: 'Conflict',
          message: 'This item has been modified by another user. Please refresh the page and try again.',
          code: 'CONFLICT'
        },
        { status: 409 }
      );
    }

    // Simulate network error
    if (body.name === 'Network Error') {
      return HttpResponse.json(
        { error: 'Network error' },
        { status: 500 }
      );
    }

    // Success with delta
    const updated = { ...mockCharacter, ...body, lastEdited: new Date().toISOString() };
    return HttpResponse.json({
      success: true,
      data: updated,
      delta: {
        entity: updated,
        changes: {
          nodes: {
            created: [],
            updated: [{
              id: params.id,
              type: 'character',
              position: { x: 0, y: 0 },
              data: {
                id: params.id,
                label: updated.name,
                entity: updated,
                metadata: { entityType: 'character', isOptimistic: false }
              }
            }],
            deleted: []
          },
          edges: { created: [], updated: [], deleted: [] }
        }
      }
    });
  }),

  // Create element - match URL with query params
  http.post('http://localhost:3001/api/notion/elements', async ({ request }) => {
    // This handler matches both with and without query params
    const body = await request.json() as any;
    
    if (body.name === 'Fail Creation') {
      // No artificial delay - test should verify our error handling works
      return HttpResponse.json(
        { error: 'Creation failed' },
        { status: 400 }
      );
    }
    
    const newElement: Element = {
      id: `elem-${Date.now()}`,
      entityType: 'element',
      name: body.name,
      basicType: body.basicType || 'physical',
      status: body.status || 'active',
      ownerId: body.ownerId || null,
      associatedCharacterIds: [],
      puzzles: [],
      timeline: [],
      lastEdited: new Date().toISOString()
    };
    
    // No artificial delay - exposes race condition with immediate responses
    return HttpResponse.json({
      success: true,
      data: newElement,
      delta: {
        entity: newElement,
        changes: {
          nodes: {
            created: [{
              id: newElement.id,
              type: 'element',
              position: { x: 200, y: 0 },
              data: {
                id: newElement.id,
                label: newElement.name,
                entity: newElement,
                metadata: { entityType: 'element', isOptimistic: false }
              }
            }],
            updated: [],
            deleted: []
          },
          edges: { created: [], updated: [], deleted: [] }
        }
      }
    });
  }),

  // Delete puzzle - match URL with query params
  http.delete('http://localhost:3001/api/notion/puzzles/:id', async ({ params, request }) => {
    // This handler matches both with and without query params
    const headers = request.headers;
    const ifMatch = headers.get('If-Match');
    
    if (ifMatch === '"fail-version"') {
      return HttpResponse.json(
        { message: 'Deletion failed' },
        { status: 403 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: { id: params.id, archived: true },
      delta: {
        entity: { id: params.id },
        changes: {
          nodes: { created: [], updated: [], deleted: [params.id as string] },
          edges: { created: [], updated: [], deleted: [] }
        }
      }
    });
  }),

  // Update element WITHOUT delta - match URL with query params
  http.put('http://localhost:3001/api/notion/elements/:id', async ({ request, params }) => {
    // This handler matches both with and without query params
    const body = await request.json() as any;
    
    if (body.name === 'No Delta Response') {
      const updated = { ...mockElement, ...body, lastEdited: new Date().toISOString() };
      return HttpResponse.json({
        success: true,
        data: updated
        // Intentionally missing delta
      });
    }
    
    // Normal update
    const updated = { ...mockElement, ...body, lastEdited: new Date().toISOString() };
    return HttpResponse.json({
      success: true,
      data: updated,
      delta: {
        entity: updated,
        changes: {
          nodes: {
            created: [],
            updated: [{
              id: updated.id,
              type: 'element',
              position: { x: 100, y: 0 },
              data: {
                id: updated.id,
                label: updated.name,
                entity: updated,
                metadata: { entityType: 'element', isOptimistic: false }
              }
            }],
            deleted: []
          },
          edges: { created: [], updated: [], deleted: [] }
        }
      }
    });
  })
];

// Helper to create wrapper
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Use the global test server and add our handlers
beforeEach(() => {
  server.use(...mutationHandlers);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Mutation: Optimistic Updates', () => {
  it('updates cache optimistically then applies server delta', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Set initial cache data
    const queryKey = ['graph', 'complete', 'test-view'];
    queryClient.setQueryData(queryKey, {
      nodes: [{
        id: 'char-1',
        type: 'character',
        data: {
          id: 'char-1',
          label: 'Alice',
          entity: mockCharacter,
          metadata: { isOptimistic: false }
        }
      }],
      edges: []
    });

    const { result } = renderHook(() => useUpdateCharacter(), {
      wrapper: createWrapper(queryClient)
    });

    // Trigger update
    result.current.mutate({
      id: 'char-1',
      name: 'Alice Updated',
      lastEdited: '2024-01-15T10:00:00Z'
    });

    // Check optimistic update happened immediately
    await waitFor(() => {
      const data: any = queryClient.getQueryData(queryKey);
      const node = data?.nodes?.find((n: any) => n.id === 'char-1');
      expect(node?.data?.label).toBe('Alice Updated');
      expect(node?.data?.metadata?.isOptimistic).toBe(true);
    });

    // Wait for server response
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check final state has server data
    const finalData: any = queryClient.getQueryData(queryKey);
    const finalNode = finalData?.nodes?.find((n: any) => n.id === 'char-1');
    expect(finalNode?.data?.metadata?.isOptimistic).toBe(false);
    expect(toast.success).toHaveBeenCalledWith('Updated Alice Updated');
  });

  it('creates optimistic node with temp ID then replaces with server ID', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const queryKey = ['graph', 'complete', 'test-view'];
    queryClient.setQueryData(queryKey, { nodes: [], edges: [] });

    const { result } = renderHook(() => useCreateElement(), {
      wrapper: createWrapper(queryClient)
    });

    // Create element
    const mutationPromise = result.current.mutateAsync({
      name: 'New Evidence',
      basicType: 'physical'
    });

    // Check optimistic node appears with temp ID
    await waitFor(() => {
      const data: any = queryClient.getQueryData(queryKey);
      expect(data?.nodes).toHaveLength(1);
      const tempNode = data.nodes[0];
      expect(tempNode.id).toMatch(/^temp-/);
      expect(tempNode.data.label).toBe('New Evidence');
      expect(tempNode.data.metadata.isOptimistic).toBe(true);
    });

    // Wait for server response
    await mutationPromise;

    // Check temp node replaced with real node
    const finalData: any = queryClient.getQueryData(queryKey);
    expect(finalData.nodes).toHaveLength(1);
    const realNode = finalData.nodes[0];
    expect(realNode.id).toMatch(/^elem-\d+$/);
    expect(realNode.data.metadata.isOptimistic).toBe(false);
    expect(toast.success).toHaveBeenCalledWith('Created New Evidence');
  });

  it('removes node optimistically on delete', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const queryKey = ['graph', 'complete', 'test-view'];
    queryClient.setQueryData(queryKey, {
      nodes: [{
        id: 'puzzle-1',
        type: 'puzzle',
        data: {
          id: 'puzzle-1',
          label: 'Test Puzzle',
          entity: { id: 'puzzle-1', name: 'Test Puzzle', lastEdited: '2024-01-15T10:00:00Z' },
          metadata: { isOptimistic: false }
        }
      }],
      edges: []
    });

    const { result } = renderHook(() => useDeletePuzzle(), {
      wrapper: createWrapper(queryClient)
    });

    // Delete puzzle
    result.current.mutate({ id: 'puzzle-1', version: '2024-01-15T10:00:00Z' });

    // Check node removed optimistically
    await waitFor(() => {
      const data: any = queryClient.getQueryData(queryKey);
      expect(data?.nodes).toHaveLength(0);
    });

    // Wait for server confirmation
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('Deleted puzzle');
  });
});

describe('Mutation: Error Handling', () => {
  it('shows conflict error toast without rollback on 409', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const queryKey = ['graph', 'complete', 'test-view'];
    const initialData = {
      nodes: [{
        id: 'char-1',
        type: 'character',
        data: {
          id: 'char-1',
          label: 'Alice',
          entity: mockCharacter,
          metadata: { isOptimistic: false }
        }
      }],
      edges: []
    };
    queryClient.setQueryData(queryKey, initialData);

    const { result } = renderHook(() => useUpdateCharacter(), {
      wrapper: createWrapper(queryClient)
    });

    // Update with old version
    result.current.mutate({
      id: 'char-1',
      name: 'Conflicting Update',
      lastEdited: 'old-version'
    });

    // Wait for error
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Check error toast shown (actual code uses toast.error for 409)
    expect(toast.error).toHaveBeenCalledWith(
      'This item has been modified by another user. Please refresh the page and try again.',
      { duration: 5000 }  // Code uses 5000ms for conflict errors
    );

    // Cache should still have optimistic update (no rollback for conflicts)
    const data: any = queryClient.getQueryData(queryKey);
    expect(data?.nodes?.[0]?.data?.label).toBe('Conflicting Update');
  });

  it('rolls back optimistic update on network error', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const queryKey = ['graph', 'complete', 'test-view'];
    queryClient.setQueryData(queryKey, {
      nodes: [{
        id: 'char-1',
        type: 'character',
        position: { x: 0, y: 0 },
        data: {
          id: 'char-1',
          label: 'Alice',
          entity: mockCharacter,
          metadata: { 
            entityType: 'character',
            isOptimistic: false 
          }
        }
      }],
      edges: []
    });

    const { result } = renderHook(() => useUpdateCharacter(), {
      wrapper: createWrapper(queryClient)
    });

    // Update that triggers network error
    result.current.mutate({
      id: 'char-1',
      name: 'Network Error',
      lastEdited: '2024-01-15T10:00:00Z'
    });

    // Initially shows optimistic update
    await waitFor(() => {
      const data: any = queryClient.getQueryData(queryKey);
      expect(data?.nodes?.[0]?.data?.label).toBe('Network Error');
    });

    // Wait for error and rollback
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Check rolled back to original
    const finalData: any = queryClient.getQueryData(queryKey);
    expect(finalData?.nodes?.[0]?.data?.label).toBe('Alice');
    // API returns {error: 'Network error'} but fetcher falls back to generic message
    expect(toast.error).toHaveBeenCalledWith('An unknown error occurred');
  });

  it('removes optimistic node on creation failure', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const queryKey = ['graph', 'complete', 'test-view'];
    queryClient.setQueryData(queryKey, { nodes: [], edges: [] });

    const { result } = renderHook(() => useCreateElement(), {
      wrapper: createWrapper(queryClient)
    });

    // Create element that will fail
    result.current.mutate({
      name: 'Fail Creation',
      basicType: 'physical'
    });

    // Check optimistic node appears
    await waitFor(() => {
      const data: any = queryClient.getQueryData(queryKey);
      expect(data?.nodes).toHaveLength(1);
      expect(data.nodes[0].data.metadata.isOptimistic).toBe(true);
    });

    // Wait for failure
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Check optimistic node removed
    const finalData: any = queryClient.getQueryData(queryKey);
    expect(finalData?.nodes).toHaveLength(0);
    // API returns {error: 'Creation failed'} but fetcher expects {message: ...}
    // So it falls back to "An unknown error occurred"
    expect(toast.error).toHaveBeenCalledWith('An unknown error occurred');
  });

  it('restores deleted node on deletion failure', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const queryKey = ['graph', 'complete', 'test-view'];
    const puzzleNode = {
      id: 'puzzle-fail',
      type: 'puzzle',
      data: {
        id: 'puzzle-fail',
        label: 'Fail Puzzle',
        entity: { id: 'puzzle-fail', name: 'Fail Puzzle', lastEdited: 'fail-version' },
        metadata: { isOptimistic: false }
      }
    };
    queryClient.setQueryData(queryKey, {
      nodes: [puzzleNode],
      edges: []
    });

    const { result } = renderHook(() => useDeletePuzzle(), {
      wrapper: createWrapper(queryClient)
    });

    // Delete with fail version
    result.current.mutate({ id: 'puzzle-fail', version: 'fail-version' });

    // Node removed optimistically
    await waitFor(() => {
      const data: any = queryClient.getQueryData(queryKey);
      expect(data?.nodes).toHaveLength(0);
    })

    // Wait for failure
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Node restored
    const finalData: any = queryClient.getQueryData(queryKey);
    expect(finalData?.nodes).toHaveLength(1);
    expect(finalData.nodes[0].id).toBe('puzzle-fail');
    expect(toast.error).toHaveBeenCalledWith('Deletion failed');
  });
});

describe('Mutation: Critical Bugs', () => {
  it('exposes bug: update without delta leaves cache optimistic', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const queryKey = ['graph', 'complete', 'test-view'];
    queryClient.setQueryData(queryKey, {
      nodes: [{
        id: 'elem-1',
        type: 'element',
        data: {
          id: 'elem-1',
          label: 'Murder Weapon',
          entity: mockElement,
          metadata: { isOptimistic: false }
        }
      }],
      edges: []
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateElement(), {
      wrapper: createWrapper(queryClient)
    });

    // Update that returns no delta
    result.current.mutate({
      id: 'elem-1',
      name: 'No Delta Response',
      lastEdited: '2024-01-15T11:00:00Z'
    });

    // Wait for success
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // BUG: Cache remains optimistic because delta is missing
    // and invalidateQueries is NOT called for update mutations
    const data: any = queryClient.getQueryData(queryKey);
    const node = data?.nodes?.[0];
    
    // This documents the bug:
    expect(node?.data?.metadata?.isOptimistic).toBe(true); // Still optimistic!
    expect(invalidateSpy).not.toHaveBeenCalled(); // No invalidation!
    
    // Success toast still shown despite incomplete cache update
    expect(toast.success).toHaveBeenCalledWith('Updated No Delta Response');
  });

  it('handles version 0 correctly for new entities', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const { result } = renderHook(() => useUpdateCharacter(), {
      wrapper: createWrapper(queryClient)
    });

    // Update with version 0
    result.current.mutate({
      id: 'char-new',
      name: 'New Character',
      version: 0
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('Updated New Character');
  });

  it('uses lastEdited when version is undefined', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const { result } = renderHook(() => useUpdateCharacter(), {
      wrapper: createWrapper(queryClient)
    });

    // Update with lastEdited but no version
    result.current.mutate({
      id: 'char-1',
      name: 'LastEdited Test',
      lastEdited: '2024-01-15T10:00:00Z'
      // No version field
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('Updated LastEdited Test');
  });
});