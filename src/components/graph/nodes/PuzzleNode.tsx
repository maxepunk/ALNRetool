import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData } from '@/lib/graph/types';
import type { Puzzle } from '@/types/notion/app';
import styles from './PuzzleNode.module.css';

/**
 * Custom React Flow node component for Puzzle entities
 */
const PuzzleNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as GraphNodeData<Puzzle>;
  const { entity, metadata } = nodeData;
  const hasError = metadata.errorState !== undefined;
  
  // Determine complexity level
  const complexity = metadata.visualHints?.size || 'medium';
  const complexityClass = `complexity-${complexity}`;
  
  // Check if it's part of a chain
  const isChained = entity.parentItemId || (entity.subPuzzleIds && entity.subPuzzleIds.length > 0);
  
  return (
    <div 
      className={`${styles.puzzleNode} ${styles[complexityClass]} ${isChained ? styles.chained : ''} ${hasError ? styles.error : ''} ${selected ? styles.selected : ''}`}
    >
      {/* Chain indicator */}
      {isChained && (
        <div className={styles.chainBadge}>🔗</div>
      )}
      
      {/* Main content */}
      <div className={styles.content}>
        <div className={styles.icon}>🧩</div>
        <div className={styles.name}>{entity.name}</div>
        
        {/* Requirements and rewards */}
        <div className={styles.stats}>
          {entity.puzzleElementIds && entity.puzzleElementIds.length > 0 && (
            <span className={styles.requirement}>
              ↓ {entity.puzzleElementIds.length}
            </span>
          )}
          {entity.rewardIds && entity.rewardIds.length > 0 && (
            <span className={styles.reward}>
              ↑ {entity.rewardIds.length}
            </span>
          )}
        </div>
        
        {/* Owner indicator */}
        {entity.ownerId && (
          <div className={styles.owner}>👤</div>
        )}
      </div>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="requires"
        className={styles.handleRequires}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="rewards"
        className={styles.handleRewards}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="parent"
        className={styles.handleChain}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="child"
        className={styles.handleChain}
      />
      
      {/* Error indicator */}
      {hasError && (
        <div className={styles.errorIndicator} title={metadata.errorState?.message}>
          ⚠️
        </div>
      )}
    </div>
  );
});

PuzzleNode.displayName = 'PuzzleNode';

export default PuzzleNode;