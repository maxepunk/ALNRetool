/**
 * Characters API routes
 */

import { createEntityRouter } from './createEntityRouter.js';
import { transformCharacter } from '../../../src/types/notion/transforms.js';
import { toNotionCharacterProperties } from '../../services/notionPropertyMappers.js';

const CHARACTERS_DATABASE_ID = process.env.NOTION_CHARACTERS_DB || 
  '18c2f33d-583f-8060-a6ab-de32ff06bca2';

console.log('[Characters Router] Database ID:', CHARACTERS_DATABASE_ID);

export default createEntityRouter({
  databaseId: CHARACTERS_DATABASE_ID,
  entityName: 'characters',
  transform: transformCharacter,
  toNotionProps: toNotionCharacterProperties
});