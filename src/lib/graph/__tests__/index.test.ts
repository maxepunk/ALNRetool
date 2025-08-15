/**
 * Integration tests for the main graph builder
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildGraphData,
  createEmptyGraph,
  validateGraphData,
  getGraphStatistics,
  buildPuzzleFocusGraph,
  buildCharacterJourneyGraph,
  buildContentStatusGraph,
} from '../index';
import type { NotionData } from '../index';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

// Mock console methods
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Graph Builder Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Create comprehensive mock data
  const createMockData = (): NotionData => {
    const characters: Character[] = [
      {
        id: 'char-1',
        name: 'Main Character',
        type: 'Player',
        tier: 'Core',
        ownedElementIds: ['elem-1', 'elem-2'],
        associatedElementIds: [],
        characterPuzzleIds: ['puzzle-1'],
        eventIds: ['timeline-1'],
        connections: [],
        primaryAction: '',
        characterLogline: '',
        overview: '',
        emotionTowardsCEO: '',
      },
      {
        id: 'char-2',
        name: 'NPC',
        type: 'NPC',
        tier: 'Secondary',
        ownedElementIds: ['elem-3'],
        associatedElementIds: [],
        characterPuzzleIds: [],
        eventIds: [],
        connections: [],
        primaryAction: '',
        characterLogline: '',
        overview: '',
        emotionTowardsCEO: '',
      },
    ];

    const elements: Element[] = [
      {
        id: 'elem-1',
        name: 'Key Item',
        descriptionText: 'SF_RFID: [KEY-001] SF_ValueRating: [5]',
        sfPatterns: { rfid: 'KEY-001', valueRating: 5 },
        basicType: 'Prop',
        ownerId: 'char-1',
        containerId: undefined,
        contentIds: [],
        timelineEventId: 'timeline-1',
        status: 'Done',
        firstAvailable: 'Act 1',
        requiredForPuzzleIds: ['puzzle-1'],
        rewardedByPuzzleIds: [],
        containerPuzzleId: undefined,
        narrativeThreads: [],
        associatedCharacterIds: [],
        puzzleChain: [],
        productionNotes: '',
        filesMedia: [],
        contentLink: undefined,
        isContainer: false,
      },
      {
        id: 'elem-2',
        name: 'Container',
        descriptionText: '',
        sfPatterns: {},
        basicType: 'Prop',
        ownerId: 'char-1',
        containerId: undefined,
        contentIds: ['elem-3'],
        timelineEventId: undefined,
        status: 'In development',
        firstAvailable: 'Act 1',
        requiredForPuzzleIds: [],
        rewardedByPuzzleIds: ['puzzle-1'],
        containerPuzzleId: 'puzzle-2',
        narrativeThreads: [],
        associatedCharacterIds: [],
        puzzleChain: [],
        productionNotes: '',
        filesMedia: [],
        contentLink: undefined,
        isContainer: true,
      },
      {
        id: 'elem-3',
        name: 'Contained Item',
        descriptionText: '',
        sfPatterns: {},
        basicType: 'Document',
        ownerId: 'char-2',
        containerId: 'elem-2',
        contentIds: [],
        timelineEventId: undefined,
        status: 'Done',
        firstAvailable: 'Act 2',
        requiredForPuzzleIds: [],
        rewardedByPuzzleIds: [],
        containerPuzzleId: undefined,
        narrativeThreads: [],
        associatedCharacterIds: [],
        puzzleChain: [],
        productionNotes: '',
        filesMedia: [],
        contentLink: undefined,
        isContainer: false,
      },
    ];

    const puzzles: Puzzle[] = [
      {
        id: 'puzzle-1',
        name: 'Main Puzzle',
        descriptionSolution: 'Use key to unlock',
        puzzleElementIds: ['elem-1'],
        lockedItemId: undefined,
        ownerId: 'char-1',
        rewardIds: ['elem-2'],
        parentItemId: undefined,
        subPuzzleIds: ['puzzle-2'],
        storyReveals: [],
        timing: ['Act 1'],
        narrativeThreads: [],
        assetLink: undefined,
      },
      {
        id: 'puzzle-2',
        name: 'Sub Puzzle',
        descriptionSolution: 'Open container',
        puzzleElementIds: [],
        lockedItemId: 'elem-2',
        ownerId: 'char-1',
        rewardIds: [],
        parentItemId: 'puzzle-1',
        subPuzzleIds: [],
        storyReveals: [],
        timing: ['Act 2'],
        narrativeThreads: [],
        assetLink: undefined,
      },
    ];

    const timeline: TimelineEvent[] = [
      {
        id: 'timeline-1',
        name: 'The key event',
        description: 'The key event',
        date: '2024-01-01T00:00:00Z',
        charactersInvolvedIds: ['char-1'],
        memoryEvidenceIds: ['elem-1'],
        memTypes: [],
        notes: '',
        lastEditedTime: '2024-01-01T00:00:00Z',
      },
    ];

    return { characters, elements, puzzles, timeline };
  };

  describe('buildGraphData', () => {
    it('should build a complete graph from Notion data', () => {
      const data = createMockData();
      const graph = buildGraphData(data);

      expect(graph.nodes).toBeDefined();
      expect(graph.edges).toBeDefined();
      expect(graph.metadata).toBeDefined();

      // Should have nodes for all entities
      expect(graph.nodes.length).toBe(8); // 2 chars + 3 elems + 2 puzzles + 1 timeline

      // Should have various edge types
      expect(graph.edges.length).toBeGreaterThan(0);

      // Should have metrics
      expect(graph.metadata?.metrics?.nodeCount).toBe(8);
      expect(graph.metadata?.metrics?.edgeCount).toBeGreaterThan(0);
      expect(graph.metadata?.metrics?.duration).toBeGreaterThan(0);
    });

    it('should filter edges by relationship type', () => {
      const data = createMockData();
      const graph = buildGraphData(data, {
        filterRelationships: ['ownership'],
      });

      // Should only have ownership edges
      const edgeTypes = new Set(graph.edges.map(e => e.data?.relationshipType));
      expect(edgeTypes.size).toBe(1);
      expect(edgeTypes.has('ownership')).toBe(true);
    });

    it('should remove orphan nodes when requested', () => {
      const data = createMockData();
      // Add an orphan character with no relationships
      data.characters.push({
        id: 'orphan-char',
        name: 'Orphan',
        type: 'NPC',
        tier: 'Tertiary',
        ownedElementIds: [],
        associatedElementIds: [],
        characterPuzzleIds: [],
        eventIds: [],
        connections: [],
        primaryAction: '',
        characterLogline: '',
        overview: '',
        emotionTowardsCEO: '',
      });

      const graphWithOrphans = buildGraphData(data, {
        includeOrphans: true,
      });

      const graphWithoutOrphans = buildGraphData(data, {
        includeOrphans: false,
      });

      expect(graphWithOrphans.nodes.length).toBeGreaterThan(graphWithoutOrphans.nodes.length);
    });

    it('should apply layout to nodes', () => {
      const data = createMockData();
      const graph = buildGraphData(data);

      // All nodes should have positions
      graph.nodes.forEach(node => {
        expect(node.position).toBeDefined();
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      });
    });

    it('should handle empty data gracefully', () => {
      const emptyData: NotionData = {
        characters: [],
        elements: [],
        puzzles: [],
        timeline: [],
      };

      const graph = buildGraphData(emptyData);

      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
      expect(graph.metadata?.metrics?.nodeCount).toBe(0);
      expect(graph.metadata?.metrics?.edgeCount).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith('No nodes created from input data');
    });

    it('should use different layouts for different views', () => {
      const data = createMockData();

      const puzzleGraph = buildGraphData(data, {
        viewType: 'puzzle-focus',
      });

      const characterGraph = buildGraphData(data, {
        viewType: 'character-journey',
      });

      expect(puzzleGraph.metadata?.viewType).toBe('puzzle-focus');
      expect(characterGraph.metadata?.viewType).toBe('character-journey');

      // Layouts might position nodes differently
      // This is hard to test without mocking the layout functions
    });
  });

  describe('createEmptyGraph', () => {
    it('should create an empty graph structure', () => {
      const graph = createEmptyGraph();

      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
      expect(graph.metadata?.metrics?.nodeCount).toBe(0);
      expect(graph.metadata?.metrics?.edgeCount).toBe(0);
      expect(graph.metadata?.metrics?.duration).toBe(0);
      expect(graph.metadata?.timestamp).toBeDefined();
    });
  });

  describe('validateGraphData', () => {
    it('should validate a valid graph', () => {
      const data = createMockData();
      const graph = buildGraphData(data);
      const validation = validateGraphData(graph);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should detect missing node IDs', () => {
      const graph = createEmptyGraph();
      graph.nodes.push({
        id: '',
        type: 'character',
        position: { x: 0, y: 0 },
        data: {} as any,
      });

      const validation = validateGraphData(graph);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Node at index 0 missing ID');
    });

    it('should detect missing positions', () => {
      const graph = createEmptyGraph();
      graph.nodes.push({
        id: 'node-1',
        type: 'character',
        position: undefined as any,
        data: {} as any,
      });

      const validation = validateGraphData(graph);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Node node-1 missing position');
    });

    it('should detect invalid positions', () => {
      const graph = createEmptyGraph();
      graph.nodes.push({
        id: 'node-1',
        type: 'character',
        position: { x: 'invalid' as any, y: 0 },
        data: {} as any,
      });

      const validation = validateGraphData(graph);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Node node-1 has invalid position');
    });

    it('should detect missing edge properties', () => {
      const graph = createEmptyGraph();
      graph.edges.push({
        id: '',
        source: '',
        target: '',
      } as any);

      const validation = validateGraphData(graph);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('missing ID'))).toBe(true);
      expect(validation.errors.some(e => e.includes('missing source'))).toBe(true);
      expect(validation.errors.some(e => e.includes('missing target'))).toBe(true);
    });

    it('should detect edges referencing non-existent nodes', () => {
      const graph = createEmptyGraph();
      graph.nodes.push({
        id: 'node-1',
        type: 'character',
        position: { x: 0, y: 0 },
        data: {} as any,
      });
      graph.edges.push({
        id: 'edge-1',
        source: 'node-1',
        target: 'non-existent',
      } as any);

      const validation = validateGraphData(graph);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        'Edge edge-1 references non-existent target: non-existent'
      );
    });
  });

  describe('getGraphStatistics', () => {
    it('should calculate graph statistics', () => {
      const data = createMockData();
      const graph = buildGraphData(data);
      const stats = getGraphStatistics(graph);

      expect(stats.totalNodes).toBe(graph.nodes.length);
      expect(stats.totalEdges).toBe(graph.edges.length);
      expect(stats.nodesByType).toBeDefined();
      expect(stats.edgesByType).toBeDefined();
      expect(stats.avgConnectivity).toBeGreaterThan(0);
      expect(typeof stats.hasOrphans).toBe('boolean');
    });

    it('should count nodes by type', () => {
      const data = createMockData();
      const graph = buildGraphData(data);
      const stats = getGraphStatistics(graph);

      expect(stats.nodesByType.character).toBe(2);
      expect(stats.nodesByType.element).toBe(3);
      expect(stats.nodesByType.puzzle).toBe(2);
      expect(stats.nodesByType.timeline).toBe(1);
    });

    it('should detect orphan nodes', () => {
      const graph = createEmptyGraph();
      graph.nodes.push(
        {
          id: 'connected-1',
          type: 'character',
          position: { x: 0, y: 0 },
          data: { metadata: { entityType: 'character' } } as any,
        },
        {
          id: 'connected-2',
          type: 'element',
          position: { x: 100, y: 0 },
          data: { metadata: { entityType: 'element' } } as any,
        },
        {
          id: 'orphan',
          type: 'puzzle',
          position: { x: 200, y: 0 },
          data: { metadata: { entityType: 'puzzle' } } as any,
        }
      );
      graph.edges.push({
        id: 'edge-1',
        source: 'connected-1',
        target: 'connected-2',
        data: { relationshipType: 'ownership' },
      } as any);

      const stats = getGraphStatistics(graph);

      expect(stats.hasOrphans).toBe(true);
    });
  });

  describe('View-specific builders', () => {
    it('should build puzzle focus graph', () => {
      const data = createMockData();
      const graph = buildPuzzleFocusGraph(data);

      expect(graph.metadata?.viewType).toBe('puzzle-focus');
      
      // Should only have puzzle-related edges
      const edgeTypes = new Set(graph.edges.map(e => e.data?.relationshipType));
      expect(edgeTypes.has('requirement')).toBe(true);
      expect(edgeTypes.has('reward')).toBe(true);
      expect(edgeTypes.has('chain')).toBe(true);
    });

    it('should build character journey graph', () => {
      const data = createMockData();
      const graph = buildCharacterJourneyGraph(data);

      expect(graph.metadata?.viewType).toBe('character-journey');
      
      // Should only have character-related edges
      const edgeTypes = new Set(graph.edges.map(e => e.data?.relationshipType));
      expect(edgeTypes.has('ownership')).toBe(true);
      expect(edgeTypes.has('timeline')).toBe(true);
    });

    it('should build content status graph', () => {
      const data = createMockData();
      const graph = buildContentStatusGraph(data);

      expect(graph.metadata?.viewType).toBe('content-status');
      
      // Should include all nodes that were successfully transformed
      // We have 2 characters + 3 elements + 2 puzzles + 1 timeline = 8 total entities
      expect(graph.nodes.length).toBe(8);
    });
  });

  describe('Performance metrics', () => {
    it('should track transformation duration', () => {
      const data = createMockData();
      const graph = buildGraphData(data);

      expect(graph.metadata?.metrics?.startTime).toBeGreaterThan(0);
      expect(graph.metadata?.metrics?.endTime).toBeGreaterThan(graph.metadata?.metrics?.startTime ?? 0);
      
      // Only calculate duration if both times exist
      if (graph.metadata?.metrics?.endTime && graph.metadata?.metrics?.startTime) {
        expect(graph.metadata?.metrics?.duration).toBe(
          graph.metadata.metrics.endTime - graph.metadata.metrics.startTime
        );
      }
    });

    it('should calculate layout metrics', () => {
      const data = createMockData();
      const graph = buildGraphData(data);

      const layoutMetrics = graph.metadata?.metrics?.layoutMetrics;
      expect(layoutMetrics).toBeDefined();
      
      if (layoutMetrics) {
        expect(layoutMetrics.width).toBeGreaterThan(0);
        expect(layoutMetrics.height).toBeGreaterThan(0);
        expect(layoutMetrics.density).toBeGreaterThan(0);
        expect(typeof layoutMetrics.overlap).toBe('number');
      }
    });
  });
});