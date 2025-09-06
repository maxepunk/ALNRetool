/**
 * Professional central type definitions for ALNRetool murder mystery investigation graph system.
 * 
 * Provides comprehensive TypeScript type definitions and interfaces for the complete
 * investigation graph visualization system, enabling type-safe development of murder
 * mystery game mechanics, entity relationships, and interactive investigation workflows.
 * 
 * **Core Type System Architecture:**
 * - **Entity Types**: Character, Element, Puzzle, TimelineEvent type definitions
 * - **Graph Structure**: Node and edge interfaces with investigation-specific metadata
 * - **Relationship System**: Comprehensive relationship types for murder mystery mechanics
 * - **Visualization Config**: View types, layout configuration, and rendering options
 * - **Data Integrity**: Quality analysis and missing entity tracking interfaces
 * - **Investigation Workflow**: Progress tracking, depth analysis, and user interaction types
 * 
 * **Murder Mystery Integration:**
 * - **Investigation Entities**: Suspects, witnesses, evidence, clues, and timeline events
 * - **Relationship Networks**: Ownership, requirements, rewards, and temporal connections
 * - **Visual Investigation**: Node clustering, edge weighting, and investigation progression
 * - **Data Quality**: Missing entity detection, placeholder nodes, and integrity reporting
 * - **Game Mechanics**: SF_ pattern support, puzzle dependencies, and progression tracking
 * 
 * **Type Safety Benefits:**
 * - Compile-time validation of graph structure and entity relationships
 * - IntelliSense support for investigation workflow development
 * - Prevention of runtime errors through strict type checking
 * - Consistent interfaces across all graph submodules and components
 * 
 * **Key Design Principles:**
 * - **Modularity**: Clean separation between core types and view-specific extensions
 * - **Extensibility**: Flexible interfaces supporting new investigation features
 * - **Performance**: Optimized type structures for large investigation networks
 * - **Maintainability**: Clear type contracts enabling safe refactoring and updates
 * 
 * @example
 * ```typescript
 * // Investigation graph structure
 * const investigationGraph: GraphData = {
 *   nodes: characterNodes.concat(evidenceNodes, puzzleNodes, timelineNodes),
 *   edges: ownershipEdges.concat(requirementEdges, timelineEdges),
 *   integrityReport: {
 *     missingReferences: { characters: [], elements: [], puzzles: [], timeline: [] },
 *     orphanedEntities: { puzzles: [], elements: [] },
 *     brokenRelationships: []
 *   },
 *   metadata: {
 *     viewType: ViewTypes.FULL_NETWORK,
 *     metrics: { nodeCount: 150, edgeCount: 300, duration: 45 }
 *   }
 * };
 * 
 * // Type-safe entity processing
 * const processInvestigationEntities = (entities: NotionEntity[]) => {
 *   entities.forEach(entity => {
 *     switch (entity.object) {
 *       case 'character': // TypeScript knows this is Character
 *         console.log('Processing suspect:', entity.name, 'Tier:', entity.tier);
 *         break;
 *       case 'element': // TypeScript knows this is Element  
 *         console.log('Processing evidence:', entity.name, 'Type:', entity.basicType);
 *         break;
 *     }
 *   });
 * };
 * ```
 * 
 * @see {@link GraphNode} For node structure with investigation metadata
 * @see {@link GraphEdge} For edge relationships in murder mystery context
 * @see {@link ViewTypes} For supported investigation visualization modes
 * @see {@link RelationshipTypes} For entity relationship classifications
 * 
 * @author ALNRetool Development Team
 * @since 1.0.0
 * @module types
 */

import type { Node, Edge } from '@xyflow/react';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent
} from '@/types/notion/app';

// Re-export entity types for convenience
export type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

// Type alias for union of entity types
export type NotionEntity = Character | Element | Puzzle | TimelineEvent;
export type Entity = NotionEntity;

/**
 * Comprehensive investigation data structure for murder mystery entity storage.
 * 
 * Defines the complete data container for all investigation entities retrieved from
 * Notion databases, providing organized access to characters, evidence, puzzles, and
 * timeline events for murder mystery investigation graph construction and analysis.
 * 
 * **Investigation Entity Categories:**
 * - **characters**: Suspects, witnesses, and key figures in the investigation
 * - **elements**: Physical evidence, story items, clues, and investigation materials
 * - **puzzles**: Investigation challenges, mini-games, and problem-solving activities
 * - **timeline**: Temporal events, alibis, and chronological investigation markers
 * 
 * **Data Organization Benefits:**
 * - Centralized access to all investigation entities from single interface
 * - Type-safe entity access with compile-time validation
 * - Consistent data structure across investigation workflow components
 * - Efficient batch processing and relationship resolution
 * 
 * @example
 * ```typescript
 * // Investigation data retrieval and processing
 * const investigationData: NotionData = {
 *   characters: await getCharacters(), // Suspects and witnesses
 *   elements: await getElements(),     // Evidence and clues
 *   puzzles: await getPuzzles(),       // Investigation challenges
 *   timeline: await getTimeline()      // Temporal events and alibis
 * };
 * 
 * // Investigation entity analysis
 * const analyzeInvestigation = (data: NotionData) => {
 *   const suspects = data.characters.filter(c => c.tier <= 2);
 *   const evidence = data.elements.filter(e => e.basicType === 'Evidence');
 *   const activePuzzles = data.puzzles.filter(p => p.status !== 'Complete');
 *   const recentEvents = data.timeline.filter(t => 
 *     new Date(t.date) > new Date('2024-01-01')
 *   );
 *   
 *   return {
 *     investigationScope: {
 *       suspectCount: suspects.length,
 *       evidenceCount: evidence.length,
 *       pendingPuzzles: activePuzzles.length,
 *       timelineEvents: recentEvents.length
 *     },
 *     investigationHealth: {
 *       hasMainSuspects: suspects.some(s => s.tier === 1),
 *       hasCriticalEvidence: evidence.length > 5,
 *       hasProgressionPuzzles: activePuzzles.length > 0
 *     }
 *   };
 * };
 * ```
 * 
 * @see {@link Character} For character entity structure
 * @see {@link Element} For element entity structure  
 * @see {@link Puzzle} For puzzle entity structure
 * @see {@link TimelineEvent} For timeline event structure
 */
export interface NotionData {
  characters: Character[];
  elements: Element[];
  puzzles: Puzzle[];
  timeline: TimelineEvent[];
}

