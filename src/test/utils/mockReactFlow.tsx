/**
 * Mock utilities for React Flow testing
 */

import { vi } from 'vitest'
import type { Node, Edge } from '@xyflow/react'

// Mock React Flow components
export const mockReactFlow = () => {
  vi.mock('@xyflow/react', () => ({
    MarkerType: {
      Arrow: 'arrow',
      ArrowClosed: 'arrowclosed',
    },
    ReactFlow: vi.fn(({ children, nodes, edges, onNodeClick }) => (
      <div className="react-flow" data-testid="react-flow">
        <div className="react-flow__renderer">
          {nodes?.map((node: Node) => (
            <div
              key={node.id}
              className={`react-flow__node react-flow__node-${node.type}`}
              data-testid={`node-${node.id}`}
              onClick={(e) => onNodeClick?.(e, node)}
            >
              {(node.data as any)?.label || node.id}
            </div>
          ))}
          {edges?.map((edge: Edge) => (
            <div
              key={edge.id}
              className="react-flow__edge"
              data-testid={`edge-${edge.id}`}
            />
          ))}
        </div>
        {children}
      </div>
    )),
    Background: vi.fn(() => <div className="react-flow__background" />),
    Controls: vi.fn(() => <div className="react-flow__controls" />),
    MiniMap: vi.fn(() => <div className="react-flow__minimap" />),
    Handle: vi.fn(({ type, position }) => (
      <div className={`react-flow__handle react-flow__handle-${type} react-flow__handle-${position}`} />
    )),
    Position: {
      Top: 'top',
      Right: 'right',
      Bottom: 'bottom',
      Left: 'left',
    },
    useNodesState: vi.fn((initialNodes) => {
      let nodes = initialNodes
      const setNodes = vi.fn((newNodes) => {
        nodes = typeof newNodes === 'function' ? newNodes(nodes) : newNodes
      })
      const onNodesChange = vi.fn()
      return [nodes, setNodes, onNodesChange]
    }),
    useEdgesState: vi.fn((initialEdges) => {
      let edges = initialEdges
      const setEdges = vi.fn((newEdges) => {
        edges = typeof newEdges === 'function' ? newEdges(edges) : newEdges
      })
      const onEdgesChange = vi.fn()
      return [edges, setEdges, onEdgesChange]
    }),
    addEdge: vi.fn((params, edges) => [...edges, params]),
    applyNodeChanges: vi.fn((_changes, nodes) => nodes),
    applyEdgeChanges: vi.fn((_changes, edges) => edges),
  }))
}

/**
 * Create mock nodes for testing
 */
export function createMockNodes(count: number = 3): Node[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i + 1}`,
    type: i === 0 ? 'puzzle' : i === 1 ? 'element' : 'character',
    position: { x: i * 150, y: 100 },
    data: { 
      label: `Node ${i + 1}`,
      name: `Test Node ${i + 1}`,
    },
  }))
}

/**
 * Create mock edges for testing
 */
export function createMockEdges(nodes: Node[]): Edge[] {
  const edges: Edge[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const sourceNode = nodes[i]
    const targetNode = nodes[i + 1]
    if (sourceNode && targetNode) {
      edges.push({
        id: `edge-${i}`,
        source: sourceNode.id,
        target: targetNode.id,
        type: 'default',
      })
    }
  }
  return edges
}

/**
 * Mock node interaction event
 */
export function createNodeClickEvent(node: Node) {
  return {
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(),
    target: {
      dataset: { nodeid: node.id },
    },
  }
}

/**
 * Mock drag event for React Flow
 */
export function createDragEvent(data: any) {
  return {
    dataTransfer: {
      getData: vi.fn(() => JSON.stringify(data)),
      setData: vi.fn(),
      effectAllowed: 'move',
    },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }
}