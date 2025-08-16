import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData } from '@/lib/graph/types';
import type { Puzzle } from '@/types/notion/app';
import styles from './PuzzleNode.module.css';

/**
 * Custom React Flow node component for Puzzle entities with diamond shape
 */
const PuzzleNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as GraphNodeData<Puzzle>;
  const { entity, metadata } = nodeData;
  const hasError = metadata.errorState !== undefined;
  
  // Determine complexity level
  const complexity = metadata.visualHints?.size ?? 'medium';
  const complexityClass = `complexity-${complexity}`;
  
  // Check if it's part of a chain
  const isChained = entity.parentItemId ?? (entity.subPuzzleIds && entity.subPuzzleIds.length > 0);
  
  // Check if puzzle is locked (from visual hints)
  const isLocked = metadata.visualHints?.icon === 'lock';
  
  return (
    <div className={`${styles.puzzleNodeContainer} ${styles[complexityClass]}`}>
      {/* Diamond shape container */}
      <div 
        className={`${styles.puzzleNode} ${isChained ? styles.chained : ''} ${hasError ? styles.error : ''} ${selected ? styles.selected : ''}`}
      >
      {/* Chain indicator */}
      {isChained && (
        <div className={styles.chainBadge}>🔗</div>
      )}
      
      {/* Lock indicator for locked puzzles */}
      {isLocked && (
        <div className={styles.lockBadge}>🔒</div>
      )}
      
        {/* Main content centered in diamond */}
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
        
        {/* Error indicator */}
        {hasError && (
          <div className={styles.errorIndicator} title={metadata.errorState?.message}>
            ⚠️
          </div>
        )}
      </div>
      
      {/* Connection handles positioned at diamond corners */}
      <Handle
        type="target"
        position={Position.Top}
        id="requires"
        className={styles.handleRequires}
        style={{ top: '0', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="rewards"
        className={styles.handleRewards}
        style={{ bottom: '0', left: '50%', transform: 'translate(-50%, 50%)' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="parent"
        className={styles.handleChain}
        style={{ left: '0', top: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="child"
        className={styles.handleChain}
        style={{ right: '0', top: '50%', transform: 'translate(50%, -50%)' }}
      />
    </div>
  );
});

PuzzleNode.displayName = 'PuzzleNode';

export default PuzzleNode;