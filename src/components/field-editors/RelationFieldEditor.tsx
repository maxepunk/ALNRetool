/**
 * Relation Field Editor - Simplified UI
 * 
 * Uses a consistent UI pattern similar to basic field types:
 * - Select dropdown for single relations
 * - Badge-based multi-select for multiple relations
 * - Simple and intuitive interface
 */

import React, { useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FieldEditorProps } from './types';
import { formatErrorMessage } from '@/utils/fieldValidation';
import { useCreationStore } from '@/stores/creationStore';
import type {
  Character,
  Element,
  Puzzle,
  TimelineEvent,
} from '@/types/notion/app';

// Extended props for relation fields
interface RelationFieldEditorProps extends FieldEditorProps {
  entityType?: 'character' | 'element' | 'puzzle' | 'timeline';
  multiple?: boolean; // true for relation, false for relation-single
}

// Helper to find entity by ID across all entity types
const findEntityById = (
  id: string,
  entities?: {
    characters?: Character[];
    elements?: Element[];
    puzzles?: Puzzle[];
    timeline?: TimelineEvent[];
  },
  entityType?: 'character' | 'element' | 'puzzle' | 'timeline'
): any => {
  if (!entities || !entityType) return undefined;
  
  switch (entityType) {
    case 'character':
      return entities.characters?.find(c => c.id === id);
    case 'element':
      return entities.elements?.find(e => e.id === id);
    case 'puzzle':
      return entities.puzzles?.find(p => p.id === id);
    case 'timeline':
      return entities.timeline?.find(t => t.id === id);
    default:
      return undefined;
  }
};

// Get all entities of a specific type
const getEntitiesOfType = (
  entities?: RelationFieldEditorProps['allEntities'],
  entityType?: 'character' | 'element' | 'puzzle' | 'timeline'
): any[] => {
  if (!entities || !entityType) return [];
  
  switch (entityType) {
    case 'character':
      return entities.characters || [];
    case 'element':
      return entities.elements || [];
    case 'puzzle':
      return entities.puzzles || [];
    case 'timeline':
      return entities.timeline || [];
    default:
      return [];
  }
};

