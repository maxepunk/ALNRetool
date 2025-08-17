/**
 * Tests for Element Entity Transformer
 */

import { describe, it, expect, vi } from 'vitest';
import { ElementTransformer } from '../../modules/transformers/ElementTransformer';
import type { Element, ElementStatus } from '@/types/notion/app';

// Create test instance
const elementTransformer = new ElementTransformer();

// Mock the patterns module
vi.mock('../../patterns', () => ({
  extractSFMetadata: vi.fn((text) => {
    if (!text) return { metadata: {}, patternsFound: [], warnings: [] };
    if (text.includes('SF_RFID')) {
      return {
        metadata: { rfid: 'TEST-001', valueRating: 4 },
        patternsFound: ['SF_RFID', 'SF_ValueRating'],
        warnings: [],
      };
    }
    return { metadata: {}, patternsFound: [], warnings: [] };
  }),
  hasSFPatterns: vi.fn((text) => text?.includes('SF_')),
}));

describe('Element Transformer', () => {
  const createMockElement = (overrides?: Partial<Element>): Element => ({
    id: 'elem-1',
    name: 'Test Element',
    descriptionText: '',
    sfPatterns: { rfid: '', valueRating: 1, memoryType: 'Personal', group: { name: '', multiplier: '1' } },
    basicType: 'Prop',
    ownerId: undefined,
    containerId: undefined,
    contentIds: [],
    timelineEventId: undefined,
    status: 'Done',
    firstAvailable: null,
    requiredForPuzzleIds: [],
    rewardedByPuzzleIds: [],
    containerPuzzleId: undefined,
    narrativeThreads: [],
    associatedCharacterIds: [],
    puzzleChain: [],
    productionNotes: '',
    filesMedia: [],
    contentLink: undefined,
    isContainer: false,
    ...overrides,
  });

  describe('transform', () => {
    it('should transform a valid element', () => {
      const element = createMockElement();
      const node = elementTransformer.transform(element);

      expect(node).toBeDefined();
      expect(node?.id).toBe('elem-1');
      expect(node?.type).toBe('element');
      expect(node?.data.entity).toBe(element);
      expect(node?.data.label).toBe('Test Element');
      expect(node?.data.metadata.entityType).toBe('element');
    });

    it('should handle SF_ patterns in description', () => {
      const element = createMockElement({
        descriptionText: 'SF_RFID: [TEST-001] SF_ValueRating: [4]',
      });
      const node = elementTransformer.transform(element);

      expect(node?.data.metadata.sfPatterns).toBeDefined();
      expect(node?.data.metadata.sfPatterns?.rfid).toBe('TEST-001');
      expect(node?.data.metadata.visualHints?.size).toBe('large'); // High value rating
    });

    it('should determine correct node size', () => {
      // Container element
      const container = createMockElement({
        contentIds: ['elem-2', 'elem-3'],
      });
      const containerNode = elementTransformer.transform(container);
      expect(containerNode?.data.metadata.visualHints?.size).toBe('medium');

      // Locked container
      const locked = createMockElement({
        containerPuzzleId: 'puzzle-1',
      });
      const lockedNode = elementTransformer.transform(locked);
      expect(lockedNode?.data.metadata.visualHints?.size).toBe('medium');

      // Regular element
      const regular = createMockElement();
      const regularNode = elementTransformer.transform(regular);
      expect(regularNode?.data.metadata.visualHints?.size).toBe('small');
    });

    it('should apply correct status colors', () => {
      const statuses: Array<{ status: ElementStatus, color: string }> = [
        { status: 'Done', color: '#10b981' },
        { status: 'In development', color: '#eab308' },
        { status: 'Idea/Placeholder', color: '#9ca3af' },
        { status: 'in space playtest ready', color: '#10b981' },
        { status: 'Ready for Playtest', color: '#10b981' },
      ];

      statuses.forEach(({ status, color }) => {
        const element = createMockElement({ status });
        const node = elementTransformer.transform(element);
        expect(node?.data.metadata.visualHints?.color).toBe(color);
      });
    });

    it('should add type abbreviation to label for special types', () => {
      const memoryToken = createMockElement({
        name: 'CEO Memory',
        basicType: 'Memory Token (Audio)',
      });
      const node = elementTransformer.transform(memoryToken);
      expect(node?.data.label).toBe('[MT] CEO Memory');
    });

    it('should handle validation errors', () => {
      const invalid = createMockElement({
        id: '',
        name: '',
      });
      const node = elementTransformer.transform(invalid);

      expect(node?.data.metadata.errorState).toBeDefined();
      expect(node?.data.metadata.errorState?.type).toBe('validation_error');
      expect(node?.data.metadata.errorState?.message).toContain('Missing entity ID');
      expect(node?.data.metadata.errorState?.message).toContain('Missing entity name');
    });

    it('should have correct visual hints shape', () => {
      const element = createMockElement({ basicType: 'Prop' });
      const node = elementTransformer.transform(element);
      
      // ElementTransformer uses rectangle shape for all elements, no icons
      expect(node?.data.metadata.visualHints?.shape).toBe('rectangle');
      expect(node?.data.metadata.visualHints?.icon).toBeUndefined();
    });
  });

  describe('transformMultiple', () => {
    it('should transform multiple elements', () => {
      const elements = [
        createMockElement({ id: 'elem-1', name: 'Element 1' }),
        createMockElement({ id: 'elem-2', name: 'Element 2' }),
        createMockElement({ id: 'elem-3', name: 'Element 3' }),
      ];

      const nodes = elementTransformer.transformMultiple(elements);

      expect(nodes).toHaveLength(3);
      expect(nodes.map((n: any) => n.id)).toEqual(['elem-1', 'elem-2', 'elem-3']);
    });

    it('should sort elements by status', () => {
      const elements = [
        createMockElement({ id: 'elem-1', status: 'Done' }),
        createMockElement({ id: 'elem-2', status: 'Idea/Placeholder' }),
        createMockElement({ id: 'elem-3', status: 'In development' }),
      ];

      const nodes = elementTransformer.transformMultiple(elements);

      // Should be sorted: Done -> In development -> Idea/Placeholder (production-ready first)
      expect(nodes[0]!.data.entity.status).toBe('Done');
      expect(nodes[1]!.data.entity.status).toBe('In development');
      expect(nodes[2]!.data.entity.status).toBe('Idea/Placeholder');
    });

    it('should handle empty array', () => {
      const nodes = elementTransformer.transformMultiple([]);
      expect(nodes).toEqual([]);
    });
  });

  // Note: getElementNodeStyle, isContainer, and getSpecialElements
  // have been removed as styling is now handled in React components
  // and helper functions are internal to the ElementTransformer class
});