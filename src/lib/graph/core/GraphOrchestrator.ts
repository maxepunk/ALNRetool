/**
 * Murder Mystery Investigation Graph Orchestrator
 * 
 * Central coordinator for building interactive murder mystery investigation graphs.
 * Orchestrates the transformation of raw investigation data (characters, puzzles, timeline events)
 * into specialized visual representations optimized for detective work and case analysis.
 * 
 * This class serves as the primary entry point for all murder mystery graph construction,
 * supporting multiple investigation view types:
 * - character-journey: Track suspect movements and relationships
 * - puzzle-focus: Analyze evidence chains and dependencies  
 * - node-connections: Explore entity relationships and connections
 * - timeline: Reconstruct chronological sequence of events
 * 
 * Uses declarative ViewBuilder configurations to eliminate circular dependencies
 * and provide clean separation between investigation strategies and graph rendering.
 * 
 * @example Basic Investigation Graph
 * ```typescript
 * const orchestrator = new GraphOrchestrator(graphBuilder, dependencies);
 * 
 * // Build character-focused investigation view
 * const suspectGraph = orchestrator.buildGraph(investigationData, {
 *   viewType: 'character-journey',
 *   nodeId: 'suspect-alice-123',
 *   maxDepth: 3
 * });
 * 
 * // Build evidence chain analysis
 * const evidenceGraph = orchestrator.buildGraph(investigationData, {
 *   viewType: 'puzzle-focus', 
 *   nodeId: 'murder-weapon-puzzle',
 *   maxNodes: 50
 * });
 * ```
 * 
 * @example Performance Monitoring
 * ```typescript
 * const result = orchestrator.buildGraph(data, options);
 * console.log(`Investigation graph built in ${result.metadata.metrics.duration}ms`);
 * console.log(`Found ${result.metadata.metrics.nodeCount} entities, ${result.metadata.metrics.edgeCount} connections`);
 * ```
 * 
 * @see ViewBuilder - Handles declarative investigation view configurations
 * @see GraphBuilder - Generic graph building with murder mystery entity support
 * @see ViewConfiguration - Interface for investigation-specific view configurations
 * @see StrategyDependencies - Dependency injection container for graph modules
 * 
 * Complexity: O(V + E + C) where V = entities, E = relationships, C = configuration overhead
 */

import type { NotionData, GraphData, ViewType } from '../types';
import type { BuildOptions, StrategyDependencies } from './ViewStrategy.interface';
import { ViewBuilder } from '../config/ViewBuilder';
import { GraphBuilder } from '../modules/GraphBuilder';
import { log } from '@/utils/logger';

// Import view configurations
import { CharacterJourneyConfig } from '../config/views/CharacterJourneyConfig';
import { NodeConnectionsConfig } from '../config/views/NodeConnectionsConfig';
import { PuzzleFocusConfig } from '../config/views/PuzzleFocusConfig';
import { TimelineConfig } from '../config/views/TimelineConfig';
import type { ViewConfiguration, TemplateVariables } from '../config/ViewConfiguration';

/**
 * Murder Mystery Investigation Graph Orchestrator
 * 
 * Orchestrates the construction of interactive investigation graphs using ViewBuilder 
 * with declarative murder mystery-specific configurations. Provides a unified interface
 * for building graphs optimized for different investigation strategies and detective workflows.
 * 
 * Supports specialized view types for comprehensive case analysis:
 * - Character relationship mapping for suspect investigation
 * - Evidence chain visualization for puzzle solving
 * - Timeline reconstruction for sequence analysis
 * - Generic node exploration for open-ended investigation
 * 
 * Complexity: O(V + E) for graph construction, O(1) for view configuration lookup
 */
export class GraphOrchestrator {
  /** ViewBuilder instance for processing declarative murder mystery investigation configurations */
  private viewBuilder: ViewBuilder;
  
  /** GraphBuilder for fallback generic investigation graph building when no specific view type is provided */
  private graphBuilder: GraphBuilder;
  
  /** Registry of available investigation view configurations mapped by view type identifier */
  private viewConfigs: Map<string, ViewConfiguration>;

