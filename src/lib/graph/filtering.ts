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
 * Determine which nodes should be visible based on filter mode.
 * Consolidates all filter mode logic into a single pure function.
 */
export function getVisibleNodeIds(
  mode: 'pure' | 'connected' | 'focused',
  filteredNodeIds: Set<string>,
  edges: Edge[],
  focusNodeId: string | null,
  connectionDepth: number | null,
  respectFilters: boolean
): Set<string> {
  // Pure mode: only show filtered nodes
  if (mode === 'pure' || !connectionDepth || connectionDepth <= 0) {
    return filteredNodeIds;
  }
  
  // Focus mode: show N hops from focused node
  if (mode === 'focused' && focusNodeId) {
    const edgesToUse = respectFilters 
      ? edges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target))
      : edges;
    return getNodesWithinDepth(focusNodeId, edgesToUse, connectionDepth);
  }
  
  // Connected mode: show filtered nodes + N hops from each
  if (mode === 'connected') {
    const connectedIds = new Set(filteredNodeIds);
    const baseFilteredEdges = edges.filter(
      e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );
    
    for (const nodeId of filteredNodeIds) {
      const nodesFromStart = getNodesWithinDepth(nodeId, baseFilteredEdges, connectionDepth);
      nodesFromStart.forEach(id => connectedIds.add(id));
    }
    return connectedIds;
  }
  
  // Default fallback
  return filteredNodeIds;
}