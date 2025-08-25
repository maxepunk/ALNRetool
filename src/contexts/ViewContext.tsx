/**
 * ViewContext - Lightweight State Coordination for Generated Views
 * 
 * Phase 3: Clean architecture after URL-first state management
 * - Minimal bridge between ViewConfiguration and FilterStore
 * - URL state coordination only (no redundant state management)
 * - ViewRegistry for route generation
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useFilterStore } from '@/stores/filterStore';
import { parseUrlFilters } from '@/utils/urlState';
import type { ViewConfiguration } from '@/lib/graph/config/ViewConfiguration';
import type { ViewState } from '@/components/generated/types';

interface ViewContextState {
  // View registration
  activeViewId: string | null;
  setActiveView: (viewId: string | null) => void;
  
  // URL state coordination
  updateUrlFromViewState: (viewId: string, viewState: ViewState) => void;
  hydrateViewStateFromUrl: (viewId: string) => Partial<ViewState>;
  
  // Template resolution
  resolveTemplateVariables: (
    config: ViewConfiguration, 
    viewState: ViewState
  ) => Record<string, unknown>;
}

const ViewContext = createContext<ViewContextState | null>(null);

interface ViewContextProviderProps {
  children: ReactNode;
}

export function ViewContextProvider({ children }: ViewContextProviderProps) {
  const filterStore = useFilterStore();
  const [activeViewId, setActiveViewIdState] = React.useState<string | null>(null);
  
  // URL to ViewState hydration
  const hydrateViewStateFromUrl = useCallback((viewId: string): Partial<ViewState> => {
    const urlFilters = parseUrlFilters();
    
    // Hydrate FilterStore from URL
    if (Object.keys(urlFilters).length > 0) {
      filterStore.hydrateFromUrl(new URLSearchParams(window.location.search));
    }
    
    // Map FilterStore state to ViewState for specific views
    const viewState: Partial<ViewState> = {};
    
    if (viewId === 'node-connections') {
      const nodeFilters = filterStore.nodeConnectionsFilters;
      if (nodeFilters) {
        viewState.selectedNodeType = nodeFilters.nodeType;
        viewState.selectedNodeId = nodeFilters.selectedNodeId || undefined;
      }
      viewState.expansionDepth = filterStore.connectionDepth;
    }
    
    return viewState;
  }, [filterStore]);
  
  // ViewState to URL update
  const updateUrlFromViewState = useCallback((viewId: string, viewState: ViewState) => {
    // Update FilterStore from ViewState
    if (viewId === 'node-connections') {
      if (viewState.selectedNodeType) {
        filterStore.setNodeType(viewState.selectedNodeType as any);
      }
      if (viewState.selectedNodeId) {
        filterStore.setSelectedNodeId(viewState.selectedNodeId);
      }
      if (typeof viewState.expansionDepth === 'number') {
        filterStore.setConnectionDepth(viewState.expansionDepth);
      }
    }
    
    // Set active view only if it's different to prevent loops
    const filterViewType = mapConfigIdToFilterView(viewId);
    if (filterViewType && filterStore.activeView !== filterViewType) {
      filterStore.setActiveView(filterViewType);
    }
    
    // Sync to URL
    filterStore.syncToUrl(false);
  }, [filterStore]);
  
  // Template variable resolution
  const resolveTemplateVariables = useCallback((
    config: ViewConfiguration,
    viewState: ViewState
  ): Record<string, unknown> => {
    const resolved: Record<string, unknown> = {};
    
    // Start with config defaults
    if (config.variables) {
      Object.entries(config.variables).forEach(([key, defaultValue]) => {
        resolved[key] = defaultValue;
      });
    }
    
    // Override with ViewState values
    Object.entries(viewState).forEach(([key, value]) => {
      if (value !== undefined) {
        resolved[key] = sanitizeTemplateValue(value);
      }
    });
    
    // Special mappings
    if ('selectedNodeId' in viewState && viewState.selectedNodeId) {
      resolved.nodeId = viewState.selectedNodeId;
    }
    if ('selectedNodeType' in viewState && viewState.selectedNodeType) {
      resolved.nodeType = viewState.selectedNodeType;
    }
    if ('expansionDepth' in viewState && typeof viewState.expansionDepth === 'number') {
      resolved.maxDepth = viewState.expansionDepth;
    }
    
    return resolved;
  }, []);
  
  // Set active view
  const setActiveView = useCallback((viewId: string | null) => {
    // Skip if already active to prevent infinite loops
    if (viewId === activeViewId) return;
    
    setActiveViewIdState(viewId);
    
    if (viewId) {
      const filterViewType = mapConfigIdToFilterView(viewId);
      if (filterViewType) {
        filterStore.setActiveView(filterViewType);
      }
    }
  }, [filterStore, activeViewId]);
  
  const contextValue = useMemo(() => ({
    activeViewId,
    setActiveView,
    updateUrlFromViewState,
    hydrateViewStateFromUrl,
    resolveTemplateVariables
  }), [
    activeViewId,
    setActiveView,
    updateUrlFromViewState,
    hydrateViewStateFromUrl,
    resolveTemplateVariables
  ]);
  
  return (
    <ViewContext.Provider value={contextValue}>
      {children}
    </ViewContext.Provider>
  );
}

export function useViewContext(): ViewContextState {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useViewContext must be used within a ViewContextProvider');
  }
  return context;
}

// Helper functions
function mapConfigIdToFilterView(configId: string): 'puzzle-focus' | 'character-journey' | 'content-status' | 'node-connections' | 'timeline' | null {
  const mapping: Record<string, any> = {
    'puzzle-focus': 'puzzle-focus',
    'character-journey': 'character-journey',
    'content-status': 'content-status',
    'node-connections': 'node-connections',
    'timeline': 'timeline'
  };
  
  return mapping[configId] || null;
}

function sanitizeTemplateValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Basic sanitization
    const sanitized = value.replace(/<[^>]*>/g, '').trim();
    if (sanitized.match(/^[a-zA-Z0-9-_]+$/)) {
      return sanitized;
    }
    return sanitized.substring(0, 200);
  }
  
  if (typeof value === 'number') {
    return Math.max(0, Math.min(100, value));
  }
  
  return value;
}

/**
 * ViewRegistry - Global registry for ViewConfiguration instances
 */
export class ViewRegistry {
  private static instance: ViewRegistry;
  private views = new Map<string, ViewConfiguration>();
  
  static getInstance(): ViewRegistry {
    if (!ViewRegistry.instance) {
      ViewRegistry.instance = new ViewRegistry();
    }
    return ViewRegistry.instance;
  }
  
  register(config: ViewConfiguration): void {
    if (!this.views.has(config.id)) {
      this.views.set(config.id, config);
    }
  }
  
  unregister(viewId: string): void {
    this.views.delete(viewId);
  }
  
  get(viewId: string): ViewConfiguration | undefined {
    return this.views.get(viewId);
  }
  
  getAll(): ViewConfiguration[] {
    return Array.from(this.views.values());
  }
  
  clear(): void {
    this.views.clear();
  }
}

export const viewRegistry = ViewRegistry.getInstance();