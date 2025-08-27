import { useMemo } from 'react';
import type { Edge } from '@xyflow/react';
import { createAllNodes } from '@/lib/graph/nodeCreators';
import { resolveAllRelationships } from '@/lib/graph/relationships';
import { applyPureDagreLayout } from '@/lib/graph/layout/dagre';
import type { GraphNode } from '@/lib/graph/types';
import type { Character, Puzzle, TimelineEvent, Element } from '@/types/notion/app';
import type { ViewConfig } from '@/lib/viewConfigs';

/**
 * Helper function to get all nodes within N connections of a focused node.
 * Uses breadth-first search to find connected components.
 */
const getNodesWithinDepth = (
  focusNodeId: string,
  allEdges: Edge[],
  maxDepth: number
): Set<string> => {
  if (!focusNodeId || maxDepth === 0) return new Set([focusNodeId]);

  const visited = new Set<string>([focusNodeId]);
  const queue: { nodeId: string; depth: number }[] = [{ nodeId: focusNodeId, depth: 0 }];

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;

    const connectedEdges = allEdges.filter(e => e.source === nodeId || e.target === nodeId);

    for (const edge of connectedEdges) {
      const neighborId = edge.source === nodeId ? edge.target : edge.source;
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({ nodeId: neighborId, depth: depth + 1 });
      }
    }
  }
  return visited;
};

