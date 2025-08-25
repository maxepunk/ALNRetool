/**
 * Virtual Edge Injection Module
 * 
 * Advanced graph layout optimization through strategic virtual edge creation.
 * This module analyzes entity relationships and injects hidden edges to improve
 * visual layout while maintaining logical graph structure.
 * 
 * Key optimization strategies:
 * - **Dual-role element detection**: Identifies elements serving as both requirements and rewards
 * - **Virtual dependency edges**: Creates hidden edges between provider/consumer puzzles
 * - **Puzzle grouping edges**: Improves vertical alignment of related puzzle clusters
 * - **Dead-end detection**: Identifies elements that are only provided (never consumed)
 * - **Missing provider analysis**: Finds elements consumed but never provided
 * 
 * Virtual edges are created with `display: 'none'` style and marked with `isVirtual: true`
 * to ensure they influence layout algorithms without appearing in the visual graph.
 * 
 * @example
 * ```typescript
 * const optimizedEdges = injectVirtualEdges(nodes, edges);
 * const stats = getVirtualEdgeStats(nodes, optimizedEdges);
 * console.log(`Created ${stats.virtualDependencyEdges} virtual dependencies`);
 * ```
 * 
 * @see injectVirtualEdges - Main injection function
 * @see getVirtualEdgeStats - Analysis and statistics
 * @see VirtualEdgeStats - Statistics interface
 */

import type { GraphNode, GraphEdge } from '../types';
import { logger } from '../utils/Logger'


/**
 * Statistics and analysis data for virtual edge injection operations.
 * Provides detailed metrics about graph optimization and edge creation patterns.
 * 
 * Used for monitoring layout optimization effectiveness and debugging
 * dependency analysis algorithms.
 * 
 * @example
 * ```typescript
 * const stats = getVirtualEdgeStats(nodes, edges);
 * console.log(`${stats.dualRoleElements} dual-role elements found`);
 * console.log(`${stats.virtualDependencyEdges} virtual dependencies created`);
 * if (stats.missingProviders.length > 0) {
 *   console.warn('Missing providers:', stats.missingProviders);
 * }
 * ```
 */
export interface VirtualEdgeStats {
  /** Number of elements that serve as both requirements and rewards */
  dualRoleElements: number;
  /** Number of virtual dependency edges created between provider/consumer puzzles */
  virtualDependencyEdges: number;
  /** Number of virtual grouping edges created for puzzle alignment */
  puzzleGroupingEdges: number;
  /** Array of element IDs that are only provided (never consumed) - potential dead ends */
  deadEndElements: string[];
  /** Array of element IDs that are consumed but never provided - data integrity issues */
  missingProviders: string[];
}

/**
 * Inject virtual edges into the graph for enhanced layout optimization.
 * 
 * Main function that orchestrates the complete virtual edge injection process,
 * including dual-role element analysis, dependency enforcement, and puzzle grouping.
 * 
 * **Process Overview:**
 * 1. **Puzzle Identification**: Maps all puzzle nodes and their names
 * 2. **Element Analysis**: Tracks provider/consumer relationships
 * 3. **Dual-role Detection**: Finds elements serving multiple roles
 * 4. **Virtual Edge Creation**: Creates hidden dependency edges
 * 5. **Puzzle Grouping**: Adds alignment edges for related puzzles
 * 
 * **Virtual Edge Properties:**
 * - `display: 'none'` style (hidden from visual rendering)
 * - `isVirtual: true` flag for identification
 * - Higher weight values to influence layout algorithms
 * - Specific relationship types ('virtual-dependency', 'puzzle-grouping')
 * 
 * @param nodes - Complete array of all graph nodes (puzzles, elements, characters, etc.)
 * @param edges - Complete array of all existing graph edges
 * @returns New array containing original edges plus injected virtual edges
 * 
 * @remarks
 * - Virtual edges are created based on semantic relationships, not direct connections
 * - Logs detailed analysis to console for debugging layout issues
 * - Maintains immutability by returning new edge array
 * - Performance scales O(V + E) where V = nodes, E = edges
 * 
 * @example
 * ```typescript
 * const originalEdges = await fetchGraphEdges();
 * const optimizedEdges = injectVirtualEdges(allNodes, originalEdges);
 * 
 * // Apply to React Flow
 * setEdges(optimizedEdges.filter(e => !e.data?.isVirtual)); // Show only real edges
 * applyLayout(nodes, optimizedEdges); // Use all edges for layout
 * ```
 * 
 * Complexity: O(V + E + P²) where V = nodes, E = edges, P = puzzles
 */
