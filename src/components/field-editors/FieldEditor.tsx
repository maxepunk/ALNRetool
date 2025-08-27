/**
 * Unified Field Editor Component
 * 
 * Automatically selects the appropriate field editor based on field type
 * and provides consistent styling and behavior across all field types.
 * Central routing component that delegates to specialized field editors.
 * 
 * @module components/field-editors/FieldEditor
 * 
 * **Architecture:**
 * - Type-based routing to specialized editors
 * - Consistent validation and error display
 * - Focus management and animations
 * - Read-only field support
 * - Required field indicators
 * 
 * **Supported Field Types:**
 * - text: Single-line text input
 * - textarea: Multi-line text input
 * - select: Single selection dropdown
 * - multiselect: Multiple selection with badges
 * - checkbox: Boolean toggle
 * - number: Numeric input
 * - url: URL validation input
 * - email: Email validation input
 * - relation: Entity relationship selector
 * - array: Dynamic array editor
 * - files: File upload/display
 * 
 * **Features:**
 * - Automatic field type detection
 * - Validation error display
 * - Helper text support
 * - Focus state animations
 * - Disabled/readonly states
 * - Required field indicators
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { RelationFieldEditor } from './RelationFieldEditor';
import { ArrayFieldEditor } from './ArrayFieldEditor';
import { FilesFieldEditor } from './FilesFieldEditor';
import type { FieldEditorProps } from './types';

/**
 * Main FieldEditor component that routes to appropriate field type editor.
 * Acts as a factory component selecting the right editor based on field.type.
 * 
 * @component
 * @param {FieldEditorProps} props - Field editor configuration
 * @returns {JSX.Element | null} Appropriate field editor component
 * 
 * @example
 * <FieldEditor
 *   field={{ key: 'name', type: 'text', label: 'Name' }}
 *   value={entity.name}
 *   onChange={(value) => handleChange('name', value)}
 *   error={errors.name}
 * />
 */
