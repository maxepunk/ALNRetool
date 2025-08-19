import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { FieldEditorProps } from './types';

export const BooleanFieldEditor: React.FC<FieldEditorProps<boolean>> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={field.key} className="flex-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Switch
          id={field.key}
          checked={value || false}
          onCheckedChange={onChange}
          disabled={disabled || field.readOnly}
        />
      </div>
      {field.helperText && !error && (
        <p className="text-sm text-muted-foreground">{field.helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};