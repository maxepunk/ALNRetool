/**
 * Element Transformer Module
 * 
 * Specialized transformer for story element entities that extends BaseTransformer
 * to provide element-specific graph node transformations with SF pattern integration.
 * 
 * **Core Functionality:**
 * - **Status-Based Visualization**: Maps element development status to visual colors
 * - **Type-Specific Labeling**: Adds type abbreviations and indicators to element labels
 * - **SF Pattern Integration**: Extracts and validates Science Fiction metadata patterns
 * - **Container Relationship Tracking**: Handles element containment and puzzle associations
 * - **Collaborative Element Analysis**: Identifies dual-role elements and collaboration requirements
 * 
 * **Visual System:**
 * - Status colors: Done/Ready (green), Development (yellow), Ideas (gray), etc.
 * - Size-based importance: Large (SF value ≥4), Medium (containers), Small (standard)
 * - Type indicators: [MT] Memory Token, [CT] Custom Type, etc.
 * - Rectangle shape for story element distinction
 * 
 * **SF Pattern Processing:**
 * - Extracts SF metadata from element descriptions
 * - Validates value ratings (1-5 scale) and memory types
 * - Integrates with graph layout for high-value element prominence
 * - Supports murder mystery narrative structure
 * 
 * **Enrichment System:**
 * - Owner information with tier mapping
 * - Container relationships and puzzle associations
 * - Collaboration detection and timeline integration
 * - Cross-entity relationship analysis
 * 
 * @example
 * ```typescript
 * // Transform single element
 * const elementNode = elementTransformer.transformEntity(elementData);
 * 
 * // Transform with SF pattern extraction
 * const enrichedNode = elementTransformer.enrichNode(elementNode, lookupMaps);
 * 
 * // Transform collection with status-based sorting
 * const elementNodes = elementTransformer.transformCollection(elements, { 
 *   skipValidation: false,
 *   sortResults: true // Containers first, then by status
 * });
 * ```
 * 
 * @see BaseTransformer - Parent class providing core transformation functionality
 * @see STATUS_COLORS - Element status to color mapping
 * @see extractSFMetadata - SF pattern extraction utility
 */

import type { Element } from '@/types/notion/app';
import type { GraphNode, NodeMetadata, VisualHints, SFMetadata } from '../../types';
import { BaseTransformer } from '../BaseTransformer';
import { extractSFMetadata } from '../../patterns';
import { logger } from '../../utils/Logger'


/**
 * Element development status to color mapping for visual progress indication.
 * Maps element development stages to corresponding visual colors for immediate status recognition.
 * 
 * **Status Categories:**
 * - **Complete**: Done, Ready for Playtest, in space playtest ready (green)
 * - **In Progress**: Writing Complete, Design Complete (blue)
 * - **Development**: In development (yellow), Source Prop/print (orange)
 * - **Planning**: Idea/Placeholder (gray)
 * 
 * **Color Psychology:**
 * - Green: Completion, readiness, success
 * - Blue: Progress, active work, near completion
 * - Yellow: Development, work in progress, caution
 * - Orange: Action required, attention needed
 * - Gray: Planning, placeholder, low priority
 * 
 * **Usage Context:**
 * - Murder mystery game development workflow
 * - Visual progress tracking for game masters
 * - Quick status identification in complex graphs
 * - Development pipeline visualization
 * 
 * @example
 * ```typescript
 * const statusColor = STATUS_COLORS['Done'];           // '#10b981' (green)
 * const devColor = STATUS_COLORS['In development'];    // '#eab308' (yellow)
 * const ideaColor = STATUS_COLORS['Idea/Placeholder']; // '#9ca3af' (gray)
 * 
 * // Fallback handling
 * const color = STATUS_COLORS[element.status] || '#9ca3af'; // Gray fallback
 * ```
 * 
 * Used by: createMetadata() for visual hint generation
 */
