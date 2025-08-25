/**
 * ViewContext - Simplified after Phase 3 cleanup
 * Minimal context for basic view state
 */

import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface ViewContextState {
  activeViewId: string | null;
  setActiveView: (viewId: string | null) => void;
}

const ViewContext = createContext<ViewContextState | null>(null);

interface ViewContextProviderProps {
  children: ReactNode;
}

export function ViewContextProvider({ children }: ViewContextProviderProps) {
  const [activeViewId, setActiveView] = React.useState<string | null>('graph');
  
  const value = React.useMemo(() => ({
    activeViewId,
    setActiveView,
  }), [activeViewId]);

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  );
}

export function useViewContext() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useViewContext must be used within ViewContextProvider');
  }
  return context;
}

// View registry connected to viewConfigs
import { viewConfigs } from '@/lib/viewConfigs';

export const viewRegistry = {
  getAll: () => Object.entries(viewConfigs).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description,
    config
  })),
  get: (id: string) => viewConfigs[id] || null,
  register: (id: string, config: any) => {
    viewConfigs[id] = config;
  },
  unregister: (id: string) => {
    delete viewConfigs[id];
  },
  clear: () => {
    Object.keys(viewConfigs).forEach(key => delete viewConfigs[key]);
  }
};