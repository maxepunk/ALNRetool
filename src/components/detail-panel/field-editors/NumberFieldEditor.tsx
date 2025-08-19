import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FieldEditorProps } from './types';

export const NumberFieldEditor: React.FC<FieldEditorProps<number>> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={field.key}
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? 0 : Number(val));
        }}
        onBlur={onBlur}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        step={field.step}
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