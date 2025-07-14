/**
 * Clean application types for ALNRetool
 * These match our UI needs, not Notion's structure
 * 
 * @module types/notion/app
 * @description Provides clean, UI-friendly TypeScript interfaces for ALNRetool.
 * These types represent the transformed data used throughout the application,
 * abstracting away Notion's complex property structure.
 */

// Character types
/**
 * Represents whether a character is playable or non-playable
 * @typedef {'NPC' | 'Player'} CharacterType
 */
export type CharacterType = 'NPC' | 'Player';

/**
 * Narrative importance tier for characters
 * - Core: Essential to main story (requires 5+ players)
 * - Secondary: Important supporting characters
 * - Tertiary: Background characters
 * @typedef {'Core' | 'Secondary' | 'Tertiary'} CharacterTier
 */
export type CharacterTier = 'Core' | 'Secondary' | 'Tertiary';

/**
 * Represents a character in the ALN murder mystery game
 * @interface Character
 */
export interface Character {
  /** Unique Notion page ID */
  id: string;
  /** Character's display name */
  name: string;
  /** Whether character is playable (Player) or not (NPC) */
  type: CharacterType;
  /** Narrative importance level affecting game balance */
  tier: CharacterTier;
  /** IDs of elements this character starts with or has POV memories of */
  ownedElementIds: string[];
  /** IDs of narratively connected elements */
  associatedElementIds: string[];
  /** IDs of puzzles this character can naturally access */
  characterPuzzleIds: string[];
  /** IDs of timeline events involving this character */
  eventIds: string[];
  /** Unique character IDs who share timeline events with this character */
  connections: string[];
  /** Core behavioral trait or primary motivation */
  primaryAction: string;
  /** One-line character summary for quick reference */
  characterLogline: string;
  /** Detailed background and relationships */
  overview: string;
  /** Relationship dynamics with the murdered CEO */
  emotionTowardsCEO: string;
}

// Element types
/**
 * Physical manifestation types for game elements
 * - Set Dressing: Non-interactive environmental items
 * - Prop: Interactive physical objects
 * - Memory Token: RFID-scannable items with digital content
 * - Document: Written materials (letters, contracts, etc.)
 * @typedef ElementBasicType
 */
export type ElementBasicType = 
  | 'Set Dressing'
  | 'Prop'
  | 'Memory Token (Audio)'
  | 'Memory Token (Video)'
  | 'Memory Token (Image)'
  | 'Memory Token (Audio+Image)'
  | 'Document';

/**
 * Production readiness status for elements
 * Groups: To-do, In Progress, Complete
 * @typedef ElementStatus
 */
export type ElementStatus = 
  | 'Idea/Placeholder'
  | 'in space playtest ready'
  | 'In development'
  | 'Writing Complete'
  | 'Design Complete'
  | 'Source Prop/print'
  | 'Ready for Playtest'
  | 'Done';

/**
 * Game act when element becomes available
 * - Act 0: Lobby/check-in phase
 * - Act 1: Initial investigation phase
 * - Act 2: Resolution phase
 * - null: Always available
 * @typedef {('Act 0' | 'Act 1' | 'Act 2' | null)} Act
 */
export type Act = 'Act 0' | 'Act 1' | 'Act 2' | null;

// SF_ pattern types for parsing
/**
 * Parsed metadata from SF_ patterns in element descriptions
 * Used for RFID scanning and memory value calculations
 * @interface SFPatterns
 */
export interface SFPatterns {
  rfid?: string;
  valueRating?: number; // 1-5
  memoryType?: 'Personal' | 'Business' | 'Technical';
  group?: {
    name: string;
    multiplier: string; // e.g., "10", "2-10"
  };
}

/**
 * Represents a game element (prop, document, memory token, etc.)
 * @interface Element
 */
export interface Element {
  id: string;
  name: string;
  descriptionText: string;
  sfPatterns: SFPatterns; // Parsed from descriptionText
  basicType: ElementBasicType;
  ownerId?: string;
  containerId?: string;
  contentIds: string[];
  timelineEventId?: string;
  status: ElementStatus;
  firstAvailable: Act;
  requiredForPuzzleIds: string[];
  rewardedByPuzzleIds: string[];
  containerPuzzleId?: string;
  narrativeThreads: string[];
  associatedCharacterIds: string[]; // From timeline rollup
  puzzleChain: string[]; // From container rollup
  productionNotes: string;
  filesMedia: Array<{ name: string; url: string }>;
  contentLink?: string;
  isContainer: boolean; // From formula
}

// Puzzle types
/**
 * Represents a puzzle that players must solve
 * @interface Puzzle
 */
export interface Puzzle {
  id: string;
  name: string;
  descriptionSolution: string;
  puzzleElementIds: string[];
  lockedItemId?: string;
  ownerId?: string; // From rollup
  rewardIds: string[];
  parentItemId?: string;
  subPuzzleIds: string[];
  storyReveals: string[]; // Timeline event IDs from rollup
  timing: Act[]; // From rollup
  narrativeThreads: string[]; // From rollup
  assetLink?: string;
}

// Timeline types
/**
 * Represents a backstory event that players discover
 * @interface TimelineEvent
 */
export interface TimelineEvent {
  id: string;
  name: string; // Same as description, for consistency with other types
  description: string;
  date: string; // ISO date string
  charactersInvolvedIds: string[];
  memoryEvidenceIds: string[];
  memTypes: ElementBasicType[]; // From rollup
  notes: string;
  lastEditedTime: string;
}

// API response types
/**
 * Standard API response wrapper for all endpoints
 * @interface APIResponse
 * @template T - The type of data in the response array
 */
export interface APIResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Standard error response format
 * @interface APIError
 */
export interface APIError {
  statusCode: number;
  code: string;
  message: string;
}