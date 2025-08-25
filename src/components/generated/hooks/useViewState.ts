/**
 * useViewState Hook
 * 
 * Manages view state including URL synchronization, template variables,
 * and state validation for generated view components.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { ViewConfiguration } from '@/lib/graph/config/ViewConfiguration';
import type { ViewState } from '../types';

/**
 * Hook for managing view state with URL synchronization
 */
export function useViewState(config: ViewConfiguration) {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  // Initialize state from URL params and config defaults
  const initialState = useMemo(() => {
    const state: ViewState = {};
    
    // Start with config variables as defaults
    if (config.variables) {
      Object.entries(config.variables).forEach(([key, value]) => {
        state[key] = value;
      });
    }
    
    // Override with URL parameters if routing is configured
    if (config.ui?.routing?.parameters) {
      Object.entries(config.ui.routing.parameters).forEach(([key, paramConfig]) => {
        const urlValue = params[key];
        if (urlValue) {
          let processedValue: string | number = urlValue;
          
          // Apply type conversion
          if (paramConfig.type === 'number') {
            processedValue = Number(urlValue);
          }
          
          // Apply transform if provided
          if (paramConfig.transform) {
            processedValue = paramConfig.transform(processedValue);
          }
          
          state[key] = processedValue;
        }
      });
    }
    
    return state;
  }, [config, params]);

  const [viewState, setViewState] = useState<ViewState>(initialState);

  // Update state and optionally sync to URL
  const updateViewState = useCallback((updates: Partial<ViewState>) => {
    setViewState(prev => {
      const newState = { ...prev, ...updates };
      
      // Sync to URL if routing is configured
      if (config.ui?.routing?.syncToURL) {
        const basePath = config.ui.routing.basePath;
        const replaceHistory = config.ui.routing.replaceHistory ?? true;
        
        // Build URL with parameters
        let newPath = basePath;
        if (config.ui.routing.parameters) {
          const pathSegments: string[] = [];
          
          Object.entries(config.ui.routing.parameters).forEach(([key]) => {
            const value = newState[key];
            if (value !== undefined && value !== null) {
              pathSegments.push(String(value));
            }
          });
          
          if (pathSegments.length > 0) {
            newPath = `${basePath}/${pathSegments.join('/')}`;
          }
        }
        
        // Navigate to new URL
        if (newPath !== location.pathname) {
          navigate(newPath, { replace: replaceHistory });
        }
      }
      
      return newState;
    });
  }, [config, navigate, location.pathname]);

  // Determine if current state represents a valid selection for this view
  const isValidSelection = useMemo(() => {
    // If no controls are defined, assume valid
    if (!config.ui?.controls) {
      return true;
    }
    
    // Check if required selections are made
    const hasRequiredSelections = config.ui.controls.every(control => {
      // For entity selectors, check if a selection is made when needed
      if (control.type === 'entity-selector') {
        const value = viewState[control.statePath];
        
        // If the control has a showIf condition, only validate if visible
        if (control.showIf && !control.showIf(viewState)) {
          return true; // Hidden controls are automatically valid
        }
        
        // Check if value is provided when expected
        return value !== undefined && value !== null && value !== '';
      }
      
      return true; // Other controls are optional for validation
    });
    
    return hasRequiredSelections;
  }, [config.ui?.controls, viewState]);

  // Resolve template variables in the current state
  const resolvedVariables = useMemo(() => {
    const resolved: Record<string, unknown> = {};
    
    if (config.variables) {
      Object.entries(config.variables).forEach(([key, defaultValue]) => {
        resolved[key] = viewState[key] ?? defaultValue;
      });
    }
    
    return resolved;
  }, [config.variables, viewState]);

  // Effect to sync initial URL params to state
  useEffect(() => {
    if (config.ui?.routing?.syncToURL) {
      setViewState(initialState);
    }
  }, [initialState, config.ui?.routing?.syncToURL]);

  return {
    viewState,
    updateViewState,
    isValidSelection,
    resolvedVariables
  };
}