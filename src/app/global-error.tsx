'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the critical error
    console.error('Global Error:', error);
    
    // TODO: Send to error monitoring service
    if (typeof window !== 'undefined') {
      try {
        // Example: Send to monitoring service
        // errorMonitoringService.captureException(error, { level: 'fatal' });
      } catch (loggingError) {
        console.error('Failed to log global error:', loggingError);
      }
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full text-center space-y-6 bg-white rounded-lg shadow-lg p-8">
            <div className="text-6xl">⚠️</div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Application Error
              </h1>
              <p className="text-gray-600">
                A critical error occurred. Please refresh the page or contact support.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={reset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go to Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-red-50 border border-red-200 rounded p-4">
                <summary className="font-semibold text-red-800 cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="text-sm text-red-700 mt-2 whitespace-pre-wrap break-words">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}