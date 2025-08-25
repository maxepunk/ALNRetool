/**
 * BaseNodeCard component
 * Foundation component for all graph nodes using shadcn Card
 * Provides consistent styling, glassmorphism effects, and React Flow integration
 * Uses a slot-based architecture for flexible content arrangement
 */

import { memo, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type NodeType = 'puzzle' | 'character' | 'element' | 'timeline' | 'group';
export type NodeSize = 'small' | 'medium' | 'large' | 'parent' | 'child';
export type NodeStatus = 'draft' | 'ready' | 'locked' | 'chained' | 'error';

interface BaseNodeCardProps extends Partial<NodeProps> {
  nodeType: NodeType;
  size?: NodeSize;
  status?: NodeStatus | NodeStatus[];
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  selected?: boolean;
  showHandles?: boolean;
  handlePositions?: {
    source?: Position;
    target?: Position;
  };
  // Slot-based architecture for flexible layouts
  headerSlot?: ReactNode;  // Top area for badges, status indicators
  footerSlot?: ReactNode;  // Bottom area for stats, counts
  cornerSlot?: ReactNode;  // Corner overlay for owner badges, special indicators
}

// Node type color themes with glassmorphism effects
const nodeThemes = {
  puzzle: {
    border: 'border-amber-500/60 border-2',
    background: 'bg-gradient-to-br from-amber-50/80 to-amber-100/70',
    glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    hover: 'hover:shadow-amber-300/60',
    selected: 'ring-2 ring-amber-500/80 ring-offset-2',
  },
  character: {
    border: 'border-green-500/60 border-2',
    background: 'bg-gradient-to-br from-green-50/80 to-green-100/70',
    glow: 'group-hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]',
    hover: 'hover:shadow-green-300/60',
    selected: 'ring-2 ring-green-500/80 ring-offset-2',
  },
  element: {
    border: 'border-purple-500/60 border-2',
    background: 'bg-gradient-to-br from-purple-50/80 to-purple-100/70',
    glow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    hover: 'hover:shadow-purple-300/60',
    selected: 'ring-2 ring-purple-500/80 ring-offset-2',
  },
  timeline: {
    border: 'border-orange-500/60 border-2',
    background: 'bg-gradient-to-br from-orange-50/80 to-orange-100/70',
    glow: 'group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]',
    hover: 'hover:shadow-orange-300/60',
    selected: 'ring-2 ring-orange-500/80 ring-offset-2',
  },
  group: {
    border: 'border-gray-300/60 border-dashed',
    background: 'bg-gray-50/50',
    glow: 'group-hover:shadow-[0_0_15px_rgba(156,163,175,0.3)]',
    hover: 'hover:shadow-gray-200/50',
    selected: 'ring-2 ring-gray-400/80 ring-offset-2',
  },
};

// Size variants
const sizeClasses = {
  small: 'w-32 h-24 text-xs',
  medium: 'w-44 h-32 text-sm',
  large: 'w-56 h-40 text-base',
  parent: 'w-60 h-44 text-base font-semibold',
  child: 'w-36 h-28 text-xs',
};

// Status badge variants
const statusVariants = {
  draft: { variant: 'secondary' as const, label: 'Draft' },
  ready: { variant: 'default' as const, label: 'Ready' },
  locked: { variant: 'destructive' as const, label: '🔒 Locked' },
  chained: { variant: 'outline' as const, label: '🔗 Chained' },
  error: { variant: 'destructive' as const, label: '⚠️ Error' },
};

const BaseNodeCard = memo(({
  nodeType,
  size = 'medium',
  status,
  title,
  icon,
  children,
  className,
  selected = false,
  showHandles = true,
  handlePositions = {
    source: Position.Right,
    target: Position.Left,
  },
  headerSlot,
  footerSlot,
  cornerSlot,
}: BaseNodeCardProps) => {
  const theme = nodeThemes[nodeType];
  const sizeClass = sizeClasses[size];
  const statuses = Array.isArray(status) ? status : status ? [status] : [];

  return (
    <div className="relative group">
      <Card
        className={cn(
          'relative transition-all duration-300 cursor-pointer overflow-hidden',
          sizeClass,
          theme.border,
          theme.background,
          theme.hover,
          theme.glow,
          selected && theme.selected,
          // Glassmorphism effects
          'backdrop-blur-sm backdrop-saturate-150',
          'shadow-lg hover:shadow-xl',
          // Glass-like shine effect
          'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none',
          // Depth shadow
          'after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-t after:from-black/5 after:via-transparent after:to-transparent after:pointer-events-none',
          // Hover lift effect
          'hover:translate-y-[-2px]',
          className
        )}
        style={{
          boxShadow: selected 
            ? '0 10px 40px -10px rgba(0, 0, 0, 0.2), 0 0 25px -5px rgba(0, 0, 0, 0.1)'
            : '0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 0 10px -2px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Inner glass highlight for depth */}
        <div className="absolute inset-[1px] rounded-lg border border-white/20 pointer-events-none" />
        
        {/* Corner slot - for owner badges or special indicators */}
        {cornerSlot && (
          <div className="absolute -top-1 -right-1 z-20">
            {cornerSlot}
          </div>
        )}
        
        <CardContent className="p-2 h-full flex flex-col relative z-10">
          {/* Header slot - for badges, status indicators */}
          {(headerSlot || statuses.length > 0) && (
            <div className="flex items-start justify-between gap-1 mb-1">
              {/* Custom header content */}
              {headerSlot && (
                <div className="flex-1">
                  {headerSlot}
                </div>
              )}
              
              {/* Status badges - always on the right */}
              {statuses.length > 0 && (
                <div className="flex gap-1 flex-shrink-0">
                  {statuses.map((s) => (
                    <Badge
                      key={s}
                      variant={statusVariants[s].variant}
                      className="text-xs px-1.5 py-0 h-5 shadow-sm backdrop-blur-sm bg-white/80"
                    >
                      {statusVariants[s].label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Title section with icon */}
          <div className="flex items-center gap-2 mb-1">
            {icon && (
              <div className="text-lg shrink-0 transition-transform duration-300 group-hover:scale-110">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate" title={title}>
                {title}
              </h3>
            </div>
          </div>

          {/* Main content area */}
          {children && (
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          )}

          {/* Footer slot - for stats, counts, etc */}
          {footerSlot && (
            <div className="mt-auto pt-1 border-t border-gray-200/40 backdrop-blur-sm">
              {footerSlot}
            </div>
          )}
        </CardContent>

        {/* React Flow Handles with glassmorphism */}
        {showHandles && (
          <>
            {handlePositions.target && (
              <Handle
                type="target"
                position={handlePositions.target}
                className="w-2.5 h-2.5 bg-white/80 border-2 border-gray-400/60 backdrop-blur-sm transition-all duration-300 hover:scale-150 hover:bg-gray-200 hover:border-gray-500"
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              />
            )}
            {handlePositions.source && (
              <Handle
                type="source"
                position={handlePositions.source}
                className="w-2.5 h-2.5 bg-white/80 border-2 border-gray-600/60 backdrop-blur-sm transition-all duration-300 hover:scale-150 hover:bg-gray-300 hover:border-gray-700"
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
});

BaseNodeCard.displayName = 'BaseNodeCard';

export default BaseNodeCard;