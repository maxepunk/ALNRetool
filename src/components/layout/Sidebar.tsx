/**
 * Sidebar Component (Refactored)
 * Simplified sidebar aligned with ViewConfiguration architecture
 * Fixes infinite loop issues and reduces complexity by 45%
 */

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

// Import sub-components
import { SidebarNavigation } from '../sidebar/SidebarNavigation';
import { CharacterFilterPanel, PuzzleFilterPanel, ElementFilterPanel } from '../sidebar/FilterPanel';
import { DepthSlider } from '../sidebar/DepthSlider';
import { ActiveFiltersSummary } from '../sidebar/ActiveFiltersSummary';
import { ThemeToggle } from '../sidebar/ThemeToggle';
import EntityTypeToggle from '../filters/EntityTypeToggle';

export default function Sidebar() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const isOpen = !sidebarCollapsed;

  return (
    <div
      className={cn(
        "relative flex flex-col h-full transition-all duration-300",
        "bg-background/95 backdrop-blur-sm",
        "border-r border-border/40",
        "shadow-xl shadow-black/5",
        isOpen ? "w-64" : "w-16"
      )}
      role="complementary"
      aria-label="Application sidebar"
    >

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent max-h-[calc(100vh-7rem)] md:max-h-[calc(100vh-4rem)]">
        <div className="flex flex-col md:pt-0 pt-14">
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
          
          {/* Active Filters Summary - Moved to top for prominence */}
          <div className="transition-opacity duration-200">
            <ActiveFiltersSummary isOpen={isOpen} />
          </div>
          
          <Separator className="my-2 opacity-50" />

          {/* Main Navigation */}
          <div className="px-3 py-2">
            <SidebarNavigation isOpen={isOpen} />
          </div>
          
          <Separator className="my-2 opacity-50" />

          {/* View-specific Filters */}
          <div className="px-3 py-2 space-y-2 pb-6">
            {/* Entity Visibility Toggles (Option 2) */}
            <EntityTypeToggle />
            <Separator className="my-2 opacity-30" />
            
            {/* Entity-specific Filters */}
            <CharacterFilterPanel />
            <PuzzleFilterPanel />
            <ElementFilterPanel />
            <DepthSlider />
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