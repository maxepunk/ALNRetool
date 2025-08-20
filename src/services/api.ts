/**
 * API Client Layer for ALNRetool
 * 
 * Centralized HTTP client for all Notion API communication through our Express proxy.
 * Handles authentication, error handling, and response parsing.
 * 
 * This layer is responsible for:
 * - Making HTTP requests to our Express backend
 * - Setting authentication headers
 * - Parsing responses and handling errors
 * - Providing typed interfaces for each endpoint
 */

import type {
  APIResponse,
  APIError,
  Character,
  Element,
  Puzzle,
  TimelineEvent,
} from '@/types/notion/app';
import { requestBatcher } from './requestBatcher';

// Get API base URL from environment or use relative path in production
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api');

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  
  constructor(
    statusCode: number,
    code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Generic fetcher function with error handling and request deduplication
 */
async function fetcher<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Use request batcher for GET requests to deduplicate
  if (!options?.method || options.method === 'GET') {
    return requestBatcher.execute(
      endpoint,
      () => fetcherImpl<T>(endpoint, options),
      options?.body ? JSON.parse(options.body as string) : undefined
    );
  }
  
  // For non-GET requests, execute directly
  return fetcherImpl<T>(endpoint, options);
}

/**
 * Internal fetcher implementation
 */
async function fetcherImpl<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const apiKey = import.meta.env.VITE_NOTION_API_KEY || localStorage.getItem('notionApiKey');
  
  // In production, the backend handles API key authentication
  // Only require API key in development
  const isLocalDev = window.location.hostname === 'localhost';
  if (isLocalDev && !apiKey) {
    throw new ApiError(401, 'MISSING_API_KEY', 'No API key configured for local development');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Only send API key header if we have one (for local dev)
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }
  
  // Merge any additional headers from options
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'Server returned non-JSON response'
    );
  }

  const data = await response.json();

  // Handle error responses
  if (!response.ok) {
    const error = data as APIError;
    throw new ApiError(
      error.statusCode || response.status,
      error.code || 'UNKNOWN_ERROR',
      error.message || 'An unknown error occurred'
    );
  }

  return data as T;
}

/**
 * Build query string from parameters
 */
