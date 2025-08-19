/**
 * Puzzle Focus View
 * Interactive puzzle network showing dependencies
 * Main view for Sprint 1 - shows puzzle relationships and dependencies
 */

import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { Node, OnSelectionChangeParams } from '@xyflow/react';

// Data hooks
import { useAllCharacters } from '@/hooks/useCharacters';
import { useAllTimeline } from '@/hooks/useTimeline';
import { useSynthesizedData } from '@/hooks/useSynthesizedData';

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
  
  // Fetch data from Notion via React Query - using synthesized data for proper bidirectional relationships
  const { data: characters = [], isLoading: loadingCharacters } = useAllCharacters();
  const { data: synthesizedData, isLoading: loadingSynthesized } = useSynthesizedData();
  const { data: timeline = [], isLoading: loadingTimeline } = useAllTimeline();
  
  // Extract elements and puzzles from synthesized data
  const elements = synthesizedData?.elements || [];
  const puzzles = synthesizedData?.puzzles || [];
  
  // Debug: Log data counts when loaded
  React.useEffect(() => {
    if (!loadingSynthesized && elements.length > 0) {
      console.log('[PuzzleFocusView] Synthesized data loaded - Elements:', elements.length, 'Puzzles:', puzzles.length);
      // Check for elements with puzzle relationships
      const elementsWithPuzzleRefs = elements.filter(e => 
        (e.requiredForPuzzleIds?.length > 0) || (e.rewardedByPuzzleIds?.length > 0)
      );
      console.log('[PuzzleFocusView] Elements with puzzle relationships:', elementsWithPuzzleRefs.length);
      
      const blackMarketCard = elements.find(e => e.id === '1dc2f33d-583f-8056-bf34-c6a9922067d8');
      console.log('[PuzzleFocusView] Black Market Business card found:', !!blackMarketCard);
      if (blackMarketCard) {
        console.log('[PuzzleFocusView] Black Market card relationships:', {
          rewardedByPuzzleIds: blackMarketCard.rewardedByPuzzleIds,
          requiredForPuzzleIds: blackMarketCard.requiredForPuzzleIds
        });
      }
      
      // Check first and last element to see range
      if (elements.length > 0) {
        console.log('[PuzzleFocusView] First element:', elements[0]?.name);
        console.log('[PuzzleFocusView] Last element:', elements[elements.length - 1]?.name);
      }
    }
  }, [elements, loadingSynthesized, puzzles]);

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
  const isLoading = loadingCharacters || loadingSynthesized || loadingTimeline;
  
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