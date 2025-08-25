/**
 * Murder Mystery Investigation View Builder
 * 
 * Advanced configuration processing engine that transforms declarative investigation view
 * configurations into interactive GraphData structures optimized for murder mystery analysis.
 * 
 * This engine serves as the central orchestrator for building specialized investigation graphs
 * from declarative configuration objects, enabling detective workflows through:
 * - Character relationship mapping for suspect investigation
 * - Evidence chain visualization for puzzle solving
 * - Timeline reconstruction for sequence analysis
 * - Generic entity exploration for open-ended investigation
 * 
 * **Core Capabilities:**
 * - **Template Variable System**: Dynamic configuration substitution for investigation focus
 * - **Node Selection Engine**: Sophisticated filtering and collection of investigation entities
 * - **Edge Pre-calculation**: Efficient relationship mapping for large case datasets
 * - **Traversal Integration**: BFS/DFS graph exploration using TraversalEngine
 * - **Performance Optimization**: Configurable limits for large investigation datasets
 * - **Hook System**: Extensible lifecycle hooks for custom investigation logic
 * 
 * **Investigation Workflow:**
 * ```
 * 1. Configuration Processing → Template variable substitution
 * 2. Node Collection → Multi-criteria entity selection and filtering
 * 3. Edge Pre-calculation → Complete relationship network mapping
 * 4. Graph Assembly → Node and edge construction with deduplication
 * 5. Performance Limiting → Optimization for interactive investigation
 * 6. Hook Execution → Custom investigation logic integration
 * ```
 * 
 * @example Character Investigation Build
 * ```typescript
 * const characterConfig: ViewConfiguration = {
 *   id: 'suspect-investigation',
 *   name: 'Suspect Relationship Analysis',
 *   variables: { maxDepth: 3, characterId: 'alice-sterling' },
 *   nodes: {
 *     include: [{
 *       type: 'traversed',
 *       from: '{{characterId}}',
 *       depth: '{{maxDepth}}'
 *     }]
 *   },
 *   edges: [{
 *     entityType: 'character',
 *     includeTypes: ['relationship', 'alibi']
 *   }]
 * };
 * 
 * const graph = viewBuilder.build(characterConfig, investigationData, {
 *   characterId: 'suspect-alice-sterling',
 *   maxDepth: 4
 * });
 * ```
 * 
 * @example Evidence Chain Analysis
 * ```typescript
 * const evidenceConfig: ViewConfiguration = {
 *   id: 'evidence-chain',
 *   name: 'Evidence Dependency Analysis',
 *   nodes: {
 *     include: [{
 *       type: 'filtered',
 *       entityType: 'puzzle',
 *       where: (puzzle) => puzzle.tags?.includes('evidence')
 *     }]
 *   },
 *   edges: [{
 *     entityType: 'puzzle',
 *     includeTypes: ['dependency', 'prerequisite']
 *   }]
 * };
 * ```
 * 
 * @see {@link ViewConfiguration} For declarative configuration structure
 * @see {@link TemplateVariables} For dynamic variable substitution system
 * @see {@link NodeSelection} For entity selection and filtering options
 * @see {@link StrategyDependencies} For required investigation graph modules
 * 
 * Complexity: O(V + E + T) where V = entities, E = relationships, T = template processing
 */

import { log } from '@/utils/logger';
import type { 
  ViewConfiguration, 
  NodeSelection,
  TemplateVariables 
} from './ViewConfiguration';
import type { 
  NotionData, 
  GraphData, 
  GraphNode, 
  GraphEdge,
  Entity,
  Character,
  Puzzle,
  TimelineEvent
} from '../types';
import type { StrategyDependencies } from '../core/ViewStrategy.interface';
import { NodeCollector } from '../utils/NodeCollector';
import { GraphUtilities } from '../utils/GraphUtilities';

/**
 * Murder Mystery Investigation View Builder Engine
 * 
 * Transforms declarative investigation view configurations into interactive graph structures
 * optimized for detective work and case analysis. Coordinates entity selection, relationship
 * mapping, and graph assembly for specialized murder mystery investigation workflows.
 * 
 * **Architecture:**
 * - Dependency injection pattern for modular investigation components
 * - Edge pre-calculation for efficient graph traversal operations
 * - Template variable system for dynamic investigation focus
 * - Performance optimization for large case datasets
 * 
 * Complexity: O(V log V + E) for typical investigation graph construction
 */
export class ViewBuilder {
  /** Injected dependencies for investigation graph construction modules */
  private readonly deps: StrategyDependencies;
  
  /** Pre-calculated relationship network for efficient traversal operations across all investigation entities */
  private allEdges: GraphEdge[] = [];

  /**
   * Initialize the murder mystery investigation view builder with required dependencies.
   * 
   * Sets up the graph construction infrastructure with all necessary modules for
   * building specialized investigation views from declarative configurations.
   * 
   * @param deps - Complete set of investigation graph construction dependencies including entity transformers, edge resolvers, and traversal engines
   * 
   * Complexity: O(1) - Simple dependency injection setup
   */
  constructor(deps: StrategyDependencies) {
    this.deps = deps;
  }

