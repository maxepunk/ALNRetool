/**
 * GraphView Component
 * 
 * Main graph visualization component for ALNRetool.
 * Renders an interactive node-link diagram using React Flow,
 * showing relationships between characters, puzzles, elements, and timeline events.
 * 
 * @module components/graph/GraphView
 * 
 * **Architecture:**
 * - React Flow for graph rendering and interaction
 * - Dagre layout algorithm for automatic positioning
 * - Dynamic filtering based on view configuration
 * - Real-time search and connection depth filtering
 * - Detail panel for entity editing
 * 
 * **Features:**
 * - Multiple node types with custom rendering
 * - Smart edge weighting for semantic layouts
 * - Interactive pan, zoom, and selection
 * - Connection depth filtering from focused node
 * - Search highlighting across all entities
 * - Filter persistence via Zustand store
 * 
 * **Performance:**
 * - Memoized node/edge creation
 * - Layout caching to prevent reflows
 * - React Flow virtualization for large graphs
 * 
 * @see {@link useViewConfig} for view configuration
 * @see {@link resolveAllRelationships} for edge creation
 * @see {@link applyPureDagreLayout} for layout algorithm
 */

import { useMemo, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider
} from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import PuzzleNode from './nodes/PuzzleNode';
import CharacterNode from './nodes/CharacterNode';
import ElementNode from './nodes/ElementNode';
import TimelineNode from './nodes/TimelineNode';
import { DetailPanelRefactored } from '@/components/DetailPanel';
import { applyPureDagreLayout } from '@/lib/graph/layout/dagre';
import { useAllEntityData } from '@/hooks/generic/useEntityData';
import { charactersApi, elementsApi, puzzlesApi, timelineApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useViewConfig } from '@/hooks/useViewConfig';
import { resolveAllRelationships } from '@/lib/graph/relationships';
import type { GraphNode, GraphEdge } from '@/lib/graph/types';
import type { Character, Puzzle, TimelineEvent } from '@/types/notion/app';
import { useFilterStore } from '@/stores/filterStore';
import { useViewportManager } from '@/hooks/useGraphState';
import { FilterStatusBar } from './FilterStatusBar';

/**
 * Custom node component mapping for React Flow.
 * Each entity type has a specialized node component.
 * 
 * @constant {Record<string, React.ComponentType>} nodeTypes
 */
const nodeTypes = {
  puzzle: PuzzleNode,
  character: CharacterNode,
  element: ElementNode,
  timeline: TimelineNode,
};

/**
 * ViewportController - Component that manages viewport within React Flow context
 * Must be rendered as a child of ReactFlow to access useReactFlow hook
 */
