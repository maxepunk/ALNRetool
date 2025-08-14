/**
 * Loading spinner component
 * Shows during async operations and lazy loading
 */

import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'medium' 
}: LoadingSpinnerProps) {
  return (
    <div className={`${styles.container} ${styles[size]}`}>
      <div className={styles.spinner} role="status" aria-live="polite">
        <span className={styles.visuallyHidden}>{message}</span>
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}