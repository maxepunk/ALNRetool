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
import Fuse from 'fuse.js';
import type { GraphNode } from '@/lib/graph/types';
import type { Edge } from '@xyflow/react';
import type { ViewConfig } from '@/lib/viewConfigs';
import { useDebounce } from '@/hooks/useDebounce';

// Import the 2 composable hooks (filtering is now inline, relationships come from server)
import { useGraphVisibility } from './graph/useGraphVisibility';
import { useLayoutEngine } from './graph/useLayoutEngine';

interface UseGraphLayoutParams {
  // Entities from server (with relationships already embedded)
  nodes: GraphNode[];
  edges: any[];
  
  // View configuration
  viewConfig: ViewConfig;
  
  // Filters - all optional with sensible defaults
  searchTerm?: string;
  selectedNodeId?: string | null;
  connectionDepth?: number | null;
  entityVisibility?: {
    character: boolean;
    puzzle: boolean;
    element: boolean;
    timeline: boolean;
  };
  
  // Character-specific filters
  characterType?: 'all' | 'Player' | 'NPC';
  characterSelectedTiers?: Set<string>;
  
  // Puzzle-specific filters
  puzzleSelectedActs?: Set<string>;
  
  // Content/Element filters
  elementBasicTypes?: Set<string>;
  elementStatus?: Set<string>;
}

interface UseGraphLayoutResult {
  reactFlowNodes: GraphNode[];
  reactFlowEdges: Edge[];
  visibleNodeIds: Set<string>;
}

/**
 * Main graph layout hook that orchestrates filtering and positioning.
 * 
 * Flow:
 * 1. Apply filters to server nodes (but keep all nodes, mark as hidden)
 * 2. Apply visibility rules based on selection and depth
 * 3. Apply layout algorithm to position nodes
 * 4. Transform to React Flow format
 * 
 * @example
 * ```typescript
 * const { reactFlowNodes, reactFlowEdges } = useGraphLayout({
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
  
  // Debounce search term to prevent excessive recalculation (300ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm || '', 300);
  
  // Create Fuse instance for fuzzy search
  const searchMatcher = useMemo(() => {
    if (!nodes.length || !debouncedSearchTerm) return null;
    
    const fuse = new Fuse(nodes, {
      keys: [
        'data.label',
        'id'
      ],
      threshold: 0.4,  // 0.0 = exact match, 1.0 = match anything
      includeScore: true,
    });
    
    const searchResults = fuse.search(debouncedSearchTerm);
    return new Set(searchResults.map(r => r.item.id));
  }, [nodes, debouncedSearchTerm]);
  
  // Step 1: Apply filters to server-provided nodes
  // Filter nodes out completely for proper layout recalculation and performance
  const filteredNodes = useMemo(() => {
    return nodes
      .filter((node: any) => {
        // Skip placeholder nodes unless we want to show them
        if (node.data?.metadata?.isPlaceholder) {
          // TODO: Add option to show/hide placeholder nodes
          return true; // Show them for now to visualize data issues
        }
        
        // Apply fuzzy search filter (using debounced term)
        if (debouncedSearchTerm && searchMatcher && !searchMatcher.has(node.id)) {
          return false;
        }
        
        // Apply entity visibility filters
        const entityType = node.data?.metadata?.entityType;
        if (entityType && typeof entityType === 'string') {
          if (!entityVisibility || !entityVisibility[entityType as keyof typeof entityVisibility]) {
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
                if (characterSelectedTiers && characterSelectedTiers.size > 0 && !characterSelectedTiers.has(entity.tier || '')) {
                  return false;
                }
                break;
                
              case 'puzzle':
                // Puzzle act filter - check timing array (matches nodeCreators.ts pattern)
                if (puzzleSelectedActs && puzzleSelectedActs.size > 0) {
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
                if (elementBasicTypes && elementBasicTypes.size > 0 && !elementBasicTypes.has(entity.basicType || '')) {
                  return false;
                }
                // Element status filter
                if (elementStatus && elementStatus.size > 0 && !elementStatus.has(entity.status || '')) {
                  return false;
                }
                break;
            }
          }
        }
        
        // Keep the node
        return true;
      })
      .map(node => ({
        ...node,
        type: node.type || 'default',
        // CRITICAL: Preserve selection state when filtering changes
        // This prevents React Flow from losing selection and clearing selectedNodeId
        selected: node.id === selectedNodeId,
      } as GraphNode));
  }, [nodes, debouncedSearchTerm, searchMatcher, entityVisibility, characterType, characterSelectedTiers, 
      puzzleSelectedActs, elementBasicTypes, elementStatus, selectedNodeId]);
  
  // Step 2: Use server-provided edges directly, ensuring type compatibility
  const allEdges = edges as any[];
  
  
  // Step 3: Apply visibility rules
  // This hook memoizes based on selection and connection depth
  const { visibleNodes, visibleEdges, allEdges: layoutEdges } = useGraphVisibility({
    filteredNodes,
    allEdges,
    selectedNodeId: selectedNodeId || null,
    connectionDepth: connectionDepth || null,
  });
  
  
  // Step 4: Apply layout to visible nodes (not filtered nodes!)
  // Layout will recalculate when nodes are filtered, providing visual feedback
  const { layoutedNodes } = useLayoutEngine({
    visibleNodes: visibleNodes,  // FIX: Use actual visible nodes from visibility hook
    allEdges: layoutEdges,
    viewConfig,
  });
  
  // Step 5: Build final React Flow nodes and edges
  const { reactFlowNodes, reactFlowEdges, visibleNodeIds } = useMemo(() => {
    // Create a set of visible node IDs (from actual visible nodes after depth filtering)
    const visibleIds = new Set(layoutedNodes.map(n => n.id));
    
    // Transform nodes to React Flow format
    const rfNodes = layoutedNodes.map(node => ({
      ...node,
    })) as GraphNode[];
    
    // Use the pre-filtered visible edges from visibility hook
    const rfEdges = visibleEdges
      .map(edge => ({
        ...edge,
        type: edge.type || 'default',
      })) as Edge[];
    
    return {
      reactFlowNodes: rfNodes,
      reactFlowEdges: rfEdges,
      visibleNodeIds: visibleIds,
    };
  }, [layoutedNodes, visibleEdges]);
  
  return {
    reactFlowNodes,
    reactFlowEdges,
    visibleNodeIds,
  };
};