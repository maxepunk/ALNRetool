/**
 * Murder Mystery Investigation Node Collector
 * 
 * Centralized utility for collecting, filtering, and transforming murder mystery investigation
 * entities into interactive graph nodes optimized for detective workflows and case analysis.
 * 
 * This utility eliminates repetitive collection loops across investigation strategy classes
 * while providing sophisticated filtering capabilities for focused case investigation.
 * Coordinates with EntityTransformer to ensure consistent node creation with investigation-specific
 * metadata, styling, and interactive behavior.
 * 
 * **Core Investigation Capabilities:**
 * - **Entity Filtering**: Selective inclusion of suspects, evidence, and timeline events
 * - **Batch Transformation**: Efficient processing of large investigation datasets
 * - **Type-Safe Collection**: Dedicated methods for each investigation entity type
 * - **ID-based Filtering**: Precise entity selection for focused investigation views
 * - **Cross-Entity Operations**: Unified collection across all investigation entity types
 * 
 * **Investigation Entity Types:**
 * - **Characters**: Suspects, witnesses, key figures with relationship data
 * - **Elements**: Story elements, locations, environmental evidence
 * - **Puzzles**: Investigation clues, evidence chains, analysis requirements
 * - **Timeline**: Significant events, sequences, temporal investigation markers
 * 
 * **Performance Optimization:**
 * - Pre-filtered entity sets to reduce transformation overhead
 * - Efficient flatMap operations for entity-to-node conversion
 * - Debug logging for investigation performance analysis
 * - Minimal memory allocation through filtered processing
 * 
 * @example Suspect Investigation Collection
 * ```typescript
 * const nodeCollector = new NodeCollector(
 *   entityTransformer,
 *   new Set(['alice-sterling', 'bob-martinez', 'evidence-knife'])
 * );
 * 
 * // Collect specific suspect nodes
 * const suspectNodes = nodeCollector.collectCharacterNodes(
 *   investigationData.characters.filter(c => c.role === 'suspect')
 * );
 * 
 * // Collect evidence nodes
 * const evidenceNodes = nodeCollector.collectPuzzleNodes(
 *   investigationData.puzzles.filter(p => p.tags?.includes('evidence'))
 * );
 * ```
 * 
 * @example Comprehensive Investigation Collection
 * ```typescript
 * // Set investigation focus
 * nodeCollector.setIncludedNodeIds(new Set([
 *   'crime-scene', 'primary-suspect', 'key-evidence', 'witness-testimony'
 * ]));
 * 
 * // Collect all relevant investigation entities
 * const allInvestigationNodes = nodeCollector.collectAll(investigationData);
 * ```
 * 
 * @see {@link EntityTransformer} For entity-to-node transformation logic
 * @see {@link GraphNode} For investigation node structure and metadata
 * @see {@link NotionData} For complete investigation dataset structure
 * 
 * Complexity: O(n) where n = number of entities processed (linear filtering and transformation)
 */

import { log } from '@/utils/logger';
import type { EntityTransformer } from '../modules/EntityTransformer';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent 
} from '@/types/notion/app';
import type { GraphNode, NotionData } from '../types';

/** Investigation entity type identifiers for murder mystery case analysis */
export type EntityType = 'character' | 'element' | 'puzzle' | 'timeline';

/**
 * Murder Mystery Investigation Node Collector
 * 
 * Unified utility for collecting and transforming investigation entities into interactive
 * graph nodes with filtering, batching, and performance optimization capabilities.
 * Essential for building focused investigation views from large murder mystery datasets.
 * 
 * **Key Features:**
 * - Entity filtering by ID sets for precise investigation focus
 * - Type-safe collection methods for all investigation entity types
 * - Efficient batch processing with debug logging and performance tracking
 * - Flexible entity selection with cross-type collection capabilities
 * 
 * Complexity: O(n + f) where n = entities processed, f = filtering operations
 */
export class NodeCollector {
  /** Investigation entity transformer for converting raw entities to interactive graph nodes */
  private entityTransformer: EntityTransformer;
  
  /** Optional filter set containing investigation entity IDs to include in node collection */
  private includedNodeIds?: Set<string>;
  
