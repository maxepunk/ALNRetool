/**
 * Tests for Puzzle Entity Transformer
 */

import { describe, it, expect, vi } from 'vitest';
import { PuzzleTransformer } from '../../modules/transformers/PuzzleTransformer';
import { createMockPuzzle } from '../../test-utils/mockFactories';
import type { Act } from '@/types/notion/app';

// Create test instance
const puzzleTransformer = new PuzzleTransformer();

// Mock console methods
const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Puzzle Transformer', () => {
  afterEach(() => {
    consoleSpy.mockClear();
  });

  describe('transform', () => {
    it('should transform a valid puzzle', () => {
      const puzzle = createMockPuzzle({ timing: [] });
      const node = puzzleTransformer.transform(puzzle);

      expect(node).toBeDefined();
      expect(node?.id).toBe('puzzle-1');
      expect(node?.type).toBe('puzzle');
      expect(node?.data.entity).toBe(puzzle);
      expect(node?.data.label).toBe('Test Puzzle');
      expect(node?.data.metadata.entityType).toBe('puzzle');
    });

    it('should calculate complexity levels', () => {
      // Simple puzzle (is a sub-puzzle)
      const simple = createMockPuzzle({
        puzzleElementIds: ['elem-1'],
        parentItemId: 'parent-puzzle',
      });
      const simpleNode = puzzleTransformer.transform(simple);
      expect(simpleNode?.data.metadata.visualHints?.size).toBe('small');
      // Color not set by PuzzleTransformer
      expect(simpleNode?.data.metadata.visualHints?.color).toBeUndefined();

      // Moderate puzzle (standalone)
      const moderate = createMockPuzzle({
        puzzleElementIds: ['elem-1', 'elem-2', 'elem-3'],
      });
      const moderateNode = puzzleTransformer.transform(moderate);
      expect(moderateNode?.data.metadata.visualHints?.size).toBe('medium');
      
      // Complex puzzle (has sub-puzzles)
      const complex = createMockPuzzle({
        puzzleElementIds: ['elem-1', 'elem-2', 'elem-3', 'elem-4', 'elem-5'],
        subPuzzleIds: ['sub-1', 'sub-2'],
      });
      const complexNode = puzzleTransformer.transform(complex);
      expect(complexNode?.data.metadata.visualHints?.size).toBe('large');
    });

    it('should add timing to label', () => {
      const timings: Act[] = ['Act 0', 'Act 1', 'Act 2'];

      timings.forEach((timing) => {
        const puzzle = createMockPuzzle({ 
          name: 'Test Puzzle',
          timing: [timing] 
        });
        const node = puzzleTransformer.transform(puzzle);
        expect(node?.data.label).toBe(`Test Puzzle (${timing})`);
        // PuzzleTransformer doesn't set colors based on timing
        expect(node?.data.metadata.visualHints?.color).toBeUndefined();
      });
    });

    it('should generate correct labels', () => {
      // Sub-puzzle - no special prefix in current implementation
      const subPuzzle = createMockPuzzle({
        name: 'Sub Puzzle',
        parentItemId: 'puzzle-parent',
        timing: [],
      });
      const subNode = puzzleTransformer.transform(subPuzzle);
      expect(subNode?.data.label).toBe('Sub Puzzle');

      // Has sub-puzzles - no special suffix in current implementation
      const parent = createMockPuzzle({
        name: 'Parent Puzzle',
        subPuzzleIds: ['sub-1', 'sub-2'],
        timing: [],
      });
      const parentNode = puzzleTransformer.transform(parent);
      expect(parentNode?.data.label).toBe('Parent Puzzle');

      // Timing indicator - this is implemented
      const timed = createMockPuzzle({
        name: 'Timed Puzzle',
        timing: ['Act 1'],
      });
      const timedNode = puzzleTransformer.transform(timed);
      expect(timedNode?.data.label).toBe('Timed Puzzle (Act 1)');
    });

    it('should detect locked puzzles', () => {
      const locked = createMockPuzzle({
        lockedItemId: 'elem-container',
      });
      const node = puzzleTransformer.transform(locked);
      expect(node?.data.metadata.visualHints?.icon).toBe('lock');
    });

    it('should validate puzzle consistency', () => {
      // Circular parent-child relationship (the only validation PuzzleTransformer implements)
      const circular = createMockPuzzle({
        id: 'puzzle-1',
        parentItemId: 'puzzle-2',
        subPuzzleIds: ['puzzle-2'],
      });
      const circularNode = puzzleTransformer.transform(circular);
      expect(circularNode?.data.metadata.errorState).toBeDefined();
      expect(circularNode?.data.metadata.errorState?.message).toContain('Circular dependency');
    });

    it('should handle missing required fields', () => {
      const invalid = createMockPuzzle({
        id: '',
        name: '',
      });
      const node = puzzleTransformer.transform(invalid);

      expect(node?.data.metadata.errorState).toBeDefined();
      expect(node?.data.metadata.errorState?.type).toBe('validation_error');
      expect(node?.data.metadata.errorState?.message).toContain('Missing entity ID');
      expect(node?.data.metadata.errorState?.message).toContain('Missing entity name');
    });
  });

  describe('transformMultiple', () => {
    it('should transform and sort puzzles alphabetically', () => {
      const puzzles = [
        createMockPuzzle({ 
          id: 'puzzle-3',
          name: 'Zebra Puzzle',
        }),
        createMockPuzzle({ 
          id: 'puzzle-1',
          name: 'Alpha Puzzle',
        }),
        createMockPuzzle({ 
          id: 'puzzle-2',
          name: 'Beta Puzzle',
        }),
      ];

      const nodes = puzzleTransformer.transformMultiple(puzzles);

      // Should be sorted alphabetically by name (BaseTransformer default)
      expect(nodes[0]?.id).toBe('puzzle-1'); // Alpha
      expect(nodes[1]?.id).toBe('puzzle-2'); // Beta
      expect(nodes[2]?.id).toBe('puzzle-3'); // Zebra
    });
  });

});