const STATUS_COLORS: Record<string, string> = {
  'Idea/Placeholder': '#9ca3af',     // Gray
  'in space playtest ready': '#10b981', // Green
  'In development': '#eab308',  // Yellow
  'Writing Complete': '#3b82f6', // Blue
  'Design Complete': '#3b82f6',  // Blue
  'Source Prop/print': '#f97316', // Orange
  'Ready for Playtest': '#10b981', // Green
  'Done': '#10b981',            // Green
};

/**
 * Element-specific graph node transformer.
 * Extends BaseTransformer to provide specialized element entity processing.
 * 
 * Implements element-specific validation, labeling, metadata creation, and sorting
 * with SF pattern integration and enrichment capabilities.
 * 
 * **Transformation Pipeline:**
 * 1. **Validation**: Checks SF patterns, puzzle connections, and base requirements
 * 2. **Labeling**: Generates type-specific labels with abbreviations
 * 3. **Metadata**: Creates status-aware metadata with SF pattern integration
 * 4. **Enrichment**: Adds cross-entity relationship data via enrichNode()
 * 5. **Sorting**: Orders by container status, development status, then alphabetically
 * 
 * **Element-Specific Features:**
 * - Status-based color coding for development workflow
 * - Type abbreviation system for visual clarity
 * - SF pattern extraction and validation
 * - Container and collaboration relationship tracking
 * - Dual-role element detection (both requirement and reward)
 * 
 * **Enrichment Capabilities:**
 * - Owner tier mapping and character information
 * - Container hierarchy and puzzle associations
 * - Collaboration analysis for multi-character elements
 * - Timeline integration for narrative flow
 * 
 * @example
 * ```typescript
 * const transformer = new ElementTransformer();
 * 
 * // Transform element with SF patterns
 * const node = transformer.transformEntity(element);
 * if (node.data.metadata.sfPatterns) {
 *   console.log('SF patterns detected:', node.data.metadata.sfPatterns);
 * }
 * 
 * // Enrich with relationship data
 * const enrichedNode = transformer.enrichNode(node, {
 *   characters: characterMap,
 *   elements: elementMap,
 *   puzzles: puzzleMap,
 *   timeline: timelineMap
 * });
 * 
 * // Check enrichment
 * if (enrichedNode.data.metadata.enrichedData?.collaborators) {
 *   console.log('Collaboration required');
 * }
 * ```
 * 
 * Complexity: O(n log n) for collections due to sorting, O(1) for single entities, O(k) for enrichment where k = relationships
 */
export class ElementTransformer extends BaseTransformer<Element> {
  /** Entity type identifier for element transformations */
  protected entityType = 'element' as const;
  /** React Flow node type for element nodes */
  protected nodeType = 'element';

  /**
   * Validate element entity data with element-specific requirements.
   * Extends base validation with SF pattern validation and puzzle connection checks.
   * 
   * **Validation Rules:**
   * - Inherits base entity validation (ID, name, required fields)
   * - Warns about elements with no puzzle connections (orphaned elements)
   * - Validates SF patterns when present (value ratings, memory types)
   * - Ensures data integrity for graph relationships
   * 
   * **Puzzle Connection Analysis:**
   * - Elements should connect to puzzles as requirements or rewards
   * - Orphaned elements may indicate data issues or unused content
   * - Logs warnings for disconnected elements (not errors)
   * 
   * **SF Pattern Validation:**
   * - Value ratings must be 1-5 scale
   * - Memory types must be Personal/Public/Mixed
   * - Validates extracted SF metadata structure
   * 
   * @param element - Element entity to validate
   * @returns Array of validation error messages (empty if valid)
   * 
   * @remarks
   * **Connection Warning Logic:**
   * - Checks both requiredForPuzzleIds and rewardedByPuzzleIds arrays
   * - Warning (not error) allows orphaned elements to exist
   * - Helps identify potential data inconsistencies
   * 
   * **SF Validation Delegation:**
   * - Uses validateSFPatterns() helper for detailed SF checks
   * - Separates SF validation concerns from general validation
   * - Adds SF errors to main validation error array
   * 
   * @example
   * ```typescript
   * const errors = transformer.validateEntity(element);
   * if (errors.length > 0) {
   *   console.log('Element validation failed:');
   *   errors.forEach(error => console.log(`- ${error}`));
   * }
   * 
   * // Common validation scenarios:
   * // - SF value rating out of range: "Invalid SF value rating (must be 1-5)"
   * // - Invalid memory type: "Invalid SF memory type: Custom"
   * // - Orphaned element: Warning logged, no error added
   * ```
   * 
   * Complexity: O(k) where k = SF pattern properties
   */
  protected validateEntity(element: Element): string[] {
    const errors = super.validateEntity(element);
    
    // Check for required relationships
    if (!element.requiredForPuzzleIds?.length && !element.rewardedByPuzzleIds?.length) {
      logger.warn(`Element ${element.id} has no puzzle connections`);
    }
    
    // Validate SF patterns if present
    if (element.sfPatterns) {
      const sfErrors = this.validateSFPatterns(element.sfPatterns);
      errors.push(...sfErrors);
    }
    
    return errors;
  }

