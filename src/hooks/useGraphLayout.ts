import { useMemo } from 'react';
import type { Edge } from '@xyflow/react';
import { createAllNodes } from '@/lib/graph/nodeCreators';
import { resolveAllRelationships } from '@/lib/graph/relationships';
import { applyPureDagreLayout } from '@/lib/graph/layout/dagre';
import { getVisibleNodeIds } from '@/lib/graph/filtering';
import type { GraphNode } from '@/lib/graph/types';
import type { Character, Puzzle, TimelineEvent, Element } from '@/types/notion/app';
import type { ViewConfig } from '@/lib/viewConfigs';

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
 * Encapsulates the complex logic of creating, filtering, and laying out the graph.
 * This hook provides a SINGLE, SYNCHRONOUS calculation of the graph state,
 * eliminating the visual desync issues caused by deferred values.
 * 
 * Designed for simplicity and reliability over micro-optimizations.
 * Perfect for an internal tool used by 2-3 designers.
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
  return useMemo(() => {
    // Step 1: Create filtered nodes using existing nodeCreators
    const filteredNodes = createAllNodes(
      characters,
      elements,
      puzzles,
      timeline,
      searchTerm,
      entityVisibility,
      characterType,
      characterSelectedTiers,
      puzzleSelectedActs,
      elementBasicTypes,
      elementStatus,
      viewConfig
    );

    // Step 2: Create all edges
    const allEdges = resolveAllRelationships(characters, elements, puzzles, timeline);

    // Step 3: Get visible node IDs based on filter mode
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const visibleNodeIds = getVisibleNodeIds(
      filterMode,
      filteredNodeIds,
      allEdges,
      focusedNodeId,
      connectionDepth,
      focusRespectFilters
    );

    // Step 4: Build final nodes - only include already-filtered nodes
    const nodeMap = new Map(filteredNodes.map(n => [n.id, n]));
    const finalNodes = Array.from(visibleNodeIds)
      .map(nodeId => nodeMap.get(nodeId))
      .filter((node): node is GraphNode => node !== undefined)
      .map(node => ({
        ...node,
        data: {
          ...node.data,
          metadata: {
            ...node.data.metadata,
            isFiltered: filteredNodeIds.has(node.id),
            isFocused: node.id === focusedNodeId
          }
        }
      }));

    // Step 5: Filter edges for visible nodes
    const finalEdges = allEdges.filter(
      edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );

    // Step 6: Apply layout
    if (finalNodes.length === 0) {
      return {
        layoutedNodes: [],
        filteredEdges: [],
        totalUniverseNodes: characters.length + elements.length + puzzles.length + timeline.length
      };
    }

    const layoutConfig = {
      direction: (viewConfig.layout.direction === 'LR' || viewConfig.layout.direction === 'TB')
        ? viewConfig.layout.direction
        : 'LR' as const,
      nodeSpacing: viewConfig.layout.spacing?.nodeSpacing || 100,
      rankSpacing: viewConfig.layout.spacing?.rankSpacing || 300
    };

    const layoutedNodes = applyPureDagreLayout(finalNodes, finalEdges, layoutConfig);

    return {
      layoutedNodes,
      filteredEdges: finalEdges,
      totalUniverseNodes: characters.length + elements.length + puzzles.length + timeline.length
    };
  }, [
    // Data arrays
    characters,
    elements,
    puzzles,
    timeline,
    // Filter parameters
    searchTerm,
    focusedNodeId,
    connectionDepth,
    filterMode,
    focusRespectFilters,
    // Entity visibility
    entityVisibility.characters,
    entityVisibility.elements,
    entityVisibility.puzzles,
    entityVisibility.timeline,
    // Character filters
    characterType,
    Array.from(characterSelectedTiers).join(','),
    // Puzzle filters
    Array.from(puzzleSelectedActs).join(','),
    // Element filters
    Array.from(elementBasicTypes).join(','),
    Array.from(elementStatus).join(','),
    // View config
    JSON.stringify(viewConfig)
  ]);
};