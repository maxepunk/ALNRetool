import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';
import notionRoutes from './routes/notion.js';
import cacheRoutes from './routes/cache.js';
import { apiKeyAuth } from './middleware/auth.js';
import { validatePagination } from './middleware/validation.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
// Use NOTION_API_KEY from CI or API_KEY from local env
if (!process.env.API_KEY && process.env.NOTION_API_KEY) {
  process.env.API_KEY = process.env.NOTION_API_KEY;
}

// Only load .env files if API_KEY is not already set (allows test override)
if (process.env.NODE_ENV === 'test') {
  console.log('[Server] Test mode - API_KEY before dotenv:', process.env.API_KEY?.substring(0, 8) + '...');
}
if (!process.env.API_KEY) {
  if (process.env.NODE_ENV === 'test' && existsSync('.env.test')) {
    config({ path: '.env.test' });
  } else {
    config();
  }
}
if (process.env.NODE_ENV === 'test') {
  console.log('[Server] Test mode - API_KEY after dotenv:', process.env.API_KEY?.substring(0, 8) + '...');
}

const app = express();
const port = process.env.PORT ?? 3001;

// Apply rate limiting to all /api requests (incoming protection)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after a minute',
});

// Configure CORS - restrict to frontend origin only
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || false // In production, same-origin if no FRONTEND_URL
    : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow multiple localhost ports in development
        const allowedPorts = ['5173', '5174', '5175'];
        const isLocalhost = origin && allowedPorts.some(port => 
          origin === `http://localhost:${port}`
        );
        if (!origin || isLocalhost) {
          callback(null, true);
        } else {
          // Don't throw error, just don't set CORS headers for disallowed origins
          callback(null, false);
        }
      },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', apiLimiter);

// Serve static files in production
// __dirname in compiled output will be dist/server/server/
// So we need to go up two levels to dist/ then into client/
if (process.env.NODE_ENV === 'production') {
  const staticDir = path.join(__dirname, '../../client');
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

// Notion API routes (protected with API key and validated)
app.use('/api/notion', validatePagination, apiKeyAuth, notionRoutes);

// Cache management routes (protected with API key)
app.use('/api/cache', apiKeyAuth, cacheRoutes);

// SPA fallback - must be after all API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const staticDir = path.join(__dirname, '../../client');
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

// Global error handler (must be last)
app.use(errorHandler);

// Process-level error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Note: In production, you might want to restart the process
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Note: In production, you should restart the process after this
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});