interface UseGraphLayoutParams {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
  viewConfig: ViewConfig;
  // Individual filter values to avoid object recreation
  searchTerm: string;
  selectedNodeId: string | null;
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
  puzzleCompletionStatus: string;
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
  selectedNodeId,
  focusedNodeId,
  connectionDepth,
  filterMode,
  focusRespectFilters,
  entityVisibility,
  characterType,
  characterSelectedTiers,
  puzzleSelectedActs,
  puzzleCompletionStatus,
  elementBasicTypes,
  elementStatus,
}: UseGraphLayoutParams): UseGraphLayoutResult => {
  return useMemo(() => {
    // Reconstruct filterState for createAllNodes (temporary until Phase 4 simplification)
    const filterState = {
      searchTerm,
      selectedNodeId,
      focusedNodeId,
      connectionDepth,
      filterMode,
      focusRespectFilters,
      entityVisibility,
      characterFilters: {
        characterType,
        selectedTiers: characterSelectedTiers
      },
      puzzleFilters: {
        selectedActs: puzzleSelectedActs,
        completionStatus: puzzleCompletionStatus
      },
      contentFilters: {
        elementBasicTypes,
        elementStatus
      },
      // Required properties from FilterState interface
      nodeConnectionsFilters: null,
      activeView: null
    };

    // Step 1: Create nodes based on current filters
    const filteredNodes = createAllNodes(
      characters,
      elements,
      puzzles,
      timeline,
      filterState,
      viewConfig
    );

    // Step 2: Create ALL possible edges (we'll filter them later)
    const allPossibleEdges = resolveAllRelationships(
      characters,
      elements,
      puzzles,
      timeline
    );

    // Step 3: Determine which nodes should be visible based on filter mode
    let visibleNodeIds: Set<string>;
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    
    if (filterMode === 'pure' || !connectionDepth || connectionDepth <= 0) {
      // Pure mode: only show filtered nodes
      visibleNodeIds = filteredNodeIds;
    } else if (filterMode === 'focused' && focusedNodeId) {
      // Focus mode: show N hops from focused node
      const edgesToUse = focusRespectFilters 
        ? allPossibleEdges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target))
        : allPossibleEdges;
      visibleNodeIds = getNodesWithinDepth(focusedNodeId, edgesToUse, connectionDepth);
    } else if (filterMode === 'connected') {
      // Connected mode: show filtered nodes + N hops from each
      const connectedIds = new Set(filteredNodeIds);
      const baseFilteredEdges = allPossibleEdges.filter(
        e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
      );
      
      for (const nodeId of filteredNodeIds) {
        const nodesFromStart = getNodesWithinDepth(nodeId, baseFilteredEdges, connectionDepth);
        nodesFromStart.forEach(id => connectedIds.add(id));
      }
      visibleNodeIds = connectedIds;
    } else {
      visibleNodeIds = filteredNodeIds;
    }

    // Step 4: Build final node list including connected nodes
    const allEntities = [...characters, ...elements, ...puzzles, ...timeline];
    const nodeMap = new Map(filteredNodes.map(n => [n.id, n]));
    const finalNodes: GraphNode[] = [];

    // Helper to check if entity should be included based on filters
    const shouldIncludeEntity = (entity: any, entityType: 'character' | 'element' | 'puzzle' | 'timeline'): boolean => {
      // Check view config entity types
      const viewAllowsType = viewConfig.filters.entityTypes?.includes('all') || 
                            viewConfig.filters.entityTypes?.includes(entityType);
      if (!viewAllowsType) return false;
      
      // Check entity visibility toggles
      if (entityType === 'timeline') {
        if (!entityVisibility.timeline) return false;
      } else {
        const pluralKey = `${entityType}s` as keyof typeof entityVisibility;
        if (!entityVisibility[pluralKey]) return false;
      }
      
      // Check entity-specific filters
      if (entityType === 'character') {
        const char = entity as Character;
        if (characterSelectedTiers.size > 0) {
          const tier = char.tier || 'Standard';
          if (!characterSelectedTiers.has(tier)) return false;
        }
        if (characterType !== 'all') {
          const type = char.type || 'Player';
          if (type !== characterType) return false;
        }
      } else if (entityType === 'puzzle') {
        const puzzle = entity as Puzzle;
        if (puzzleSelectedActs.size > 0) {
          const puzzleActs = puzzle.timing || [];
          const hasMatchingAct = puzzleActs.some((act) => act && puzzleSelectedActs.has(act));
          if (!hasMatchingAct) return false;
        }
      } else if (entityType === 'element') {
        if (elementBasicTypes.size > 0) {
          const basicType = entity.basicType || '';
          if (!elementBasicTypes.has(basicType)) return false;
        }
        if (elementStatus.size > 0) {
          const status = entity.status || '';
          if (!elementStatus.has(status)) return false;
        }
      }
      
      return true;
    };

    // Build final nodes list
    visibleNodeIds.forEach(nodeId => {
      const existingNode = nodeMap.get(nodeId);
      if (existingNode) {
        // This is a filtered node - include it with metadata
        finalNodes.push({
          ...existingNode,
          data: {
            ...existingNode.data,
            metadata: {
              ...existingNode.data.metadata,
              isFiltered: true,
              isFocused: nodeId === focusedNodeId
            }
          }
        });
      } else {
        // This is a connected node - create it
        const entity = allEntities.find(e => e.id === nodeId);
        if (entity) {
          const entityType = 
            characters.some(c => c.id === nodeId) ? 'character' :
            elements.some(e => e.id === nodeId) ? 'element' :
            puzzles.some(p => p.id === nodeId) ? 'puzzle' : 'timeline';
          
          // Check filters (skip in focus mode with focusRespectFilters=false)
          if (filterMode === 'focused' && !focusRespectFilters) {
            // Include all connected nodes in focus mode when not respecting filters
          } else if (!shouldIncludeEntity(entity, entityType)) {
            return; // Skip if doesn't pass filters
          }
          
          // Create node for connected entity
          finalNodes.push({
            id: entity.id,
            type: entityType,
            position: { x: 0, y: 0 },
            data: {
              label: entity.name || (entity as TimelineEvent).description || 'Unknown',
              type: entityType,
              id: entity.id,
              entity,
              metadata: {
                entityType,
                isFiltered: false,
                isConnected: true,
                isFocused: nodeId === focusedNodeId
              }
            }
          });
        }
      }
    });

    // Step 5: Filter edges to only include those between visible nodes
    const finalEdges = allPossibleEdges.filter(
      edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );

    // Step 6: Apply layout - SINGLE SYNCHRONOUS CALCULATION
    if (finalNodes.length === 0) {
      return { 
        layoutedNodes: [], 
        filteredEdges: [], 
        totalUniverseNodes: allEntities.length 
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
      totalUniverseNodes: allEntities.length
    };
  }, [
    characters, 
    elements, 
    puzzles, 
    timeline, 
    // Use primitive values instead of objects
    searchTerm,
    selectedNodeId,
    focusedNodeId,
    connectionDepth,
    filterMode,
    focusRespectFilters,
    // Entity visibility (primitive values)
    entityVisibility.characters,
    entityVisibility.elements,
    entityVisibility.puzzles,
    entityVisibility.timeline,
    // Character filters (primitive values)
    characterType,
    characterSelectedTiers.size,
    Array.from(characterSelectedTiers).join(','),
    // Puzzle filters (primitive values)
    puzzleSelectedActs.size,
    Array.from(puzzleSelectedActs).join(','),
    puzzleCompletionStatus,
    // Content/Element filters (primitive values)
    elementBasicTypes.size,
    Array.from(elementBasicTypes).join(','),
    elementStatus.size,
    Array.from(elementStatus).join(','),
    // View config (stringify to ensure stable reference)
    JSON.stringify(viewConfig)
  ]);
};