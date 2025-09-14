/**
 * Relation Field Editor - Simplified UI
 * 
 * Uses a consistent UI pattern similar to basic field types:
 * - Select dropdown for single relations
 * - Badge-based multi-select for multiple relations
 * - Simple and intuitive interface
 */

import React, { useMemo, useCallback, useState } from 'react';
import { X, Link2, ExternalLink, Check, ChevronsUpDown, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/stores/filterStore';
import type { FieldEditorProps, Entity } from './types';
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
  currentEntityType?: 'character' | 'element' | 'puzzle' | 'timeline'; // Type of the parent entity being edited
  onNavigate?: (entityId: string, entityType: string) => void; // Navigation callback
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
  currentEntityId,
  currentEntityType,
  onNavigate,
}) => {
  const { openCreatePanel } = useCreationStore();
  const setSelectedNode = useFilterStore(state => state.setSelectedNode);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // Handle navigation to related entity
  const handleNavigate = useCallback((entityId: string, entityType: string, event: React.MouseEvent) => {
    // Check for modifier keys
    const isMetaOrCtrl = event.metaKey || event.ctrlKey;
    
    if (onNavigate) {
      // Use custom navigation handler if provided
      onNavigate(entityId, entityType);
    } else if (isMetaOrCtrl) {
      // Cmd/Ctrl+Click: Could open in new panel (future feature)
      console.log('Open in new panel:', entityId, entityType);
    } else {
      // Regular click: Navigate in current panel by selecting the node
      setSelectedNode(entityId);
    }
  }, [onNavigate, setSelectedNode]);
  
  // Determine if this is a multi-relation or single-relation field
  const isMultiple = field.type === 'relation' || multiple;

  // Format error message consistently
  const displayError = error ? formatErrorMessage(error) : undefined;
  
  // Determine target entity type
  const targetType = field.entityType || entityType;
  
  // Parse value into array of IDs (normalized to strings)
  const selectedIds = useMemo(() => {
    if (!value) return [];
    const rawIds = isMultiple 
      ? (Array.isArray(value) ? value : [])
      : (value ? [value] : []);
    return rawIds.map(id => String(id));
  }, [value, isMultiple]);
  const availableEntities = useMemo(() => {
    const list = getEntitiesOfType(allEntities, targetType) || [];
    const byId = new Map<string, Entity>();
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
  
  // Save to recent selections
  const saveToRecent = useCallback((entityId: string) => {
    const storageKey = `recent_${entityType || targetType}_selections`;
    try {
      const recent = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updated = [entityId, ...recent.filter((id: string) => id !== entityId)].slice(0, 10);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  }, [entityType, targetType]);
  
  // Handle entity selection with recent tracking
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
      setOpen(false);
      return;
    }

    // Normalize the value to string for consistent comparison
    const normalizedValue = String(value);
    
    // Save to recent selections
    saveToRecent(normalizedValue);
    
    if (isMultiple) {
      // Multi-select: add if not already selected
      if (!selectedIds.includes(normalizedValue)) {
        const newIds = [...selectedIds, normalizedValue];
        onChange(newIds);
      }
    } else {
      // Single-select: replace selection
      onChange(normalizedValue);
      setOpen(false);
    }
    
    // Clear search after selection
    setSearchValue('');
    
    // Close popover for single select
    if (!isMultiple) {
      setOpen(false);
    }
  }, [selectedIds, onChange, disabled, field.readOnly, isMultiple, targetType, currentEntityId, currentEntityType, openCreatePanel, field.key, saveToRecent]);

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
    const byId = new Map<string, Entity>();
    for (const entity of availableEntities) {
      const id = String(entity?.id || '');
      if (id && !selectedIds.includes(id) && !byId.has(id)) {
        byId.set(id, entity);
      }
    }
    return Array.from(byId.values());
  }, [availableEntities, selectedIds]);
  
  // Helper to get entity description based on type
  const getEntityDescription = (entity: Entity): string => {
    if ('description' in entity && entity.description) {
      return entity.description;
    }
    if ('descriptionText' in entity && (entity as Element).descriptionText) {
      return (entity as Element).descriptionText;
    }
    if ('descriptionSolution' in entity && (entity as Puzzle).descriptionSolution) {
      return (entity as Puzzle).descriptionSolution;
    }
    return '';
  };

  // Filter entities based on search
  const filteredEntities = useMemo(() => {
    if (!searchValue) return unselectedEntities;
    
    const search = searchValue.toLowerCase();
    return unselectedEntities.filter(entity => {
      const name = (entity.name || '').toLowerCase();
      const description = getEntityDescription(entity).toLowerCase();
      return name.includes(search) || description.includes(search);
    });
  }, [unselectedEntities, searchValue]);
  
  // Get recent selections (last 5) from localStorage
  const recentSelections = useMemo(() => {
    const storageKey = `recent_${entityType || targetType}_selections`;
    try {
      const recent = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return recent
        .filter((id: string) => unselectedEntities.some(e => e.id === id))
        .slice(0, 5)
        .map((id: string) => unselectedEntities.find(e => e.id === id))
        .filter(Boolean);
    } catch {
      return [];
    }
  }, [unselectedEntities, entityType, targetType]);

  // Render read-only state
  if (field.readOnly) {
    return (
      <div data-testid={`field-${field.key}`} className="space-y-2">
        <Label className="text-sm font-medium">
          {field.label}
          <span className="text-muted-foreground text-xs ml-2">(computed)</span>
        </Label>
        <div className="min-h-[2.5rem] p-2 bg-white/5 border border-white/10 rounded-md">
          {selectedEntities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedEntities.map((entity) => {
                const targetType = field.entityType || entityType;
                return (
                  <TooltipProvider key={entity.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="text-xs cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            if (targetType) {
                              handleNavigate(entity.id, targetType, e);
                            }
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {entity.name || entity.description || `ID: ${entity.id.slice(0, 8)}...`}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View {entity.name || 'entity'} in graph</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
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
    <div 
      data-testid={`field-${field.key}`}
      className={cn(
      "space-y-2 transition-all",
      isFocused && "scale-[1.02]"
    )}>
      <Label htmlFor={field.key} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
        {!isMultiple && <span className="text-muted-foreground text-xs ml-2">(single)</span>}
      </Label>

      {/* Selected items display with navigation */}
      {selectedEntities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedEntities.map((entity) => {
            const targetType = field.entityType || entityType;
            return (
              <TooltipProvider key={entity.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="group pr-1 hover:bg-primary/10 transition-all cursor-pointer"
                      onClick={(e) => {
                        if (!disabled && targetType) {
                          e.stopPropagation();
                          handleNavigate(entity.id, targetType, e);
                        }
                      }}
                    >
                      <Link2 className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="mr-1">
                        {entity.name || entity.description || `ID: ${entity.id.slice(0, 8)}...`}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(entity.id);
                        }}
                        disabled={disabled}
                        className="ml-1 hover:bg-destructive/20 rounded p-0.5 transition-colors disabled:opacity-50"
                        aria-label={`Remove ${entity.name || entity.description || entity.id}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">Navigate to {entity.name || 'entity'}</p>
                      <p className="text-xs text-muted-foreground">
                        Click to view in graph
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ⌘/Ctrl+Click for new panel (coming soon)
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      )}

      {/* Searchable dropdown using Command component */}
      {((isMultiple || selectedEntities.length === 0) && (unselectedEntities.length > 0 || targetType)) && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            >
              <span className="text-muted-foreground">
                {isMultiple 
                  ? `Add ${field.label.toLowerCase()}...` 
                  : field.placeholder || `Select ${field.label.toLowerCase()}...`}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput 
                placeholder={`Search ${field.label.toLowerCase()}...`}
                value={searchValue}
                onValueChange={setSearchValue}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>
                  <div className="py-6 text-center text-sm">
                    <Search className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No {field.label.toLowerCase()} found.</p>
                    {targetType && (
                      <Button
                        variant="ghost"
                        className="mt-2"
                        onClick={() => handleSelect('create-new')}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create new {targetType}
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
                
                {/* Recent selections */}
                {recentSelections.length > 0 && !searchValue && (
                  <>
                    <CommandGroup heading="Recent">
                      {recentSelections.map((entity: any) => (
                        <CommandItem
                          key={`recent-${entity.id}`}
                          value={entity.id}
                          onSelect={() => handleSelect(entity.id)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedIds.includes(String(entity.id)) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {entity.name || `ID: ${entity.id.slice(0, 8)}...`}
                            </div>
                            {entity.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {entity.description}
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}
                
                {/* All available entities */}
                <CommandGroup heading={searchValue ? "Search Results" : "All"}>
                  {filteredEntities.map((entity: any) => (
                    <CommandItem
                      key={entity.id}
                      value={entity.id}
                      onSelect={() => handleSelect(entity.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedIds.includes(String(entity.id)) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {entity.name || `ID: ${entity.id.slice(0, 8)}...`}
                        </div>
                        {entity.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {entity.description}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                
                {/* Create new option */}
                {targetType && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        value="create-new"
                        onSelect={() => handleSelect('create-new')}
                        className="cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create new {targetType}
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

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