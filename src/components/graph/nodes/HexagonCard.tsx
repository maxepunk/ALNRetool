/**
 * HexagonCard component
 * A hexagon-shaped card with glassmorphism effects for character nodes
 * Provides visual distinction from rectangular elements and diamond puzzles
 */

import { memo, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NODE_SIZE_CONFIGS, NODE_TRANSITIONS, type NodeSize } from '@/lib/graph/nodeUtils';

export type NodeStatus = 'draft' | 'ready' | 'locked' | 'chained' | 'error';

interface HexagonCardProps extends Partial<NodeProps> {
  size?: NodeSize;
  title: string;
  icon?: ReactNode;
  className?: string;
  selected?: boolean;
  highlighted?: boolean;
  showHandles?: boolean;
  handlePositions?: {
    source?: Position;
    target?: Position;
  };
  // Slot-based architecture matching BaseNodeCard
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
  cornerSlot?: ReactNode;
  // Status indicators
  statuses?: NodeStatus[];
  // Character-specific
  tier?: 'core' | 'secondary' | 'tertiary';
  isNPC?: boolean;
  children?: ReactNode;
  // Filter state styling
  outlineColor?: string;
  outlineWidth?: number;
  opacity?: number;
}

// Size configurations for hexagon
const hexagonSizeConfigs = {
  small: { size: 120, padding: 10 },
  medium: { size: 160, padding: 14 },
  large: { size: 200, padding: 18 },
  parent: { size: 240, padding: 22 },
  child: { size: 140, padding: 12 },
};

