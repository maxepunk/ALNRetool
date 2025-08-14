import React from 'react'
import { QueryErrorResetBoundary, useQueryErrorResetBoundary } from '@tanstack/react-query'

interface QueryErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<unknown>
}

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// Default fallback component
function DefaultErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      style={{
        padding: '1rem',
        border: '1px solid #dc2626',
        borderRadius: '0.375rem',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
      }}
    >
      <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 'bold' }}>
        Something went wrong
      </h2>
      <p style={{ margin: '0 0 1rem 0' }}>
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: 'pointer',
        }}
        type="button"
      >
        Try again
      </button>
    </div>
  )
}

// Inner error boundary that has access to QueryErrorResetBoundary context
class InnerErrorBoundary extends React.Component<
  {
    children: React.ReactNode
    fallback: React.ComponentType<ErrorFallbackProps>
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
    resetKeys?: Array<unknown>
    queryReset: () => void
  },
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null

  constructor(props: InnerErrorBoundary['props']) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: InnerErrorBoundary['props']) {
    const { resetKeys } = this.props
    const prevResetKeys = prevProps.resetKeys

    if (this.state.hasError && prevResetKeys !== resetKeys) {
      if (resetKeys?.some((resetKey, idx) => prevResetKeys?.[idx] !== resetKey)) {
        this.reset()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  reset = () => {
    this.props.queryReset()
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback
      return <Fallback error={this.state.error} resetErrorBoundary={this.reset} />
    }

    return this.props.children
  }
}

// Wrapper component that provides QueryErrorResetBoundary context
function QueryErrorBoundaryWithReset({
  children,
  fallback = DefaultErrorFallback,
  onError,
  resetKeys,
}: QueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary()

  return (
    <InnerErrorBoundary
      fallback={fallback}
      onError={onError}
      resetKeys={resetKeys}
      queryReset={reset}
    >
      {children}
    </InnerErrorBoundary>
  )
}

// Main component that wraps everything in QueryErrorResetBoundary
export function QueryErrorBoundary(props: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {() => (
        <QueryErrorBoundaryWithReset {...props} />
      )}
    </QueryErrorResetBoundary>
  )
}