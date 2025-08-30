import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cacheService } from '../services/cache.js';
import { AppError } from '../middleware/errorHandler.js';
import config from '../config/index.js';

const router = Router();

/**
 * GET /api/cache/stats
 * Returns cache statistics including hits, misses, and memory usage
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = cacheService.getStats();
  
  res.json({
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits + stats.misses > 0 
      ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
      : '0%',
    totalKeys: stats.keys,
    keySizeBytes: stats.ksize,
    valueSizeBytes: stats.vsize,
    totalSizeBytes: stats.ksize + stats.vsize,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/cache/clear
 * Clears the entire cache (requires admin header)
 */
router.post('/clear', asyncHandler(async (req: Request, res: Response) => {
  // Check admin authentication if ADMIN_KEY is set
  const adminKey = req.headers['x-admin-key'];
  // If ADMIN_KEY is set (even in non-prod), it must match.
  // In production, ADMIN_KEY must be set and must match.
  if (config.nodeEnv === 'production' || config.adminKey) {
    if (!config.adminKey || adminKey !== config.adminKey) {
      throw new AppError(403, 'FORBIDDEN', 'Admin access required');
    }
  }
  
  const statsBeforeClear = cacheService.getStats();
  cacheService.clear();
  
  res.json({
    message: 'Cache cleared successfully',
    clearedKeys: statsBeforeClear.keys,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/cache/clear/:endpoint
 * Clears cache for a specific endpoint pattern
 */
router.post('/clear/:endpoint', asyncHandler(async (req: Request, res: Response) => {
  const { endpoint } = req.params;
  
  // Validate endpoint
  const validEndpoints = ['characters', 'elements', 'puzzles', 'timeline'];
  if (!validEndpoints.includes(endpoint)) {
    throw new AppError(400, 'INVALID_ENDPOINT', `Invalid endpoint: ${endpoint}`);
  }
  
  // Clear with pattern matching
  const pattern = `${endpoint}:*`;
  const clearedCount = cacheService.clear(pattern);
  
  res.json({
    message: `Cache cleared for ${endpoint}`,
    pattern,
    clearedKeys: clearedCount,
    timestamp: new Date().toISOString()
  });
}));


export default router;