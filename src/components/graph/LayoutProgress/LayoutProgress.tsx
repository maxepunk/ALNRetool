/**
 * LayoutProgress Component
 * Shows progress indicator during layout calculation
 * Allows cancellation of long-running operations
 */

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface LayoutProgressProps {
  /** Current progress percentage (0-100) */
  progress: number;
  /** Algorithm name being executed */
  algorithm?: string;
  /** Time remaining estimate in seconds */
  timeRemaining?: number;
  /** Whether the operation is cancellable */
  cancellable?: boolean;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export const LayoutProgress: React.FC<LayoutProgressProps> = ({
  progress,
  algorithm = 'Layout',
  timeRemaining,
  cancellable = true,
  onCancel,
  className
}) => {
  // Format time remaining
  const formatTime = (seconds?: number) => {
    if (!seconds) return '';
    if (seconds < 1) return 'less than 1s';
    if (seconds < 60) return `~${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `~${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div
      className={cn(
        'absolute top-4 left-1/2 -translate-x-1/2 z-50',
        'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm',
        'border border-gray-200 dark:border-gray-700',
        'rounded-lg shadow-lg p-4 min-w-[320px]',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Calculating {algorithm} Layout
            </p>
            {timeRemaining && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(timeRemaining)} remaining
              </p>
            )}
          </div>
        </div>
        
        {cancellable && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-6 w-6 p-0"
            aria-label="Cancel layout calculation"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          {Math.round(progress)}% complete
        </p>
      </div>
    </div>
  );
};

export default LayoutProgress;