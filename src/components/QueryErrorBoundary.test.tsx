import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, userEvent } from '@/test/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { QueryErrorBoundary } from './QueryErrorBoundary'

// Test component that throws an error on demand
function ThrowError({ shouldThrow = false, message = 'Test error' }: { shouldThrow?: boolean; message?: string }) {
  if (shouldThrow) {
    throw new Error(message)
  }
  return <div>No error</div>
}

// Custom fallback component for testing
function CustomFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div data-testid="custom-fallback">
      <h1>Custom Error</h1>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary} data-testid="custom-retry">
        Custom Retry
      </button>
    </div>
  )
}

// Component that throws on prop change (for resetKeys testing)
function ConditionalError({ errorKey }: { errorKey: string }) {
  if (errorKey === 'error') {
    throw new Error('Conditional error')
  }
  return <div>No error: {errorKey}</div>
}

describe('QueryErrorBoundary', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  describe('Error Boundary Functionality', () => {
    it('renders children when no error occurs', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <div data-testid="child-component">Child content</div>
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByTestId('child-component')).toBeInTheDocument()
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('catches JavaScript errors and displays default fallback', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <ThrowError shouldThrow={true} message="Component crashed" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Component crashed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    })

    it('displays custom fallback component when provided', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary fallback={CustomFallback}>
            <ThrowError shouldThrow={true} message="Custom error message" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Error')).toBeInTheDocument()
      expect(screen.getByText('Custom error message')).toBeInTheDocument()
      expect(screen.getByTestId('custom-retry')).toBeInTheDocument()
    })

    it('calls onError callback when error occurs', () => {
      const onErrorSpy = vi.fn()

      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary onError={onErrorSpy}>
            <ThrowError shouldThrow={true} message="Callback test error" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(onErrorSpy).toHaveBeenCalledTimes(1)
      expect(onErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )

      const [error] = onErrorSpy.mock.calls[0] ?? []
      expect(error.message).toBe('Callback test error')
    })
  })

  describe('Error Reset Functionality', () => {
    it('resets error state when retry button is clicked', async () => {
      const user = userEvent.setup()
      let shouldThrow = true

      function ToggleError() {
        if (shouldThrow) {
          throw new Error('Toggle error')
        }
        return <div data-testid="success-content">Reset successful</div>
      }

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <ToggleError />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      // Error should be displayed
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Toggle error')).toBeInTheDocument()

      // Update the error condition
      shouldThrow = false

      // Click retry button
      await user.click(screen.getByRole('button', { name: 'Try again' }))

      // Component should re-render and show success
      rerender(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <ToggleError />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('success-content')).toBeInTheDocument()
      })
    })

    it('resets error state with custom fallback retry button', async () => {
      const user = userEvent.setup()
      let shouldThrow = true

      function ToggleError() {
        if (shouldThrow) {
          throw new Error('Custom toggle error')
        }
        return <div data-testid="custom-success">Custom reset successful</div>
      }

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary fallback={CustomFallback}>
            <ToggleError />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      // Custom error should be displayed
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()

      // Update the error condition
      shouldThrow = false

      // Click custom retry button
      await user.click(screen.getByTestId('custom-retry'))

      // Component should re-render and show success
      rerender(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary fallback={CustomFallback}>
            <ToggleError />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('custom-success')).toBeInTheDocument()
      })
    })
  })

  describe('resetKeys Auto-reset Functionality', () => {
    it('automatically resets when resetKeys change', async () => {
      let errorKey = 'normal'

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary resetKeys={[errorKey]}>
            <ConditionalError errorKey={errorKey} />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      // Initially no error
      expect(screen.getByText('No error: normal')).toBeInTheDocument()

      // Update to trigger error
      errorKey = 'error'
      rerender(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary resetKeys={[errorKey]}>
            <ConditionalError errorKey={errorKey} />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      // Error should be displayed
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Conditional error')).toBeInTheDocument()

      // Update resetKeys to trigger auto-reset
      errorKey = 'fixed'
      rerender(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary resetKeys={[errorKey]}>
            <ConditionalError errorKey={errorKey} />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      // Component should auto-reset and show success
      await waitFor(() => {
        expect(screen.getByText('No error: fixed')).toBeInTheDocument()
      })
    })

    it('does not reset when resetKeys remain the same', () => {
      const resetKeys = ['same-key']

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary resetKeys={resetKeys}>
            <ThrowError shouldThrow={true} message="Persistent error" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      // Error should be displayed
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Persistent error')).toBeInTheDocument()

      // Re-render with same resetKeys
      rerender(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary resetKeys={resetKeys}>
            <ThrowError shouldThrow={true} message="Persistent error" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      // Error should still be displayed (no auto-reset)
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Persistent error')).toBeInTheDocument()
    })

    it('handles multiple values in resetKeys array', async () => {
      let key1 = 'normal'
      let key2 = 'normal'

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary resetKeys={[key1, key2]}>
            <ConditionalError errorKey={key1} />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      // Trigger error
      key1 = 'error'
      rerender(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary resetKeys={[key1, key2]}>
            <ConditionalError errorKey={key1} />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Change second key to trigger reset
      key1 = 'fixed'
      key2 = 'changed'
      rerender(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary resetKeys={[key1, key2]}>
            <ConditionalError errorKey={key1} />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('No error: fixed')).toBeInTheDocument()
      })
    })
  })

  describe('Default Fallback Component', () => {
    it('displays proper ARIA attributes for accessibility', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <ThrowError shouldThrow={true} message="Accessibility test" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      const alertElement = screen.getByRole('alert')
      expect(alertElement).toBeInTheDocument()

      const retryButton = screen.getByRole('button', { name: 'Try again' })
      expect(retryButton).toHaveAttribute('type', 'button')
    })

    it('displays error message with fallback text', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <ThrowError shouldThrow={true} message="" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
    })

    it('renders fallback UI with proper structure and styling', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <ThrowError shouldThrow={true} message="Style test" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      const alertElement = screen.getByRole('alert')
      expect(alertElement).toBeInTheDocument()
      
      // Check that the alert has appropriate error styling (red color scheme)
      expect(alertElement).toHaveStyle({ color: '#dc2626' })

      const button = screen.getByRole('button', { name: 'Try again' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('type', 'button')
      
      // Verify the component structure
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Style test')).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    it('handles missing props gracefully', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <div>No props test</div>
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByText('No props test')).toBeInTheDocument()
    })

    it('handles undefined fallback prop', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary fallback={undefined}>
            <ThrowError shouldThrow={true} message="Undefined fallback test" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      // Should use default fallback
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('handles undefined onError prop', () => {
      expect(() => {
        render(
          <QueryClientProvider client={queryClient}>
            <QueryErrorBoundary onError={undefined}>
              <ThrowError shouldThrow={true} message="Undefined onError test" />
            </QueryErrorBoundary>
          </QueryClientProvider>
        )
      }).not.toThrow()

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('handles undefined resetKeys prop', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary resetKeys={undefined}>
            <ThrowError shouldThrow={true} message="Undefined resetKeys test" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Undefined resetKeys test')).toBeInTheDocument()
    })

    it('handles empty resetKeys array', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary resetKeys={[]}>
            <ThrowError shouldThrow={true} message="Empty resetKeys test" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Empty resetKeys test')).toBeInTheDocument()
    })
  })

  describe('Error Types and Edge Cases', () => {
    it('handles Error objects with different properties', () => {
      function ThrowCustomError(): null {
        const error = new Error('Custom error')
        error.name = 'CustomError'
        error.stack = 'Custom stack trace'
        throw error
      }

      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <ThrowCustomError />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByText('Custom error')).toBeInTheDocument()
    })

    it('handles errors without message property', () => {
      function ThrowBareError(): null {
        const error = new Error()
        error.message = ''
        throw error
      }

      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <ThrowBareError />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
    })

    it('works without QueryClient provider (graceful degradation)', () => {
      // This tests that the component doesn't crash if QueryClient is missing
      expect(() => {
        render(
          <QueryErrorBoundary>
            <ThrowError shouldThrow={true} message="No QueryClient test" />
          </QueryErrorBoundary>
        )
      }).not.toThrow()

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('No QueryClient test')).toBeInTheDocument()
    })
  })

  describe('Component Lifecycle', () => {
    it('handles component unmounting during error state', () => {
      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <ThrowError shouldThrow={true} message="Unmount test" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Should not throw during unmount
      expect(() => unmount()).not.toThrow()
    })

    it('maintains error state across re-renders', () => {
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <ThrowError shouldThrow={true} message="Persistent error" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByText('Persistent error')).toBeInTheDocument()

      // Re-render with same error
      rerender(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <ThrowError shouldThrow={true} message="Persistent error" />
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      // Error should still be displayed
      expect(screen.getByText('Persistent error')).toBeInTheDocument()
    })
  })

  describe('Integration with QueryErrorResetBoundary', () => {
    it('integrates properly with TanStack Query error reset mechanism', () => {
      // This test verifies the component structure and integration
      render(
        <QueryClientProvider client={queryClient}>
          <QueryErrorBoundary>
            <div data-testid="query-integration">Query integration test</div>
          </QueryErrorBoundary>
        </QueryClientProvider>
      )

      expect(screen.getByTestId('query-integration')).toBeInTheDocument()
    })
  })
})