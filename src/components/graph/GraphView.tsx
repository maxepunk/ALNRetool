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

import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
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
import { getInitialViewNodes, saveViewport, loadViewport, isNodeWellVisible } from '@/lib/graph/viewportUtils';

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
  
  // React Flow instance for viewport control
  const { fitView, setViewport, getViewport, getNodes } = useReactFlow();
  
  // Track if viewport has been initialized to prevent re-triggering
  const hasInitializedViewport = useRef(false);
  
  // Track previous values to detect actual changes
  const previousSelectedNodeId = useRef<string | null>(null);
  const previousSearchTerm = useRef<string>('');
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref for React Flow container to get viewport bounds
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
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

  // Smart initial viewport positioning
  useEffect(() => {
    // Only run once when nodes are first loaded
    if (reactFlowNodes.length > 0 && !hasInitializedViewport.current) {
      hasInitializedViewport.current = true;
      
      // Short delay to ensure React Flow has rendered the nodes
      setTimeout(() => {
        // Try to restore saved viewport first
        const savedViewport = loadViewport();
        if (savedViewport) {
          console.log('[GraphView] Restoring saved viewport');
          setViewport(savedViewport, { duration: 800 });
        } else {
          // Calculate most connected nodes for initial view
          const initialNodeIds = getInitialViewNodes(
            reactFlowNodes,
            reactFlowEdges,
            isMobile
          );
          
          if (initialNodeIds && initialNodeIds.length > 0) {
            // Filter to get the actual node objects
            const nodesToFocus = reactFlowNodes.filter(node => 
              initialNodeIds.includes(node.id)
            );
            
            console.log(`[GraphView] Focusing on ${nodesToFocus.length} most connected nodes`);
            
            // Use fitView to focus on the selected nodes
            fitView({
              nodes: nodesToFocus,
              padding: 0.3,
              duration: 800
            });
          } else {
            // Fallback: fit all nodes if something goes wrong
            console.log('[GraphView] Fallback: fitting all nodes');
            fitView({ padding: 0.2, duration: 800 });
          }
        }
      }, 100); // Small delay for React Flow to finish rendering
    }
  }, [reactFlowNodes, reactFlowEdges, isMobile, fitView, setViewport]);

  // Selection viewport focusing - center selected node if not well-visible
  useEffect(() => {
    if (selectedNodeId && selectedNodeId !== previousSelectedNodeId.current && hasInitializedViewport.current) {
      const node = reactFlowNodes.find(n => n.id === selectedNodeId);
      
      if (node && reactFlowWrapper.current) {
        const viewport = getViewport();
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        
        // Check if node is already well-visible
        if (!isNodeWellVisible(node, viewport, { width: bounds.width, height: bounds.height })) {
          console.log(`[GraphView] Centering on selected node: ${selectedNodeId}`);
          fitView({
            nodes: [node],
            padding: 0.3,
            duration: 600,
            maxZoom: 1.5 // Don't zoom in too much
          });
        } else {
          console.log(`[GraphView] Selected node ${selectedNodeId} is already well-visible`);
        }
      }
      
      previousSelectedNodeId.current = selectedNodeId;
    } else if (!selectedNodeId) {
      previousSelectedNodeId.current = null;
    }
  }, [selectedNodeId, reactFlowNodes, fitView, getViewport]);
  
  // Search viewport focusing - debounced to avoid viewport jumps while typing
  useEffect(() => {
    // Only process if search actually changed (not just nodes updating)
    if (searchTerm !== previousSearchTerm.current) {
      // Clear any existing timer when search changes
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
      
      // Handle search clear - fit view to all visible nodes
      // Check BEFORE updating the ref
      if (hasInitializedViewport.current && !searchTerm && previousSearchTerm.current) {
        // Delay to ensure nodes have re-rendered and layout is complete
        // Use requestAnimationFrame to batch with browser's next paint
        setTimeout(() => {
          requestAnimationFrame(() => {
            const visibleNodes = reactFlowNodes.filter(node => visibleNodeIds.has(node.id));
            if (visibleNodes.length > 0) {
              fitView({
                nodes: visibleNodes,
                padding: 0.2,
                duration: 600,
                maxZoom: 1.0 // Don't zoom in too much when showing all
              });
            }
          });
        }, 800); // 800ms = 300ms debounce (useGraphLayout) + 500ms for React Flow render/animation
      }
      
      // Update ref after checking for clear
      previousSearchTerm.current = searchTerm;
      
      // Only create new timer if viewport is ready and search is non-empty
      if (hasInitializedViewport.current && searchTerm) {
        // Create timer and store ref
        searchTimerRef.current = setTimeout(() => {
          searchTimerRef.current = null; // Clear ref after execution
          
          // Get FRESH node data from React Flow at execution time
          const currentNodes = getNodes();
          
          // Filter to only nodes that:
          // 1. Are visible (in the current node list from React Flow)
          // 2. Actually match the search (have searchMatch metadata)
          const actualSearchMatches = currentNodes.filter((node: any) => 
            node.data?.metadata?.searchMatch === true
          );
          
          if (actualSearchMatches.length > 0) {
            // Use requestAnimationFrame to avoid forced reflow
            requestAnimationFrame(() => {
              fitView({
                nodes: actualSearchMatches,
                padding: 0.3,
                duration: 600,
                maxZoom: 1.2 // Keep reasonable zoom for multiple nodes
              });
            });
          }
        }, 800); // 800ms total (300ms for metadata update + 500ms for viewport animation)
      }
    }
    
    // Cleanup timer on effect re-run or unmount
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [searchTerm, fitView]); // Only depend on searchTerm change, not nodes
  
  // Save viewport on user interactions
  const handleViewportChange = useCallback(() => {
    // Only save if viewport has been initialized
    if (hasInitializedViewport.current) {
      const currentViewport = getViewport();
      saveViewport(currentViewport);
    }
  }, [getViewport]);

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
          <div className="flex-1 relative" ref={reactFlowWrapper}>
            {/* Unified toolbar with filter status, navigation breadcrumbs, and controls */}
            <UnifiedToolbar
              totalNodes={totalUniverseNodes}
              visibleNodes={visibleNodeIds.size}
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
          
          <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodeClick={handleNodeClick}
          onSelectionChange={handleSelectionChange}
          onMoveEnd={handleViewportChange}
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