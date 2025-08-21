/**
 * Characters API routes
 */

import { createEntityRouter } from './createEntityRouter.js';
import { buildCharacterFilters } from '../../services/filterBuilder.js';
import { transformCharacter, characterToNotionProps } from '../../../src/types/notion/transforms.js';

const CHARACTERS_DATABASE_ID = process.env.NOTION_CHARACTERS_DB || 
  '18c2f33d-583f-8060-a6ab-de32ff06bca2';

// Create router with enhanced configuration
// Characters don't have inverse relations currently, but the pattern is ready
const router = createEntityRouter({
  databaseId: CHARACTERS_DATABASE_ID,
  entityName: 'characters',
  transform: transformCharacter,
  toNotionProps: characterToNotionProps,
  buildFilters: buildCharacterFilters,
  inverseRelations: [] // No inverse relations for characters yet
});

export default router;