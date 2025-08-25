/**
 * DiamondCard component
 * A diamond-shaped card with glassmorphism effects for puzzle nodes
 * Designed specifically for ALNRetool's puzzle data structure
 */

import { memo, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type DiamondSize = 'small' | 'medium' | 'large' | 'parent' | 'child';
export type NodeStatus = 'draft' | 'ready' | 'locked' | 'chained' | 'error';

interface DiamondCardProps extends Partial<NodeProps> {
  size?: DiamondSize;
  title: string;
  icon?: ReactNode;
  className?: string;
  selected?: boolean;
  highlighted?: boolean;  // For search highlighting
  showHandles?: boolean;
  handlePositions?: {
    source?: Position;
    target?: Position;
  };
  // Status indicators
  statuses?: NodeStatus[];
  // Count indicators
  requirementsCount?: number;
  rewardsCount?: number;
  maxCount?: number; // For visual scaling
  // Ownership
  ownerBadge?: ReactNode;
  // Hierarchy
  isParent?: boolean;
  isChild?: boolean;
  // Complexity for color coding
  complexity?: 'simple' | 'medium' | 'complex';
}

// Size configurations for diamond
const sizeConfigs = {
  small: { size: 140, shadow: 10, padding: 12 },
  medium: { size: 180, shadow: 15, padding: 16 },
  large: { size: 220, shadow: 20, padding: 20 },
  parent: { size: 260, shadow: 30, padding: 24 },
  child: { size: 160, shadow: 12, padding: 14 },
};

// Status badge variants
const statusVariants = {
  draft: { variant: 'secondary' as const, label: 'Draft', className: 'bg-gray-100/80' },
  ready: { variant: 'default' as const, label: 'Ready', className: 'bg-green-100/80 text-green-700' },
  locked: { variant: 'destructive' as const, label: '🔒', className: 'bg-red-100/80' },
  chained: { variant: 'outline' as const, label: '🔗', className: 'bg-amber-100/80' },
  error: { variant: 'destructive' as const, label: '⚠️', className: 'bg-red-100/80' },
};

// Complexity color schemes for borders and glows
const complexityColors = {
  simple: {
    border: 'border-green-500/50',
    glow: 'hover:shadow-green-400/30',
    bg: 'from-green-50/60 to-emerald-100/40',
  },
  medium: {
    border: 'border-amber-500/50',
    glow: 'hover:shadow-amber-400/30',
    bg: 'from-amber-50/60 to-orange-100/40',
  },
  complex: {
    border: 'border-red-500/50',
    glow: 'hover:shadow-red-400/30',
    bg: 'from-red-50/60 to-rose-100/40',
  },
};

// Visual pip component for counts
const CountIndicator = ({ count, max = 5, color = 'amber' }: { count: number; max?: number; color?: string }) => {
  const displayCount = Math.min(count, max);
  const hasMore = count > max;
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: displayCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
          )}
        />
      ))}
      {hasMore && <span className="text-xs text-gray-500 ml-0.5">+{count - max}</span>}
    </div>
  );
};

