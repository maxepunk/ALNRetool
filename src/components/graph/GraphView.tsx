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

import { useMemo, useEffect, useRef, useState } from 'react';
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
import PlaceholderNode from './nodes/PlaceholderNode';
import { DetailPanel } from '@/components/DetailPanel';
import { useViewConfig } from '@/hooks/useViewConfig';
import { useQuery } from '@tanstack/react-query';
import { graphApi } from '@/services/graphApi';
import { useViewportManager } from '@/hooks/useGraphState';
import { useGraphLayout } from '@/hooks/useGraphLayout';
import { useFilterSelectors } from '@/hooks/useFilterSelectors';
import { useFilterStore } from '@/stores/filterStore';
import { useViewStore } from '@/stores/viewStore';
import { UnifiedToolbar } from './UnifiedToolbar';
import { FloatingActionButton } from './FloatingActionButton';
import { GraphLoadingSkeleton } from './GraphLoadingSkeleton';
import { LayoutProgress } from './LayoutProgress/LayoutProgress';
import { useGraphInteractions } from '@/hooks/useGraphInteractions';
import { GraphDataContextProvider } from '@/contexts/GraphDataContext';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { useNavigationTracking } from '@/hooks/useNavigationTracking';
import { useIsMobile } from '@/hooks/useIsMobile';

/**
 * Wrapper to add data-testid to all node components for E2E testing
 * This ensures Playwright can reliably select nodes using [data-testid="node-{id}"]
 * The wrapper clones the component's root element and adds the data-testid
 */
