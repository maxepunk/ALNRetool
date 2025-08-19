/**
 * Field configuration types for entity forms
 */

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'multiselect' 
  | 'date' 
  | 'url' 
  | 'relation'
  | 'number'
  | 'boolean';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readOnly?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  rows?: number;
  helperText?: string;
  preservePattern?: boolean; // For SF_ patterns
  min?: number; // For number fields
  max?: number; // For number fields
  step?: number; // For number fields
}

export interface FieldGroup {
  title: string;
  fields: FieldConfig[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}