const DiamondCard = memo(({
  size = 'medium',
  title,
  icon,
  className,
  selected = false,
  highlighted = false,
  showHandles = true,
  handlePositions = {
    source: Position.Right,
    target: Position.Left,
  },
  statuses = [],
  requirementsCount = 0,
  rewardsCount = 0,
  maxCount = 5,
  ownerBadge,
  isParent = false,
  isChild = false,
  complexity = 'medium',
}: DiamondCardProps) => {
  // Adjust size based on hierarchy
  const actualSize = isParent ? 'parent' : isChild ? 'child' : size;
  const config = sizeConfigs[actualSize];
  const complexityTheme = complexityColors[complexity];
  
  return (
    <div className="relative group">
      {/* Diamond Container */}
      <div
        className={cn(
          'relative transition-all duration-300 cursor-pointer',
          'hover:scale-105',
          className
        )}
        style={{
          width: `${config.size}px`,
          height: `${config.size}px`,
        }}
      >
        {/* Rotated Diamond Shape */}
        <div
          className={cn(
            'absolute inset-0 rounded-[20%] transition-all duration-500',
            'backdrop-blur-md backdrop-saturate-150',
            'border-2',
            complexityTheme.border,
            complexityTheme.glow,
            selected && 'ring-4 ring-amber-500/50 ring-offset-2 ring-offset-transparent',
            highlighted && 'ring-4 ring-yellow-400/80 ring-offset-2 ring-offset-transparent shadow-yellow-300/50'
          )}
          style={{
            transform: 'rotate(45deg)',
            background: `linear-gradient(135deg, ${complexityTheme.bg})`,
            boxShadow: `
              0 ${config.shadow}px ${config.shadow * 2}px -${config.shadow/2}px rgba(0, 0, 0, 0.15),
              0 ${config.shadow / 2}px ${config.shadow}px -${config.shadow/4}px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.5),
              inset 0 -1px 0 rgba(0, 0, 0, 0.05)
            `,
          }}
        >
          {/* Glass shine effect */}
          <div className="absolute inset-0 rounded-[20%] bg-gradient-to-br from-white/20 via-transparent to-transparent" />
          
          {/* Hover glow overlay */}
          <div
            className="absolute inset-0 rounded-[20%] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Content Container (not rotated) */}
        <div
          className="absolute inset-0 flex flex-col justify-between"
          style={{
            padding: `${config.padding}px`,
          }}
        >
          {/* Top Section: Status Badges */}
          {statuses.length > 0 && (
            <div className="flex justify-center gap-1 mb-1">
              {statuses.map((status) => (
                <Badge
                  key={status}
                  variant={statusVariants[status].variant}
                  className={cn(
                    'text-xs px-1.5 py-0 h-4 backdrop-blur-sm',
                    statusVariants[status].className
                  )}
                >
                  {statusVariants[status].label}
                </Badge>
              ))}
            </div>
          )}

          {/* Middle Section: Icon and Title */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {icon && (
              <div className={cn(
                'text-amber-600 mb-1 transition-transform duration-300 group-hover:scale-110',
                isParent ? 'scale-125' : isChild ? 'scale-90' : ''
              )}>
                {icon}
              </div>
            )}
            <h3 className={cn(
              'font-bold text-gray-800 text-center leading-tight px-2',
              isParent ? 'text-base' : isChild ? 'text-xs' : 'text-sm'
            )}>
              {title}
            </h3>
          </div>

          {/* Bottom Section: Stats Bar */}
          <div className="flex items-center justify-between gap-2 mt-1">
            {/* Requirements */}
            {requirementsCount > 0 && (
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-amber-600">↓{requirementsCount}</span>
                <CountIndicator count={requirementsCount} max={maxCount} color="amber" />
              </div>
            )}
            
            {/* Owner Badge */}
            {ownerBadge && (
              <div className="flex items-center justify-center">
                {ownerBadge}
              </div>
            )}
            
            {/* Rewards */}
            {rewardsCount > 0 && (
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-emerald-600">↑{rewardsCount}</span>
                <CountIndicator count={rewardsCount} max={maxCount} color="emerald" />
              </div>
            )}
          </div>

          {/* Complexity Indicator (corner dot) */}
          <div className="absolute top-2 right-2">
            <div className={cn(
              'w-2 h-2 rounded-full shadow-sm',
              complexity === 'simple' ? 'bg-green-400' :
              complexity === 'complex' ? 'bg-red-400' : 'bg-amber-400'
            )} />
          </div>
        </div>

        {/* React Flow Handles positioned on diamond corners */}
        {showHandles && (
          <>
            {handlePositions.target && (
              <Handle
                type="target"
                position={handlePositions.target}
                className={cn(
                  'w-3 h-3 bg-white/90 border-2 backdrop-blur-sm',
                  'transition-all duration-300',
                  'hover:scale-150 hover:bg-amber-200',
                  complexityTheme.border.replace('/50', '/80')
                )}
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  // Position on diamond corner
                  ...(handlePositions.target === Position.Left && {
                    left: '15%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }),
                }}
              />
            )}
            {handlePositions.source && (
              <Handle
                type="source"
                position={handlePositions.source}
                className={cn(
                  'w-3 h-3 bg-white/90 border-2 backdrop-blur-sm',
                  'transition-all duration-300',
                  'hover:scale-150 hover:bg-emerald-200',
                  complexityTheme.border.replace('/50', '/80')
                )}
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  // Position on diamond corner
                  ...(handlePositions.source === Position.Right && {
                    right: '15%',
                    top: '50%',
                    transform: 'translate(50%, -50%)',
                  }),
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
});

DiamondCard.displayName = 'DiamondCard';

export default DiamondCard;