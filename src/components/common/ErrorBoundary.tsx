/**
 * Error Boundary component
 * Catches JavaScript errors in child components and displays fallback UI
 */

import { Component, type ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, WifiOff, Database, Shield, Bug } from 'lucide-react'
import { logger } from '@/lib/graph/utils/Logger'


interface Props {
  children: ReactNode
  fallback?: ReactNode
  context?: string // Optional context about where the error occurred
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: { componentStack: string }
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    logger.error('Error caught by boundary:', { errorInfo }, error)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  getErrorDetails = () => {
    const { error } = this.state
    if (!error) return { icon: AlertCircle, title: 'Something went wrong', description: 'An unexpected error occurred.' }

    const errorMessage = error.message.toLowerCase()

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('failed to fetch')) {
      return {
        icon: WifiOff,
        title: 'Network Connection Error',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        variant: 'destructive' as const
      }
    }

    // API/Database errors
    if (errorMessage.includes('notion') || errorMessage.includes('database') || errorMessage.includes('401') || errorMessage.includes('403')) {
      return {
        icon: Database,
        title: 'Data Access Error',
        description: 'Unable to retrieve data from Notion. This may be a temporary issue or a permissions problem.',
        variant: 'destructive' as const
      }
    }

    // Permission/Auth errors
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      return {
        icon: Shield,
        title: 'Permission Denied',
        description: 'You don\'t have permission to access this resource. Please contact your administrator.',
        variant: 'destructive' as const
      }
    }

    // React/Component errors
    if (errorMessage.includes('cannot read') || errorMessage.includes('undefined') || errorMessage.includes('null')) {
      return {
        icon: Bug,
        title: 'Application Error',
        description: 'A component failed to render properly. This may be due to missing or invalid data.',
        variant: 'destructive' as const
      }
    }

    // Default fallback
    return {
      icon: AlertCircle,
      title: 'Unexpected Error',
      description: 'Something went wrong while loading this content. Please try refreshing the page.',
      variant: 'destructive' as const
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorDetails = this.getErrorDetails()
      const ErrorIcon = errorDetails.icon

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md w-full space-y-4">
            <Alert variant={errorDetails.variant || "destructive"}>
              <ErrorIcon className="h-4 w-4" />
              <AlertTitle>{errorDetails.title}</AlertTitle>
              <AlertDescription>
                {errorDetails.description}
              </AlertDescription>
            </Alert>
            
            {/* Context information if provided */}
            {this.props.context && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Context</AlertTitle>
                <AlertDescription>
                  Error occurred in: {this.props.context}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Technical details (collapsible) */}
            {this.state.error && (
              <details className="rounded-lg border border-border p-4 bg-muted/30">
                <summary className="cursor-pointer font-medium text-sm text-foreground/80 hover:text-foreground">
                  Technical details
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Error message:</p>
                    <pre className="mt-1 text-xs text-foreground/70 overflow-x-auto whitespace-pre-wrap break-words bg-background/50 p-2 rounded">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Stack trace:</p>
                      <pre className="mt-1 text-xs text-foreground/50 overflow-x-auto whitespace-pre-wrap break-words bg-background/50 p-2 rounded max-h-32 overflow-y-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={this.handleReset}
                variant="default"
                className="flex-1"
              >
                Try again
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1"
              >
                Refresh page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}