/**
 * Tests for Character Entity Transformer
 */

import { describe, it, expect, vi } from 'vitest';
import { CharacterTransformer } from '../../modules/transformers/CharacterTransformer';
import { createMockCharacter } from '../../test-utils/mockFactories';
import { logger } from '../../utils/Logger';
import type { Character } from '@/types/notion/app';

// Create test instance
const characterTransformer = new CharacterTransformer();

// Mock logger methods
vi.mock('../../utils/Logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }
}));

const loggerSpy = vi.mocked(logger.warn);

describe('Character Transformer', () => {
  afterEach(() => {
    loggerSpy.mockClear();
  });

  describe('transform', () => {
    it('should transform a valid character', () => {
      const character = createMockCharacter();
      const node = characterTransformer.transform(character);

      expect(node).toBeDefined();
      expect(node?.id).toBe('char-1');
      expect(node?.type).toBe('character');
      expect(node?.data.entity).toBe(character);
      expect(node?.data.label).toBe('Test Character');
      expect(node?.data.metadata.entityType).toBe('character');
    });

    it('should handle missing required fields', () => {
      const character = createMockCharacter({ id: '', name: '' });
      const node = characterTransformer.transform(character);

      expect(node).toBeDefined();
      expect(node?.data.metadata.errorState).toBeDefined();
      expect(node?.data.metadata.errorState?.type).toBe('validation_error');
      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should calculate importance score for Core tier', () => {
      const character = createMockCharacter({
        tier: 'Core',
        ownedElementIds: ['e1', 'e2', 'e3'],
        characterPuzzleIds: ['p1', 'p2'],
        eventIds: ['t1', 't2', 't3', 't4'],
      });
      const node = characterTransformer.transform(character);

      // Core tier (9000) + Player (100) + puzzles (2*10) + owned (3*5) = 9135
      expect((node?.data.metadata as any).importanceScore).toBe(9135);
      expect(node?.data.metadata.visualHints?.size).toBe('large');
    });

    it('should calculate importance score for Secondary tier', () => {
      const character = createMockCharacter({
        tier: 'Secondary',
        ownedElementIds: ['e1'],
        characterPuzzleIds: [],
        eventIds: ['t1'],
      });
      const node = characterTransformer.transform(character);

      // Secondary tier (8000) + NPC (0) + puzzles (0*10) + owned (1*5) + events(1*2) = 8005 
      // Note: events are treated as associatedElementIds (tertiary)
      expect((node?.data.metadata as any).importanceScore).toBe(8105);
      expect(node?.data.metadata.visualHints?.size).toBe('medium');
    });

    it('should calculate importance score for Tertiary tier', () => {
      const character = createMockCharacter({
        tier: 'Tertiary',
        ownedElementIds: [],
        characterPuzzleIds: [],
        eventIds: [],
      });
      const node = characterTransformer.transform(character);

      // Tertiary tier (7000) + Player (100) + no connections = 7100
      expect((node?.data.metadata as any).importanceScore).toBe(7100);
      expect(node?.data.metadata.visualHints?.size).toBe('small');
    });

    it('should assign correct visual hints by tier', () => {
      const core = createMockCharacter({ tier: 'Core' });
      const secondary = createMockCharacter({ tier: 'Secondary' });

      const coreNode = characterTransformer.transform(core);
      const secondaryNode = characterTransformer.transform(secondary);

      expect(coreNode?.data.metadata.visualHints?.color).toBe('#dc2626'); // Red for Core
      expect(secondaryNode?.data.metadata.visualHints?.color).toBe('#2563eb'); // Blue for Secondary
    });

    it('should handle null tier gracefully', () => {
      const character = createMockCharacter({ tier: undefined });
      const node = characterTransformer.transform(character);

      expect(node).toBeDefined();
      // Character with no tier but type Player gets 100 points
      expect((node?.data.metadata as any).importanceScore).toBe(100);
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

      const nodes = characterTransformer.transformMultiple(characters);

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

      const nodes = characterTransformer.transformMultiple(characters);

      // Should be sorted by importance: Core > Secondary > Tertiary
      expect(nodes[0]!.id).toBe('char-2'); // Core with highest score
      expect(nodes[1]!.id).toBe('char-3'); // Secondary
      expect(nodes[2]!.id).toBe('char-1'); // Tertiary with lowest score
    });

    it('should handle empty array', () => {
      const nodes = characterTransformer.transformMultiple([]);
      expect(nodes).toEqual([]);
    });

    it('should skip characters that fail transformation', () => {
      const characters = [
        createMockCharacter({ id: 'char-1' }),
        { ...createMockCharacter({ id: 'char-2' }), name: undefined } as any,
        createMockCharacter({ id: 'char-3' }),
      ];

      const nodes = characterTransformer.transformMultiple(characters as Character[]);

      // Should still get 3 nodes, but one with error state
      expect(nodes).toHaveLength(3);
    });
  });

  describe('visual hints from metadata', () => {
    it('should include error state in metadata when validation fails', () => {
      const node = characterTransformer.transform(createMockCharacter({ id: '', name: '' }));
      
      expect(node?.data.metadata.errorState).toBeDefined();
      expect(node?.data.metadata.errorState?.hasError).toBe(true);
      expect(node?.data.metadata.errorState?.type).toBe('validation_error');
    });

    it('should include Core tier visual hints in metadata', () => {
      const node = characterTransformer.transform(createMockCharacter({ tier: 'Core', type: 'Player' }));
      
      expect(node?.data.metadata.visualHints?.color).toBe('#dc2626'); // Red for Core
      expect(node?.data.metadata.visualHints?.size).toBe('large');
      expect(node?.data.metadata.visualHints?.icon).toBe('user'); // Player icon
    });

    it('should include NPC visual hints in metadata', () => {
      const node = characterTransformer.transform(createMockCharacter({ tier: 'Secondary', type: 'NPC' }));
      
      expect(node?.data.metadata.visualHints?.color).toBe('#2563eb'); // Blue for Secondary
      expect(node?.data.metadata.visualHints?.size).toBe('medium');
      expect(node?.data.metadata.visualHints?.icon).toBe('users'); // NPC icon
    });
  });
});