import '@testing-library/jest-dom'
import React from 'react'
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'
import { LayoutOrchestrator } from '@/lib/graph/modules/LayoutOrchestrator'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Setup MSW server
export const server = setupServer(...handlers)

// Global orchestrator instance for tests
let orchestrator: LayoutOrchestrator | null = null

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})

// Preload layout algorithms for tests
beforeAll(() => {
  // Create and configure orchestrator
  orchestrator = new LayoutOrchestrator()
  
  // Preload commonly used algorithms for synchronous test execution
  return orchestrator.preloadCommonAlgorithms(['dagre', 'force']).then(() => {
    // Make available globally for tests that need direct access
    (global as any).__testOrchestrator = orchestrator
    console.log('[Test Setup] Layout algorithms preloaded for testing')
  }).catch((error) => {
    console.error('[Test Setup] Failed to preload layout algorithms:', error)
  })
})

// Reset handlers after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
  
  // Clear all module-level caches and singletons
  vi.clearAllMocks()
  vi.clearAllTimers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})

// Mock environment variables
vi.stubEnv('VITE_API_URL', 'http://localhost:3001/api')
vi.stubEnv('VITE_NOTION_API_KEY', 'test-api-key')

// Mock Radix UI dropdown for testing
vi.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: any) => children,
  Trigger: ({ children, ...props }: any) => React.createElement('button', props, children),
  Portal: ({ children }: any) => children,
  Content: ({ children }: any) => React.createElement('div', { role: 'menu' }, children),
  Item: ({ children, onClick, className }: any) => 
    React.createElement('div', { role: 'menuitem', onClick, className }, children),
  Label: ({ children }: any) => React.createElement('div', {}, children),
  Separator: () => React.createElement('hr'),
  Sub: ({ children }: any) => children,
  SubTrigger: ({ children }: any) => React.createElement('div', {}, children),
  SubContent: ({ children }: any) => React.createElement('div', {}, children),
  CheckboxItem: ({ children, className, ...props }: any) => React.createElement('div', { ...props, className }, children),
  RadioGroup: ({ children }: any) => React.createElement('div', {}, children),
  RadioItem: ({ children, className, ...props }: any) => React.createElement('div', { ...props, className }, children),
}));

// Mock React Flow globally
vi.mock('@xyflow/react', () => ({
  MarkerType: {
    Arrow: 'arrow',
    ArrowClosed: 'arrowclosed',
  },
  ReactFlow: vi.fn(() => null),
  Background: vi.fn(() => null),
  Controls: vi.fn(() => null),
  MiniMap: vi.fn(() => null),
  Handle: vi.fn(() => null),
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
  useNodesState: vi.fn((initialNodes) => [initialNodes, vi.fn(), vi.fn()]),
  useEdgesState: vi.fn((initialEdges) => [initialEdges, vi.fn(), vi.fn()]),
  addEdge: vi.fn((params, edges) => [...edges, params]),
  applyNodeChanges: vi.fn((_changes, nodes) => nodes),
  applyEdgeChanges: vi.fn((_changes, edges) => edges),
}))

// Helper function for tests that need to wait for async layout operations
export async function withAsyncLayout(fn: () => Promise<void> | void): Promise<void> {
  await Promise.resolve(fn())
  // Allow any pending layout operations or microtasks to complete
  await new Promise(resolve => setTimeout(resolve, 0))
}

// Helper to get the test orchestrator instance
export function getTestOrchestrator(): LayoutOrchestrator {
  if (!orchestrator) {
    throw new Error('Test orchestrator not initialized. Ensure setup.ts is loaded.')
  }
  return orchestrator
}