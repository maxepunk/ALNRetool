/**
 * PuzzleTransformer Module
 * Transforms Puzzle entities into graph nodes with proper metadata
 */

import type { Puzzle } from '@/types/notion/app';
import type { NodeMetadata, VisualHints } from '../../types';
import { BaseTransformer } from '../BaseTransformer';

export class PuzzleTransformer extends BaseTransformer<Puzzle> {
  protected entityType = 'puzzle' as const;
  protected nodeType = 'puzzle';

  /**
   * Override label generation to add timing information
   */
  protected generateLabel(puzzle: Puzzle): string {
    let label = puzzle.name || 'Unnamed Puzzle';
    
    // Add timing information if available
    if (puzzle.timing && puzzle.timing.length > 0) {
      const timing = puzzle.timing[0]; // Use first timing entry
      label += ` (${timing})`;
    }
    
    return label;
  }

  /**
   * Create puzzle-specific metadata
   */
  protected createMetadata(puzzle: Puzzle, errors: string[]): NodeMetadata {
    const visualHints: VisualHints = {
      shape: 'diamond',
      size: this.determinePuzzleSize(puzzle),
    };

    // Add lock icon if puzzle is locked
    if (puzzle.lockedItemId) {
      visualHints.icon = 'lock';
    }

    return this.createBaseMetadata(puzzle, errors, visualHints);
  }

  /**
   * Determine puzzle size based on complexity
   */
  private determinePuzzleSize(puzzle: Puzzle): 'small' | 'medium' | 'large' {
    // Large if has sub-puzzles (parent puzzle)
    if (puzzle.subPuzzleIds && puzzle.subPuzzleIds.length > 0) {
      return 'large';
    }
    
    // Small if is a sub-puzzle (child puzzle)
    if (puzzle.parentItemId) {
      return 'small';
    }
    
    // Medium for standalone puzzles
    return 'medium';
  }

  /**
   * Override validation for puzzle-specific rules
   */
  protected validateEntity(puzzle: Puzzle): string[] {
    const errors = super.validateEntity(puzzle);
    
    // Check for circular parent-child relationships
    if (puzzle.parentItemId && puzzle.subPuzzleIds?.includes(puzzle.parentItemId)) {
      errors.push(`Circular dependency: puzzle is both parent and child of ${puzzle.parentItemId}`);
    }
    
    return errors;
  }
}