import React, { useState, useCallback, useMemo } from 'react';
import { X, Save, XCircle, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type {
  Character,
  Element,
  Puzzle,
  TimelineEvent,
} from '@/types/notion/app';

// Entity type union
type Entity = Character | Element | Puzzle | TimelineEvent;

// Field editor types
type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'url' | 'relation';

interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readOnly?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  rows?: number;
  helperText?: string;
  preservePattern?: boolean; // For SF_ patterns
}

interface DetailPanelProps {
  entity: Entity | null;
  entityType: 'character' | 'element' | 'puzzle' | 'timeline';
  onClose: () => void;
  onSave?: (updates: Partial<Entity>) => Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
}

// Remove unused type guards - we use entityType prop instead

// Field configurations for each entity type
const CHARACTER_FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    options: [
      { value: 'Player', label: 'Player' },
      { value: 'NPC', label: 'NPC' },
    ],
  },
  {
    key: 'tier',
    label: 'Tier',
    type: 'select',
    required: true,
    options: [
      { value: 'Core', label: 'Core' },
      { value: 'Secondary', label: 'Secondary' },
      { value: 'Tertiary', label: 'Tertiary' },
    ],
  },
  { key: 'primaryAction', label: 'Primary Action', type: 'text' },
  { key: 'characterLogline', label: 'Character Logline', type: 'text' },
  { key: 'overview', label: 'Overview', type: 'textarea', rows: 4 },
  { key: 'emotionTowardsCEO', label: 'Emotion Towards CEO', type: 'text' },
];

const ELEMENT_FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  {
    key: 'descriptionText',
    label: 'Description',
    type: 'textarea',
    rows: 5,
    preservePattern: true,
    helperText: 'SF_ patterns will be preserved (e.g., SF_RFID:001, SF_VALUE:5)',
  },
  {
    key: 'basicType',
    label: 'Basic Type',
    type: 'select',
    required: true,
    options: [
      { value: 'Set Dressing', label: 'Set Dressing' },
      { value: 'Prop', label: 'Prop' },
      { value: 'Memory Token (Audio)', label: 'Memory Token (Audio)' },
      { value: 'Memory Token (Video)', label: 'Memory Token (Video)' },
      { value: 'Memory Token (Image)', label: 'Memory Token (Image)' },
      { value: 'Memory Token (Audio+Image)', label: 'Memory Token (Audio+Image)' },
      { value: 'Document', label: 'Document' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'Idea/Placeholder', label: 'Idea/Placeholder' },
      { value: 'in space playtest ready', label: 'In Space Playtest Ready' },
      { value: 'In development', label: 'In Development' },
      { value: 'Writing Complete', label: 'Writing Complete' },
      { value: 'Design Complete', label: 'Design Complete' },
      { value: 'Source Prop/print', label: 'Source Prop/Print' },
      { value: 'Ready for Playtest', label: 'Ready for Playtest' },
      { value: 'Done', label: 'Done' },
    ],
  },
  {
    key: 'firstAvailable',
    label: 'First Available',
    type: 'select',
    options: [
      { value: 'Act 0', label: 'Act 0' },
      { value: 'Act 1', label: 'Act 1' },
      { value: 'Act 2', label: 'Act 2' },
    ],
  },
  { key: 'productionNotes', label: 'Production Notes', type: 'textarea', rows: 3 },
  { key: 'contentLink', label: 'Content Link', type: 'url' },
];

const PUZZLE_FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'descriptionSolution', label: 'Description/Solution', type: 'textarea', rows: 4 },
  {
    key: 'timing',
    label: 'Timing',
    type: 'multiselect',
    options: [
      { value: 'Act 0', label: 'Act 0' },
      { value: 'Act 1', label: 'Act 1' },
      { value: 'Act 2', label: 'Act 2' },
    ],
  },
  { key: 'assetLink', label: 'Asset Link', type: 'url' },
];

const TIMELINE_FIELDS: FieldConfig[] = [
  { key: 'description', label: 'Description', type: 'textarea', rows: 3, required: true },
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'notes', label: 'Notes', type: 'textarea', rows: 3 },
];

