/**
 * Shared utilities for graph node components
 * Centralizes common logic to eliminate duplication across node types
 */

import type { GraphNodeData } from './types';

/**
 * Node size configurations shared across all node types
 */
export const NODE_SIZE_CONFIGS = {
  small: { 
    width: 120, 
    height: 80, 
    padding: 8,
    fontSize: 'text-xs'
  },
  medium: { 
    width: 160, 
    height: 100, 
    padding: 12,
    fontSize: 'text-sm'
  },
  large: { 
    width: 200, 
    height: 120, 
    padding: 16,
    fontSize: 'text-base'
  },
  parent: { 
    width: 240, 
    height: 140, 
    padding: 20,
    fontSize: 'text-base font-semibold'
  },
  child: { 
    width: 140, 
    height: 90, 
    padding: 10,
    fontSize: 'text-xs'
  }
} as const;

export type NodeSize = keyof typeof NODE_SIZE_CONFIGS;

/**
 * Get filter-based styling information for a node
 * Returns state flags and colors for custom outline implementations
 */
export function getNodeFilterStyles<T>(metadata: GraphNodeData<T>['metadata']) {
  const isFocused = metadata.isFocused || false;
  const isFiltered = metadata.isFiltered || false;
  const isConnected = metadata.isConnected || false;
  const isHighlighted = metadata.searchMatch || isFocused;
  const isDimmed = isConnected && !isFocused && !isFiltered;

  // Define outline styles based on state
  let outlineColor = '';
  let outlineWidth = 0;
  let opacity = 1;

  if (isFocused) {
    outlineColor = 'rgb(250, 204, 21)'; // yellow-400 - stronger yellow
    outlineWidth = 4;
  } else if (isFiltered) {
    outlineColor = 'rgb(37, 99, 235)'; // blue-600 - deeper blue
    outlineWidth = 3;
  } else if (isDimmed) {
    opacity = 0.2; // Much stronger dimming for better contrast (was 0.5)
  } else if (metadata.searchMatch === false) {
    // Very dim for non-matching nodes during active search
    // searchMatch is false when there's a search term but this node doesn't match
    opacity = 0.15;
  }

  return {
    isHighlighted,
    isFiltered,
    isFocused,
    isDimmed,
    outlineColor,
    outlineWidth,
    opacity
  };
}

/**
 * Animation timing constants for consistent transitions
 */
export const ANIMATION_TIMING = {
  fast: 150,
  normal: 300,
  slow: 500
} as const;

/**
 * Standard transition classes for nodes
 */
export const NODE_TRANSITIONS = {
  base: 'transition-all duration-300',
  fast: 'transition-all duration-150',
  slow: 'transition-all duration-500',
  scale: 'hover:scale-105 transition-transform duration-300',
  lift: 'hover:translate-y-[-2px] transition-transform duration-300'
} as const;

/**
 * Z-index layers for proper stacking
 */
export const Z_INDEX = {
  dimmed: 1,
  normal: 10,
  filtered: 20,
  focused: 30,
  selected: 40
} as const;

/**
 * Get z-index based on node state
 */
export function getNodeZIndex<T>(metadata: GraphNodeData<T>['metadata'], selected?: boolean) {
  if (selected) return Z_INDEX.selected;
  if (metadata.isFocused) return Z_INDEX.focused;
  if (metadata.isFiltered) return Z_INDEX.filtered;
  if (metadata.isConnected) return Z_INDEX.dimmed;
  return Z_INDEX.normal;
}