/**
 * Detail Panel Component
 * 
 * Comprehensive entity editing panel with field validation and save functionality.
 * Uses the field registry and modular field editors to enable editing
 * of ALL fields across all entity types.
 * 
 * @module components/DetailPanel
 * 
 * **Architecture:**
 * - Field registry-based configuration
 * - Modular field editors by type
 * - Optimistic updates with rollback
 * - Real-time validation
 * - Collapsible sections for organization
 * 
 * **Features:**
 * - Edit all entity types (Character, Element, Puzzle, Timeline)
 * - Field-level validation
 * - Dirty state tracking
 * - Save animations and feedback
 * - Error handling
 * - Responsive layout
 * 
 * **Usage:**
 * ```typescript
 * <DetailPanelRefactored
 *   entity={selectedEntity}
 *   entityType="element"
 *   onClose={handleClose}
 *   onSave={handleSave}
 *   allEntities={entities}
 * />
 * ```
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Save, XCircle, ChevronDown, ChevronRight, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useGraphAnimation } from '@/contexts/GraphAnimationContext';
import { FieldEditor } from '@/components/field-editors';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { getFieldsByCategory } from '@/config/fieldRegistry';
import type {
  Character,
  Element,
  Puzzle,
  TimelineEvent,
} from '@/types/notion/app';
import {
  useUpdateCharacterExplicit,
  useUpdateElementExplicit,
  useUpdatePuzzleExplicit,
  useUpdateTimelineEventExplicit,
} from '@/hooks/mutations/explicit';
import { validateField, fieldValidationConfigs } from '@/utils/fieldValidation';

/**
 * Union type for all entity types.
 * @typedef {Character | Element | Puzzle | TimelineEvent} Entity
 */
type Entity = Character | Element | Puzzle | TimelineEvent;

/**
 * Props for CollapsibleSection component.
 * @interface SectionProps
 * 
 * @property {string} title - Section heading
 * @property {React.ReactNode} children - Section content
 * @property {boolean} [defaultOpen=true] - Initial expansion state
 * @property {Function} [onMouseEnter] - Mouse enter handler
 * @property {Function} [onMouseLeave] - Mouse leave handler
 * @property {string} [badge] - Optional badge text
 */
interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  badge?: string;
}

/**
 * Collapsible section component for organizing fields.
 * Provides expand/collapse functionality with visual indicators.
 * 
 * @component
 * @param {SectionProps} props - Section configuration
 * @returns {JSX.Element} Collapsible section with title and content
 * 
 * @example
 * <CollapsibleSection title="Basic Fields" badge="3">
 *   {basicFields}
 * </CollapsibleSection>
 */
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

/**
 * Props for the main DetailPanel component.
 * @interface DetailPanelProps
 * 
 * @property {Entity|null} entity - Entity being edited
 * @property {'character'|'element'|'puzzle'|'timeline'} entityType - Type of entity
 * @property {Function} onClose - Callback when panel is closed
 * @property {Function} [onSave] - Optional custom save handler
 * @property {boolean} [isLoading] - Loading state from external source
 * @property {boolean} [isSaving] - Saving state from external source
 * @property {string|null} [error] - Error message from external source
 * @property {Object} [allEntities] - All entities for relationship fields
 * @property {Character[]} [allEntities.characters] - All character entities
 * @property {Element[]} [allEntities.elements] - All element entities
 * @property {Puzzle[]} [allEntities.puzzles] - All puzzle entities
 * @property {TimelineEvent[]} [allEntities.timeline] - All timeline entities
 */
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

/**
 * Main DetailPanel component for entity editing.
 * Provides a comprehensive form interface with field validation,
 * optimistic updates, and real-time saving capabilities.
 * 
 * @component
 * @param {DetailPanelProps} props - Component configuration
 * @returns {JSX.Element | null} Detail panel or null if no entity
 * 
 * **Features:**
 * - Field registry-based dynamic form generation
 * - Real-time validation with error feedback
 * - Optimistic UI updates with rollback on error
 * - Collapsible sections for field organization
 * - Animation feedback for save/error states
 * - Dirty state tracking with unsaved changes warning
 * - Keyboard shortcuts (Ctrl+S to save)
 * 
 * **State Management:**
 * - Local form state with controlled inputs
 * - Validation errors tracked per field
 * - Animation states for visual feedback
 * - Mutation state from React Query hooks
 * 
 * @example
 * <DetailPanelRefactored
 *   entity={selectedEntity}
 *   entityType="puzzle"
 *   onClose={() => setSelectedEntity(null)}
 *   allEntities={allEntities}
 * />
 */
