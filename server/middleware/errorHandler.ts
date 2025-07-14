import { Request, Response, NextFunction } from 'express';
import type { APIError } from '../../src/types/notion/app.js';

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
  // Log error for debugging
  console.error('Error:', err);

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
  if ('status' in err && 'code' in err) {
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
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred'
      : err.message
  };
  
  res.status(500).json(errorResponse);
};