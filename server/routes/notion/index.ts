/**
 * Main Notion API router
 * Composes all entity-specific routers
 */

import { Router } from 'express';
import charactersRouter from './characters.js';
import elementsRouter from './elements.js';
import puzzlesRouter from './puzzles.js';
import timelineRouter from './timeline.js';
import synthesizedRouter from './synthesized.js';

const router = Router();

// Mount entity routers
router.use('/characters', charactersRouter);
router.use('/elements', elementsRouter);
router.use('/puzzles', puzzlesRouter);
router.use('/timeline', timelineRouter);
router.use('/synthesized', synthesizedRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    endpoints: [
      '/characters',
      '/elements',
      '/puzzles',
      '/timeline',
      '/synthesized'
    ]
  });
});

export default router;