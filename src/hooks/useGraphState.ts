/**
 * Viewport Management Hook
 * Manages intelligent viewport focusing and transitions for the graph visualization
 * 
 * Note: This file was refactored from a larger graph state management system.
 * The centralized state management was abandoned in Sprint 2 in favor of
 * direct state management in GraphView to avoid React Flow conflicts.
 */

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

/**
 * Hook for managing graph zoom and viewport
 */
export function useGraphViewport() {
  const { getViewport, setViewport, fitView, zoomIn, zoomOut, getNodes } = useReactFlow();
  
  const handleZoomToFit = useCallback(() => {
    fitView({ padding: 0.2, duration: 800 });
  }, [fitView]);
  
  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);
  
  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);
  
  const handleResetView = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 });
  }, [setViewport]);
  
  /**
   * Fit viewport to show specific nodes with optimal zoom level
   */
  const fitToNodes = useCallback((nodeIds: string[], options?: { padding?: number; duration?: number }) => {
    const currentNodes = getNodes();
    const targetNodes = currentNodes.filter(node => nodeIds.includes(node.id));
    
    if (targetNodes.length === 0) {
      console.warn('[useGraphViewport] No nodes found for IDs:', nodeIds);
      return;
    }
    
    // Use React Flow's built-in fitView with node filtering
    fitView({
      nodes: targetNodes,
      padding: options?.padding ?? 0.3,
      duration: options?.duration ?? 800
    });
  }, [getNodes, fitView]);
  
  /**
   * Fit viewport to show search results with highlighting
   */
  const fitToSearchResults = useCallback((searchQuery: string, options?: { padding?: number; duration?: number }) => {
    if (!searchQuery.trim()) {
      // No search query, fit to all visible nodes
      handleZoomToFit();
      return;
    }
    
    const currentNodes = getNodes();
    const query = searchQuery.toLowerCase();
    
    // Find nodes that match the search query
    const matchingNodes = currentNodes.filter(node => {
      const hasSearchMatch = node.data?.searchMatch === true;
      const label = typeof node.data?.label === 'string' ? node.data.label : '';
      const nameMatches = label.toLowerCase().includes(query);
      const idMatches = node.id.toLowerCase().includes(query);
      
      return hasSearchMatch || nameMatches || idMatches;
    });
    
    if (matchingNodes.length === 0) {
      // Still fit to all visible nodes if no matches
      handleZoomToFit();
      return;
    }
    
    // Fit view to matching nodes
    fitView({
      nodes: matchingNodes,
      padding: options?.padding ?? 0.3,
      duration: options?.duration ?? 800
    });
    
  }, [getNodes, fitView, handleZoomToFit]);
  
  
  return {
    viewport: getViewport,
    zoomToFit: handleZoomToFit,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    resetView: handleResetView,
    fitToNodes,
    fitToSearchResults,
  };
}

