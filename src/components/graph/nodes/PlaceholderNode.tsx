import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { GraphNodeData } from '@/lib/graph/types';

/**
 * PlaceholderNode - A simple node component for missing/broken entity references
 * Displays as a dashed outline to indicate it's a placeholder
 */
const PlaceholderNode = memo(({ data }: NodeProps) => {
  const nodeData = data as GraphNodeData;
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-dashed border-gray-400">
      <Handle type="target" position={Position.Top} className="w-16 !bg-gray-400" />
      <div className="text-gray-500 text-sm font-medium">
        {nodeData?.label || 'Missing Reference'}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-gray-400" />
    </div>
  );
});

PlaceholderNode.displayName = 'PlaceholderNode';

export default PlaceholderNode;