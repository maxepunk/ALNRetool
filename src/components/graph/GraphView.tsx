import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import type {
  Node,
  NodeTypes,
  EdgeTypes,
  OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GraphErrorBoundary } from '@/components/common/GraphErrorBoundary';

import CharacterNode from './nodes/CharacterNode';
import ElementNode from './nodes/ElementNode';
import PuzzleNode from './nodes/PuzzleNode';
import TimelineNode from './nodes/TimelineNode';
import GroupNode from './nodes/GroupNode';
import { CharacterTreeNode } from '../nodes/CharacterTreeNode';
import GraphControls from './GraphControls';
import type { FilterState } from './GraphControls';

// Import custom edge components
import { edgeTypes as customEdgeTypes } from './edges';

// Import animation context
import { GraphAnimationProvider } from '@/contexts/GraphAnimationContext';

import { 
  buildGraph,
  buildPuzzleFocusGraph,
  buildCharacterJourneyGraph,
  buildContentStatusGraph,
  buildFullConnectionGraph
} from '@/lib/graph';
import { useGraphState } from '@/hooks/useGraphState';
import { useGraphInteractions } from '@/hooks/useGraphInteractions';
import type { ViewType } from '@/lib/graph/types';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
} from 'lucide-react';

// CSS Module import removed - using Tailwind classes

// Define custom node types - memoized to prevent recreation
const nodeTypes: NodeTypes = {
  character: CharacterNode,
  characterTree: CharacterTreeNode,
  element: ElementNode,
  puzzle: PuzzleNode,
  timeline: TimelineNode,
  group: GroupNode,
};

// Use our custom edge types for different relationship types
const edgeTypes: EdgeTypes = customEdgeTypes;

interface GraphViewProps {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
  viewType?: ViewType;
  onNodeClick?: (node: Node) => void;
  onSelectionChange?: (params: OnSelectionChangeParams) => void;
  onGraphDataChange?: (data: { nodes: Node[]; edges: any[] }) => void;
  // View-specific options
  viewOptions?: {
    characterId?: string; // For character-journey view
    [key: string]: any;
  };
}

/**
 * GraphViewInner - Core graph visualization component with advanced filtering
 * 
 * @description
 * The main graph rendering component that integrates React Flow with our custom
 * node and edge types. Implements client-side filtering for search, act selection,
 * and puzzle isolation. All filtering is performed before passing data to React Flow
 * to avoid state management conflicts.
 * 
 * @features
 * - **Dynamic Graph Building**: Switches between puzzle-focus, character-journey, and content-status views
 * - **Real-time Filtering**: Applies search and filter criteria to nodes and edges
 * - **Performance Optimized**: Uses memoization for expensive graph computations
 * - **Session Persistence**: Maintains filter state across page refreshes
 * - **Connected Node Inclusion**: Search results include connected nodes for context
 * - **Recursive Traversal**: Puzzle isolation includes all dependencies
 * 
 * @param {GraphViewProps} props - Component props
 * @param {Character[]} props.characters - Character entities from Notion
 * @param {Element[]} props.elements - Element entities from Notion
 * @param {Puzzle[]} props.puzzles - Puzzle entities from Notion
 * @param {TimelineEvent[]} props.timeline - Timeline events from Notion
 * @param {ViewType} props.viewType - Current view mode (puzzle-focus, character-journey, content-status)
 * 
 * @complexity
 * - Graph building: O(n + e) where n = nodes, e = edges
 * - Filtering: O(n) for search, O(n*m) for connected nodes where m = avg connections
 * - Layout: O(n*log(n)) using Dagre's network-simplex algorithm
 * 
 * @performance
 * - Memoized graph data prevents unnecessary recalculations
 * - Filtered data computed once per filter change
 * - React Flow handles viewport optimizations
 * 
 * @flow
 * 1. Build graph from Notion entities based on view type
 * 2. Apply filters (search, acts, puzzle selection)
 * 3. Pass filtered data to React Flow
 * 4. Render with custom node/edge components
 * 
 * @since Sprint 2
 */
