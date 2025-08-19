import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldEditorProps } from './types';

export const SelectFieldEditor: React.FC<FieldEditorProps<string>> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
}) => {
  if (!field.options) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select
        value={value || ''}
        onValueChange={onChange}
        disabled={disabled || field.readOnly}
      >
        <SelectTrigger 
          id={field.key}
          className={error ? 'border-red-500' : ''}
          onBlur={onBlur}
        >
          <SelectValue placeholder={field.placeholder || 'Select an option'} />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {field.helperText && !error && (
        <p className="text-sm text-muted-foreground">{field.helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};