/**
 * Character Journey View
 * Hierarchical visualization of character ownership paths showing
 * how character ownership affects puzzle access and story discovery
 */

import { useState, useMemo, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import GraphView from '@/components/graph/GraphView';
import { CharacterSelector } from '@/components/CharacterSelector';
import { FilterSection } from '@/components/FilterSection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCharacterJourneyData } from '@/hooks/useCharacterJourneyData';

import { useGraphDragDrop } from '@/hooks/useGraphInteractions';
import type { Node } from '@xyflow/react';
import { Users, Share2, Filter } from 'lucide-react';
import '@xyflow/react/dist/style.css';

interface ViewControls {
  showOnlyOwned: boolean;
  showAccessible: boolean;
  highlightShared: boolean;
  viewMode: 'filtered' | 'full-web';
  expansionDepth?: number;
}

export default function CharacterJourneyView() {
  const { characterId } = useParams<{ characterId?: string }>();
  const { data, isLoading, error } = useCharacterJourneyData();
  
  // View state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewControls, setViewControls] = useState<ViewControls>({
    showOnlyOwned: true,
    showAccessible: true,
    highlightShared: false,
    viewMode: 'filtered',
    expansionDepth: 3,  // Reduced from 10 to 3 for more focused view
  });
  const [showFilters, setShowFilters] = useState(false);

  // Find selected character
  const selectedCharacter = useMemo(() => {
    if (!characterId || !data?.characters) return null;
    return data.characters.find(c => c.id === characterId);
  }, [characterId, data?.characters]);


  // Drag and drop hook
  const { isDragging } = useGraphDragDrop();

  // Handle node selection
  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Close detail panel
  const handleCloseDetails = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading character journey data..." />;
  }

  // Error state
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // No data state
  if (!data) {
    return <ErrorDisplay error={new Error('No data available')} />;
  }

  // No character selected - show selector
  if (!characterId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Card className="p-6 max-w-md w-full">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Select a Character</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose a character to explore their ownership paths and story journey
            </p>
            <CharacterSelector />
          </div>
        </Card>
      </div>
    );
  }

  // Character not found
  if (!selectedCharacter) {
    return <Navigate to="/character-journey" replace />;
  }

  // Get tier badge variant
  const getTierBadgeVariant = (tier: string): "default" | "secondary" | "outline" => {
    const tierLower = tier?.toLowerCase() || '';
    if (tierLower === 'core' || tierLower === 'tier 1') return 'default';
    if (tierLower === 'secondary' || tierLower === 'tier 2') return 'secondary';
    return 'outline';
  };

  return (
    <div className="h-full flex flex-col" data-testid="character-journey-view">
      {/* Header with character selector and controls */}
      <div className="relative z-30 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-3">
          {/* Character selector and info */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">{selectedCharacter.name}</span>
              <Badge variant={getTierBadgeVariant(selectedCharacter.tier || '')}>
                {selectedCharacter.tier || 'Tertiary'}
              </Badge>
              {selectedCharacter.type && (
                <Badge variant="outline">{selectedCharacter.type}</Badge>
              )}
            </div>
            {/* Character Selector for switching */}
            <CharacterSelector className="ml-auto" />
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                size="sm"
                variant={viewControls.viewMode === 'filtered' ? 'default' : 'ghost'}
                onClick={() => setViewControls(prev => ({ ...prev, viewMode: 'filtered' }))}
                className="h-7 px-3"
              >
                Filtered
              </Button>
              <Button
                size="sm"
                variant={viewControls.viewMode === 'full-web' ? 'default' : 'ghost'}
                onClick={() => setViewControls(prev => ({ ...prev, viewMode: 'full-web' }))}
                className="h-7 px-3"
              >
                Full Web
              </Button>
            </div>

            {/* Show depth control for Full Web mode */}
            {viewControls.viewMode === 'full-web' && (
              <div className="flex items-center gap-2">
                <Label htmlFor="depth-select" className="text-sm">
                  Connection Depth:
                </Label>
                <select
                  id="depth-select"
                  value={viewControls.expansionDepth}
                  onChange={(e) => setViewControls(prev => ({ 
                    ...prev, 
                    expansionDepth: parseInt(e.target.value) 
                  }))}
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

            {/* Only show these controls in filtered mode */}
            {viewControls.viewMode === 'filtered' && (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-owned"
                    checked={viewControls.showOnlyOwned}
                    onCheckedChange={(checked) =>
                      setViewControls(prev => ({ ...prev, showOnlyOwned: !!checked }))
                    }
                  />
                  <Label htmlFor="show-owned" className="text-sm cursor-pointer">
                    Show only owned
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-accessible"
                    checked={viewControls.showAccessible}
                    onCheckedChange={(checked) =>
                      setViewControls(prev => ({ ...prev, showAccessible: !!checked }))
                    }
                  />
                  <Label htmlFor="show-accessible" className="text-sm cursor-pointer">
                    Show accessible
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="highlight-shared"
                    checked={viewControls.highlightShared}
                    onCheckedChange={(checked) =>
                      setViewControls(prev => ({ ...prev, highlightShared: !!checked }))
                    }
                  />
                  <Label htmlFor="highlight-shared" className="text-sm cursor-pointer">
                    <Share2 className="h-3 w-3 inline mr-1" />
                    Highlight shared
                  </Label>
                </div>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Collapsible filter section */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <FilterSection />
          </div>
        )}
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
              viewMode: viewControls.viewMode,
              expansionDepth: viewControls.expansionDepth
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No data to display for this character</p>
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
      {/* TODO: Implement entity lookup from selectedNodeId */}
      {selectedNodeId && (
        <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg p-4">
          <Button onClick={handleCloseDetails} size="sm" variant="ghost" className="mb-4">
            Close
          </Button>
          <p className="text-muted-foreground">Detail panel for node: {selectedNodeId}</p>
        </div>
      )}
    </div>
  );
}