/**
 * Base utilities for Notion API routes
 * Provides shared helpers for caching, pagination, and request handling
 */

// Performance monitoring counter
let apiCallCounter = 0;

import type { Request, Response } from 'express';
import { notion } from '../../services/notion.js';
import { cacheService } from '../../services/cache.js';
import type { 
  NotionListResponse, 
  NotionPage,
  NotionProperty,
  NotionRelationProperty
} from '../../../src/types/notion/raw.js';
import type { APIResponse } from '../../../src/types/notion/app.js';

/**
 * Helper to handle cached Notion requests with pagination
 */
export async function handleCachedNotionRequest<T>(
  req: Request, 
  res: Response, 
  endpointName: string, 
  databaseId: string, 
  transformFn: (page: NotionPage) => T,
  filter?: any
): Promise<void> {
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const bypassCache = req.headers['x-cache-bypass'] === 'true';
  
  // Include filter params in cache key
  const cacheParams = { limit, cursor, ...req.query };
  const cacheKey = cacheService.getCacheKey(endpointName, cacheParams);

  if (!bypassCache) {
    const cachedResponse = cacheService.get<APIResponse<T>>(cacheKey);
    if (cachedResponse) {
      res.setHeader('X-Cache-Hit', 'true');
      res.setHeader('X-Entity-Type', endpointName);
      res.json(cachedResponse);
      return;
    }
  }

  const result = await fetchAllPages(databaseId, limit, cursor, filter);
  const data = result.pages.map(transformFn);

  const response: APIResponse<T> = {
    data,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore
  };

  cacheService.set(cacheKey, response);
  res.setHeader('X-Cache-Hit', 'false');
  res.setHeader('X-Entity-Type', endpointName);
  res.json(response);
}

/**
 * Helper to fetch complete relation property data when has_more is true
 */
async function fetchCompleteRelationProperty(
  pageId: string,
  propertyId: string
): Promise<NotionRelationProperty> {
  console.log(`[PERF] Notion API call #${++apiCallCounter} - Fetching relation ${propertyId}`);
  const allRelations: Array<{ id: string }> = [];
  let cursor: string | undefined;
  
  do {
    const response = await notion.pages.properties.retrieve({
      page_id: pageId,
      property_id: propertyId,
      start_cursor: cursor,
      page_size: 100
    }) as any;
    
    if (response.type === 'relation' && response.results) {
      allRelations.push(...response.results.map((r: any) => ({ id: r.relation?.id || r.id })));
      cursor = response.next_cursor || undefined;
    } else {
      break;
    }
  } while (cursor);
  
  return {
    id: propertyId,
    type: 'relation',
    relation: allRelations,
    has_more: false
  };
}

/**
 * Helper to fetch pages from a database with pagination limit
 */
export async function fetchAllPages(
  databaseId: string, 
  maxItems: number = 100,
  startCursor?: string,
  filter?: any
): Promise<{ pages: NotionPage[], hasMore: boolean, nextCursor: string | null }> {
  // Reset counter for this request
  apiCallCounter = 0;
  console.log('[PERF] Starting new request - API call counter reset');
  
  const pages: NotionPage[] = [];
  let cursor: string | undefined = startCursor;
  let totalFetched = 0;
  
  // Fetch only up to maxItems to prevent timeouts
  while (totalFetched < maxItems) {
    const pageSize = Math.min(100, maxItems - totalFetched);
    const queryParams: any = {
      database_id: databaseId,
      start_cursor: cursor,
      page_size: pageSize
    };
    
    // Add filter if provided
    if (filter) {
      queryParams.filter = filter;
    }
    
    const response = await notion.databases.query(queryParams) as NotionListResponse<NotionPage>;
    
    // NEW CODE (PARALLEL) - Fix N+1 Query Problem
    // Collect all relation fetches needed
    const relationFetches = response.results.flatMap(page => 
      Object.entries(page.properties)
        .filter(([_, prop]) => prop.type === 'relation' && (prop as any).has_more)
        .map(([propName, prop]) => ({
          pageId: page.id,
          propId: prop.id,
          propName,
          page
        }))
    );
    
    // Log if we found any relations to fetch
    if (relationFetches.length > 0) {
      console.log(`[PERF] Found ${relationFetches.length} relations with has_more=true to fetch`);
      console.log(`[PERF] Using PARALLEL fetching (Phase 4 optimization)`);
    }
    
    // Fetch all relations in parallel
    const relationResults = await Promise.all(
      relationFetches.map(({ pageId, propId }) => 
        fetchCompleteRelationProperty(pageId, propId)
      )
    );
    
    // Apply results back to pages
    relationFetches.forEach((fetch, index) => {
      fetch.page.properties[fetch.propName] = relationResults[index];
    });
    
    // Add pages to results
    pages.push(...response.results);
    
    totalFetched += response.results.length;
    cursor = response.next_cursor || undefined;
    
    // Stop if no more pages or reached limit
    if (!cursor || totalFetched >= maxItems) {
      break;
    }
  }
  
  return { 
    pages, 
    hasMore: !!cursor, 
    nextCursor: cursor || null 
  };
}