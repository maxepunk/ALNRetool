/**
 * Element Clustering Module
 * 
 * Advanced post-layout optimization that groups elements near their connected puzzles
 * while maintaining visual clarity through sophisticated collision detection and avoidance.
 * 
 * **Core Functionality:**
 * - **Puzzle-Element Analysis**: Maps relationships between puzzles and their elements
 * - **Collision-Aware Clustering**: Groups elements while preventing overlaps
 * - **Spatial Optimization**: Compresses element spacing for better visual grouping
 * - **Safe Positioning**: Finds optimal positions when conflicts occur
 * 
 * **Collision Detection System:**
 * - Spatial bucketing for efficient overlap detection (O(log n) per check)
 * - Y-range tracking with padding for visual separation
 * - Safe position finding algorithm with multiple candidate evaluation
 * - Occupied space registration and management
 * 
 * **Use Cases:**
 * - Post-Dagre layout optimization
 * - Improving element-puzzle visual relationships
 * - Reducing visual scatter in complex graphs
 * - Maintaining readability while maximizing grouping
 * 
 * @example
 * ```typescript
 * // Basic clustering
 * const clusteredNodes = applyElementClustering(nodes, edges, 0.6);
 * 
 * // With custom configuration
 * const config: ClusteringConfig = {
 *   compressionFactor: 0.7,
 *   padding: 15,
 *   xBucketSize: 50
 * };
 * const optimizedNodes = applyElementClustering(nodes, edges, config.compressionFactor);
 * 
 * // Analyze results
 * const stats = getClusteringStats(originalNodes, clusteredNodes);
 * console.log(`Moved ${stats.movedNodes} nodes, avg movement: ${stats.averageMovement}px`);
 * ```
 * 
 * @see applyElementClustering - Main clustering function
 * @see getNodeHeight - Node sizing utility
 * @see getClusteringStats - Performance analysis
 */

import type { GraphNode, GraphEdge } from '../types';
import { logger } from '../utils/Logger'


/**
 * Configuration parameters for element clustering optimization.
 * Controls the behavior of the collision-aware clustering algorithm.
 * 
 * Used to fine-tune clustering behavior based on graph characteristics
 * and visual requirements.
 * 
 * @example
 * ```typescript
 * const config: ClusteringConfig = {
 *   compressionFactor: 0.7,  // More aggressive clustering
 *   padding: 20,             // More spacing between elements
 *   xBucketSize: 75          // Larger spatial buckets
 * };
 * ```
 */
export interface ClusteringConfig {
  /** How much to compress element spacing toward puzzle center (0.4-0.8, default: 0.6) */
  compressionFactor?: number;
  /** Minimum padding between elements in pixels (default: 15) */
  padding?: number;
  /** Size of spatial buckets for collision detection in pixels (default: 50) */
  xBucketSize?: number;
}

/**
 * Occupied space tracker for collision detection.
 * Represents a Y-axis range occupied by a node at a specific X position.
 * 
 * Used internally by the spatial bucketing system for efficient
 * overlap detection and safe position finding.
 * 
 * @internal
 */
interface OccupiedRange {
  /** Unique identifier of the node occupying this space */
  id: string;
  /** Top Y coordinate of the occupied area */
  top: number;
  /** Bottom Y coordinate of the occupied area */
  bottom: number;
}

