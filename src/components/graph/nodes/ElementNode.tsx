import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData } from '@/lib/graph/types';
import type { Element } from '@/types/notion/app';
import styles from './ElementNode.module.css';

/**
 * Custom React Flow node component for Element entities
 */
const ElementNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as GraphNodeData<Element>;
  const { entity, metadata } = nodeData;
  const hasError = metadata.errorState !== undefined;
  const hasSF = metadata.sfPatterns !== undefined;
  
  // Determine visual style based on status and type
  const statusClass = `status-${entity.status?.toLowerCase().replace(/[\s\/]/g, '-') ?? 'unknown'}`;
  const typeClass = `type-${entity.basicType?.toLowerCase().replace(/\s+/g, '-') ?? 'prop'}`;
  const sizeClass = `size-${metadata.visualHints?.size ?? 'small'}`;
  
  return (
    <div 
      className={`${styles.elementNode} ${styles[statusClass]} ${styles[typeClass]} ${styles[sizeClass]} ${hasError ? styles.error : ''} ${hasSF ? styles.hasSF : ''} ${selected ? styles.selected : ''}`}
    >
      {/* SF Pattern badge */}
      {hasSF && (
        <div className={styles.sfBadge}>SF</div>
      )}
      
      {/* Status indicator */}
      <div className={styles.statusBar} />
      
      {/* Main content */}
      <div className={styles.content}>
        <div className={styles.type}>{entity.basicType ?? 'Prop'}</div>
        <div className={styles.name}>{entity.name}</div>
        
        {/* SF Pattern details */}
        {hasSF && metadata.sfPatterns && (
          <div className={styles.sfDetails}>
            {metadata.sfPatterns.valueRating && (
              <span className={styles.rating}>★{metadata.sfPatterns.valueRating}</span>
            )}
            {metadata.sfPatterns.memoryType && (
              <span className={styles.memoryType}>{metadata.sfPatterns.memoryType[0]}</span>
            )}
          </div>
        )}
        
        {/* Container indicator */}
        {entity.isContainer && (
          <div className={styles.containerIndicator}>📦</div>
        )}
      </div>
      
      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="contains"
        className={styles.handle}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="owned"
        className={styles.handle}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="required"
        className={styles.handleTop}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="reveals"
        className={styles.handleBottom}
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

ElementNode.displayName = 'ElementNode';

export default ElementNode;