/**
 * Tests for Puzzle Entity Transformer
 */

import { describe, it, expect, vi } from 'vitest';
import { 
  transformPuzzle, 
  transformPuzzles,
  getPuzzleNodeStyle,
  buildPuzzleHierarchy,
  groupPuzzlesByTiming,
  findPuzzleChains
} from '../../transformers/puzzle';
import type { Puzzle } from '@/types/notion/app';

// Mock console methods
const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Puzzle Transformer', () => {
  afterEach(() => {
    consoleSpy.mockClear();
  });

  const createMockPuzzle = (overrides?: Partial<Puzzle>): Puzzle => ({
    id: 'puzzle-1',
    name: 'Test Puzzle',
    descriptionSolution: 'Solve by doing X',
    puzzleElementIds: [],
    lockedItemId: null,
    ownerId: null,
    rewardIds: [],
    parentItemId: null,
    subPuzzleIds: [],
    storyRevealIds: [],
    timing: null,
    narrativeThreads: null,
    assetLink: null,
    lastEditedTime: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  describe('transformPuzzle', () => {
    it('should transform a valid puzzle', () => {
      const puzzle = createMockPuzzle();
      const node = transformPuzzle(puzzle, 0);

      expect(node).toBeDefined();
      expect(node?.id).toBe('puzzle-1');
      expect(node?.type).toBe('puzzle');
      expect(node?.data.entity).toBe(puzzle);
      expect(node?.data.label).toBe('Test Puzzle');
      expect(node?.data.metadata.entityType).toBe('puzzle');
    });

    it('should calculate complexity levels', () => {
      // Simple puzzle (≤1 requirement, no chain)
      const simple = createMockPuzzle({
        puzzleElementIds: ['elem-1'],
      });
      const simpleNode = transformPuzzle(simple, 0);
      expect(simpleNode?.data.metadata.visualHints?.size).toBe('small');
      expect(simpleNode?.data.metadata.visualHints?.color).toBe('#10b981'); // Green

      // Moderate puzzle (2-3 requirements)
      const moderate = createMockPuzzle({
        puzzleElementIds: ['elem-1', 'elem-2', 'elem-3'],
      });
      const moderateNode = transformPuzzle(moderate, 0);
      expect(moderateNode?.data.metadata.visualHints?.size).toBe('medium');
      expect(moderateNode?.data.metadata.visualHints?.color).toBe('#3b82f6'); // Blue

      // Complex puzzle (>3 requirements)
      const complex = createMockPuzzle({
        puzzleElementIds: ['elem-1', 'elem-2', 'elem-3', 'elem-4', 'elem-5'],
      });
      const complexNode = transformPuzzle(complex, 0);
      expect(complexNode?.data.metadata.visualHints?.size).toBe('large');
      expect(complexNode?.data.metadata.visualHints?.color).toBe('#f59e0b'); // Amber
    });

    it('should handle timing colors', () => {
      const timings = [
        { timing: ['Act 0'], color: '#6b7280' }, // Gray
        { timing: ['Act 1'], color: '#3b82f6' }, // Blue
        { timing: ['Act 2'], color: '#f59e0b' }, // Amber
      ];

      timings.forEach(({ timing, color }) => {
        const puzzle = createMockPuzzle({ timing });
        const node = transformPuzzle(puzzle, 0);
        expect(node?.data.metadata.visualHints?.color).toBe(color);
      });
    });

    it('should generate correct labels', () => {
      // Sub-puzzle indicator
      const subPuzzle = createMockPuzzle({
        name: 'Sub Puzzle',
        parentItemId: 'puzzle-parent',
      });
      const subNode = transformPuzzle(subPuzzle, 0);
      expect(subNode?.data.label).toBe('↳ Sub Puzzle');

      // Has sub-puzzles indicator
      const parent = createMockPuzzle({
        name: 'Parent Puzzle',
        subPuzzleIds: ['sub-1', 'sub-2'],
      });
      const parentNode = transformPuzzle(parent, 0);
      expect(parentNode?.data.label).toBe('Parent Puzzle [2+]');

      // Timing indicator
      const timed = createMockPuzzle({
        name: 'Timed Puzzle',
        timing: ['Act 1'],
      });
      const timedNode = transformPuzzle(timed, 0);
      expect(timedNode?.data.label).toBe('Timed Puzzle (Act 1)');
    });

    it('should detect locked puzzles', () => {
      const locked = createMockPuzzle({
        lockedItemId: 'elem-container',
      });
      const node = transformPuzzle(locked, 0);
      expect(node?.data.metadata.visualHints?.icon).toBe('lock');
    });

    it('should validate puzzle consistency', () => {
      // Self-referential sub-puzzle
      const selfRef = createMockPuzzle({
        id: 'puzzle-1',
        subPuzzleIds: ['puzzle-1', 'puzzle-2'],
      });
      const selfRefNode = transformPuzzle(selfRef, 0);
      expect(selfRefNode?.data.metadata.errorState).toBeDefined();
      expect(selfRefNode?.data.metadata.errorState?.message).toContain('references itself');

      // Self-referential parent
      const selfParent = createMockPuzzle({
        id: 'puzzle-1',
        parentItemId: 'puzzle-1',
      });
      const selfParentNode = transformPuzzle(selfParent, 0);
      expect(selfParentNode?.data.metadata.errorState).toBeDefined();

      // Rewards without solution warning
      const noSolution = createMockPuzzle({
        rewardIds: ['elem-1'],
        descriptionSolution: null,
      });
      transformPuzzle(noSolution, 0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('has rewards but no solution')
      );
    });

    it('should handle missing required fields', () => {
      const invalid = createMockPuzzle({
        id: '',
        name: '',
      });
      const node = transformPuzzle(invalid, 0);

      expect(node?.data.metadata.errorState).toBeDefined();
      expect(node?.data.metadata.errorState?.type).toBe('invalid_relation');
      expect(node?.data.metadata.errorState?.message).toContain('Missing puzzle ID');
      expect(node?.data.metadata.errorState?.message).toContain('Missing puzzle name');
    });
  });

  describe('transformPuzzles', () => {
    it('should transform and sort puzzles by importance', () => {
      const puzzles = [
        createMockPuzzle({ 
          id: 'puzzle-1',
          parentItemId: 'puzzle-parent', // Sub-puzzle (low importance)
        }),
        createMockPuzzle({ 
          id: 'puzzle-2',
          subPuzzleIds: ['sub-1', 'sub-2'], // Has children (high importance)
        }),
        createMockPuzzle({ 
          id: 'puzzle-3',
          timing: ['Act 0'], // Early timing (high importance)
        }),
      ];

      const nodes = transformPuzzles(puzzles);

      // Should be sorted by importance score
      expect(nodes[0].id).toBe('puzzle-3'); // Act 0 + root = highest
      expect(nodes[1].id).toBe('puzzle-2'); // Has sub-puzzles
      expect(nodes[2].id).toBe('puzzle-1'); // Sub-puzzle = lowest
    });
  });

  describe('getPuzzleNodeStyle', () => {
    it('should apply diamond transformation', () => {
      const puzzle = createMockPuzzle();
      const node = transformPuzzle(puzzle, 0);
      
      if (node) {
        const style = getPuzzleNodeStyle(node);
        expect(style.transform).toBe('rotate(45deg)');
        expect(style['& > *'].transform).toBe('rotate(-45deg)');
      }
    });

    it('should style locked puzzles differently', () => {
      const locked = createMockPuzzle({
        lockedItemId: 'elem-1',
      });
      const node = transformPuzzle(locked, 0);
      
      if (node) {
        const style = getPuzzleNodeStyle(node);
        expect(style.background).toBe('#fef3c7'); // Yellow tint
        expect(style['&::after']).toBeDefined(); // Lock badge
      }
    });

    it('should use dashed border for sub-puzzles', () => {
      const subPuzzle = createMockPuzzle({
        parentItemId: 'puzzle-parent',
      });
      const node = transformPuzzle(subPuzzle, 0);
      
      if (node) {
        const style = getPuzzleNodeStyle(node);
        expect(style.border).toContain('dashed');
      }
    });

    it('should adjust size based on complexity', () => {
      const complex = createMockPuzzle({
        puzzleElementIds: ['e1', 'e2', 'e3', 'e4', 'e5'],
      });
      const node = transformPuzzle(complex, 0);
      
      if (node) {
        const style = getPuzzleNodeStyle(node);
        expect(style.minWidth).toBe('200px'); // Large size
        expect(style.fontSize).toBe('14px');
      }
    });
  });

  describe('buildPuzzleHierarchy', () => {
    it('should organize puzzles into hierarchy', () => {
      const puzzles = [
        createMockPuzzle({ id: 'root-1' }),
        createMockPuzzle({ id: 'root-2' }),
        createMockPuzzle({ id: 'child-1', parentItemId: 'root-1' }),
        createMockPuzzle({ id: 'child-2', parentItemId: 'root-1' }),
        createMockPuzzle({ id: 'grandchild-1', parentItemId: 'child-1' }),
      ];

      const { roots, tree, puzzleMap } = buildPuzzleHierarchy(puzzles);

      expect(roots).toHaveLength(2);
      expect(roots.map(r => r.id)).toEqual(['root-1', 'root-2']);

      expect(tree.get('root-1')).toHaveLength(2);
      expect(tree.get('root-1')?.map(p => p.id)).toEqual(['child-1', 'child-2']);

      expect(tree.get('child-1')).toHaveLength(1);
      expect(tree.get('child-1')?.[0].id).toBe('grandchild-1');

      expect(puzzleMap.size).toBe(5);
    });
  });

  describe('groupPuzzlesByTiming', () => {
    it('should group puzzles by act timing', () => {
      const puzzles = [
        createMockPuzzle({ id: 'p1', timing: ['Act 0'] }),
        createMockPuzzle({ id: 'p2', timing: ['Act 1'] }),
        createMockPuzzle({ id: 'p3', timing: ['Act 2'] }),
        createMockPuzzle({ id: 'p4', timing: ['Act 1', 'Act 2'] }), // Multiple acts
        createMockPuzzle({ id: 'p5' }), // No timing
      ];

      const groups = groupPuzzlesByTiming(puzzles);

      expect(groups.act0).toHaveLength(1);
      expect(groups.act0[0].id).toBe('p1');

      expect(groups.act1).toHaveLength(2); // p2 and p4
      expect(groups.act1.map(p => p.id)).toContain('p2');
      expect(groups.act1.map(p => p.id)).toContain('p4');

      expect(groups.act2).toHaveLength(2); // p3 and p4
      expect(groups.act2.map(p => p.id)).toContain('p3');
      expect(groups.act2.map(p => p.id)).toContain('p4');

      expect(groups.unknown).toHaveLength(1);
      expect(groups.unknown[0].id).toBe('p5');
    });
  });

  describe('findPuzzleChains', () => {
    it('should find puzzle chains', () => {
      const puzzles = [
        createMockPuzzle({ id: 'root' }),
        createMockPuzzle({ id: 'child-1', parentItemId: 'root' }),
        createMockPuzzle({ id: 'child-2', parentItemId: 'root' }),
        createMockPuzzle({ id: 'grandchild', parentItemId: 'child-1' }),
        createMockPuzzle({ id: 'standalone' }),
      ];

      // Need to set up sub-puzzle relationships for chain finding
      puzzles[0].subPuzzleIds = ['child-1', 'child-2'];
      puzzles[1].subPuzzleIds = ['grandchild'];

      const chains = findPuzzleChains(puzzles);

      // Should find 2 chains: root->child-1->grandchild and root->child-2
      expect(chains).toHaveLength(2);

      const longChain = chains.find(c => c.length === 3);
      expect(longChain?.map(p => p.id)).toEqual(['root', 'child-1', 'grandchild']);

      const shortChain = chains.find(c => c.length === 2);
      expect(shortChain?.map(p => p.id)).toEqual(['root', 'child-2']);
    });

    it('should not include single puzzles as chains', () => {
      const puzzles = [
        createMockPuzzle({ id: 'single-1' }),
        createMockPuzzle({ id: 'single-2' }),
      ];

      const chains = findPuzzleChains(puzzles);
      expect(chains).toHaveLength(0);
    });
  });
});