/**
 * Comprehensive data integrity analysis for murder mystery investigation quality assurance.
 * 
 * Provides detailed reporting of data quality issues, missing entity references, and
 * broken relationships within the investigation network, enabling investigation data
 * debugging, quality monitoring, and investigation workflow reliability assessment.
 * 
 * **Data Quality Categories:**
 * - **missingReferences**: Entity IDs referenced but not found in investigation data
 * - **orphanedEntities**: Entities without proper connections to investigation network
 * - **brokenRelationships**: Invalid or incomplete relationship definitions
 * 
 * **Investigation Quality Assurance:**
 * - Identifies missing suspects, evidence, or timeline events
 * - Detects orphaned puzzles without proper element requirements
 * - Reports broken ownership, dependency, or timeline relationships
 * - Enables investigation data completeness validation
 * 
 * @example
 * ```typescript
 * // Investigation data quality analysis
 * const analyzeInvestigationQuality = (report: DataIntegrityReport) => {
 *   const qualityMetrics = {
 *     missingEntityCount: Object.values(report.missingReferences)
 *       .reduce((sum, refs) => sum + refs.length, 0),
 *     orphanedEntityCount: Object.values(report.orphanedEntities)
 *       .reduce((sum, entities) => sum + entities.length, 0),
 *     brokenRelationshipCount: report.brokenRelationships.length
 *   };
 *   
 *   const investigationHealth = {
 *     overallScore: calculateIntegrityScore(qualityMetrics),
 *     criticalIssues: identifyCriticalIssues(report),
 *     recommendedActions: generateActionPlan(report)
 *   };
 *   
 *   return { qualityMetrics, investigationHealth };
 * };
 * 
 * // Investigation data repair recommendations
 * const generateRepairPlan = (report: DataIntegrityReport) => {
 *   const actions = [];
 *   
 *   if (report.missingReferences.characters.length > 0) {
 *     actions.push('Review character database for missing suspect records');
 *   }
 *   if (report.orphanedEntities.puzzles.length > 0) {
 *     actions.push('Connect orphaned puzzles to investigation progression');
 *   }
 *   
 *   return actions;
 * };
 * ```
 * 
 * 
 * @see {@link EntityType} For entity type classification
 */
export interface DataIntegrityReport {
  missingReferences: {
    puzzles: string[];
    elements: string[];
    characters: string[];
    timeline: string[];
  };
  orphanedEntities: {
    puzzles: string[];
    elements: string[];
  };
  brokenRelationships: Array<{
    source: string;
    target: string;
    type: string;
    reason: string;
  }>;
}

// Re-export commonly used types for convenience
export type { 
  Node as ReactFlowNode, 
  Edge as ReactFlowEdge 
} from '@xyflow/react';

/**
 * Comprehensive view types for murder mystery investigation graph visualization modes.
 * 
 * Defines all supported visualization perspectives for investigation analysis, enabling
 * specialized graph layouts and filtering optimized for different investigation workflows
 * and murder mystery game mechanics analysis and player interaction patterns.
 * 
 * **Investigation View Categories:**
 * - **PUZZLE_FOCUS**: Puzzle-centric view showing dependencies and progression chains
 * - **CHARACTER_JOURNEY**: Character-focused view highlighting suspect relationships
 * - **CONTENT_STATUS**: Status-based view showing investigation progress and completion
 * - **NODE_CONNECTIONS**: Network view emphasizing entity interconnections
 * - **TIMELINE**: Chronological view for alibi analysis and temporal investigation
 * - **FULL_NETWORK**: Complete investigation network with all entities and relationships
 * 
 * **View Specialization Benefits:**
 * - Optimized layouts for specific investigation analysis tasks
 * - Filtered entity sets reducing visual complexity for focused analysis
 * - Specialized edge weighting and node positioning for investigation insights
 * - Context-appropriate visual styling and interaction patterns
 * 
 * @example
 * ```typescript
 * // Investigation view selection and configuration
 * const configureInvestigationView = (focusArea: string) => {
 *   switch (focusArea) {
 *     case 'suspect-analysis':
 *       return {
 *         viewType: ViewTypes.CHARACTER_JOURNEY,
 *         filterConfig: { entityTypes: ['character'], maxDepth: 2 },
 *         layoutConfig: { algorithm: 'force-clustered', emphasis: 'character' }
 *       };
 *     
 *     case 'evidence-tracking':
 *       return {
 *         viewType: ViewTypes.CONTENT_STATUS,
 *         filterConfig: { statusFilter: ['incomplete', 'discovered'] },
 *         layoutConfig: { algorithm: 'dagre', direction: 'TB' }
 *       };
 *     
 *     case 'timeline-reconstruction':
 *       return {
 *         viewType: ViewTypes.TIMELINE,
 *         filterConfig: { sortBy: 'chronological' },
 *         layoutConfig: { algorithm: 'timeline-linear' }
 *       };
 *   }
 * };
 * 
 * // Dynamic view switching for investigation workflow
 * const switchInvestigationFocus = (currentView: ViewType, targetFocus: string) => {
 *   const viewTransitions = {
 *     [ViewTypes.FULL_NETWORK]: ViewTypes.PUZZLE_FOCUS,
 *     [ViewTypes.PUZZLE_FOCUS]: ViewTypes.CHARACTER_JOURNEY,
 *     [ViewTypes.CHARACTER_JOURNEY]: ViewTypes.TIMELINE
 *   };
 *   
 *   return viewTransitions[currentView] || ViewTypes.FULL_NETWORK;
 * };
 * ```
 * 
 * @readonly Constant object preventing runtime modification
 * @see {@link ViewType} For type-safe view type usage
 * @see {@link BuildGraphOptions} For view-specific graph building options
 */
export const ViewTypes = {
  PUZZLE_FOCUS: 'puzzle-focus',
  CHARACTER_JOURNEY: 'character-journey',
  CONTENT_STATUS: 'content-status',
  NODE_CONNECTIONS: 'node-connections',
  TIMELINE: 'timeline',
  FULL_NETWORK: 'full-network'
} as const;

export type ViewType = typeof ViewTypes[keyof typeof ViewTypes];

/**
 * Core entity types for murder mystery investigation node representation.
 * 
 * Defines the fundamental entity categories that can be visualized as nodes within
 * the investigation graph, providing type-safe entity classification for murder mystery
 * game mechanics, investigation workflow processing, and graph visualization systems.
 * 
 * **Murder Mystery Entity Classifications:**
 * - **CHARACTER**: Suspects, witnesses, victims, and key investigation figures
 * - **ELEMENT**: Physical evidence, story items, clues, and investigation materials
 * - **PUZZLE**: Investigation challenges, mini-games, and problem-solving activities
 * - **TIMELINE**: Temporal events, alibis, chronological markers, and time-based clues
 * 
 * **Entity Processing Benefits:**
 * - Type-safe entity discrimination and processing workflows
 * - Consistent entity classification across all investigation components
 * - Compile-time validation of entity type operations
 * - Specialized handling for different investigation entity categories
 * 
 * @example
 * ```typescript
 * // Type-safe entity processing by category
 * const processInvestigationEntity = (entity: NotionEntity) => {
 *   switch (entity.object) {
 *     case EntityTypes.CHARACTER:
 *       return processCharacterForInvestigation(entity as Character);
 *     case EntityTypes.ELEMENT:
 *       return processEvidenceForInvestigation(entity as Element);
 *     case EntityTypes.PUZZLE:
 *       return processPuzzleForInvestigation(entity as Puzzle);
 *     case EntityTypes.TIMELINE:
 *       return processTimelineEventForInvestigation(entity as TimelineEvent);
 *     default:
 *       throw new Error(`Unknown entity type: ${entity.object}`);
 *   }
 * };
 * 
 * // Investigation entity filtering and analysis
 * const analyzeEntityDistribution = (entities: NotionEntity[]) => {
 *   const distribution = entities.reduce((dist, entity) => {
 *     const type = entity.object as EntityType;
 *     dist[type] = (dist[type] || 0) + 1;
 *     return dist;
 *   }, {} as Record<EntityType, number>);
 *   
 *   return {
 *     totalEntities: entities.length,
 *     distribution,
 *     investigationBalance: {
 *       hasSufficientSuspects: distribution[EntityTypes.CHARACTER] >= 3,
 *       hasAdequateEvidence: distribution[EntityTypes.ELEMENT] >= 10,
 *       hasProgressionPuzzles: distribution[EntityTypes.PUZZLE] >= 5,
 *       hasTemporalStructure: distribution[EntityTypes.TIMELINE] >= 8
 *     }
 *   };
 * };
 * ```
 * 
 * @readonly Constant object preventing runtime modification
 * @see {@link EntityType} For type-safe entity type usage
 * @see {@link NotionEntity} For entity union type definition
 * @see {@link isEntityType} For runtime entity type checking
 */
