/**
 * Type definitions for field editors
 */

import type {
  Character,
  Element,
  Puzzle,
  TimelineEvent,
} from '@/types/notion/app';

// Entity type union
export type Entity = Character | Element | Puzzle | TimelineEvent;

// Field editor types
export type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'url' | 
                        'relation' | 'relation-single' | 'array' | 'files' | 'number' | 'checkbox';

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readOnly?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  rows?: number;
  helperText?: string;
  preservePattern?: boolean; // For SF_ patterns
  min?: number; // For number fields
  max?: number; // For number fields
  step?: number; // For number fields
}

// Field editor props
export interface FieldEditorProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  onFocus?: (fieldKey: string) => void;
  onBlur?: () => void;
  isFocused?: boolean;
  allEntities?: {
    characters?: Character[];
    elements?: Element[];
    puzzles?: Puzzle[];
    timeline?: TimelineEvent[];
  };
  entityType?: 'character' | 'element' | 'puzzle' | 'timeline';
}

// Validation
export interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

export interface FieldValidation {
  [key: string]: ValidationRule[];
}