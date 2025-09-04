import type { GraphNode, GraphEdge, ClusterDefinition, TimelineEvent, ClusterType } from '@/lib/graph/types';

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
    if (subPuzzleIds.length >= minSize -1) { // A parent with 2 children is a cluster of 3
      const childIds = [puzzle.id, ...subPuzzleIds];
      clusters.set(`cluster-puzzle-${puzzle.id}`, {
        id: `cluster-puzzle-${puzzle.id}`,
        label: `${puzzle.data.label} Chain`,
        clusterType: 'puzzle',
        childIds: childIds,
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

  const ownershipEdges = edges.filter(e =>
    e.data?.relationshipType === 'ownership' ||
    e.data?.relationshipType === 'owner'
  );

  const characterOwnership = new Map<string, string[]>();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  ownershipEdges.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (sourceNode?.data.metadata.entityType === 'character' && targetNode) {
      const owned = characterOwnership.get(sourceNode.id) || [];
      owned.push(targetNode.id);
      characterOwnership.set(sourceNode.id, owned);
    }
  });

  characterOwnership.forEach((ownedIds, charId) => {
    if (ownedIds.length >= minSize) {
      const charNode = nodeMap.get(charId);
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

  const nodesByDate = groupBy(timelineNodes, node => {
    const timeline = node.data.entity as TimelineEvent;
    return timeline.date?.split('T')[0] || 'unknown';
  });

  Object.entries(nodesByDate).forEach(([date, dateNodes]) => {
    if (date !== 'unknown' && dateNodes.length >= minSize) {
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

  return allClusters;
}