export const EntityTypes = {
  CHARACTER: 'character',
  ELEMENT: 'element',
  PUZZLE: 'puzzle',
  TIMELINE: 'timeline'
} as const;

export type EntityType = typeof EntityTypes[keyof typeof EntityTypes];

/**
 * Comprehensive relationship types for murder mystery investigation entity connections.
 * 
 * Defines all supported relationship categories between investigation entities, enabling
 * sophisticated relationship modeling for murder mystery game mechanics, investigation
 * progression tracking, and complex entity interaction analysis within the graph system.
 * 
 * **Core Investigation Relationships:**
 * - **REQUIREMENT**: Puzzle dependencies requiring specific elements for completion
 * - **REWARD**: Puzzle completion rewards unlocking new elements or information
 * - **CHAIN**: Sequential puzzle connections forming investigation progression paths
 * - **COLLABORATION**: Character teamwork and cooperative investigation relationships
 * - **TIMELINE**: Temporal connections between elements and timeline events
 * - **OWNER/OWNERSHIP**: Character possession and control of investigation elements
 * - **CONTAINER**: Element containment relationships for nested evidence
 * - **PUZZLE_GROUPING**: Related puzzle collections forming investigation themes
 * - **VIRTUAL_DEPENDENCY**: Layout-only relationships for visual graph organization
 * 
 * **Murder Mystery Mechanics Integration:**
 * - Investigation progression through requirement and reward chains
 * - Evidence ownership tracking for suspect analysis
 * - Temporal relationship modeling for alibi verification
 * - Collaborative investigation mechanics between characters
 * - Nested evidence discovery through container relationships
 * 
 * @example
 * ```typescript
 * // Investigation relationship analysis and processing
 * const analyzeInvestigationRelationships = (edges: GraphEdge[]) => {
 *   const relationshipStats = edges.reduce((stats, edge) => {
 *     const type = edge.data?.relationshipType;
 *     if (type) stats[type] = (stats[type] || 0) + 1;
 *     return stats;
 *   }, {} as Record<RelationshipType, number>);
 *   
 *   return {
 *     totalRelationships: edges.length,
 *     relationshipDistribution: relationshipStats,
 *     investigationMetrics: {
 *       puzzleComplexity: relationshipStats[RelationshipTypes.REQUIREMENT] || 0,
 *       rewardMotivation: relationshipStats[RelationshipTypes.REWARD] || 0,
 *       evidenceOwnership: relationshipStats[RelationshipTypes.OWNERSHIP] || 0,
 *       temporalConnections: relationshipStats[RelationshipTypes.TIMELINE] || 0
 *     }
 *   };
 * };
 * 
 * // Investigation progression path analysis
 * const tracePuzzleProgression = (edges: GraphEdge[]) => {
 *   const requirementEdges = edges.filter(e => 
 *     e.data?.relationshipType === RelationshipTypes.REQUIREMENT
 *   );
 *   const rewardEdges = edges.filter(e => 
 *     e.data?.relationshipType === RelationshipTypes.REWARD
 *   );
 *   
 *   return {
 *     dependencyChains: buildDependencyChains(requirementEdges),
 *     rewardPaths: buildRewardPaths(rewardEdges),
 *     investigationFlow: analyzeProgressionFlow(requirementEdges, rewardEdges)
 *   };
 * };
 * ```
 * 
 * @readonly Constant object preventing runtime modification
 * @see {@link RelationshipType} For type-safe relationship type usage
 * @see {@link GraphEdge} For edge structure with relationship data
 * @see {@link createOwnershipEdges} For ownership relationship creation
 * @see {@link createRequirementEdges} For requirement relationship creation
 */
export const RelationshipTypes = {
  REQUIREMENT: 'requirement',
  REWARD: 'reward',
  CHAIN: 'chain',
  COLLABORATION: 'collaboration',
  TIMELINE: 'timeline',
  OWNER: 'owner',
  OWNERSHIP: 'ownership',
  CONTAINER: 'container',
  PUZZLE_GROUPING: 'puzzle-grouping',
  VIRTUAL_DEPENDENCY: 'virtual-dependency',
  VIRTUAL_ALIGNMENT: 'virtual-alignment',
  VIRTUAL_ALIGNMENT_SAME_RANK: 'virtual-alignment-same-rank',
  VIRTUAL_ALIGNMENT_NEXT_RANK: 'virtual-alignment-next-rank',
  PUZZLE: 'puzzle',
  CHARACTER_PUZZLE: 'character-puzzle',
  DEPENDENCY: 'dependency',
  RELATIONSHIP: 'relationship',
  CONNECTION: 'connection'
} as const;

export type RelationshipType = typeof RelationshipTypes[keyof typeof RelationshipTypes];

