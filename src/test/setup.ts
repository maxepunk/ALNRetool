import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Setup MSW server
export const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Reset handlers after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})

// Mock environment variables
vi.stubEnv('VITE_API_URL', 'http://localhost:3001/api')
vi.stubEnv('VITE_NOTION_API_KEY', 'test-api-key')