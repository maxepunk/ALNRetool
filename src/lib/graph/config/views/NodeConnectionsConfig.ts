/**
 * NodeConnectionsConfig
 * 
 * Declarative configuration for node connections view.
 * Replaces NodeConnectionsStrategy (134 lines) with 30 lines.
 */

import type { ViewConfiguration } from '../ViewConfiguration';

export const NodeConnectionsConfig: ViewConfiguration = {
  id: 'node-connections',
  name: 'Node Connections',
  description: 'Shows all transitive connections from a starting node',

  nodes: {
    include: [
      // Use traversal to find all connected nodes
      {
        type: 'traversed',
        from: '{{nodeId}}',
        entityType: '{{nodeType}}' as any, // Template variable resolved at runtime
        depth: '{{maxDepth}}' as any, // Template variable resolved at runtime 
        maxNodes: '{{maxNodes}}' as any // Template variable resolved at runtime
      }
    ]
  },

  edges: [
    { entityType: 'character' },
    { entityType: 'puzzle' },
    { entityType: 'timeline' },
    { 
      entityType: 'element',
      customEdges: (data, includedNodeIds) => {
        const edges: any[] = [];
        
        // Element ownership edges (migrated from NodeConnectionsStrategy lines 95-110)
        data.characters.forEach(character => {
          if (character.ownedElementIds) {
            character.ownedElementIds.forEach(elemId => {
              if (includedNodeIds.has(elemId)) {
                edges.push({
                  id: `ownership-${character.id}-${elemId}`,
                  source: character.id,
                  target: elemId,
                  type: 'ownership',
                  label: 'owns'
                });
              }
            });
          }
        });
        
        return edges;
      }
    }
  ],

  variables: {
    nodeId: undefined,
    nodeType: undefined,
    maxDepth: 10,
    maxNodes: 250
  },

  // UI configuration for component generation
  ui: {
    title: 'Node Connections',
    description: 'Explore connections and relationships between any entity in the graph',

    // Control definitions that will be automatically rendered
    controls: [
      {
        id: 'node-type-selector',
        type: 'entity-selector',
        label: 'Type:',
        statePath: 'selectedNodeType',
        options: {
          entityType: undefined, // Special case: select entity type itself
          multiple: false
        }
      },
      {
        id: 'entity-selector',
        type: 'entity-selector',
        label: 'Entity:',
        placeholder: 'Select an entity...',
        statePath: 'selectedNodeId',
        options: {
          // Will be dynamically resolved at runtime
          multiple: false
        }
      },
      {
        id: 'depth-selector',
        type: 'depth-selector',
        label: 'Depth:',
        statePath: 'expansionDepth',
        options: {
          min: 1,
          max: 5,
          step: 1
        }
      },
      {
        id: 'connection-badge',
        type: 'badge-display',
        label: 'Network Status',
        statePath: 'depthMetadata',
        options: {
          variant: 'secondary'
        },
        showIf: (viewState) => !!(viewState.selectedNodeId && viewState.depthMetadata)
      }
    ],

    // Routing configuration
    routing: {
      basePath: '/node-connections',
      parameters: {
        nodeType: {
          required: false,
          type: 'string'
        },
        nodeId: {
          required: false,
          type: 'string'
        }
      },
      syncToURL: true,
      replaceHistory: true
    },

    // Layout configuration
    layout: {
      header: {
        showTitle: true,
        showDescription: true,
        showStats: false
      },
      controls: {
        layout: 'horizontal',
        spacing: 'normal'
      }
    }
  },

  performance: {
    maxNodes: 250,
    cacheTTL: 300000
  }
};