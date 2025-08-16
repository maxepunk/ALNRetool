import { memo, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import styles from './GroupNode.module.css';

interface GroupNodeData extends Record<string, unknown> {
  label: string;
  chainStatus?: 'draft' | 'ready' | 'complete';
  childCount?: number;
  width?: number;
  height?: number;
}

/**
 * Custom React Flow node component for grouping related nodes
 * Provides visual containment for puzzle chains and other grouped entities
 */
const GroupNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as GroupNodeData;
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const status = nodeData.chainStatus || 'draft';
  const isDraft = status === 'draft';
  const isReady = status === 'ready' || status === 'complete';
  
  return (
    <div 
      className={`${styles.groupNode} ${isDraft ? styles.draft : ''} ${isReady ? styles.ready : ''} ${selected ? styles.selected : ''}`}
      style={{
        width: nodeData.width || 400,
        height: isCollapsed ? 60 : (nodeData.height || 300),
      }}
    >
      {/* Group header */}
      <div className={styles.groupHeader}>
        <button
          className={styles.collapseButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        <span className={styles.groupLabel}>{nodeData.label}</span>
        {nodeData.childCount && (
          <span className={styles.childCount}>({nodeData.childCount} puzzles)</span>
        )}
        <div className={styles.statusBadge}>
          {status === 'draft' && '📝'}
          {status === 'ready' && '✅'}
          {status === 'complete' && '🎯'}
        </div>
      </div>
      
      {/* Visual hierarchy indicator */}
      {!isCollapsed && (
        <div className={styles.hierarchyIndicator}>
          <div className={styles.hierarchyLine} />
        </div>
      )}
    </div>
  );
});

GroupNode.displayName = 'GroupNode';

export default GroupNode;