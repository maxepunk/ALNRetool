/**
 * Error Boundary component
 * Catches JavaScript errors in child components and displays fallback UI
 */

import { Component, ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className={styles.container}>
          <h2 className={styles.title}>Something went wrong</h2>
          <p className={styles.message}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {this.state.error && (
            <details className={styles.details}>
              <summary>Error details</summary>
              <pre className={styles.errorText}>
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button 
            onClick={this.handleReset}
            className={styles.resetButton}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}