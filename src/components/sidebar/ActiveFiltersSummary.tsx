/**
 * ActiveFiltersSummary Component
 * Displays a summary of all active filters across all filter types
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useFilterStore } from '@/stores/filterStore';

interface ActiveFiltersSummaryProps {
  isOpen: boolean;
}

export const ActiveFiltersSummary = memo(function ActiveFiltersSummary({ 
  isOpen 
}: ActiveFiltersSummaryProps) {
  const activeFilterCount = useFilterStore((state) => state.activeFilterCount);
  const getActiveFiltersForView = useFilterStore((state) => state.getActiveFiltersForView);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);

  const count = activeFilterCount();
  const activeFilters = getActiveFiltersForView();

  if (!isOpen || count === 0) {
    return null;
  }

  return (
    <div className="px-3 py-2 border-t space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Active Filters ({count})
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={clearAllFilters}
          className="h-6 px-2 text-xs"
          aria-label="Clear all filters"
        >
          Clear all
          <X className="ml-1 h-3 w-3" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {activeFilters.map((filter: string, index: number) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="text-xs"
          >
            {filter}
          </Badge>
        ))}
      </div>
    </div>
  );
});