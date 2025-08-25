/**
 * PuzzleFocusConfig
 * 
 * Declarative configuration for puzzle focus view.
 * Replaces PuzzleFocusStrategy (110 lines) with 28 lines.
 */

import type { ViewConfiguration } from '../ViewConfiguration';

export const PuzzleFocusConfig: ViewConfiguration = {
  id: 'puzzle-focus',
  name: 'Puzzle Focus',
  description: 'Shows a puzzle with sub-puzzles, elements, and rewards within depth',

  nodes: {
    include: [
      // Main puzzle and related entities within depth
      {
        type: 'traversed',
        from: '{{puzzleId}}',
        entityType: 'puzzle',
        depth: 3, // Template variable, will be resolved at runtime
        maxNodes: 100
      },
      // Also include elements connected to the traversed puzzles
      {
        type: 'traversed',
        from: '{{puzzleId}}',
        entityType: 'element',
        depth: 3,
        maxNodes: 50
      },
      // Include characters that own the elements
      {
        type: 'traversed',
        from: '{{puzzleId}}',
        entityType: 'character',
        depth: 3,
        maxNodes: 20
      }
    ]
  },

  edges: [
    { 
      entityType: 'puzzle',
      includeTypes: ['dependency', 'reward', 'chain']
    },
    {
      entityType: 'element',
      includeTypes: ['ownership', 'requirement', 'reward', 'container']
    },
    {
      entityType: 'character',
      includeTypes: ['ownership', 'relation']
    }
  ],

  variables: {
    puzzleId: undefined,
    maxDepth: 2
  },

  performance: {
    maxNodes: 150,
    cacheTTL: 300000
  }
};