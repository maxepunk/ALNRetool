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
import { cacheVersionManager } from '@/lib/cache/CacheVersionManager';

/**
 * Metadata for atomic parent relationship creation.
 * When creating an entity from a relation field, this ensures
 * the new entity is automatically added to the parent's relation.
 */
type ParentRelationMetadata = {
  _parentRelation?: {
    parentType: string;
    parentId: string;
    fieldKey: string;
  };
};



/**
 * API base URL configuration.
 * Uses environment variable in development, relative path in production.
 * 
 * @constant {string} API_BASE_URL
 * 
 * **Configuration:**
 * - Development: http://localhost:3001/api
 * - Production: /api (relative to deployed domain)
 * - Override: Set VITE_API_URL environment variable
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api');

/**
 * Custom error class for API errors.
 * Extends Error with HTTP status code and error code.
 * 
 * @class ApiError
 * @extends {Error}
 * 
 * @property {number} statusCode - HTTP status code
 * @property {string} code - Application error code
 * 
 * @example
 * throw new ApiError(404, 'NOT_FOUND', 'Entity not found');
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
 * Generic fetcher function with error handling and request deduplication.
 * Routes GET requests through batcher to prevent duplicate requests.
 * 
 * @function fetcher
 * @template T - Response data type
 * @param {string} endpoint - API endpoint path
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<T>} Parsed response data
 * @throws {ApiError} On HTTP errors or network failures
 * 
 * **Features:**
 * - Request deduplication for GET requests
 * - Automatic error handling
 * - Response parsing
 * - Cache version management
 * 
 * **Complexity:** O(1) for cache lookup
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
 * Internal fetcher implementation.
 * Handles actual HTTP requests with authentication and error handling.
 * 
 * @function fetcherImpl
 * @template T - Response data type
 * @param {string} endpoint - API endpoint path
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<T>} Parsed response data
 * @throws {ApiError} On HTTP errors or network failures
 * 
 * **Process:**
 * 1. Set authentication header
 * 2. Make HTTP request
 * 3. Handle errors and parse response
 * 4. Update cache version on mutations
 * 
 * @private
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
    ...cacheVersionManager.getRequestHeaders(), // Add cache version headers
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

  // Process cache version headers
  cacheVersionManager.processResponseHeaders(response.headers);
  
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
 * Filter parameters for puzzle queries
 */
export interface PuzzleFilterParams extends PaginationParams {
  acts?: string;
  status?: string;
  lastEdited?: string;
}

/**
 * Filter parameters for character queries
 */
export interface CharacterFilterParams extends PaginationParams {
  tiers?: string;
  type?: string;
  lastEdited?: string;
}

/**
 * Filter parameters for element queries
 */
export interface ElementFilterParams extends PaginationParams {
  status?: string;
  lastEdited?: string;
}

/**
 * Characters API
 */
