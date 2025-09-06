import { describe, it, expect } from 'vitest';
import { synthesizeBidirectionalRelationships } from '../../services/relationshipSynthesizer';
import type { Element, Puzzle, TimelineEvent, Character } from '../../../src/types/notion/app';

describe('Relationship Synthesizer', () => {
  it('should synthesize puzzle -> element relationships', () => {
    const puzzles: Puzzle[] = [
      { id: 'puzzle1', puzzleElementIds: ['elem1'], rewardIds: ['elem2'], parentItemId: null, subPuzzleIds: [], storyReveals: [], name: 'Puzzle 1', status: 'Not Started' },
    ];
    const elements: Element[] = [
      { id: 'elem1', name: 'Element 1', type: 'Item', status: 'To Do' },
      { id: 'elem2', name: 'Element 2', type: 'Item', status: 'To Do' },
    ];

    const { puzzles: synthesizedPuzzles, elements: synthesizedElements } = synthesizeBidirectionalRelationships(elements, puzzles, [], []);

    expect(synthesizedElements.find(e => e.id === 'elem1')?.requiredForPuzzleIds).toContain('puzzle1');
    expect(synthesizedElements.find(e => e.id === 'elem2')?.rewardedByPuzzleIds).toContain('puzzle1');
  });

  it('should synthesize element -> puzzle relationships', () => {
    const puzzles: Puzzle[] = [
      { id: 'puzzle1', parentItemId: null, subPuzzleIds: [], storyReveals: [], name: 'Puzzle 1', status: 'Not Started' },
    ];
    const elements: Element[] = [
      { id: 'elem1', name: 'Element 1', type: 'Item', status: 'To Do', requiredForPuzzleIds: ['puzzle1'], rewardedByPuzzleIds: ['puzzle1'] },
    ];

    const { puzzles: synthesizedPuzzles, elements: synthesizedElements } = synthesizeBidirectionalRelationships(elements, puzzles, [], []);

    expect(synthesizedPuzzles.find(p => p.id === 'puzzle1')?.puzzleElementIds).toContain('elem1');
    expect(synthesizedPuzzles.find(p => p.id === 'puzzle1')?.rewardIds).toContain('elem1');
  });

  it('should synthesize container -> content relationships', () => {
    const elements: Element[] = [
      { id: 'container1', name: 'Container 1', type: 'Item', status: 'To Do', contentIds: ['content1'] },
      { id: 'content1', name: 'Content 1', type: 'Item', status: 'To Do' },
    ];

    const { elements: synthesizedElements } = synthesizeBidirectionalRelationships(elements, [], [], []);

    expect(synthesizedElements.find(e => e.id === 'content1')?.containerId).toBe('container1');
  });

  it('should synthesize content -> container relationships', () => {
    const elements: Element[] = [
      { id: 'container1', name: 'Container 1', type: 'Item', status: 'To Do' },
      { id: 'content1', name: 'Content 1', type: 'Item', status: 'To Do', containerId: 'container1' },
    ];

    const { elements: synthesizedElements } = synthesizeBidirectionalRelationships(elements, [], [], []);

    expect(synthesizedElements.find(e => e.id === 'container1')?.contentIds).toContain('content1');
  });

  it('should synthesize parent -> sub-puzzle relationships', () => {
    const puzzles: Puzzle[] = [
      { id: 'parent1', name: 'Parent 1', status: 'Not Started', subPuzzleIds: ['sub1'], parentItemId: null, storyReveals: [] },
      { id: 'sub1', name: 'Sub 1', status: 'Not Started', parentItemId: null, subPuzzleIds: [], storyReveals: [] },
    ];

    const { puzzles: synthesizedPuzzles } = synthesizeBidirectionalRelationships([], puzzles, [], []);

    expect(synthesizedPuzzles.find(p => p.id === 'sub1')?.parentItemId).toBe('parent1');
  });

  it('should synthesize sub-puzzle -> parent relationships', () => {
    const puzzles: Puzzle[] = [
      { id: 'parent1', name: 'Parent 1', status: 'Not Started', parentItemId: null, subPuzzleIds: [], storyReveals: [] },
      { id: 'sub1', name: 'Sub 1', status: 'Not Started', parentItemId: 'parent1', subPuzzleIds: [], storyReveals: [] },
    ];

    const { puzzles: synthesizedPuzzles } = synthesizeBidirectionalRelationships([], puzzles, [], []);

    expect(synthesizedPuzzles.find(p => p.id === 'parent1')?.subPuzzleIds).toContain('sub1');
  });

  it('should synthesize puzzle -> timeline relationships', () => {
    const puzzles: Puzzle[] = [
      { id: 'puzzle1', name: 'Puzzle 1', status: 'Not Started', storyReveals: ['event1'], parentItemId: null, subPuzzleIds: [] },
    ];
    const timeline: TimelineEvent[] = [
      { id: 'event1', name: 'Event 1', date: '2023-01-01' },
    ];

    const { timeline: synthesizedTimeline } = synthesizeBidirectionalRelationships([], puzzles, timeline, []);

    expect(synthesizedTimeline.find(t => t.id === 'event1')?.associatedPuzzles).toContain('puzzle1');
  });

  it('should synthesize timeline -> character relationships', () => {
    const timeline: TimelineEvent[] = [
      { id: 'event1', name: 'Event 1', date: '2023-01-01', charactersInvolvedIds: ['char1'] },
    ];
    const characters: Character[] = [
      { id: 'char1', name: 'Character 1', type: 'PC' },
    ];

    const { characters: synthesizedCharacters } = synthesizeBidirectionalRelationships([], [], timeline, characters);

    expect(synthesizedCharacters.find(c => c.id === 'char1')?.eventIds).toContain('event1');
  });

  it('should synthesize character -> timeline relationships', () => {
    const timeline: TimelineEvent[] = [
        { id: 'event1', name: 'Event 1', date: '2023-01-01' },
    ];
    const characters: Character[] = [
        { id: 'char1', name: 'Character 1', type: 'PC', eventIds: ['event1'] },
    ];

    const { timeline: synthesizedTimeline } = synthesizeBidirectionalRelationships([], [], timeline, characters);

    expect(synthesizedTimeline.find(t => t.id === 'event1')?.charactersInvolvedIds).toContain('char1');
  });

  it('should synthesize timeline -> element (memory/evidence) relationships', () => {
    const timeline: TimelineEvent[] = [
      { id: 'event1', name: 'Event 1', date: '2023-01-01', memoryEvidenceIds: ['elem1'] },
    ];
    const elements: Element[] = [
      { id: 'elem1', name: 'Element 1', type: 'Item', status: 'To Do' },
    ];

    const { elements: synthesizedElements } = synthesizeBidirectionalRelationships(elements, [], timeline, []);

    expect(synthesizedElements.find(e => e.id === 'elem1')?.timelineEventId).toBe('event1');
  });

  it('should synthesize element (memory/evidence) -> timeline relationships', () => {
    const timeline: TimelineEvent[] = [
        { id: 'event1', name: 'Event 1', date: '2023-01-01' },
    ];
    const elements: Element[] = [
        { id: 'elem1', name: 'Element 1', type: 'Item', status: 'To Do', timelineEventId: 'event1' },
    ];

    const { timeline: synthesizedTimeline } = synthesizeBidirectionalRelationships(elements, [], timeline, []);

    expect(synthesizedTimeline.find(t => t.id === 'event1')?.memoryEvidenceIds).toContain('elem1');
  });

  it('should not create duplicate relationships', () => {
    const puzzles: Puzzle[] = [
      { id: 'puzzle1', puzzleElementIds: ['elem1'], rewardIds: [], parentItemId: null, subPuzzleIds: [], storyReveals: [], name: 'Puzzle 1', status: 'Not Started' },
    ];
    const elements: Element[] = [
      { id: 'elem1', name: 'Element 1', type: 'Item', status: 'To Do', requiredForPuzzleIds: ['puzzle1'] },
    ];

    const { elements: synthesizedElements } = synthesizeBidirectionalRelationships(elements, puzzles, [], []);

    expect(synthesizedElements.find(e => e.id === 'elem1')?.requiredForPuzzleIds).toHaveLength(1);
  });

  it('should handle empty inputs', () => {
    const { elements, puzzles, timeline, characters } = synthesizeBidirectionalRelationships([], [], [], []);
    expect(elements).toEqual([]);
    expect(puzzles).toEqual([]);
    expect(timeline).toEqual([]);
    expect(characters).toEqual([]);
  });
});
