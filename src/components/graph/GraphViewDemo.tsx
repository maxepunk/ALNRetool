import React, { useState } from 'react';
import GraphView from './GraphView';
import { useCharacters, useElements, usePuzzles, useTimeline } from '@/hooks/useNotionData';
import { CharacterSkeleton, ElementSkeleton, PuzzleSkeleton, TimelineSkeleton } from '../skeletons';
import type { ViewType } from '@/lib/graph/types';
import { logger } from '@/lib/graph/utils/Logger'


/**
 * Demo component to test GraphView with real data
 */
const GraphViewDemo: React.FC = () => {
  const [viewType, setViewType] = useState<ViewType>('puzzle-focus');
  
  // Fetch data using React Query hooks
  const { data: characters, isLoading: loadingCharacters } = useCharacters();
  const { data: elements, isLoading: loadingElements } = useElements();
  const { data: puzzles, isLoading: loadingPuzzles } = usePuzzles();
  const { data: timeline, isLoading: loadingTimeline } = useTimeline();
  
  const isLoading = loadingCharacters || loadingElements || loadingPuzzles || loadingTimeline;
  
  // Handle node click
  const handleNodeClick = (node: any) => {
    logger.debug('Node clicked:', undefined, node);
  };
  
  // Handle selection change
  const handleSelectionChange = (params: any) => {
    logger.debug('Selection changed:', undefined, params);
  };
  
  if (isLoading) {
    return (
      <div style={{ padding: '20px', display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        <CharacterSkeleton />
        <ElementSkeleton />
        <PuzzleSkeleton />
        <TimelineSkeleton />
      </div>
    );
  }
  
  if (!characters || !elements || !puzzles || !timeline) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>No data available</h2>
        <p>Please ensure the backend server is running and Notion API is configured.</p>
      </div>
    );
  }
  
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* View type selector */}
      <div style={{ 
        padding: '16px', 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 600 }}>View Type:</span>
        <button
          onClick={() => setViewType('puzzle-focus')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            background: viewType === 'puzzle-focus' ? '#3b82f6' : 'white',
            color: viewType === 'puzzle-focus' ? 'white' : '#374151',
            cursor: 'pointer',
          }}
        >
          Puzzle Focus
        </button>
        <button
          onClick={() => setViewType('character-journey')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            background: viewType === 'character-journey' ? '#3b82f6' : 'white',
            color: viewType === 'character-journey' ? 'white' : '#374151',
            cursor: 'pointer',
          }}
        >
          Character Journey
        </button>
        <button
          onClick={() => setViewType('content-status')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            background: viewType === 'content-status' ? '#3b82f6' : 'white',
            color: viewType === 'content-status' ? 'white' : '#374151',
            cursor: 'pointer',
          }}
        >
          Content Status
        </button>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', fontSize: '14px' }}>
          <span>Characters: {characters.length}</span>
          <span>Elements: {elements.length}</span>
          <span>Puzzles: {puzzles.length}</span>
          <span>Timeline: {timeline.length}</span>
        </div>
      </div>
      
      {/* Graph view */}
      <div style={{ flex: 1 }}>
        <GraphView
          characters={characters}
          elements={elements}
          puzzles={puzzles}
          timeline={timeline}
          viewType={viewType}
          onNodeClick={handleNodeClick}
          onSelectionChange={handleSelectionChange}
        />
      </div>
    </div>
  );
};

export default GraphViewDemo;