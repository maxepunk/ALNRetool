/**
 * HeaderSearch Component
 * 
 * Advanced search functionality with autocomplete dropdown for the header.
 * Provides real-time suggestions and allows precise node focusing in the graph.
 * Adapted from EnhancedSearch to work in the header context.
 * 
 * Features:
 * - Real-time search suggestions as user types
 * - Dropdown with filtered node results
 * - Single node selection for precise viewport focusing
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Entity type badges for visual differentiation
 */

import { memo, useCallback, useState, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFilterStore } from '@/stores/filterStore';
import { useAllEntityData } from '@/hooks/generic/useEntityData';
import { charactersApi, elementsApi, puzzlesApi, timelineApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useDebounce } from '@/hooks/useDebounce';
import Fuse from 'fuse.js';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface HeaderSearchProps {
  isMobile?: boolean;
  className?: string;
}

interface SearchSuggestion {
  id: string;
  label: string;
  type: 'character' | 'puzzle' | 'element' | 'timeline';
}

/**
 * Get badge variant color based on entity type
 */
const getTypeBadgeVariant = (type: string) => {
  switch (type) {
    case 'character':
      return 'default' as const;
    case 'puzzle':
      return 'secondary' as const;
    case 'element':
      return 'outline' as const;
    case 'timeline':
      return 'destructive' as const;
    default:
      return 'default' as const;
  }
};

