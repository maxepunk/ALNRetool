import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';
import type { APIError } from '../../src/types/notion/app.js';
import { log } from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle null/undefined errors
  if (!err) {
    const errorResponse: APIError = {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    };
    return res.status(500).json(errorResponse);
  }

  // Log error for debugging
  log.error('Request error', {
    error: err?.message || 'Unknown error',
    stack: err?.stack,
    url: req.url,
    method: req.method
  });

  // Handle known AppError instances
  if (err instanceof AppError) {
    const errorResponse: APIError = {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message
    };
    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle Notion API errors
  if (err && typeof err === 'object' && 'status' in err && 'code' in err) {
    const notionError = err as any;
    const errorResponse: APIError = {
      statusCode: notionError.status || 500,
      code: notionError.code || 'NOTION_ERROR',
      message: notionError.message || 'Notion API error occurred'
    };
    return res.status(errorResponse.statusCode).json(errorResponse);
  }

  // Default error response
  const errorResponse: APIError = {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: config.nodeEnv === 'production' 
      ? 'An unexpected error occurred'
      : err?.message || 'Unknown error'
  };
  
  res.status(500).json(errorResponse);
};