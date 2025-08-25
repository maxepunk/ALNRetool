/**
 * Test Component for Graph Integration
 * Verifies the graph transformation pipeline works with React Query data
 */

import { useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { logger } from '@/lib/graph/utils/Logger'


// Import our hooks
import { useCharacters, useElements, usePuzzles, useTimeline } from '@/hooks/useNotionData';

// Import graph builder
import { 
  buildGraphData, 
  buildPuzzleFocusGraph,
  buildCharacterJourneyGraph,
  buildContentStatusGraph,
  getGraphStatistics,
  validateGraphData,
  type NotionData
} from '@/lib/graph';
import type { GraphData } from '@/lib/graph/types';

/**
 * Test component that loads data and builds graphs
 */
export function TestGraphIntegration() {
  // Fetch data using React Query hooks
  const charactersQuery = useCharacters();
  const elementsQuery = useElements();
  const puzzlesQuery = usePuzzles();
  const timelineQuery = useTimeline();
  
  // State for graph data and metrics
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [viewType, setViewType] = useState<'puzzle-focus' | 'character-journey' | 'content-status'>('puzzle-focus');
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Loading state
  const isLoading = 
    charactersQuery.isLoading || 
    elementsQuery.isLoading || 
    puzzlesQuery.isLoading || 
    timelineQuery.isLoading;
  
  const hasError = 
    charactersQuery.isError || 
    elementsQuery.isError || 
    puzzlesQuery.isError || 
    timelineQuery.isError;
  
  // Build graph when data is ready
  useEffect(() => {
    if (isLoading || hasError) return;
    
    // All data is loaded
    const notionData: NotionData = {
      characters: charactersQuery.data || [],
      elements: elementsQuery.data || [],
      puzzles: puzzlesQuery.data || [],
      timeline: timelineQuery.data || [],
    };
    
    logger.debug('Building graph with data:', { 
      characters: notionData.characters.length,
      elements: notionData.elements.length,
      puzzles: notionData.puzzles.length,
      timeline: notionData.timeline.length,
     });
    
    try {
      // Measure performance
      const startTime = performance.now();
      
      // Build graph based on view type
      let graph: GraphData;
      switch (viewType) {
        case 'puzzle-focus':
          graph = buildPuzzleFocusGraph(notionData);
          break;
        case 'character-journey':
          graph = buildCharacterJourneyGraph(notionData, notionData.characters[0]?.id || 'default');
          break;
        case 'content-status':
          graph = buildContentStatusGraph(notionData);
          break;
        default:
          graph = buildGraphData(notionData);
      }
      
      const endTime = performance.now();
      
      // Validate graph
      const validation = validateGraphData(graph);
      if (!validation.valid) {
        logger.error('Graph validation failed:', undefined, new Error(validation.errors.join(', ')));
        setError(`Graph validation failed: ${validation.errors.join(', ')}`);
        return;
      }
      
      // Get statistics
      const stats = getGraphStatistics(graph);
      
      // Update state
      setGraphData(graph);
      setMetrics({
        buildTime: endTime - startTime,
        ...stats,
        ...graph.metadata?.metrics,
      });
      setError(null);
      
      logger.debug('Graph built successfully:', undefined, {
        buildTime: `${(endTime - startTime).toFixed(2)}ms`,
        nodes: graph.nodes.length,
        edges: graph.edges.length,
        stats,
      });
      
    } catch (err) {
      logger.error('Failed to build graph:', undefined, err instanceof Error ? err : undefined);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [
    isLoading, 
    hasError, 
    charactersQuery.data, 
    elementsQuery.data, 
    puzzlesQuery.data, 
    timelineQuery.data,
    viewType
  ]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Notion Data...</h2>
          <div className="text-gray-600">
            <div>Characters: {charactersQuery.isLoading ? 'Loading...' : '✓'}</div>
            <div>Elements: {elementsQuery.isLoading ? 'Loading...' : '✓'}</div>
            <div>Puzzles: {puzzlesQuery.isLoading ? 'Loading...' : '✓'}</div>
            <div>Timeline: {timelineQuery.isLoading ? 'Loading...' : '✓'}</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (hasError || error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <div className="max-w-md">
            {charactersQuery.error && <div>Characters: {String(charactersQuery.error)}</div>}
            {elementsQuery.error && <div>Elements: {String(elementsQuery.error)}</div>}
            {puzzlesQuery.error && <div>Puzzles: {String(puzzlesQuery.error)}</div>}
            {timelineQuery.error && <div>Timeline: {String(timelineQuery.error)}</div>}
            {error && <div className="mt-2 font-bold">{error}</div>}
          </div>
        </div>
      </div>
    );
  }
  
  // Render graph
  return (
    <div className="h-screen flex flex-col">
      {/* Controls */}
      <div className="bg-gray-100 border-b p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex gap-4">
            <button
              onClick={() => setViewType('puzzle-focus')}
              className={`px-4 py-2 rounded ${
                viewType === 'puzzle-focus' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700'
              }`}
            >
              Puzzle Focus
            </button>
            <button
              onClick={() => setViewType('character-journey')}
              className={`px-4 py-2 rounded ${
                viewType === 'character-journey' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700'
              }`}
            >
              Character Journey
            </button>
            <button
              onClick={() => setViewType('content-status')}
              className={`px-4 py-2 rounded ${
                viewType === 'content-status' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700'
              }`}
            >
              Content Status
            </button>
          </div>
          
          {/* Metrics */}
          {metrics && (
            <div className="text-sm text-gray-600">
              <span className="mr-4">Nodes: {metrics.totalNodes}</span>
              <span className="mr-4">Edges: {metrics.totalEdges}</span>
              <span className="mr-4">Build: {metrics.buildTime?.toFixed(0)}ms</span>
              <span className={metrics.buildTime > 1000 ? 'text-red-600 font-bold' : 'text-green-600'}>
                {metrics.buildTime > 1000 ? '⚠️ SLOW' : '✓ FAST'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Graph Display */}
      <div className="flex-1">
        {graphData ? (
          <ReactFlow
            nodes={graphData.nodes}
            edges={graphData.edges}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls />
            <MiniMap 
              nodeStrokeColor={(node) => {
                const color = (node as any).data?.metadata?.visualHints?.color;
                return color || '#666';
              }}
              nodeColor={(node) => {
                const color = (node as any).data?.metadata?.visualHints?.color;
                return color ? `${color}20` : '#f0f0f0';
              }}
              nodeBorderRadius={2}
            />
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">No graph data available</div>
          </div>
        )}
      </div>
      
      {/* Stats Panel */}
      {metrics && (
        <div className="bg-gray-100 border-t p-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="font-semibold mb-2">Graph Statistics</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Nodes by Type:</strong>
                <pre className="text-xs mt-1">
                  {JSON.stringify(metrics.nodesByType, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Edges by Type:</strong>
                <pre className="text-xs mt-1">
                  {JSON.stringify(metrics.edgesByType, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Layout:</strong>
                <div className="text-xs mt-1">
                  <div>Width: {metrics.layoutMetrics?.width}px</div>
                  <div>Height: {metrics.layoutMetrics?.height}px</div>
                  <div>Density: {metrics.layoutMetrics?.density}</div>
                  <div>Overlaps: {metrics.layoutMetrics?.overlap}</div>
                </div>
              </div>
              <div>
                <strong>Performance:</strong>
                <div className="text-xs mt-1">
                  <div>Transform: {metrics.duration?.toFixed(2)}ms</div>
                  <div>Avg Connectivity: {metrics.avgConnectivity}</div>
                  <div>Has Orphans: {metrics.hasOrphans ? 'Yes' : 'No'}</div>
                  <div className={metrics.duration > 1000 ? 'text-red-600 font-bold' : ''}>
                    Target: &lt;1000ms for 200 nodes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}