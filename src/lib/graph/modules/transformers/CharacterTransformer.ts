/**
 * Character Transformer Module
 * 
 * Specialized transformer for character entities that extends BaseTransformer
 * to provide character-specific graph node transformations and visual configurations.
 * 
 * **Core Functionality:**
 * - **Tier-Based Visualization**: Maps character tiers (Core/Secondary/Tertiary) to visual properties
 * - **Type-Specific Styling**: Differentiates Players from NPCs with distinct visual treatments
 * - **Importance Scoring**: Calculates character importance for optimal graph positioning
 * - **Connection Analysis**: Evaluates character relationships and owned elements
 * 
 * **Visual System:**
 * - Core characters: Red, large nodes (highest priority)
 * - Secondary characters: Blue, medium nodes (medium priority)  
 * - Tertiary characters: Green, small nodes (lowest priority)
 * - Player vs NPC differentiation through icons and border styles
 * 
 * **Sorting Algorithm:**
 * - Tier-based priority (Core > Secondary > Tertiary)
 * - Player vs NPC preference (Players ranked higher)
 * - Connection count analysis (puzzle associations, owned elements)
 * - Composite importance scoring for optimal layout
 * 
 * @example
 * ```typescript
 * // Transform single character
 * const node = characterTransformer.transformEntity(characterData);
 * 
 * // Transform character collection
 * const nodes = characterTransformer.transformCollection(characters, { 
 *   skipValidation: false,
 *   includeMetadata: true 
 * });
 * 
 * // Access tier configuration
 * const coreConfig = TIER_CONFIG['Core']; // { color: '#dc2626', size: 'large', priority: 1 }
 * ```
 * 
 * @see BaseTransformer - Parent class providing core transformation functionality
 * @see TIER_CONFIG - Character tier visual configuration mapping
 * @see TYPE_CONFIG - Character type styling configuration
 */

import type { Character } from '@/types/notion/app';
import type { GraphNode, NodeMetadata, VisualHints } from '../../types';
import { 
  BaseTransformer, 
  TransformationUtils
} from '../BaseTransformer';

/**
 * Character tier to visual configuration mapping.
 * Defines visual properties for different character importance levels.
 * 
 * Maps character tiers to visual styling including color, size, and layout priority.
 * Used for consistent character visualization and importance-based graph positioning.
 * 
 * **Tier System:**
 * - **Core**: Most important characters (red, large, priority 1)
 * - **Secondary**: Supporting characters (blue, medium, priority 2)  
 * - **Tertiary**: Background characters (green, small, priority 3)
 * 
 * **Priority Usage:**
 * - Lower priority numbers = higher visual importance
 * - Used in importance score calculation for graph layout
 * - Affects node positioning and visual hierarchy
 * 
 * @example
 * ```typescript
 * const coreConfig = TIER_CONFIG['Core'];
 * console.log(coreConfig.color);    // '#dc2626' (red)
 * console.log(coreConfig.size);     // 'large'
 * console.log(coreConfig.priority); // 1 (highest)
 * 
 * // Check if tier exists
 * if (character.tier && TIER_CONFIG[character.tier]) {
 *   const config = TIER_CONFIG[character.tier];
 *   // Apply visual configuration
 * }
 * ```
 * 
 * Used by: createMetadata(), calculateCharacterImportance(), validateEntity()
 */
const TIER_CONFIG = {
  'Core': { color: '#dc2626', size: 'large' as const, priority: 1 },
  'Secondary': { color: '#2563eb', size: 'medium' as const, priority: 2 },
  'Tertiary': { color: '#16a34a', size: 'small' as const, priority: 3 },
} as const;

