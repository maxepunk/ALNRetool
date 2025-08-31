import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData } from '@/lib/graph/types';
import type { Character } from '@/types/notion/app';
import HexagonCard, { type NodeStatus } from './HexagonCard';
import { useNodeFilterStyles } from '@/hooks/useNodeFilterStyles';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  Package,
  Puzzle,
  Users
} from 'lucide-react';

/**
 * Custom React Flow node component for Character entities
 * Uses HexagonCard for visually distinct hexagonal shape
 */
const CharacterNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as GraphNodeData<Character>;
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
    shouldShowStats,
    shouldShowDetails 
  } = useNodeFilterStyles(metadata, selected);
  
  // Determine character properties
  const isNPC = entity.type === 'NPC';
  const tier = entity.tier === 'Core' ? 'core' : 
               entity.tier === 'Secondary' ? 'secondary' : 'tertiary';
  const size = metadata.visualHints?.size ?? 'medium';
  
  // Build status array
  const statuses: NodeStatus[] = [];
  if (hasError) statuses.push('error');
  
  // Build tier badge (zoom-aware) - simplified to just show tier
  const headerSlot = shouldShowBadges && entity.tier ? (
    <Badge 
      variant="outline"
      className="text-[10px] px-1.5 py-0 h-4 bg-white/80 text-blue-900 border-blue-300 font-semibold"
    >
      {entity.tier}
    </Badge>
  ) : undefined;
  
  // Build stats section (zoom-aware)
  const footerSlot = shouldShowStats ? (
    <div className="flex justify-between items-center text-xs">
      {entity.ownedElementIds && entity.ownedElementIds.length > 0 && (
        <span className="flex items-center text-white font-medium">
          <Package className="h-3 w-3 mr-0.5" />
          {entity.ownedElementIds.length}
        </span>
      )}
      {entity.characterPuzzleIds && entity.characterPuzzleIds.length > 0 && (
        <span className="flex items-center text-white font-medium">
          <Puzzle className="h-3 w-3 mr-0.5" />
          {entity.characterPuzzleIds.length}
        </span>
      )}
    </div>
  ) : undefined;
  
  // Main content (zoom-aware)
  const content = shouldShowDetails && entity.characterLogline ? (
    <div className="text-xs text-teal-800 italic line-clamp-2 text-center">
      {entity.characterLogline}
    </div>
  ) : undefined;
  
  // Choose icon based on character type
  const icon = isNPC ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />;
  
  return (
    <div style={{ position: 'relative', zIndex }}>
      <HexagonCard
        size={size}
        title={entity.name}
        icon={icon}
        selected={selected}
        highlighted={isHighlighted}
        statuses={statuses}
        tier={tier}
        isNPC={isNPC}
        headerSlot={headerSlot}
        footerSlot={footerSlot}
        outlineColor={isOptimistic ? '#10b981' : outlineColor}
        outlineWidth={isOptimistic ? 3 : outlineWidth}
        opacity={isOptimistic ? 0.8 : opacity}
      >
        {content}
      </HexagonCard>
    </div>
  );
});

CharacterNode.displayName = 'CharacterNode';

export default CharacterNode;