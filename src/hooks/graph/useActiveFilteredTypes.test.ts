import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActiveFilteredTypes } from './useActiveFilteredTypes';

describe('useActiveFilteredTypes', () => {
  describe('character filters', () => {
    it('should detect active character type filter', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          characterType: 'NPC',
        })
      );
      
      expect(result.current.has('character')).toBe(true);
      expect(result.current.size).toBe(1);
    });

    it('should not detect when character type is all', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          characterType: 'all',
        })
      );
      
      expect(result.current.has('character')).toBe(false);
      expect(result.current.size).toBe(0);
    });

    it('should detect active tier filters', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          characterSelectedTiers: new Set(['A', 'B']),  // Less than all 3
        })
      );
      
      expect(result.current.has('character')).toBe(true);
    });

    it('should not detect when all tiers selected', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          characterSelectedTiers: new Set(['A', 'B', 'C']),  // All 3 tiers
        })
      );
      
      expect(result.current.has('character')).toBe(false);
    });

    it('should detect ownership status filters', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          characterOwnershipStatus: new Set(['Locked']),
        })
      );
      
      expect(result.current.has('character')).toBe(true);
    });
  });

  describe('puzzle filters', () => {
    it('should detect active act filters', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          puzzleSelectedActs: new Set(['Act 1', 'Act 2']),  // Less than all 3
        })
      );
      
      expect(result.current.has('puzzle')).toBe(true);
    });

    it('should not detect when all acts selected', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          puzzleSelectedActs: new Set(['Act 0', 'Act 1', 'Act 2']),  // All 3 acts
        })
      );
      
      expect(result.current.has('puzzle')).toBe(false);
    });

    it('should detect completion status filter', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          puzzleCompletionStatus: 'completed',
        })
      );
      
      expect(result.current.has('puzzle')).toBe(true);
    });

    it('should not detect when completion is all', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          puzzleCompletionStatus: 'all',
        })
      );
      
      expect(result.current.has('puzzle')).toBe(false);
    });
  });

  describe('element filters', () => {
    it('should detect active basic type filters', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          elementBasicTypes: new Set(['Type1', 'Type2']),  // Less than all 7
        })
      );
      
      expect(result.current.has('element')).toBe(true);
    });

    it('should not detect when all basic types selected', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          elementBasicTypes: new Set(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']),  // All 7
        })
      );
      
      expect(result.current.has('element')).toBe(false);
    });

    it('should detect status filters', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          elementStatus: new Set(['In development']),
        })
      );
      
      expect(result.current.has('element')).toBe(true);
    });

    it('should detect content status filters', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          elementContentStatus: new Set(['draft', 'review']),
        })
      );
      
      expect(result.current.has('element')).toBe(true);
    });

    it('should detect has issues filter', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          elementHasIssues: true,
        })
      );
      
      expect(result.current.has('element')).toBe(true);
    });

    it('should not detect when has issues is null', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          elementHasIssues: null,
        })
      );
      
      expect(result.current.has('element')).toBe(false);
    });

    it('should detect last edited range filter', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          elementLastEditedRange: 'week',
        })
      );
      
      expect(result.current.has('element')).toBe(true);
    });

    it('should not detect when last edited is all', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          elementLastEditedRange: 'all',
        })
      );
      
      expect(result.current.has('element')).toBe(false);
    });
  });

  describe('multiple entity types', () => {
    it('should detect multiple active filter types', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          characterType: 'Player',
          puzzleCompletionStatus: 'incomplete',
          elementHasIssues: false,
        })
      );
      
      expect(result.current.has('character')).toBe(true);
      expect(result.current.has('puzzle')).toBe(true);
      expect(result.current.has('element')).toBe(true);
      expect(result.current.size).toBe(3);
    });

    it('should handle mixed active and inactive filters', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          characterType: 'all',  // Inactive
          puzzleCompletionStatus: 'completed',  // Active
          elementLastEditedRange: 'all',  // Inactive
        })
      );
      
      expect(result.current.has('character')).toBe(false);
      expect(result.current.has('puzzle')).toBe(true);
      expect(result.current.has('element')).toBe(false);
      expect(result.current.size).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined filters', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({})
      );
      
      expect(result.current.size).toBe(0);
    });

    it('should handle empty sets', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          characterSelectedTiers: new Set(),
          puzzleSelectedActs: new Set(),
          elementBasicTypes: new Set(),
        })
      );
      
      expect(result.current.size).toBe(0);
    });

    it('should never include timeline', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          characterType: 'NPC',
          puzzleCompletionStatus: 'completed',
          elementHasIssues: true,
        })
      );
      
      expect(result.current.has('timeline')).toBe(false);
    });
  });

  describe('memoization', () => {
    it('should return same set reference when filters dont change', () => {
      const filters = {
        characterType: 'NPC' as const,
      };
      
      const { result, rerender } = renderHook(() => 
        useActiveFilteredTypes(filters)
      );
      
      const firstResult = result.current;
      
      // Rerender with same filters
      rerender();
      
      expect(result.current).toBe(firstResult);  // Same reference
    });

    it('should return new set when filters change', () => {
      type CharType = 'all' | 'Player' | 'NPC';
      const { result, rerender } = renderHook(
        ({ type }: { type: CharType }) => 
          useActiveFilteredTypes({ characterType: type }),
        { initialProps: { type: 'NPC' as CharType } }
      );
      
      const firstResult = result.current;
      
      // Rerender with different filter
      rerender({ type: 'Player' as CharType });
      
      expect(result.current).not.toBe(firstResult);  // New reference
      expect(result.current.has('character')).toBe(true);  // Still active
    });
  });

  describe('entity visibility integration', () => {
    it('should not include hidden entity types even with active filters', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          entityVisibility: {
            character: false,  // Hidden
            puzzle: true,
            element: true,
            timeline: true,
          },
          characterType: 'NPC',  // Active filter but entity is hidden
          puzzleCompletionStatus: 'completed',  // Active filter and visible
        })
      );
      
      expect(result.current.has('character')).toBe(false);  // Hidden despite filter
      expect(result.current.has('puzzle')).toBe(true);  // Visible with filter
      expect(result.current.size).toBe(1);
    });

    it('should include visible entity types with active filters', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          entityVisibility: {
            character: true,
            puzzle: true,
            element: false,  // Hidden
            timeline: true,
          },
          characterType: 'NPC',  // Active and visible
          elementHasIssues: true,  // Active but hidden
        })
      );
      
      expect(result.current.has('character')).toBe(true);  // Visible with filter
      expect(result.current.has('element')).toBe(false);  // Hidden despite filter
      expect(result.current.size).toBe(1);
    });

    it('should handle undefined entityVisibility (defaults to visible)', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          // No entityVisibility provided
          characterType: 'NPC',
        })
      );
      
      expect(result.current.has('character')).toBe(true);  // Defaults to visible
      expect(result.current.size).toBe(1);
    });

    it('should handle all entities hidden', () => {
      const { result } = renderHook(() => 
        useActiveFilteredTypes({
          entityVisibility: {
            character: false,
            puzzle: false,
            element: false,
            timeline: false,
          },
          characterType: 'NPC',
          puzzleCompletionStatus: 'completed',
          elementHasIssues: true,
        })
      );
      
      expect(result.current.size).toBe(0);  // No active filters since all hidden
    });
  });
});