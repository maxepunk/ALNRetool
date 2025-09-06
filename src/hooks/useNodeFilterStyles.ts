/**
 * React hook for node filter styles
 * Provides memoized filter styles with React Flow integration
 */

import { useMemo } from 'react';
import { useStore } from '@xyflow/react';
import { getNodeFilterStyles, getNodeZIndex } from '@/lib/graph/nodeUtils';
import type { GraphNodeData } from '@/lib/graph/types';
import type { ReactFlowState } from '@xyflow/react';

/**
 * Hook to get filter-based styling for nodes
 * Memoizes the calculation and provides zoom-aware styling
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

  // Determine information density based on zoom level
  const informationLevel = useMemo(() => {
    if (zoom < 0.5) return 'minimal';  // Only show title and icon
    if (zoom < 0.75) return 'basic';   // Title, icon, and primary badge
    if (zoom < 1.25) return 'standard'; // Default view
    return 'detailed';                  // All information visible
  }, [zoom]);

  return {
    ...filterStyles,
    zIndex,
    zoom,
    informationLevel,
    shouldShowBadges: zoom >= 0.5,
    shouldShowStats: zoom >= 0.75,
    shouldShowDetails: zoom >= 1.0
  };
}