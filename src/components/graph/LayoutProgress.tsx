/**
 * LayoutProgress Component
 * Shows progress indicator during async layout computation
 */

import React from 'react';
import { X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface LayoutProgressProps {
  /** Current progress percentage (0-100) */
  progress: number;
  /** Algorithm name being computed */
  algorithm?: string;
  /** Optional message to display */
  message?: string;
  /** Time remaining estimate */
  timeRemaining?: string;
  /** Whether computation can be cancelled */
  cancellable?: boolean;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
}

export const LayoutProgress: React.FC<LayoutProgressProps> = ({
  progress,
  algorithm = 'Layout',
  message,
  timeRemaining,
  cancellable = true,
  onCancel
}) => {
  return (
    <Card className="absolute top-4 left-1/2 -translate-x-1/2 z-50 p-4 min-w-[320px] bg-white/95 backdrop-blur-sm shadow-lg">
      <div className="space-y-3">
        {/* Header with algorithm name and cancel button */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Computing {algorithm}
          </h3>
          {cancellable && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onCancel}
              aria-label="Cancel layout computation"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{Math.round(progress)}%</span>
            {timeRemaining && <span>{timeRemaining}</span>}
          </div>
        </div>

        {/* Optional message */}
        {message && (
          <p className="text-xs text-gray-600">{message}</p>
        )}
      </div>
    </Card>
  );
};

/**
 * Hook to manage layout progress state
 */
export function useLayoutProgress() {
  const [isComputing, setIsComputing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [message, setMessage] = React.useState<string>();
  const [startTime, setStartTime] = React.useState<number>();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const start = React.useCallback(() => {
    setIsComputing(true);
    setProgress(0);
    setStartTime(Date.now());
    setMessage(undefined);
  }, []);

  const update = React.useCallback((newProgress: number, newMessage?: string) => {
    setProgress(newProgress);
    if (newMessage) {
      setMessage(newMessage);
    }
  }, []);

  const complete = React.useCallback(() => {
    setIsComputing(false);
    setProgress(100);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setProgress(0);
      setMessage(undefined);
      timeoutRef.current = null;
    }, 500);
  }, []);

  const cancel = React.useCallback(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsComputing(false);
    setProgress(0);
    setMessage(undefined);
  }, []);

  // Calculate time remaining based on progress
  const timeRemaining = React.useMemo(() => {
    if (!startTime || progress === 0) return undefined;
    
    const elapsed = Date.now() - startTime;
    const rate = progress / elapsed;
    const remaining = (100 - progress) / rate;
    
    if (!isFinite(remaining)) return undefined;
    
    const seconds = Math.round(remaining / 1000);
    if (seconds < 1) return 'Almost done';
    if (seconds < 60) return `~${seconds}s`;
    
    const minutes = Math.round(seconds / 60);
    return `~${minutes}m`;
  }, [progress, startTime]);

  return {
    isComputing,
    progress,
    message,
    timeRemaining,
    start,
    update,
    complete,
    cancel
  };
}