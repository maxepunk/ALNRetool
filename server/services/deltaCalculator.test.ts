import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeltaCalculator } from './deltaCalculator.js';
import type { Character, Element, Puzzle, TimelineEvent } from '../../src/types/notion/app.js';

// Mock the logger
vi.mock('../utils/logger.js', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('DeltaCalculator', () => {
  let calculator: DeltaCalculator;

  beforeEach(() => {
    calculator = new DeltaCalculator();
    vi.clearAllMocks();
  });

  // Helper functions for creating test data - defined at top level for all tests
  const createCharacter = (overrides?: Partial<Character>): Character => ({
    id: 'char-1',
    name: 'Test Character',
    type: 'Player',
    tier: 'Core',
    ownedElementIds: ['elem-1', 'elem-2'],
    associatedElementIds: ['elem-3'],
    characterPuzzleIds: ['puzzle-1'],
    eventIds: ['event-1', 'event-2'],
    connections: ['char-2'], // ROLLUP - should not be checked
    primaryAction: 'Test action',
    characterLogline: 'Test logline',
    overview: 'Test overview',
    emotionTowardsCEO: 'Neutral',
    ...overrides
  });

  const createElement = (overrides?: Partial<Element>): Element => ({
    id: 'elem-1',
    name: 'Test Element',
    descriptionText: 'Test description',
    sfPatterns: {},
    basicType: 'Prop',
    ownerId: 'char-1',
    containerId: 'elem-2',
    contentIds: ['elem-3'],
    timelineEventId: 'event-1',
    status: 'Done',
    firstAvailable: 'Act 1',
    requiredForPuzzleIds: ['puzzle-1'],
    rewardedByPuzzleIds: ['puzzle-2'],
    containerPuzzleId: 'puzzle-3',
    associatedCharacterIds: ['char-2'], // ROLLUP - should not be checked  
    puzzleChain: ['puzzle-1'], // ROLLUP - should not be checked
    ...overrides
  });

  const createPuzzle = (overrides?: Partial<Puzzle>): Puzzle => ({
    id: 'puzzle-1',
    name: 'Test Puzzle',
    puzzleElementIds: ['elem-1', 'elem-2'],
    lockedItemId: 'elem-3',
    rewardIds: ['elem-4'],
    storyReveals: ['event-1'], // ROLLUP - should not be checked
    ownerId: 'char-1', // ROLLUP - should not be checked
    unlockedBy: 'char-2', // ROLLUP - should not be checked
    ...overrides
  });

  const createTimeline = (overrides?: Partial<TimelineEvent>): TimelineEvent => ({
    id: 'event-1',
    name: 'Test Event',
    description: 'Test Description',
    date: '2024-01-01',
    charactersInvolvedIds: ['char-1', 'char-2'],
    memoryEvidenceIds: ['elem-1'],
    memTypes: ['Document'], // ROLLUP - should not be checked
    associatedPuzzles: ['puzzle-1'], // ROLLUP - should not be checked
    ...overrides
  });

  // Helper for creating graph nodes
  // TECH_DEBT #7: This helper is unused - integration tests use their own version at line 380
  const createGraphNode = (entity: any, type: string): Node => ({
    id: entity.id,
    type,
    position: { x: 0, y: 0 },
    data: { entity }
  });

  describe('stringArraysEqual', () => {
    // Access private method via type assertion for testing
    const stringArraysEqual = (arr1?: string[], arr2?: string[]) => {
      return (calculator as any).stringArraysEqual(arr1, arr2);
    };

    describe('edge cases', () => {
      it('returns true when both arrays are the same reference', () => {
        const arr = ['a', 'b', 'c'];
        expect(stringArraysEqual(arr, arr)).toBe(true);
      });

      it('returns true when both arrays are undefined', () => {
        expect(stringArraysEqual(undefined, undefined)).toBe(true);
      });

      it('returns false when one array is undefined', () => {
        expect(stringArraysEqual(['a'], undefined)).toBe(false);
        expect(stringArraysEqual(undefined, ['a'])).toBe(false);
      });

      it('returns true when both arrays are empty', () => {
        expect(stringArraysEqual([], [])).toBe(true);
      });

      it('returns false when arrays have different lengths', () => {
        expect(stringArraysEqual(['a'], ['a', 'b'])).toBe(false);
        expect(stringArraysEqual(['a', 'b', 'c'], ['a', 'b'])).toBe(false);
      });
    });

    describe('order independence', () => {
      it('returns true for same elements in different order', () => {
        expect(stringArraysEqual(['a', 'b', 'c'], ['c', 'a', 'b'])).toBe(true);
        expect(stringArraysEqual(['1', '2', '3'], ['3', '1', '2'])).toBe(true);
      });

      it('returns true for single element arrays', () => {
        expect(stringArraysEqual(['a'], ['a'])).toBe(true);
      });

      it('returns false for different elements', () => {
        expect(stringArraysEqual(['a', 'b'], ['a', 'c'])).toBe(false);
        expect(stringArraysEqual(['1', '2'], ['1', '3'])).toBe(false);
      });
    });

    describe('duplicate handling (critical bug fix)', () => {
      it('returns true for arrays with same duplicates', () => {
        expect(stringArraysEqual(['a', 'a', 'b'], ['a', 'b', 'a'])).toBe(true);
        expect(stringArraysEqual(['1', '1', '1'], ['1', '1', '1'])).toBe(true);
        expect(stringArraysEqual(['x', 'y', 'x', 'y'], ['y', 'x', 'y', 'x'])).toBe(true);
      });

      it('returns false for arrays with different duplicate counts', () => {
        // This was the critical bug - Set-based comparison would incorrectly return true
        expect(stringArraysEqual(['a', 'a', 'b'], ['a', 'b', 'b'])).toBe(false);
        expect(stringArraysEqual(['1', '1', '2'], ['1', '2', '2'])).toBe(false);
        expect(stringArraysEqual(['x', 'x', 'x'], ['x', 'x'])).toBe(false);
      });

      it('handles complex duplicate patterns', () => {
        expect(stringArraysEqual(
          ['id1', 'id1', 'id2', 'id3', 'id3', 'id3'],
          ['id3', 'id1', 'id3', 'id2', 'id1', 'id3']
        )).toBe(true);

        expect(stringArraysEqual(
          ['id1', 'id1', 'id2', 'id3', 'id3', 'id3'],
          ['id3', 'id1', 'id3', 'id2', 'id1', 'id2']
        )).toBe(false);
      });
    });

    describe('real-world scenarios', () => {
      it('handles UUID arrays correctly', () => {
        const uuids1 = [
          '123e4567-e89b-12d3-a456-426614174000',
          '987fcdeb-51a2-43d1-9f12-123456789abc',
          '123e4567-e89b-12d3-a456-426614174000' // duplicate
        ];
        const uuids2 = [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174000', // duplicate in different position
          '987fcdeb-51a2-43d1-9f12-123456789abc'
        ];
        expect(stringArraysEqual(uuids1, uuids2)).toBe(true);
      });

      it('handles empty and undefined edge cases', () => {
        expect(stringArraysEqual([], undefined)).toBe(false);
        expect(stringArraysEqual(undefined, [])).toBe(false);
        expect(stringArraysEqual([], ['a'])).toBe(false);
        expect(stringArraysEqual(['a'], [])).toBe(false);
      });
    });
  });

  describe('charactersEqual', () => {
    const charactersEqual = (char1: Character, char2: Character) => {
      return (calculator as any).charactersEqual(char1, char2);
    };

    it('returns true for identical characters', () => {
      const char = createCharacter();
      expect(charactersEqual(char, char)).toBe(true);
    });

    it('returns true when only rollup property differs', () => {
      const char1 = createCharacter();
      const char2 = createCharacter({ connections: ['char-3', 'char-4'] });
      expect(charactersEqual(char1, char2)).toBe(true);
    });

    it('returns false when ownedElementIds differ', () => {
      const char1 = createCharacter();
      const char2 = createCharacter({ ownedElementIds: ['elem-1'] });
      expect(charactersEqual(char1, char2)).toBe(false);
    });

    it('returns false when associatedElementIds differ', () => {
      const char1 = createCharacter();
      const char2 = createCharacter({ associatedElementIds: ['elem-4', 'elem-5'] });
      expect(charactersEqual(char1, char2)).toBe(false);
    });

    it('returns false when characterPuzzleIds differ', () => {
      const char1 = createCharacter();
      const char2 = createCharacter({ characterPuzzleIds: [] });
      expect(charactersEqual(char1, char2)).toBe(false);
    });

    it('returns false when eventIds differ', () => {
      const char1 = createCharacter();
      const char2 = createCharacter({ eventIds: ['event-1', 'event-2', 'event-3'] });
      expect(charactersEqual(char1, char2)).toBe(false);
    });

    it('handles arrays in different order correctly', () => {
      const char1 = createCharacter({ eventIds: ['event-1', 'event-2'] });
      const char2 = createCharacter({ eventIds: ['event-2', 'event-1'] });
      expect(charactersEqual(char1, char2)).toBe(true);
    });
  });

  describe('elementsEqual', () => {
    const elementsEqual = (elem1: Element, elem2: Element) => {
      return (calculator as any).elementsEqual(elem1, elem2);
    };


    it('returns true for identical elements', () => {
      const elem = createElement();
      expect(elementsEqual(elem, elem)).toBe(true);
    });

    it('returns true when rollup properties differ', () => {
      const elem1 = createElement();
      const elem2 = createElement({ 
        associatedCharacterIds: ['char-2', 'char-3'],
        puzzleChain: ['puzzle-5', 'puzzle-6']
      });
      expect(elementsEqual(elem1, elem2)).toBe(true);
    });

    it('returns false when ownerId differs', () => {
      const elem1 = createElement();
      const elem2 = createElement({ ownerId: 'char-2' });
      expect(elementsEqual(elem1, elem2)).toBe(false);
    });

    it('returns false when containerId differs', () => {
      const elem1 = createElement();
      const elem2 = createElement({ containerId: undefined });
      expect(elementsEqual(elem1, elem2)).toBe(false);
    });

    it('returns false when contentIds differ', () => {
      const elem1 = createElement();
      const elem2 = createElement({ contentIds: ['elem-3', 'elem-4'] });
      expect(elementsEqual(elem1, elem2)).toBe(false);
    });

    it('returns false when requiredForPuzzleIds differ', () => {
      const elem1 = createElement();
      const elem2 = createElement({ requiredForPuzzleIds: [] });
      expect(elementsEqual(elem1, elem2)).toBe(false);
    });
  });

  describe('puzzlesEqual', () => {
    const puzzlesEqual = (puzzle1: Puzzle, puzzle2: Puzzle) => {
      return (calculator as any).puzzlesEqual(puzzle1, puzzle2);
    };

    it('returns true for identical puzzles', () => {
      const puzzle = createPuzzle();
      expect(puzzlesEqual(puzzle, puzzle)).toBe(true);
    });

    it('returns true when rollup properties differ', () => {
      const puzzle1 = createPuzzle();
      const puzzle2 = createPuzzle({ 
        ownerId: 'char-2',
        storyReveals: ['event-2', 'event-3'],
        timing: ['Act 2'],
        narrativeThreads: ['thread-2', 'thread-3']
      });
      expect(puzzlesEqual(puzzle1, puzzle2)).toBe(true);
    });

    it('returns false when name differs', () => {
      const puzzle1 = createPuzzle();
      const puzzle2 = createPuzzle({ name: 'Different Puzzle' });
      expect(puzzlesEqual(puzzle1, puzzle2)).toBe(false);
    });

    it('returns false when puzzleElementIds differ', () => {
      const puzzle1 = createPuzzle();
      const puzzle2 = createPuzzle({ puzzleElementIds: ['elem-1'] });
      expect(puzzlesEqual(puzzle1, puzzle2)).toBe(false);
    });

    it('returns false when lockedItemId differs', () => {
      const puzzle1 = createPuzzle();
      const puzzle2 = createPuzzle({ lockedItemId: undefined });
      expect(puzzlesEqual(puzzle1, puzzle2)).toBe(false);
    });

    it('returns false when rewardIds differ', () => {
      const puzzle1 = createPuzzle();
      const puzzle2 = createPuzzle({ rewardIds: ['elem-4', 'elem-5'] });
      expect(puzzlesEqual(puzzle1, puzzle2)).toBe(false);
    });
  });

  describe('timelinesEqual', () => {
    const timelinesEqual = (timeline1: TimelineEvent, timeline2: TimelineEvent) => {
      return (calculator as any).timelinesEqual(timeline1, timeline2);
    };

    it('returns true for identical timelines', () => {
      const timeline = createTimeline();
      expect(timelinesEqual(timeline, timeline)).toBe(true);
    });

    it('returns true when rollup/synthesized properties differ', () => {
      const timeline1 = createTimeline();
      const timeline2 = createTimeline({ 
        memTypes: ['Prop', 'Memory Token (Audio)'],
        associatedPuzzles: ['puzzle-2', 'puzzle-3']
      });
      expect(timelinesEqual(timeline1, timeline2)).toBe(true);
    });

    it('returns false when description differs', () => {
      const timeline1 = createTimeline();
      const timeline2 = createTimeline({ description: 'Different Event' });
      expect(timelinesEqual(timeline1, timeline2)).toBe(false);
    });

    it('returns false when date differs', () => {
      const timeline1 = createTimeline();
      const timeline2 = createTimeline({ date: '2024-01-02' });
      expect(timelinesEqual(timeline1, timeline2)).toBe(false);
    });

    it('returns false when charactersInvolvedIds differ', () => {
      const timeline1 = createTimeline();
      const timeline2 = createTimeline({ charactersInvolvedIds: ['char-1'] });
      expect(timelinesEqual(timeline1, timeline2)).toBe(false);
    });

    it('returns false when memoryEvidenceIds differ', () => {
      const timeline1 = createTimeline();
      const timeline2 = createTimeline({ memoryEvidenceIds: ['elem-1', 'elem-2'] });
      expect(timelinesEqual(timeline1, timeline2)).toBe(false);
    });
  });

  describe('calculateGraphDelta integration tests', () => {
    // TECH_DEBT #7: Duplicate calculator definition - outer scope already has one
    let calculator: DeltaCalculator;

    beforeEach(() => {
      calculator = new DeltaCalculator();
    });

    // Helper to create a GraphNode from an entity
    // TECH_DEBT #7: This shadows the simpler version at line 85 but is needed for integration tests
    const createGraphNode = (
      entity: Character | Element | Puzzle | TimelineEvent,
      type: string
    ): any => ({
      id: entity.id,
      type: type.toLowerCase(),
      data: {
        label: entity.name ?? entity.description ?? 'Test Node',
        entity,
        metadata: {
          entityType: type
        }
      }
    });

    describe('rollup property changes (should NOT trigger delta)', () => {
      it('ignores Character rollup property changes', () => {
        const char1 = createCharacter({ connections: ['char-2', 'char-3'] });
        const char2 = createCharacter({ connections: ['char-4', 'char-5'] });
        
        const oldNodes = [createGraphNode(char1, 'Character')];
        const newNodes = [createGraphNode(char2, 'Character')];
        
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [], // oldEdges
          [], // newEdges
          char2 // updatedEntity
        );
        
        expect(delta.changes.nodes.created).toHaveLength(0);
        expect(delta.changes.nodes.updated).toHaveLength(0);
        expect(delta.changes.nodes.deleted).toHaveLength(0);
      });

      it('ignores Element rollup property changes', () => {
        const elem1 = createElement({ 
          associatedCharacterIds: ['char-1', 'char-2'],
          puzzleChain: ['puzzle-1', 'puzzle-2']
        });
        const elem2 = createElement({ 
          associatedCharacterIds: ['char-3', 'char-4'],
          puzzleChain: ['puzzle-3', 'puzzle-4']
        });
        
        const oldNodes = [createGraphNode(elem1, 'Element')];
        const newNodes = [createGraphNode(elem2, 'Element')];
        
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          elem2
        );
        
        expect(delta.changes.nodes.created).toHaveLength(0);
        expect(delta.changes.nodes.updated).toHaveLength(0);
        expect(delta.changes.nodes.deleted).toHaveLength(0);
      });

      it('ignores Puzzle rollup property changes', () => {
        const puzzle1 = createPuzzle({ 
          ownerId: 'char-1',
          storyReveals: ['event-1'],
          timing: ['Act 1'],
          narrativeThreads: ['thread-1']
        });
        const puzzle2 = createPuzzle({ 
          ownerId: 'char-2',
          storyReveals: ['event-2'],
          timing: ['Act 2'],
          narrativeThreads: ['thread-2']
        });
        
        const oldNodes = [createGraphNode(puzzle1, 'Puzzle')];
        const newNodes = [createGraphNode(puzzle2, 'Puzzle')];
        
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          puzzle2
        );
        
        expect(delta.changes.nodes.created).toHaveLength(0);
        expect(delta.changes.nodes.updated).toHaveLength(0);
        expect(delta.changes.nodes.deleted).toHaveLength(0);
      });

      it('ignores Timeline rollup/synthesized property changes', () => {
        const timeline1 = createTimeline({ 
          memTypes: ['Document'],
          associatedPuzzles: ['puzzle-1']
        });
        const timeline2 = createTimeline({ 
          memTypes: ['Prop', 'Memory Token (Audio)'],
          associatedPuzzles: ['puzzle-2', 'puzzle-3']
        });
        
        const oldNodes = [createGraphNode(timeline1, 'TimelineEvent')];
        const newNodes = [createGraphNode(timeline2, 'TimelineEvent')];
        
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          timeline2
        );
        
        expect(delta.changes.nodes.created).toHaveLength(0);
        expect(delta.changes.nodes.updated).toHaveLength(0);
        expect(delta.changes.nodes.deleted).toHaveLength(0);
      });
    });

    describe('direct property changes (should trigger delta)', () => {
      it('detects Character direct property changes', () => {
        const char1 = createCharacter({ name: 'Character A' });
        const char2 = createCharacter({ name: 'Character B' });
        
        const oldNodes = [createGraphNode(char1, 'Character')];
        const newNodes = [createGraphNode(char2, 'Character')];
        
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          char2
        );
        
        expect(delta.changes.nodes.updated).toHaveLength(1);
        expect(delta.changes.nodes.updated[0].data.entity.name).toBe('Character B');
      });

      it('detects Element relation changes', () => {
        const elem1 = createElement({ ownerId: 'char-1' });
        const elem2 = createElement({ ownerId: 'char-2' });
        
        const oldNodes = [createGraphNode(elem1, 'Element')];
        const newNodes = [createGraphNode(elem2, 'Element')];
        
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          elem2
        );
        
        expect(delta.changes.nodes.updated).toHaveLength(1);
        expect(delta.changes.nodes.updated[0].data.entity.ownerId).toBe('char-2');
      });

      it('detects array changes with different duplicates', () => {
        // This tests our critical bug fix for stringArraysEqual
        const char1 = createCharacter({ 
          eventIds: ['event-1', 'event-1', 'event-2'] 
        });
        const char2 = createCharacter({ 
          eventIds: ['event-1', 'event-2', 'event-2'] 
        });
        
        const oldNodes = [createGraphNode(char1, 'Character')];
        const newNodes = [createGraphNode(char2, 'Character')];
        
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          char2
        );
        
        // Should detect as change because duplicate counts differ
        expect(delta.changes.nodes.updated).toHaveLength(1);
      });

      it('does not detect changes for reordered arrays', () => {
        const elem1 = createElement({ 
          contentIds: ['elem-1', 'elem-2', 'elem-3'] 
        });
        const elem2 = createElement({ 
          contentIds: ['elem-3', 'elem-1', 'elem-2'] 
        });
        
        const oldNodes = [createGraphNode(elem1, 'Element')];
        const newNodes = [createGraphNode(elem2, 'Element')];
        
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          elem2
        );
        
        // Should not detect as change because same elements, just reordered
        expect(delta.changes.nodes.updated).toHaveLength(0);
      });
    });

    describe('node lifecycle changes', () => {
      it('detects added nodes', () => {
        const char = createCharacter();
        
        const oldNodes = [];
        const newNodes = [createGraphNode(char, 'Character')];
        
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          char
        );
        
        expect(delta.changes.nodes.created).toHaveLength(1);
        expect(delta.changes.nodes.created[0].data.entity.id).toBe('char-1');
      });

      it('detects deleted nodes', () => {
        const elem = createElement();
        
        const oldNodes = [createGraphNode(elem, 'Element')];
        const newNodes = [];
        
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          elem
        );
        
        expect(delta.changes.nodes.deleted).toHaveLength(1);
        expect(delta.changes.nodes.deleted[0]).toBe('elem-1');
      });

      it('handles multiple nodes of same type with selective changes', () => {
        const char1 = createCharacter({ id: 'char-1', name: 'Alice' });
        const char2 = createCharacter({ id: 'char-2', name: 'Bob' });
        const char1Updated = createCharacter({ id: 'char-1', name: 'Alice Updated' });
        
        const oldNodes = [
          createGraphNode(char1, 'Character'),
          createGraphNode(char2, 'Character')
        ];
        
        const newNodes = [
          createGraphNode(char1Updated, 'Character'),
          createGraphNode(char2, 'Character')  // Unchanged
        ];
        
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          char1Updated
        );
        
        // Only char-1 should be marked as updated
        expect(delta.changes.nodes.updated).toHaveLength(1);
        expect(delta.changes.nodes.updated[0].id).toBe('char-1');
        expect(delta.changes.nodes.updated[0].data.entity.name).toBe('Alice Updated');
      });

      it('handles complex mixed changes', () => {
        const char1 = createCharacter({ id: 'char-1', name: 'Original' });
        const char2 = createCharacter({ id: 'char-1', name: 'Updated' });
        const elem = createElement({ id: 'elem-2' });
        const puzzle = createPuzzle({ id: 'puzzle-3' });
        
        const oldNodes = [
          createGraphNode(char1, 'Character'),
          createGraphNode(elem, 'Element')
        ];
        
        const newNodes = [
          createGraphNode(char2, 'Character'),
          createGraphNode(puzzle, 'Puzzle')
        ];
        
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          char2  // The updated entity
        );
        
        expect(delta.changes.nodes.updated).toHaveLength(1); // char updated
        expect(delta.changes.nodes.created).toHaveLength(1);   // puzzle added
        expect(delta.changes.nodes.deleted).toHaveLength(1); // elem deleted
        
        expect(delta.changes.nodes.updated[0].data.entity.name).toBe('Updated');
        expect(delta.changes.nodes.created[0].data.entity.id).toBe('puzzle-3');
        expect(delta.changes.nodes.deleted[0]).toBe('elem-2');
      });
    });

    describe('edge delta detection', () => {
      // Helper to create a simple edge
      const createEdge = (id: string, source: string, target: string, type = 'relationship'): any => ({
        id,
        source,
        target,
        type,
        data: { label: type }
      });

      it('detects edge creation', () => {
        const char = createCharacter();
        const elem = createElement();
        
        const nodes = [
          createGraphNode(char, 'Character'),
          createGraphNode(elem, 'Element')
        ];
        
        const oldEdges: any[] = [];
        const newEdges = [
          createEdge('edge-1', 'char-1', 'elem-1', 'owns')
        ];
        
        const delta = calculator.calculateGraphDelta(
          nodes,
          nodes,  // Same nodes
          oldEdges,
          newEdges,
          char
        );
        
        expect(delta.changes.edges.created).toHaveLength(1);
        expect(delta.changes.edges.created[0].id).toBe('edge-1');
        expect(delta.changes.edges.updated).toHaveLength(0);
        expect(delta.changes.edges.deleted).toHaveLength(0);
      });

      it('detects edge deletion', () => {
        const char = createCharacter();
        const elem = createElement();
        
        const nodes = [
          createGraphNode(char, 'Character'),
          createGraphNode(elem, 'Element')
        ];
        
        const oldEdges = [
          createEdge('edge-1', 'char-1', 'elem-1', 'owns')
        ];
        const newEdges: any[] = [];
        
        const delta = calculator.calculateGraphDelta(
          nodes,
          nodes,
          oldEdges,
          newEdges,
          char
        );
        
        expect(delta.changes.edges.deleted).toHaveLength(1);
        expect(delta.changes.edges.deleted[0]).toBe('edge-1');
        expect(delta.changes.edges.created).toHaveLength(0);
        expect(delta.changes.edges.updated).toHaveLength(0);
      });

      it('detects edge updates', () => {
        const char = createCharacter();
        const elem = createElement();
        
        const nodes = [
          createGraphNode(char, 'Character'),
          createGraphNode(elem, 'Element')
        ];
        
        const oldEdges = [
          createEdge('edge-1', 'char-1', 'elem-1', 'owns')
        ];
        const newEdges = [
          createEdge('edge-1', 'char-1', 'elem-1', 'associates')  // Type changed
        ];
        
        const delta = calculator.calculateGraphDelta(
          nodes,
          nodes,
          oldEdges,
          newEdges,
          char
        );
        
        expect(delta.changes.edges.updated).toHaveLength(1);
        expect(delta.changes.edges.updated[0].type).toBe('associates');
        expect(delta.changes.edges.created).toHaveLength(0);
        expect(delta.changes.edges.deleted).toHaveLength(0);
      });

      it('handles mixed edge changes', () => {
        const char = createCharacter();
        const elem1 = createElement({ id: 'elem-1' });
        const elem2 = createElement({ id: 'elem-2' });
        
        const nodes = [
          createGraphNode(char, 'Character'),
          createGraphNode(elem1, 'Element'),
          createGraphNode(elem2, 'Element')
        ];
        
        const oldEdges = [
          createEdge('edge-1', 'char-1', 'elem-1', 'owns'),
          createEdge('edge-2', 'char-1', 'elem-2', 'owns')
        ];
        const newEdges = [
          createEdge('edge-1', 'char-1', 'elem-1', 'associates'),  // Updated
          createEdge('edge-3', 'elem-1', 'elem-2', 'contains')      // Created
          // edge-2 deleted
        ];
        
        const delta = calculator.calculateGraphDelta(
          nodes,
          nodes,
          oldEdges,
          newEdges,
          char
        );
        
        expect(delta.changes.edges.created).toHaveLength(1);
        expect(delta.changes.edges.created[0].id).toBe('edge-3');
        expect(delta.changes.edges.updated).toHaveLength(1);
        expect(delta.changes.edges.updated[0].id).toBe('edge-1');
        expect(delta.changes.edges.deleted).toHaveLength(1);
        expect(delta.changes.edges.deleted[0]).toBe('edge-2');
      });

      it('handles orphaned edges when source node is deleted', () => {
        // Critical test: What happens to edges when their source node is deleted?
        const oldNodes = [
          createGraphNode(createCharacter({ id: 'char-1' }), 'Character'),
          createGraphNode(createElement({ id: 'elem-1' }), 'Element')
        ];
        
        const oldEdges = [
          createEdge('edge-1', 'char-1', 'elem-1', 'discovered')
        ];
        
        // Delete the source node
        const newNodes = [
          createGraphNode(createElement({ id: 'elem-1' }), 'Element')
        ];
        
        // Edge still exists in data (orphaned)
        const newEdges = [
          createEdge('edge-1', 'char-1', 'elem-1', 'discovered')
        ];
        
        const delta = calculator.calculateGraphDelta(oldNodes, newNodes, oldEdges, newEdges, null);
        
        // Node should be deleted
        expect(delta.changes.nodes.deleted).toHaveLength(1);
        expect(delta.changes.nodes.deleted[0]).toBe('char-1');
        
        // Edge should be marked as deleted even though it exists in newEdges
        // because its source no longer exists
        expect(delta.changes.edges.deleted).toHaveLength(1);
        expect(delta.changes.edges.deleted[0]).toBe('edge-1');
      });

      it('handles orphaned edges when target node is deleted', () => {
        const oldNodes = [
          createGraphNode(createCharacter({ id: 'char-1' }), 'Character'),
          createGraphNode(createElement({ id: 'elem-1' }), 'Element')
        ];
        
        const oldEdges = [
          createEdge('edge-1', 'char-1', 'elem-1', 'discovered')
        ];
        
        // Delete the target node
        const newNodes = [
          createGraphNode(createCharacter({ id: 'char-1' }), 'Character')
        ];
        
        // Edge still exists in data (orphaned)
        const newEdges = [
          createEdge('edge-1', 'char-1', 'elem-1', 'discovered')
        ];
        
        const delta = calculator.calculateGraphDelta(oldNodes, newNodes, oldEdges, newEdges, null);
        
        // Node should be deleted
        expect(delta.changes.nodes.deleted).toHaveLength(1);
        expect(delta.changes.nodes.deleted[0]).toBe('elem-1');
        
        // Edge should be marked as deleted because its target no longer exists
        expect(delta.changes.edges.deleted).toHaveLength(1);
        expect(delta.changes.edges.deleted[0]).toBe('edge-1');
      });

      it('detects granular edge property changes', () => {
        const oldEdges = [
          createEdge('edge-1', 'char-1', 'elem-1', 'relationship')
        ];
        
        // Change only the edge type
        const newEdges = [
          createEdge('edge-1', 'char-1', 'elem-1', 'reference')
        ];
        
        const delta = calculator.calculateGraphDelta([], [], oldEdges, newEdges, null);
        
        // Edge should be marked as updated due to type change
        expect(delta.changes.edges.updated).toHaveLength(1);
        expect(delta.changes.edges.updated[0].id).toBe('edge-1');
      });

      it('detects edge label changes', () => {
        const oldEdges = [
          { id: 'edge-1', source: 'char-1', target: 'elem-1', type: 'relationship', data: { label: 'discovered' } }
        ];
        
        const newEdges = [
          { id: 'edge-1', source: 'char-1', target: 'elem-1', type: 'relationship', data: { label: 'investigated' } }
        ];
        
        const delta = calculator.calculateGraphDelta([], [], oldEdges, newEdges, null);
        
        // Edge should be marked as updated due to label change
        expect(delta.changes.edges.updated).toHaveLength(1);
        expect(delta.changes.edges.updated[0].id).toBe('edge-1');
      });
    });

    describe('updatedEntity parameter behavior', () => {
      it('works correctly when updatedEntity is null/undefined', () => {
        const char1 = createCharacter({ name: 'Original' });
        const char2 = createCharacter({ name: 'Updated' });
        
        const oldNodes = [createGraphNode(char1, 'Character')];
        const newNodes = [createGraphNode(char2, 'Character')];
        
        // Pass null for updatedEntity
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          null as any
        );
        
        // Delta calculation should still work correctly
        expect(delta.changes.nodes.updated).toHaveLength(1);
        expect(delta.entity).toBeNull();
      });

      it('updatedEntity does not affect delta calculation logic', () => {
        const elem1 = createElement({ name: 'Element A' });
        const elem2 = createElement({ name: 'Element B' });
        const unrelatedChar = createCharacter({ id: 'unrelated' });
        
        const oldNodes = [createGraphNode(elem1, 'Element')];
        const newNodes = [createGraphNode(elem2, 'Element')];
        
        // Pass an unrelated entity as updatedEntity
        const delta = calculator.calculateGraphDelta(
          oldNodes,
          newNodes,
          [],
          [],
          unrelatedChar  // Wrong entity!
        );
        
        // Delta should still detect the element change correctly
        expect(delta.changes.nodes.updated).toHaveLength(1);
        expect(delta.changes.nodes.updated[0].data.entity.name).toBe('Element B');
        // But the entity field will have the wrong entity
        expect(delta.entity).toBe(unrelatedChar);
      });
    });

    // Duplicate helper factories removed - using definitions from top of file
  });
});