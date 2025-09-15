import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';
import type { GraphNodeData } from '@/lib/graph/types';
import { useIsMobile } from '@/hooks/useIsMobile';

// Union type for all entity types
export type EntityData = Character | Element | Puzzle | TimelineEvent;

interface NodePopoverProps<T extends EntityData = EntityData> {
  children: ReactNode;
  enabled?: boolean;
  entityType: string;
  entityData: T;
  metadata?: GraphNodeData<T>['metadata'];
}

/**
 * NodePopover - Provides rich detailed view on hover at high zoom levels
 * Following the existing NodeTooltip pattern but with richer content
 */
export const NodePopover = memo(<T extends EntityData = EntityData>({
  children,
  enabled = true,
  entityType,
  entityData,
  metadata
}: NodePopoverProps<T>) => {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const showTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const longPressTimeoutRef = useRef<NodeJS.Timeout>();
  const isMobile = useIsMobile();
  
  // Enable popovers to help read node details when zoomed out
  const isEnabled = enabled && !isDragging;
  
  // Desktop hover handlers
  const handleMouseEnter = useCallback(() => {
    if (!isEnabled || isMobile) return; // Skip on mobile
    
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = undefined;
    }
    
    // Debounce show with 300ms delay
    showTimeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, 300);
  }, [isEnabled, isMobile]);
  
  const handleMouseLeave = useCallback(() => {
    if (isMobile) return; // Skip on mobile
    
    // Clear any pending show timeout
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = undefined;
    }
    
    // Shorter hide delay (150ms) to allow for slight mouse slips
    hideTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  }, [isMobile]);
  
  // Touch/pointer handlers for mobile
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isEnabled || !isMobile) return; // Only on mobile
    
    // Start long-press timer (500ms)
    longPressTimeoutRef.current = setTimeout(() => {
      setOpen(true);
      // Prevent default to avoid triggering other interactions
      e.preventDefault();
    }, 500);
  }, [isEnabled, isMobile]);
  
  const handlePointerUp = useCallback(() => {
    if (!isMobile) return; // Only on mobile
    
    // Clear long-press timer if released early
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = undefined;
    }
    
    // Auto-hide popover after 3 seconds on mobile
    if (open) {
      hideTimeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 3000);
    }
  }, [isMobile, open]);
  
  const handlePointerCancel = useCallback(() => {
    if (!isMobile) return; // Only on mobile
    
    // Clear long-press timer if cancelled
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = undefined;
    }
  }, [isMobile]);
  
  // Close immediately on drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setOpen(false);
    
    // Clear all timeouts
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = undefined;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = undefined;
    }
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = undefined;
    }
  }, []);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    };
  }, []);
  
  // If not enabled, just render children
  if (!isEnabled) {
    return <>{children}</>;
  }
  
  // Clone the child element and add event handlers to it
  const childWithHandlers = React.cloneElement(children as React.ReactElement, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    style: {
      ...(children as React.ReactElement).props.style,
      // Prevent default touch behaviors on mobile
      ...(isMobile ? { touchAction: 'none' } : {})
    }
  });
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        {childWithHandlers}
      </PopoverAnchor>
      <PopoverContent 
        className="w-96 p-0"
        side="right"
        sideOffset={10}
        onMouseEnter={() => {
          // Keep popover open when mouse enters it
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = undefined;
          }
        }}
        onMouseLeave={handleMouseLeave}
      >
        <NodePopoverContent 
          entityType={entityType}
          entityData={entityData}
          metadata={metadata}
        />
      </PopoverContent>
    </Popover>
  );
});

NodePopover.displayName = 'NodePopover';

/**
 * NodePopoverContent - Renders the detailed entity information
 * Lazy-loaded only when popover is open
 */