export const HeaderSearch = memo(function HeaderSearch({ isMobile = false, className }: HeaderSearchProps) {
  const searchTerm = useFilterStore((state) => state.searchTerm);
  const setSearchTerm = useFilterStore((state) => state.setSearchTerm);
  const clearSearch = useFilterStore((state) => state.clearSearch);
  const selectedNodeId = useFilterStore((state) => state.selectedNodeId);
  const setSelectedNode = useFilterStore((state) => state.setSelectedNode);
  
  // Debounce search term for suggestions to reduce recalculations
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Fetch entity data directly instead of using graphNodes from store
  const { data: characters = [] } = useAllEntityData(charactersApi, queryKeys.characters());
  const { data: puzzles = [] } = useAllEntityData(puzzlesApi, queryKeys.puzzles());
  const { data: elements = [] } = useAllEntityData(elementsApi, queryKeys.elements());
  const { data: timeline = [] } = useAllEntityData(timelineApi, queryKeys.timeline());
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  /**
   * Combine all entities for Fuse.js fuzzy search
   */
  const allEntitiesForSearch = useMemo(() => [
    ...characters.map(c => ({
      id: c.id,
      label: c.name,
      type: 'character' as const,
      entity: c
    })),
    ...puzzles.map(p => ({
      id: p.id,
      label: p.name,
      type: 'puzzle' as const,
      entity: p
    })),
    ...elements.map(e => ({
      id: e.id,
      label: e.name,
      type: 'element' as const,
      entity: e
    })),
    ...timeline.map(t => ({
      id: t.id,
      label: t.description || t.name,
      type: 'timeline' as const,
      entity: t
    })),
  ], [characters, puzzles, elements, timeline]);

  /**
   * Initialize Fuse instance for fuzzy search
   */
  const fuse = useMemo(() => new Fuse(allEntitiesForSearch, {
    keys: [
      { name: 'label', weight: 0.7 },
      { name: 'id', weight: 0.3 }
    ],
    threshold: 0.4,  // 0.0 = exact, 1.0 = match anything
    includeScore: true,
    shouldSort: true,
  }), [allEntitiesForSearch]);
  
  /**
   * Generate search suggestions using fuzzy search
   */
  const suggestions = useMemo((): SearchSuggestion[] => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];

    const results = fuse.search(debouncedSearchTerm);

    return results
      .slice(0, 20)  // Limit results
      .map(result => ({
        id: result.item.id,
        label: result.item.label,
        type: result.item.type
      }));
  }, [debouncedSearchTerm, fuse]);
  
  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedNode(null); // Clear selection when typing new search
    setHighlightedIndex(0);
    setIsDropdownOpen(value.length >= 2);
  }, [setSearchTerm, setSelectedNode]);
  
  /**
   * Handle suggestion selection
   */
  const handleSelectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setSelectedNode(suggestion.id);
    setSearchTerm(suggestion.label);
    setIsDropdownOpen(false);
    inputRef.current?.blur();
  }, [setSelectedNode, setSearchTerm]);
  
  /**
   * Handle clear search
   */
  const handleClearSearch = useCallback(() => {
    clearSearch();
    setSelectedNode(null);
    setIsDropdownOpen(false);
    setHighlightedIndex(0);
  }, [clearSearch, setSelectedNode]);
  
  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isDropdownOpen || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (suggestions[highlightedIndex]) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [isDropdownOpen, suggestions, highlightedIndex, handleSelectSuggestion]);
  
  
  // Mobile modal view (used within mobile search modal)
  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchTerm.length >= 2 && suggestions.length > 0) {
                setIsDropdownOpen(true);
              }
            }}
            className={cn(
              "pl-9 pr-9",
              selectedNodeId && "ring-2 ring-primary ring-offset-1"
            )}
            aria-label="Search nodes with autocomplete"
            aria-autocomplete="list"
            aria-expanded={isDropdownOpen}
            aria-controls="search-suggestions-mobile"
            autoFocus
          />
          {searchTerm && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {/* Suggestions dropdown for mobile */}
        {isDropdownOpen && suggestions.length > 0 && (
          <div 
            id="search-suggestions-mobile"
            className="max-h-[300px] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                  highlightedIndex === index && "bg-accent text-accent-foreground",
                  selectedNodeId === suggestion.id && "font-semibold"
                )}
                role="option"
                aria-selected={highlightedIndex === index}
              >
                <span className="truncate mr-2">{suggestion.label}</span>
                <Badge 
                  variant={getTypeBadgeVariant(suggestion.type)}
                  className="text-xs capitalize"
                >
                  {suggestion.type}
                </Badge>
              </button>
            ))}
          </div>
        )}
        
        {/* Status display */}
        {selectedNodeId && (
          <div className="text-xs text-muted-foreground">
            <span>Focused on: </span>
            <span className="font-medium">
              {selectedNodeId}
            </span>
          </div>
        )}
        {!selectedNodeId && searchTerm && (
          <div className="text-xs text-muted-foreground">
            {suggestions.length > 0 ? (
              <>Showing {suggestions.length} match{suggestions.length !== 1 ? 'es' : ''}</>
            ) : searchTerm.length >= 2 ? (
              'No matches found'
            ) : (
              'Type at least 2 characters'
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Desktop header view
  return (
    <div className={cn("relative", className)}>
      <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchTerm.length >= 2 && suggestions.length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              className={cn(
                "w-full h-9 pl-9 pr-9 text-sm",
                "bg-muted/30 backdrop-blur-sm",
                "border border-border/50",
                "placeholder-muted-foreground",
                "focus:bg-background focus:border-primary",
                "focus:ring-1 focus:ring-primary focus:ring-offset-0",
                "transition-all duration-200",
                selectedNodeId && "ring-1 ring-primary"
              )}
              aria-label="Search nodes with autocomplete"
              aria-autocomplete="list"
              aria-expanded={isDropdownOpen}
              aria-controls="search-suggestions"
            />
            {searchTerm && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          id="search-suggestions"
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          sideOffset={4}
        >
          {suggestions.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    highlightedIndex === index && "bg-accent text-accent-foreground",
                    selectedNodeId === suggestion.id && "font-semibold"
                  )}
                  role="option"
                  aria-selected={highlightedIndex === index}
                >
                  <span className="truncate mr-2">{suggestion.label}</span>
                  <Badge 
                    variant={getTypeBadgeVariant(suggestion.type)}
                    className="text-xs capitalize"
                  >
                    {suggestion.type}
                  </Badge>
                </button>
              ))}
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              No results found for &quot;{searchTerm}&quot;
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
});