  /**
   * Initialize the murder mystery investigation node collector.
   * 
   * Sets up the entity transformation infrastructure and optional ID filtering
   * for precise investigation entity selection and graph node creation.
   * 
   * @param entityTransformer - Investigation entity transformer for converting raw entities to interactive graph nodes
   * @param includedNodeIds - Optional set of investigation entity IDs to include in collection (undefined = include all)
   * 
   * @example Filtered Investigation Collection
   * ```typescript
   * // Create collector with suspect and evidence focus
   * const focusedCollector = new NodeCollector(
   *   entityTransformer,
   *   new Set(['alice-sterling', 'murder-weapon', 'crime-scene-timeline'])
   * );
   * ```
   * 
   * @example Unfiltered Investigation Collection
   * ```typescript
   * // Create collector for comprehensive investigation view
   * const comprehensiveCollector = new NodeCollector(entityTransformer);
   * ```
   * 
   * Complexity: O(1) - Simple initialization with optional filter set
   */
  constructor(
    entityTransformer: EntityTransformer,
    includedNodeIds?: Set<string>
  ) {
    this.entityTransformer = entityTransformer;
    this.includedNodeIds = includedNodeIds;
  }

  /**
   * Update the investigation entity ID filter for dynamic investigation focus.
   * 
   * Allows runtime modification of the entity inclusion filter to change investigation
   * focus without creating new NodeCollector instances. Useful for interactive
   * investigation workflows where the focus shifts between suspects, evidence, and timeline events.
   * 
   * @param includedNodeIds - New set of investigation entity IDs to include (undefined = include all entities)
   * 
   * @example Dynamic Investigation Focus Change
   * ```typescript
   * // Start with suspect focus
   * nodeCollector.setIncludedNodeIds(new Set(['alice-sterling', 'bob-martinez']));
   * const suspectNodes = nodeCollector.collectCharacterNodes(characters);
   * 
   * // Shift to evidence focus
   * nodeCollector.setIncludedNodeIds(new Set(['murder-weapon', 'dna-evidence', 'witness-statement']));
   * const evidenceNodes = nodeCollector.collectPuzzleNodes(puzzles);
   * 
   * // Clear filter for comprehensive view
   * nodeCollector.setIncludedNodeIds(undefined);
   * const allNodes = nodeCollector.collectAll(investigationData);
   * ```
   * 
   * Complexity: O(1) - Simple filter reference update
   */
  setIncludedNodeIds(includedNodeIds: Set<string> | undefined): void {
    this.includedNodeIds = includedNodeIds;
  }

  /**
   * Collect and transform character entities into investigation graph nodes.
   * 
   * Processes character entities (suspects, witnesses, key figures) through filtering
   * and transformation to create interactive graph nodes optimized for character-focused
   * investigation workflows and relationship analysis.
   * 
   * @param characters - Array of character entities to process for investigation node creation
   * @returns Array of interactive character graph nodes with investigation metadata and styling
   * 
   * @example Suspect Node Collection
   * ```typescript
   * const suspects = investigationData.characters.filter(c => c.role === 'suspect');
   * const suspectNodes = nodeCollector.collectCharacterNodes(suspects);
   * 
   * // Result: Interactive character nodes with:
   * // - Suspect relationship data
   * // - Alibi information
   * // - Suspicion level indicators
   * // - Interactive investigation capabilities
   * ```
   * 
   * @example Witness Node Collection
   * ```typescript
   * const witnesses = investigationData.characters.filter(c => c.role === 'witness');
   * const witnessNodes = nodeCollector.collectCharacterNodes(witnesses);
   * ```
   * 
   * Complexity: O(n) where n = number of character entities processed
   */
  collectCharacterNodes(characters: Character[]): GraphNode[] {
    // Apply investigation entity ID filter to focus on relevant characters
    const filteredCharacters = this.filterByIncludedIds(characters);
    
    // Transform filtered characters into interactive investigation graph nodes
    const characterInvestigationNodes = filteredCharacters.flatMap(character => 
      this.entityTransformer.transformCharacters([character])
    );
    
    // Log investigation character collection metrics for performance analysis
    log.debug('NodeCollector.collectCharacterNodes: Character investigation node collection completed', {
      inputCharacters: characters.length,
      filteredCharacters: filteredCharacters.length,
      outputNodes: characterInvestigationNodes.length,
      filterApplied: !!this.includedNodeIds,
      collectionEfficiency: `${((filteredCharacters.length / characters.length) * 100).toFixed(1)}%`
    });
    
    return characterInvestigationNodes;
  }