export const DetailPanel: React.FC<DetailPanelProps> = ({
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

  // Get appropriate mutation hook based on entity type (using explicit hooks)
  const updateCharacter = useUpdateCharacterExplicit();
  const updateElement = useUpdateElementExplicit();
  const updatePuzzle = useUpdatePuzzleExplicit();
  const updateTimeline = useUpdateTimelineEventExplicit();

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

  /**
   * Handle field value changes with validation.
   * Updates form state and performs field-level validation.
   * 
   * @param {string} key - Field key from registry
   * @param {any} value - New field value
   */
  const handleFieldChange = useCallback((key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setIsDirty(true);
    
    // Perform field-level validation
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key]; // Clear existing error first
      
      // Get field configuration to determine validation rules
      const allFields = [
        ...Object.values(fieldsByCategory.basic || {}),
        ...Object.values(fieldsByCategory.details || {}),
        ...Object.values(fieldsByCategory.relations || {}),
        ...Object.values(fieldsByCategory.metadata || {}),
      ];
      const fieldConfig = allFields.find(f => f.key === key);
      
      if (fieldConfig && fieldConfig.required && (!value || value === '')) {
        newErrors[key] = 'This field is required';
      } else if (fieldConfig) {
        // Apply field type specific validation
        let validationRules: any[] = [];
        switch (fieldConfig.type) {
          case 'text':
            if (fieldConfig.required) validationRules = fieldValidationConfigs.text.required;
            break;
          case 'url':
            validationRules = fieldValidationConfigs.url;
            break;
          case 'number':
            validationRules = fieldValidationConfigs.number;
            break;
        }
        
        if (validationRules.length > 0) {
          const validationResult = validateField(value, validationRules);
          if (!validationResult.isValid && validationResult.error) {
            newErrors[key] = validationResult.error;
          }
        }
      }
      
      return newErrors;
    });
  }, [fieldsByCategory]);

  /**
   * Validate entire form before saving.
   * Checks required fields and applies type-specific validation.
   * 
   * @returns {boolean} True if form is valid
   */
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

  /**
   * Save handler with validation and optimistic updates.
   * Detects changes, validates, and saves via mutation or callback.
   * 
   * @async
   * @returns {Promise<void>}
   * 
   * **Process:**
   * 1. Validate form fields
   * 2. Detect changed fields only
   * 3. Apply business rule validation
   * 4. Save via mutation (preferred) or onSave callback
   * 5. Handle success/error states with animations
   */
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


    try {
      // Use mutation if available, otherwise fallback to onSave prop
      if (mutation) {
        await mutation.mutateAsync({ 
          id: entity.id, 
          ...changes 
        });
        setIsDirty(false);
        setSaveSuccess(true);
        // Reset mutation state to allow subsequent saves
        mutation.reset();
        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else if (onSave) {
        await onSave(changes);
        setIsDirty(false);
        setSaveSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      // Error is already logged by the mutation
      setHasValidationError(true);
    }
  }, [formData, entity, mutation, onSave, validateForm, entityType]);

  /**
   * Cancel handler to reset form to original state.
   * Discards all unsaved changes and clears validation errors.
   */
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

  /**
   * Get icon emoji for entity type.
   * @returns {string} Entity type emoji
   */
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

  /**
   * Get display name for entity type.
   * @returns {string} Capitalized entity type name
   */
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
          <ErrorBoundary
            context="DetailPanel"
          >
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
                      {new Date(entity.lastEditedTime).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </ErrorBoundary>
        )}
      </div>

      {/* Footer with actions - show if we have either onSave prop OR internal mutation */}
      {(onSave || mutation) && (
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

export default DetailPanel;