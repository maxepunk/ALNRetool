/**
 * DiamondCard component
 * A diamond-shaped card with glassmorphism effects for puzzle nodes
 * Designed specifically for ALNRetool's puzzle data structure
 */

import { forwardRef, memo, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNodeFilterStyles } from '@/hooks/useNodeFilterStyles';
import { StatusTooltip, NodeTooltip } from './NodeTooltip';
import type { GraphNodeData } from '@/lib/graph/types';
import type { NodeDisplayFlags, NodeTextSizes } from '@/hooks/useNodeFilterStyles';

export type DiamondSize = 'small' | 'medium' | 'large' | 'parent' | 'child';
export type NodeStatus = 'draft' | 'ready' | 'locked' | 'chained' | 'error';

interface DiamondCardProps extends Partial<NodeProps>, Omit<React.HTMLAttributes<HTMLDivElement>, 'draggable'> {
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
  // Filter state styling
  outlineColor?: string;
  outlineWidth?: number;
  opacity?: number;
  // Tooltip props for rich hover information
  requirementsTooltip?: string;
  rewardsTooltip?: string;
  statusTooltips?: Record<NodeStatus, string>;
  complexityTooltip?: string;
  // NEW: Pass metadata for zoom-aware rendering
  metadata?: GraphNodeData['metadata'];
  displayFlags?: NodeDisplayFlags;
  textSizes?: NodeTextSizes;
}

// Size configurations for diamond
const sizeConfigs = {
  small: { size: 140, shadow: 10, padding: 12 },
  medium: { size: 180, shadow: 15, padding: 16 },
  large: { size: 220, shadow: 20, padding: 20 },
  parent: { size: 260, shadow: 30, padding: 24 },
  child: { size: 160, shadow: 12, padding: 14 },
};

// Status badge variants with improved contrast
const statusVariants = {
  draft: { variant: 'secondary' as const, label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-300 font-medium' },
  ready: { variant: 'default' as const, label: 'Ready', className: 'bg-green-100 text-green-700 border-green-300 font-medium' },
  locked: { variant: 'destructive' as const, label: '🔒', className: 'bg-red-100 text-red-700 border-red-300 font-medium' },
  chained: { variant: 'outline' as const, label: '🔗', className: 'bg-amber-100 text-amber-700 border-amber-300 font-medium' },
  error: { variant: 'destructive' as const, label: '⚠️', className: 'bg-red-100 text-red-700 border-red-300 font-medium' },
};

// Complexity color schemes with WCAG AA compliant contrast using purple family
const complexityColors = {
  simple: {
    border: 'border-purple-600',
    glow: 'hover:shadow-purple-400/40',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-400', // Lighter purple (more distinct)
    accent: 'text-white',
    iconColor: 'text-purple-50',
    shadow: 'shadow-purple-600/20'
  },
  medium: {
    border: 'border-purple-700',
    glow: 'hover:shadow-purple-500/40',
    gradient: 'bg-gradient-to-br from-purple-700 to-purple-600', // Medium purple
    accent: 'text-white',
    iconColor: 'text-purple-50',
    shadow: 'shadow-purple-700/20'
  },
  complex: {
    border: 'border-purple-900',
    glow: 'hover:shadow-purple-600/40',
    gradient: 'bg-gradient-to-br from-purple-900 to-purple-800', // Darkest purple
    accent: 'text-white',
    iconColor: 'text-purple-100',
    shadow: 'shadow-purple-900/20'
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
            color === 'amber' ? 'bg-amber-600' : 'bg-emerald-600'
          )}
        />
      ))}
      {hasMore && <span className="text-xs text-gray-500 ml-0.5">+{count - max}</span>}
    </div>
  );
};