export const charactersApi = {
  /**
   * Fetch paginated list of characters
   */
  list: async (params?: CharacterFilterParams): Promise<APIResponse<Character>> => {
    const queryString = buildQueryString(params as Record<string, unknown>);
    return fetcher<APIResponse<Character>>(`/notion/characters${queryString}`);
  },

  /**
   * Fetch all characters (handles pagination internally)
   */
  listAll: async (filters?: CharacterFilterParams): Promise<Character[]> => {
    const allCharacters: Character[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    let pageCount = 0;

    console.debug('[charactersApi.listAll] Starting to fetch all characters', undefined, filters ? 'with filters' : 'no filters');
    
    while (hasMore) {
      pageCount++;
      const response = await charactersApi.list({ ...filters, limit: 100, cursor });
      console.debug(`[charactersApi.listAll] Page ${pageCount}: ${response.data.length} items, hasMore: ${response.hasMore}`);
      
      allCharacters.push(...response.data);
      cursor = response.nextCursor || undefined;
      hasMore = response.hasMore;
    }

    console.debug(`[charactersApi.listAll] Complete. Total: ${allCharacters.length}`);
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

  /**
   * Create a new character
   */
  create: async (data: Partial<Character> & ParentRelationMetadata): Promise<Character> => {
    return fetcher<Character>('/notion/characters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
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
  list: async (params?: ElementFilterParams): Promise<APIResponse<Element>> => {
    const queryString = buildQueryString(params as Record<string, unknown>);
    return fetcher<APIResponse<Element>>(`/notion/elements${queryString}`);
  },

  /**
   * Fetch all elements (handles pagination internally)
   */
  listAll: async (filters?: ElementFilterParams): Promise<Element[]> => {
    const allElements: Element[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    let pageCount = 0;

    console.debug('[elementsApi.listAll] Starting to fetch all elements', undefined, filters ? 'with filters' : 'no filters');
    
    while (hasMore) {
      pageCount++;
      
      const response = await elementsApi.list({ ...filters, limit: 100, cursor });
      console.debug(`[elementsApi.listAll] Page ${pageCount} received: ${response.data.length} items, hasMore: ${response.hasMore}, nextCursor: ${response.nextCursor}`);
      
      allElements.push(...response.data);
      cursor = response.nextCursor || undefined;
      hasMore = response.hasMore;
      
      // Extra safety check
      if (!response.nextCursor && response.hasMore) {
        console.warn('[elementsApi.listAll] WARNING: hasMore is true but nextCursor is null!');
        hasMore = false;
      }
      
      // Debug: Check if we should continue
      console.debug(`[elementsApi.listAll] Continue? hasMore=${hasMore}, cursor=${cursor}`);
    }

    console.debug(`[elementsApi.listAll] Complete. Total elements: ${allElements.length}`);
    
    // Debug: Check for the specific element we're looking for
    const blackMarketCard = allElements.find(e => e.id === '1dc2f33d-583f-8056-bf34-c6a9922067d8');
    if (blackMarketCard) {
      console.debug('[elementsApi.listAll] Found Black Market Business card in fetched data!');
    } else {
      console.debug('[elementsApi.listAll] Black Market Business card NOT found in fetched data');
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

  /**
   * Create a new element
   */
  create: async (data: Partial<Element> & ParentRelationMetadata): Promise<Element> => {
    return fetcher<Element>('/notion/elements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
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
  list: async (params?: PuzzleFilterParams): Promise<APIResponse<Puzzle>> => {
    const queryString = buildQueryString(params as Record<string, unknown>);
    return fetcher<APIResponse<Puzzle>>(`/notion/puzzles${queryString}`);
  },

  /**
   * Fetch all puzzles (handles pagination internally)
   */
  listAll: async (filters?: PuzzleFilterParams): Promise<Puzzle[]> => {
    const allPuzzles: Puzzle[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await puzzlesApi.list({ ...filters, limit: 100, cursor });
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

  /**
   * Create a new puzzle
   */
  create: async (data: Partial<Puzzle> & ParentRelationMetadata): Promise<Puzzle> => {
    return fetcher<Puzzle>('/notion/puzzles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
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
  listAll: async (filters?: PaginationParams): Promise<TimelineEvent[]> => {
    const allEvents: TimelineEvent[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    let pageCount = 0;

    console.debug('[timelineApi.listAll] Starting to fetch all timeline events', undefined, filters ? 'with filters' : 'no filters');
    
    while (hasMore) {
      pageCount++;
      
      const response = await timelineApi.list({ ...filters, limit: 100, cursor });
      console.debug(`[timelineApi.listAll] Page ${pageCount} received: ${response.data.length} items, hasMore: ${response.hasMore}, nextCursor: ${response.nextCursor}`);
      
      allEvents.push(...response.data);
      cursor = response.nextCursor || undefined;
      hasMore = response.hasMore;
      
      // Extra safety check
      if (!response.nextCursor && response.hasMore) {
        console.warn('[timelineApi.listAll] WARNING: hasMore is true but nextCursor is null!');
        hasMore = false;
      }
    }

    console.debug(`[timelineApi.listAll] Complete. Total timeline events: ${allEvents.length}`);
    
    // Debug: Check for the specific timeline event we're looking for
    const missingEvent = allEvents.find(e => e.id === '1b52f33d-583f-80f0-a1f3-ecb9b9cdd040');
    if (missingEvent) {
      console.debug('[timelineApi.listAll] Found timeline event 1b52f33d-583f-80f0-a1f3-ecb9b9cdd040 in fetched data!');
    } else {
      console.debug('[timelineApi.listAll] Timeline event 1b52f33d-583f-80f0-a1f3-ecb9b9cdd040 NOT found in fetched data');
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

  /**
   * Create a new timeline event
   */
  create: async (data: Partial<TimelineEvent> & ParentRelationMetadata): Promise<TimelineEvent> => {
    return fetcher<TimelineEvent>('/notion/timeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
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
 * Combined filter parameters for synthesized endpoint
 */
export interface SynthesizedFilterParams {
  // Element filters
  elementStatus?: string;
  elementLastEdited?: string;
  
  // Puzzle filters (limited by Notion API)
  puzzleLastEdited?: string;
}

/**
 * Synthesized data API - returns all entities with bidirectional relationships
 */
export const synthesizedApi = {
  /**
   * Fetch all entities with synthesized bidirectional relationships
   */
  getAll: async (filters?: SynthesizedFilterParams): Promise<{
    elements: Element[];
    puzzles: Puzzle[];
    totalElements: number;
    totalPuzzles: number;
  }> => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : '';
    console.debug('[synthesizedApi.getAll] Fetching synthesized data...', undefined, filters ? `with filters: ${queryString}` : 'no filters');
    
    const result = await fetcher<{
      elements: Element[];
      puzzles: Puzzle[];
      totalElements: number;
      totalPuzzles: number;
    }>(`/notion/synthesized${queryString}`);
    
    console.debug(`[synthesizedApi.getAll] Complete. Elements: ${result.totalElements}, Puzzles: ${result.totalPuzzles}`);
    
    // Debug: Check relationship counts
    const elementsWithPuzzleRefs = result.elements.filter(e => 
      (e.requiredForPuzzleIds?.length > 0) || (e.rewardedByPuzzleIds?.length > 0)
    );
    console.debug(`[synthesizedApi.getAll] Elements with puzzle relationships: ${elementsWithPuzzleRefs.length}`);
    
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