export function injectVirtualEdges(nodes: GraphNode[], edges: GraphEdge[]): GraphEdge[] {
  console.group('[Virtual Edge Injection] Analyzing puzzle dependencies');
  
  // Identify puzzle nodes and create name mapping
  const puzzleNodeIds = new Set<string>();
  const puzzleNames = new Map<string, string>(); // id -> name
  
  nodes
    .filter(n => n.type === 'puzzle')
    .forEach(n => {
      puzzleNodeIds.add(n.id);
      puzzleNames.set(n.id, n.data.label || n.id);
    });
  
  logger.debug('[Virtual Edge] Found puzzles:', undefined, Array.from(puzzleNames.entries()).map(([id, name]) => `${name} (${id})`));

  // Map elements to their provider and consumer puzzles
  const providers = new Map<string, string[]>(); // elementId -> puzzleIds that provide it
  const consumers = new Map<string, string[]>(); // elementId -> puzzleIds that consume it
  const elementNames = new Map<string, string>(); // elementId -> element name

  // Detailed edge analysis
  console.group('[Virtual Edge] Analyzing edges');
  let rewardCount = 0;
  let requirementCount = 0;
  
  for (const edge of edges) {
    const { source, target } = edge;
    const relationshipType = edge.data?.relationshipType;

    // Puzzle provides element (as reward)
    if (relationshipType === 'reward' && puzzleNodeIds.has(source) && !puzzleNodeIds.has(target)) {
      if (!providers.has(target)) providers.set(target, []);
      providers.get(target)!.push(source);
      
      // Try to get element name from node
      const elementNode = nodes.find(n => n.id === target);
      if (elementNode) {
        elementNames.set(target, elementNode.data.label || target);
      }
      
      logger.debug(`  Reward edge: ${puzzleNames.get(source)} → ${elementNames.get(target) || target}`);
      rewardCount++;
    }

    // Element is consumed by puzzle (as requirement)
    if (relationshipType === 'requirement' && !puzzleNodeIds.has(source) && puzzleNodeIds.has(target)) {
      if (!consumers.has(source)) consumers.set(source, []);
      consumers.get(source)!.push(target);
      
      // Try to get element name from node
      const elementNode = nodes.find(n => n.id === source);
      if (elementNode) {
        elementNames.set(source, elementNode.data.label || source);
      }
      
      logger.debug(`  Requirement edge: ${elementNames.get(source) || source} → ${puzzleNames.get(target)}`);
      requirementCount++;
    }
  }
  
  logger.debug(`[Virtual Edge] Total: ${rewardCount} reward edges, ${requirementCount} requirement edges`);
  console.groupEnd();

  // Analyze element roles
  console.group('[Virtual Edge] Element role analysis');
  
  // Elements that are only provided (never consumed)
  const onlyProvided = Array.from(providers.keys()).filter(id => !consumers.has(id));
  if (onlyProvided.length > 0) {
    logger.debug('Elements only provided (dead ends):', undefined, onlyProvided.map(id => elementNames.get(id) || id));
  }
  
  // Elements that are only consumed (never provided)
  const onlyConsumed = Array.from(consumers.keys()).filter(id => !providers.has(id));
  if (onlyConsumed.length > 0) {
    logger.debug('Elements only consumed (missing providers):', undefined, onlyConsumed.map(id => elementNames.get(id) || id));
  }
  
  console.groupEnd();

  // Create virtual edges for dual-role elements
  const virtualEdges: GraphEdge[] = [];
  const createdVirtualEdges = new Set<string>();

  console.group('[Virtual Edge] Creating virtual edges for dual-role elements');
  
  for (const [elementId, providerPuzzles] of providers.entries()) {
    if (consumers.has(elementId)) {
      const consumerPuzzles = consumers.get(elementId)!;
      const elementName = elementNames.get(elementId) || elementId;
      
      logger.debug(`  ✓ Provided by: ${providerPuzzles.map(id => puzzleNames.get(id)).join(', undefined, ')}`);
      logger.debug(`  → Required by: ${consumerPuzzles.map(id => puzzleNames.get(id)).join(', undefined, ')}`);

      // Create virtual edges between provider and consumer puzzles
      for (const providerId of providerPuzzles) {
        for (const consumerId of consumerPuzzles) {
          const virtualEdgeKey = `${providerId}->${consumerId}`;
          const providerName = puzzleNames.get(providerId);
          const consumerName = puzzleNames.get(consumerId);
          
          if (!createdVirtualEdges.has(virtualEdgeKey)) {
            virtualEdges.push({
              id: `virtual-${providerId}-${consumerId}`,
              source: providerId,
              target: consumerId,
              type: 'default',
              style: { display: 'none' }, // Hidden edge for layout only
              data: {
                isVirtual: true,
                relationshipType: 'virtual-dependency',
                weight: 2, // Higher weight to enforce stronger constraint
              },
            });
            createdVirtualEdges.add(virtualEdgeKey);
            logger.debug(`  ➕ Virtual edge created: ${providerName} → ${consumerName}`);
          }
        }
      }
    }
  }
  
  console.groupEnd();

  // Phase 2: Create virtual edges for puzzle grouping
  const puzzleGroupingEdges = createPuzzleGroupingEdges(
    edges,
    puzzleNodeIds,
    puzzleNames,
    elementNames
  );
  
  virtualEdges.push(...puzzleGroupingEdges);

  logger.debug(`[Virtual Edge] Summary: Injected ${virtualEdges.length} virtual edges total`);
  console.groupEnd();
  
  // Return original edges plus virtual edges
  return [...edges, ...virtualEdges];
}

