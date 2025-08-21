/**
 * Array Field Editor for String Arrays
 * 
 * Used for fields like narrativeThreads, storyReveals, etc.
 * Supports add/remove/edit of string values
 */

import React, { useState, useCallback, type KeyboardEvent } from 'react';
import { X, Plus, Edit2, Check, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { FieldEditorProps } from './types';

interface ArrayFieldEditorProps extends FieldEditorProps {
  allowDuplicates?: boolean;
  maxItems?: number;
  validateItem?: (value: string) => string | null; // Return error message or null
}

export const ArrayFieldEditor: React.FC<ArrayFieldEditorProps> = ({
  field,
  value,
  onChange,
  error,
  disabled,
  isFocused,
  allowDuplicates = false,
  maxItems,
  validateItem,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [itemError, setItemError] = useState<string | null>(null);

  // Parse value into array
  const items = Array.isArray(value) ? value : [];

  // Handle add new item
  const handleAdd = useCallback(() => {
    const trimmedValue = newItem.trim();
    
    if (!trimmedValue) {
      setItemError('Value cannot be empty');
      return;
    }

    // Check for duplicates
    if (!allowDuplicates && items.includes(trimmedValue)) {
      setItemError('This value already exists');
      return;
    }

    // Validate item if validator provided
    if (validateItem) {
      const error = validateItem(trimmedValue);
      if (error) {
        setItemError(error);
        return;
      }
    }

    // Check max items
    if (maxItems && items.length >= maxItems) {
      setItemError(`Maximum ${maxItems} items allowed`);
      return;
    }

    // Add the item
    onChange([...items, trimmedValue]);
    setNewItem('');
    setIsAdding(false);
    setItemError(null);
  }, [newItem, items, onChange, allowDuplicates, maxItems, validateItem]);

  // Handle remove item
  const handleRemove = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  }, [items, onChange]);

  // Handle edit item
  const handleEdit = useCallback((index: number) => {
    setEditingIndex(index);
    setEditingValue(items[index]);
  }, [items]);

  // Handle save edit
  const handleSaveEdit = useCallback(() => {
    const trimmedValue = editingValue.trim();
    
    if (!trimmedValue) {
      setItemError('Value cannot be empty');
      return;
    }

    // Check for duplicates (excluding current item)
    if (!allowDuplicates) {
      const duplicate = items.some((item, i) => 
        i !== editingIndex && item === trimmedValue
      );
      if (duplicate) {
        setItemError('This value already exists');
        return;
      }
    }

    // Validate item if validator provided
    if (validateItem) {
      const error = validateItem(trimmedValue);
      if (error) {
        setItemError(error);
        return;
      }
    }

    // Update the item
    const newItems = [...items];
    newItems[editingIndex!] = trimmedValue;
    onChange(newItems);
    
    setEditingIndex(null);
    setEditingValue('');
    setItemError(null);
  }, [editingValue, editingIndex, items, onChange, allowDuplicates, validateItem]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingValue('');
    setItemError(null);
  }, []);

  // Handle key press in input
  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action === 'add') {
        handleAdd();
      } else {
        handleSaveEdit();
      }
    } else if (e.key === 'Escape') {
      if (action === 'add') {
        setIsAdding(false);
        setNewItem('');
      } else {
        handleCancelEdit();
      }
      setItemError(null);
    }
  }, [handleAdd, handleSaveEdit, handleCancelEdit]);

  // Render read-only state
  if (field.readOnly) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {field.label}
          <span className="text-muted-foreground text-xs ml-2">(computed)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {items.length > 0 ? (
            items.map((item, index) => (
              <Badge
                key={`${field.key}-${index}`}
                variant="secondary"
                className="text-xs cursor-default opacity-80"
              >
                {item}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">No items</span>
          )}
        </div>
        {field.helperText && (
          <p className="text-xs text-muted-foreground">{field.helperText}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-2 transition-all",
      isFocused && "scale-[1.02]"
    )}>
      <Label htmlFor={field.key} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
        {maxItems && (
          <span className="text-muted-foreground text-xs ml-2">
            ({items.length}/{maxItems})
          </span>
        )}
      </Label>

      {/* Items display */}
      <div className="min-h-[2.5rem] p-2 bg-white/5 border border-white/10 rounded-md">
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <div key={`${field.key}-${index}`}>
              {editingIndex === index ? (
                // Edit mode
                <div className="flex items-center gap-1">
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, 'edit')}
                    className="h-7 w-32 text-xs"
                    autoFocus
                    disabled={disabled}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={handleSaveEdit}
                    disabled={disabled}
                  >
                    <Check className="h-3 w-3 text-green-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={handleCancelEdit}
                    disabled={disabled}
                  >
                    <XCircle className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ) : (
                // Display mode
                <Badge
                  variant="outline"
                  className="pr-1 hover:bg-white/10 transition-colors group"
                >
                  <span className="mr-1">{item}</span>
                  <div className="inline-flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent opacity-60 group-hover:opacity-100"
                      onClick={() => handleEdit(index)}
                      disabled={disabled}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent opacity-60 group-hover:opacity-100"
                      onClick={() => handleRemove(index)}
                      disabled={disabled}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </Badge>
              )}
            </div>
          ))}

          {/* Add new item */}
          {isAdding ? (
            <div className="flex items-center gap-1">
              <Input
                value={newItem}
                onChange={(e) => {
                  setNewItem(e.target.value);
                  setItemError(null);
                }}
                onKeyDown={(e) => handleKeyPress(e, 'add')}
                placeholder="Enter value..."
                className="h-7 w-32 text-xs"
                autoFocus
                disabled={disabled}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={handleAdd}
                disabled={disabled}
              >
                <Check className="h-3 w-3 text-green-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setIsAdding(false);
                  setNewItem('');
                  setItemError(null);
                }}
                disabled={disabled}
              >
                <XCircle className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ) : (
            // Add button
            (!maxItems || items.length < maxItems) && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setIsAdding(true)}
                disabled={disabled}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )
          )}

          {/* Empty state */}
          {items.length === 0 && !isAdding && (
            <span className="text-muted-foreground text-sm">
              {field.placeholder || 'No items added'}
            </span>
          )}
        </div>
      </div>

      {/* Helper text */}
      {field.helperText && (
        <p className="text-xs text-muted-foreground">{field.helperText}</p>
      )}

      {/* Error messages */}
      {itemError && (
        <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
          {itemError}
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};