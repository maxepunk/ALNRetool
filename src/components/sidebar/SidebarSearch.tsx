/**
 * SidebarSearch Component
 * Universal search functionality for the sidebar
 */

import { memo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFilterStore } from '@/stores/filterStore';

interface SidebarSearchProps {
  isOpen: boolean;
}

export const SidebarSearch = memo(function SidebarSearch({ isOpen }: SidebarSearchProps) {
  const searchTerm = useFilterStore((state) => state.searchTerm);
  const setSearchTerm = useFilterStore((state) => state.setSearchTerm);
  const clearSearch = useFilterStore((state) => state.clearSearch);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  const handleClearSearch = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  if (!isOpen) {
    return (
      <div className="px-3 py-2">
        <Button
          size="icon"
          variant="ghost"
          className="w-full"
          title="Search"
          aria-label="Search (sidebar collapsed)"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search everything..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-9 pr-9"
          aria-label="Search all content"
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
      {searchTerm && (
        <div className="mt-2 text-xs text-muted-foreground">
          Searching for: <span className="font-medium">{searchTerm}</span>
        </div>
      )}
    </div>
  );
});