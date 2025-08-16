import { Request, Response, NextFunction } from 'express';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  // In development, allow all requests from localhost without API key
  if (process.env.NODE_ENV === 'development') {
    const origin = req.get('origin');
    const referer = req.get('referer');
    
    // Allow requests from localhost development servers
    if (origin?.includes('localhost') || referer?.includes('localhost')) {
      return next();
    }
  }
  
  // In production, allow requests from the same origin without API key
  // This allows the frontend to access the API without exposing the key
  if (process.env.NODE_ENV === 'production') {
    // Check if request is from same origin (our frontend)
    const origin = req.get('origin');
    const host = req.get('host');
    
    // If no origin header (same-origin request), allow it
    if (!origin) {
      return next();
    }
    
    // If origin is present, do strict hostname comparison
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        const hostName = host.split(':')[0];
        if (originUrl.hostname === hostName) {
          return next();
        }
      } catch {
        // If origin parsing fails, fall through to API key check
      }
    }
  }
  
  // For non-localhost requests in dev and non-same-origin in prod, require API key
  const API_KEY = process.env.NOTION_API_KEY;
  const providedKey = req.header('X-API-Key');
  
  if (!API_KEY) {
    console.error('NOTION_API_KEY is not set in the environment.');
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