import { LoadingSkeleton, SkeletonGroup } from './LoadingSkeleton'
import styles from './ElementSkeleton.module.css'

interface ElementSkeletonProps {
  variant?: 'card' | 'list' | 'detail'
  className?: string
}

export function ElementSkeleton({ 
  variant = 'card',
  className = ''
}: ElementSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className={`${styles.listItem} ${className}`}>
        <LoadingSkeleton variant="rectangular" width={32} height={32} />
        <div className={styles.listContent}>
          <LoadingSkeleton width="70%" height="1.2rem" />
          <LoadingSkeleton width="45%" height="0.9rem" />
        </div>
        <div className={styles.listMeta}>
          <LoadingSkeleton width={50} height="1rem" />
          <LoadingSkeleton variant="rectangular" width={60} height="1.5rem" />
        </div>
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className={`${styles.detail} ${className}`}>
        <div className={styles.header}>
          <LoadingSkeleton variant="rectangular" width={120} height={80} />
          <div className={styles.headerInfo}>
            <LoadingSkeleton width="80%" height="2rem" />
            <LoadingSkeleton width="40%" height="1.2rem" />
            <div className={styles.badges}>
              <LoadingSkeleton variant="rectangular" width={80} height="1.5rem" />
              <LoadingSkeleton variant="rectangular" width={60} height="1.5rem" />
            </div>
          </div>
        </div>
        <div className={styles.sections}>
          <div className={styles.section}>
            <LoadingSkeleton width="35%" height="1.5rem" />
            <SkeletonGroup lines={4} />
          </div>
          <div className={styles.section}>
            <LoadingSkeleton width="30%" height="1.5rem" />
            <div className={styles.patterns}>
              <LoadingSkeleton width="60%" height="1rem" />
              <LoadingSkeleton width="45%" height="1rem" />
              <LoadingSkeleton width="70%" height="1rem" />
            </div>
          </div>
          <div className={styles.section}>
            <LoadingSkeleton width="25%" height="1.5rem" />
            <SkeletonGroup lines={2} />
          </div>
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.cardHeader}>
        <LoadingSkeleton variant="rectangular" width={40} height={40} />
        <div className={styles.cardTitle}>
          <LoadingSkeleton width="85%" height="1.5rem" />
          <LoadingSkeleton width="55%" height="1rem" />
        </div>
      </div>
      <div className={styles.cardBody}>
        <SkeletonGroup lines={3} />
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.cardBadges}>
          <LoadingSkeleton variant="rectangular" width={60} height="1.2rem" />
          <LoadingSkeleton variant="rectangular" width={50} height="1.2rem" />
        </div>
        <LoadingSkeleton width="30%" height="1rem" />
      </div>
    </div>
  )
}