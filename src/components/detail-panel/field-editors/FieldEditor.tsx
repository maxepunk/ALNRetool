import React from 'react';
import { TextFieldEditor } from './TextFieldEditor';
import { TextareaFieldEditor } from './TextareaFieldEditor';
import { SelectFieldEditor } from './SelectFieldEditor';
import { MultiSelectFieldEditor } from './MultiSelectFieldEditor';
import { NumberFieldEditor } from './NumberFieldEditor';
import { UrlFieldEditor } from './UrlFieldEditor';
import { BooleanFieldEditor } from './BooleanFieldEditor';
import { RelationFieldEditor } from './RelationFieldEditor';
import type { FieldConfig } from '@/config/entity-fields/types';
import type { RelationFieldValue } from './types';

interface FieldEditorProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
}

export const FieldEditor: React.FC<FieldEditorProps> = (props) => {
  const { field } = props;

  switch (field.type) {
    case 'text':
      return <TextFieldEditor {...props} value={props.value as string} />;
    case 'textarea':
      return <TextareaFieldEditor {...props} value={props.value as string} />;
    case 'select':
      return <SelectFieldEditor {...props} value={props.value as string} />;
    case 'multiselect':
      return <MultiSelectFieldEditor {...props} value={props.value as string[]} />;
    case 'number':
      return <NumberFieldEditor {...props} value={props.value as number} />;
    case 'url':
      return <UrlFieldEditor {...props} value={props.value as string} />;
    case 'boolean':
      return <BooleanFieldEditor {...props} value={props.value as boolean} />;
    case 'relation':
      return <RelationFieldEditor {...props} value={props.value as RelationFieldValue[]} />;
    case 'date':
      // For now, use text field for dates
      return <TextFieldEditor {...props} value={props.value as string} />;
    default:
      return <TextFieldEditor {...props} value={props.value as string} />;
  }
};