/**
 * Placeholder node data structure for missing entities in murder mystery investigation visualization.
 * 
 * Defines the data structure for visual placeholder nodes that represent missing or broken
 * entity references within the investigation graph, enabling investigation data integrity
 * visualization, debugging support, and investigation workflow continuity despite incomplete data.
 * 
 * **Placeholder Node Features:**
 * - **Visual Distinction**: Red-colored nodes with dashed borders for immediate recognition
 * - **Missing Entity Info**: Entity type, ID, and reason for missing reference
 * - **Investigation Context**: Information about what entity referenced the missing item
 * - **Debug Support**: Comprehensive metadata for investigation data quality analysis
 * 
 * **Investigation Workflow Integration:**
 * - Maintains investigation graph completeness despite missing data
 * - Provides visual feedback for investigation data quality issues
 * - Enables investigation workflow continuity with incomplete entity references
 * - Supports investigation debugging and data repair workflows
 * 
 * @example
 * ```typescript
 * // Placeholder node creation for missing evidence
 * const missingEvidenceNode: Node<PlaceholderNodeData> = {
 *   id: 'missing-evidence-abc123',
 *   type: 'placeholder',
 *   position: { x: 100, y: 200 },
 *   data: {
 *     label: 'Missing element: abc123de...',
 *     metadata: {
 *       entityType: EntityTypes.ELEMENT,
 *       entityId: 'evidence-abc123def456',
 *       isPlaceholder: true,
 *       missingReason: 'Referenced evidence not found in Notion database'
 *     },
 *     visualStyle: 'missing-entity-red-dashed'
 *   },
 *   style: {
 *     background: '#fee2e2',
 *     border: '2px dashed #dc2626',
 *     opacity: 0.8
 *   }
 * };
 * 
 * // Investigation data quality analysis using placeholder nodes
 * const analyzePlaceholderNodes = (placeholders: Node<PlaceholderNodeData>[]) => {
 *   const missingByType = placeholders.reduce((analysis, node) => {
 *     const type = node.data.metadata.entityType;
 *     analysis[type] = (analysis[type] || 0) + 1;
 *     return analysis;
 *   }, {} as Record<EntityType, number>);
 *   
 *   return {
 *     totalMissing: placeholders.length,
 *     missingByEntityType: missingByType,
 *     investigationImpact: {
 *       criticalMissing: missingByType[EntityTypes.CHARACTER] > 0,
 *       evidenceGaps: missingByType[EntityTypes.ELEMENT] > 5,
 *       puzzleIssues: missingByType[EntityTypes.PUZZLE] > 0
 *     },
 *     repairRecommendations: generateRepairSuggestions(missingByType)
 *   };
 * };
 * ```
 * 
 * @see {@link createPlaceholderNode} For placeholder node creation function
 * @see {@link EntityType} For entity type classification
 * @see {@link DataIntegrityReport} For investigation data quality analysis
 */
export interface PlaceholderNodeData {
  label: string;
  metadata: {
    entityType: EntityType;
    entityId: string;
    isPlaceholder: true;
    missingReason?: string;
  };
  [key: string]: unknown; // Index signature for Record<string, unknown> constraint
}

/**
 * Visual hint configuration for investigation node rendering and styling.
 * 
 * Defines visual styling properties for investigation graph nodes, enabling consistent
 * visual representation of murder mystery entities with specialized styling for different
 * investigation contexts, entity types, and investigation workflow states.
 * 
 * **Visual Styling Categories:**
 * - **color**: Node color for entity type distinction and investigation status
 * - **size**: Node size scaling for importance, tier, or investigation priority
 * - **shape**: Node shape for entity category visual identification
 * - **icon**: Entity-specific icons for immediate visual recognition
 * - **badge**: Status badges for investigation progress and completion indicators
 * 
 * **Murder Mystery Visual Design:**
 * - Character nodes with tier-based color coding (suspects vs witnesses)
 * - Evidence nodes with status-based visual indicators (discovered, analyzed)
 * - Puzzle nodes with difficulty and completion visual feedback
 * - Timeline nodes with chronological styling and temporal emphasis
 * 
 * @example
 * ```typescript
 * // Investigation entity visual configuration
 * const createEntityVisualHints = (entity: NotionEntity): VisualHints => {
 *   switch (entity.object) {
 *     case EntityTypes.CHARACTER:
 *       const character = entity as Character;
 *       return {
 *         color: character.tier <= 2 ? '#dc2626' : '#059669', // Red for suspects, green for witnesses
 *         size: character.tier === 1 ? 'large' : 'medium',
 *         shape: 'circle',
 *         icon: 'person',
 *         badge: character.role === 'Suspect' ? '⚠️' : '👁️'
 *       };
 *     
 *     case EntityTypes.ELEMENT:
 *       const element = entity as Element;
 *       return {
 *         color: element.basicType === 'Evidence' ? '#7c3aed' : '#0891b2',
 *         size: element.status === 'Critical' ? 'large' : 'medium',
 *         shape: 'rectangle',
 *         icon: 'evidence',
 *         badge: element.status === 'Analyzed' ? '✓' : '?'
 *       };
 *   }
 * };
 * 
 * // Investigation status visual indicators
 * const updateInvestigationVisuals = (progress: InvestigationProgress) => {
 *   return {
 *     completedNodes: { color: '#10b981', badge: '✓' },
 *     inProgressNodes: { color: '#f59e0b', badge: '⏳' },
 *     blockedNodes: { color: '#ef4444', badge: '🚫' },
 *     availableNodes: { color: '#6b7280', badge: '📋' }
 *   };
 * };
 * ```
 * 
 * @see {@link NodeMetadata} For node metadata containing visual hints
 * @see {@link GraphNodeData} For node data structure with styling
 */
export interface VisualHints {
  color?: string;
  size?: 'small' | 'medium' | 'large';
  shape?: 'rectangle' | 'diamond' | 'circle';
  icon?: string;
  badge?: string;
}

/**
 * SF_ pattern metadata for "About Last Night" murder mystery investigation mechanics.
 * 
 * Defines metadata structure for SF_ pattern parsing within element descriptions,
 * enabling specialized murder mystery game mechanics, investigation progression tracking,
 * and interactive element behavior within the "About Last Night" investigation system.
 * 
 * **SF_ Pattern Components:**
 * - **rfid**: Unique element identifier for game system integration
 * - **valueRating**: Investigation value rating (1-10) for element importance
 * - **memoryType**: Memory classification for investigation context and player interaction
 * - **group**: Element grouping with optional multiplier for collective mechanics
 * - **multiplier**: Legacy compatibility support for group-based calculations
 * 
 * **Memory Type Classifications:**
 * - **Personal**: Private character memories and individual experiences
 * - **Public**: Shared knowledge and common investigation information
 * - **Mixed**: Combination of personal and public investigation elements
 * - **Business**: Professional or work-related investigation context
 * - **Technical**: Specialized technical knowledge and forensic information
 * 
 * @example
 * ```typescript
 * // SF_ pattern extraction and processing for investigation elements
 * const processSFPattern = (elementDescription: string): SFMetadata => {
 *   const pattern = extractSFMetadata(elementDescription);
 *   
 *   return {
 *     rfid: pattern.rfid || generateElementRFID(),
 *     valueRating: pattern.valueRating || calculateInvestigationValue(),
 *     memoryType: pattern.memoryType || 'Public',
 *     group: pattern.group || 'General Evidence',
 *     multiplier: pattern.multiplier || 1
 *   };
 * };
 * 
 * // Investigation element value calculation using SF_ metadata
 * const calculateElementValue = (metadata: SFMetadata) => {
 *   const baseValue = metadata.valueRating || 5;
 *   const typeMultiplier = {
 *     'Personal': 1.5,    // Personal memories have higher investigation value
 *     'Technical': 1.3,   // Technical evidence is valuable
 *     'Business': 1.2,    // Business context adds investigation depth
 *     'Public': 1.0,      // Standard public information baseline
 *     'Mixed': 1.1        // Mixed information moderate bonus
 *   }[metadata.memoryType || 'Public'];
 *   
 *   const groupMultiplier = typeof metadata.group === 'object' 
 *     ? parseFloat(metadata.group.multiplier) || 1
 *     : metadata.multiplier || 1;
 *   
 *   return Math.round(baseValue * typeMultiplier * groupMultiplier);
 * };
 * ```
 * 
 * @see {@link extractSFMetadata} For SF_ pattern parsing function
 * @see {@link formatSFMetadata} For SF_ metadata display formatting
 */
