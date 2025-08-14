import { LoadingSkeleton, SkeletonGroup } from './LoadingSkeleton'
import styles from './CharacterSkeleton.module.css'

interface CharacterSkeletonProps {
  variant?: 'card' | 'list' | 'detail'
  className?: string
}

export function CharacterSkeleton({ 
  variant = 'card',
  className = ''
}: CharacterSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className={`${styles.listItem} ${className}`}>
        <LoadingSkeleton variant="circular" width={40} height={40} />
        <div className={styles.listContent}>
          <LoadingSkeleton width="60%" height="1.2rem" />
          <LoadingSkeleton width="40%" height="0.9rem" />
        </div>
        <LoadingSkeleton width={60} height="1.5rem" />
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className={`${styles.detail} ${className}`}>
        <div className={styles.header}>
          <LoadingSkeleton variant="circular" width={80} height={80} />
          <div className={styles.headerInfo}>
            <LoadingSkeleton width="70%" height="2rem" />
            <LoadingSkeleton width="50%" height="1.2rem" />
            <LoadingSkeleton width="40%" height="1rem" />
          </div>
        </div>
        <div className={styles.sections}>
          <div className={styles.section}>
            <LoadingSkeleton width="30%" height="1.5rem" />
            <SkeletonGroup lines={3} />
          </div>
          <div className={styles.section}>
            <LoadingSkeleton width="25%" height="1.5rem" />
            <SkeletonGroup lines={2} />
          </div>
          <div className={styles.section}>
            <LoadingSkeleton width="35%" height="1.5rem" />
            <SkeletonGroup lines={4} />
          </div>
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.cardHeader}>
        <LoadingSkeleton variant="circular" width={50} height={50} />
        <div className={styles.cardTitle}>
          <LoadingSkeleton width="80%" height="1.5rem" />
          <LoadingSkeleton width="50%" height="1rem" />
        </div>
      </div>
      <div className={styles.cardBody}>
        <SkeletonGroup lines={2} />
      </div>
      <div className={styles.cardFooter}>
        <LoadingSkeleton width="40%" height="1rem" />
        <LoadingSkeleton width="30%" height="1rem" />
      </div>
    </div>
  )
}