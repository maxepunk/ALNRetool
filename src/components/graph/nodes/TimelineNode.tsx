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

/**
 * Custom React Flow node component for Timeline Event entities
 * Uses BaseNodeCard for consistent styling with timeline-specific features
 */
const TimelineNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as GraphNodeData<TimelineEvent>;
  const { entity, metadata } = nodeData;
  const hasError = metadata.errorState !== undefined;
  
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
  const badges = (
    <div className="flex gap-1">
      {entity.date && (
        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
          {formatDate(entity.date)}
        </Badge>
      )}
    </div>
  );
  
  // Build stats section
  const stats = (
    <div className="flex justify-between items-center text-xs">
      {entity.charactersInvolvedIds && entity.charactersInvolvedIds.length > 0 && (
        <span className="flex items-center text-orange-600">
          <Users className="h-3 w-3 mr-0.5" />
          {entity.charactersInvolvedIds.length}
        </span>
      )}
      {entity.memoryEvidenceIds && entity.memoryEvidenceIds.length > 0 && (
        <span className="flex items-center text-blue-600">
          <Search className="h-3 w-3 mr-0.5" />
          {entity.memoryEvidenceIds.length}
        </span>
      )}
    </div>
  );
  
  // Main content
  const content = (
    <div className="text-center">
      <div className="text-xs text-gray-600 line-clamp-2">
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
    <BaseNodeCard
      nodeType="timeline"
      size={size}
      status={statuses}
      title={entity.description || 'Timeline Event'}
      icon={<Calendar className="h-5 w-5" />}
      selected={selected}
      headerSlot={badges}
      footerSlot={stats}
      handlePositions={handlePositions}
    >
      {content}
    </BaseNodeCard>
  );
});

TimelineNode.displayName = 'TimelineNode';

export default TimelineNode;