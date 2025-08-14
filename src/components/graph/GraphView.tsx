import React, { useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import type {
  Node,
  NodeTypes,
  EdgeTypes,
  Connection,
  NodeMouseHandler,
  OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CharacterNode from './nodes/CharacterNode';
import ElementNode from './nodes/ElementNode';
import PuzzleNode from './nodes/PuzzleNode';
import TimelineNode from './nodes/TimelineNode';

import { buildGraph } from '@/lib/graph';
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
const GraphView: React.FC<GraphViewProps> = ({
  characters,
  elements,
  puzzles,
  timeline,
  viewType = 'puzzle-focus',
  onNodeClick,
  onSelectionChange,
}) => {
  const [, setSelectedNodeId] = useState<string | null>(null);
  
  // Build and layout the graph
  const graphData = useMemo(() => {
    console.time('Graph Building');
    
    // Build the graph from entities
    const graph = buildGraph({
      characters,
      elements,
      puzzles,
      timeline,
    }, {
      viewType,
      includeOrphans: true,
    });
    
    console.timeEnd('Graph Building');
    console.log(`Graph built with ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
    
    return graph;
  }, [characters, elements, puzzles, timeline, viewType]);
  
  // Initialize React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(graphData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData.edges);
  
  // Update nodes and edges when graph data changes
  React.useEffect(() => {
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
  }, [graphData, setNodes, setEdges]);
  
  // Handle node click
  const handleNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
    onNodeClick?.(node);
  }, [onNodeClick]);
  
  // Handle node hover for highlighting connections
  const handleNodeMouseEnter: NodeMouseHandler = useCallback((_, node) => {
    // Highlight connected edges
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: edge.source === node.id || edge.target === node.id,
        style: {
          ...edge.style,
          strokeWidth: edge.source === node.id || edge.target === node.id ? 2 : 1,
          opacity: edge.source === node.id || edge.target === node.id ? 1 : 0.3,
        },
      }))
    );
    
    // Dim non-connected nodes
    setNodes((nds) =>
      nds.map((n) => {
        const isConnected = edges.some(
          (e) => (e.source === node.id || e.target === node.id) && 
                 (e.source === n.id || e.target === n.id)
        );
        
        return {
          ...n,
          style: {
            ...n.style,
            opacity: n.id === node.id || isConnected ? 1 : 0.3,
          },
        };
      })
    );
  }, [edges, setEdges, setNodes]);
  
  // Handle node mouse leave
  const handleNodeMouseLeave: NodeMouseHandler = useCallback(() => {
    // Reset edge styles
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: false,
        style: {
          ...edge.style,
          strokeWidth: 1,
          opacity: 1,
        },
      }))
    );
    
    // Reset node opacity
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: 1,
        },
      }))
    );
  }, [setEdges, setNodes]);
  
  // Handle connection creation (for future editing)
  const onConnect = useCallback((params: Connection) => {
    console.log('Connection attempt:', params);
    // Future: Handle creating new relationships
  }, []);
  
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
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
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

export default GraphView;