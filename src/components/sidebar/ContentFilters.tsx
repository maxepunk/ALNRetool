/**
 * ContentFilters Component
 * Content status filter controls for the sidebar
 */

import { memo, useCallback } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/stores/filterStore';

interface ContentFiltersProps {
  isOpen: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}const contentStatusOptions: Array<'draft' | 'review' | 'approved' | 'published'> = [
  'draft', 'review', 'approved', 'published'
];

export const ContentFilters = memo(function ContentFilters({ 
  isOpen, 
  isExpanded, 
  onToggleExpanded 
}: ContentFiltersProps) {
  const contentFilters = useFilterStore((state) => state.contentFilters);
  const toggleContentStatus = useFilterStore((state) => state.toggleContentStatus);
  const setHasIssues = useFilterStore((state) => state.setHasIssues);
  const setLastEditedRange = useFilterStore((state) => state.setLastEditedRange);
  const clearContentFilters = useFilterStore((state) => state.clearContentFilters);

  const handleStatusToggle = useCallback(
    (status: 'draft' | 'review' | 'approved' | 'published') => {
      toggleContentStatus(status);
    },
    [toggleContentStatus]
  );

  const handleIssuesToggle = useCallback((checked: boolean) => {
    setHasIssues(checked ? true : null);
  }, [setHasIssues]);

  const handleEditedRangeChange = useCallback((value: string) => {
    setLastEditedRange(value as 'today' | 'week' | 'month' | 'all');
  }, [setLastEditedRange]);  const handleClearFilters = useCallback(() => {
    clearContentFilters();
  }, [clearContentFilters]);

  const activeFilterCount = 
    contentFilters.contentStatus.size + 
    (contentFilters.hasIssues !== null ? 1 : 0) + 
    (contentFilters.lastEditedRange !== 'all' ? 1 : 0);

  if (!isOpen) {
    return (
      <Button
        size="icon"
        variant="ghost"
        className="w-full relative"
        title="Content filters"
        aria-label={`Content filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
      >
        <CheckSquare className="h-4 w-4" />
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
            {activeFilterCount}
          </Badge>
        )}
      </Button>
    );
  }  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 py-2 h-auto"
          aria-expanded={isExpanded}
          aria-controls="content-filters-content"
        >
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium">Content Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <ChevronRight 
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "transform rotate-90"
            )}
            aria-hidden="true"
          />
        </Button>
      </CollapsibleTrigger>      <CollapsibleContent id="content-filters-content" className="px-3 pb-3 space-y-3">
        {/* Content Status */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Content Status</Label>
          <div className="space-y-1">
            {contentStatusOptions.map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={contentFilters.contentStatus.has(status)}
                  onCheckedChange={() => handleStatusToggle(status)}
                  aria-label={`Filter by ${status} status`}
                />
                <Label
                  htmlFor={`status-${status}`}
                  className="text-sm cursor-pointer capitalize"
                >
                  {status}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Has Issues */}
        <div className="flex items-center justify-between">
          <Label htmlFor="has-issues" className="text-xs font-medium cursor-pointer">            Show Issues Only
          </Label>
          <Switch
            id="has-issues"
            checked={contentFilters.hasIssues === true}
            onCheckedChange={handleIssuesToggle}
            aria-label="Filter to show only content with issues"
          />
        </div>

        {/* Last Edited Range */}
        <div className="space-y-2">
          <Label htmlFor="edited-range" className="text-xs font-medium">
            Last Edited
          </Label>
          <Select
            value={contentFilters.lastEditedRange}
            onValueChange={handleEditedRangeChange}
          >
            <SelectTrigger 
              id="edited-range" 
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="w-full"
          >
            Clear all content filters
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
});