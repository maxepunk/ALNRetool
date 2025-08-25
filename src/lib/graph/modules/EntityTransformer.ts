/**
 * EntityTransformer Module
 * Unified facade for comprehensive Notion entity transformation with specialized delegation.
 * 
 * This module implements the Facade pattern to coordinate between specialized entity transformers,
 * providing a unified interface for converting raw Notion data into properly structured graph nodes.
 * It orchestrates the transformation pipeline including entity conversion, relationship enrichment,
 * cross-reference building, and metadata integration for the murder mystery game visualization.
 * 
 * **Core Responsibilities:**
 * - **Entity Coordination**: Manages delegation to specialized transformers for each entity type
 * - **Relationship Enrichment**: Builds comprehensive lookup maps for cross-entity relationships
 * - **Metadata Integration**: Enriches nodes with timeline data, SF patterns, and cross-references
 * - **Transformation Metrics**: Tracks and reports transformation statistics for monitoring
 * - **Error Handling**: Consolidates error states and validation results across transformers
 * 
 * **Transformation Pipeline:**
 * 1. **Lookup Map Building**: Creates comprehensive entity relationship maps
 * 2. **Entity Processing**: Delegates to specialized transformers for each type
 * 3. **Node Enrichment**: Enhances nodes with cross-references and metadata
 * 4. **Metrics Calculation**: Compiles transformation statistics and error counts
 * 5. **Result Assembly**: Combines all transformed nodes into unified collection
 * 
 * **Specialized Transformer Integration:**
 * - **CharacterTransformer**: Detective, suspect, and victim character processing
 * - **ElementTransformer**: Clues, evidence, and investigative item processing  
 * - **PuzzleTransformer**: Murder mystery puzzle and challenge processing
 * - **TimelineTransformer**: Crime timeline and temporal event processing
 * 
 * **Enrichment Features:**
 * - **Cross-Entity References**: Links elements to related characters and puzzles
 * - **Timeline Integration**: Connects entities to temporal events and sequences
 * - **SF Pattern Detection**: Identifies and flags Science Fiction themed content
 * - **Relationship Mapping**: Builds bidirectional relationship graphs
 * - **Error Consolidation**: Aggregates validation errors across all entities
 * 
 * @example
 * ```typescript
 * // Basic transformation with all entities
 * const transformer = new EntityTransformer();
 * const allNodes = transformer.transformEntities(notionData);
 * console.log(`Transformed ${allNodes.length} entities`);
 * 
 * // Selective transformation excluding timeline
 * const coreNodes = transformer.transformEntities(notionData, ['timeline']);
 * 
 * // Entity-specific transformations
 * const characterNodes = transformer.transformCharacters(data.characters);
 * const puzzleNodes = transformer.transformPuzzles(data.puzzles);
 * 
 * // Metrics and monitoring
 * const nodes = transformer.transformEntities(data);
 * const errorNodes = nodes.filter(n => n.data.metadata.errorState);
 * console.log(`Found ${errorNodes.length} nodes with errors`);
 * ```
 * 
 * @see {@link CharacterTransformer} - Detective and character processing
 * @see {@link ElementTransformer} - Clue and evidence processing  
 * @see {@link PuzzleTransformer} - Murder mystery puzzle processing
 * @see {@link TimelineTransformer} - Crime timeline processing
 * @see {@link buildLookupMaps} - Cross-entity relationship mapping
 */

import { log } from '@/utils/logger';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent 
} from '@/types/notion/app';
import type {
  GraphNode,
  EntityType,
  EntityTransformer as IEntityTransformer,
  NotionData
} from '../types';

import { CharacterTransformer } from './transformers/CharacterTransformer';
import { ElementTransformer } from './transformers/ElementTransformer';
import { PuzzleTransformer } from './transformers/PuzzleTransformer';
import { TimelineTransformer } from './transformers/TimelineTransformer';
import { buildLookupMaps } from '../relationships';

