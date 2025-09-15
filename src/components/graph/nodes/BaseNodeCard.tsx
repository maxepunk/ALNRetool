/**
 * BaseNodeCard component
 * Foundation component for all graph nodes using shadcn Card
 * Provides consistent styling, glassmorphism effects, and React Flow integration
 * Uses a slot-based architecture for flexible content arrangement
 * Enhanced with dynamic typography and responsive sizing
 */

import { forwardRef, memo, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNodeFilterStyles } from '@/hooks/useNodeFilterStyles';
import { NodeTooltip, StatusTooltip } from './NodeTooltip';
import type { GraphNodeData } from '@/lib/graph/types';

export type NodeType = 'puzzle' | 'character' | 'element' | 'timeline' | 'group';
export type NodeSize = 'small' | 'medium' | 'large' | 'parent' | 'child';
export type NodeStatus = 'draft' | 'ready' | 'locked' | 'chained' | 'error';

interface BaseNodeCardProps extends Partial<NodeProps>, Omit<React.HTMLAttributes<HTMLDivElement>, 'draggable'> {
  nodeType: NodeType;
  size?: NodeSize;
  status?: NodeStatus | NodeStatus[];
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  selected?: boolean;
  highlighted?: boolean;  // For search highlighting
  showHandles?: boolean;
  handlePositions?: {
    source?: Position;
    target?: Position;
  };
  // Slot-based architecture for flexible layouts
  headerSlot?: ReactNode;  // Top area for badges, status indicators
  footerSlot?: ReactNode;  // Bottom area for stats, counts
  cornerSlot?: ReactNode;  // Corner overlay for owner badges, special indicators
  // Filter state styling
  outlineColor?: string;
  outlineWidth?: number;
  opacity?: number;
  // NEW: Pass metadata for zoom-aware rendering
  metadata?: GraphNodeData['metadata'];
}

// Node type color themes with WCAG AA compliant contrast
const nodeThemes = {
  puzzle: {
    border: 'border-purple-500 border-2',
    gradient: 'bg-gradient-to-br from-purple-50 to-purple-100',
    glow: 'group-hover:shadow-[0_0_20px_rgba(147,51,234,0.3)]',
    hover: 'hover:shadow-purple-400/30',
    selected: 'ring-2 ring-purple-600 ring-offset-2',
    text: 'text-purple-900',
  },
  character: {
    border: 'border-blue-500 border-2',
    gradient: 'bg-gradient-to-br from-blue-50 to-blue-100',
    glow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    hover: 'hover:shadow-blue-400/30',
    selected: 'ring-2 ring-blue-600 ring-offset-2',
    text: 'text-blue-900',
  },
  element: {
    border: 'border-orange-500 border-2',
    gradient: 'bg-gradient-to-br from-orange-50 to-orange-100',
    glow: 'group-hover:shadow-[0_0_20px_rgba(251,146,60,0.3)]',
    hover: 'hover:shadow-orange-400/30',
    selected: 'ring-2 ring-orange-600 ring-offset-2',
    text: 'text-orange-900',
  },
  timeline: {
    border: 'border-amber-500 border-2',
    gradient: 'bg-gradient-to-br from-amber-50 to-amber-100',
    glow: 'group-hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]',
    hover: 'hover:shadow-amber-400/30',
    selected: 'ring-2 ring-amber-600 ring-offset-2',
    text: 'text-amber-900',
  },
  group: {
    border: 'border-gray-400 border-dashed',
    gradient: 'bg-gradient-to-br from-gray-50 to-gray-100',
    glow: 'group-hover:shadow-[0_0_15px_rgba(156,163,175,0.3)]',
    hover: 'hover:shadow-gray-400/30',
    selected: 'ring-2 ring-gray-600 ring-offset-2',
    text: 'text-gray-800',
  },
};

// Size configurations - now using base dimensions for responsive scaling
const sizeConfigs = {
  small: { baseWidth: 128, baseHeight: 96 },
  medium: { baseWidth: 176, baseHeight: 128 },
  large: { baseWidth: 224, baseHeight: 160 },
  parent: { baseWidth: 240, baseHeight: 176 },
  child: { baseWidth: 144, baseHeight: 112 },
};

