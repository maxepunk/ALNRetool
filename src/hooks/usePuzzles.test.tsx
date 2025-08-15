import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@/test/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { usePuzzles } from './usePuzzles'
import { server } from '@/test/setup'
import { http, HttpResponse } from 'msw'
import { mockPuzzles } from '@/test/mocks/data/puzzles'

const API_BASE = 'http://localhost:3001/api'

describe('usePuzzles', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    // Reset query client for each test to ensure isolation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 }, // Disable retries and caching for deterministic tests
        mutations: { retry: false },
      },
    })
    // Clear all MSW handlers to ensure only specific mocks are active per test
    server.resetHandlers()
  })

  // Helper wrapper component for React Query context
  const createWrapper = (client: QueryClient) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    Wrapper.displayName = 'QueryClientWrapper'
    return Wrapper
  }

  describe('Successful Data Fetching', () => {
    it('should fetch puzzles successfully', async () => {
      // Arrange: Render the hook
      const { result } = renderHook(() => usePuzzles(), {
        wrapper: createWrapper(queryClient),
      })

      // Assert initial loading state
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()

      // Act & Assert: Wait for the query to succeed
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Assert data presence and basic structure
      expect(result.current.data).toBeDefined()
      expect(result.current.data?.length).toBeGreaterThan(0)
      expect(result.current.data?.[0]).toHaveProperty('id')
      expect(result.current.data?.[0]).toHaveProperty('name')
      expect(result.current.data?.[0]).toHaveProperty('descriptionSolution')
    })

    it('should return typed Puzzle array with all required and optional properties', async () => {
      // Arrange: Render the hook
      const { result } = renderHook(() => usePuzzles(), {
        wrapper: createWrapper(queryClient),
      })

      // Act & Assert: Wait for the query to succeed
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const puzzles = result.current.data
      expect(puzzles).toBeDefined()
      expect(puzzles?.length).toBeGreaterThan(0)

      // Assert: Type checking - ensure all Puzzle fields are present and correctly typed
      puzzles?.forEach((puzzle) => {
        expect(puzzle).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          descriptionSolution: expect.any(String),
          puzzleElementIds: expect.any(Array),
          rewardIds: expect.any(Array),
          subPuzzleIds: expect.any(Array),
          storyReveals: expect.any(Array),
          timing: expect.any(Array),
          narrativeThreads: expect.any(Array),
        })

        // Validate optional fields (can be undefined)
        if (puzzle.lockedItemId !== undefined) {
          expect(puzzle.lockedItemId).toEqual(expect.any(String))
        }
        if (puzzle.ownerId !== undefined) {
          expect(puzzle.ownerId).toEqual(expect.any(String))
        }
        if (puzzle.parentItemId !== undefined) {
          expect(puzzle.parentItemId).toEqual(expect.any(String))
        }
        if (puzzle.assetLink !== undefined) {
          expect(puzzle.assetLink).toEqual(expect.any(String))
        }

        // Validate timing array contains valid Act strings or is empty
        puzzle.timing.forEach(act => {
          expect(act).toMatch(/^Act [0-2]$/)
        })

        // Ensure all string arrays contain only strings
        expect(puzzle.puzzleElementIds.every(id => typeof id === 'string')).toBe(true)
        expect(puzzle.rewardIds.every(id => typeof id === 'string')).toBe(true)
        expect(puzzle.subPuzzleIds.every(id => typeof id === 'string')).toBe(true)
        expect(puzzle.storyReveals.every(id => typeof id === 'string')).toBe(true)
        expect(puzzle.narrativeThreads.every(thread => typeof thread === 'string')).toBe(true)
      })
    })

    it('should handle empty data array response', async () => {
      // Arrange: Mock an empty response from the API
      server.use(
        http.get(`${API_BASE}/notion/puzzles`, () => {
          return HttpResponse.json({ data: [], nextCursor: null, hasMore: false }, { status: 200 })
        })
      )

      const { result } = renderHook(() => usePuzzles(), {
        wrapper: createWrapper(queryClient),
      })

      // Act & Assert: Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Assert: Data should be an empty array, hasMore should be false
      expect(result.current.data).toEqual([])
      expect(result.current.hasMore).toBe(false)
      expect(result.current.nextCursor).toBeNull()
    })
  })

  describe('Pagination Support', () => {
    it('should support limit parameter', async () => {
      // Arrange: Request a specific limit
      const { result } = renderHook(
        () => usePuzzles({ limit: 3 }), // Request only 3 puzzles
        {
          wrapper: createWrapper(queryClient),
        }
      )

      // Act & Assert: Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Assert: The number of puzzles returned should respect the limit
      expect(result.current.data?.length).toBeLessThanOrEqual(3)
      expect(result.current.data?.length).toBe(3); // Given mock data has enough puzzles
    })

    it('should handle cursor-based pagination', async () => {
      // Arrange: Fetch the first page with a limit
      const { result: firstPage } = renderHook(
        () => usePuzzles({ limit: 3 }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(firstPage.current.isSuccess).toBe(true)
      })

      const nextCursor = firstPage.current.nextCursor
      expect(nextCursor).toBeDefined()
      expect(firstPage.current.data?.length).toBe(3); // Ensure first page has 3 puzzles

      // Arrange: Fetch the second page using the cursor from the first page
      const { result: secondPage } = renderHook(
        () => usePuzzles({ limit: 3, cursor: nextCursor || undefined }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      // Act & Assert: Wait for the second query to succeed
      await waitFor(() => {
        expect(secondPage.current.isSuccess).toBe(true)
      })

      // Assert: Data on the second page should be different from the first page
      expect(secondPage.current.data?.[0]?.id).not.toBe(firstPage.current.data?.[0]?.id)
      expect(secondPage.current.data?.[0]?.id).toBe(mockPuzzles[3]?.id); // Verify it's the expected next puzzle
    })

    it('should indicate hasMore correctly', async () => {
      // Arrange: Request a limit that leaves more data available
      const { result } = renderHook(
        () => usePuzzles({ limit: 3 }), // There are more than 3 mock puzzles
        {
          wrapper: createWrapper(queryClient),
        }
      )

      // Act & Assert: Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Assert: hasMore should be true as there are more puzzles beyond the limit
      expect(result.current.hasMore).toBe(true)

      // Arrange: Request a limit that covers all available data
      const { result: allDataResult } = renderHook(
        () => usePuzzles({ limit: mockPuzzles.length }), // Fetch all puzzles
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(allDataResult.current.isSuccess).toBe(true)
      })

      // Assert: hasMore should be false as all puzzles are fetched
      expect(allDataResult.current.hasMore).toBe(false)
      expect(allDataResult.current.nextCursor).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Arrange: Mock a network error response
      server.use(
        http.get(`${API_BASE}/notion/puzzles`, () => {
          return HttpResponse.error()
        })
      )

      const { result } = renderHook(() => usePuzzles(), {
        wrapper: createWrapper(queryClient),
      })

      // Act & Assert: Wait for the query to enter an error state
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Assert: Error object should be defined and data should be undefined
      expect(result.current.error).toBeDefined()
      expect(result.current.data).toBeUndefined()
    })

    it('should handle 401 unauthorized', async () => {
      server.use(
        http.get(`${API_BASE}/notion/puzzles`, () => {
          return HttpResponse.json(
            {
              statusCode: 401,
              code: 'UNAUTHORIZED',
              message: 'Invalid API key',
            },
            { status: 401 }
          )
        })
      )

      const { result } = renderHook(() => usePuzzles(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error?.message).toContain('Invalid API key')
    })

    it('should handle 429 rate limiting', async () => {
      server.use(
        http.get(`${API_BASE}/notion/puzzles`, () => {
          return HttpResponse.json(
            {
              statusCode: 429,
              code: 'RATE_LIMITED',
              message: 'Too many requests',
            },
            { status: 429 }
          )
        })
      )

      const { result } = renderHook(() => usePuzzles(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toContain('Too many requests')
    })

    it('should handle 500 server errors', async () => {
      server.use(
        http.get(`${API_BASE}/notion/puzzles`, () => {
          return HttpResponse.json(
            {
              statusCode: 500,
              code: 'INTERNAL_ERROR',
              message: 'Internal server error',
            },
            { status: 500 }
          )
        })
      )

      const { result } = renderHook(() => usePuzzles(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toContain('Internal server error')
    })
  })

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      // Arrange: Render the hook
      const { result } = renderHook(() => usePuzzles(), {
        wrapper: createWrapper(queryClient),
      })

      // Assert: Initial state should be loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isFetching).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should transition through loading states correctly', async () => {
      const { result } = renderHook(() => usePuzzles(), {
        wrapper: createWrapper(queryClient),
      })

      // Initial loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isSuccess).toBe(false)

      // After success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
    })
  })

  describe('Cache Management', () => {
    it('should use cached data on subsequent calls', async () => {
      // Arrange: Spy on global fetch to count network requests
      const fetchSpy = vi.spyOn(global, 'fetch')

      // Act: First call to populate cache
      const { result: first } = renderHook(() => usePuzzles(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(first.current.isSuccess).toBe(true)
      })

      const firstCallCount = fetchSpy.mock.calls.length
      expect(firstCallCount).toBeGreaterThan(0); // Ensure at least one fetch happened

      // Act: Second call with the same query key
      const { result: second } = renderHook(() => usePuzzles(), {
        wrapper: createWrapper(queryClient),
      })

      // Assert: Data should be immediately available from cache, not loading
      expect(second.current.data).toBeDefined()
      expect(second.current.isLoading).toBe(false)

      // Assert: No new fetch call should have been made for the second render
      expect(fetchSpy.mock.calls.length).toBe(firstCallCount)

      // Cleanup spy
      fetchSpy.mockRestore()
    })

    it('should refetch when cache is invalidated', async () => {
      const { result } = renderHook(() => usePuzzles(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Track fetch calls
      const fetchSpy = vi.spyOn(global, 'fetch')
      const callsBefore = fetchSpy.mock.calls.length

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['notion', 'puzzles'] })
      await queryClient.refetchQueries({ queryKey: ['notion', 'puzzles'] })

      await waitFor(() => {
        // Should have made a new fetch call
        expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsBefore)
      })

      // Data should be refreshed (same in this case with mocks)
      expect(result.current.data).toBeDefined()
      
      fetchSpy.mockRestore()
    })
  })

  describe('Configuration Options', () => {
    it('should respect enabled option', async () => {
      // Arrange: Spy on global fetch
      const fetchSpy = vi.spyOn(global, 'fetch')

      // Act: Render hook with enabled: false
      const { result } = renderHook(
        () => usePuzzles({ enabled: false }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      // Assert: Should not fetch when disabled. Wait a short period to ensure no fetch occurs.
      await new Promise(resolve => setTimeout(resolve, 100)) // Give React Query time to potentially fetch

      expect(result.current.isLoading).toBe(false) // Should not be loading
      expect(result.current.data).toBeUndefined() // No data fetched
      expect(fetchSpy).not.toHaveBeenCalled() // No network request made

      // Cleanup spy
      fetchSpy.mockRestore()
    })

    it('should support custom staleTime', async () => {
      const customStaleTime = 10 * 60 * 1000 // 10 minutes

      const { result, rerender } = renderHook(
        () => usePuzzles({ staleTime: customStaleTime }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Query should use custom stale time - verify it stays fresh
      // By checking that a subsequent render doesn't refetch
      const fetchSpy = vi.spyOn(global, 'fetch')
      const callsBefore = fetchSpy.mock.calls.length
      
      // Rerender with same query - should use stale data
      rerender()
      
      // Should not have made another fetch since data is still fresh
      expect(fetchSpy.mock.calls.length).toBe(callsBefore)
      
      fetchSpy.mockRestore()
    })
  })
})