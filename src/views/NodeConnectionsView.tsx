/**
 * Node Connections View
 * Generic visualization of any node's connections in the graph
 * Supports characters, puzzles, elements, and timeline events
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GraphView from '@/components/graph/GraphView';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import DetailPanel from '@/components/DetailPanel';
import { useFilterStore } from '@/stores/filterStore';
import { useAllCharacters } from '@/hooks/useCharacters';
import { useAllPuzzles } from '@/hooks/usePuzzles';
import { useAllElements } from '@/hooks/useElements';
import { useAllTimeline } from '@/hooks/useTimeline';
import type { Node } from '@xyflow/react';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';
import type { DepthMetadata } from '@/lib/graph/types';
import { Network, Info, AlertCircle } from 'lucide-react';
import '@xyflow/react/dist/style.css';

export type NodeType = 'character' | 'puzzle' | 'element' | 'timeline';

export default function NodeConnectionsView() {
  const { nodeType: urlNodeType, nodeId: urlNodeId } = useParams<{ nodeType?: string; nodeId?: string }>();
  const navigate = useNavigate();
  
  // Get all data - using useAll* hooks to fetch complete datasets
  const { data: charactersData, isLoading: charactersLoading, error: charactersError } = useAllCharacters();
  const { data: puzzlesData, isLoading: puzzlesLoading, error: puzzlesError } = useAllPuzzles();
  const { data: elementsData, isLoading: elementsLoading, error: elementsError } = useAllElements();
  const { data: timelineData, isLoading: timelineLoading, error: timelineError } = useAllTimeline();
  
  // Get filter state from store
  const connectionDepth = useFilterStore(state => state.connectionDepth);
  const setConnectionDepth = useFilterStore(state => state.setConnectionDepth);
  
  // Local state
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>(
    (urlNodeType as NodeType) || 'character'
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(urlNodeId || null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [depthMetadata, setDepthMetadata] = useState<DepthMetadata | undefined>(undefined);
  
  // Sync URL with state
  useEffect(() => {
    if (selectedNodeType && selectedNodeId) {
      navigate(`/node-connections/${selectedNodeType}/${selectedNodeId}`, { replace: true });
    } else if (selectedNodeType) {
      navigate(`/node-connections/${selectedNodeType}`, { replace: true });
    } else {
      navigate('/node-connections', { replace: true });
    }
  }, [selectedNodeType, selectedNodeId, navigate]);
  
  // Get entities based on selected type
  const entities = useMemo(() => {
    switch (selectedNodeType) {
      case 'character':
        return charactersData || [];
      case 'puzzle':
        return puzzlesData || [];
      case 'element':
        return elementsData || [];
      case 'timeline':
        return timelineData || [];
      default:
        return [];
    }
  }, [selectedNodeType, charactersData, puzzlesData, elementsData, timelineData]);
  
  // Find selected entity
  const selectedEntity = useMemo(() => {
    if (!selectedNodeId || !entities.length) return null;
    return entities.find(e => e.id === selectedNodeId);
  }, [selectedNodeId, entities]);
  
  // Helper function to get entity from node
  const getEntityFromNode = useCallback((node: Node): Character | Element | Puzzle | TimelineEvent | null => {
    if (!node.data?.entity) return null;
    return node.data.entity as Character | Element | Puzzle | TimelineEvent;
  }, []);
  
  // Helper function to determine entity type from node
  const getEntityType = useCallback((node: Node): 'character' | 'element' | 'puzzle' | 'timeline' => {
    const nodeType = node.type;
    if (nodeType === 'characterNode') return 'character';
    if (nodeType === 'elementNode') return 'element';
    if (nodeType === 'puzzleNode') return 'puzzle';
    if (nodeType === 'timelineNode') return 'timeline';
    
    // Fallback based on data
    const entity = node.data?.entity;
    if (entity && typeof entity === 'object' && !Array.isArray(entity)) {
      const obj = entity as Record<string, unknown>;
      if ('tier' in obj) return 'character';
      if ('descriptionText' in obj) return 'element';
      if ('descriptionSolution' in obj) return 'puzzle';
      if ('date' in obj && 'charactersInvolvedIds' in obj) return 'timeline';
    }
    
    return 'element';
  }, []);
  
  // Handle entity save
  const handleEntitySave = useCallback(async (updates: Partial<Character | Element | Puzzle | TimelineEvent>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Saving entity updates:', updates);
    }
    // TODO: Implement mutation hooks
    return Promise.resolve();
  }, []);
  
  // Handle node selection from graph
  const handleNodeClick = useCallback((node: Node) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Node clicked:', node);
    }
    setSelectedNode(node);
  }, []);
  
  // Close detail panel
  const handleCloseDetails = useCallback(() => {
    setSelectedNode(null);
  }, []);
  
  // Handle graph data change including depth metadata
  const handleGraphDataChange = useCallback((data: { nodes: Node[]; edges: any[]; depthMetadata?: DepthMetadata }) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 NodeConnectionsView: handleGraphDataChange called with:', {
        nodes: data.nodes.length,
        edges: data.edges.length,
        hasDepthMetadata: !!data.depthMetadata,
        depthMetadata: data.depthMetadata
      });
    }
    if (data.depthMetadata) {
      setDepthMetadata(data.depthMetadata);
    }
  }, []);
  
  // Handle node type change
  const handleNodeTypeChange = useCallback((type: NodeType) => {
    setSelectedNodeType(type);
    setSelectedNodeId(null); // Reset selection when changing type
  }, []);
  
  // Handle entity selection
  const handleEntitySelect = useCallback((entityId: string) => {
    setSelectedNodeId(entityId);
  }, []);
  
  // Loading state
  const isLoading = charactersLoading || puzzlesLoading || elementsLoading || timelineLoading;
  
  // Error state
  const error = charactersError || puzzlesError || elementsError || timelineError;
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-8 py-6 bg-secondary border-b">
          <h1 className="text-3xl font-bold text-foreground">Node Connections</h1>
          <p className="mt-2 text-muted-foreground">Loading entities...</p>
        </div>
        <div className="flex-1 flex relative overflow-hidden">
          <LoadingSkeleton variant="graph" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  // Get entity display name
  const getEntityName = (entity: any): string => {
    if (!entity) return 'Unknown';
    return entity.name || entity.title || entity.id;
  };
  
  return (
    <div className="h-full flex flex-col" data-testid="node-connections-view">
      {/* Header with selectors and controls */}
      <div className="relative z-30 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-3">
          {/* Title and description */}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Network className="h-6 w-6" />
              Node Connections
            </h1>
            <p className="text-sm text-muted-foreground">
              Explore connections and relationships between any entity in the graph
            </p>
          </div>
          
          {/* Selectors */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Node Type Selector */}
            <div className="flex items-center gap-2">
              <Label htmlFor="node-type">Type:</Label>
              <Select value={selectedNodeType} onValueChange={handleNodeTypeChange}>
                <SelectTrigger id="node-type" className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="character">Character</SelectItem>
                  <SelectItem value="puzzle">Puzzle</SelectItem>
                  <SelectItem value="element">Element</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Entity Selector */}
            <div className="flex items-center gap-2">
              <Label htmlFor="entity">Entity:</Label>
              <Select value={selectedNodeId || ''} onValueChange={handleEntitySelect}>
                <SelectTrigger id="entity" className="w-[250px]">
                  <SelectValue placeholder="Select an entity..." />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {getEntityName(entity)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Depth Control */}
            <div className="flex items-center gap-2">
              <Label htmlFor="depth">Depth:</Label>
              <Select 
                value={connectionDepth.toString()} 
                onValueChange={(val) => setConnectionDepth(parseInt(val))}
              >
                <SelectTrigger id="depth" className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hop</SelectItem>
                  <SelectItem value="2">2 hops</SelectItem>
                  <SelectItem value="3">3 hops</SelectItem>
                  <SelectItem value="4">4 hops</SelectItem>
                  <SelectItem value="5">5 hops</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Depth metadata feedback */}
            {depthMetadata && selectedNodeId && (
              <div className="flex items-center gap-2">
                {depthMetadata.isCompleteNetwork ? (
                  <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                    <Info className="h-3 w-3 mr-1" />
                    Complete network shown ({depthMetadata.totalReachableNodes} nodes)
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <Info className="h-3 w-3 mr-1" />
                    Showing {depthMetadata.nodesAtCurrentDepth} of {depthMetadata.totalReachableNodes} nodes (depth {connectionDepth})
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Graph View or Prompt */}
      <div className="flex-1 relative">
        {selectedNodeId && selectedEntity ? (
          <GraphView
            characters={charactersData || []}
            elements={elementsData || []}
            puzzles={puzzlesData || []}
            timeline={timelineData || []}
            viewType="node-connections"
            onNodeClick={handleNodeClick}
            onGraphDataChange={handleGraphDataChange}
            viewOptions={{
              nodeId: selectedNodeId,
              nodeType: selectedNodeType,
              expansionDepth: connectionDepth,
              viewMode: 'full-web' // Always use full web mode for connections
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full p-8">
            <Card className="p-6 max-w-md w-full">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">No Entity Selected</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Please select an entity from the dropdown above to explore its connections in the graph.
                </p>
                <p className="text-xs text-muted-foreground">
                  You can select any character, puzzle, element, or timeline event to visualize its relationships with other entities.
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
      
      {/* Detail Panel */}
      {selectedNode && (
        <DetailPanel
          entity={getEntityFromNode(selectedNode)}
          entityType={getEntityType(selectedNode)}
          onClose={handleCloseDetails}
          onSave={handleEntitySave}
          allEntities={{ 
            characters: charactersData || [], 
            elements: elementsData || [], 
            puzzles: puzzlesData || [], 
            timeline: timelineData || [] 
          }}
        />
      )}
    </div>
  );
}