// Collapsible section component
interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<SectionProps> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left hover:text-foreground/80 transition-colors"
      >
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </button>
      {isOpen && <div className="space-y-4 pl-6">{children}</div>}
    </div>
  );
};// Field Editor Components
interface FieldEditorProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, value, onChange, error, disabled }) => {
  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.key}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled || field.readOnly}
            className="bg-white/5 border-white/10 focus:border-white/20"
          />
          {field.helperText && (
            <p className="text-xs text-muted-foreground">{field.helperText}</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            id={field.key}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled || field.readOnly}
            rows={field.rows || 3}
            className="bg-white/5 border-white/10 focus:border-white/20 resize-none"
          />
          {field.helperText && (
            <p className="text-xs text-muted-foreground">{field.helperText}</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={disabled || field.readOnly}
          >
            <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/20">
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    case 'multiselect':
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <Badge
                  key={option.value}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-primary/20 hover:bg-primary/30'
                      : 'hover:bg-white/10',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => {
                    if (disabled || field.readOnly) return;
                    const newValues = isSelected
                      ? selectedValues.filter((v) => v !== option.value)
                      : [...selectedValues, option.value];
                    onChange(newValues);
                  }}
                >
                  {option.label}
                </Badge>
              );
            })}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    case 'date':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.key}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || field.readOnly}
            className="bg-white/5 border-white/10 focus:border-white/20"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    case 'url':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.key}
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'https://...'}
            disabled={disabled || field.readOnly}
            className="bg-white/5 border-white/10 focus:border-white/20"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    default:
      return null;
  }
};// Main DetailPanel Component
export const DetailPanel: React.FC<DetailPanelProps> = ({
  entity,
  entityType,
  onClose,
  onSave,
  isLoading,
  isSaving,
  error,
}) => {
  const [formData, setFormData] = useState<Partial<Entity>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get field configurations based on entity type
  const fieldConfigs = useMemo(() => {
    switch (entityType) {
      case 'character':
        return CHARACTER_FIELDS;
      case 'element':
        return ELEMENT_FIELDS;
      case 'puzzle':
        return PUZZLE_FIELDS;
      case 'timeline':
        return TIMELINE_FIELDS;
      default:
        return [];
    }
  }, [entityType]);

  // Initialize form data when entity changes
  useMemo(() => {
    if (entity) {
      setFormData({ ...entity });
      setIsDirty(false);
      setValidationErrors({});
    }
  }, [entity]);

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
    
    fieldConfigs.forEach((field) => {
      if (field.required && !formData[field.key as keyof Entity]) {
        errors[field.key] = `${field.label} is required`;
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
    return Object.keys(errors).length === 0;
  }, [fieldConfigs, formData]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    if (onSave && entity) {
      // Only send changed fields
      const changes: Partial<Entity> = {};
      Object.keys(formData).forEach((key) => {
        if (formData[key as keyof Entity] !== entity[key as keyof Entity]) {
          changes[key as keyof Entity] = formData[key as keyof Entity];
        }
      });
      
      if (Object.keys(changes).length > 0) {
        await onSave(changes);
        setIsDirty(false);
      }
    }
  }, [formData, entity, onSave, validateForm]);

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

  // Group fields by section
  const primaryFields = fieldConfigs.filter((f) => 
    ['name', 'type', 'tier', 'basicType', 'description', 'date'].includes(f.key)
  );
  const detailFields = fieldConfigs.filter((f) => !primaryFields.includes(f));

  return (
    <div className="w-96 h-full bg-white/10 backdrop-blur-md border-l border-white/20 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getEntityIcon()}</span>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {getEntityTypeName()} Details
            </h3>
            <p className="text-xs text-muted-foreground">ID: {entity.id}</p>
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

            {/* Primary Fields Section */}
            <CollapsibleSection title="Basic Information" defaultOpen={true}>
              {primaryFields.map((field) => (
                <FieldEditor
                  key={field.key}
                  field={field}
                  value={formData[field.key as keyof Entity]}
                  onChange={(value) => handleFieldChange(field.key, value)}
                  error={validationErrors[field.key]}
                  disabled={isSaving}
                />
              ))}
            </CollapsibleSection>

            {/* Detail Fields Section */}
            {detailFields.length > 0 && (
              <>
                <Separator className="bg-white/10" />
                <CollapsibleSection title="Additional Details" defaultOpen={false}>
                  {detailFields.map((field) => (
                    <FieldEditor
                      key={field.key}
                      field={field}
                      value={formData[field.key as keyof Entity]}
                      onChange={(value) => handleFieldChange(field.key, value)}
                      error={validationErrors[field.key]}
                      disabled={isSaving}
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
            className="flex-1 bg-primary/20 hover:bg-primary/30"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DetailPanel;