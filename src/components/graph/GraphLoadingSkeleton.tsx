/**
 * Graph Loading Skeleton Component
 * 
 * Displays a loading state while entity data is being fetched.
 * Provides visual feedback to prevent perceived lag.
 * 
 * @module components/graph/GraphLoadingSkeleton
 */

/**
 * Animated loading skeleton for the graph view
 */
export function GraphLoadingSkeleton() {
  return (
    <div className="relative h-full w-full bg-gray-50 dark:bg-gray-900">
      {/* Header skeleton */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-9 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Graph area skeleton */}
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          {/* Loading spinner */}
          <div className="mb-4">
            <svg
              className="animate-spin h-12 w-12 mx-auto text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          
          {/* Loading text */}
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Loading graph data...
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            This may take a few moments
          </p>
        </div>
      </div>

      {/* Fake nodes for visual interest */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            style={{
              width: `${80 + Math.random() * 40}px`,
              height: `${60 + Math.random() * 20}px`,
              left: `${10 + (i % 3) * 30 + Math.random() * 10}%`,
              top: `${20 + Math.floor(i / 3) * 40 + Math.random() * 10}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Controls skeleton */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Minimap skeleton */}
      <div className="absolute bottom-4 right-4 w-48 h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  );
}

export default GraphLoadingSkeleton;