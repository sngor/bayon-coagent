'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to monitoring service
    console.error('App Error:', error);
    
    // TODO: Send to error monitoring service (Sentry, CloudWatch, etc.)
    if (typeof window !== 'undefined') {
      // Client-side error logging
      try {
        // Example: Send to monitoring service
        // errorMonitoringService.captureException(error);
      } catch (loggingError) {
        console.error('Failed to log error:', loggingError);
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              Development Error Details:
            </h3>
            <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
            {error.digest && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
          >
            Go to Dashboard
          </Button>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          If this error continues, please{' '}
          <a 
            href="/support" 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            contact support
          </a>
        </div>
      </div>
    </div>
  );
}