/**
 * Character type to visual configuration mapping.
 * Defines styling differences between Player Characters and Non-Player Characters.
 * 
 * Maps character types to visual elements including icons and border styling.
 * Provides clear visual distinction between interactive and story characters.
 * 
 * **Type System:**
 * - **Player**: User-controlled characters (user icon, solid borders)
 * - **NPC**: Story characters controlled by game master (users icon, dashed borders)
 * 
 * **Visual Elements:**
 * - Icons help identify character control type at a glance
 * - Border styles provide additional visual differentiation
 * - Consistent with game design patterns and user expectations
 * 
 * @example
 * ```typescript
 * const playerConfig = TYPE_CONFIG['Player'];
 * console.log(playerConfig.icon);        // 'user'
 * console.log(playerConfig.borderStyle); // 'solid'
 * 
 * const npcConfig = TYPE_CONFIG['NPC'];
 * console.log(npcConfig.icon);        // 'users' 
 * console.log(npcConfig.borderStyle); // 'dashed'
 * 
 * // Safe access with fallback
 * const config = TYPE_CONFIG[character.type] || TYPE_CONFIG['NPC'];
 * ```
 * 
 * Used by: createMetadata(), generateLabel()
 */
const TYPE_CONFIG = {
  'Player': { icon: 'user', borderStyle: 'solid' },
  'NPC': { icon: 'users', borderStyle: 'dashed' },
} as const;

/**
 * Character-specific graph node transformer.
 * Extends BaseTransformer to provide specialized character entity processing.
 * 
 * Implements character-specific validation, labeling, metadata creation, and sorting
 * while leveraging the base transformation infrastructure for consistency.
 * 
 * **Transformation Pipeline:**
 * 1. **Validation**: Checks character tier and type requirements
 * 2. **Labeling**: Generates character-specific display labels with type indicators
 * 3. **Metadata**: Creates tier-based visual metadata with importance scoring
 * 4. **Sorting**: Orders characters by calculated importance for optimal layout
 * 
 * **Character-Specific Features:**
 * - Tier-based visual configuration (Core/Secondary/Tertiary)
 * - Player vs NPC type differentiation  
 * - Ownership count integration in labels
 * - Importance-based sorting algorithm
 * - Connection analysis for graph positioning
 * 
 * @example
 * ```typescript
 * const transformer = new CharacterTransformer();
 * 
 * // Transform character with validation
 * const node = transformer.transformEntity(character);
 * if (node.data.metadata.errorState?.hasError) {
 *   console.log('Validation errors:', node.data.metadata.errorState.message);
 * }
 * 
 * // Batch transformation with options
 * const nodes = transformer.transformCollection(characters, {
 *   skipValidation: false,
 *   includeMetadata: true,
 *   sortResults: true
 * });
 * ```
 * 
 * Complexity: O(n log n) for collections due to sorting, O(1) for single entities
 */
export class CharacterTransformer extends BaseTransformer<Character> {
  /** Entity type identifier for character transformations */
  protected entityType = 'character' as const;
  /** React Flow node type for character nodes */
  protected nodeType = 'character';

  /**
   * Validate character entity data with character-specific requirements.
   * Extends base validation with tier and type validation rules.
   * 
   * **Validation Rules:**
   * - Inherits base entity validation (ID, name, required fields)
   * - Character tier must be present and valid (Core/Secondary/Tertiary)
   * - Character type must be specified (Player/NPC)
   * - Validates tier exists in TIER_CONFIG mapping
   * 
   * **Error Categories:**
   * - Base validation errors (missing ID, name, etc.)
   * - Tier validation (missing or invalid tier values)
   * - Type validation (missing Player/NPC designation)
   * 
   * @param character - Character entity to validate
   * @returns Array of validation error messages (empty if valid)
   * 
   * @remarks
   * **Tier Validation:**
   * - Checks presence of character.tier property
   * - Validates tier value against TIER_CONFIG keys
   * - Invalid tiers default to 'Tertiary' in metadata creation
   * 
   * **Type Validation:**
   * - Ensures character.type is specified
   * - Accepts 'Player' or 'NPC' values
   * - Missing types default to 'NPC' in configuration lookup
   * 
   * @example
   * ```typescript
   * const errors = transformer.validateEntity(character);
   * if (errors.length > 0) {
   *   console.log('Character validation failed:');
   *   errors.forEach(error => console.log(`- ${error}`));
   * }
   * 
   * // Common validation errors:
   * // - "Missing character tier"
   * // - "Invalid tier: Unknown"
   * // - "Missing character type (Player/NPC)"
   * ```
   * 
   * Complexity: O(1)
   */
  protected validateEntity(character: Character): string[] {
    const errors = super.validateEntity(character);
    
    if (!character.tier) {
      errors.push('Missing character tier');
    } else if (!TIER_CONFIG[character.tier]) {
      errors.push(`Invalid tier: ${character.tier}`);
    }
    
    if (!character.type) {
      errors.push('Missing character type (Player/NPC)');
    }
    
    return errors;
  }

