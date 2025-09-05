/**
 * HeaderSearch Component
 * 
 * Pure fuzzy-search filtering input for the header.
 * Provides real-time graph filtering as user types.
 * 
 * Features:
 * - Real-time fuzzy search filtering
 * - Clear button for resetting search
 * - Responsive design (desktop header / mobile modal)
 * - Proper accessibility attributes
 */

import { memo, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFilterStore } from '@/stores/filterStore';
import { cn } from '@/lib/utils';

interface HeaderSearchProps {
  isMobile?: boolean;
  className?: string;
}

export const HeaderSearch = memo(function HeaderSearch({ isMobile = false, className }: HeaderSearchProps) {
  const searchTerm = useFilterStore((state) => state.searchTerm);
  const setSearchTerm = useFilterStore((state) => state.setSearchTerm);
  const clearSearch = useFilterStore((state) => state.clearSearch);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);
  
  /**
   * Handle clear search
   */
  const handleClearSearch = useCallback(() => {
    clearSearch();
    inputRef.current?.focus();
  }, [clearSearch]);
  
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
            placeholder="Filter nodes..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={cn(
              "pl-9 pr-9"
            )}
            aria-label="Filter nodes by name"
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
        
        {/* Status display */}
        {searchTerm && (
          <div className="text-xs text-muted-foreground">
            Filtering nodes matching "{searchTerm}"
          </div>
        )}
      </div>
    );
  }
  
  // Desktop header view
  return (
    <div className={cn("relative", className)}>
      <Search 
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Filter nodes..."
        value={searchTerm}
        onChange={handleSearchChange}
        className={cn(
          "w-full h-9 pl-9 pr-9 text-sm",
          "bg-muted/30 backdrop-blur-sm",
          "border border-border/50",
          "placeholder-muted-foreground",
          "focus:bg-background focus:border-primary",
          "focus:ring-1 focus:ring-primary focus:ring-offset-0",
          "transition-all duration-200"
        )}
        aria-label="Filter nodes by name"
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
  );
});