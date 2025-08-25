import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { validatePagination } from '../../middleware/validation.js';
import { AppError } from '../../middleware/errorHandler.js';

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {};
    next = vi.fn();
  });

  describe('validatePagination', () => {
    it('should pass validation with no query parameters', () => {
      validatePagination(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should pass validation with valid limit', () => {
      req.query = { limit: '50' };
      validatePagination(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should pass validation with limit at minimum boundary', () => {
      req.query = { limit: '1' };
      validatePagination(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should pass validation with limit at maximum boundary', () => {
      req.query = { limit: '1000' };
      validatePagination(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should pass validation with valid cursor', () => {
      req.query = { cursor: 'next-page-cursor' };
      validatePagination(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should pass validation with both limit and cursor', () => {
      req.query = { limit: '100', cursor: 'page-2' };
      validatePagination(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should throw error for limit below minimum', () => {
      req.query = { limit: '0' };
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow(AppError);
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow('Limit must be between 1 and 1000');
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw error for negative limit', () => {
      req.query = { limit: '-5' };
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow(AppError);
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow('Limit must be between 1 and 1000');
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw error for limit above maximum', () => {
      req.query = { limit: '1001' };
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow(AppError);
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow('Limit must be between 1 and 1000');
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw error for non-numeric limit', () => {
      req.query = { limit: 'abc' };
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow(AppError);
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow('Limit must be between 1 and 1000');
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw error for non-string cursor', () => {
      req.query = { cursor: 123 as any };
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow(AppError);
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow('Cursor must be a string');
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw error for array cursor', () => {
      req.query = { cursor: ['cursor1', 'cursor2'] as any };
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow(AppError);
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow('Cursor must be a string');
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw error for object cursor', () => {
      req.query = { cursor: { page: 2 } as any };
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow(AppError);
      expect(() => validatePagination(req as Request, res as Response, next))
        .toThrow('Cursor must be a string');
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate thrown AppError properties', () => {
      req.query = { limit: '2000' };
      let error: AppError | undefined;
      
      try {
        validatePagination(req as Request, res as Response, next);
      } catch (e) {
        error = e as AppError;
      }
      
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(AppError);
      expect(error?.statusCode).toBe(400);
      expect(error?.code).toBe('INVALID_LIMIT');
      expect(error?.message).toBe('Limit must be between 1 and 1000');
    });
  });
});