/**
 * Raw Notion API response types
 * Only includes the property types we actually use in ALNRetool
 * 
 * @module types/notion/raw
 * @description Defines TypeScript interfaces that match Notion's API responses exactly.
 * These types are used for type-safe API calls and are transformed into app types.
 */

// Basic Notion API response wrapper
/**
 * Wrapper for paginated Notion API responses
 * @interface NotionListResponse
 * @template T - Type of items in the results array
 */
export interface NotionListResponse<T> {
  object: 'list';
  results: T[];
  next_cursor: string | null;
  has_more: boolean;
}

// Notion page object as returned by the API
/**
 * Represents a Notion page (database item) in its raw API format
 * @interface NotionPage
 */
export interface NotionPage {
  object: 'page';
  id: string;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  url: string;
  properties: Record<string, NotionProperty>;
  // Parent property - standard Notion API field that we cast away with 'as NotionPage'
  // Adding this fixes our type to match actual API responses
  parent: {
    type: 'database_id';
    database_id: string;
  } | {
    type: 'page_id';
    page_id: string;
  } | {
    type: 'workspace';
    workspace: true;
  };
}

// Union of all property types we use
/**
 * Union of all Notion property types used in ALNRetool
 * @typedef NotionProperty
 */
export type NotionProperty =
  | NotionTitleProperty
  | NotionRichTextProperty
  | NotionSelectProperty
  | NotionMultiSelectProperty
  | NotionStatusProperty
  | NotionRelationProperty
  | NotionRollupProperty
  | NotionDateProperty
  | NotionFormulaProperty
  | NotionUrlProperty
  | NotionLastEditedTimeProperty;

// Title property (read-only for MVP)
export interface NotionTitleProperty {
  id: string;
  type: 'title';
  title: Array<{
    type: 'text';
    text: { content: string; link: null };
    plain_text: string;
    href: null;
  }>;
}

// Rich text property (editable in Sprint 3)
export interface NotionRichTextProperty {
  id: string;
  type: 'rich_text';
  rich_text: Array<{
    type: 'text';
    text: { content: string; link: null };
    plain_text: string;
    href: null;
  }>;
}

// Select property (editable in Sprint 3)
export interface NotionSelectProperty {
  id: string;
  type: 'select';
  select: {
    id: string;
    name: string;
    color: string;
  } | null;
}

// Multi-select property (editable in Sprint 3)
export interface NotionMultiSelectProperty {
  id: string;
  type: 'multi_select';
  multi_select: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

// Status property (editable in Sprint 2 - our first editing feature!)
export interface NotionStatusProperty {
  id: string;
  type: 'status';
  status: {
    id: string;
    name: string;
    color: string;
  } | null;
}

// Relation property (editable in Sprint 3)
export interface NotionRelationProperty {
  id: string;
  type: 'relation';
  relation: Array<{
    id: string;
  }>;
  has_more: boolean;
}

// Rollup property (read-only - computed by Notion)
export interface NotionRollupProperty {
  id: string;
  type: 'rollup';
  rollup: {
    type: 'array';
    array: NotionProperty[];
    function: string;
  } | {
    type: 'number';
    number: number | null;
    function: string;
  };
}

// Date property (editable in Sprint 3)
export interface NotionDateProperty {
  id: string;
  type: 'date';
  date: {
    start: string;
    end: string | null;
    time_zone: string | null;
  } | null;
}

// Formula property (read-only - computed by Notion)
export interface NotionFormulaProperty {
  id: string;
  type: 'formula';
  formula: {
    type: 'boolean';
    boolean: boolean | null;
  } | {
    type: 'string';
    string: string | null;
  } | {
    type: 'number';
    number: number | null;
  } | {
    type: 'date';
    date: NotionDateProperty['date'];
  };
}

// URL property (editable in Sprint 3)
export interface NotionUrlProperty {
  id: string;
  type: 'url';
  url: string | null;
}

// Last edited time (read-only system field)
export interface NotionLastEditedTimeProperty {
  id: string;
  type: 'last_edited_time';
  last_edited_time: string;
}

// Type guards for runtime type checking
export function isNotionTitleProperty(prop: NotionProperty): prop is NotionTitleProperty {
  return prop.type === 'title';
}

export function isNotionRichTextProperty(prop: NotionProperty): prop is NotionRichTextProperty {
  return prop.type === 'rich_text';
}

export function isNotionSelectProperty(prop: NotionProperty): prop is NotionSelectProperty {
  return prop.type === 'select';
}

export function isNotionMultiSelectProperty(prop: NotionProperty): prop is NotionMultiSelectProperty {
  return prop.type === 'multi_select';
}

export function isNotionStatusProperty(prop: NotionProperty): prop is NotionStatusProperty {
  return prop.type === 'status';
}

export function isNotionRelationProperty(prop: NotionProperty): prop is NotionRelationProperty {
  return prop.type === 'relation';
}

export function isNotionRollupProperty(prop: NotionProperty): prop is NotionRollupProperty {
  return prop.type === 'rollup';
}

export function isNotionDateProperty(prop: NotionProperty): prop is NotionDateProperty {
  return prop.type === 'date';
}

export function isNotionFormulaProperty(prop: NotionProperty): prop is NotionFormulaProperty {
  return prop.type === 'formula';
}

export function isNotionUrlProperty(prop: NotionProperty): prop is NotionUrlProperty {
  return prop.type === 'url';
}