import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldEditorProps } from './types';

export const MultiSelectFieldEditor: React.FC<FieldEditorProps<string[]>> = ({
  field,
  value = [],
  onChange,
  error,
  disabled = false,
}) => {
  if (!field.options) {
    return null;
  }

  const handleAdd = (newValue: string) => {
    if (!value.includes(newValue)) {
      onChange([...value, newValue]);
    }
  };

  const handleRemove = (valueToRemove: string) => {
    onChange(value.filter(v => v !== valueToRemove));
  };

  const availableOptions = field.options.filter(
    option => !value.includes(option.value)
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {/* Selected values */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((val) => {
            const option = field.options?.find(o => o.value === val);
            return (
              <Badge key={val} variant="secondary" className="gap-1">
                {option?.label || val}
                {!disabled && !field.readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-3 w-3 p-0 hover:bg-transparent"
                    onClick={() => handleRemove(val)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                )}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Selector for adding new values */}
      {availableOptions.length > 0 && !disabled && !field.readOnly && (
        <Select onValueChange={handleAdd}>
          <SelectTrigger 
            id={field.key}
            className={error ? 'border-red-500' : ''}
          >
            <SelectValue placeholder="Add an option..." />
          </SelectTrigger>
          <SelectContent>
            {availableOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.helperText && !error && (
        <p className="text-sm text-muted-foreground">{field.helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};