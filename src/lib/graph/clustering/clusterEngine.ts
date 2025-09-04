import type { GraphNode, GraphEdge, ClusterDefinition, TimelineEvent } from '@/lib/graph/types';

export interface ClusteringRules {
  puzzleChains: boolean;
  characterGroups: boolean;
  timelineSequences: boolean;
  minClusterSize: number;
}

// Simple groupBy implementation (no lodash dependency)
function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const key = keyFn(item);
    (groups[key] = groups[key] || []).push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function computePuzzleChains(
  nodes: GraphNode[],
  _edges: GraphEdge[],
  minSize: number
): Map<string, ClusterDefinition> {
  const clusters = new Map<string, ClusterDefinition>();
  const puzzleNodes = nodes.filter(n => n.data.metadata.entityType === 'puzzle');

  puzzleNodes.forEach(puzzle => {
    const subPuzzleIds = puzzle.data.metadata.subPuzzleIds || [];
    if (subPuzzleIds.length >= minSize) {
      clusters.set(`cluster-puzzle-${puzzle.id}`, {
        id: `cluster-puzzle-${puzzle.id}`,
        label: `${puzzle.data.label} Chain`,
        clusterType: 'puzzle',
        childIds: [puzzle.id, ...subPuzzleIds],
        defaultExpanded: false
      });
    }
  });

  return clusters;
}

export function computeCharacterGroups(
  nodes: GraphNode[],
  edges: GraphEdge[],
  minSize: number
): Map<string, ClusterDefinition> {
  const clusters = new Map<string, ClusterDefinition>();

  // Group owned elements with characters using ownership edges
  const ownershipEdges = edges.filter(e =>
    e.data?.relationshipType === 'ownership' ||
    e.data?.relationshipType === 'owner'
  );

  const characterOwnership = new Map<string, string[]>();

  ownershipEdges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);

    if (sourceNode?.data.metadata.entityType === 'character') {
      const owned = characterOwnership.get(sourceNode.id) || [];
      owned.push(edge.target);
      characterOwnership.set(sourceNode.id, owned);
    }
  });

  characterOwnership.forEach((ownedIds, charId) => {
    if (ownedIds.length >= minSize) {
      const charNode = nodes.find(n => n.id === charId);
      if (charNode) {
        clusters.set(`cluster-char-${charId}`, {
          id: `cluster-char-${charId}`,
          label: `${charNode.data.label}'s Items`,
          clusterType: 'character',
          childIds: [charId, ...ownedIds],
          defaultExpanded: false
        });
      }
    }
  });

  return clusters;
}

export function computeTimelineGroups(
  nodes: GraphNode[],
  _edges: GraphEdge[],
  minSize: number
): Map<string, ClusterDefinition> {
  const clusters = new Map<string, ClusterDefinition>();
  const timelineNodes = nodes.filter(n => n.data.metadata.entityType === 'timeline');

  // Group by date
  const nodesByDate = groupBy(timelineNodes, node => {
    const timeline = node.data.entity as TimelineEvent;
    return timeline.date?.split('T')[0] || 'unknown';
  });

  Object.entries(nodesByDate).forEach(([date, dateNodes]) => {
    if (dateNodes.length >= minSize && date !== 'unknown') {
      clusters.set(`cluster-timeline-${date}`, {
        id: `cluster-timeline-${date}`,
        label: `Events: ${date}`,
        clusterType: 'timeline',
        childIds: dateNodes.map(n => n.id),
        defaultExpanded: false
      });
    }
  });

  return clusters;
}

export function computeClusters(
  nodes: GraphNode[],
  edges: GraphEdge[],
  rules: ClusteringRules
): Map<string, ClusterDefinition> {
  const allClusters = new Map<string, ClusterDefinition>();

  if (rules.puzzleChains) {
    const puzzleClusters = computePuzzleChains(nodes, edges, rules.minClusterSize);
    puzzleClusters.forEach((cluster, id) => allClusters.set(id, cluster));
  }

  if (rules.characterGroups) {
    const charClusters = computeCharacterGroups(nodes, edges, rules.minClusterSize);
    charClusters.forEach((cluster, id) => allClusters.set(id, cluster));
  }

  if (rules.timelineSequences) {
    const timelineClusters = computeTimelineGroups(nodes, edges, rules.minClusterSize);
    timelineClusters.forEach((cluster, id) => allClusters.set(id, cluster));
  }

  // Post-processing: Prevent a node from being in multiple clusters
  const assignedNodes = new Set<string>();
  const finalClusters = new Map<string, ClusterDefinition>();

  allClusters.forEach((cluster, id) => {
    const unassignedChildren = cluster.childIds.filter(childId => !assignedNodes.has(childId));

    if (unassignedChildren.length >= rules.minClusterSize) {
      const newCluster = { ...cluster, childIds: unassignedChildren };
      finalClusters.set(id, newCluster);
      unassignedChildren.forEach(childId => assignedNodes.add(childId));
    }
  });

  return finalClusters;
}