export const RelationFieldEditor: React.FC<RelationFieldEditorProps> = ({
  field,
  value,
  onChange,
  error,
  disabled,
  isFocused,
  allEntities,
  entityType,
  multiple = true,
}) => {
  const { openCreatePanel } = useCreationStore();
  
  // Determine if this is a multi-relation or single-relation field
  const isMultiple = field.type === 'relation' || multiple;

  // Format error message consistently
  const displayError = error ? formatErrorMessage(error) : undefined;
  
  // Parse value into array of IDs (normalized to strings)
  const selectedIds = useMemo(() => {
    if (!value) return [];
    const rawIds = isMultiple 
      ? (Array.isArray(value) ? value : [])
      : (value ? [value] : []);
    return rawIds.map(id => String(id));
  }, [value, isMultiple]);

  // Get available entities for selection with deduplication
  const targetType = (field as any).entityType || entityType;
  const availableEntities = useMemo(() => {
    const list = getEntitiesOfType(allEntities, targetType) || [];
    const byId = new Map<string, any>();
    for (const entity of list) {
      const id = String(entity?.id || '');
      if (id && !byId.has(id)) {
        byId.set(id, entity);
      }
    }
    return Array.from(byId.values());
  }, [allEntities, targetType]);

  // Get selected entities
  const selectedEntities = useMemo(() => {
    return selectedIds
      .map(id => findEntityById(id, allEntities, targetType))
      .filter(Boolean);
  }, [selectedIds, allEntities, targetType]);

  // Get current entity context from field metadata (will be passed from DetailPanel)
  const currentEntityId = (field as any).currentEntityId;
  const currentEntityType = (field as any).currentEntityType;
  
  // Handle entity selection
  const handleSelect = useCallback((value: string) => {
    if (disabled || field.readOnly) return;

    // Check if this is the "create new" option
    if (value === 'create-new') {
      if (targetType) {
        openCreatePanel(targetType, {
          sourceComponent: 'relation-field',
          relationFieldKey: field.key,
          parentEntityId: currentEntityId,
          parentEntityType: currentEntityType
        });
      }
      return;
    }

    // Normalize the value to string for consistent comparison
    const normalizedValue = String(value);
    
    if (isMultiple) {
      // Multi-select: add if not already selected
      if (!selectedIds.includes(normalizedValue)) {
        // When saving, preserve the original format of the field
        const newIds = [...selectedIds.map(id => id), normalizedValue];
        onChange(newIds);
      }
    } else {
      // Single-select: replace selection
      onChange(normalizedValue);
    }
  }, [selectedIds, onChange, disabled, field.readOnly, isMultiple, targetType, currentEntityId, currentEntityType, openCreatePanel, field.key]);

  // Handle entity removal
  const handleRemove = useCallback((entityId: string) => {
    if (disabled || field.readOnly) return;

    const normalizedId = String(entityId);
    
    if (isMultiple) {
      const newIds = selectedIds.filter(id => id !== normalizedId);
      onChange(newIds);
    } else {
      onChange(null);
    }
  }, [selectedIds, onChange, disabled, field.readOnly, isMultiple]);

  // Get unselected entities for the dropdown with normalized ID comparison
  const unselectedEntities = useMemo(() => {
    const byId = new Map<string, any>();
    for (const entity of availableEntities) {
      const id = String(entity?.id || '');
      if (id && !selectedIds.includes(id) && !byId.has(id)) {
        byId.set(id, entity);
      }
    }
    return Array.from(byId.values());
  }, [availableEntities, selectedIds]);

  // Render read-only state
  if (field.readOnly) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {field.label}
          <span className="text-muted-foreground text-xs ml-2">(computed)</span>
        </Label>
        <div className="min-h-[2.5rem] p-2 bg-white/5 border border-white/10 rounded-md">
          {selectedEntities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedEntities.map((entity) => (
                <Badge
                  key={entity.id}
                  variant="secondary"
                  className="text-xs cursor-default opacity-80"
                >
                  {entity.name || entity.description || `ID: ${entity.id.slice(0, 8)}...`}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">No relationships</span>
          )}
        </div>
        {field.helperText && (
          <p className="text-xs text-muted-foreground">{field.helperText}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-2 transition-all",
      isFocused && "scale-[1.02]"
    )}>
      <Label htmlFor={field.key} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
        {!isMultiple && <span className="text-muted-foreground text-xs ml-2">(single)</span>}
      </Label>

      {/* Selected items display */}
      {selectedEntities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedEntities.map((entity) => (
            <Badge
              key={entity.id}
              variant="outline"
              className="pr-1 hover:bg-white/10 transition-colors"
            >
              <span className="mr-1">
                {entity.name || entity.description || `ID: ${entity.id.slice(0, 8)}...`}
              </span>
              <button
                onClick={() => handleRemove(entity.id)}
                disabled={disabled}
                className="ml-1 hover:bg-white/20 rounded p-0.5 transition-colors disabled:opacity-50"
                aria-label={`Remove ${entity.name || entity.description || entity.id}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Select dropdown for adding new items - always rendered but hidden when not needed */}
      <Select
        value=""
        onValueChange={handleSelect}
        disabled={disabled || !((isMultiple || selectedEntities.length === 0) && unselectedEntities.length > 0)}
        className={cn(
          "bg-white/5 border-white/10 focus:border-white/20",
          !((isMultiple || selectedEntities.length === 0) && unselectedEntities.length > 0) && "hidden"
        )}
      >
        <option key="__placeholder__" value="" disabled>
          {isMultiple 
            ? `Add ${field.label.toLowerCase()}...` 
            : field.placeholder || `Select ${field.label.toLowerCase()}...`}
        </option>
        {unselectedEntities.map((entity) => {
          const id = String(entity.id);
          return (
            <option key={`opt-${id}`} value={id}>
              {entity.name || entity.description || `ID: ${id.slice(0, 8)}...`}
            </option>
          );
        })}
        {/* Add "Create new" option */}
        {targetType && (
          <option key="__create-new__" value="create-new" className="text-primary">
            + Create new {targetType}
          </option>
        )}
      </Select>

      {/* Empty state for single relation when one is selected */}
      {!isMultiple && selectedEntities.length > 0 && unselectedEntities.length === 0 && (
        <div className="text-sm text-muted-foreground">
          All available options are selected
        </div>
      )}

      {/* Helper text */}
      {field.helperText && (
        <p className="text-xs text-muted-foreground">{field.helperText}</p>
      )}

      {/* Error message */}
      {displayError && (
        <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
          {displayError}
        </p>
      )}
    </div>
  );
};