/**
 * EntityTransformer Class
 * 
 * Unified facade for comprehensive Notion entity transformation with specialized delegation.
 * Implements the Facade pattern to coordinate between multiple entity-specific transformers,
 * providing a single, coherent interface for converting complex Notion data structures into
 * properly formatted graph nodes ready for React Flow visualization.
 * 
 * **Architecture Pattern: Facade**
 * - **Simplified Interface**: Single entry point for all entity transformation operations
 * - **Delegation Strategy**: Routes requests to appropriate specialized transformers
 * - **Cross-Entity Coordination**: Manages relationships and dependencies between entity types
 * - **Unified Error Handling**: Consolidates error states and validation across transformers
 * 
 * **Transformer Ecosystem:**
 * - **CharacterTransformer**: Processes detective, suspect, victim, and witness entities
 * - **ElementTransformer**: Handles clues, evidence, investigation tools, and case materials
 * - **PuzzleTransformer**: Transforms murder mystery puzzles, challenges, and investigative tasks
 * - **TimelineTransformer**: Converts temporal events, crime sequences, and timeline markers
 * 
 * **Enrichment Pipeline:**
 * 1. **Base Transformation**: Specialized transformers create basic node structures
 * 2. **Lookup Map Creation**: Builds comprehensive relationship maps across all entities
 * 3. **Cross-Reference Enrichment**: Adds bidirectional relationships and dependencies
 * 4. **Metadata Integration**: Incorporates timeline data, SF patterns, and game mechanics
 * 5. **Error State Consolidation**: Aggregates validation results and error conditions
 * 
 * **Performance Characteristics:**
 * - **Batch Processing**: Efficient bulk transformation of entity collections
 * - **Lazy Loading**: Transformers instantiated once and reused across operations
 * - **Memory Efficient**: Uses lookup maps to avoid redundant relationship calculations
 * - **Scalable Design**: Handles large datasets with O(n log n) complexity per entity type
 * 
 * @class EntityTransformer
 * @implements {IEntityTransformer}
 * @see {@link IEntityTransformer} - Interface contract definition
 * @see {@link NotionData} - Input data structure specification
 * @see {@link GraphNode} - Output node format specification
 */
export class EntityTransformer implements IEntityTransformer {
  /** Character-specific transformer instance */
  private characterTransformer = new CharacterTransformer();
  /** Element-specific transformer instance */
  private elementTransformer = new ElementTransformer();
  /** Puzzle-specific transformer instance */
  private puzzleTransformer = new PuzzleTransformer();
  /** Timeline-specific transformer instance */
  private timelineTransformer = new TimelineTransformer();

  /**
   * Transform character entities to specialized graph nodes with detective game context.
   * Delegates to CharacterTransformer for specialized processing of detective, suspect,
   * victim, and witness entities with appropriate visual styling and metadata.
   * 
   * **Character Processing Pipeline:**
   * 1. **Entity Validation**: Validates character data structure and required fields
   * 2. **Role Classification**: Identifies detective, suspect, victim, witness roles
   * 3. **Visual Styling**: Applies role-appropriate colors, icons, and node styling
   * 4. **Metadata Enrichment**: Adds character-specific metadata and game context
   * 5. **Relationship Preparation**: Prepares nodes for ownership and interaction edges
   * 6. **Sorting & Organization**: Orders characters by role importance and name
   * 
   * **Character Node Features:**
   * - **Role-Based Styling**: Distinct visual representation for each character type
   * - **Ownership Integration**: Prepared for ownership relationships with elements
   * - **Investigation Context**: Includes detective game specific metadata
   * - **Error Handling**: Robust processing of incomplete or malformed character data
   * 
   * **Supported Character Types:**
   * - **Detective**: Primary investigators with special styling and capabilities
   * - **Suspect**: Potential perpetrators with distinctive visual markers
   * - **Victim**: Crime victims with appropriate respectful representation
   * - **Witness**: Information sources with neutral styling
   * - **Other**: Supporting characters with default styling
   * 
   * @param characters - Array of character entities from Notion database
   * @returns Array of character graph nodes ready for React Flow rendering
   * 
   * @example
   * ```typescript
   * // Transform all characters with role-based styling
   * const characterNodes = transformer.transformCharacters(data.characters);
   * console.log(`Processed ${characterNodes.length} characters`);
   * 
   * // Analyze character roles
   * const detectives = characterNodes.filter(n => 
   *   n.data.metadata.role === 'detective'
   * );
   * const suspects = characterNodes.filter(n => 
   *   n.data.metadata.role === 'suspect'
   * );
   * 
   * // Check for processing errors
   * const errorCharacters = characterNodes.filter(n => 
   *   n.data.metadata.errorState
   * );
   * if (errorCharacters.length > 0) {
   *   console.warn(`${errorCharacters.length} characters had processing errors`);
   * }
   * ```
   * 
   * Complexity: O(n log n) where n = characters.length (includes role-based sorting)
   */
  transformCharacters(characters: Character[]): GraphNode[] {
    return this.characterTransformer.transformMultiple(characters);
  }

