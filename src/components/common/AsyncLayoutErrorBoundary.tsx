import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logger } from '@/lib/graph/utils/Logger'


interface Props {
  children: ReactNode;
  onReset?: () => void;
  fallbackLayout?: 'dagre' | 'circular' | 'grid';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isRecovering: boolean;
  retryCount: number;
}

const MAX_RETRIES = 3;

/**
 * Error boundary specifically for async layout operations
 * Provides automatic retry and fallback layout strategies
 */
export class AsyncLayoutErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if it's a layout-specific error
    const isLayoutError = error.message.toLowerCase().includes('layout') ||
                         error.message.toLowerCase().includes('worker') ||
                         error.message.toLowerCase().includes('timeout');
    
    return {
      hasError: true,
      error,
      isRecovering: isLayoutError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Async Layout Error Boundary caught:', { errorInfo }, error);
    
    this.setState({
      error,
      errorInfo
    });

    // Attempt automatic recovery for layout errors
    if (this.state.isRecovering && this.state.retryCount < MAX_RETRIES) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId);
    }
  }

  scheduleRetry = () => {
    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, this.state.retryCount) * 1000;
    
    this.retryTimeoutId = window.setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      retryCount: 0
    });
    this.props.onReset?.();
  };

  handleFallback = () => {
    // Trigger fallback layout through parent
    if (this.props.fallbackLayout) {
      logger.debug(`Falling back to ${this.props.fallbackLayout} layout`);
      // Reset error state to allow re-render with fallback
      this.handleReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const isWorkerError = this.state.error?.message.includes('Worker');
      const isTimeoutError = this.state.error?.message.includes('timeout');
      const isMemoryError = this.state.error?.message.includes('memory');
      
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
          <div className="max-w-lg w-full space-y-4">
            {/* Main error alert */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Layout Error</AlertTitle>
              <AlertDescription>
                {isWorkerError && 'The layout worker encountered an error.'}
                {isTimeoutError && 'The layout calculation timed out.'}
                {isMemoryError && 'Insufficient memory for layout calculation.'}
                {!isWorkerError && !isTimeoutError && !isMemoryError && 
                  'An unexpected error occurred during layout.'}
              </AlertDescription>
            </Alert>

            {/* Error details */}
            {this.state.error && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-xs font-mono text-muted-foreground">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Recovery status */}
            {this.state.isRecovering && this.state.retryCount < MAX_RETRIES && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Attempting Recovery</AlertTitle>
                <AlertDescription>
                  Retry {this.state.retryCount + 1} of {MAX_RETRIES}...
                </AlertDescription>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 justify-center pt-4">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              {this.props.fallbackLayout && (
                <Button
                  onClick={this.handleFallback}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Use {this.props.fallbackLayout} Layout
                </Button>
              )}
            </div>

            {/* Developer details */}
            {import.meta.env?.DEV === true && this.state.errorInfo && (
              <details className="mt-6 text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Stack Trace
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto text-xs">
                  {this.state.error?.stack}
                </pre>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto text-xs">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}