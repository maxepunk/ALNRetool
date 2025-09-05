/**
 * Tests for graph filtering logic
 * 
 * Validates the core filtering behavior including:
 * - Node visibility based on selection and depth
 * - Search result expansion with connection depth
 * - Priority handling between selection and search
 * - Edge case handling
 */

import { describe, it, expect } from 'vitest';
import { getVisibleNodeIds, getNodesWithinDepth } from './filtering';
import type { Edge } from '@xyflow/react';

describe('getNodesWithinDepth', () => {
  const edges: Edge[] = [
    { id: 'a-b', source: 'A', target: 'B', type: 'default' },
    { id: 'b-c', source: 'B', target: 'C', type: 'default' },
    { id: 'c-d', source: 'C', target: 'D', type: 'default' },
    { id: 'c-e', source: 'C', target: 'E', type: 'default' },
    { id: 'd-f', source: 'D', target: 'F', type: 'default' },
    // X is isolated (no edges)
  ];

  it('should return only the focus node at depth 0', () => {
    const result = getNodesWithinDepth('C', edges, 0);
    expect(result).toEqual(new Set(['C']));
  });

  it('should return immediate neighbors at depth 1', () => {
    const result = getNodesWithinDepth('C', edges, 1);
    expect(result).toEqual(new Set(['C', 'B', 'D', 'E']));
  });

  it('should return extended network at depth 2', () => {
    const result = getNodesWithinDepth('C', edges, 2);
    expect(result).toEqual(new Set(['C', 'B', 'D', 'E', 'A', 'F']));
  });

  it('should handle isolated nodes', () => {
    const result = getNodesWithinDepth('X', edges, 10);
    expect(result).toEqual(new Set(['X']));
  });

  it('should handle null focus node', () => {
    const result = getNodesWithinDepth('', edges, 1);
    expect(result).toEqual(new Set(['']));
  });

  it('should handle negative depth as 0', () => {
    const result = getNodesWithinDepth('C', edges, -1);
    expect(result).toEqual(new Set(['C']));
  });
});

describe('getVisibleNodeIds', () => {
  const edges: Edge[] = [
    { id: 'a-b', source: 'A', target: 'B', type: 'default' },
    { id: 'b-c', source: 'B', target: 'C', type: 'default' },
    { id: 'c-d', source: 'C', target: 'D', type: 'default' },
  ];

  describe('Priority 1: Selected node (highest priority)', () => {
    it('should show only selected node at depth 0', () => {
      const filteredNodeIds = new Set(['A', 'B', 'C', 'D']);
      const result = getVisibleNodeIds(filteredNodeIds, edges, 'B', 0);
      
      // Only the selected node should be visible
      expect(result).toEqual(new Set(['B']));
    });

    it('should show selected node and connections at depth 1', () => {
      const filteredNodeIds = new Set(['A', 'B', 'C', 'D']);
      const result = getVisibleNodeIds(filteredNodeIds, edges, 'B', 1);
      
      // B and its direct connections
      expect(result).toEqual(new Set(['B', 'A', 'C']));
    });

    it('should show selected node even if not in filtered set', () => {
      const filteredNodeIds = new Set(['C', 'D']); // B is not in filtered
      const result = getVisibleNodeIds(filteredNodeIds, edges, 'B', 1);
      
      // Should show B and its connections, plus the filtered nodes
      expect(result).toContain('B'); // Selected
      expect(result).toContain('A'); // Connection of B
      expect(result).toContain('C'); // Connection of B AND in filtered
      expect(result).toContain('D'); // In filtered
    });

    it('should combine selected node visibility with search results', () => {
      const filteredNodeIds = new Set(['D']); // Search result
      const result = getVisibleNodeIds(filteredNodeIds, edges, 'A', 1);
      
      // Should show A and B (from selection), plus D (from search)
      expect(result).toEqual(new Set(['A', 'B', 'D']));
    });
  });

  describe('Priority 2: Search results (no selection)', () => {
    it('should show filtered nodes at depth 0', () => {
      const filteredNodeIds = new Set(['B', 'D']);
      const result = getVisibleNodeIds(filteredNodeIds, edges, null, 0);
      
      // Only filtered nodes
      expect(result).toEqual(new Set(['B', 'D']));
    });

    it('should expand filtered nodes with depth', () => {
      const filteredNodeIds = new Set(['B']);
      const result = getVisibleNodeIds(filteredNodeIds, edges, null, 1);
      
      // B and its connections
      expect(result).toEqual(new Set(['B', 'A', 'C']));
    });

    it('should handle multiple filtered nodes with overlap', () => {
      const filteredNodeIds = new Set(['A', 'C']);
      const result = getVisibleNodeIds(filteredNodeIds, edges, null, 1);
      
      // A+B (from A) and C+B+D (from C), merged
      expect(result).toEqual(new Set(['A', 'B', 'C', 'D']));
    });
  });

  describe('Priority 3: Default (no selection or meaningful depth)', () => {
    it('should show all filtered nodes when no selection and depth 0', () => {
      const filteredNodeIds = new Set(['A', 'B', 'C', 'D']);
      const result = getVisibleNodeIds(filteredNodeIds, edges, null, 0);
      
      expect(result).toEqual(filteredNodeIds);
    });

    it('should expand all filtered nodes when no selection', () => {
      const filteredNodeIds = new Set(['B']);
      const result = getVisibleNodeIds(filteredNodeIds, edges, null, 2);
      
      // B expanded to depth 2 includes everything
      expect(result).toEqual(new Set(['B', 'A', 'C', 'D']));
    });
  });

  describe('Edge cases', () => {
    it('should handle empty filtered set with selection', () => {
      const filteredNodeIds = new Set<string>();
      const result = getVisibleNodeIds(filteredNodeIds, edges, 'C', 1);
      
      // Should still show selected node and connections
      expect(result).toEqual(new Set(['C', 'B', 'D']));
    });

    it('should handle empty filtered set without selection', () => {
      const filteredNodeIds = new Set<string>();
      const result = getVisibleNodeIds(filteredNodeIds, edges, null, 1);
      
      // Nothing to show
      expect(result).toEqual(new Set());
    });

    it('should handle isolated selected node', () => {
      const filteredNodeIds = new Set(['A', 'B']);
      const isolatedEdges: Edge[] = []; // No edges
      const result = getVisibleNodeIds(filteredNodeIds, isolatedEdges, 'X', 2);
      
      // Should show X (selected) plus filtered nodes
      expect(result).toEqual(new Set(['X', 'A', 'B']));
    });

    it('should handle very large depth values efficiently', () => {
      const filteredNodeIds = new Set(['A']);
      const result = getVisibleNodeIds(filteredNodeIds, edges, null, 999);
      
      // Should include all connected nodes (full graph traversal)
      expect(result).toEqual(new Set(['A', 'B', 'C', 'D']));
    });
  });
});