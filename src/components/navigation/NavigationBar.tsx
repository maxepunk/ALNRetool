/**
 * NavigationBar Component
 * 
 * Combines navigation controls and breadcrumbs into a single bar
 * positioned at the top center of the graph view.
 */

import { Card } from '@/components/ui/card';
import { NavigationControls } from './NavigationControls';
import { NavigationBreadcrumbs } from './NavigationBreadcrumbs';
import { useVisibleBreadcrumbs } from '@/stores/navigationStore';

export function NavigationBar() {
  const visibleNodes = useVisibleBreadcrumbs();
  
  // Always show the navigation bar - it will show a helpful message when empty
  return (
    <Card className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-2 shadow-lg border bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <NavigationControls />
        {visibleNodes.length > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            <NavigationBreadcrumbs />
          </>
        )}
        {visibleNodes.length === 0 && (
          <span className="text-sm text-muted-foreground">Click a node to start navigation history</span>
        )}
      </div>
    </Card>
  );
}