export interface SFMetadata {
  rfid?: string;
  valueRating?: number;
  memoryType?: 'Personal' | 'Public' | 'Mixed' | 'Business' | 'Technical';
  group?: string | {
    name: string;
    multiplier: string;
  };
  multiplier?: number; // For backward compatibility
}

/**
 * Comprehensive node metadata for murder mystery investigation graph entities.
 * 
 * Defines the complete metadata structure for investigation graph nodes, containing
 * entity-specific information, relationship data, visual styling hints, and investigation
 * workflow state for comprehensive murder mystery investigation visualization and analysis.
 * 
 * **Core Metadata Categories:**
 * - **Entity Information**: Type, ID, and original data for investigation entity identification
 * - **Relationship Data**: Dependencies, rewards, collaborators, and connection tracking
 * - **Investigation State**: Progress tracking, ownership, timeline connections, and workflow status
 * - **Visual Configuration**: Styling hints, error states, and display properties
 * - **Game Mechanics**: SF patterns, status tracking, and investigation progression data
 * 
 * **Investigation Workflow Integration:**
 * - Entity relationship tracking for investigation progression analysis
 * - Visual state management for investigation interface feedback
 * - Error state detection for investigation data quality assurance
 * - Progress tracking for investigation completion and achievement systems
 * 
 * @example
 * ```typescript
 * // Investigation node metadata creation and management
 * const createInvestigationNodeMetadata = (entity: NotionEntity): NodeMetadata => {
 *   const baseMetadata: NodeMetadata = {
 *     entityType: entity.object as EntityType,
 *     entityId: entity.id,
 *     originalData: entity
 *   };
 *   
 *   // Add entity-specific metadata
 *   switch (entity.object) {
 *     case EntityTypes.CHARACTER:
 *       const character = entity as Character;
 *       return {
 *         ...baseMetadata,
 *         tier: character.tier.toString(),
 *         collaborators: character.relationIds || [],
 *         visualHints: {
 *           color: character.tier <= 2 ? '#dc2626' : '#059669',
 *           size: character.tier === 1 ? 'large' : 'medium'
 *         }
 *       };
 *     
 *     case EntityTypes.ELEMENT:
 *       const element = entity as Element;
 *       return {
 *         ...baseMetadata,
 *         status: element.status,
 *         ownerName: element.ownerName,
 *         timelineConnections: element.timelineEventId ? [element.timelineEventId] : [],
 *         sfPatterns: element.sfMetadata
 *       };
 *   }
 * };
 * 
 * // Investigation progress tracking using node metadata
 * const trackInvestigationProgress = (nodes: GraphNode[]) => {
 *   const progressMetrics = nodes.reduce((metrics, node) => {
 *     const status = node.data.metadata.status;
 *     metrics[status] = (metrics[status] || 0) + 1;
 *     return metrics;
 *   }, {} as Record<string, number>);
 *   
 *   return {
 *     totalNodes: nodes.length,
 *     statusDistribution: progressMetrics,
 *     investigationHealth: calculateInvestigationHealth(progressMetrics)
 *   };
 * };
 * ```
 * 
 * @see {@link EntityType} For entity type classification
 * @see {@link VisualHints} For visual styling configuration
 * @see {@link SFMetadata} For SF_ pattern metadata structure
 */
export interface NodeMetadata {
  entityType: EntityType;
  entityId?: string; // Optional for placeholder nodes
  originalData?: Character | Element | Puzzle | TimelineEvent; // Optional for placeholder nodes
  dependencies?: string[];
  rewards?: string[];
  subPuzzleIds?: string[];
  isOrphan?: boolean;
  isParent?: boolean;
  isChild?: boolean;
  parentId?: string;
  
  // Filter-related metadata
  isFiltered?: boolean; // Node passed the active filters
  isConnected?: boolean; // Node included via connection depth
  isFocused?: boolean; // Node is the current focus node
  searchMatch?: boolean; // Node matches search term
  pendingMutationCount?: number; // Number of pending mutations for this entity (replaces isOptimistic boolean)
  timelineConnections?: string[];
  collaborators?: string[];
  visualHints?: VisualHints;
  errorState?: {
    hasError?: boolean; // Optional, defaults to true when message exists
    message?: string;
    missingEntities?: string[];
    type?: string; // Support legacy test usage
  };
  enrichedData?: Record<string, unknown>;
  sfPatterns?: SFMetadata;
  status?: string; // Element status
  ownerName?: string; // For elements owned by characters
  ownerTier?: string; // Owner's tier (Core, Supporting, etc.)
  // Force simulation properties
  vx?: number; // Velocity x for d3-force simulation
  vy?: number; // Velocity y for d3-force simulation
  tier?: string; // Node tier for grouping
  timestamp?: number; // Unix timestamp for timeline ordering
  time?: number; // Alternative time representation
}

/**
 * Comprehensive graph node data structure for murder mystery investigation visualization.
 * 
 * Defines the complete data structure for investigation graph nodes, combining entity data,
 * metadata, and view-specific properties for flexible murder mystery investigation visualization,
 * analysis, and interactive investigation workflow support across different view modes.
 * 
 * **Core Data Components:**
 * - **label**: Human-readable node display name for investigation interface
 * - **metadata**: Complete investigation entity metadata and relationship information
 * - **entity**: Original investigation entity data (Character, Element, Puzzle, TimelineEvent)
 * 
 * **View-Specific Extensions:**
 * - **Timeline Properties**: timestamp, isCriticalMoment for chronological investigation
 * - **Progress Tracking**: status, completionLevel, subtaskProgress for investigation workflow
 * - **Network Analysis**: depth, isRoot, isCentral for graph structure analysis
 * - **Visual Optimization**: emphasis, cluster, ring for specialized view rendering
 * 
 * **Investigation Workflow Integration:**
 * - Flexible data structure supporting all investigation view types
 * - Progress tracking for investigation achievement and completion systems
 * - Network analysis properties for investigation relationship exploration
 * - Visual optimization for investigation interface performance and usability
 * 
 * @template T Entity type for type-safe entity data access (Character, Element, Puzzle, TimelineEvent)
 * 
 * @example
 * ```typescript
 * // Investigation node creation with view-specific properties
 * const createInvestigationNode = <T extends NotionEntity>(
 *   entity: T,
 *   viewType: ViewType
 * ): GraphNode<T> => {
 *   const baseData: GraphNodeData<T> = {
 *     label: entity.name,
 *     metadata: createNodeMetadata(entity),
 *     entity: entity
 *   };
 *   
 *   // Add view-specific properties
 *   switch (viewType) {
 *     case ViewTypes.TIMELINE:
 *       return {
 *         ...baseData,
 *         timestamp: entity.object === 'timeline' ? Date.parse((entity as TimelineEvent).date) : undefined,
 *         isCriticalMoment: checkCriticalMoment(entity),
 *         timeIndex: calculateTimeIndex(entity)
 *       };
 *     
 *     case ViewTypes.PUZZLE_FOCUS:
 *       return {
 *         ...baseData,
 *         status: entity.status || 'incomplete',
 *         completionLevel: calculateCompletionLevel(entity),
 *         chainId: entity.chainId,
 *         isRoot: checkRootStatus(entity)
 *       };
 *   }
 * };
 * 
 * // Investigation progress analysis using node data
 * const analyzeInvestigationProgress = (nodes: GraphNode[]) => {
 *   const completedNodes = nodes.filter(n => n.data.status === 'complete');
 *   const blockedNodes = nodes.filter(n => n.data.status === 'blocked');
 *   
 *   return {
 *     overallProgress: (completedNodes.length / nodes.length) * 100,
 *     progressByType: calculateProgressByEntityType(nodes),
 *     investigationBottlenecks: identifyBottlenecks(blockedNodes)
 *   };
 * };
 * ```
 * 
 * @see {@link NodeMetadata} For metadata structure and properties
 * @see {@link GraphNode} For complete node interface with position
 * @see {@link ViewTypes} For supported investigation view modes
 */
