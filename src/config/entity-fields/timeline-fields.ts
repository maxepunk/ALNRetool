import type { FieldConfig, FieldGroup } from './types';

/**
 * Field configuration for Timeline Event entities
 */

export const TIMELINE_BASIC_FIELDS: FieldConfig[] = [
  { 
    key: 'name', 
    label: 'Event Name', 
    type: 'text', 
    required: true,
    placeholder: 'Enter event name'
  },
  {
    key: 'type',
    label: 'Event Type',
    type: 'select',
    required: true,
    options: [
      { value: 'story', label: 'Story Event' },
      { value: 'puzzle', label: 'Puzzle Event' },
      { value: 'character', label: 'Character Event' },
      { value: 'system', label: 'System Event' },
    ],
  },
  {
    key: 'time',
    label: 'Time',
    type: 'text',
    required: true,
    placeholder: 'e.g., Night 1 - 10:00 PM'
  },
];

export const TIMELINE_DETAILS_FIELDS: FieldConfig[] = [
  { 
    key: 'description', 
    label: 'Description', 
    type: 'textarea', 
    rows: 4,
    required: true,
    placeholder: 'Describe what happens in this event'
  },
  { 
    key: 'location', 
    label: 'Location', 
    type: 'text',
    placeholder: 'Where does this event occur?'
  },
  { 
    key: 'notes', 
    label: 'Production Notes', 
    type: 'textarea', 
    rows: 3,
    placeholder: 'Additional notes for production'
  },
];

export const TIMELINE_RELATIONSHIP_FIELDS: FieldConfig[] = [
  { 
    key: 'participants', 
    label: 'Participants', 
    type: 'relation',
    helperText: 'Characters involved in this event'
  },
  { 
    key: 'relatedPuzzles', 
    label: 'Related Puzzles', 
    type: 'relation',
    helperText: 'Puzzles connected to this event'
  },
  { 
    key: 'relatedElements', 
    label: 'Related Elements', 
    type: 'relation',
    helperText: 'Elements involved in this event'
  },
];

export const TIMELINE_FIELD_GROUPS: FieldGroup[] = [
  {
    title: 'Basic Information',
    fields: TIMELINE_BASIC_FIELDS,
    defaultOpen: true,
  },
  {
    title: 'Event Details',
    fields: TIMELINE_DETAILS_FIELDS,
    collapsible: true,
    defaultOpen: true,
  },
  {
    title: 'Relationships',
    fields: TIMELINE_RELATIONSHIP_FIELDS,
    collapsible: true,
    defaultOpen: false,
  },
];

// Flat list of all fields for backward compatibility
export const TIMELINE_FIELDS: FieldConfig[] = [
  ...TIMELINE_BASIC_FIELDS,
  ...TIMELINE_DETAILS_FIELDS,
  ...TIMELINE_RELATIONSHIP_FIELDS,
];