import React, { useMemo, useEffect, useState } from 'react';
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
import { AsyncLayoutErrorBoundary } from '@/components/common/AsyncLayoutErrorBoundary';
import { logger } from '@/lib/graph/utils/Logger'


import CharacterNode from './nodes/CharacterNode';
import ElementNode from './nodes/ElementNode';
import PuzzleNode from './nodes/PuzzleNode';
import TimelineNode from './nodes/TimelineNode';
import GroupNode from './nodes/GroupNode';
import { CharacterTreeNode } from '@/components/nodes/CharacterTreeNode';
import GraphControls from './GraphControls';
import { LayoutProgress } from './LayoutProgress';

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
  buildNodeConnectionsGraph,
  applyLayout
} from '@/lib/graph';
import { useGraphContextOptional } from '@/contexts/GraphContextProvider';
import { useGraphState } from '@/hooks/useGraphState';
import { useGraphInteractions } from '@/hooks/useGraphInteractions';
import { useAsyncLayout } from '@/hooks/useAsyncLayout';
import { useGraphStore } from '@/stores/graphStore';
import { useDebounce } from '@/hooks/useDebounce';
import type { ViewType, GraphData } from '@/lib/graph/types';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

// Define custom node types - memoized to prevent recreation
const nodeTypes: NodeTypes = {
  character: CharacterNode,
  element: ElementNode,
  puzzle: PuzzleNode,
  timeline: TimelineNode,
  characterTree: CharacterTreeNode,
  group: GroupNode,
} as const;

// Use custom edge types
const edgeTypes: EdgeTypes = customEdgeTypes;

export interface GraphViewProps {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
  viewType?: ViewType;
  onNodeClick?: (node: Node) => void;
  onSelectionChange?: (params: OnSelectionChangeParams) => void;
  onGraphDataChange?: (data: { nodes: Node[]; edges: any[]; depthMetadata?: any }) => void;
  viewOptions?: {
    characterId?: string;
    nodeId?: string;
    nodeType?: 'character' | 'puzzle' | 'element' | 'timeline';
    expansionDepth?: number;
    characterFilters?: any;
  };
}

