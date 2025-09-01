/**
 * Entity Property Classifications for Delta Calculation
 * 
 * CRITICAL: Only mutable properties should trigger delta updates.
 * Rollup/computed properties are read-only derivatives that should NEVER
 * be checked in equality comparisons.
 * 
 * This caused a bug where 30% of cached data was incorrectly invalidated.
 * 
 * VERIFIED via transform functions in src/types/notion/transforms.ts:
 * - getRelationIds() = Direct relation properties (mutable via API)
 * - getRollupStrings() = Rollup properties (computed by Notion, read-only)
 */

// Character Properties (verified in transformCharacter)
export interface CharacterMutableProperties {
  // Direct relations - these are the source of truth
  ownedElementIds?: string[];      // Line 240: getRelationIds()
  associatedElementIds?: string[];  // Line 241: getRelationIds()
  characterPuzzleIds?: string[];    // Line 242: getRelationIds()
  eventIds?: string[];              // Line 243: getRelationIds()
  
  // Scalar properties
  name?: string;
  type?: string;
  tier?: string;
  primaryAction?: string;
  characterLogline?: string;
  overview?: string;
  emotionTowardsCEO?: string;
}

export interface CharacterRollupProperties {
  // These are computed from the mutable properties
  // NEVER check these in delta calculations
  readonly connections?: string[];  // Line 244: getRollupStrings() - computed from shared timeline events
}

// Element Properties (verified in transformElement lines 252-280)
export interface ElementMutableProperties {
  // Direct relations - source of truth (all use getRelationIds)
  ownerId?: string;                 // Line 263: getRelationIds()[0]
  containerId?: string;             // Line 264: getRelationIds()[0]
  contentIds?: string[];            // Line 265: getRelationIds()
  timelineEventId?: string;         // Line 266: getRelationIds()[0]
  requiredForPuzzleIds?: string[];  // Line 269: getRelationIds()
  rewardedByPuzzleIds?: string[];   // Line 270: getRelationIds()
  containerPuzzleId?: string;       // Line 271: getRelationIds()[0]
  
  // Scalar properties
  name?: string;
  descriptionText?: string;
  basicType?: string;
  status?: string;
  firstAvailable?: string;
  narrativeThreads?: string[];
  productionNotes?: string;
  contentLink?: string;
}

export interface ElementRollupProperties {
  // Computed properties - read-only (use getRollupStrings)
  readonly associatedCharacterIds?: string[];  // Line 273: getRollupStrings()
  readonly puzzleChain?: string[];            // Line 274: getRollupStrings()
  readonly isContainer?: boolean;             // Line 278: getFormula() - computed field
}

// Puzzle Properties (verified in transformPuzzle lines 282-301)
export interface PuzzleMutableProperties {
  // Direct relations (use getRelationIds)
  puzzleElementIds?: string[];      // Line 290: getRelationIds()
  lockedItemId?: string;            // Line 291: getRelationIds()[0]
  rewardIds?: string[];             // Line 293: getRelationIds()
  parentItemId?: string;            // Line 294: getRelationIds()[0]
  subPuzzleIds?: string[];          // Line 295: getRelationIds()
  
  // Scalar properties
  name?: string;
  descriptionSolution?: string;
  assetLink?: string;
}

export interface PuzzleRollupProperties {
  // Computed properties (use getRollupStrings)
  readonly ownerId?: string;               // Line 292: getRollupStrings()[0]
  readonly storyReveals?: string[];        // Line 296: getRollupStrings()
  readonly timing?: string[];              // Line 297: getRollupStrings()
  readonly narrativeThreads?: string[];    // Line 298: getRollupStrings()
}

// Timeline Properties (verified in transformTimelineEvent lines 303-319)
export interface TimelineEventMutableProperties {
  // Direct relations - source of truth (use getRelationIds)
  charactersInvolvedIds?: string[];  // Line 313: getRelationIds()
  memoryEvidenceIds?: string[];      // Line 314: getRelationIds()
  
  // Scalar properties
  description?: string;               // Line 311: getTitle() - title property
  date?: string;                     // Line 312: getDate()
  notes?: string;                    // Line 316: getRichText()
}

export interface TimelineEventRollupProperties {
  // Computed properties - read-only
  readonly memTypes?: string[];      // Line 315: getRollupStrings() - computed from related elements
  readonly name?: string;            // Line 309: Derived from description field
}

/**
 * Type guards for compile-time safety
 */
export type MutableProperties = 
  | CharacterMutableProperties 
  | ElementMutableProperties 
  | PuzzleMutableProperties 
  | TimelineEventMutableProperties;

export type RollupProperties = 
  | CharacterRollupProperties 
  | ElementRollupProperties 
  | PuzzleRollupProperties 
  | TimelineEventRollupProperties;

/**
 * WARNING: When comparing entities for equality:
 * 1. ONLY compare properties from MutableProperties interfaces
 * 2. NEVER compare properties from RollupProperties interfaces
 * 3. Rollup properties are computed server-side and will cause false positives
 * 
 * Example Bug: Checking 'Elements' instead of 'ownedElementIds' caused
 * 30% of cache to be incorrectly invalidated because the rollup array
 * had different object references even when IDs were identical.
 */