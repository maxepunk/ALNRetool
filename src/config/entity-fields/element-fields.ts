import type { FieldConfig, FieldGroup } from './types';

/**
 * Field configuration for Element entities
 */

export const ELEMENT_BASIC_FIELDS: FieldConfig[] = [
  { 
    key: 'name', 
    label: 'Name', 
    type: 'text', 
    required: true,
    placeholder: 'Enter element name'
  },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    options: [
      { value: 'prop', label: 'Prop' },
      { value: 'document', label: 'Document' },
      { value: 'memory', label: 'Memory Token' },
      { value: 'clue', label: 'Clue' },
      { value: 'evidence', label: 'Evidence' },
      { value: 'set', label: 'Set Dressing' },
    ],
  },
  {
    key: 'description',
    label: 'Description',
    type: 'textarea',
    rows: 4,
    preservePattern: true,
    helperText: 'SF_ patterns will be preserved (e.g., SF_RFID:001, SF_VALUE:5)',
    placeholder: 'Describe the element and its significance'
  },
];

export const ELEMENT_STATUS_FIELDS: FieldConfig[] = [
  {
    key: 'status',
    label: 'Production Status',
    type: 'select',
    options: [
      { value: 'Idea/Placeholder', label: 'Idea/Placeholder' },
      { value: 'In Development', label: 'In Development' },
      { value: 'Writing Complete', label: 'Writing Complete' },
      { value: 'Design Complete', label: 'Design Complete' },
      { value: 'Ready for Playtest', label: 'Ready for Playtest' },
      { value: 'In Space Playtest Ready', label: 'In Space Playtest Ready' },
      { value: 'Done', label: 'Done' },
    ],
  },
  {
    key: 'firstAvailable',
    label: 'First Available',
    type: 'select',
    options: [
      { value: 'Act 0', label: 'Act 0' },
      { value: 'Act 1', label: 'Act 1' },
      { value: 'Act 2', label: 'Act 2' },
    ],
  },
  { 
    key: 'productionNotes', 
    label: 'Production Notes', 
    type: 'textarea', 
    rows: 3,
    placeholder: 'Notes for production team'
  },
  { 
    key: 'contentLink', 
    label: 'Content Link', 
    type: 'url',
    placeholder: 'https://...'
  },
];

export const ELEMENT_LOCK_FIELDS: FieldConfig[] = [
  { 
    key: 'lockedItemId', 
    label: 'Locked Item', 
    type: 'relation',
    helperText: 'Item that locks/contains this element'
  },
];

export const ELEMENT_RELATIONSHIP_FIELDS: FieldConfig[] = [
  { 
    key: 'usedInPuzzles', 
    label: 'Used In Puzzles', 
    type: 'relation',
    helperText: 'Puzzles that require this element'
  },
  { 
    key: 'rewardFromPuzzles', 
    label: 'Reward From Puzzles', 
    type: 'relation',
    helperText: 'Puzzles that provide this element as reward'
  },
  { 
    key: 'elementItems', 
    label: 'Element Items', 
    type: 'relation',
    helperText: 'Related element items'
  },
  { 
    key: 'characters', 
    label: 'Associated Characters', 
    type: 'relation',
    helperText: 'Characters connected to this element'
  },
  { 
    key: 'elementsInbound', 
    label: 'Inbound Elements', 
    type: 'relation',
    readOnly: true,
    helperText: 'Elements that reference this one'
  },
  { 
    key: 'elementsOutbound', 
    label: 'Outbound Elements', 
    type: 'relation',
    helperText: 'Elements this one references'
  },
];

export const ELEMENT_STATE_FIELDS: FieldConfig[] = [
  { 
    key: 'stateChanges', 
    label: 'State Changes', 
    type: 'multiselect',
    options: [
      { value: 'locked', label: 'Locked' },
      { value: 'hidden', label: 'Hidden' },
      { value: 'revealed', label: 'Revealed' },
      { value: 'activated', label: 'Activated' },
      { value: 'consumed', label: 'Consumed' },
    ],
    helperText: 'States this element can have during gameplay'
  },
];

export const ELEMENT_MEDIA_FIELDS: FieldConfig[] = [
  { 
    key: 'filesMedia', 
    label: 'Files/Media', 
    type: 'relation',
    helperText: 'Associated media files'
  },
];

export const ELEMENT_FIELD_GROUPS: FieldGroup[] = [
  {
    title: 'Basic Information',
    fields: ELEMENT_BASIC_FIELDS,
    defaultOpen: true,
  },
  {
    title: 'Production Status',
    fields: ELEMENT_STATUS_FIELDS,
    collapsible: true,
    defaultOpen: true,
  },
  {
    title: 'Lock Status',
    fields: ELEMENT_LOCK_FIELDS,
    collapsible: true,
    defaultOpen: false,
  },
  {
    title: 'Relationships',
    fields: ELEMENT_RELATIONSHIP_FIELDS,
    collapsible: true,
    defaultOpen: false,
  },
  {
    title: 'State Management',
    fields: ELEMENT_STATE_FIELDS,
    collapsible: true,
    defaultOpen: false,
  },
  {
    title: 'Media',
    fields: ELEMENT_MEDIA_FIELDS,
    collapsible: true,
    defaultOpen: false,
  },
];

// Flat list of all fields for backward compatibility
export const ELEMENT_FIELDS: FieldConfig[] = [
  ...ELEMENT_BASIC_FIELDS,
  ...ELEMENT_STATUS_FIELDS,
  ...ELEMENT_LOCK_FIELDS,
  ...ELEMENT_RELATIONSHIP_FIELDS,
  ...ELEMENT_STATE_FIELDS,
  ...ELEMENT_MEDIA_FIELDS,
];