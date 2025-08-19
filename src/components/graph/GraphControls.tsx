import React, { useState, useCallback, useRef } from 'react';
import { Search, Filter, X, ChevronDown, Check, ChevronRight, MinusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Puzzle } from '@/types/notion/app';

export interface FilterState {
  searchTerm: string;
  selectedActs: Set<string>;
  selectedPuzzleId: string | null;
}

interface GraphControlsProps {
  puzzles: Puzzle[];
  filterState: FilterState;
  onFilterChange: (state: FilterState) => void;
  onClearFilters: () => void;
  className?: string;
}

/**
 * GraphControls - Advanced filtering and search panel for the graph visualization
 * 
 * @description
 * A comprehensive control panel that provides search and filtering capabilities for the graph.
 * Features a collapsible interface with smooth animations, allowing users to minimize the panel
 * when focusing on the graph while maintaining quick access to filter controls.
 * 
 * @features
 * - **Search**: Fuzzy text search across all node labels with real-time updates
 * - **Act Filtering**: Filter nodes by game acts (Act 0, 1, 2) with multi-select support
 * - **Puzzle Selection**: Isolate specific puzzles and their dependencies
 * - **Collapsible Panel**: Minimize to save screen space with animated transitions
 * - **Active Filter Display**: Visual badges showing applied filters
 * - **Session Persistence**: Filter state saved in sessionStorage
 * - **Glassmorphism UI**: Modern design with backdrop blur effects
 * 
 * @param {GraphControlsProps} props - Component props
 * @param {Puzzle[]} props.puzzles - Array of puzzle entities for the selector
 * @param {FilterState} props.filterState - Current filter state object
 * @param {Function} props.onFilterChange - Callback when filters change
 * @param {Function} props.onClearFilters - Callback to clear all filters
 * @param {string} [props.className] - Additional CSS classes
 * 
 * @complexity O(n) for filter updates where n is the number of filtered items
 * @performance Memoized callbacks prevent unnecessary re-renders
 * 
 * @example
 * ```tsx
 * <GraphControls
 *   puzzles={puzzles}
 *   filterState={filterState}
 *   onFilterChange={handleFilterChange}
 *   onClearFilters={handleClearFilters}
 * />
 * ```
 * 
 * @since Sprint 2
 * @author ALNRetool Team
 */