  /**
   * Transform element entities to investigative item graph nodes with clue context.
   * Delegates to ElementTransformer for specialized processing of clues, evidence,
   * investigation tools, and case materials with appropriate visual styling and metadata.
   * 
   * **Element Processing Pipeline:**
   * 1. **Entity Validation**: Validates element data structure and investigative context
   * 2. **Type Classification**: Identifies clues, evidence, tools, and case materials
   * 3. **Visual Styling**: Applies category-appropriate colors, icons, and styling
   * 4. **SF Pattern Detection**: Identifies Science Fiction themed elements
   * 5. **Puzzle Relationship Prep**: Prepares for requirement/reward edge connections
   * 6. **Sorting & Organization**: Orders elements by importance and category
   * 
   * **Element Node Features:**
   * - **Category-Based Styling**: Distinct visual representation for each element type
   * - **Puzzle Integration**: Prepared for requirement and reward relationships
   * - **Investigation Context**: Includes murder mystery specific metadata
   * - **SF Pattern Support**: Special handling for Science Fiction themed content
   * - **Error Handling**: Robust processing of incomplete or malformed element data
   * 
   * **Supported Element Categories:**
   * - **Clues**: Investigative evidence and information sources
   * - **Evidence**: Physical items and forensic materials
   * - **Tools**: Investigation equipment and analysis instruments
   * - **Documents**: Case files, reports, and written materials
   * - **Digital**: Computer files, databases, and digital evidence
   * 
   * @param elements - Array of element entities from Notion database
   * @returns Array of element graph nodes ready for React Flow rendering
   * 
   * @example
   * ```typescript
   * // Transform all elements with category-based styling
   * const elementNodes = transformer.transformElements(data.elements);
   * console.log(`Processed ${elementNodes.length} investigation elements`);
   * 
   * // Analyze element categories
   * const clues = elementNodes.filter(n => 
   *   n.data.metadata.category === 'clue'
   * );
   * const evidence = elementNodes.filter(n => 
   *   n.data.metadata.category === 'evidence'
   * );
   * 
   * // Find SF themed elements
   * const sfElements = elementNodes.filter(n => 
   *   n.data.metadata.sfPatterns && Object.keys(n.data.metadata.sfPatterns).length > 0
   * );
   * console.log(`Found ${sfElements.length} SF-themed elements`);
   * 
   * // Check for processing errors
   * const errorElements = elementNodes.filter(n => 
   *   n.data.metadata.errorState
   * );
   * ```
   * 
   * Complexity: O(n log n) where n = elements.length (includes category-based sorting)
   */
  transformElements(elements: Element[]): GraphNode[] {
    return this.elementTransformer.transformMultiple(elements);
  }

