/**
 * GraphUtilities Test Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GraphUtilities } from '../GraphUtilities';

describe('GraphUtilities', () => {
  describe('deduplicateNodes', () => {
    it('should remove duplicate nodes by id', () => {
      const nodes = [
        { id: '1', data: { label: 'A' } },
        { id: '2', data: { label: 'B' } },
        { id: '1', data: { label: 'A-duplicate' } },
        { id: '3', data: { label: 'C' } },
        { id: '2', data: { label: 'B-duplicate' } }
      ];
      
      const result = GraphUtilities.deduplicateNodes(nodes);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: '1', data: { label: 'A' } });
      expect(result[1]).toEqual({ id: '2', data: { label: 'B' } });
      expect(result[2]).toEqual({ id: '3', data: { label: 'C' } });
    });

    it('should keep first occurrence of duplicates', () => {
      const nodes = [
        { id: '1', data: { label: 'First' } },
        { id: '1', data: { label: 'Second' } },
        { id: '1', data: { label: 'Third' } }
      ];
      
      const result = GraphUtilities.deduplicateNodes(nodes);
      
      expect(result).toHaveLength(1);
      expect(result[0].data.label).toBe('First');
    });

    it('should handle empty array', () => {
      const result = GraphUtilities.deduplicateNodes([]);
      expect(result).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      const nodes = [
        { id: '1', data: { label: 'A' } },
        { id: '2', data: { label: 'B' } },
        { id: '3', data: { label: 'C' } }
      ];
      
      const result = GraphUtilities.deduplicateNodes(nodes);
      
      expect(result).toHaveLength(3);
      expect(result).toEqual(nodes);
    });

    it('should perform under 1ms for 1000 nodes', () => {
      const nodes = Array.from({ length: 1000 }, (_, i) => ({
        id: `node-${i}`,
        data: { label: `Node ${i}` }
      }));
      
      const start = performance.now();
      GraphUtilities.deduplicateNodes(nodes);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(1);
    });

    it('should handle 1000 nodes with 50% duplicates efficiently', () => {
      const nodes = Array.from({ length: 1000 }, (_, i) => ({
        id: `node-${i % 500}`, // Create 50% duplicates
        data: { label: `Node ${i}` }
      }));
      
      const start = performance.now();
      const result = GraphUtilities.deduplicateNodes(nodes);
      const duration = performance.now() - start;
      
      expect(result).toHaveLength(500);
      expect(duration).toBeLessThan(1);
    });
  });

  describe('deduplicateEdges', () => {
    it('should remove duplicate edges by id', () => {
      const edges = [
        { id: 'edge-1', source: 'a', target: 'b', type: 'relation' },
        { id: 'edge-2', source: 'b', target: 'c', type: 'relation' },
        { id: 'edge-1', source: 'a', target: 'b', type: 'duplicate' },
        { id: 'edge-3', source: 'c', target: 'd', type: 'relation' }
      ];
      
      const result = GraphUtilities.deduplicateEdges(edges);
      
      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('relation'); // Keeps first occurrence
      expect(result.map(e => e.id)).toEqual(['edge-1', 'edge-2', 'edge-3']);
    });

    it('should handle empty array', () => {
      const result = GraphUtilities.deduplicateEdges([]);
      expect(result).toEqual([]);
    });

    it('should perform under 1ms for 1000 edges', () => {
      const edges = Array.from({ length: 1000 }, (_, i) => ({
        id: `edge-${i}`,
        source: `node-${i}`,
        target: `node-${i + 1}`,
        type: 'relation'
      }));
      
      const start = performance.now();
      GraphUtilities.deduplicateEdges(edges);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(1);
    });
  });

  describe('deduplicateEdgesByPair', () => {
    it('should remove edges with duplicate source-target pairs', () => {
      const edges = [
        { id: 'edge-1', source: 'a', target: 'b', type: 'type1' },
        { id: 'edge-2', source: 'a', target: 'b', type: 'type2' }, // Duplicate pair
        { id: 'edge-3', source: 'b', target: 'a', type: 'type1' }, // Different direction
        { id: 'edge-4', source: 'a', target: 'c', type: 'type1' }
      ];
      
      const result = GraphUtilities.deduplicateEdgesByPair(edges);
      
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('edge-1'); // Keeps first occurrence
      expect(result[1].id).toBe('edge-3'); // Different direction is not duplicate
      expect(result[2].id).toBe('edge-4');
    });

    it('should handle empty array', () => {
      const result = GraphUtilities.deduplicateEdgesByPair([]);
      expect(result).toEqual([]);
    });
  });

  describe('filterByIncludedIds', () => {
    it('should filter items by included IDs', () => {
      const items = [
        { id: '1', label: 'A' },
        { id: '2', label: 'B' },
        { id: '3', label: 'C' },
        { id: '4', label: 'D' }
      ];
      const includedIds = new Set(['1', '3']);
      
      const result = GraphUtilities.filterByIncludedIds(items, includedIds);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    it('should return empty array when no IDs match', () => {
      const items = [
        { id: '1', label: 'A' },
        { id: '2', label: 'B' }
      ];
      const includedIds = new Set(['3', '4']);
      
      const result = GraphUtilities.filterByIncludedIds(items, includedIds);
      
      expect(result).toEqual([]);
    });

    it('should handle empty included IDs set', () => {
      const items = [
        { id: '1', label: 'A' },
        { id: '2', label: 'B' }
      ];
      const includedIds = new Set<string>();
      
      const result = GraphUtilities.filterByIncludedIds(items, includedIds);
      
      expect(result).toEqual([]);
    });
  });

  describe('extractIds', () => {
    it('should extract IDs into a Set', () => {
      const items = [
        { id: '1', label: 'A' },
        { id: '2', label: 'B' },
        { id: '3', label: 'C' }
      ];
      
      const result = GraphUtilities.extractIds(items);
      
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(3);
      expect(result.has('1')).toBe(true);
      expect(result.has('2')).toBe(true);
      expect(result.has('3')).toBe(true);
    });

    it('should handle duplicate IDs', () => {
      const items = [
        { id: '1', label: 'A' },
        { id: '1', label: 'B' },
        { id: '2', label: 'C' }
      ];
      
      const result = GraphUtilities.extractIds(items);
      
      expect(result.size).toBe(2);
      expect(result.has('1')).toBe(true);
      expect(result.has('2')).toBe(true);
    });

    it('should handle empty array', () => {
      const result = GraphUtilities.extractIds([]);
      expect(result.size).toBe(0);
    });
  });

  describe('mergeAndDeduplicate', () => {
    it('should merge multiple arrays and deduplicate', () => {
      const array1 = [
        { id: '1', label: 'A' },
        { id: '2', label: 'B' }
      ];
      const array2 = [
        { id: '2', label: 'B-duplicate' },
        { id: '3', label: 'C' }
      ];
      const array3 = [
        { id: '3', label: 'C-duplicate' },
        { id: '4', label: 'D' }
      ];
      
      const result = GraphUtilities.mergeAndDeduplicate(array1, array2, array3);
      
      expect(result).toHaveLength(4);
      expect(result.map(item => item.id)).toEqual(['1', '2', '3', '4']);
      expect(result[1].label).toBe('B'); // Keeps first occurrence
      expect(result[2].label).toBe('C'); // Keeps first occurrence
    });

    it('should handle single array', () => {
      const array = [
        { id: '1', label: 'A' },
        { id: '1', label: 'A-duplicate' },
        { id: '2', label: 'B' }
      ];
      
      const result = GraphUtilities.mergeAndDeduplicate(array);
      
      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('A');
    });

    it('should handle empty arrays', () => {
      const result = GraphUtilities.mergeAndDeduplicate([], [], []);
      expect(result).toEqual([]);
    });

    it('should handle mix of empty and non-empty arrays', () => {
      const array1 = [{ id: '1', label: 'A' }];
      const array2: any[] = [];
      const array3 = [{ id: '2', label: 'B' }];
      
      const result = GraphUtilities.mergeAndDeduplicate(array1, array2, array3);
      
      expect(result).toHaveLength(2);
      expect(result.map(item => item.id)).toEqual(['1', '2']);
    });
  });
});