import type { FieldConfig, FieldGroup } from './types';

/**
 * Field configuration for Puzzle entities
 */

export const PUZZLE_BASIC_FIELDS: FieldConfig[] = [
  { 
    key: 'name', 
    label: 'Name', 
    type: 'text', 
    required: true,
    placeholder: 'Enter puzzle name'
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'Not Started', label: 'Not Started' },
      { value: 'In Progress', label: 'In Progress' },
      { value: 'Complete', label: 'Complete' },
      { value: 'Testing', label: 'Testing' },
      { value: 'Deprecated', label: 'Deprecated' },
    ],
  },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    options: [
      { value: 'Investigation', label: 'Investigation' },
      { value: 'Logic', label: 'Logic' },
      { value: 'Physical', label: 'Physical' },
      { value: 'Social', label: 'Social' },
      { value: 'Technical', label: 'Technical' },
      { value: 'Combined', label: 'Combined' },
    ],
  },
];

export const PUZZLE_DETAILS_FIELDS: FieldConfig[] = [
  { 
    key: 'description', 
    label: 'Description', 
    type: 'textarea', 
    rows: 4,
    placeholder: 'Describe the puzzle scenario'
  },
  { 
    key: 'solution', 
    label: 'Solution', 
    type: 'textarea', 
    rows: 4,
    placeholder: 'How is this puzzle solved?'
  },
  {
    key: 'estimatedSolveTime',
    label: 'Estimated Solve Time (minutes)',
    type: 'number',
    min: 1,
    max: 120,
    step: 5,
    placeholder: '30'
  },
  {
    key: 'timing',
    label: 'Timing',
    type: 'multiselect',
    options: [
      { value: 'Night 0', label: 'Night 0' },
      { value: 'Night 1', label: 'Night 1' },
      { value: 'Night 2', label: 'Night 2' },
      { value: 'Night 3', label: 'Night 3' },
      { value: 'Night 4', label: 'Night 4' },
    ],
    helperText: 'When can this puzzle be attempted?'
  },
];

export const PUZZLE_LOCK_FIELDS: FieldConfig[] = [
  { 
    key: 'lockedItemId', 
    label: 'Locked Item', 
    type: 'relation',
    helperText: 'Item that this puzzle unlocks'
  },
];

export const PUZZLE_DEPENDENCY_FIELDS: FieldConfig[] = [
  { 
    key: 'requiredElements', 
    label: 'Required Elements', 
    type: 'relation',
    helperText: 'Elements needed to solve this puzzle'
  },
  { 
    key: 'rewardElements', 
    label: 'Reward Elements', 
    type: 'relation',
    helperText: 'Elements given upon completion'
  },
  { 
    key: 'puzzlesRequiredInbound', 
    label: 'Prerequisite Puzzles', 
    type: 'relation',
    readOnly: true,
    helperText: 'Puzzles that must be completed first'
  },
  { 
    key: 'puzzlesRequiredOutbound', 
    label: 'Unlocks Puzzles', 
    type: 'relation',
    helperText: 'Puzzles this one unlocks'
  },
  { 
    key: 'subPuzzles', 
    label: 'Sub-Puzzles', 
    type: 'relation',
    helperText: 'Child puzzles within this one'
  },
];

export const PUZZLE_OWNERSHIP_FIELDS: FieldConfig[] = [
  { 
    key: 'owners', 
    label: 'Owners', 
    type: 'relation',
    helperText: 'Characters who own or control this puzzle'
  },
];

export const PUZZLE_FIELD_GROUPS: FieldGroup[] = [
  {
    title: 'Basic Information',
    fields: PUZZLE_BASIC_FIELDS,
    defaultOpen: true,
  },
  {
    title: 'Puzzle Details',
    fields: PUZZLE_DETAILS_FIELDS,
    collapsible: true,
    defaultOpen: true,
  },
  {
    title: 'Lock Status',
    fields: PUZZLE_LOCK_FIELDS,
    collapsible: true,
    defaultOpen: false,
  },
  {
    title: 'Dependencies & Rewards',
    fields: PUZZLE_DEPENDENCY_FIELDS,
    collapsible: true,
    defaultOpen: false,
  },
  {
    title: 'Ownership',
    fields: PUZZLE_OWNERSHIP_FIELDS,
    collapsible: true,
    defaultOpen: false,
  },
];

// Flat list of all fields for backward compatibility
export const PUZZLE_FIELDS: FieldConfig[] = [
  ...PUZZLE_BASIC_FIELDS,
  ...PUZZLE_DETAILS_FIELDS,
  ...PUZZLE_LOCK_FIELDS,
  ...PUZZLE_DEPENDENCY_FIELDS,
  ...PUZZLE_OWNERSHIP_FIELDS,
];