/**
 * Create virtual edges for puzzle grouping to improve vertical alignment.
 * 
 * Analyzes puzzle-element relationships to identify puzzles that should be
 * visually grouped together based on shared elements. Creates virtual edges
 * to influence layout algorithms for better spatial organization.
 * 
 * **Algorithm Steps:**
 * 1. **Relationship Mapping**: Build puzzle-to-element associations
 * 2. **Shared Element Analysis**: Find puzzles connected to same elements
 * 3. **Pairing Logic**: Create virtual edges between puzzle pairs
 * 4. **Alignment Optimization**: Use medium-weight edges for grouping
 * 
 * @param edges - Original graph edges to analyze for relationships
 * @param puzzleNodeIds - Set containing all puzzle node IDs for filtering
 * @param puzzleNames - Map from puzzle ID to human-readable name (for logging)
 * @param elementNames - Map from element ID to human-readable name (for logging)
 * @returns Array of virtual grouping edges with 'puzzle-grouping' relationship type
 * 
 * @remarks
 * **Grouping Criteria:**
 * - Puzzles sharing requirements or rewards are grouped
 * - Virtual edges are bidirectional for balanced alignment
 * - Medium weight (500) balances grouping with other constraints
 * - Prevents duplicate edges through pair key tracking
 * 
 * **Edge Properties:**
 * - `relationshipType: 'puzzle-grouping'`
 * - `weight: 500` (medium priority)
 * - `isVirtual: true` flag
 * - `display: 'none'` style
 * 
 * @example
 * ```typescript
 * // Internal usage within injectVirtualEdges
 * const groupingEdges = createPuzzleGroupingEdges(
 *   edges, puzzleNodeIds, puzzleNames, elementNames
 * );
 * console.log(`Created ${groupingEdges.length} grouping edges`);
 * ```
 * 
 * Complexity: O(E + P²) where E = edges, P = puzzles
 */
function createPuzzleGroupingEdges(
  edges: GraphEdge[],
  puzzleNodeIds: Set<string>,
  puzzleNames: Map<string, string>,
  elementNames: Map<string, string>
): GraphEdge[] {
  console.group('[Virtual Edge] Creating puzzle grouping edges');
  
  // Find puzzles that share elements (either as requirements or rewards)
  const puzzleElementMap = new Map<string, Set<string>>(); // puzzleId -> Set of elementIds
  
  // Build puzzle-element relationships
  edges.forEach(edge => {
    const relationshipType = edge.data?.relationshipType;
    if (relationshipType === 'requirement' || relationshipType === 'reward') {
      const sourceIsPuzzle = puzzleNodeIds.has(edge.source);
      const targetIsPuzzle = puzzleNodeIds.has(edge.target);
      
      if (relationshipType === 'requirement' && targetIsPuzzle) {
        // Element -> Puzzle (element is requirement)
        if (!puzzleElementMap.has(edge.target)) {
          puzzleElementMap.set(edge.target, new Set());
        }
        puzzleElementMap.get(edge.target)!.add(edge.source);
      } else if (relationshipType === 'reward' && sourceIsPuzzle) {
        // Puzzle -> Element (element is reward)
        if (!puzzleElementMap.has(edge.source)) {
          puzzleElementMap.set(edge.source, new Set());
        }
        puzzleElementMap.get(edge.source)!.add(edge.target);
      }
    }
  });
  
  // Find puzzle pairs that share elements
  const puzzlePairs = new Map<string, Set<string>>(); // element -> Set of puzzles connected to it
  
  puzzleElementMap.forEach((elements, puzzleId) => {
    elements.forEach(elementId => {
      if (!puzzlePairs.has(elementId)) {
        puzzlePairs.set(elementId, new Set());
      }
      puzzlePairs.get(elementId)!.add(puzzleId);
    });
  });
  
  // Create grouping edges between puzzles that share multiple elements
  const puzzleGroupingEdges: GraphEdge[] = [];
  const processedPairs = new Set<string>();
  
  puzzlePairs.forEach((puzzles, elementId) => {
    if (puzzles.size > 1) {
      const puzzleArray = Array.from(puzzles);
      
      // Create virtual edges between all puzzle pairs sharing this element
      for (let i = 0; i < puzzleArray.length - 1; i++) {
        for (let j = i + 1; j < puzzleArray.length; j++) {
          const puzzle1 = puzzleArray[i];
          const puzzle2 = puzzleArray[j];
          
          if (!puzzle1 || !puzzle2) continue;
          
          const pairKey = [puzzle1, puzzle2].sort().join('-');
          
          if (!processedPairs.has(pairKey)) {
            // Create bidirectional virtual edges for alignment
            puzzleGroupingEdges.push({
              id: `group-${puzzle1}-${puzzle2}`,
              source: puzzle1,
              target: puzzle2,
              type: 'default',
              style: { display: 'none' },
              data: {
                isVirtual: true,
                relationshipType: 'puzzle-grouping',
                weight: 500, // Medium weight for grouping
              },
            });
            
            processedPairs.add(pairKey);
            
            const puzzle1Name = puzzleNames.get(puzzle1) || puzzle1;
            const puzzle2Name = puzzleNames.get(puzzle2) || puzzle2;
            const elementName = elementNames.get(elementId) || elementId;
          }
        }
      }
    }
  });
  
  logger.debug(`Created ${puzzleGroupingEdges.length} puzzle grouping edges`);
  console.groupEnd();
  
  return puzzleGroupingEdges;
}