export interface GraphNodeData<T = any> {
  label: string;
  metadata: NodeMetadata;
  entity: T; // The original entity data (Character, Element, Puzzle, or TimelineEntry) - always required for non-placeholder nodes
  
  // Optional properties used by ViewSpecificOptimizer
  timestamp?: number;
  isCriticalMoment?: boolean;
  status?: 'complete' | 'incomplete' | 'blocked' | string;
  subtaskProgress?: number;
  isRoot?: boolean;
  depth?: number;
  completionLevel?: number;
  chainId?: string;
  emphasis?: 'high' | 'medium' | 'low';
  isOwned?: boolean;
  cluster?: string;
  interactionDensity?: number;
  isCentral?: boolean;
  discovered?: boolean;
  ring?: number;
  sector?: string;
  zone?: string;
  progress?: number;
  statusMetrics?: {
    overallProgress: number;
    typeProgress?: { complete: number; total: number };
  };
  timeIndex?: number;
  
  [key: string]: unknown; // Allow additional view-specific data
}

/**
 * Extended graph node interface for murder mystery investigation visualization.
 * 
 * Defines the complete node structure for investigation graph visualization, extending
 * React Flow's base Node interface with murder mystery investigation-specific data,
 * entity information, and investigation workflow properties for comprehensive graph rendering.
 * 
 * **Core Node Structure:**
 * - **id**: Unique node identifier for investigation entity tracking
 * - **position**: Spatial coordinates for graph layout and visualization
 * - **data**: Investigation-specific node data with entity and metadata
 * - **type**: Node type for specialized rendering (character, element, puzzle, timeline)
 * 
 * **Investigation Integration:**
 * - Supports all investigation entity types with type-safe data access
 * - Enables investigation workflow tracking and progress visualization
 * - Provides foundation for interactive investigation interface elements
 * - Integrates with React Flow for investigation graph rendering and interaction
 * 
 * @template T Entity type for type-safe entity data access (Character, Element, Puzzle, TimelineEvent)
 * 
 * @example
 * ```typescript
 * // Investigation node creation and management
 * const createSuspectNode = (character: Character): GraphNode<Character> => {
 *   return {
 *     id: character.id,
 *     type: 'characterNode',
 *     position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
 *     data: {
 *       label: character.name,
 *       metadata: {
 *         entityType: EntityTypes.CHARACTER,
 *         entityId: character.id,
 *         originalData: character,
 *         tier: character.tier.toString(),
 *         visualHints: {
 *           color: character.tier <= 2 ? '#dc2626' : '#059669',
 *           size: character.tier === 1 ? 'large' : 'medium',
 *           badge: character.role === 'Suspect' ? '⚠️' : '👁️'
 *         }
 *       },
 *       entity: character
 *     }
 *   };
 * };
 * 
 * // Investigation graph node processing and analysis
 * const processInvestigationNodes = (nodes: GraphNode[]) => {
 *   const nodesByType = nodes.reduce((categorized, node) => {
 *     const entityType = node.data.metadata.entityType;
 *     categorized[entityType] = categorized[entityType] || [];
 *     categorized[entityType].push(node);
 *     return categorized;
 *   }, {} as Record<EntityType, GraphNode[]>);
 *   
 *   return {
 *     totalNodes: nodes.length,
 *     nodeDistribution: Object.fromEntries(
 *       Object.entries(nodesByType).map(([type, nodeList]) => [type, nodeList.length])
 *     ),
 *     investigationMetrics: {
 *       suspectCount: nodesByType[EntityTypes.CHARACTER]?.filter(n => 
 *         (n.data.entity as Character).tier <= 2
 *       ).length || 0,
 *       evidenceCount: nodesByType[EntityTypes.ELEMENT]?.length || 0,
 *       puzzleCount: nodesByType[EntityTypes.PUZZLE]?.length || 0
 *     }
 *   };
 * };
 * ```
 * 
 * @see {@link GraphNodeData} For node data structure with investigation metadata
 * @see {@link Node} For React Flow base node interface
 * @see {@link EntityType} For investigation entity type classification
 */
export interface GraphNode<T = any> extends Omit<Node, 'data'> {
  id: string;
  position: { x: number; y: number };
  data: GraphNodeData<T>;
  type?: string;
  parentNode?: string;
  extent?: 'parent';
  expandParent?: boolean;
}

/**
 * Graph node with D3 force simulation properties
 * Used during force-directed layout calculations
 */
export interface SimulationGraphNode extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  cluster?: string; // For cluster-based force simulation
}

/**
 * Edge metadata type
 */
