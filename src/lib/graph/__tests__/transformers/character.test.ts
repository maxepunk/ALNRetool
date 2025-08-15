/**
 * Tests for Character Entity Transformer
 */

import { describe, it, expect, vi } from 'vitest';
import { transformCharacter, transformCharacters, getCharacterNodeStyle } from '../../transformers/character';
import type { Character } from '@/types/notion/app';

// Mock console methods
const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Character Transformer', () => {
  afterEach(() => {
    consoleSpy.mockClear();
  });

  const createMockCharacter = (overrides?: Partial<Character>): Character => ({
    id: 'char-1',
    name: 'Test Character',
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
    ...overrides,
  });

  describe('transformCharacter', () => {
    it('should transform a valid character', () => {
      const character = createMockCharacter();
      const node = transformCharacter(character, 0);

      expect(node).toBeDefined();
      expect(node?.id).toBe('char-1');
      expect(node?.type).toBe('character');
      expect(node?.data.entity).toBe(character);
      expect(node?.data.label).toBe('Test Character');
      expect(node?.data.metadata.entityType).toBe('character');
    });

    it('should handle missing required fields', () => {
      const character = createMockCharacter({ id: '', name: '' });
      const node = transformCharacter(character, 0);

      expect(node).toBeDefined();
      expect(node?.data.metadata.errorState).toBeDefined();
      expect(node?.data.metadata.errorState?.type).toBe('missing_data');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should calculate importance score for Core tier', () => {
      const character = createMockCharacter({
        tier: 'Core',
        ownedElementIds: ['e1', 'e2', 'e3'],
        characterPuzzleIds: ['p1', 'p2'],
        eventIds: ['t1', 't2', 't3', 't4'],
      });
      const node = transformCharacter(character, 0);

      // Core tier (10) + owned (3) + puzzles (4) + events (4) = 21
      expect(node?.data.metadata.importanceScore).toBe(21);
      expect(node?.data.metadata.visualHints?.size).toBe('large');
    });

    it('should calculate importance score for Secondary tier', () => {
      const character = createMockCharacter({
        tier: 'Secondary',
        ownedElementIds: ['e1'],
        characterPuzzleIds: [],
        eventIds: ['t1'],
      });
      const node = transformCharacter(character, 0);

      // Secondary tier (5) + owned (1) + puzzles (0) + events (1) = 7
      expect(node?.data.metadata.importanceScore).toBe(7);
      expect(node?.data.metadata.visualHints?.size).toBe('medium');
    });

    it('should calculate importance score for Tertiary tier', () => {
      const character = createMockCharacter({
        tier: 'Tertiary',
        ownedElementIds: [],
        characterPuzzleIds: [],
        eventIds: [],
      });
      const node = transformCharacter(character, 0);

      // Tertiary tier (2) + owned (0) + puzzles (0) + events (0) = 2
      expect(node?.data.metadata.importanceScore).toBe(2);
      expect(node?.data.metadata.visualHints?.size).toBe('small');
    });

    it('should assign correct visual hints by tier', () => {
      const core = createMockCharacter({ tier: 'Core' });
      const secondary = createMockCharacter({ tier: 'Secondary' });

      const coreNode = transformCharacter(core, 0);
      const secondaryNode = transformCharacter(secondary, 0);

      expect(coreNode?.data.metadata.visualHints?.color).toBe('#dc2626'); // Red for Core
      expect(secondaryNode?.data.metadata.visualHints?.color).toBe('#2563eb'); // Blue for Secondary
    });

    it('should handle null tier gracefully', () => {
      const character = createMockCharacter({ tier: undefined });
      const node = transformCharacter(character, 0);

      expect(node).toBeDefined();
      expect(node?.data.metadata.importanceScore).toBe(0);
      expect(node?.data.metadata.visualHints?.size).toBe('small');
    });
  });

  describe('transformCharacters', () => {
    it('should transform multiple characters', () => {
      const characters = [
        createMockCharacter({ id: 'char-1', name: 'Character 1' }),
        createMockCharacter({ id: 'char-2', name: 'Character 2' }),
        createMockCharacter({ id: 'char-3', name: 'Character 3' }),
      ];

      const nodes = transformCharacters(characters);

      expect(nodes).toHaveLength(3);
      expect(nodes[0]!.id).toBe('char-1');
      expect(nodes[1]!.id).toBe('char-2');
      expect(nodes[2]!.id).toBe('char-3');
    });

    it('should sort characters by importance score', () => {
      const characters = [
        createMockCharacter({ 
          id: 'char-1', 
          tier: 'Tertiary',
          ownedElementIds: [],
        }),
        createMockCharacter({ 
          id: 'char-2', 
          tier: 'Core',
          ownedElementIds: ['e1', 'e2', 'e3'],
        }),
        createMockCharacter({ 
          id: 'char-3', 
          tier: 'Secondary',
          ownedElementIds: ['e1'],
        }),
      ];

      const nodes = transformCharacters(characters);

      // Should be sorted by importance: Core > Secondary > Tertiary
      expect(nodes[0]!.id).toBe('char-2'); // Core with highest score
      expect(nodes[1]!.id).toBe('char-3'); // Secondary
      expect(nodes[2]!.id).toBe('char-1'); // Tertiary with lowest score
    });

    it('should handle empty array', () => {
      const nodes = transformCharacters([]);
      expect(nodes).toEqual([]);
    });

    it('should skip characters that fail transformation', () => {
      const characters = [
        createMockCharacter({ id: 'char-1' }),
        { ...createMockCharacter({ id: 'char-2' }), name: undefined } as any,
        createMockCharacter({ id: 'char-3' }),
      ];

      const nodes = transformCharacters(characters);

      // Should still get 3 nodes, but one with error state
      expect(nodes).toHaveLength(3);
    });
  });

  describe('getCharacterNodeStyle', () => {
    it('should return error style when node has error state', () => {
      const node = transformCharacter(createMockCharacter({ id: '', name: '' }), 0);
      
      if (node) {
        const style = getCharacterNodeStyle(node);
        expect(style.background).toBe('#fee2e2'); // Error background
        expect(style.border).toContain('solid'); // Player type has solid border
        expect(style.border).toContain('#dc2626'); // Error border color
      }
    });

    it('should return Core tier style', () => {
      const node = transformCharacter(createMockCharacter({ tier: 'Core', type: 'Player' }), 0);
      
      if (node) {
        const style = getCharacterNodeStyle(node);
        expect(style.background).toBe('#dc262615'); // Red with 15% opacity
        expect(style.border).toContain('solid'); // Player has solid border
        expect(style.border).toContain('#dc2626'); // Core tier color
      }
    });

    it('should return NPC style with dashed border', () => {
      const node = transformCharacter(createMockCharacter({ tier: 'Secondary', type: 'NPC' }), 0);
      
      if (node) {
        const style = getCharacterNodeStyle(node);
        expect(style.background).toBe('#2563eb15'); // Blue with 15% opacity
        expect(style.border).toContain('dashed'); // NPC has dashed border
        expect(style.border).toContain('#2563eb'); // Secondary tier color
      }
    });
  });
});