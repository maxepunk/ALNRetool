import { describe, test, expect } from 'vitest';
import { computePuzzleChains, computeCharacterGroups, computeTimelineGroups } from './clusterEngine';
import type { GraphNode, GraphEdge, EntityType, RelationshipType } from '@/lib/graph/types';

// Helper to create a test node
const createTestNode = (id: string, entityType: EntityType, data: any = {}): GraphNode => ({
  id,
  position: { x: 0, y: 0 },
  data: {
    label: `Test ${entityType} ${id}`,
    entity: { id, name: `Test ${entityType} ${id}`, ...data.entity },
    metadata: {
      entityType,
      entityId: id,
      ...data.metadata,
    },
  },
});

// Helper to create a test edge
const createTestEdge = (source: string, target: string, relationshipType: RelationshipType): GraphEdge => ({
  id: `${source}-${target}`,
  source,
  target,
  data: {
    relationshipType,
  },
});

describe('Clustering Engine', () => {
  describe('computePuzzleChains', () => {
    test('groups puzzles with sub-puzzles', () => {
      const nodes = [
        createTestNode('puzzle-1', 'puzzle', { metadata: { subPuzzleIds: ['puzzle-2', 'puzzle-3'] } }),
        createTestNode('puzzle-2', 'puzzle'),
        createTestNode('puzzle-3', 'puzzle')
      ];

      const clusters = computePuzzleChains(nodes, [], 2);

      expect(clusters.size).toBe(1);
      expect(clusters.get('cluster-puzzle-puzzle-1')).toMatchObject({
        clusterType: 'puzzle',
        childIds: expect.arrayContaining(['puzzle-1', 'puzzle-2', 'puzzle-3'])
      });
    });

    test('respects minimum size threshold', () => {
      const nodes = [
        createTestNode('puzzle-1', 'puzzle', { metadata: { subPuzzleIds: ['puzzle-2'] } })
      ];

      const clusters = computePuzzleChains(nodes, [], 3);
      expect(clusters.size).toBe(0);
    });
  });

  describe('computeCharacterGroups', () => {
    test('groups owned elements with characters', () => {
      const nodes = [
        createTestNode('char-1', 'character'),
        createTestNode('elem-1', 'element'),
        createTestNode('elem-2', 'element'),
        createTestNode('elem-3', 'element')
      ];

      const edges = [
        createTestEdge('char-1', 'elem-1', 'ownership'),
        createTestEdge('char-1', 'elem-2', 'ownership'),
        createTestEdge('char-1', 'elem-3', 'ownership')
      ];

      const clusters = computeCharacterGroups(nodes, edges, 3);

      expect(clusters.size).toBe(1);
      expect(clusters.get('cluster-char-char-1')).toMatchObject({
        clusterType: 'character',
        childIds: expect.arrayContaining(['char-1', 'elem-1', 'elem-2', 'elem-3'])
      });
    });
  });

  describe('computeTimelineGroups', () => {
    test('groups timeline events by date', () => {
      const nodes = [
        createTestNode('event-1', 'timeline', { entity: { date: '2024-01-01T10:00:00Z' } }),
        createTestNode('event-2', 'timeline', { entity: { date: '2024-01-01T12:00:00Z' } }),
        createTestNode('event-3', 'timeline', { entity: { date: '2024-01-02T10:00:00Z' } }),
        createTestNode('event-4', 'timeline', { entity: { date: '2024-01-01T14:00:00Z' } }),
      ];

      const clusters = computeTimelineGroups(nodes, [], 3);

      expect(clusters.size).toBe(1);
      expect(clusters.get('cluster-timeline-2024-01-01')).toMatchObject({
        clusterType: 'timeline',
        childIds: expect.arrayContaining(['event-1', 'event-2', 'event-4']),
      });
    });
  });
});
