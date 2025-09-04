import type { Edge } from '@xyflow/react';
import type { GraphNode, GraphEdge } from './types';

/**
 * Filter special relationship edges based on visible entity types.
 * Handles Timeline edges (hierarchical filtering) and Association edges (character-element).
 * 
 * @param edges - All edges to filter
 * @param nodes - All visible nodes for entity type detection
 * @param filterEnabled - Whether special edge filtering is enabled
 * @returns Filtered edges array
 */
export function filterSpecialEdges<T extends Edge | GraphEdge>(
  edges: T[],
  nodes: GraphNode[],
  filterEnabled: boolean = false
): T[] {
  // If filtering is disabled, return all edges
  if (!filterEnabled) return edges;

  // Create node map for O(1) lookups
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // Detect which entity types are visible
  const hasElements = nodes.some(n => n.type === 'element');
  const hasCharacters = nodes.some(n => n.type === 'character');
  const hasPuzzles = nodes.some(n => n.type === 'puzzle');
  const hasTimeline = nodes.some(n => n.type === 'timeline');
  
  
  // Filter special edges
  const filtered = edges.filter(edge => {
    const relationshipType = edge.data?.relationshipType;
    
    // Filter Association edges (Character-Element connections)
    if (relationshipType === 'association') {
      // Only show association edges when ONLY Characters and Elements are visible
      const onlyCharactersAndElements = hasCharacters && hasElements && !hasPuzzles && !hasTimeline;
      if (!onlyCharactersAndElements) {
        return false; // Hide association edges
      }
      return true; // Show association edges
    }
    
    // Filter Timeline edges
    if (relationshipType === 'timeline') {
      // Get source and target nodes
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      
      // Filter out timeline->timeline sequential edges
      if (sourceNode?.type === 'timeline' && targetNode?.type === 'timeline') {
        return false;
      }
      
      // Apply filtering hierarchy for timeline->entity edges
      if (sourceNode?.type === 'timeline') {
        // Priority 1: Show timeline->element when elements visible
        if (hasElements && targetNode?.type === 'element') return true;
        
        // Priority 2: Show timeline->character when elements hidden but characters visible
        if (!hasElements && hasCharacters && targetNode?.type === 'character') return true;
        
        // Priority 3: Show timeline->puzzle when both elements and characters hidden
        if (!hasElements && !hasCharacters && hasPuzzles && targetNode?.type === 'puzzle') return true;
        
        // Filter out this timeline edge
        return false;
      }
    }
    
    // Keep all other edges (ownership, puzzle, requirement, reward, etc.)
    return true;
  });
  
  
  return filtered;
}

// Export the old function name for backward compatibility
export const filterTimelineEdges = filterSpecialEdges;

/**
 * Get all nodes within N connections of a focused node.
 * Uses breadth-first search with pre-built adjacency map for O(1) lookups.
 */
export function getNodesWithinDepth(
  focusNodeId: string,
  allEdges: Edge[],
  maxDepth: number
): Set<string> {
  if (!focusNodeId || maxDepth === 0) return new Set([focusNodeId]);

  // Build adjacency map for O(1) neighbor lookups
  const adjacencyMap = new Map<string, Set<string>>();
  for (const edge of allEdges) {
    if (!adjacencyMap.has(edge.source)) adjacencyMap.set(edge.source, new Set());
    if (!adjacencyMap.has(edge.target)) adjacencyMap.set(edge.target, new Set());
    adjacencyMap.get(edge.source)!.add(edge.target);
    adjacencyMap.get(edge.target)!.add(edge.source);
  }

  const visited = new Set<string>([focusNodeId]);
  const queue: { nodeId: string; depth: number }[] = [{ nodeId: focusNodeId, depth: 0 }];

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;

    const neighbors = adjacencyMap.get(nodeId) || new Set();
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({ nodeId: neighborId, depth: depth + 1 });
      }
    }
  }
  return visited;
}

/**
 * Determine which nodes should be visible based on selection and connection depth.
 * Simplified logic without filter modes.
 */
export function getVisibleNodeIds(
  filteredNodeIds: Set<string>,
  edges: Edge[],
  selectedNodeId: string | null,
  connectionDepth: number
): Set<string> {
  // Priority 1: A specific node is selected. Handle this case first.
  if (selectedNodeId && filteredNodeIds.has(selectedNodeId)) {
    // If connection depth is 0 with a selection, show ONLY the selected node.
    if (connectionDepth === 0) {
      return new Set([selectedNodeId]);
    }
    
    // Otherwise, find and show its neighbors.
    return getNodesWithinDepth(selectedNodeId, edges, connectionDepth);
  }
  
  // Priority 2: No selection, and depth is 0. Just show the base filtered nodes.
  // This is now an explicit check and only runs if no node is selected.
  if (connectionDepth === 0) {
    return filteredNodeIds;
  }
  
  // Priority 3: No selection, but we need to expand from all filtered nodes.
  const connectedIds = new Set(filteredNodeIds);
  
  // IMPORTANT: Use ALL edges, not just filtered ones, to properly calculate connections
  // This ensures that when entity types are toggled visible, their connections are preserved
  for (const nodeId of filteredNodeIds) {
    const connections = getNodesWithinDepth(nodeId, edges, connectionDepth);
    connections.forEach(id => connectedIds.add(id));
  }
  
  return connectedIds;
}