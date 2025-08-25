import { act } from '@testing-library/react';
import type { GraphData } from '@/lib/graph/types';

/**
 * Wait for layout operations to complete in tests
 * @param ms - Milliseconds to wait (default: 100)
 */
export async function waitForLayout(ms: number = 100): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, ms));
  });
}

/**
 * Create a mock LayoutOrchestrator for unit tests that don't need real layout
 */
export function mockLayoutSync() {
  return {
    applyLayout: (graph: GraphData) => graph,
    applyLayoutAsync: async (graph: GraphData) => graph,
    getAvailableAlgorithms: () => [
      { id: 'dagre', name: 'Hierarchical', description: 'DAG layout' },
      { id: 'force', name: 'Force-Directed', description: 'Physics simulation' }
    ],
    preloadCommonAlgorithms: async () => {},
    supportsAsync: () => true,
  };
}

/**
 * Create a simple test graph for layout testing
 */
export function createMockGraph(): GraphData {
  return {
    nodes: [
      {
        id: 'node-1',
        type: 'puzzle',
        position: { x: 0, y: 0 },
        data: {
          label: 'Test Node 1',
          entity: { id: 'puzzle-1', name: 'Test Puzzle' } as any,
          metadata: {
            entityType: 'puzzle',
            entityId: 'puzzle-1',
          }
        }
      },
      {
        id: 'node-2',
        type: 'element',
        position: { x: 0, y: 0 },
        data: {
          label: 'Test Node 2',
          entity: { id: 'element-1', name: 'Test Element' } as any,
          metadata: {
            entityType: 'element',
            entityId: 'element-1',
          }
        }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'dependency',
        data: {
          relationshipType: 'requirement'
        }
      }
    ],
    metadata: {
      metrics: {
        startTime: 0,
        endTime: 0,
        nodeCount: 2,
        edgeCount: 1,
        duration: 0
      }
    }
  };
}

/**
 * Assert that layout has been applied to nodes
 * @param graph - The graph to check
 * @throws Error if any node doesn't have valid positions
 */
export function assertLayoutApplied(graph: GraphData): void {
  const invalidNodes = graph.nodes.filter(node => {
    return !node.position ||
           typeof node.position.x !== 'number' ||
           typeof node.position.y !== 'number' ||
           (node.position.x === 0 && node.position.y === 0);
  });

  if (invalidNodes.length > 0) {
    throw new Error(
      `Layout not applied to nodes: ${invalidNodes.map(n => n.id).join(', ')}`
    );
  }
}

/**
 * Helper to wait for a condition to be true
 * Useful for waiting for async state updates
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Create a mock graph store for testing components that use it
 */
export function createMockGraphStore() {
  return {
    nodes: [],
    edges: [],
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    resetZoom: vi.fn(),
    fitView: vi.fn(),
    layoutAlgorithm: 'dagre' as const,
    setLayoutAlgorithm: vi.fn(),
    triggerRelayout: vi.fn(),
  };
}