  /**
   * Generate element-specific display labels with type indicators and abbreviations.
   * Creates informative labels that include element type abbreviations for quick identification.
   * 
   * **Label Components:**
   * - Base element name (or 'Unnamed Element' fallback)
   * - Type abbreviation prefix for non-Prop types
   * - Special handling for Memory Token types
   * - Bracket notation for visual distinction
   * 
   * **Type Abbreviation System:**
   * - Memory Token types: [MT] regardless of specific subtype
   * - Other types: First letter of each word (excluding parentheses)
   * - Examples: Custom Type → [CT], Special Item → [SI]
   * - Prop types: No prefix (default element type)
   * 
   * **Abbreviation Algorithm:**
   * - Split type by spaces
   * - Filter out parenthetical content
   * - Take first letter of each remaining word
   * - Join letters for compact abbreviation
   * 
   * @param element - Element entity to generate label for
   * @returns Formatted display label string with type indicators
   * 
   * @remarks
   * **Memory Token Special Case:**
   * - All Memory Token variants use [MT] abbreviation
   * - Handles "Memory Token (Personal)", "Memory Token (Public)", etc.
   * - Consistent labeling regardless of memory type
   * 
   * **Parentheses Filtering:**
   * - Excludes words starting with '(' from abbreviation
   * - Prevents cluttered abbreviations from detailed type names
   * - Focuses on core type identification
   * 
   * **Label Examples:**
   * - Prop: "Murder Weapon" (no prefix)
   * - Memory Token: "[MT] Witness Statement"
   * - Custom Type: "[CT] Special Evidence"
   * - Multi-word: "Evidence Container" → "[EC] Evidence Container"
   * 
   * @example
   * ```typescript
   * // Standard prop (no prefix)
   * const label1 = transformer.generateLabel({ 
   *   name: 'Kitchen Knife', basicType: 'Prop' 
   * });
   * console.log(label1); // "Kitchen Knife"
   * 
   * // Memory token (special handling)
   * const label2 = transformer.generateLabel({ 
   *   name: 'Witness Account', basicType: 'Memory Token (Personal)' 
   * });
   * console.log(label2); // "[MT] Witness Account"
   * 
   * // Custom type (abbreviation)
   * const label3 = transformer.generateLabel({ 
   *   name: 'DNA Evidence', basicType: 'Forensic Evidence' 
   * });
   * console.log(label3); // "[FE] DNA Evidence"
   * ```
   * 
   * Complexity: O(w) where w = words in basicType
   */
  protected generateLabel(element: Element): string {
    // Use name as primary label
    let label = element.name || 'Unnamed Element';
    
    // Add type indicator if it's a special type
    if (element.basicType && element.basicType !== 'Prop') {
      let typeAbbrev: string;
      
      // Handle Memory Token types specially
      if (element.basicType.startsWith('Memory Token')) {
        typeAbbrev = 'MT';
      } else {
        // For other types, use first letter of each word (excluding parentheses)
        typeAbbrev = element.basicType
          .split(' ')
          .filter(word => !word.startsWith('('))
          .map(word => word[0])
          .join('');
      }
      
      label = `[${typeAbbrev}] ${label}`;
    }
    
    return label;
  }