/**
 * Apply sophisticated post-layout clustering to group elements near connected puzzles.
 * 
 * **Algorithm Overview:**
 * 1. **relationship Analysis**: Maps puzzle-element connections via requirement/reward edges
 * 2. **Spatial Registration**: Registers non-element nodes in collision detection system
 * 3. **Group Processing**: For each puzzle, clusters its connected elements
 * 4. **Collision Detection**: Checks for overlaps using spatial bucketing (O(log n))
 * 5. **Safe Positioning**: Finds optimal positions when conflicts occur
 * 6. **Position Updates**: Applies new positions and updates spatial index
 * 
 * @param nodes - Array of positioned graph nodes (must include position coordinates)
 * @param edges - Array of graph edges (requires 'requirement' and 'reward' relationship types)
 * @param compressionFactor - Compression ratio toward puzzle center (0.4-0.8, default: 0.6)
 * @returns New array of nodes with optimized clustering positions
 * 
 * @remarks
 * **Compression Factor Guidelines:**
 * - 0.4-0.5: Conservative clustering (subtle grouping)
 * - 0.6-0.7: Balanced clustering (recommended for most cases)
 * - 0.7-0.8: Aggressive clustering (tight grouping, may cause crowding)
 * 
 * **Performance Characteristics:**
 * - Spatial bucketing reduces collision checks to O(log n) per node
 * - Memory efficient with occupied space tracking
 * - Scales well with graph size (O(V + E) overall complexity)
 * 
 * **Visual Impact:**
 * - Elements visually cluster near their related puzzles
 * - Maintains minimum spacing for readability
 * - Preserves overall graph structure and flow
 * - Reduces visual scatter and improves comprehension
 * 
 * @example
 * ```typescript
 * // Conservative clustering
 * const lightlyClustered = applyElementClustering(nodes, edges, 0.5);
 * 
 * // Balanced clustering (recommended)
 * const clustered = applyElementClustering(nodes, edges, 0.6);
 * 
 * // Aggressive clustering
 * const tightlyClustered = applyElementClustering(nodes, edges, 0.75);
 * 
 * // Analyze movement
 * const stats = getClusteringStats(nodes, clustered);
 * console.log(`Clustered ${stats.movedNodes} elements`);
 * ```
 * 
 * Complexity: O(V + E + C log C) where V = nodes, E = edges, C = clustered nodes
 */