  /**
   * Build a murder mystery investigation graph from declarative configuration.
   * 
   * Transforms a declarative investigation view configuration into a complete interactive
   * graph structure optimized for detective workflows and case analysis. Handles template
   * variable substitution, entity selection, relationship mapping, and performance optimization.
   * 
   * **Processing Pipeline:**
   * 1. **Template Resolution**: Substitute investigation parameters into configuration
   * 2. **Hook Execution**: Execute pre-processing investigation hooks
   * 3. **Edge Pre-calculation**: Build complete relationship network for efficient traversal
   * 4. **Node Collection**: Select and filter investigation entities based on configuration
   * 5. **Node Construction**: Transform entities into graph nodes with investigation metadata
   * 6. **Edge Construction**: Create relationship edges with investigation context
   * 7. **Deduplication**: Remove duplicate nodes and edges for clean graph structure
   * 8. **Performance Limiting**: Apply limits for interactive investigation performance
   * 9. **Post-processing**: Execute layout and finalization hooks
   * 
   * @param config - Declarative investigation view configuration defining entity selection, relationships, and rendering parameters
   * @param data - Complete murder mystery investigation data containing all entities (characters, puzzles, timeline events, story elements)
   * @param variables - Dynamic template variables for investigation focus (e.g., suspect ID, evidence type, time range)
   * @returns Complete investigation graph with positioned nodes, weighted edges, and metadata for interactive detective analysis
   * 
   * @example Suspect Investigation Graph
   * ```typescript
   * const suspectGraph = viewBuilder.build(
   *   {
   *     id: 'suspect-analysis',
   *     name: 'Suspect Relationship Investigation',
   *     nodes: {
   *       include: [{
   *         type: 'traversed',
   *         from: '{{suspectId}}',
   *         depth: '{{investigationDepth}}'
   *       }]
   *     },
   *     edges: [{
   *       entityType: 'character',
   *       includeTypes: ['relationship', 'alibi', 'conflict']
   *     }]
   *   },
   *   investigationData,
   *   {
   *     suspectId: 'alice-sterling',
   *     investigationDepth: 3
   *   }
   * );
   * ```
   * 
   * @example Evidence Chain Analysis
   * ```typescript
   * const evidenceGraph = viewBuilder.build(
   *   {
   *     id: 'evidence-chain',
   *     name: 'Evidence Dependency Analysis',
   *     nodes: {
   *       include: [{
   *         type: 'filtered',
   *         entityType: 'puzzle',
   *         where: (puzzle) => puzzle.basicType === 'evidence'
   *       }]
   *     },
   *     edges: [{
   *       entityType: 'puzzle',
   *       includeTypes: ['dependency', 'prerequisite']
   *     }]
   *   },
   *   investigationData
   * );
   * ```
   * 
   * @example Timeline Reconstruction
   * ```typescript
   * const timelineGraph = viewBuilder.build(
   *   {
   *     id: 'crime-timeline',
   *     name: 'Crime Timeline Reconstruction',
   *     nodes: {
   *       include: [{
   *         type: 'filtered',
   *         entityType: 'timeline',
   *         where: (event) => event.date >= '2023-10-31' && event.date <= '2023-11-01'
   *       }]
   *     },
   *     edges: [{
   *       entityType: 'timeline',
   *       includeTypes: ['sequence', 'causality']
   *     }]
   *   },
   *   investigationData,
   *   { crimeDate: '2023-10-31', timeWindow: 24 }
   * );
   * ```
   * 
   * Complexity: O(V log V + E + T + H) where V = entities, E = relationships, T = template processing, H = hook execution
   */
  build(
    config: ViewConfiguration,
    data: NotionData,
    variables?: TemplateVariables
  ): GraphData {
    log.info('ViewBuilder: Building murder mystery investigation graph from configuration', { 
      investigationId: config.id,
      investigationType: config.name,
      templateVariables: Object.keys(variables || {}),
      dataScope: {
        suspects: data.characters.length,
        evidence: data.puzzles.length,
        timeline: data.timeline.length,
        storyElements: data.elements.length
      }
    });

    // Merge investigation parameters with configuration defaults for dynamic investigation focus
    const resolvedInvestigationVariables = {
      ...config.variables,
      ...variables
    };

    // Apply template substitution to configuration for investigation customization
    const processedConfig = this.applyTemplateVariables(config, resolvedInvestigationVariables);
    
    // Store applied investigation variables for lifecycle hooks to access dynamic parameters
    (processedConfig as ViewConfiguration & { appliedVariables?: TemplateVariables }).appliedVariables = resolvedInvestigationVariables;

    // Execute pre-investigation hooks with processed configuration (enables custom investigation logic)
    processedConfig.hooks?.beforeNodeSelection?.(processedConfig, data);

    // Pre-calculate complete investigation relationship network for efficient graph traversal
    // This creates the full relationship map between all suspects, evidence, and timeline events
    this.allEdges = this.buildAllEdges(data);
    

    // Collect investigation entities based on configuration criteria and filtering rules
    const includedInvestigationEntityIds = this.collectNodeIds(processedConfig, data);

    // Transform selected investigation entities into interactive graph nodes
    let investigationNodes = this.buildNodes(processedConfig, data, includedInvestigationEntityIds);
    
    // Execute post-node-creation investigation hooks for custom entity processing
    if (processedConfig.hooks?.afterNodeCreation) {
      investigationNodes = processedConfig.hooks.afterNodeCreation(investigationNodes, data);
    }

    // Execute pre-edge-creation investigation hooks for relationship customization
    processedConfig.hooks?.beforeEdgeCreation?.(investigationNodes, data);

    // Build investigation relationship edges connecting suspects, evidence, and timeline events
    let investigationEdges = this.buildEdges(processedConfig, data, includedInvestigationEntityIds);
    
    // Execute post-edge-creation investigation hooks for relationship finalization
    if (processedConfig.hooks?.afterEdgeCreation) {
      investigationEdges = processedConfig.hooks.afterEdgeCreation(investigationEdges, data);
    }

    // Deduplicate investigation entities and relationships for clean graph structure
    const uniqueInvestigationNodes = GraphUtilities.deduplicateNodes(investigationNodes);
    const uniqueInvestigationEdges = this.deps.edgeResolver.deduplicateEdges(investigationEdges);

    // Apply performance limits for interactive investigation graph rendering
    const optimizedInvestigationGraph = this.applyPerformanceLimits(
      { nodes: uniqueInvestigationNodes, edges: uniqueInvestigationEdges },
      processedConfig
    );

    // Execute final layout hooks for investigation-specific positioning and styling
    const finalInvestigationGraph = processedConfig.hooks?.afterLayout 
      ? processedConfig.hooks.afterLayout(optimizedInvestigationGraph)
      : optimizedInvestigationGraph;

    log.info('ViewBuilder: Murder mystery investigation graph constructed successfully', {
      investigationId: config.id,
      investigationType: config.name,
      investigationScope: {
        entitiesDiscovered: finalInvestigationGraph.nodes.length,
        relationshipsFound: finalInvestigationGraph.edges.length,
        templateVariablesApplied: Object.keys(resolvedInvestigationVariables).length
      },
      performance: {
        nodeLimit: processedConfig.performance?.maxNodes || 'unlimited',
        edgeLimit: processedConfig.performance?.maxEdges || 'unlimited'
      }
    });

    return finalInvestigationGraph;
  }

