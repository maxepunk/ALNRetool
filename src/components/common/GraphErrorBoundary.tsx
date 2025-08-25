import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/graph/utils/Logger'


interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class GraphErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Graph Error Boundary caught:', { errorInfo }, error);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
          <div className="max-w-md w-full space-y-4">
            <div className="flex items-center justify-center text-red-500 mb-4">
              <AlertCircle className="w-12 h-12" />
            </div>
            
            <h2 className="text-xl font-semibold text-center">
              Graph Rendering Error
            </h2>
            
            <p className="text-sm text-gray-600 text-center">
              An error occurred while rendering the graph visualization.
            </p>
            
            {this.state.error && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-xs font-mono text-gray-700">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="flex justify-center pt-4">
              <Button
                onClick={this.handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
            
            {import.meta.env?.DEV === true && this.state.errorInfo && (
              <details className="mt-6 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Developer Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-gray-600">
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