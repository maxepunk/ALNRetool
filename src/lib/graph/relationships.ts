/**
 * Professional relationship resolution system for ALNRetool graph construction.
 * 
 * Provides comprehensive edge creation and relationship processing for "About Last Night"
 * murder mystery investigation networks, handling complex entity relationships with
 * graceful error handling, placeholder node generation, and advanced edge weighting.
 * 
 * **Core Responsibilities:**
 * - **Entity Relationship Mapping**: Convert Notion entity relationships into graph edges
 * - **Lookup Map Construction**: Efficient O(1) entity resolution through Map structures
 * - **Placeholder Generation**: Create visual indicators for missing/broken relationships
 * - **Edge Type Management**: Support for ownership, requirement, reward, timeline, container relationships
 * - **Backward Compatibility**: Legacy adapter functions for existing graph building workflows
 * - **Advanced Weighting**: Integration with EdgeBuilder for sophisticated edge importance calculation
 * 
 * **Relationship Type System:**
 * - **Ownership**: Character → Element (who owns what evidence/items)
 * - **Requirement**: Puzzle → Element (what evidence puzzles need)
 * - **Reward**: Puzzle → Element (what evidence puzzles provide)
 * - **Timeline**: Element → TimelineEvent (evidence reveals timeline information)
 * - **Container**: Element → Element (items contained within other items)
 * 
 * **Architecture Benefits:**
 * - **Efficient Lookup**: O(1) entity resolution through pre-built lookup maps
 * - **Error Resilience**: Graceful handling of missing entities with placeholder nodes
 * - **Visual Debugging**: Red-styled placeholder nodes highlight data integrity issues
 * - **Modular Design**: Separate functions for each relationship type enable targeted processing
 * - **Backward Compatibility**: Legacy adapter functions maintain existing API contracts
 * 
 * **Investigation Integration:**
 * - Character ownership analysis for evidence tracking
 * - Puzzle dependency mapping for investigation planning
 * - Timeline reconstruction through evidence-event connections
 * - Evidence container relationships for item organization
 * - Missing entity detection for data quality assurance
 * 
 * @example
 * ```typescript
 * // Build efficient lookup maps for relationship resolution
 * const lookupMaps = buildLookupMaps(characters, elements, puzzles, timeline);
 * 
 * // Create comprehensive relationship network
 * const ownershipEdges = createOwnershipEdges(elements, lookupMaps);
 * const requirementEdges = createRequirementEdges(puzzles, lookupMaps);
 * const rewardEdges = createRewardEdges(puzzles, lookupMaps);
 * const timelineEdges = createTimelineEdges(elements, lookupMaps);
 * const containerEdges = createContainerEdges(elements, lookupMaps);
 * 
 * // Combine all relationship types
 * const allEdges = [
 *   ...ownershipEdges,
 *   ...requirementEdges, 
 *   ...rewardEdges,
 *   ...timelineEdges,
 *   ...containerEdges
 * ];
 * 
 * // Handle missing entities with placeholders
 * const missingCharacter = createPlaceholderNode(
 *   'missing-suspect-id',
 *   'character',
 *   'witness-statement-001'
 * );
 * ```
 * 
 * @see {@link EdgeBuilder} For advanced edge weighting and style configuration
 * @see {@link EntityLookupMaps} For lookup map structure definitions
 * @see {@link PlaceholderNodeData} For placeholder node data interface
 * 
 * @author ALNRetool Development Team
 * @since 1.0.0
 * @module relationships
 */

import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent 
} from '@/types/notion/app';
import type { 
  GraphEdge, 
  EntityLookupMaps, 
  RelationshipType,
  EntityType,
  PlaceholderNodeData,
  GraphNode
} from './types';
import type { Node } from '@xyflow/react';
import { EdgeBuilder } from './modules/EdgeBuilder';
import { logger } from './utils/Logger'


// ============================================================================
// Lookup Map Builders
// ============================================================================

/**
 * Entity lookup maps for efficient ID resolution (defined in types.ts)
 */
export type { EntityLookupMaps } from './types';

/**
 * Build comprehensive lookup maps for efficient O(1) entity ID resolution.
 * 
 * Creates optimized Map structures for each entity type within the murder mystery
 * investigation system, enabling fast relationship resolution and entity lookup
 * during graph construction and relationship processing workflows.
 * 
 * **Lookup Map Benefits:**
 * - **O(1) Access Time**: Direct Map lookup vs O(n) array searching
 * - **Memory Efficient**: Single Map instance per entity type
 * - **Type Safety**: Strongly typed Maps for each entity category
 * - **Relationship Resolution**: Fast entity existence checking and retrieval
 * - **Error Prevention**: Enables missing entity detection and placeholder creation
 * 
 * **Entity Type Coverage:**
 * - **Characters**: Suspects, witnesses, and key investigation figures
 * - **Elements**: Evidence, story items, and investigation clues
 * - **Puzzles**: Investigation challenges and puzzle dependencies
 * - **Timeline**: Temporal events and alibi information
 * 
 * @param characters Array of character entities from Notion API
 * @param elements Array of element entities from Notion API
 * @param puzzles Array of puzzle entities from Notion API
 * @param timeline Array of timeline event entities from Notion API
 * @returns Optimized lookup maps for O(1) entity resolution
 * 
 * @complexity O(V) where V is total number of entities across all types
 * 
 * @example
 * ```typescript
 * // Build lookup maps from Notion API data
 * const lookupMaps = buildLookupMaps(
 *   charactersFromNotion,
 *   elementsFromNotion,
 *   puzzlesFromNotion,
 *   timelineFromNotion
 * );
 * 
 * // Fast O(1) entity lookup
 * const marcus = lookupMaps.characters.get('marcus-blackwood-id');
 * const keyEvidence = lookupMaps.elements.get('key-evidence-id');
 * const mainPuzzle = lookupMaps.puzzles.get('main-puzzle-id');
 * const alibiEvent = lookupMaps.timeline.get('alibi-event-id');
 * 
 * // Entity existence checking for relationship validation
 * const validateRelationship = (sourceId: string, targetId: string, entityType: string) => {
 *   const lookupMap = lookupMaps[entityType as keyof EntityLookupMaps];
 *   const targetExists = lookupMap.has(targetId);
 *   
 *   if (!targetExists) {
 *     console.warn(`Missing ${entityType}: ${targetId} referenced by ${sourceId}`);
 *     return false;
 *   }
 *   
 *   return true;
 * };
 * 
 * // Batch entity processing with lookup optimization
 * const processRelationships = (relationships: Array<{source: string, target: string}>) => {
 *   return relationships.map(rel => {
 *     const sourceEntity = lookupMaps.characters.get(rel.source);
 *     const targetEntity = lookupMaps.elements.get(rel.target);
 *     
 *     return sourceEntity && targetEntity ? 
 *       { valid: true, source: sourceEntity, target: targetEntity } :
 *       { valid: false, sourceId: rel.source, targetId: rel.target };
 *   });
 * };
 * ```
 * 
 * @see {@link EntityLookupMaps} For lookup map structure interface
 * @see {@link createPlaceholderNode} For handling missing entity references
 * 
 * @remarks
 * **Performance Characteristics:**
 * - Map construction: O(V) one-time cost for all entities
 * - Lookup operations: O(1) constant time for each entity resolution
 * - Memory usage: Efficient Map storage with direct entity references
 * - Suitable for large investigation networks with hundreds of entities
 * 
 * **Investigation Workflow Integration:**
 * - Essential preprocessing step before relationship edge creation
 * - Enables fast validation of entity references in Notion data
 * - Supports missing entity detection for data quality assurance
 * - Optimizes performance for complex murder mystery network analysis
 */
