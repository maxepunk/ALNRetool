/**
 * FilterStatusBar Component
 * Persistent UI feedback about filtering state
 * Shows total/visible nodes, filter mode, and connection depth
 */

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Filter, Target, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterStatusBarProps {
  totalNodes: number;
  visibleNodes: number;
  filterMode: 'pure' | 'connected' | 'focused';
  connectionDepth: number;
  focusedNode?: { id: string; name: string } | null;
  hasActiveFilters: boolean;
}

export const FilterStatusBar = memo(function FilterStatusBar({
  totalNodes,
  visibleNodes,
  filterMode,
  connectionDepth,
  focusedNode,
  hasActiveFilters
}: FilterStatusBarProps) {
  // Don't show if no filters are active and all nodes are visible
  if (!hasActiveFilters && totalNodes === visibleNodes && !focusedNode) {
    return null;
  }

  const getModeIcon = () => {
    switch (filterMode) {
      case 'pure':
        return <Filter className="h-3 w-3" />;
      case 'focused':
        return <Target className="h-3 w-3" />;
      case 'connected':
        return <Network className="h-3 w-3" />;
    }
  };

  const getModeDescription = () => {
    switch (filterMode) {
      case 'pure':
        return 'Showing only filtered nodes';
      case 'focused':
        return `Showing ${connectionDepth} ${connectionDepth === 1 ? 'hop' : 'hops'} from ${focusedNode?.name || 'focused node'}`;
      case 'connected':
        return `Showing filtered nodes + ${connectionDepth} ${connectionDepth === 1 ? 'hop' : 'hops'}`;
    }
  };

  const getModeColor = () => {
    switch (filterMode) {
      case 'pure':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'focused':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-700';
    }
  };

  return (
    <Card className={cn(
      "absolute top-4 left-4 z-20 p-3 shadow-lg border",
      getModeColor()
    )}>
      <div className="space-y-2">
        {/* Node count */}
        <div className="flex items-center gap-2 text-sm font-medium">
          <Info className="h-3 w-3" />
          <span>
            {visibleNodes} / {totalNodes} nodes
          </span>
          {visibleNodes < totalNodes && (
            <Badge variant="secondary" className="text-xs">
              {totalNodes - visibleNodes} hidden
            </Badge>
          )}
        </div>

        {/* Filter mode */}
        <div className="flex items-center gap-2 text-xs">
          {getModeIcon()}
          <span>{getModeDescription()}</span>
        </div>

        {/* Focused node indicator */}
        {focusedNode && (
          <div className="flex items-center gap-2 text-xs">
            <Target className="h-3 w-3 text-yellow-600" />
            <span className="font-medium">Focus: {focusedNode.name}</span>
          </div>
        )}
      </div>
    </Card>
  );
});