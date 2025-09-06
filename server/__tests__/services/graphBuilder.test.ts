import { describe, it, expect } from 'vitest';
import { buildCompleteGraph } from '../../services/graphBuilder.js';
import type { Character, Element, Puzzle, TimelineEvent } from '../../../src/types/notion/app.js';

describe('Graph Builder Service', () => {
  it('should build a basic graph with nodes and edges', () => {
    const characters: Character[] = [{ id: 'char1', name: 'Character 1', ownedElementIds: ['elem1'] }];
    const elements: Element[] = [{ id: 'elem1', name: 'Element 1', ownerId: 'char1' }];
    const puzzles: Puzzle[] = [];
    const timeline: TimelineEvent[] = [];

    const graph = buildCompleteGraph({ characters, elements, puzzles, timeline });

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].source).toBe('char1');
    expect(graph.edges[0].target).toBe('elem1');
    expect(graph.metadata.totalNodes).toBe(2);
    expect(graph.metadata.totalEdges).toBe(1);
  });

  it('should create placeholder nodes for missing entities', () => {
    const characters: Character[] = [{ id: 'char1', name: 'Character 1', ownedElementIds: ['elem1'] }];
    const elements: Element[] = [];
    const puzzles: Puzzle[] = [];
    const timeline: TimelineEvent[] = [];

    const graph = buildCompleteGraph({ characters, elements, puzzles, timeline });

    expect(graph.nodes).toHaveLength(2); // Character + placeholder
    expect(graph.nodes.some(n => n.type === 'placeholder')).toBe(true);
    const placeholder = graph.nodes.find(n => n.type === 'placeholder');
    expect(placeholder?.id).toBe('elem1');
    expect(graph.edges).toHaveLength(1);
    expect(graph.metadata.placeholderNodes).toBe(1);
    expect(graph.metadata.missingEntities).toHaveLength(1);
  });

  it('should handle all relationship types', () => {
    const characters: Character[] = [
      { id: 'char1', name: 'Character 1', ownedElementIds: ['elem1'], associatedElementIds: ['elem2'], characterPuzzleIds: ['puzzle1'], eventIds: ['event1'] }
    ];
    const elements: Element[] = [
      { id: 'elem1', name: 'Element 1', ownerId: 'char1' },
      { id: 'elem2', name: 'Element 2', requiredForPuzzleIds: ['puzzle1'], rewardedByPuzzleIds: ['puzzle2'] }
    ];
    const puzzles: Puzzle[] = [
      { id: 'puzzle1', name: 'Puzzle 1', parentItemId: 'puzzle2', subPuzzleIds: ['puzzle3'], puzzleElementIds: ['elem2'], rewardIds: ['elem1'] },
      { id: 'puzzle2', name: 'Puzzle 2' },
      { id: 'puzzle3', name: 'Puzzle 3' }
    ];
    const timeline: TimelineEvent[] = [
      { id: 'event1', name: 'Event 1', charactersInvolvedIds: ['char1'], memoryEvidenceIds: ['elem2'], associatedPuzzles: ['puzzle1'] }
    ];

    const graph = buildCompleteGraph({ characters, elements, puzzles, timeline });

    expect(graph.nodes).toHaveLength(7);
    // Expected edges:
    // char1 -> elem1 (ownership)
    // char1 -> elem2 (association)
    // char1 -> puzzle1 (puzzle)
    // char1 -> event1 (timeline)
    // elem2 -> puzzle1 (requirement)
    // puzzle2 -> elem2 (reward)
    // puzzle2 -> puzzle1 (dependency)
    // puzzle1 -> puzzle3 (chain)
    // puzzle1 -> elem1 (reward)
    // event1 -> char1 (timeline)
    // event1 -> elem2 (timeline)
    // event1 -> puzzle1 (timeline)
    // Total should be 12 unique edges
    expect(graph.edges.length).toBe(12);
    expect(graph.metadata.totalEdges).toBe(12);
  });

  it('should not create duplicate edges', () => {
    const characters: Character[] = [{ id: 'char1', name: 'Character 1', ownedElementIds: ['elem1'] }];
    const elements: Element[] = [{ id: 'elem1', name: 'Element 1', ownerId: 'char1' }];
    const puzzles: Puzzle[] = [];
    const timeline: TimelineEvent[] = [];

    const graph = buildCompleteGraph({ characters, elements, puzzles, timeline });
    expect(graph.edges).toHaveLength(1);
  });
});