// Status badge variants with improved contrast
const statusVariants = {
  draft: { variant: 'secondary' as const, label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-300 font-medium' },
  ready: { variant: 'default' as const, label: 'Ready', className: 'bg-green-100 text-green-700 border-green-300 font-medium' },
  locked: { variant: 'destructive' as const, label: '🔒', className: 'bg-red-100 text-red-700 border-red-300 font-medium' },
  chained: { variant: 'outline' as const, label: '🔗', className: 'bg-amber-100 text-amber-700 border-amber-300 font-medium' },
  error: { variant: 'destructive' as const, label: '⚠️', className: 'bg-red-100 text-red-700 border-red-300 font-medium' },
};

// Tier-based color schemes with WCAG AA compliant contrast
const tierColors = {
  core: {
    border: 'border-blue-900',
    glow: 'hover:shadow-blue-500/40',
    gradient: 'bg-gradient-to-br from-blue-900 to-blue-800', // Darkest blue
    accent: 'text-white',
    iconColor: 'text-blue-100',
    shadow: 'shadow-blue-900/20'
  },
  secondary: {
    border: 'border-blue-700',
    glow: 'hover:shadow-blue-400/40',
    gradient: 'bg-gradient-to-br from-blue-700 to-blue-600', // Medium blue
    accent: 'text-white',
    iconColor: 'text-blue-50',
    shadow: 'shadow-blue-700/20'
  },
  tertiary: {
    border: 'border-blue-600',
    glow: 'hover:shadow-sky-400/40',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-400', // Lighter blue (more distinct)
    accent: 'text-white',
    iconColor: 'text-blue-50',
    shadow: 'shadow-blue-600/20'
  }
};

const HexagonCard = memo(({
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
  headerSlot,
  footerSlot,
  cornerSlot,
  statuses = [],
  tier = 'secondary',
  isNPC = false,
  children,
  outlineColor = '',
  outlineWidth = 0,
  opacity = 1
}: HexagonCardProps) => {
  const config = hexagonSizeConfigs[size];
  const sizeConfig = NODE_SIZE_CONFIGS[size];
  const tierTheme = tierColors[tier];

  return (
    <div className="relative group" style={{ opacity }}>
      {/* Hexagon Container */}
      <div
        className={cn(
          'relative cursor-pointer',
          NODE_TRANSITIONS.base,
          NODE_TRANSITIONS.scale,
          className
        )}
        style={{
          width: `${config.size}px`,
          height: `${config.size}px`,
        }}
      >
        {/* Hexagon Outline (behind main shape) */}
        {outlineWidth > 0 && (
          <div
            className="absolute inset-0"
            style={{
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
              backgroundColor: outlineColor,
              transform: `scale(${1 + (outlineWidth * 0.02)})`,
              transformOrigin: 'center',
            }}
          />
        )}
        
        {/* Hexagon Shape with improved contrast and modern styling */}
        <div
          className={cn(
            'absolute inset-0 transition-all duration-300',
            'border-2',
            tierTheme.border,
            tierTheme.gradient,
            tierTheme.glow,
            tierTheme.shadow,
            selected && 'ring-4 ring-blue-400 ring-opacity-50',
            highlighted && 'shadow-xl shadow-yellow-400/50',
            isNPC && 'border-dashed'
          )}
          style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            borderWidth: '2px',
            boxShadow: `
              0 20px 25px -5px rgba(0, 0, 0, 0.25),
              0 10px 10px -5px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
          }}
        >
          {/* Glass shine effect - subtle on dark backgrounds */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
            style={{
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            }}
          />
          
          {/* Hover glow overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%)',
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            }}
          />
        </div>

        {/* Content Container (not clipped) */}
        <div
          className="absolute inset-0 flex flex-col justify-between"
          style={{
            padding: `${config.padding}px`,
          }}
        >
          {/* Corner slot - for special indicators */}
          {cornerSlot && (
            <div className="absolute -top-2 -right-2 z-20">
              {cornerSlot}
            </div>
          )}

          {/* Top Section: Status Badges or Header */}
          {(headerSlot || statuses.length > 0) && (
            <div className="flex justify-center mb-1">
              {headerSlot ? (
                <div className="flex-1">
                  {headerSlot}
                </div>
              ) : (
                <div className="flex gap-1">
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
            </div>
          )}

          {/* Middle Section: Icon and Title */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {icon && (
              <div className={cn(
                tierTheme.iconColor,
                'mb-1 transition-transform duration-300 group-hover:scale-110'
              )}>
                {icon}
              </div>
            )}
            <h3 className={cn(
              'font-semibold text-center leading-tight px-2',
              tierTheme.accent,
              sizeConfig.fontSize
            )}>
              {title}
            </h3>
            {/* NPC Indicator */}
            {isNPC && (
              <span className={cn('text-xs mt-0.5', tierTheme.accent)}>
                (NPC)
              </span>
            )}
          </div>

          {/* Main Content */}
          {children && (
            <div className="my-1 overflow-hidden">
              {children}
            </div>
          )}

          {/* Bottom Section: Footer */}
          {footerSlot && (
            <div className="mt-auto pt-1 border-t border-green-300/30 backdrop-blur-sm">
              {footerSlot}
            </div>
          )}

          {/* Tier Indicator (corner dot) */}
          <div className="absolute top-3 right-3">
            <div className={cn(
              'w-3 h-3 rounded-full shadow-md ring-2 ring-white/30',
              tier === 'core' ? 'bg-blue-900' :
              tier === 'secondary' ? 'bg-blue-700' : 'bg-blue-500'
            )} />
          </div>
        </div>

        {/* React Flow Handles positioned on hexagon vertices */}
        {showHandles && (
          <>
            {handlePositions.target && (
              <Handle
                type="target"
                position={handlePositions.target}
                className={cn(
                  'w-3 h-3 bg-white/90 border-2 backdrop-blur-sm',
                  'transition-all duration-300',
                  'hover:scale-150 hover:bg-emerald-200',
                  tierTheme.border.replace('/70', '/90').replace('/60', '/80').replace('/50', '/70')
                )}
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  // Position on left hexagon vertex
                  ...(handlePositions.target === Position.Left && {
                    left: '0%',
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
                  'hover:scale-150 hover:bg-teal-200',
                  tierTheme.border.replace('/70', '/90').replace('/60', '/80').replace('/50', '/70')
                )}
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  // Position on right hexagon vertex
                  ...(handlePositions.source === Position.Right && {
                    right: '0%',
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

HexagonCard.displayName = 'HexagonCard';

export default HexagonCard;