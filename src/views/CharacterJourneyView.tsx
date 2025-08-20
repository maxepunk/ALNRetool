/**
 * Character Journey View
 * Hierarchical visualization of character ownership paths showing
 * how character ownership affects puzzle access and story discovery
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import GraphView from '@/components/graph/GraphView';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCharacterJourneyData } from '@/hooks/useCharacterJourneyData';
import DetailPanel from '@/components/DetailPanel';
import { useGraphDragDrop } from '@/hooks/useGraphInteractions';
import { useFilterStore } from '@/stores/filterStore';
import { normalizeTier, getTierBadgeVariant } from '@/lib/utils/tierUtils';
import type { Node } from '@xyflow/react';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';
import { Users, Share2 } from 'lucide-react';
import '@xyflow/react/dist/style.css';

export default function CharacterJourneyView() {
  const { characterId: urlCharacterId } = useParams<{ characterId?: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useCharacterJourneyData();
  
  // Get filter state and actions from Zustand store
  const characterFilters = useFilterStore(state => state.characterFilters);
  const selectCharacter = useFilterStore(state => state.selectCharacter);
  const setHighlightShared = useFilterStore(state => state.setHighlightShared);
  
  // View-specific state only (not filters)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [viewMode, setViewMode] = useState<'filtered' | 'full-web'>('filtered');
  const [expansionDepth, setExpansionDepth] = useState<number>(3);
  
  // Use store as primary source, URL as secondary
  const characterId = characterFilters.selectedCharacterId || urlCharacterId;
  
  // Sync URL with store when store changes
  useEffect(() => {
    if (characterFilters.selectedCharacterId && characterFilters.selectedCharacterId !== urlCharacterId) {
      navigate(`/character-journey/${characterFilters.selectedCharacterId}`, { replace: true });
    } else if (!characterFilters.selectedCharacterId && urlCharacterId) {
      navigate('/character-journey', { replace: true });
    }
  }, [characterFilters.selectedCharacterId, urlCharacterId, navigate]);
  
  // Sync store with URL on mount
  useEffect(() => {
    if (urlCharacterId && urlCharacterId !== characterFilters.selectedCharacterId) {
      selectCharacter(urlCharacterId);
    }
  }, [urlCharacterId, selectCharacter]);

  // Find selected character
  const selectedCharacter = useMemo(() => {
    if (!characterId || !data?.characters) return null;
    return data.characters.find(c => c.id === characterId);
  }, [characterId, data?.characters]);

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
      // Type narrowing for the 'in' operator
      const obj = entity as Record<string, unknown>;
      if ('tier' in obj) return 'character';
      if ('descriptionText' in obj) return 'element';
      if ('descriptionSolution' in obj) return 'puzzle';
      if ('date' in obj && 'charactersInvolvedIds' in obj) return 'timeline';
    }
    
    // Fallback to 'element' if type cannot be determined.
    // This assumes 'element' is a safe default for unknown node types.
    return 'element';
  }, []);

  // Handle entity save (placeholder for Sprint 2 mutations)
  const handleEntitySave = useCallback(async (updates: Partial<Character | Element | Puzzle | TimelineEvent>) => {
    console.log('Saving entity updates:', updates);
    // TODO: Implement mutation hooks in Sprint 2
    // This will call the appropriate mutation based on entity type
    // For now, just log the changes
    return Promise.resolve();
  }, []);

  // Drag and drop hook
  const { isDragging } = useGraphDragDrop();

  // Handle node selection
  const handleNodeClick = useCallback((node: Node) => {
    console.log('Node clicked:', node);
    setSelectedNode(node);
  }, []);

  // Close detail panel
  const handleCloseDetails = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-8 py-6 bg-secondary border-b">
          <h1 className="text-3xl font-bold text-foreground">Character Journey</h1>
          <p className="mt-2 text-muted-foreground">Loading character ownership paths...</p>
        </div>
        <div className="flex-1 flex relative overflow-hidden">
          <LoadingSkeleton variant="graph" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // No data state
  if (!data) {
    return <ErrorDisplay error={new Error('No data available')} />;
  }

  // No character selected - prompt to use sidebar
  if (!characterId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Card className="p-6 max-w-md w-full">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="text-xl font-semibold">No Character Selected</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Please select a character from the sidebar to explore their ownership paths and story journey.
            </p>
            <p className="text-xs text-muted-foreground">
              Use the character selector in the sidebar&apos;s Character Filters section to choose a character.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Character not found
  if (!selectedCharacter) {
    return <Navigate to="/character-journey" replace />;
  }


  return (
    <div className="h-full flex flex-col" data-testid="character-journey-view">
      {/* Header with character selector and controls */}
      <div className="relative z-30 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-3">
          {/* Character selector and info */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">{selectedCharacter.name}</span>
              <Badge variant={getTierBadgeVariant(selectedCharacter.tier)}>
                {normalizeTier(selectedCharacter.tier)}
              </Badge>
              {selectedCharacter.type && (
                <Badge variant="outline">{selectedCharacter.type}</Badge>
              )}
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                size="sm"
                variant={viewMode === 'filtered' ? 'default' : 'ghost'}
                onClick={() => setViewMode('filtered')}
                className="h-7 px-3"
              >
                Filtered
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'full-web' ? 'default' : 'ghost'}
                onClick={() => setViewMode('full-web')}
                className="h-7 px-3"
              >
                Full Web
              </Button>
            </div>

            {/* Show depth control for Full Web mode */}
            {viewMode === 'full-web' && (
              <div className="flex items-center gap-2">
                <Label htmlFor="depth-select" className="text-sm">
                  Connection Depth:
                </Label>
                <select
                  id="depth-select"
                  value={expansionDepth}
                  onChange={(e) => setExpansionDepth(parseInt(e.target.value))}
                  className="h-7 px-2 text-sm border rounded"
                >
                  <option value="1">1 hop (immediate connections)</option>
                  <option value="2">2 hops (close network)</option>
                  <option value="3">3 hops (extended network)</option>
                  <option value="4">4 hops (broad network)</option>
                  <option value="5">5 hops (wide network)</option>
                </select>
              </div>
            )}

            {/* Show highlight shared control */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="highlight-shared"
                checked={characterFilters.highlightShared}
                onCheckedChange={(checked) => setHighlightShared(!!checked)}
              />
              <Label htmlFor="highlight-shared" className="text-sm cursor-pointer">
                <Share2 className="h-3 w-3 inline mr-1" />
                Highlight shared
              </Label>
            </div>

            {/* Show active filters indicator */}
            {(characterFilters.selectedTiers.size > 0 || 
              characterFilters.ownershipStatus.size > 0) && (
              <Badge variant="secondary" className="text-xs">
                {characterFilters.selectedTiers.size + characterFilters.ownershipStatus.size} filters active
              </Badge>
            )}

          </div>
        </div>
      </div>

      {/* Graph View */}
      <div className="flex-1 relative">
        {data ? (
          <GraphView
            characters={data.characters}
            elements={data.elements}
            puzzles={data.puzzles}
            timeline={data.timeline}
            viewType="character-journey"
            onNodeClick={handleNodeClick}
            viewOptions={{
              characterId: characterId,
              viewMode: viewMode,
              expansionDepth: expansionDepth,
              characterFilters: characterFilters
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No data to display for this character</p>
          </div>
        )}

        {/* Full Web Mode Indicator */}
        {viewMode === 'filtered' && (
          <div className="absolute top-4 right-4 z-10">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-900 px-3 py-1.5">
              Simplified View - Click &quot;Full Web&quot; above to see all connections
            </Badge>
          </div>
        )}

        {/* Drag indicator */}
        {isDragging && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <Badge variant="secondary" className="shadow-lg">
              Dragging element for ownership transfer
            </Badge>
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
            characters: data?.characters || [], 
            elements: data?.elements || [], 
            puzzles: data?.puzzles || [], 
            timeline: data?.timeline || [] 
          }}
        />
      )}
    </div>
  );
}