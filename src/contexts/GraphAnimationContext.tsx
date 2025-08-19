/**
 * Graph Animation Context
 * Provides unified animation state management for the entire graph
 * Coordinates hover effects, animations, and performance optimizations
 */

import React, { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import { useAnimationState } from '@/hooks/useAnimationState';
import type { Edge, Node } from '@xyflow/react';

interface GraphAnimationContextValue {
  // Animation state
  hoveredNodeId: string | null;
  hoveredEdgeId: string | null;
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  
  // Node handlers
  onNodeHoverStart: (nodeId: string) => void;
  onNodeHoverEnd: (nodeId: string) => void;
  onNodeClick: (nodeId: string) => void;
  
  // Edge handlers
  onEdgeHoverStart: (edgeId: string) => void;
  onEdgeHoverEnd: (edgeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
  
  // Registration
  registerConnection: (edgeId: string, sourceNodeId: string, targetNodeId: string) => void;
  
  // Utility functions
  isNodeHighlighted: (nodeId: string) => boolean;
  isEdgeHighlighted: (edgeId: string) => boolean;
  isNodePulsing: (nodeId: string) => boolean;
  isEdgeFlowing: (edgeId: string) => boolean;
  
  // Performance controls
  pauseAnimations: () => void;
  resumeAnimations: () => void;
  isAnimating: boolean;
}

const GraphAnimationContext = createContext<GraphAnimationContextValue | undefined>(undefined);

interface GraphAnimationProviderProps {
  children: ReactNode;
  nodes?: Node[];
  edges?: Edge[];
  enableConnectionHighlighting?: boolean;
  enableGroupHover?: boolean;
  maxHighlightedElements?: number;
}

/**
 * Provider component that manages animation state for the entire graph
 */
export function GraphAnimationProvider({
  children,
  edges = [],
  enableConnectionHighlighting = true,
  enableGroupHover = true,
  maxHighlightedElements = 50,
}: GraphAnimationProviderProps) {
  const animationState = useAnimationState({
    debounceDelay: 50,
    enableConnectionHighlighting,
    enableGroupHover,
    maxHighlightedElements,
  });

  // Register all connections when edges change
  React.useEffect(() => {
    animationState.clearConnections();
    edges.forEach(edge => {
      animationState.registerConnection(edge.id, edge.source, edge.target);
    });
  }, [edges, animationState]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<GraphAnimationContextValue>(() => ({
    hoveredNodeId: animationState.animationState.hoveredNodeId,
    hoveredEdgeId: animationState.animationState.hoveredEdgeId,
    highlightedNodeIds: animationState.animationState.highlightedNodeIds,
    highlightedEdgeIds: animationState.animationState.highlightedEdgeIds,
    
    onNodeHoverStart: animationState.onNodeHoverStart,
    onNodeHoverEnd: animationState.onNodeHoverEnd,
    onNodeClick: animationState.onNodeClick,
    
    onEdgeHoverStart: animationState.onEdgeHoverStart,
    onEdgeHoverEnd: animationState.onEdgeHoverEnd,
    onEdgeClick: animationState.onEdgeClick,
    
    registerConnection: animationState.registerConnection,
    
    isNodeHighlighted: animationState.isNodeHighlighted,
    isEdgeHighlighted: animationState.isEdgeHighlighted,
    isNodePulsing: animationState.isNodePulsing,
    isEdgeFlowing: animationState.isEdgeFlowing,
    
    pauseAnimations: animationState.pauseAnimations,
    resumeAnimations: animationState.resumeAnimations,
    isAnimating: animationState.animationState.isAnimating,
  }), [animationState]);

  return (
    <GraphAnimationContext.Provider value={contextValue}>
      {children}
    </GraphAnimationContext.Provider>
  );
}

/**
 * Hook to access the graph animation context
 * Returns null if context is not available (for optional usage)
 */
export function useGraphAnimation() {
  const context = useContext(GraphAnimationContext);
  // Return null instead of throwing to allow DetailPanel to work without animation context
  return context;
}

/**
 * Hook for node-specific animation state
 */
export function useNodeAnimation(nodeId: string) {
  const context = useGraphAnimation();
  
  // Always call hooks to satisfy React's rules
  const handleMouseEnter = useCallback(() => {
    context?.onNodeHoverStart(nodeId);
  }, [context, nodeId]);
  
  const handleMouseLeave = useCallback(() => {
    context?.onNodeHoverEnd(nodeId);
  }, [context, nodeId]);
  
  const handleClick = useCallback(() => {
    context?.onNodeClick(nodeId);
  }, [context, nodeId]);
  
  // Return safe defaults if context is not available
  if (!context) {
    return {
      isHovered: false,
      isHighlighted: false,
      isPulsing: false,
      handleMouseEnter: () => {},
      handleMouseLeave: () => {},
      handleClick: () => {},
    };
  }
  
  const isHovered = context.hoveredNodeId === nodeId;
  const isHighlighted = context.isNodeHighlighted(nodeId);
  const isPulsing = context.isNodePulsing(nodeId);
  
  return {
    isHovered,
    isHighlighted,
    isPulsing,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
  };
}

/**
 * Hook for edge-specific animation state
 */
export function useEdgeAnimation(edgeId: string) {
  const context = useGraphAnimation();
  
  // Always call hooks to satisfy React's rules
  const handleMouseEnter = useCallback(() => {
    context?.onEdgeHoverStart(edgeId);
  }, [context, edgeId]);
  
  const handleMouseLeave = useCallback(() => {
    context?.onEdgeHoverEnd(edgeId);
  }, [context, edgeId]);
  
  const handleClick = useCallback(() => {
    context?.onEdgeClick(edgeId);
  }, [context, edgeId]);
  
  // Return safe defaults if context is not available
  if (!context) {
    return {
      isHovered: false,
      isHighlighted: false,
      isFlowing: false,
      handleMouseEnter: () => {},
      handleMouseLeave: () => {},
      handleClick: () => {},
    };
  }
  
  const isHovered = context.hoveredEdgeId === edgeId;
  const isHighlighted = context.isEdgeHighlighted(edgeId);
  const isFlowing = context.isEdgeFlowing(edgeId);
  
  return {
    isHovered,
    isHighlighted,
    isFlowing,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
  };
}

/**
 * Hook to check if animations should be disabled (for performance)
 */
export function useAnimationPerformance(elementCount: number) {
  const context = useGraphAnimation();
  const PERFORMANCE_THRESHOLD = 100;
  
  const shouldReduceAnimations = elementCount > PERFORMANCE_THRESHOLD;
  
  React.useEffect(() => {
    if (context) {
      if (shouldReduceAnimations && context.isAnimating) {
        context.pauseAnimations();
      } else if (!shouldReduceAnimations && !context.isAnimating) {
        context.resumeAnimations();
      }
    }
  }, [shouldReduceAnimations, context]);
  
  return {
    shouldReduceAnimations,
    isAnimating: context?.isAnimating ?? false,
  };
}