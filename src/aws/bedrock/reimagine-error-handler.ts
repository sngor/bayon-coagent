/**
 * Error Handling and Retry Logic for Reimagine Image Toolkit
 * 
 * This module provides comprehensive error handling, retry logic, and user-friendly
 * error messages for all Reimagine operations.
 * 
 * Requirements: 2.4, 8.4
 */

import { createLogger, type LogContext } from '@/aws/logging/logger';

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error class for Reimagine operations
 */
export class ReimagineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly userMessage: string,
    public readonly recoverySuggestions: string[],
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ReimagineError';
  }
}

/**
 * Error thrown when Bedrock throttles requests
 */
export class ThrottlingError extends ReimagineError {
  constructor(originalError?: unknown) {
    super(
      'Bedrock API throttling',
      'THROTTLING',
      'The AI service is currently busy. Please try again in a moment.',
      [
        'Wait a few seconds and try again',
        'If the issue persists, try again later',
      ],
      originalError
    );
  }
}

/**
 * Error thrown when operations timeout
 */
export class TimeoutError extends ReimagineError {
  constructor(operation: string, originalError?: unknown) {
    super(
      `Operation timeout: ${operation}`,
      'TIMEOUT',
      'The request took too long to process. Please try again.',
      [
        'Try again with a smaller image',
        'Check your internet connection',
        'Try a different edit operation',
      ],
      originalError
    );
  }
}

/**
 * Error thrown when content is filtered by safety policies
 */
export class ContentFilterError extends ReimagineError {
  constructor(originalError?: unknown) {
    super(
      'Content filtered by safety policy',
      'CONTENT_FILTERED',
      'The AI was unable to process this request due to safety filters. Please try a different image.',
      [
        'Try uploading a different image',
        'Ensure the image is appropriate for real estate marketing',
        'Avoid images with sensitive or inappropriate content',
      ],
      originalError
    );
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends ReimagineError {
  constructor(field: string, reason: string, originalError?: unknown) {
    super(
      `Validation error: ${field} - ${reason}`,
      'VALIDATION',
      `Invalid ${field}: ${reason}`,
      [
        'Check your input and try again',
        'Ensure all required fields are filled correctly',
      ],
      originalError
    );
  }
}

/**
 * Error thrown when storage operations fail
 */
export class StorageError extends ReimagineError {
  constructor(operation: string, originalError?: unknown) {
    super(
      `Storage error: ${operation}`,
      'STORAGE',
      'File storage service is temporarily unavailable. Please try again.',
      [
        'Try again in a few moments',
        'Check your internet connection',
        'If the issue persists, contact support',
      ],
      originalError
    );
  }
}

/**
 * Error thrown when database operations fail
 */
export class DatabaseError extends ReimagineError {
  constructor(operation: string, originalError?: unknown) {
    super(
      `Database error: ${operation}`,
      'DATABASE',
      'Database service is temporarily unavailable. Please try again.',
      [
        'Try again in a few moments',
        'If the issue persists, contact support',
      ],
      originalError
    );
  }
}

/**
 * Error thrown when network operations fail
 */
export class NetworkError extends ReimagineError {
  constructor(originalError?: unknown) {
    super(
      'Network connection error',
      'NETWORK',
      'Network connection error. Please check your internet connection and try again.',
      [
        'Check your internet connection',
        'Try again in a few moments',
        'If using VPN, try disconnecting',
      ],
      originalError
    );
  }
}

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Classifies an error and returns a ReimagineError with appropriate messaging
 */
export function classifyError(error: unknown, operation: string): ReimagineError {
  // If already a ReimagineError, return as-is
  if (error instanceof ReimagineError) {
    return error;
  }

  // Extract error details
  const err = error as any;
  const message = err?.message?.toLowerCase() || '';
  const code = err?.code || err?.name || '';
  const statusCode = err?.statusCode || err?.$metadata?.httpStatusCode;

  // Classify by error type
  
  // Throttling errors
  if (
    code === 'ThrottlingException' ||
    code === 'TooManyRequestsException' ||
    statusCode === 429 ||
    message.includes('throttl') ||
    message.includes('rate limit')
  ) {
    return new ThrottlingError(error);
  }

  // Timeout errors
  if (
    code === 'TimeoutError' ||
    code === 'RequestTimeout' ||
    statusCode === 408 ||
    message.includes('timeout') ||
    message.includes('timed out')
  ) {
    return new TimeoutError(operation, error);
  }

  // Content filter errors
  if (
    code === 'ContentFilterException' ||
    message.includes('content policy') ||
    message.includes('filtered') ||
    message.includes('safety')
  ) {
    return new ContentFilterError(error);
  }

  // Validation errors
  if (
    code === 'ValidationException' ||
    code === 'InvalidParameterException' ||
    statusCode === 400 ||
    message.includes('validation') ||
    message.includes('invalid')
  ) {
    return new ValidationError(
      'input',
      err?.message || 'Invalid parameters provided',
      error
    );
  }

  // Storage (S3) errors
  if (
    message.includes('s3') ||
    message.includes('bucket') ||
    message.includes('storage')
  ) {
    return new StorageError(operation, error);
  }

  // Database (DynamoDB) errors
  if (
    message.includes('dynamodb') ||
    message.includes('provisioned throughput') ||
    message.includes('database')
  ) {
    return new DatabaseError(operation, error);
  }

  // Network errors
  if (
    code === 'NetworkError' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    message.includes('network') ||
    message.includes('connection')
  ) {
    return new NetworkError(error);
  }

  // Service unavailable
  if (statusCode === 503 || statusCode === 502) {
    return new ReimagineError(
      'Service unavailable',
      'SERVICE_UNAVAILABLE',
      'The service is temporarily unavailable. Please try again.',
      [
        'Wait a few moments and try again',
        'Check AWS service status',
      ],
      error
    );
  }

  // Access denied
  if (
    code === 'AccessDeniedException' ||
    statusCode === 403
  ) {
    return new ReimagineError(
      'Access denied',
      'ACCESS_DENIED',
      'This feature is not available. Please ensure proper permissions are configured.',
      [
        'Contact your administrator',
        'Verify your account has the necessary permissions',
      ],
      error
    );
  }

  // Generic error
  return new ReimagineError(
    err?.message || 'Unknown error',
    'UNKNOWN',
    'An unexpected error occurred. Please try again.',
    [
      'Try again in a few moments',
      'If the issue persists, contact support',
    ],
    error
  );
}

// ============================================================================
// Retry Configuration
// ============================================================================

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  timeoutMs?: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  timeoutMs: 60000, // 60 seconds
};

/**
 * Retry configuration for different operation types
 */
export const OPERATION_RETRY_CONFIGS: Record<string, Partial<RetryConfig>> = {
  upload: {
    maxRetries: 3,
    initialDelayMs: 500,
    timeoutMs: 30000, // 30 seconds for uploads
  },
  analysis: {
    maxRetries: 2,
    initialDelayMs: 1000,
    timeoutMs: 30000, // 30 seconds for analysis
  },
  edit: {
    maxRetries: 3,
    initialDelayMs: 2000,
    timeoutMs: 90000, // 90 seconds for edits (they take longer)
  },
  storage: {
    maxRetries: 3,
    initialDelayMs: 500,
    timeoutMs: 20000, // 20 seconds for storage operations
  },
  database: {
    maxRetries: 3,
    initialDelayMs: 500,
    timeoutMs: 10000, // 10 seconds for database operations
  },
};

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Determines if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ReimagineError) {
    // Retry throttling, timeout, network, and service unavailable errors
    return [
      'THROTTLING',
      'TIMEOUT',
      'NETWORK',
      'SERVICE_UNAVAILABLE',
      'STORAGE',
      'DATABASE',
    ].includes(error.code);
  }

  const err = error as any;
  const code = err?.code || err?.name || '';
  const statusCode = err?.statusCode || err?.$metadata?.httpStatusCode;

  // Retry on specific error codes
  return (
    code === 'ThrottlingException' ||
    code === 'TooManyRequestsException' ||
    code === 'TimeoutError' ||
    code === 'NetworkError' ||
    statusCode === 429 ||
    statusCode === 503 ||
    statusCode === 502
  );
}

