/**
 * NavigationBreadcrumbs Component
 * 
 * Displays the navigation history as a breadcrumb trail showing
 * the path of visited nodes in the graph.
 */

import React from 'react';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigationStore, useVisibleBreadcrumbs } from '@/stores/navigationStore';
import { useFilterStore } from '@/stores/filterStore';
import { Puzzle, Users, Package, Clock } from 'lucide-react';

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

export function NavigationBreadcrumbs() {
  const visibleNodes = useVisibleBreadcrumbs();
  const history = useNavigationStore(state => state.history);
  const currentIndex = useNavigationStore(state => state.currentIndex);
  const navigateToIndex = useNavigationStore(state => state.navigateToIndex);
  const setSelectedNode = useFilterStore(state => state.setSelectedNode);
  
  // Don't show if no navigation history
  if (visibleNodes.length === 0) {
    return null;
  }
  
  // Calculate if we need ellipsis (more items before visible ones)
  const hasHiddenItems = currentIndex >= 5 && history.length > 5;
  const hiddenItems = hasHiddenItems ? history.slice(0, currentIndex - 4) : [];
  
  const handleNavigate = (index: number) => {
    const nodeId = navigateToIndex(index);
    if (nodeId) {
      setSelectedNode(nodeId);
    }
  };
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Show ellipsis dropdown if there are hidden items */}
        {hasHiddenItems && (
          <>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                  <span className="sr-only">Show more</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {hiddenItems.map((item, idx) => (
                    <DropdownMenuItem
                      key={item.timestamp}
                      onClick={() => handleNavigate(idx)}
                      className="flex items-center gap-2"
                    >
                      {getNodeIcon(item.nodeType)}
                      <span>{item.nodeName}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        
        {/* Visible breadcrumb items */}
        {visibleNodes.map((item, idx) => {
          const actualIndex = currentIndex - visibleNodes.length + idx + 1;
          const isLast = actualIndex === currentIndex;
          
          return (
            <React.Fragment key={item.timestamp}>
              {idx > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1">
                    {getNodeIcon(item.nodeType)}
                    <span>{item.nodeName}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleNavigate(actualIndex)}
                  >
                    {getNodeIcon(item.nodeType)}
                    <span>{item.nodeName}</span>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}