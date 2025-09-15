/**
 * UnifiedToolbar Component
 * 
 * Combines filter status, navigation breadcrumbs, and controls into a single
 * cohesive toolbar with improved visual hierarchy and readability.
 */

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Info,
  Filter,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useNavigationStore, useCanGoBack, useCanGoForward, useVisibleBreadcrumbs } from '@/stores/navigationStore';
import { useFilterStore } from '@/stores/filterStore';
import { Puzzle, Users, Package, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';

interface UnifiedToolbarProps {
  totalNodes: number;
  visibleNodes: number;
  connectionDepth: number;
  selectedNode?: { id: string; name: string } | null;
  hasActiveFilters: boolean;
}

/**
 * Get icon for node type
 */
function getNodeIcon(type: string) {
  switch (type) {
    case 'puzzle':
      return <Puzzle className="h-3 w-3" />;
    case 'character':
      return <Users className="h-3 w-3" />;
    case 'element':
      return <Package className="h-3 w-3" />;
    case 'timeline':
      return <Clock className="h-3 w-3" />;
    default:
      return null;
  }
}

export const UnifiedToolbar = memo(function UnifiedToolbar({
  totalNodes,
  visibleNodes,
  connectionDepth,
  selectedNode,
  hasActiveFilters
}: UnifiedToolbarProps) {
  // Check if mobile for touch-friendly sizing
  const isMobile = useIsMobile();
  
  // Filter-related hooks
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);
  const searchTerm = useFilterStore((state) => state.searchTerm);
  const setSelectedNode = useFilterStore(state => state.setSelectedNode);
  
  // Navigation-related hooks
  const goBack = useNavigationStore(state => state.goBack);
  const goForward = useNavigationStore(state => state.goForward);
  const canGoBack = useCanGoBack();
  const canGoForward = useCanGoForward();
  const navigateToIndex = useNavigationStore(state => state.navigateToIndex);
  const visibleBreadcrumbs = useVisibleBreadcrumbs();
  const currentIndex = useNavigationStore(state => state.currentIndex);
  
  const handleBack = () => {
    const nodeId = goBack();
    if (nodeId) {
      setSelectedNode(nodeId);
    }
  };
  
  const handleForward = () => {
    const nodeId = goForward();
    if (nodeId) {
      setSelectedNode(nodeId);
    }
  };
  
  const handleBreadcrumbClick = (index: number) => {
    const nodeId = navigateToIndex(index);
    if (nodeId) {
      setSelectedNode(nodeId);
    }
  };
  
  // Check if we should show the toolbar
  const showFilterInfo = hasActiveFilters || totalNodes !== visibleNodes || selectedNode || searchTerm;
  const showBreadcrumbs = visibleBreadcrumbs.length > 0;
  
  // Always show toolbar if there's any content to display
  if (!showFilterInfo && !showBreadcrumbs) {
    return null;
  }
  
  const getFilterDescription = () => {
    if (selectedNode) {
      return `Showing ${connectionDepth} ${connectionDepth === 1 ? 'level' : 'levels'} from ${selectedNode.name}`;
    } else if (connectionDepth === 0) {
      return 'Showing only filtered nodes';
    } else {
      return `Showing filtered nodes + ${connectionDepth} ${connectionDepth === 1 ? 'level' : 'levels'}`;
    }
  };
  
  const hiddenCount = totalNodes - visibleNodes;
  const isFiltered = hiddenCount > 0;
  
  return (
    <Card className="absolute top-4 left-4 right-4 z-20 shadow-lg border bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
      <div className="px-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 md:gap-4 items-center">
          {/* Left Section: Filter Status */}
          <div className="flex items-center gap-3 min-w-0">
            {showFilterInfo && (
              <>
                {/* Node Count with improved colors */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-1.5 text-sm font-medium",
                    isFiltered ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                  )}>
                    {isFiltered ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <Info className="h-3.5 w-3.5" />
                    )}
                    <span className="tabular-nums">
                      {visibleNodes}/{totalNodes}
                    </span>
                  </div>
                  
                  {isFiltered && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    >
                      <EyeOff className="h-3 w-3 mr-1" />
                      {hiddenCount} hidden
                    </Badge>
                  )}
                </div>
                
                {/* Filter Description */}
                {(hasActiveFilters || selectedNode) && (
                  <>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Filter className="h-3.5 w-3.5" />
                      <span className="truncate">{getFilterDescription()}</span>
                    </div>
                  </>
                )}
                
                {/* Search indicator */}
                {searchTerm && (
                  <>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-1.5 text-sm text-purple-700 dark:text-purple-400">
                      <Search className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[150px]">&ldquo;{searchTerm}&rdquo;</span>
                    </div>
                  </>
                )}
                
                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size={isMobile ? "touch" : "sm"}
                    onClick={clearAllFilters}
                    className={cn(
                      isMobile ? "px-3" : "h-7 px-2",
                      "text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                    )}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                )}
              </>
            )}
          </div>
          
          {/* Center Section: Breadcrumbs */}
          {showBreadcrumbs && (
            <div className="flex items-center justify-center min-w-0">
              <Breadcrumb>
                <BreadcrumbList className="flex-nowrap">
                  {visibleBreadcrumbs.map((node, index) => {
                    // The last item in visibleBreadcrumbs is always the current/active one
                    const isActive = index === visibleBreadcrumbs.length - 1;
                    // Calculate the actual index in the full history array
                    // visibleBreadcrumbs shows the last N items ending at currentIndex
                    const actualHistoryIndex = currentIndex - (visibleBreadcrumbs.length - 1) + index;
                    
                    return (
                      <React.Fragment key={`${node.nodeId}-${index}`}>
                        <BreadcrumbItem>
                          {isActive ? (
                            <BreadcrumbPage className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-medium">
                              {getNodeIcon(node.nodeType)}
                              <span className="max-w-[120px] truncate">{node.nodeName}</span>
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleBreadcrumbClick(actualHistoryIndex);
                              }}
                              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                            >
                              {getNodeIcon(node.nodeType)}
                              <span className="max-w-[120px] truncate">{node.nodeName}</span>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {index < visibleBreadcrumbs.length - 1 && (
                          <BreadcrumbSeparator />
                        )}
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}
          
          {/* Right Section: Navigation Controls */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isMobile ? "touch-icon" : "sm"}
                  onClick={handleBack}
                  disabled={!canGoBack}
                  className={cn(
                    isMobile ? "p-0" : "h-8 w-8 p-0",
                    canGoBack 
                      ? "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100" 
                      : "text-slate-400 dark:text-slate-600"
                  )}
                  aria-label="Go back"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go Back</p>
                <p className="text-xs text-muted-foreground">Press [</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isMobile ? "touch-icon" : "sm"}
                  onClick={handleForward}
                  disabled={!canGoForward}
                  className={cn(
                    isMobile ? "p-0" : "h-8 w-8 p-0",
                    canGoForward 
                      ? "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100" 
                      : "text-slate-400 dark:text-slate-600"
                  )}
                  aria-label="Go forward"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go Forward</p>
                <p className="text-xs text-muted-foreground">Press ]</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </Card>
  );
});