const withTestId = (Component: React.ComponentType<any>) => {
  const WrappedComponent = (props: any) => {
    // Pass a modified props that will be used by the node's root div
    const propsWithTestId = {
      ...props,
      'data-testid': `node-${props.id}`
    };
    return <Component {...propsWithTestId} />;
  };
  WrappedComponent.displayName = `WithTestId(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Custom node component mapping for React Flow.
 * Each entity type has a specialized node component.
 * Wrapped with data-testid for E2E testing.
 * 
 * @constant {Record<string, React.ComponentType>} nodeTypes
 */
const nodeTypes = {
  puzzle: withTestId(PuzzleNode),
  character: withTestId(CharacterNode),
  element: withTestId(ElementNode),
  timeline: withTestId(TimelineNode),
  // Placeholder nodes use default rendering for missing/broken references
  placeholder: withTestId(PlaceholderNode),
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
  const fitAll = viewportControls.fitAll;
  
  // Track previous node count to detect true 0→>0 transitions
  const previousNodeCountRef = useRef(nodes.length);
  
  useEffect(() => {
    const previousCount = previousNodeCountRef.current;
    const currentCount = nodes.length;
    
    // Only fit when truly going from 0 to >0 nodes (initial load or after complete clear)
    // Ignore temporary empty states during mutations
    if (previousCount === 0 && currentCount > 0) {
      // Small delay to ensure nodes are rendered
      const timer = setTimeout(() => {
        fitAll();
      }, 100);
      
      // Update ref after scheduling fitAll
      previousNodeCountRef.current = currentCount;
      
      return () => clearTimeout(timer);
    }
    
    // Always update the ref to track current count
    previousNodeCountRef.current = currentCount;
  }, [nodes.length, fitAll]); // Track actual count, not boolean
  
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
  
  // Get UI store state for DetailPanel minimization
  const isDetailPanelMinimized = useUIStore(state => state.detailPanelMinimized);
  
  // React Flow instance not needed anymore since double-click removed
  
  // State for layout progress tracking
  const [isLayouting, setIsLayouting] = useState(false);
  const [layoutProgress, setLayoutProgress] = useState(0);
  
  // Update view store when viewType changes (fixes Bug 6a)
  useEffect(() => {
    console.log('[GraphView] View changed to:', viewType);
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
    queryKey: ['graph', 'complete'],
    queryFn: () => {
      return graphApi.getComplete(); // viewConfig removed - filtering happens client-side
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!viewConfig, // Only fetch when we have a view config
    select: (data) => {
      const allEntities = {
        characters: [] as any[],
        elements: [] as any[],
        puzzles: [] as any[],
        timeline: [] as any[],
      };
      if (data && data.nodes) {
        data.nodes.forEach((node: any) => {
          if (node.data?.entity && node.data?.metadata?.entityType) {
            switch (node.data.metadata.entityType) {
              case 'character':
                allEntities.characters.push(node.data.entity);
                break;
              case 'element':
                allEntities.elements.push(node.data.entity);
                break;
              case 'puzzle':
                allEntities.puzzles.push(node.data.entity);
                break;
              case 'timeline':
                allEntities.timeline.push(node.data.entity);
                break;
            }
          }
        });
      }
      return { ...data, allEntities };
    },
  });
  
  // Extract nodes and edges from graph response
  const serverNodes = graphData?.nodes || [];
  const serverEdges = graphData?.edges || [];
  const allEntities = graphData?.allEntities || { characters: [], elements: [], puzzles: [], timeline: [] };
  
  
  // Log metadata if available
  useEffect(() => {
    if (graphData?.metadata?.missingEntities?.length) {
      console.warn('[GraphView] Missing entities detected:', graphData.metadata.missingEntities);
    }
  }, [graphData?.metadata]);
  
  // Check if mobile viewport for touch optimizations
  const isMobile = useIsMobile();
  
  // Use consolidated filter selector for better performance (1 subscription vs 14+)
  const filters = useFilterSelectors();
  
  // Destructure commonly used values for cleaner code
  const {
    searchTerm,
    selectedNodeId,
    connectionDepth,
    entityVisibility,
    characterSelectedTiers,
    characterType,
    characterOwnershipStatus,
    characterHighlightShared,
    puzzleSelectedActs,
    puzzleCompletionStatus,
    elementBasicTypes,
    elementStatus,
    elementContentStatus,
    elementHasIssues,
    elementLastEditedRange,
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
  // Track when layout calculation starts
  useEffect(() => {
    if (serverNodes.length > 0) {
      setIsLayouting(true);
      setLayoutProgress(30); // Start at 30% when beginning layout
    }
  }, [serverNodes.length]);
  
  const { reactFlowNodes, reactFlowEdges, visibleNodeIds } = useGraphLayout({
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
    characterOwnershipStatus,
    characterHighlightShared,
    // Puzzle filters as primitives
    puzzleSelectedActs,
    puzzleCompletionStatus,
    // Element filters as primitives
    elementBasicTypes,
    elementStatus,
    elementContentStatus,
    elementHasIssues,
    elementLastEditedRange
  });
  
  // Layout calculation complete
  useEffect(() => {
    if (reactFlowNodes.length > 0 && isLayouting) {
      setLayoutProgress(100); // Complete
      // Hide progress after a short delay
      const timer = setTimeout(() => {
        setIsLayouting(false);
        setLayoutProgress(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [reactFlowNodes.length, isLayouting]);

  // For compatibility with existing code
  const layoutedNodes = reactFlowNodes;
  const totalUniverseNodes = serverNodes.length;
  
  // Track navigation history
  useNavigationTracking({ nodes: layoutedNodes });
  
  // Connect keyboard interactions and advanced graph handling
  const {
    handleNodeClick,              // Added to handle node selection
    handleSelectionChange,
    clearSelection,
    selectAll: _selectAll,        // Added for Cmd/Ctrl+A (handled via hotkeys)
    copyToClipboard: _copyToClipboard,  // Added for Cmd/Ctrl+C (handled via hotkeys)
  } = useGraphInteractions({
    onNodesDelete: (nodes) => {
      // Handle node deletion if needed in future
      console.log('Delete nodes:', nodes);
    },
    onEdgesDelete: (edges) => {
      // Handle edge deletion if needed in future
      console.log('Delete edges:', edges);
    },
  });

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

  // React Flow now handles all selection internally
  // We only respond to onSelectionChange to sync with FilterStore

  // Handle detail panel close - clears selection via hook
  const handleDetailPanelClose = () => {
    clearSelection();
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
    <GraphDataContextProvider allEntities={allEntities}>
      <div className={cn(
        "h-full w-full",
        selectedEntity && isDetailPanelMinimized ? "flex flex-col" : "flex"
      )}>
        {/* Detail Panel - Horizontal bar at top when minimized */}
        {selectedEntity && isDetailPanelMinimized && (
          <DetailPanel
            entity={selectedEntity.entity}
            entityType={selectedEntity.entityType}
            onClose={handleDetailPanelClose}
            allEntities={allEntities}
          />
        )}
        
        <div className="flex-1 relative flex">
          <div className="flex-1 relative">
            {/* Unified toolbar with filter status, navigation breadcrumbs, and controls */}
            <UnifiedToolbar
              totalNodes={totalUniverseNodes}
              visibleNodes={isMobile && reactFlowNodes.length > 50 ? 50 : visibleNodeIds.size}
              connectionDepth={connectionDepth ?? 0}
              selectedNode={selectedNodeData}
              hasActiveFilters={hasActiveFilters()}
            />
          
          {/* Layout Progress Indicator */}
          {isLayouting && (
            <LayoutProgress
              progress={layoutProgress}
              algorithm="Dagre"
              className="z-50"
            />
          )}
          
          {/* Mobile performance optimization: limit visible nodes */}
          <ReactFlow
          nodes={isMobile && reactFlowNodes.length > 50 ? reactFlowNodes.slice(0, 50) : reactFlowNodes}
          edges={isMobile && reactFlowNodes.length > 50 ? reactFlowEdges.filter(edge => {
            const limitedNodeIds = new Set(reactFlowNodes.slice(0, 50).map(n => n.id));
            return limitedNodeIds.has(edge.source) && limitedNodeIds.has(edge.target);
          }) : reactFlowEdges}
          onNodeClick={handleNodeClick}
          onSelectionChange={handleSelectionChange}
          nodeTypes={nodeTypes}
          minZoom={0.05}
          maxZoom={2}
          elementsSelectable={true}
          elevateNodesOnSelect={false}
          selectNodesOnDrag={false}
          snapToGrid={false}
          fitViewOptions={{ padding: 0.2, duration: 200 }}
          onlyRenderVisibleElements={true}
          deleteKeyCode="Delete"
          selectionKeyCode="Shift"
          // Touch-specific optimizations
          zoomOnPinch={true}
          panOnScroll={!isMobile} // Disable scroll-to-pan on mobile for better UX
          zoomOnDoubleClick={!isMobile} // Prevent accidental zooms on mobile
          preventScrolling={isMobile} // Prevent page scroll during graph interaction on mobile
          noDragClassName="nodrag" // Selective drag prevention
        >
          <ViewportController 
            searchTerm={searchTerm}
            selectedNodeId={selectedNodeId}
            connectionDepth={connectionDepth}
            nodes={isMobile && reactFlowNodes.length > 50 ? reactFlowNodes.slice(0, 50) : reactFlowNodes}
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={16} 
            size={1} 
            className="bg-gray-50 dark:bg-gray-900"
          />
          <Controls />
          {/* Hide MiniMap on mobile to save screen space */}
          {!isMobile && (
            <MiniMap 
              nodeColor={(node) => {
                // Highlight selected nodes first
                if (node.selected) return '#ff0072'; // Hot pink for selected
                
                // Then by type
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
                width: 150,  // Reduced from 200
                height: 100, // Reduced from 150
                // Slight transparency for better UX
                opacity: reactFlowNodes.length === 0 ? 0 : 0.9,
                pointerEvents: reactFlowNodes.length === 0 ? 'none' : 'auto'
              }}
            />
          )}
          </ReactFlow>
          
          {/* Floating Action Button - hide when detail panel is open */}
          <FloatingActionButton
            hidden={!!selectedNodeId}
          />
        </div>
        
        {/* Detail Panel - Right sidebar when not minimized */}
        {selectedEntity && !isDetailPanelMinimized && (
          <DetailPanel
            entity={selectedEntity.entity}
            entityType={selectedEntity.entityType}
            onClose={handleDetailPanelClose}
            allEntities={allEntities}
          />
        )}
      </div>
      </div>
    </GraphDataContextProvider>
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