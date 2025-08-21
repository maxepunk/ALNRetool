import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
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

// Import custom edge components
import { edgeTypes as customEdgeTypes } from './edges';

// Import animation context
import { GraphAnimationProvider } from '@/contexts/GraphAnimationContext';

// Import Zustand stores
import { useFilterStore } from '@/stores/filterStore';

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

import type { DepthMetadata } from '@/lib/graph/types';

interface GraphViewProps {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
  viewType?: ViewType;
  onNodeClick?: (node: Node) => void;
  onSelectionChange?: (params: OnSelectionChangeParams) => void;
  onGraphDataChange?: (data: { nodes: Node[]; edges: any[]; depthMetadata?: DepthMetadata }) => void;
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
 * node and edge types. Note: Filtering is now handled by upstream graph building
 * functions and parent components before data is passed to GraphView, not within
 * this component itself.
 * 
 * @features
 * - **Dynamic Graph Building**: Switches between puzzle-focus, character-journey, and content-status views
 * - **Pre-filtered Data**: Receives already filtered data from parent components
 * - **Performance Optimized**: Uses memoization for expensive graph computations
 * - **Session Persistence**: Filter state maintained by parent components/stores
 * - **Custom Node/Edge Types**: Renders with specialized components for each entity type
 * - **Interactive Controls**: Zoom, pan, and minimap through GraphControls
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
 * 2. Receive pre-filtered data from parent components
 * 3. Pass data directly to React Flow
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
        // Pass characterId and character filters to filter the journey
        graph = buildCharacterJourneyGraph(notionData, viewOptions.characterId, viewOptions.characterFilters);
        break;
      case 'node-connections':
        // Build full connection web for any node type
        console.log('📍 GraphView: Building node connections for:', viewOptions.nodeType, viewOptions.nodeId);
        graph = buildFullConnectionGraph(
          notionData,
          viewOptions.nodeId,
          viewOptions.nodeType,
          {
            maxDepth: viewOptions.expansionDepth || 3,
            maxNodes: 250
          }
        );
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
  }, [notionData, viewType, viewOptions.characterId, viewOptions.nodeId, viewOptions.nodeType, viewOptions.expansionDepth]); // Rebuild when data, view, or node selection changes
  
  // Get filter state from Zustand store
  const searchTerm = useFilterStore(state => state.searchTerm);
  const puzzleFilters = useFilterStore(state => state.puzzleFilters);
  const characterFilters = useFilterStore(state => state.characterFilters);
  const contentFilters = useFilterStore(state => state.contentFilters);
  const setActiveView = useFilterStore(state => state.setActiveView);
  
  // Create filterState object for backward compatibility with existing filter logic
  const filterState = useMemo(() => ({
    searchTerm,
    selectedActs: puzzleFilters.selectedActs,
    selectedPuzzleId: puzzleFilters.selectedPuzzleId,
    // Add new filter types
    characterFilters,
    contentFilters,
  }), [searchTerm, puzzleFilters, characterFilters, contentFilters]);
  
  // Set active view when component mounts or viewType changes
  useEffect(() => {
    setActiveView(viewType);
  }, [viewType, setActiveView]);
  

  /**
   * Pass-through for pre-filtered graph data
   * 
   * @description
   * Filtering is now handled by upstream graph building functions
   * and parent components before data reaches GraphView. This ensures
   * consistency and avoids duplicate filtering logic.
   */
  const filteredGraphData = useMemo(() => {
    // Data is already filtered by parent components/hooks
    // Simply pass through without additional filtering
    return graphData;
  }, [graphData]);
  
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
  
  // No need for manual sessionStorage - handled by Zustand persist middleware
  
  // Get filter actions from store
  
  // Use graph interactions hook for additional features
  const {
    handleSelectionChange,
  } = useGraphInteractions({
    readOnly: true, // Sprint 1 is read-only
    onSelectionChange,
  });
  
  // Pass nodes, edges, and depth metadata to parent for animation context and UI feedback
  useEffect(() => {
    if (onGraphDataChange && nodes.length > 0) {
      console.log('🎯 GraphView: Calling onGraphDataChange with depthMetadata:', graphData.depthMetadata);
      onGraphDataChange({ nodes, edges, depthMetadata: graphData.depthMetadata });
    }
  }, [nodes, edges, graphData.depthMetadata, onGraphDataChange]);
  
  
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
    <GraphAnimationProvider edges={edges}>
      <div className="w-full h-full relative bg-gray-50" style={{ minHeight: '400px' }}>
        {/* Graph Controls for Zoom and Layout */}
        <GraphControls />
        
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
    </GraphAnimationProvider>
  );
};

/**
 * GraphView component wrapped with necessary providers
 * ReactFlowProvider is needed for React Flow hooks
 * GraphAnimationProvider (now inside GraphViewInner) manages unified animation state
 * GraphErrorBoundary catches and handles rendering errors
 */
const GraphView: React.FC<GraphViewProps> = (props) => {
  return (
    <GraphErrorBoundary>
      <ReactFlowProvider>
        <GraphViewInner {...props} />
      </ReactFlowProvider>
    </GraphErrorBoundary>
  );
};

export default GraphView;