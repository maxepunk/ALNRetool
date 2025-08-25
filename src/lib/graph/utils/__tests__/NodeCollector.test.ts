/**
 * NodeCollector Test Suite
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NodeCollector } from '../NodeCollector';
import type { EntityTransformer } from '../../modules/EntityTransformer';
import type { 
  Character, 
  Element, 
  Puzzle, 
  TimelineEvent
} from '@/types/notion/app';
import type { NotionData } from '../../types';

// Mock EntityTransformer
const createMockEntityTransformer = (): EntityTransformer => ({
  transformCharacters: vi.fn((characters: Character[]) => 
    characters.map(c => ({
      id: c.id,
      type: 'character' as const,
      data: { label: c.name || 'Character', entity: c },
      position: { x: 0, y: 0 }
    }))
  ),
  transformElements: vi.fn((elements: Element[]) => 
    elements.map(e => ({
      id: e.id,
      type: 'element' as const,
      data: { label: e.name || 'Element', entity: e },
      position: { x: 0, y: 0 }
    }))
  ),
  transformPuzzles: vi.fn((puzzles: Puzzle[]) => 
    puzzles.map(p => ({
      id: p.id,
      type: 'puzzle' as const,
      data: { label: p.name || 'Puzzle', entity: p },
      position: { x: 0, y: 0 }
    }))
  ),
  transformTimeline: vi.fn((timeline: TimelineEvent[]) => 
    timeline.map(t => ({
      id: t.id,
      type: 'timeline' as const,
      data: { label: t.description || 'Event', entity: t },
      position: { x: 0, y: 0 }
    }))
  ),
  transformEntity: vi.fn()
} as unknown as EntityTransformer);

// Mock data
const mockCharacters: Character[] = [
  { id: 'char-1', name: 'Alice', type: 'Player', tier: 'Core', connections: [], ownedElementIds: [], associatedElementIds: [], characterPuzzleIds: [], eventIds: [], primaryAction: '', characterLogline: '', overview: '', emotionTowardsCEO: '' } as Character,
  { id: 'char-2', name: 'Bob', type: 'Player', tier: 'Core', connections: [], ownedElementIds: [], associatedElementIds: [], characterPuzzleIds: [], eventIds: [], primaryAction: '', characterLogline: '', overview: '', emotionTowardsCEO: '' } as Character,
  { id: 'char-3', name: 'Charlie', type: 'Player', tier: 'Core', connections: [], ownedElementIds: [], associatedElementIds: [], characterPuzzleIds: [], eventIds: [], primaryAction: '', characterLogline: '', overview: '', emotionTowardsCEO: '' } as Character
];

const mockElements: Element[] = [
  { id: 'elem-1', name: 'Sword', descriptionText: '', sfPatterns: {}, basicType: 'Prop', contentIds: [], status: 'Idea/Placeholder', firstAvailable: null, requiredForPuzzleIds: [], rewardedByPuzzleIds: [], narrativeThreads: [], associatedCharacterIds: [], puzzleChain: [], productionNotes: '', filesMedia: [], isContainer: false } as Element,
  { id: 'elem-2', name: 'Shield', descriptionText: '', sfPatterns: {}, basicType: 'Prop', contentIds: [], status: 'Idea/Placeholder', firstAvailable: null, requiredForPuzzleIds: [], rewardedByPuzzleIds: [], narrativeThreads: [], associatedCharacterIds: [], puzzleChain: [], productionNotes: '', filesMedia: [], isContainer: false } as Element,
  { id: 'elem-3', name: 'Potion', descriptionText: '', sfPatterns: {}, basicType: 'Prop', contentIds: [], status: 'Idea/Placeholder', firstAvailable: null, requiredForPuzzleIds: [], rewardedByPuzzleIds: [], narrativeThreads: [], associatedCharacterIds: [], puzzleChain: [], productionNotes: '', filesMedia: [], isContainer: false } as Element
];

const mockPuzzles: Puzzle[] = [
  { id: 'puzzle-1', name: 'Door Puzzle', descriptionSolution: '', puzzleElementIds: [], rewardIds: [], subPuzzleIds: [], storyReveals: [], timing: [], narrativeThreads: [] } as Puzzle,
  { id: 'puzzle-2', name: 'Key Puzzle', descriptionSolution: '', puzzleElementIds: [], rewardIds: [], subPuzzleIds: [], storyReveals: [], timing: [], narrativeThreads: [] } as Puzzle
];

const mockTimeline: TimelineEvent[] = [
  { id: 'event-1', name: 'Event 1', description: 'Event 1', date: new Date().toISOString(), charactersInvolvedIds: [], memoryEvidenceIds: [], memTypes: [], notes: '', lastEditedTime: new Date().toISOString() } as TimelineEvent,
  { id: 'event-2', name: 'Event 2', description: 'Event 2', date: new Date().toISOString(), charactersInvolvedIds: [], memoryEvidenceIds: [], memTypes: [], notes: '', lastEditedTime: new Date().toISOString() } as TimelineEvent
];

const mockNotionData: NotionData = {
  characters: mockCharacters,
  elements: mockElements,
  puzzles: mockPuzzles,
  timeline: mockTimeline
};

describe('NodeCollector', () => {
  let entityTransformer: EntityTransformer;
  let collector: NodeCollector;

  beforeEach(() => {
    entityTransformer = createMockEntityTransformer();
  });

  describe('without included IDs filter', () => {
    beforeEach(() => {
      collector = new NodeCollector(entityTransformer);
    });

    it('should collect all character nodes', () => {
      const nodes = collector.collectCharacterNodes(mockCharacters);
      
      expect(nodes).toHaveLength(3);
      expect(entityTransformer.transformCharacters).toHaveBeenCalledTimes(3);
      expect(nodes[0]?.id).toBe('char-1');
      expect(nodes[1]?.id).toBe('char-2');
      expect(nodes[2]?.id).toBe('char-3');
    });

    it('should collect all element nodes', () => {
      const nodes = collector.collectElementNodes(mockElements);
      
      expect(nodes).toHaveLength(3);
      expect(entityTransformer.transformElements).toHaveBeenCalledTimes(3);
      expect(nodes[0]?.id).toBe('elem-1');
      expect(nodes[1]?.id).toBe('elem-2');
      expect(nodes[2]?.id).toBe('elem-3');
    });

    it('should collect all puzzle nodes', () => {
      const nodes = collector.collectPuzzleNodes(mockPuzzles);
      
      expect(nodes).toHaveLength(2);
      expect(entityTransformer.transformPuzzles).toHaveBeenCalledTimes(2);
      expect(nodes[0]?.id).toBe('puzzle-1');
      expect(nodes[1]?.id).toBe('puzzle-2');
    });

    it('should collect all timeline nodes', () => {
      const nodes = collector.collectTimelineNodes(mockTimeline);
      
      expect(nodes).toHaveLength(2);
      expect(entityTransformer.transformTimeline).toHaveBeenCalledTimes(2);
      expect(nodes[0]?.id).toBe('event-1');
      expect(nodes[1]?.id).toBe('event-2');
    });

    it('should handle empty arrays', () => {
      expect(collector.collectCharacterNodes([])).toEqual([]);
      expect(collector.collectElementNodes([])).toEqual([]);
      expect(collector.collectPuzzleNodes([])).toEqual([]);
      expect(collector.collectTimelineNodes([])).toEqual([]);
    });
  });

  describe('with included IDs filter', () => {
    beforeEach(() => {
      const includedIds = new Set(['char-1', 'elem-2', 'puzzle-1', 'event-2']);
      collector = new NodeCollector(entityTransformer, includedIds);
    });

    it('should only collect included character nodes', () => {
      const nodes = collector.collectCharacterNodes(mockCharacters);
      
      expect(nodes).toHaveLength(1);
      expect(nodes[0]?.id).toBe('char-1');
    });

    it('should only collect included element nodes', () => {
      const nodes = collector.collectElementNodes(mockElements);
      
      expect(nodes).toHaveLength(1);
      expect(nodes[0]?.id).toBe('elem-2');
    });

    it('should only collect included puzzle nodes', () => {
      const nodes = collector.collectPuzzleNodes(mockPuzzles);
      
      expect(nodes).toHaveLength(1);
      expect(nodes[0]?.id).toBe('puzzle-1');
    });

    it('should only collect included timeline nodes', () => {
      const nodes = collector.collectTimelineNodes(mockTimeline);
      
      expect(nodes).toHaveLength(1);
      expect(nodes[0]?.id).toBe('event-2');
    });
  });

  describe('collectFromIds', () => {
    beforeEach(() => {
      collector = new NodeCollector(entityTransformer);
    });

    it('should collect characters by IDs', () => {
      const ids = ['char-1', 'char-3'];
      const nodes = collector.collectFromIds(mockNotionData, ids, 'character');
      
      expect(nodes).toHaveLength(2);
      expect(nodes[0]?.id).toBe('char-1');
      expect(nodes[1]?.id).toBe('char-3');
    });

    it('should collect elements by IDs', () => {
      const ids = ['elem-2'];
      const nodes = collector.collectFromIds(mockNotionData, ids, 'element');
      
      expect(nodes).toHaveLength(1);
      expect(nodes[0]?.id).toBe('elem-2');
    });

    it('should collect puzzles by IDs', () => {
      const ids = ['puzzle-1', 'puzzle-2'];
      const nodes = collector.collectFromIds(mockNotionData, ids, 'puzzle');
      
      expect(nodes).toHaveLength(2);
      expect(nodes[0]?.id).toBe('puzzle-1');
      expect(nodes[1]?.id).toBe('puzzle-2');
    });

    it('should collect timeline events by IDs', () => {
      const ids = ['event-1'];
      const nodes = collector.collectFromIds(mockNotionData, ids, 'timeline');
      
      expect(nodes).toHaveLength(1);
      expect(nodes[0]?.id).toBe('event-1');
    });

    it('should handle empty ID array', () => {
      const nodes = collector.collectFromIds(mockNotionData, [], 'character');
      expect(nodes).toEqual([]);
    });

    it('should handle non-existent IDs', () => {
      const ids = ['non-existent-1', 'non-existent-2'];
      const nodes = collector.collectFromIds(mockNotionData, ids, 'character');
      expect(nodes).toEqual([]);
    });

    it('should respect included IDs filter', () => {
      collector.setIncludedNodeIds(new Set(['char-1']));
      const ids = ['char-1', 'char-2', 'char-3'];
      const nodes = collector.collectFromIds(mockNotionData, ids, 'character');
      
      expect(nodes).toHaveLength(1);
      expect(nodes[0]?.id).toBe('char-1');
    });
  });

  describe('collectAll', () => {
    it('should collect all entities matching included IDs', () => {
      const includedIds = new Set(['char-1', 'elem-2', 'puzzle-1', 'event-2']);
      collector = new NodeCollector(entityTransformer, includedIds);
      
      const nodes = collector.collectAll(mockNotionData);
      
      expect(nodes).toHaveLength(4);
      const nodeIds = nodes.map(n => n.id);
      expect(nodeIds).toContain('char-1');
      expect(nodeIds).toContain('elem-2');
      expect(nodeIds).toContain('puzzle-1');
      expect(nodeIds).toContain('event-2');
    });

    it('should return empty array when no included IDs', () => {
      collector = new NodeCollector(entityTransformer);
      const nodes = collector.collectAll(mockNotionData);
      expect(nodes).toEqual([]);
    });

    it('should return empty array when included IDs is empty set', () => {
      collector = new NodeCollector(entityTransformer, new Set());
      const nodes = collector.collectAll(mockNotionData);
      expect(nodes).toEqual([]);
    });
  });

  describe('collectSpecificEntities', () => {
    beforeEach(() => {
      collector = new NodeCollector(entityTransformer);
    });

    it('should collect only specified entity types', () => {
      const nodes = collector.collectSpecificEntities({
        characters: [mockCharacters[0]!],
        elements: [mockElements[1]!, mockElements[2]!]
      });
      
      expect(nodes).toHaveLength(3);
      const nodeIds = nodes.map(n => n.id);
      expect(nodeIds).toContain('char-1');
      expect(nodeIds).toContain('elem-2');
      expect(nodeIds).toContain('elem-3');
    });

    it('should handle partial entity specification', () => {
      const nodes = collector.collectSpecificEntities({
        puzzles: mockPuzzles
      });
      
      expect(nodes).toHaveLength(2);
      expect(nodes[0]?.id).toBe('puzzle-1');
      expect(nodes[1]?.id).toBe('puzzle-2');
    });

    it('should handle empty object', () => {
      const nodes = collector.collectSpecificEntities({});
      expect(nodes).toEqual([]);
    });

    it('should respect included IDs filter', () => {
      collector.setIncludedNodeIds(new Set(['char-1', 'elem-2']));
      
      const nodes = collector.collectSpecificEntities({
        characters: mockCharacters,
        elements: mockElements
      });
      
      expect(nodes).toHaveLength(2);
      const nodeIds = nodes.map(n => n.id);
      expect(nodeIds).toContain('char-1');
      expect(nodeIds).toContain('elem-2');
    });
  });

  describe('setIncludedNodeIds', () => {
    beforeEach(() => {
      collector = new NodeCollector(entityTransformer);
    });

    it('should update the included IDs filter', () => {
      // Initially no filter
      let nodes = collector.collectCharacterNodes(mockCharacters);
      expect(nodes).toHaveLength(3);
      
      // Set filter
      collector.setIncludedNodeIds(new Set(['char-1']));
      nodes = collector.collectCharacterNodes(mockCharacters);
      expect(nodes).toHaveLength(1);
      expect(nodes[0]?.id).toBe('char-1');
      
      // Update filter
      collector.setIncludedNodeIds(new Set(['char-2', 'char-3']));
      nodes = collector.collectCharacterNodes(mockCharacters);
      expect(nodes).toHaveLength(2);
      expect(nodes[0]?.id).toBe('char-2');
      expect(nodes[1]?.id).toBe('char-3');
      
      // Clear filter
      collector.setIncludedNodeIds(undefined);
      nodes = collector.collectCharacterNodes(mockCharacters);
      expect(nodes).toHaveLength(3);
    });
  });
});