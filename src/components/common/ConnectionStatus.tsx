/**
 * Connection status indicator component
 * Shows online/offline status and last sync time
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ConnectionStatusProps {
  isOnline: boolean
  lastSyncTime: string
}

export default function ConnectionStatus({
  isOnline,
  lastSyncTime,
}: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2" data-testid="connection-status">
      <Badge variant={isOnline ? 'success' : 'secondary'}>
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          )}
        />
        <span>{isOnline ? 'Connected' : 'Offline'}</span>
      </Badge>

      {isOnline && lastSyncTime && (
        <span className="text-xs text-gray-500">
          Last synced: <time>{lastSyncTime}</time>
        </span>
      )}
    </div>
  )
}