import { LoadingSkeleton, SkeletonGroup } from './LoadingSkeleton'
import styles from './TimelineSkeleton.module.css'

interface TimelineSkeletonProps {
  variant?: 'card' | 'list' | 'detail' | 'timeline'
  className?: string
}

export function TimelineSkeleton({ 
  variant = 'timeline',
  className = ''
}: TimelineSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className={`${styles.listItem} ${className}`}>
        <div className={styles.listDate}>
          <LoadingSkeleton width={80} height="1rem" />
        </div>
        <div className={styles.listContent}>
          <LoadingSkeleton width="80%" height="1.2rem" />
          <LoadingSkeleton width="55%" height="0.9rem" />
        </div>
        <div className={styles.listMeta}>
          <LoadingSkeleton width={30} height="1rem" />
        </div>
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className={`${styles.detail} ${className}`}>
        <div className={styles.header}>
          <div className={styles.dateInfo}>
            <LoadingSkeleton width={120} height="2.5rem" />
            <LoadingSkeleton width={100} height="1.2rem" />
          </div>
          <div className={styles.headerContent}>
            <LoadingSkeleton width="90%" height="2rem" />
            <LoadingSkeleton width="60%" height="1.2rem" />
          </div>
        </div>
        <div className={styles.sections}>
          <div className={styles.section}>
            <LoadingSkeleton width="40%" height="1.5rem" />
            <SkeletonGroup lines={4} />
          </div>
          <div className={styles.section}>
            <LoadingSkeleton width="35%" height="1.5rem" />
            <div className={styles.participants}>
              <LoadingSkeleton width="70%" height="1rem" />
              <LoadingSkeleton width="60%" height="1rem" />
              <LoadingSkeleton width="55%" height="1rem" />
            </div>
          </div>
          <div className={styles.section}>
            <LoadingSkeleton width="25%" height="1.5rem" />
            <div className={styles.evidence}>
              <LoadingSkeleton width="65%" height="1rem" />
              <LoadingSkeleton width="50%" height="1rem" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`${styles.card} ${className}`}>
        <div className={styles.cardHeader}>
          <LoadingSkeleton variant="rectangular" width={60} height={60} />
          <div className={styles.cardTitle}>
            <LoadingSkeleton width="85%" height="1.5rem" />
            <LoadingSkeleton width="40%" height="1rem" />
          </div>
        </div>
        <div className={styles.cardBody}>
          <SkeletonGroup lines={2} />
        </div>
        <div className={styles.cardFooter}>
          <LoadingSkeleton width="50%" height="0.9rem" />
          <LoadingSkeleton width="30%" height="0.9rem" />
        </div>
      </div>
    )
  }

  // Default timeline variant
  return (
    <div className={`${styles.timeline} ${className}`}>
      <div className={styles.timelineMarker}>
        <LoadingSkeleton variant="circular" width={12} height={12} />
      </div>
      <div className={styles.timelineContent}>
        <div className={styles.timelineHeader}>
          <LoadingSkeleton width="70%" height="1.2rem" />
          <LoadingSkeleton width={80} height="0.9rem" />
        </div>
        <LoadingSkeleton width="90%" height="1rem" />
        <div className={styles.timelineMeta}>
          <LoadingSkeleton width="40%" height="0.8rem" />
          <LoadingSkeleton width="30%" height="0.8rem" />
        </div>
      </div>
    </div>
  )
}