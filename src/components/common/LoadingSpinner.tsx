/**
 * Loading spinner component
 * Shows during async operations and lazy loading
 */

"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
  className?: string;
}

const sizeClasses = {
  small: "w-6 h-6 border-2",
  medium: "w-8 h-8 border-2",
  large: "w-12 h-12 border-4"
};

export default function LoadingSpinner({
  message = "Loading...",
  size = "medium",
  className
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <div
        className={cn(
          "rounded-full border-gray-200 border-t-blue-600 animate-spin",
          sizeClasses[size],
          className
        )}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">{message}</span>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground m-0">{message}</p>
      )}
    </div>
  );
}