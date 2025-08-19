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

import CharacterNode from './nodes/CharacterNode';
import ElementNode from './nodes/ElementNode';
import PuzzleNode from './nodes/PuzzleNode';
import TimelineNode from './nodes/TimelineNode';
import GroupNode from './nodes/GroupNode';

// Import custom edge components
import { edgeTypes as customEdgeTypes } from './edges';

// Import animation context
import { GraphAnimationProvider } from '@/contexts/GraphAnimationContext';

import { 
  buildGraph,
  buildPuzzleFocusGraph,
  buildCharacterJourneyGraph,
  buildContentStatusGraph 
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
}

/**
 * Main graph visualization component using React Flow
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
        graph = buildCharacterJourneyGraph(notionData);
        break;
      case 'content-status':
        graph = buildContentStatusGraph(notionData);
        break;
      default:
        // Fallback to generic build with sensible defaults
        graph = buildGraph(notionData, { viewType });
        break;
    }
    
    console.timeEnd('Graph Building');
    console.log(`Graph built with ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
    
    return graph;
  }, [notionData, viewType]); // Now depends on memoized notionData
  
  // Use our custom graph state hook
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
    initialGraphData: graphData,
    onNodeClick,
    onSelectionChange,
  });
  
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
        disableKeyboardA11y={true}
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
          <span className="text-gray-900 font-semibold">{nodes.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium">Edges:</span>
          <span className="text-gray-900 font-semibold">{edges.length}</span>
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
 */
const GraphView: React.FC<GraphViewProps> = (props) => {
  return (
    <ReactFlowProvider>
      <GraphViewWithAnimation {...props} />
    </ReactFlowProvider>
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