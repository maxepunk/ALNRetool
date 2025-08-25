/**
 * useFilterNavigation Hook - Simplified after Phase 3
 * Basic navigation utilities for filters
 */

import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook that provides navigation utilities for filter components
 */
export function useFilterNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  
  /**
   * Navigate to graph view with query parameters
   */
  const navigateToView = useCallback((params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    const url = `/graph${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    if (url !== location.pathname + location.search) {
      navigate(url);
    }
  }, [navigate, location]);
  
  return {
    navigateToView
  };
}