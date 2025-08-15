import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@/test/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useTimeline } from './useTimeline'
import { server } from '@/test/setup'
import { http, HttpResponse } from 'msw'
import { mockTimeline } from '@/test/mocks/data/timeline'

const API_BASE = 'http://localhost:3001/api'

describe('useTimeline', () => {
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
    it('should fetch timeline events successfully', async () => {
      // Arrange: Render the hook
      const { result } = renderHook(() => useTimeline(), {
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
      expect(result.current.data?.[0]).toHaveProperty('date')
    })

    it('should return typed TimelineEvent array with all required properties', async () => {
      // Arrange: Render the hook
      const { result } = renderHook(() => useTimeline(), {
        wrapper: createWrapper(queryClient),
      })

      // Act & Assert: Wait for the query to succeed
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const events = result.current.data
      expect(events).toBeDefined()
      expect(events?.length).toBeGreaterThan(0)

      // Assert: Type checking - ensure all TimelineEvent fields are present and correctly typed
      events?.forEach((event) => {
        expect(event).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          date: expect.any(String),
          charactersInvolvedIds: expect.any(Array),
          memoryEvidenceIds: expect.any(Array),
          memTypes: expect.any(Array),
          notes: expect.any(String),
          lastEditedTime: expect.any(String),
        })

        // Validate date format (should be ISO date string like '2024-01-15')
        expect(event.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        
        // Validate lastEditedTime format (should be ISO 8601 with timezone)
        expect(event.lastEditedTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)

        // Validate memTypes array contains valid ElementBasicType strings or is empty
        event.memTypes.forEach(memType => {
          expect(memType).toMatch(/^(Set Dressing|Prop|Memory Token \(Audio\)|Memory Token \(Video\)|Memory Token \(Image\)|Memory Token \(Audio\+Image\)|Document)$/)
        })

        // Ensure all string arrays contain only strings
        expect(event.charactersInvolvedIds.every(id => typeof id === 'string')).toBe(true)
        expect(event.memoryEvidenceIds.every(id => typeof id === 'string')).toBe(true)
        expect(event.memTypes.every(type => typeof type === 'string')).toBe(true)
      })
    })

    it('should handle empty data array response', async () => {
      // Arrange: Mock an empty response from the API
      server.use(
        http.get(`${API_BASE}/notion/timeline`, () => {
          return HttpResponse.json({ data: [], nextCursor: null, hasMore: false }, { status: 200 })
        })
      )

      const { result } = renderHook(() => useTimeline(), {
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
        () => useTimeline({ limit: 3 }), // Request only 3 events
        {
          wrapper: createWrapper(queryClient),
        }
      )

      // Act & Assert: Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Assert: The number of events returned should respect the limit
      expect(result.current.data?.length).toBeLessThanOrEqual(3)
      expect(result.current.data?.length).toBe(3); // Given mock data has enough events
    })

    it('should handle cursor-based pagination', async () => {
      // Arrange: Fetch the first page with a limit
      const { result: firstPage } = renderHook(
        () => useTimeline({ limit: 4 }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(firstPage.current.isSuccess).toBe(true)
      })

      const nextCursor = firstPage.current.nextCursor
      expect(nextCursor).toBeDefined()
      expect(firstPage.current.data?.length).toBe(4); // Ensure first page has 4 events

      // Arrange: Fetch the second page using the cursor from the first page
      const { result: secondPage } = renderHook(
        () => useTimeline({ limit: 4, cursor: nextCursor || undefined }),
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
      expect(secondPage.current.data?.[0]?.id).toBe(mockTimeline[4]?.id); // Verify it's the expected next event
    })

    it('should indicate hasMore correctly', async () => {
      // Arrange: Request a limit that leaves more data available
      const { result } = renderHook(
        () => useTimeline({ limit: 4 }), // There are more than 4 mock timeline events
        {
          wrapper: createWrapper(queryClient),
        }
      )

      // Act & Assert: Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Assert: hasMore should be true as there are more events beyond the limit
      expect(result.current.hasMore).toBe(true)

      // Arrange: Request a limit that covers all available data
      const { result: allDataResult } = renderHook(
        () => useTimeline({ limit: mockTimeline.length }), // Fetch all events
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(allDataResult.current.isSuccess).toBe(true)
      })

      // Assert: hasMore should be false as all events are fetched
      expect(allDataResult.current.hasMore).toBe(false)
      expect(allDataResult.current.nextCursor).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Arrange: Mock a network error response
      server.use(
        http.get(`${API_BASE}/notion/timeline`, () => {
          return HttpResponse.error()
        })
      )

      const { result } = renderHook(() => useTimeline(), {
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
        http.get(`${API_BASE}/notion/timeline`, () => {
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

      const { result } = renderHook(() => useTimeline(), {
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
        http.get(`${API_BASE}/notion/timeline`, () => {
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

      const { result } = renderHook(() => useTimeline(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toContain('Too many requests')
    })

    it('should handle 500 server errors', async () => {
      server.use(
        http.get(`${API_BASE}/notion/timeline`, () => {
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

      const { result } = renderHook(() => useTimeline(), {
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
      const { result } = renderHook(() => useTimeline(), {
        wrapper: createWrapper(queryClient),
      })

      // Assert: Initial state should be loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isFetching).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should transition through loading states correctly', async () => {
      const { result } = renderHook(() => useTimeline(), {
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
      const { result: first } = renderHook(() => useTimeline(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(first.current.isSuccess).toBe(true)
      })

      const firstCallCount = fetchSpy.mock.calls.length
      expect(firstCallCount).toBeGreaterThan(0); // Ensure at least one fetch happened

      // Act: Second call with the same query key
      const { result: second } = renderHook(() => useTimeline(), {
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
      const { result } = renderHook(() => useTimeline(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Track fetch calls
      const fetchSpy = vi.spyOn(global, 'fetch')
      const callsBefore = fetchSpy.mock.calls.length

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['notion', 'timeline'] })
      await queryClient.refetchQueries({ queryKey: ['notion', 'timeline'] })

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
        () => useTimeline({ enabled: false }),
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
        () => useTimeline({ staleTime: customStaleTime }),
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