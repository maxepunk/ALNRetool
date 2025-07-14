import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

// Validates Notion database IDs (UUIDs with or without hyphens)
export const validateNotionId = (paramName: string) => 
  (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    if (!id) {
      throw new AppError(400, 'INVALID_PARAMETER', `Missing required parameter: ${paramName}`);
    }

    // Notion IDs can be with or without hyphens
    // Without hyphens: 32 hex characters
    // With hyphens: 8-4-4-4-12 format
    const withoutHyphensRegex = /^[0-9a-f]{32}$/i;
    const withHyphensRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (withoutHyphensRegex.test(id) || withHyphensRegex.test(id)) {
      return next();
    }
    
    throw new AppError(400, 'INVALID_ID_FORMAT', `Invalid Notion ID format for parameter: ${paramName}`);
  };

// Validates pagination parameters
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { limit, cursor } = req.query;
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new AppError(400, 'INVALID_LIMIT', 'Limit must be between 1 and 100');
    }
  }
  
  if (cursor !== undefined && typeof cursor !== 'string') {
    throw new AppError(400, 'INVALID_CURSOR', 'Cursor must be a string');
  }
  
  next();
};