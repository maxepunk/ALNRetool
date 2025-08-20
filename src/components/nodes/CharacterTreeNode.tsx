/**
 * CharacterTreeNode Component
 * Enhanced character node for hierarchical journey view with tier-based sizing
 * and drop target indicators for ownership transfer
 */

import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import BaseNodeCard from '../graph/nodes/BaseNodeCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { User, Users, Crown, Star, Circle } from 'lucide-react';



/**
 * CharacterTreeNode Component
 * Tier-based sizing with drag-drop support
 */
export const CharacterTreeNode = memo(({ 
  data, 
  selected,
  dragging = false,
}: NodeProps) => {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const nodeData = data as any;
  const metadata = nodeData?.metadata || {};
  const character = metadata?.enrichedData?.character || {};
  const tier = character?.tier?.toLowerCase() || 'tertiary';
  
  // Get tier-based size
  const getTierSize = () => {
    if (tier === 'core' || tier === 'tier 1') return 'w-64 h-64'; // 64px
    if (tier === 'secondary' || tier === 'tier 2') return 'w-48 h-48'; // 48px
    return 'w-32 h-32'; // 32px - tertiary
  };
  
  // Get tier icon
  const getTierIcon = () => {
    if (tier === 'core' || tier === 'tier 1') return Crown;
    if (tier === 'secondary' || tier === 'tier 2') return Star;
    return Circle;
  };
  
  // Get tier badge variant
  const getTierBadgeVariant = (): "default" | "secondary" | "outline" => {
    if (tier === 'core' || tier === 'tier 1') return 'default';
    if (tier === 'secondary' || tier === 'tier 2') return 'secondary';
    return 'outline';
  };

  // Get tier color classes
  const getTierColorClasses = () => {
    if (tier === 'core' || tier === 'tier 1') {
      return 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-400';
    }
    if (tier === 'secondary' || tier === 'tier 2') {
      return 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400';
    }
    return 'bg-gradient-to-br from-gray-500/20 to-slate-500/20 border-gray-400';
  };

  const TierIcon = getTierIcon();
  const characterType = character?.type || 'NPC';
  const isPlayer = characterType === 'Player';

  // Handle drag over for drop target indication
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(true);
  };

  const handleDragLeave = () => {
    setIsDropTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);
    // Drop handling is managed by the parent view
  };

  return (
    <div
      className={cn(
        'relative transition-all duration-200',
        getTierSize(),
        dragging && 'opacity-50'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop target indicator */}
      {isDropTarget && (
        <div className="absolute inset-0 z-10 rounded-lg border-2 border-green-500 bg-green-500/20 animate-pulse" />
      )}

      <BaseNodeCard
        nodeType="character"
        title={nodeData?.label || 'Character'}
        selected={selected}
        className={cn(
          'h-full flex flex-col items-center justify-center p-4 cursor-pointer',
          getTierColorClasses(),
          isDropTarget && 'ring-2 ring-green-500 ring-offset-2'
        )}
      >
        {/* Handles for connections */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-primary border-2 border-background"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-primary border-2 border-background"
        />

        {/* Character icon */}
        <div className="mb-2">
          {isPlayer ? (
            <User className="h-8 w-8 text-primary" />
          ) : (
            <Users className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* Character name */}
        <h3 className={cn(
          'font-semibold text-center line-clamp-2',
          tier === 'core' || tier === 'tier 1' ? 'text-lg' : 'text-sm'
        )}>
          {nodeData?.label || ''}
        </h3>

        {/* Tier indicator */}
        <div className="mt-2 flex items-center gap-1">
          <TierIcon className="h-3 w-3" />
          <Badge variant={getTierBadgeVariant()} className="text-xs">
            {tier === 'core' || tier === 'tier 1' ? 'Core' :
             tier === 'secondary' || tier === 'tier 2' ? 'Secondary' : 
             'Tertiary'}
          </Badge>
        </div>

        {/* Player/NPC badge */}
        <Badge 
          variant="outline" 
          className={cn(
            "mt-1 text-xs",
            isPlayer ? 'border-primary text-primary' : 'border-muted-foreground'
          )}
        >
          {characterType}
        </Badge>

        {/* Ownership count indicator */}
        {character.ownedElementIds && character.ownedElementIds.length > 0 && (
          <div className="absolute -bottom-2 -right-2 bg-background rounded-full px-2 py-1 border shadow-sm">
            <span className="text-xs font-semibold">
              {character.ownedElementIds.length}
            </span>
          </div>
        )}
      </BaseNodeCard>
    </div>
  );
});

CharacterTreeNode.displayName = 'CharacterTreeNode';