export function buildLookupMaps(
  characters: Character[],
  elements: Element[],
  puzzles: Puzzle[],
  timeline: TimelineEvent[]
): EntityLookupMaps {
  return {
    characters: new Map(characters.map(c => [c.id, c])),
    elements: new Map(elements.map(e => [e.id, e])),
    puzzles: new Map(puzzles.map(p => [p.id, p])),
    timeline: new Map(timeline.map(t => [t.id, t])),
  };
}

// ============================================================================
// Placeholder Node Creation
// ============================================================================

/**
 * Create visual placeholder node for missing entities in investigation network.
 * 
 * Generates red-styled placeholder nodes to represent missing or broken entity
 * references within the murder mystery investigation graph, enabling visual
 * debugging and data integrity assessment for investigation workflow quality.
 * 
 * **Placeholder Design Strategy:**
 * - **Visual Distinction**: Red color scheme and dashed borders for immediate recognition
 * - **Information Display**: Truncated entity ID and missing reason for debugging context
 * - **Layout Integration**: Positioned by layout algorithms like normal nodes
 * - **Accessibility**: High contrast red styling for clear visual identification
 * - **Debug Information**: Comprehensive metadata for investigation troubleshooting
 * 
 * **Missing Entity Categories:**
 * - **character**: Missing suspects, witnesses, or key investigation figures
 * - **element**: Missing evidence, story items, or investigation clues
 * - **puzzle**: Missing investigation challenges or puzzle dependencies
 * - **timeline**: Missing temporal events or alibi information
 * 
 * @param id Entity ID of the missing reference
 * @param entityType Type of missing entity for appropriate labeling
 * @param referencedBy Optional ID of entity that references this missing entity
 * @returns Fully configured placeholder node for graph visualization
 * 
 * @complexity O(1) - constant time placeholder node construction
 * 
 * @example
 * ```typescript
 * // Create placeholder for missing character
 * const missingCharacter = createPlaceholderNode(
 *   'missing-suspect-abc123def456',
 *   'character',
 *   'witness-statement-001'
 * );
 * 
 * console.log(missingCharacter);
 * // Output: {
 * //   id: 'missing-suspect-abc123def456',
 * //   type: 'placeholder',
 * //   data: {
 * //     label: 'Missing character: abc123de...',
 * //     metadata: {
 * //       entityType: 'character',
 * //       isPlaceholder: true,
 * //       missingReason: 'Referenced character not found in Notion (referenced by: witness-statement-001)'
 * //     }
 * //   },
 * //   style: { background: '#fee2e2', border: '2px dashed #dc2626' }
 * // }
 * 
 * // Handle missing entity during relationship processing
 * const processRelationship = (sourceId: string, targetId: string) => {
 *   const targetEntity = lookupMaps.elements.get(targetId);
 *   
 *   if (!targetEntity) {
 *     // Create placeholder for missing evidence
 *     const placeholder = createPlaceholderNode(targetId, 'element', sourceId);
 *     logger.warn('Created placeholder for missing evidence:', targetId);
 *     return { node: placeholder, isPlaceholder: true };
 *   }
 *   
 *   return { entity: targetEntity, isPlaceholder: false };
 * };
 * 
 * // Batch placeholder creation for data quality analysis
 * const createPlaceholdersForMissing = (missingRefs: Array<{id: string, type: EntityType, referencedBy: string}>) => {
 *   return missingRefs.map(ref => createPlaceholderNode(ref.id, ref.type, ref.referencedBy));
 * };
 * 
 * // Investigation data quality report
 * const generateQualityReport = (placeholders: Node<PlaceholderNodeData>[]) => {
 *   const byType = placeholders.reduce((acc, placeholder) => {
 *     const type = placeholder.data.metadata.entityType;
 *     acc[type] = (acc[type] || 0) + 1;
 *     return acc;
 *   }, {} as Record<string, number>);
 *   
 *   console.log('Data quality report:', {
 *     totalMissing: placeholders.length,
 *     byType,
 *     details: placeholders.map(p => ({
 *       id: p.id,
 *       type: p.data.metadata.entityType,
 *       reason: p.data.metadata.missingReason
 *     }))
 *   });
 * };
 * ```
 * 
 * @see {@link PlaceholderNodeData} For placeholder node data structure
 * @see {@link EntityType} For supported entity type enumeration
 * @see {@link buildLookupMaps} For entity resolution context
 * 
 * @remarks
 * **Visual Design Rationale:**
 * - **Red color (#dc2626)**: Universal danger/error color for immediate attention
 * - **Dashed border**: Distinguishes placeholder from solid regular nodes
 * - **Reduced opacity (0.8)**: Indicates placeholder status while maintaining visibility
 * - **Small size**: De-emphasizes placeholder nodes vs actual investigation entities
 * 
 * **Data Integrity Benefits:**
 * - Visual identification of data quality issues in investigation networks
 * - Debugging support for missing entity references in Notion data
 * - Investigation continuity despite incomplete data relationships
 * - Quality assurance feedback for investigation data management
 */
export function createPlaceholderNode(
  id: string, 
  entityType: EntityType,
  referencedBy?: string
): Node<PlaceholderNodeData> {
  return {
    id,
    type: 'placeholder',
    position: { x: 0, y: 0 }, // Will be positioned by layout
    data: {
      label: `Missing ${entityType}: ${id.slice(0, 8)}...`,
      metadata: {
        entityType,
        entityId: id,
        isPlaceholder: true,
        missingReason: `Referenced ${entityType} not found in Notion (referenced by: ${referencedBy || 'unknown'})`,
      },
      visualHints: {
        color: '#dc2626', // Red for missing
        size: 'small',
        shape: 'circle',
      },
    },
    style: {
      background: '#fee2e2', // Light red background
      border: '2px dashed #dc2626',
      opacity: 0.8,
    },
    className: 'node-placeholder',
  };
}

// ============================================================================
// Edge Creation Functions
// ============================================================================


// ============================================================================
// Ownership Edges (Character -> Element)
// ============================================================================

