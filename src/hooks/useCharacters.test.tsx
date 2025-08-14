import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCharacters } from './useCharacters'
import { server } from '@/test/setup'
import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost:3001/api'

describe('useCharacters', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    })
  })

  // Create wrapper component for tests
  const createWrapper = (client: QueryClient) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    Wrapper.displayName = 'QueryClientWrapper'
    return Wrapper
  }

  describe('Successful Data Fetching', () => {
    it('should fetch characters successfully', async () => {
      const { result } = renderHook(() => useCharacters(), {
        wrapper: createWrapper(queryClient),
      })

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verify data
      expect(result.current.data).toBeDefined()
      expect(result.current.data?.length).toBeGreaterThan(0)
      expect(result.current.data?.[0]).toHaveProperty('id')
      expect(result.current.data?.[0]).toHaveProperty('name')
      expect(result.current.data?.[0]).toHaveProperty('type')
    })

    it('should return typed Character array', async () => {
      const { result } = renderHook(() => useCharacters(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const characters = result.current.data
      expect(characters).toBeDefined()
      
      // Type checking - ensure all required Character fields are present
      characters?.forEach((char) => {
        expect(char).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          type: expect.stringMatching(/^(NPC|Player)$/),
          tier: expect.stringMatching(/^(Core|Secondary|Tertiary)$/),
          ownedElementIds: expect.any(Array),
          associatedElementIds: expect.any(Array),
          characterPuzzleIds: expect.any(Array),
          eventIds: expect.any(Array),
          connections: expect.any(Array),
        })
      })
    })
  })

  describe('Pagination Support', () => {
    it('should support pagination parameters', async () => {
      const { result } = renderHook(
        () => useCharacters({ limit: 5 }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Should respect limit
      expect(result.current.data?.length).toBeLessThanOrEqual(5)
    })

    it('should handle cursor-based pagination', async () => {
      // First page
      const { result: firstPage } = renderHook(
        () => useCharacters({ limit: 3 }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(firstPage.current.isSuccess).toBe(true)
      })

      const nextCursor = firstPage.current.nextCursor
      expect(nextCursor).toBeDefined()

      // Second page with cursor
      const { result: secondPage } = renderHook(
        () => useCharacters({ limit: 3, cursor: nextCursor }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(secondPage.current.isSuccess).toBe(true)
      })

      // Should have different data
      expect(secondPage.current.data?.[0]?.id).not.toBe(firstPage.current.data?.[0]?.id)
    })

    it('should indicate hasMore correctly', async () => {
      const { result } = renderHook(
        () => useCharacters({ limit: 3 }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // With only 7 mock characters and limit 3, should have more
      expect(result.current.hasMore).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get(`${API_BASE}/notion/characters`, () => {
          return HttpResponse.error()
        })
      )

      const { result } = renderHook(() => useCharacters(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.data).toBeUndefined()
    })

    it('should handle 401 unauthorized', async () => {
      server.use(
        http.get(`${API_BASE}/notion/characters`, () => {
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

      const { result } = renderHook(() => useCharacters(), {
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
        http.get(`${API_BASE}/notion/characters`, () => {
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

      const { result } = renderHook(() => useCharacters(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toContain('Too many requests')
    })

    it('should handle 500 server errors', async () => {
      server.use(
        http.get(`${API_BASE}/notion/characters`, () => {
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

      const { result } = renderHook(() => useCharacters(), {
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
      const { result } = renderHook(() => useCharacters(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isFetching).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should transition through loading states correctly', async () => {
      const { result } = renderHook(() => useCharacters(), {
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
      const fetchSpy = vi.spyOn(global, 'fetch')

      // First call
      const { result: first } = renderHook(() => useCharacters(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(first.current.isSuccess).toBe(true)
      })

      const firstCallCount = fetchSpy.mock.calls.length

      // Second call with same query key
      const { result: second } = renderHook(() => useCharacters(), {
        wrapper: createWrapper(queryClient),
      })

      // Should immediately have data from cache
      expect(second.current.data).toBeDefined()
      expect(second.current.isLoading).toBe(false)

      // Should not make another fetch call
      expect(fetchSpy.mock.calls.length).toBe(firstCallCount)

      fetchSpy.mockRestore()
    })

    it('should refetch when cache is invalidated', async () => {
      const { result } = renderHook(() => useCharacters(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Track fetch calls
      const fetchSpy = vi.spyOn(global, 'fetch')
      const callsBefore = fetchSpy.mock.calls.length

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['notion', 'characters'] })
      await queryClient.refetchQueries({ queryKey: ['notion', 'characters'] })

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
      const fetchSpy = vi.spyOn(global, 'fetch')

      const { result } = renderHook(
        () => useCharacters({ enabled: false }),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      // Should not fetch when disabled
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(fetchSpy).not.toHaveBeenCalled()

      fetchSpy.mockRestore()
    })

    it('should support custom staleTime', async () => {
      const customStaleTime = 10 * 60 * 1000 // 10 minutes

      const { result, rerender } = renderHook(
        () => useCharacters({ staleTime: customStaleTime }),
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