  /**
   * Generate character-specific display labels with type indicators and counts.
   * Creates informative labels that distinguish character types and show relationship data.
   * 
   * **Label Components:**
   * - Base character name (or 'Unknown Character' fallback)
   * - Type prefix for NPCs ("[NPC] Name")
   * - Ownership count suffix for significant item ownership (5+ items)
   * - Automatic pluralization and formatting
   * 
   * **Type Indicators:**
   * - Player characters: No prefix (clean display)
   * - NPC characters: "[NPC]" prefix for clear identification
   * - Helps users quickly distinguish character control types
   * 
   * **Count Integration:**
   * - Shows owned element count when >= 5 items
   * - Format: "Character Name (7 items)"
   * - Uses TransformationUtils for consistent formatting
   * 
   * @param character - Character entity to generate label for
   * @returns Formatted display label string
   * 
   * @remarks
   * **Label Examples:**
   * - Player: "Alice Johnson"
   * - NPC: "[NPC] Mysterious Stranger" 
   * - With items: "[NPC] Shop Keeper (12 items)"
   * - Fallback: "Unknown Character"
   * 
   * **Threshold Logic:**
   * - Only shows item count when >= 5 owned elements
   * - Prevents label clutter for minor characters
   * - Highlights characters with significant inventory
   * 
   * @example
   * ```typescript
   * // Player character
   * const label1 = transformer.generateLabel({ name: 'Alice', type: 'Player', ownedElementIds: ['1','2'] });
   * console.log(label1); // "Alice"
   * 
   * // NPC with many items
   * const label2 = transformer.generateLabel({ 
   *   name: 'Merchant', type: 'NPC', 
   *   ownedElementIds: ['1','2','3','4','5','6','7'] 
   * });
   * console.log(label2); // "[NPC] Merchant (7 items)"
   * ```
   * 
   * Complexity: O(1)
   */
  protected generateLabel(character: Character): string {
    let label = character.name || 'Unknown Character';
    
    // Add type indicator for NPCs
    if (character.type === 'NPC') {
      label = `[NPC] ${label}`;
    }
    
    // Add ownership count if significant
    const ownedCount = TransformationUtils.getArrayLength(character.ownedElementIds);
    label = TransformationUtils.createLabelWithCount(label, ownedCount, 5, 'items');
    
    return label;
  }

