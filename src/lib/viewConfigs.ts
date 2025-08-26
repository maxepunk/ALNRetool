/**
 * View Configuration System
 * 
 * Declarative configuration system for creating custom graph views.
 * Enables rapid prototyping of new visualizations without code changes.
 * New views can be added in ~10 minutes by defining a config object.
 * 
 * @module lib/viewConfigs
 * 
 * **Architecture:**
 * - Declarative view definitions
 * - Filter-based entity selection
 * - Layout algorithm configuration
 * - Display customization options
 * - Interaction behavior settings
 * 
 * **Benefits:**
 * - No code changes for new views
 * - Consistent view behavior
 * - Easy A/B testing of layouts
 * - Shareable view configurations
 * 
 * @example
 * // Add a new view in viewConfigs object:
 * 'my-custom-view': {
 *   name: 'My Custom View',
 *   description: 'Shows specific relationships',
 *   filters: { entityTypes: ['puzzle', 'element'] },
 *   layout: { algorithm: 'dagre', direction: 'TB' }
 * }
 */

/**
 * View configuration schema.
 * Defines all customizable aspects of a graph view.
 * 
 * @interface ViewConfig
 * 
 * @property {string} name - Display name for UI
 * @property {string} description - Help text for users
 * @property {Object} filters - Entity filtering rules
 * @property {Object} layout - Graph layout settings
 * @property {Object} [display] - Visual appearance options
 * @property {Object} [interactions] - User interaction settings
 */
export interface ViewConfig {
  /** Display name shown in UI */
  name: string;
  
  /** Description shown in tooltips/help */
  description: string;
  
  /** Entity filtering configuration */
  filters: {
    /** Which entity types to include */
    entityTypes?: Array<'character' | 'element' | 'puzzle' | 'timeline' | 'all'>;
    /** Filter by character types (Player, NPC, etc.) */
    characterTypes?: string[];
    /** Puzzle complexity range (1-5) */
    puzzleComplexity?: { min: number; max: number };
    /** Character tier filtering */
    tiers?: string[];
    /** Extensible custom filters */
    customFilters?: Record<string, any>;
  };
  
  /** Layout algorithm configuration */
  layout: {
    /** Layout algorithm to use */
    algorithm: 'dagre' | 'force' | 'circular' | 'grid';
    /** Direction for hierarchical layouts */
    direction?: 'LR' | 'TB' | 'RL' | 'BT';
    /** Node and rank spacing */
    spacing?: {
      /** Minimum space between nodes */
      nodeSpacing?: number;
      /** Space between hierarchy levels */
      rankSpacing?: number;
    };
  };
  
  /** Visual display options */
  display?: {
    /** Show node labels */
    showLabels?: boolean;
    /** Show edge labels */
    showEdgeLabels?: boolean;
    /** Node size preset */
    nodeSize?: 'small' | 'medium' | 'large';
    /** Edge rendering style */
    edgeStyle?: 'solid' | 'dashed' | 'animated';
    /** Color scheme for accessibility */
    colorScheme?: 'default' | 'dark' | 'colorblind';
  };
  
  /** User interaction settings */
  interactions?: {
    /** Allow zoom with scroll/pinch */
    enableZoom?: boolean;
    /** Allow panning the viewport */
    enablePan?: boolean;
    /** Allow dragging nodes */
    enableNodeDrag?: boolean;
    /** Allow node selection */
    enableSelection?: boolean;
    /** Enable hover effects */
    enableHover?: boolean;
  };
}

/**
 * Pre-configured view configurations.
 * Add new views here for rapid prototyping without code changes.
 * 
 * @constant {Record<string, ViewConfig>} viewConfigs
 * @exports viewConfigs
 * 
 * **Available Views:**
 * - `full-graph`: Complete entity visualization
 * - `puzzles-only`: Puzzle dependency network
 * - `character-journey`: Character progression paths
 * - `element-flow`: Element requirement/reward flow
 * - `timeline`: Chronological event view
 * - `ownership`: Character-element ownership graph
 * 
 * **Adding New Views:**
 * 1. Add new key to this object
 * 2. Define ViewConfig properties
 * 3. View automatically available in UI
 * 
 * @example
 * // Access a view configuration
 * const config = viewConfigs['puzzles-only'];
 * 
 * @example
 * // Add new view
 * viewConfigs['my-view'] = {
 *   name: 'My View',
 *   description: 'Custom visualization',
 *   filters: { entityTypes: ['puzzle'] },
 *   layout: { algorithm: 'force' }
 * };
 */
