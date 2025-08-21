/**
 * Comprehensive Field Registry for ALNRetool
 * 
 * Defines all fields for each entity type, categorized as:
 * - editable: Fields that can be modified via the UI
 * - computed: Read-only fields calculated by Notion (rollups, formulas)
 * - system: System fields that shouldn't be edited (id, lastEdited)
 */

import type { FieldConfig } from '@/components/field-editors/types';

// Field type definitions
export type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'url' | 
                        'relation' | 'relation-single' | 'array' | 'files' | 'number' | 'checkbox';

// Extended field configuration with metadata
export interface ExtendedFieldConfig extends FieldConfig {
  notionProperty?: string; // Notion property name if different from key
  category: 'basic' | 'details' | 'relations' | 'metadata';
  searchable?: boolean; // For relation fields
  allowCreate?: boolean; // For relation fields - allow creating new entities
  entityType?: 'character' | 'element' | 'puzzle' | 'timeline'; // For relation fields
  inverseOf?: { // For inverse relation fields
    entity: 'character' | 'element' | 'puzzle' | 'timeline';
    field: string;
  };
}

// Character Field Registry
export const CHARACTER_FIELDS: Record<string, ExtendedFieldConfig> = {
  // Basic Information
  name: {
    key: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    category: 'basic',
    notionProperty: 'Name',
  },
  type: {
    key: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    category: 'basic',
    notionProperty: 'Player or NPC',
    options: [
      { value: 'Player', label: 'Player' },
      { value: 'NPC', label: 'NPC' },
    ],
  },
  tier: {
    key: 'tier',
    label: 'Tier',
    type: 'select',
    required: true,
    category: 'basic',
    notionProperty: 'Tier',
    options: [
      { value: 'Core', label: 'Core' },
      { value: 'Secondary', label: 'Secondary' },
      { value: 'Tertiary', label: 'Tertiary' },
    ],
  },
  
  // Details
  primaryAction: {
    key: 'primaryAction',
    label: 'Primary Action',
    type: 'text',
    category: 'details',
    notionProperty: 'Primary action',
  },
  characterLogline: {
    key: 'characterLogline',
    label: 'Character Logline',
    type: 'text',
    category: 'details',
    notionProperty: 'Character logline',
  },
  overview: {
    key: 'overview',
    label: 'Overview',
    type: 'textarea',
    rows: 4,
    category: 'details',
    notionProperty: 'Overview',
  },
  emotionTowardsCEO: {
    key: 'emotionTowardsCEO',
    label: 'Emotion Towards CEO',
    type: 'text',
    category: 'details',
    notionProperty: 'Emotion towards CEO',
  },
  
  // Relations (Editable)
  ownedElementIds: {
    key: 'ownedElementIds',
    label: 'Owned Elements',
    type: 'relation',
    category: 'relations',
    notionProperty: 'Owned elements',
    searchable: true,
    entityType: 'element',
  },
  associatedElementIds: {
    key: 'associatedElementIds',
    label: 'Associated Elements',
    type: 'relation',
    category: 'relations',
    notionProperty: 'Associated elements',
    searchable: true,
    entityType: 'element',
  },
  characterPuzzleIds: {
    key: 'characterPuzzleIds',
    label: 'Character Puzzles',
    type: 'relation',
    category: 'relations',
    notionProperty: 'Character puzzles',
    searchable: true,
    entityType: 'puzzle',
  },
  eventIds: {
    key: 'eventIds',
    label: 'Timeline Events',
    type: 'relation',
    category: 'relations',
    notionProperty: 'Events',
    searchable: true,
    entityType: 'timeline',
  },
  
  // Computed (Read-only)
  connections: {
    key: 'connections',
    label: 'Character Connections',
    type: 'relation',
    category: 'relations',
    readOnly: true,
    helperText: 'Automatically computed from shared timeline events',
    entityType: 'character',
  },
};

