import { type ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a new QueryClient for each test to ensure isolation
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Turn off retries for tests
        staleTime: 0, // No caching between tests
      },
      mutations: {
        retry: false,
      },
    },
  })

// Custom render function that includes providers
export const renderWithClient = (ui: ReactElement) => {
  const testQueryClient = createTestQueryClient()
  const { rerender, ...result } = render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
  )
  
  return {
    ...result,
    rerender: (rerenderUi: ReactElement) =>
      rerender(
        <QueryClientProvider client={testQueryClient}>
          {rerenderUi}
        </QueryClientProvider>
      ),
  }
}

// Re-export everything from React Testing Library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react'
export { renderWithClient as render }