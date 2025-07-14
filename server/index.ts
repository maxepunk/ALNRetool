import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import notionRoutes from './routes/notion.js';
import { apiKeyAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3001;

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
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', apiLimiter);

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Notion API routes (protected with API key)
app.use('/api/notion', apiKeyAuth, notionRoutes);

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