// Element Field Registry
export const ELEMENT_FIELDS: Record<string, ExtendedFieldConfig> = {
  // Basic Information
  name: {
    key: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    category: 'basic',
    notionProperty: 'Name',
  },
  descriptionText: {
    key: 'descriptionText',
    label: 'Description',
    type: 'textarea',
    rows: 5,
    category: 'basic',
    preservePattern: true,
    helperText: 'SF_ patterns will be preserved (e.g., SF_RFID:001, SF_VALUE:5)',
    notionProperty: 'Description',
  },
  basicType: {
    key: 'basicType',
    label: 'Basic Type',
    type: 'select',
    required: true,
    category: 'basic',
    notionProperty: 'Basic Type',
    options: [
      { value: 'Set Dressing', label: 'Set Dressing' },
      { value: 'Prop', label: 'Prop' },
      { value: 'Memory Token (Audio)', label: 'Memory Token (Audio)' },
      { value: 'Memory Token (Video)', label: 'Memory Token (Video)' },
      { value: 'Memory Token (Image)', label: 'Memory Token (Image)' },
      { value: 'Memory Token (Audio+Image)', label: 'Memory Token (Audio+Image)' },
      { value: 'Document', label: 'Document' },
    ],
  },
  status: {
    key: 'status',
    label: 'Status',
    type: 'select',
    category: 'basic',
    notionProperty: 'Status',
    options: [
      { value: 'Idea/Placeholder', label: 'Idea/Placeholder' },
      { value: 'in space playtest ready', label: 'In Space Playtest Ready' },
      { value: 'In development', label: 'In Development' },
      { value: 'Writing Complete', label: 'Writing Complete' },
      { value: 'Design Complete', label: 'Design Complete' },
      { value: 'Source Prop/print', label: 'Source Prop/Print' },
      { value: 'Ready for Playtest', label: 'Ready for Playtest' },
      { value: 'Done', label: 'Done' },
    ],
  },
  firstAvailable: {
    key: 'firstAvailable',
    label: 'First Available',
    type: 'select',
    category: 'basic',
    notionProperty: 'First Available',
    options: [
      { value: 'Act 0', label: 'Act 0' },
      { value: 'Act 1', label: 'Act 1' },
      { value: 'Act 2', label: 'Act 2' },
    ],
  },
  
  // Details
  productionNotes: {
    key: 'productionNotes',
    label: 'Production Notes',
    type: 'textarea',
    rows: 3,
    category: 'details',
    notionProperty: 'Production Notes',
  },
  contentLink: {
    key: 'contentLink',
    label: 'Content Link',
    type: 'url',
    category: 'details',
    notionProperty: 'Content Link',
  },
  narrativeThreads: {
    key: 'narrativeThreads',
    label: 'Narrative Threads',
    type: 'array',
    category: 'details',
    notionProperty: 'Narrative threads',
    helperText: 'Tags for narrative connections',
  },
  filesMedia: {
    key: 'filesMedia',
    label: 'Files & Media',
    type: 'files',
    category: 'details',
    notionProperty: 'Files & media',
  },
  
  // Relations (Editable)
  ownerId: {
    key: 'ownerId',
    label: 'Owner',
    type: 'relation-single',
    category: 'relations',
    notionProperty: 'Owner',
    searchable: true,
    entityType: 'character',
  },
  containerId: {
    key: 'containerId',
    label: 'Container',
    type: 'relation-single',
    category: 'relations',
    notionProperty: 'Container',
    searchable: true,
    entityType: 'element',
  },
  contentIds: {
    key: 'contentIds',
    label: 'Contents',
    type: 'relation',
    category: 'relations',
    notionProperty: 'Contents',
    searchable: true,
    entityType: 'element',
  },
  timelineEventId: {
    key: 'timelineEventId',
    label: 'Timeline Event',
    type: 'relation-single',
    category: 'relations',
    notionProperty: 'Timeline Event',
    searchable: true,
    entityType: 'timeline',
  },
  requiredForPuzzleIds: {
    key: 'requiredForPuzzleIds',
    label: 'Required For Puzzles',
    type: 'relation',
    category: 'relations',
    notionProperty: 'Required for puzzles',
    searchable: true,
    entityType: 'puzzle',
    inverseOf: { 
      entity: 'puzzle', 
      field: 'puzzleElementIds' 
    },
  },
  rewardedByPuzzleIds: {
    key: 'rewardedByPuzzleIds',
    label: 'Rewarded By Puzzles',
    type: 'relation',
    category: 'relations',
    notionProperty: 'Rewarded by puzzles',
    searchable: true,
    entityType: 'puzzle',
    inverseOf: { 
      entity: 'puzzle', 
      field: 'rewardIds' 
    },
  },
  containerPuzzleId: {
    key: 'containerPuzzleId',
    label: 'Container Puzzle',
    type: 'relation-single',
    category: 'relations',
    notionProperty: 'Container puzzle',
    searchable: true,
    entityType: 'puzzle',
  },
  
  // Computed (Read-only)
  sfPatterns: {
    key: 'sfPatterns',
    label: 'SF Patterns',
    type: 'text',
    category: 'metadata',
    readOnly: true,
    helperText: 'Automatically parsed from description',
  },
  associatedCharacterIds: {
    key: 'associatedCharacterIds',
    label: 'Associated Characters',
    type: 'relation',
    category: 'relations',
    readOnly: true,
    helperText: 'Automatically computed from timeline events',
    entityType: 'character',
  },
  puzzleChain: {
    key: 'puzzleChain',
    label: 'Puzzle Chain',
    type: 'array',
    category: 'relations',
    readOnly: true,
    helperText: 'Automatically computed from container relationships',
  },
  isContainer: {
    key: 'isContainer',
    label: 'Is Container',
    type: 'checkbox',
    category: 'metadata',
    readOnly: true,
    helperText: 'Automatically determined by contents',
  },
};