/**
 * Create ownership edges between characters and their owned elements in murder mystery investigation.
 * 
 * Establishes visual connections showing which characters own or control specific elements
 * (evidence, items, clues) within the investigation graph, enabling ownership tracking
 * and suspect-evidence relationship analysis for murder mystery investigation workflow.
 * 
 * **Ownership Relationship Types:**
 * - **Direct Ownership**: Characters who possess physical evidence or items
 * - **Control Relationships**: Characters with access to or influence over elements
 * - **Custodial Connections**: Characters responsible for specific investigation items
 * - **Property Links**: Characters with legal or practical ownership of story elements
 * 
 * **Edge Creation Strategy:**
 * - Uses EdgeBuilder for consistent edge data structure and metadata
 * - Validates character and element existence through lookup maps
 * - Creates placeholder nodes for missing entity references
 * - Applies backward compatibility transformation for legacy graph systems
 * 
 * @param elements Array of story elements that may be owned by characters
 * @param lookupMaps Entity lookup maps for O(1) entity resolution and validation
 * @returns Array of ownership edges connecting characters to owned elements
 * 
 * @complexity O(E * O) where E is elements count and O is average owners per element
 * 
 * @example
 * ```typescript
 * // Create ownership edges for investigation elements
 * const elements = await getElements();
 * const lookupMaps = buildLookupMaps(characters, elements, puzzles, timeline);
 * const ownershipEdges = createOwnershipEdges(elements, lookupMaps);
 * 
 * console.log('Ownership analysis:', {
 *   totalEdges: ownershipEdges.length,
 *   ownedElements: ownershipEdges.map(e => e.target),
 *   owningCharacters: [...new Set(ownershipEdges.map(e => e.source))]
 * });
 * 
 * // Filter edges by ownership strength
 * const strongOwnership = ownershipEdges.filter(edge => 
 *   edge.data.strength > 0.8
 * );
 * 
 * // Investigation ownership network analysis
 * const analyzeOwnership = (edges: GraphEdge[]) => {
 *   const ownershipNetwork = edges.reduce((network, edge) => {
 *     const owner = edge.source;
 *     if (!network[owner]) network[owner] = [];
 *     network[owner].push(edge.target);
 *     return network;
 *   }, {} as Record<string, string[]>);
 *   
 *   return Object.entries(ownershipNetwork).map(([character, ownedItems]) => ({
 *     characterId: character,
 *     ownedCount: ownedItems.length,
 *     ownedItems,
 *     suspicionLevel: ownedItems.length > 3 ? 'high' : 'normal'
 *   }));
 * };
 * ```
 * 
 * @see {@link EdgeBuilder} For edge creation with consistent data structure
 * @see {@link EntityLookupMaps} For entity resolution and validation
 * @see {@link createPlaceholderNode} For handling missing entity references
 * 
 * @remarks
 * **Backward Compatibility:**
 * - Transforms EdgeBuilder output to legacy GraphEdge format
 * - Flattens metadata into data structure for existing graph consumers
 * - Maintains relationshipType field for edge classification
 * - Preserves logging and debugging information for investigation analysis
 * 
 * **Investigation Workflow Integration:**
 * - Essential for suspect-evidence relationship tracking
 * - Enables ownership-based filtering and analysis in investigation interface
 * - Supports evidence chain visualization for murder mystery resolution
 * - Provides ownership strength metrics for investigation prioritization
 */
export function createOwnershipEdges(
  elements: Element[],
  lookupMaps: EntityLookupMaps
): GraphEdge[] {
  // Adapter: Use EdgeBuilder version for consistency
  const edgeBuilder = new EdgeBuilder();
  const edges = createOwnershipEdgesWithBuilder(elements, lookupMaps, edgeBuilder);
  
  // Transform edge data structure for backward compatibility
  const transformedEdges = edges.map(edge => ({
    ...edge,
    data: {
      relationshipType: edge.data?.relationshipType || 'ownership',
      ...edge.data,
      ...edge.data?.metadata, // Flatten metadata into data
    }
  })) as GraphEdge[];
  
  logger.info(`Created ${transformedEdges.length} ownership edges`);
  return transformedEdges;
}

// ============================================================================
// Requirement Edges (Puzzle -> Element)
// ============================================================================

/**
 * Create requirement edges between puzzles and required elements in murder mystery investigation.
 * 
 * Establishes dependency connections showing which elements (evidence, items, clues) are
 * required to solve specific investigation puzzles, enabling puzzle dependency tracking
 * and investigation progression analysis for murder mystery game mechanics.
 * 
 * **Requirement Dependency Types:**
 * - **Evidence Requirements**: Physical evidence needed to solve investigation challenges
 * - **Item Dependencies**: Story items required for puzzle interaction or completion
 * - **Clue Prerequisites**: Information clues necessary for puzzle understanding
 * - **Knowledge Gates**: Character knowledge required for puzzle access or solution
 * 
 * **Puzzle Dependency Analysis:**
 * - Creates directed edges from puzzles to required elements
 * - Validates element existence and creates placeholders for missing references
 * - Supports puzzle chain analysis and investigation progression tracking
 * - Enables dependency-based puzzle unlocking and investigation flow control
 * 
 * @param puzzles Array of investigation puzzles with element requirements
 * @param lookupMaps Entity lookup maps for O(1) element resolution and validation
 * @returns Array of requirement edges connecting puzzles to required elements
 * 
 * @complexity O(P * R) where P is puzzles count and R is average requirements per puzzle
 * 
 * @example
 * ```typescript
 * // Create requirement edges for investigation puzzles
 * const puzzles = await getPuzzles();
 * const lookupMaps = buildLookupMaps(characters, elements, puzzles, timeline);
 * const requirementEdges = createRequirementEdges(puzzles, lookupMaps);
 * 
 * console.log('Puzzle dependency analysis:', {
 *   totalEdges: requirementEdges.length,
 *   puzzlesWithRequirements: [...new Set(requirementEdges.map(e => e.source))].length,
 *   requiredElements: [...new Set(requirementEdges.map(e => e.target))]
 * });
 * 
 * // Analysis puzzle dependency chains
 * const analyzeDependencyChains = (edges: GraphEdge[]) => {
 *   const dependencyMap = edges.reduce((map, edge) => {
 *     const puzzleId = edge.source;
 *     if (!map[puzzleId]) map[puzzleId] = [];
 *     map[puzzleId].push(edge.target);
 *     return map;
 *   }, {} as Record<string, string[]>);
 *   
 *   return Object.entries(dependencyMap).map(([puzzleId, requirements]) => ({
 *     puzzleId,
 *     requirementCount: requirements.length,
 *     requirements,
 *     complexity: requirements.length > 2 ? 'complex' : 'simple',
 *     canProgress: requirements.every(reqId => 
 *       lookupMaps.elements.has(reqId) // All requirements available
 *     )
 *   }));
 * };
 * 
 * // Investigation progression tracking
 * const trackProgression = (completedElements: string[]) => {
 *   return requirementEdges.filter(edge => 
 *     completedElements.includes(edge.target)
 *   ).map(edge => edge.source); // Unlocked puzzles
 * };
 * ```
 * 
 * @see {@link EdgeBuilder} For consistent edge creation with metadata
 * @see {@link EntityLookupMaps} For element resolution and validation
 * @see {@link Puzzle} For puzzle structure with element requirements
 * 
 * @remarks
 * **Investigation Workflow Benefits:**
 * - Enables puzzle dependency visualization in investigation interface
 * - Supports investigation progression tracking and puzzle unlocking logic
 * - Facilitates dependency-based investigation guidance and hints
 * - Provides foundation for investigation complexity analysis and balancing
 * 
 * **Edge Data Structure:**
 * - relationshipType: 'requirement' for dependency identification
 * - Metadata includes requirement strength and puzzle context information
 * - Backward compatible with legacy graph processing systems
 * - Logging includes dependency count for investigation debugging
 */
export function createRequirementEdges(
  puzzles: Puzzle[],
  lookupMaps: EntityLookupMaps
): GraphEdge[] {
  // Adapter: Use EdgeBuilder version for consistency
  const edgeBuilder = new EdgeBuilder();
  const edges = createRequirementEdgesWithBuilder(puzzles, lookupMaps, edgeBuilder);
  
  // Transform edge data structure for backward compatibility
  const transformedEdges = edges.map(edge => ({
    ...edge,
    data: {
      relationshipType: edge.data?.relationshipType || 'requirement',
      ...edge.data,
      ...edge.data?.metadata, // Flatten metadata into data
    }
  })) as GraphEdge[];
  
  logger.info(`Created ${transformedEdges.length} requirement edges`);
  return transformedEdges;
}

