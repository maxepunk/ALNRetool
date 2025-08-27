import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import {
  useCreateCharacter,
  useCreateElement,
  useCreatePuzzle,
  useCreateTimelineEvent
} from '@/hooks/mutations';
import type { ParentContext } from '@/stores/creationStore';
import { zIndex } from '@/config/zIndex';

interface CreatePanelProps {
  entityType: 'character' | 'element' | 'puzzle' | 'timeline';
  parentContext?: ParentContext | null;
  onClose: () => void;
  onSuccess?: (entity: any) => void;
}

// Define minimal required fields for each entity type
const REQUIRED_FIELDS = {
  character: [
    { key: 'name', label: 'Name', type: 'text' as const, required: true },
    { 
      key: 'type', 
      label: 'Type', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'Player', label: 'Player' },
        { value: 'NPC', label: 'NPC' },
      ]
    },
    { 
      key: 'tier', 
      label: 'Tier', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'Core', label: 'Core' },
        { value: 'Secondary', label: 'Secondary' },
        { value: 'Tertiary', label: 'Tertiary' },
      ]
    },
  ],
  element: [
    { key: 'name', label: 'Name', type: 'text' as const, required: true },
  ],
  puzzle: [
    { key: 'name', label: 'Puzzle Name', type: 'text' as const, required: true },
    { 
      key: 'act', 
      label: 'Act', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'Act 1', label: 'Act 1' },
        { value: 'Act 2', label: 'Act 2' },
        { value: 'Act 3', label: 'Act 3' },
      ]
    },
  ],
  timeline: [
    { key: 'date', label: 'Date', type: 'date' as const, required: true },
    { key: 'description', label: 'Description', type: 'text' as const, required: true },
  ],
};

export function CreatePanel({ entityType, parentContext, onClose, onSuccess }: CreatePanelProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get create mutation based on type
  const createCharacter = useCreateCharacter();
  const createElement = useCreateElement();
  const createPuzzle = useCreatePuzzle();
  const createTimelineEvent = useCreateTimelineEvent();

  const createMutation =
    entityType === 'character' ? createCharacter :
    entityType === 'element' ? createElement :
    entityType === 'puzzle' ? createPuzzle :
    createTimelineEvent;

  // Get required fields for this entity type
  const fields = REQUIRED_FIELDS[entityType];

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleSave = async () => {
    // Validate required fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Prepare entity data with parent relation metadata if applicable
      const entityData = {
        ...formData,
        // Include parent relation metadata for atomic creation
        ...(parentContext?.sourceComponent === 'relation-field' && 
            parentContext.parentEntityId && 
            parentContext.relationFieldKey &&
            parentContext.parentEntityType ? {
          _parentRelation: {
            parentType: parentContext.parentEntityType,
            parentId: parentContext.parentEntityId,
            fieldKey: parentContext.relationFieldKey
          }
        } : {})
      };
      
      // Create entity (backend will handle parent relationship atomically)
      const result = await createMutation.mutateAsync(entityData);
      
      // Note: No need to separately update parent relationship anymore
      // The backend handles it atomically during creation
      
      // The mutation returns the entity directly
      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error('Failed to create entity:', error);
    }
  };

  const renderField = (field: typeof fields[0]) => {
    switch (field.type) {
      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Select
              id={field.key}
              value={formData[field.key] || ''}
              onValueChange={(value) => handleFieldChange(field.key, value)}
              disabled={createMutation.isPending}
            >
              {!formData[field.key] && (
                <SelectItem value="" disabled>
                  Select {field.label.toLowerCase()}
                </SelectItem>
              )}
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
            {errors[field.key] && (
              <p className="text-sm text-red-500">{errors[field.key]}</p>
            )}
          </div>
        );
      
      case 'date':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="date"
              value={formData[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              disabled={createMutation.isPending}
            />
            {errors[field.key] && (
              <p className="text-sm text-red-500">{errors[field.key]}</p>
            )}
          </div>
        );
      
      default:
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="text"
              value={formData[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              disabled={createMutation.isPending}
            />
            {errors[field.key] && (
              <p className="text-sm text-red-500">{errors[field.key]}</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="w-80 bg-white/10 backdrop-blur-md 
                    border border-white/20 rounded-lg p-4 shadow-xl"
         style={{ position: 'relative', zIndex: zIndex.createPanel }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          New {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
        </h3>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {fields.map(renderField)}
      </div>

      <div className="flex gap-2 mt-4">
        <Button 
          variant="outline" 
          onClick={onClose} 
          disabled={createMutation.isPending}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create
            </>
          )}
        </Button>
      </div>
    </div>
  );
}