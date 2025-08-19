import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface TimelineSkeletonProps {
  variant?: 'card' | 'list' | 'detail'
  className?: string
}

/**
 * A component that displays loading skeletons for timeline content in different layouts.
 * Supports card (default), list, and detail variants.
 */
export function TimelineSkeleton({ 
  variant = 'card',
  className = ''
}: TimelineSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className={cn("flex items-center gap-3 p-3 border-b border-border", className)}>
        <Skeleton className="h-10 w-10 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-5 w-24 rounded" />
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex gap-4">
          <Skeleton className="h-16 w-16 rounded" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-6 w-32 rounded" />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-36" />
            <div className="space-y-2">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-2 gap-3">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-4 w-3/4" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          <div className="space-y-2">
            {Array(2).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}