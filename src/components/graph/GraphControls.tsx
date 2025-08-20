import { ZoomIn, ZoomOut, Maximize, RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useGraphStore } from '@/stores/graphStore';
import type { LayoutAlgorithm } from '@/stores/graphStore';

interface GraphControlsProps {
  className?: string;
}

/**
 * GraphControls - Simplified graph manipulation controls
 * 
 * Now focuses only on zoom and layout controls.
 * Filter functionality has been moved to the Sidebar component.
 */
export default function GraphControls({
  className,
}: GraphControlsProps) {
  // Get graph store actions
  const zoomIn = useGraphStore(state => state.zoomIn);
  const zoomOut = useGraphStore(state => state.zoomOut);
  const resetZoom = useGraphStore(state => state.resetZoom);
  const fitView = useGraphStore(state => state.fitView);
  const layoutAlgorithm = useGraphStore(state => state.layoutAlgorithm);
  const setLayoutAlgorithm = useGraphStore(state => state.setLayoutAlgorithm);
  const triggerRelayout = useGraphStore(state => state.triggerRelayout);

  const handleLayoutChange = (algorithm: LayoutAlgorithm) => {
    setLayoutAlgorithm(algorithm);
    triggerRelayout();
  };

  return (
    <div 
      className={cn(
        "absolute top-4 right-4 z-10",
        "flex flex-col gap-2",
        className
      )}
    >
      {/* Zoom Controls */}
      <div className="flex flex-col gap-1 bg-background/80 backdrop-blur-md rounded-lg border border-border/40 p-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomIn}
          className="h-8 w-8"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomOut}
          className="h-8 w-8"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={fitView}
          className="h-8 w-8"
          title="Fit to View"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={resetZoom}
          className="h-8 w-8"
          title="Reset Zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Layout Controls */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-md border-border/40"
            title="Layout Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Layout Algorithm</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleLayoutChange('dagre')}
            className={cn(layoutAlgorithm === 'dagre' && "bg-accent")}
          >
            Hierarchical (Dagre)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleLayoutChange('force')}
            className={cn(layoutAlgorithm === 'force' && "bg-accent")}
          >
            Force-Directed
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleLayoutChange('circular')}
            className={cn(layoutAlgorithm === 'circular' && "bg-accent")}
          >
            Circular
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleLayoutChange('hierarchical')}
            className={cn(layoutAlgorithm === 'hierarchical' && "bg-accent")}
          >
            Tree
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={triggerRelayout}>
            <RotateCcw className="h-3 w-3 mr-2" />
            Re-layout Graph
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}