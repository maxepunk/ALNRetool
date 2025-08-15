import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@/test/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useElements } from './useElements'
import { server } from '@/test/setup'
import { http, HttpResponse } from 'msw'
import { mockElements } from '@/test/mocks/data/elements'

const API_BASE = 'http://localhost:3001/api'

describe('useElements', () => {
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
    it('should fetch elements successfully', async () => {
      // Arrange: Render the hook
      const { result } = renderHook(() => useElements(), {
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
      expect(result.current.data?.[0]).toHaveProperty('basicType')
    })

    it('should return typed Element array with all required properties including sfPatterns', async () => {
      // Arrange: Render the hook
      const { result } = renderHook(() => useElements(), {
        wrapper: createWrapper(queryClient),
      })

      // Act & Assert: Wait for the query to succeed
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const elements = result.current.data
      expect(elements).toBeDefined()
      expect(elements?.length).toBeGreaterThan(0)

      // Assert: Type checking - ensure all required Element fields are present and correctly typed
      elements?.forEach((elem) => {
        expect(elem).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          descriptionText: expect.any(String),
          basicType: expect.stringMatching(/^(Set Dressing|Prop|Memory Token \(Audio\)|Memory Token \(Video\)|Memory Token \(Image\)|Memory Token \(Audio\+Image\)|Document)$/),
          contentIds: expect.any(Array),
          status: expect.any(String),
          requiredForPuzzleIds: expect.any(Array),
          rewardedByPuzzleIds: expect.any(Array),
          narrativeThreads: expect.any(Array),
          associatedCharacterIds: expect.any(Array),
          puzzleChain: expect.any(Array),
          productionNotes: expect.any(String),
          filesMedia: expect.any(Array),
          isContainer: expect.any(Boolean),
          sfPatterns: expect.any(Object), // Can be empty object or contain SF_ data
        })
        
        // Validate firstAvailable field separately (can be Act string or null)
        expect(elem.firstAvailable === null || typeof elem.firstAvailable === 'string').toBe(true);
        if (elem.firstAvailable !== null) {
          expect(elem.firstAvailable).toMatch(/^Act [0-2]$/);
        }
        
        // Ensure narrativeThreads is an array of strings
        expect(elem.narrativeThreads.every(thread => typeof thread === 'string')).toBe(true);
        
        // If sfPatterns has data, validate its structure
        if (elem.sfPatterns && Object.keys(elem.sfPatterns).length > 0) {
          if ('rfid' in elem.sfPatterns) {
            expect(elem.sfPatterns.rfid).toEqual(expect.any(String));
          }
          if ('valueRating' in elem.sfPatterns) {
            expect(elem.sfPatterns.valueRating).toEqual(expect.any(Number));
          }
          if ('memoryType' in elem.sfPatterns) {
            expect(elem.sfPatterns.memoryType).toMatch(/^(Personal|Business|Technical)$/);
          }
        }
      })
    })

    it('should handle empty data array response', async () => {
      // Arrange: Mock an empty response from the API
      server.use(
        http.get(`${API_BASE}/notion/elements`, () => {
          return HttpResponse.json({ data: [], nextCursor: null, hasMore: false }, { status: 200 })
        })
      )

      const { result } = renderHook(() => useElements(), {
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
        () => useElements({ limit: 2 }), // Request only 2 elements
        {
          wrapper: createWrapper(queryClient),
        }
      )

      // Act & Assert: Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Assert: The number of elements returned should respect the limit
      expect(result.current.data?.length).toBeLessThanOrEqual(2)
      expect(result.current.data?.length).toBe(2); // Given mock data has enough elements
    })

    it('should handle cursor-based pagination', async () => {
      // Arrange: Fetch the first page with a limit
      const { result: firstPage } = renderHook(
        () => useElements({ limit: 3 }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(firstPage.current.isSuccess).toBe(true)
      })

      const nextCursor = firstPage.current.nextCursor
      expect(nextCursor).toBeDefined()
      expect(firstPage.current.data?.length).toBe(3); // Ensure first page has 3 elements

      // Arrange: Fetch the second page using the cursor from the first page
      const { result: secondPage } = renderHook(
        () => useElements({ limit: 3, cursor: nextCursor || undefined }),
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
      expect(secondPage.current.data?.[0]?.id).toBe(mockElements[3]?.id); // Verify it's the expected next element
    })

    it('should indicate hasMore correctly', async () => {
      // Arrange: Request a limit that leaves more data available
      const { result } = renderHook(
        () => useElements({ limit: 3 }), // There are more than 3 mock elements
        {
          wrapper: createWrapper(queryClient),
        }
      )

      // Act & Assert: Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Assert: hasMore should be true as there are more elements beyond the limit
      expect(result.current.hasMore).toBe(true)

      // Arrange: Request a limit that covers all available data
      const { result: allDataResult } = renderHook(
        () => useElements({ limit: mockElements.length }), // Fetch all elements
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(allDataResult.current.isSuccess).toBe(true)
      })

      // Assert: hasMore should be false as all elements are fetched
      expect(allDataResult.current.hasMore).toBe(false)
      expect(allDataResult.current.nextCursor).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Arrange: Mock a network error response
      server.use(
        http.get(`${API_BASE}/notion/elements`, () => {
          return HttpResponse.error()
        })
      )

      const { result } = renderHook(() => useElements(), {
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
        http.get(`${API_BASE}/notion/elements`, () => {
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

      const { result } = renderHook(() => useElements(), {
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
        http.get(`${API_BASE}/notion/elements`, () => {
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

      const { result } = renderHook(() => useElements(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toContain('Too many requests')
    })

    it('should handle 500 server errors', async () => {
      server.use(
        http.get(`${API_BASE}/notion/elements`, () => {
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

      const { result } = renderHook(() => useElements(), {
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
      const { result } = renderHook(() => useElements(), {
        wrapper: createWrapper(queryClient),
      })

      // Assert: Initial state should be loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isFetching).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should transition through loading states correctly', async () => {
      const { result } = renderHook(() => useElements(), {
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
      const { result: first } = renderHook(() => useElements(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(first.current.isSuccess).toBe(true)
      })

      const firstCallCount = fetchSpy.mock.calls.length
      expect(firstCallCount).toBeGreaterThan(0); // Ensure at least one fetch happened

      // Act: Second call with the same query key
      const { result: second } = renderHook(() => useElements(), {
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
      const { result } = renderHook(() => useElements(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Track fetch calls
      const fetchSpy = vi.spyOn(global, 'fetch')
      const callsBefore = fetchSpy.mock.calls.length

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['notion', 'elements'] })
      await queryClient.refetchQueries({ queryKey: ['notion', 'elements'] })

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
        () => useElements({ enabled: false }),
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
        () => useElements({ staleTime: customStaleTime }),
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