/**
 * Loading Skeleton component
 * Displays animated placeholders while data is loading
 */

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'list' | 'graph';
  lines?: number;
  className?: string;
}

export default function LoadingSkeleton({ 
  variant = 'text', 
  lines = 3,
  className = ''
}: LoadingSkeletonProps) {
  if (variant === 'graph') {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 rounded-lg border border-border bg-card", className)}>
        <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-md">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-center">
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading graph data...</span>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
        <Skeleton className="h-48 w-full rounded-none" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          {[...Array(3)].map((_, i) => (
            <Skeleton 
              key={i} 
              className="h-4" 
              style={{ width: `${Math.random() * 30 + 70}%` }} 
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn("space-y-3", className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-2">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default text variant
  return (
    <div className={cn("space-y-2", className)}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4"
          style={{ width: `${Math.random() * 30 + 70}%` }}
        />
      ))}
    </div>
  );
}