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
import { formatCountTooltip } from '@/lib/graph/tooltipHelpers';

/**
 * Custom React Flow node component for Timeline Event entities
 * Uses BaseNodeCard for consistent styling with timeline-specific features
 */
const TimelineNode = memo(({ data, selected, id, ...rest }: NodeProps & { 'data-testid'?: string }) => {
  const nodeData = data as GraphNodeData<TimelineEvent>;
  const { entity, metadata } = nodeData;
  const hasError = metadata.errorState !== undefined;
  const isOptimistic = (metadata as any).isOptimistic || false;
  
  // Get entity lookup functions for tooltips
  const { getEntityNames } = useGraphData();
  
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
  
  const badges = (
    <div className="flex gap-1">
      {entity.date && (
        <Badge 
          variant="outline" 
          className="text-[10px] px-1 py-0 h-4"
          title={fullDate}
        >
          {formatDate(entity.date)}
        </Badge>
      )}
    </div>
  );
  
  // Build stats section with tooltips
  const characterNames = entity.charactersInvolvedIds ? 
    getEntityNames(entity.charactersInvolvedIds, 'character') : [];
  const evidenceNames = entity.memoryEvidenceIds ? 
    getEntityNames(entity.memoryEvidenceIds, 'element') : [];
  
  const stats = (
    <div className="flex justify-between items-center text-xs">
      {entity.charactersInvolvedIds && entity.charactersInvolvedIds.length > 0 && (
        <span 
          className="flex items-center text-orange-600"
          title={formatCountTooltip('Characters Involved', characterNames)}
        >
          <Users className="h-3 w-3 mr-0.5" />
          {entity.charactersInvolvedIds.length}
        </span>
      )}
      {entity.memoryEvidenceIds && entity.memoryEvidenceIds.length > 0 && (
        <span 
          className="flex items-center text-blue-600"
          title={formatCountTooltip('Related Evidence', evidenceNames)}
        >
          <Search className="h-3 w-3 mr-0.5" />
          {entity.memoryEvidenceIds.length}
        </span>
      )}
    </div>
  );
  
  // Main content with conditional tooltip
  const isDescTruncated = entity.description && entity.description.length > 80;
  const content = (
    <div className="text-center">
      <div 
        className="text-xs text-gray-600 line-clamp-2"
        title={isDescTruncated ? entity.description : undefined}
      >
        {entity.description}
      </div>
    </div>
  );
  
  // Custom handle positions for timeline
  const handlePositions = {
    source: Position.Bottom,
    target: Position.Top
  };
  
  return (
    <div data-testid={rest['data-testid'] || `node-${id}`}>
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
    </div>
  );
});

TimelineNode.displayName = 'TimelineNode';

export default TimelineNode;