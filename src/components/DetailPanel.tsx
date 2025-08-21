/**
 * Refactored Detail Panel Component
 * 
 * Uses the comprehensive field registry and modular field editors
 * to enable editing of ALL fields across all entity types
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Save, XCircle, ChevronDown, ChevronRight, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
// Removed unused animation imports
import { useGraphAnimation } from '@/contexts/GraphAnimationContext';
import { FieldEditor } from '@/components/field-editors';
import { getFieldsByCategory } from '@/config/fieldRegistry';
import type {
  Character,
  Element,
  Puzzle,
  TimelineEvent,
} from '@/types/notion/app';
import {
  useUpdateCharacter,
  useUpdateElement,
  useUpdatePuzzle,
  useUpdateTimelineEvent,
  validateUpdates,
} from '@/hooks/mutations';

// Entity type union
type Entity = Character | Element | Puzzle | TimelineEvent;

// Collapsible section component
interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  badge?: string;
}

const CollapsibleSection: React.FC<SectionProps> = ({ 
  title, 
  children, 
  defaultOpen = true,
  onMouseEnter,
  onMouseLeave,
  badge
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div 
      className="space-y-3"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left hover:text-foreground/80 transition-colors"
      >
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {badge && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {badge}
          </Badge>
        )}
      </button>
      {isOpen && <div className="space-y-4 pl-6">{children}</div>}
    </div>
  );
};

interface DetailPanelProps {
  entity: Entity | null;
  entityType: 'character' | 'element' | 'puzzle' | 'timeline';
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

export const DetailPanelRefactored: React.FC<DetailPanelProps> = ({
  entity,
  entityType,
  onClose,
  onSave,
  isLoading,
  isSaving: externalIsSaving,
  error: externalError,
  allEntities,
}) => {
  const [formData, setFormData] = useState<Partial<Entity>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Animation state
  const [isEntering, setIsEntering] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasValidationError, setHasValidationError] = useState(false);

  // Graph animation context
  const graphAnimation = useGraphAnimation();

  // Get appropriate mutation hook based on entity type
  const updateCharacter = useUpdateCharacter();
  const updateElement = useUpdateElement();
  const updatePuzzle = useUpdatePuzzle();
  const updateTimeline = useUpdateTimelineEvent();

  // Select the right mutation based on entity type
  const mutation = useMemo(() => {
    switch (entityType) {
      case 'character':
        return updateCharacter;
      case 'element':
        return updateElement;
      case 'puzzle':
        return updatePuzzle;
      case 'timeline':
        return updateTimeline;
      default:
        return null;
    }
  }, [entityType, updateCharacter, updateElement, updatePuzzle, updateTimeline]);

  // Combine external and internal saving states
  const isSaving = externalIsSaving || mutation?.isPending || false;
  const error = externalError || mutation?.error?.message;

  // Get field configurations from registry
  const fieldsByCategory = useMemo(() => {
    return {
      basic: getFieldsByCategory(entityType, 'basic'),
      details: getFieldsByCategory(entityType, 'details'),
      relations: getFieldsByCategory(entityType, 'relations'),
      metadata: getFieldsByCategory(entityType, 'metadata'),
    };
  }, [entityType]);

  // Count editable vs read-only fields
  const fieldStats = useMemo(() => {
    const allFields = [
      ...fieldsByCategory.basic,
      ...fieldsByCategory.details,
      ...fieldsByCategory.relations,
      ...fieldsByCategory.metadata,
    ];
    const editable = allFields.filter(f => !f.readOnly).length;
    const total = allFields.length;
    return { editable, total, percentage: Math.round((editable / total) * 100) };
  }, [fieldsByCategory]);

  // Initialize form data when entity changes
  useEffect(() => {
    if (entity) {
      setFormData({ ...entity });
      setIsDirty(false);
      setValidationErrors({});
      setIsEntering(true);
      setIsExiting(false);
      setSaveSuccess(false);
      setHasValidationError(false);
    }
  }, [entity]);

  // Handle entrance animation
  useEffect(() => {
    if (isEntering) {
      const timer = setTimeout(() => {
        setIsEntering(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isEntering]);

  // Handle save success animation
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Handle validation error animation
  useEffect(() => {
    if (hasValidationError) {
      const timer = setTimeout(() => {
        setHasValidationError(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hasValidationError]);

  // Handle field changes
  const handleFieldChange = useCallback((key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setIsDirty(true);
    
    // Clear validation error for this field
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const allFields = [
      ...fieldsByCategory.basic,
      ...fieldsByCategory.details,
      ...fieldsByCategory.relations,
      ...fieldsByCategory.metadata,
    ];
    
    allFields.forEach((field) => {
      if (field.readOnly) return; // Skip read-only fields
      
      const currentValue = formData[field.key as keyof Entity];
      const originalValue = entity ? entity[field.key as keyof Entity] : undefined;
      
      // Only validate required fields if they were changed from non-empty to empty
      if (field.required) {
        const isCurrentlyEmpty = !currentValue || (typeof currentValue === 'string' && currentValue.trim() === '');
        const wasOriginallyEmpty = !originalValue || (typeof originalValue === 'string' && originalValue.trim() === '');
        
        if (isCurrentlyEmpty && !wasOriginallyEmpty) {
          errors[field.key] = `${field.label} is required`;
        }
      }
      
      // URL validation
      if (field.type === 'url' && formData[field.key as keyof Entity]) {
        const urlValue = formData[field.key as keyof Entity] as string;
        try {
          new URL(urlValue);
        } catch {
          errors[field.key] = 'Please enter a valid URL';
        }
      }
    });
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setHasValidationError(true);
    }
    
    return Object.keys(errors).length === 0;
  }, [fieldsByCategory, formData, entity]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!entity || !mutation) {
      return;
    }

    // Only send changed fields
    const changes: Partial<Entity> = {};
    Object.keys(formData).forEach((key) => {
      if (formData[key as keyof Entity] !== entity[key as keyof Entity]) {
        changes[key as keyof Entity] = formData[key as keyof Entity];
      }
    });
    
    if (Object.keys(changes).length === 0) {
      return; // No changes to save
    }

    // Validate updates using the utility function
    const validationError = validateUpdates(changes, entityType as any);
    if (validationError) {
      setValidationErrors({ _form: validationError });
      return;
    }

    try {
      // Use mutation if available, otherwise fallback to onSave prop
      if (mutation) {
        await mutation.mutateAsync({ 
          id: entity.id, 
          updates: changes 
        });
        setIsDirty(false);
        setSaveSuccess(true);
      } else if (onSave) {
        await onSave(changes);
        setIsDirty(false);
        setSaveSuccess(true);
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
      setHasValidationError(true);
    }
  }, [formData, entity, mutation, onSave, validateForm, entityType]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (entity) {
      setFormData({ ...entity });
      setIsDirty(false);
      setValidationErrors({});
    }
  }, [entity]);

  if (!entity) {
    return null;
  }

  // Get entity display information
  const getEntityIcon = () => {
    switch (entityType) {
      case 'character':
        return '👤';
      case 'element':
        return '📦';
      case 'puzzle':
        return '🧩';
      case 'timeline':
        return '📅';
      default:
        return '📄';
    }
  };

  const getEntityTypeName = () => {
    return entityType.charAt(0).toUpperCase() + entityType.slice(1);
  };

  return (
    <div className={cn(
      "w-96 h-full bg-white/10 backdrop-blur-md border-l border-white/20 flex flex-col",
      isEntering && "animate-in slide-in-from-right duration-300",
      isExiting && "animate-out slide-out-to-right duration-200",
      saveSuccess && "ring-2 ring-green-500/20",
      hasValidationError && "animate-shake"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getEntityIcon()}</span>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {getEntityTypeName()} Details
            </h3>
            <p className="text-xs text-muted-foreground">
              {fieldStats.editable}/{fieldStats.total} fields editable ({fieldStats.percentage}%)
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Error display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Basic Information Section */}
            {fieldsByCategory.basic.length > 0 && (
              <CollapsibleSection 
                title="Basic Information" 
                defaultOpen={true}
                onMouseEnter={() => {
                  if (entity && graphAnimation) {
                    graphAnimation.onNodeHoverStart(entity.id);
                  }
                }}
                onMouseLeave={() => {
                  if (graphAnimation) {
                    graphAnimation.onNodeHoverEnd(entity.id);
                  }
                }}
              >
                {fieldsByCategory.basic.map((field) => (
                  <FieldEditor
                    key={field.key}
                    field={field}
                    value={formData[field.key as keyof Entity]}
                    onChange={(value) => handleFieldChange(field.key, value)}
                    error={validationErrors[field.key]}
                    disabled={isSaving}
                    onFocus={setFocusedField}
                    onBlur={() => setFocusedField(null)}
                    isFocused={focusedField === field.key}
                    allEntities={allEntities}
                    entityType={entityType}
                  />
                ))}
              </CollapsibleSection>
            )}

            {/* Details Section */}
            {fieldsByCategory.details.length > 0 && (
              <>
                <Separator className="bg-white/10" />
                <CollapsibleSection 
                  title="Additional Details" 
                  defaultOpen={false}
                  badge={`${fieldsByCategory.details.filter(f => !f.readOnly).length} editable`}
                >
                  {fieldsByCategory.details.map((field) => (
                    <FieldEditor
                      key={field.key}
                      field={field}
                      value={formData[field.key as keyof Entity]}
                      onChange={(value) => handleFieldChange(field.key, value)}
                      error={validationErrors[field.key]}
                      disabled={isSaving}
                      onFocus={setFocusedField}
                      onBlur={() => setFocusedField(null)}
                      isFocused={focusedField === field.key}
                      allEntities={allEntities}
                      entityType={entityType}
                    />
                  ))}
                </CollapsibleSection>
              </>
            )}

            {/* Relations Section */}
            {fieldsByCategory.relations.length > 0 && (
              <>
                <Separator className="bg-white/10" />
                <CollapsibleSection 
                  title="Relationships" 
                  defaultOpen={false}
                  badge={`${fieldsByCategory.relations.filter(f => !f.readOnly).length} editable`}
                >
                  {fieldsByCategory.relations.map((field) => (
                    <FieldEditor
                      key={field.key}
                      field={field}
                      value={formData[field.key as keyof Entity]}
                      onChange={(value) => handleFieldChange(field.key, value)}
                      error={validationErrors[field.key]}
                      disabled={isSaving}
                      onFocus={setFocusedField}
                      onBlur={() => setFocusedField(null)}
                      isFocused={focusedField === field.key}
                      allEntities={allEntities}
                      entityType={entityType}
                    />
                  ))}
                </CollapsibleSection>
              </>
            )}

            {/* Metadata Section */}
            <Separator className="bg-white/10" />
            <CollapsibleSection title="Metadata" defaultOpen={false}>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entity Type:</span>
                  <Badge variant="outline">{getEntityTypeName()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <code className="text-xs bg-white/5 px-2 py-1 rounded">
                    {entity.id}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fields:</span>
                  <span className="text-xs">
                    {fieldStats.editable} editable / {fieldStats.total - fieldStats.editable} computed
                  </span>
                </div>
                {'lastEditedTime' in entity && entity.lastEditedTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Modified:</span>
                    <span className="text-xs">
                      {new Date(entity.lastEditedTime as string).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </>
        )}
      </div>

      {/* Footer with actions */}
      {onSave && (
        <div className="border-t border-white/10 p-4 flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={!isDirty || isSaving}
            className="flex-1 bg-white/5 border-white/10 hover:bg-white/10"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(
              "flex-1 transition-all",
              saveSuccess 
                ? "bg-green-500/20 hover:bg-green-500/30" 
                : "bg-primary/20 hover:bg-primary/30",
              hasValidationError && "animate-shake"
            )}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : saveSuccess ? (
              <Check className="h-4 w-4 mr-2 animate-in zoom-in" />
            ) : hasValidationError ? (
              <AlertCircle className="h-4 w-4 mr-2 animate-pulse" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : hasValidationError ? 'Fix Errors' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DetailPanelRefactored;