// Status badge variants with improved contrast
const statusVariants = {
  draft: { variant: 'secondary' as const, label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-300 font-medium' },
  ready: { variant: 'default' as const, label: 'Ready', className: 'bg-green-100 text-green-700 border-green-300 font-medium' },
  locked: { variant: 'destructive' as const, label: '🔒 Locked', className: 'bg-red-100 text-red-700 border-red-300 font-medium' },
  chained: { variant: 'outline' as const, label: '🔗 Chained', className: 'bg-amber-100 text-amber-700 border-amber-300 font-medium' },
  error: { variant: 'destructive' as const, label: '⚠️ Error', className: 'bg-red-100 text-red-700 border-red-300 font-medium' },
};

const BaseNodeCard = memo(forwardRef<HTMLDivElement, BaseNodeCardProps>(({
  nodeType,
  size = 'medium',
  status,
  title,
  icon,
  children,
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
  outlineColor = '',
  outlineWidth = 0,
  opacity = 1,
  metadata,
  ...rest
}, ref) => {
  const theme = nodeThemes[nodeType];
  const config = sizeConfigs[size];
  const statuses = Array.isArray(status) ? status : status ? [status] : [];
  
  // Default metadata for when none is provided
  const defaultMetadata: GraphNodeData['metadata'] = {
    entityType: 'element', // Safe default
  };

  // Always call the hook (React Rules of Hooks)
  const hookResult = useNodeFilterStyles(metadata || defaultMetadata, selected);
  
  // Use hook results only if metadata was provided, otherwise use defaults
  const {
    displayFlags,
    textSizes,
    getResponsiveTextSize,
    zoom = 1
  } = metadata ? hookResult : {
    displayFlags: {
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
    },
    textSizes: {
      title: 'text-sm',
      badge: 'text-xs',
      stats: 'text-xs',
      description: 'text-xs',
    },
    getResponsiveTextSize: (_size: string) => '1rem',
    zoom: 1
  };
  
  // Calculate dynamic dimensions based on zoom
  const scaleFactor = Math.min(Math.max(zoom, 0.5), 1.5);
  const scaledWidth = config.baseWidth * scaleFactor;
  const scaledHeight = config.baseHeight * scaleFactor;

  return (
    <div ref={ref} className="relative group" style={{ opacity }} {...rest}>
      {/* Custom outline (behind main card) */}
      {outlineWidth > 0 && (
        <div
          className="absolute rounded-lg"
          style={{
            inset: `-${outlineWidth}px`,
            backgroundColor: outlineColor,
            zIndex: -1,
          }}
        />
      )}
      <Card
        className={cn(
          'relative transition-all duration-300 cursor-pointer overflow-hidden',
          // Remove fixed size class, now using dynamic sizing
          theme.border,
          theme.gradient,
          theme.hover,
          theme.glow,
          selected && theme.selected,
          highlighted && 'shadow-lg shadow-yellow-400/70',
          // Strong shadows for depth
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
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          fontSize: getResponsiveTextSize('md'),
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
          {/* Header slot - conditional rendering based on zoom */}
          {displayFlags.showBadges && (headerSlot || statuses.length > 0) && (
            <div className="flex items-start justify-between gap-1 mb-1">
              {/* Custom header content */}
              {headerSlot && (
                <div className="flex-1">
                  {headerSlot}
                </div>
              )}
              
              {/* Status badges with tooltips */}
              {statuses.length > 0 && (
                <div className="flex gap-1 flex-shrink-0">
                  {statuses.map((s) => (
                    <StatusTooltip
                      key={s}
                      status={s}
                      description={`Status: ${statusVariants[s].label}`}
                      enabled={displayFlags.enableTooltips}
                    >
                      <Badge
                        variant={statusVariants[s].variant}
                        className={cn(
                          "px-1.5 py-0 h-5 shadow-sm backdrop-blur-sm",
                          statusVariants[s].className,
                          textSizes.badge
                        )}
                      >
                        {statusVariants[s].label}
                      </Badge>
                    </StatusTooltip>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Title section with icon - responsive sizing */}
          {(displayFlags.showIcon || displayFlags.showTitle) && (
            <div className={cn("flex items-center gap-2 mb-1", theme.text)}>
              {icon && displayFlags.showIcon && (
                <div 
                  className="shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ fontSize: getResponsiveTextSize('lg') }}
                >
                  {icon}
                </div>
              )}
              {displayFlags.showTitle && (
                <div className="flex-1 min-w-0">
                  <NodeTooltip
                    enabled={displayFlags.enableTooltips && !displayFlags.showTitleFull && title.length > 20}
                    content={title}
                  >
                    <h3 
                      className={cn(
                        "font-semibold",
                        textSizes.title,
                        !displayFlags.showTitleFull && "truncate"
                      )}
                    >
                      {title}
                    </h3>
                  </NodeTooltip>
                </div>
              )}
            </div>
          )}

          {/* Main content area - conditional */}
          {displayFlags.showDetails && children && (
            <div className={cn("flex-1 overflow-hidden", theme.text)}>
              {children}
            </div>
          )}

          {/* Footer slot - conditional with responsive text */}
          {displayFlags.showStats && footerSlot && (
            <div className={cn(
              "mt-auto pt-1 border-t border-gray-300/40 backdrop-blur-sm",
              theme.text,
              textSizes.stats
            )}>
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
}));

BaseNodeCard.displayName = 'BaseNodeCard';

export default BaseNodeCard;