export type EdgeMetadata = {
  relationshipType: RelationshipType;
  weight?: number;
  strength?: number;
  label?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Extended graph edge interface for murder mystery investigation relationship visualization.
 * 
 * Defines the complete edge structure for investigation relationship visualization, extending
 * React Flow's base Edge interface with murder mystery investigation-specific relationship data,
 * weighting information, and visual styling for comprehensive relationship network rendering.
 * 
 * **Core Edge Structure:**
 * - **id**: Unique edge identifier for relationship tracking
 * - **source**: Source node ID for relationship origin entity
 * - **target**: Target node ID for relationship destination entity
 * - **data**: Investigation-specific relationship data with type and metadata
 * 
 * **Relationship Data Properties:**
 * - **relationshipType**: Classification of investigation relationship (ownership, requirement, reward)
 * - **weight**: Relationship strength for layout algorithm optimization
 * - **strength**: Relationship intensity for visual emphasis and analysis
 * - **label**: Human-readable relationship description for investigation interface
 * - **metadata**: Extended relationship properties and investigation context
 * 
 * @example
 * ```typescript
 * // Investigation relationship edge creation
 * const createOwnershipEdge = (character: Character, element: Element): GraphEdge => {
 *   return {
 *     id: `ownership-${character.id}-${element.id}`,
 *     source: character.id,
 *     target: element.id,
 *     type: 'ownership',
 *     data: {
 *       relationshipType: RelationshipTypes.OWNERSHIP,
 *       weight: 0.9, // High weight for strong ownership relationship
 *       strength: calculateOwnershipStrength(character, element),
 *       label: 'owns',
 *       metadata: {
 *         ownershipType: 'direct',
 *         acquisitionDate: element.discoveryDate,
 *         investigationRelevance: 'high'
 *       }
 *     },
 *     animated: element.status === 'Critical',
 *     style: {
 *       stroke: character.tier <= 2 ? '#dc2626' : '#059669',
 *       strokeWidth: 2
 *     }
 *   };
 * };
 * 
 * // Investigation relationship network analysis
 * const analyzeRelationshipNetwork = (edges: GraphEdge[]) => {
 *   const relationshipStats = edges.reduce((stats, edge) => {
 *     const type = edge.data?.relationshipType;
 *     if (type) {
 *       stats[type] = stats[type] || { count: 0, totalWeight: 0 };
 *       stats[type].count++;
 *       stats[type].totalWeight += edge.data?.weight || 1;
 *     }
 *     return stats;
 *   }, {} as Record<RelationshipType, { count: number; totalWeight: number }>);
 *   
 *   return {
 *     totalRelationships: edges.length,
 *     relationshipTypes: Object.keys(relationshipStats).length,
 *     strongestRelationships: edges
 *       .filter(e => (e.data?.weight || 0) > 0.8)
 *       .map(e => ({ source: e.source, target: e.target, type: e.data?.relationshipType })),
 *     investigationDensity: calculateNetworkDensity(edges)
 *   };
 * };
 * ```
 * 
 * @see {@link RelationshipType} For relationship type classification
 * @see {@link Edge} For React Flow base edge interface
 * @see {@link EdgeMetadata} For edge metadata structure
 */
export interface GraphEdge extends Omit<Edge, 'data'> {
  id: string;
  source: string;
  target: string;
  data?: {
    relationshipType: RelationshipType;
    weight?: number;
    strength?: number; // For collaboration edges
    label?: string; // For edge labels
    metadata?: Record<string, unknown>;
    isVirtual?: boolean; // For layout-only edges (not rendered)
    pendingMutationCount?: number; // Number of pending mutations for this edge (unified optimistic tracking)
  };
  animated?: boolean;
  style?: React.CSSProperties;
}

/**
 * Depth metadata for connection graphs
 */
export interface DepthMetadata {
  depthDistribution: Map<number, number>; // depth level -> node count at that depth
  maxReachableDepth: number; // Maximum depth in the complete network
  totalReachableNodes: number; // Total nodes in the complete connected component
  isCompleteNetwork: boolean; // Whether current depth includes all reachable nodes
  nodesAtCurrentDepth: number; // Nodes included with current depth setting
  currentDepthLimit: number; // The depth limit used to generate this graph
}

/**
 * Complete investigation graph data structure for murder mystery visualization and analysis.
 * 
 * Defines the comprehensive data structure containing all investigation graph components,
 * including nodes, edges, integrity analysis, and metadata for complete murder mystery
 * investigation visualization, analysis, and interactive investigation workflow support.
 * 
 * **Core Graph Components:**
 * - **nodes**: Complete array of investigation entity nodes (characters, elements, puzzles, timeline)
 * - **edges**: Complete array of relationship edges between investigation entities
 * - **integrityReport**: Data quality analysis and missing entity detection
 * - **depthMetadata**: Network depth analysis and connection statistics
 * - **metadata**: Performance metrics, view configuration, and analysis results
 * 
 * **Investigation Analysis Features:**
 * - Complete investigation network representation with all entity relationships
 * - Data integrity monitoring for investigation data quality assurance
 * - Performance metrics for investigation interface optimization
 * - Depth analysis for investigation network complexity assessment
 * 
 * @example
 * ```typescript
 * // Complete investigation graph construction and analysis
 * const buildInvestigationGraph = async (): Promise<GraphData> => {
 *   const startTime = performance.now();
 *   
 *   // Fetch investigation data
 *   const characters = await getCharacters();
 *   const elements = await getElements();
 *   const puzzles = await getPuzzles();
 *   const timeline = await getTimeline();
 *   
 *   // Build nodes and edges
 *   const nodes = createInvestigationNodes(characters, elements, puzzles, timeline);
 *   const edges = resolveAllRelationships(characters, elements, puzzles, timeline);
 *   
 *   // Generate analysis reports
 *   const integrityReport = analyzeDataIntegrity(nodes, edges);
 *   const depthMetadata = calculateNetworkDepth(nodes, edges);
 *   
 *   const endTime = performance.now();
 *   
 *   return {
 *     nodes,
 *     edges,
 *     integrityReport,
 *     depthMetadata,
 *     metadata: {
 *       metrics: {
 *         startTime,
 *         endTime,
 *         duration: endTime - startTime,
 *         nodeCount: nodes.length,
 *         edgeCount: edges.length,
 *         warnings: integrityReport.brokenRelationships.length > 0 ? 
 *           ['Data integrity issues detected'] : []
 *       },
 *       viewType: ViewTypes.FULL_NETWORK,
 *       timestamp: new Date().toISOString()
 *     }
 *   };
 * };
 * 
 * // Investigation graph analysis and insights
 * const analyzeInvestigationGraph = (graphData: GraphData) => {
 *   return {
 *     networkComplexity: {
 *       entityCount: graphData.nodes.length,
 *       relationshipCount: graphData.edges.length,
 *       networkDensity: (graphData.edges.length * 2) / (graphData.nodes.length * (graphData.nodes.length - 1)),
 *       maxDepth: graphData.depthMetadata?.maxReachableDepth || 0
 *     },
 *     investigationHealth: {
 *       dataIntegrityScore: calculateIntegrityScore(graphData.integrityReport),
 *       missingEntityCount: graphData.integrityReport?.missingReferences ? 
 *         Object.values(graphData.integrityReport.missingReferences)
 *           .reduce((sum, refs) => sum + refs.length, 0) : 0,
 *       investigationCompleteness: calculateCompleteness(graphData)
 *     },
 *     performanceMetrics: graphData.metadata?.metrics
 *   };
 * };
 * ```
 * 
 * @see {@link GraphNode} For node structure with investigation data
 * @see {@link GraphEdge} For edge structure with relationship data
 * @see {@link DataIntegrityReport} For data quality analysis structure
 * @see {@link DepthMetadata} For network depth analysis structure
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  integrityReport?: DataIntegrityReport;
  depthMetadata?: DepthMetadata; // Metadata about depth distribution
  metadata?: {
    metrics?: {
      startTime: number;
      endTime: number;
      duration: number;
      nodeCount: number;
      edgeCount: number;
      warnings?: string[];
      layoutMetrics?: Record<string, unknown>;
    };
    viewType?: ViewType;
    timestamp?: string;
  };
}

/**
 * Comprehensive configuration options for murder mystery investigation graph construction.
 * 
 * Defines all available configuration parameters for building investigation graphs,
 * enabling customized graph generation for different investigation view modes, entity
 * filtering, performance optimization, and specialized murder mystery workflow analysis.
 * 
 * **Core Configuration Categories:**
 * - **View Configuration**: viewType for specialized investigation perspectives
 * - **Relationship Filtering**: filterRelationships for selective edge inclusion
 * - **Entity Management**: includeOrphans, excludeEntityTypes for entity control
 * - **Quality Assurance**: enableIntegrityChecking for data validation
 * - **Performance Control**: maxDepth, maxNodes for graph size optimization
 * 
 * @example
 * ```typescript
 * // Investigation-focused graph building configuration
 * const suspectAnalysisConfig: BuildGraphOptions = {
 *   viewType: ViewTypes.CHARACTER_JOURNEY,
 *   filterRelationships: [RelationshipTypes.OWNERSHIP, RelationshipTypes.COLLABORATION],
 *   excludeEntityTypes: [EntityTypes.TIMELINE], // Focus on characters and evidence
 *   maxDepth: 3, // Limit investigation depth for performance
 *   enableIntegrityChecking: true,
 *   startTime: performance.now()
 * };
 * 
 * // Timeline reconstruction configuration
 * const timelineConfig: BuildGraphOptions = {
 *   viewType: ViewTypes.TIMELINE,
 *   filterRelationships: [RelationshipTypes.TIMELINE],
 *   maxNodes: 50, // Limit for timeline visualization
 *   layoutConfig: {
 *     algorithm: 'dagre',
 *     direction: 'LR',
 *     spacing: { rankSpacing: 200 }
 *   }
 * };
 * ```
 * 
 * @see {@link ViewType} For supported investigation view types
 * @see {@link RelationshipType} For filterable relationship types
 * @see {@link LayoutConfig} For layout algorithm configuration
 */
export interface BuildGraphOptions {
  viewType?: ViewType;
  filterRelationships?: RelationshipType[];
  includeOrphans?: boolean;
  enableIntegrityChecking?: boolean;
  excludeEntityTypes?: EntityType[];
  layoutConfig?: LayoutConfig;
  maxDepth?: number;
  maxNodes?: number;
  expandedNodes?: Set<string>;
  startTime?: number;
}

/**
 * Comprehensive layout algorithm configuration for murder mystery investigation graph rendering.
 * 
 * Defines configuration parameters for graph layout algorithms, enabling optimized positioning
 * and visual organization of investigation entities for different murder mystery analysis
 * contexts, view types, and interactive investigation workflow requirements.
 * 
 * **Layout Algorithm Options:**
 * - **dagre/pure-dagre**: Hierarchical layouts for investigation progression visualization
 * - **force/force-clustered**: Physics-based layouts for relationship network analysis
 * - **elk**: Advanced hierarchical layouts for complex investigation structures
 * - **custom**: Specialized layouts for murder mystery-specific visualization needs
 * 
 * **Layout Direction Control:**
 * - **TB**: Top-to-bottom for investigation progression and timeline flows
 * - **LR**: Left-to-right for chronological investigation and evidence chains
 * - **BT/RL**: Alternative orientations for specialized investigation perspectives
 * 
 * @example
 * ```typescript
 * // Investigation progression layout configuration
 * const progressionLayout: LayoutConfig = {
 *   algorithm: 'dagre',
 *   direction: 'TB', // Top-to-bottom investigation flow
 *   spacing: {
 *     nodeSpacing: 100,   // Space between investigation entities
 *     rankSpacing: 200,   // Space between investigation levels
 *     edgePadding: 20     // Padding around relationship edges
 *   },
 *   alignment: 'UL' // Upper-left alignment for investigation hierarchy
 * };
 * 
 * // Network analysis layout configuration
 * const networkLayout: LayoutConfig = {
 *   algorithm: 'force-clustered',
 *   layoutType: 'force',
 *   clusterSeparation: 150,    // Investigation entity cluster spacing
 *   linkDistance: 80,          // Relationship edge length
 *   chargeStrength: -300,      // Entity repulsion for clarity
 *   investigationCentering: true // Center important investigation nodes
 * };
 * ```
 * 
 * @see {@link ViewTypes} For view-specific layout optimization
 * @see {@link GraphData} For graph structure requiring layout
 */
export interface LayoutConfig {
  algorithm?: 'dagre' | 'pure-dagre' | 'elk' | 'custom' | 'none' | 'force' | 'force-clustered';
  layoutType?: 'dagre' | 'force' | 'force-atlas2' | 'circular' | 'grid' | 'radial' | 'none' | 'custom';
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  spacing?: {
    nodeSpacing?: number;
    rankSpacing?: number;
    edgePadding?: number;
  };
  alignment?: 'UL' | 'UR' | 'DL' | 'DR';
  [key: string]: unknown; // Algorithm-specific options
}

/**
 * Layout metrics for measuring quality
 */
export interface LayoutMetrics {
  width: number;
  height: number;
  density: number;
  overlap: number;
  edgeCrossings?: number;
  nodeOverlaps?: number;
  aspectRatio?: number;
  symmetry?: number;
  edgeLengthVariance?: number;
}

/**
 * Graph layout options
 */
export interface GraphLayoutOptions {
  width?: number;
  height?: number;
  nodeSpacing?: number;
  [key: string]: unknown;
}

/**
 * Lookup maps for efficient entity access
 */
export interface EntityLookupMaps {
  characters: Map<string, Character>;
  elements: Map<string, Element>;
  puzzles: Map<string, Puzzle>;
  timeline: Map<string, TimelineEvent>;
}

/**
 * Metrics about the graph structure
 */
export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  orphanCount: number;
  componentCount: number;
  maxDepth: number;
  avgDegree: number;
  density: number;
  entityCounts: Record<EntityType, number>;
  relationshipCounts: Record<RelationshipType, number>;
}

// Removed unused contract interfaces for deleted modules
// Direct implementations are now used instead of these abstractions

/**
 * Type guards for runtime validation
 */
export const isGraphNode = (node: unknown): node is GraphNode => {
  return (
    typeof node === 'object' &&
    node !== null &&
    'id' in node &&
    'data' in node &&
    typeof (node as GraphNode).data === 'object' &&
    'metadata' in (node as GraphNode).data &&
    'entityType' in (node as GraphNode).data.metadata
  );
};

export const isGraphEdge = (edge: unknown): edge is GraphEdge => {
  return (
    typeof edge === 'object' &&
    edge !== null &&
    'id' in edge &&
    'source' in edge &&
    'target' in edge
  );
};

export const isEntityType = (type: unknown): type is EntityType => {
  return (
    typeof type === 'string' &&
    ['character', 'element', 'puzzle', 'timeline'].includes(type)
  );
};

export const isRelationshipType = (type: unknown): type is RelationshipType => {
  return (
    typeof type === 'string' &&
    ['requirement', 'reward', 'chain', 'collaboration', 'timeline', 'owner', 'ownership', 'container', 'puzzle-grouping', 'virtual-dependency', 'dependency', 'relationship', 'connection'].includes(type)
  );
};