  /**
   * Create comprehensive metadata for element graph nodes.
   * Combines base metadata with element-specific visual hints, SF patterns, and relationship tracking.
   * 
   * **Metadata Components:**
   * - Base metadata from BaseTransformer (ID, type, validation state)
   * - Status-based color coding from STATUS_COLORS mapping
   * - SF pattern metadata extraction and integration
   * - Size determination based on importance and SF value
   * - Container and dual-role element tracking
   * 
   * **SF Pattern Integration:**
   * - Extracts SF metadata from element description text
   * - Validates and stores SF patterns when found
   * - Uses SF value rating for size determination
   * - Supports narrative structure and game balance
   * 
   * **Visual Configuration:**
   * - Color: Status-based from STATUS_COLORS (development workflow)
   * - Size: Importance-based (SF value, container status, default small)
   * - Shape: Rectangle (distinguishes from other entity types)
   * - Consistent styling across all element nodes
   * 
   * **Relationship Tracking:**
   * - Owner information for character relationships
   * - Container status for containment hierarchies
   * - Dual-role detection (both requirement and reward)
   * - Cross-entity relationship preparation
   * 
   * @param element - Element entity to create metadata for
   * @param errors - Validation errors from element validation
   * @returns Complete NodeMetadata object with element-specific properties
   * 
   * @remarks
   * **SF Metadata Extraction:**
   * - Uses extractSFMetadata() utility on description text
   * - Only includes SF patterns if extraction finds valid patterns
   * - Extracted metadata used for size and importance calculations
   * 
   * **Size Determination Logic:**
   * - High SF value (≥4): Large (important narrative elements)
   * - Container elements: Medium (structural importance)
   * - Standard elements: Small (default size)
   * 
   * **Extended Metadata Properties:**
   * - `status`: Element development status
   * - `sfPatterns`: Extracted SF metadata when present
   * - `ownerName`: Character owner identifier (enriched later)
   * - `isContainer`: Container element flag
   * - `isDualRole`: Dual requirement/reward flag
   * 
   * @example
   * ```typescript
   * const metadata = transformer.createMetadata(element, validationErrors);
   * console.log(metadata.visualHints.color);  // '#10b981' (green for Done)
   * console.log(metadata.visualHints.size);   // 'large' | 'medium' | 'small'
   * console.log(metadata.status);             // 'Done'
   * console.log(metadata.sfPatterns);         // SF metadata object or undefined
   * 
   * // Check special element types
   * if (metadata.isContainer) {
   *   console.log('Element contains other elements');
   * }
   * if (metadata.isDualRole) {
   *   console.log('Element is both requirement and reward');
   * }
   * ```
   * 
   * Complexity: O(m) where m = description text length for SF extraction
   */
  protected createMetadata(element: Element, errors: string[]): NodeMetadata {
    // Extract SF patterns from element (may already be extracted or in descriptionText)
    const sfResult = extractSFMetadata(element.descriptionText || '');
    const sfMetadata = sfResult.metadata;
    
    // Determine element size based on importance
    const size = this.determineElementSize(element, sfMetadata);
    
    // Create visual hints with status color
    const visualHints: VisualHints = {
      color: STATUS_COLORS[element.status] || '#9ca3af',
      size,
      shape: 'rectangle',
    };
    
    // Create base metadata
    const metadata = super.createBaseMetadata(element, errors, visualHints);
    
    // Add element-specific metadata
    if (element.status) {
      metadata.status = element.status;
    }
    
    if (sfMetadata && sfResult.patternsFound.length > 0) {
      metadata.sfPatterns = sfMetadata;
    }
    
    if (element.ownerId) {
      metadata.ownerName = element.ownerId; // Will be enriched later
    }
    
    // Track container status
    if (element.isContainer) {
      (metadata as any).isContainer = true;
    }
    
    // Track dual-role elements
    if (element.requiredForPuzzleIds?.length && element.rewardedByPuzzleIds?.length) {
      (metadata as any).isDualRole = true;
    }
    
    return metadata;
  }

