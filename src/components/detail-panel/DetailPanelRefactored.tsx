import React, { useMemo } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FieldGroup } from './FieldGroup';
import { FieldEditor } from './field-editors';
import { useEntityForm } from '@/hooks/detail-panel/useEntityForm';
import {
  CHARACTER_FIELD_GROUPS,
  ELEMENT_FIELD_GROUPS,
  PUZZLE_FIELD_GROUPS,
  TIMELINE_FIELD_GROUPS,
} from '@/config/entity-fields/index';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';
import type { FieldGroup as FieldGroupType } from '@/config/entity-fields/types';

type Entity = Character | Element | Puzzle | TimelineEvent;
type EntityType = 'character' | 'element' | 'puzzle' | 'timeline';

interface DetailPanelProps {
  entity: Entity;
  entityType: EntityType;
  onClose: () => void;
  onSave: (entity: Entity) => Promise<void>;
  isLoading?: boolean;
}

const FIELD_GROUPS_BY_TYPE: Record<EntityType, FieldGroupType[]> = {
  character: CHARACTER_FIELD_GROUPS,
  element: ELEMENT_FIELD_GROUPS,
  puzzle: PUZZLE_FIELD_GROUPS,
  timeline: TIMELINE_FIELD_GROUPS,
};

export const DetailPanelRefactored: React.FC<DetailPanelProps> = ({
  entity,
  entityType,
  onClose,
  onSave,
  isLoading = false,
}) => {
  // Get field groups for this entity type
  const fieldGroups = FIELD_GROUPS_BY_TYPE[entityType];
  
  // Flatten fields for form hook
  const allFields = useMemo(() => 
    fieldGroups.flatMap((group: FieldGroupType) => group.fields),
    [fieldGroups]
  );

  // Initialize form
  const {
    isDirty,
    isSubmitting,
    handleSubmit,
    getFieldProps,
    reset,
  } = useEntityForm({
    initialValues: entity,
    fields: allFields,
    onSubmit: async (values) => {
      await onSave(values as Entity);
      onClose();
    },
    validateOnBlur: true,
  });

  // Get entity display name
  const getEntityTitle = () => {
    switch (entityType) {
      case 'character':
        return `Character: ${entity.name}`;
      case 'element':
        return `Element: ${entity.name}`;
      case 'puzzle':
        return `Puzzle: ${entity.name}`;
      case 'timeline':
        return `Timeline Event: ${entity.name}`;
      default:
        return 'Entity Details';
    }
  };

  // Get entity type badge color
  const getEntityBadgeVariant = () => {
    switch (entityType) {
      case 'character':
        return 'default';
      case 'element':
        return 'secondary';
      case 'puzzle':
        return 'outline';
      case 'timeline':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-background border-l shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">{getEntityTitle()}</h2>
          <Badge variant={getEntityBadgeVariant() as any}>
            {entityType}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {fieldGroups.map((group: FieldGroupType, index: number) => (
            <div key={group.title}>
              {index > 0 && <Separator className="my-6" />}
              <FieldGroup
                title={group.title}
                collapsible={group.collapsible}
                defaultOpen={group.defaultOpen}
              >
                <div className="space-y-4">
                  {group.fields.map((field) => (
                    <FieldEditor
                      key={field.key}
                      field={field}
                      {...getFieldProps(field.key)}
                    />
                  ))}
                </div>
              </FieldGroup>
            </div>
          ))}
        </form>
      </div>

      {/* Footer */}
      <div className="border-t p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isDirty && 'You have unsaved changes'}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSubmit()}
              disabled={!isDirty || isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};