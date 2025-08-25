/**
 * Relation Field Editor with Search and Multi-select
 * 
 * Supports both single and multiple relation selection with:
 * - Search/filter functionality
 * - Add/remove capabilities
 * - Entity type awareness
 * - Loading states
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { X, Search, Plus, Check, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { FieldEditorProps } from './types';
import type {
  Character,
  Element,
  Puzzle,
  TimelineEvent,
} from '@/types/notion/app';

// Extended props for relation fields
interface RelationFieldEditorProps extends FieldEditorProps {
  entityType?: 'character' | 'element' | 'puzzle' | 'timeline';
  searchable?: boolean;
  allowCreate?: boolean;
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
  searchable = true,
  allowCreate = false,
  multiple = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Determine if this is a multi-relation or single-relation field
  const isMultiple = field.type === 'relation' || multiple;
  
  // Parse value into array of IDs
  const selectedIds = useMemo(() => {
    if (!value) return [];
    if (isMultiple) {
      return Array.isArray(value) ? value : [];
    } else {
      // Single relation - value is a single ID
      return value ? [value] : [];
    }
  }, [value, isMultiple]);

  // Get available entities for selection
  const availableEntities = useMemo(() => {
    const targetType = (field as any).entityType || entityType;
    return getEntitiesOfType(allEntities, targetType);
  }, [allEntities, entityType, field]);

  // Filter entities based on search - memoized for performance
  const filteredEntities = useMemo(() => {
    if (!searchTerm) return availableEntities;
    
    const term = searchTerm.toLowerCase();
    return availableEntities.filter(entity => {
      const name = entity.name || entity.description || '';
      return name.toLowerCase().includes(term);
    });
  }, [availableEntities, searchTerm]);

  // Get selected entities
  const selectedEntities = useMemo(() => {
    const targetType = (field as any).entityType || entityType;
    return selectedIds
      .map(id => findEntityById(id, allEntities, targetType))
      .filter(Boolean);
  }, [selectedIds, allEntities, entityType, field]);

  // Handle entity selection
  const handleSelect = useCallback((entityId: string) => {
    if (disabled || field.readOnly) return;

    if (isMultiple) {
      // Multi-select: toggle selection
      const newIds = selectedIds.includes(entityId)
        ? selectedIds.filter(id => id !== entityId)
        : [...selectedIds, entityId];
      onChange(newIds);
    } else {
      // Single-select: replace selection
      onChange(entityId);
      setIsOpen(false);
    }
  }, [selectedIds, onChange, disabled, field.readOnly, isMultiple]);

  // Handle entity removal
  const handleRemove = useCallback((entityId: string) => {
    if (disabled || field.readOnly) return;

    if (isMultiple) {
      const newIds = selectedIds.filter(id => id !== entityId);
      onChange(newIds);
    } else {
      onChange(null);
    }
  }, [selectedIds, onChange, disabled, field.readOnly, isMultiple]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    if (disabled || field.readOnly) return;
    onChange(isMultiple ? [] : null);
  }, [onChange, disabled, field.readOnly, isMultiple]);

  // Focus search when popover opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Render read-only state
  if (field.readOnly) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {field.label}
          <span className="text-muted-foreground text-xs ml-2">(computed)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {selectedEntities.length > 0 ? (
            selectedEntities.map((entity) => (
              <Badge
                key={entity.id}
                variant="secondary"
                className="text-xs cursor-default opacity-80"
              >
                {entity.name || entity.description || `ID: ${entity.id.slice(0, 8)}...`}
              </Badge>
            ))
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
      <div className="min-h-[2.5rem] p-2 bg-white/5 border border-white/10 rounded-md">
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
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(entity.id)}
                disabled={disabled}
                aria-label={`Remove ${entity.name || entity.description || entity.id}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {selectedEntities.length === 0 && (
            <span className="text-muted-foreground text-sm">
              {field.placeholder || `Select ${field.label.toLowerCase()}...`}
            </span>
          )}
        </div>
      </div>

      {/* Search and select popover */}
      {searchable && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger>
            <Button
              variant="outline"
              className="w-full justify-between bg-white/5 border-white/10 hover:bg-white/10"
              disabled={disabled}
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                {isMultiple ? 'Add items' : 'Select item'}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-80 p-2 bg-gray-900/95 border-white/20" align="start">
            {/* Search input */}
            <div className="flex items-center gap-2 p-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder={`Search ${field.label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 flex-1"
                aria-label={`Search ${field.label}`}
                aria-describedby={`${field.key}-search-description`}
              />
            </div>
            
            {/* Entity list */}
            <div className="max-h-60 overflow-y-auto" role="listbox" aria-label={`${field.label} options`}>
              {filteredEntities.length > 0 ? (
                <div className="space-y-1 p-1">
                  {filteredEntities.map((entity) => {
                    const isSelected = selectedIds.includes(entity.id);
                    return (
                      <button
                        key={entity.id}
                        onClick={() => handleSelect(entity.id)}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded text-sm",
                          "hover:bg-accent hover:text-accent-foreground",
                          "flex items-center justify-between",
                          isSelected && "bg-accent/50"
                        )}
                        aria-selected={isSelected}
                        aria-label={`${isSelected ? 'Deselect' : 'Select'} ${entity.name || entity.description || entity.id}`}
                        role="option"
                      >
                        <span className="truncate">
                          {entity.name || entity.description || `ID: ${entity.id.slice(0, 8)}...`}
                        </span>
                        {isSelected && <Check className="h-3 w-3 ml-2 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  {searchTerm ? 'No matches found' : 'No items available'}
                </div>
              )}
            </div>

            {/* Actions */}
            {(selectedIds.length > 0 || allowCreate) && (
              <div className="border-t pt-2 px-2 flex gap-2">
                {selectedIds.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearAll}
                    className="flex-1"
                  >
                    Clear all
                  </Button>
                )}
                {allowCreate && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create new
                  </Button>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* Helper text */}
      {field.helperText && (
        <p className="text-xs text-muted-foreground">{field.helperText}</p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};