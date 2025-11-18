"use client";

/**
 * useErrorHandler Hook
 * 
 * React hook for handling errors with smart recovery mechanisms
 * and exponential backoff retry logic.
 */

import { useCallback, useState } from "react";
import {
  handleError,
  retryWithBackoff,
  isRetryableError,
  type ErrorHandlingOptions,
  type RetryConfig,
  type ErrorPattern,
} from "@/lib/error-handling";

interface UseErrorHandlerOptions extends ErrorHandlingOptions {
  onError?: (error: Error, pattern: ErrorPattern) => void;
}

interface UseErrorHandlerReturn {
  error: Error | null;
  pattern: ErrorPattern | null;
  isError: boolean;
  clearError: () => void;
  handleError: (error: unknown, options?: ErrorHandlingOptions) => ErrorPattern;
  withErrorHandling: <T>(
    fn: () => Promise<T>,
    options?: ErrorHandlingOptions
  ) => Promise<T | null>;
  withRetry: <T>(
    fn: () => Promise<T>,
    retryConfig?: Partial<RetryConfig>
  ) => Promise<T | null>;
}

export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const [error, setError] = useState<Error | null>(null);
  const [pattern, setPattern] = useState<ErrorPattern | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setPattern(null);
  }, []);

  const handleErrorCallback = useCallback(
    (err: unknown, handlingOptions?: ErrorHandlingOptions) => {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      const detectedPattern = handleError(errorObj, {
        ...options,
        ...handlingOptions,
      });

      setError(errorObj);
      setPattern(detectedPattern);

      if (options.onError) {
        options.onError(errorObj, detectedPattern);
      }

      return detectedPattern;
    },
    [options]
  );

  const withErrorHandling = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      handlingOptions?: ErrorHandlingOptions
    ): Promise<T | null> => {
      try {
        clearError();
        return await fn();
      } catch (err) {
        handleErrorCallback(err, handlingOptions);
        return null;
      }
    },
    [clearError, handleErrorCallback]
  );

  const withRetry = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      retryConfig?: Partial<RetryConfig>
    ): Promise<T | null> => {
      try {
        clearError();
        return await retryWithBackoff(fn, {
          ...retryConfig,
          onRetry: (attempt, err) => {
            console.log(`Retry attempt ${attempt} after error:`, err.message);
            if (retryConfig?.onRetry) {
              retryConfig.onRetry(attempt, err);
            }
          },
        });
      } catch (err) {
        handleErrorCallback(err, {
          showToast: true,
          logError: true,
        });
        return null;
      }
    },
    [clearError, handleErrorCallback]
  );

  return {
    error,
    pattern,
    isError: error !== null,
    clearError,
    handleError: handleErrorCallback,
    withErrorHandling,
    withRetry,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for handling async operations with automatic retry
 */
export function useAsyncWithRetry<T>(
  asyncFn: () => Promise<T>,
  retryConfig?: Partial<RetryConfig>
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { error, pattern, withRetry, clearError } = useErrorHandler();

  const execute = useCallback(async () => {
    setIsLoading(true);
    clearError();

    const result = await withRetry(asyncFn, retryConfig);

    if (result !== null) {
      setData(result);
    }

    setIsLoading(false);
    return result;
  }, [asyncFn, retryConfig, withRetry, clearError]);

  return {
    data,
    error,
    pattern,
    isLoading,
    isError: error !== null,
    execute,
    retry: execute,
    clearError,
  };
}

/**
 * Hook for handling form submissions with error handling
 */
export function useFormWithErrorHandling<T = any>() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error, pattern, withErrorHandling, clearError } = useErrorHandler({
    showToast: true,
  });

  const handleSubmit = useCallback(
    async (submitFn: () => Promise<T>): Promise<T | null> => {
      setIsSubmitting(true);
      clearError();

      const result = await withErrorHandling(submitFn);

      setIsSubmitting(false);
      return result;
    },
    [withErrorHandling, clearError]
  );

  return {
    error,
    pattern,
    isSubmitting,
    isError: error !== null,
    handleSubmit,
    clearError,
  };
}

/**
 * Hook for handling API calls with automatic retry for network errors
 */
export function useApiCall<T>(
  apiFn: () => Promise<T>,
  options: {
    retryOnNetworkError?: boolean;
    maxRetries?: number;
  } = {}
) {
  const { retryOnNetworkError = true, maxRetries = 3 } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { error, pattern, withRetry, withErrorHandling, clearError } =
    useErrorHandler();

  const execute = useCallback(async () => {
    setIsLoading(true);
    clearError();

    let result: T | null = null;

    if (retryOnNetworkError) {
      result = await withRetry(apiFn, {
        maxAttempts: maxRetries,
        baseDelay: 1000,
        maxDelay: 10000,
      });
    } else {
      result = await withErrorHandling(apiFn);
    }

    if (result !== null) {
      setData(result);
    }

    setIsLoading(false);
    return result;
  }, [
    apiFn,
    retryOnNetworkError,
    maxRetries,
    withRetry,
    withErrorHandling,
    clearError,
  ]);

  return {
    data,
    error,
    pattern,
    isLoading,
    isError: error !== null,
    execute,
    retry: execute,
    clearError,
  };
}