  /**
   * Enrich element node with cross-entity relationship data.
   * Adds detailed relationship information using lookup maps for characters, elements, puzzles, and timeline.
   * 
   * **Enrichment Categories:**
   * - **Owner Information**: Character details with tier mapping
   * - **Container Relationships**: Element containment hierarchies
   * - **Puzzle Associations**: Parent puzzle connections and collaborations
   * - **Timeline Integration**: Associated timeline event information
   * 
   * **Owner Enrichment:**
   * - Maps owner ID to character name and tier information
   * - Converts character tiers to expected format (Core→Tier 1, etc.)
   * - Provides character context for element ownership
   * 
   * **Collaboration Detection:**
   * - Analyzes puzzle elements to find collaboration requirements
   * - Identifies other character owners in same puzzle context
   * - Adds collaborator information with names and tiers
   * - Sets collaboration requirement flags
   * 
   * **Timeline Association:**
   * - Links elements to timeline events when associated
   * - Provides event details and discovery timing
   * - Supports narrative flow and investigation structure
   * 
   * @param node - Element graph node to enrich
   * @param lookupMaps - Entity lookup maps for cross-referencing
   * @returns Enriched node with additional relationship metadata
   * 
   * @remarks
   * **Lookup Map Structure:**
   * ```typescript
   * interface LookupMaps {
   *   characters: Map<string, Character>;
   *   elements: Map<string, Element>;
   *   puzzles: Map<string, Puzzle>;
   *   timeline: Map<string, TimelineEvent>;
   * }
   * ```
   * 
   * **Tier Mapping Logic:**
   * - Core → Tier 1 (highest priority)
   * - Secondary → Tier 2 (medium priority)
   * - Tertiary → Tier 3 (lowest priority)
   * - Maintains compatibility with existing tier systems
   * 
   * **Enriched Data Structure:**
   * - `containerName`: Name of containing element
   * - `parentPuzzleName`: Name of associated puzzle
   * - `collaborators`: Array of collaborating characters
   * - `requiresCollaboration`: Boolean collaboration flag
   * - `timelineInfo`: Associated timeline event details
   * 
   * @example
   * ```typescript
   * const enrichedNode = transformer.enrichNode(elementNode, lookupMaps);
   * const enriched = enrichedNode.data.metadata.enrichedData;
   * 
   * // Check owner enrichment
   * console.log(enrichedNode.data.metadata.ownerName);     // "Alice Johnson"
   * console.log(enrichedNode.data.metadata.ownerTier);     // "Tier 1"
   * 
   * // Check collaboration requirements
   * if (enriched?.requiresCollaboration) {
   *   console.log('Collaborators:', enriched.collaborators);
   * }
   * 
   * // Check timeline association
   * if (enriched?.timelineInfo) {
   *   console.log('Discovery date:', enriched.timelineInfo.earliestDiscovery);
   * }
   * ```
   * 
   * Complexity: O(c + p) where c = collaborators, p = puzzle elements
   */
  public enrichNode(node: GraphNode<Element>, lookupMaps: any): GraphNode<Element> {
    if (!lookupMaps) return node;
    
    const element = node.data.entity;
    const metadata = { ...node.data.metadata };
    
    // Initialize enrichedData if not present
    if (!metadata.enrichedData) {
      metadata.enrichedData = {};
    }
    
    // Enrich owner data
    if (element.ownerId && lookupMaps.characters) {
      const owner = lookupMaps.characters.get(element.ownerId);
      if (owner) {
        metadata.ownerName = owner.name;
        // Map character tier to expected format
        if (owner.tier === 'Core') {
          metadata.ownerTier = 'Tier 1';
        } else if (owner.tier === 'Secondary') {
          metadata.ownerTier = 'Tier 2';
        } else {
          metadata.ownerTier = 'Tier 3';
        }
      }
    }
    
    // Add container name if element is in a container
    if (element.containerId && lookupMaps.elements) {
      const container = lookupMaps.elements.get(element.containerId);
      if (container) {
        metadata.enrichedData.containerName = container.name;
      }
    }
    
    // Add parent puzzle name if element is from a puzzle container
    if (element.containerPuzzleId && lookupMaps.puzzles) {
      const puzzle = lookupMaps.puzzles.get(element.containerPuzzleId);
      if (puzzle) {
        metadata.enrichedData.parentPuzzleName = puzzle.name;
        
        // Find collaborators
        const collaborators = new Set<string>();
        if (puzzle.puzzleElementIds) {
          puzzle.puzzleElementIds.forEach((elemId: string) => {
            const otherElement = lookupMaps.elements.get(elemId);
            if (otherElement?.ownerId && otherElement.ownerId !== element.ownerId) {
              collaborators.add(otherElement.ownerId);
            }
          });
        }
        
        // Add collaborator information
        if (collaborators.size > 0) {
          metadata.enrichedData.collaborators = Array.from(collaborators).map(charId => {
            const character = lookupMaps.characters.get(charId);
            return {
              id: charId,
              name: character?.name || 'Unknown',
              tier: character?.tier || 'Unknown'
            };
          });
          metadata.enrichedData.requiresCollaboration = true;
        }
      }
    }
    
    // Add timeline information if element is associated with a timeline event
    if (element.timelineEventId && lookupMaps.timeline) {
      const timelineEvent = lookupMaps.timeline.get(element.timelineEventId);
      if (timelineEvent) {
        metadata.enrichedData.timelineInfo = {
          events: [{
            id: timelineEvent.id,
            name: timelineEvent.name,
            date: timelineEvent.date
          }],
          earliestDiscovery: timelineEvent.date
        };
      }
    }
    
    return {
      ...node,
      data: {
        ...node.data,
        metadata
      }
    };
  }

