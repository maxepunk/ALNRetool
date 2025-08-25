/**
 * CharacterJourneyConfig
 * 
 * Declarative configuration for character journey view.
 * Replaces CharacterJourneyStrategy (151 lines) with clean relation-based approach.
 * Complex filtering logic moved to ViewBuilder's relation system for reusability.
 */

import type { ViewConfiguration } from '../ViewConfiguration';

export const CharacterJourneyConfig: ViewConfiguration = {
  id: 'character-journey',
  name: 'Character Journey',
  description: 'Shows a character\'s owned elements, timeline events, and connections',

  nodes: {
    include: [
      // Main character
      {
        type: 'basic',
        ids: ['{{characterId}}']
      },
      // Owned elements
      {
        type: 'related',
        from: '{{characterId}}',
        relation: 'owns',
        entityType: 'element',
        depth: 1
      },
      // Connected characters
      {
        type: 'related',
        from: '{{characterId}}',
        relation: 'connections',
        entityType: 'character',
        depth: 1
      },
      // Timeline events involving this character - CLEAN SOLUTION
      {
        type: 'related',
        from: '{{characterId}}',
        relation: 'timelineEvents',
        entityType: 'timeline',
        depth: 1
      },
      // Puzzles involving character's elements - CLEAN SOLUTION
      {
        type: 'related',
        from: '{{characterId}}',
        relation: 'elementPuzzles',
        entityType: 'puzzle',
        depth: 2
      }
    ]
  },

  edges: [
    { entityType: 'character' },
    { entityType: 'timeline' },
    { entityType: 'puzzle' }
  ],

  variables: {
    characterId: undefined
  },

  performance: {
    maxNodes: 200,
    cacheTTL: 300000
  }
};