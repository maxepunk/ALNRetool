/**
 * UI Configuration Types
 * 
 * Defines the structure for UI metadata that enables automatic
 * React component generation from ViewConfiguration objects.
 */

/**
 * Control types that can be automatically generated
 */
export type ControlType = 
  | 'entity-selector' 
  | 'filter-checkbox' 
  | 'depth-selector' 
  | 'badge-display'
  | 'toggle-switch';

/**
 * Configuration for individual UI controls
 */
export interface ControlConfiguration {
  id: string;
  type: ControlType;
  label: string;
  placeholder?: string;
  
  // Control-specific configuration
  options?: {
    // For entity-selector
    entityType?: 'character' | 'element' | 'puzzle' | 'timeline';
    multiple?: boolean;
    
    // For filter-checkbox and toggle-switch
    filterKey?: string;
    defaultChecked?: boolean;
    
    // For depth-selector
    min?: number;
    max?: number;
    step?: number;
    
    // For badge-display
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    colorMapping?: Record<string, string>;
  };
  
  // State binding - connects to view state
  statePath: string;
  
  // Conditional display
  showIf?: (viewState: Record<string, unknown>) => boolean;
}

/**
 * Routing configuration for view navigation
 */
export interface RoutingConfiguration {
  basePath: string;
  parameters?: {
    [key: string]: {
      required?: boolean;
      type: 'string' | 'number';
      transform?: (value: string | number) => string | number;
    };
  };
  
  // URL synchronization settings
  syncToURL?: boolean;
  replaceHistory?: boolean;
}

/**
 * Layout configuration for the generated UI
 */
export interface UILayoutConfiguration {
  header?: {
    showTitle?: boolean;
    showDescription?: boolean;
    showStats?: boolean;
    customElements?: string[]; // Component names to render
  };
  
  controls?: {
    layout: 'horizontal' | 'vertical' | 'grid';
    grouping?: Array<{
      label: string;
      controls: string[]; // Control IDs
    }>;
    spacing?: 'compact' | 'normal' | 'relaxed';
  };
  
  sidebar?: {
    position: 'left' | 'right';
    width?: string;
    collapsible?: boolean;
  };
}

/**
 * Complete UI configuration for a view
 */
export interface UIConfiguration {
  title: string;
  description?: string;
  
  // Control definitions
  controls?: ControlConfiguration[];
  
  // Routing setup
  routing?: RoutingConfiguration;
  
  // Layout configuration
  layout?: UILayoutConfiguration;
  
  // Custom styling
  className?: string;
  theme?: {
    primaryColor?: string;
    accentColor?: string;
  };
}