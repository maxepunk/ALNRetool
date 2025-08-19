import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import type { FieldEditorProps, RelationFieldValue } from './types';

export const RelationFieldEditor: React.FC<FieldEditorProps<RelationFieldValue[]>> = ({
  field,
  value = [],
  onChange,
  error,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleRemove = (id: string) => {
    onChange(value.filter(item => item.id !== id));
  };

  const handleAdd = () => {
    // This is a placeholder for adding new relations
    // In the actual implementation, this would open a modal
    // or dropdown to search and select entities
    setIsSearching(true);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {/* Display existing relations */}
      {value.length > 0 && (
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
          {value.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {item.type || 'Unknown'}
                </Badge>
                <span className="text-sm">{item.name}</span>
              </div>
              {!disabled && !field.readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemove(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new relation - simplified for now */}
      {!disabled && !field.readOnly && (
        <div className="flex gap-2">
          {isSearching ? (
            <>
              <Input
                placeholder="Search for entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSearching(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="gap-2"
            >
              <Plus className="h-3 w-3" />
              Add Relation
            </Button>
          )}
        </div>
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