const NodePopoverContent = memo(<T extends EntityData = EntityData>({
  entityType,
  entityData,
  metadata
}: {
  entityType: string;
  entityData: T;
  metadata?: GraphNodeData<T>['metadata'];
}) => {
  // Render different content based on entity type
  const renderEntityDetails = () => {
    switch (entityType) {
      case 'character':
        return <CharacterPopoverContent data={entityData as Character} />;
      case 'element':
        return <ElementPopoverContent data={entityData as Element} />;
      case 'puzzle':
        return <PuzzlePopoverContent data={entityData as Puzzle} />;
      case 'timeline':
        return <TimelinePopoverContent data={entityData as TimelineEvent} />;
      default:
        return <GenericPopoverContent data={entityData} type={entityType} />;
    }
  };
  
  return (
    <ScrollArea className="h-[400px]">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">{entityData.name || 'Unnamed'}</h3>
          <Badge variant="outline" className="capitalize">
            {entityType}
          </Badge>
        </div>
        
        <Separator className="mb-3" />
        
        {/* Entity-specific content */}
        {renderEntityDetails()}
        
        {/* Metadata section if available */}
        {metadata && (
          <>
            <Separator className="my-3" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Metadata</h4>
              <div className="text-xs space-y-1">
                <div>Entity Type: {metadata.entityType}</div>
                {metadata.isOrphan && <div>Status: Orphan</div>}
                {metadata.isParent && <div>Status: Parent</div>}
                {metadata.isChild && <div>Status: Child</div>}
                {metadata.dependencies && metadata.dependencies.length > 0 && (
                  <div>Dependencies: {metadata.dependencies.length}</div>
                )}
                {metadata.rewards && metadata.rewards.length > 0 && (
                  <div>Rewards: {metadata.rewards.length}</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
});

NodePopoverContent.displayName = 'NodePopoverContent';

// Entity-specific content components
const CharacterPopoverContent = memo(({ data }: { data: Character }) => (
  <div className="space-y-3">
    {data.characterLogline && (
      <div>
        <h4 className="text-sm font-medium mb-1">Logline</h4>
        <p className="text-sm text-muted-foreground italic">{data.characterLogline}</p>
      </div>
    )}
    
    {data.type && (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Type:</span>
        <Badge variant="secondary">{data.type}</Badge>
      </div>
    )}
    
    {data.tier && (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Tier:</span>
        <Badge variant="outline">{data.tier}</Badge>
      </div>
    )}
    
    {data.ownedElementIds?.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-1">Owned Elements</h4>
        <p className="text-sm text-muted-foreground">
          {data.ownedElementIds.length} element{data.ownedElementIds.length !== 1 ? 's' : ''}
        </p>
      </div>
    )}
    
    {data.characterPuzzleIds?.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-1">Associated Puzzles</h4>
        <p className="text-sm text-muted-foreground">
          {data.characterPuzzleIds.length} puzzle{data.characterPuzzleIds.length !== 1 ? 's' : ''}
        </p>
      </div>
    )}
  </div>
));

CharacterPopoverContent.displayName = 'CharacterPopoverContent';

const ElementPopoverContent = memo(({ data }: { data: Element }) => (
  <div className="space-y-3">
    {data.descriptionText && (
      <div>
        <h4 className="text-sm font-medium mb-1">Description</h4>
        <p className="text-sm text-muted-foreground">{data.descriptionText}</p>
      </div>
    )}
    
    {data.sfPatterns && (
      <>
        {data.sfPatterns.rfid && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">RFID:</span>
            <Badge variant="outline">{data.sfPatterns.rfid}</Badge>
          </div>
        )}
        
        {data.sfPatterns.valueRating && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Value Rating:</span>
            <span className="text-sm text-muted-foreground">
              {data.sfPatterns.valueRating}/5 stars
            </span>
          </div>
        )}
        
        {data.sfPatterns.memoryType && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Memory Type:</span>
            <Badge variant="secondary">{data.sfPatterns.memoryType}</Badge>
          </div>
        )}
      </>
    )}
    
    {data.basicType && (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Type:</span>
        <Badge variant="outline">{data.basicType}</Badge>
      </div>
    )}
    
    {data.ownerId && (
      <div>
        <h4 className="text-sm font-medium mb-1">Owner ID</h4>
        <p className="text-sm text-muted-foreground font-mono text-xs">{data.ownerId}</p>
      </div>
    )}
    
    {(data.rewardedByPuzzleIds?.length > 0 || data.requiredForPuzzleIds?.length > 0) && (
      <div className="space-y-1">
        {data.requiredForPuzzleIds?.length > 0 && (
          <div className="text-sm">
            <span className="font-medium">Required by:</span>{' '}
            <span className="text-muted-foreground">
              {data.requiredForPuzzleIds.length} puzzle{data.requiredForPuzzleIds.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        {data.rewardedByPuzzleIds?.length > 0 && (
          <div className="text-sm">
            <span className="font-medium">Rewarded by:</span>{' '}
            <span className="text-muted-foreground">
              {data.rewardedByPuzzleIds.length} puzzle{data.rewardedByPuzzleIds.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    )}
  </div>
));

ElementPopoverContent.displayName = 'ElementPopoverContent';

const PuzzlePopoverContent = memo(({ data }: { data: Puzzle }) => (
  <div className="space-y-3">
    {data.descriptionSolution && (
      <div>
        <h4 className="text-sm font-medium mb-1">Solution</h4>
        <p className="text-sm text-muted-foreground">{data.descriptionSolution}</p>
      </div>
    )}
    
    {data.timing && data.timing.length > 0 && (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Timing:</span>
        {data.timing.map((act, index) => (
          <Badge key={index} variant="outline">Act {act}</Badge>
        ))}
      </div>
    )}
    
    {data.parentItemId && (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Has Parent Item:</span>
        <Badge variant="secondary">Yes</Badge>
      </div>
    )}
    
    {data.subPuzzleIds?.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-1">Sub Puzzles</h4>
        <p className="text-sm text-muted-foreground">
          {data.subPuzzleIds.length} sub puzzle{data.subPuzzleIds.length !== 1 ? 's' : ''}
        </p>
      </div>
    )}
    
    {data.ownerId && (
      <div>
        <h4 className="text-sm font-medium mb-1">Owner</h4>
        <p className="text-sm text-muted-foreground font-mono text-xs">{data.ownerId}</p>
      </div>
    )}
    
    {data.puzzleElementIds?.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-1">Required Elements</h4>
        <p className="text-sm text-muted-foreground">
          {data.puzzleElementIds.length} element{data.puzzleElementIds.length !== 1 ? 's' : ''} required
        </p>
      </div>
    )}
    
    {data.rewardIds?.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-1">Rewards</h4>
        <p className="text-sm text-muted-foreground">
          {data.rewardIds.length} reward{data.rewardIds.length !== 1 ? 's' : ''}
        </p>
      </div>
    )}
    
    {data.narrativeThreads?.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-1">Narrative Threads</h4>
        <p className="text-sm text-muted-foreground">
          {data.narrativeThreads.join(', ')}
        </p>
      </div>
    )}
  </div>
));

PuzzlePopoverContent.displayName = 'PuzzlePopoverContent';

const TimelinePopoverContent = memo(({ data }: { data: TimelineEvent }) => (
  <div className="space-y-3">
    {data.date && (
      <div>
        <h4 className="text-sm font-medium mb-1">Date & Time</h4>
        <p className="text-sm text-muted-foreground">
          {new Date(data.date).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    )}
    
    {data.description && (
      <div>
        <h4 className="text-sm font-medium mb-1">Event Description</h4>
        <p className="text-sm text-muted-foreground">{data.description}</p>
      </div>
    )}
    
    {data.charactersInvolvedIds && data.charactersInvolvedIds.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-1">Characters Involved</h4>
        <p className="text-sm text-muted-foreground">
          {data.charactersInvolvedIds.length} character{data.charactersInvolvedIds.length !== 1 ? 's' : ''}
        </p>
      </div>
    )}
    
    {data.memoryEvidenceIds && data.memoryEvidenceIds.length > 0 && (
      <div>
        <h4 className="text-sm font-medium mb-1">Related Evidence</h4>
        <p className="text-sm text-muted-foreground">
          {data.memoryEvidenceIds.length} evidence item{data.memoryEvidenceIds.length !== 1 ? 's' : ''}
        </p>
      </div>
    )}
  </div>
));

TimelinePopoverContent.displayName = 'TimelinePopoverContent';

const GenericPopoverContent = memo(({ data, type }: { data: any; type: string }) => (
  <div className="space-y-2">
    <p className="text-sm text-muted-foreground">
      {type} entity details
    </p>
    {Object.entries(data).map(([key, value]) => {
      if (key === 'id' || key === 'name' || typeof value === 'object') return null;
      return (
        <div key={key} className="text-sm">
          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
          <span className="text-muted-foreground">{String(value)}</span>
        </div>
      );
    })}
  </div>
));

GenericPopoverContent.displayName = 'GenericPopoverContent';

export default NodePopover;