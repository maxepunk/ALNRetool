/**
 * Generic router factory for Notion entity endpoints
 * Creates consistent REST endpoints with caching, error handling, and inverse relations
 */

import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { handleCachedNotionRequest } from './base.js';
import { notion } from '../../services/notion.js';
import { cacheService } from '../../services/cache.js';
import { log } from '../../utils/logger.js';
import type { NotionPage } from '../../../src/types/notion/raw.js';

/**
 * Configuration for inverse relation updates
 */
export interface InverseRelation {
  /** The field on the current entity that contains related IDs */
  sourceField: string;
  
  /** The target database ID to update */
  targetDatabaseId: string;
  
  /** The field on the target entity to update */
  targetField: string;
  
  /** Type of relation: 'many-to-many' | 'one-to-many' */
  relationType: 'many-to-many' | 'one-to-many';
  
  /** Whether to sync adds and removes bidirectionally */
  bidirectional: boolean;
}

export interface EntityRouterConfig<T> {
  /** Notion database ID for this entity type */
  databaseId: string;
  
  /** Entity name for caching and logging */
  entityName: string;
  
  /** Transform function from Notion page to entity type */
  transform: (page: NotionPage) => T;
  
  /** Optional function to convert entity to Notion properties for updates */
  toNotionProps?: (entity: Partial<T>) => any;
  
  /** Optional function to build Notion filters from query params */
  buildFilters?: (params: any) => any;
  
  /** Optional inverse relations to maintain */
  inverseRelations?: InverseRelation[];
}

/**
 * Updates inverse relations when an entity is modified
 */
async function updateInverseRelations<T>(
  entityId: string,
  oldData: any,
  newData: any,
  relations: InverseRelation[]
): Promise<void> {
  for (const relation of relations) {
    const oldIds = new Set(oldData?.[relation.sourceField] || []);
    const newIds = new Set(newData?.[relation.sourceField] || []);
    
    // Find added and removed IDs
    const addedIds = Array.from(newIds).filter(id => !oldIds.has(id));
    const removedIds = Array.from(oldIds).filter(id => !newIds.has(id));
    
    if (!relation.bidirectional) {
      continue;
    }
    
    // Update added relations
    for (const targetId of addedIds) {
      try {
        // Get current target entity
        const targetPage = await notion.pages.retrieve({ 
          page_id: targetId as string
        }) as NotionPage;
        
        const targetProp = targetPage.properties[relation.targetField];
        const currentRelatedIds = (targetProp && 'relation' in targetProp) ? targetProp.relation : [];
        const currentIds = currentRelatedIds.map((r: any) => r.id);
        
        // Add this entity if not already present
        if (!currentIds.includes(entityId)) {
          await notion.pages.update({
            page_id: targetId as string,
            properties: {
              [relation.targetField]: {
                relation: [...currentRelatedIds, { id: entityId }]
              }
            }
          });
          
          // Invalidate target cache
          cacheService.invalidatePattern(`*_${targetId}`);
        }
      } catch (error) {
        log.error('Failed to update inverse relation', {
          targetId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Update removed relations
    for (const targetId of removedIds) {
      try {
        // Get current target entity
        const targetPage = await notion.pages.retrieve({ 
          page_id: targetId as string
        }) as NotionPage;
        
        const targetProp = targetPage.properties[relation.targetField];
        const currentRelatedIds = (targetProp && 'relation' in targetProp) ? targetProp.relation : [];
        const filteredIds = currentRelatedIds.filter((r: any) => r.id !== entityId);
        
        // Remove this entity if present
        if (filteredIds.length !== currentRelatedIds.length) {
          await notion.pages.update({
            page_id: targetId as string,
            properties: {
              [relation.targetField]: {
                relation: filteredIds
              }
            }
          });
          
          // Invalidate target cache
          cacheService.invalidatePattern(`*_${targetId}`);
        }
      } catch (error) {
        log.error('Failed to update inverse relation', {
          targetId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
}

/**
 * Creates a router with standard CRUD operations for a Notion entity type
 */
export function createEntityRouter<T>(config: EntityRouterConfig<T>) {
  const router = Router();
  
  // GET / - List entities with pagination
  router.get('/', asyncHandler(async (req, res) => {
    // Build filters if function provided
    const filter = config.buildFilters ? config.buildFilters(req.query) : undefined;
    
    await handleCachedNotionRequest(
      req, 
      res, 
      config.entityName, 
      config.databaseId, 
      config.transform,
      filter
    );
  }));
  
  // GET /:id - Get single entity by ID
  router.get('/:id', asyncHandler(async (req, res) => {
    const cacheKey = cacheService.getCacheKey(`${config.entityName}_${req.params.id}`, {});
    const cached = cacheService.get<T>(cacheKey);
    
    if (cached) {
      res.setHeader('X-Cache-Hit', 'true');
      res.setHeader('X-Cache-Version', cacheService.getVersion());
      return res.json(cached);
    }
    
    const response = await notion.pages.retrieve({ 
      page_id: req.params.id 
    }) as NotionPage;
    
    const transformed = config.transform(response);
    cacheService.set(cacheKey, transformed);
    
    res.setHeader('X-Cache-Hit', 'false');
    res.setHeader('X-Cache-Version', cacheService.getVersion());
    res.json(transformed);
  }));
  
  // PUT /:id - Update entity (if mapper provided)
  if (config.toNotionProps) {
    router.put('/:id', asyncHandler(async (req, res) => {
      let oldData: any = null;
      
      // Get old data if we have inverse relations
      if (config.inverseRelations && config.inverseRelations.length > 0) {
        try {
          const oldPage = await notion.pages.retrieve({ 
            page_id: req.params.id 
          }) as NotionPage;
          oldData = config.transform(oldPage);
        } catch (error) {
          log.error('Failed to retrieve old data for inverse relations', {
            entityId: req.params.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Update the entity
      const properties = config.toNotionProps!(req.body);
      const response = await notion.pages.update({
        page_id: req.params.id,
        properties
      }) as NotionPage;
      
      const transformed = config.transform(response);
      
      // Update inverse relations if configured
      if (config.inverseRelations && oldData) {
        await updateInverseRelations(
          req.params.id,
          oldData,
          transformed,
          config.inverseRelations
        );
      }
      
      // Invalidate caches for this entity and related patterns
      await cacheService.invalidateEntity(config.entityName, req.params.id);
      
      // If we have inverse relations, invalidate those entity types too
      if (config.inverseRelations) {
        const relatedEntities: Array<{ type: string; ids: string[] }> = [];
        
        for (const relation of config.inverseRelations) {
          // Extract entity name from the target database ID pattern
          const targetEntityName = relation.targetDatabaseId.includes('element') ? 'elements' :
                                   relation.targetDatabaseId.includes('puzzle') ? 'puzzles' :
                                   relation.targetDatabaseId.includes('character') ? 'characters' : 
                                   'unknown';
          
          // Collect related IDs for batch invalidation
          const relatedIds = transformed[relation.sourceField as keyof typeof transformed] as string[] || [];
          if (relatedIds.length > 0) {
            relatedEntities.push({ type: targetEntityName, ids: relatedIds });
          }
        }
        
        // Batch invalidate related entities
        if (relatedEntities.length > 0) {
          await cacheService.invalidateRelated(config.entityName, req.params.id, relatedEntities);
        }
      }
      
      res.setHeader('X-Cache-Version', cacheService.getVersion());
      res.json(transformed);
    }));
  }
  
  return router;
}