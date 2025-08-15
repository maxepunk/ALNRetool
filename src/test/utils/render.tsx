/**
 * Enhanced testing utilities for ALNRetool
 * Provides custom render functions with Router and React Query support
 */

import { type ReactElement, type ReactNode, type PropsWithChildren } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route, type MemoryRouterProps } from 'react-router-dom'
import { vi } from 'vitest'
import { QueryErrorBoundary } from '@/components/QueryErrorBoundary'

// Create a new QueryClient for each test to ensure isolation
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Turn off retries for tests
        staleTime: 0, // No caching between tests
        gcTime: 0, // Garbage collect immediately
      },
      mutations: {
        retry: false,
      },
    },
  })

interface AllTheProvidersProps {
  children: ReactNode
  initialEntries?: MemoryRouterProps['initialEntries']
  queryClient?: QueryClient
  includeErrorBoundary?: boolean
}

/**
 * Wrapper component that includes all necessary providers
 */
function AllTheProviders({ 
  children, 
  initialEntries = ['/'],
  queryClient = createTestQueryClient(),
  includeErrorBoundary = false
}: AllTheProvidersProps) {
  const content = includeErrorBoundary ? (
    <QueryErrorBoundary>
      {children}
    </QueryErrorBoundary>
  ) : children

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {content}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: MemoryRouterProps['initialEntries']
  queryClient?: QueryClient
  includeErrorBoundary?: boolean
}

/**
 * Custom render function that includes all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { 
    initialEntries = ['/'], 
    queryClient, 
    includeErrorBoundary = false,
    ...renderOptions 
  } = options || {}

  const testQueryClient = queryClient || createTestQueryClient()

  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <AllTheProviders 
          initialEntries={initialEntries}
          queryClient={testQueryClient}
          includeErrorBoundary={includeErrorBoundary}
        >
          {children}
        </AllTheProviders>
      ),
      ...renderOptions,
    }),
    queryClient: testQueryClient,
  }
}

/**
 * Render with Router only (no React Query)
 */
export function renderWithRouter(
  ui: ReactElement,
  { 
    initialEntries = ['/'],
    ...renderOptions 
  }: CustomRenderOptions = {}
) {
  const wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  )

  return {
    ...render(ui, { wrapper, ...renderOptions }),
    // Export navigation functions for testing
    navigate: (path: string) => window.history.pushState(null, '', path),
  }
}

/**
 * Render with React Query only (no Router)
 */
export function renderWithQueryClient(
  ui: ReactElement,
  { queryClient, ...renderOptions }: CustomRenderOptions = {}
) {
  const testQueryClient = queryClient || createTestQueryClient()

  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
      ...renderOptions,
    }),
    queryClient: testQueryClient,
  }
}

/**
 * Helper to render a component within a route
 */
export function renderRoute(
  path: string,
  element: ReactElement,
  options?: CustomRenderOptions
) {
  const Component = () => (
    <Routes>
      <Route path={path} element={element} />
    </Routes>
  )

  return renderWithProviders(<Component />, {
    ...options,
    initialEntries: options?.initialEntries || [path],
  })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Export vi for mocking
export { vi }