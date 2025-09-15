import { memo } from 'react';
import { Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData } from '@/lib/graph/types';
import BaseNodeCard from './BaseNodeCard';
import { useNodeFilterStyles } from '@/hooks/useNodeFilterStyles';
import { AlertCircle } from 'lucide-react';
import { NodeTooltip } from './NodeTooltip';

/**
 * PlaceholderNode - A simple node component for missing/broken entity references
 * Displays as a dashed outline to indicate it's a placeholder
 * Now uses BaseNodeCard with zoom-aware rendering
 */
const PlaceholderNode = memo(({ data, selected, id, ...rest }: NodeProps & { 'data-testid'?: string }) => {
  const nodeData = data as GraphNodeData;
  
  // Use enhanced hook for filter styles
  const { 
    isHighlighted,
    outlineColor,
    outlineWidth,
    opacity,
    zIndex,
    displayFlags,
    textSizes
  } = useNodeFilterStyles(nodeData.metadata, selected);
  
  // Determine what to show based on metadata
  const entityType = nodeData.metadata?.entityType || 'unknown';
  const nodeId = id || 'unknown-id';
  
  // Content with tooltip for missing reference details
  const content = displayFlags.showDetails ? (
    <NodeTooltip
      enabled={displayFlags.enableTooltips}
      content={
        <div>
          <p className="font-semibold">Missing Reference</p>
          <p className="text-sm">Type: {entityType}</p>
          <p className="text-sm">ID: {nodeId}</p>
          <p className="text-xs text-muted-foreground mt-1">
            This entity could not be loaded from the database
          </p>
        </div>
      }
    >
      <div className="text-center text-gray-500">
        <p className={textSizes.description}>Missing {entityType}</p>
        {displayFlags.showDescriptions && (
          <p className="text-xs text-gray-400 mt-1">ID: {nodeId.slice(0, 8)}...</p>
        )}
      </div>
    </NodeTooltip>
  ) : undefined;
  
  return (
    <div style={{ position: 'relative', zIndex }} data-testid={rest['data-testid'] || `node-${id}`}>
      <BaseNodeCard
        nodeType="group" // Use group styling for placeholder
        size="small"
        status={['error']}
        title={nodeData?.label || 'Missing Reference'}
        icon={<AlertCircle className="h-5 w-5 text-gray-500" />}
        selected={selected}
        highlighted={isHighlighted}
        className="border-dashed opacity-75"
        handlePositions={{
          source: Position.Bottom,
          target: Position.Top
        }}
        outlineColor={outlineColor}
        outlineWidth={outlineWidth}
        opacity={opacity * 0.75} // Make placeholders more subtle
      >
        {content}
      </BaseNodeCard>
    </div>
  );
});

PlaceholderNode.displayName = 'PlaceholderNode';

export default PlaceholderNode;