/**
 * GraphView Component
 * Enhanced version with async layout support and progress tracking
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
  // Memoize the notion data object
  const notionData = useMemo(
    () => ({ characters, elements, puzzles, timeline }),
    [characters, elements, puzzles, timeline]
  );
  
  // Get graph context if available
  const graphContext = useGraphContextOptional();
  
  // Track whether we need async layout (force layouts)
  const [needsAsyncLayout, setNeedsAsyncLayout] = useState(false);
  const [processedGraph, setProcessedGraph] = useState<GraphData | null>(null);
  
  // Get selected layout algorithm from store
  const layoutAlgorithm = useGraphStore(state => state.layoutAlgorithm);
  const lastLayoutTimestamp = useGraphStore(state => state.lastLayoutTimestamp);
  
  // Debounce layout algorithm changes to prevent excessive re-layouts
  const debouncedLayoutAlgorithm = useDebounce(layoutAlgorithm, 300);
  
  // Use async layout hook
  const {
    isLayouting,
    layoutProgress,
    error: layoutError,
    applyLayoutAsync,
    cancelLayout,
  } = useAsyncLayout({
    onComplete: (graph) => {
      logger.debug('✅ Async layout completed');
      setProcessedGraph(graph);
    },
    onError: (error) => {
      logger.error('❌ Async layout failed:', undefined, error);
    },
  });
  
  // Build the graph structure (without layout)
  const rawGraphData = useMemo(() => {
      // Use unique timer ID to prevent collisions
    const timerId = import.meta.env.DEV 
      ? `GraphView-Build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      : '';
    
    if (import.meta.env.DEV) {
      console.time(timerId);
    }
    
    // Runtime validation for required parameters
    if (viewType === 'puzzle-focus' && !viewOptions.nodeId) {
      logger.error('[GraphView] puzzle-focus view requires nodeId in viewOptions');
      return { nodes: [], edges: [] };
    }
    if (viewType === 'character-journey' && !viewOptions.characterId) {
      logger.error('[GraphView] character-journey view requires characterId in viewOptions');
      return { nodes: [], edges: [] };
    }
    if (viewType === 'node-connections' && (!viewOptions.nodeId || !viewOptions.nodeType)) {
      logger.error('[GraphView] node-connections view requires nodeId and nodeType in viewOptions');
      return { nodes: [], edges: [] };
    }
    
    let graph;
    switch (viewType) {
      case 'puzzle-focus':
        graph = buildPuzzleFocusGraph(notionData, viewOptions.nodeId, viewOptions.expansionDepth);
        break;
      case 'character-journey':
        graph = buildCharacterJourneyGraph(notionData, viewOptions.characterId || '', viewOptions.characterFilters);
        break;
      case 'node-connections':
        graph = buildNodeConnectionsGraph(
          notionData,
          viewOptions.nodeId!,
          viewOptions.nodeType!,
          viewOptions.expansionDepth || 3,
          250
        );
        break;
      case 'content-status':
        graph = buildContentStatusGraph(notionData);
        break;
      default:
        graph = buildGraph(notionData, { viewType });
        break;
    }
    
    if (import.meta.env.DEV) {
      console.timeEnd(timerId);
      logger.debug(`Graph built with ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
    }
    
    return graph;
  }, [notionData, viewType, viewOptions.characterId, viewOptions.nodeId, viewOptions.nodeType, viewOptions.expansionDepth]);
  
  // Determine if we need async layout based on selected algorithm and node count
  useEffect(() => {
    const isForceLayout = debouncedLayoutAlgorithm === 'force' || debouncedLayoutAlgorithm === 'force-atlas2';
    const hasLargeGraph = rawGraphData.nodes.length > 100;
    
    // Only use async for force layouts on large graphs
    // Small graphs can use synchronous force layout
    setNeedsAsyncLayout(isForceLayout && hasLargeGraph);
  }, [debouncedLayoutAlgorithm, rawGraphData.nodes.length]);
  
  // Apply layout when graph changes or layout algorithm changes
  useEffect(() => {
    if (!rawGraphData || rawGraphData.nodes.length === 0) {
      setProcessedGraph(rawGraphData);
      return;
    }
    
    // Use the debounced layout algorithm
    const layoutConfig = {
      layoutType: debouncedLayoutAlgorithm as any,
      viewType: viewType,
      direction: 'LR' as const,
      spacing: {
        nodeSpacing: 100,
        rankSpacing: 300
      }
    };
    
    if (needsAsyncLayout) {
      // Apply async layout for force layouts or large graphs
      logger.debug('🔄 Applying async layout with algorithm:', undefined, debouncedLayoutAlgorithm);
      applyLayoutAsync(rawGraphData, layoutConfig);
    } else {
      // Apply synchronous layout for small graphs with fast algorithms
      logger.debug('⚡ Applying sync layout with algorithm:', undefined, debouncedLayoutAlgorithm);
      
      // Use graphContext if available, otherwise use imported applyLayout
      const layoutedGraph = graphContext 
        ? graphContext.layoutOrchestrator.applyLayout(rawGraphData, layoutConfig)
        : applyLayout(rawGraphData, layoutConfig); // Use imported applyLayout as fallback
      
      // Debug: Check positions after layout
      if (layoutedGraph.nodes.length > 0) {
        const sampleNodes = layoutedGraph.nodes.slice(0, 3);
        logger.debug('[GraphView] Received layout positions:', undefined, sampleNodes.map(n => ({ id: n.id, x: n.position?.x, y: n.position?.y }))
        );
      }
      
      setProcessedGraph(layoutedGraph);
    }
    
    // Cleanup function to cancel ongoing layout
    return () => {
      if (needsAsyncLayout) {
        cancelLayout();
      }
    };
  }, [rawGraphData, viewType, needsAsyncLayout, debouncedLayoutAlgorithm, lastLayoutTimestamp]);
  
  // Use the processed graph (with layout applied) or raw graph if still processing
  const graphData = processedGraph || rawGraphData;
  
  // Get filter state from Zustand store
  const setActiveView = useFilterStore(state => state.setActiveView);
  
  // Set active view when component mounts or viewType changes
  useEffect(() => {
    setActiveView(viewType);
  }, [viewType, setActiveView]);
  
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
  
  // Use graph interactions hook
  const {
    handleSelectionChange,
  } = useGraphInteractions({
    readOnly: true,
    onSelectionChange,
  });
  
  // Pass data to parent
  useEffect(() => {
    if (onGraphDataChange && nodes.length > 0) {
      onGraphDataChange({ nodes, edges, depthMetadata: graphData.depthMetadata });
    }
  }, [nodes, edges, graphData.depthMetadata, onGraphDataChange]);
  
  // Memoize nodeTypes and edgeTypes
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);
  
  return (
    <div className="relative w-full h-full">
      {/* Layout Progress Overlay */}
      {isLayouting && (
        <LayoutProgress
          progress={layoutProgress}
          message={`Calculating ${needsAsyncLayout ? 'force-directed' : ''} layout...`}
          onCancel={needsAsyncLayout ? cancelLayout : undefined}
        />
      )}
      
      {/* Layout Error Message */}
      {layoutError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
            Layout failed: {layoutError}
          </div>
        </div>
      )}
      
      {/* React Flow Graph */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={memoizedNodeTypes}
        edgeTypes={memoizedEdgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        onConnect={handleConnect}
        onSelectionChange={handleSelectionChange}
        minZoom={0.1}
        maxZoom={2}
        fitView
        fitViewOptions={{
          padding: 0.2,
          duration: 800,
        }}
        defaultEdgeOptions={{
          animated: false,
          type: 'smoothstep',
        }}
        className="bg-gradient-to-br from-background via-background to-background/95"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="opacity-30"
        />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'character':
              case 'characterTree':
                return '#10b981';
              case 'element':
                return '#8b5cf6';
              case 'puzzle':
                return '#f59e0b';
              case 'timeline':
                return '#ef4444';
              case 'group':
                return '#6b7280';
              default:
                return '#94a3b8';
            }
          }}
          className="shadow-lg"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />
        <Controls className="shadow-lg" />
        <GraphControls />
      </ReactFlow>
    </div>
  );
};

// Wrap with providers
export const GraphView: React.FC<GraphViewProps> = (props) => (
  <GraphErrorBoundary>
    <AsyncLayoutErrorBoundary fallbackLayout="dagre">
      <ReactFlowProvider>
        <GraphAnimationProvider>
          <GraphViewInner {...props} />
        </GraphAnimationProvider>
      </ReactFlowProvider>
    </AsyncLayoutErrorBoundary>
  </GraphErrorBoundary>
);

export default GraphView;