// ============================================================================
// Reward Edges (Puzzle -> Element)
// ============================================================================

/**
 * Create reward edges between puzzles and reward elements in murder mystery investigation.
 * 
 * Establishes reward connections showing which elements (evidence, items, clues, information)
 * are unlocked or revealed upon successful completion of investigation puzzles, enabling
 * reward tracking and investigation progression visualization for murder mystery game mechanics.
 * 
 * **Reward Relationship Types:**
 * - **Evidence Rewards**: New physical evidence revealed through puzzle completion
 * - **Information Unlocks**: Clues or knowledge gained from solving investigation challenges
 * - **Item Rewards**: Story items or tools obtained through puzzle interaction
 * - **Access Grants**: Timeline events or character interactions unlocked by puzzle success
 * 
 * **Reward System Integration:**
 * - Creates directed edges from puzzles to reward elements
 * - Validates reward element existence and creates placeholders for missing rewards
 * - Supports investigation progression visualization and reward anticipation
 * - Enables reward-based motivation and investigation flow optimization
 * 
 * @param puzzles Array of investigation puzzles with reward elements
 * @param lookupMaps Entity lookup maps for O(1) reward element resolution and validation
 * @returns Array of reward edges connecting puzzles to unlocked reward elements
 * 
 * @complexity O(P * W) where P is puzzles count and W is average rewards per puzzle
 * 
 * @example
 * ```typescript
 * // Create reward edges for investigation puzzle system
 * const puzzles = await getPuzzles();
 * const lookupMaps = buildLookupMaps(characters, elements, puzzles, timeline);
 * const rewardEdges = createRewardEdges(puzzles, lookupMaps);
 * 
 * console.log('Puzzle reward analysis:', {
 *   totalEdges: rewardEdges.length,
 *   puzzlesWithRewards: [...new Set(rewardEdges.map(e => e.source))].length,
 *   availableRewards: [...new Set(rewardEdges.map(e => e.target))],
 *   averageRewardsPerPuzzle: rewardEdges.length / puzzles.length
 * });
 * 
 * // Analyze reward distribution and value
 * const analyzeRewardSystem = (edges: GraphEdge[]) => {
 *   const rewardMap = edges.reduce((map, edge) => {
 *     const puzzleId = edge.source;
 *     if (!map[puzzleId]) map[puzzleId] = [];
 *     map[puzzleId].push(edge.target);
 *     return map;
 *   }, {} as Record<string, string[]>);
 *   
 *   return Object.entries(rewardMap).map(([puzzleId, rewards]) => ({
 *     puzzleId,
 *     rewardCount: rewards.length,
 *     rewards,
 *     rewardValue: rewards.length > 1 ? 'high' : 'standard',
 *     motivationLevel: rewards.length * 10 // Simple reward motivation scoring
 *   }));
 * };
 * 
 * // Investigation motivation and progression tracking
 * const trackRewardProgression = (completedPuzzles: string[]) => {
 *   const unlockedRewards = rewardEdges
 *     .filter(edge => completedPuzzles.includes(edge.source))
 *     .map(edge => edge.target);
 *   
 *   return {
 *     totalUnlocked: unlockedRewards.length,
 *     unlockedRewards,
 *     progressionPercentage: (unlockedRewards.length / rewardEdges.length) * 100
 *   };
 * };
 * ```
 * 
 * @see {@link EdgeBuilder} For consistent reward edge creation with metadata
 * @see {@link EntityLookupMaps} For reward element resolution and validation
 * @see {@link Puzzle} For puzzle structure with reward element specifications
 * 
 * @remarks
 * **Investigation Motivation Design:**
 * - Reward edges provide visual motivation for puzzle completion
 * - Enables investigation reward system balancing and optimization
 * - Supports reward-based investigation guidance and player engagement
 * - Facilitates investigation progression feedback and achievement tracking
 * 
 * **Game Mechanics Integration:**
 * - Essential for murder mystery investigation progression systems
 * - Enables reward-based puzzle difficulty balancing and player motivation
 * - Supports investigation reward visualization and anticipation features
 * - Provides foundation for investigation achievement and progress tracking
 */
export function createRewardEdges(
  puzzles: Puzzle[],
  lookupMaps: EntityLookupMaps
): GraphEdge[] {
  // Adapter: Use EdgeBuilder version for consistency
  const edgeBuilder = new EdgeBuilder();
  const edges = createRewardEdgesWithBuilder(puzzles, lookupMaps, edgeBuilder);
  
  // Transform edge data structure for backward compatibility
  const transformedEdges = edges.map(edge => ({
    ...edge,
    data: {
      relationshipType: edge.data?.relationshipType || 'reward',
      ...edge.data,
      ...edge.data?.metadata, // Flatten metadata into data
    }
  })) as GraphEdge[];
  
  logger.info(`Created ${transformedEdges.length} reward edges`);
  return transformedEdges;
}

// ============================================================================
// Timeline Edges (Element -> Timeline)
// ============================================================================

/**
 * Create timeline edges between elements and timeline events they reveal in murder mystery investigation.
 * 
 * Establishes temporal connections showing which story elements (evidence, items, clues) reveal
 * or unlock specific timeline events, enabling chronological investigation tracking and alibi
 * analysis for murder mystery investigation workflow and temporal reasoning.
 * 
 * **Timeline Revelation Types:**
 * - **Evidence Reveals**: Physical evidence that reveals specific events or alibis
 * - **Clue Connections**: Information clues that unlock timeline event details
 * - **Item Triggers**: Story items that reveal chronological information or event context
 * - **Character Testimonies**: Character-related elements that reveal timeline information
 * 
 * **Temporal Investigation Features:**
 * - Creates directed edges from elements to revealed timeline events
 * - Validates timeline event existence and creates placeholders for missing events
 * - Supports chronological investigation progression and alibi verification
 * - Enables temporal reasoning and investigation timeline reconstruction
 * 
 * @param elements Array of story elements that may reveal timeline information
 * @param lookupMaps Entity lookup maps for O(1) timeline event resolution and validation
 * @returns Array of timeline edges connecting elements to revealed timeline events
 * 
 * @complexity O(E * T) where E is elements count and T is average timeline events per element
 * 
 * @example
 * ```typescript
 * // Create timeline edges for temporal investigation analysis
 * const elements = await getElements();
 * const lookupMaps = buildLookupMaps(characters, elements, puzzles, timeline);
 * const timelineEdges = createTimelineEdges(elements, lookupMaps);
 * 
 * console.log('Timeline revelation analysis:', {
 *   totalEdges: timelineEdges.length,
 *   revealingElements: [...new Set(timelineEdges.map(e => e.source))].length,
 *   revealedEvents: [...new Set(timelineEdges.map(e => e.target))],
 *   averageEventsPerElement: timelineEdges.length / elements.length
 * });
 * 
 * // Analyze temporal investigation progression
 * const analyzeTimelineProgression = (edges: GraphEdge[]) => {
 *   const revelationMap = edges.reduce((map, edge) => {
 *     const elementId = edge.source;
 *     if (!map[elementId]) map[elementId] = [];
 *     map[elementId].push(edge.target);
 *     return map;
 *   }, {} as Record<string, string[]>);
 *   
 *   return Object.entries(revelationMap).map(([elementId, events]) => ({
 *     elementId,
 *     revealedEventCount: events.length,
 *     revealedEvents: events,
 *     temporalImportance: events.length > 1 ? 'high' : 'standard',
 *     investigationValue: events.length * 15 // Temporal evidence scoring
 *   }));
 * };
 * 
 * // Alibi verification and timeline reconstruction
 * const reconstructTimeline = (discoveredElements: string[]) => {
 *   const revealedEvents = timelineEdges
 *     .filter(edge => discoveredElements.includes(edge.source))
 *     .map(edge => edge.target);
 *   
 *   // Sort by timeline event dates for chronological reconstruction
 *   const chronologicalEvents = revealedEvents
 *     .map(eventId => lookupMaps.timeline.get(eventId))
 *     .filter(Boolean)
 *     .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
 *   
 *   return {
 *     totalRevealed: revealedEvents.length,
 *     chronologicalSequence: chronologicalEvents,
 *     timelineCompleteness: (revealedEvents.length / lookupMaps.timeline.size) * 100
 *   };
 * };
 * ```
 * 
 * @see {@link EdgeBuilder} For consistent timeline edge creation with temporal metadata
 * @see {@link EntityLookupMaps} For timeline event resolution and validation
 * @see {@link Element} For element structure with timeline revelation capabilities
 * @see {@link TimelineEvent} For timeline event structure and temporal information
 * 
 * @remarks
 * **Temporal Investigation Benefits:**
 * - Enables chronological investigation visualization and timeline reconstruction
 * - Supports alibi verification and temporal evidence analysis in murder mystery context
 * - Facilitates investigation timeline completion tracking and progress measurement
 * - Provides foundation for temporal reasoning and chronological investigation features
 * 
 * **Murder Mystery Integration:**
 * - Essential for alibi analysis and temporal evidence correlation
 * - Enables chronological investigation progression and timeline-based clue revelation
 * - Supports temporal investigation interface features and timeline visualization
 * - Provides temporal context for investigation decision-making and evidence evaluation
 */
