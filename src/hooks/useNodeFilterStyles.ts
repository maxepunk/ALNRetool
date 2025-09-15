/**
 * React hook for node filter styles
 * Provides memoized filter styles with React Flow integration
 * Enhanced with dynamic typography and granular display controls
 */

import { useMemo, useCallback } from 'react';
import { useStore } from '@xyflow/react';
import { getNodeFilterStyles, getNodeZIndex } from '@/lib/graph/nodeUtils';
import type { GraphNodeData } from '@/lib/graph/types';
import type { ReactFlowState } from '@xyflow/react';

export interface NodeDisplayFlags {
  showShape: boolean;
  showIcon: boolean;
  showTitle: boolean;
  showTitleFull: boolean;
  showBadges: boolean;
  showStats: boolean;
  showDetails: boolean;
  showDescriptions: boolean;
  enablePopovers: boolean;
  enableTooltips: boolean;
}

export interface NodeTextSizes {
  title: string;
  badge: string;
  stats: string;
  description: string;
}

/**
 * Hook to get filter-based styling for nodes
 * Memoizes the calculation and provides zoom-aware styling
 * Now includes dynamic typography and enhanced display controls
 */
export function useNodeFilterStyles<T>(
  metadata: GraphNodeData<T>['metadata'],
  selected?: boolean,
  highlightShared?: boolean
) {
  // Use useStore instead of useReactFlow to avoid context issues
  const zoom = useStore((state: ReactFlowState) => state.transform[2]);

  const filterStyles = useMemo(
    () => getNodeFilterStyles(metadata, highlightShared),
    [metadata.isFocused, metadata.isFiltered, metadata.isConnected, metadata.searchMatch, highlightShared]
  );

  const zIndex = useMemo(
    () => getNodeZIndex(metadata, selected),
    [metadata, selected]
  );

  // NEW: Dynamic typography sizing based on zoom
  const getResponsiveTextSize = useCallback((baseSize: 'sm' | 'md' | 'lg' | 'xl') => {
    // Map base sizes to rem values that scale with zoom
    const baseSizes = {
      sm: 0.875,  // 14px base (was text-xs/12px)
      md: 1.0,     // 16px base (was text-sm/14px)
      lg: 1.125,   // 18px base (was text-base/16px)
      xl: 1.25     // 20px base (new for titles)
    };
    
    // Scale factor based on zoom (0.5x to 2.0x range)
    const clampedZoom = Math.min(Math.max(zoom, 0.5), 2.0);
    const scaleFactor = 0.8 + (clampedZoom - 0.5) * 0.4; // 0.8x to 1.4x scaling
    
    return `${baseSizes[baseSize] * scaleFactor}rem`;
  }, [zoom]);

  // NEW: Enhanced information levels with more granularity
  const informationLevel = useMemo(() => {
    if (zoom < 0.1) return 'micro';      // Shape only
    if (zoom < 0.3) return 'minimal';    // Icon + abbreviated title
    if (zoom < 0.5) return 'compact';    // Icon + full title
    if (zoom < 0.75) return 'standard';  // + Primary badges
    if (zoom < 1.0) return 'enhanced';   // + Stats
    if (zoom < 1.5) return 'detailed';   // + Descriptions
    return 'expanded';                   // Everything + hover details
  }, [zoom]);

  // NEW: Specific display flags for each content type
  const displayFlags = useMemo<NodeDisplayFlags>(() => ({
    showShape: true,  // Always show
    showIcon: zoom >= 0.1,
    showTitle: zoom >= 0.2,
    showTitleFull: zoom >= 0.3,  // Switch from truncated to full
    showBadges: zoom >= 0.5,
    showStats: zoom >= 0.75,
    showDetails: zoom >= 1.0,
    showDescriptions: zoom >= 1.25,
    enablePopovers: true,  // Always enable popovers for when text is too small to read
    enableTooltips: zoom >= 0.3,  // Tooltips for truncated content
  }), [zoom]);

  // NEW: Text size classes for Tailwind
  const textSizes = useMemo<NodeTextSizes>(() => ({
    title: zoom < 0.5 ? 'text-sm' : zoom < 1.0 ? 'text-base' : 'text-lg',
    badge: zoom < 0.75 ? 'text-xs' : 'text-sm',
    stats: zoom < 1.0 ? 'text-xs' : 'text-sm',
    description: zoom < 1.25 ? 'text-xs' : 'text-sm',
  }), [zoom]);

  return {
    ...filterStyles,
    zIndex,
    zoom,
    informationLevel,
    // NEW properties
    displayFlags,
    textSizes,
    getResponsiveTextSize,
  };
}