  /**
   * Validate Science Fiction metadata patterns for element consistency.
   * Checks SF pattern data structure and value constraints for game balance.
   * 
   * **Validation Rules:**
   * - Value rating must be 1-5 scale (game balance requirement)
   * - Memory type must be Personal/Public/Mixed (narrative categories)
   * - Pattern structure must be consistent with SF metadata schema
   * 
   * **Value Rating Validation:**
   * - Numeric conversion with NaN checking
   * - Range validation (1-5 inclusive)
   * - Critical for game balance and element importance
   * - Used in size determination and layout algorithms
   * 
   * **Memory Type Validation:**
   * - Restricted vocabulary for narrative consistency
   * - Personal: Character-specific memories
   * - Public: Shared/common knowledge
   * - Mixed: Combination of personal and public elements
   * 
   * @param patterns - SF pattern object to validate
   * @returns Array of validation error messages (empty if valid)
   * 
   * @remarks
   * **Value Rating Importance:**
   * - 1-2: Minor story elements, small visual size
   * - 3: Standard story elements, medium importance
   * - 4-5: Major story elements, large visual size, high layout priority
   * 
   * **Error Message Format:**
   * - Descriptive error messages for debugging
   * - Includes expected values and constraints
   * - Helps content creators fix SF pattern issues
   * 
   * **Pattern Structure:**
   * - Validates known SF pattern properties
   * - Extensible for additional SF metadata types
   * - Maintains consistency across element collection
   * 
   * @example
   * ```typescript
   * // Valid SF patterns
   * const errors1 = transformer.validateSFPatterns({
   *   valueRating: 4,
   *   memoryType: 'Personal'
   * });
   * console.log(errors1); // [] (no errors)
   * 
   * // Invalid value rating
   * const errors2 = transformer.validateSFPatterns({
   *   valueRating: 7,  // Out of range
   *   memoryType: 'Personal'
   * });
   * console.log(errors2); // ["Invalid SF value rating (must be 1-5)"]
   * 
   * // Invalid memory type
   * const errors3 = transformer.validateSFPatterns({
   *   valueRating: 3,
   *   memoryType: 'Custom'  // Not in allowed list
   * });
   * console.log(errors3); // ["Invalid SF memory type: Custom"]
   * ```
   * 
   * Complexity: O(k) where k = pattern properties
   */
  private validateSFPatterns(patterns: Record<string, any>): string[] {
    const errors: string[] = [];
    
    if (patterns.valueRating !== undefined) {
      const rating = Number(patterns.valueRating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        errors.push('Invalid SF value rating (must be 1-5)');
      }
    }
    
    if (patterns.memoryType && !['Personal', 'Public', 'Mixed'].includes(patterns.memoryType)) {
      errors.push(`Invalid SF memory type: ${patterns.memoryType}`);
    }
    
    return errors;
  }