// Puzzle Field Registry
export const PUZZLE_FIELDS: Record<string, ExtendedFieldConfig> = {
  // Basic Information
  name: {
    key: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    category: 'basic',
    notionProperty: 'Name',
  },
  descriptionSolution: {
    key: 'descriptionSolution',
    label: 'Description/Solution',
    type: 'textarea',
    rows: 4,
    category: 'basic',
    notionProperty: 'Description/Solution',
  },
  assetLink: {
    key: 'assetLink',
    label: 'Asset Link',
    type: 'url',
    category: 'basic',
    notionProperty: 'Asset Link',
  },
  
  // Relations (Editable)
  puzzleElementIds: {
    key: 'puzzleElementIds',
    label: 'Puzzle Elements',
    type: 'relation',
    category: 'relations',
    notionProperty: 'Puzzle elements',
    searchable: true,
    entityType: 'element',
  },
  lockedItemId: {
    key: 'lockedItemId',
    label: 'Locked Item',
    type: 'relation-single',
    category: 'relations',
    notionProperty: 'Locked item',
    searchable: true,
    entityType: 'element',
  },
  rewardIds: {
    key: 'rewardIds',
    label: 'Rewards',
    type: 'relation',
    category: 'relations',
    notionProperty: 'Rewards',
    searchable: true,
    entityType: 'element',
  },
  parentItemId: {
    key: 'parentItemId',
    label: 'Parent Item',
    type: 'relation-single',
    category: 'relations',
    notionProperty: 'Parent item',
    searchable: true,
    entityType: 'element',
  },
  subPuzzleIds: {
    key: 'subPuzzleIds',
    label: 'Sub-Puzzles',
    type: 'relation',
    category: 'relations',
    notionProperty: 'Sub-puzzles',
    searchable: true,
    entityType: 'puzzle',
  },
  
  // Computed (Read-only)
  ownerId: {
    key: 'ownerId',
    label: 'Owner',
    type: 'relation-single',
    category: 'relations',
    readOnly: true,
    helperText: 'Automatically determined from locked item owner',
    entityType: 'character',
  },
  timing: {
    key: 'timing',
    label: 'Timing',
    type: 'multiselect',
    category: 'metadata',
    readOnly: true,
    helperText: 'Automatically determined from puzzle elements',
    options: [
      { value: 'Act 0', label: 'Act 0' },
      { value: 'Act 1', label: 'Act 1' },
      { value: 'Act 2', label: 'Act 2' },
    ],
  },
  storyReveals: {
    key: 'storyReveals',
    label: 'Story Reveals',
    type: 'array',
    category: 'relations',
    readOnly: true,
    helperText: 'Timeline events revealed by this puzzle',
  },
  narrativeThreads: {
    key: 'narrativeThreads',
    label: 'Narrative Threads',
    type: 'array',
    category: 'metadata',
    readOnly: true,
    helperText: 'Automatically aggregated from elements',
  },
};

// Timeline Field Registry
export const TIMELINE_FIELDS: Record<string, ExtendedFieldConfig> = {
  // Basic Information
  description: {
    key: 'description',
    label: 'Description',
    type: 'textarea',
    rows: 3,
    required: true,
    category: 'basic',
    notionProperty: 'Description',
  },
  date: {
    key: 'date',
    label: 'Date',
    type: 'date',
    required: true,
    category: 'basic',
    notionProperty: 'Date',
  },
  notes: {
    key: 'notes',
    label: 'Notes',
    type: 'textarea',
    rows: 3,
    category: 'details',
    notionProperty: 'Notes',
  },
  
  // Relations (Editable)
  charactersInvolvedIds: {
    key: 'charactersInvolvedIds',
    label: 'Characters Involved',
    type: 'relation',
    category: 'relations',
    notionProperty: 'Characters involved',
    searchable: true,
    entityType: 'character',
  },
  memoryEvidenceIds: {
    key: 'memoryEvidenceIds',
    label: 'Memory/Evidence',
    type: 'relation',
    category: 'relations',
    notionProperty: 'Memory/Evidence',
    searchable: true,
    entityType: 'element',
  },
  
  // Computed (Read-only)
  memTypes: {
    key: 'memTypes',
    label: 'Memory Types',
    type: 'multiselect',
    category: 'metadata',
    readOnly: true,
    helperText: 'Automatically determined from evidence types',
    options: [], // Dynamically populated
  },
};

// Main Field Registry
export const FIELD_REGISTRY = {
  character: CHARACTER_FIELDS,
  element: ELEMENT_FIELDS,
  puzzle: PUZZLE_FIELDS,
  timeline: TIMELINE_FIELDS,
} as const;

// Helper functions
export function getEditableFields(entityType: keyof typeof FIELD_REGISTRY): ExtendedFieldConfig[] {
  const fields = FIELD_REGISTRY[entityType];
  return Object.values(fields).filter(field => !field.readOnly);
}

export function getComputedFields(entityType: keyof typeof FIELD_REGISTRY): ExtendedFieldConfig[] {
  const fields = FIELD_REGISTRY[entityType];
  return Object.values(fields).filter(field => field.readOnly);
}

export function getFieldsByCategory(
  entityType: keyof typeof FIELD_REGISTRY,
  category: ExtendedFieldConfig['category']
): ExtendedFieldConfig[] {
  const fields = FIELD_REGISTRY[entityType];
  return Object.values(fields).filter(field => field.category === category);
}

export function getFieldConfig(
  entityType: keyof typeof FIELD_REGISTRY,
  fieldKey: string
): ExtendedFieldConfig | undefined {
  return FIELD_REGISTRY[entityType][fieldKey];
}