  /**
   * Create comprehensive metadata for character graph nodes.
   * Combines base metadata with character-specific visual hints and importance scoring.
   * 
   * **Metadata Components:**
   * - Base metadata from BaseTransformer (ID, type, validation state)
   * - Tier-based visual configuration (color, size, priority)
   * - Type-based styling (icon, border style)
   * - Calculated importance score for layout optimization
   * - Owner tier information for relationship processing
   * 
   * **Visual Configuration:**
   * - Tier determines color and size (Core=red/large, Secondary=blue/medium, Tertiary=green/small)
   * - Type determines icon and border style (Player=user/solid, NPC=users/dashed)
   * - Fallback configurations handle missing or invalid data
   * 
   * **Importance Scoring:**
   * - Calculated via calculateCharacterImportance() method
   * - Used for graph layout optimization and node positioning
   * - Stored in metadata for sorting and layout algorithms
   * 
   * @param character - Character entity to create metadata for
   * @param errors - Validation errors from character validation
   * @returns Complete NodeMetadata object with character-specific properties
   * 
   * @remarks
   * **Fallback Handling:**
   * - Invalid tiers default to 'Tertiary' configuration
   * - Missing types default to 'NPC' configuration
   * - Ensures consistent visual presentation even with invalid data
   * 
   * **Metadata Extensions:**
   * - `ownerTier`: Character tier for relationship processing
   * - `importanceScore`: Calculated score for layout optimization
   * - Standard base metadata (entityId, entityType, errorState)
   * 
   * @example
   * ```typescript
   * const metadata = transformer.createMetadata(character, validationErrors);
   * console.log(metadata.visualHints.color);   // '#dc2626' (red for Core)
   * console.log(metadata.visualHints.size);    // 'large'
   * console.log(metadata.visualHints.icon);    // 'user'
   * console.log(metadata.ownerTier);           // 'Core'
   * console.log(metadata.importanceScore);     // 8547 (calculated)
   * ```
   * 
   * Complexity: O(1)
   */
  protected createMetadata(character: Character, errors: string[]): NodeMetadata {
    const tierConfig = TIER_CONFIG[character.tier] || TIER_CONFIG['Tertiary'];
    const typeConfig = TYPE_CONFIG[character.type] || TYPE_CONFIG['NPC'];
    
    // Calculate importance score
    const importanceScore = this.calculateCharacterImportance(character);
    
    // Create visual hints
    const visualHints: VisualHints = {
      color: tierConfig.color,
      size: tierConfig.size,
      icon: typeConfig.icon,
    };
    
    // Create base metadata
    const metadata = super.createBaseMetadata(character, errors, visualHints);
    
    // Add character-specific metadata
    if (character.tier) {
      metadata.ownerTier = character.tier;
    }
    
    // Store importance for sorting
    (metadata as any).importanceScore = importanceScore;
    
    return metadata;
  }

  /**
   * Sort character nodes by calculated importance score.
   * Orders characters for optimal graph layout with most important characters first.
   * 
   * **Sorting Criteria:**
   * - Primary: Importance score (higher scores first)
   * - Importance score combines tier priority, type preference, and connection counts
   * - Ensures visually important characters are prominently positioned
   * 
   * **Score Components:**
   * - Tier priority: Core(9000) > Secondary(8000) > Tertiary(7000)
   * - Type bonus: Player(+100) > NPC(0)
   * - Connection counts: Puzzle associations + owned elements + associated elements
   * 
   * **Layout Benefits:**
   * - Core characters positioned prominently in graph
   * - Player characters prioritized over NPCs
   * - Highly connected characters get better positioning
   * - Consistent visual hierarchy across different graph views
   * 
   * @param nodes - Array of character graph nodes to sort
   * @returns Sorted array with highest importance characters first
   * 
   * @remarks
   * **Importance Score Access:**
   * - Scores calculated in createMetadata() and stored as custom metadata property
   * - Type assertion used to access non-standard metadata field
   * - Fallback to 0 for nodes without importance scores
   * 
   * **Sorting Stability:**
   * - Uses standard array sort with numeric comparison
   * - Descending order (highest score first)
   * - Maintains stable sorting for equal-scored nodes
   * 
   * @example
   * ```typescript
   * const unsorted = [secondaryChar, coreChar, tertiaryChar];
   * const sorted = transformer.sortNodes(unsorted);
   * 
   * // Result order: coreChar (score: 9000+), secondaryChar (8000+), tertiaryChar (7000+)
   * sorted.forEach(node => {
   *   const score = node.data.metadata.importanceScore;
   *   console.log(`${node.data.label}: ${score}`);
   * });
   * ```
   * 
   * Complexity: O(n log n) where n = nodes.length
   */
  protected sortNodes(nodes: GraphNode<Character>[]): GraphNode<Character>[] {
    return nodes.sort((a, b) => {
      const aScore = (a.data.metadata as any).importanceScore || 0;
      const bScore = (b.data.metadata as any).importanceScore || 0;
      return bScore - aScore; // Higher score first
    });
  }