  /**
   * Apply murder mystery investigation template variable substitution.
   * 
   * Processes the declarative investigation configuration to substitute dynamic template
   * variables with actual investigation parameters (suspect IDs, evidence types, time ranges).
   * Enables dynamic investigation focus without requiring separate configuration files.
   * 
   * **Template Processing:**
   * - Recursive string substitution using {{variableName}} syntax
   * - Automatic type conversion for numeric investigation parameters
   * - Function preservation for filter predicates and lifecycle hooks
   * - Deep cloning to prevent original configuration mutation
   * 
   * @param config - Investigation view configuration containing template variables
   * @param variables - Dynamic investigation parameters for template substitution
   * @returns Processed configuration with investigation variables resolved
   * 
   * @example Template Variable Substitution
   * ```typescript
   * // Configuration with templates
   * const config = {
   *   nodes: {
   *     include: [{
   *       type: 'traversed',
   *       from: '{{suspectId}}',
   *       depth: '{{maxDepth}}'
   *     }]
   *   }
   * };
   * 
   * // Variables for specific investigation
   * const variables = {
   *   suspectId: 'alice-sterling',
   *   maxDepth: 3
   * };
   * 
   * // Result: template variables replaced with actual investigation parameters
   * ```
   * 
   * Complexity: O(n) where n = configuration object size
   */
  private applyTemplateVariables(
    config: ViewConfiguration,
    variables: TemplateVariables
  ): ViewConfiguration {
    // Deep clone the investigation configuration to avoid mutating the original template
    const clonedInvestigationConfig = JSON.parse(JSON.stringify(config));
    
    // Apply investigation template variable substitution to string values throughout configuration
    const substituteInvestigationVariables = (obj: unknown): unknown => {
      if (typeof obj === 'string') {
        // Replace {{variableName}} patterns with actual investigation parameters
        return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
          const investigationValue = variables[varName];
          if (investigationValue === undefined) {
            log.warn(`ViewBuilder: Investigation template variable ${varName} not provided for dynamic configuration`);
            return match; // Keep original template if variable not found
          }
          return String(investigationValue);
        });
      } else if (Array.isArray(obj)) {
        // Recursively process arrays of investigation configuration objects
        return obj.map(item => substituteInvestigationVariables(item));
      } else if (obj && typeof obj === 'object' && !(obj instanceof Function)) {
        // Recursively process nested investigation configuration objects
        const result: Record<string, unknown> = {};
        for (const key in obj) {
          result[key] = substituteInvestigationVariables((obj as Record<string, unknown>)[key]);
        }
        return result;
      }
      return obj; // Return primitives and functions unchanged
    };

    // Preserve investigation functions (lifecycle hooks, entity filter predicates) from template processing
    const preservedInvestigationFunctions: Record<string, unknown> = {};
    if (config.hooks) {
      preservedInvestigationFunctions.hooks = config.hooks; // Investigation lifecycle hooks
    }
    if (config.nodes?.include) {
      preservedInvestigationFunctions.nodeFilters = config.nodes.include.map(s => s.where); // Entity inclusion filters
    }
    if (config.nodes?.exclude) {
      preservedInvestigationFunctions.excludeFilters = config.nodes.exclude.map(s => s.where); // Entity exclusion filters
    }

    // Apply investigation template variable substitution to entire configuration
    let processedInvestigationConfig = substituteInvestigationVariables(clonedInvestigationConfig) as ViewConfiguration;
    
    // Post-process to convert numeric investigation parameters back to numbers (depth, limits, etc.)
    processedInvestigationConfig = this.convertNumericTemplateValues(processedInvestigationConfig);

    // Restore preserved investigation functions after template processing
    if (preservedInvestigationFunctions.hooks) {
      processedInvestigationConfig.hooks = preservedInvestigationFunctions.hooks as ViewConfiguration['hooks'];
    }
    if (preservedInvestigationFunctions.nodeFilters && processedInvestigationConfig.nodes?.include) {
      const nodeFilters = preservedInvestigationFunctions.nodeFilters as Array<NodeSelection['where']>;
      processedInvestigationConfig.nodes.include.forEach((s: NodeSelection, i: number) => {
        if (nodeFilters[i]) {
          s.where = nodeFilters[i]; // Restore entity filter predicates
        }
      });
    }
    if (preservedInvestigationFunctions.excludeFilters && processedInvestigationConfig.nodes?.exclude) {
      const excludeFilters = preservedInvestigationFunctions.excludeFilters as Array<NodeSelection['where']>;
      processedInvestigationConfig.nodes.exclude.forEach((s: NodeSelection, i: number) => {
        if (excludeFilters[i]) {
          s.where = excludeFilters[i]; // Restore entity exclusion predicates
        }
      });
    }

    return processedInvestigationConfig;
  }

  /**
   * Convert numeric investigation parameters from template strings back to numbers.
   * 
   * After template variable substitution, numeric investigation parameters (depths, limits)
   * may be stored as strings. This method converts them back to proper numeric types
   * for correct graph construction behavior.
   * 
   * **Converted Parameters:**
   * - Investigation depth limits for relationship traversal
   * - Maximum node/edge counts for performance optimization
   * - Numeric filter thresholds and investigation parameters
   * 
   * @param config - Investigation configuration with potentially string-encoded numeric values
   * @returns Configuration with proper numeric types restored
   * 
   * @example Numeric Parameter Conversion
   * ```typescript
   * // After template substitution: depth becomes string "3"
   * const beforeConversion = { depth: "3", maxNodes: "100" };
   * 
   * // After numeric conversion: proper numbers restored
   * const afterConversion = { depth: 3, maxNodes: 100 };
   * ```
   * 
   * Complexity: O(n) where n = number of node selection configurations
   */
  private convertNumericTemplateValues(config: ViewConfiguration): ViewConfiguration {
    // Convert known investigation numeric fields that may have been template-substituted as strings
    const convertInvestigationNode = (node: any): any => {
      if (node && typeof node === 'object') {
        const convertedInvestigationNode = { ...node };
        
        // Convert investigation depth limits to numbers if they are numeric strings
        if (typeof convertedInvestigationNode.depth === 'string' && /^\d+$/.test(convertedInvestigationNode.depth)) {
          convertedInvestigationNode.depth = parseInt(convertedInvestigationNode.depth, 10);
        }
        
        // Convert investigation node count limits to numbers if they are numeric strings  
        if (typeof convertedInvestigationNode.maxNodes === 'string' && /^\d+$/.test(convertedInvestigationNode.maxNodes)) {
          convertedInvestigationNode.maxNodes = parseInt(convertedInvestigationNode.maxNodes, 10);
        }
        
        return convertedInvestigationNode;
      }
      return node;
    };

    // Process investigation entity inclusion configurations for numeric parameter conversion
    if (config.nodes?.include) {
      config.nodes.include = config.nodes.include.map(convertInvestigationNode);
    }

    // Process investigation entity exclusion configurations for numeric parameter conversion
    if (config.nodes?.exclude) {
      config.nodes.exclude = config.nodes.exclude.map(convertInvestigationNode);
    }

    return config;
  }

  /**
   * Collect investigation entity IDs based on declarative selection configuration.
   * 
   * Processes all node selection criteria to determine which investigation entities
   * (suspects, evidence, timeline events) should be included in the final graph.
   * Supports multiple selection strategies and exclusion filters for precise investigation focus.
   * 
   * **Selection Strategy Support:**
   * - **basic**: Direct entity ID specification for known investigation targets
   * - **related**: Relationship-based entity discovery through graph traversal
   * - **filtered**: Predicate-based entity filtering for custom investigation criteria
   * - **traversed**: BFS/DFS exploration from investigation starting points
   * 
   * @param config - Investigation view configuration with entity selection rules
   * @param data - Complete murder mystery investigation data for entity selection
   * @returns Set of entity IDs that match the investigation selection criteria
   * 
   * @example Multi-Strategy Entity Collection
   * ```typescript
   * const config = {
   *   nodes: {
   *     include: [
   *       { type: 'basic', ids: ['suspect-alice'] }, // Direct suspect inclusion
   *       { type: 'related', from: 'suspect-alice', relation: 'alibi', depth: 2 }, // Related alibi entities
   *       { type: 'filtered', entityType: 'puzzle', where: p => p.tags.includes('evidence') } // Evidence puzzles
   *     ],
   *     exclude: [
   *       { type: 'filtered', entityType: 'character', where: c => c.tier === 'background' } // Exclude background characters
   *     ]
   *   }
   * };
   * ```
   * 
   * Complexity: O(V + E + F) where V = entities, E = relationships, F = filter operations
   */
  private collectNodeIds(
    config: ViewConfiguration,
    data: NotionData
  ): Set<string> {
    const includedInvestigationEntityIds = new Set<string>();

    // Process investigation entity inclusion rules to build the initial entity set
    config.nodes.include.forEach(selectionCriteria => {
      const matchingEntityIds = this.processNodeSelection(selectionCriteria, data);
      matchingEntityIds.forEach(entityId => includedInvestigationEntityIds.add(entityId));
    });

    // Process investigation entity exclusion rules to remove unwanted entities
    if (config.nodes.exclude) {
      const excludedInvestigationEntityIds = new Set<string>();
      config.nodes.exclude.forEach(exclusionCriteria => {
        const excludedEntityIds = this.processNodeSelection(exclusionCriteria, data);
        excludedEntityIds.forEach(entityId => excludedInvestigationEntityIds.add(entityId));
      });
      
      // Remove excluded investigation entities from the final set
      excludedInvestigationEntityIds.forEach(entityId => includedInvestigationEntityIds.delete(entityId));
    }

    return includedInvestigationEntityIds;
  }

  /**
   * Process a single investigation entity selection rule.
   * 
   * Executes a specific entity selection strategy to identify investigation entities
   * matching the given criteria. Supports direct ID selection, relationship traversal,
   * predicate filtering, and graph exploration for comprehensive investigation entity discovery.
   * 
   * @param selection - Single entity selection rule with strategy and parameters
   * @param data - Complete murder mystery investigation data for entity matching
   * @returns Set of entity IDs matching the selection criteria
   * 
   * @example Selection Strategy Examples
   * ```typescript
   * // Direct suspect selection
   * const directSelection = {
   *   type: 'basic',
   *   ids: ['alice-sterling', 'bob-martinez']
   * };
   * 
   * // Relationship-based evidence discovery
   * const relatedSelection = {
   *   type: 'related',
   *   from: 'murder-weapon-puzzle',
   *   relation: 'prerequisite',
   *   depth: 2
   * };
   * 
   * // Predicate-based witness filtering
   * const filteredSelection = {
   *   type: 'filtered',
   *   entityType: 'character',
   *   where: (character) => character.role === 'witness'
   * };
   * 
   * // Graph traversal from crime scene
   * const traversedSelection = {
   *   type: 'traversed',
   *   from: 'crime-scene-element',
   *   depth: 3
   * };
   * ```
   * 
   * Complexity: O(V + E) for traversal, O(V) for filtering, O(1) for direct selection
   */
  private processNodeSelection(
    selection: NodeSelection,
    data: NotionData
  ): Set<string> {
    const matchingInvestigationEntityIds = new Set<string>();

    switch (selection.type) {
      case 'basic':
        // Direct investigation entity ID selection for known suspects, evidence, etc.
        selection.ids?.forEach(entityId => matchingInvestigationEntityIds.add(entityId));
        break;

      case 'related':
        // Related investigation entity discovery through relationship traversal
        if (selection.from && selection.relation) {
          this.collectRelatedIds(
            selection.from,
            selection.relation,
            selection.entityType,
            data,
            matchingInvestigationEntityIds,
            selection.depth ?? 1
          );
        }
        break;

      case 'filtered':
        // Investigation entity filtering by custom predicate (role, type, attributes)
        if (selection.where && selection.entityType) {
          this.collectFilteredIds(
            selection.entityType,
            selection.where,
            data,
            matchingInvestigationEntityIds
          );
        }
        break;

      case 'traversed':
        // Investigation graph traversal using BFS/DFS from starting entity (crime scene, suspect)
        if (selection.from) {
          const traversalResult = this.deps.traversalEngine.traverse(
            this.allEdges,
            selection.from,
            {
              maxDepth: selection.depth ?? 10, // Default investigation depth
              algorithm: 'bfs' // Breadth-first for comprehensive investigation coverage
            }
          );
          
          // Add all investigation entities discovered during traversal
          traversalResult.visitedNodes.forEach(entityId => matchingInvestigationEntityIds.add(entityId));
        }
        break;
    }

    return matchingInvestigationEntityIds;
  }

  /**
   * Pre-build complete investigation relationship network for efficient traversal operations.
   * 
   * Constructs the full relationship graph between all investigation entities (characters,
   * puzzles, timeline events) to enable efficient graph traversal during entity selection.
   * This optimization prevents repeated edge calculation during multiple traversal operations.
   * 
   * **Relationship Categories:**
   * - **Character Relationships**: Suspects, witnesses, alibis, conflicts
   * - **Puzzle Dependencies**: Evidence chains, prerequisite relationships
   * - **Timeline Sequences**: Chronological connections, causality chains
   * 
   * @param data - Complete murder mystery investigation data containing all entities
   * @returns Complete deduplicated edge network for investigation graph traversal
   * 
   * @example Pre-calculated Relationship Network
   * ```typescript
   * // Creates comprehensive relationship mapping:
   * // - alice-sterling → bob-martinez (witness relationship)
   * // - murder-weapon → forensic-analysis (evidence dependency)  
   * // - crime-scene-discovery → suspect-interrogation (timeline sequence)
   * const allEdges = this.buildAllEdges(investigationData);
   * 
   * // Enables efficient traversal queries:
   * const suspectNetwork = traversalEngine.traverse(allEdges, 'alice-sterling', { maxDepth: 3 });
   * ```
   * 
   * Complexity: O(V² + E) where V = entities, E = relationships (worst case for dense investigation graphs)
   */
  private buildAllEdges(data: NotionData): GraphEdge[] {
    // Clear edge resolver cache to ensure fresh relationship calculations
    this.deps.edgeResolver.clearCache();
    const investigationRelationshipEdges: GraphEdge[] = [];

    // Create comprehensive entity ID set for all investigation participants
    const allInvestigationEntityIds = new Set([
      ...data.characters.map(character => character.id),        // All suspects, witnesses, and key figures
      ...data.elements.map(element => element.id),              // All story elements and evidence items
      ...data.puzzles.map(puzzle => puzzle.id),                 // All investigation puzzles and clues
      ...data.timeline.map(timelineEvent => timelineEvent.id)   // All significant events and moments
    ]);

    // Build character relationship edges (alibis, conflicts, witness relationships)
    data.characters.forEach(character => {
      investigationRelationshipEdges.push(
        ...this.deps.edgeResolver.createCharacterEdges(character, data.characters, allInvestigationEntityIds)
      );
    });

    // Build puzzle dependency edges (evidence chains, prerequisite relationships)
    data.puzzles.forEach(puzzle => {
      investigationRelationshipEdges.push(
        ...this.deps.edgeResolver.createPuzzleEdges(puzzle, allInvestigationEntityIds)
      );
    });

    // Build timeline sequence edges (chronological connections, event causality)
    data.timeline.forEach(timelineEvent => {
      investigationRelationshipEdges.push(
        ...this.deps.edgeResolver.createTimelineEdges(timelineEvent, allInvestigationEntityIds)
      );
    });

    // Return deduplicated investigation relationship network
    return this.deps.edgeResolver.deduplicateEdges(investigationRelationshipEdges);
  }

  /**
   * Collect related investigation entity IDs using optimized graph traversal.
   * 
   * Discovers investigation entities related to a starting entity through relationship
   * traversal using the pre-calculated edge network. Replaces custom BFS implementation
   * with the standardized TraversalEngine for consistent and efficient graph exploration.
   * 
   * @param fromId - Starting investigation entity ID (suspect, evidence, timeline event)
   * @param _relation - Relationship type filter (currently handled by edge types in pre-calculated network)
   * @param _entityType - Target entity type filter (currently handled by traversal filtering)
   * @param _data - Investigation data (not needed due to pre-calculated edge optimization)
   * @param ids - Result set to populate with related investigation entity IDs
   * @param depth - Maximum relationship traversal depth for investigation scope control
   * 
   * @example Related Entity Discovery
   * ```typescript
   * const relatedIds = new Set<string>();
   * 
   * // Discover all entities within 3 degrees of separation from suspect
   * this.collectRelatedIds(
   *   'alice-sterling',     // Starting suspect
   *   'relationship',       // Relationship type (handled by edge network)
   *   'character',          // Target type (handled by traversal)
   *   investigationData,    // Not used (pre-calculated optimization)
   *   relatedIds,           // Result accumulator
   *   3                     // Investigation depth limit
   * );
   * 
   * // Result: All suspects, witnesses, and evidence within 3 relationship hops
   * ```
   * 
   * Complexity: O(V + E) where V = reachable entities, E = traversed relationships
   */
  private collectRelatedIds(
    fromId: string,
    _relation: string, // Relation type handled by pre-calculated edge network types
    _entityType: string | undefined, // Entity type filtering handled during traversal
    _data: NotionData, // Investigation data not needed due to pre-calculated edge optimization
    ids: Set<string>,
    depth: number
  ): void {
    // Use TraversalEngine with pre-calculated investigation relationship network for efficient entity discovery
    const investigationTraversalResult = this.deps.traversalEngine.traverse(
      this.allEdges,    // Complete pre-calculated investigation relationship network
      fromId,           // Starting investigation entity (suspect, evidence, timeline event)
      { 
        maxDepth: depth,      // Investigation relationship traversal depth limit
        algorithm: 'bfs'      // Breadth-first search for comprehensive coverage
      }
    );
    
    // Add all discovered investigation entities to the result set for graph inclusion
    investigationTraversalResult.visitedNodes.forEach(entityId => ids.add(entityId));
  }

  /**
   * Collect investigation entity IDs based on custom filtering predicate.
   * 
   * Filters investigation entities by type and custom predicate function to identify
   * entities matching specific investigation criteria (suspect characteristics, evidence types,
   * timeline constraints). Provides flexible entity selection for complex investigation requirements.
   * 
   * @param entityType - Investigation entity type to filter ('character', 'puzzle', 'timeline', 'element')
   * @param where - Custom predicate function for entity filtering based on investigation criteria
   * @param data - Complete murder mystery investigation data for entity filtering
   * @param ids - Result set to populate with filtered investigation entity IDs
   * 
   * @example Investigation Entity Filtering
   * ```typescript
   * const suspectIds = new Set<string>();
   * 
   * // Filter for high-suspicion characters
   * this.collectFilteredIds(
   *   'character',
   *   (character) => character.suspicionLevel > 7 && character.hasAlibi === false,
   *   investigationData,
   *   suspectIds
   * );
   * 
   * // Filter for physical evidence puzzles
   * this.collectFilteredIds(
   *   'puzzle',
   *   (puzzle) => puzzle.tags?.includes('physical-evidence') && puzzle.status === 'unsolved',
   *   investigationData,
   *   evidenceIds
   * );
   * 
   * // Filter for critical timeline events
   * this.collectFilteredIds(
   *   'timeline',
   *   (event) => event.importance === 'critical' && event.date.includes('2023-10-31'),
   *   investigationData,
   *   timelineIds
   * );
   * ```
   * 
   * Complexity: O(n) where n = entities of the specified type
   */
  private collectFilteredIds(
    entityType: string,
    where: (entity: Entity) => boolean,
    data: NotionData,
    ids: Set<string>
  ): void {
    // Get all investigation entities of the specified type for filtering
    const investigationEntities = this.getEntitiesByType(entityType, data);
    
    // Apply custom predicate filter and add matching entity IDs to result set
    investigationEntities
      .filter((entity: Entity) => where(entity))  // Apply investigation criteria filter
      .forEach(matchingEntity => ids.add(matchingEntity.id));  // Collect matching investigation entity IDs
  }

  /**
   * Get investigation entities by type from murder mystery data.
   * 
   * Retrieves all entities of a specific type from the investigation dataset for
   * filtering, processing, and graph construction operations. Provides type-safe
   * access to different categories of investigation entities.
   * 
   * @param entityType - Investigation entity type identifier ('character', 'element', 'puzzle', 'timeline')
   * @param data - Complete murder mystery investigation data containing all entity collections
   * @returns Array of investigation entities matching the specified type
   * 
   * @example Investigation Entity Retrieval
   * ```typescript
   * // Get all suspects and witnesses
   * const characters = this.getEntitiesByType('character', investigationData);
   * 
   * // Get all evidence and clue puzzles
   * const puzzles = this.getEntitiesByType('puzzle', investigationData);
   * 
   * // Get all significant timeline events
   * const timeline = this.getEntitiesByType('timeline', investigationData);
   * 
   * // Get all story elements and environmental details
   * const elements = this.getEntitiesByType('element', investigationData);
   * ```
   * 
   * Complexity: O(1) - Direct array access by entity type
   */
  private getEntitiesByType(entityType: string, data: NotionData): Entity[] {
    switch (entityType) {
      case 'character':
        return data.characters;  // All suspects, witnesses, and key investigation figures
      case 'element':
        return data.elements;    // All story elements, locations, and environmental details
      case 'puzzle':
        return data.puzzles;     // All investigation puzzles, clues, and evidence items
      case 'timeline':
        return data.timeline;    // All significant events, moments, and chronological markers
      default:
        return [];               // Empty array for unknown investigation entity types
    }
  }

  /**
   * Build investigation graph nodes from selected entities and configuration.
   * 
   * Transforms selected investigation entities into interactive graph nodes with
   * murder mystery context, positioning data, and investigation-specific metadata.
   * Uses NodeCollector for efficient entity-to-node transformation with filtering.
   * 
   * @param _config - Investigation view configuration (currently unused for node building)
   * @param data - Complete murder mystery investigation data containing all entities
   * @param includedNodeIds - Set of entity IDs selected for inclusion in the investigation graph
   * @returns Array of interactive graph nodes ready for investigation visualization
   * 
   * @example Investigation Node Construction
   * ```typescript
   * // Selected investigation entities
   * const selectedEntityIds = new Set([
   *   'alice-sterling',           // Primary suspect
   *   'murder-weapon-evidence',   // Key evidence
   *   'crime-scene-timeline'      // Critical timeline event
   * ]);
   * 
   * // Build interactive investigation nodes
   * const investigationNodes = this.buildNodes(
   *   investigationConfig,
   *   investigationData,
   *   selectedEntityIds
   * );
   * 
   * // Result: Interactive nodes with investigation metadata and positioning
   * ```
   * 
   * Complexity: O(n) where n = number of selected investigation entities
   */
  private buildNodes(
    _config: ViewConfiguration,
    data: NotionData,
    includedNodeIds: Set<string>
  ): GraphNode[] {
    const investigationGraphNodes: GraphNode[] = [];
    
    // Create NodeCollector with entity filter for efficient investigation node creation
    const investigationNodeCollector = new NodeCollector(this.deps.entityTransformer, includedNodeIds);

    // Filter investigation entities to only those selected for graph inclusion
    const selectedCharacters = data.characters.filter(character => includedNodeIds.has(character.id));
    const selectedElements = data.elements.filter(element => includedNodeIds.has(element.id));
    const selectedPuzzles = data.puzzles.filter(puzzle => includedNodeIds.has(puzzle.id));
    const selectedTimelineEvents = data.timeline.filter(timelineEvent => includedNodeIds.has(timelineEvent.id));

    // Transform selected investigation entities into interactive graph nodes
    investigationGraphNodes.push(...investigationNodeCollector.collectCharacterNodes(selectedCharacters));     // Suspect and witness nodes
    investigationGraphNodes.push(...investigationNodeCollector.collectElementNodes(selectedElements));         // Story element and location nodes
    investigationGraphNodes.push(...investigationNodeCollector.collectPuzzleNodes(selectedPuzzles));           // Evidence and clue nodes
    investigationGraphNodes.push(...investigationNodeCollector.collectTimelineNodes(selectedTimelineEvents)); // Timeline event nodes

    return investigationGraphNodes;
  }

  /**
   * Build investigation relationship edges from configuration and selected entities.
   * 
   * Creates relationship edges between selected investigation entities based on the
   * configuration's edge rules. Supports entity-specific edge creation, relationship
   * type filtering, and custom edge generation for specialized investigation workflows.
   * 
   * **Edge Creation Process:**
   * 1. Clear edge resolver cache for fresh calculations
   * 2. Process each edge configuration rule
   * 3. Create entity-specific relationship edges
   * 4. Apply relationship type filtering
   * 5. Add custom investigation edges if specified
   * 
   * @param config - Investigation view configuration with edge creation rules
   * @param data - Complete murder mystery investigation data for relationship mapping
   * @param includedNodeIds - Set of entity IDs selected for graph inclusion (edge endpoints must be included)
   * @returns Array of investigation relationship edges connecting selected entities
   * 
   * @example Investigation Edge Configuration
   * ```typescript
   * const edgeConfig = {
   *   edges: [
   *     {
   *       entityType: 'character',
   *       includeTypes: ['relationship', 'alibi'],     // Only relationship and alibi edges
   *       excludeTypes: ['background']                  // Exclude background relationships
   *     },
   *     {
   *       entityType: 'puzzle', 
   *       includeTypes: ['dependency', 'prerequisite'] // Only evidence dependency chains
   *     },
   *     {
   *       entityType: 'timeline',
   *       customEdges: (data, nodeIds) => createTemporalEdges(data, nodeIds) // Custom timeline logic
   *     }
   *   ]
   * };
   * ```
   * 
   * Complexity: O(E × F) where E = entity relationships, F = filter operations
   */
  private buildEdges(
    config: ViewConfiguration,
    data: NotionData,
    includedNodeIds: Set<string>
  ): GraphEdge[] {
    // Clear edge resolver cache to ensure fresh investigation relationship calculations
    this.deps.edgeResolver.clearCache();
    const investigationRelationshipEdges: GraphEdge[] = [];

    // Process each investigation edge configuration rule
    config.edges.forEach(investigationEdgeConfig => {
      // Get investigation entities of the specified type that are included in the graph
      const selectedInvestigationEntities = this.getEntitiesByType(investigationEdgeConfig.entityType, data)
        .filter((entity: Entity) => includedNodeIds.has(entity.id));

      // Create relationship edges for each selected investigation entity
      selectedInvestigationEntities.forEach(investigationEntity => {
        let entityRelationshipEdges: GraphEdge[] = [];

        // Create investigation relationship edges based on entity type
        switch (investigationEdgeConfig.entityType) {
          case 'character':
            // Character relationship edges (alibis, conflicts, witness relationships)
            entityRelationshipEdges = this.deps.edgeResolver.createCharacterEdges(
              investigationEntity as Character,
              data.characters,
              includedNodeIds
            );
            break;
          case 'puzzle':
            // Puzzle dependency edges (evidence chains, prerequisite relationships)
            entityRelationshipEdges = this.deps.edgeResolver.createPuzzleEdges(
              investigationEntity as Puzzle,
              includedNodeIds
            );
            break;
          case 'timeline':
            // Timeline sequence edges (chronological connections, event causality)
            entityRelationshipEdges = this.deps.edgeResolver.createTimelineEdges(
              investigationEntity as TimelineEvent,
              includedNodeIds
            );
            break;
          case 'element':
            // Story elements currently don't have dedicated edge creation (handled by other entity types)
            break;
        }

        // Apply investigation relationship type inclusion filters
        if (investigationEdgeConfig.includeTypes && investigationEdgeConfig.includeTypes.length > 0) {
          entityRelationshipEdges = entityRelationshipEdges.filter(edge => 
            edge.type && investigationEdgeConfig.includeTypes!.includes(edge.type)
          );
        }
        
        // Apply investigation relationship type exclusion filters
        if (investigationEdgeConfig.excludeTypes && investigationEdgeConfig.excludeTypes.length > 0) {
          entityRelationshipEdges = entityRelationshipEdges.filter(edge => 
            edge.type && !investigationEdgeConfig.excludeTypes!.includes(edge.type)
          );
        }

        // Add filtered investigation relationship edges to the collection
        investigationRelationshipEdges.push(...entityRelationshipEdges);
      });

      // Add custom investigation edges if provided in the configuration
      if (investigationEdgeConfig.customEdges) {
        const customInvestigationEdges = investigationEdgeConfig.customEdges(data, includedNodeIds);
        investigationRelationshipEdges.push(...customInvestigationEdges);
      }
    });

    return investigationRelationshipEdges;
  }

  /**
   * Apply performance optimization limits to the investigation graph.
   * 
   * Enforces configurable limits on investigation graph size to maintain interactive
   * performance for large murder mystery datasets. Limits both entity count and
   * relationship count while preserving graph connectivity for investigation workflows.
   * 
   * **Performance Optimization Strategy:**
   * - Node limiting: Truncate to maximum entity count with connected edge filtering
   * - Edge limiting: Truncate to maximum relationship count independently
   * - Connectivity preservation: Ensure remaining edges connect to remaining nodes
   * 
   * @param graph - Complete investigation graph before performance optimization
   * @param config - Investigation view configuration with performance limit settings
   * @returns Optimized investigation graph within performance constraints
   * 
   * @example Performance Limit Configuration
   * ```typescript
   * const config = {
   *   performance: {
   *     maxNodes: 200,    // Limit investigation to 200 entities for interactive performance
   *     maxEdges: 500     // Limit to 500 relationships to prevent UI overload
   *   }
   * };
   * 
   * // Before: 1000 suspects + 2000 relationships = sluggish investigation
   * // After: 200 key suspects + 500 critical relationships = smooth investigation
   * ```
   * 
   * Complexity: O(E) where E = edges (for connectivity filtering)
   */
  private applyPerformanceLimits(
    graph: GraphData,
    config: ViewConfiguration
  ): GraphData {
    let { nodes: investigationNodes, edges: investigationEdges } = graph;

    // Apply investigation entity count limits for interactive performance
    if (config.performance?.maxNodes && investigationNodes.length > config.performance.maxNodes) {
      log.warn(`ViewBuilder: Limiting investigation entities from ${investigationNodes.length} to ${config.performance.maxNodes} for performance optimization`);
      investigationNodes = investigationNodes.slice(0, config.performance.maxNodes);
      
      // Filter investigation relationships to only connect remaining entities
      const remainingEntityIds = new Set(investigationNodes.map(node => node.id));
      investigationEdges = investigationEdges.filter(edge => 
        remainingEntityIds.has(edge.source) && remainingEntityIds.has(edge.target)
      );
    }

    // Apply investigation relationship count limits for UI performance
    if (config.performance?.maxEdges && investigationEdges.length > config.performance.maxEdges) {
      log.warn(`ViewBuilder: Limiting investigation relationships from ${investigationEdges.length} to ${config.performance.maxEdges} for UI performance`);
      investigationEdges = investigationEdges.slice(0, config.performance.maxEdges);
    }

    return { 
      nodes: investigationNodes, 
      edges: investigationEdges 
    };
  }
}