import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { GraphContext, createGraphContext } from '@/lib/graph/GraphContext';

/**
 * React Context for sharing GraphContext across components
 */
const GraphContextReact = createContext<GraphContext | null>(null);

/**
 * Provider Props
 */
interface GraphContextProviderProps {
  children: ReactNode;
  context?: GraphContext; // Allow injecting custom context for testing
}

/**
 * GraphContextProvider component
 * Provides a GraphContext instance to all child components
 */
export function GraphContextProvider({ 
  children, 
  context 
}: GraphContextProviderProps) {
  // Create or use provided context
  const graphContext = useMemo(() => {
    return context || createGraphContext();
  }, [context]);

  return (
    <GraphContextReact.Provider value={graphContext}>
      {children}
    </GraphContextReact.Provider>
  );
}

/**
 * Hook to access GraphContext
 * @throws Error if used outside of GraphContextProvider
 */
export function useGraphContext(): GraphContext {
  const context = useContext(GraphContextReact);
  
  if (!context) {
    throw new Error(
      'useGraphContext must be used within a GraphContextProvider'
    );
  }
  
  return context;
}

/**
 * Optional hook that returns null if no context is available
 * Useful for components that can work with or without the context
 */
export function useGraphContextOptional(): GraphContext | null {
  return useContext(GraphContextReact);
}