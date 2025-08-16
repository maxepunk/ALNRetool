/**
 * Puzzle Focus View
 * Interactive puzzle network showing dependencies
 * Main view for Sprint 1 - shows puzzle relationships and dependencies
 */

import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { Node, OnSelectionChangeParams } from '@xyflow/react';

// Data hooks
import { useAllCharacters } from '@/hooks/useCharacters';
import { useAllElements } from '@/hooks/useElements';
import { useAllPuzzles } from '@/hooks/usePuzzles';
import { useAllTimeline } from '@/hooks/useTimeline';

// Components
import GraphView from '@/components/graph/GraphView';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Styles
import styles from './PuzzleFocusView.module.css';

/**
 * Puzzle Focus View Component
 * Displays an interactive graph of puzzles and their relationships
 */
export default function PuzzleFocusView() {
  const { puzzleId } = useParams();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Fetch data from Notion via React Query - fetching ALL data to avoid pagination issues
  const { data: characters = [], isLoading: loadingCharacters } = useAllCharacters();
  const { data: elements = [], isLoading: loadingElements } = useAllElements();
  const { data: puzzles = [], isLoading: loadingPuzzles } = useAllPuzzles();
  const { data: timeline = [], isLoading: loadingTimeline } = useAllTimeline();
  
  // Combined loading state
  const isLoading = loadingCharacters || loadingElements || loadingPuzzles || loadingTimeline;
  
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
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Puzzle Network</h1>
          <p className={styles.subtitle}>Loading puzzle relationships...</p>
        </div>
        <div className={styles.content}>
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
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Puzzle Network</h1>
          <p className={styles.subtitle}>
            Interactive visualization of puzzle dependencies and relationships
          </p>
          
          {/* Stats bar */}
          <div className={styles.statsBar}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Puzzles:</span>
              <span className={styles.statValue}>{stats.totalPuzzles}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Elements:</span>
              <span className={styles.statValue}>{stats.totalElements}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Characters:</span>
              <span className={styles.statValue}>{stats.totalCharacters}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Timeline:</span>
              <span className={styles.statValue}>{stats.totalEvents}</span>
            </div>
          </div>
          
          {puzzleId && (
            <div className={styles.selectedPuzzle}>
              <span className={styles.selectedLabel}>Selected Puzzle ID:</span>
              <span className={styles.selectedValue} data-testid="puzzle-id">
                {puzzleId}
              </span>
            </div>
          )}
        </div>
        
        {/* Main content */}
        <div className={styles.content}>
          <div className={styles.graphWrapper}>
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
          
          {/* Details Panel (placeholder for Sprint 1) */}
          {selectedNode && (
            <div className={styles.detailsPanel}>
              <h3 className={styles.detailsTitle}>Selected Node</h3>
              <div className={styles.detailsContent}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Type:</span>
                  <span className={styles.detailValue}>{selectedNode.type}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>ID:</span>
                  <span className={styles.detailValue}>{selectedNode.id}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Label:</span>
                  <span className={styles.detailValue}>
                    {(selectedNode.data?.label as string) || 'N/A'}
                  </span>
                </div>
                {/* More details will be added in Sprint 2 */}
              </div>
            </div>
          )}
        </div>
        
        {/* Instructions overlay (for Sprint 1) */}
        <div className={styles.instructions}>
          <p>
            <strong>Navigation:</strong> Click and drag to pan • Scroll to zoom • 
            Click nodes to select • Hover to highlight connections
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
}