  /**
   * Determine element node size based on importance and SF value analysis.
   * Calculates visual size using SF metadata and structural importance indicators.
   * 
   * **Size Categories:**
   * - **Large**: High-value SF items (value rating ≥ 4)
   * - **Medium**: Container elements and puzzle-associated items
   * - **Small**: Standard elements and low-value items (default)
   * 
   * **Importance Analysis:**
   * - SF value rating is primary importance indicator
   * - Container status indicates structural importance
   * - Puzzle association suggests narrative significance
   * - Size affects visual hierarchy and layout positioning
   * 
   * **SF Value Priority:**
   * - High SF values (4-5) override other size factors
   * - Critical for murder mystery narrative balance
   * - Ensures important clues get prominent positioning
   * - Supports game master focus and player attention
   * 
   * @param element - Element entity to analyze for size
   * @param sfMetadata - Extracted SF metadata (optional)
   * @returns Size category ('large' | 'medium' | 'small')
   * 
   * @remarks
   * **Decision Priority:**
   * 1. SF value rating ≥ 4 → Large (highest priority)
   * 2. Container or puzzle association → Medium
   * 3. Default → Small
   * 
   * **Container Logic:**
   * - Elements with content (contentIds) are containers
   * - Elements in puzzle containers (containerPuzzleId) are significant
   * - Both indicate structural importance warranting medium size
   * 
   * **Visual Impact:**
   * - Large: Dominant visual presence, high layout priority
   * - Medium: Balanced presence, moderate layout priority
   * - Small: Subtle presence, standard layout priority
   * 
   * @example
   * ```typescript
   * // High-value SF element
   * const size1 = transformer.determineElementSize(
   *   element,
   *   { valueRating: 5, memoryType: 'Personal' }
   * );
   * console.log(size1); // 'large'
   * 
   * // Container element
   * const size2 = transformer.determineElementSize({
   *   contentIds: ['item1', 'item2'],
   *   containerPuzzleId: undefined
   * });
   * console.log(size2); // 'medium'
   * 
   * // Standard element
   * const size3 = transformer.determineElementSize(
   *   { contentIds: [] },
   *   { valueRating: 2 }
   * );
   * console.log(size3); // 'small'
   * ```
   * 
   * Complexity: O(1)
   */
  private determineElementSize(element: Element, sfMetadata?: SFMetadata | null): 'small' | 'medium' | 'large' {
    // High-value SF items are large
    if (sfMetadata?.valueRating !== undefined && sfMetadata.valueRating >= 4) {
      return 'large';
    }
    
    // Container elements are medium
    if (element.contentIds?.length > 0 || element.containerPuzzleId) {
      return 'medium';
    }
    
    // Default to small
    return 'small';
  }

