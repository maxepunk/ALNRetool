import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

// Validates pagination parameters
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { limit, cursor } = req.query;
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit as string, 10);
    // Allow up to 1000 items - backend handles pagination automatically with multiple Notion API calls
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      throw new AppError(400, 'INVALID_LIMIT', 'Limit must be between 1 and 1000');
    }
  }
  
  if (cursor !== undefined && typeof cursor !== 'string') {
    throw new AppError(400, 'INVALID_CURSOR', 'Cursor must be a string');
  }
  
  next();
};