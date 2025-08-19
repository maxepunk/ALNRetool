import { memo, useState, useRef, useEffect } from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import type { BezierEdgeProps } from '@xyflow/react';
import { getEdgeAnimationClasses } from '@/lib/animations';
import { cn } from '@/lib/utils';

/**
 * Enhanced edge component with sophisticated animations
 * Renders different styles and animations based on edge relationship type
 */
const DefaultEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  labelStyle,
  data,
}: BezierEdgeProps & { data?: any }) => {
  const [isHovered, setIsHovered] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine edge style based on relationship type
  const relationshipType = data?.relationshipType || data?.Type || 'requirement';
  
  let strokeColor = '#6b7280'; // gray-500 default
  let strokeWidth = 2;
  let strokeDasharray: string | undefined;
  let showArrow = true;
  let hoverStrokeColor = '#3b82f6'; // blue-500
  
  switch (relationshipType) {
    case 'requirement':
      strokeColor = '#6b7280'; // gray-500
      strokeWidth = 2;
      hoverStrokeColor = '#3b82f6'; // blue-500
      break;
    case 'reward':
      strokeColor = '#9ca3af'; // gray-400
      strokeWidth = 2;
      strokeDasharray = '5 5';
      hoverStrokeColor = '#10b981'; // emerald-500
      break;
    case 'collaboration':
    case 'ownership':
    case 'owner':
      strokeColor = '#d1d5db'; // gray-300
      strokeWidth = 1.5;
      strokeDasharray = '2 4';
      showArrow = false;
      hoverStrokeColor = '#8b5cf6'; // violet-500
      break;
    case 'puzzle-grouping':
    case 'chain':
      strokeColor = '#374151'; // gray-700
      strokeWidth = 3;
      hoverStrokeColor = '#f59e0b'; // amber-500
      break;
    case 'virtual-dependency':
      strokeColor = '#cbd5e1'; // gray-300 lighter for virtual
      strokeWidth = 1.5;
      strokeDasharray = '3 3';
      hoverStrokeColor = '#38bdf8'; // sky-400
      break;
  }

  // Get animation classes for this edge type
  const animationClasses = getEdgeAnimationClasses(relationshipType, isHovered);
  
  // Apply edge-specific CSS classes
  const edgeTypeClass = `edge-${relationshipType.replace(/[_\s]/g, '-')}`;

  // Calculate path length for dash animations (for reward and virtual edges)
  useEffect(() => {
    if (pathRef.current && strokeDasharray) {
      const pathLength = pathRef.current.getTotalLength();
      pathRef.current.style.setProperty('--path-length', `${pathLength}`);
    }
  }, [edgePath, strokeDasharray]);

  return (
    <>
      {/* Invisible wider path for better hover detection */}
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(20, strokeWidth * 4)}
          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        />
        
        {/* Use BaseEdge for proper React Flow edge rendering */}
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={showArrow ? (markerEnd || 'url(#arrowclosed)') : undefined}
          style={{
            ...style,
            stroke: isHovered ? hoverStrokeColor : strokeColor,
            strokeWidth: isHovered ? strokeWidth + 1 : strokeWidth,
            strokeDasharray: strokeDasharray,
            transition: 'stroke 0.3s ease-in-out, stroke-width 0.3s ease-in-out, filter 0.3s ease-in-out',
            filter: isHovered ? `drop-shadow(0 0 8px ${hoverStrokeColor}88)` : undefined,
          }}
          className={cn('edge-hover', edgeTypeClass, animationClasses)}
          interactionWidth={0} // We handle interaction with our transparent path
        />
        
        {/* Animated overlay for special effects (reward and virtual edges) */}
        {(relationshipType === 'reward' || relationshipType === 'virtual-dependency') && isHovered && (
          <path
            d={edgePath}
            fill="none"
            stroke={hoverStrokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className={cn('pointer-events-none animate-flow')}
            style={{
              opacity: 0.3,
            }}
          />
        )}
      </g>

      {/* Edge label with enhanced styling */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              ...labelStyle,
            }}
            className={cn(
              'text-xs font-medium px-2 py-1 rounded',
              'bg-white/90 backdrop-blur-sm border border-gray-200',
              'shadow-sm pointer-events-none transition-all duration-200',
              isHovered && 'ring-2 ring-offset-1 ring-offset-transparent',
              isHovered && relationshipType === 'requirement' && 'ring-blue-400/50',
              isHovered && relationshipType === 'reward' && 'ring-emerald-400/50',
              isHovered && relationshipType === 'chain' && 'ring-amber-400/50',
              isHovered && (relationshipType === 'ownership' || relationshipType === 'collaboration') && 'ring-violet-400/50',
              isHovered && relationshipType === 'virtual-dependency' && 'ring-sky-400/50'
            )}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

DefaultEdge.displayName = 'DefaultEdge';

export default DefaultEdge;