/**
 * Puzzle Focus View
 * Interactive puzzle network showing dependencies
 * Main view for Sprint 1 - shows puzzle relationships and dependencies
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { Node, OnSelectionChangeParams } from '@xyflow/react';

// Data hooks
import { useCharacters } from '@/hooks/useCharacters';
import { useAllTimeline } from '@/hooks/useTimeline';
import { useSynthesizedData } from '@/hooks/useSynthesizedData';
import { usePuzzles } from '@/hooks/usePuzzles';
import { useElements } from '@/hooks/useElements';

// Store and filters
import { useFilterStore } from '@/stores/filterStore';
import { applyPuzzleFilters, applyCharacterFilters, applySearchFilter } from '@/lib/filters';

// Components
import GraphView from '@/components/graph/GraphView';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import DetailPanel from '@/components/DetailPanel';

// Types
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

// Styles - using Tailwind classes

/**
 * Puzzle Focus View Component
 * Displays an interactive graph of puzzles and their relationships
 */
export default function PuzzleFocusView() {
  const { puzzleId } = useParams();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Get filters from store
  const searchTerm = useFilterStore(state => state.searchTerm);
  const puzzleFilters = useFilterStore(state => state.puzzleFilters);
  const characterFilters = useFilterStore(state => state.characterFilters);
  const contentFilters = useFilterStore(state => state.contentFilters);
  const setActiveView = useFilterStore(state => state.setActiveView);
  
  // Set active view on mount
  React.useEffect(() => {
    setActiveView('puzzle-focus');
  }, [setActiveView]);
  
  // Prepare server-side filter parameters
  const serverPuzzleFilters = useMemo(() => {
    const params: any = {};
    
    // Convert act filters
    if (puzzleFilters.selectedActs.size > 0) {
      params.acts = Array.from(puzzleFilters.selectedActs).join(',');
    }
    
    // Note: completion status is derived client-side, can't filter server-side
    // Note: Puzzle filters don't have lastEditedRange property
    
    return params;
  }, [puzzleFilters]);
  
  const serverCharacterFilters = useMemo(() => {
    const params: any = {};
    
    // Convert tier filters
    if (characterFilters.selectedTiers.size > 0) {
      params.tiers = Array.from(characterFilters.selectedTiers).join(',');
    }
    
    // Convert type filter - use characterType property
    if (characterFilters.characterType !== 'all') {
      params.type = characterFilters.characterType;
    }
    
    // Note: ownership status is derived client-side from elements
    // Note: Character filters don't have lastEditedRange property
    
    return params;
  }, [characterFilters]);
  
  const serverElementFilters = useMemo(() => {
    const params: any = {};
    
    // Add status filter - use contentStatus property
    if (contentFilters.contentStatus.size > 0) {
      params.status = Array.from(contentFilters.contentStatus).join(',');
    }
    
    // Add last edited filter
    if (contentFilters.lastEditedRange !== 'all') {
      params.lastEdited = contentFilters.lastEditedRange;
    }
    
    return params;
  }, [contentFilters]);
  
  // Fetch data with server-side filtering where possible
  // For graph view, we still need synthesized data for relationships
  const { data: synthesizedData, isLoading: loadingSynthesized } = useSynthesizedData();
  
  // For non-graph views or when we need specific filtered data, use individual endpoints
  const { data: puzzlesFiltered = [], isLoading: loadingPuzzles } = usePuzzles({
    ...serverPuzzleFilters,
    limit: 500, // Get all for now
    enabled: !puzzleFilters.selectedPuzzleId // Disable if filtering by specific puzzle client-side
  });
  
  const { data: charactersFiltered = [], isLoading: loadingCharacters } = useCharacters({
    ...serverCharacterFilters,
    limit: 500, // Get all for now
  });
  
  const { data: elementsFiltered = [], isLoading: loadingElements } = useElements({
    ...serverElementFilters,
    limit: 500, // Get all for now
  });
  
  const { data: timelineRaw = [], isLoading: loadingTimeline } = useAllTimeline();
  
  // Use synthesized data for graph relationships, but prefer filtered data when available
  const elementsRaw = synthesizedData?.elements || [];
  const puzzlesRaw = synthesizedData?.puzzles || [];
  
  // Apply remaining client-side filters (for derived fields and search)
  const { characters, elements, puzzles, timeline } = useMemo(() => {
    // Start with server-filtered data when available, otherwise use synthesized
    let filteredPuzzles = puzzlesFiltered.length > 0 ? puzzlesFiltered : puzzlesRaw;
    let filteredCharacters = charactersFiltered;
    let filteredElements = elementsFiltered.length > 0 ? elementsFiltered : elementsRaw;
    
    // Apply client-side puzzle filters (completion status, specific puzzle)
    if (puzzleFilters.completionStatus !== 'all' || puzzleFilters.selectedPuzzleId) {
      filteredPuzzles = applyPuzzleFilters(filteredPuzzles, puzzleFilters);
    }
    
    // Apply client-side character filters (ownership status)
    if (characterFilters.ownershipStatus.size > 0) {
      filteredCharacters = applyCharacterFilters(filteredCharacters, characterFilters);
    }
    
    // Apply search filter across all entities
    if (searchTerm) {
      filteredPuzzles = applySearchFilter(filteredPuzzles, searchTerm, ['name', 'descriptionSolution']);
      filteredCharacters = applySearchFilter(filteredCharacters, searchTerm, ['name', 'overview', 'characterLogline']);
      filteredElements = applySearchFilter(filteredElements, searchTerm, ['name', 'descriptionText', 'productionNotes']);
    }
    
    return {
      characters: filteredCharacters,
      elements: filteredElements,
      puzzles: filteredPuzzles,
      timeline: timelineRaw // Timeline doesn't have specific filters yet
    };
  }, [puzzlesRaw, puzzlesFiltered, charactersFiltered, elementsRaw, elementsFiltered, timelineRaw, searchTerm, puzzleFilters, characterFilters]);
  
  // Debug: Log data counts when loaded
  React.useEffect(() => {
    if (!loadingSynthesized && elements.length > 0) {
      console.log('[PuzzleFocusView] Filtered data loaded - Elements:', elements.length, 'Puzzles:', puzzles.length);
      console.log('[PuzzleFocusView] Original counts - Elements:', elementsRaw.length, 'Puzzles:', puzzlesRaw.length);
      
      // Check for elements with puzzle relationships
      const elementsWithPuzzleRefs = elements.filter(e => 
        (e.requiredForPuzzleIds?.length > 0) || (e.rewardedByPuzzleIds?.length > 0)
      );
      console.log('[PuzzleFocusView] Elements with puzzle relationships:', elementsWithPuzzleRefs.length);
      
      // Log active filters
      const activeFilters = [];
      if (searchTerm) activeFilters.push(`search="${searchTerm}"`);
      if (puzzleFilters.selectedActs.size > 0) activeFilters.push(`acts=${Array.from(puzzleFilters.selectedActs).join(',')}`);
      if (puzzleFilters.selectedPuzzleId) activeFilters.push(`puzzleId=${puzzleFilters.selectedPuzzleId}`);
      if (puzzleFilters.completionStatus !== 'all') activeFilters.push(`status=${puzzleFilters.completionStatus}`);
      if (activeFilters.length > 0) {
        console.log('[PuzzleFocusView] Active filters:', activeFilters.join(', '));
      }
    }
  }, [elements, elementsRaw, puzzles, puzzlesRaw, loadingSynthesized, searchTerm, puzzleFilters]);

  // Helper function to get entity from node
  const getEntityFromNode = useCallback((node: Node): Character | Element | Puzzle | TimelineEvent | null => {
    if (!node.data?.entity) return null;
    return node.data.entity as Character | Element | Puzzle | TimelineEvent;
  }, []);

  // Helper function to determine entity type from node
  const getEntityType = useCallback((node: Node): 'character' | 'element' | 'puzzle' | 'timeline' => {
    const nodeType = node.type;
    if (nodeType === 'character') return 'character';
    if (nodeType === 'element') return 'element';
    if (nodeType === 'puzzle') return 'puzzle';
    if (nodeType === 'timeline') return 'timeline';
    
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
    
    return 'element'; // Default fallback
  }, []);

  // Handle entity save (placeholder for Sprint 2 mutations)
  const handleEntitySave = useCallback(async (updates: Partial<Character | Element | Puzzle | TimelineEvent>) => {
    console.log('Saving entity updates:', updates);
    // TODO: Implement mutation hooks in Sprint 2
    // This will call the appropriate mutation based on entity type
    // For now, just log the changes
    return Promise.resolve();
  }, []);
  
  // Combined loading state
  const isLoading = loadingCharacters || loadingSynthesized || loadingTimeline || loadingPuzzles || loadingElements;
  
  // Handle node click
  const handleNodeClick = useCallback((node: Node) => {
    console.log('Node clicked:', node);
    setSelectedNode(node);
    
    // If a specific puzzle is clicked, we could update the URL
    if (node.type === 'puzzle') {
      // Future: Update URL to reflect selected puzzle
      // navigate(`/puzzles/${node.id}`);
    }
  }, []);
  
  // Handle selection change
  const handleSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    console.log('Selection changed:', params);
  }, []);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="px-8 py-6 bg-secondary border-b">
          <h1 className="text-3xl font-bold text-foreground">Puzzle Network</h1>
          <p className="mt-2 text-muted-foreground">Loading puzzle relationships...</p>
        </div>
        <div className="flex-1 flex relative overflow-hidden">
          <LoadingSkeleton variant="graph" />
        </div>
      </div>
    );
  }
  
  // Calculate stats
  const stats = {
    totalPuzzles: puzzles.length,
    totalElements: elements.length,
    totalCharacters: characters.length,
    totalEvents: timeline.length,
  };
  
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="px-8 py-6 bg-secondary border-b">
          <h1 className="m-0 text-3xl font-bold text-foreground">Puzzle Network</h1>
          <p className="mt-2 mb-4 text-muted-foreground">
            Interactive visualization of puzzle dependencies and relationships
          </p>
          
          {/* Stats bar */}
          <div className="flex gap-8 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">Puzzles:</span>
              <span className="text-foreground text-lg font-semibold">{stats.totalPuzzles}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">Elements:</span>
              <span className="text-foreground text-lg font-semibold">{stats.totalElements}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">Characters:</span>
              <span className="text-foreground text-lg font-semibold">{stats.totalCharacters}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">Timeline:</span>
              <span className="text-foreground text-lg font-semibold">{stats.totalEvents}</span>
            </div>
          </div>
          
          {puzzleId && (
            <div className="mt-4 px-4 py-3 bg-yellow-100 rounded-md inline-flex items-center gap-3">
              <span className="text-yellow-800 text-sm font-medium">Selected Puzzle ID:</span>
              <span className="text-yellow-900 text-sm font-semibold font-mono" data-testid="puzzle-id">
                {puzzleId}
              </span>
            </div>
          )}
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex relative overflow-hidden">
          <div className="flex-1 relative">
            <GraphView
              characters={characters}
              elements={elements}
              puzzles={puzzles}
              timeline={timeline}
              viewType="puzzle-focus"
              onNodeClick={handleNodeClick}
              onSelectionChange={handleSelectionChange}
            />
          </div>
          
          {/* Enhanced Details Panel with full editing capabilities */}
          {selectedNode && (
            <DetailPanel
              entity={getEntityFromNode(selectedNode)}
              entityType={getEntityType(selectedNode)}
              onClose={() => setSelectedNode(null)}
              onSave={handleEntitySave}
              isLoading={false}
              isSaving={false}
              error={null}
              allEntities={{ characters, elements, puzzles, timeline }}
            />
          )}
        </div>
        
        {/* Instructions overlay (for Sprint 1) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-6 py-3 rounded-lg text-sm pointer-events-none z-10 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          <p className="m-0">
            <strong className="text-yellow-400">Navigation:</strong> Click and drag to pan • Scroll to zoom • 
            Click nodes to select • Hover to highlight connections
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
}