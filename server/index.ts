import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import notionRoutes from './routes/notion/index.js';
import cacheRoutes from './routes/cache.js';
import { apiKeyAuth } from './middleware/auth.js';
import { csrfProtection, csrfTokenEndpoint } from './middleware/csrf.js';
import { validatePagination } from './middleware/validation.js';
import { errorHandler } from './middleware/errorHandler.js';
import config from './config/index.js';
import { log } from './utils/logger.js';

const app = express();
const port = config.port;

// Apply rate limiting to all /api requests (incoming protection)
const apiLimiter = config.features.enableRateLimit ? rateLimit({
  windowMs: config.apiRateLimit.windowMs,
  max: config.apiRateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after a minute',
}) : (req: any, res: any, next: any) => next(); // Pass-through if disabled

// Configure CORS - restrict to frontend origin only
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

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/api', apiLimiter);

// Serve static files in production
// __dirname in compiled output will be dist/server/
// So we need to go up one level to dist/ then into client/
if (config.nodeEnv === 'production') {
  const staticDir = path.join(__dirname, '../client');
  app.use(express.static(staticDir));
}

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production health check for Render
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// CSRF token endpoint
app.get('/api/csrf-token', csrfTokenEndpoint);

// Notion API routes (protected with API key, CSRF, and validated)
app.use('/api/notion', validatePagination, apiKeyAuth, csrfProtection, notionRoutes);

// Cache management routes (protected with API key)
app.use('/api/cache', apiKeyAuth, cacheRoutes);

// SPA fallback - must be after all API routes
if (config.nodeEnv === 'production') {
  app.get(/.*/, (req, res) => {
    const staticDir = path.join(__dirname, '../client');
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

// Global error handler (must be last)
app.use(errorHandler);

// Process-level error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Promise Rejection', { 
    promise: String(promise), 
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
  // Note: In production, you might want to restart the process
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception', { 
    error: error.message,
    stack: error.stack 
  });
  // Note: In production, you should restart the process after this
});

app.listen(port, () => {
  log.info(`Server is running at http://localhost:${port} (reloaded)`);
});