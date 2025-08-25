/**
 * ALNRetool Express Server
 * 
 * Main server configuration for the About Last Night visualization tool.
 * Provides proxy authentication for Notion API, rate limiting, CORS configuration,
 * and static file serving for production deployment.
 * 
 * @module server/index
 * 
 * **Architecture:**
 * - Express.js v5 server with TypeScript
 * - Proxy pattern for Notion API authentication
 * - Rate limiting for API protection
 * - CORS configuration for frontend communication
 * - Static file serving for production SPA
 * 
 * **Security Features:**
 * - API key authentication (replaces CSRF tokens)
 * - Rate limiting (configurable via env vars)
 * - CORS origin restrictions
 * - Input validation middleware
 * 
 * **Routes:**
 * - `/api/health` - Health check endpoint (public)
 * - `/api/notion/*` - Notion API proxy routes (protected)
 * - `/api/cache/*` - Cache management routes (protected)
 * - `/*` - SPA fallback for production
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import notionRoutes from './routes/notion/index.js';
import cacheRoutes from './routes/cache.js';
import { apiKeyAuth } from './middleware/auth.js';
// CSRF middleware removed - using API key authentication only
import { validatePagination } from './middleware/validation.js';
import { errorHandler } from './middleware/errorHandler.js';
import config from './config/index.js';
import { log } from './utils/logger.js';

/**
 * Express application instance configured with all middleware and routes
 */
const app = express();

/**
 * Server port from configuration (default: 3001)
 */
const port = config.port;

/**
 * Rate limiter middleware for API protection.
 * Configurable via environment variables to prevent abuse.
 * 
 * @constant {express.RequestHandler} apiLimiter
 * 
 * **Configuration:**
 * - windowMs: Time window for rate limiting (default: 60000ms)
 * - maxRequests: Maximum requests per window (default: 100)
 * - Can be disabled via config.features.enableRateLimit
 * 
 * **Complexity:** O(1) for each request lookup
 */
const apiLimiter = config.features.enableRateLimit ? rateLimit({
  windowMs: config.apiRateLimit.windowMs,
  max: config.apiRateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after a minute',
}) : (req: any, res: any, next: any) => next(); // Pass-through if disabled

/**
 * CORS configuration for cross-origin requests.
 * Restricts API access to configured origins in production.
 * 
 * @constant {cors.CorsOptions} corsOptions
 * 
 * **Security:**
 * - Production: Strict origin checking against config.corsOrigins
 * - Development: Allows localhost with any port
 * - Credentials enabled for cookie-based sessions
 */
const corsOptions = {
  origin: config.nodeEnv === 'production' 
    ? config.corsOrigins
    : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow configured origins or localhost in development
        const isAllowed = !origin || config.corsOrigins.some(allowed => 
          origin === allowed || origin.startsWith('http://localhost:')
        );
        callback(null, isAllowed);
      },
  credentials: true
};

/**
 * Apply middleware stack in correct order
 */
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/api', apiLimiter);

/**
 * Static file serving for production builds.
 * Serves the compiled React application from dist/client directory.
 * 
 * **Directory Structure:**
 * - Compiled server: dist/server/
 * - Compiled client: dist/client/
 * - __dirname in production: dist/server/
 */
if (config.nodeEnv === 'production') {
  const staticDir = path.join(__dirname, '../client');
  app.use(express.static(staticDir));
}

/**
 * Health check endpoint for monitoring and uptime checks.
 * Returns current server status with timestamp.
 * 
 * @route GET /api/health
 * @public No authentication required
 * @returns {Object} Status object with timestamp
 * 
 * @example
 * // Response:
 * {
 *   "status": "ok",
 *   "timestamp": "2024-08-25T12:00:00.000Z"
 * }
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Production health check endpoint for Render.com deployment.
 * Simple OK response for container health monitoring.
 * 
 * @route GET /healthz
 * @public No authentication required
 * @returns {string} Plain text "OK" with 200 status
 */
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// CSRF token endpoint removed - using API key authentication

/**
 * Notion API proxy routes.
 * All requests are protected with API key authentication and pagination validation.
 * 
 * @route /api/notion/*
 * @protected Requires valid API key
 * @middleware validatePagination, apiKeyAuth
 * 
 * **Available Endpoints:**
 * - GET /api/notion/characters - Fetch character entities
 * - GET /api/notion/elements - Fetch element entities  
 * - GET /api/notion/puzzles - Fetch puzzle entities
 * - GET /api/notion/timeline - Fetch timeline events
 * - GET /api/notion/synthesized - Fetch synthesized relationships
 * - PUT /api/notion/:entityType/:id - Update entity
 */
app.use('/api/notion', validatePagination, apiKeyAuth, notionRoutes);

/**
 * Cache management routes for manual cache control.
 * Protected with API key authentication.
 * 
 * @route /api/cache/*
 * @protected Requires valid API key
 * @middleware apiKeyAuth
 * 
 * **Available Endpoints:**
 * - GET /api/cache/status - Get cache statistics
 * - POST /api/cache/clear - Clear all cache entries
 * - DELETE /api/cache/:key - Clear specific cache entry
 */
app.use('/api/cache', apiKeyAuth, cacheRoutes);

/**
 * SPA fallback route for client-side routing.
 * Serves index.html for all non-API routes in production.
 * Must be registered after all API routes to avoid conflicts.
 * 
 * @route GET /*
 * @production Only active in production environment
 * 
 * **Purpose:**
 * - Enables React Router to handle client-side routing
 * - Returns index.html for any unmatched routes
 * - Allows deep linking to work correctly
 */
if (config.nodeEnv === 'production') {
  app.get(/.*/, (req, res) => {
    const staticDir = path.join(__dirname, '../client');
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

/**
 * Global error handler middleware.
 * Must be registered last to catch all errors from previous middleware.
 * 
 * @middleware errorHandler
 * 
 * **Handles:**
 * - Validation errors (400)
 * - Authentication errors (401)
 * - Authorization errors (403)
 * - Not found errors (404)
 * - Server errors (500)
 */
app.use(errorHandler);

/**
 * Process-level error handler for unhandled promise rejections.
 * Logs the error but keeps the process running.
 * 
 * @event process#unhandledRejection
 * @param {any} reason - The rejection reason
 * @param {Promise} promise - The rejected promise
 * 
 * **Production Consideration:**
 * - Consider implementing graceful shutdown
 * - Use process manager like PM2 for automatic restarts
 * - Send alerts to monitoring service
 */
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Promise Rejection', { 
    promise: String(promise), 
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
  // Note: In production, you might want to restart the process
});

/**
 * Process-level error handler for uncaught exceptions.
 * Logs critical errors that would otherwise crash the process.
 * 
 * @event process#uncaughtException
 * @param {Error} error - The uncaught error
 * 
 * **WARNING:**
 * - Process is in undefined state after uncaught exception
 * - Should implement graceful shutdown in production
 * - Use process manager for automatic recovery
 */
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception', { 
    error: error.message,
    stack: error.stack 
  });
  // Note: In production, you should restart the process after this
});

/**
 * Start the Express server on configured port.
 * Logs startup message with server URL.
 * 
 * @listens {number} port - Server listening port (default: 3001)
 * 
 * **Startup Sequence:**
 * 1. Load configuration from environment
 * 2. Initialize middleware stack
 * 3. Register routes
 * 4. Start listening on port
 * 5. Log successful startup
 * 
 * @example
 * // Start server with custom port
 * PORT=4000 npm run dev:server
 */
app.listen(port, () => {
  log.info(`Server is running at http://localhost:${port} (reloaded)`);
});