const DiamondCard = memo(forwardRef<HTMLDivElement, DiamondCardProps>(({
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
  outlineColor = '',
  outlineWidth = 0,
  opacity = 1,
  requirementsTooltip,
  rewardsTooltip,
  statusTooltips,
  complexityTooltip,
  metadata,
  displayFlags: propsDisplayFlags,
  textSizes: propsTextSizes,
  ...rest
}, ref) => {
  // Adjust size based on hierarchy
  const actualSize = isParent ? 'parent' : isChild ? 'child' : size;
  const config = sizeConfigs[actualSize];
  const complexityTheme = complexityColors[complexity];
  
  // Default metadata for when none is provided
  const defaultMetadata: GraphNodeData['metadata'] = {
    entityType: 'puzzle', // Safe default for diamond cards (usually puzzles)
  };
  
  // Always call the hook (React Rules of Hooks)
  const hookResult = useNodeFilterStyles(metadata || defaultMetadata, selected);
  
  // Use props if provided, otherwise use hook results (if metadata was provided), otherwise use defaults
  const displayFlags = propsDisplayFlags || (metadata ? hookResult.displayFlags : null) || {
    showShape: true,
    showIcon: true,
    showTitle: true,
    showTitleFull: true,
    showBadges: true,
    showStats: true,
    showDetails: true,
    showDescriptions: true,
    enablePopovers: false,
    enableTooltips: false,
  };
  
  const textSizes = propsTextSizes || (metadata ? hookResult.textSizes : null) || {
    title: 'text-sm',
    badge: 'text-xs',
    stats: 'text-xs',
    description: 'text-xs',
  };
  
  return (
    <div ref={ref} className="relative group" style={{ opacity }} {...rest}>
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
        {/* Diamond Outline (behind main shape) */}
        {outlineWidth > 0 && (
          <div
            className="absolute inset-0 rounded-[20%]"
            style={{
              transform: `rotate(45deg) scale(${1 + (outlineWidth * 0.02)})`,
              backgroundColor: outlineColor,
              transformOrigin: 'center',
            }}
          />
        )}
        
        {/* Rotated Diamond Shape with improved contrast and modern styling */}
        <div
          className={cn(
            'absolute inset-0 rounded-[20%] transition-all duration-300',
            'border-2',
            complexityTheme.border,
            complexityTheme.gradient,
            complexityTheme.glow,
            complexityTheme.shadow,
            selected && 'ring-4 ring-purple-400 ring-opacity-50',
            highlighted && 'shadow-xl shadow-yellow-400/50'
          )}
          style={{
            transform: 'rotate(45deg)',
            boxShadow: `
              0 20px 25px -5px rgba(0, 0, 0, 0.25),
              0 10px 10px -5px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
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
          {/* Top Section: Status Badges - conditional based on zoom */}
          {displayFlags.showBadges && statuses.length > 0 && (
            <div className="flex justify-center gap-1 mb-1">
              {statuses.map((status) => (
                <StatusTooltip
                  key={status}
                  status={status}
                  description={statusTooltips?.[status] || `Status: ${statusVariants[status].label}`}
                  enabled={displayFlags.enableTooltips}
                >
                  <Badge
                    variant={statusVariants[status].variant}
                    className={cn(
                      'px-1.5 py-0 h-4 backdrop-blur-sm',
                      statusVariants[status].className,
                      textSizes.badge
                    )}
                  >
                    {statusVariants[status].label}
                  </Badge>
                </StatusTooltip>
              ))}
            </div>
          )}

          {/* Middle Section: Icon and Title - zoom-aware */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {icon && displayFlags.showIcon && (
              <div className={cn(
                complexityTheme.iconColor,
                'mb-1 transition-transform duration-300 group-hover:scale-110',
                isParent ? 'scale-125' : isChild ? 'scale-90' : ''
              )}>
                {icon}
              </div>
            )}
            {displayFlags.showTitle && (
              <h3 className={cn(
                'font-bold text-center leading-tight px-2',
                complexityTheme.accent,
                textSizes.title,
                !displayFlags.showTitleFull && 'truncate max-w-full'
              )}>
                {title}
              </h3>
            )}
          </div>

          {/* Bottom Section: Stats Bar - conditional based on zoom */}
          {displayFlags.showStats && (
            <div className="flex items-center justify-between gap-2 mt-1">
              {/* Requirements */}
              {requirementsCount > 0 && (
                <NodeTooltip
                  enabled={displayFlags.enableTooltips}
                  content={requirementsTooltip}
                >
                  <div className="flex flex-col items-center">
                    <span className={cn("font-semibold text-amber-600", textSizes.stats)}>↓{requirementsCount}</span>
                    <CountIndicator count={requirementsCount} max={maxCount} color="amber" />
                  </div>
                </NodeTooltip>
              )}
              
              {/* Owner Badge */}
              {ownerBadge && (
                <div className="flex items-center justify-center">
                  {ownerBadge}
                </div>
              )}
              
              {/* Rewards */}
              {rewardsCount > 0 && (
                <NodeTooltip
                  enabled={displayFlags.enableTooltips}
                  content={rewardsTooltip}
                >
                  <div className="flex flex-col items-center">
                    <span className={cn("font-semibold text-emerald-600", textSizes.stats)}>↑{rewardsCount}</span>
                    <CountIndicator count={rewardsCount} max={maxCount} color="emerald" />
                  </div>
                </NodeTooltip>
              )}
            </div>
          )}

          {/* Complexity Indicator (corner dot) - show with badges */}
          {displayFlags.showBadges && (
            <NodeTooltip
              enabled={displayFlags.enableTooltips}
              content={complexityTooltip}
            >
              <div className="absolute top-2 right-2">
                <div className={cn(
                  'w-3 h-3 rounded-full shadow-md ring-2 ring-white/30',
                  complexity === 'simple' ? 'bg-purple-500' :
                  complexity === 'complex' ? 'bg-purple-900' : 'bg-purple-700'
                )} />
              </div>
            </NodeTooltip>
          )}
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
}));

DiamondCard.displayName = 'DiamondCard';

export default DiamondCard;