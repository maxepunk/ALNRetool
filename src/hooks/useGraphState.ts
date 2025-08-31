/**
 * Viewport Management Hook
 * Manages intelligent viewport focusing and transitions for the graph visualization
 * 
 * Note: This file was refactored from a larger graph state management system.
 * The centralized state management was abandoned in Sprint 2 in favor of
 * direct state management in GraphView to avoid React Flow conflicts.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';

/**
 * Hook for managing graph zoom and viewport
 */
function useGraphViewport() {
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
  
  // Debouncing for rapid viewport changes
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Debounced version of fitToSearchResults to prevent excessive calls during rapid filtering
   */
  const debouncedFitToSearchResults = useCallback((searchQuery: string, delay = 300) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fitToSearchResults(searchQuery);
    }, delay);
  }, [fitToSearchResults]);
  
  /**
   * Debounced version of fitToNodes to prevent excessive calls during rapid changes
   */
  const debouncedFitToNodes = useCallback((nodeIds: string[], delay = 300) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fitToNodes(nodeIds);
    }, delay);
  }, [fitToNodes]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    viewport: getViewport(),
    zoomToFit: handleZoomToFit,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    resetView: handleResetView,
    fitToNodes,
    fitToSearchResults,
    debouncedFitToNodes,
    debouncedFitToSearchResults,
  };
}

/**
 * Hook for intelligent viewport management with priority-based focusing
 * 
 * Implements smart viewport logic:
 * - Selected node takes highest priority
 * - Search results take high priority
 * - All visible nodes take lowest priority
 * 
 * @param searchTerm Current search query
 * @param selectedNodeId Selected node
 * @param focusedNodeId Deprecated - kept for compatibility
 * @param connectionDepth Depth level for connection filtering
 * @param visibleNodes Currently visible nodes after all filtering
 */
export function useViewportManager(
  searchTerm: string,
  selectedNodeId: string | null,
  _focusedNodeId: string | null, // Deprecated - kept for compatibility
  connectionDepth: number | null,
  visibleNodes?: Node[]
) {
  const { 
    fitToSearchResults, 
    fitToNodes, 
    zoomToFit,
    debouncedFitToSearchResults
  } = useGraphViewport();
  
  const previousState = useRef({
    searchTerm: '',
    selectedNodeId: null as string | null,
    connectionDepth: null as number | null
  });
  
  /**
   * Determine current viewport priority level
   * Higher number = higher priority
   */
  const getCurrentPriority = useCallback(() => {
    if (selectedNodeId) return 3; // Highest: selected node
    if (searchTerm && searchTerm.trim()) return 2; // High: search results
    return 1; // Lowest: all visible nodes
  }, [selectedNodeId, searchTerm]);
  
  /**
   * Execute viewport change with smooth transitions
   */
  const executeViewportChange = useCallback((priority: number, immediate = false) => {
    const delay = immediate ? 0 : 200; // Short delay for smooth transitions
    
    setTimeout(() => {
      switch (priority) {
        case 3: // Selected node
          if (selectedNodeId) {
            fitToNodes([selectedNodeId], { padding: 0.2, duration: 600 });
          }
          break;
          
        case 2: // Search results
          if (searchTerm?.trim()) {
            fitToSearchResults(searchTerm, { padding: 0.25, duration: 600 });
          }
          break;
          
        case 1: // All visible nodes
        default:
          // If we have specific visible nodes, fit to them
          if (visibleNodes && visibleNodes.length > 0) {
            fitToNodes(visibleNodes.map(n => n.id), { padding: 0.3, duration: 600 });
          } else {
            zoomToFit();
          }
          break;
      }
    }, delay);
  }, [selectedNodeId, searchTerm, visibleNodes, fitToSearchResults, fitToNodes, zoomToFit]);
  
  // Performance optimization: throttle rapid successive changes
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const isThrottledRef = useRef(false);
  
  /**
   * Smart viewport management with priority handling and performance optimizations
   */
  useEffect(() => {
    const currentPriority = getCurrentPriority();
    const prev = previousState.current;
    
    // Check what changed
    const searchChanged = searchTerm !== prev.searchTerm;
    const selectedChanged = selectedNodeId !== prev.selectedNodeId;
    const depthChanged = connectionDepth !== prev.connectionDepth;
    
    // Performance optimization: Only trigger for meaningful changes
    if (searchChanged || selectedChanged || depthChanged) {
      // Edge case: Handle empty/whitespace-only search terms
      const normalizedSearch = searchTerm?.trim() || '';
      const normalizedPrevSearch = prev.searchTerm?.trim() || '';
      
      // Skip if both are effectively empty (performance optimization)
      if (!normalizedSearch && !normalizedPrevSearch && searchChanged) {
        previousState.current.searchTerm = normalizedSearch;
        return;
      }
      
      
      // Throttle rapid changes to prevent viewport thrashing
      if (isThrottledRef.current) {
        if (throttleRef.current) {
          clearTimeout(throttleRef.current);
        }
        throttleRef.current = setTimeout(() => {
          isThrottledRef.current = false;
          executeViewportChange(currentPriority);
        }, 100);
        return;
      }
      
      // Mark as throttled and execute immediately
      isThrottledRef.current = true;
      executeViewportChange(currentPriority);
      
      // Reset throttle after a delay
      throttleRef.current = setTimeout(() => {
        isThrottledRef.current = false;
      }, 150);
      
      // Update previous state
      previousState.current = {
        searchTerm: normalizedSearch,
        selectedNodeId,
        connectionDepth
      };
    }
  }, [searchTerm, selectedNodeId, connectionDepth, getCurrentPriority, executeViewportChange]);
  
  // Cleanup throttle timeout
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, []);
  
  /**
   * Manual viewport control methods
   */
  const manualControls = useMemo(() => ({
    /**
     * Force focus on search results (bypasses priority logic)
     */
    focusSearchResults: (query: string) => {
      fitToSearchResults(query, { padding: 0.25, duration: 600 });
    },
    
    /**
     * Force focus on specific nodes (bypasses priority logic)
     */
    focusNodes: (nodeIds: string[]) => {
      fitToNodes(nodeIds, { padding: 0.3, duration: 600 });
    },
    
    /**
     * Force fit all visible nodes (bypasses priority logic)
     */
    fitAll: () => {
      zoomToFit();
    },
    
    /**
     * Get current priority level for debugging
     */
    getCurrentPriority,
    
    /**
     * Debounced version for rapid changes
     */
    debouncedFocusSearchResults: (query: string, delay?: number) => {
      debouncedFitToSearchResults(query, delay);
    }
  }), [
    fitToSearchResults, 
    fitToNodes, 
    zoomToFit, 
    getCurrentPriority, 
    debouncedFitToSearchResults
  ]);
  
  return manualControls;
}