import React, { useMemo, useCallback } from 'react';
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

import CharacterNode from './nodes/CharacterNode';
import ElementNode from './nodes/ElementNode';
import PuzzleNode from './nodes/PuzzleNode';
import TimelineNode from './nodes/TimelineNode';

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

import styles from './GraphView.module.css';

// Define custom node types
const nodeTypes: NodeTypes = {
  character: CharacterNode,
  element: ElementNode,
  puzzle: PuzzleNode,
  timeline: TimelineNode,
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
  // Build and layout the graph
  const graphData = useMemo(() => {
    console.time('Graph Building');
    
    // Build the graph from entities using the appropriate function for each view type
    const notionData = { characters, elements, puzzles, timeline };
    
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
  }, [characters, elements, puzzles, timeline, viewType]);
  
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
  
  // MiniMap node color
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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        disableKeyboardA11y={true}
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