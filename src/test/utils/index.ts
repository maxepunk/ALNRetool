/**
 * Central export for all test utilities
 */

// Render utilities
export {
  renderWithProviders,
  renderWithRouter,
  renderWithQueryClient,
  renderRoute,
  userEvent,
  vi,
} from './render'

// Data factories
export {
  createMockCharacter,
  createMockElement,
  createMockPuzzle,
  createMockTimelineEvent,
  createMockPuzzleScenario,
  resetIdCounter,
} from './factories'

// React Flow mocks
export {
  mockReactFlow,
  createMockNodes,
  createMockEdges,
  createNodeClickEvent,
  createDragEvent,
} from './mockReactFlow'

// Re-export testing library utilities
export * from '@testing-library/react'