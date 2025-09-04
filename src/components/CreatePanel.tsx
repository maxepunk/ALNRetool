import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useEntityMutation } from '@/hooks/mutations';
import type { ParentContext } from '@/stores/creationStore';
import { zIndex } from '@/config/zIndex';
import { validateFields, fieldValidationConfigs } from '@/utils/fieldValidation';
import { getFieldsByCategory } from '@/config/fieldRegistry';
import { FieldEditor } from '@/components/field-editors';

interface CreatePanelProps {
  entityType: 'character' | 'element' | 'puzzle' | 'timeline';
  parentContext?: ParentContext | null;
  onClose: () => void;
  onSuccess?: (entity: any) => void;
}


export function CreatePanel({ entityType, parentContext, onClose, onSuccess }: CreatePanelProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get create mutation based on type using unified hook
  const createMutation = useEntityMutation(entityType, 'create');

  // Get fields from registry - include both required and some optional fields
  const basicFields = getFieldsByCategory(entityType, 'basic');
  const fields = basicFields.filter(f => !f.readOnly); // Exclude computed fields

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleSave = async () => {
    // Build validation rules for each field based on field registry
    const fieldRules: Record<string, any[]> = {};
    fields.forEach(field => {
      if (field.required) {
        // Use type-specific validation if available, otherwise use text.required
        const typeConfig = (fieldValidationConfigs as any)[field.type];
        fieldRules[field.key] = typeConfig?.required || fieldValidationConfigs.text.required;
      }
    });

    // Validate all fields
    const newErrors = validateFields(formData, fieldRules);
    
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
      
      // Show success message
      toast.success(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} created successfully`);
      
      // The mutation returns the entity directly
      onSuccess?.(result);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create ${entityType}: ${errorMessage}`);
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
        {fields.map(field => (
          <FieldEditor
            key={field.key}
            field={field}
            value={formData[field.key]}
            onChange={(value) => handleFieldChange(field.key, value)}
            error={errors[field.key]}
            disabled={createMutation.isPending}
            entityType={entityType}
          />
        ))}
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