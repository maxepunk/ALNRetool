/**
 * Depth Indicator Component
 * Shows feedback about the current graph depth state
 */

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Info, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DepthMetadata } from '@/lib/graph/types';

interface DepthIndicatorProps {
  isOpen: boolean;
  depthMetadata?: DepthMetadata;
}

export function DepthIndicator({ isOpen, depthMetadata }: DepthIndicatorProps) {
  if (!isOpen || !depthMetadata) {
    return null;
  }

  const { 
    isCompleteNetwork, 
    nodesAtCurrentDepth, 
    totalReachableNodes,
    currentDepthLimit,
    maxReachableDepth,
    depthDistribution
  } = depthMetadata;

  // Calculate nodes per depth level for display
  const depthBreakdown = Array.from(depthDistribution.entries())
    .sort(([a], [b]) => a - b)
    .slice(0, currentDepthLimit + 1)
    .map(([depth, count]) => `Depth ${depth}: ${count} nodes`)
    .join(' | ');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-3 py-2 space-y-2"
    >
      {/* Main indicator */}
      <div className="flex items-center gap-2">
        {isCompleteNetwork ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
              Complete network shown ({totalReachableNodes} nodes)
            </Badge>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Showing {nodesAtCurrentDepth} of {totalReachableNodes} nodes
            </Badge>
          </>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="space-y-2 text-xs">
                <p className="font-medium">Connection Depth Explained</p>
                <p>
                  Connection depth controls how many &quot;hops&quot; from the selected character to include in the graph.
                </p>
                <p>
                  • <strong>1 hop:</strong> Direct connections only
                </p>
                <p>
                  • <strong>2 hops:</strong> Connections of connections
                </p>
                <p>
                  • <strong>3+ hops:</strong> Extended network
                </p>
                {isCompleteNetwork && (
                  <p className="text-green-600 font-medium mt-2">
                    This character&apos;s entire network fits within {currentDepthLimit} hop{currentDepthLimit !== 1 ? 's' : ''}.
                    Increasing depth won&apos;t show additional nodes.
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Depth distribution breakdown */}
      {!isCompleteNetwork && maxReachableDepth > currentDepthLimit && (
        <div className="text-xs text-muted-foreground px-1">
          <p className="mb-1">Network extends to depth {maxReachableDepth}</p>
          <p className="text-[10px] opacity-75">{depthBreakdown}</p>
        </div>
      )}

      {/* Complete network indicator with details */}
      {isCompleteNetwork && maxReachableDepth <= 1 && (
        <div className="text-xs text-muted-foreground px-1">
          <p className="text-green-600">
            All connections are direct (1 hop).
          </p>
        </div>
      )}
    </motion.div>
  );
}