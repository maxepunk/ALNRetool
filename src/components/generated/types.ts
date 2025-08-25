/**
 * Types for Generated Components
 * 
 * Supporting type definitions for the component generation system
 */

import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

/**
 * All entities data structure passed to generated components
 */
export interface AllEntitiesData {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
}

/**
 * View state structure - managed by useViewState hook
 */
export interface ViewState {
  [key: string]: unknown;
  selectedNodeType?: 'character' | 'element' | 'puzzle' | 'timeline';
  selectedNodeId?: string;
  expansionDepth?: number;
  depthMetadata?: {
    isCompleteNetwork: boolean;
    totalReachableNodes: number;
    nodesAtCurrentDepth: number;
  };
}

/**
 * Data loading state for views
 */
export interface ViewDataState {
  data: AllEntitiesData | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Configuration for control component props
 */
export interface ControlComponentProps {
  id: string;
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Entity selector specific props
 */
export interface EntitySelectorProps extends ControlComponentProps {
  entityType?: 'character' | 'element' | 'puzzle' | 'timeline';
  entities: (Character | Element | Puzzle | TimelineEvent)[];
  multiple?: boolean;
}

/**
 * Depth selector specific props
 */
export interface DepthSelectorProps extends ControlComponentProps {
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Filter checkbox specific props
 */
export interface FilterCheckboxProps extends ControlComponentProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Badge display specific props
 */
export interface BadgeDisplayProps {
  id: string;
  content: string | React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

/**
 * Component registry type - maps control types to React components
 */
export interface ComponentRegistry {
  'entity-selector': React.ComponentType<EntitySelectorProps>;
  'depth-selector': React.ComponentType<DepthSelectorProps>;
  'filter-checkbox': React.ComponentType<FilterCheckboxProps>;
  'badge-display': React.ComponentType<BadgeDisplayProps>;
  'toggle-switch': React.ComponentType<FilterCheckboxProps>;
}