/**
 * Executes an operation with retry logic and timeout
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationType: string,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const logger = createLogger({ service: 'reimagine', operation: operationType });
  
  const retryConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...OPERATION_RETRY_CONFIGS[operationType],
    ...config,
  };

  let lastError: unknown;
  let delay = retryConfig.initialDelayMs;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // Log attempt
      if (attempt > 0) {
        logger.info(`Retry attempt ${attempt}/${retryConfig.maxRetries}`, {
          delay,
        });
      }

      // Execute operation with timeout
      const result = await executeWithTimeout(
        operation,
        retryConfig.timeoutMs,
        operationType
      );

      // Log success
      if (attempt > 0) {
        logger.info(`Operation succeeded after ${attempt} retries`);
      }

      return result;
    } catch (error) {
      lastError = error;

      // Classify error
      const classifiedError = classifyError(error, operationType);

      // Log error
      logger.error(
        `Operation failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1})`,
        classifiedError,
        {
          errorCode: classifiedError.code,
          retryable: isRetryableError(classifiedError),
        }
      );

      // Check if we should retry
      const shouldRetry = isRetryableError(classifiedError) && attempt < retryConfig.maxRetries;

      if (!shouldRetry) {
        throw classifiedError;
      }

      // Wait before retrying (exponential backoff)
      await sleep(delay);

      // Increase delay for next attempt
      delay = Math.min(
        delay * retryConfig.backoffMultiplier,
        retryConfig.maxDelayMs
      );
    }
  }

  // This should never be reached, but TypeScript needs it
  throw classifyError(lastError, operationType);
}

/**
 * Executes an operation with a timeout
 */
async function executeWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number | undefined,
  operationType: string
): Promise<T> {
  if (!timeoutMs) {
    return operation();
  }

  return Promise.race([
    operation(),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(operationType));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Error Response Formatting
// ============================================================================

/**
 * Formats an error for API responses
 */
export interface ErrorResponse {
  success: false;
  error: string;
  errorCode: string;
  recoverySuggestions: string[];
}

/**
 * Converts an error to a user-friendly response
 */
export function formatErrorResponse(error: unknown, operation: string): ErrorResponse {
  const classifiedError = classifyError(error, operation);

  return {
    success: false,
    error: classifiedError.userMessage,
    errorCode: classifiedError.code,
    recoverySuggestions: classifiedError.recoverySuggestions,
  };
}

// ============================================================================
// Logging Helpers
// ============================================================================

/**
 * Logs an error with full context to CloudWatch
 */
export function logError(
  error: unknown,
  operation: string,
  context: LogContext = {}
): void {
  const logger = createLogger({ service: 'reimagine', operation });
  const classifiedError = classifyError(error, operation);

  logger.error(
    classifiedError.message,
    classifiedError.originalError instanceof Error
      ? classifiedError.originalError
      : new Error(String(classifiedError.originalError)),
    {
      ...context,
      errorCode: classifiedError.code,
      userMessage: classifiedError.userMessage,
      recoverySuggestions: classifiedError.recoverySuggestions,
    }
  );
}
