/**
 * ViewFactory - Dynamic View Creation Utility
 * 
 * Provides utilities for dynamically creating and registering views
 * using the ViewComponentFactory and ViewRegistry systems.
 * 
 * Phase 3B: Enhanced Dynamic View Registration
 * - Streamlined view creation API
 * - Integration with ViewRegistry for routing
 * - Type-safe view configuration helpers
 * - Automatic cleanup and lifecycle management
 */

import React from 'react';
import type { ViewConfiguration } from '@/lib/graph/config/ViewConfiguration';
import type { ControlType } from '@/lib/graph/config/types/UIConfiguration';
import ViewComponentFactory from './ViewComponentFactory';
import { viewRegistry } from '@/contexts/ViewContext';

/**
 * Configuration options for creating a dynamic view
 */
export interface DynamicViewOptions {
  /** Base configuration for the view */
  config: ViewConfiguration;
  /** Whether to automatically register for routing (default: true) */
  registerForRouting?: boolean;
  /** Additional props to pass to ViewComponentFactory */
  factoryProps?: {
    className?: string;
  };
}

/**
 * Create a dynamic view component from configuration
 */
export function createDynamicView(options: DynamicViewOptions) {
  const { config, registerForRouting = true, factoryProps = {} } = options;
  
  const DynamicViewComponent: React.FC = () => {
    return (
      <ViewComponentFactory 
        config={config} 
        {...factoryProps}
      />
    );
  };
  
  // Set display name for debugging
  DynamicViewComponent.displayName = `DynamicView(${config.id})`;
  
  // Optionally register for routing immediately
  if (registerForRouting) {
    viewRegistry.register(config);
  }
  
  return DynamicViewComponent;
}

/**
 * Hook for managing dynamic view registration
 */
export function useDynamicViewRegistration() {
  const registerView = React.useCallback((config: ViewConfiguration) => {
    viewRegistry.register(config);
  }, []);
  
  const unregisterView = React.useCallback((viewId: string) => {
    viewRegistry.unregister(viewId);
  }, []);
  
  const getRegisteredViews = React.useCallback(() => {
    return viewRegistry.getAll();
  }, []);
  
  const getViewRoutes = React.useCallback(() => {
    return viewRegistry.generateRoutes();
  }, []);
  
  const getViewTypeMapping = React.useCallback(() => {
    return viewRegistry.getViewTypeMapping();
  }, []);
  
  return {
    registerView,
    unregisterView,
    getRegisteredViews,
    getViewRoutes,
    getViewTypeMapping,
    registry: viewRegistry
  };
}

/**
 * Quick view configuration helpers for common patterns
 */
export const ViewConfigHelpers = {
  /**
   * Create a node connections view configuration
   */
  nodeConnections: (overrides?: Partial<ViewConfiguration>): ViewConfiguration => ({
    id: 'node-connections',
    name: 'Node Connections',
    description: 'Explore connections between different entities in the graph',
    nodes: {
      include: []
    },
    edges: [],
    ui: {
      title: 'Node Connections',
      description: 'Select a node type and specific entity to explore its connections',
      controls: [
        {
          id: 'nodeType',
          type: 'entity-selector' as ControlType,
          label: 'Node Type',
          placeholder: 'Select node type...',
          statePath: 'nodeType',
          options: {
            entityType: 'character'
          }
        },
        {
          id: 'nodeId',
          type: 'entity-selector' as ControlType,
          label: 'Select Entity',
          placeholder: 'Choose entity...',
          statePath: 'nodeId',
          options: {
            entityType: 'character'
          }
        },
        {
          id: 'expansionDepth',
          type: 'depth-selector' as ControlType,
          label: 'Connection Depth',
          statePath: 'expansionDepth',
          options: {
            min: 1,
            max: 5
          }
        }
      ],
      routing: {
        basePath: '/node-connections'
      }
    },
    ...overrides
  }),
  
  /**
   * Create a puzzle focus view configuration
   */
  puzzleFocus: (overrides?: Partial<ViewConfiguration>): ViewConfiguration => ({
    id: 'puzzle-focus',
    name: 'Puzzle Focus',
    description: 'Deep dive into specific puzzle chains and dependencies',
    nodes: {
      include: []
    },
    edges: [],
    ui: {
      title: 'Puzzle Focus',
      description: 'Explore puzzle dependencies and reward chains',
      routing: {
        basePath: '/puzzle-focus'
      }
    },
    ...overrides
  }),
  
  /**
   * Create a character journey view configuration
   */
  characterJourney: (overrides?: Partial<ViewConfiguration>): ViewConfiguration => ({
    id: 'character-journey',
    name: 'Character Journey',
    description: 'Follow character arcs and story progression',
    nodes: {
      include: []
    },
    edges: [],
    ui: {
      title: 'Character Journey',
      description: 'Track character development and story involvement',
      routing: {
        basePath: '/character-journey'
      }
    },
    ...overrides
  }),
  
  /**
   * Create a custom view configuration with sensible defaults
   */
  custom: (id: string, name: string, description: string, overrides?: Partial<ViewConfiguration>): ViewConfiguration => ({
    id,
    name,
    description,
    nodes: {
      include: []
    },
    edges: [],
    ui: {
      title: name,
      description,
      routing: {
        basePath: `/${id}`
      }
    },
    ...overrides
  })
};

/**
 * Batch view registration utility
 */
export function registerMultipleViews(configs: ViewConfiguration[]) {
  configs.forEach(config => {
    viewRegistry.register(config);
  });
}

/**
 * Pre-built view configurations for common use cases
 */
export const CommonViewConfigs = {
  nodeConnections: ViewConfigHelpers.nodeConnections(),
  puzzleFocus: ViewConfigHelpers.puzzleFocus(),
  characterJourney: ViewConfigHelpers.characterJourney()
};

/**
 * Export singleton registry for external access
 */
export { viewRegistry };