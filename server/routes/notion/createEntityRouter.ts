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
import { AppError } from '../../middleware/errorHandler.js';
import type { NotionPage } from '../../../src/types/notion/raw.js';
import type { Character, Element, Puzzle, TimelineEvent } from '../../../src/types/notion/app.js';
import { captureGraphState, fetchGraphStateForIds } from '../../services/graphStateCapture.js';
import { deltaCalculator } from '../../services/deltaCalculator.js';
import type { GraphState, GraphDelta } from '../../types/delta.js';
import type { EntityType } from '../../utils/entityTypeDetection.js';

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
  
  /** Entity type (character, element, puzzle, timeline) */
  entityType?: string;
  
  /** Transform function from Notion page to entity type */
  transform: (page: NotionPage, existingEntity?: T) => T;
  
  /** Optional function to convert entity to Notion properties for updates */
  toNotionProps?: (entity: Partial<T>) => any;
  
  /** Optional function to build Notion filters from query params */
  buildFilters?: (params: any) => any;
  
  /** Optional inverse relations to maintain */
  inverseRelations?: InverseRelation[];
  
  /** Relationship field names to preserve during partial updates */
  relationshipFields?: string[];
  
  /** Optional validation function for updates */
  validateUpdate?: (oldEntity: T, newEntity: T, updatePayload: any) => string[];
}

/**
 * Updates inverse relations when an entity is modified
 * Uses Promise.allSettled for parallel execution to improve performance
 */