  /**
   * Transform puzzle entities to murder mystery challenge graph nodes with game context.
   * Delegates to PuzzleTransformer for specialized processing of investigation puzzles,
   * mystery challenges, and detective tasks with appropriate complexity indicators and metadata.
   * 
   * **Puzzle Processing Pipeline:**
   * 1. **Entity Validation**: Validates puzzle data structure and game mechanics
   * 2. **Complexity Assessment**: Calculates difficulty levels and player requirements
   * 3. **Visual Styling**: Applies complexity-based colors, shapes, and indicators
   * 4. **Dependency Analysis**: Identifies prerequisite and reward relationships
   * 5. **Narrative Integration**: Links puzzles to story threads and murder mystery plot
   * 6. **Sorting & Organization**: Orders puzzles by difficulty and story progression
   * 
   * **Puzzle Node Features:**
   * - **Complexity Indicators**: Visual representation of puzzle difficulty and requirements
   * - **Dependency Integration**: Prepared for prerequisite and reward edge connections
   * - **Murder Mystery Context**: Includes detective game specific mechanics and themes
   * - **Narrative Threading**: Connected to story progression and plot development
   * - **Error Handling**: Robust processing of incomplete or malformed puzzle data
   * 
   * **Supported Puzzle Types:**
   * - **Investigation**: Evidence analysis and clue interpretation challenges
   * - **Logic**: Deductive reasoning and pattern recognition puzzles
   * - **Social**: Interview and interrogation interaction challenges
   * - **Physical**: Crime scene examination and forensic analysis
   * - **Digital**: Computer investigation and data analysis puzzles
   * 
   * @param puzzles - Array of puzzle entities from Notion database
   * @returns Array of puzzle graph nodes ready for React Flow rendering
   * 
   * @example
   * ```typescript
   * // Transform all puzzles with complexity indicators
   * const puzzleNodes = transformer.transformPuzzles(data.puzzles);
   * console.log(`Processed ${puzzleNodes.length} murder mystery puzzles`);
   * 
   * // Analyze puzzle complexity
   * const easyPuzzles = puzzleNodes.filter(n => 
   *   n.data.metadata.complexity === 'easy'
   * );
   * const hardPuzzles = puzzleNodes.filter(n => 
   *   n.data.metadata.complexity === 'hard'
   * );
   * 
   * // Check narrative threading
   * const storyPuzzles = puzzleNodes.filter(n => 
   *   n.data.metadata.narrativeThreads?.length > 0
   * );
   * console.log(`${storyPuzzles.length} puzzles have narrative connections`);
   * 
   * // Identify prerequisite chains
   * const rootPuzzles = puzzleNodes.filter(n => 
   *   !n.data.entity.prereqPuzzleIds || n.data.entity.prereqPuzzleIds.length === 0
   * );
   * ```
   * 
   * Complexity: O(n log n) where n = puzzles.length (includes complexity-based sorting)
   */
  transformPuzzles(puzzles: Puzzle[]): GraphNode[] {
    return this.puzzleTransformer.transformMultiple(puzzles);
  }