export const viewConfigs: Record<string, ViewConfig> = {
  'full-graph': {
    name: 'Full Graph',
    description: 'Complete view of all entities and relationships',
    filters: {
      entityTypes: ['all']
    },
    layout: {
      algorithm: 'dagre',
      direction: 'LR',
      spacing: {
        nodeSpacing: 100,
        rankSpacing: 300
      }
    },
    display: {
      showLabels: true,
      showEdgeLabels: false,
      nodeSize: 'medium',
      edgeStyle: 'solid'
    },
    interactions: {
      enableZoom: true,
      enablePan: true,
      enableNodeDrag: true,
      enableSelection: true,
      enableHover: true
    }
  },
  
  'puzzles-only': {
    name: 'Puzzle Network',
    description: 'Focus on puzzle dependencies and rewards',
    filters: {
      entityTypes: ['puzzle', 'element', 'character'],  // Include elements and characters for relationships
      puzzleComplexity: { min: 1, max: 5 }
    },
    layout: {
      algorithm: 'dagre',
      direction: 'TB',  // Keep vertical layout
      spacing: {
        nodeSpacing: 100,  // Increase from 80 for better separation
        rankSpacing: 300   // Increase from 200 to match main branch spacing
      }
    },
    display: {
      showLabels: true,
      showEdgeLabels: true,
      nodeSize: 'large',
      edgeStyle: 'animated'  // Keep animated edges
    }
  },
  
  'character-relations': {
    name: 'Character Relationships',
    description: 'Shows how puzzles connect characters',
    filters: {
      entityTypes: ['character', 'puzzle'],
      tiers: ['Core', 'Standard']
    },
    layout: {
      algorithm: 'force',
      spacing: {
        nodeSpacing: 150
      }
    },
    display: {
      showLabels: true,
      nodeSize: 'large',
      edgeStyle: 'animated',
      colorScheme: 'default'
    }
  },
  
  'timeline-flow': {
    name: 'Timeline',
    description: 'Chronological event flow',
    filters: {
      entityTypes: ['timeline', 'puzzle']
    },
    layout: {
      algorithm: 'dagre',
      direction: 'LR',
      spacing: {
        nodeSpacing: 50,
        rankSpacing: 400
      }
    },
    display: {
      showLabels: true,
      showEdgeLabels: true,
      nodeSize: 'small',
      edgeStyle: 'solid'
    }
  },
  
  'core-experience': {
    name: 'Core Experience',
    description: 'Essential puzzles and characters only',
    filters: {
      entityTypes: ['character', 'puzzle'],
      tiers: ['Core'],
      puzzleComplexity: { min: 1, max: 3 }
    },
    layout: {
      algorithm: 'dagre',
      direction: 'TB'
    },
    display: {
      showLabels: true,
      nodeSize: 'large',
      edgeStyle: 'solid',
      colorScheme: 'default'
    }
  },
  
  // Template for new views - copy and modify
  'custom-view-template': {
    name: 'Custom View',
    description: 'Template for creating new views',
    filters: {
      entityTypes: ['all'],
      customFilters: {
        // Add custom filter logic here
      }
    },
    layout: {
      algorithm: 'dagre',
      direction: 'LR'
    },
    display: {
      showLabels: true,
      nodeSize: 'medium'
    }
  }
};

/**
 * Hook for using view configurations
 */
export function useViewConfig(viewType: string): ViewConfig {
  const config = viewConfigs[viewType as keyof typeof viewConfigs];
  return config ?? viewConfigs['full-graph']!;
}

/**
 * Helper to create a new view config
 * Use this for rapid view creation
 */
export function createViewConfig(
  name: string,
  options: Partial<ViewConfig>
): ViewConfig {
  return {
    name,
    description: options.description || `Custom view: ${name}`,
    filters: options.filters || { entityTypes: ['all'] },
    layout: options.layout || { algorithm: 'dagre', direction: 'LR' },
    display: options.display || { showLabels: true, nodeSize: 'medium' },
    interactions: options.interactions || {
      enableZoom: true,
      enablePan: true,
      enableNodeDrag: true,
      enableSelection: true,
      enableHover: true
    }
  };
}

/**
 * Export view names for routing
 */
export const viewNames = Object.keys(viewConfigs);

/**
 * Get view config by route parameter
 */
export function getViewConfigByRoute(routeParam: string): ViewConfig | null {
  return viewConfigs[routeParam] || null;
}