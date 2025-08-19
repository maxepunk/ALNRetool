/**
 * Generic router factory for Notion entity endpoints
 * Creates consistent REST endpoints with caching and error handling
 */

import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { handleCachedNotionRequest } from './base.js';
import { notion } from '../../services/notion.js';
import { cacheService } from '../../services/cache.js';
import type { NotionPage } from '../../../src/types/notion/raw.js';

export interface EntityRouterConfig<T> {
  /** Notion database ID for this entity type */
  databaseId: string;
  
  /** Entity name for caching and logging */
  entityName: string;
  
  /** Transform function from Notion page to entity type */
  transform: (page: NotionPage) => T;
  
  /** Optional function to convert entity to Notion properties for updates */
  toNotionProps?: (entity: Partial<T>) => any;
}

/**
 * Creates a router with standard CRUD operations for a Notion entity type
 */
export function createEntityRouter<T>(config: EntityRouterConfig<T>) {
  const router = Router();
  
  // GET / - List entities with pagination
  router.get('/', asyncHandler(async (req, res) => {
    await handleCachedNotionRequest(
      req, 
      res, 
      config.entityName, 
      config.databaseId, 
      config.transform
    );
  }));
  
  // GET /:id - Get single entity by ID
  router.get('/:id', asyncHandler(async (req, res) => {
    const cacheKey = cacheService.getCacheKey(`${config.entityName}_${req.params.id}`, {});
    const cached = cacheService.get<T>(cacheKey);
    
    if (cached) {
      res.setHeader('X-Cache-Hit', 'true');
      return res.json(cached);
    }
    
    const response = await notion.pages.retrieve({ 
      page_id: req.params.id 
    }) as NotionPage;
    
    const transformed = config.transform(response);
    cacheService.set(cacheKey, transformed);
    
    res.setHeader('X-Cache-Hit', 'false');
    res.json(transformed);
  }));
  
  // PUT /:id - Update entity (if mapper provided)
  if (config.toNotionProps) {
    router.put('/:id', asyncHandler(async (req, res) => {
      const properties = config.toNotionProps!(req.body);
      
      const response = await notion.pages.update({
        page_id: req.params.id,
        properties
      }) as NotionPage;
      
      const transformed = config.transform(response);
      
      // Invalidate caches for this entity
      cacheService.invalidatePattern(config.entityName);
      cacheService.invalidatePattern(`${config.entityName}_${req.params.id}`);
      
      res.json(transformed);
    }));
  }
  
  return router;
}