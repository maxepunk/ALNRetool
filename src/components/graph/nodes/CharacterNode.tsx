import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData } from '@/lib/graph/types';
import type { Character } from '@/types/notion/app';
import styles from './CharacterNode.module.css';

/**
 * Custom React Flow node component for Character entities
 */
const CharacterNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as GraphNodeData<Character>;
  const { entity, metadata } = nodeData;
  const hasError = metadata.errorState !== undefined;
  
  // Determine visual style based on tier and type
  const tierClass = `tier-${entity.tier?.toLowerCase() || 'unknown'}`;
  const typeClass = `type-${entity.type?.toLowerCase() || 'unknown'}`;
  const sizeClass = `size-${metadata.visualHints?.size || 'medium'}`;
  
  return (
    <div 
      className={`${styles.characterNode} ${styles[tierClass]} ${styles[typeClass]} ${styles[sizeClass]} ${hasError ? styles.error : ''} ${selected ? styles.selected : ''}`}
    >
      {/* Tier badge */}
      {entity.tier && (
        <div className={styles.tierBadge}>{entity.tier}</div>
      )}
      
      {/* Main content */}
      <div className={styles.content}>
        {entity.type === 'NPC' && <span className={styles.typeIndicator}>[NPC]</span>}
        <div className={styles.name}>{entity.name}</div>
        {entity.characterLogline && (
          <div className={styles.logline}>{entity.characterLogline}</div>
        )}
        <div className={styles.stats}>
          {entity.ownedElementIds.length > 0 && (
            <span className={styles.stat}>📦 {entity.ownedElementIds.length}</span>
          )}
          {entity.characterPuzzleIds.length > 0 && (
            <span className={styles.stat}>🧩 {entity.characterPuzzleIds.length}</span>
          )}
        </div>
      </div>
      
      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="ownership"
        className={styles.handle}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="connection"
        className={styles.handle}
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

CharacterNode.displayName = 'CharacterNode';

export default CharacterNode;