/**
 * Tests for Element Entity Transformer
 */

import { describe, it, expect, vi } from 'vitest';
import { 
  transformElement, 
  transformElements, 
  getElementNodeStyle,
  isContainer,
  getSpecialElements 
} from '../../transformers/element';
import type { Element, ElementBasicType, ElementStatus } from '@/types/notion/app';

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

  describe('transformElement', () => {
    it('should transform a valid element', () => {
      const element = createMockElement();
      const node = transformElement(element, 0);

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
      const node = transformElement(element, 0);

      expect(node?.data.metadata.sfPatterns).toBeDefined();
      expect(node?.data.metadata.sfPatterns?.rfid).toBe('TEST-001');
      expect(node?.data.metadata.visualHints?.size).toBe('large'); // High value rating
    });

    it('should determine correct node size', () => {
      // Container element
      const container = createMockElement({
        contentIds: ['elem-2', 'elem-3'],
      });
      const containerNode = transformElement(container, 0);
      expect(containerNode?.data.metadata.visualHints?.size).toBe('medium');

      // Locked container
      const locked = createMockElement({
        containerPuzzleId: 'puzzle-1',
      });
      const lockedNode = transformElement(locked, 0);
      expect(lockedNode?.data.metadata.visualHints?.size).toBe('medium');

      // Regular element
      const regular = createMockElement();
      const regularNode = transformElement(regular, 0);
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
        const node = transformElement(element, 0);
        expect(node?.data.metadata.visualHints?.color).toBe(color);
      });
    });

    it('should add type abbreviation to label for special types', () => {
      const memoryToken = createMockElement({
        name: 'CEO Memory',
        basicType: 'Memory Token (Audio)',
      });
      const node = transformElement(memoryToken, 0);
      expect(node?.data.label).toBe('[MT] CEO Memory');
    });

    it('should handle validation errors', () => {
      const invalid = createMockElement({
        id: '',
        name: '',
      });
      const node = transformElement(invalid, 0);

      expect(node?.data.metadata.errorState).toBeDefined();
      expect(node?.data.metadata.errorState?.type).toBe('missing_data');
      expect(node?.data.metadata.errorState?.message).toContain('Missing element ID');
      expect(node?.data.metadata.errorState?.message).toContain('Missing element name');
    });

    it('should select correct icons by type', () => {
      const types: Array<{ basicType: ElementBasicType, icon: string }> = [
        { basicType: 'Set Dressing', icon: 'home' },
        { basicType: 'Prop', icon: 'box' },
        { basicType: 'Memory Token (Audio)', icon: 'disc' },
        { basicType: 'Document', icon: 'file-text' },
        { basicType: 'Memory Token (Video)', icon: 'volume-2' },
      ];

      types.forEach(({ basicType, icon }) => {
        const element = createMockElement({ basicType });
        const node = transformElement(element, 0);
        expect(node?.data.metadata.visualHints?.icon).toBe(icon);
      });
    });
  });

  describe('transformElements', () => {
    it('should transform multiple elements', () => {
      const elements = [
        createMockElement({ id: 'elem-1', name: 'Element 1' }),
        createMockElement({ id: 'elem-2', name: 'Element 2' }),
        createMockElement({ id: 'elem-3', name: 'Element 3' }),
      ];

      const nodes = transformElements(elements);

      expect(nodes).toHaveLength(3);
      expect(nodes.map(n => n.id)).toEqual(['elem-1', 'elem-2', 'elem-3']);
    });

    it('should sort elements by status', () => {
      const elements = [
        createMockElement({ id: 'elem-1', status: 'Done' }),
        createMockElement({ id: 'elem-2', status: 'Idea/Placeholder' }),
        createMockElement({ id: 'elem-3', status: 'In development' }),
      ];

      const nodes = transformElements(elements);

      // Should be sorted: Idea/Placeholder -> In development -> Done
      expect(nodes[0]!.data.entity.status).toBe('Idea/Placeholder');
      expect(nodes[1]!.data.entity.status).toBe('In development');
      expect(nodes[2]!.data.entity.status).toBe('Done');
    });

    it('should handle empty array', () => {
      const nodes = transformElements([]);
      expect(nodes).toEqual([]);
    });
  });

  describe('getElementNodeStyle', () => {
    it('should return error style for nodes with errors', () => {
      const element = createMockElement({ id: '', name: '' });
      const node = transformElement(element, 0);
      
      if (node) {
        const style = getElementNodeStyle(node);
        expect(style.background).toBe('#fee2e2');
        expect(style.color).toBe('#991b1b');
        expect(style.border).toContain('dashed');
        expect(style.border).toContain('#dc2626');
      }
    });

    it('should apply SF pattern styling', () => {
      const element = createMockElement({
        descriptionText: 'SF_RFID: [TEST-001]',
      });
      const node = transformElement(element, 0);
      
      if (node) {
        const style = getElementNodeStyle(node);
        expect(style.borderRadius).toBe('12px'); // More rounded
        expect(style.fontWeight).toBe('600'); // Bolder
      }
    });

    it('should apply status-based coloring', () => {
      const element = createMockElement({ status: 'Done' });
      const node = transformElement(element, 0);
      
      if (node) {
        const style = getElementNodeStyle(node);
        expect(style.background).toContain('#10b981'); // Green with opacity
        expect(style.color).toBe('#10b981');
      }
    });
  });

  describe('isContainer', () => {
    it('should identify containers with contents', () => {
      const container = createMockElement({
        contentIds: ['elem-2'],
      });
      expect(isContainer(container)).toBe(true);
    });

    it('should identify locked containers', () => {
      const locked = createMockElement({
        containerPuzzleId: 'puzzle-1',
      });
      expect(isContainer(locked)).toBe(true);
    });

    it('should identify non-containers', () => {
      const regular = createMockElement();
      expect(isContainer(regular)).toBe(false);
    });
  });

  describe('getSpecialElements', () => {
    it('should categorize special elements', () => {
      const elements = [
        createMockElement({ 
          id: 'elem-1',
          contentIds: ['elem-2'],
        }),
        createMockElement({ 
          id: 'elem-2',
          descriptionText: 'SF_RFID: [TEST]',
        }),
        createMockElement({ 
          id: 'elem-3',
          status: 'Idea/Placeholder',
        }),
        createMockElement({ 
          id: 'elem-4',
          status: 'Done',
        }),
      ];

      const special = getSpecialElements(elements);

      expect(special.containers).toHaveLength(1);
      expect(special.containers[0]!.id).toBe('elem-1');

      expect(special.withSFPatterns).toHaveLength(1);
      expect(special.withSFPatterns[0]!.id).toBe('elem-2');

      expect(special.incomplete).toHaveLength(1);
      expect(special.incomplete[0]!.id).toBe('elem-3');
    });
  });
});