export const FieldEditor: React.FC<FieldEditorProps> = (props) => {
  const {
    field,
    value,
    onChange,
    error,
    disabled,
    onFocus,
    onBlur,
    isFocused,
    entityType,
  } = props;

  /**
   * Format error message for consistent display.
   * Handles both string and Error object formats.
   */
  const displayError = error ? (typeof error === 'string' ? error : (error as any).message) : undefined;

  // Handle different field types with type-specific renderers
  switch (field.type) {
    case 'text':
      return (
        <div className={cn(
          "space-y-2 transition-all",
          isFocused && "scale-[1.02]"
        )}>
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
            {field.readOnly && <span className="text-muted-foreground text-xs ml-2">(computed)</span>}
          </Label>
          <Input
            id={field.key}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => onFocus?.(field.key)}
            onBlur={onBlur}
            placeholder={field.placeholder}
            disabled={disabled || field.readOnly}
            className={cn(
              "bg-white/5 border-white/10 focus:border-white/20 transition-all",
              isFocused && "ring-2 ring-primary/20",
              error && "border-destructive/50"
            )}
          />
          {field.helperText && (
            <p className="text-xs text-muted-foreground">{field.helperText}</p>
          )}
          {displayError && (
            <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
              {displayError}
            </p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div className={cn(
          "space-y-2 transition-all",
          isFocused && "scale-[1.02]"
        )}>
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
            {field.readOnly && <span className="text-muted-foreground text-xs ml-2">(computed)</span>}
          </Label>
          <Textarea
            id={field.key}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => onFocus?.(field.key)}
            onBlur={onBlur}
            placeholder={field.placeholder}
            disabled={disabled || field.readOnly}
            rows={field.rows || 3}
            className={cn(
              "bg-white/5 border-white/10 focus:border-white/20 resize-none transition-all",
              isFocused && "ring-2 ring-primary/20",
              error && "border-destructive/50"
            )}
          />
          {field.helperText && (
            <p className="text-xs text-muted-foreground">{field.helperText}</p>
          )}
          {displayError && (
            <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
              {displayError}
            </p>
          )}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
            {field.readOnly && <span className="text-muted-foreground text-xs ml-2">(computed)</span>}
          </Label>
          <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={disabled || field.readOnly}
            className="bg-white/5 border-white/10 focus:border-white/20"
          >
            {!value && (
              <SelectItem value="" disabled>
                {field.placeholder || `Select ${field.label}`}
              </SelectItem>
            )}
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
          {field.helperText && (
            <p className="text-xs text-muted-foreground">{field.helperText}</p>
          )}
          {displayError && <p className="text-xs text-destructive">{displayError}</p>}
        </div>
      );

    case 'multiselect':
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
            {field.readOnly && <span className="text-muted-foreground text-xs ml-2">(computed)</span>}
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
                    (disabled || field.readOnly) && 'opacity-50 cursor-not-allowed'
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
          {field.helperText && (
            <p className="text-xs text-muted-foreground">{field.helperText}</p>
          )}
          {displayError && <p className="text-xs text-destructive">{displayError}</p>}
        </div>
      );

    case 'date':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
            {field.readOnly && <span className="text-muted-foreground text-xs ml-2">(computed)</span>}
          </Label>
          <Input
            id={field.key}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || field.readOnly}
            className="bg-white/5 border-white/10 focus:border-white/20"
          />
          {field.helperText && (
            <p className="text-xs text-muted-foreground">{field.helperText}</p>
          )}
          {displayError && <p className="text-xs text-destructive">{displayError}</p>}
        </div>
      );

    case 'url':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
            {field.readOnly && <span className="text-muted-foreground text-xs ml-2">(computed)</span>}
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
          {field.helperText && (
            <p className="text-xs text-muted-foreground">{field.helperText}</p>
          )}
          {displayError && <p className="text-xs text-destructive">{displayError}</p>}
        </div>
      );

    case 'number':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
            {field.readOnly && <span className="text-muted-foreground text-xs ml-2">(computed)</span>}
          </Label>
          <Input
            id={field.key}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.valueAsNumber || e.target.value)}
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={disabled || field.readOnly}
            className="bg-white/5 border-white/10 focus:border-white/20"
          />
          {field.helperText && (
            <p className="text-xs text-muted-foreground">{field.helperText}</p>
          )}
          {displayError && <p className="text-xs text-destructive">{displayError}</p>}
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={!!value}
              onCheckedChange={onChange}
              disabled={disabled || field.readOnly}
            />
            <Label
              htmlFor={field.key}
              className={cn(
                "text-sm font-medium cursor-pointer",
                (disabled || field.readOnly) && "cursor-not-allowed opacity-50"
              )}
            >
              {field.label}
              {field.readOnly && <span className="text-muted-foreground text-xs ml-2">(computed)</span>}
            </Label>
          </div>
          {field.helperText && (
            <p className="text-xs text-muted-foreground ml-6">{field.helperText}</p>
          )}
          {error && <p className="text-xs text-destructive ml-6">{error}</p>}
        </div>
      );

    case 'relation':
      return (
        <RelationFieldEditor
          {...props}
          multiple={true}
          entityType={(field as any).entityType || entityType}
        />
      );

    case 'relation-single':
      return (
        <RelationFieldEditor
          {...props}
          multiple={false}
          entityType={(field as any).entityType || entityType}
        />
      );

    case 'array':
      return (
        <ArrayFieldEditor
          {...props}
          allowDuplicates={false}
        />
      );

    case 'files':
      return (
        <FilesFieldEditor
          {...props}
          maxFiles={10}
          maxSize={10 * 1024 * 1024} // 10MB
          acceptedTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif']}
        />
      );

    default:
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-destructive">
            Unknown field type: {field.type}
          </Label>
        </div>
      );
  }
};