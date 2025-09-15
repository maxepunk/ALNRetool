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
import { useGraphData } from '@/contexts/GraphDataContext';
import { characterTierDescriptions } from '@/lib/graph/tooltipHelpers';
import { isNodeOptimistic } from '@/lib/graph/utils';
import { NodeTooltip, EntityListTooltip, TextTooltip } from './NodeTooltip';
import { NodePopover } from './NodePopover';
import { cn } from '@/lib/utils';

/**
 * Custom React Flow node component for Character entities
 * Uses HexagonCard for visually distinct hexagonal shape
 */
const CharacterNode = memo(({ data, selected, id, ...rest }: NodeProps & { 'data-testid'?: string }) => {
  const nodeData = data as GraphNodeData<Character>;
  const { entity, metadata } = nodeData;
  const hasError = metadata.errorState !== undefined;
  const isOptimistic = isNodeOptimistic(metadata);
  
  // Get entity lookup functions for tooltips
  const { getEntityNames } = useGraphData();
  
  // Use enhanced hook for filter styles and zoom-aware rendering
  const { 
    isHighlighted,
    outlineColor,
    outlineWidth,
    opacity,
    zIndex,
    displayFlags,
    textSizes
  } = useNodeFilterStyles(metadata, selected, nodeData.highlightShared);
  
  // Determine character properties
  const isNPC = entity.type === 'NPC';
  const tier = entity.tier === 'Core' ? 'core' : 
               entity.tier === 'Secondary' ? 'secondary' : 'tertiary';
  const size = metadata.visualHints?.size ?? 'medium';
  
  // Build status array
  const statuses: NodeStatus[] = [];
  if (hasError) statuses.push('error');
  
  // Build tier badge with enhanced tooltip
  const headerSlot = displayFlags.showBadges && entity.tier ? (
    <NodeTooltip
      enabled={displayFlags.enableTooltips}
      content={
        <div>
          <p className="font-semibold">Character Tier: {entity.tier}</p>
          <p className="text-sm text-muted-foreground">
            {characterTierDescriptions[entity.tier as keyof typeof characterTierDescriptions] || entity.tier}
          </p>
        </div>
      }
    >
      <Badge 
        variant="outline"
        className={cn(
          "px-1.5 py-0 h-4 bg-white/80 text-blue-900 border-blue-300 font-semibold",
          textSizes.badge
        )}
      >
        {entity.tier}
      </Badge>
    </NodeTooltip>
  ) : undefined;
  
  // Build stats section (zoom-aware)
  const elementNames = entity.ownedElementIds ? getEntityNames(entity.ownedElementIds, 'element') : [];
  const puzzleNames = entity.characterPuzzleIds ? getEntityNames(entity.characterPuzzleIds, 'puzzle') : [];
  
  const footerSlot = displayFlags.showStats ? (
    <div className={cn("flex justify-between items-center", textSizes.stats)}>
      {entity.ownedElementIds && entity.ownedElementIds.length > 0 && (
        <EntityListTooltip
          title="Owned Elements"
          entities={elementNames}
          enabled={displayFlags.enableTooltips}
        >
          <span className="flex items-center text-white font-medium">
            <Package className="h-3 w-3 mr-0.5" />
            {entity.ownedElementIds.length}
          </span>
        </EntityListTooltip>
      )}
      {entity.characterPuzzleIds && entity.characterPuzzleIds.length > 0 && (
        <EntityListTooltip
          title="Associated Puzzles"
          entities={puzzleNames}
          enabled={displayFlags.enableTooltips}
        >
          <span className="flex items-center text-white font-medium">
            <Puzzle className="h-3 w-3 mr-0.5" />
            {entity.characterPuzzleIds.length}
          </span>
        </EntityListTooltip>
      )}
    </div>
  ) : undefined;
  
  // Main content with rich tooltip for truncated loglines
  const isLoglineTruncated = !!(entity.characterLogline && entity.characterLogline.length > 60);
  const content = displayFlags.showDetails && entity.characterLogline ? (
    <TextTooltip
      enabled={displayFlags.enableTooltips && isLoglineTruncated}
      title="Character Logline"
      text={entity.characterLogline}
    >
      <div className={cn(
        "text-teal-800 italic line-clamp-2 text-center",
        textSizes.description
      )}>
        {entity.characterLogline}
      </div>
    </TextTooltip>
  ) : undefined;
  
  // Choose icon based on character type
  const icon = isNPC ? 
    <span title="Non-Player Character (NPC)"><Users className="h-5 w-5" /></span> : 
    <span title="Player Character"><User className="h-5 w-5" /></span>;
  
  return (
    <div style={{ position: 'relative', zIndex }} data-testid={rest['data-testid'] || `node-${id}`}>
      <NodePopover
        enabled={displayFlags.enablePopovers}
        entityType="character"
        entityData={entity}
        metadata={metadata}
      >
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
          // Pass new properties for zoom-aware rendering
          metadata={metadata}
          displayFlags={displayFlags}
          textSizes={textSizes}
        >
          {content}
        </HexagonCard>
      </NodePopover>
    </div>
  );
});

CharacterNode.displayName = 'CharacterNode';

export default CharacterNode;