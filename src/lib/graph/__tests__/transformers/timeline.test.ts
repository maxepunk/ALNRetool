/**
 * Tests for Timeline Entity Transformer
 */

import { describe, it, expect, vi } from 'vitest';
import { TimelineTransformer } from '../../modules/transformers/TimelineTransformer';
import type { TimelineEvent } from '@/types/notion/app';

// Create test instance
const timelineTransformer = new TimelineTransformer();

// Mock console methods
const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Timeline Transformer', () => {
  afterEach(() => {
    consoleSpy.mockClear();
  });

  const createMockTimeline = (overrides?: Partial<TimelineEvent>): TimelineEvent => ({
    id: 'timeline-1',
    name: 'Test Event',
    description: 'Test Event',
    date: '2024-01-15T10:00:00Z',
    charactersInvolvedIds: [],
    memoryEvidenceIds: [],
    memTypes: [],
    notes: '',
    lastEditedTime: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  describe('transform', () => {
    it('should transform a valid timeline event', () => {
      const timeline = createMockTimeline();
      const node = timelineTransformer.transform(timeline);

      expect(node).toBeDefined();
      expect(node?.id).toBe('timeline-1');
      expect(node?.type).toBe('timeline');
      expect(node?.data.entity).toBe(timeline);
      expect(node?.data.label).toBe('Jan 15, 2024'); // Formatted date
      expect(node?.data.metadata.entityType).toBe('timeline');
    });

    it('should format dates correctly', () => {
      const dates = [
        { date: '2024-01-01T00:00:00Z', expected: 'Jan 1, 2024' },
        { date: '2024-12-31T23:59:59Z', expected: 'Dec 31, 2024' },
        { date: '2023-06-15T12:00:00Z', expected: 'Jun 15, 2023' },
      ];

      dates.forEach(({ date, expected }) => {
        const timeline = createMockTimeline({ date });
        const node = timelineTransformer.transform(timeline);
        expect(node?.data.label).toBe(expected);
      });
    });

    it('should handle missing date', () => {
      const timeline = createMockTimeline({ date: undefined });
      const node = timelineTransformer.transform(timeline);

      expect(node?.data.label).toBe('Unknown Date');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('has no date')
      );
    });

    it('should handle invalid date format', () => {
      const timeline = createMockTimeline({ date: 'invalid-date' });
      const node = timelineTransformer.transform(timeline);

      expect(node?.data.label).toBe('invalid-date'); // Returns as-is
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid date format')
      );
    });

    it('should validate required fields', () => {
      const invalid = createMockTimeline({
        id: '',
        description: '',
      });
      const node = timelineTransformer.transform(invalid);

      expect(node?.data.metadata.errorState).toBeDefined();
      expect(node?.data.metadata.errorState?.type).toBe('validation_error');
      expect(node?.data.metadata.errorState?.message).toContain('Missing timeline ID');
      expect(node?.data.metadata.errorState?.message).toContain('Missing timeline description');
    });

    it('should apply timeline visual hints', () => {
      const timeline = createMockTimeline();
      const node = timelineTransformer.transform(timeline);

      expect(node?.data.metadata.visualHints?.color).toBe('#FF7F50'); // Coral
      expect(node?.data.metadata.visualHints?.shape).toBe('rectangle');
      expect(node?.data.metadata.visualHints?.size).toBe('small');
    });

    it('should handle partial validation errors', () => {
      const timeline = createMockTimeline({ id: '' }); // Only ID is missing
      const node = timelineTransformer.transform(timeline);

      expect(node).toBeDefined();
      expect(node?.data.metadata.errorState).toBeDefined();
      expect(node?.data.metadata.errorState?.message || '').toContain('Missing timeline ID');
      expect(node?.data.metadata.errorState?.message || '').not.toContain('Missing timeline description');
    });
  });

  describe('transformMultiple', () => {
    it('should transform multiple timeline events', () => {
      const events = [
        createMockTimeline({ id: 't1', date: '2024-01-01T00:00:00Z' }),
        createMockTimeline({ id: 't2', date: '2024-01-02T00:00:00Z' }),
        createMockTimeline({ id: 't3', date: '2024-01-03T00:00:00Z' }),
      ];

      const nodes = timelineTransformer.transformMultiple(events);

      expect(nodes).toHaveLength(3);
      expect(nodes.map((n: any) => n.id)).toEqual(['t1', 't2', 't3']);
    });

    it('should sort events by date', () => {
      const events = [
        createMockTimeline({ id: 't3', date: '2024-01-03T00:00:00Z' }),
        createMockTimeline({ id: 't1', date: '2024-01-01T00:00:00Z' }),
        createMockTimeline({ id: 't2', date: '2024-01-02T00:00:00Z' }),
      ];

      const nodes = timelineTransformer.transformMultiple(events);

      // Should be sorted chronologically
      expect(nodes[0]?.id).toBe('t1');
      expect(nodes[1]?.id).toBe('t2');
      expect(nodes[2]?.id).toBe('t3');
    });

    it('should handle mixed date availability', () => {
      const events = [
        createMockTimeline({ id: 't1', date: '2024-01-02T00:00:00Z' }),
        createMockTimeline({ id: 't2', date: undefined }), // No date
        createMockTimeline({ id: 't3', date: '2024-01-01T00:00:00Z' }),
        createMockTimeline({ id: 't4', date: undefined }), // No date
      ];

      const nodes = timelineTransformer.transformMultiple(events);

      // Events with dates come first (sorted), then events without dates
      expect(nodes[0]?.id).toBe('t3'); // Jan 1
      expect(nodes[1]?.id).toBe('t1'); // Jan 2
      expect(nodes[2]?.id).toBe('t2'); // No date
      expect(nodes[3]?.id).toBe('t4'); // No date
    });

    it('should handle empty array', () => {
      const nodes = timelineTransformer.transformMultiple([]);
      expect(nodes).toEqual([]);
    });

    it('should log warning for null/undefined events', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create an event that will cause the transformer to skip it
      const invalidEvent = null as any;
      
      timelineTransformer.transformMultiple([invalidEvent]);
      
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping null/undefined timeline entity')
      );
      
      warnSpy.mockRestore();
    });
  });

  // Note: getTimelineNodeStyle has been removed as styling is now handled
  // in React components
});