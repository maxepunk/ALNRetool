/**
 * Animation State Management Hook
 * Coordinates animation states across graph components for unified hover/interaction effects
 * 
 * Features:
 * - Tracks hover states for nodes and edges
 * - Coordinates edge highlighting when connected nodes are hovered
 * - Debounces rapid state changes for performance
 * - Supports group hover patterns
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { debounceAnimation, prefersReducedMotion } from '@/lib/animations';

interface AnimationState {
  // Hovered elements
  hoveredNodeId: string | null;
  hoveredEdgeId: string | null;
  
  // Related elements (highlighted due to connections)
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  
  // Animation triggers
  pulsingNodeIds: Set<string>;
  flowingEdgeIds: Set<string>;
  
  // Performance flags
  isAnimating: boolean;
  reducedMotion: boolean;
}

interface ConnectionMap {
  // Node ID -> Connected Edge IDs
  nodeToEdges: Map<string, Set<string>>;
  // Edge ID -> Source and Target Node IDs
  edgeToNodes: Map<string, { source: string; target: string }>;
}

interface UseAnimationStateOptions {
  /** Debounce delay for hover state changes (ms) */
  debounceDelay?: number;
  /** Enable connected element highlighting */
  enableConnectionHighlighting?: boolean;
  /** Enable group hover effects */
  enableGroupHover?: boolean;
  /** Maximum number of elements to highlight at once (performance) */
  maxHighlightedElements?: number;
}

interface UseAnimationStateReturn {
  // Current state
  animationState: AnimationState;
  
  // Node interactions
  onNodeHoverStart: (nodeId: string) => void;
  onNodeHoverEnd: (nodeId: string) => void;
  onNodeClick: (nodeId: string) => void;
  
