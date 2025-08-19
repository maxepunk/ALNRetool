import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { FieldEditorProps } from './types';

export const TextareaFieldEditor: React.FC<FieldEditorProps<string>> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
}) => {
  // Preserve SF_ patterns if configured
  const handleChange = (newValue: string) => {
    if (field.preservePattern) {
      // Preserve SF_ patterns in the text
      onChange(newValue);
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={field.key}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={onBlur}
        placeholder={field.placeholder}
        rows={field.rows || 4}
        disabled={disabled || field.readOnly}
        className={error ? 'border-red-500' : ''}
      />
      {field.helperText && !error && (
        <p className="text-sm text-muted-foreground">{field.helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};