  /**
   * Initializes the murder mystery investigation orchestrator with required dependencies.
   * 
   * Sets up the graph building infrastructure and registers all default investigation
   * view configurations for comprehensive case analysis workflows.
   * 
   * @param graphBuilder - GraphBuilder instance for generic murder mystery graph construction
   * @param dependencies - Required dependencies for investigation view strategies and graph modules
   * 
   * @remarks
   * Automatically registers specialized murder mystery investigation view configurations:
   * - character-journey: Character-centric investigation for tracking suspect movements, relationships, and alibis
   * - node-connections: Generic entity connection explorer for discovering hidden relationships
   * - puzzle-focus: Evidence-centric dependency graph for analyzing clue chains and solving puzzles
   * - timeline: Chronological event visualization for reconstructing the sequence of the crime
   * 
   * Each configuration is optimized for specific investigation workflows and detective methodologies.
   * 
   * Complexity: O(1) - Simple initialization with constant-time view registration
   */
  constructor(
    graphBuilder: GraphBuilder,
    dependencies: StrategyDependencies
  ) {
    this.graphBuilder = graphBuilder;
    this.viewBuilder = new ViewBuilder(dependencies);
    
    // Initialize murder mystery investigation view configurations map
    // Each configuration defines specialized graph building strategies for different investigation approaches
    this.viewConfigs = new Map([
      ['character-journey', CharacterJourneyConfig],    // Suspect relationship mapping and alibi tracking
      ['node-connections', NodeConnectionsConfig],      // Generic entity relationship exploration
      ['puzzle-focus', PuzzleFocusConfig],               // Evidence chain analysis and clue dependencies  
      ['timeline', TimelineConfig]                       // Chronological crime reconstruction
    ]);
  }

