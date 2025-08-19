import type { FieldConfig } from '@/config/entity-fields/types';

export interface FieldEditorProps<T = any> {
  field: FieldConfig;
  value: T;
  onChange: (value: T) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
}

export interface RelationFieldValue {
  id: string;
  name: string;
  type?: string;
}