  /**
   * Sort element nodes by container status, development status, and alphabetical order.
   * Provides logical grouping for development workflow and element organization.
   * 
   * **Sorting Hierarchy:**
   * 1. **Primary**: Container status (containers first)
   * 2. **Secondary**: Development status (Done → Writing Complete → In development → Ideas)
   * 3. **Tertiary**: Alphabetical by label (consistent secondary ordering)
   * 
   * **Container Priority:**
   * - Container elements sorted before non-containers
   * - Containers provide structural context for contained elements
   * - Logical grouping for element hierarchy understanding
   * 
   * **Status-Based Workflow:**
   * - Done: Completed elements (highest priority)
   * - Writing Complete: Content finished, pending implementation
   * - In development: Active work in progress
   * - Idea/Placeholder: Planning stage (lowest priority)
   * - Unknown statuses sorted last
   * 
   * **Development Benefits:**
   * - Matches game master workflow priorities
   * - Groups ready content for immediate use
   * - Separates work-in-progress for development focus
   * - Maintains consistent ordering across views
   * 
   * @param nodes - Array of element graph nodes to sort
   * @returns Sorted array with container, status, and alphabetical ordering
   * 
   * @remarks
   * **Status Order Array:**
   * - Defines explicit development workflow priority
   * - Index-based comparison for consistent ordering
   * - Unknown statuses get high index (sorted last)
   * 
   * **Alphabetical Fallback:**
   * - Uses localeCompare() for proper string sorting
   * - Handles special characters and international text
   * - Provides stable sort for elements with same container/status
   * 
   * **Boolean Comparison Logic:**
   * - `isContainer` boolean: true values sort first (return -1)
   * - Ensures container elements appear before contained elements
   * - Clear visual hierarchy in element lists
   * 
   * @example
   * ```typescript
   * const unsorted = [
   *   { data: { entity: { isContainer: false, status: 'Idea/Placeholder' }, label: 'C Item' }},
   *   { data: { entity: { isContainer: true, status: 'Done' }, label: 'A Container' }},
   *   { data: { entity: { isContainer: false, status: 'Done' }, label: 'B Item' }}
   * ];
   * 
   * const sorted = transformer.sortNodes(unsorted);
   * // Result order:
   * // 1. A Container (container + Done)
   * // 2. B Item (Done)
   * // 3. C Item (Idea/Placeholder)
   * ```
   * 
   * Complexity: O(n log n) where n = nodes.length
   */
  protected sortNodes(nodes: GraphNode<Element>[]): GraphNode<Element>[] {
    return nodes.sort((a, b) => {
      const aElement = a.data.entity;
      const bElement = b.data.entity;
      
      // Containers first
      if (aElement.isContainer !== bElement.isContainer) {
        return aElement.isContainer ? -1 : 1;
      }
      
      // Then by status (Done first)
      const statusOrder = ['Done', 'Writing Complete', 'In development', 'Idea/Placeholder'];
      const aStatusIndex = statusOrder.indexOf(aElement.status || '');
      const bStatusIndex = statusOrder.indexOf(bElement.status || '');
      
      if (aStatusIndex !== bStatusIndex) {
        return (aStatusIndex === -1 ? 999 : aStatusIndex) - 
               (bStatusIndex === -1 ? 999 : bStatusIndex);
      }
      
      // Then alphabetically
      return a.data.label.localeCompare(b.data.label);
    });
  }
}

/**
 * Pre-configured singleton instance of ElementTransformer.
 * Ready-to-use transformer for story element processing with SF pattern integration.
 * 
 * **Usage Benefits:**
 * - Avoids repeated instantiation overhead
 * - Consistent configuration across application
 * - Immediate availability for element transformations
 * - Standard pattern matching other transformer modules
 * 
 * **Common Usage Patterns:**
 * - Single element transformation with SF metadata extraction
 * - Collection transformation with enrichment and sorting
 * - Integration with graph building pipeline
 * - Element-specific validation and metadata creation
 * 
 * @example
 * ```typescript
 * import { elementTransformer } from './transformers/ElementTransformer';
 * 
 * // Transform single element with enrichment
 * const elementNode = elementTransformer.transformEntity(storyElement);
 * 
 * // Transform sorted collection with status workflow
 * const elementNodes = elementTransformer.transformCollection(
 *   elements,
 *   { skipValidation: false, sortResults: true }
 * );
 * 
 * // Use in graph building with enrichment
 * const graphBuilder = new GraphBuilder();
 * const enrichedNodes = elementNodes.map(node => 
 *   elementTransformer.enrichNode(node, lookupMaps)
 * );
 * graphBuilder.addNodes(enrichedNodes);
 * 
 * // Access SF metadata for game balance
 * elementNodes.forEach(node => {
 *   const sfMetadata = node.data.metadata.enrichedData?.sfMetadata;
 *   if (sfMetadata?.valueRating >= 4) {
 *     console.log(`High-value element: ${node.data.label}`);
 *   }
 * });
 * ```
 * 
 * Singleton Pattern: Ensures consistent transformer configuration across modules
 */
export const elementTransformer = new ElementTransformer();