  /**
   * Build a murder mystery investigation graph using specialized configurations or generic builder.
   * 
   * Main entry point for constructing interactive investigation graphs from raw murder mystery data.
   * Transforms characters, puzzles, timeline events, and story elements into optimized visual
   * representations tailored for detective work and case analysis.
   * 
   * @param data - The murder mystery investigation data containing characters, puzzles, timeline, and elements
   * @param options - Investigation build options including view type, focus entity, and exploration limits
   * @returns Complete investigation graph with positioned nodes, weighted edges, and performance metrics
   * 
   * @remarks
   * **Investigation Strategy Selection:**
   * - If viewType specified: Uses matching declarative investigation configuration
   * - If no viewType: Falls back to generic builder for open-ended exploration
   * - Automatically maps nodeId to appropriate investigation focus based on view type
   * 
   * **Performance Optimization:**
   * - Adds comprehensive performance metrics to result metadata
   * - Tracks build duration, entity counts, and memory usage
   * - Enables investigation workflow optimization analysis
   * 
   * **Template Variable Mapping:**
   * - puzzle-focus: Maps nodeId to puzzleId for evidence chain analysis
   * - character-journey: Maps nodeId to characterId for suspect investigation
   * - node-connections: Maps nodeId to nodeId for generic exploration
   * - timeline: Maps nodeId based on temporal entity type
   * 
   * @example Character Investigation Workflow
   * ```typescript
   * // Build suspect-focused investigation graph
   * const suspectGraph = orchestrator.buildGraph(investigationData, {
   *   viewType: 'character-journey',
   *   nodeId: 'suspect-alice-sterling',
   *   maxDepth: 4,        // Explore 4 degrees of relationships
   *   maxNodes: 100       // Limit complexity for performance
   * });
   * 
   * console.log(`Investigation graph: ${suspectGraph.nodes.length} entities`);
   * console.log(`Found ${suspectGraph.edges.length} connections`);
   * console.log(`Analysis completed in ${suspectGraph.metadata.metrics.duration}ms`);
   * ```
   * 
   * @example Evidence Chain Analysis
   * ```typescript
   * // Build evidence-focused dependency graph
   * const evidenceGraph = orchestrator.buildGraph(investigationData, {
   *   viewType: 'puzzle-focus',
   *   nodeId: 'murder-weapon-analysis',
   *   maxDepth: 3
   * });
   * 
   * // Analyze evidence dependencies
   * const criticalPath = evidenceGraph.edges.filter(e => e.type === 'dependency');
   * ```
   * 
   * @example Generic Investigation Exploration
   * ```typescript
   * // Open-ended investigation without specific focus
   * const overviewGraph = orchestrator.buildGraph(investigationData, {
   *   maxNodes: 200,      // Large overview
   *   maxDepth: 2         // Shallow but broad
   * });
   * ```
   * 
   * Complexity: O(V + E + L) where V = entities, E = relationships, L = layout computation
   */
  buildGraph(data: NotionData, options: BuildOptions = {}): GraphData {
    const startTime = performance.now();
    
    // Log the murder mystery investigation graph build request
    log.info('GraphOrchestrator: Building murder mystery investigation graph', {
      investigationView: options.viewType || 'generic-exploration',
      hasFocusEntity: !!options.nodeId,
      focusEntityId: options.nodeId || 'none',
      investigationScope: {
        suspects: data.characters.length,
        storyElements: data.elements.length, 
        evidencePuzzles: data.puzzles.length,
        timelineEvents: data.timeline.length
      },
      explorationLimits: {
        maxDepth: options.maxDepth || 'unlimited',
        maxNodes: options.maxNodes || 'unlimited'
      }
    });

    let result: GraphData;

    // Investigation strategy selection: use specialized configuration or generic exploration
    if (options.viewType) {
      const investigationConfig = this.viewConfigs.get(options.viewType);
      
      if (investigationConfig) {
        log.info(`Using specialized murder mystery investigation config: ${options.viewType}`);
        
        // Prepare investigation template variables based on view type and focus entity
        const investigationVariables: TemplateVariables = {};
        
        if (options.nodeId) {
          // Map focus entity to appropriate investigation variable based on view strategy
          // This ensures each investigation type gets the correct central entity reference
          switch (options.viewType) {
            case 'puzzle-focus':
              // Evidence-focused investigation: nodeId represents the central puzzle/clue
              investigationVariables.puzzleId = options.nodeId;
              log.debug(`Evidence investigation focused on puzzle: ${options.nodeId}`);
              break;
            case 'character-journey':
              // Suspect-focused investigation: nodeId represents the character under investigation
              investigationVariables.characterId = options.nodeId;
              log.debug(`Character investigation focused on suspect: ${options.nodeId}`);
              break;
            case 'node-connections':
              // Generic entity investigation: nodeId represents any investigatable entity
              investigationVariables.nodeId = options.nodeId;
              log.debug(`Generic investigation focused on entity: ${options.nodeId}`);
              break;
            case 'timeline':
              // Timeline investigation: nodeId may represent any temporal anchor point
              investigationVariables.nodeId = options.nodeId;
              log.debug(`Timeline investigation anchored at: ${options.nodeId}`);
              break;
            default:
              // Fallback for custom investigation types: provide all possible entity mappings
              investigationVariables.nodeId = options.nodeId;
              investigationVariables.characterId = options.nodeId;
              investigationVariables.puzzleId = options.nodeId;
              log.debug(`Custom investigation with flexible entity focus: ${options.nodeId}`);
              break;
          }
        }
        
        // Map investigation scope and exploration parameters
        if (options.nodeType) {
          investigationVariables.nodeType = options.nodeType;
        }
        if (options.maxDepth !== undefined) {
          investigationVariables.maxDepth = options.maxDepth;
          log.debug(`Investigation depth limited to ${options.maxDepth} degrees of separation`);
        }
        if (options.maxNodes !== undefined) {
          investigationVariables.maxNodes = options.maxNodes;
          log.debug(`Investigation scope limited to ${options.maxNodes} entities for performance`);
        }
        
        // Execute specialized investigation graph construction
        result = this.viewBuilder.build(investigationConfig, data, investigationVariables);
      } else {
        log.warn(`Unknown investigation type: ${options.viewType}, falling back to generic exploration`);
        result = this.graphBuilder.buildGenericGraph(data, options);
      }
    } else {
      // No specific investigation strategy: build generic exploration graph
      log.info('Building generic murder mystery exploration graph (no specific investigation focus)');
      result = this.graphBuilder.buildGenericGraph(data, options);
    }

    // Add comprehensive investigation performance metrics to result
    const endTime = performance.now();
    const investigationDuration = endTime - startTime;
    
    result.metadata = {
      ...result.metadata,
      metrics: {
        startTime,
        endTime,
        duration: investigationDuration,
        nodeCount: result.nodes.length,
        edgeCount: result.edges.length,
        warnings: result.metadata?.metrics?.warnings || []
      },
      viewType: options.viewType as ViewType,
      timestamp: new Date().toISOString()
    };

    log.info('Murder mystery investigation graph construction completed', {
      investigationType: options.viewType || 'generic-exploration',
      buildDuration: `${investigationDuration.toFixed(2)}ms`,
      investigationScope: {
        entitiesDiscovered: result.nodes.length,
        connectionsFound: result.edges.length,
        processingRate: `${Math.round((result.nodes.length / investigationDuration) * 1000)} entities/sec`
      },
      focusEntity: options.nodeId || 'none'
    });

    return result;
  }

