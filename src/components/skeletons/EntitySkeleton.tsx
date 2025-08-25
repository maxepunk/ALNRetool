/**
 * Generic Entity Skeleton Component
 * Consolidates all entity-specific skeleton components into a single configurable component
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type SkeletonVariant = 'card' | 'list' | 'detail';
export type EntityType = 'character' | 'element' | 'puzzle' | 'timeline';

interface EntitySkeletonProps {
  variant?: SkeletonVariant;
  entityType?: EntityType;
  count?: number;
  className?: string;
}

export function EntitySkeleton({ 
  variant = 'card', 
  entityType = 'element',
  count = 1,
  className 
}: EntitySkeletonProps) {
  const renderCard = () => (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          {(entityType === 'puzzle' || entityType === 'element') && (
            <div className="flex gap-2 mt-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderList = () => (
    <div className={cn("flex items-center space-x-4 p-4 border-b", className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      {entityType === 'timeline' && (
        <Skeleton className="h-4 w-20" />
      )}
    </div>
  );

  const renderDetail = () => (
    <div className={cn("space-y-6 p-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {entityType === 'puzzle' && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      )}
    </div>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'list':
        return renderList();
      case 'detail':
        return renderDetail();
      case 'card':
      default:
        return renderCard();
    }
  };

  if (count > 1 && variant !== 'detail') {
    return (
      <>
        {[...Array(count)].map((_, index) => (
          <React.Fragment key={index}>
            {renderSkeleton()}
          </React.Fragment>
        ))}
      </>
    );
  }

  return renderSkeleton();
}

// Export convenience components for backward compatibility
export const CharacterSkeleton = (props: Omit<EntitySkeletonProps, 'entityType'>) => 
  <EntitySkeleton {...props} entityType="character" />;

export const ElementSkeleton = (props: Omit<EntitySkeletonProps, 'entityType'>) => 
  <EntitySkeleton {...props} entityType="element" />;

export const PuzzleSkeleton = (props: Omit<EntitySkeletonProps, 'entityType'>) => 
  <EntitySkeleton {...props} entityType="puzzle" />;

export const TimelineSkeleton = (props: Omit<EntitySkeletonProps, 'entityType'>) => 
  <EntitySkeleton {...props} entityType="timeline" />;