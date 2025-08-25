/**
 * Main application router
 * Now uses dynamic route generation from ViewRegistry
 * Phase 2: URL-first state management integration
 * Phase 3B: Integration with ViewComponentFactory system
 */

import { Routes, Route, useLocation } from 'react-router-dom'
import React, { useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import NotFound from '@/components/common/NotFound'
import { useGeneratedRoutes } from '@/components/generated/RouteGenerator'
import { useFilterStore } from '@/stores/filterStore'

/**
 * AppRouter component
 * Now uses dynamic routing with ViewComponentFactory integration
 * Phase 2: URL-first state management - hydrates FilterStore from URL changes
 * Phase 3B: Complete replacement of hardcoded routes with ViewRegistry system
 */
export default function AppRouter() {
  const location = useLocation();
  const filterStore = useFilterStore();
  const hasHydratedRef = React.useRef(false);
  const lastSearchRef = React.useRef('');
  
  // URL-first state management: Hydrate FilterStore when URL changes (Phase 2)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchString = searchParams.toString();
    
    // Only hydrate if URL actually changed and has parameters
    if (searchString && searchString !== lastSearchRef.current) {
      lastSearchRef.current = searchString;
      filterStore.hydrateFromUrl(searchParams);
      hasHydratedRef.current = true;
    }
  }, [location.search]); // Remove filterStore from dependencies
  
  // Browser history integration: Support back/forward navigation (Phase 2)
  useEffect(() => {
    const handlePopState = () => {
      // Re-hydrate FilterStore when user navigates via browser back/forward
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.toString()) {
        filterStore.hydrateFromUrl(searchParams);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [filterStore]);
  
  // Generate routes from ViewRegistry using the new hook
  const routes = useGeneratedRoutes({
    includeErrorBoundaries: true,
    includeLoadingStates: true,
    fallbackComponent: NotFound,
    // Remove defaultRedirectPath to use automatic generation which handles parameters properly
    // defaultRedirectPath: "/puzzle-focus"
  });
  
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Spread the array of route elements directly */}
          {routes}
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}