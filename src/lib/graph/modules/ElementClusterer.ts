/**
 * Element Clustering Module
 * 
 * Applies post-layout clustering to group elements near their connected puzzles
 * with collision detection to prevent overlaps.
 */

import type { GraphNode, GraphEdge } from '../types';

/**
 * Configuration for element clustering
 */
export interface ClusteringConfig {
  compressionFactor?: number;
  padding?: number;
  xBucketSize?: number;
}

/**
 * Occupied space tracker for collision detection
 */
interface OccupiedRange {
  id: string;
  top: number;
  bottom: number;
}

/**
 * Apply post-layout clustering to group elements near their connected puzzles
 * with collision detection to prevent overlaps
 * 
 * @param nodes - Array of positioned nodes
 * @param edges - Array of edges between nodes
 * @param compressionFactor - How much to compress element spacing (0.4-0.8)
 * @returns Nodes with adjusted positions for better clustering
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
  
  console.log('Puzzle-element groups:', puzzleToElements.size);
  
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
      .filter(n => n !== undefined) as GraphNode[];
    
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
    if (overlapCount > 0) {
      console.log(`Clustered ${elementNodes.length} elements around puzzle "${puzzleLabel}" (${overlapCount} overlaps prevented)`);
    } else {
      console.log(`Clustered ${elementNodes.length} elements around puzzle "${puzzleLabel}"`);
    }
  });
  
  console.groupEnd();
  return adjustedNodes;
}

/**
 * Determine the appropriate height for a node based on its entity type
 * 
 * @param node - The node to calculate height for
 * @returns Height in pixels for the node
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
 * Calculate clustering statistics
 * 
 * @param originalNodes - Nodes before clustering
 * @param clusteredNodes - Nodes after clustering
 * @returns Statistics about the clustering operation
 */
export function getClusteringStats(originalNodes: GraphNode[], clusteredNodes: GraphNode[]): {
  movedNodes: number;
  averageMovement: number;
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