import { memo } from 'react';
import { Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData } from '@/lib/graph/types';
import type { TimelineEvent } from '@/types/notion/app';
import BaseNodeCard, { type NodeStatus } from './BaseNodeCard';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Users,
  Search
} from 'lucide-react';
import { useGraphData } from '@/contexts/GraphDataContext';
import { isNodeOptimistic } from '@/lib/graph/utils';
import { NodeTooltip, EntityListTooltip, TextTooltip } from './NodeTooltip';
import { NodePopover } from './NodePopover';
import { useNodeFilterStyles } from '@/hooks/useNodeFilterStyles';
import { cn } from '@/lib/utils';

/**
 * Custom React Flow node component for Timeline Event entities
 * Uses BaseNodeCard for consistent styling with timeline-specific features
 */
const TimelineNode = memo(({ data, selected, id, ...rest }: NodeProps & { 'data-testid'?: string }) => {
  const nodeData = data as GraphNodeData<TimelineEvent>;
  const { entity, metadata } = nodeData;
  const hasError = metadata.errorState !== undefined;
  const isOptimistic = isNodeOptimistic(metadata);
  
  // Get entity lookup functions for tooltips
  const { getEntityNames } = useGraphData();
  
  // Use enhanced hook for filter styles
  const { displayFlags, textSizes } = useNodeFilterStyles(metadata, selected);
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };
  
  // Determine importance based on characters involved
  const importance = entity.charactersInvolvedIds?.length ?? 0;
  const size = importance > 3 ? 'large' : importance > 1 ? 'medium' : 'small';
  
  // Build status array
  const statuses: NodeStatus[] = [];
  if (hasError) statuses.push('error');
  
  // Build badges with date
  const fullDate = entity.date ? new Date(entity.date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '';
  
  const badges = displayFlags.showBadges ? (
    <div className="flex gap-1">
      {entity.date && (
        <NodeTooltip
          enabled={displayFlags.enableTooltips}
          content={
            <div>
              <p className="font-semibold">Event Date</p>
              <p className="text-sm">{fullDate}</p>
            </div>
          }
        >
          <Badge 
            variant="outline" 
            className={cn("px-1 py-0 h-4", textSizes.badge)}
          >
            {formatDate(entity.date)}
          </Badge>
        </NodeTooltip>
      )}
    </div>
  ) : undefined;
  
  // Build stats section with tooltips
  const characterNames = entity.charactersInvolvedIds ? 
    getEntityNames(entity.charactersInvolvedIds, 'character') : [];
  const evidenceNames = entity.memoryEvidenceIds ? 
    getEntityNames(entity.memoryEvidenceIds, 'element') : [];
  
  const stats = displayFlags.showStats ? (
    <div className={cn("flex justify-between items-center", textSizes.stats)}>
      {entity.charactersInvolvedIds && entity.charactersInvolvedIds.length > 0 && (
        <EntityListTooltip
          title="Characters Involved"
          entities={characterNames}
          enabled={displayFlags.enableTooltips}
        >
          <span className="flex items-center text-orange-600">
            <Users className="h-3 w-3 mr-0.5" />
            {entity.charactersInvolvedIds.length}
          </span>
        </EntityListTooltip>
      )}
      {entity.memoryEvidenceIds && entity.memoryEvidenceIds.length > 0 && (
        <EntityListTooltip
          title="Related Evidence"
          entities={evidenceNames}
          enabled={displayFlags.enableTooltips}
        >
          <span className="flex items-center text-blue-600">
            <Search className="h-3 w-3 mr-0.5" />
            {entity.memoryEvidenceIds.length}
          </span>
        </EntityListTooltip>
      )}
    </div>
  ) : undefined;
  
  // Main content with conditional tooltip
  const isDescTruncated = !!(entity.description && entity.description.length > 80);
  const content = displayFlags.showDetails ? (
    <div className="text-center">
      <TextTooltip
        enabled={displayFlags.enableTooltips && isDescTruncated}
        text={entity.description || ''}
        title="Full Description"
      >
        <div className={cn("text-gray-600 line-clamp-2", textSizes.description)}>
          {entity.description}
        </div>
      </TextTooltip>
    </div>
  ) : undefined;
  
  // Custom handle positions for timeline
  const handlePositions = {
    source: Position.Bottom,
    target: Position.Top
  };
  
  return (
    <div data-testid={rest['data-testid'] || `node-${id}`}>
      <NodePopover
        enabled={displayFlags.enablePopovers}
        entityType="timeline"
        entityData={entity}
        metadata={metadata}
      >
        <BaseNodeCard
          nodeType="timeline"
          size={size}
          status={statuses}
          title={entity.description || 'Timeline Event'}
          icon={<Calendar className="h-5 w-5" />}
          selected={selected}
          highlighted={metadata.searchMatch}
          headerSlot={badges}
          footerSlot={stats}
          handlePositions={handlePositions}
          className={isOptimistic ? 'animate-pulse' : undefined}
          outlineColor={isOptimistic ? '#10b981' : undefined}
          outlineWidth={isOptimistic ? 3 : undefined}
          opacity={isOptimistic ? 0.8 : undefined}
        >
          {content}
        </BaseNodeCard>
      </NodePopover>
    </div>
  );
});

TimelineNode.displayName = 'TimelineNode';

export default TimelineNode;