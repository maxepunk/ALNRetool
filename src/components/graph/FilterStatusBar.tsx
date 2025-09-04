/**
 * FilterStatusBar Component
 * Persistent UI feedback about filtering state
 * Shows total/visible nodes and connection depth
 */

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, Target, Network, X } from 'lucide-react';
import { useFilterStore } from '@/stores/filterStore';

interface FilterStatusBarProps {
  totalNodes: number;
  visibleNodes: number;
  connectionDepth: number;
  selectedNode?: { id: string; name: string } | null;
  hasActiveFilters: boolean;
}

export const FilterStatusBar = memo(function FilterStatusBar({
  totalNodes,
  visibleNodes,
  connectionDepth,
  selectedNode,
  hasActiveFilters
}: FilterStatusBarProps) {
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);
  
  // Don't show if no filters are active and all nodes are visible
  if (!hasActiveFilters && totalNodes === visibleNodes && !selectedNode) {
    return null;
  }

  const getDescription = () => {
    if (selectedNode) {
      return `Showing ${connectionDepth} ${connectionDepth === 1 ? 'level' : 'levels'} from ${selectedNode.name}`;
    } else if (connectionDepth === 0) {
      return 'Showing only filtered nodes';
    } else {
      return `Showing filtered nodes + ${connectionDepth} ${connectionDepth === 1 ? 'level' : 'levels'}`;
    }
  };

  return (
    <Card className="absolute top-4 left-4 z-20 p-3 shadow-lg border bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
      <div className="space-y-2">
        {/* Node count and Clear button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            <Info className="h-3 w-3 text-gray-500" />
            <span>
              {visibleNodes} / {totalNodes} nodes
            </span>
            {visibleNodes < totalNodes && (
              <Badge variant="secondary" className="text-xs">
                {totalNodes - visibleNodes} hidden
              </Badge>
            )}
          </div>
          
          {/* Clear All Filters button - Always show when status bar is visible */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs"
            aria-label="Clear all filters"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>

        {/* Connection depth description */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Network className="h-3 w-3" />
          <span>{getDescription()}</span>
        </div>

        {/* Selected node indicator */}
        {selectedNode && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Target className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span className="font-medium">Selected: {selectedNode.name}</span>
          </div>
        )}
      </div>
    </Card>
  );
});