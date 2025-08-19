import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'rectangular' | 'circular'
  className?: string
  'aria-label'?: string
}

export function LoadingSkeleton({
  width = '100%',
  height = '1rem',
  variant = 'text',
  className = '',
  'aria-label': ariaLabel = 'Loading...',
}: LoadingSkeletonProps) {
  const variantClasses = {
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    text: 'rounded'
  }

  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 dark:bg-gray-700",
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
      aria-label={ariaLabel}
      role="progressbar"
      aria-busy="true"
    />
  )
}

interface SkeletonGroupProps {
  lines?: number
  spacing?: string
  className?: string
}

export function SkeletonGroup({ 
  lines = 3, 
  spacing = '0.5rem',
  className = ''
}: SkeletonGroupProps) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: spacing }}>
      {Array.from({ length: lines }, (_, index) => (
        <LoadingSkeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          aria-label={`Loading line ${index + 1} of ${lines}`}
        />
      ))}
    </div>
  )
}