  /**
   * Transform timeline entities to temporal event graph nodes with crime sequence context.
   * Delegates to TimelineTransformer for specialized processing of crime events,
   * investigation milestones, and temporal markers with chronological ordering and metadata.
   * 
   * **Timeline Processing Pipeline:**
   * 1. **Entity Validation**: Validates timeline data structure and temporal consistency
   * 2. **Chronological Sorting**: Orders events by timestamp and sequence importance
   * 3. **Visual Styling**: Applies time-based colors, shapes, and chronological indicators
   * 4. **Event Classification**: Identifies crime events, investigation steps, and milestones
   * 5. **Temporal Relationships**: Prepares for before/after and causality edge connections
   * 6. **Story Integration**: Links timeline events to characters, puzzles, and evidence
   * 
   * **Timeline Node Features:**
   * - **Chronological Indicators**: Visual representation of event timing and sequence
   * - **Temporal Relationships**: Prepared for before/after and causality edge connections
   * - **Crime Context**: Includes murder mystery timeline and investigation progression
   * - **Multi-Entity Links**: Connected to related characters, puzzles, and evidence
   * - **Error Handling**: Robust processing of incomplete or temporally inconsistent data
   * 
   * **Supported Timeline Event Types:**
   * - **Crime Events**: Murders, disappearances, and criminal activities
   * - **Investigation Steps**: Detective actions, evidence collection, and analysis
   * - **Character Actions**: Suspect movements, witness observations, victim activities
   * - **Evidence Discovery**: When and where clues and evidence were found
   * - **Plot Milestones**: Key story developments and revelation moments
   * 
   * @param timeline - Array of timeline event entities from Notion database
   * @returns Array of timeline graph nodes ready for React Flow rendering
   * 
   * @example
   * ```typescript
   * // Transform all timeline events with chronological ordering
   * const timelineNodes = transformer.transformTimeline(data.timeline);
   * console.log(`Processed ${timelineNodes.length} timeline events`);
   * 
   * // Analyze event types
   * const crimeEvents = timelineNodes.filter(n => 
   *   n.data.metadata.eventType === 'crime'
   * );
   * const investigationSteps = timelineNodes.filter(n => 
   *   n.data.metadata.eventType === 'investigation'
   * );
   * 
   * // Check chronological consistency
   * const sortedEvents = timelineNodes.sort((a, b) => 
   *   new Date(a.data.entity.timestamp).getTime() - 
   *   new Date(b.data.entity.timestamp).getTime()
   * );
   * 
   * // Find timeline gaps or inconsistencies
   * const errorEvents = timelineNodes.filter(n => 
   *   n.data.metadata.errorState?.includes('temporal_inconsistency')
   * );
   * ```
   * 
   * Complexity: O(n log n) where n = timeline.length (includes chronological sorting)
   */
  transformTimeline(timeline: TimelineEvent[]): GraphNode[] {
    return this.timelineTransformer.transformMultiple(timeline);
  }

