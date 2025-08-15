import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData } from '@/lib/graph/types';
import type { TimelineEvent } from '@/types/notion/app';
import styles from './TimelineNode.module.css';

/**
 * Custom React Flow node component for Timeline Event entities
 */
const TimelineNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as GraphNodeData<TimelineEvent>;
  const { entity, metadata } = nodeData;
  const hasError = metadata.errorState !== undefined;
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };
  
  // Determine importance based on characters involved
  const importance = entity.charactersInvolvedIds?.length ?? 0;
  const importanceClass = importance > 3 ? 'important' : importance > 1 ? 'moderate' : 'minor';
  
  return (
    <div 
      className={`${styles.timelineNode} ${styles[importanceClass]} ${hasError ? styles.error : ''} ${selected ? styles.selected : ''}`}
    >
      {/* Date badge */}
      <div className={styles.dateBadge}>
        {entity.date ? formatDate(entity.date) : 'Unknown Date'}
      </div>
      
      {/* Main content */}
      <div className={styles.content}>
        <div className={styles.icon}>📅</div>
        <div className={styles.description}>{entity.description}</div>
        
        {/* Characters involved */}
        {entity.charactersInvolvedIds && entity.charactersInvolvedIds.length > 0 && (
          <div className={styles.characters}>
            <span className={styles.characterCount}>
              👥 {entity.charactersInvolvedIds.length}
            </span>
          </div>
        )}
        
        {/* Evidence count */}
        {entity.memoryEvidenceIds && entity.memoryEvidenceIds.length > 0 && (
          <div className={styles.evidence}>
            <span className={styles.evidenceCount}>
              🔍 {entity.memoryEvidenceIds.length}
            </span>
          </div>
        )}
      </div>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="revealed-by"
        className={styles.handle}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="connects"
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

TimelineNode.displayName = 'TimelineNode';

export default TimelineNode;