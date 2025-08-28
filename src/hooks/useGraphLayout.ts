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
import type { Edge } from '@xyflow/react';
import type { Character, Puzzle, TimelineEvent, Element } from '@/types/notion/app';
import type { ViewConfig } from '@/lib/viewConfigs';

// Import the 4 composable hooks
import { useFilteredEntities } from './graph/useFilteredEntities';
import { useGraphRelationships } from './graph/useGraphRelationships';
import { useGraphVisibility } from './graph/useGraphVisibility';
import { useLayoutEngine } from './graph/useLayoutEngine';

interface UseGraphLayoutParams {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
  viewConfig: ViewConfig;
  // Individual filter values to avoid object recreation
  searchTerm: string;
  focusedNodeId: string | null;
  connectionDepth: number | null;
  filterMode: 'pure' | 'connected' | 'focused';
  focusRespectFilters: boolean;
  entityVisibility: {
    characters: boolean;
    elements: boolean;
    puzzles: boolean;
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
 * 1. useFilteredEntities → Create filtered nodes
 * 2. useGraphRelationships → Generate edges
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
  characters,
  elements,
  puzzles,
  timeline,
  viewConfig,
  searchTerm,
  focusedNodeId,
  connectionDepth,
  filterMode,
  focusRespectFilters,
  entityVisibility,
  characterType,
  characterSelectedTiers,
  puzzleSelectedActs,
  elementBasicTypes,
  elementStatus,
}: UseGraphLayoutParams): UseGraphLayoutResult => {
  
  // Step 1: Create filtered nodes
  // This hook memoizes based on entities and filter criteria
  const filteredNodes = useFilteredEntities({
    characters,
    elements,
    puzzles,
    timeline,
    viewConfig,
    searchTerm,
    entityVisibility,
    characterType,
    characterSelectedTiers,
    puzzleSelectedActs,
    elementBasicTypes,
    elementStatus,
  });
  
  // Step 2: Create all edges from relationships
  // This hook memoizes based on entity data only
  const allEdges = useGraphRelationships({
    characters,
    elements,
    puzzles,
    timeline,
  });
  
  // Step 3: Apply visibility rules
  // This hook memoizes based on filter mode and focus
  const { visibleNodes, visibleEdges } = useGraphVisibility({
    filteredNodes,
    allEdges,
    filterMode,
    focusedNodeId,
    connectionDepth,
    focusRespectFilters,
  });
  
  // Step 4: Apply layout to visible nodes
  // This hook memoizes based on nodes/edges/config
  const { layoutedNodes } = useLayoutEngine({
    visibleNodes,
    visibleEdges,
    viewConfig,
  });
  
  // Calculate total universe size for UI feedback
  const totalUniverseNodes = characters.length + elements.length + puzzles.length + timeline.length;
  
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