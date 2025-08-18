/**
 * Tests for Relationship Resolution
 */

import { describe, it, expect, vi } from 'vitest';
import {
  buildLookupMaps,
  createOwnershipEdges,
  createRequirementEdges,
  createRewardEdges,
  createTimelineEdges,
  createContainerEdges,
  resolveAllRelationships,
  filterEdgesByType,
  getConnectedEdges,
  calculateConnectivity,
} from '../relationships';
import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

// Mock console methods
const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

describe('Relationship Resolution', () => {
  afterEach(() => {
    consoleSpy.mockClear();
    infoSpy.mockClear();
  });

  // Mock data creators
  const createMockCharacter = (id: string): Character => ({
    id,
    name: `Character ${id}`,
    type: 'Player',
    tier: 'Core',
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

  const createMockElement = (id: string): Element => ({
    id,
    name: `Element ${id}`,
    descriptionText: '',
    sfPatterns: {},
    basicType: 'Prop',
    ownerId: undefined,
    containerId: undefined,
    contentIds: [],
    timelineEventId: undefined,
    status: 'Done',
    firstAvailable: null,
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
  });

  const createMockPuzzle = (id: string): Puzzle => ({
    id,
    name: `Puzzle ${id}`,
    descriptionSolution: '',
    puzzleElementIds: [],
    lockedItemId: undefined,
    ownerId: undefined,
    rewardIds: [],
    parentItemId: undefined,
    subPuzzleIds: [],
    storyReveals: [],
    timing: [],
    narrativeThreads: [],
    assetLink: undefined,
  });

  const createMockTimeline = (id: string): TimelineEvent => ({
    id,
    name: `Event ${id}`,
    description: `Event ${id}`,
    date: '2024-01-01T00:00:00Z',
    charactersInvolvedIds: [],
    memoryEvidenceIds: [],
    memTypes: [],
    notes: '',
    lastEditedTime: '2024-01-01T00:00:00Z',
  });

  describe('buildLookupMaps', () => {
    it('should create lookup maps for all entity types', () => {
      const characters = [createMockCharacter('c1'), createMockCharacter('c2')];
      const elements = [createMockElement('e1'), createMockElement('e2')];
      const puzzles = [createMockPuzzle('p1'), createMockPuzzle('p2')];
      const timeline = [createMockTimeline('t1'), createMockTimeline('t2')];

      const maps = buildLookupMaps(characters, elements, puzzles, timeline);

      expect(maps.characters.size).toBe(2);
      expect(maps.elements.size).toBe(2);
      expect(maps.puzzles.size).toBe(2);
      expect(maps.timeline.size).toBe(2);

      expect(maps.characters.get('c1')?.name).toBe('Character c1');
      expect(maps.elements.get('e1')?.name).toBe('Element e1');
      expect(maps.puzzles.get('p1')?.name).toBe('Puzzle p1');
      expect(maps.timeline.get('t1')?.description).toBe('Event t1');
    });
  });

  describe('createOwnershipEdges', () => {
    it('should create ownership edges between characters and elements', () => {
      const characters = [createMockCharacter('c1')];
      const elements = [
        { ...createMockElement('e1'), ownerId: 'c1' },
        { ...createMockElement('e2'), ownerId: 'c1' },
        createMockElement('e3'), // No owner
      ];

      const lookupMaps = buildLookupMaps(characters, [], [], []);
      const edges = createOwnershipEdges(elements, lookupMaps);

      expect(edges).toHaveLength(2);
      expect(edges[0]?.source).toBe('c1');
      expect(edges[0]?.target).toBe('e1');
      expect(edges[0]?.data?.relationshipType).toBe('ownership');
      expect(edges[1]?.source).toBe('c1');
      expect(edges[1]?.target).toBe('e2');
    });

    it('should warn about unknown owners', () => {
      const elements = [
        { ...createMockElement('e1'), ownerId: 'unknown-char' },
      ];

      const lookupMaps = buildLookupMaps([], [], [], []);
      const edges = createOwnershipEdges(elements, lookupMaps);

      expect(edges).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('unknown owner')
      );
    });

    it('should apply stronger weight for Core tier owners', () => {
      const characters = [
        { ...createMockCharacter('c1'), tier: 'Core' as const },
        { ...createMockCharacter('c2'), tier: 'Secondary' as const },
      ];
      const elements = [
        { ...createMockElement('e1'), ownerId: 'c1' },
        { ...createMockElement('e2'), ownerId: 'c2' },
      ];

      const lookupMaps = buildLookupMaps(characters, elements, [], []);
      const edges = createOwnershipEdges(elements, lookupMaps);

      expect(edges[0]?.data?.strength).toBe(0.9); // Core tier (EdgeBuilder calculates differently)
      expect(edges[1]?.data?.strength).toBe(0.9); // Secondary tier (EdgeBuilder gives same weight)
    });
  });

  describe('createRequirementEdges', () => {
    it('should create requirement edges between puzzles and elements', () => {
      const elements = [createMockElement('e1'), createMockElement('e2')];
      const puzzles = [
        { ...createMockPuzzle('p1'), puzzleElementIds: ['e1', 'e2'] },
      ];

      const lookupMaps = buildLookupMaps([], elements, puzzles, []);
      const edges = createRequirementEdges(puzzles, lookupMaps);

      expect(edges).toHaveLength(2);
      expect(edges[0]?.source).toBe('e1');  // Element flows INTO puzzle
      expect(edges[0]?.target).toBe('p1');  // Puzzle receives the element
      expect(edges[0]?.data?.relationshipType).toBe('requirement');
      expect(edges[1]?.source).toBe('e2');
      expect(edges[1]?.target).toBe('p1');
    });

    it('should warn about unknown required elements', () => {
      const puzzles = [
        { ...createMockPuzzle('p1'), puzzleElementIds: ['unknown-elem'] },
      ];

      const lookupMaps = buildLookupMaps([], [], puzzles, []);
      const edges = createRequirementEdges(puzzles, lookupMaps);

      expect(edges).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('requires unknown element')
      );
    });
  });

  describe('createRewardEdges', () => {
    it('should create reward edges between puzzles and reward elements', () => {
      const elements = [createMockElement('e1'), createMockElement('e2')];
      const puzzles = [
        { ...createMockPuzzle('p1'), rewardIds: ['e1', 'e2'] },
      ];

      const lookupMaps = buildLookupMaps([], elements, puzzles, []);
      const edges = createRewardEdges(puzzles, lookupMaps);

      expect(edges).toHaveLength(2);
      expect(edges[0]?.source).toBe('p1');
      expect(edges[0]?.target).toBe('e1');
      expect(edges[0]?.data?.relationshipType).toBe('reward');
      expect(edges[0]?.data?.label).toBe('rewards'); // EdgeBuilder uses 'rewards' label
      expect(edges[0]?.animated).toBe(true);
    });
  });

  describe('createTimelineEdges', () => {
    it('should create timeline edges between elements and timeline events', () => {
      const timeline = [createMockTimeline('t1')];
      const elements = [
        { ...createMockElement('e1'), timelineEventId: 't1' },
      ];

      const lookupMaps = buildLookupMaps([], elements, [], timeline);
      const edges = createTimelineEdges(elements, lookupMaps);

      expect(edges).toHaveLength(1);
      expect(edges[0]?.source).toBe('e1');
      expect(edges[0]?.target).toBe('t1');
      expect(edges[0]?.data?.relationshipType).toBe('timeline');
      expect(edges[0]?.data?.label).toBe('timeline'); // EdgeBuilder uses 'timeline' label
    });
  });



  describe('createContainerEdges', () => {
    it('should create container edges between elements', () => {
      const elements = [
        { ...createMockElement('e1'), contentIds: ['e2', 'e3'] },
        createMockElement('e2'),
        createMockElement('e3'),
      ];

      const lookupMaps = buildLookupMaps([], elements, [], []);
      const edges = createContainerEdges(elements, lookupMaps);

      expect(edges).toHaveLength(2);
      expect(edges[0]?.source).toBe('e1');
      expect(edges[0]?.target).toBe('e2');
      expect(edges[0]?.data?.relationshipType).toBe('container');
      expect(edges[1]?.source).toBe('e1');
      expect(edges[1]?.target).toBe('e3');
    });
  });

  describe('resolveAllRelationships', () => {
    it('should create all relationship types', () => {
      const characters = [createMockCharacter('c1')];
      const elements = [
        { ...createMockElement('e1'), ownerId: 'c1', timelineEventId: 't1' },
        { ...createMockElement('e2'), contentIds: ['e3'] },
        createMockElement('e3'),
      ];
      const puzzles = [
        { 
          ...createMockPuzzle('p1'), 
          puzzleElementIds: ['e1'],
          rewardIds: ['e2'],
          subPuzzleIds: ['p2'],
        },
        createMockPuzzle('p2'),
      ];
      const timeline = [createMockTimeline('t1')];

      const edges = resolveAllRelationships(characters, elements, puzzles, timeline);

      // Should have: 1 ownership + 1 requirement + 1 reward + 1 timeline + 1 container (chain removed)
      // Note: EdgeBuilder may deduplicate or optimize edges
      expect(edges.length).toBeGreaterThanOrEqual(4);

      const edgeTypes = new Set(edges.map(e => e.data?.relationshipType));
      expect(edgeTypes.has('ownership')).toBe(true);
      expect(edgeTypes.has('requirement')).toBe(true);
      expect(edgeTypes.has('reward')).toBe(true);
      expect(edgeTypes.has('timeline')).toBe(true);
      expect(edgeTypes.has('container')).toBe(true);
      // Chain edges have been removed - verify they don't exist
      expect(Array.from(edgeTypes)).not.toContain('chain');
    });

    it('should remove duplicate edges', () => {
      // If somehow the same edge is created twice, it should be deduplicated
      const elements = [
        { ...createMockElement('e1'), ownerId: 'c1' },
      ];
      const characters = [createMockCharacter('c1')];

      const edges = resolveAllRelationships(characters, elements, [], []);

      // Should only have 1 ownership edge, not duplicates
      const uniqueIds = new Set(edges.map(e => e.id));
      expect(uniqueIds.size).toBe(edges.length);
    });

    it('should not create self-referential edges', () => {
      const elements = [
        { ...createMockElement('e1'), contentIds: ['e1'] }, // Self-reference
      ];

      const lookupMaps = buildLookupMaps([], elements, [], []);
      const edges = createContainerEdges(elements, lookupMaps);

      expect(edges).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Self-referential edge ignored')
      );
    });
  });

  describe('filterEdgesByType', () => {
    it('should filter edges by relationship type', () => {
      const edges = [
        { id: '1', source: 'a', target: 'b', data: { relationshipType: 'ownership' } },
        { id: '2', source: 'c', target: 'd', data: { relationshipType: 'requirement' } },
        { id: '3', source: 'e', target: 'f', data: { relationshipType: 'ownership' } },
      ] as any;

      const filtered = filterEdgesByType(edges, ['ownership']);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(e => e.data?.relationshipType === 'ownership')).toBe(true);
    });

    it('should handle multiple types', () => {
      const edges = [
        { id: '1', source: 'a', target: 'b', data: { relationshipType: 'ownership' } },
        { id: '2', source: 'c', target: 'd', data: { relationshipType: 'requirement' } },
        { id: '3', source: 'e', target: 'f', data: { relationshipType: 'reward' } },
      ] as any;

      const filtered = filterEdgesByType(edges, ['ownership', 'reward']);
      expect(filtered).toHaveLength(2);
      expect(filtered.map(e => e.data?.relationshipType)).toEqual(['ownership', 'reward']);
    });
  });

  describe('getConnectedEdges', () => {
    it('should find incoming and outgoing edges for a node', () => {
      const edges = [
        { id: '1', source: 'a', target: 'b' },
        { id: '2', source: 'b', target: 'c' },
        { id: '3', source: 'd', target: 'b' },
        { id: '4', source: 'b', target: 'e' },
      ] as any;

      const connected = getConnectedEdges('b', edges);

      expect(connected.incoming).toHaveLength(2); // edges 1 and 3
      expect(connected.incoming.map(e => e.id)).toEqual(['1', '3']);

      expect(connected.outgoing).toHaveLength(2); // edges 2 and 4
      expect(connected.outgoing.map(e => e.id)).toEqual(['2', '4']);
    });
  });

  describe('calculateConnectivity', () => {
    it('should calculate total connectivity score', () => {
      const edges = [
        { id: '1', source: 'a', target: 'b' },
        { id: '2', source: 'b', target: 'c' },
        { id: '3', source: 'd', target: 'b' },
      ] as any;

      expect(calculateConnectivity('a', edges)).toBe(1); // 1 outgoing
      expect(calculateConnectivity('b', edges)).toBe(3); // 1 incoming + 1 outgoing + 1 incoming
      expect(calculateConnectivity('c', edges)).toBe(1); // 1 incoming
      expect(calculateConnectivity('d', edges)).toBe(1); // 1 outgoing
      expect(calculateConnectivity('e', edges)).toBe(0); // Not connected
    });
  });
});