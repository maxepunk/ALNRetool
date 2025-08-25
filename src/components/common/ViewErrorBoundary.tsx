import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ViewType } from '@/lib/graph/types';
import { logger } from '@/lib/graph/utils/Logger'


interface Props {
  children: ReactNode;
  viewType: ViewType;
  onReset?: () => void;
  onNavigateHome?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

interface ViewErrorConfig {
  title: string;
  description: string;
  suggestions: string[];
  canRecover: boolean;
}

const VIEW_ERROR_CONFIGS: Record<ViewType, ViewErrorConfig> = {
  'puzzle-focus': {
    title: 'Puzzle Focus View Error',
    description: 'Unable to display the puzzle focus view.',
    suggestions: [
      'Verify the puzzle ID is valid',
      'Check if puzzle data is available',
      'Try reducing the depth level',
      'Switch to a different view temporarily'
    ],
    canRecover: true
  },
  'character-journey': {
    title: 'Character Journey View Error',
    description: 'Unable to display the character journey.',
    suggestions: [
      'Verify the character ID is valid',
      'Check if character data is loaded',
      'Try refreshing the character list',
      'Use the generic view as fallback'
    ],
    canRecover: true
  },
  'timeline': {
    title: 'Timeline View Error',
    description: 'Unable to display the timeline view.',
    suggestions: [
      'Check if timeline events exist',
      'Verify date range is valid',
      'Try a different time period',
      'Switch to list view temporarily'
    ],
    canRecover: true
  },
  'node-connections': {
    title: 'Node Connections View Error',
    description: 'Unable to display node connections.',
    suggestions: [
      'Verify the starting node exists',
      'Try reducing the connection depth',
      'Check if relationships are loaded',
      'Use puzzle focus view as alternative'
    ],
    canRecover: true
  },
  'content-status': {
    title: 'Content Status View Error',
    description: 'Unable to display content status.',
    suggestions: [
      'Check if status data is available',
      'Verify filter settings',
      'Try clearing filters',
      'Switch to generic view'
    ],
    canRecover: true
  },
  'full-network': {
    title: 'Full Network View Error',
    description: 'Unable to display the full network view.',
    suggestions: [
      'Check if network data is available',
      'Try reducing the visualization complexity',
      'Clear filters and try again',
      'Switch to a focused view'
    ],
    canRecover: true
  }
};

const ERROR_RESET_COOLDOWN = 5000; // 5 seconds

/**
 * Error boundary for view-specific error handling
 * Provides tailored error messages and recovery options per view type
 */
export class ViewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const viewType = this.props.viewType || 'generic';
    logger.error(`[ViewErrorBoundary] Error in ${viewType} view:`, { errorInfo }, error);
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to error tracking service in production
    if (import.meta.env?.PROD === true) {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // TODO: Integrate with error tracking service (e.g., Sentry)
    // Log error details for tracking
    logger.error('[Error Tracking]', {
      viewType: this.props.viewType,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorCount: this.state.errorCount
    }, error);
  };

  handleReset = () => {
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;
    
    // Prevent rapid reset attempts
    if (timeSinceLastError < ERROR_RESET_COOLDOWN && this.state.errorCount > 2) {
      alert('Please wait a moment before trying again.');
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    this.props.onReset?.();
  };

  handleNavigateHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    });
    
    this.props.onNavigateHome?.();
  };

  handleReportBug = () => {
    const errorReport = {
      viewType: this.props.viewType,
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error details copied to clipboard. Please include this in your bug report.');
      })
      .catch(() => {
        logger.error('Failed to copy error details');
      });
  };

  render() {
    if (this.state.hasError) {
      const config = VIEW_ERROR_CONFIGS[this.props.viewType] || {
        title: 'View Error',
        description: 'The view encountered an unexpected error.',
        suggestions: [
          'Try refreshing the view',
          'Check if all required data is loaded',
          'Contact support if the issue persists'
        ],
        canRecover: true
      };
      const isFrequentError = this.state.errorCount > 3;
      const error = this.state.error;
      
      // Check for specific error types
      const isDataError = error?.message.toLowerCase().includes('data') || 
                         error?.message.toLowerCase().includes('undefined');
      const isNetworkError = error?.message.toLowerCase().includes('network') ||
                            error?.message.toLowerCase().includes('fetch');
      const isPermissionError = error?.message.toLowerCase().includes('permission') ||
                               error?.message.toLowerCase().includes('unauthorized');

      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-8">
          <div className="max-w-2xl w-full space-y-6">
            {/* Main error alert */}
            <Alert variant={isFrequentError ? "destructive" : "default"}>
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-lg">{config.title}</AlertTitle>
              <AlertDescription className="mt-2">
                {isDataError && 'Required data is missing or invalid. '}
                {isNetworkError && 'Network connection issue detected. '}
                {isPermissionError && 'You may not have permission to view this content. '}
                {config.description}
              </AlertDescription>
            </Alert>

            {/* Suggestions */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-sm">Suggestions:</h3>
              <ul className="space-y-1">
                {config.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Frequent error warning */}
            {isFrequentError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Recurring Error</AlertTitle>
                <AlertDescription>
                  This view has encountered multiple errors. Consider using a different view 
                  or contacting support if the issue persists.
                </AlertDescription>
              </Alert>
            )}

            {/* Error details (collapsible) */}
            {error && (
              <details className="bg-muted/30 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-sm">
                  Technical Details
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-mono text-muted-foreground">
                    {error.message}
                  </p>
                  {import.meta.env?.DEV === true && (
                    <pre className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 justify-center pt-4">
              {config.canRecover && !isFrequentError && (
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              )}
              
              {this.props.onNavigateHome && (
                <Button
                  onClick={this.handleNavigateHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Home
                </Button>
              )}
              
              <Button
                onClick={this.handleReportBug}
                variant="ghost"
                className="flex items-center gap-2"
              >
                <Bug className="w-4 h-4" />
                Copy Error Details
              </Button>
            </div>

            {/* Error count indicator */}
            {this.state.errorCount > 1 && (
              <p className="text-xs text-center text-muted-foreground">
                Error occurred {this.state.errorCount} times in this session
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}