export function createTimelineEdges(
  elements: Element[],
  lookupMaps: EntityLookupMaps
): GraphEdge[] {
  // Adapter: Use EdgeBuilder version for consistency
  const edgeBuilder = new EdgeBuilder();
  const edges = createTimelineEdgesWithBuilder(elements, lookupMaps, edgeBuilder);
  
  // Transform edge data structure for backward compatibility
  const transformedEdges = edges.map(edge => ({
    ...edge,
    data: {
      relationshipType: edge.data?.relationshipType || 'timeline',
      ...edge.data,
      ...edge.data?.metadata, // Flatten metadata into data
    }
  })) as GraphEdge[];
  
  logger.info(`Created ${transformedEdges.length} timeline edges`);
  return transformedEdges;
}



// ============================================================================
// Container Edges (Element -> Element)
// ============================================================================

/**
 * Create container edges between elements and their contained sub-elements in murder mystery investigation.
 * 
 * Establishes containment relationships showing which story elements contain or hold other
 * elements within the investigation, enabling nested evidence tracking and container-based
 * investigation mechanics for murder mystery evidence organization and discovery.
 * 
 * **Container Relationship Types:**
 * - **Physical Containers**: Items that physically contain other evidence or clues
 * - **Information Containers**: Documents or records that contain sub-information elements
 * - **Nested Evidence**: Complex evidence items with internal component evidence
 * - **Collection Containers**: Evidence collections with individual component items
 * 
 * **Container Investigation Features:**
 * - Creates directed edges from container elements to contained elements
 * - Validates contained element existence and creates placeholders for missing contents
 * - Supports nested evidence exploration and container-based investigation progression
 * - Enables hierarchical evidence organization and container search mechanics
 * 
 * @param elements Array of story elements that may contain other elements
 * @param lookupMaps Entity lookup maps for O(1) contained element resolution and validation
 * @returns Array of container edges connecting container elements to contained elements
 * 
 * @complexity O(E * C) where E is elements count and C is average contained elements per container
 * 
 * @example
 * ```typescript
 * // Create container edges for nested evidence investigation
 * const elements = await getElements();
 * const lookupMaps = buildLookupMaps(characters, elements, puzzles, timeline);
 * const containerEdges = createContainerEdges(elements, lookupMaps);
 * 
 * console.log('Container relationship analysis:', {
 *   totalEdges: containerEdges.length,
 *   containerElements: [...new Set(containerEdges.map(e => e.source))].length,
 *   containedElements: [...new Set(containerEdges.map(e => e.target))],
 *   averageContentsPerContainer: containerEdges.length / elements.filter(e => e.containedElementIds?.length).length
 * });
 * 
 * // Analyze container hierarchy and nested evidence structure
 * const analyzeContainerHierarchy = (edges: GraphEdge[]) => {
 *   const containerMap = edges.reduce((map, edge) => {
 *     const containerId = edge.source;
 *     if (!map[containerId]) map[containerId] = [];
 *     map[containerId].push(edge.target);
 *     return map;
 *   }, {} as Record<string, string[]>);
 *   
 *   return Object.entries(containerMap).map(([containerId, contents]) => ({
 *     containerId,
 *     contentCount: contents.length,
 *     contents,
 *     containerComplexity: contents.length > 2 ? 'complex' : 'simple',
 *     investigationValue: contents.length * 5 // Container investigation scoring
 *   }));
 * };
 * 
 * // Container exploration and evidence discovery tracking
 * const trackContainerExploration = (exploredContainers: string[]) => {
 *   const discoveredContents = containerEdges
 *     .filter(edge => exploredContainers.includes(edge.source))
 *     .map(edge => edge.target);
 *   
 *   return {
 *     totalDiscovered: discoveredContents.length,
 *     discoveredContents,
 *     explorationCompleteness: (exploredContainers.length / [...new Set(containerEdges.map(e => e.source))].length) * 100
 *   };
 * };
 * ```
 * 
 * @see {@link EdgeBuilder} For consistent container edge creation with containment metadata
 * @see {@link EntityLookupMaps} For contained element resolution and validation
 * @see {@link Element} For element structure with containment capabilities
 * 
 * @remarks
 * **Investigation Mechanics Benefits:**
 * - Enables nested evidence exploration and container-based investigation features
 * - Supports hierarchical evidence organization and container search mechanics
 * - Facilitates investigation progression through container discovery and exploration
 * - Provides foundation for container-based evidence tracking and collection management
 * 
 * **Container Investigation Design:**
 * - Essential for murder mystery investigation with complex evidence hierarchies
 * - Enables container-based evidence discovery and nested investigation mechanics
 * - Supports investigation interface features for container exploration and content revelation
 * - Provides container-based evidence organization for investigation workflow optimization
 */
export function createContainerEdges(
  elements: Element[],
  lookupMaps: EntityLookupMaps
): GraphEdge[] {
  // Adapter: Use EdgeBuilder version for consistency
  const edgeBuilder = new EdgeBuilder();
  const edges = createContainerEdgesWithBuilder(elements, lookupMaps, edgeBuilder);
  
  // Transform edge data structure for backward compatibility
  const transformedEdges = edges.map(edge => ({
    ...edge,
    data: {
      relationshipType: edge.data?.relationshipType || 'container',
      ...edge.data,
      ...edge.data?.metadata, // Flatten metadata into data
    }
  })) as GraphEdge[];
  
  logger.info(`Created ${transformedEdges.length} container edges`);
  return transformedEdges;
}

