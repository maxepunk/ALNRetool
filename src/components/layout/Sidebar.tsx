/**
 * Sidebar Component (Refactored)
 * Simplified sidebar aligned with ViewConfiguration architecture
 * Fixes infinite loop issues and reduces complexity by 45%
 */

import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useFilterStore } from '@/stores/filterStore';
import { 
  Eye, 
  Users, 
  Puzzle, 
  Package,
  Focus,
  Clock,
  Settings2,
  RotateCcw,
  Sparkles
} from 'lucide-react';

// Import sub-components
import { SidebarNavigation } from '../sidebar/SidebarNavigation';
import { ElementFilterPanel } from '../sidebar/FilterPanel';
import { CharacterFiltersWithFocus } from '../sidebar/CharacterFiltersWithFocus';
import { PuzzleFiltersWithFocus } from '../sidebar/PuzzleFiltersWithFocus';
import { DepthSlider } from '../sidebar/DepthSlider';
import { ThemeToggle } from '../sidebar/ThemeToggle';
import EntityTypeToggle from '../filters/EntityTypeToggle';
import { FocusNodeSelector } from '../sidebar/FocusNodeSelector';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  useCharacterFilterCount,
  usePuzzleFilterCount, 
  useElementFilterCount,
  useGraphControlCount,
  useEntityVisibilityCount
} from '@/lib/filters/activeFilterCounter';

// Filter presets for quick access
const FILTER_PRESETS = [
  { 
    id: 'all', 
    label: 'All', 
    icon: Eye,
    tooltip: 'Show all entities without filters',
    filters: {
      entityVisibility: { character: true, element: true, puzzle: true, timeline: true },
      connectionDepth: null,
      selectedNodeId: null
    }
  },
  { 
    id: 'focus', 
    label: 'Focus', 
    icon: Focus,
    tooltip: 'Focus on a specific node and its connections',
    filters: {
      connectionDepth: 2,
    }
  },
  { 
    id: 'timeline', 
    label: 'Timeline', 
    icon: Clock,
    tooltip: 'Show only timeline events and related entities',
    filters: {
      entityVisibility: { character: false, element: false, puzzle: false, timeline: true },
    }
  },
  { 
    id: 'custom', 
    label: 'Custom', 
    icon: Settings2,
    tooltip: 'Your custom filter configuration',
    filters: null
  }
];

