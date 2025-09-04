import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData } from '@/lib/graph/types';
import type { Puzzle } from '@/types/notion/app';
import DiamondCard, { type NodeStatus } from './DiamondCard';
import { useNodeFilterStyles } from '@/hooks/useNodeFilterStyles';
import { Puzzle as PuzzleIcon, User } from 'lucide-react';

/**
 * Custom React Flow node component for Puzzle entities
 * Uses DiamondCard for distinctive diamond-shaped visualization
 */
const PuzzleNode = memo(({ data, selected, id, ...rest }: NodeProps & { 'data-testid'?: string }) => {
  const nodeData = data as GraphNodeData<Puzzle>;
  const { entity, metadata } = nodeData;
  const hasError = metadata.errorState !== undefined;
  const isOptimistic = (metadata as any).isOptimistic || false;
  
  // Use shared hook for filter styles
  const { 
    isHighlighted,
    outlineColor,
    outlineWidth,
    opacity,
    zIndex,
    shouldShowBadges, 
    shouldShowStats 
  } = useNodeFilterStyles(metadata, selected);
  
  // Determine hierarchy
  const isParent = entity.subPuzzleIds && entity.subPuzzleIds.length > 0;
  const isChild = entity.parentItemId !== undefined;
  
  // Determine complexity from metadata or calculate based on connections
  const getComplexity = () => {
    const totalConnections = (entity.puzzleElementIds?.length || 0) + (entity.rewardIds?.length || 0);
    if (metadata.visualHints?.size === 'large' || totalConnections > 8) return 'complex';
    if (metadata.visualHints?.size === 'small' || totalConnections < 3) return 'simple';
    return 'medium';
  };
  
  // Check if puzzle is locked (from visual hints)
  const isLocked = metadata.visualHints?.icon === 'lock';
  
  // Determine status based on elements
  const hasElements = entity.puzzleElementIds && entity.puzzleElementIds.length > 0;
  const isDraft = !hasElements;
  const isReady = hasElements;
  
  // Build status array - simplified to show only most important status
  const statuses: NodeStatus[] = [];
  if (hasError) {
    statuses.push('error');
  } else if (isLocked) {
    statuses.push('locked');
  } else if (isDraft) {
    statuses.push('draft');
  } else if (isReady) {
    statuses.push('ready');
  }
  
  // Owner badge - simplified (only show when zoomed in enough)
  const ownerBadge = shouldShowBadges && entity.ownerId ? (
    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100/80 backdrop-blur-sm">
      <User className="h-3 w-3 text-gray-600" />
    </div>
  ) : undefined;

  return (
    <div style={{ position: 'relative', zIndex }} data-testid={rest['data-testid'] || `node-${id}`}>
      <DiamondCard
        title={entity.name}
        icon={<PuzzleIcon className="h-5 w-5" />}
        selected={selected}
        highlighted={isHighlighted}
        statuses={shouldShowBadges ? statuses : []}
        requirementsCount={shouldShowStats ? (entity.puzzleElementIds?.length || 0) : 0}
        rewardsCount={shouldShowStats ? (entity.rewardIds?.length || 0) : 0}
        ownerBadge={ownerBadge}
        isParent={isParent}
        isChild={isChild}
        complexity={getComplexity()}
        size="medium"
        maxCount={5}
        outlineColor={isOptimistic ? '#10b981' : outlineColor}
        outlineWidth={isOptimistic ? 3 : outlineWidth}
        opacity={isOptimistic ? 0.8 : opacity}
        className={isOptimistic ? 'animate-pulse' : undefined}
      />
    </div>
  );
});

PuzzleNode.displayName = 'PuzzleNode';

export default PuzzleNode;