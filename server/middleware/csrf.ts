/**
 * CSRF Protection Middleware
 * Implements double-submit cookie pattern for CSRF protection
 * on state-changing operations (POST, PUT, PATCH, DELETE)
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../config/index.js';

// CSRF token storage (in production, use a proper session store)
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Token expiry time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000;

// Maximum number of tokens to store (prevent memory growth)
const MAX_TOKENS = 10000;

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Clean up expired tokens and enforce maximum token limit
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  
  // Remove expired tokens
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (data.expires < now) {
      csrfTokens.delete(sessionId);
    }
  }
  
  // If we still exceed max tokens, remove oldest ones
  if (csrfTokens.size > MAX_TOKENS) {
    const entries = Array.from(csrfTokens.entries())
      .sort((a, b) => a[1].expires - b[1].expires); // Sort by expiry time (oldest first)
    
    const toRemove = entries.slice(0, csrfTokens.size - MAX_TOKENS);
    for (const [sessionId] of toRemove) {
      csrfTokens.delete(sessionId);
    }
  }
}

/**
 * Get or create CSRF token for session
 */
export function getCSRFToken(sessionId: string): string {
  cleanupExpiredTokens();
  
  const existing = csrfTokens.get(sessionId);
  if (existing && existing.expires > Date.now()) {
    return existing.token;
  }
  
  const token = generateCSRFToken();
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + TOKEN_EXPIRY
  });
  
  return token;
}

/**
 * Verify CSRF token
 */
function verifyCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored || stored.expires < Date.now()) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(stored.token)
  );
}

/**
 * CSRF Protection Middleware
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF check in test environment
  if (config.nodeEnv === 'test') {
    return next();
  }
  
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for API key authenticated requests
  const apiKey = req.header('X-API-Key');
  if (apiKey && apiKey === config.notionApiKey) {
    return next();
  }
  
  // Get session ID from cookie or create one
  const sessionId = req.cookies?.sessionId || 'default';
  
  // Get CSRF token from header or body
  const token = req.header('X-CSRF-Token') || 
                req.body?._csrf ||
                req.query?._csrf as string;
  
  if (!token) {
    return res.status(403).json({
      statusCode: 403,
      code: 'CSRF_TOKEN_MISSING',
      message: 'CSRF token is required for this operation'
    });
  }
  
  if (!verifyCSRFToken(sessionId, token)) {
    return res.status(403).json({
      statusCode: 403,
      code: 'CSRF_TOKEN_INVALID',
      message: 'Invalid CSRF token'
    });
  }
  
  next();
};

/**
 * CSRF Token endpoint middleware
 * Provides CSRF token to the frontend
 */
export const csrfTokenEndpoint = (req: Request, res: Response) => {
  const sessionId = req.cookies?.sessionId || 'default';
  const token = getCSRFToken(sessionId);
  
  // Set CSRF token as both cookie and response
  res.cookie('csrf-token', token, {
    httpOnly: false, // Allow JavaScript access for double-submit
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY
  });
  
  res.json({ token });
};

// Cleanup interval reference for proper shutdown
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start periodic cleanup of expired tokens
 */
function startCleanupInterval() {
  if (cleanupInterval) {
    return; // Already started
  }
  
  cleanupInterval = setInterval(() => {
    try {
      cleanupExpiredTokens();
    } catch (error) {
      console.error('Error during CSRF token cleanup:', error);
    }
  }, 5 * 60 * 1000); // Run every 5 minutes
  
  // Allow cleanup to be unref'd so it doesn't keep the process alive
  cleanupInterval.unref();
}

/**
 * Stop cleanup interval and clear all tokens
 */
export function stopCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  csrfTokens.clear();
}

/**
 * Get statistics about token storage for monitoring
 */
export function getTokenStats() {
  const now = Date.now();
  const activeTokens = Array.from(csrfTokens.values())
    .filter(data => data.expires > now).length;
  
  return {
    total: csrfTokens.size,
    active: activeTokens,
    expired: csrfTokens.size - activeTokens,
    maxTokens: MAX_TOKENS
  };
}

// Start cleanup interval in non-test environments
if (config.nodeEnv !== 'test') {
  startCleanupInterval();
  
  // Handle graceful shutdown
  process.on('SIGINT', stopCleanup);
  process.on('SIGTERM', stopCleanup);
  process.on('beforeExit', stopCleanup);
}