// Note: getPuzzleNodeStyle, buildPuzzleHierarchy, groupPuzzlesByTiming,
// and findPuzzleChains have been removed as styling is now handled
// in React components and helper functions are internal to PuzzleTransformer

/* Removed tests for non-existent functions
describe('getPuzzleNodeStyle', () => {
    it('should apply diamond transformation', () => {
      const puzzle = createMockPuzzle();
      const node = puzzleTransformer.transform(puzzle);
      
      if (node) {
        const style = getPuzzleNodeStyle(node);
        expect(style.transform).toBe('rotate(45deg)');
        // Counter-rotation is now handled in CSS modules, not inline styles
      }
    });

    it('should style locked puzzles differently', () => {
      const locked = createMockPuzzle({
        lockedItemId: 'elem-1',
      });
      const node = puzzleTransformer.transform(locked);
      
      if (node) {
        const style = getPuzzleNodeStyle(node);
        expect(style.background).toBe('#fef3c7'); // Yellow tint
        // Lock badge is now rendered as a React element in the component
      }
    });

    it('should use dashed border for sub-puzzles', () => {
      const subPuzzle = createMockPuzzle({
        parentItemId: 'puzzle-parent',
      });
      const node = puzzleTransformer.transform(subPuzzle);
      
      if (node) {
        const style = getPuzzleNodeStyle(node);
        expect(style.border).toContain('dashed');
      }
    });

    it('should adjust size based on complexity', () => {
      const complex = createMockPuzzle({
        puzzleElementIds: ['e1', 'e2', 'e3', 'e4', 'e5'],
      });
      const node = puzzleTransformer.transform(complex);
      
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
      expect(tree.get('child-1')?.[0]?.id).toBe('grandchild-1');

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
      expect(groups.act0[0]?.id).toBe('p1');

      expect(groups.act1).toHaveLength(2); // p2 and p4
      expect(groups.act1.map(p => p.id)).toContain('p2');
      expect(groups.act1.map(p => p.id)).toContain('p4');

      expect(groups.act2).toHaveLength(2); // p3 and p4
      expect(groups.act2.map(p => p.id)).toContain('p3');
      expect(groups.act2.map(p => p.id)).toContain('p4');

      expect(groups.unknown).toHaveLength(1);
      expect(groups.unknown[0]?.id).toBe('p5');
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
      puzzles[0]!.subPuzzleIds = ['child-1', 'child-2'];
      puzzles[1]!.subPuzzleIds = ['grandchild'];

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
*/