function buildQueryString<T extends Record<string, unknown>>(params?: T): string {
  if (!params) return '';
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

/**
 * Characters API
 */
export const charactersApi = {
  /**
   * Fetch paginated list of characters
   */
  list: async (params?: PaginationParams): Promise<APIResponse<Character>> => {
    const queryString = buildQueryString(params as Record<string, unknown>);
    return fetcher<APIResponse<Character>>(`/notion/characters${queryString}`);
  },

  /**
   * Fetch all characters (handles pagination internally)
   */
  listAll: async (): Promise<Character[]> => {
    const allCharacters: Character[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    let pageCount = 0;

    console.log('[charactersApi.listAll] Starting to fetch all characters');
    
    while (hasMore) {
      pageCount++;
      const response = await charactersApi.list({ limit: 100, cursor });
      console.log(`[charactersApi.listAll] Page ${pageCount}: ${response.data.length} items, hasMore: ${response.hasMore}`);
      
      allCharacters.push(...response.data);
      cursor = response.nextCursor || undefined;
      hasMore = response.hasMore;
    }

    console.log(`[charactersApi.listAll] Complete. Total: ${allCharacters.length}`);
    return allCharacters;
  },

  /**
   * Update a character
   */
  update: async (id: string, updates: Partial<Character>): Promise<Character> => {
    return fetcher<Character>(`/notion/characters/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  },
};

/**
 * Elements API
 */
export const elementsApi = {
  /**
   * Fetch paginated list of elements
   */
  list: async (params?: PaginationParams): Promise<APIResponse<Element>> => {
    const queryString = buildQueryString(params as Record<string, unknown>);
    return fetcher<APIResponse<Element>>(`/notion/elements${queryString}`);
  },

  /**
   * Fetch all elements (handles pagination internally)
   */
  listAll: async (): Promise<Element[]> => {
    const allElements: Element[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    let pageCount = 0;

    console.log('[elementsApi.listAll] Starting to fetch all elements');
    
    while (hasMore) {
      pageCount++;
      console.log(`[elementsApi.listAll] Fetching page ${pageCount}, cursor: ${cursor || 'none'}`);
      
      const response = await elementsApi.list({ limit: 100, cursor });
      console.log(`[elementsApi.listAll] Page ${pageCount} received: ${response.data.length} items, hasMore: ${response.hasMore}, nextCursor: ${response.nextCursor}`);
      
      allElements.push(...response.data);
      cursor = response.nextCursor || undefined;
      hasMore = response.hasMore;
      
      // Extra safety check
      if (!response.nextCursor && response.hasMore) {
        console.warn('[elementsApi.listAll] WARNING: hasMore is true but nextCursor is null!');
        hasMore = false;
      }
      
      // Debug: Check if we should continue
      console.log(`[elementsApi.listAll] Continue? hasMore=${hasMore}, cursor=${cursor}`);
    }

    console.log(`[elementsApi.listAll] Complete. Total elements: ${allElements.length}`);
    
    // Debug: Check for the specific element we're looking for
    const blackMarketCard = allElements.find(e => e.id === '1dc2f33d-583f-8056-bf34-c6a9922067d8');
    if (blackMarketCard) {
      console.log('[elementsApi.listAll] Found Black Market Business card in fetched data!');
    } else {
      console.log('[elementsApi.listAll] Black Market Business card NOT found in fetched data');
    }
    
    return allElements;
  },

  /**
   * Update an element
   */
  update: async (id: string, updates: Partial<Element>): Promise<Element> => {
    return fetcher<Element>(`/notion/elements/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  },
};

/**
 * Puzzles API
 */
export const puzzlesApi = {
  /**
   * Fetch paginated list of puzzles
   */
  list: async (params?: PaginationParams): Promise<APIResponse<Puzzle>> => {
    const queryString = buildQueryString(params as Record<string, unknown>);
    return fetcher<APIResponse<Puzzle>>(`/notion/puzzles${queryString}`);
  },

  /**
   * Fetch all puzzles (handles pagination internally)
   */
  listAll: async (): Promise<Puzzle[]> => {
    const allPuzzles: Puzzle[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await puzzlesApi.list({ limit: 100, cursor });
      allPuzzles.push(...response.data);
      cursor = response.nextCursor || undefined;
      hasMore = response.hasMore;
    }

    return allPuzzles;
  },

  /**
   * Update a puzzle
   */
  update: async (id: string, updates: Partial<Puzzle>): Promise<Puzzle> => {
    return fetcher<Puzzle>(`/notion/puzzles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  },
};

/**
 * Timeline API
 */
export const timelineApi = {
  /**
   * Fetch paginated list of timeline events
   */
  list: async (params?: PaginationParams): Promise<APIResponse<TimelineEvent>> => {
    const queryString = buildQueryString(params as Record<string, unknown>);
    return fetcher<APIResponse<TimelineEvent>>(`/notion/timeline${queryString}`);
  },

  /**
   * Fetch all timeline events (handles pagination internally)
   */
  listAll: async (): Promise<TimelineEvent[]> => {
    const allEvents: TimelineEvent[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    let pageCount = 0;

    console.log('[timelineApi.listAll] Starting to fetch all timeline events');
    
    while (hasMore) {
      pageCount++;
      console.log(`[timelineApi.listAll] Fetching page ${pageCount}, cursor: ${cursor || 'none'}`);
      
      const response = await timelineApi.list({ limit: 100, cursor });
      console.log(`[timelineApi.listAll] Page ${pageCount} received: ${response.data.length} items, hasMore: ${response.hasMore}, nextCursor: ${response.nextCursor}`);
      
      allEvents.push(...response.data);
      cursor = response.nextCursor || undefined;
      hasMore = response.hasMore;
      
      // Extra safety check
      if (!response.nextCursor && response.hasMore) {
        console.warn('[timelineApi.listAll] WARNING: hasMore is true but nextCursor is null!');
        hasMore = false;
      }
    }

    console.log(`[timelineApi.listAll] Complete. Total timeline events: ${allEvents.length}`);
    
    // Debug: Check for the specific timeline event we're looking for
    const missingEvent = allEvents.find(e => e.id === '1b52f33d-583f-80f0-a1f3-ecb9b9cdd040');
    if (missingEvent) {
      console.log('[timelineApi.listAll] Found timeline event 1b52f33d-583f-80f0-a1f3-ecb9b9cdd040 in fetched data!');
    } else {
      console.log('[timelineApi.listAll] Timeline event 1b52f33d-583f-80f0-a1f3-ecb9b9cdd040 NOT found in fetched data');
    }
    
    return allEvents;
  },

  /**
   * Update a timeline event
   */
  update: async (id: string, updates: Partial<TimelineEvent>): Promise<TimelineEvent> => {
    return fetcher<TimelineEvent>(`/notion/timeline/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  },
};

/**
 * Cache management API
 */
export const cacheApi = {
  /**
   * Get cache statistics
   */
  stats: async (): Promise<{ keys: number; hits: number; misses: number; hitRate: string }> => {
    return fetcher('/cache/stats');
  },

  /**
   * Clear all cached data
   */
  clearAll: async (): Promise<{ message: string; clearedKeys: number }> => {
    return fetcher('/cache/clear', { method: 'POST' });
  },

  /**
   * Clear cache for specific endpoint
   */
  clearEndpoint: async (endpoint: string): Promise<{ message: string; clearedKeys: number }> => {
    return fetcher(`/cache/clear/${endpoint}`, { method: 'POST' });
  },
};

/**
 * Synthesized data API - returns all entities with bidirectional relationships
 */
export const synthesizedApi = {
  /**
   * Fetch all entities with synthesized bidirectional relationships
   */
  getAll: async (): Promise<{
    elements: Element[];
    puzzles: Puzzle[];
    totalElements: number;
    totalPuzzles: number;
  }> => {
    console.log('[synthesizedApi.getAll] Fetching synthesized data...');
    const result = await fetcher<{
      elements: Element[];
      puzzles: Puzzle[];
      totalElements: number;
      totalPuzzles: number;
    }>('/notion/synthesized');
    
    console.log(`[synthesizedApi.getAll] Complete. Elements: ${result.totalElements}, Puzzles: ${result.totalPuzzles}`);
    
    // Debug: Check relationship counts
    const elementsWithPuzzleRefs = result.elements.filter(e => 
      (e.requiredForPuzzleIds?.length > 0) || (e.rewardedByPuzzleIds?.length > 0)
    );
    console.log(`[synthesizedApi.getAll] Elements with puzzle relationships: ${elementsWithPuzzleRefs.length}`);
    
    return result;
  },
};

/**
 * Force bypass cache for a request
 */
export function withCacheBypass<T extends RequestInit>(options?: T): T {
  return {
    ...options,
    headers: {
      ...options?.headers,
      'X-Cache-Bypass': 'true',
    },
  } as unknown as T;
}