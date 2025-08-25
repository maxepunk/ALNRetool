import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData } from '@/lib/graph/types';
import type { Character } from '@/types/notion/app';
import BaseNodeCard, { type NodeStatus } from './BaseNodeCard';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  Package,
  Puzzle,
  Users
} from 'lucide-react';

/**
 * Custom React Flow node component for Character entities
 * Uses BaseNodeCard for consistent styling with character-specific features
 */
const CharacterNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as GraphNodeData<Character>;
  const { entity, metadata } = nodeData;
  const hasError = metadata.errorState !== undefined;
  
  // Determine visual style based on tier and type
  const tier = entity.tier?.toLowerCase() ?? 'unknown';
  const isNPC = entity.type === 'NPC';
  const size = metadata.visualHints?.size ?? 'medium';
  
  // Build status array
  const statuses: NodeStatus[] = [];
  if (hasError) statuses.push('error');
  
  // Build tier badge
  const badges = (
    <div className="flex gap-1">
      {entity.tier && (
        <Badge 
          variant={tier === 'core' ? 'default' : tier === 'secondary' ? 'secondary' : 'outline'}
          className="text-[10px] px-1 py-0 h-4"
        >
          {entity.tier}
        </Badge>
      )}
      {isNPC && (
        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
          NPC
        </Badge>
      )}
    </div>
  );
  
  // Build stats section
  const stats = (
    <div className="flex justify-between items-center text-xs">
      {entity.ownedElementIds && entity.ownedElementIds.length > 0 && (
        <span className="flex items-center text-green-600">
          <Package className="h-3 w-3 mr-0.5" />
          {entity.ownedElementIds.length}
        </span>
      )}
      {entity.characterPuzzleIds && entity.characterPuzzleIds.length > 0 && (
        <span className="flex items-center text-amber-600">
          <Puzzle className="h-3 w-3 mr-0.5" />
          {entity.characterPuzzleIds.length}
        </span>
      )}
    </div>
  );
  
  // Main content
  const content = (
    <div className="space-y-1">
      {entity.characterLogline && (
        <div className="text-xs text-gray-600 italic line-clamp-2">
          {entity.characterLogline}
        </div>
      )}
    </div>
  );
  
  // Choose icon based on character type
  const icon = isNPC ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />;
  
  return (
    <BaseNodeCard
      nodeType="character"
      size={size}
      status={statuses}
      title={entity.name}
      icon={icon}
      selected={selected}
      highlighted={metadata.searchMatch}
      headerSlot={badges}
      footerSlot={stats}
    >
      {content}
    </BaseNodeCard>
  );
});

CharacterNode.displayName = 'CharacterNode';

export default CharacterNode;