  /**
   * Collect and transform story element entities into investigation graph nodes.
   * 
   * Processes story element entities (locations, environmental evidence, contextual details)
   * through filtering and transformation to create interactive graph nodes optimized for
   * environmental investigation and location-based case analysis.
   * 
   * @param elements - Array of story element entities to process for investigation node creation
   * @returns Array of interactive element graph nodes with environmental investigation metadata
   * 
   * @example Location Node Collection
   * ```typescript
   * const crimeScenes = investigationData.elements.filter(e => e.basicType === 'location');
   * const locationNodes = nodeCollector.collectElementNodes(crimeScenes);
   * 
   * // Result: Interactive location nodes with:
   * // - Crime scene details
   * // - Environmental evidence
   * // - Access control information
   * // - Investigation timeline markers
   * ```
   * 
   * @example Evidence Environment Collection
   * ```typescript
   * const environmentalEvidence = investigationData.elements.filter(e => 
   *   e.tags?.includes('evidence') && e.basicType === 'environment'
   * );
   * const evidenceNodes = nodeCollector.collectElementNodes(environmentalEvidence);
   * ```
   * 
   * Complexity: O(n) where n = number of element entities processed
   */
  collectElementNodes(elements: Element[]): GraphNode[] {
    // Apply investigation entity ID filter to focus on relevant story elements
    const filteredElements = this.filterByIncludedIds(elements);
    
    // Transform filtered elements into interactive investigation graph nodes
    const elementInvestigationNodes = filteredElements.flatMap(element => 
      this.entityTransformer.transformElements([element])
    );
    
    // Log investigation element collection metrics for performance analysis
    log.debug('NodeCollector.collectElementNodes: Story element investigation node collection completed', {
      inputElements: elements.length,
      filteredElements: filteredElements.length,
      outputNodes: elementInvestigationNodes.length,
      filterApplied: !!this.includedNodeIds,
      collectionEfficiency: `${((filteredElements.length / elements.length) * 100).toFixed(1)}%`
    });
    
    return elementInvestigationNodes;
  }

  /**
   * Collect and transform puzzle entities into investigation graph nodes.
   * 
   * Processes puzzle entities (clues, evidence items, analysis requirements) through
   * filtering and transformation to create interactive graph nodes optimized for
   * evidence-focused investigation workflows and puzzle dependency analysis.
   * 
   * @param puzzles - Array of puzzle entities to process for investigation node creation
   * @returns Array of interactive puzzle graph nodes with evidence and clue investigation metadata
   * 
   * @example Evidence Puzzle Collection
   * ```typescript
   * const evidencePuzzles = investigationData.puzzles.filter(p => 
   *   p.tags?.includes('evidence') && p.status !== 'completed'
   * );
   * const evidenceNodes = nodeCollector.collectPuzzleNodes(evidencePuzzles);
   * 
   * // Result: Interactive evidence nodes with:
   * // - Evidence chain dependencies
   * // - Analysis requirements
   * // - Investigation status tracking
   * // - Forensic analysis capabilities
   * ```
   * 
   * @example Clue Puzzle Collection
   * ```typescript
   * const investigativeClues = investigationData.puzzles.filter(p => 
   *   p.basicType === 'clue' && p.difficulty <= 3
   * );
   * const clueNodes = nodeCollector.collectPuzzleNodes(investigativeClues);
   * ```
   * 
   * Complexity: O(n) where n = number of puzzle entities processed
   */
  collectPuzzleNodes(puzzles: Puzzle[]): GraphNode[] {
    // Apply investigation entity ID filter to focus on relevant puzzles and evidence
    const filteredPuzzles = this.filterByIncludedIds(puzzles);
    
    // Transform filtered puzzles into interactive investigation graph nodes
    const puzzleInvestigationNodes = filteredPuzzles.flatMap(puzzle => 
      this.entityTransformer.transformPuzzles([puzzle])
    );
    
    // Log investigation puzzle collection metrics for performance analysis
    log.debug('NodeCollector.collectPuzzleNodes: Puzzle and evidence investigation node collection completed', {
      inputPuzzles: puzzles.length,
      filteredPuzzles: filteredPuzzles.length,
      outputNodes: puzzleInvestigationNodes.length,
      filterApplied: !!this.includedNodeIds,
      collectionEfficiency: `${((filteredPuzzles.length / puzzles.length) * 100).toFixed(1)}%`
    });
    
    return puzzleInvestigationNodes;
  }

