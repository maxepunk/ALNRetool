import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface PuzzleSkeletonProps {
  variant?: 'card' | 'list' | 'detail'
  className?: string
}

/**
 * A component that displays loading skeletons for puzzle content in different layouts.
 * Supports card (default), list, and detail variants.
 */
export function PuzzleSkeleton({ 
  variant = 'card',
  className = ''
}: PuzzleSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className={cn("flex items-center gap-3 p-3 border-b border-border", className)}>
        <Skeleton className="h-8 w-8 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex gap-4">
          <Skeleton className="h-24 w-24 rounded" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-4/5" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-8 w-32 rounded" />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <Skeleton className="h-6 w-36" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          
          <div className="space-y-3">
            <Skeleton className="h-6 w-28" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-1/2" />
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
            <Skeleton className="h-6 w-9/10" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-6 w-20 rounded" />
      </CardFooter>
    </Card>
  )
}