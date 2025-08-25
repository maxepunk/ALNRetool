import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import config from '../config/index.js';
import { log } from '../utils/logger.js';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  // In development, allow all requests from localhost without API key
  if (config.nodeEnv === 'development') {
    const origin = req.get('origin');
    const referer = req.get('referer');
    
    // Allow requests from localhost development servers
    if (origin?.includes('localhost') || referer?.includes('localhost')) {
      return next();
    }
  }
  
  // In production, allow requests from the same origin without API key
  // This allows the frontend to access the API without exposing the key
  if (config.nodeEnv === 'production') {
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
  const API_KEY = config.notionApiKey;
  const providedKey = req.header('X-API-Key');
  
  // Secure comparison using timing-safe equal to prevent timing attacks
  let isValidKey = false;
  if (providedKey && API_KEY) {
    try {
      // Convert both strings to Buffers of equal length for secure comparison
      const providedKeyBuffer = Buffer.from(providedKey, 'utf8');
      const apiKeyBuffer = Buffer.from(API_KEY, 'utf8');
      
      // Only compare if lengths match to avoid buffer length attacks
      if (providedKeyBuffer.length === apiKeyBuffer.length) {
        isValidKey = timingSafeEqual(providedKeyBuffer, apiKeyBuffer);
      }
    } catch {
      // If buffer creation fails, key is invalid
      isValidKey = false;
    }
  }
  
  // Debug logging for integration tests (without exposing keys)
  if (config.nodeEnv === 'test') {
    log.debug('[Auth] Authentication check', {
      result: isValidKey ? 'PASS' : 'FAIL'
    });
  }
  
  if (isValidKey) {
    return next();
  }

  res.status(401).json({ 
    statusCode: 401,
    code: 'UNAUTHORIZED',
    message: 'Unauthorized - Invalid API key' 
  });
};