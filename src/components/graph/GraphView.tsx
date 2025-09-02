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

import { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider
} from '@xyflow/react';
import type { Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import PuzzleNode from './nodes/PuzzleNode';
import CharacterNode from './nodes/CharacterNode';
import ElementNode from './nodes/ElementNode';
import TimelineNode from './nodes/TimelineNode';
import { DetailPanel } from '@/components/DetailPanel';
import { useViewConfig } from '@/hooks/useViewConfig';
import { useQuery } from '@tanstack/react-query';
import { graphApi } from '@/services/graphApi';
import { useViewportManager } from '@/hooks/useGraphState';
import { useGraphLayout } from '@/hooks/useGraphLayout';
import { useFilterSelectors } from '@/hooks/useFilterSelectors';
import { useFilterStore } from '@/stores/filterStore';
import { useViewStore } from '@/stores/viewStore';
import { FilterStatusBar } from './FilterStatusBar';
import { FloatingActionButton } from './FloatingActionButton';
import { GraphLoadingSkeleton } from './GraphLoadingSkeleton';

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
  connectionDepth,
  nodes 
}: { 
  searchTerm: string;
  selectedNodeId: string | null;
  connectionDepth: number | null;
  nodes: Node[];
}) {
  const viewportControls = useViewportManager(searchTerm, selectedNodeId, null, connectionDepth, nodes);
  
  // Initial fit to view on mount or when nodes change significantly
  const hasNodes = nodes.length > 0;
  const fitAll = viewportControls.fitAll;
  
  useEffect(() => {
    if (!hasNodes) return;
    
    // Small delay to ensure nodes are rendered
    const timer = setTimeout(() => {
      fitAll();
    }, 100);
    
    return () => clearTimeout(timer);
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
  const { config: viewConfig, viewType } = useViewConfig();
  
  // Update view store when viewType changes (fixes Bug 6a)
  useEffect(() => {
    useViewStore.setState({ currentViewType: viewType });
  }, [viewType]);
  
  // NEW: Single query to fetch complete graph from server
  // Server handles all relationship resolution and returns nodes + edges
  const { 
    data: graphData, 
    isLoading: isInitialLoading, 
    isError: hasAnyError,
    refetch: refetchAll 
  } = useQuery({
    queryKey: ['graph', 'complete', viewType],
    queryFn: () => graphApi.getComplete(viewConfig),
    staleTime: 5 * 60 * 1000,
    enabled: !!viewConfig, // Only fetch when we have a view config
  });
  
  // Extract nodes and edges from graph response
  const serverNodes = graphData?.nodes || [];
  const serverEdges = graphData?.edges || [];
  
  // Extract entities from nodes for DetailPanel
  const allEntities = useMemo(() => {
    const characters: any[] = [];
    const elements: any[] = [];
    const puzzles: any[] = [];
    const timeline: any[] = [];
    
    serverNodes.forEach((node: any) => {
      if (node.data?.entity && node.data?.metadata?.entityType) {
        switch (node.data.metadata.entityType) {
          case 'character':
            characters.push(node.data.entity);
            break;
          case 'element':
            elements.push(node.data.entity);
            break;
          case 'puzzle':
            puzzles.push(node.data.entity);
            break;
          case 'timeline':
            timeline.push(node.data.entity);
            break;
        }
      }
    });
    
    return { characters, elements, puzzles, timeline };
  }, [serverNodes]);
  
  // Log metadata if available
  useEffect(() => {
    if (graphData?.metadata?.missingEntities?.length) {
      console.warn('[GraphView] Missing entities detected:', graphData.metadata.missingEntities);
    }
  }, [graphData?.metadata]);
  
  // Use consolidated filter selector for better performance (1 subscription vs 14+)
  const filters = useFilterSelectors();
  
  // Destructure commonly used values for cleaner code
  const {
    searchTerm,
    selectedNodeId,
    setSelectedNode,
    connectionDepth,
    entityVisibility,
    characterSelectedTiers,
    characterType,
    puzzleSelectedActs,
    elementBasicTypes,
    elementStatus,
    hasActiveFilters
  } = filters;
  
  
  // Removed graphVersion anti-pattern that caused infinite re-renders
  

  // Initialize filters when view changes to ensure requested entities are visible
  useEffect(() => {
    if (viewConfig) {
      useFilterStore.getState().initializeFiltersForView(viewConfig);
    }
  }, [viewConfig?.name]); // Re-initialize when view changes



  /**
   * Use the new consolidated graph layout hook to calculate everything in one go.
   * Now using server-provided nodes and edges!
   */
  const { layoutedNodes, filteredEdges, totalUniverseNodes } = useGraphLayout({
    nodes: serverNodes,
    edges: serverEdges,
    viewConfig,
    // Individual filter values to avoid object recreation
    searchTerm,
    selectedNodeId,
    connectionDepth,
    entityVisibility,
    // Character filters as primitives
    characterType,
    characterSelectedTiers,
    // Puzzle filters as primitives
    puzzleSelectedActs,
    // Element filters as primitives
    elementBasicTypes,
    elementStatus
  });

  // Direct pass-through of computed nodes and edges to React Flow
  // This eliminates the race condition caused by useEffect synchronization delay
  // React Flow will always render with the current computed values
  const reactFlowNodes = layoutedNodes as Node[];
  const reactFlowEdges = filteredEdges;

  // Derive selected entity from selectedNodeId
  const selectedEntity = useMemo(() => {
    if (!selectedNodeId) return null;
    
    // Find the node with the selected ID from layouted nodes
    const node = layoutedNodes.find(n => n.id === selectedNodeId);
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
  }, [selectedNodeId, layoutedNodes]);

  // Click handlers for node interaction
  const onNodeClick = (nodeId: string) => {
    // Open detail panel for the clicked node
    setSelectedNode(nodeId);
  };
  
  const onEdgeClick = () => {
    // Edge click handler - currently no action needed
  };

  // Handle detail panel close - clears selection
  const handleDetailPanelClose = () => {
    setSelectedNode(null);
  };

  // Get selected node details for status bar
  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = layoutedNodes.find(n => n.id === selectedNodeId);
    if (!node) return null;
    return { id: node.id, name: node.data.label };
  }, [selectedNodeId, layoutedNodes]);

  // hasActiveFilters is now part of the filters object

  // Gate rendering until all data is loaded to prevent progressive rendering
  // Only show skeleton on initial load, not during updates
  // This prevents the flash of loading state when entities are added/updated
  if (isInitialLoading) {
    return <GraphLoadingSkeleton />;
  }
  
  // If we're not initially loading but data isn't all loaded yet,
  // keep showing the graph with existing data (prevents flashing)
  // The graph will update automatically when new data arrives
  
  // Handle error state
  if (hasAnyError) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading graph data</p>
          <button 
            onClick={() => refetchAll()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex">
      <div className="flex-1 relative">
        {/* Filter status bar with comprehensive feedback */}
        <FilterStatusBar
          totalNodes={totalUniverseNodes}
          visibleNodes={layoutedNodes.length}
          connectionDepth={connectionDepth ?? 0}
          selectedNode={selectedNodeData}
          hasActiveFilters={hasActiveFilters()}
        />
        
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodeClick={(_, node) => onNodeClick(node.id)}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          minZoom={0.1}
          maxZoom={2}
        >
          <ViewportController 
            searchTerm={searchTerm}
            selectedNodeId={selectedNodeId}
            connectionDepth={connectionDepth}
            nodes={reactFlowNodes}
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
              opacity: reactFlowNodes.length === 0 ? 0 : 1,
              pointerEvents: reactFlowNodes.length === 0 ? 'none' : 'auto'
            }}
          />
        </ReactFlow>
        
        {/* Floating Action Button - hide when detail panel is open */}
        <FloatingActionButton
          hidden={!!selectedNodeId}
        />
      </div>
      
      {/* Detail Panel */}
      {selectedEntity && (
        <DetailPanel
          entity={selectedEntity.entity}
          entityType={selectedEntity.entityType}
          onClose={handleDetailPanelClose}
          allEntities={allEntities}
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