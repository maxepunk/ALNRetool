import { describe, test, expect } from 'vitest';
import { computePuzzleChains, computeCharacterGroups, computeTimelineGroups } from './clusterEngine';
import type { GraphNode, GraphEdge, EntityType, NodeMetadata } from '@/lib/graph/types';

// Helper to create a test node
const createTestNode = (id: string, type: EntityType, metadata: Partial<NodeMetadata> = {}, entity: any = {}): GraphNode => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {
    label: `${type}-${id}`,
    metadata: {
      entityType: type,
      entityId: id,
      ...metadata,
    },
    entity: {
      id,
      name: `${type}-${id}`,
      ...entity
    },
  },
});

// Helper to create a test edge
const createTestEdge = (source: string, target: string, relationshipType: string): GraphEdge => ({
  id: `${source}-${target}`,
  source,
  target,
  data: {
    relationshipType: relationshipType as any,
  },
});

describe('Clustering Engine', () => {
  describe('computePuzzleChains', () => {
    test('groups puzzles with sub-puzzles that meet min size', () => {
      const nodes = [
        createTestNode('puzzle-1', 'puzzle', { subPuzzleIds: ['puzzle-2', 'puzzle-3'] }),
        createTestNode('puzzle-2', 'puzzle'),
        createTestNode('puzzle-3', 'puzzle'),
      ];
      const clusters = computePuzzleChains(nodes, [], 3);
      expect(clusters.size).toBe(1);
      const cluster = clusters.get('cluster-puzzle-puzzle-1');
      expect(cluster).toBeDefined();
      expect(cluster?.childIds).toEqual(expect.arrayContaining(['puzzle-1', 'puzzle-2', 'puzzle-3']));
      expect(cluster?.clusterType).toBe('puzzle');
    });

    test('respects minimum size threshold', () => {
      const nodes = [
        createTestNode('puzzle-1', 'puzzle', { subPuzzleIds: ['puzzle-2'] }),
        createTestNode('puzzle-2', 'puzzle'),
      ];
      const clusters = computePuzzleChains(nodes, [], 3);
      expect(clusters.size).toBe(0);
    });
  });

  describe('computeCharacterGroups', () => {
    test('groups owned elements with characters', () => {
      const nodes: GraphNode[] = [
        createTestNode('char-1', 'character'),
        createTestNode('elem-1', 'element'),
        createTestNode('elem-2', 'element'),
        createTestNode('elem-3', 'element'),
      ];
      const edges: GraphEdge[] = [
        createTestEdge('char-1', 'elem-1', 'ownership'),
        createTestEdge('char-1', 'elem-2', 'ownership'),
        createTestEdge('char-1', 'elem-3', 'ownership'),
      ];
      const clusters = computeCharacterGroups(nodes, edges, 3); // char + 2 items = 3
      expect(clusters.size).toBe(1);
      const cluster = clusters.get('cluster-char-char-1');
      expect(cluster).toBeDefined();
      expect(cluster?.childIds).toEqual(expect.arrayContaining(['char-1', 'elem-1', 'elem-2', 'elem-3']));
      expect(cluster?.clusterType).toBe('character');
    });

    test('does not group if size is less than minSize', () => {
        const nodes: GraphNode[] = [
            createTestNode('char-1', 'character'),
            createTestNode('elem-1', 'element'),
        ];
        const edges: GraphEdge[] = [
            createTestEdge('char-1', 'elem-1', 'ownership'),
        ];
        const clusters = computeCharacterGroups(nodes, edges, 3);
        expect(clusters.size).toBe(0);
    });
  });

  describe('computeTimelineGroups', () => {
    test('groups timeline events by date', () => {
        const nodes: GraphNode[] = [
            createTestNode('event-1', 'timeline', {}, { date: '2024-01-15T10:00:00Z' }),
            createTestNode('event-2', 'timeline', {}, { date: '2024-01-15T12:00:00Z' }),
            createTestNode('event-3', 'timeline', {}, { date: '2024-01-16T10:00:00Z' }),
            createTestNode('event-4', 'timeline', {}, { date: '2024-01-15T14:00:00Z' }),
        ];
        const clusters = computeTimelineGroups(nodes, [], 3);
        expect(clusters.size).toBe(1);
        const cluster = clusters.get('cluster-timeline-2024-01-15');
        expect(cluster).toBeDefined();
        expect(cluster?.childIds).toEqual(expect.arrayContaining(['event-1', 'event-2', 'event-4']));
        expect(cluster?.clusterType).toBe('timeline');
    });

    test('does not group events with different dates or unknown dates', () => {
        const nodes: GraphNode[] = [
            createTestNode('event-1', 'timeline', {}, { date: '2024-01-15T10:00:00Z' }),
            createTestNode('event-2', 'timeline', {}, { date: '2024-01-16T12:00:00Z' }),
            createTestNode('event-3', 'timeline', {}, { date: undefined }),
        ];
        const clusters = computeTimelineGroups(nodes, [], 2);
        expect(clusters.size).toBe(0);
    });
  });
});
