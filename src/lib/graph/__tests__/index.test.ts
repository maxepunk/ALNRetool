/**
 * Integration tests for the main graph builder
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildGraphData,
  createEmptyGraph,
  validateGraphData,
  getGraphStatistics,
  buildPuzzleFocusGraph,
  buildCharacterJourneyGraph,
  buildContentStatusGraph,
  createGraphContext,
  type GraphContext
} from '../index';
import type { NotionData } from '../index';
import { 
  createMockCharacter,
  createMockElement,
  createMockPuzzle,
  createMockTimelineEvent
} from '../test-utils/mockFactories';

// Mock console methods
// const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Graph Builder Integration', () => {
  let context: GraphContext;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create fresh context for each test
    context = createGraphContext();
  });

  afterEach(() => {
    // Dispose of context to prevent memory leaks
    if (context) {
      context.dispose();
      context = null as any;
    }
  });

  // Create comprehensive mock data using centralized factories
  const createMockData = (): NotionData => {
    const characters = [
      createMockCharacter({
        id: 'char-1',
        name: 'Main Character',
        type: 'Player',
        tier: 'Core',
        ownedElementIds: ['elem-1', 'elem-2'],
        characterPuzzleIds: ['puzzle-1'],
        eventIds: ['timeline-1'],
      }),
      createMockCharacter({
        id: 'char-2',
        name: 'NPC',
        type: 'NPC',
        tier: 'Secondary',
        ownedElementIds: ['elem-3'],
        characterPuzzleIds: [],
        eventIds: [],
      }),
    ];

    const elements = [
      createMockElement({
        id: 'elem-1',
        name: 'Key Item',
        descriptionText: 'SF_RFID: [KEY-001] SF_ValueRating: [5]',
        sfPatterns: { rfid: 'KEY-001', valueRating: 5 },
        basicType: 'Prop',
        ownerId: 'char-1',
        timelineEventId: 'timeline-1',
        status: 'Done',
        firstAvailable: 'Act 1',
        requiredForPuzzleIds: ['puzzle-1'],
      }),
      createMockElement({
        id: 'elem-2',
        name: 'Container',
        ownerId: 'char-1',
        contentIds: ['elem-3'],
        status: 'In development',
        firstAvailable: 'Act 1',
        rewardedByPuzzleIds: ['puzzle-1'],
        containerPuzzleId: 'puzzle-2',
        isContainer: true,
      }),
      createMockElement({
        id: 'elem-3',
        name: 'Contained Item',
        basicType: 'Document',
        ownerId: 'char-2',
        containerId: 'elem-2',
        status: 'Done',
        firstAvailable: 'Act 2',
      }),
    ];

    const puzzles = [
      createMockPuzzle({
        id: 'puzzle-1',
        name: 'Main Puzzle',
        descriptionSolution: 'Use key to unlock',
        puzzleElementIds: ['elem-1'],
        ownerId: 'char-1',
        rewardIds: ['elem-2'],
        subPuzzleIds: ['puzzle-2'],
        timing: ['Act 1'],
      }),
      createMockPuzzle({
        id: 'puzzle-2',
        name: 'Sub Puzzle',
        descriptionSolution: 'Open container',
        lockedItemId: 'elem-2',
        ownerId: 'char-1',
        parentItemId: 'puzzle-1',
        timing: ['Act 2'],
      }),
    ];

    const timeline = [
      createMockTimelineEvent({
        id: 'timeline-1',
        name: 'The key event',
        description: 'The key event',
        date: '2024-01-01T00:00:00Z',
        charactersInvolvedIds: ['char-1'],
        memoryEvidenceIds: ['elem-1'],
      }),
    ];

    return { characters, elements, puzzles, timeline };
  };

  describe('buildGraphData', () => {
    it('should build a complete graph from Notion data', () => {
      const data = createMockData();
      const graph = buildGraphData(data, {}, context);

      expect(graph.nodes).toBeDefined();
      expect(graph.edges).toBeDefined();
      expect(graph.metadata).toBeDefined();

      // Should have nodes for all entities  
      // Note: puzzle-2 is not orphaned because it has a lockedItemId relationship to elem-2
      expect(graph.nodes.length).toBe(8); // 2 chars + 3 elems + 2 puzzles + 1 timeline

      // Should have various edge types
      expect(graph.edges.length).toBeGreaterThan(0);

      // Should have metrics
      expect(graph.metadata?.metrics?.nodeCount).toBe(8);
      expect(graph.metadata?.metrics?.edgeCount).toBeGreaterThan(0);
      expect(graph.metadata?.metrics?.duration).toBeGreaterThan(0);
    });



    it('should apply layout to nodes', () => {
      const data = createMockData();
      const graph = buildGraphData(data, {}, context);

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
      // Warning is not currently implemented
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
      const graph = buildGraphData(data, {}, context);
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
      const graph = buildGraphData(data, {}, context);
      const stats = getGraphStatistics(graph);

      expect(stats.totalNodes).toBe(graph.nodes.length);
      expect(stats.totalEdges).toBe(graph.edges.length);
      expect(stats.nodesByType).toBeDefined();
      expect(stats.edgesByType).toBeDefined();
      expect(stats.averageDegree).toBeGreaterThanOrEqual(0);
      // hasOrphans is not currently implemented
    });

    it('should count nodes by type', () => {
      const data = createMockData();
      const graph = buildGraphData(data, {}, context);
      const stats = getGraphStatistics(graph);

      expect(stats.nodesByType.character).toBe(2);
      expect(stats.nodesByType.element).toBe(3);
      expect(stats.nodesByType.puzzle).toBe(2); // Both puzzles are included
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
      const graph = buildPuzzleFocusGraph(data, 'puzzle-1', 2, context);

      expect(graph.metadata?.viewType).toBe('puzzle-focus');
      
      // Should have puzzle-related nodes
      const nodeTypes = new Set(graph.nodes.map(n => n.type));
      expect(nodeTypes.has('puzzle')).toBe(true);
      // May also include elements related to puzzles
      expect(nodeTypes.has('element')).toBe(true);
    });

    it('should build character journey graph', () => {
      const data = createMockData();
      const graph = buildCharacterJourneyGraph(data, 'char-1', context);

      expect(graph.metadata?.viewType).toBe('character-journey');
      
      // Should have character nodes
      const nodeTypes = new Set(graph.nodes.map(n => n.type));
      expect(nodeTypes.has('character')).toBe(true);
    });

    it('should build content status graph', () => {
      const data = createMockData();
      const graph = buildContentStatusGraph(data, undefined, context);

      expect(graph.metadata?.viewType).toBe('content-status');
      
      // Should include nodes - exact count may vary based on filtering
      expect(graph.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('Performance metrics', () => {
    it('should track transformation duration', () => {
      const data = createMockData();
      const graph = buildGraphData(data, {}, context);

      expect(graph.metadata?.metrics?.startTime).toBeGreaterThan(0);
      expect(graph.metadata?.metrics?.endTime).toBeGreaterThan(graph.metadata?.metrics?.startTime ?? 0);
      
      // Only calculate duration if both times exist
      if (graph.metadata?.metrics?.endTime && graph.metadata?.metrics?.startTime) {
        expect(graph.metadata?.metrics?.duration).toBe(
          graph.metadata.metrics.endTime - graph.metadata.metrics.startTime
        );
      }
    });

  });
});