/**
 * Calculate comprehensive statistics for virtual edge injection analysis.
 * 
 * Analyzes the complete graph (including virtual edges) to provide detailed
 * metrics about optimization effectiveness, data integrity, and layout enhancement.
 * 
 * **Statistical Categories:**
 * - **Dual-role Analysis**: Elements serving multiple purposes
 * - **Virtual Edge Counts**: Dependency and grouping edge quantities
 * - **Data Integrity**: Dead ends and missing providers
 * - **Optimization Effectiveness**: Layout enhancement metrics
 * 
 * @param nodes - Complete array of all graph nodes
 * @param edges - Complete array of edges (should include virtual edges for full analysis)
 * @returns VirtualEdgeStats object with detailed metrics and issue lists
 * 
 * @remarks
 * **Use Cases:**
 * - Debug layout optimization issues
 * - Monitor data quality (missing providers, dead ends)
 * - Analyze puzzle dependency complexity
 * - Validate virtual edge injection effectiveness
 * 
 * **Data Integrity Indicators:**
 * - `deadEndElements`: Elements provided but never consumed (potential data issues)
 * - `missingProviders`: Elements consumed but never provided (broken dependencies)
 * - `dualRoleElements`: Elements with complex provider/consumer relationships
 * 
 * @example
 * ```typescript
 * const stats = getVirtualEdgeStats(nodes, edgesWithVirtual);
 * 
 * console.log(`Optimization Summary:`);
 * console.log(`- ${stats.dualRoleElements} dual-role elements`);
 * console.log(`- ${stats.virtualDependencyEdges} dependency edges`);
 * console.log(`- ${stats.puzzleGroupingEdges} grouping edges`);
 * 
 * if (stats.missingProviders.length > 0) {
 *   console.warn('Data integrity issues:', stats.missingProviders);
 * }
 * ```
 * 
 * Complexity: O(V + E) where V = nodes, E = edges
 */
export function getVirtualEdgeStats(nodes: GraphNode[], edges: GraphEdge[]): VirtualEdgeStats {
  const puzzleNodeIds = new Set(
    nodes
      .filter(n => n.type === 'puzzle')
      .map(n => n.id)
  );
  
  const providers = new Map<string, string[]>();
  const consumers = new Map<string, string[]>();
  
  // Analyze edges
  edges.forEach(edge => {
    const relationshipType = edge.data?.relationshipType;
    
    if (relationshipType === 'reward' && puzzleNodeIds.has(edge.source)) {
      if (!providers.has(edge.target)) providers.set(edge.target, []);
      providers.get(edge.target)!.push(edge.source);
    }
    
    if (relationshipType === 'requirement' && puzzleNodeIds.has(edge.target)) {
      if (!consumers.has(edge.source)) consumers.set(edge.source, []);
      consumers.get(edge.source)!.push(edge.target);
    }
  });
  
  // Calculate stats
  const dualRoleElements = Array.from(providers.keys())
    .filter(id => consumers.has(id)).length;
  
  const virtualDependencyEdges = edges
    .filter(e => e.data?.relationshipType === 'virtual-dependency').length;
  
  const puzzleGroupingEdges = edges
    .filter(e => e.data?.relationshipType === 'puzzle-grouping').length;
  
  const deadEndElements = Array.from(providers.keys())
    .filter(id => !consumers.has(id));
  
  const missingProviders = Array.from(consumers.keys())
    .filter(id => !providers.has(id));
  
  return {
    dualRoleElements,
    virtualDependencyEdges,
    puzzleGroupingEdges,
    deadEndElements,
    missingProviders,
  };
}