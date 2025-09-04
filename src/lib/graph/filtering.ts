import type { Edge } from '@xyflow/react';

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
  const baseFilteredEdges = edges.filter(
    e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );
  
  for (const nodeId of filteredNodeIds) {
    const connections = getNodesWithinDepth(nodeId, baseFilteredEdges, connectionDepth);
    connections.forEach(id => connectedIds.add(id));
  }
  
  return connectedIds;
}