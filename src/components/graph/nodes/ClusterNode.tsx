import { memo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useClusterStore } from '@/stores/clusterStore';

interface ClusterNodeProps {
  id: string;
  data: {
    label: string;
    clustering: {
      isCluster: boolean;
      clusterType: 'puzzle' | 'character' | 'timeline' | 'element';
      childIds: string[];
      childCount: number;
      childPreviews?: Array<{
        type: string;
        label: string;
      }>;
    };
    aggregatedEdges?: {
      count: number;
    };
  };
}

const ClusterNode = memo(({ id, data }: ClusterNodeProps) => {
  const expandedClusters = useClusterStore(state => state.expandedClusters);
  const toggleCluster = useClusterStore(state => state.toggleCluster);
  const isExpanded = expandedClusters.has(id);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCluster(id);
  }, [id, toggleCluster]);

  return (
    <div
      data-testid={`node-${id}`}
      className={cn(
        "cluster-node relative bg-white/90 backdrop-blur",
        "border-2 rounded-lg p-3 min-w-[200px] shadow-lg",
        "transition-all duration-200 hover:shadow-xl",
        // Type-specific styling
        data.clustering.clusterType === 'puzzle' && "border-purple-400 bg-purple-50/90",
        data.clustering.clusterType === 'character' && "border-blue-400 bg-blue-50/90",
        data.clustering.clusterType === 'timeline' && "border-green-400 bg-green-50/90",
        data.clustering.clusterType === 'element' && "border-amber-400 bg-amber-50/90",
        // State styling
        isExpanded ? "border-solid" : "border-dashed"
      )}
    >
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />

      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handleClick}
          className="flex items-center gap-1 hover:bg-black/5 rounded px-1 -ml-1 transition-colors"
          aria-label={isExpanded ? "Collapse cluster" : "Expand cluster"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="font-semibold text-sm">{data.label}</span>
        </button>

        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3 text-gray-500" />
          <Badge variant="secondary" className="text-xs">
            {data.clustering.childCount}
          </Badge>
        </div>
      </div>

      {/* Collapsed preview */}
      {!isExpanded && data.clustering.childPreviews && (
        <div className="flex gap-1 mt-2">
          {data.clustering.childPreviews.slice(0, 3).map((child, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-8 rounded border flex items-center justify-center text-xs",
                child.type === 'puzzle' && "bg-purple-200 border-purple-300",
                child.type === 'character' && "bg-blue-200 border-blue-300",
                child.type === 'element' && "bg-amber-200 border-amber-300",
                child.type === 'timeline' && "bg-green-200 border-green-300"
              )}
              title={child.label}
            >
              {child.label[0]}
            </div>
          ))}
          {data.clustering.childCount > 3 && (
            <div className="w-8 h-8 rounded border bg-gray-100 border-gray-300 flex items-center justify-center text-xs text-gray-600">
              +{data.clustering.childCount - 3}
            </div>
          )}
        </div>
      )}

      {/* Edge aggregation badge */}
      {data.aggregatedEdges && data.aggregatedEdges.count > 0 && (
        <div className="absolute -right-2 -top-2 bg-white rounded-full border shadow-sm">
          <Badge variant="outline" className="text-xs">
            {data.aggregatedEdges.count}
          </Badge>
        </div>
      )}
    </div>
  );
});

ClusterNode.displayName = 'ClusterNode';
export default ClusterNode;
