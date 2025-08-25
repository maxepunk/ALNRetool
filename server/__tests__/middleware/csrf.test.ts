import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  generateCSRFToken,
  getCSRFToken,
  csrfProtection,
  csrfTokenEndpoint
} from '../../middleware/csrf.js';

vi.mock('../../config/index.js', () => ({
  default: {
    nodeEnv: 'development',
    notionApiKey: 'test-api-key',
    logLevel: 'error'
  }
}));

describe('CSRF Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'POST',
      header: vi.fn(),
      cookies: {},
      body: {},
      query: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      cookie: vi.fn()
    };
    next = vi.fn();
  });

  describe('generateCSRFToken', () => {
    it('should generate a 64-character hex token', () => {
      const token = generateCSRFToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('getCSRFToken', () => {
    it('should generate a new token for new session', () => {
      const token = getCSRFToken('session123');
      expect(token).toHaveLength(64);
    });

    it('should return the same token for the same session', () => {
      const token1 = getCSRFToken('session456');
      const token2 = getCSRFToken('session456');
      expect(token1).toBe(token2);
    });

    it('should return different tokens for different sessions', () => {
      const token1 = getCSRFToken('session789');
      const token2 = getCSRFToken('session999');
      expect(token1).not.toBe(token2);
    });
  });

  describe('csrfProtection', () => {
    it('should skip CSRF check for GET requests', () => {
      req.method = 'GET';
      csrfProtection(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should skip CSRF check for HEAD requests', () => {
      req.method = 'HEAD';
      csrfProtection(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should skip CSRF check for OPTIONS requests', () => {
      req.method = 'OPTIONS';
      csrfProtection(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should skip CSRF check for API key authenticated requests', () => {
      req.header = vi.fn().mockImplementation((name: string) => {
        if (name === 'X-API-Key') return 'test-api-key';
        return undefined;
      });
      csrfProtection(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject POST request without CSRF token', () => {
      req.header = vi.fn().mockReturnValue(undefined);
      csrfProtection(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 403,
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token is required for this operation'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject POST request with invalid CSRF token', () => {
      req.header = vi.fn().mockImplementation((name: string) => {
        if (name === 'X-CSRF-Token') return 'invalid-token';
        return undefined;
      });
      req.cookies = { sessionId: 'test-session' };
      csrfProtection(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 403,
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid CSRF token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept POST request with valid CSRF token from header', () => {
      const sessionId = 'valid-session';
      const validToken = getCSRFToken(sessionId);
      
      req.header = vi.fn().mockImplementation((name: string) => {
        if (name === 'X-CSRF-Token') return validToken;
        return undefined;
      });
      req.cookies = { sessionId };
      
      csrfProtection(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should accept POST request with valid CSRF token from body', () => {
      const sessionId = 'body-session';
      const validToken = getCSRFToken(sessionId);
      
      req.header = vi.fn().mockReturnValue(undefined);
      req.body = { _csrf: validToken };
      req.cookies = { sessionId };
      
      csrfProtection(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should accept POST request with valid CSRF token from query', () => {
      const sessionId = 'query-session';
      const validToken = getCSRFToken(sessionId);
      
      req.header = vi.fn().mockReturnValue(undefined);
      req.query = { _csrf: validToken };
      req.cookies = { sessionId };
      
      csrfProtection(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('csrfTokenEndpoint', () => {
    it('should return a CSRF token', () => {
      req.cookies = { sessionId: 'endpoint-session' };
      csrfTokenEndpoint(req as Request, res as Response);
      
      expect(res.cookie).toHaveBeenCalled();
      const cookieCall = (res.cookie as any).mock.calls[0];
      expect(cookieCall[0]).toBe('csrf-token');
      expect(cookieCall[1]).toHaveLength(64);
      expect(cookieCall[2]).toMatchObject({
        httpOnly: false,
        secure: false,
        sameSite: 'strict'
      });
      
      expect(res.json).toHaveBeenCalled();
      const jsonCall = (res.json as any).mock.calls[0][0];
      expect(jsonCall).toHaveProperty('token');
      expect(jsonCall.token).toHaveLength(64);
    });

    it('should use default session ID when not provided', () => {
      req.cookies = {};
      csrfTokenEndpoint(req as Request, res as Response);
      
      expect(res.cookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });
});