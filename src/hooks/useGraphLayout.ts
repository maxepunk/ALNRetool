/**
 * useGraphLayout Hook (Refactored)
 * 
 * Orchestrates graph creation, filtering, and layout through composition.
 * Replaces monolithic implementation with 4 composable hooks.
 * 
 * @module hooks/useGraphLayout
 * 
 * **Architecture:**
 * - Composes 4 specialized hooks for separation of concerns
 * - Each hook manages its own memoization and dependencies
 * - Reduces re-render cascades through isolated updates
 * 
 * **Performance Improvements:**
 * - From 25 dependencies to ~4 hook compositions
 * - Each sub-hook only recalculates when its specific deps change
 * - Prevents full graph recalculation on minor filter changes
 */

import { useMemo } from 'react';
import type { GraphNode } from '@/lib/graph/types';
import type { Node, Edge } from '@xyflow/react';
import type { ViewConfig } from '@/lib/viewConfigs';

// Import the 2 composable hooks (filtering is now inline, relationships come from server)
import { useGraphVisibility } from './graph/useGraphVisibility';
import { useLayoutEngine } from './graph/useLayoutEngine';

interface UseGraphLayoutParams {
  nodes: Node[];
  edges: Edge[];
  viewConfig: ViewConfig;
  // Individual filter values to avoid object recreation
  searchTerm: string;
  selectedNodeId: string | null;
  connectionDepth: number | null;
  entityVisibility: {
    character: boolean;
    element: boolean;
    puzzle: boolean;
    timeline: boolean;
  };
  // Character filter primitives
  characterType: string;
  characterSelectedTiers: Set<string>;
  // Puzzle filter primitives
  puzzleSelectedActs: Set<string>;
  // Element filter primitives
  elementBasicTypes: Set<string>;
  elementStatus: Set<string>;
}

interface UseGraphLayoutResult {
  layoutedNodes: GraphNode[];
  filteredEdges: Edge[];
  totalUniverseNodes: number;
}

/**
 * Orchestrates the graph layout pipeline through hook composition.
 * Each sub-hook manages its own memoization for optimal performance.
 * 
 * **Pipeline:**
 * 1. Apply filters to server-provided nodes
 * 2. Use server-provided edges directly
 * 3. useGraphVisibility → Apply visibility rules
 * 4. useLayoutEngine → Position nodes
 * 
 * @param params - All graph configuration parameters
 * @returns Layouted nodes and edges ready for React Flow
 * 
 * @example
 * ```typescript
 * const { layoutedNodes, filteredEdges } = useGraphLayout({
 *   characters,
 *   elements,
 *   puzzles,
 *   timeline,
 *   viewConfig,
 *   // ... filters
 * });
 * ```
 */
export const useGraphLayout = ({
  nodes,
  edges,
  viewConfig,
  searchTerm,
  selectedNodeId,
  connectionDepth,
  entityVisibility,
  characterType,
  characterSelectedTiers,
  puzzleSelectedActs,
  elementBasicTypes,
  elementStatus,
}: UseGraphLayoutParams): UseGraphLayoutResult => {
  
  // Step 1: Apply filters to server-provided nodes
  // Convert server nodes to GraphNodes and apply filters
  const filteredNodes = useMemo(() => {
    return nodes
      .filter((node: any) => {
        // Skip placeholder nodes unless we want to show them
        if (node.data?.metadata?.isPlaceholder) {
          // TODO: Add option to show/hide placeholder nodes
          return true; // Show them for now to visualize data issues
        }
        
        // Apply search filter
        const label = node.data?.label;
        if (searchTerm && label && typeof label === 'string') {
          if (!label.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
          }
        }
        
        // Apply entity visibility filters
        const entityType = node.data?.metadata?.entityType;
        if (entityType && typeof entityType === 'string') {
          if (!entityVisibility[entityType as keyof typeof entityVisibility]) {
            return false;
          }
          
          // Apply entity-specific filters
          const entity = node.data?.entity;
          if (entity) {
            switch (entityType) {
              case 'character':
                // Character type filter
                if (characterType && characterType !== 'all' && entity.type !== characterType) {
                  return false;
                }
                // Character tier filter
                if (characterSelectedTiers.size > 0 && !characterSelectedTiers.has(entity.tier || '')) {
                  return false;
                }
                break;
                
              case 'puzzle':
                // Puzzle act filter - check timing array (matches nodeCreators.ts pattern)
                if (puzzleSelectedActs.size > 0) {
                  const puzzleTiming = (entity as any).timing || [];
                  const hasMatchingAct = puzzleTiming.some((act: string) => 
                    act && puzzleSelectedActs.has(act)
                  );
                  if (!hasMatchingAct) {
                    return false;
                  }
                }
                break;
                
              case 'element':
                // Element type filter
                if (elementBasicTypes.size > 0 && !elementBasicTypes.has(entity.basicType || '')) {
                  return false;
                }
                // Element status filter
                if (elementStatus.size > 0 && !elementStatus.has(entity.status || '')) {
                  return false;
                }
                break;
            }
          }
        }
        
        return true;
      })
      .map(node => ({
        ...node,
        type: node.type || 'default',
      } as GraphNode));
  }, [nodes, searchTerm, entityVisibility, characterType, characterSelectedTiers, 
      puzzleSelectedActs, elementBasicTypes, elementStatus]);
  
  // Step 2: Use server-provided edges directly, ensuring type compatibility
  const allEdges = edges as any[];
  
  // Step 3: Apply visibility rules
  // This hook memoizes based on selection and connection depth
  const { visibleNodes, visibleEdges } = useGraphVisibility({
    filteredNodes,
    allEdges,
    selectedNodeId,
    connectionDepth,
  });
  
  // Step 4: Apply layout to visible nodes
  // This hook memoizes based on nodes/edges/config
  const { layoutedNodes } = useLayoutEngine({
    visibleNodes,
    visibleEdges,
    viewConfig,
  });
  
  // Calculate total universe size for UI feedback
  const totalUniverseNodes = nodes.length;
  
  // Safely map GraphEdge[] to Edge[] for React Flow compatibility
  // This ensures data integrity is preserved during the conversion
  const filteredEdges: Edge[] = useMemo(() => {
    return visibleEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      animated: edge.animated,
      style: edge.style,
      data: edge.data,
      label: edge.label,
      labelStyle: edge.labelStyle,
      labelShowBg: edge.labelShowBg,
      labelBgStyle: edge.labelBgStyle,
      labelBgPadding: edge.labelBgPadding,
      labelBgBorderRadius: edge.labelBgBorderRadius,
      markerStart: edge.markerStart,
      markerEnd: edge.markerEnd,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      hidden: edge.hidden,
      deletable: edge.deletable,
      focusable: edge.focusable,
      selected: edge.selected,
      zIndex: edge.zIndex,
      interactionWidth: edge.interactionWidth,
    } satisfies Edge));
  }, [visibleEdges]);
  
  return {
    layoutedNodes,
    filteredEdges,
    totalUniverseNodes,
  };
};