  /**
   * Collect and transform timeline event entities into investigation graph nodes.
   * 
   * Processes timeline event entities (significant moments, chronological markers, sequences)
   * through filtering and transformation to create interactive graph nodes optimized for
   * temporal investigation workflows and chronological case reconstruction.
   * 
   * @param timeline - Array of timeline event entities to process for investigation node creation
   * @returns Array of interactive timeline graph nodes with temporal investigation metadata
   * 
   * @example Critical Event Collection
   * ```typescript
   * const criticalEvents = investigationData.timeline.filter(t => 
   *   t.importance === 'critical' && t.date.includes('2023-10-31')
   * );
   * const eventNodes = nodeCollector.collectTimelineNodes(criticalEvents);
   * 
   * // Result: Interactive timeline nodes with:
   * // - Chronological sequence data
   * // - Event causality relationships
   * // - Temporal investigation markers
   * // - Crime reconstruction capabilities
   * ```
   * 
   * @example Suspect Timeline Collection
   * ```typescript
   * const suspectEvents = investigationData.timeline.filter(t => 
   *   t.involvedCharacters?.includes('alice-sterling')
   * );
   * const suspectTimelineNodes = nodeCollector.collectTimelineNodes(suspectEvents);
   * ```
   * 
   * Complexity: O(n) where n = number of timeline event entities processed
   */
  collectTimelineNodes(timeline: TimelineEvent[]): GraphNode[] {
    // Apply investigation entity ID filter to focus on relevant timeline events
    const filteredTimelineEvents = this.filterByIncludedIds(timeline);
    
    // Transform filtered timeline events into interactive investigation graph nodes
    const timelineInvestigationNodes = filteredTimelineEvents.flatMap(timelineEvent => 
      this.entityTransformer.transformTimeline([timelineEvent])
    );
    
    // Log investigation timeline collection metrics for performance analysis
    log.debug('NodeCollector.collectTimelineNodes: Timeline event investigation node collection completed', {
      inputEvents: timeline.length,
      filteredEvents: filteredTimelineEvents.length,
      outputNodes: timelineInvestigationNodes.length,
      filterApplied: !!this.includedNodeIds,
      collectionEfficiency: `${((filteredTimelineEvents.length / timeline.length) * 100).toFixed(1)}%`
    });
    
    return timelineInvestigationNodes;
  }

  /**
   * Collect investigation nodes from specific entity IDs of a particular type.
   * 
   * Provides targeted node collection by combining entity ID filtering with type-specific
   * processing. Useful for building focused investigation views from known entity identifiers
   * discovered through relationship traversal or search operations.
   * 
   * @param data - Complete murder mystery investigation data containing all entity collections
   * @param ids - Array of specific entity IDs to collect and transform into graph nodes
   * @param type - Investigation entity type to filter and process ('character', 'element', 'puzzle', 'timeline')
   * @returns Array of interactive graph nodes for the specified investigation entities
   * 
   * @example Specific Suspect Collection
   * ```typescript
   * // Collect nodes for specific suspects discovered in investigation
   * const suspectNodes = nodeCollector.collectFromIds(
   *   investigationData,
   *   ['alice-sterling', 'bob-martinez', 'charlie-wilson'],
   *   'character'
   * );
   * ```
   * 
   * @example Evidence Chain Collection
   * ```typescript
   * // Collect nodes for evidence discovered through relationship traversal
   * const evidenceChain = ['murder-weapon', 'dna-analysis', 'witness-statement'];
   * const evidenceNodes = nodeCollector.collectFromIds(
   *   investigationData,
   *   evidenceChain,
   *   'puzzle'
   * );
   * ```
   * 
   * @example Timeline Sequence Collection
   * ```typescript
   * // Collect nodes for specific timeline events in chronological sequence
   * const criticalMoments = ['crime-committed', 'body-discovered', 'suspect-arrested'];
   * const timelineNodes = nodeCollector.collectFromIds(
   *   investigationData,
   *   criticalMoments,
   *   'timeline'
   * );
   * ```
   * 
   * Complexity: O(n + m) where n = entities of specified type, m = number of target IDs
   */
  collectFromIds(
    data: NotionData, 
    ids: string[], 
    type: EntityType
  ): GraphNode[] {
    // Early return for empty investigation entity ID arrays
    if (!ids || ids.length === 0) {
      return [];
    }

    // Apply investigation entity ID filter if configured (intersection of target IDs and included IDs)
    const filteredInvestigationIds = this.includedNodeIds 
      ? ids.filter(entityId => this.includedNodeIds!.has(entityId))
      : ids;

    // Early return if all target investigation entities are filtered out
    if (filteredInvestigationIds.length === 0) {
      return [];
    }

    // Process investigation entities by type with targeted ID filtering
    switch (type) {
      case 'character': {
        // Filter and collect character investigation entities (suspects, witnesses)
        const targetCharacters = data.characters.filter(character => filteredInvestigationIds.includes(character.id));
        return this.collectCharacterNodes(targetCharacters);
      }
      case 'element': {
        // Filter and collect story element investigation entities (locations, environmental evidence)
        const targetElements = data.elements.filter(element => filteredInvestigationIds.includes(element.id));
        return this.collectElementNodes(targetElements);
      }
      case 'puzzle': {
        // Filter and collect puzzle investigation entities (evidence, clues)
        const targetPuzzles = data.puzzles.filter(puzzle => filteredInvestigationIds.includes(puzzle.id));
        return this.collectPuzzleNodes(targetPuzzles);
      }
      case 'timeline': {
        // Filter and collect timeline investigation entities (events, sequences)
        const targetTimelineEvents = data.timeline.filter(timelineEvent => filteredInvestigationIds.includes(timelineEvent.id));
        return this.collectTimelineNodes(targetTimelineEvents);
      }
      default:
        // Log warning for unknown investigation entity types
        log.warn('NodeCollector.collectFromIds: Unknown investigation entity type encountered', { 
          unknownType: type,
          targetIds: filteredInvestigationIds,
          availableTypes: ['character', 'element', 'puzzle', 'timeline']
        });
        return [];
    }
  }

