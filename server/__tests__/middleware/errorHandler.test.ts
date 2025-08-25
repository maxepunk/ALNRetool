import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../../middleware/errorHandler.js';
import { log } from '../../utils/logger.js';

// Mock config
vi.mock('../../config/index.js', () => ({
  default: {
    nodeEnv: 'test',
    logLevel: 'error'
  },
  nodeEnv: 'test',
  logLevel: 'error'
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  log: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}));

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AppError class', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError(404, 'NOT_FOUND', 'Resource not found');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('AppError');
    });

    it('should inherit from Error correctly', () => {
      const error = new AppError(400, 'BAD_REQUEST', 'Invalid input');
      
      expect(error.stack).toBeDefined();
      expect(error.toString()).toContain('AppError');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError instances correctly', () => {
      const appError = new AppError(403, 'FORBIDDEN', 'Access denied');
      
      errorHandler(appError, req as Request, res as Response, next);
      
      expect(log.error).toHaveBeenCalledWith('Request error', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Access denied'
      });
    });

    it('should handle Notion API errors', () => {
      const notionError = {
        status: 429,
        code: 'rate_limited',
        message: 'Too many requests to Notion API'
      };
      
      errorHandler(notionError as any, req as Request, res as Response, next);
      
      expect(log.error).toHaveBeenCalledWith('Request error', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 429,
        code: 'rate_limited',
        message: 'Too many requests to Notion API'
      });
    });

    it('should handle Notion API errors with missing fields', () => {
      const notionError = {
        status: 500,
        code: undefined,
        message: undefined
      };
      
      errorHandler(notionError as any, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 500,
        code: 'NOTION_ERROR',
        message: 'Notion API error occurred'
      });
    });

    it('should handle generic Error instances in development', () => {
      const error = new Error('Something went wrong');
      
      errorHandler(error, req as Request, res as Response, next);
      
      expect(log.error).toHaveBeenCalledWith('Request error', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong'
      });
    });

    it('should hide error details in production', async () => {
      // Reset modules to clear cache
      vi.resetModules();
      
      // Mock production environment
      vi.doMock('../../config/index.js', () => {
        const config = {
          nodeEnv: 'production',
          logLevel: 'error',
          port: 3001,
          notionApiKey: 'test-key',
          notionVersion: '2022-06-28',
          notionDatabaseIds: {
            characters: 'test-chars',
            elements: 'test-elements', 
            puzzles: 'test-puzzles',
            timeline: 'test-timeline'
          },
          apiRateLimit: { maxRequests: 100, windowMs: 60000 },
          cacheConfig: { ttl: 300, checkPeriod: 600, maxKeys: 1000 },
          corsOrigins: ['https://example.com'],
          sessionSecret: 'test-secret',
          features: { enableWebWorkers: true, enableCaching: true, enableRateLimit: false }
        };
        return {
          default: config,
          nodeEnv: config.nodeEnv,
          logLevel: config.logLevel,
          port: config.port,
          notionApiKey: config.notionApiKey,
          notionVersion: config.notionVersion,
          notionDatabaseIds: config.notionDatabaseIds,
          apiRateLimit: config.apiRateLimit,
          cacheConfig: config.cacheConfig,
          corsOrigins: config.corsOrigins,
          sessionSecret: config.sessionSecret,
          features: config.features
        };
      });
      
      // Re-import to get production version
      const { errorHandler: prodErrorHandler } = await import('../../middleware/errorHandler.js');
      
      const error = new Error('Sensitive database connection error');
      
      prodErrorHandler(error, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      });
    });

    it('should handle errors without message property', () => {
      const error = { toString: () => 'Strange error object' };
      
      errorHandler(error as any, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle null errors gracefully', () => {
      errorHandler(null as any, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle undefined errors gracefully', () => {
      errorHandler(undefined as any, req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });
});