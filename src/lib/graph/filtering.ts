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
  // No connection depth? Just show filtered nodes
  if (!connectionDepth || connectionDepth === 0) {
    return filteredNodeIds;
  }
  
  // Node selected? Show connections from that node only
  if (selectedNodeId && filteredNodeIds.has(selectedNodeId)) {
    // Use all edges to find connections (not just filtered edges)
    // This ensures we can see the full neighborhood of the selected node
    return getNodesWithinDepth(selectedNodeId, edges, connectionDepth);
  }
  
  // No selection? Show connections from ALL filtered nodes
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