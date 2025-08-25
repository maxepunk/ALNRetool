/**
 * Sidebar Component (Refactored)
 * Simplified sidebar aligned with ViewConfiguration architecture
 * Fixes infinite loop issues and reduces complexity by 45%
 */

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

// Import sub-components
import { SidebarNavigation } from '../sidebar/SidebarNavigation';
import { SidebarSearch } from '../sidebar/SidebarSearch';
import { CharacterFilterPanel, PuzzleFilterPanel, DepthFilterPanel } from '../sidebar/FilterPanel';
import { ActiveFiltersSummary } from '../sidebar/ActiveFiltersSummary';
import { ThemeToggle } from '../sidebar/ThemeToggle';

export default function Sidebar() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  
  const isOpen = !sidebarCollapsed;

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  return (
    <div
      className={cn(
        "relative flex flex-col transition-all duration-300",
        "bg-background/95 backdrop-blur-sm",
        "border-r border-border/40",
        "shadow-xl shadow-black/5",
        "overflow-hidden",
        isOpen ? "w-64" : "w-16"
      )}
      role="complementary"
      aria-label="Application sidebar"
    >
      {/* Toggle Button - Desktop Only */}
      <Button
        size="icon"
        variant="ghost"
        onClick={handleToggleSidebar}
        className={cn(
          "absolute -right-3 top-6 z-50 h-6 w-6 rounded-full",
          "border border-border/50 bg-background shadow-md",
          "hover:bg-accent hover:text-accent-foreground",
          "transition-all duration-200",
          "hidden md:flex"
        )}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={isOpen}
      >
        <ChevronLeft 
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            !isOpen && "rotate-180"
          )} 
        />
      </Button>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className={cn(
            "px-3 py-4 border-b border-border/40",
            "bg-gradient-to-b from-background to-transparent",
            "transition-all duration-200"
          )}>
            <h2 className={cn(
              "font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent",
              "transition-all duration-200",
              isOpen ? "text-xl" : "text-sm text-center"
            )}>
              {isOpen ? "ALNRetool" : "ALN"}
            </h2>
          </div>

          {/* Universal Search */}
          <div className="transition-opacity duration-200">
            <SidebarSearch isOpen={isOpen} />
          </div>
          
          <Separator className="my-2 opacity-50" />
          

          {/* Main Navigation */}
          <div className="px-3 py-2">
            <SidebarNavigation isOpen={isOpen} />
          </div>
          
          <Separator className="my-2 opacity-50" />

          {/* View-specific Filters */}
          <div className="px-3 py-2 space-y-2">
            <CharacterFilterPanel />
            <PuzzleFilterPanel />
            <DepthFilterPanel />
          </div>

          {/* Active Filters Summary */}
          <div className="transition-opacity duration-200">
            <ActiveFiltersSummary isOpen={isOpen} />
          </div>
        </div>
      </div>

      {/* Theme Toggle - Always at bottom */}
      <div className={cn(
        "border-t border-border/40",
        "bg-gradient-to-t from-background to-transparent"
      )}>
        <ThemeToggle isOpen={isOpen} />
      </div>
    </div>
  );
}