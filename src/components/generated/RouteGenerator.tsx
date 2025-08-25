/**
 * RouteGenerator - Simplified automatic route generation
 * Phase 3: Clean architecture with reduced complexity
 */

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import type { ViewConfiguration } from '@/lib/graph/config/ViewConfiguration';
import ViewComponentFactory from './ViewComponentFactory';
import { viewRegistry } from '@/contexts/ViewContext';
import LoadingSpinner from '@/components/common/LoadingSkeleton';
import { ViewErrorBoundary } from '@/components/common/ViewErrorBoundary';

export interface RouteGeneratorConfig {
  basePath?: string;
  defaultRedirectPath?: string;
  includeErrorBoundaries?: boolean;
  includeLoadingStates?: boolean;
  fallbackComponent?: React.ComponentType;
}

function generateRouteComponent(config: ViewConfiguration, options: RouteGeneratorConfig = {}) {
  const { includeErrorBoundaries = true, includeLoadingStates = true } = options;

  const RouteComponent: React.FC = () => {
    let component = <ViewComponentFactory config={config} />;

    if (includeLoadingStates) {
      component = <Suspense fallback={<LoadingSpinner />}>{component}</Suspense>;
    }

    if (includeErrorBoundaries) {
      component = (
        <ViewErrorBoundary viewType={config.id as any} onNavigateHome={() => window.location.href = '/'}>
          {component}
        </ViewErrorBoundary>
      );
    }

    return component;
  };

  RouteComponent.displayName = `RouteComponent(${config.id})`;
  return RouteComponent;
}

function generateRoutePath(config: ViewConfiguration, basePath = ''): string {
  const configPath = config.ui?.routing?.basePath || `/${config.id}`;
  const fullPath = `${basePath}${configPath}`.replace(/\/+/g, '/');
  
  // Handle parameters from config
  if (config.ui?.routing?.parameters) {
    const params = Array.isArray(config.ui.routing.parameters)
      ? config.ui.routing.parameters.map(p => `:${p}`)
      : Object.keys(config.ui.routing.parameters).map(p => `:${p}`);
    
    return params.length > 0 ? `${fullPath}/${params.join('/')}` : fullPath;
  }
  
  // Default parameter patterns
  switch (config.id) {
    case 'puzzle-focus': return `${fullPath}/:puzzleId`;
    case 'character-journey': return `${fullPath}/:characterId`;
    case 'node-connections': return `${fullPath}/:nodeType/:nodeId`;
    default: return fullPath;
  }
}

export function generateRoutes(config: RouteGeneratorConfig = {}): React.ReactElement {
  const { basePath = '', defaultRedirectPath, fallbackComponent: FallbackComponent } = config;
  const registeredViews = viewRegistry.getAll();
  
  const routeElements = registeredViews.map(viewConfig => {
    const routePath = generateRoutePath(viewConfig, basePath);
    const RouteComponent = generateRouteComponent(viewConfig, config);
    
    return <Route key={viewConfig.id} path={routePath} element={<RouteComponent />} />;
  });

  const redirect = defaultRedirectPath || 
    (registeredViews.length > 0 ? generateRoutePath(registeredViews[0]!, basePath).split(':')[0] : '/');

  return (
    <Routes>
      <Route index element={<Navigate to={redirect || '/'} replace />} />
      {routeElements}
      {FallbackComponent && <Route path="*" element={<FallbackComponent />} />}
    </Routes>
  );
}

/**
 * Route utilities for navigation
 */
export const RouteUtils = {
  getAllRoutes: (basePath = '') => {
    return viewRegistry.getAll().map(config => ({
      id: config.id,
      name: config.name,
      path: generateRoutePath(config, basePath),
      config
    }));
  },
  
  getRouteForView: (viewId: string, basePath = '') => {
    const config = viewRegistry.get(viewId);
    if (!config) return null;
    
    return {
      id: config.id,
      name: config.name,
      path: generateRoutePath(config, basePath),
      config
    };
  },
  
  generateNavUrl: (viewId: string, params: Record<string, string> = {}, basePath = '') => {
    const config = viewRegistry.get(viewId);
    if (!config) return null;
    
    let path = generateRoutePath(config, basePath);
    
    // Replace parameters with values
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        path = path.replace(`:${key}`, encodeURIComponent(value));
      }
    });
    
    // Remove any remaining parameters
    path = path.replace(/\/:[^/]*\??/g, '');
    
    return path;
  }
};

/**
 * Hook for generating routes within React components
 * Returns an array of Route elements for spreading in Routes
 */
export function useGeneratedRoutes(config: RouteGeneratorConfig = {}): React.ReactElement[] {
  const { basePath = '', defaultRedirectPath, fallbackComponent: FallbackComponent } = config;
  
  const [routes] = React.useState<React.ReactElement[]>(() => {
    const registeredViews = viewRegistry.getAll();
    
    const routeElements = registeredViews.map(viewConfig => {
      const routePath = generateRoutePath(viewConfig, basePath);
      const RouteComponent = generateRouteComponent(viewConfig, config);
      return <Route key={viewConfig.id} path={routePath} element={<RouteComponent />} />;
    });

    const redirect = defaultRedirectPath || 
      (registeredViews.length > 0 ? generateRoutePath(registeredViews[0]!, basePath).split(':')[0] : '/');

    return [
      <Route key="index" index element={<Navigate to={redirect || '/'} replace />} />,
      ...routeElements,
      ...(FallbackComponent ? [<Route key="fallback" path="*" element={<FallbackComponent />} />] : [])
    ];
  });

  return routes;
}

/**
 * Register common views
 */
export function registerCommonViews() {
  // Import configs lazily to avoid circular dependencies
  import('@/lib/graph/config/views/PuzzleFocusConfig').then(m => viewRegistry.register(m.PuzzleFocusConfig));
  import('@/lib/graph/config/views/CharacterJourneyConfig').then(m => viewRegistry.register(m.CharacterJourneyConfig));
  import('@/lib/graph/config/views/TimelineConfig').then(m => viewRegistry.register(m.TimelineConfig));
  import('@/lib/graph/config/views/NodeConnectionsConfig').then(m => viewRegistry.register(m.NodeConnectionsConfig));
  
  // Content status view
  viewRegistry.register({
    id: 'content-status',
    name: 'Content Status',
    description: 'Review content approval status',
    ui: {
      title: 'Content Status',
      description: 'Track content through review and approval process',
      routing: { basePath: '/content-status' }
    }
  } as ViewConfiguration);
}