import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock the config module before importing auth
vi.mock('../../config/index.js', () => ({
  default: {
    nodeEnv: 'test',
    notionApiKey: 'test-api-key-12345',
    logLevel: 'error'
  },
  nodeEnv: 'test',
  logLevel: 'error'
}));

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let apiKeyAuth: any;

  beforeEach(() => {
    req = {
      header: vi.fn(),
      get: vi.fn()
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
    
    // Reset config mock
    vi.resetModules();
  });

  describe('in development mode', () => {
    beforeEach(async () => {
      vi.doMock('../../config/index.js', () => ({
        default: {
          nodeEnv: 'development',
          notionApiKey: 'test-api-key-12345',
          logLevel: 'error'
        },
        nodeEnv: 'development',
        logLevel: 'error'
      }));
      // Re-import to get mocked version
      const module = await import('../../middleware/auth.js');
      apiKeyAuth = module.apiKeyAuth;
    });

    it('should allow requests from localhost origin without API key', () => {
      req.get = vi.fn().mockImplementation((header: string) => {
        if (header === 'origin') return 'http://localhost:5173';
        return undefined;
      });
      
      apiKeyAuth(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow requests from localhost referer without API key', () => {
      req.get = vi.fn().mockImplementation((header: string) => {
        if (header === 'referer') return 'http://localhost:3000/test';
        return undefined;
      });
      
      apiKeyAuth(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should require API key for non-localhost requests', () => {
      req.get = vi.fn().mockImplementation((header: string) => {
        if (header === 'origin') return 'https://external.com';
        return undefined;
      });
      req.header = vi.fn().mockReturnValue(undefined);
      
      apiKeyAuth(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized - Invalid API key'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('in production mode', () => {
    beforeEach(async () => {
      vi.doMock('../../config/index.js', () => ({
        default: {
          nodeEnv: 'production',
          notionApiKey: 'prod-api-key-67890',
          logLevel: 'error'
        },
        nodeEnv: 'production',
        logLevel: 'error'
      }));
      // Re-import to get mocked version
      const module = await import('../../middleware/auth.js');
      apiKeyAuth = module.apiKeyAuth;
    });

    it('should allow same-origin requests without API key', () => {
      req.get = vi.fn().mockImplementation((header: string) => {
        if (header === 'origin') return undefined; // No origin = same-origin
        if (header === 'host') return 'aln-retool.onrender.com';
        return undefined;
      });
      
      apiKeyAuth(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow requests with matching origin and host', () => {
      req.get = vi.fn().mockImplementation((header: string) => {
        if (header === 'origin') return 'https://aln-retool.onrender.com';
        if (header === 'host') return 'aln-retool.onrender.com';
        return undefined;
      });
      
      apiKeyAuth(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should require API key for cross-origin requests', () => {
      req.get = vi.fn().mockImplementation((header: string) => {
        if (header === 'origin') return 'https://external.com';
        if (header === 'host') return 'aln-retool.onrender.com';
        return undefined;
      });
      req.header = vi.fn().mockReturnValue(undefined);
      
      apiKeyAuth(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized - Invalid API key'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('API key validation', () => {
    beforeEach(async () => {
      vi.doMock('../../config/index.js', () => ({
        default: {
          nodeEnv: 'test',
          notionApiKey: 'correct-api-key',
          logLevel: 'error'
        },
        nodeEnv: 'test',
        logLevel: 'error'
      }));
      // Re-import to get mocked version
      const module = await import('../../middleware/auth.js');
      apiKeyAuth = module.apiKeyAuth;
    });

    it('should accept request with correct API key', () => {
      req.get = vi.fn().mockReturnValue(undefined);
      req.header = vi.fn().mockImplementation((header: string) => {
        if (header === 'X-API-Key') return 'correct-api-key';
        return undefined;
      });
      
      apiKeyAuth(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request with incorrect API key', () => {
      req.get = vi.fn().mockReturnValue(undefined);
      req.header = vi.fn().mockImplementation((header: string) => {
        if (header === 'X-API-Key') return 'wrong-api-key';
        return undefined;
      });
      
      apiKeyAuth(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized - Invalid API key'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with missing API key', () => {
      req.get = vi.fn().mockReturnValue(undefined);
      req.header = vi.fn().mockReturnValue(undefined);
      
      apiKeyAuth(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized - Invalid API key'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle invalid URL in origin header gracefully', () => {
      req.get = vi.fn().mockImplementation((header: string) => {
        if (header === 'origin') return 'not-a-valid-url';
        if (header === 'host') return 'aln-retool.onrender.com';
        return undefined;
      });
      req.header = vi.fn().mockReturnValue(undefined);
      
      apiKeyAuth(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle host with port correctly', async () => {
      vi.doMock('../../config/index.js', () => ({
        default: {
          nodeEnv: 'production',
          notionApiKey: 'test-key',
          logLevel: 'error'
        },
        nodeEnv: 'production',
        logLevel: 'error'
      }));
      
      // Re-import after mocking
      const { apiKeyAuth: auth } = await import('../../middleware/auth.js');
      
      req.get = vi.fn().mockImplementation((header: string) => {
        if (header === 'origin') return 'https://example.com';
        if (header === 'host') return 'example.com:3001';
        return undefined;
      });
      
      auth(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});