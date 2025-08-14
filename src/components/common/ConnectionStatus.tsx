/**
 * Connection status indicator component
 * Shows online/offline status and last sync time
 */

import styles from './ConnectionStatus.module.css'

interface ConnectionStatusProps {
  isOnline: boolean
  lastSyncTime: string
}

export default function ConnectionStatus({ 
  isOnline, 
  lastSyncTime 
}: ConnectionStatusProps) {
  return (
    <div 
      className={`${styles.container} ${isOnline ? styles.online : styles.offline}`}
      data-testid="connection-status"
    >
      <span 
        className={`
          ${styles.indicator} 
          ${isOnline ? 'status-connected' : 'status-disconnected'}
        `}
      />
      <span className={styles.text}>
        {isOnline ? 'Connected' : 'Offline'}
      </span>
      {isOnline && lastSyncTime && (
        <span className={styles.syncTime}>
          Last synced: <time>{lastSyncTime}</time>
        </span>
      )}
    </div>
  )
}