  /**
   * Register a custom murder mystery investigation view configuration.
   * 
   * Allows runtime registration of specialized investigation view types for
   * custom detective workflows or case-specific analysis requirements.
   * 
   * @param viewType - The investigation view type identifier (e.g., 'motive-analysis', 'alibi-verification')
   * @param config - The specialized investigation view configuration object
   * 
   * @example Custom Motive Analysis View
   * ```typescript
   * orchestrator.registerViewConfig('motive-analysis', {
   *   name: 'Motive Analysis Investigation',
   *   description: 'Specialized view for analyzing suspect motives and psychological profiles',
   *   filters: {
   *     includeCharacterTypes: ['suspect', 'victim', 'witness'],
   *     includePuzzleTypes: ['psychological', 'motive', 'background']
   *   },
   *   layout: {
   *     algorithm: 'radial',
   *     centerEntity: 'victim',
   *     groupBy: 'motive-strength'
   *   }
   * });
   * ```
   * 
   * @example Alibi Verification View
   * ```typescript
   * orchestrator.registerViewConfig('alibi-verification', {
   *   name: 'Alibi Cross-Reference Investigation', 
   *   description: 'Timeline-focused view for verifying suspect alibis',
   *   temporalFocus: true,
   *   highlightConflicts: true
   * });
   * ```
   * 
   * Complexity: O(1) - Map insertion operation
   */
  registerViewConfig(viewType: string, config: ViewConfiguration): void {
    this.viewConfigs.set(viewType, config);
  }

  /**
   * Check if a specialized investigation configuration exists for a view type.
   * 
   * Validates whether a specific investigation view type is supported before
   * attempting graph construction. Useful for UI validation and error prevention.
   * 
   * @param viewType - The investigation view type to validate (e.g., 'character-journey', 'puzzle-focus')
   * @returns True if the investigation configuration exists and is available, false otherwise
   * 
   * @example Pre-build Validation
   * ```typescript
   * const investigationType = 'suspect-timeline';
   * 
   * if (orchestrator.hasViewType(investigationType)) {
   *   // Safe to build specialized investigation graph
   *   const graph = orchestrator.buildGraph(data, { viewType: investigationType });
   * } else {
   *   // Fall back to generic investigation or show error
   *   console.warn(`Unknown investigation type: ${investigationType}`);
   *   const graph = orchestrator.buildGraph(data); // Generic exploration
   * }
   * ```
   * 
   * Complexity: O(1) - Map lookup operation
   */
  hasViewType(viewType: string): boolean {
    return this.viewConfigs.has(viewType);
  }

  /**
   * Get all registered murder mystery investigation view types.
   * 
   * Retrieves the complete list of available specialized investigation configurations.
   * Essential for building investigation type selection UIs and validation workflows.
   * 
   * @returns Array of investigation view type identifiers available for graph construction
   * 
   * @example Investigation Type Selection UI
   * ```typescript
   * const availableInvestigations = orchestrator.getRegisteredViewTypes();
   * console.log(availableInvestigations);
   * // ['character-journey', 'node-connections', 'puzzle-focus', 'timeline']
   * 
   * // Build dropdown options for detective interface
   * const investigationOptions = availableInvestigations.map(type => ({
   *   value: type,
   *   label: type.split('-').map(word => 
   *     word.charAt(0).toUpperCase() + word.slice(1)
   *   ).join(' ')
   * }));
   * ```
   * 
   * @example Investigation Capability Check
   * ```typescript
   * const supportedTypes = orchestrator.getRegisteredViewTypes();
   * const requiredType = 'forensic-analysis';
   * 
   * if (!supportedTypes.includes(requiredType)) {
   *   throw new Error(`Investigation type '${requiredType}' not supported. ` +
   *     `Available: ${supportedTypes.join(', ')}`);
   * }
   * ```
   * 
   * Complexity: O(n) where n = number of registered investigation view configurations
   */
  getRegisteredViewTypes(): string[] {
    return Array.from(this.viewConfigs.keys());
  }

