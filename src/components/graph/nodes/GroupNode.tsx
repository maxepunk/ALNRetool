import { memo, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { ChevronDown, ChevronRight, FileText, CheckCircle, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GroupNodeData extends Record<string, unknown> {
  label: string;
  chainStatus?: 'draft' | 'ready' | 'complete';
  childCount?: number;
  width?: number;
  height?: number;
}

/**
 * Custom React Flow node component for grouping related nodes
 * Provides visual containment for puzzle chains and other grouped entities
 */
const GroupNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as GroupNodeData;
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const status = nodeData.chainStatus || 'draft';
  
  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return <Target className="h-4 w-4" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  // Get status variant for badge
  const getStatusVariant = () => {
    switch (status) {
      case 'complete':
        return 'default';
      case 'ready':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  return (
    <Card
      className={cn(
        "relative bg-gray-50/50 border-2 border-dashed transition-all duration-200",
        status === 'draft' && "border-gray-300",
        status === 'ready' && "border-green-400",
        status === 'complete' && "border-blue-500",
        selected && "ring-2 ring-gray-400 ring-offset-2",
        "hover:shadow-lg"
      )}
      style={{
        width: nodeData.width || 400,
        height: isCollapsed ? 60 : (nodeData.height || 300),
      }}
    >
      {/* Group header */}
      <div className="flex items-center justify-between p-3 border-b bg-white/80">
        <div className="flex items-center gap-2">
          <button
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
          <span className="font-semibold text-sm">{nodeData.label}</span>
          {nodeData.childCount && (
            <span className="text-xs text-gray-500">({nodeData.childCount} puzzles)</span>
          )}
        </div>
        <Badge variant={getStatusVariant()} className="text-xs">
          <span className="mr-1">{getStatusIcon()}</span>
          {status}
        </Badge>
      </div>
      
      {/* Visual hierarchy indicator */}
      {!isCollapsed && (
        <div className="absolute inset-x-0 top-12 bottom-0 pointer-events-none">
          <div className="absolute left-8 top-2 bottom-2 w-0.5 bg-gradient-to-b from-gray-300 to-transparent" />
        </div>
      )}
    </Card>
  );
});

GroupNode.displayName = 'GroupNode';

export default GroupNode;