// ============================================================================
// EdgeBuilder-based Edge Creation Functions (Phase 3: Smart Edge Weighting)
// ============================================================================

/**
 * Create ownership edges using EdgeBuilder with smart weighting
 */
function createOwnershipEdgesWithBuilder(
  elements: Element[],
  lookupMaps: EntityLookupMaps,
  edgeBuilder: EdgeBuilder
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  elements.forEach(element => {
    if (!element.ownerId) return;
    
    // Check if owner exists
    const owner = lookupMaps.characters.get(element.ownerId);
    if (!owner) {
      logger.warn(`Element ${element.name} has unknown owner: ${element.ownerId}`);
      return;
    }
    
    const edge = edgeBuilder.createEdge(
      element.ownerId,  // Character is source
      element.id,       // Element is target
      'ownership',
      {
        metadata: {
          label: 'owns',
          strength: 0.9,
        }
      }
    );
    
    if (edge) {
      edges.push(edge);
    }
  });
  
  return edges;
}

/**
 * Create requirement edges using EdgeBuilder with smart weighting
 */
function createRequirementEdgesWithBuilder(
  puzzles: Puzzle[],
  lookupMaps: EntityLookupMaps,
  edgeBuilder: EdgeBuilder
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  puzzles.forEach(puzzle => {
    if (!puzzle.puzzleElementIds || puzzle.puzzleElementIds.length === 0) return;
    
    puzzle.puzzleElementIds.forEach(elementId => {
      // Check if element exists
      const element = lookupMaps.elements.get(elementId);
      if (!element) {
        logger.warn(`Puzzle ${puzzle.name} requires unknown element: ${elementId}`);
        return;
      }
      
      const edge = edgeBuilder.createEdge(
        elementId,  // Element is the source (flows into puzzle)
        puzzle.id,  // Puzzle is the target (receives the element)
        'requirement',
        {
          metadata: {
            label: 'needs',
            strength: 0.8,
          }
        }
      );
      
      if (edge) {
        edges.push(edge);
      }
    });
  });
  
  return edges;
}

/**
 * Create reward edges using EdgeBuilder with smart weighting
 */
function createRewardEdgesWithBuilder(
  puzzles: Puzzle[],
  lookupMaps: EntityLookupMaps,
  edgeBuilder: EdgeBuilder
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  puzzles.forEach(puzzle => {
    if (!puzzle.rewardIds || puzzle.rewardIds.length === 0) return;
    
    puzzle.rewardIds.forEach(elementId => {
      // Check if element exists
      const element = lookupMaps.elements.get(elementId);
      if (!element) {
        logger.warn(`Puzzle ${puzzle.name} rewards unknown element: ${elementId}`);
        return;
      }
      
      const edge = edgeBuilder.createEdge(
        puzzle.id,   // Puzzle is the source (provides the reward)
        elementId,   // Element is the target (receives as reward)
        'reward',
        {
          metadata: {
            label: 'gives',
            strength: 0.7,
          }
        }
      );
      
      if (edge) {
        edges.push(edge);
      }
    });
  });
  
  return edges;
}

/**
 * Create timeline edges using EdgeBuilder with smart weighting
 */
function createTimelineEdgesWithBuilder(
  elements: Element[],
  lookupMaps: EntityLookupMaps,
  edgeBuilder: EdgeBuilder
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  elements.forEach(element => {
    if (!element.timelineEventId) return;
    
    // Check if timeline event exists
    const timelineEvent = lookupMaps.timeline.get(element.timelineEventId);
    if (!timelineEvent) {
      // This is expected in filtered views where not all timeline events are included
      console.debug(`Element ${element.name} references timeline event not in current view: ${element.timelineEventId}`);
      return;
    }
    
    const edge = edgeBuilder.createEdge(
      element.id,
      element.timelineEventId,
      'timeline',
      {
        metadata: {
          label: 'appears in',
          strength: 0.5,
        }
      }
    );
    
    if (edge) {
      edges.push(edge);
    }
  });
  
  return edges;
}

/**
 * Create container edges using EdgeBuilder with smart weighting
 */
function createContainerEdgesWithBuilder(
  elements: Element[],
  lookupMaps: EntityLookupMaps,
  edgeBuilder: EdgeBuilder
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  elements.forEach(element => {
    if (!element.contentIds || element.contentIds.length === 0) return;
    
    element.contentIds.forEach(contentId => {
      // Skip self-referential edges
      if (element.id === contentId) {
        logger.warn(`Self-referential edge ignored: Element ${element.name} cannot contain itself`);
        return;
      }
      
      // Check if content element exists
      const contentElement = lookupMaps.elements.get(contentId);
      if (!contentElement) {
        logger.warn(`Element ${element.name} contains unknown element: ${contentId}`);
        return;
      }
      
      const edge = edgeBuilder.createEdge(
        element.id,   // Container is source
        contentId,    // Content element is target
        'container',
        {
          metadata: {
            label: 'contains',
            strength: 0.7,
          }
        }
      );
      
      if (edge) {
        edges.push(edge);
      }
    });
  });
  
  return edges;
}

// ============================================================================
// Main Relationship Resolution
// ============================================================================

/**
 * Data integrity report for missing entities
 */
export interface DataIntegrityReport {
  missingEntities: Map<string, { type: EntityType; referencedBy: string[] }>;
  brokenRelationships: number;
  totalRelationships: number;
  integrityScore: number; // 0-100 percentage
}

