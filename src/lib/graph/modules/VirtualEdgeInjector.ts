/**
 * Virtual Edge Injection Module
 * 
 * Handles creation of virtual edges for layout optimization, including:
 * - Dual-role element detection and dependency enforcement
 * - Puzzle grouping for better vertical alignment
 * - Dead-end and missing provider detection
 */

import type { GraphNode, GraphEdge } from '../types';

/**
 * Virtual edge injection statistics
 */
export interface VirtualEdgeStats {
  dualRoleElements: number;
  virtualDependencyEdges: number;
  puzzleGroupingEdges: number;
  deadEndElements: string[];
  missingProviders: string[];
}

/**
 * Detect dual-role elements and create virtual edges for proper layout
 * 
 * @description Identifies elements that serve as both rewards and requirements,
 * then creates virtual edges between puzzles to enforce correct dependency ordering.
 * 
 * @param nodes - All graph nodes
 * @param edges - All graph edges
 * @returns Original edges plus virtual edges for layout
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
  
  console.log('[Virtual Edge] Found puzzles:', Array.from(puzzleNames.entries()).map(([id, name]) => `${name} (${id})`));

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
      
      console.log(`  Reward edge: ${puzzleNames.get(source)} → ${elementNames.get(target) || target}`);
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
      
      console.log(`  Requirement edge: ${elementNames.get(source) || source} → ${puzzleNames.get(target)}`);
      requirementCount++;
    }
  }
  
  console.log(`[Virtual Edge] Total: ${rewardCount} reward edges, ${requirementCount} requirement edges`);
  console.groupEnd();

  // Analyze element roles
  console.group('[Virtual Edge] Element role analysis');
  
  // Elements that are only provided (never consumed)
  const onlyProvided = Array.from(providers.keys()).filter(id => !consumers.has(id));
  if (onlyProvided.length > 0) {
    console.log('Elements only provided (dead ends):', onlyProvided.map(id => elementNames.get(id) || id));
  }
  
  // Elements that are only consumed (never provided)
  const onlyConsumed = Array.from(consumers.keys()).filter(id => !providers.has(id));
  if (onlyConsumed.length > 0) {
    console.log('Elements only consumed (missing providers):', onlyConsumed.map(id => elementNames.get(id) || id));
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
      
      console.log(`🔗 Dual-role element: "${elementName}" (${elementId})`);
      console.log(`  ✓ Provided by: ${providerPuzzles.map(id => puzzleNames.get(id)).join(', ')}`);
      console.log(`  → Required by: ${consumerPuzzles.map(id => puzzleNames.get(id)).join(', ')}`);

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
            console.log(`  ➕ Virtual edge created: ${providerName} → ${consumerName}`);
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

  console.log(`[Virtual Edge] Summary: Injected ${virtualEdges.length} virtual edges total`);
  console.groupEnd();
  
  // Return original edges plus virtual edges
  return [...edges, ...virtualEdges];
}

/**
 * Create virtual edges for puzzle grouping to improve vertical alignment
 * 
 * @param edges - Original graph edges
 * @param puzzleNodeIds - Set of puzzle node IDs
 * @param puzzleNames - Mapping of puzzle IDs to names
 * @param elementNames - Mapping of element IDs to names
 * @returns Array of puzzle grouping edges
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
            console.log(`  🔗 Grouping edge: "${puzzle1Name}" ↔ "${puzzle2Name}" (shared: ${elementName})`);
          }
        }
      }
    }
  });
  
  console.log(`Created ${puzzleGroupingEdges.length} puzzle grouping edges`);
  console.groupEnd();
  
  return puzzleGroupingEdges;
}

/**
 * Get virtual edge statistics for analysis
 * 
 * @param nodes - Graph nodes
 * @param edges - Graph edges including virtual edges
 * @returns Statistics about virtual edge injection
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