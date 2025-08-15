/**
 * Loading Skeleton component
 * Displays animated placeholders while data is loading
 */

import styles from './LoadingSkeleton.module.css';

interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'list' | 'graph';
  lines?: number;
  className?: string;
}

export default function LoadingSkeleton({ 
  variant = 'text', 
  lines = 3,
  className = ''
}: LoadingSkeletonProps) {
  if (variant === 'graph') {
    return (
      <div className={`${styles.graphSkeleton} ${className}`}>
        <div className={styles.graphNodes}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.graphNode} />
          ))}
        </div>
        <div className={styles.graphMessage}>Loading graph data...</div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${styles.card} ${className}`}>
        <div className={styles.cardHeader} />
        <div className={styles.cardBody}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.line} />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`${styles.list} ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={styles.listItem}>
            <div className={styles.listIcon} />
            <div className={styles.listContent}>
              <div className={styles.listTitle} />
              <div className={styles.listSubtitle} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default text variant
  return (
    <div className={`${styles.skeleton} ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div 
          key={i} 
          className={styles.line}
          style={{ width: `${Math.random() * 30 + 70}%` }}
        />
      ))}
    </div>
  );
}