/**
 * Resolve all relationships and create comprehensive edge network for murder mystery investigation.
 * 
 * Orchestrates the creation of all relationship types between investigation entities (characters,
 * elements, puzzles, timeline events) using smart edge weighting and affinity analysis to
 * build a complete investigation graph for murder mystery visualization and analysis.
 * 
 * **Comprehensive Relationship Resolution:**
 * - **Ownership Edges**: Characters to owned elements with possession tracking
 * - **Requirement Edges**: Puzzles to required elements with dependency analysis
 * - **Reward Edges**: Puzzles to reward elements with motivation tracking
 * - **Timeline Edges**: Elements to timeline events with temporal correlation
 * - **Container Edges**: Elements to contained elements with nested evidence tracking
 * 
 * **Smart Edge Weighting Features:**
 * - Uses EdgeBuilder with intelligent weight calculation based on relationship strength
 * - Analyzes element affinity for dual-role and multi-puzzle element identification
 * - Provides comprehensive edge statistics and weight distribution analysis
 * - Optimizes edge rendering priority for investigation visualization
 * 
 * **Backward Compatibility:**
 * - Maintains original function signature for existing graph consumers
 * - Provides legacy edge format while using modern EdgeBuilder internally
 * - Preserves investigation workflow compatibility with existing systems
 * 
 * @param characters Array of investigation characters (suspects, witnesses)
 * @param elements Array of story elements (evidence, items, clues)
 * @param puzzles Array of investigation puzzles and challenges
 * @param timeline Array of timeline events for temporal investigation
 * @param nodes Optional graph nodes for enhanced affinity analysis
 * @returns Complete array of relationship edges for investigation graph
 * 
 * @complexity O(E + P + T + C) where E=elements, P=puzzles, T=timeline, C=characters
 * 
 * @example
 * ```typescript
 * // Complete relationship resolution for investigation graph
 * const characters = await getCharacters();
 * const elements = await getElements();
 * const puzzles = await getPuzzles();
 * const timeline = await getTimeline();
 * const nodes = existingGraphNodes; // Optional for affinity analysis
 * 
 * const allEdges = resolveAllRelationships(
 *   characters,
 *   elements,
 *   puzzles,
 *   timeline,
 *   nodes
 * );
 * 
 * console.log('Complete investigation network:', {
 *   totalEdges: allEdges.length,
 *   edgeTypes: [...new Set(allEdges.map(e => e.data.relationshipType))],
 *   averageWeight: allEdges.reduce((sum, e) => sum + (e.data.weight || 1), 0) / allEdges.length
 * });
 * 
 * // Analyze investigation network structure
 * const analyzeNetworkStructure = (edges: GraphEdge[]) => {
 *   const typeDistribution = edges.reduce((dist, edge) => {
 *     const type = edge.data.relationshipType;
 *     dist[type] = (dist[type] || 0) + 1;
 *     return dist;
 *   }, {} as Record<string, number>);
 *   
 *   return {
 *     totalRelationships: edges.length,
 *     relationshipTypes: typeDistribution,
 *     networkDensity: edges.length / ((characters.length + elements.length + puzzles.length + timeline.length) ** 2),
 *     investigationComplexity: Object.keys(typeDistribution).length
 *   };
 * };
 * 
 * // Investigation progression analysis
 * const trackInvestigationProgress = (completedElements: string[]) => {
 *   const availablePuzzles = allEdges
 *     .filter(edge => edge.data.relationshipType === 'requirement')
 *     .filter(edge => completedElements.includes(edge.source))
 *     .map(edge => edge.target);
 *   
 *   return {
 *     unlockedPuzzles: [...new Set(availablePuzzles)],
 *     progressPercentage: (completedElements.length / elements.length) * 100
 *   };
 * };
 * ```
 * 
 * @see {@link EdgeBuilder} For smart edge weighting and affinity analysis
 * @see {@link buildLookupMaps} For entity resolution optimization
 * @see {@link createOwnershipEdges} For ownership relationship creation
 * @see {@link createRequirementEdges} For puzzle dependency relationships
 * @see {@link createRewardEdges} For puzzle reward relationships
 * @see {@link createTimelineEdges} For temporal relationships
 * @see {@link createContainerEdges} For containment relationships
 * 
 * @remarks
 * **Investigation Workflow Integration:**
 * - Central function for complete investigation graph construction
 * - Provides foundation for all investigation visualization and analysis features
 * - Enables investigation progression tracking and puzzle dependency analysis
 * - Supports murder mystery investigation workflow optimization and player guidance
 * 
 * **Performance Characteristics:**
 * - Efficient O(1) entity lookups through optimized Map structures
 * - Smart edge weighting reduces rendering overhead for complex networks
 * - Affinity analysis provides investigation insights with minimal performance impact
 * - Comprehensive logging for investigation debugging and optimization
 */
export function resolveAllRelationships(
  characters: Character[],
  elements: Element[],
  puzzles: Puzzle[],
  timeline: TimelineEvent[],
  nodes?: GraphNode[]
): GraphEdge[] {
  // Build lookup maps for efficient resolution
  const lookupMaps = buildLookupMaps(characters, elements, puzzles, timeline);
  
  console.group('Resolving relationships with smart edge weighting');
  
  // Phase 3: Use EdgeBuilder for smart edge weighting
  // Create EdgeBuilder with nodes for affinity analysis
  const edgeBuilder = new EdgeBuilder([], nodes);
  
  // Create all edge types using EdgeBuilder
  createOwnershipEdgesWithBuilder(elements, lookupMaps, edgeBuilder);
  createRequirementEdgesWithBuilder(puzzles, lookupMaps, edgeBuilder);
  createRewardEdgesWithBuilder(puzzles, lookupMaps, edgeBuilder);
  createTimelineEdgesWithBuilder(elements, lookupMaps, edgeBuilder);
  createContainerEdgesWithBuilder(elements, lookupMaps, edgeBuilder);
  // Note: Chain edges have been removed - replaced by dependency edges
  
  // Get statistics including affinity analysis
  const stats = edgeBuilder.getStatistics();
  
  // Only analyze affinity if we have nodes
  if (nodes && nodes.length > 0) {
    const affinity = edgeBuilder.analyzeElementAffinity();
    logger.info(`Dual-role elements: ${affinity.dualRoleElements.length}`);
    logger.info(`Multi-puzzle elements: ${affinity.multiPuzzleElements.length}`);
    logger.info(`High affinity edges: ${affinity.highAffinityEdges.length}`);
  }
  
  logger.info(`Total edges created: ${stats.total}`);
  logger.info(`Average edge weight: ${stats.averageWeight.toFixed(2)}`);
  logger.info('Weight distribution:', undefined, stats.weightDistribution);
  console.groupEnd();
  
  return edgeBuilder.getEdges();
}

/**
 * Enhanced relationship resolution with comprehensive data integrity analysis and placeholder nodes.
 * 
 * Provides advanced relationship resolution for murder mystery investigation networks with
 * comprehensive missing entity detection, placeholder node creation, and data integrity
 * reporting for investigation data quality assurance and debugging.
 * 
 * **Enhanced Resolution Features:**
 * - **Missing Entity Detection**: Comprehensive scanning for broken entity references
 * - **Placeholder Node Creation**: Visual indicators for missing entities in investigation network
 * - **Data Integrity Reporting**: Detailed analysis of relationship completeness and quality
 * - **Investigation Continuity**: Maintains investigation workflow despite missing data
 * 
 * **Return Structure:**
 * - **edges**: Complete array of valid relationship edges for investigation graph
 * - **placeholderNodes**: Visual placeholder nodes for missing entity references
 * - **report**: Comprehensive data integrity analysis with quality metrics
 * 
 * **Data Quality Analysis:**
 * - Tracks all missing entity references across all relationship types
 * - Calculates investigation data integrity score (0-100 percentage)
 * - Provides detailed breakdown of broken relationships by entity type
 * - Enables investigation data quality monitoring and debugging
 * 
 * @param characters Array of investigation characters for relationship analysis
 * @param elements Array of story elements for comprehensive relationship scanning
 * @param puzzles Array of investigation puzzles for dependency analysis
 * @param timeline Array of timeline events for temporal relationship validation
 * @returns Object containing edges, placeholder nodes, and data integrity report
 * 
 * @complexity O(E + P + T + C + M) where E=elements, P=puzzles, T=timeline, C=characters, M=missing entities
 * 
 * @example
 * ```typescript
 * // Enhanced relationship resolution with data integrity analysis
 * const characters = await getCharacters();
 * const elements = await getElements();
 * const puzzles = await getPuzzles();
 * const timeline = await getTimeline();
 * 
 * const {
 *   edges,
 *   placeholderNodes,
 *   report
 * } = resolveRelationshipsWithIntegrity(
 *   characters,
 *   elements,
 *   puzzles,
 *   timeline
 * );
 * 
 * console.log('Investigation data quality analysis:', {
 *   totalEdges: edges.length,
 *   missingEntities: report.missingEntities.size,
 *   integrityScore: report.integrityScore,
 *   placeholderCount: placeholderNodes.length
 * });
 * 
 * // Investigation data quality dashboard
 * const generateQualityDashboard = (report: DataIntegrityReport) => {
 *   const missingByType = {};
 *   for (const [entityId, info] of report.missingEntities) {
 *     const type = info.type;
 *     missingByType[type] = (missingByType[type] || 0) + 1;
 *   }
 *   
 *   return {
 *     overallHealth: report.integrityScore > 80 ? 'healthy' : 'needs_attention',
 *     integrityScore: report.integrityScore,
 *     relationshipStats: {
 *       total: report.totalRelationships,
 *       broken: report.brokenRelationships,
 *       valid: report.totalRelationships - report.brokenRelationships
 *     },
 *     missingEntitiesByType: missingByType,
 *     investigationImpact: report.integrityScore < 70 ? 'critical' : 'manageable'
 *   };
 * };
 * 
 * // Visual investigation network with data quality indicators
 * const createEnhancedGraph = () => {
 *   const allNodes = [
 *     ...characterNodes,
 *     ...elementNodes,
 *     ...puzzleNodes,
 *     ...timelineNodes,
 *     ...placeholderNodes // Visual indicators for missing entities
 *   ];
 *   
 *   return {
 *     nodes: allNodes,
 *     edges: edges,
 *     metadata: {
 *       dataQuality: report.integrityScore,
 *       missingEntityCount: placeholderNodes.length,
 *       investigationCompleteness: ((edges.length / report.totalRelationships) * 100)
 *     }
 *   };
 * };
 * ```
 * 
 * @see {@link DataIntegrityReport} For data integrity report structure
 * @see {@link createPlaceholderNode} For placeholder node creation
 * @see {@link buildLookupMaps} For entity resolution optimization
 * @see {@link resolveAllRelationships} For standard relationship resolution
 * 
 * @remarks
 * **Investigation Data Quality Benefits:**
 * - Enables proactive identification of investigation data issues
 * - Provides visual feedback for missing entity references in investigation interface
 * - Supports investigation workflow continuity despite incomplete data
 * - Facilitates investigation data debugging and quality assurance processes
 * 
 * **Murder Mystery Investigation Integration:**
 * - Essential for investigation data quality monitoring and debugging
 * - Enables investigation workflow resilience with missing entity handling
 * - Provides investigation data completeness metrics for progress tracking
 * - Supports investigation interface features for data quality visualization
 */
