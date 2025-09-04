import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Layers, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClusterStore } from '@/stores/clusterStore';
import { useUIStore } from '@/stores/uiStore';

export function ClusterControls() {
  const {
    clusteringEnabled,
    toggleClustering,
    expandAll,
    collapseAll,
    clusteringRules,
    setClusteringRule,
    clusters
  } = useClusterStore();

  const sidebarCollapsed = useUIStore(state => state.sidebarCollapsed);
  const isOpen = !sidebarCollapsed;

  // Collapsed sidebar view
  if (!isOpen) {
    return (
      <div className="px-3 py-2">
        <Button
          size="icon"
          variant={clusteringEnabled ? "default" : "ghost"}
          onClick={toggleClustering}
          title="Toggle clustering"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Full sidebar view
  return (
    <div className="space-y-2">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1">
          <Layers className="h-3 w-3" />
          Clustering
        </Label>
        <Switch
          checked={clusteringEnabled}
          onCheckedChange={toggleClustering}
          aria-label="Toggle clustering"
        />
      </div>

      {/* Controls - only shown when enabled */}
      {clusteringEnabled && (
        <div className={cn(
          "space-y-2 pl-4 transition-all duration-200",
          !clusteringEnabled && "opacity-50 pointer-events-none"
        )}>
          {/* Expand/Collapse buttons */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={expandAll}
              className="flex-1"
              disabled={clusters.size === 0}
            >
              <Maximize2 className="h-3 w-3 mr-1" />
              Expand
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={collapseAll}
              className="flex-1"
              disabled={clusters.size === 0}
            >
              <Minimize2 className="h-3 w-3 mr-1" />
              Collapse
            </Button>
          </div>

          {/* Clustering rules */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="puzzleChains"
                checked={clusteringRules.puzzleChains}
                onCheckedChange={(checked) =>
                  setClusteringRule('puzzleChains', !!checked)
                }
              />
              <Label
                htmlFor="puzzleChains"
                className="text-xs cursor-pointer"
              >
                Puzzle chains
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="characterGroups"
                checked={clusteringRules.characterGroups}
                onCheckedChange={(checked) =>
                  setClusteringRule('characterGroups', !!checked)
                }
              />
              <Label
                htmlFor="characterGroups"
                className="text-xs cursor-pointer"
              >
                Character items
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="timelineSequences"
                checked={clusteringRules.timelineSequences}
                onCheckedChange={(checked) =>
                  setClusteringRule('timelineSequences', !!checked)
                }
              />
              <Label
                htmlFor="timelineSequences"
                className="text-xs cursor-pointer"
              >
                Timeline groups
              </Label>
            </div>
          </div>

          {/* Cluster count */}
          {clusters.size > 0 && (
            <div className="text-xs text-muted-foreground">
              {clusters.size} cluster{clusters.size !== 1 ? 's' : ''} created
            </div>
          )}
        </div>
      )}
    </div>
  );
}
