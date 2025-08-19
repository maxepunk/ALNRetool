import { useState, useCallback, useEffect } from 'react';
import type { FieldConfig } from '@/config/entity-fields/types';

interface UseEntityFormOptions<T> {
  initialValues: T;
  fields: FieldConfig[];
  onSubmit: (values: T) => Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}

export function useEntityForm<T extends Record<string, any>>({
  initialValues,
  fields,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}: UseEntityFormOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isDirty: false,
  });

  // Reset form when initial values change
  useEffect(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isDirty: false,
    });
  }, [initialValues]);

  // Validate a single field
  const validateField = useCallback((field: FieldConfig, value: any): string | undefined => {
    // Required field validation
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    // Type-specific validation
    if (field.type === 'url' && value) {
      try {
        new URL(value);
      } catch {
        return 'Please enter a valid URL';
      }
    }

    if (field.type === 'number' && value !== undefined) {
      if (field.min !== undefined && value < field.min) {
        return `Value must be at least ${field.min}`;
      }
      if (field.max !== undefined && value > field.max) {
        return `Value must be at most ${field.max}`;
      }
    }

    return undefined;
  }, []);

  // Validate all fields
  const validateForm = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    fields.forEach(field => {
      const error = validateField(field, formState.values[field.key]);
      if (error) {
        errors[field.key] = error;
      }
    });

    return errors;
  }, [fields, formState.values, validateField]);

  // Handle field value change
  const handleChange = useCallback((fieldKey: string, value: any) => {
    setFormState(prev => {
      const newValues = { ...prev.values, [fieldKey]: value };
      const newErrors = { ...prev.errors };

      if (validateOnChange) {
        const field = fields.find(f => f.key === fieldKey);
        if (field) {
          const error = validateField(field, value);
          if (error) {
            newErrors[fieldKey] = error;
          } else {
            delete newErrors[fieldKey];
          }
        }
      }

      return {
        ...prev,
        values: newValues,
        errors: newErrors,
        isDirty: true,
      };
    });
  }, [fields, validateOnChange, validateField]);

  // Handle field blur
  const handleBlur = useCallback((fieldKey: string) => {
    setFormState(prev => {
      const newTouched = { ...prev.touched, [fieldKey]: true };
      const newErrors = { ...prev.errors };

      if (validateOnBlur) {
        const field = fields.find(f => f.key === fieldKey);
        if (field) {
          const error = validateField(field, prev.values[fieldKey]);
          if (error) {
            newErrors[fieldKey] = error;
          } else {
            delete newErrors[fieldKey];
          }
        }
      }

      return {
        ...prev,
        touched: newTouched,
        errors: newErrors,
      };
    });
  }, [fields, validateOnBlur, validateField]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validate all fields
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormState(prev => ({
        ...prev,
        errors,
        touched: fields.reduce((acc, field) => ({
          ...acc,
          [field.key]: true,
        }), {}),
      }));
      return;
    }

    // Submit form
    setFormState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      await onSubmit(formState.values);
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        isDirty: false,
      }));
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: {
          _form: error instanceof Error ? error.message : 'An error occurred',
        },
      }));
    }
  }, [fields, formState.values, onSubmit, validateForm]);

  // Reset form to initial values
  const reset = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isDirty: false,
    });
  }, [initialValues]);

  // Get field props for a specific field
  const getFieldProps = useCallback((fieldKey: string) => ({
    value: formState.values[fieldKey],
    onChange: (value: any) => handleChange(fieldKey, value),
    onBlur: () => handleBlur(fieldKey),
    error: formState.touched[fieldKey] ? formState.errors[fieldKey] : undefined,
    disabled: formState.isSubmitting,
  }), [formState, handleChange, handleBlur]);

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isDirty: formState.isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    getFieldProps,
    setFieldValue: handleChange,
    setFieldError: (fieldKey: string, error: string) => {
      setFormState(prev => ({
        ...prev,
        errors: { ...prev.errors, [fieldKey]: error },
      }));
    },
  };
}