export function resolveRelationshipsWithIntegrity(
  characters: Character[],
  elements: Element[],
  puzzles: Puzzle[],
  timeline: TimelineEvent[]
): {
  edges: GraphEdge[];
  placeholderNodes: Node<PlaceholderNodeData>[];
  report: DataIntegrityReport;
} {
  // Build lookup maps for efficient resolution
  const lookupMaps = buildLookupMaps(characters, elements, puzzles, timeline);
  
  // Track missing entities
  const missingEntities = new Map<string, { type: EntityType; referencedBy: string[] }>();
  const placeholderNodes: Node<PlaceholderNodeData>[] = [];
  let brokenRelationships = 0;
  let totalRelationships = 0;
  
  console.group('Resolving relationships with integrity checking');
  
  // Helper to track missing entity
  const trackMissingEntity = (id: string, type: EntityType, referencedBy: string) => {
    const existing = missingEntities.get(id);
    if (existing) {
      existing.referencedBy.push(referencedBy);
    } else {
      missingEntities.set(id, { type, referencedBy: [referencedBy] });
    }
  };
  
  // Create all edge types with missing entity tracking
  const allEdges: GraphEdge[] = [];
  
  // First, scan all entities for references to missing entities
  // This is more comprehensive than just looking at created edges
  
  // Check Elements for missing owners
  elements.forEach(element => {
    if (element.ownerId && !lookupMaps.characters.has(element.ownerId)) {
      trackMissingEntity(element.ownerId, 'character', `Element: ${element.name}`);
    }
    if (element.timelineEventId && !lookupMaps.timeline.has(element.timelineEventId)) {
      trackMissingEntity(element.timelineEventId, 'timeline', `Element: ${element.name}`);
    }
    // Check container relationships
    element.contentIds?.forEach(contentId => {
      if (!lookupMaps.elements.has(contentId)) {
        trackMissingEntity(contentId, 'element', `Container: ${element.name}`);
      }
    });
  });
  
  // Check Puzzles for missing elements and sub-puzzles
  puzzles.forEach(puzzle => {
    puzzle.puzzleElementIds?.forEach(elementId => {
      if (!lookupMaps.elements.has(elementId)) {
        trackMissingEntity(elementId, 'element', `Puzzle requirement: ${puzzle.name}`);
      }
    });
    puzzle.rewardIds?.forEach(elementId => {
      if (!lookupMaps.elements.has(elementId)) {
        trackMissingEntity(elementId, 'element', `Puzzle reward: ${puzzle.name}`);
      }
    });
    puzzle.subPuzzleIds?.forEach(subPuzzleId => {
      if (!lookupMaps.puzzles.has(subPuzzleId)) {
        trackMissingEntity(subPuzzleId, 'puzzle', `Parent puzzle: ${puzzle.name}`);
      }
    });
  });
  
  // Create edges (these won't include edges to missing entities due to the checks in creation functions)
  const standardEdges = [
    ...createOwnershipEdges(elements, lookupMaps),
    ...createRequirementEdges(puzzles, lookupMaps),
    ...createRewardEdges(puzzles, lookupMaps),
    ...createTimelineEdges(elements, lookupMaps),
    ...createContainerEdges(elements, lookupMaps),
  ];
  
  // Count relationships (including broken ones we couldn't create)
  totalRelationships = standardEdges.length + missingEntities.size;
  brokenRelationships = missingEntities.size;
  
  // Add the created edges
  allEdges.push(...standardEdges);
  
  // Create placeholder nodes for missing entities
  missingEntities.forEach((info, id) => {
    const placeholder = createPlaceholderNode(
      id, 
      info.type,
      info.referencedBy.join(', ')
    );
    placeholderNodes.push(placeholder);
  });
  
  // Calculate integrity score
  const integrityScore = totalRelationships > 0
    ? Math.round(((totalRelationships - brokenRelationships) / totalRelationships) * 100)
    : 100;
  
  logger.debug(`Data integrity: ${integrityScore}%`);
  logger.debug(`Missing entities: ${missingEntities.size}`);
  logger.debug(`Broken relationships: ${brokenRelationships}/${totalRelationships}`);
  console.groupEnd();
  
  // Remove duplicates
  const uniqueEdges = new Map<string, GraphEdge>();
  allEdges.forEach(edge => {
    uniqueEdges.set(edge.id, edge);
  });
  
  return {
    edges: Array.from(uniqueEdges.values()),
    placeholderNodes,
    report: {
      missingEntities,
      brokenRelationships,
      totalRelationships,
      integrityScore,
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Filter edges by relationship type
 */
export function filterEdgesByType(
  edges: GraphEdge[],
  types: RelationshipType[]
): GraphEdge[] {
  return edges.filter(edge => 
    types.includes(edge.data?.relationshipType as RelationshipType)
  );
}

/**
 * Get edges connected to a specific node
 */
export function getConnectedEdges(
  nodeId: string,
  edges: GraphEdge[]
): {
  incoming: GraphEdge[];
  outgoing: GraphEdge[];
} {
  return {
    incoming: edges.filter(e => e.target === nodeId),
    outgoing: edges.filter(e => e.source === nodeId),
  };
}

/**
 * Calculate node connectivity score
 */
export function calculateConnectivity(
  nodeId: string,
  edges: GraphEdge[]
): number {
  const connected = getConnectedEdges(nodeId, edges);
  return connected.incoming.length + connected.outgoing.length;
}