  // Edge interactions
  onEdgeHoverStart: (edgeId: string) => void;
  onEdgeHoverEnd: (edgeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
  
  // Connection registration
  registerConnection: (edgeId: string, sourceNodeId: string, targetNodeId: string) => void;
  unregisterConnection: (edgeId: string) => void;
  clearConnections: () => void;
  
  // Animation triggers
  triggerPulse: (nodeId: string, duration?: number) => void;
  triggerFlow: (edgeId: string, duration?: number) => void;
  
  // Utility functions
  isNodeHighlighted: (nodeId: string) => boolean;
  isEdgeHighlighted: (edgeId: string) => boolean;
  isNodePulsing: (nodeId: string) => boolean;
  isEdgeFlowing: (edgeId: string) => boolean;
  
  // Performance controls
  pauseAnimations: () => void;
  resumeAnimations: () => void;
  resetAnimationState: () => void;
}

/**
 * Hook for managing animation states across graph components
 */
export function useAnimationState({
  debounceDelay = 100,
  enableConnectionHighlighting = true,
  maxHighlightedElements = 50,
}: UseAnimationStateOptions = {}): UseAnimationStateReturn {
  // Core animation state
  const [animationState, setAnimationState] = useState<AnimationState>({
    hoveredNodeId: null,
    hoveredEdgeId: null,
    highlightedNodeIds: new Set(),
    highlightedEdgeIds: new Set(),
    pulsingNodeIds: new Set(),
    flowingEdgeIds: new Set(),
    isAnimating: false,
    reducedMotion: prefersReducedMotion(),
  });
  
  // Connection mapping for relationship tracking
  const connectionMapRef = useRef<ConnectionMap>({
    nodeToEdges: new Map(),
    edgeToNodes: new Map(),
  });
  
  // Timers for temporary animations
  const animationTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Register a connection between nodes via an edge
  const registerConnection = useCallback((edgeId: string, sourceNodeId: string, targetNodeId: string) => {
    const { nodeToEdges, edgeToNodes } = connectionMapRef.current;
    
    // Update edge to nodes mapping
    edgeToNodes.set(edgeId, { source: sourceNodeId, target: targetNodeId });
    
    // Update node to edges mapping for source
    if (!nodeToEdges.has(sourceNodeId)) {
      nodeToEdges.set(sourceNodeId, new Set());
    }
    nodeToEdges.get(sourceNodeId)?.add(edgeId);
    
    // Update node to edges mapping for target
    if (!nodeToEdges.has(targetNodeId)) {
      nodeToEdges.set(targetNodeId, new Set());
    }
    nodeToEdges.get(targetNodeId)?.add(edgeId);
  }, []);
  
  // Unregister a connection
  const unregisterConnection = useCallback((edgeId: string) => {
    const { nodeToEdges, edgeToNodes } = connectionMapRef.current;
    
    const nodes = edgeToNodes.get(edgeId);
    if (nodes) {
      // Remove edge from source node's set
      nodeToEdges.get(nodes.source)?.delete(edgeId);
      // Remove edge from target node's set
      nodeToEdges.get(nodes.target)?.delete(edgeId);
      // Remove edge from mapping
      edgeToNodes.delete(edgeId);
    }
  }, []);
  
  // Clear all connections
  const clearConnections = useCallback(() => {
    connectionMapRef.current = {
      nodeToEdges: new Map(),
      edgeToNodes: new Map(),
    };
  }, []);
  
  // Get connected elements when a node is hovered
  const getConnectedElements = useCallback((nodeId: string): { nodeIds: Set<string>; edgeIds: Set<string> } => {
    const { nodeToEdges, edgeToNodes } = connectionMapRef.current;
    const connectedNodeIds = new Set<string>();
    const connectedEdgeIds = new Set<string>();
    
    if (!enableConnectionHighlighting) {
      return { nodeIds: connectedNodeIds, edgeIds: connectedEdgeIds };
    }
    
    // Get all edges connected to this node
    const edges = nodeToEdges.get(nodeId);
    if (edges) {
      edges.forEach(edgeId => {
        connectedEdgeIds.add(edgeId);
        
        // Get the other node connected by this edge
        const nodes = edgeToNodes.get(edgeId);
        if (nodes) {
          if (nodes.source !== nodeId) connectedNodeIds.add(nodes.source);
          if (nodes.target !== nodeId) connectedNodeIds.add(nodes.target);
        }
      });
    }
    
    // Limit highlighted elements for performance
    if (connectedEdgeIds.size + connectedNodeIds.size > maxHighlightedElements) {
      // Prioritize direct connections only
      return {
        nodeIds: new Set(),
        edgeIds: new Set(Array.from(connectedEdgeIds).slice(0, maxHighlightedElements)),
      };
    }
    
    return { nodeIds: connectedNodeIds, edgeIds: connectedEdgeIds };
  }, [enableConnectionHighlighting, maxHighlightedElements]);
  
  // Debounced hover handlers
  const debouncedNodeHover = useMemo(
    () => debounceAnimation((nodeId: string | null) => {
      if (nodeId) {
        const connected = getConnectedElements(nodeId);
        setAnimationState(prev => ({
          ...prev,
          hoveredNodeId: nodeId,
          highlightedNodeIds: connected.nodeIds,
          highlightedEdgeIds: connected.edgeIds,
          isAnimating: true,
        }));
      } else {
        setAnimationState(prev => ({
          ...prev,
          hoveredNodeId: null,
          highlightedNodeIds: new Set(),
          highlightedEdgeIds: new Set(),
          isAnimating: false,
        }));
      }
    }, debounceDelay),
    [debounceDelay, getConnectedElements]
  );
  
  // Node hover handlers
  const onNodeHoverStart = useCallback((nodeId: string) => {
    debouncedNodeHover(nodeId);
  }, [debouncedNodeHover]);
  
  const onNodeHoverEnd = useCallback(() => {
    debouncedNodeHover(null);
  }, [debouncedNodeHover]);
  
  // Edge hover handlers
  const onEdgeHoverStart = useCallback((edgeId: string) => {
    const { edgeToNodes } = connectionMapRef.current;
    const nodes = edgeToNodes.get(edgeId);
    
    setAnimationState(prev => ({
      ...prev,
      hoveredEdgeId: edgeId,
      highlightedNodeIds: nodes ? new Set([nodes.source, nodes.target]) : new Set(),
      isAnimating: true,
    }));
  }, []);
  
  const onEdgeHoverEnd = useCallback(() => {
    setAnimationState(prev => ({
      ...prev,
      hoveredEdgeId: null,
      highlightedNodeIds: new Set(),
      isAnimating: false,
    }));
  }, []);
  
  // Click handlers for temporary animations
  const onNodeClick = useCallback((nodeId: string) => {
    triggerPulse(nodeId, 1000);
  }, []);
  
  const onEdgeClick = useCallback((edgeId: string) => {
    triggerFlow(edgeId, 1500);
  }, []);
  
  // Trigger pulse animation on a node
  const triggerPulse = useCallback((nodeId: string, duration: number = 1000) => {
    // Clear existing timer for this node
    const existingTimer = animationTimersRef.current.get(`pulse-${nodeId}`);
    if (existingTimer) clearTimeout(existingTimer);
    
    // Add to pulsing nodes
    setAnimationState(prev => ({
      ...prev,
      pulsingNodeIds: new Set(prev.pulsingNodeIds).add(nodeId),
    }));
    
    // Set timer to remove after duration
    const timer = setTimeout(() => {
      setAnimationState(prev => {
        const newPulsing = new Set(prev.pulsingNodeIds);
        newPulsing.delete(nodeId);
        return { ...prev, pulsingNodeIds: newPulsing };
      });
      animationTimersRef.current.delete(`pulse-${nodeId}`);
    }, duration);
    
    animationTimersRef.current.set(`pulse-${nodeId}`, timer);
  }, []);
  
  // Trigger flow animation on an edge
  const triggerFlow = useCallback((edgeId: string, duration: number = 1500) => {
    // Clear existing timer for this edge
    const existingTimer = animationTimersRef.current.get(`flow-${edgeId}`);
    if (existingTimer) clearTimeout(existingTimer);
    
    // Add to flowing edges
    setAnimationState(prev => ({
      ...prev,
      flowingEdgeIds: new Set(prev.flowingEdgeIds).add(edgeId),
    }));
    
    // Set timer to remove after duration
    const timer = setTimeout(() => {
      setAnimationState(prev => {
        const newFlowing = new Set(prev.flowingEdgeIds);
        newFlowing.delete(edgeId);
        return { ...prev, flowingEdgeIds: newFlowing };
      });
      animationTimersRef.current.delete(`flow-${edgeId}`);
    }, duration);
    
    animationTimersRef.current.set(`flow-${edgeId}`, timer);
  }, []);
  
  // Utility functions
  const isNodeHighlighted = useCallback((nodeId: string): boolean => {
    return animationState.hoveredNodeId === nodeId || 
           animationState.highlightedNodeIds.has(nodeId);
  }, [animationState]);
  
  const isEdgeHighlighted = useCallback((edgeId: string): boolean => {
    return animationState.hoveredEdgeId === edgeId || 
           animationState.highlightedEdgeIds.has(edgeId);
  }, [animationState]);
  
  const isNodePulsing = useCallback((nodeId: string): boolean => {
    return animationState.pulsingNodeIds.has(nodeId);
  }, [animationState]);
  
  const isEdgeFlowing = useCallback((edgeId: string): boolean => {
    return animationState.flowingEdgeIds.has(edgeId);
  }, [animationState]);
  
  // Performance controls
  const pauseAnimations = useCallback(() => {
    setAnimationState(prev => ({ ...prev, isAnimating: false }));
  }, []);
  
  const resumeAnimations = useCallback(() => {
    setAnimationState(prev => ({ ...prev, isAnimating: true }));
  }, []);
  
  const resetAnimationState = useCallback(() => {
    // Clear all timers
    animationTimersRef.current.forEach(timer => clearTimeout(timer));
    animationTimersRef.current.clear();
    
    // Reset state
    setAnimationState({
      hoveredNodeId: null,
      hoveredEdgeId: null,
      highlightedNodeIds: new Set(),
      highlightedEdgeIds: new Set(),
      pulsingNodeIds: new Set(),
      flowingEdgeIds: new Set(),
      isAnimating: false,
      reducedMotion: prefersReducedMotion(),
    });
  }, []);
  
  return {
    animationState,
    
    // Node interactions
    onNodeHoverStart,
    onNodeHoverEnd,
    onNodeClick,
    
    // Edge interactions
    onEdgeHoverStart,
    onEdgeHoverEnd,
    onEdgeClick,
    
    // Connection registration
    registerConnection,
    unregisterConnection,
    clearConnections,
    
    // Animation triggers
    triggerPulse,
    triggerFlow,
    
    // Utility functions
    isNodeHighlighted,
    isEdgeHighlighted,
    isNodePulsing,
    isEdgeFlowing,
    
    // Performance controls
    pauseAnimations,
    resumeAnimations,
    resetAnimationState,
  };
}

/**
 * Hook for coordinating animations between parent and child components
 * Useful for group hover effects and nested animations
 */
export function useGroupAnimation(_groupId: string) {
  const [isGroupHovered, setIsGroupHovered] = useState(false);
  const [childHoverStates, setChildHoverStates] = useState<Map<string, boolean>>(new Map());
  
  const onGroupHoverStart = useCallback(() => {
    setIsGroupHovered(true);
  }, []);
  
  const onGroupHoverEnd = useCallback(() => {
    setIsGroupHovered(false);
  }, []);
  
  const onChildHoverStart = useCallback((childId: string) => {
    setChildHoverStates(prev => {
      const next = new Map(prev);
      next.set(childId, true);
      return next;
    });
  }, []);
  
  const onChildHoverEnd = useCallback((childId: string) => {
    setChildHoverStates(prev => {
      const next = new Map(prev);
      next.set(childId, false);
      return next;
    });
  }, []);
  
  const isAnyChildHovered = useMemo(() => {
    return Array.from(childHoverStates.values()).some(state => state);
  }, [childHoverStates]);
  
  return {
    isGroupHovered,
    isAnyChildHovered,
    onGroupHoverStart,
    onGroupHoverEnd,
    onChildHoverStart,
    onChildHoverEnd,
  };
}