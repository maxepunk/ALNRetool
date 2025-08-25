/**
 * useFilterNavigation Hook
 * 
 * Bridges the gap between FilterStore and URL-based routing system.
 * Enables sidebar filter selections to trigger proper navigation to parameterized views.
 * 
 * This hook resolves the critical architectural disconnect where filter selections
 * only updated state but didn't trigger URL navigation, leaving users on pages
 * showing "Selection Required" despite making selections.
 */

import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RouteUtils } from '@/components/generated/RouteGenerator';

/**
 * Hook that provides navigation utilities for filter components
 * 
 * @returns Object with navigation functions
 */
export function useFilterNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  
  /**
   * Navigate to a specific view with parameters
   * 
   * @param viewId - The view identifier (e.g., 'puzzle-focus', 'character-journey')
   * @param params - Parameters to include in the URL (e.g., { puzzleId: 'puzzle-123' })
   */
  const navigateToView = useCallback((viewId: string, params: Record<string, string> = {}) => {
    const url = RouteUtils.generateNavUrl(viewId, params);
    if (url && url !== location.pathname) {
      navigate(url);
    }
  }, [navigate, location.pathname]);
  
  /**
   * Navigate to puzzle focus view with specific puzzle ID
   * 
   * @param puzzleId - The puzzle ID to focus on
   */
  const navigateToPuzzleFocus = useCallback((puzzleId: string) => {
    navigateToView('puzzle-focus', { puzzleId });
  }, [navigateToView]);
  
  /**
   * Navigate to character journey view with specific character ID
   * 
   * @param characterId - The character ID to focus on
   */
  const navigateToCharacterJourney = useCallback((characterId: string) => {
    navigateToView('character-journey', { characterId });
  }, [navigateToView]);
  
  /**
   * Navigate to node connections view with specific node ID
   * 
   * @param nodeId - The node ID to focus on
   */
  const navigateToNodeConnections = useCallback((nodeId: string) => {
    navigateToView('node-connections', { nodeId });
  }, [navigateToView]);
  
  return {
    navigateToView,
    navigateToPuzzleFocus,
    navigateToCharacterJourney,
    navigateToNodeConnections
  };
}