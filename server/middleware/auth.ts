import { Request, Response, NextFunction } from 'express';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  // In production, allow requests from the same origin without API key
  // This allows the frontend to access the API without exposing the key
  if (process.env.NODE_ENV === 'production') {
    // Check if request is from same origin (our frontend)
    const origin = req.get('origin');
    const host = req.get('host');
    
    // If no origin header (same-origin request) or origin matches our host, allow it
    if (!origin || (origin && host && origin.includes(host.split(':')[0]))) {
      return next();
    }
  }
  
  // For non-same-origin requests and development, require API key
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