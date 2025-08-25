/**
 * React Flow Graph Layout Management Hook
 * Handles automatic layout calculation and manual node positioning
 * 
 * Testing Note: This is a React Flow integration hook - tested via integration tests
 * No unit tests as this is a thin wrapper around third-party library
 */

import { useState, useCallback, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { 
  applyDagreLayout, 
  applyHierarchicalLayout,
  LAYOUT_PRESETS,
} from '@/lib/graph/layouts';
// ForceLayoutAlgorithm and TraversalEngine removed in Phase 3
import type { GraphData, GraphNode, GraphEdge, LayoutConfig } from '@/lib/graph/types';


export type LayoutType = 'dagre' | 'hierarchical' | 'circular' | 'grid' | 'force';
export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

interface UseGraphLayoutOptions {
  defaultLayout?: LayoutType;
  defaultDirection?: LayoutDirection;
}


interface UseGraphLayoutReturn {
  // Current layout settings
  layoutType: LayoutType;
  layoutDirection: LayoutDirection;
  isLayouting: boolean;
  
  // Layout actions
  applyLayout: (nodes: Node[], edges: Edge[]) => Node[];
  setLayoutType: (type: LayoutType) => void;
  setLayoutDirection: (direction: LayoutDirection) => void;
  autoLayout: (graphData: GraphData) => GraphData;
  
  // Presets
  applyPreset: (presetName: keyof typeof LAYOUT_PRESETS) => LayoutConfig;
}

/**
 * Custom hook for managing graph layouts
 */
export function useGraphLayout({
  defaultLayout = 'dagre',
  defaultDirection = 'TB',
}: UseGraphLayoutOptions = {}): UseGraphLayoutReturn {
  const [layoutType, setLayoutType] = useState<LayoutType>(defaultLayout);
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>(defaultDirection);
  const [isLayouting, setIsLayouting] = useState(false);
  
  // Build layout config based on current settings
  const layoutConfig = useMemo((): LayoutConfig => {
    const baseConfig = {
      direction: layoutDirection as 'LR' | 'TB',
      center: true,
    };
    
    switch (layoutType) {
      case 'dagre':
        return {
          ...baseConfig,
          nodeSeparation: 80,
          rankSeparation: 120,
        };
        
      case 'hierarchical':
        return {
          ...baseConfig,
          nodeSeparation: 100,
          rankSeparation: 150,
        };
        
      case 'circular':
        return {
          ...baseConfig,
          nodeSeparation: 120,
          rankSeparation: 120,
          // Circular layout doesn't use direction
          direction: 'TB',
        };
        
      case 'grid':
        return {
          ...baseConfig,
          nodeSeparation: 100,
          rankSeparation: 100,
        };
        
      case 'force':
        return {
          ...baseConfig,
          nodeSeparation: 150,
          rankSeparation: 150,
        };
        
      default:
        return {
          ...baseConfig,
          nodeSeparation: 50,
          rankSeparation: 150,
        };
    }
  }, [layoutType, layoutDirection]);
  
  // Apply layout to nodes
  const applyLayout = useCallback((
    nodes: Node[],
    edges: Edge[]
  ): Node[] => {
    setIsLayouting(true);
    
    try {
      let layoutedNodes: Node[];
      
      // Apply the appropriate layout algorithm
      switch (layoutType) {
        case 'dagre':
        case 'grid':
        case 'circular':
          layoutedNodes = applyDagreLayout(nodes as GraphNode[], edges as GraphEdge[], layoutConfig);
          break;
          
        case 'hierarchical':
          layoutedNodes = applyHierarchicalLayout(nodes as GraphNode[], edges as GraphEdge[], layoutConfig);
          break;
          
        case 'force':
          // Force layout removed in Phase 3 - fallback to dagre
          layoutedNodes = applyDagreLayout(nodes as GraphNode[], edges as GraphEdge[], layoutConfig);
          break;
          
        default:
          layoutedNodes = nodes;
      }
      
      return layoutedNodes;
    } finally {
      setIsLayouting(false);
    }
  }, [layoutType, layoutConfig]);
  
  // Auto-layout graph data
  const autoLayout = useCallback((graphData: GraphData): GraphData => {
    // This is a synchronous version for initial layout
    const layoutedNodes = applyDagreLayout(
      graphData.nodes,
      graphData.edges,
      layoutConfig
    );
    
    return {
      ...graphData,
      nodes: layoutedNodes,
    };
  }, [layoutConfig]);
  
  // Apply a preset configuration
  const applyPreset = useCallback((presetName: keyof typeof LAYOUT_PRESETS): LayoutConfig => {
    const preset = LAYOUT_PRESETS[presetName];
    
    // Update layout type based on preset characteristics
    if (presetName === 'puzzleFocus') {
      setLayoutType('hierarchical'); // Puzzle focus uses hierarchical for clear layers
    } else if (presetName === 'characterJourney') {
      setLayoutType('dagre'); // Character journey uses standard dagre
    } else if (presetName === 'contentStatus') {
      setLayoutType('grid'); // Content status uses grid layout
    } else {
      setLayoutType('dagre'); // Default fallback
    }
    
    // Update direction if specified in preset
    if (preset.direction) {
      setLayoutDirection(preset.direction);
    }
    
    return preset;
  }, []);
  
  return {
    // Current layout settings
    layoutType,
    layoutDirection,
    isLayouting,
    
    // Layout actions
    applyLayout,
    setLayoutType,
    setLayoutDirection,
    autoLayout,
    
    // Presets
    applyPreset,
  };
}

/**
 * Hook for manual node positioning and arrangement
 */
export function useNodePositioning() {
  // Align nodes horizontally
  const alignHorizontally = useCallback((nodes: Node[]): Node[] => {
    if (nodes.length < 2) return nodes;
    
    const avgY = nodes.reduce((sum, node) => sum + node.position.y, 0) / nodes.length;
    
    return nodes.map(node => ({
      ...node,
      position: {
        ...node.position,
        y: avgY,
      },
    }));
  }, []);
  
  // Align nodes vertically
  const alignVertically = useCallback((nodes: Node[]): Node[] => {
    if (nodes.length < 2) return nodes;
    
    const avgX = nodes.reduce((sum, node) => sum + node.position.x, 0) / nodes.length;
    
    return nodes.map(node => ({
      ...node,
      position: {
        ...node.position,
        x: avgX,
      },
    }));
  }, []);
  
  // Distribute nodes evenly horizontally
  const distributeHorizontally = useCallback((nodes: Node[]): Node[] => {
    if (nodes.length < 3) return nodes;
    
    const sortedNodes = [...nodes].sort((a, b) => a.position.x - b.position.x);
    const firstNode = sortedNodes[0];
    const lastNode = sortedNodes[sortedNodes.length - 1];
    
    if (!firstNode || !lastNode) return nodes;
    
    const minX = firstNode.position.x;
    const maxX = lastNode.position.x;
    const spacing = (maxX - minX) / (nodes.length - 1);
    
    return sortedNodes.map((node, index) => ({
      ...node,
      position: {
        ...node.position,
        x: minX + spacing * index,
      },
    }));
  }, []);
  
  // Distribute nodes evenly vertically
  const distributeVertically = useCallback((nodes: Node[]): Node[] => {
    if (nodes.length < 3) return nodes;
    
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);
    const firstNode = sortedNodes[0];
    const lastNode = sortedNodes[sortedNodes.length - 1];
    
    if (!firstNode || !lastNode) return nodes;
    
    const minY = firstNode.position.y;
    const maxY = lastNode.position.y;
    const spacing = (maxY - minY) / (nodes.length - 1);
    
    return sortedNodes.map((node, index) => ({
      ...node,
      position: {
        ...node.position,
        y: minY + spacing * index,
      },
    }));
  }, []);
  
  // Arrange nodes in a circle
  const arrangeInCircle = useCallback((nodes: Node[], center = { x: 400, y: 400 }, radius = 300): Node[] => {
    const angleStep = (2 * Math.PI) / nodes.length;
    
    return nodes.map((node, index) => {
      const angle = index * angleStep;
      return {
        ...node,
        position: {
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
        },
      };
    });
  }, []);
  
  // Arrange nodes in a grid
  const arrangeInGrid = useCallback((nodes: Node[], columns = 4, spacing = { x: 200, y: 150 }): Node[] => {
    return nodes.map((node, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      return {
        ...node,
        position: {
          x: col * spacing.x,
          y: row * spacing.y,
        },
      };
    });
  }, []);
  
  return {
    alignHorizontally,
    alignVertically,
    distributeHorizontally,
    distributeVertically,
    arrangeInCircle,
    arrangeInGrid,
  };
}