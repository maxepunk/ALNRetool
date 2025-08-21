/**
 * Elements API routes
 */

import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { handleCachedNotionRequest } from './base.js';
import { buildElementFilters } from '../../services/filterBuilder.js';
import { transformElement } from '../../../src/types/notion/transforms.js';
import { inverseRelationHandler } from '../../services/inverseRelationHandler.js';

const ELEMENTS_DATABASE_ID = process.env.NOTION_ELEMENTS_DB || 
  '18c2f33d-583f-8020-91bc-d84c7dd94306';

const router = Router();

// GET / - List elements with pagination
router.get('/', asyncHandler(async (req, res) => {
  const filter = buildElementFilters(req.query);
  
  await handleCachedNotionRequest(
    req, 
    res, 
    'elements', 
    ELEMENTS_DATABASE_ID, 
    transformElement,
    filter
  );
}));

// GET /:id - Get single element by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { notion } = await import('../../services/notion.js');
  const { cacheService } = await import('../../services/cache.js');
  
  const cacheKey = cacheService.getCacheKey(`elements_${req.params.id}`, {});
  const cached = cacheService.get(cacheKey);
  
  if (cached) {
    res.setHeader('X-Cache-Hit', 'true');
    return res.json(cached);
  }
  
  const response = await notion.pages.retrieve({ 
    page_id: req.params.id 
  });
  
  const transformed = transformElement(response as any);
  cacheService.set(cacheKey, transformed);
  
  res.setHeader('X-Cache-Hit', 'false');
  res.json(transformed);
}));

// PUT /:id - Update element with inverse relation handling
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    // Use inverse relation handler for Element updates
    const result = await inverseRelationHandler.processElementUpdate(
      req.params.id,
      req.body
    );
    
    // Check for errors
    if (result.errors && result.errors.length > 0) {
      // Partial failure - some operations succeeded
      return res.status(207).json({
        message: 'Partial update completed',
        element: result.element,
        puzzlesUpdated: result.puzzlesUpdated,
        errors: result.errors
      });
    }
    
    // Full success - ensure we have an element to return
    if (!result.element) {
      // If no element was returned, fetch it
      const { notion } = await import('../../services/notion.js');
      const response = await notion.pages.retrieve({ 
        page_id: req.params.id 
      });
      const transformed = transformElement(response as any);
      res.json(transformed);
    } else {
      res.json(result.element);
    }
  } catch (error) {
    console.error('Element update failed:', error);
    res.status(500).json({
      error: 'Failed to update element',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;