  /**
   * Get the underlying murder mystery graph builder instance.
   * 
   * Provides direct access to the GraphBuilder for advanced investigation operations,
   * custom graph transformations, or specialized detective workflow requirements.
   * 
   * @returns The murder mystery-aware GraphBuilder instance with entity transformation capabilities
   * 
   * @remarks
   * **Primary Use Cases:**
   * - Unit testing of graph construction logic
   * - Advanced custom investigation workflows requiring direct builder access
   * - Performance debugging and optimization analysis
   * - Custom entity transformation pipelines
   * 
   * **Advanced Investigation Example:**
   * ```typescript
   * const builder = orchestrator.getGraphBuilder();
   * 
   * // Direct access for custom suspect relationship analysis
   * const customGraph = builder.buildGenericGraph(data, {
   *   entityFilter: (entity) => entity.type === 'character' && entity.suspicionLevel > 7,
   *   relationshipWeighting: (edge) => edge.evidenceStrength * edge.credibilityScore
   * });
   * ```
   * 
   * Complexity: O(1) - Simple instance accessor
   */
  getGraphBuilder(): GraphBuilder {
    return this.graphBuilder;
  }

  /**
   * Get the underlying investigation view builder instance.
   * 
   * Provides direct access to the ViewBuilder for advanced investigation configuration
   * processing, custom template variable manipulation, or specialized detective analysis workflows.
   * 
   * @returns The investigation-aware ViewBuilder instance with declarative configuration support
   * 
   * @remarks
   * **Primary Use Cases:**
   * - Unit testing of investigation view configuration processing
   * - Advanced custom template variable manipulation for specialized cases
   * - Investigation workflow debugging and optimization
   * - Custom declarative configuration development and testing
   * 
   * **Advanced Investigation Configuration Example:**
   * ```typescript
   * const viewBuilder = orchestrator.getViewBuilder();
   * 
   * // Direct access for custom investigation template processing
   * const customVariables = {
   *   suspectId: 'alice-sterling',
   *   timeframe: '2023-10-31T20:00:00Z',
   *   evidenceTypes: ['physical', 'digital', 'testimonial'],
   *   investigationRadius: 3
   * };
   * 
   * const result = viewBuilder.build(
   *   customInvestigationConfig, 
   *   investigationData, 
   *   customVariables
   * );
   * ```
   * 
   * Complexity: O(1) - Simple instance accessor
   */
  getViewBuilder(): ViewBuilder {
    return this.viewBuilder;
  }

  /**
   * Get a murder mystery investigation view configuration by type.
   * 
   * Retrieves the specialized investigation configuration object for inspection,
   * modification, or detailed analysis of investigation strategy parameters.
   * 
   * @param viewType - The investigation view type identifier to retrieve
   * @returns The investigation configuration object or undefined if not found
   * 
   * @example Investigation Configuration Analysis
   * ```typescript
   * const evidenceConfig = orchestrator.getViewConfiguration('puzzle-focus');
   * if (evidenceConfig) {
   *   console.log(`Investigation: ${evidenceConfig.name}`);
   *   console.log(`Strategy: ${evidenceConfig.description}`);
   *   
   *   // Analyze investigation parameters
   *   if (evidenceConfig.filters) {
   *     console.log('Evidence types:', evidenceConfig.filters.puzzleTypes);
   *     console.log('Relationship focus:', evidenceConfig.filters.relationshipTypes);
   *   }
   * }
   * ```
   * 
   * @example Investigation Strategy Comparison
   * ```typescript
   * const characterConfig = orchestrator.getViewConfiguration('character-journey');
   * const timelineConfig = orchestrator.getViewConfiguration('timeline');
   * 
   * if (characterConfig && timelineConfig) {
   *   console.log('Character investigation depth:', characterConfig.defaultDepth);
   *   console.log('Timeline investigation span:', timelineConfig.temporalRange);
   *   
   *   // Choose optimal investigation strategy based on case requirements
   *   const optimalStrategy = caseData.timeConstraints ? 'timeline' : 'character-journey';
   * }
   * ```
   * 
   * @example Dynamic Investigation Configuration
   * ```typescript
   * const config = orchestrator.getViewConfiguration('custom-investigation');
   * if (config) {
   *   // Modify investigation parameters at runtime
   *   const enhancedConfig = {
   *     ...config,
   *     maxDepth: Math.min(config.maxDepth, availableComputeResources),
   *     priorityFilters: [...config.filters, ...urgentCaseFilters]
   *   };
   *   
   *   orchestrator.registerViewConfig('enhanced-investigation', enhancedConfig);
   * }
   * ```
   * 
   * Complexity: O(1) - Map lookup operation
   */
  getViewConfiguration(viewType: string): ViewConfiguration | undefined {
    return this.viewConfigs.get(viewType);
  }
}