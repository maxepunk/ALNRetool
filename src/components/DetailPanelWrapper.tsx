import React from 'react';
import { useFeatureFlag } from '@/lib/featureFlags';
import DetailPanel from './DetailPanel';
import { DetailPanelRefactored } from './detail-panel';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

type Entity = Character | Element | Puzzle | TimelineEvent;
type EntityType = 'character' | 'element' | 'puzzle' | 'timeline';

interface DetailPanelWrapperProps {
  entity: Entity | null;
  entityType: EntityType;
  onClose: () => void;
  onSave?: (updates: Partial<Entity>) => Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
  allEntities?: {
    characters?: Character[];
    elements?: Element[];
    puzzles?: Puzzle[];
    timeline?: TimelineEvent[];
  };
}

/**
 * Wrapper component that conditionally renders either the legacy or refactored DetailPanel
 * based on the feature flag setting
 */
export const DetailPanelWrapper: React.FC<DetailPanelWrapperProps> = (props) => {
  const useRefactored = useFeatureFlag('USE_REFACTORED_DETAIL_PANEL');

  // Handle null entity case
  if (!props.entity) {
    return null;
  }

  if (useRefactored) {
    // Adapt props for refactored version
    const refactoredProps = {
      entity: props.entity,
      entityType: props.entityType,
      onClose: props.onClose,
      onSave: async (entity: Entity) => {
        if (props.onSave) {
          // Convert full entity to partial updates
          const updates: Partial<Entity> = {};
          Object.keys(entity).forEach((key) => {
            if (entity[key as keyof Entity] !== props.entity![key as keyof Entity]) {
              updates[key as keyof Entity] = entity[key as keyof Entity];
            }
          });
          await props.onSave(updates);
        }
      },
      isLoading: props.isLoading || props.isSaving,
    };
    return <DetailPanelRefactored {...refactoredProps} />;
  }

  // Use legacy DetailPanel
  return <DetailPanel {...props} />;
};

export default DetailPanelWrapper;