function ViewportController({ 
  searchTerm,
  selectedNodeId,
  focusedNodeId, 
  connectionDepth,
  nodes 
}: { 
  searchTerm: string;
  selectedNodeId: string | null;
  focusedNodeId: string | null;
  connectionDepth: number | null;
  nodes: Node[];
}) {
  const viewportControls = useViewportManager(searchTerm, selectedNodeId, focusedNodeId, connectionDepth, nodes);
  
  // Initial fit to view on mount or when nodes change significantly
  const hasNodes = nodes.length > 0;
  const fitAll = viewportControls.fitAll;
  
  useEffect(() => {
    if (hasNodes) {
      // Small delay to ensure nodes are rendered
      const timer = setTimeout(() => {
        fitAll();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasNodes, fitAll]); // Only re-fit when going from 0 to >0 nodes
  
  return null; // This component doesn't render anything
}

/**
 * GraphViewComponent - Internal graph visualization component.
 * 
 * @component
 * @returns {JSX.Element} React Flow graph with controls and detail panel
 * 
 * **State Management:**
 * - View configuration from route-based config
 * - Filter state from Zustand store
 * - Selection state for detail panel
 * - Focus state for connection depth filtering
 * 
 * **Data Flow:**
 * 1. Fetch entities based on view config
 * 2. Filter entities based on user selections
 * 3. Create nodes with metadata
 * 4. Generate edges from relationships
 * 5. Apply layout algorithm
 * 6. Render with React Flow
 * 
 * **Complexity:** O(n*m) where n = nodes, m = edges for layout
 */
function GraphViewComponent() {
  // Get view configuration from route
  const { config: viewConfig } = useViewConfig();
  
  // Filter state from store - select specific properties to avoid unstable references
  const searchTerm = useFilterStore(state => state.searchTerm);
  const selectedNodeId = useFilterStore(state => state.selectedNodeId);
  const focusedNodeId = useFilterStore(state => state.focusedNodeId);
  const setSelectedNode = useFilterStore(state => state.setSelectedNode);
  const setFocusedNode = useFilterStore(state => state.setFocusedNode);
  const connectionDepth = useFilterStore(state => state.connectionDepth);
  const filterMode = useFilterStore(state => state.filterMode);
  const focusRespectFilters = useFilterStore(state => state.focusRespectFilters);
  
  // Select specific filter properties instead of whole objects to prevent infinite loops
  const characterSelectedTiers = useFilterStore(state => state.characterFilters.selectedTiers);
  const characterType = useFilterStore(state => state.characterFilters.characterType);
  const puzzleSelectedActs = useFilterStore(state => state.puzzleFilters.selectedActs);
  const puzzleCompletionStatus = useFilterStore(state => state.puzzleFilters.completionStatus);
  const elementBasicTypes = useFilterStore(state => state.contentFilters.elementBasicTypes);
  const elementStatus = useFilterStore(state => state.contentFilters.elementStatus);
  
  // Entity visibility toggles (Option 2)
  const entityVisibility = useFilterStore(state => state.entityVisibility);
  
  
  // Fetch data based on view config
  const shouldFetchCharacters = viewConfig.filters.entityTypes?.includes('all') || 
                                viewConfig.filters.entityTypes?.includes('character');
  const shouldFetchElements = viewConfig.filters.entityTypes?.includes('all') || 
                              viewConfig.filters.entityTypes?.includes('element');
  const shouldFetchPuzzles = viewConfig.filters.entityTypes?.includes('all') || 
                             viewConfig.filters.entityTypes?.includes('puzzle');
  const shouldFetchTimeline = viewConfig.filters.entityTypes?.includes('all') || 
                              viewConfig.filters.entityTypes?.includes('timeline');
  
  // Always fetch data - filtering happens at render time
  const { data: characters = [] } = useAllEntityData(charactersApi, queryKeys.characters());
  const { data: elements = [] } = useAllEntityData(elementsApi, queryKeys.elements());
  const { data: puzzles = [] } = useAllEntityData(puzzlesApi, queryKeys.puzzles());
  const { data: timeline = [] } = useAllEntityData(timelineApi, queryKeys.timeline());

  // Initialize filters when view changes to ensure requested entities are visible
  useEffect(() => {
    if (viewConfig) {
      useFilterStore.getState().initializeFiltersForView(viewConfig);
    }
  }, [viewConfig.name]); // Re-initialize when view changes

  /**
   * Create all graph nodes from entity data.
   * Applies filtering based on view config and user selections.
   * 
   * @memoized Recalculates only when dependencies change
   * @returns {GraphNode[]} Array of nodes with positions and metadata
   */
  const allNodes = useMemo(() => {
    const nodes: GraphNode[] = [];
    
    /**
     * Check if an entity matches the search term.
     * Searches in name, description, and ID fields.
     * 
     * @param {any} entity - Entity to check
     * @returns {boolean} True if matches search
     */
    const matchesSearch = (entity: any): boolean => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      const matches = entity.name?.toLowerCase().includes(searchLower) ||
             entity.description?.toLowerCase().includes(searchLower) ||
             entity.id.toLowerCase().includes(searchLower);
      return matches;
    };
    
    
    /**
     * Check if a character passes tier and type filters.
     * 
     * @param {Character} character - Character to check
     * @returns {boolean} True if passes all filters
     */
    const matchesCharacterFilters = (character: Character): boolean => {
      // Always show the focused node in focus mode
      if (focusedNodeId && character.id === focusedNodeId) {
        return true;
      }
      
      // Check entity visibility toggle first
      if (!entityVisibility.characters) {
        return false;
      }
      
      // Check character-specific filters
      if (characterSelectedTiers.size > 0) {
        const tier = character.tier || 'Standard';
        if (!characterSelectedTiers.has(tier as any)) return false;
      }
      
      if (characterType !== 'all') {
        const type = character.type || 'Player';
        if (type !== characterType) return false;
      }
      
      return true;
    };
    
    /**
     * Check if a puzzle passes act and completion filters.
     * 
     * @param {Puzzle} puzzle - Puzzle to check
     * @returns {boolean} True if passes all filters
     */
    const matchesPuzzleFilters = (puzzle: Puzzle): boolean => {
      // Always show the focused node in focus mode
      if (focusedNodeId && puzzle.id === focusedNodeId) {
        return true;
      }
      
      // Check entity visibility toggle first
      if (!entityVisibility.puzzles) {
        return false;
      }
      
      // Check puzzle-specific filters
      if (puzzleSelectedActs.size > 0) {
        // Puzzle has timing: Act[] field
        // Check if ANY of the puzzle's timing acts match the selected acts
        const puzzleActs = puzzle.timing || [];
        const hasMatchingAct = puzzleActs.some((act) => {
          // Filter panel sets acts with spaces ('Act 0', 'Act 1', 'Act 2')
          // so we just check directly without normalization
          return act && puzzleSelectedActs.has(act);
        });
        
        if (!hasMatchingAct) return false;
      }
      
      // Completion status: 'all' = show all (inclusive default)
      // Note: Puzzle type doesn't have a completed field in the data model
      // This filter is currently non-functional but kept for future implementation
      
      return true;
    };
    
    // Add puzzle nodes if enabled and they pass filters
    if (shouldFetchPuzzles) {
      puzzles.forEach(puzzle => {
        // Only filter by puzzle-specific filters, not search (search should highlight, not hide)
        if (matchesPuzzleFilters(puzzle)) {
          const isMatch = searchTerm ? matchesSearch(puzzle) : false;
          nodes.push({
            id: puzzle.id,
            type: 'puzzle',
            position: { x: 0, y: 0 },
            data: {
              label: puzzle.name,
              type: 'puzzle',
              id: puzzle.id,
              entity: puzzle,
              metadata: { 
                entityType: 'puzzle',
                searchMatch: isMatch,
                isFocused: puzzle.id === focusedNodeId
              }
            }
          });
        }
      });
    }
    
    // Add character nodes if enabled and they pass filters
    if (shouldFetchCharacters) {
      characters.forEach(character => {
        // Only filter by character-specific filters, not search
        if (matchesCharacterFilters(character)) {
          nodes.push({
            id: character.id,
            type: 'character',
            position: { x: 0, y: 0 },
            data: {
              label: character.name,
              type: 'character',
              id: character.id,
              entity: character,
              metadata: { 
                entityType: 'character',
                searchMatch: searchTerm ? matchesSearch(character) : false,
                isFocused: character.id === focusedNodeId
              }
            }
          });
        }
      });
    }
    
    /**
     * Check if an element passes type and status filters.
     * 
     * @param {any} element - Element to check
     * @returns {boolean} True if passes all filters
     */
    const matchesElementFilters = (element: any): boolean => {
      // Always show the focused node in focus mode
      if (focusedNodeId && element.id === focusedNodeId) {
        return true;
      }
      
      // Check entity visibility toggle first
      if (!entityVisibility.elements) {
        return false;
      }
      
      // Check element-specific filters
      if (elementBasicTypes.size > 0) {
        const basicType = element.basicType || '';
        if (!elementBasicTypes.has(basicType)) return false;
      }
      
      if (elementStatus.size > 0) {
        const status = element.status || '';
        if (!elementStatus.has(status)) return false;
      }
      
      return true;
    };
    
    // Add element nodes if enabled and they pass filters
    if (shouldFetchElements) {
      elements.forEach(element => {
        // Apply element-specific filters
        if (matchesElementFilters(element)) {
          nodes.push({
            id: element.id,
            type: 'element',
            position: { x: 0, y: 0 },
            data: {
              label: element.name,
              type: 'element',
              id: element.id,
              entity: element,
              metadata: { 
                entityType: 'element',
                searchMatch: searchTerm ? matchesSearch(element) : false,
                isFocused: element.id === focusedNodeId
              }
            }
          });
        }
      });
    }
    
    // Add timeline nodes if enabled and they pass filters
    if (shouldFetchTimeline && entityVisibility.timeline) {
      timeline.forEach(timelineEvent => {
        // No timeline-specific filters currently, just add if visible
        nodes.push({
          id: timelineEvent.id,
          type: 'timeline',
          position: { x: 0, y: 0 },
          data: {
            label: timelineEvent.description || 'Timeline Event',
            type: 'timeline',
            id: timelineEvent.id,
            entity: timelineEvent,
            metadata: { 
              entityType: 'timeline',
              searchMatch: searchTerm ? matchesSearch(timelineEvent) : false
            }
          }
        });
      });
    }
    
    return nodes;
  }, [
    characters, 
    elements, 
    puzzles,
    timeline,
    shouldFetchCharacters, 
    shouldFetchElements, 
    shouldFetchPuzzles,
    shouldFetchTimeline,
    searchTerm,
    focusedNodeId,
    characterSelectedTiers,
    characterType,
    puzzleSelectedActs,
    puzzleCompletionStatus,
    elementBasicTypes,
    elementStatus,
    entityVisibility
  ]);

  /**
   * Get all nodes within N connections of a focused node.
   * Uses breadth-first search to find connected components.
   * 
   * @callback getNodesWithinDepth
   * @param {string} focusNodeId - ID of the focused node
   * @param {GraphNode[]} _allNodes - All nodes (unused but required for signature)
   * @param {Edge[]} allEdges - All edges in the graph
   * @param {number} maxDepth - Maximum connection depth
   * @returns {Set<string>} Set of node IDs within depth
   * 
   * **Algorithm:** BFS with depth tracking
   * **Complexity:** O(V + E) where V = vertices, E = edges
   */
  const getNodesWithinDepth = useCallback((
    focusNodeId: string, 
    _allNodes: GraphNode[], 
    allEdges: Edge[], 
    maxDepth: number
  ): Set<string> => {
    if (!focusNodeId || maxDepth === 0) return new Set([focusNodeId]);
    
    const visited = new Set<string>([focusNodeId]);
    const queue: { nodeId: string; depth: number }[] = [{ nodeId: focusNodeId, depth: 0 }];
    
    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      
      if (depth >= maxDepth) continue;
      
      // Find all edges connected to this node
      const connectedEdges = allEdges.filter(e => 
        e.source === nodeId || e.target === nodeId
      );
      
      // Add connected nodes to visited set
      for (const edge of connectedEdges) {
        const neighborId = edge.source === nodeId ? edge.target : edge.source;
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ nodeId: neighborId, depth: depth + 1 });
        }
      }
    }
    
    return visited;
  }, []);

  /**
   * Create edges from entity relationships.
   * IMPORTANT: We create ALL possible edges first, then filter them based on visible nodes.
   * This two-step process is needed because we need the edges to determine which nodes
   * to include when using connection depth.
   * 
   * @memoized Recalculates only when entities change
   * @returns {Edge[]} Array of all possible edges in the system
   * 
   * **Edge Types Created:**
   * - requirement: Puzzle -> Element
   * - reward: Puzzle -> Element  
   * - ownership: Character -> Element
   * - dependency: Puzzle -> Puzzle
   * - timeline: Element -> Timeline
   */
  const allPossibleEdges = useMemo(() => {
    const edges = resolveAllRelationships(
      characters,
      elements, 
      puzzles,
      timeline
    );
    return edges;
  }, [characters, elements, puzzles, timeline]);
  
  /**
   * Filter edges to only include those between filtered nodes.
   * This prevents unfiltered nodes from being pulled in via edges.
   * 
   * @memoized Recalculates when filtered nodes change
   * @returns {Edge[]} Edges between visible nodes only
   */
  const baseFilteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(allNodes.map(n => n.id));
    return allPossibleEdges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [allNodes, allPossibleEdges]);

  /**
   * Calculate nodes to display based on filtering mode:
   * 1. Focus mode: Show N hops from a specific focused node
   * 2. Connected mode: Show filtered nodes + N hops from each
   * 3. Pure filter mode: Show only filtered nodes (depth = 0)
   */
  const nodesWithinDepth = useMemo(() => {
    // Use filterMode to determine behavior
    if (filterMode === 'pure') {
      // Pure mode: Only show filtered nodes, no depth expansion
      return null;
    }
    
    if (filterMode === 'focused' && focusedNodeId && connectionDepth && connectionDepth > 0 && connectionDepth <= 10) {
      // Focus mode: Show N hops from focused node
      // Use filtered or all edges based on the focusRespectFilters toggle
      const edgesToUse = focusRespectFilters ? baseFilteredEdges : allPossibleEdges;
      return getNodesWithinDepth(
        focusedNodeId,
        allNodes,
        edgesToUse,
        connectionDepth
      );
    }
    
    if (filterMode === 'connected' && connectionDepth && connectionDepth > 0 && connectionDepth <= 10) {
      // Connected mode: Show filtered nodes + N hops from ALL of them
      const connectedNodes = new Set<string>();
      
      // Start with all filtered nodes
      allNodes.forEach(node => connectedNodes.add(node.id));
      
      // For each filtered node, find nodes within depth
      allNodes.forEach(node => {
        const visited = new Set<string>([node.id]);
        const queue: { nodeId: string; depth: number }[] = [{ nodeId: node.id, depth: 0 }];
        
        while (queue.length > 0) {
          const { nodeId, depth } = queue.shift()!;
          
          if (depth >= connectionDepth) continue;
          
          // Find all edges connected to this node - USE FILTERED EDGES
          const connectedEdges = baseFilteredEdges.filter(e => 
            e.source === nodeId || e.target === nodeId
          );
          
          // Add connected nodes to visited set
          for (const edge of connectedEdges) {
            const neighborId = edge.source === nodeId ? edge.target : edge.source;
            if (!visited.has(neighborId)) {
              visited.add(neighborId);
              connectedNodes.add(neighborId);
              queue.push({ nodeId: neighborId, depth: depth + 1 });
            }
          }
        }
      });
      
      return connectedNodes;
    }
    
    // Default: return null to show only filtered nodes
    return null;
  }, [allNodes, baseFilteredEdges, allPossibleEdges, focusedNodeId, connectionDepth, getNodesWithinDepth, filterMode, focusRespectFilters]);

  // Filter nodes based on focused node and depth
  const filteredNodes = useMemo(() => {
    if (!nodesWithinDepth) {
      // Pure filter mode - return only filtered nodes
      return allNodes;
    }
    
    // Connected or Focus mode - need to include connected nodes
    // Get all entity data to create nodes for connected entities
    const allEntities = [...characters, ...elements, ...puzzles, ...timeline];
    const nodeMap = new Map(allNodes.map(n => [n.id, n]));
    const resultNodes: GraphNode[] = [];
    
    // Helper function to check if an entity should be included based on filters
    // We need to recreate the filter logic here to check connected nodes
    const shouldIncludeEntity = (entity: any, entityType: 'character' | 'element' | 'puzzle' | 'timeline'): boolean => {
      // Check view config entity types first
      const viewAllowsType = viewConfig.filters.entityTypes?.includes('all') || 
                            viewConfig.filters.entityTypes?.includes(entityType);
      if (!viewAllowsType) return false;
      
      // Check entity visibility toggles
      if (entityType === 'character' && !entityVisibility.characters) return false;
      if (entityType === 'element' && !entityVisibility.elements) return false;
      if (entityType === 'puzzle' && !entityVisibility.puzzles) return false;
      if (entityType === 'timeline' && !entityVisibility.timeline) return false;
      
      // Check entity-specific filters (simplified - no cross-entity exclusion)
      if (entityType === 'character') {
        const char = entity as Character;
        if (characterSelectedTiers.size > 0) {
          const tier = char.tier || 'Standard';
          if (!characterSelectedTiers.has(tier as any)) return false;
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
    
    // Add all nodes that should be visible
    nodesWithinDepth.forEach(nodeId => {
      // Check if it's already a filtered node
      const existingNode = nodeMap.get(nodeId);
      if (existingNode) {
        // This is a filtered node - mark it as such
        resultNodes.push({
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
        // This is a connected node - find the entity and create a node
        const entity = allEntities.find(e => e.id === nodeId);
        if (entity) {
          const entityType = 
            characters.includes(entity as any) ? 'character' :
            elements.includes(entity as any) ? 'element' :
            puzzles.includes(entity as any) ? 'puzzle' : 'timeline';
          
          // Check if this entity should be included based on filters
          // In focus mode with focusRespectFilters=false, include all connected nodes
          if (filterMode === 'focused' && !focusRespectFilters) {
            // Skip filter checks in focus mode when not respecting filters
          } else if (!shouldIncludeEntity(entity, entityType)) {
            return; // Skip this entity if it doesn't pass filters
          }
          
          resultNodes.push({
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
    
    return resultNodes;
  }, [allNodes, nodesWithinDepth, focusedNodeId, characters, elements, puzzles, timeline, 
      viewConfig.filters.entityTypes, entityVisibility, characterSelectedTiers, characterType,
      puzzleSelectedActs, puzzleCompletionStatus, elementBasicTypes, elementStatus,
      filterMode, focusRespectFilters]);

  // Filter edges based on visible nodes
  const filteredEdges = useMemo(() => {
    if (!nodesWithinDepth) {
      // When not in focus mode, use edges between filtered nodes only
      return baseFilteredEdges;
    }
    
    // In focus mode, show all edges between nodes within depth
    return allPossibleEdges.filter(edge => 
      nodesWithinDepth.has(edge.source) && nodesWithinDepth.has(edge.target)
    );
  }, [allPossibleEdges, baseFilteredEdges, nodesWithinDepth]);

  // Apply layout to nodes using view config
  const layoutedNodes = useMemo(() => {
    if (filteredNodes.length === 0) {
      return [];
    }
    
    // Apply layout with view-specific configuration
    const layoutConfig = {
      direction: (viewConfig.layout.direction === 'LR' || viewConfig.layout.direction === 'TB') 
        ? viewConfig.layout.direction 
        : 'LR' as const,
      nodeSpacing: viewConfig.layout.spacing?.nodeSpacing || 100,
      rankSpacing: viewConfig.layout.spacing?.rankSpacing || 300
    };
    
    const result = applyPureDagreLayout(filteredNodes, filteredEdges, layoutConfig);
    return result;
  }, [filteredNodes, filteredEdges, viewConfig]);

  // React Flow state - initialize with empty state to avoid race conditions
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdge>([]);

  // Sync computed values to React Flow state atomically to prevent race conditions
  useEffect(() => {
    // Update both nodes and edges in a single effect to ensure atomic updates
    // This prevents React Flow from rendering incomplete graph state that breaks
    // minimap and edge rendering during layout transitions
    
    setNodes(layoutedNodes);
    setEdges(filteredEdges);
  }, [layoutedNodes, filteredEdges, setNodes, setEdges]);

  // Derive selected entity from selectedNodeId
  const selectedEntity = useMemo(() => {
    if (!selectedNodeId) return null;
    
    // Find the node with the selected ID
    const node = allNodes.find(n => n.id === selectedNodeId);
    if (!node) {
      // Node might not exist yet if data is still loading
      return null;
    }
    
    // Get entity directly from node data
    const entity = node.data.entity;
    const entityType = node.data.metadata?.entityType;
    
    if (!entity || !entityType) {
      console.warn('Node missing entity or entityType:', node);
      return null;
    }
    
    // Return the entity with its type
    return { entity, entityType };
  }, [selectedNodeId, allNodes]);

  // Click handlers for node interaction
  const onNodeClick = (nodeId: string) => {
    // Always open detail panel for the clicked node
    setSelectedNode(nodeId);
    
    // Toggle focused node for depth filtering
    if (focusedNodeId === nodeId) {
      // Clicking the same focused node again unfocuses it
      setFocusedNode(null);
    } else {
      // Set as focused node for depth filtering
      setFocusedNode(nodeId);
    }
  };
  
  const onEdgeClick = () => {
    // Edge click handler - currently no action needed
  };

  // Handle detail panel close - only clears selection, not focus
  const handleDetailPanelClose = () => {
    setSelectedNode(null);
    // Keep focusedNodeId - user might want to maintain the filtered view
  };

  // Get focused node details for status bar
  const focusedNodeData = useMemo(() => {
    if (!focusedNodeId) return null;
    const node = allNodes.find(n => n.id === focusedNodeId);
    if (!node) return null;
    return { id: node.id, name: node.data.label };
  }, [focusedNodeId, allNodes]);

  // Check if there are active filters
  const hasActiveFilters = useFilterStore(state => state.hasActiveFilters);

  return (
    <div className="h-full w-full flex">
      <div className="flex-1 relative">
        {/* Filter status bar with comprehensive feedback */}
        <FilterStatusBar
          totalNodes={allNodes.length + (nodesWithinDepth ? nodesWithinDepth.size - allNodes.length : 0)}
          visibleNodes={filteredNodes.length}
          filterMode={filterMode}
          connectionDepth={connectionDepth}
          focusedNode={focusedNodeData}
          hasActiveFilters={hasActiveFilters()}
        />
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => onNodeClick(node.id)}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          minZoom={0.1}
          maxZoom={2}
        >
          <ViewportController 
            searchTerm={searchTerm}
            selectedNodeId={selectedNodeId}
            focusedNodeId={focusedNodeId}
            connectionDepth={connectionDepth}
            nodes={nodes}
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={16} 
            size={1} 
            className="bg-gray-50 dark:bg-gray-900"
          />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'puzzle': return '#f59e0b'; // amber
                case 'character': return '#10b981'; // green
                case 'element': return '#8b5cf6'; // purple
                case 'timeline': return '#f97316'; // orange
                default: 
                  return '#6b7280'; // gray
              }
            }}
            nodeStrokeWidth={3}
            nodeStrokeColor="#000000"
            nodeBorderRadius={4}
            maskColor="rgba(100, 100, 100, 0.1)"
            zoomable
            pannable
            style={{
              width: 200,
              height: 150,
              // Hide MiniMap only when we have no nodes to show
              opacity: nodes.length === 0 ? 0 : 1,
              pointerEvents: nodes.length === 0 ? 'none' : 'auto'
            }}
          />
        </ReactFlow>
      </div>
      
      {/* Detail Panel */}
      {selectedEntity && (
        <DetailPanelRefactored
          entity={selectedEntity.entity}
          entityType={selectedEntity.entityType}
          onClose={handleDetailPanelClose}
          allEntities={{
            characters,
            elements,
            puzzles,
            timeline
          }}
        />
      )}
    </div>
  );
}

/**
 * GraphView - Provider wrapper that enables React Flow context access.
 * 
 * This wrapper ensures the GraphViewComponent can access useReactFlow hook
 * for dynamic viewport management and other React Flow API features.
 * 
 * @component
 * @returns {JSX.Element} GraphViewComponent wrapped in ReactFlowProvider
 */
export default function GraphView() {
  return (
    <ReactFlowProvider>
      <GraphViewComponent />
    </ReactFlowProvider>
  );
}