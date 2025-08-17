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

import styles from './GraphView.module.css';

// Define custom node types - memoized to prevent recreation
const nodeTypes: NodeTypes = {
  character: CharacterNode,
  element: ElementNode,
  puzzle: PuzzleNode,
  timeline: TimelineNode,
  group: GroupNode,
};

// Define custom edge types (using default for now)
const edgeTypes: EdgeTypes = {};

interface GraphViewProps {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
  viewType?: ViewType;
  onNodeClick?: (node: Node) => void;
  onSelectionChange?: (params: OnSelectionChangeParams) => void;
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
    <div className={styles.graphContainer}>
      {/* Floating Toolbar - only show when React Flow is ready */}
      {isReady && (
        <div className={styles.floatingToolbar}>
          <button 
            className={styles.toolbarButton} 
            onClick={handleZoomIn}
            title="Zoom In"
            type="button"
          >
            <ZoomIn size={16} />
          </button>
          <button 
            className={styles.toolbarButton} 
            onClick={handleZoomOut}
            title="Zoom Out"
            type="button"
          >
            <ZoomOut size={16} />
          </button>
          
          <div className={styles.toolbarSeparator} />
          
          <button 
            className={styles.toolbarButton} 
            onClick={handleZoomToFit}
            title="Fit to View"
            type="button"
          >
            <Maximize size={16} />
          </button>
          <button 
            className={styles.toolbarButton} 
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
      <div className={styles.statsOverlay}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Nodes:</span>
          <span className={styles.statValue}>{nodes.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Edges:</span>
          <span className={styles.statValue}>{edges.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>View:</span>
          <span className={styles.statValue}>{viewType}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * GraphView component wrapped with ReactFlowProvider
 * This is necessary for our custom hooks to work properly
 */
const GraphView: React.FC<GraphViewProps> = (props) => {
  return (
    <ReactFlowProvider>
      <GraphViewInner {...props} />
    </ReactFlowProvider>
  );
};

export default GraphView;