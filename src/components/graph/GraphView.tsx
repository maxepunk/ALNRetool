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

import { useMemo, useEffect, useState, useCallback } from 'react';
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
import type { Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import PuzzleNode from './nodes/PuzzleNode';
import CharacterNode from './nodes/CharacterNode';
import ElementNode from './nodes/ElementNode';
import TimelineNode from './nodes/TimelineNode';
import GraphControls from './GraphControls';
import { DetailPanelRefactored } from '@/components/DetailPanel';
import { applyPureDagreLayout } from '@/lib/graph/layout/dagre';
import { useAllEntityData } from '@/hooks/generic/useEntityData';
import { charactersApi, elementsApi, puzzlesApi, timelineApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useViewConfig } from '@/hooks/useViewConfig';
import { resolveAllRelationships } from '@/lib/graph/relationships';
import type { GraphNode } from '@/lib/graph/types';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';
// Removed unused mutation imports
import { useFilterStore } from '@/stores/filterStore';

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
 * GraphView - Interactive graph visualization component.
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
export default function GraphView() {
  // Get view configuration from route
  const { config: viewConfig } = useViewConfig();
  
  /**
   * Selected node state for detail panel editing.
   * Contains the entity data and type for the detail panel.
   */
  const [selectedNode, setSelectedNode] = useState<{
    entity: Character | Element | Puzzle | TimelineEvent;
    entityType: 'character' | 'element' | 'puzzle' | 'timeline';
  } | null>(null);
  
  /**
   * Focused node ID for connection depth filtering.
   * When set, only nodes within N connections are shown.
   */
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  
  // Filter state from store
  const searchTerm = useFilterStore(state => state.searchTerm);
  const connectionDepth = useFilterStore(state => state.connectionDepth);
  const characterFilters = useFilterStore(state => state.characterFilters);
  const puzzleFilters = useFilterStore(state => state.puzzleFilters);
  
  console.log('GraphView render - searchTerm:', searchTerm);
  
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

  /**
   * Create all graph nodes from entity data.
   * Applies filtering based on view config and user selections.
   * 
   * @memoized Recalculates only when dependencies change
   * @returns {GraphNode[]} Array of nodes with positions and metadata
   */
  const allNodes = useMemo(() => {
    console.log('Creating nodes with searchTerm:', searchTerm);
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
      if (characterFilters.selectedTiers.size > 0) {
        const tier = character.tier || 'Standard';
        if (!characterFilters.selectedTiers.has(tier as any)) return false;
      }
      if (characterFilters.characterType !== 'all') {
        const type = character.type || 'Player';
        if (type !== characterFilters.characterType) return false;
      }
      return true;
    };
    
    /**
     * Check if a puzzle passes act and completion filters.
     * Handles Act format normalization ('Act 1' -> 'Act1').
     * 
     * @param {Puzzle} puzzle - Puzzle to check
     * @returns {boolean} True if passes all filters
     */
    const matchesPuzzleFilters = (puzzle: Puzzle): boolean => {
      // Check act filter
      if (puzzleFilters.selectedActs.size > 0) {
        // Puzzle has timing: Act[] field, not act field
        // Check if ANY of the puzzle's timing acts match the selected acts
        const puzzleActs = puzzle.timing || [];
        const hasMatchingAct = puzzleActs.some(act => {
          // Convert Act format ('Act 0', 'Act 1', 'Act 2') to filter format ('Act0', 'Act1', 'Act2')
          const normalizedAct = act ? act.replace(' ', '') : '';
          return puzzleFilters.selectedActs.has(normalizedAct);
        });
        
        console.log(`Puzzle ${puzzle.name} - Acts: ${puzzleActs.join(', ')}, Filter has: ${Array.from(puzzleFilters.selectedActs)}, Matches: ${hasMatchingAct}`);
        if (!hasMatchingAct) return false;
      }
      
      // Note: Puzzle type doesn't have a completed field
      // Completion status filtering would need to be implemented differently
      // For now, ignore completion status filter since the data doesn't support it
      if (puzzleFilters.completionStatus !== 'all') {
        console.warn(`Completion status filtering not supported - Puzzle type lacks 'completed' field`);
      }
      
      return true;
    };
    
    // Add puzzle nodes if enabled and they pass filters
    if (shouldFetchPuzzles) {
      puzzles.forEach(puzzle => {
        // Only filter by puzzle-specific filters, not search (search should highlight, not hide)
        if (matchesPuzzleFilters(puzzle)) {
          const isMatch = searchTerm ? matchesSearch(puzzle) : false;
          if (searchTerm && isMatch) {
            console.log(`Puzzle "${puzzle.name}" matches search "${searchTerm}"`);
          }
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
    
    // Add element nodes if enabled and they pass filters
    if (shouldFetchElements) {
      console.log(`[GraphView] Adding ${elements.length} element nodes`);
      elements.forEach(element => {
        // No element-specific filters currently, just add all
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
              searchMatch: searchTerm ? matchesSearch(element) : false
            }
          }
        });
      });
    }
    
    // Add timeline nodes if enabled and they pass filters
    if (shouldFetchTimeline) {
      timeline.forEach(timelineEvent => {
        // No timeline-specific filters currently, just add all
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
    characterFilters.selectedTiers,
    characterFilters.characterType,
    puzzleFilters.selectedActs,
    puzzleFilters.completionStatus
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
   * Uses the relationship resolution system to generate all edges.
   * 
   * @memoized Recalculates only when entities or nodes change
   * @returns {Edge[]} Array of edges with styling and metadata
   * 
   * **Edge Types Created:**
   * - requirement: Puzzle -> Element
   * - reward: Puzzle -> Element  
   * - ownership: Character -> Element
   * - dependency: Puzzle -> Puzzle
   * - timeline: Element -> Timeline
   */
  const allEdges = useMemo(() => {
    const edges = resolveAllRelationships(
      characters,
      elements, 
      puzzles,
      timeline,
      allNodes
    );
    console.log(`[GraphView] Created ${edges.length} total edges`);
    const rewardEdges = edges.filter(e => e.data?.relationshipType === 'reward');
    console.log(`[GraphView] Found ${rewardEdges.length} reward edges:`, rewardEdges);
    return edges;
  }, [characters, elements, puzzles, timeline, allNodes]);

  // Filter nodes based on focused node and depth
  const filteredNodes = useMemo(() => {
    if (!focusedNodeId || !connectionDepth || connectionDepth > 10) {
      return allNodes;
    }
    
    // Get the set of node IDs within depth
    const nodesWithinDepth = getNodesWithinDepth(
      focusedNodeId,
      allNodes,
      allEdges,
      connectionDepth
    );
    
    // Filter nodes to only include those within depth and add focus metadata
    return allNodes
      .filter(node => nodesWithinDepth.has(node.id))
      .map(node => ({
        ...node,
        data: {
          ...node.data,
          metadata: {
            ...node.data.metadata,
            isFocused: node.id === focusedNodeId
          }
        }
      }));
  }, [allNodes, allEdges, focusedNodeId, connectionDepth, getNodesWithinDepth]);

  // Filter edges based on visible nodes
  const filteredEdges = useMemo(() => {
    if (!focusedNodeId || !connectionDepth || connectionDepth > 10) {
      return allEdges;
    }
    
    // Get the set of node IDs within depth
    const nodesWithinDepth = getNodesWithinDepth(
      focusedNodeId,
      allNodes,
      allEdges,
      connectionDepth
    );
    
    // Filter edges to only include those between visible nodes
    return allEdges.filter(edge => 
      nodesWithinDepth.has(edge.source) && nodesWithinDepth.has(edge.target)
    );
  }, [allNodes, allEdges, focusedNodeId, connectionDepth, getNodesWithinDepth]);

  // Apply layout to nodes using view config
  const layoutedNodes = useMemo(() => {
    if (filteredNodes.length === 0) return [];
    
    // Apply layout with view-specific configuration
    const layoutConfig = {
      direction: (viewConfig.layout.direction === 'LR' || viewConfig.layout.direction === 'TB') 
        ? viewConfig.layout.direction 
        : 'LR' as const,
      nodeSpacing: viewConfig.layout.spacing?.nodeSpacing || 100,
      rankSpacing: viewConfig.layout.spacing?.rankSpacing || 300
    };
    
    return applyPureDagreLayout(filteredNodes, filteredEdges, layoutConfig);
  }, [filteredNodes, filteredEdges, viewConfig]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(filteredEdges);
  
  // Update nodes when layout changes
  useEffect(() => {
    setNodes(layoutedNodes);
  }, [layoutedNodes, setNodes]);
  
  // Update edges when they change
  useEffect(() => {
    setEdges(filteredEdges);
  }, [filteredEdges, setEdges]);

  // Click handlers for node interaction
  const onNodeClick = (nodeId: string) => {
    // Find the clicked node in our data
    const clickedNode = layoutedNodes.find(node => node.id === nodeId);
    if (!clickedNode) return;
    
    const nodeData = clickedNode.data;
    if (!nodeData.entity || !nodeData.metadata?.entityType) return;
    
    // Toggle focused node for depth filtering
    if (focusedNodeId === nodeId) {
      // Clicking the same node again unfocuses it
      setFocusedNodeId(null);
    } else {
      // Set as focused node for depth filtering
      setFocusedNodeId(nodeId);
    }
    
    // Set selected node for detail panel
    setSelectedNode({
      entity: nodeData.entity,
      entityType: nodeData.metadata.entityType
    });
  };
  
  const onEdgeClick = (edgeId: string) => {
    console.log('Edge clicked:', edgeId);
  };
  
  // Update selectedNode.entity with fresh data after mutations
  useEffect(() => {
    if (selectedNode) {
      // Find the updated entity in the refreshed data arrays
      let updatedEntity: Character | Element | Puzzle | TimelineEvent | null = null;
      
      switch (selectedNode.entityType) {
        case 'character':
          updatedEntity = characters.find(c => c.id === selectedNode.entity.id) || null;
          break;
        case 'element':
          updatedEntity = elements.find(e => e.id === selectedNode.entity.id) || null;
          break;
        case 'puzzle':
          updatedEntity = puzzles.find(p => p.id === selectedNode.entity.id) || null;
          break;
        case 'timeline':
          updatedEntity = timeline.find(t => t.id === selectedNode.entity.id) || null;
          break;
      }
      
      // Update selectedNode with fresh entity data if found
      if (updatedEntity && updatedEntity !== selectedNode.entity) {
        setSelectedNode({
          ...selectedNode,
          entity: updatedEntity
        });
      }
    }
  }, [selectedNode, characters, elements, puzzles, timeline]);

  // Handle detail panel close - also clears focus
  const handleDetailPanelClose = () => {
    setSelectedNode(null);
    setFocusedNodeId(null);  // Clear focus when closing detail panel
  };

  return (
    <div className="h-full w-full flex">
      <div className="flex-1 relative">
        {/* Focus indicator - shows when a node is selected */}
        {focusedNodeId && connectionDepth && connectionDepth <= 10 && (
          <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Viewing connections within </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{connectionDepth}</span>
              <span className="text-gray-600 dark:text-gray-400"> levels</span>
            </div>
          </div>
        )}
        
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => onNodeClick(node.id)}
            onEdgeClick={(_, edge) => onEdgeClick(edge.id)}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={16} 
              size={1} 
              className="bg-gray-50 dark:bg-gray-900"
            />
            <Controls />
            <MiniMap />
            <GraphControls />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      
      {/* Detail Panel */}
      {selectedNode && (
        <DetailPanelRefactored
          entity={selectedNode.entity}
          entityType={selectedNode.entityType}
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