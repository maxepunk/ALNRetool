import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { FilterState } from '@/components/graph/GraphControls';
import type { Element, Puzzle } from '@/types/notion/app';

const STORAGE_KEY = 'alnretool-graph-filters';

/**
 * Hook for managing graph filters with sessionStorage persistence
 * Handles search, act filtering, and puzzle selection
 */
export function useGraphFilters(
  initialNodes: Node[],
  initialEdges: Edge[],
  elements: Element[],
  puzzles: Puzzle[]
) {
  // Initialize filter state from sessionStorage or defaults
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert selectedActs array back to Set
        return {
          ...parsed,
          selectedActs: new Set(parsed.selectedActs || []),
        };
      } catch (e) {
        console.error('Failed to parse stored filters:', e);
      }
    }
    return {
      searchTerm: '',
      selectedActs: new Set<string>(),
      selectedPuzzleId: null,
    };
  });

  // Save filter state to sessionStorage whenever it changes
  useEffect(() => {
    const toStore = {
      ...filterState,
      selectedActs: Array.from(filterState.selectedActs),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [filterState]);

  // Filter nodes based on current filter state
  const filteredData = useMemo(() => {
    console.log('[useGraphFilters] Filtering with state:', {
      searchTerm: filterState.searchTerm,
      selectedActs: Array.from(filterState.selectedActs),
      selectedPuzzleId: filterState.selectedPuzzleId,
      totalNodes: initialNodes.length,
      totalEdges: initialEdges.length
    });
    
    let filteredNodes = [...initialNodes];
    let filteredEdges = [...initialEdges];
    
    // Apply search filter (fuzzy matching on node labels)
    if (filterState.searchTerm) {
      const searchLower = filterState.searchTerm.toLowerCase();
      const matchingNodeIds = new Set<string>();
      
      filteredNodes.forEach(node => {
        const label = typeof node.data?.label === 'string' ? node.data.label.toLowerCase() : '';
        const entity = node.data?.entity as any;
        const name = typeof entity?.name === 'string' ? entity.name.toLowerCase() : '';
        if (label.includes(searchLower) || name.includes(searchLower)) {
          matchingNodeIds.add(node.id);
          // Also include directly connected nodes for context
          initialEdges.forEach(edge => {
            if (edge.source === node.id) matchingNodeIds.add(edge.target);
            if (edge.target === node.id) matchingNodeIds.add(edge.source);
          });
        }
      });
      
      if (matchingNodeIds.size > 0) {
        filteredNodes = filteredNodes.filter(node => matchingNodeIds.has(node.id));
        console.log(`[useGraphFilters] Search "${searchLower}" matched ${matchingNodeIds.size} nodes`);
      } else {
        // No matches - show empty state
        filteredNodes = [];
        console.log(`[useGraphFilters] Search "${searchLower}" - no matches found`);
      }
    }
    
    // Apply act filter
    if (filterState.selectedActs.size > 0) {
      const actNodeIds = new Set<string>();
      
      // Find elements that belong to selected acts
      elements.forEach(element => {
        const elementAct = element.firstAvailable;
        if (elementAct && filterState.selectedActs.has(elementAct)) {
          // Find the node for this element
          const elementNode = filteredNodes.find(n => {
            const entity = n.data?.entity as any;
            return n.type === 'elementNode' && entity?.id === element.id;
          });
          if (elementNode) {
            actNodeIds.add(elementNode.id);
            // Include connected puzzles
            filteredEdges.forEach(edge => {
              if (edge.source === elementNode.id || edge.target === elementNode.id) {
                actNodeIds.add(edge.source);
                actNodeIds.add(edge.target);
              }
            });
          }
        }
      });
      
      // Find puzzles that belong to selected acts
      puzzles.forEach(puzzle => {
        const puzzleTiming = puzzle.timing || [];
        const hasSelectedAct = puzzleTiming.some(act => 
          act && filterState.selectedActs.has(act)
        );
        if (hasSelectedAct) {
          const puzzleNode = filteredNodes.find(n => {
            const entity = n.data?.entity as any;
            return n.type === 'puzzleNode' && entity?.id === puzzle.id;
          });
          if (puzzleNode) {
            actNodeIds.add(puzzleNode.id);
            // Include connected elements
            filteredEdges.forEach(edge => {
              if (edge.source === puzzleNode.id || edge.target === puzzleNode.id) {
                actNodeIds.add(edge.source);
                actNodeIds.add(edge.target);
              }
            });
          }
        }
      });
      
      if (actNodeIds.size > 0) {
        filteredNodes = filteredNodes.filter(node => actNodeIds.has(node.id));
      }
    }
    
    // Apply puzzle filter - show only selected puzzle and its dependencies
    if (filterState.selectedPuzzleId) {
      const puzzleNodeIds = new Set<string>();
      
      // Find the selected puzzle node
      const puzzleNode = filteredNodes.find(n => {
        const entity = n.data?.entity as any;
        return n.type === 'puzzleNode' && entity?.id === filterState.selectedPuzzleId;
      });
      
      if (puzzleNode) {
        puzzleNodeIds.add(puzzleNode.id);
        
        // Find all connected nodes (requirements and rewards)
        const findConnected = (nodeId: string, visited = new Set<string>()) => {
          if (visited.has(nodeId)) return;
          visited.add(nodeId);
          puzzleNodeIds.add(nodeId);
          
          filteredEdges.forEach(edge => {
            if (edge.source === nodeId && !visited.has(edge.target)) {
              findConnected(edge.target, visited);
            }
            if (edge.target === nodeId && !visited.has(edge.source)) {
              findConnected(edge.source, visited);
            }
          });
        };
        
        findConnected(puzzleNode.id);
        filteredNodes = filteredNodes.filter(node => puzzleNodeIds.has(node.id));
      }
    }
    
    // Filter edges to only include those between visible nodes
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    filteredEdges = filteredEdges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
    
    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }, [initialNodes, initialEdges, elements, puzzles, filterState]);

  // Update filter state
  const handleFilterChange = useCallback((newState: FilterState) => {
    setFilterState(newState);
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilterState({
      searchTerm: '',
      selectedActs: new Set(),
      selectedPuzzleId: null,
    });
  }, []);

  return {
    filterState,
    filteredNodes: filteredData.nodes,
    filteredEdges: filteredData.edges,
    onFilterChange: handleFilterChange,
    onClearFilters: handleClearFilters,
  };
}