const GraphViewInner: React.FC<GraphViewProps> = ({
  characters,
  elements,
  puzzles,
  timeline,
  viewType = 'puzzle-focus',
  onNodeClick,
  onSelectionChange,
  onGraphDataChange,
  viewOptions = {},
}) => {
  // Memoize the notion data object to prevent unnecessary recalculations
  const notionData = useMemo(
    () => ({ characters, elements, puzzles, timeline }),
    [characters, elements, puzzles, timeline]
  );
  
  // Build and layout the graph - memoized for performance
  const graphData = useMemo(() => {
    console.time('Graph Building');
    
    // Build the graph from entities using the appropriate function for each view type
    let graph;
    switch (viewType) {
      case 'puzzle-focus':
        graph = buildPuzzleFocusGraph(notionData);
        break;
      case 'character-journey':
        // Use full connection web if specified, otherwise use filtered journey
        if (viewOptions.viewMode === 'full-web' && viewOptions.characterId) {
          graph = buildFullConnectionGraph(notionData, viewOptions.characterId, {
            maxDepth: viewOptions.expansionDepth || 3,  // Reduced default from 10 to 3 hops
            maxNodes: 250
          });
        } else {
          // Pass characterId to filter the journey
          graph = buildCharacterJourneyGraph(notionData, viewOptions.characterId);
        }
        break;
      case 'content-status':
        graph = buildContentStatusGraph(notionData);
        break;
      default:
        // Fallback to generic build with sensible defaults
        graph = buildGraph(notionData, { viewType });
        break;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd('Graph Building');
      console.log(`Graph built with ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
    }
    
    return graph;
  }, [notionData, viewType, viewOptions.characterId, viewOptions.viewMode, viewOptions.expansionDepth]); // Rebuild when data, view, or characterId changes
  
  // Use graph filtering hook first to get filter state
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const stored = sessionStorage.getItem('alnretool-graph-filters');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
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

  /**
   * Applies client-side filtering to graph data
   * 
   * @description
   * Filters nodes and edges based on search term, selected acts, and puzzle selection.
   * Filtering is performed before passing data to React Flow to avoid state conflicts.
   * 
   * @complexity
   * - Search: O(n) + O(e) for connected nodes
   * - Act filter: O(n*m) where m = elements/puzzles per act
   * - Puzzle isolation: O(n) worst case for full graph traversal
   * 
   * @algorithm
   * 1. Search filter: Fuzzy match on node labels, include connected nodes
   * 2. Act filter: Match elements/puzzles by firstAvailable/timing properties
   * 3. Puzzle filter: Recursive traversal to find all dependencies
   * 4. Edge filtering: Only include edges between visible nodes
   */
  const filteredGraphData = useMemo(() => {
    let filteredNodes = [...graphData.nodes];
    let filteredEdges = [...graphData.edges];
    
    // Apply search filter with fuzzy matching
    if (filterState.searchTerm) {
      const searchLower = filterState.searchTerm.toLowerCase();
      const matchingNodeIds = new Set<string>();
      
      filteredNodes.forEach(node => {
        const label = typeof node.data?.label === 'string' ? node.data.label.toLowerCase() : '';
        const entity = node.data?.entity as Character | Element | Puzzle | TimelineEvent | undefined;
        const name = typeof entity?.name === 'string' ? entity.name.toLowerCase() : '';
        const matches = label.includes(searchLower) || name.includes(searchLower);
        
        if (matches) {
          matchingNodeIds.add(node.id);
          // Include connected nodes
          graphData.edges.forEach(edge => {
            if (edge.source === node.id) matchingNodeIds.add(edge.target);
            if (edge.target === node.id) matchingNodeIds.add(edge.source);
          });
        }
      });
      
      if (matchingNodeIds.size > 0) {
        filteredNodes = filteredNodes.filter(node => matchingNodeIds.has(node.id));
      } else {
        filteredNodes = [];
      }
    }
    
    // Apply Act filter
    if (filterState.selectedActs.size > 0) {
      const actNodeIds = new Set<string>();
      
      elements.forEach(element => {
        if (element.firstAvailable && filterState.selectedActs.has(element.firstAvailable)) {
          const elementNode = filteredNodes.find(n => 
            n.type === 'element' && (n.data?.entity as Element | undefined)?.id === element.id
          );
          if (elementNode) {
            actNodeIds.add(elementNode.id);
            graphData.edges.forEach(edge => {
              if (edge.source === elementNode.id || edge.target === elementNode.id) {
                actNodeIds.add(edge.source);
                actNodeIds.add(edge.target);
              }
            });
          }
        }
      });
      
      puzzles.forEach(puzzle => {
        const hasSelectedAct = puzzle.timing?.some(act => 
          act && filterState.selectedActs.has(act)
        );
        if (hasSelectedAct) {
          const puzzleNode = filteredNodes.find(n =>
            n.type === 'puzzle' && (n.data?.entity as Puzzle | undefined)?.id === puzzle.id
          );
          if (puzzleNode) {
            actNodeIds.add(puzzleNode.id);
            graphData.edges.forEach(edge => {
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
    
    // Apply puzzle filter
    if (filterState.selectedPuzzleId) {
      const puzzleNodeIds = new Set<string>();
      const puzzleNode = filteredNodes.find(n =>
        n.type === 'puzzle' && (n.data?.entity as Puzzle | undefined)?.id === filterState.selectedPuzzleId
      );
      
      if (puzzleNode) {
        const findConnected = (nodeId: string, visited = new Set<string>()) => {
          if (visited.has(nodeId)) return;
          visited.add(nodeId);
          puzzleNodeIds.add(nodeId);
          
          graphData.edges.forEach(edge => {
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[GraphView] Filtered data:', {
        searchTerm: filterState.searchTerm,
        selectedActs: Array.from(filterState.selectedActs),
        selectedPuzzleId: filterState.selectedPuzzleId,
        originalNodes: graphData.nodes.length,
        filteredNodes: filteredNodes.length,
        originalEdges: graphData.edges.length,
        filteredEdges: filteredEdges.length,
        actuallyFiltered: filteredNodes.length !== graphData.nodes.length
      });
    }
    
    return { nodes: filteredNodes, edges: filteredEdges };
  }, [graphData, filterState, elements, puzzles]);
  
  // Use our custom graph state hook with filtered data
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    handleNodeClick,
    handleNodeMouseEnter,
    handleNodeMouseLeave,
    handleConnect,
  } = useGraphState({
    initialGraphData: filteredGraphData,
    onNodeClick,
    onSelectionChange,
  });
  
  // Save filter state to sessionStorage
  useEffect(() => {
    const toStore = {
      ...filterState,
      selectedActs: Array.from(filterState.selectedActs),
    };
    sessionStorage.setItem('alnretool-graph-filters', JSON.stringify(toStore));
  }, [filterState]);
  
  const handleFilterChange = useCallback((newState: FilterState) => {
    setFilterState(newState);
  }, []);
  
  const handleClearFilters = useCallback(() => {
    setFilterState({
      searchTerm: '',
      selectedActs: new Set(),
      selectedPuzzleId: null,
    });
  }, []);
  
  // Use graph interactions hook for additional features
  const {
    handleSelectionChange,
  } = useGraphInteractions({
    readOnly: true, // Sprint 1 is read-only
    onSelectionChange,
  });
  
  // Pass nodes and edges to parent for animation context
  useEffect(() => {
    if (onGraphDataChange && nodes.length > 0) {
      onGraphDataChange({ nodes, edges });
    }
  }, [nodes, edges, onGraphDataChange]);
  
  // Get React Flow instance for viewport controls
  const reactFlowInstance = useReactFlow();
  const [isReady, setIsReady] = useState(false);
  
  // Mark as ready when React Flow is initialized
  useEffect(() => {
    if (reactFlowInstance) {
      setIsReady(true);
    }
  }, [reactFlowInstance]);
  
  // Viewport control handlers
  const handleZoomIn = useCallback(() => {
    reactFlowInstance?.zoomIn({ duration: 200 });
  }, [reactFlowInstance]);
  
  const handleZoomOut = useCallback(() => {
    reactFlowInstance?.zoomOut({ duration: 200 });
  }, [reactFlowInstance]);
  
  const handleZoomToFit = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2, duration: 800 });
  }, [reactFlowInstance]);
  
  const handleResetView = useCallback(() => {
    reactFlowInstance?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 });
  }, [reactFlowInstance]);
  
  // Memoize nodeTypes and edgeTypes to prevent React Flow re-initialization
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);
  
  // MiniMap node color - memoized for stability
  const nodeColor = useCallback((node: Node) => {
    switch (node.type) {
      case 'character':
        return '#dc2626';
      case 'element':
        return '#3b82f6';
      case 'puzzle':
        return '#f59e0b';
      case 'timeline':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  }, []);
  
  return (
    <div className="w-full h-full relative bg-gray-50">
      {/* Graph Controls for Search and Filtering */}
      <GraphControls
        puzzles={puzzles}
        filterState={filterState}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        viewType={viewType}
      />
      
      {/* Floating Toolbar - only show when React Flow is ready */}
      {isReady && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-1 flex items-center gap-1 shadow-md z-10">
          <button 
            className="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer transition-colors hover:bg-gray-100" 
            onClick={handleZoomIn}
            title="Zoom In"
            type="button"
          >
            <ZoomIn size={16} />
          </button>
          <button 
            className="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer transition-colors hover:bg-gray-100" 
            onClick={handleZoomOut}
            title="Zoom Out"
            type="button"
          >
            <ZoomOut size={16} />
          </button>
          
          <div className="w-px h-6 bg-gray-200 mx-1" />
          
          <button 
            className="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer transition-colors hover:bg-gray-100" 
            onClick={handleZoomToFit}
            title="Fit to View"
            type="button"
          >
            <Maximize size={16} />
          </button>
          <button 
            className="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-md cursor-pointer transition-colors hover:bg-gray-100" 
            onClick={handleResetView}
            title="Reset View"
            type="button"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        onSelectionChange={handleSelectionChange}
        nodeTypes={memoizedNodeTypes}
        edgeTypes={memoizedEdgeTypes}
        fitView
        attributionPosition="bottom-left"
        style={{ width: '100%', height: '100%' }}
      >
        {/* SVG Marker Definitions for Edge Arrows */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <marker
              id="arrowclosed"
              viewBox="0 0 20 20"
              refX="19"
              refY="10"
              markerWidth="20"
              markerHeight="20"
              orient="auto"
            >
              <path
                d="M 2 2 L 18 10 L 2 18 Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
              />
            </marker>
            <marker
              id="arrow"
              viewBox="0 0 20 20"
              refX="19"
              refY="10"
              markerWidth="15"
              markerHeight="15"
              orient="auto"
            >
              <path
                d="M 2 2 L 18 10 L 2 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </marker>
          </defs>
        </svg>
        
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={12} 
          size={1} 
          color="#e5e7eb"
        />
        <Controls />
        <MiniMap 
          nodeColor={nodeColor}
          nodeStrokeWidth={3}
          pannable
          zoomable
        />
      </ReactFlow>
      
      {/* Stats overlay */}
      <div className="absolute top-5 right-5 bg-white rounded-lg px-4 py-3 shadow-lg flex gap-5 z-10 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium">Nodes:</span>
          <span className="text-gray-900 font-semibold">
            {nodes.length}
            {(filterState.searchTerm || filterState.selectedActs.size > 0 || filterState.selectedPuzzleId) && 
              <span className="text-gray-400">/{graphData.nodes.length}</span>
            }
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium">Edges:</span>
          <span className="text-gray-900 font-semibold">
            {edges.length}
            {(filterState.searchTerm || filterState.selectedActs.size > 0 || filterState.selectedPuzzleId) && 
              <span className="text-gray-400">/{graphData.edges.length}</span>
            }
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium">View:</span>
          <span className="text-gray-900 font-semibold">{viewType}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * GraphView component wrapped with necessary providers
 * ReactFlowProvider is needed for React Flow hooks
 * GraphAnimationProvider manages unified animation state
 * GraphErrorBoundary catches and handles rendering errors
 */
const GraphView: React.FC<GraphViewProps> = (props) => {
  return (
    <GraphErrorBoundary>
      <ReactFlowProvider>
        <GraphViewWithAnimation {...props} />
      </ReactFlowProvider>
    </GraphErrorBoundary>
  );
};

/**
 * Intermediate component that provides animation context
 * This needs to be inside ReactFlowProvider to access nodes/edges
 */
const GraphViewWithAnimation: React.FC<GraphViewProps> = (props) => {
  // This component will wrap GraphViewInner with GraphAnimationProvider
  // We need to render GraphViewInner first to get nodes/edges, then provide them to the context
  const [graphData, setGraphData] = useState<{ nodes: Node[]; edges: any[] }>({ nodes: [], edges: [] });
  
  return (
    <GraphAnimationProvider nodes={graphData.nodes} edges={graphData.edges}>
      <GraphViewInner {...props} onGraphDataChange={setGraphData} />
    </GraphAnimationProvider>
  );
};

export default GraphView;