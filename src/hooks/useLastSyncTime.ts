/**
 * Hook to track last successful sync time
 */

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useLastSyncTime() {
  const queryClient = useQueryClient()
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    const now = new Date()
    return now.toLocaleTimeString()
  })

  useEffect(() => {
    // Update sync time when queries are successful
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event?.query?.state?.status === 'success') {
        const now = new Date()
        setLastSyncTime(now.toLocaleTimeString())
      }
    })

    return unsubscribe
  }, [queryClient])

  return lastSyncTime
}