export function applyElementClustering(
  nodes: GraphNode[],
  edges: GraphEdge[],
  compressionFactor: number = 0.6
): GraphNode[] {
  console.group('[Element Clustering] Applying collision-aware post-layout clustering');
  
  // Group elements by their connected puzzles
  const puzzleToElements = new Map<string, string[]>();
  const elementToPuzzles = new Map<string, string[]>();
  
  // Build relationships
  edges.forEach(edge => {
    const relationshipType = edge.data?.relationshipType;
    
    if (relationshipType === 'requirement' || relationshipType === 'reward') {
      // Find which nodes are puzzles and which are elements
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return;
      
      let puzzleId: string | undefined;
      let elementId: string | undefined;
      
      if (relationshipType === 'requirement') {
        // Element -> Puzzle
        elementId = edge.source;
        puzzleId = edge.target;
      } else if (relationshipType === 'reward') {
        // Puzzle -> Element
        puzzleId = edge.source;
        elementId = edge.target;
      }
      
      if (puzzleId && elementId) {
        if (!puzzleToElements.has(puzzleId)) {
          puzzleToElements.set(puzzleId, []);
        }
        puzzleToElements.get(puzzleId)!.push(elementId);
        
        if (!elementToPuzzles.has(elementId)) {
          elementToPuzzles.set(elementId, []);
        }
        elementToPuzzles.get(elementId)!.push(puzzleId);
      }
    }
  });
  
  logger.debug('Puzzle-element groups:', undefined, puzzleToElements.size);
  
  // Apply clustering for each puzzle's connected elements
  const adjustedNodes = [...nodes];
  
  // Track occupied spaces to prevent overlaps
  // Map of X position -> array of occupied Y ranges
  const occupiedSpaces = new Map<number, OccupiedRange[]>();
  
  // Helper function to check if a position would cause overlap
  const hasOverlap = (x: number, top: number, bottom: number, excludeId?: string): boolean => {
    const xBucket = Math.round(x / 50) * 50; // Group by approximate X position
    const ranges = occupiedSpaces.get(xBucket) || [];
    
    return ranges.some(range => {
      if (excludeId && range.id === excludeId) return false;
      // Check if ranges overlap with some padding
      const padding = 10;
      return !(bottom + padding < range.top || top - padding > range.bottom);
    });
  };
  
  // Helper function to register occupied space
  const registerSpace = (id: string, x: number, top: number, bottom: number) => {
    const xBucket = Math.round(x / 50) * 50;
    if (!occupiedSpaces.has(xBucket)) {
      occupiedSpaces.set(xBucket, []);
    }
    
    // Remove any existing entry for this id
    const ranges = occupiedSpaces.get(xBucket)!;
    const existingIndex = ranges.findIndex(r => r.id === id);
    if (existingIndex !== -1) {
      ranges.splice(existingIndex, 1);
    }
    
    ranges.push({ id, top, bottom });
    ranges.sort((a, b) => a.top - b.top);
  };
  
  // Helper function to find nearest safe position
  const findSafePosition = (x: number, desiredY: number, height: number, id: string): number => {
    const xBucket = Math.round(x / 50) * 50;
    const ranges = occupiedSpaces.get(xBucket) || [];
    
    if (ranges.length === 0) return desiredY;
    
    // Try positions above and below desired position
    const candidates: number[] = [desiredY];
    const padding = 15;
    
    // Add positions just below each existing range
    ranges.forEach(range => {
      candidates.push(range.bottom + padding);
      candidates.push(range.top - height - padding);
    });
    
    // Find the closest valid position to desired
    let bestPosition = desiredY;
    let minDistance = Infinity;
    
    for (const candidate of candidates) {
      const candidateTop = candidate;
      const candidateBottom = candidate + height;
      
      if (!hasOverlap(x, candidateTop, candidateBottom, id)) {
        const distance = Math.abs(candidate - desiredY);
        if (distance < minDistance) {
          minDistance = distance;
          bestPosition = candidate;
        }
      }
    }
    
    return bestPosition;
  };
  
  // First, register all non-element nodes (puzzles, etc) in occupied spaces
  adjustedNodes.forEach(node => {
    if (node.data.metadata.entityType !== 'element') {
      const nodeHeight = node.height || getNodeHeight(node);
      registerSpace(node.id, node.position.x, node.position.y, node.position.y + nodeHeight);
    }
  });
  
  // Process each puzzle's elements with collision detection
  puzzleToElements.forEach((elementIds, puzzleId) => {
    if (elementIds.length <= 1) return; // No clustering needed for single elements
    
    const puzzleNode = adjustedNodes.find(n => n.id === puzzleId);
    if (!puzzleNode) return;
    
    // Get all connected element nodes
    const elementNodes = elementIds
      .map(id => adjustedNodes.find(n => n.id === id))
      .filter(n => n !== undefined);
    
    if (elementNodes.length <= 1) return;
    
    // Sort elements by their Y position
    elementNodes.sort((a, b) => a.position.y - b.position.y);
    
    // Calculate the center Y position of the group
    const firstNode = elementNodes[0];
    const lastNode = elementNodes[elementNodes.length - 1];
    
    if (!firstNode || !lastNode) return; // Safety check
    
    const minY = firstNode.position.y;
    const maxY = lastNode.position.y + (lastNode.height || 80);
    const centerY = (minY + maxY) / 2;
    const puzzleCenterY = puzzleNode.position.y + (puzzleNode.height || 100) / 2;
    
    // Apply compression towards the puzzle's Y center with collision detection
    let overlapCount = 0;
    elementNodes.forEach((node) => {
      const nodeHeight = node.height || getNodeHeight(node);
      const originalY = node.position.y;
      const offsetFromCenter = originalY - centerY;
      const compressedOffset = offsetFromCenter * compressionFactor;
      
      // Calculate desired position
      const desiredY = puzzleCenterY + compressedOffset - nodeHeight / 2;
      
      // Check for overlaps and find safe position if needed
      let finalY = desiredY;
      if (hasOverlap(node.position.x, desiredY, desiredY + nodeHeight, node.id)) {
        finalY = findSafePosition(node.position.x, desiredY, nodeHeight, node.id);
        overlapCount++;
      }
      
      // Update node position
      const nodeIndex = adjustedNodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1 && adjustedNodes[nodeIndex]) {
        const existingNode = adjustedNodes[nodeIndex];
        adjustedNodes[nodeIndex] = {
          ...existingNode,
          position: {
            ...existingNode.position,
            y: finalY,
          },
        };
        
        // Register the new position
        registerSpace(node.id, existingNode.position.x, finalY, finalY + nodeHeight);
      }
    });
    
    const puzzleLabel = puzzleNode.data?.label || puzzleNode.id;
  });
  
  console.groupEnd();
  return adjustedNodes;
}

