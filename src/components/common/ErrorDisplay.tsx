/**
 * ErrorDisplay Component
 * Display error messages with appropriate styling using shadcn/ui
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorDisplayProps {
  error: Error | unknown;
  title?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  showHome?: boolean;
}

export function ErrorDisplay({ 
  error, 
  title = 'Something went wrong',
  showRetry = false,
  onRetry,
  showHome = true 
}: ErrorDisplayProps) {
  const navigate = useNavigate();
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : 'An unexpected error occurred';

  const isNetworkError = errorMessage.toLowerCase().includes('fetch') || 
                        errorMessage.toLowerCase().includes('network');
  
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>{title}</CardTitle>
          </div>
          {isNetworkError && (
            <CardDescription>
              Unable to connect to the server. Please check your connection.
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="mt-2 font-mono text-xs">
              {errorMessage}
            </AlertDescription>
          </Alert>
        </CardContent>
        
        <CardFooter className="flex gap-2">
          {showRetry && onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {showHome && (
            <Button 
              onClick={() => navigate('/')}
              variant={showRetry ? "outline" : "default"}
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

// Also export as default for compatibility
export default ErrorDisplay;