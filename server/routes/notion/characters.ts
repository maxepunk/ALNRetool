/**
 * Characters API routes
 */

import { createEntityRouter } from './createEntityRouter.js';
import { buildCharacterFilters } from '../../services/filterBuilder.js';
import { transformCharacter, characterToNotionProps } from '../../../src/types/notion/transforms.js';
import config from '../../config/index.js';

const CHARACTERS_DATABASE_ID = config.notionDatabaseIds.characters;

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