  /**
   * Collect all investigation entities that match the configured ID filter.
   * 
   * Performs comprehensive collection of all investigation entity types (characters, elements,
   * puzzles, timeline events) that pass the configured ID filter. Essential for building
   * complete investigation views while maintaining precise entity focus.
   * 
   * @param data - Complete murder mystery investigation data containing all entity collections
   * @returns Array of all matching investigation graph nodes across all entity types
   * 
   * @example Comprehensive Filtered Investigation
   * ```typescript
   * // Set investigation focus to core entities
   * nodeCollector.setIncludedNodeIds(new Set([
   *   'primary-suspect', 'key-witness', 'murder-weapon', 
   *   'crime-scene', 'discovery-timeline', 'arrest-timeline'
   * ]));
   * 
   * // Collect all matching entities across all types
   * const coreInvestigationNodes = nodeCollector.collectAll(investigationData);
   * 
   * // Result: Mixed array of character, element, puzzle, and timeline nodes
   * // representing the core investigation focus
   * ```
   * 
   * @example Comprehensive Unfiltered Investigation
   * ```typescript
   * // Clear filter for complete investigation view
   * nodeCollector.setIncludedNodeIds(undefined);
   * 
   * // Collect all investigation entities
   * const completeInvestigationNodes = nodeCollector.collectAll(investigationData);
   * ```
   * 
   * Complexity: O(V) where V = total number of entities across all investigation types
   */
  collectAll(data: NotionData): GraphNode[] {
    const allInvestigationNodes: GraphNode[] = [];

    // Warn if attempting comprehensive collection without entity filter (potential performance issue)
    if (!this.includedNodeIds || this.includedNodeIds.size === 0) {
      log.warn('NodeCollector.collectAll: No investigation entity ID filter specified - collecting ALL entities may impact performance', {
        totalCharacters: data.characters.length,
        totalElements: data.elements.length,
        totalPuzzles: data.puzzles.length,
        totalTimelineEvents: data.timeline.length,
        recommendedAction: 'Consider setting includedNodeIds filter for focused investigation'
      });
    }

    // Collect investigation nodes across all entity types with consistent filtering
    allInvestigationNodes.push(...this.collectCharacterNodes(data.characters));      // Suspects, witnesses, key figures
    allInvestigationNodes.push(...this.collectElementNodes(data.elements));          // Locations, environmental evidence
    allInvestigationNodes.push(...this.collectPuzzleNodes(data.puzzles));            // Clues, evidence, analysis requirements
    allInvestigationNodes.push(...this.collectTimelineNodes(data.timeline));         // Events, sequences, temporal markers

    // Log comprehensive investigation collection metrics
    log.debug('NodeCollector.collectAll: Comprehensive investigation node collection completed', {
      totalInvestigationNodes: allInvestigationNodes.length,
      entityFilter: this.includedNodeIds ? `${this.includedNodeIds.size} entity IDs` : 'no filter (all entities)',
      collectionBreakdown: {
        charactersProcessed: data.characters.length,
        elementsProcessed: data.elements.length, 
        puzzlesProcessed: data.puzzles.length,
        timelineEventsProcessed: data.timeline.length
      },
      investigationScope: this.includedNodeIds?.size || 'unlimited'
    });

    return allInvestigationNodes;
  }

