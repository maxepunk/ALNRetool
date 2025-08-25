/**
 * Professional runtime type guards for graph entities in ALNRetool.
 * 
 * Provides comprehensive type checking and validation for murder mystery
 * investigation entities, enabling safe runtime type assertions and error
 * detection for characters, elements, puzzles, and timeline events.
 * 
 * **Architecture Principles:**
 * - **Clean Separation**: Isolated from types.ts to maintain clean type/runtime boundary
 * - **No Mixed Exports**: Pure runtime guards without type definitions
 * - **Type Safety**: Comprehensive TypeScript integration for static analysis
 * - **Error Detection**: Advanced error state identification for debugging
 * - **Entity Validation**: Discriminated union type checking for Notion entities
 * 
 * **Key Features:**
 * - Runtime error state detection for graph nodes
 * - Discriminated union type guards for entity classification
 * - Safe type narrowing for specific entity types
 * - Murder mystery domain-specific validation
 * - Integration with investigation workflow error handling
 * 
 * **Supported Entity Types:**
 * - **character**: Character nodes with tier metadata (suspects, witnesses)
 * - **element**: Story elements with basicType classification (evidence, items)
 * - **puzzle**: Investigation puzzles with element dependencies
 * - **timeline**: Temporal events with date information
 * 
 * @example
 * ```typescript
 * // Error state detection for debugging
 * if (hasError(characterNode)) {
 *   console.error('Character node has error:', characterNode.data.metadata.errorState);
 *   return; // Skip processing corrupted nodes
 * }
 * 
 * // Safe entity type checking
 * if (isEntityType<Character>(entity, 'character')) {
 *   // entity is now safely typed as Character
 *   console.log('Character tier:', entity.tier);
 *   console.log('Investigation role:', entity.role);
 * }
 * 
 * // Entity classification for processing
 * const entities = getAllEntities();
 * const suspects = entities.filter(e => isEntityType(e, 'character')) as Character[];
 * const evidence = entities.filter(e => isEntityType(e, 'element')) as Element[];
 * ```
 * 
 * @see {@link GraphNode} For graph node structure definitions
 * @see {@link NotionEntity} For base entity interface
 * @see {@link EntityType} For entity type enumeration
 * 
 * @author ALNRetool Development Team
 * @since 1.0.0
 * @module guards
 */

import type { GraphNode, NotionEntity, EntityType } from './types';

/**
 * Check if a graph node has an error state for debugging and error handling.
 * 
 * Provides runtime error detection for graph nodes within murder mystery
 * investigation workflows, enabling graceful error handling and debugging
 * of corrupted or invalid node data during graph processing.
 * 
 * **Error Detection Strategy:**
 * - Checks for existence of errorState in node metadata
 * - Enables safe skipping of corrupted nodes during processing
 * - Supports investigation workflow error resilience
 * - Facilitates debugging of data transformation issues
 * 
 * **Common Error States:**
 * - Data transformation failures during Notion API processing
 * - Missing or invalid entity references
 * - Circular dependency detection in puzzle chains
 * - Invalid relationship mappings between entities
 * - Malformed timeline event data
 * 
 * @param node Graph node to check for error conditions
 * @returns True if node contains error state metadata, false if node is valid
 * 
 * @complexity O(1) - constant time property access
 * 
 * @example
 * ```typescript
 * // Error handling during graph processing
 * const processNode = (node: GraphNode) => {
 *   if (hasError(node)) {
 *     console.error('Skipping corrupted node:', node.id, node.data.metadata.errorState);
 *     return null;
 *   }
 *   
 *   // Safe to process valid node
 *   return transformNodeForVisualization(node);
 * };
 * 
 * // Batch error detection for graph validation
 * const validateGraph = (nodes: GraphNode[]) => {
 *   const errorNodes = nodes.filter(hasError);
 *   if (errorNodes.length > 0) {
 *     console.warn(`Found ${errorNodes.length} corrupted nodes:`, 
 *       errorNodes.map(n => ({ id: n.id, error: n.data.metadata.errorState })));
 *   }
 *   return nodes.filter(n => !hasError(n));
 * };
 * 
 * // Error recovery in investigation workflow
 * const characters = characterNodes.filter(node => {
 *   if (hasError(node)) {
 *     logger.warn('Character node error - investigation may be incomplete', {
 *       characterId: node.id,
 *       errorState: node.data.metadata.errorState
 *     });
 *     return false;
 *   }
 *   return true;
 * });
 * ```
 * 
 * @see {@link GraphNode} For node structure with metadata
 * @see {@link NotionEntity} For base entity error handling
 * 
 * @remarks
 * **Error State Structure:**
 * - errorState contains detailed error information and context
 * - Used throughout graph processing pipeline for error recovery
 * - Enables partial graph rendering with error indication
 * - Supports investigation continuity despite data issues
 * 
 * **Performance Characteristics:**
 * - Zero-cost abstraction at runtime (simple property check)
 * - No additional memory allocation or complex computation
 * - Safe for use in hot paths and batch processing
 */
export function hasError(node: GraphNode): boolean {
  return node.data.metadata.errorState !== undefined;
}