async function updateInverseRelations(
  entityId: string,
  oldData: any,
  newData: any,
  relations: InverseRelation[]
): Promise<void> {
  // Build array of all update operations
  const updatePromises: Promise<void>[] = [];
  
  for (const relation of relations) {
    const oldIds = new Set(oldData?.[relation.sourceField] || []);
    const newIds = new Set(newData?.[relation.sourceField] || []);
    
    // Find added and removed IDs
    const addedIds = Array.from(newIds).filter(id => !oldIds.has(id));
    const removedIds = Array.from(oldIds).filter(id => !newIds.has(id));
    
    if (removedIds.length > 0) {
      log.info(`[InverseRelations] Removing ${removedIds.length} relations from field ${relation.sourceField}`, {
        entityId,
        removedIds,
        targetField: relation.targetField
      });
    }
    
    if (!relation.bidirectional) {
      continue;
    }
    
    // Create promises for added relations
    for (const targetId of addedIds) {
      const updatePromise = (async () => {
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
            // Invalidate the specific entity and any cache keys containing its ID
            cacheService.invalidatePattern(`*_${targetId}`);
          }
        } catch (error) {
          log.error('Failed to update inverse relation (add)', {
            targetId,
            error: error instanceof Error ? error.message : String(error)
          });
          // Re-throw to be caught by Promise.allSettled
          throw error;
        }
      })();
      
      updatePromises.push(updatePromise);
    }
    
    // Create promises for removed relations
    for (const targetId of removedIds) {
      const updatePromise = (async () => {
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
            // Invalidate the specific entity and any cache keys containing its ID
            cacheService.invalidatePattern(`*_${targetId}`);
          }
        } catch (error) {
          log.error('Failed to update inverse relation (remove)', {
            targetId,
            error: error instanceof Error ? error.message : String(error)
          });
          // Re-throw to be caught by Promise.allSettled
          throw error;
        }
      })();
      
      updatePromises.push(updatePromise);
    }
  }
  
  // Execute all updates in parallel with Promise.all for atomicity
  // If any update fails, the entire operation fails
  if (updatePromises.length > 0) {
    try {
      await Promise.all(updatePromises);
      
      log.info(`[InverseRelations] Successfully updated all relations`, {
        entityId,
        count: updatePromises.length
      });
    } catch (error) {
      log.error(`[InverseRelations] Failed to update relations atomically`, {
        entityId,
        error: error instanceof Error ? error.message : String(error)
      });
      // Re-throw to ensure the entire mutation fails
      throw new Error(`Failed to update inverse relations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Invalidate graph cache after inverse relations are updated
  cacheService.invalidatePattern('graph_complete*');
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
  
  // POST / - Create new entity (if mapper provided)
  if (config.toNotionProps) {
    router.post('/', asyncHandler(async (req, res) => {
      // Extract parent relationship metadata from request
      const { _parentRelation, ...entityData } = req.body;
      
      // DEBUG: Log incoming request
      if (_parentRelation) {
        log.info('[DEBUG] Received _parentRelation:', _parentRelation);
      }
      
      // Handle parent relation if present - set relationship on child entity if needed
      if (_parentRelation) {
        const { parentType, parentId, fieldKey } = _parentRelation;
        
        // Special handling for relationships stored on the child entity
        // For puzzle->character creation, the relationship is stored on the character
        if (parentType === 'puzzle' && config.entityName === 'characters' && fieldKey === 'characterIds') {
          // The relationship is actually stored as characterPuzzleIds on the character
          entityData.characterPuzzleIds = [parentId];
        }
        // Add more child-side relationship mappings as needed
        // e.g., timeline->character, element->element, etc.
      }
      
      // Create the Notion page with potentially modified entity data
      const properties = config.toNotionProps!(entityData);
      const response = await notion.pages.create({
        parent: { database_id: config.databaseId },
        properties
      }) as NotionPage;
      
      // Transform to app format
      const transformed = config.transform(response);
      
      // If this was created from a parent relationship, update the parent atomically
      // Skip if we already handled the relationship on the child entity
      const handledOnChild = _parentRelation && 
        _parentRelation.parentType === 'puzzle' && 
        config.entityName === 'characters' && 
        _parentRelation.fieldKey === 'characterIds';
      
      if (_parentRelation && !handledOnChild) {
        // Validate _parentRelation structure before use
        if (!_parentRelation.parentType || !_parentRelation.parentId || !_parentRelation.fieldKey) {
          throw new Error('Invalid _parentRelation structure: missing required fields');
        }
        const { parentType, parentId, fieldKey } = _parentRelation;
        
        log.info('[DEBUG] Updating parent relation:', {
          parentType,
          parentId,
          fieldKey,
          childId: response.id,
          handledOnChild
        });
        
        try {
          // Import the appropriate mapper function and field mapping
          const mappers = await import('../../services/notionPropertyMappers.js');
          const { FIELD_TO_NOTION_PROPERTY } = mappers;
          
          // parentType is already singular from frontend ('element', 'character', 'puzzle', 'timeline')
          const mapperName = `toNotion${parentType.charAt(0).toUpperCase()}${parentType.slice(1)}Properties`;
          const parentMapper = (mappers as any)[mapperName];
          
          if (!parentMapper) {
            throw new Error(`No mapper found for parent type: ${parentType}`);
          }
          
          // Get the parent's current data
          const parentPage = await notion.pages.retrieve({ page_id: parentId }) as NotionPage;
          
          // Get the correct Notion property name from explicit mapping
          const typeMapping = FIELD_TO_NOTION_PROPERTY[parentType as keyof typeof FIELD_TO_NOTION_PROPERTY];
          if (!typeMapping) {
            throw new Error(`No mapping found for parent type: ${parentType}`);
          }
          const notionPropertyName = (typeMapping as any)[fieldKey];
          if (!notionPropertyName) {
            throw new Error(`No property mapping found for ${parentType}.${fieldKey}`);
          }
          
          // Extract current relation IDs using the correct property name
          const currentRelation = parentPage.properties[notionPropertyName];
          const currentIds = currentRelation?.type === 'relation' 
            ? currentRelation.relation.map((r: any) => r.id)
            : [];
          
          // Add the new entity ID to the relation
          const updatedIds = [...currentIds, response.id];
          
          // Update the parent with the new relationship
          // Bug fix #1: fieldKey already includes 'Ids', don't append it again
          // Bug fix #2: Single relations (ending with 'Id') expect a string, not array
          const isSingleRelation = fieldKey.endsWith('Id') && !fieldKey.endsWith('Ids');
          const updateProps = isSingleRelation 
            ? { [fieldKey]: response.id }  // Single relation: pass just the ID
            : { [fieldKey]: updatedIds };  // Multi relation: pass array
          const parentProperties = parentMapper(updateProps);
          
          await notion.pages.update({
            page_id: parentId,
            properties: parentProperties
          });
          
          // Invalidate parent entity cache  
          cacheService.invalidatePattern(`${parentType}:*`);
          cacheService.invalidatePattern(`${parentType}_${parentId}`);
          
          // Invalidate graph cache immediately since parent relationship changed
          cacheService.invalidatePattern('graph_complete*');
        } catch (error) {
          // If parent update fails, delete the created entity to maintain atomicity
          log.error('Failed to update parent relation, rolling back entity creation', {
            entityId: response.id,
            parentType: _parentRelation.parentType,
            parentId: _parentRelation.parentId,
            error: error instanceof Error ? error.message : String(error)
          });
          
          // Archive the created entity (Notion doesn't have delete, only archive)
          await notion.pages.update({ 
            page_id: response.id,
            archived: true
          });
          
          // Re-throw the error
          throw new Error(`Failed to create entity with parent relationship: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Update inverse relations if configured
      if (config.inverseRelations && config.inverseRelations.length > 0) {
        await updateInverseRelations(
          response.id,
          null, // No old data for creation
          transformed,
          config.inverseRelations
        );
      }
      
      // Invalidate list cache to ensure new entity appears
      // Must invalidate both collection keys (colon format) and single entity keys (underscore format)
      cacheService.invalidatePattern(`${config.entityName}:*`); // Collection caches: "elements:20:null"
      cacheService.invalidatePattern(`${config.entityName}_*`); // Single entity caches: "elements_abc123:20:null"
      
      // Invalidate graph cache to ensure graph reflects new entity
      cacheService.invalidatePattern('graph_complete*'); // Graph caches: "graph_complete_all", "graph_complete_{viewConfig}"
      
      // STEP 6: Generate delta for CREATE if requested
      let delta: GraphDelta | undefined;
      const includeDelta = req.query.include_delta === 'true';
      
      if (includeDelta) {
        try {
          let afterState: GraphState | null = null;

          // If parent relation exists, capture both parent and child for complete delta
          if (_parentRelation && _parentRelation.parentId && !handledOnChild) {
            const entitiesToCapture = [response.id, _parentRelation.parentId];
            
            try {
              // Use fetchGraphStateForIds to get both entities
              afterState = await fetchGraphStateForIds(entitiesToCapture);
              
              if (!afterState) {
                // Fallback to child-only if parent capture fails
                log.warn('[Delta] Parent capture failed, using child-only delta', {
                  parentId: _parentRelation.parentId
                });
                afterState = await captureGraphState(response.id, config.entityName as EntityType);
              }
            } catch (parentError) {
              log.warn('[Delta] Parent capture failed with error, falling back to child-only', {
                parentId: _parentRelation.parentId,
                error: parentError instanceof Error ? parentError.message : String(parentError)
              });
              // Fallback to child-only delta
              afterState = await captureGraphState(response.id, config.entityName as EntityType);
            }
          } else {
            // No parent relation, capture child only
            afterState = await captureGraphState(response.id, config.entityName as EntityType);
          }
          
          if (afterState && afterState.nodes && afterState.edges) {
            // Classify nodes: child is created, parent is updated
            const createdNodes: typeof afterState.nodes = [];
            const updatedNodes: typeof afterState.nodes = [];
            
            for (const node of afterState.nodes) {
              if (node.id === response.id) {
                // Child entity is newly created
                createdNodes.push(node);
              } else if (_parentRelation && node.id === _parentRelation.parentId) {
                // Parent entity was updated with new relationship
                updatedNodes.push(node);
              } else {
                // Other related nodes that exist in the graph
                updatedNodes.push(node);
              }
            }
            
            delta = {
              changes: {
                nodes: {
                  created: createdNodes,
                  updated: updatedNodes,
                  deleted: []
                },
                edges: {
                  created: afterState.edges,
                  updated: [],
                  deleted: []
                }
              }
            };
            
            log.info('[Delta] Generated delta for CREATE with parent update', {
              entityType: config.entityName,
              entityId: response.id,
              parentId: _parentRelation?.parentId,
              nodesCreated: createdNodes.length,
              nodesUpdated: updatedNodes.length,
              edgesCreated: afterState.edges.length
            });
          } else {
            log.warn('[Delta] Graph state capture returned empty for CREATE', {
              entityType: config.entityName,
              entityId: response.id
            });
            // Don't include delta if capture failed
          }
        } catch (error) {
          log.error('[Delta] Failed to generate delta for CREATE', {
            entityType: config.entityName,
            entityId: response.id,
            error: error instanceof Error ? error.message : String(error)
          });
          // CHANGED: Make delta failures visible instead of silent
          // This allows the client to handle the error appropriately
          throw new Error(`Delta generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Return consistent response structure
      // WHY: Standardized API responses across all mutations
      res.status(201).json({
        success: true,
        data: transformed,
        delta  // Will be undefined if not requested or if generation failed
      });
    }));
  }
  
  // DELETE /:id - Archive entity in Notion
  router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    let graphStateBefore: GraphState | null = null;
    
    // H2: Version control check using If-Match header (same as PUT endpoint)
    const ifMatchHeader = req.headers['if-match'];
    if (ifMatchHeader) {
      // Fetch current page to check version
      const currentPage = await notion.pages.retrieve({ page_id: id }) as NotionPage;
      const currentLastEdited = currentPage.last_edited_time;
      
      // Strip quotes from If-Match header for comparison (RFC 7232 ETags are quoted)
      const providedVersion = ifMatchHeader.replace(/^"|"$/g, '');
      
      // Compare versions (If-Match should contain the lastEdited timestamp)
      if (providedVersion !== currentLastEdited) {
        // Version mismatch - return 409 Conflict
        throw new AppError(
          409,
          'VERSION_CONFLICT',
          'Version conflict: Entity has been modified by another user'
        );
      }
    }
    
    // Capture graph state before deletion for delta calculation
    // WHY: Need the before state to calculate what nodes/edges will be removed
    try {
      graphStateBefore = await captureGraphState(id, config.entityName as EntityType);
      log.info(`[Delta] Captured graph state before ${config.entityName} deletion`, {
        entityId: id,
        nodeCount: graphStateBefore?.nodes.length ?? 0,
        edgeCount: graphStateBefore?.edges.length ?? 0
      });
    } catch (error) {
      // Non-fatal: Continue without delta calculation
      log.warn(`[Delta] Failed to capture graph state, will invalidate full cache`, {
        entityId: id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // If we have inverse relations, get the entity data before deletion
    let entityData: any = null;
    if (config.inverseRelations && config.inverseRelations.length > 0) {
      try {
        const page = await notion.pages.retrieve({ page_id: id }) as NotionPage;
        entityData = config.transform(page);
      } catch (error) {
        log.error('Failed to retrieve entity for inverse relation cleanup', {
          entityId: id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Archive in Notion (no true delete, just soft delete)
    await notion.pages.update({
      page_id: id,
      archived: true
    });
    
    // Clean up inverse relations if entity data was retrieved
    if (entityData && config.inverseRelations) {
      // For deletion, we need to remove this entity from all related entities
      await updateInverseRelations(
        id,
        entityData,  // Old data has the relationships
        {},          // New data is empty (entity is deleted)
        config.inverseRelations
      );
    }
    
    // Calculate delta for deletion if we have the before state
    let delta: GraphDelta | null = null;
    if (graphStateBefore && entityData) {
      try {
        // Bug 4 Fix: For deletion with inverse relations, we need to capture the actual state
        // after inverse relations have been updated, not just simulate it
        let graphStateAfter: GraphState;
        
        if (config.inverseRelations && config.inverseRelations.length > 0) {
          // Complex deletion - inverse relations modified other entities
          // FIX: Capture the state of related entities, not the deleted one
          const relatedEntityIds = graphStateBefore.nodes
            .map((n: any) => n.id)
            .filter((nodeId: string) => nodeId !== id);

          if (relatedEntityIds.length > 0) {
            // Import the helper function
            const { fetchGraphStateForIds } = await import('../../services/graphStateCapture.js');
            graphStateAfter = await fetchGraphStateForIds(relatedEntityIds);
          } else {
            // No related entities, so the after state is empty
            graphStateAfter = { nodes: [], edges: [], capturedAt: Date.now() };
          }
        } else {
          // Simple deletion - no inverse relations, safe to simulate
          graphStateAfter = {
            nodes: graphStateBefore.nodes.filter((n: any) => n.id !== id),
            edges: graphStateBefore.edges.filter((e: any) => e.source !== id && e.target !== id),
            capturedAt: Date.now()
          };
        }
        
        // Calculate the delta showing what was deleted
        delta = deltaCalculator.calculateGraphDelta(
          graphStateBefore.nodes,
          graphStateAfter.nodes,
          graphStateBefore.edges,
          graphStateAfter.edges
        );
        
        log.info(`[Delta] Calculated delta for ${config.entityName} deletion`, {
          entityId: id,
          nodesDeleted: delta?.changes.nodes.deleted.length ?? 0,
          edgesDeleted: delta?.changes.edges.deleted.length ?? 0
        });
      } catch (error) {
        log.error(`[Delta] Failed to calculate deletion delta`, {
          entityId: id,
          error: error instanceof Error ? error.message : String(error)
        });
        // CHANGED: Make delta failures visible instead of silent
        throw new Error(`Delta generation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Smart cache invalidation based on delta
    if (delta) {
      // Only invalidate the specific entity cache
      cacheService.invalidatePattern(`${config.entityName}_${id}`);
      
      // BUG 5 FIX: Also invalidate cache for all entities affected by the deletion
      // WHY: Related entities (via inverse relations) are modified but weren't being invalidated
      const updatedNodes = delta.changes?.nodes?.updated || [];
      for (const node of updatedNodes) {
        // Map entity type from delta to cache key pattern
        const entityType = node.data?.metadata?.entityType;
        if (!entityType) {
          log.warn('[Cache] Skipping invalidation for node with missing entityType in delta (DELETE)', { nodeId: node.id });
          continue;
        }
        
        // FIX: Use entityType directly - cache keys use singular form (e.g., 'character_abc123')
        const entityName = entityType;
        
        log.info('[Cache] Invalidating related entity from delta (DELETE)', { 
          entityId: node.id, 
          entityType: entityType 
        });
        
        cacheService.invalidatePattern(`${entityName}_${node.id}`);
      }
    } else {
      // No delta - fall back to full cache invalidation
      cacheService.invalidatePattern(`${config.entityName}_${id}`);
      cacheService.invalidatePattern(`${config.entityName}:*`);
      cacheService.invalidatePattern('graph_complete*');
    }
    
    // Return consistent response structure
    // WHY: Standardized API responses make client code simpler and more predictable
    const includeDelta = req.query.include_delta === 'true';
    
    res.status(200).json({ 
      success: true,
      data: entityData || { id, archived: true },  // Return what was deleted
      delta: (includeDelta && delta) ? delta : undefined
    });
  }));
  
  // PUT /:id - Update entity (if mapper provided)
  if (config.toNotionProps) {
    router.put('/:id', asyncHandler(async (req, res) => {
      let oldData: any = null;
      let graphStateBefore: GraphState | null = null;
      
      // Capture graph state before mutation for delta calculation
      // WHY: Need to compare before/after states to calculate minimal changes
      try {
        graphStateBefore = await captureGraphState(req.params.id, config.entityName as EntityType);
        log.info(`[Delta] Captured graph state before ${config.entityName} update`, {
          entityId: req.params.id,
          nodeCount: graphStateBefore?.nodes.length ?? 0,
          edgeCount: graphStateBefore?.edges.length ?? 0
        });
      } catch (error) {
        // Non-fatal: Continue without delta calculation
        log.warn(`[Delta] Failed to capture graph state, will invalidate full cache`, {
          entityId: req.params.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      // ALWAYS fetch old data for updates to handle partial responses
      // WHY: Notion only returns properties that were updated, causing data loss
      // without merging with existing data
      try {
        const oldPage = await notion.pages.retrieve({ 
          page_id: req.params.id 
        }) as NotionPage;
        oldData = config.transform(oldPage);
      } catch (error) {
        // CRITICAL: Cannot safely update without old data
        // Partial responses would cause data loss
        log.error('Failed to retrieve old data for safe update', {
          entityId: req.params.id,
          error: error instanceof Error ? error.message : String(error)
        });
        throw new AppError(
          500,
          'FETCH_OLD_DATA_FAILED',
          'Unable to fetch current data for safe update. Please try again.'
        );
      }
      
      // H2: Version control check using If-Match header
      const ifMatchHeader = req.headers['if-match'];
      if (ifMatchHeader) {
        // Fetch current page to check version
        const currentPage = await notion.pages.retrieve({ page_id: req.params.id }) as NotionPage;
        const currentLastEdited = currentPage.last_edited_time;
        
        // Strip quotes from If-Match header for comparison (RFC 7232 ETags are quoted)
        const providedVersion = ifMatchHeader.replace(/^"|"$/g, '');
        
        // Compare versions (If-Match should contain the lastEdited timestamp)
        if (providedVersion !== currentLastEdited) {
          // Version mismatch - return 409 Conflict
          throw new AppError(
            409,
            'VERSION_CONFLICT',
            'Version conflict: Entity has been modified by another user'
          );
        }
      }
      
      // Update the entity
      const properties = config.toNotionProps!(req.body);
      const response = await notion.pages.update({
        page_id: req.params.id,
        properties
      }) as NotionPage;
      
      // Transform the partial response (pure transform, no merge)
      const partialTransformed = config.transform(response);
      
      // Merge with old data to preserve missing fields
      // Import merge utility
      const { smartMergeEntityUpdate, validateMerge } = await import('../../utils/entityMerger.js');
      const transformed = oldData 
        ? smartMergeEntityUpdate(oldData, partialTransformed as Partial<T>, req.body)
        : partialTransformed;
      
      // Validate no unexpected data loss occurred
      if (oldData) {
        const issues = validateMerge(oldData, transformed, req.body);
        if (issues.length > 0) {
          log.warn('[Delta] Potential data loss detected during update', {
            entityId: req.params.id,
            entityType: config.entityType,
            issues
          });
        }
      }
      
      // Update inverse relations if configured
      if (config.inverseRelations && oldData) {
        await updateInverseRelations(
          req.params.id,
          oldData,
          transformed,
          config.inverseRelations
        );
      }
      
      // Calculate delta if we have the before state
      let delta: GraphDelta | null = null;
      if (graphStateBefore) {
        try {
          // Import helpers
          const { generateEdgesForEntities, fetchGraphStateForIds } = await import('../../services/graphStateCapture.js');
          
          // Optimize: If no inverse relations, construct after state in-memory
          // WHY: Avoid second API call when only the target entity changed
          let graphStateAfter: GraphState | null = null;
          
          if (!config.inverseRelations || config.inverseRelations.length === 0) {
            // Simple update - regenerate edges in case relationships changed
            // Collect all entities from the nodes for edge generation
            const allEntities = graphStateBefore.nodes
              .map((n: any) => n.id === req.params.id ? transformed : n.data.entity)
              .filter((e: any) => e !== null);
            
            // Regenerate edges based on updated entity relationships
            const updatedEdges = generateEdgesForEntities(allEntities);
            
            graphStateAfter = {
              nodes: graphStateBefore.nodes.map((n: any) => 
                n.id === req.params.id ? { ...n, data: { ...n.data, entity: transformed } } : n
              ),
              edges: updatedEdges,  // Use regenerated edges
              capturedAt: Date.now()
            };
          } else {
            // Complex update - inverse relations modified other entities
            // CRITICAL FIX: Only fetch entities that were ACTUALLY affected by inverse relations
            // Previous bug: Fetching ALL entities from before state caused false "updated" deltas
            
            // Build set of entity IDs that need to be fetched:
            // 1. The primary entity being updated
            const affectedEntityIds = new Set<string>([req.params.id]);
            
            // 2. Add entities that were affected by inverse relations
            // These are entities whose relationships were modified
            if (oldData && transformed && config.inverseRelations) {
              for (const relation of config.inverseRelations) {
                // Get old and new related IDs for this relation
                const oldRelatedIds = oldData[relation.sourceField] || [];
                const newRelatedIds = transformed[relation.sourceField] || [];
                
                // Entities that were added or removed from the relationship
                const added = newRelatedIds.filter((id: string) => !oldRelatedIds.includes(id));
                const removed = oldRelatedIds.filter((id: string) => !newRelatedIds.includes(id));
                
                // Add these to the set of affected entities
                [...added, ...removed].forEach(id => affectedEntityIds.add(id));
              }
            }
            
            log.info('[Delta] Fetching after state for affected entities only', {
              primaryEntity: req.params.id,
              affectedCount: affectedEntityIds.size,
              affectedIds: Array.from(affectedEntityIds)
            });
            
            // Convert set to array for the fetch function
            const entityIdsToFetch = Array.from(affectedEntityIds);
            graphStateAfter = await fetchGraphStateForIds(entityIdsToFetch);
          }
          
          // Only calculate delta if we have both states
          if (graphStateAfter) {
            delta = deltaCalculator.calculateGraphDelta(
              graphStateBefore.nodes,
              graphStateAfter.nodes,
              graphStateBefore.edges,
              graphStateAfter.edges
            );
            
            log.info(`[Delta] Calculated delta for ${config.entityName} update`, {
              entityId: req.params.id,
              nodesUpdated: delta?.changes.nodes.updated.length ?? 0,
              nodesCreated: delta?.changes.nodes.created.length ?? 0,
              nodesDeleted: delta?.changes.nodes.deleted.length ?? 0,
              edgesCreated: delta?.changes.edges.created.length ?? 0,
              edgesUpdated: delta?.changes.edges.updated.length ?? 0,
              edgesDeleted: delta?.changes.edges.deleted.length ?? 0
            });
          }
        } catch (error) {
          log.error(`[Delta] Failed to calculate delta`, {
            entityId: req.params.id,
            error: error instanceof Error ? error.message : String(error)
          });
          // CHANGED: Make delta failures visible instead of silent
          throw new Error(`Delta generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // If we calculated a delta successfully, skip heavy cache invalidation
      // WHY: Delta will be applied directly, no need to refetch
      if (delta) {
        // Only invalidate the specific entity cache
        cacheService.invalidatePattern(`${config.entityName}_${req.params.id}`);
        
        // BUG 5 FIX: Also invalidate cache for all entities affected by the change
        // WHY: Related entities (via inverse relations) are modified but weren't being invalidated
        const updatedNodes = delta.changes?.nodes?.updated || [];
        for (const node of updatedNodes) {
          // Skip the primary entity (already invalidated above)
          if (node.id === req.params.id) continue;
          
          // Map entity type from delta to cache key pattern
          const entityType = node.data?.metadata?.entityType;
          if (!entityType) {
            log.warn('[Cache] Skipping invalidation for node with missing entityType in delta', { nodeId: node.id });
            continue;
          }
          
          // FIX: Use entityType directly - cache keys use singular form (e.g., 'character_abc123')
          const entityName = entityType;
          
          log.info('[Cache] Invalidating related entity from delta', { 
            entityId: node.id, 
            entityType: entityType 
          });
          
          cacheService.invalidatePattern(`${entityName}_${node.id}`);
        }
      } else {
        // No delta - fall back to full cache invalidation
        cacheService.invalidatePattern(`${config.entityName}_${req.params.id}`);
        cacheService.invalidatePattern(`${config.entityName}:*`);
        cacheService.invalidatePattern('graph_complete*');
        
        // If we have inverse relations, invalidate those entity types too
        if (config.inverseRelations) {
          // Import entity type detection utility
          const { getEntityTypeFromDatabaseId } = await import('../../utils/entityTypeDetection.js');
          
          for (const relation of config.inverseRelations) {
            // Use proper database ID mapping instead of string matching
            const entityType = getEntityTypeFromDatabaseId(relation.targetDatabaseId);
            if (entityType) {
              // Map entity type to collection name (add 's' for plural)
              const targetEntityName = entityType === 'timeline' ? 'timeline' : `${entityType}s`;
              
              // Invalidate the target entity type caches
              cacheService.invalidatePattern(`${targetEntityName}:*`);
            }
          }
        }
      }
      
      // Return consistent response structure  
      // WHY: Standardized API responses make client code simpler and more predictable
      const includeDelta = req.query.include_delta === 'true';
      
      // H2: Add ETag header with the new lastEdited timestamp
      // The response from Notion contains the updated last_edited_time
      // RFC 7232 requires ETags to be quoted strings
      if (response.last_edited_time) {
        res.setHeader('ETag', `"${response.last_edited_time}"`);
      }
      
      res.json({
        success: true,
        data: transformed,
        delta: (includeDelta && delta) ? delta : undefined
      });
    }));
  }
  
  return router;
}