  /**
   * Collect investigation nodes for specific pre-filtered entity instances.
   * 
   * Processes pre-selected investigation entities from multiple types without additional
   * ID filtering. Useful when entities have already been filtered externally and need
   * efficient batch transformation into graph nodes for focused investigation analysis.
   * 
   * @param entities - Object containing pre-filtered arrays of investigation entities by type
   * @returns Array of interactive graph nodes for all provided investigation entities
   * 
   * @example Multi-Type Specific Collection
   * ```typescript
   * // Pre-filter entities based on investigation criteria
   * const specificEntities = {
   *   characters: investigationData.characters.filter(c => c.suspicionLevel > 7),
   *   puzzles: investigationData.puzzles.filter(p => p.status === 'critical'),
   *   timeline: investigationData.timeline.filter(t => t.date === crimeDate)
   * };
   * 
   * // Collect nodes for specific investigation entities
   * const focusedNodes = nodeCollector.collectSpecificEntities(specificEntities);
   * ```
   * 
   * @example Single-Type Specific Collection
   * ```typescript
   * // Collect only high-priority evidence
   * const evidenceNodes = nodeCollector.collectSpecificEntities({
   *   puzzles: criticalEvidence
   * });
   * ```
   * 
   * @example Investigation Team Collection
   * ```typescript
   * // Collect core investigation team and evidence
   * const investigationNodes = nodeCollector.collectSpecificEntities({
   *   characters: [primarySuspect, keyWitness, investigatingOfficer],
   *   puzzles: [murderWeapon, primaryEvidence],
   *   timeline: [crimeEvent, discoveryEvent]
   * });
   * ```
   * 
   * Complexity: O(n) where n = total number of provided entities across all types
   */
  collectSpecificEntities(entities: {
    characters?: Character[];
    elements?: Element[];
    puzzles?: Puzzle[];
    timeline?: TimelineEvent[];
  }): GraphNode[] {
    const specificInvestigationNodes: GraphNode[] = [];

    // Collect character investigation nodes if provided
    if (entities.characters) {
      specificInvestigationNodes.push(...this.collectCharacterNodes(entities.characters));
    }
    
    // Collect story element investigation nodes if provided
    if (entities.elements) {
      specificInvestigationNodes.push(...this.collectElementNodes(entities.elements));
    }
    
    // Collect puzzle and evidence investigation nodes if provided
    if (entities.puzzles) {
      specificInvestigationNodes.push(...this.collectPuzzleNodes(entities.puzzles));
    }
    
    // Collect timeline event investigation nodes if provided
    if (entities.timeline) {
      specificInvestigationNodes.push(...this.collectTimelineNodes(entities.timeline));
    }

    return specificInvestigationNodes;
  }

  /**
   * Filter investigation entities by configured included node ID set.
   * 
   * Applies the investigation entity ID filter to remove entities not specified
   * in the inclusion set. Essential for focused investigation views that concentrate
   * on specific suspects, evidence, or timeline events while excluding irrelevant entities.
   * 
   * @param entities - Array of investigation entities with ID properties to filter
   * @returns Filtered array containing only entities whose IDs are in the inclusion set
   * 
   * @example Investigation Entity Filtering
   * ```typescript
   * // Configure investigation focus
   * nodeCollector.setIncludedNodeIds(new Set([
   *   'alice-sterling', 'murder-weapon', 'crime-scene-timeline'
   * ]));
   * 
   * // Filter suspects to only included entities
   * const allSuspects = investigationData.characters;
   * const focusedSuspects = nodeCollector.filterByIncludedIds(allSuspects);
   * // Result: Only alice-sterling if she exists in the suspects array
   * ```
   * 
   * @template T - Investigation entity type with required ID property
   * 
   * Complexity: O(n) where n = number of entities to filter
   */
  private filterByIncludedIds<T extends { id: string }>(entities: T[]): T[] {
    // Return all entities if no investigation filter is configured
    if (!this.includedNodeIds) {
      return entities;
    }
    
    // Filter entities to only those included in the investigation focus set
    return entities.filter(entity => this.includedNodeIds!.has(entity.id));
  }
}