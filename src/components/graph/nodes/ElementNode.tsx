import { memo } from 'react';
import { Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData } from '@/lib/graph/types';
import type { Element } from '@/types/notion/app';
import BaseNodeCard, { type NodeStatus } from './BaseNodeCard';
import OwnerBadge from './OwnerBadge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Package,
  Star,
  Brain,
  Box,
  ArrowLeft,
  ArrowRight,
  Hash,
  Heart,
  Briefcase,
  Cpu,
  Shield,
  Zap
} from 'lucide-react';

/**
 * Custom React Flow node component for Element entities
 * Enhanced with better badge organization and dual-role indicators
 * Uses slot-based architecture for proper content arrangement
 */
const ElementNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as GraphNodeData<Element>;
  const { entity, metadata } = nodeData;
  const hasError = metadata.errorState !== undefined;
  const hasSF = entity.sfPatterns !== undefined && Object.keys(entity.sfPatterns).length > 0;
  
  // Determine visual style based on status
  const getNodeStatus = (): NodeStatus | undefined => {
    if (hasError) return 'error';
    const statusLower = entity.status?.toLowerCase();
    if (statusLower?.includes('draft') || statusLower?.includes('idea') || statusLower?.includes('placeholder')) {
      return 'draft';
    }
    if (statusLower?.includes('ready') || statusLower?.includes('done') || statusLower?.includes('complete')) {
      return 'ready';
    }
    return undefined;
  };
  
  // Determine if element has dual roles
  const isRequirement = entity.requiredForPuzzleIds && entity.requiredForPuzzleIds.length > 0;
  const isReward = entity.rewardedByPuzzleIds && entity.rewardedByPuzzleIds.length > 0;
  const isDualRole = isRequirement && isReward;
  
  // Memory type icon and color
  const getMemoryTypeIcon = () => {
    const type = entity.sfPatterns?.memoryType;
    if (!type) return null;
    switch (type) {
      case 'Personal': return <Heart className="h-3 w-3" />;
      case 'Business': return <Briefcase className="h-3 w-3" />;
      case 'Technical': return <Cpu className="h-3 w-3" />;
      default: return <Brain className="h-3 w-3" />;
    }
  };
  
  const getMemoryTypeColor = () => {
    const type = entity.sfPatterns?.memoryType;
    if (!type) return '';
    switch (type) {
      case 'Personal': return 'bg-pink-100 text-pink-700 border-pink-300';
      case 'Business': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Technical': return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };
  
  // Build status array for BaseNodeCard
  const nodeStatus = getNodeStatus();
  const statuses: NodeStatus[] = nodeStatus ? [nodeStatus] : [];
  
  // Header slot - badges arranged horizontally
  const headerSlot = (
    <div className="flex items-center justify-between gap-1">
      {/* Left side: SF and Memory Type badges */}
      <div className="flex gap-1 items-center">
        {hasSF && (
          <Badge 
            variant="default" 
            className="text-xs px-1.5 py-0 h-5 bg-purple-600/90 backdrop-blur-sm flex items-center gap-1 border-purple-400"
          >
            <Shield className="h-3 w-3" />
            <span className="font-medium">SF</span>
            {entity.sfPatterns?.valueRating && (
              <div className="flex items-center ml-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-2.5 w-2.5',
                      i < entity.sfPatterns.valueRating! 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-purple-300'
                    )}
                  />
                ))}
              </div>
            )}
          </Badge>
        )}
        {entity.sfPatterns?.memoryType && (
          <Badge 
            variant="outline" 
            className={cn('text-xs px-1.5 py-0 h-5 flex items-center gap-1', getMemoryTypeColor())}
          >
            {getMemoryTypeIcon()}
            <span className="font-medium">{entity.sfPatterns.memoryType[0]}</span>
          </Badge>
        )}
      </div>
      
      {/* Right side: Flow Direction Indicators */}
      {(isDualRole || isRequirement || isReward) && (
        <div className="flex gap-1">
          {isDualRole ? (
            <Badge 
              variant="outline" 
              className="text-xs px-1.5 py-0 h-5 bg-gradient-to-r from-blue-100 to-green-100 border-purple-300 flex items-center gap-0.5"
              title="Dual-role: Both requirement and reward"
            >
              <ArrowLeft className="h-3 w-3 text-blue-600" />
              <Zap className="h-2.5 w-2.5 text-purple-600" />
              <ArrowRight className="h-3 w-3 text-green-600" />
            </Badge>
          ) : isRequirement ? (
            <Badge 
              variant="outline" 
              className="text-xs px-1.5 py-0 h-5 bg-blue-100 border-blue-300 flex items-center gap-0.5"
              title="Requirement for puzzles"
            >
              <ArrowLeft className="h-3 w-3 text-blue-600" />
              <span className="font-medium text-blue-700">{entity.requiredForPuzzleIds.length}</span>
            </Badge>
          ) : (
            <Badge 
              variant="outline" 
              className="text-xs px-1.5 py-0 h-5 bg-green-100 border-green-300 flex items-center gap-0.5"
              title="Reward from puzzles"
            >
              <span className="font-medium text-green-700">{entity.rewardedByPuzzleIds.length}</span>
              <ArrowRight className="h-3 w-3 text-green-600" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
  
  // Footer slot - stats section with RFID and element type
  const footerSlot = (
    <div className="flex justify-between items-center text-xs">
      {/* Element Type */}
      <div className="flex items-center gap-1">
        {entity.isContainer ? (
          <Box className="h-3 w-3 text-purple-500" />
        ) : (
          <Package className="h-3 w-3 text-purple-500" />
        )}
        <span className="text-gray-600 font-medium">
          {entity.basicType ? entity.basicType.replace(' Token', '') : 'Prop'}
        </span>
      </div>
      
      {/* RFID if present */}
      {entity.sfPatterns?.rfid && (
        <span className="flex items-center text-purple-600 font-mono text-xs">
          <Hash className="h-3 w-3 mr-0.5" />
          {entity.sfPatterns.rfid}
        </span>
      )}
    </div>
  );
  
  // Corner slot - owner badge
  const cornerSlot = metadata.ownerName ? (
    <OwnerBadge
      characterName={metadata.ownerName}
      tier={metadata.ownerTier as 'Tier 1' | 'Tier 2' | 'Tier 3' | undefined}
      position="top-right"
    />
  ) : undefined;
  
  // Main content with narrative threads
  const content = (
    <div className="space-y-1">
      {/* Narrative Threads */}
      {entity.narrativeThreads && entity.narrativeThreads.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entity.narrativeThreads.slice(0, 2).map((thread, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="text-xs px-1 py-0 h-4 bg-purple-50 text-purple-700 border-purple-200"
            >
              {thread}
            </Badge>
          ))}
          {entity.narrativeThreads.length > 2 && (
            <Badge
              variant="secondary"
              className="text-xs px-1 py-0 h-4 bg-purple-50 text-purple-700 border-purple-200"
            >
              +{entity.narrativeThreads.length - 2}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
  
  // Choose icon based on element type and properties
  const getIcon = () => {
    if (entity.isContainer) return <Box className="h-5 w-5 text-purple-600" />;
    if (hasSF) return <Shield className="h-5 w-5 text-purple-600" />;
    return <Package className="h-5 w-5 text-purple-600" />;
  };
  
  // Custom styling for the card wrapper
  const cardClassName = cn(
    isDualRole && 'ring-2 ring-purple-400/40 ring-offset-1',
    entity.isContainer && 'shadow-lg'
  );
  
  return (
    <BaseNodeCard
      nodeType="element"
      size="medium"
      status={statuses}
      title={entity.name}
      icon={getIcon()}
      selected={selected}
      highlighted={metadata.searchMatch}
      className={cardClassName}
      headerSlot={headerSlot}
      footerSlot={footerSlot}
      cornerSlot={cornerSlot}
      handlePositions={{
        source: Position.Right,
        target: Position.Left
      }}
    >
      {content}
    </BaseNodeCard>
  );
});

ElementNode.displayName = 'ElementNode';

export default ElementNode;