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
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider
} from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import PuzzleNode from './nodes/PuzzleNode';
import CharacterNode from './nodes/CharacterNode';
import ElementNode from './nodes/ElementNode';
import TimelineNode from './nodes/TimelineNode';
import { DetailPanel } from '@/components/DetailPanel';
import { useViewConfig } from '@/hooks/useViewConfig';
import { useQuery } from '@tanstack/react-query';
import { charactersApi, puzzlesApi, elementsApi, timelineApi } from '@/services/api';
import { useViewportManager } from '@/hooks/useGraphState';
import { useGraphLayout } from '@/hooks/useGraphLayout';
import { useFilterStore } from '@/stores/filterStore';
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
  const { config: viewConfig } = useViewConfig();
  
  // Use unified data loading to prevent progressive rendering
  // Fetch all entity data using individual API calls
  const { data: characters = [], isLoading: loadingCharacters } = useQuery({
    queryKey: ['characters', 'all'],
    queryFn: () => charactersApi.listAll(),
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: puzzles = [], isLoading: loadingPuzzles } = useQuery({
    queryKey: ['puzzles', 'all'],
    queryFn: () => puzzlesApi.listAll(),
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: elements = [], isLoading: loadingElements } = useQuery({
    queryKey: ['elements', 'all'],
    queryFn: () => elementsApi.listAll(),
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: timeline = [], isLoading: loadingTimeline } = useQuery({
    queryKey: ['timeline', 'all'],
    queryFn: () => timelineApi.listAll(),
    staleTime: 5 * 60 * 1000,
  });
  
  const isInitialLoading = loadingCharacters || loadingPuzzles || loadingElements || loadingTimeline;
  const hasAnyError = false; // For now, we'll handle errors differently
  const refetchAll = () => {
    // Not needed for now
  };
  
  // Filter state from store - use individual selectors to avoid unstable references
  const searchTerm = useFilterStore(state => state.searchTerm);
  const selectedNodeId = useFilterStore(state => state.selectedNodeId);
  const focusedNodeId = useFilterStore(state => state.focusedNodeId);
  const setSelectedNode = useFilterStore(state => state.setSelectedNode);
  const setFocusedNode = useFilterStore(state => state.setFocusedNode);
  const connectionDepth = useFilterStore(state => state.connectionDepth);
  const filterMode = useFilterStore(state => state.filterMode);
  const focusRespectFilters = useFilterStore(state => state.focusRespectFilters);
  
  // Entity visibility selectors
  const entityVisibility = useFilterStore(state => state.entityVisibility);
  
  // Character filter selectors
  const characterSelectedTiers = useFilterStore(state => state.characterFilters.selectedTiers);
  const characterType = useFilterStore(state => state.characterFilters.characterType);
  
  // Puzzle filter selectors
  const puzzleSelectedActs = useFilterStore(state => state.puzzleFilters.selectedActs);
  
  // Content filter selectors
  const elementBasicTypes = useFilterStore(state => state.contentFilters.elementBasicTypes);
  const elementStatus = useFilterStore(state => state.contentFilters.elementStatus);
  
  // Individual filter values are passed directly to avoid object recreation
  
  
  // Removed graphVersion anti-pattern that caused infinite re-renders
  

  // Initialize filters when view changes to ensure requested entities are visible
  useEffect(() => {
    if (viewConfig) {
      useFilterStore.getState().initializeFiltersForView(viewConfig);
    }
  }, [viewConfig?.name]); // Re-initialize when view changes



  /**
   * Use the new consolidated graph layout hook to calculate everything in one go.
   * This eliminates the 11-stage deferred rendering pipeline and visual desync issues.
   */
  const { layoutedNodes, filteredEdges, totalUniverseNodes } = useGraphLayout({
    characters,
    elements,
    puzzles,
    timeline,
    viewConfig,
    // Individual filter values to avoid object recreation
    searchTerm,
    focusedNodeId,
    connectionDepth,
    filterMode,
    focusRespectFilters,
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

  // React Flow state - initialize with empty state to avoid race conditions
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Sync computed values to React Flow state atomically to prevent race conditions
  useEffect(() => {
    // Update both nodes and edges in a single effect to ensure atomic updates
    // This prevents React Flow from rendering incomplete graph state that breaks
    // minimap and edge rendering during layout transitions
    // Using React's automatic batching (React 18+) for synchronous updates
    
    setNodes(layoutedNodes as Node[]);
    setEdges(filteredEdges);
  }, [layoutedNodes, filteredEdges]); // Fixed infinite loop - removed setNodes, setEdges from deps

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
    const node = layoutedNodes.find(n => n.id === focusedNodeId);
    if (!node) return null;
    return { id: node.id, name: node.data.label };
  }, [focusedNodeId, layoutedNodes]);

  // Check if there are active filters
  const hasActiveFilters = useFilterStore(state => state.hasActiveFilters);

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
            onClick={refetchAll}
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