export default function GraphControls({
  puzzles,
  filterState,
  onFilterChange,
  onClearFilters,
  className,
}: GraphControlsProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationClass, setAnimationClass] = useState('');

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filterState,
      searchTerm: e.target.value,
    });
  }, [filterState, onFilterChange]);

  // Handle act toggle
  const handleActToggle = useCallback((act: string) => {
    const newActs = new Set(filterState.selectedActs);
    if (newActs.has(act)) {
      newActs.delete(act);
    } else {
      newActs.add(act);
    }
    onFilterChange({
      ...filterState,
      selectedActs: newActs,
    });
  }, [filterState, onFilterChange]);

  // Handle puzzle selection
  const handlePuzzleSelect = useCallback((puzzleId: string | null) => {
    onFilterChange({
      ...filterState,
      selectedPuzzleId: puzzleId,
    });
  }, [filterState, onFilterChange]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    onFilterChange({
      ...filterState,
      searchTerm: '',
    });
  }, [filterState, onFilterChange]);

  /**
   * Toggles the collapsed/expanded state of the filter panel with smooth animations
   * 
   * @description
   * Manages the transition between collapsed and expanded states using CSS animations.
   * When expanding, applies 'animate-expand' class briefly before removing it.
   * When collapsing, applies 'animate-collapse' class and waits for animation to complete.
   * 
   * @complexity O(1) - Simple state toggle with timers
   * @flow
   * 1. Check current collapsed state
   * 2. Apply appropriate animation class
   * 3. Update state after animation timing
   * 
   * @sideEffects
   * - Updates isCollapsed state
   * - Temporarily applies CSS animation classes
   * - Uses setTimeout for animation coordination
   */
  const toggleCollapsed = useCallback(() => {
    if (isCollapsed) {
      // Expanding: Immediate state change
      setIsCollapsed(false);
      setAnimationClass('animate-expand');
      // Clear animation class after animation completes
      const timer = setTimeout(() => {
        setAnimationClass('');
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Collapsing: Apply animation first
      setAnimationClass('animate-collapse');
      // Use transitionend would be ideal, but for React compatibility we use a timer
      const timer = setTimeout(() => {
        setIsCollapsed(true);
        setAnimationClass('');
      }, 300); // Match CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [isCollapsed]);

  // Check if any filters are active
  const hasActiveFilters = 
    filterState.searchTerm || 
    filterState.selectedActs.size > 0 || 
    filterState.selectedPuzzleId;

  // Count active filters
  const activeFilterCount = 
    (filterState.searchTerm ? 1 : 0) +
    filterState.selectedActs.size +
    (filterState.selectedPuzzleId ? 1 : 0);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "absolute top-4 left-4 z-10",
        "bg-background/80 dark:bg-background/90 backdrop-blur-md",
        "rounded-xl border border-border/40 dark:border-border/30",
        "shadow-[0_0.5rem_2rem_rgba(0,0,0,0.12)] dark:shadow-[0_0.5rem_2rem_rgba(0,0,0,0.3)]",
        "transition-all duration-300 ease-in-out",
        "hover:shadow-[0_0.75rem_2.5rem_rgba(0,0,0,0.15)] dark:hover:shadow-[0_0.75rem_2.5rem_rgba(0,0,0,0.35)]",
        isCollapsed ? "w-auto" : "min-w-[22rem] max-w-[28rem]",
        animationClass,
        className
      )}
      style={{
        transformOrigin: 'top left',
      }}
    >
      {isCollapsed ? (
        // Collapsed state - just show button with filter count
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="flex items-center gap-2 p-3 h-auto rounded-xl"
          aria-label="Expand filters panel"
        >
          <Filter className="h-5 w-5 text-primary/80" />
          {activeFilterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="text-xs font-normal bg-primary/15 text-primary"
            >
              {activeFilterCount}
            </Badge>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
        </Button>
      ) : (
        // Expanded state - full filter panel
        <div className="flex flex-col gap-4 p-5">
          {/* Title and collapse button */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground/90 dark:text-foreground/80 flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary/70" />
              Filters
            </h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Badge 
                  variant="secondary" 
                  className="text-xs font-normal bg-secondary/50 hover:bg-secondary/70 transition-colors"
                >
                  {activeFilterCount} active
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapsed}
                className="h-6 w-6 p-0 rounded-full hover:bg-muted/80"
                aria-label="Collapse filters panel"
              >
                <MinusCircle className="h-4 w-4 text-muted-foreground/70" />
              </Button>
            </div>
          </div>
      
      {/* Search Box */}
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <Search className={cn(
            "w-4 h-4",
            "text-muted-foreground/60 group-hover:text-muted-foreground/80",
            "transition-colors duration-200",
            isSearchFocused && "text-primary"
          )} />
        </div>
        <Input
          type="text"
          placeholder="Search nodes..."
          value={filterState.searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className={cn(
            "w-full h-10 pl-10 pr-9",
            "transition-all duration-200",
            "bg-background dark:bg-background/60",
            "border-border/50 dark:border-border/40",
            "placeholder:text-muted-foreground/50",
            "focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/70",
            isSearchFocused ? "shadow-sm" : "hover:border-border dark:hover:border-border/60"
          )}
        />
        {filterState.searchTerm && (
          <button
            onClick={handleClearSearch}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 p-1",
              "rounded-full hover:bg-muted/80",
              "text-muted-foreground/70 hover:text-muted-foreground",
              "transition-all duration-200 ease-in-out"
            )}
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex gap-3 items-stretch">
        {/* Act Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "flex items-center gap-1.5 h-10 px-3",
                "border-border/50 dark:border-border/40",
                "bg-background dark:bg-background/60",
                "hover:bg-accent/50 hover:text-accent-foreground",
                "transition-all duration-200",
                filterState.selectedActs.size > 0 && "border-primary/30 bg-primary/5 text-primary/90"
              )}
            >
              <Filter className="w-3.5 h-3.5 opacity-70" />
              <span>Acts</span>
              {filterState.selectedActs.size > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-0.5 px-1.5 h-5 font-normal text-xs",
                    "bg-primary/15 text-primary hover:bg-primary/20",
                    "transition-colors duration-200"
                  )}
                >
                  {filterState.selectedActs.size}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3 ml-auto opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-40 p-1 animate-in fade-in-0 zoom-in-95"
          >
            {['Act 0', 'Act 1', 'Act 2'].map((act) => (
              <DropdownMenuItem
                key={act}
                onClick={() => handleActToggle(act)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 cursor-pointer",
                  "hover:bg-accent/50 hover:text-accent-foreground",
                  "transition-colors duration-150",
                  filterState.selectedActs.has(act) && "bg-primary/10 text-primary"
                )}
              >
                <span className="text-sm">{act}</span>
                {filterState.selectedActs.has(act) && (
                  <div className="w-5 h-5 flex items-center justify-center text-primary">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={() => onFilterChange({ ...filterState, selectedActs: new Set() })}
              className="text-muted-foreground px-3 py-1.5 cursor-pointer"
            >
              Clear Acts
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Puzzle Selector */}
        <Select
          value={filterState.selectedPuzzleId || 'all'}
          onValueChange={(value) => handlePuzzleSelect(value === 'all' ? null : value)}
        >
          <SelectTrigger 
            className={cn(
              "flex-1 min-w-[11rem] h-10",
              "border-border/50 dark:border-border/40",
              "bg-background dark:bg-background/60",
              "hover:bg-accent/50 hover:text-accent-foreground",
              "transition-all duration-200",
              filterState.selectedPuzzleId && "border-primary/30 bg-primary/5 text-primary/90"
            )}
          >
            <SelectValue placeholder="All Puzzles" />
          </SelectTrigger>
          <SelectContent 
            className="max-h-[20rem] animate-in fade-in-0 zoom-in-95"
            position="popper"
            sideOffset={4}
          >
            <SelectItem value="all" className="py-2">All Puzzles</SelectItem>
            {puzzles.map((puzzle) => (
              <SelectItem key={puzzle.id} value={puzzle.id} className="py-2">
                {puzzle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className={cn(
              "h-10 px-3 text-muted-foreground hover:text-foreground",
              "hover:bg-accent/50 transition-colors duration-200"
            )}
          >
            <span className="text-sm">Clear</span>
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1.5 px-1.5 h-5 text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border/20 animate-in fade-in-0 duration-300">
          {filterState.searchTerm && (
            <Badge 
              variant="secondary" 
              className={cn(
                "gap-1.5 px-2.5 py-1 h-7",
                "bg-secondary/50 hover:bg-secondary/70",
                "transition-colors duration-200"
              )}
            >
              <Search className="h-3 w-3 text-secondary-foreground/70" />
              {filterState.searchTerm}
              <button
                onClick={handleClearSearch}
                className={cn(
                  "ml-1 p-0.5 rounded-full",
                  "hover:bg-secondary-foreground/10",
                  "transition-colors duration-150"
                )}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {Array.from(filterState.selectedActs).map((act) => (
            <Badge 
              key={act} 
              variant="secondary" 
              className={cn(
                "gap-1.5 px-2.5 py-1 h-7",
                "bg-primary/10 text-primary hover:bg-primary/15",
                "transition-colors duration-200"
              )}
            >
              {act}
              <button
                onClick={() => handleActToggle(act)}
                className={cn(
                  "ml-1 p-0.5 rounded-full",
                  "hover:bg-primary/20",
                  "transition-colors duration-150"
                )}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filterState.selectedPuzzleId && (
            <Badge 
              variant="secondary" 
              className={cn(
                "gap-1.5 px-2.5 py-1 h-7",
                "bg-primary/10 text-primary hover:bg-primary/15",
                "transition-colors duration-200"
              )}
            >
              {puzzles.find(p => p.id === filterState.selectedPuzzleId)?.name || 'Selected Puzzle'}
              <button
                onClick={() => handlePuzzleSelect(null)}
                className={cn(
                  "ml-1 p-0.5 rounded-full",
                  "hover:bg-primary/20",
                  "transition-colors duration-150"
                )}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
}