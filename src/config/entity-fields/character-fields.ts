import type { FieldConfig, FieldGroup } from './types';

/**
 * Field configuration for Character entities
 */

export const CHARACTER_BASIC_FIELDS: FieldConfig[] = [
  { 
    key: 'name', 
    label: 'Name', 
    type: 'text', 
    required: true,
    placeholder: 'Enter character name'
  },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    options: [
      { value: 'PC', label: 'Player Character' },
      { value: 'NPC', label: 'Non-Player Character' },
    ],
  },
  {
    key: 'role',
    label: 'Role',
    type: 'text',
    placeholder: 'e.g., Detective, Suspect, Witness'
  },
  {
    key: 'subgroup',
    label: 'Subgroup',
    type: 'text',
    placeholder: 'e.g., The Hackers, Security Team'
  },
  {
    key: 'storyImportance',
    label: 'Story Importance',
    type: 'select',
    options: [
      { value: 'Major', label: 'Major' },
      { value: 'Supporting', label: 'Supporting' },
      { value: 'Minor', label: 'Minor' },
    ],
  },
];

export const CHARACTER_STORY_FIELDS: FieldConfig[] = [
  { 
    key: 'primaryAction', 
    label: 'Primary Action', 
    type: 'text',
    placeholder: 'What is this character primarily doing?'
  },
  { 
    key: 'primaryMotivation', 
    label: 'Primary Motivation', 
    type: 'text',
    placeholder: 'What drives this character?'
  },
  { 
    key: 'characterSheet', 
    label: 'Character Sheet', 
    type: 'text',
    preservePattern: true,
    helperText: 'SF_ pattern (e.g., SF_Alice_Walker)',
    placeholder: 'SF_Character_Name'
  },
];

export const CHARACTER_RELATIONSHIP_FIELDS: FieldConfig[] = [
  { 
    key: 'wantsFromPuzzles', 
    label: 'Wants From Puzzles', 
    type: 'relation',
    helperText: 'Puzzles this character is interested in'
  },
  { 
    key: 'wantsFromElements', 
    label: 'Wants From Elements', 
    type: 'relation',
    helperText: 'Elements this character seeks'
  },
  { 
    key: 'relationshipsInbound', 
    label: 'Inbound Relationships', 
    type: 'relation',
    readOnly: true,
    helperText: 'Other characters with relationships to this one'
  },
  { 
    key: 'relationshipsOutbound', 
    label: 'Outbound Relationships', 
    type: 'relation',
    helperText: 'This character\'s relationships with others'
  },
];

export const CHARACTER_FIELD_GROUPS: FieldGroup[] = [
  {
    title: 'Basic Information',
    fields: CHARACTER_BASIC_FIELDS,
    defaultOpen: true,
  },
  {
    title: 'Story & Motivation',
    fields: CHARACTER_STORY_FIELDS,
    collapsible: true,
    defaultOpen: true,
  },
  {
    title: 'Relationships',
    fields: CHARACTER_RELATIONSHIP_FIELDS,
    collapsible: true,
    defaultOpen: false,
  },
];

// Flat list of all fields for backward compatibility
export const CHARACTER_FIELDS: FieldConfig[] = [
  ...CHARACTER_BASIC_FIELDS,
  ...CHARACTER_STORY_FIELDS,
  ...CHARACTER_RELATIONSHIP_FIELDS,
];