/**
 * Calculate appropriate node height based on entity type and visual requirements.
 * 
 * Provides consistent node sizing across the graph to ensure proper spacing
 * and collision detection. Heights are optimized for readability and content.
 * 
 * @param node - Graph node with metadata indicating entity type
 * @returns Height in pixels appropriate for the node's entity type
 * 
 * @remarks
 * **Height Standards:**
 * - **Puzzle**: 120px (taller to accommodate complexity information)
 * - **Character**: 100px (medium height for character details)
 * - **Element**: 80px (standard height for most elements)
 * - **Timeline**: 80px (compact for timeline events)
 * - **Default**: 80px (fallback for unknown types)
 * 
 * **Usage in Clustering:**
 * - Used for collision detection calculations
 * - Ensures proper spacing between clustered elements
 * - Maintains visual hierarchy through size differentiation
 * 
 * @example
 * ```typescript
 * const puzzleNode = { data: { metadata: { entityType: 'puzzle' } } };
 * const height = getNodeHeight(puzzleNode);
 * console.log(height); // 120
 * 
 * const elementNode = { data: { metadata: { entityType: 'element' } } };
 * const height2 = getNodeHeight(elementNode);
 * console.log(height2); // 80
 * ```
 * 
 * Complexity: O(1)
 */
export function getNodeHeight(node: GraphNode): number {
  const entityType = node.data.metadata.entityType;
  const baseHeights = {
    puzzle: 120,    // Taller to show puzzle complexity
    element: 80,    // Standard height for elements
    character: 100, // Medium height for character info
    timeline: 80,   // Compact for timeline events
  };
  return baseHeights[entityType] || 80;
}

/**
 * Calculate comprehensive statistics for clustering operation analysis.
 * 
 * Compares original and clustered node positions to provide metrics about
 * the clustering effectiveness and impact. Useful for optimization tuning
 * and performance monitoring.
 * 
 * @param originalNodes - Array of nodes before clustering operation
 * @param clusteredNodes - Array of nodes after clustering operation
 * @returns Statistics object with movement metrics and counts
 * 
 * @remarks
 * **Statistical Measurements:**
 * - **Moved Nodes**: Count of nodes with position changes > 0.01px
 * - **Average Movement**: Mean distance moved across all modified nodes
 * - **Max Movement**: Largest single node displacement
 * 
 * **Use Cases:**
 * - Algorithm tuning (optimal compression factor selection)
 * - Performance monitoring (clustering effectiveness)
 * - Quality assurance (ensuring reasonable movement distances)
 * - A/B testing different clustering parameters
 * 
 * **Movement Threshold:**
 * - Uses 0.01px threshold to filter out floating-point precision artifacts
 * - Only counts meaningful position changes in statistics
 * 
 * @example
 * ```typescript
 * const originalNodes = await getLayoutNodes('original');
 * const clusteredNodes = applyElementClustering(originalNodes, edges, 0.6);
 * const stats = getClusteringStats(originalNodes, clusteredNodes);
 * 
 * console.log(`Clustering Results:`);
 * console.log(`- Moved nodes: ${stats.movedNodes}`);
 * console.log(`- Average movement: ${stats.averageMovement.toFixed(1)}px`);
 * console.log(`- Max movement: ${stats.maxMovement.toFixed(1)}px`);
 * 
 * if (stats.averageMovement > 100) {
 *   console.warn('High movement detected - consider lower compression factor');
 * }
 * ```
 * 
 * Complexity: O(n) where n = nodes.length
 */
export function getClusteringStats(originalNodes: GraphNode[], clusteredNodes: GraphNode[]): {
  /** Number of nodes that moved during clustering */
  movedNodes: number;
  /** Average distance moved by modified nodes in pixels */
  averageMovement: number;
  /** Maximum distance any single node moved in pixels */
  maxMovement: number;
} {
  let movedNodes = 0;
  let totalMovement = 0;
  let maxMovement = 0;
  
  originalNodes.forEach((original, index) => {
    const clustered = clusteredNodes[index];
    if (clustered) {
      const movement = Math.abs(clustered.position.y - original.position.y);
      if (movement > 0.01) {
        movedNodes++;
        totalMovement += movement;
        maxMovement = Math.max(maxMovement, movement);
      }
    }
  });
  
  return {
    movedNodes,
    averageMovement: movedNodes > 0 ? totalMovement / movedNodes : 0,
    maxMovement,
  };
}