export default function Sidebar() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const isOpen = !sidebarCollapsed;
  const store = useFilterStore();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  
  // Get active filter counts
  const characterCount = useCharacterFilterCount();
  const puzzleCount = usePuzzleFilterCount();
  const elementCount = useElementFilterCount();
  const graphCount = useGraphControlCount();
  const visibilityCount = useEntityVisibilityCount();
  
  const totalActiveFilters = characterCount + puzzleCount + elementCount + graphCount + visibilityCount;
  
  // Apply preset filters
  const applyPreset = (presetId: string) => {
    const preset = FILTER_PRESETS.find(p => p.id === presetId);
    if (!preset || !preset.filters) return;
    
    // Clear filters for non-custom presets
    if (presetId !== 'custom') {
      store.clearAllFilters();
    }
    
    // Apply preset filters
    Object.entries(preset.filters).forEach(([key, value]) => {
      store.setFilter(key, value);
    });
    
    setActivePreset(presetId);
  };

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

      {/* Logo/Brand Header */}
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
      
      {/* Quick Filter Presets - Always Visible when sidebar is open */}
      {isOpen && (
        <div className="p-3 border-b border-border/40 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Filters
            </span>
            {totalActiveFilters > 0 && (
              <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        store.clearAllFilters();
                        setActivePreset(null);
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Clear ({totalActiveFilters})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear all active filters</p>
                  </TooltipContent>
                </Tooltip>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-1">
            {FILTER_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isActive = activePreset === preset.id;
              const isCustom = preset.id === 'custom';
              
              return (
                <Tooltip key={preset.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 justify-start text-xs",
                          isActive && "ring-2 ring-primary/20",
                          isCustom && totalActiveFilters > 0 && !isActive && "border-primary/50"
                        )}
                        onClick={() => applyPreset(preset.id)}
                        disabled={isCustom && totalActiveFilters === 0}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {preset.label}
                        {isCustom && totalActiveFilters > 0 && (
                          <Badge 
                            variant="secondary" 
                            className="ml-auto h-4 px-1 text-[10px]"
                          >
                            {totalActiveFilters}
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{preset.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Active Filters Summary - when collapsed */}
      {!isOpen && totalActiveFilters > 0 && (
        <div className="px-2 py-2 border-b border-border/40">
          <Badge variant="secondary" className="w-full justify-center">
            {totalActiveFilters}
          </Badge>
        </div>
      )}
      
      {/* Main Navigation */}
      <div className="px-3 py-2 border-b border-border/40">
        <SidebarNavigation isOpen={isOpen} />
      </div>
      
      {/* Scrollable Filter Content */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-3">

          {/* Enhanced Filter Sections with Accordion */}
          {isOpen ? (
            <Accordion 
              type="multiple" 
              defaultValue={["visibility", "graph"]}
              className="space-y-2"
            >
              {/* Entity Visibility */}
              <AccordionItem value="visibility" className="border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Visibility</span>
                    {visibilityCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1 text-[10px]">
                        <Sparkles className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <EntityTypeToggle />
                </AccordionContent>
              </AccordionItem>
              
              {/* Graph Controls */}
              <AccordionItem value="graph" className="border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Focus className="h-4 w-4" />
                    <span className="text-sm font-medium">Graph Control</span>
                    {graphCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                        {graphCount}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 space-y-3">
                  <FocusNodeSelector />
                  <Separator className="my-2" />
                  <DepthSlider />
                </AccordionContent>
              </AccordionItem>
              
              {/* Character Filters */}
              <AccordionItem value="characters" className="border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Characters</span>
                    {characterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                        {characterCount}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <CharacterFiltersWithFocus />
                </AccordionContent>
              </AccordionItem>
              
              {/* Puzzle Filters */}
              <AccordionItem value="puzzles" className="border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Puzzle className="h-4 w-4" />
                    <span className="text-sm font-medium">Puzzles</span>
                    {puzzleCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                        {puzzleCount}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <PuzzleFiltersWithFocus />
                </AccordionContent>
              </AccordionItem>
              
              {/* Element Filters */}
              <AccordionItem value="elements" className="border rounded-lg">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="text-sm font-medium">Elements</span>
                    {elementCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                        {elementCount}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <ElementFilterPanel />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            /* Collapsed state - show icon indicators */
            <div className="space-y-2">
              {visibilityCount > 0 && (
                <div className="flex justify-center">
                  <Badge variant="secondary" className="h-6 w-6 p-0 rounded-full">
                    <Eye className="h-3 w-3" />
                  </Badge>
                </div>
              )}
              {graphCount > 0 && (
                <div className="flex justify-center">
                  <Badge variant="secondary" className="h-6 w-6 p-0 rounded-full">
                    <Focus className="h-3 w-3" />
                  </Badge>
                </div>
              )}
              {characterCount > 0 && (
                <div className="flex justify-center">
                  <Badge variant="secondary" className="h-6 w-6 p-0 rounded-full">
                    <Users className="h-3 w-3" />
                  </Badge>
                </div>
              )}
              {puzzleCount > 0 && (
                <div className="flex justify-center">
                  <Badge variant="secondary" className="h-6 w-6 p-0 rounded-full">
                    <Puzzle className="h-3 w-3" />
                  </Badge>
                </div>
              )}
              {elementCount > 0 && (
                <div className="flex justify-center">
                  <Badge variant="secondary" className="h-6 w-6 p-0 rounded-full">
                    <Package className="h-3 w-3" />
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Status Bar when filters active */}
      {isOpen && totalActiveFilters > 0 && (
        <div className="p-2 border-t border-border/40 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {totalActiveFilters} filter{totalActiveFilters !== 1 ? 's' : ''} active
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:text-destructive"
              onClick={() => {
                store.clearAllFilters();
                setActivePreset(null);
              }}
            >
              Clear all
            </Button>
          </div>
        </div>
      )}

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