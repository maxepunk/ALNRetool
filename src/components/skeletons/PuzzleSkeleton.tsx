import { LoadingSkeleton, SkeletonGroup } from './LoadingSkeleton'
import styles from './PuzzleSkeleton.module.css'

interface PuzzleSkeletonProps {
  variant?: 'card' | 'list' | 'detail'
  className?: string
}

export function PuzzleSkeleton({ 
  variant = 'card',
  className = ''
}: PuzzleSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className={`${styles.listItem} ${className}`}>
        <LoadingSkeleton variant="rectangular" width={32} height={32} />
        <div className={styles.listContent}>
          <LoadingSkeleton width="75%" height="1.2rem" />
          <LoadingSkeleton width="50%" height="0.9rem" />
        </div>
        <div className={styles.listMeta}>
          <LoadingSkeleton width={40} height="1rem" />
          <LoadingSkeleton width="60%" height="0.9rem" />
        </div>
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className={`${styles.detail} ${className}`}>
        <div className={styles.header}>
          <LoadingSkeleton variant="rectangular" width={100} height={100} />
          <div className={styles.headerInfo}>
            <LoadingSkeleton width="85%" height="2rem" />
            <LoadingSkeleton width="35%" height="1.2rem" />
            <div className={styles.difficulty}>
              <LoadingSkeleton variant="rectangular" width={120} height="2rem" />
            </div>
          </div>
        </div>
        <div className={styles.sections}>
          <div className={styles.section}>
            <LoadingSkeleton width="40%" height="1.5rem" />
            <SkeletonGroup lines={5} />
          </div>
          <div className={styles.section}>
            <LoadingSkeleton width="35%" height="1.5rem" />
            <div className={styles.requirements}>
              <LoadingSkeleton width="80%" height="1rem" />
              <LoadingSkeleton width="65%" height="1rem" />
              <LoadingSkeleton width="70%" height="1rem" />
            </div>
          </div>
          <div className={styles.section}>
            <LoadingSkeleton width="25%" height="1.5rem" />
            <div className={styles.rewards}>
              <LoadingSkeleton width="60%" height="1rem" />
              <LoadingSkeleton width="55%" height="1rem" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.cardHeader}>
        <LoadingSkeleton variant="rectangular" width={50} height={50} />
        <div className={styles.cardTitle}>
          <LoadingSkeleton width="90%" height="1.5rem" />
          <LoadingSkeleton width="45%" height="1rem" />
        </div>
      </div>
      <div className={styles.cardBody}>
        <SkeletonGroup lines={3} />
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.cardMeta}>
          <LoadingSkeleton width="50%" height="0.9rem" />
          <LoadingSkeleton width="40%" height="0.9rem" />
        </div>
        <LoadingSkeleton variant="rectangular" width={70} height="1.5rem" />
      </div>
    </div>
  )
}