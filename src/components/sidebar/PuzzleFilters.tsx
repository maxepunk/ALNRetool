/**
 * PuzzleFilters Component
 * Puzzle-specific filter controls for the sidebar
 */

import { memo, useCallback, useMemo } from 'react';
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
import { ChevronRight, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/stores/filterStore';
import { usePuzzles } from '@/hooks/usePuzzles';

interface PuzzleFiltersProps {
  isOpen: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}export const PuzzleFilters = memo(function PuzzleFilters({ 
  isOpen, 
  isExpanded, 
  onToggleExpanded 
}: PuzzleFiltersProps) {
  const puzzleFilters = useFilterStore((state) => state.puzzleFilters);
  const toggleAct = useFilterStore((state) => state.toggleAct);
  const selectPuzzle = useFilterStore((state) => state.selectPuzzle);
  const setCompletionStatus = useFilterStore((state) => state.setCompletionStatus);
  const clearPuzzleFilters = useFilterStore((state) => state.clearPuzzleFilters);
  
  const { data: puzzles, isLoading } = usePuzzles();

  // Derive available acts from puzzle data
  const availableActs = useMemo(() => {
    if (!puzzles) return [];
    const acts = new Set<string>();
    puzzles.forEach(puzzle => {
      if (puzzle.timing && puzzle.timing.length > 0) {
        puzzle.timing.forEach(act => {
          if (act) acts.add(act);
        });
      }
    });
    return Array.from(acts).sort();
  }, [puzzles]);

  const handleActToggle = useCallback((act: string) => {
    toggleAct(act);
  }, [toggleAct]);

  const handlePuzzleSelect = useCallback((value: string) => {
    selectPuzzle(value === 'all' ? null : value);
  }, [selectPuzzle]);  const handleStatusChange = useCallback((value: string) => {
    setCompletionStatus(value as 'all' | 'completed' | 'incomplete');
  }, [setCompletionStatus]);

  const handleClearFilters = useCallback(() => {
    clearPuzzleFilters();
  }, [clearPuzzleFilters]);

  const activeFilterCount = puzzleFilters.selectedActs.size + 
    (puzzleFilters.selectedPuzzleId ? 1 : 0) + 
    (puzzleFilters.completionStatus !== 'all' ? 1 : 0);

  if (!isOpen) {
    return (
      <Button
        size="icon"
        variant="ghost"
        className="w-full"
        title="Puzzle filters"
        aria-label={`Puzzle filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
      >
        <Network className="h-4 w-4" />
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
          aria-controls="puzzle-filters-content"
        >
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium">Puzzle Filters</span>
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
      </CollapsibleTrigger>      <CollapsibleContent id="puzzle-filters-content" className="px-3 pb-3 space-y-3">
        {/* Act Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Acts</Label>
          {isLoading ? (
            <div className="text-xs text-muted-foreground">Loading acts...</div>
          ) : availableActs.length > 0 ? (
            <div className="space-y-1">
              {availableActs.map((act) => (
                <div key={act} className="flex items-center space-x-2">
                  <Checkbox
                    id={`act-${act}`}
                    checked={puzzleFilters.selectedActs.has(act)}
                    onCheckedChange={() => handleActToggle(act)}
                    aria-label={`Filter by ${act}`}
                  />
                  <Label
                    htmlFor={`act-${act}`}
                    className="text-sm cursor-pointer"
                  >
                    {act}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No acts available</div>
          )}
        </div>        {/* Puzzle Selection */}
        <div className="space-y-2">
          <Label htmlFor="puzzle-select" className="text-xs font-medium">
            Focus Puzzle
          </Label>
          <Select
            value={puzzleFilters.selectedPuzzleId || 'all'}
            onValueChange={handlePuzzleSelect}
            disabled={isLoading}
          >
            <SelectTrigger id="puzzle-select" className="w-full">
              <SelectValue placeholder={isLoading ? "Loading..." : "All puzzles"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All puzzles</SelectItem>
              {puzzles?.map((puzzle) => (
                <SelectItem key={puzzle.id} value={puzzle.id}>
                  {puzzle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Completion Status */}
        <div className="space-y-2">
          <Label htmlFor="status-select" className="text-xs font-medium">
            Completion Status
          </Label>          <Select
            value={puzzleFilters.completionStatus}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger 
              id="status-select" 
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All puzzles</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
            </SelectContent>
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
            Clear all puzzle filters
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
});