/**
 * Type guard for safe entity type checking with discriminated union support.
 * 
 * Provides runtime type checking for Notion entities within murder mystery
 * investigation context, enabling safe type narrowing and entity classification
 * through discriminated union pattern analysis and property-based validation.
 * 
 * **Type Discrimination Strategy:**
 * - **character**: Detected by presence of 'tier' property (Tier 1-3 suspects/witnesses)
 * - **element**: Detected by presence of 'basicType' property (evidence, items, clues)
 * - **puzzle**: Detected by presence of 'puzzleElementIds' property (investigation challenges)
 * - **timeline**: Detected by presence of 'date' property (temporal events, alibis)
 * 
 * **Investigation Entity Classification:**
 * - **Characters**: Suspects, witnesses, and key figures with tier-based importance
 * - **Elements**: Physical evidence, story items, and investigation clues
 * - **Puzzles**: Investigation challenges requiring evidence and character interaction
 * - **Timeline**: Temporal events providing alibis and sequence of events
 * 
 * @template T The specific Notion entity type to narrow to
 * @param entity The entity to type-check and potentially narrow
 * @param type The target entity type for validation
 * @returns Type predicate indicating if entity is of specified type
 * 
 * @complexity O(1) - constant time property existence check
 * 
 * @example
 * ```typescript
 * // Safe character processing with type narrowing
 * const processCharacter = (entity: NotionEntity) => {
 *   if (isEntityType<Character>(entity, 'character')) {
 *     // entity is now safely typed as Character
 *     console.log('Processing character:', entity.name);
 *     console.log('Investigation tier:', entity.tier);
 *     console.log('Suspect status:', entity.role);
 *     
 *     // Safe access to character-specific properties
 *     return {
 *       id: entity.id,
 *       name: entity.name,
 *       tier: entity.tier,
 *       isMainSuspect: entity.tier === 1
 *     };
 *   }
 *   return null;
 * };
 * 
 * // Entity classification for investigation workflow
 * const classifyEntities = (entities: NotionEntity[]) => {
 *   const classification = {
 *     suspects: entities.filter(e => isEntityType(e, 'character')) as Character[],
 *     evidence: entities.filter(e => isEntityType(e, 'element')) as Element[],
 *     puzzles: entities.filter(e => isEntityType(e, 'puzzle')) as Puzzle[],
 *     timeline: entities.filter(e => isEntityType(e, 'timeline')) as TimelineEvent[]
 *   };
 *   
 *   console.log('Investigation summary:', {
 *     suspectCount: classification.suspects.length,
 *     evidenceCount: classification.evidence.length,
 *     puzzleCount: classification.puzzles.length,
 *     timelineEvents: classification.timeline.length
 *   });
 *   
 *   return classification;
 * };
 * 
 * // Type-safe entity processing with error handling
 * const processEntities = (entities: NotionEntity[]) => {
 *   const processed = entities.map(entity => {
 *     if (isEntityType<Character>(entity, 'character')) {
 *       return { type: 'character' as const, data: processCharacterData(entity) };
 *     } else if (isEntityType<Element>(entity, 'element')) {
 *       return { type: 'element' as const, data: processElementData(entity) };
 *     } else if (isEntityType<Puzzle>(entity, 'puzzle')) {
 *       return { type: 'puzzle' as const, data: processPuzzleData(entity) };
 *     } else if (isEntityType<TimelineEvent>(entity, 'timeline')) {
 *       return { type: 'timeline' as const, data: processTimelineData(entity) };
 *     }
 *     
 *     console.warn('Unknown entity type:', entity);
 *     return null;
 *   }).filter(Boolean);
 *   
 *   return processed;
 * };
 * ```
 * 
 * @see {@link NotionEntity} For base entity interface
 * @see {@link EntityType} For supported entity type enumeration
 * @see {@link Character} For character-specific properties
 * @see {@link Element} For element-specific properties
 * @see {@link Puzzle} For puzzle-specific properties
 * @see {@link TimelineEvent} For timeline event properties
 * 
 * @remarks
 * **Discriminated Union Benefits:**
 * - Enables safe type narrowing at runtime
 * - Prevents access to non-existent properties
 * - Provides compile-time type safety with runtime validation
 * - Supports investigation workflow entity processing
 * 
 * **Property-Based Detection:**
 * - Uses unique property signatures for reliable type detection
 * - Avoids brittle string-based type checking
 * - Leverages TypeScript's structural typing for validation
 * - Ensures accurate entity classification in murder mystery context
 * 
 * **Investigation Workflow Integration:**
 * - Enables type-safe processing of mixed entity arrays
 * - Supports entity-specific visualization and interaction
 * - Facilitates investigation progress tracking by entity type
 * - Provides foundation for type-specific graph transformations
 */
export function isEntityType<T extends NotionEntity>(
  entity: NotionEntity,
  type: EntityType
): entity is T {
  switch (type) {
    case 'character':
      return 'tier' in entity;
    case 'element':
      return 'basicType' in entity;
    case 'puzzle':
      return 'puzzleElementIds' in entity;
    case 'timeline':
      return 'date' in entity;
    default:
      return false;
  }
}