  /**
   * Calculate comprehensive importance score for character layout prioritization.
   * Combines tier priority, character type preference, and connection analysis.
   * 
   * **Scoring Algorithm:**
   * 1. **Tier Priority**: (10 - tier_priority) × 1000 (Core=9000, Secondary=8000, Tertiary=7000)
   * 2. **Type Bonus**: Player characters get +100 points
   * 3. **Connection Score**: Sum of puzzle associations, owned elements, and associated elements
   * 4. **Final Score**: Tier + Type + Connections
   * 
   * **Tier Priority Mapping:**
   * - Core characters (priority 1): 9000 base points
   * - Secondary characters (priority 2): 8000 base points
   * - Tertiary characters (priority 3): 7000 base points
   * - Unknown/missing tier: 0 points (handled gracefully)
   * 
   * **Connection Analysis:**
   * - Character puzzle associations (characterPuzzleIds)
   * - Owned elements (ownedElementIds)
   * - Associated elements (associatedElementIds)
   * - Uses TransformationUtils.calculateImportanceScore() for weighted analysis
   * 
   * @param character - Character entity to calculate importance for
   * @returns Numeric importance score (higher = more important)
   * 
   * @remarks
   * **Score Ranges:**
   * - Core Player with connections: 9100+ points
   * - Core NPC with connections: 9000+ points  
   * - Secondary Player: 8100+ points
   * - Tertiary characters: 7000+ points
   * - Invalid tier: 0-100 points (type bonus only)
   * 
   * **Usage in Layout:**
   * - Higher scored characters positioned more prominently
   * - Used by sortNodes() for consistent ordering
   * - Affects graph layout algorithms and visual hierarchy
   * - Stored in metadata for layout orchestrator access
   * 
   * @example
   * ```typescript
   * // Core player with many connections
   * const score1 = transformer.calculateCharacterImportance({
   *   tier: 'Core', type: 'Player',
   *   characterPuzzleIds: ['p1', 'p2'], 
   *   ownedElementIds: ['e1', 'e2', 'e3']
   * });
   * console.log(score1); // 9100+ (9000 + 100 + connections)
   * 
   * // Tertiary NPC with few connections  
   * const score2 = transformer.calculateCharacterImportance({
   *   tier: 'Tertiary', type: 'NPC',
   *   ownedElementIds: ['e1']
   * });
   * console.log(score2); // ~7001 (7000 + 0 + 1)
   * ```
   * 
   * Complexity: O(1)
   */
  private calculateCharacterImportance(character: Character): number {
    let score = 0;
    
    // Tier importance - if no tier, treat as lowest priority but don't go negative
    if (character.tier && TIER_CONFIG[character.tier]) {
      const tierPriority = TIER_CONFIG[character.tier].priority;
      score += (10 - tierPriority) * 1000;
    }
    
    // Player characters are more important
    if (character.type === 'Player') {
      score += 100;
    }
    
    // Connection counts
    score += TransformationUtils.calculateImportanceScore(
      TransformationUtils.getArrayLength(character.characterPuzzleIds),
      TransformationUtils.getArrayLength(character.ownedElementIds),
      TransformationUtils.getArrayLength(character.associatedElementIds)
    );
    
    return score;
  }
}

/**
 * Pre-configured singleton instance of CharacterTransformer.
 * Ready-to-use transformer for character entity processing.
 * 
 * **Usage Benefits:**
 * - Avoids repeated instantiation overhead
 * - Consistent configuration across application
 * - Immediate availability for character transformations
 * - Standard pattern matching other transformer modules
 * 
 * **Common Usage Patterns:**
 * - Single character transformation
 * - Collection transformation with sorting
 * - Integration with graph building pipeline
 * - Character-specific validation and labeling
 * 
 * @example
 * ```typescript
 * import { characterTransformer } from './transformers/CharacterTransformer';
 * 
 * // Transform single character
 * const characterNode = characterTransformer.transformEntity(character);
 * 
 * // Transform character collection
 * const characterNodes = characterTransformer.transformCollection(
 *   characters,
 *   { skipValidation: false, sortResults: true }
 * );
 * 
 * // Use in graph building
 * const graphBuilder = new GraphBuilder();
 * graphBuilder.addNodes(characterNodes);
 * ```
 * 
 * Singleton Pattern: Ensures consistent transformer configuration across modules
 */
export const characterTransformer = new CharacterTransformer();