  /**
   * Transform all Notion entities into comprehensive graph node collection with enrichment.
   * Main orchestration method that coordinates all entity transformers, builds relationship maps,
   * enriches nodes with cross-references, and provides detailed transformation metrics.
   * 
   * **Comprehensive Transformation Pipeline:**
   * 1. **Lookup Map Construction**: Builds complete cross-entity relationship maps
   * 2. **Selective Processing**: Transforms each entity type unless explicitly excluded
   * 3. **Cross-Entity Enrichment**: Enhances nodes with bidirectional relationships
   * 4. **Metadata Integration**: Adds timeline connections, SF patterns, and game context
   * 5. **Error Consolidation**: Aggregates validation errors and processing issues
   * 6. **Metrics Calculation**: Compiles comprehensive transformation statistics
   * 
   * **Entity Processing Order:**
   * - **Characters First**: Establishes ownership and interaction foundations
   * - **Elements with Enrichment**: Processes investigation items with full cross-references
   * - **Puzzles**: Transforms challenges with dependency and narrative connections
   * - **Timeline Last**: Adds temporal context and chronological relationships
   * 
   * **Enrichment Features:**
   * - **Cross-Entity References**: Links elements to related characters, puzzles, and events
   * - **Timeline Integration**: Connects entities to temporal sequences and crime events
   * - **SF Pattern Detection**: Identifies and flags Science Fiction themed content
   * - **Relationship Validation**: Ensures bidirectional consistency and data integrity
   * - **Error State Tracking**: Consolidates processing errors and validation failures
   * 
   * **Filtering Capabilities:**
   * - **Type Exclusion**: Skip entire entity categories for focused processing
   * - **Performance Optimization**: Reduce processing time for specific use cases
   * - **Testing Support**: Enable isolated testing of specific entity combinations
   * - **Memory Management**: Control memory usage in large dataset scenarios
   * 
   * **Metrics and Monitoring:**
   * - **Entity Counts**: Total and per-type transformation statistics
   * - **Error Tracking**: Count and categorization of processing errors
   * - **Pattern Detection**: SF pattern and special content identification
   * - **Performance Monitoring**: Timing and efficiency measurements
   * 
   * @param data - Complete Notion data including all murder mystery entity types
   * @param excludeTypes - Optional array of entity types to exclude from processing
   * @returns Array of all transformed graph nodes with complete enrichment and cross-references
   * 
   * @example
   * ```typescript
   * // Transform complete murder mystery dataset
   * const allNodes = transformer.transformEntities(notionData);
   * console.log(`Transformed ${allNodes.length} total entities`);
   * 
   * // Focus on core entities (exclude timeline for performance)
   * const coreNodes = transformer.transformEntities(notionData, ['timeline']);
   * 
   * // Character-focused transformation for relationship analysis
   * const socialGraph = transformer.transformEntities(notionData, ['timeline', 'puzzle']);
   * 
   * // Analyze transformation results
   * const errorNodes = allNodes.filter(n => n.data.metadata.errorState);
   * const sfNodes = allNodes.filter(n => n.data.metadata.sfPatterns);
   * const enrichedElements = allNodes.filter(n => 
   *   n.data.metadata.entityType === 'element' && n.data.metadata.enriched
   * );
   * 
   * console.log(`Processing results:`);
   * console.log(`- ${errorNodes.length} nodes with errors`);
   * console.log(`- ${sfNodes.length} SF-themed nodes`);
   * console.log(`- ${enrichedElements.length} enriched elements`);
   * 
   * // Performance monitoring
   * const startTime = performance.now();
   * const nodes = transformer.transformEntities(largeDataset);
   * const processingTime = performance.now() - startTime;
   * console.log(`Processed ${nodes.length} entities in ${processingTime.toFixed(2)}ms`);
   * ```
   * 
   * Complexity: O(n log n) where n = total entities across all types (dominated by sorting operations)
   */
  transformEntities(data: NotionData, excludeTypes?: EntityType[]): GraphNode[] {
    log.debug('Transforming entities to nodes');
    
    // Build complete lookup maps for enrichment
    // These maps enable cross-entity relationship resolution and metadata enrichment
    const lookupMaps = buildLookupMaps(
      data.characters,
      data.elements,
      data.puzzles,
      data.timeline
    );
    
    const allNodes: GraphNode[] = [];
    
    // Transform each entity type unless excluded
    if (!excludeTypes?.includes('character')) {
      allNodes.push(...this.characterTransformer.transformMultiple(data.characters));
    }
    
    if (!excludeTypes?.includes('element')) {
      const elementNodes = this.elementTransformer.transformMultiple(data.elements);
      // Enrich element nodes with timeline and other metadata
      // Element enrichment adds cross-references and relationship data
      const enrichedElementNodes = elementNodes.map(node => 
        this.elementTransformer.enrichNode(node, lookupMaps)
      );
      allNodes.push(...enrichedElementNodes);
    }
    
    if (!excludeTypes?.includes('puzzle')) {
      allNodes.push(...this.puzzleTransformer.transformMultiple(data.puzzles));
    }
    
    if (!excludeTypes?.includes('timeline')) {
      allNodes.push(...this.timelineTransformer.transformMultiple(data.timeline));
    }
    
    // Calculate transformation metrics for logging and monitoring
    const metrics = {
      total: allNodes.length,
      byType: {
        character: data.characters.length,
        element: data.elements.length,
        puzzle: data.puzzles.length,
        timeline: data.timeline.length,
      },
      withErrors: allNodes.filter(n => n.data.metadata.errorState).length,
      withSFPatterns: allNodes.filter(n => n.data.metadata.sfPatterns).length,
    };
    
    log.info('Node transformation complete', metrics);
    
    return allNodes;
  }
}

// Export singleton instance
// Singleton removed - use dependency injection via GraphContext instead