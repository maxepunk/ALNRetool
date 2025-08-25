import { http, HttpResponse } from 'msw'
import type { APIResponse, Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app'
import { mockCharacters } from './data/characters'
import { mockElements } from './data/elements'
import { mockPuzzles } from './data/puzzles'
import { mockTimeline } from './data/timeline'

const API_BASE = 'http://localhost:3001/api'

export const handlers = [
  // CSRF Token endpoint - handle both absolute and relative URLs
  http.get('/api/csrf-token', () => {
    return HttpResponse.json({ token: 'test-csrf-token-12345' }, { status: 200 })
  }),
  http.get(`${API_BASE}/csrf-token`, () => {
    return HttpResponse.json({ token: 'test-csrf-token-12345' }, { status: 200 })
  }),

  // Test endpoints for fetchWithCSRF tests - handle both absolute and relative URLs
  http.post('/api/test', () => {
    return HttpResponse.json({ success: true }, { status: 200 })
  }),
  http.post(`${API_BASE}/test`, () => {
    return HttpResponse.json({ success: true }, { status: 200 })
  }),
  
  http.put('/api/test', () => {
    return HttpResponse.json({ success: true }, { status: 200 })
  }),
  http.put(`${API_BASE}/test`, () => {
    return HttpResponse.json({ success: true }, { status: 200 })
  }),
  
  http.patch('/api/test', () => {
    return HttpResponse.json({ success: true }, { status: 200 })
  }),
  http.patch(`${API_BASE}/test`, () => {
    return HttpResponse.json({ success: true }, { status: 200 })
  }),
  
  http.delete('/api/test', () => {
    return HttpResponse.json({ success: true }, { status: 200 })
  }),
  http.delete(`${API_BASE}/test`, () => {
    return HttpResponse.json({ success: true }, { status: 200 })
  }),
  
  http.get('/api/test', () => {
    return HttpResponse.json({ success: true }, { status: 200 })
  }),
  http.get(`${API_BASE}/test`, () => {
    return HttpResponse.json({ success: true }, { status: 200 })
  }),

  // Characters endpoint
  http.get(`${API_BASE}/notion/characters`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const cursor = url.searchParams.get('cursor')
    
    // Simulate authentication check
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return HttpResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Simulate rate limiting
    const rateLimitHeader = request.headers.get('x-rate-limit-test')
    if (rateLimitHeader === 'trigger') {
      return HttpResponse.json(
        { error: 'Too Many Requests', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // Return paginated data
    const startIndex = cursor ? parseInt(cursor) : 0
    const endIndex = startIndex + limit
    const paginatedData = mockCharacters.slice(startIndex, endIndex)
    const hasMore = endIndex < mockCharacters.length
    const nextCursor = hasMore ? endIndex.toString() : null

    const response: APIResponse<Character> = {
      data: paginatedData,
      nextCursor,
      hasMore,
    }

    return HttpResponse.json(response, { 
      status: 200,
      headers: {
        'X-Cache-Hit': 'false',
      }
    })
  }),

  // Elements endpoint
  http.get(`${API_BASE}/notion/elements`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const cursor = url.searchParams.get('cursor')
    
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return HttpResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const startIndex = cursor ? parseInt(cursor) : 0
    const endIndex = startIndex + limit
    const paginatedData = mockElements.slice(startIndex, endIndex)
    const hasMore = endIndex < mockElements.length
    const nextCursor = hasMore ? endIndex.toString() : null

    const response: APIResponse<Element> = {
      data: paginatedData,
      nextCursor,
      hasMore,
    }

    return HttpResponse.json(response, { status: 200 })
  }),

  // Puzzles endpoint
  http.get(`${API_BASE}/notion/puzzles`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const cursor = url.searchParams.get('cursor')
    
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return HttpResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const startIndex = cursor ? parseInt(cursor) : 0
    const endIndex = startIndex + limit
    const paginatedData = mockPuzzles.slice(startIndex, endIndex)
    const hasMore = endIndex < mockPuzzles.length
    const nextCursor = hasMore ? endIndex.toString() : null

    const response: APIResponse<Puzzle> = {
      data: paginatedData,
      nextCursor,
      hasMore,
    }

    return HttpResponse.json(response, { status: 200 })
  }),

  // Timeline endpoint
  http.get(`${API_BASE}/notion/timeline`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const cursor = url.searchParams.get('cursor')
    
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return HttpResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const startIndex = cursor ? parseInt(cursor) : 0
    const endIndex = startIndex + limit
    const paginatedData = mockTimeline.slice(startIndex, endIndex)
    const hasMore = endIndex < mockTimeline.length
    const nextCursor = hasMore ? endIndex.toString() : null

    const response: APIResponse<TimelineEvent> = {
      data: paginatedData,
      nextCursor,
      hasMore,
    }

    return HttpResponse.json(response, { status: 200 })
  }),

  // Network error simulation endpoint
  http.get(`${API_BASE}/network-error`, () => {
    return HttpResponse.error()
  }),
]