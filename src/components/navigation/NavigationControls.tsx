/**
 * NavigationControls Component
 * 
 * Provides back and forward navigation buttons with keyboard shortcut hints.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavigationStore, useCanGoBack, useCanGoForward } from '@/stores/navigationStore';
import { useFilterStore } from '@/stores/filterStore';

export function NavigationControls() {
  const goBack = useNavigationStore(state => state.goBack);
  const goForward = useNavigationStore(state => state.goForward);
  const canGoBack = useCanGoBack();
  const canGoForward = useCanGoForward();
  const setSelectedNode = useFilterStore(state => state.setSelectedNode);
  
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
  
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={!canGoBack}
            className="h-7 w-7 p-0"
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
            size="sm"
            onClick={handleForward}
            disabled={!canGoForward}
            className="h-7 w-7 p-0"
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
  );
}