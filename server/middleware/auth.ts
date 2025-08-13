import { Request, Response, NextFunction } from 'express';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const API_KEY = process.env.API_KEY;
  const providedKey = req.header('X-API-Key');
  
  if (!API_KEY) {
    console.error('API_KEY is not set in the environment.');
    return res.status(500).json({ 
      statusCode: 500,
      code: 'CONFIG_ERROR',
      message: 'Server configuration error.' 
    });
  }
  
  // Debug logging for integration tests (without exposing keys)
  if (process.env.NODE_ENV === 'test') {
    console.log('[Auth] Authentication check:', providedKey === API_KEY ? 'PASS' : 'FAIL');
  }
  
  if (providedKey === API_KEY) {
    return next();
  }

  res.status(401).json({ 
    statusCode: 401,
    code: 'UNAUTHORIZED',
    message: 'Unauthorized - Invalid API key' 
  });
};