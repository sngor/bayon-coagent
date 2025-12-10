/**
 * Workflow Error Handler
 * 
 * Provides error handling utilities for workflow operations including:
 * - Retry logic with exponential backoff
 * - Error classification and user-friendly messages
 * - Concurrent update conflict detection
 * - Network failure handling
 * 
 * Requirements: 12.5, 14.5
 */

/**
 * Error types for classification
 */
export enum WorkflowErrorType {
    NETWORK = 'NETWORK',
    VALIDATION = 'VALIDATION',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    CONCURRENT_UPDATE = 'CONCURRENT_UPDATE',
    DATABASE = 'DATABASE',
    UNKNOWN = 'UNKNOWN',
}

/**
 * Classified error with user-friendly message
 */
export interface ClassifiedError {
    type: WorkflowErrorType;
    message: string;
    originalError: Error;
    isRetryable: boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
};

/**
 * Classifies an error and returns user-friendly information
 * 
 * @param error - The error to classify
 * @returns Classified error with user-friendly message
 */
export function classifyError(error: any): ClassifiedError {
    const originalError = error instanceof Error ? error : new Error(String(error));
    const errorMessage = originalError.message.toLowerCase();

    // Network errors
    if (
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection')
    ) {
        return {
            type: WorkflowErrorType.NETWORK,
            message: 'Network connection error. Please check your internet connection and try again.',
            originalError,
            isRetryable: true,
        };
    }

    // Validation errors
    if (
        errorMessage.includes('validation') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('required')
    ) {
        return {
            type: WorkflowErrorType.VALIDATION,
            message: originalError.message, // Use original message for validation errors
            originalError,
            isRetryable: false,
        };
    }

    // Not found errors
    if (
        errorMessage.includes('not found') ||
        errorMessage.includes('does not exist')
    ) {
        return {
            type: WorkflowErrorType.NOT_FOUND,
            message: originalError.message, // Use original message
            originalError,
            isRetryable: false,
        };
    }

    // Unauthorized errors
    if (
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('forbidden')
    ) {
        return {
            type: WorkflowErrorType.UNAUTHORIZED,
            message: 'You do not have permission to perform this action.',
            originalError,
            isRetryable: false,
        };
    }

    // Concurrent update errors
    if (
        errorMessage.includes('concurrent') ||
        errorMessage.includes('conflict') ||
        errorMessage.includes('version') ||
        errorMessage.includes('conditional check failed')
    ) {
        return {
            type: WorkflowErrorType.CONCURRENT_UPDATE,
            message: 'This workflow was updated by another session. Please refresh and try again.',
            originalError,
            isRetryable: true,
        };
    }

    // Database errors
    if (
        errorMessage.includes('dynamodb') ||
        errorMessage.includes('database') ||
        errorMessage.includes('provisioned throughput')
    ) {
        return {
            type: WorkflowErrorType.DATABASE,
            message: 'Database service is temporarily unavailable. Please try again in a moment.',
            originalError,
            isRetryable: true,
        };
    }

    // Unknown errors
    return {
        type: WorkflowErrorType.UNKNOWN,
        message: 'An unexpected error occurred. Please try again.',
        originalError,
        isRetryable: true,
    };
}

/**
 * Calculates delay for exponential backoff
 * 
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelayMs);
}

/**
 * Sleeps for the specified duration
 * 
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes an async operation with retry logic
 * 
 * Implements exponential backoff for retryable errors.
 * 
 * @param operation - The async operation to execute
 * @param config - Retry configuration (optional)
 * @returns Result of the operation
 * @throws Last error if all retries fail
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const retryConfig: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        ...config,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const classified = classifyError(error);

            // Don't retry if error is not retryable
            if (!classified.isRetryable) {
                throw lastError;
            }

            // Don't retry if this was the last attempt
            if (attempt === retryConfig.maxAttempts - 1) {
                throw lastError;
            }

            // Calculate backoff delay
            const delay = calculateBackoffDelay(attempt, retryConfig);

            // Log retry attempt in development
            if (process.env.NODE_ENV === 'development') {
                console.log(
                    `Retry attempt ${attempt + 1}/${retryConfig.maxAttempts} after ${delay}ms`,
                    { error: classified.message }
                );
            }

            // Wait before retrying
            await sleep(delay);
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Operation failed after retries');
}

/**
 * Checks if an error is a concurrent update conflict
 * 
 * @param error - The error to check
 * @returns True if the error is a concurrent update conflict
 */
export function isConcurrentUpdateError(error: any): boolean {
    const classified = classifyError(error);
    return classified.type === WorkflowErrorType.CONCURRENT_UPDATE;
}

/**
 * Checks if an error is a network error
 * 
 * @param error - The error to check
 * @returns True if the error is a network error
 */
export function isNetworkError(error: any): boolean {
    const classified = classifyError(error);
    return classified.type === WorkflowErrorType.NETWORK;
}

/**
 * Checks if an error is retryable
 * 
 * @param error - The error to check
 * @returns True if the error is retryable
 */
export function isRetryableError(error: any): boolean {
    const classified = classifyError(error);
    return classified.isRetryable;
}

/**
 * Gets a user-friendly error message
 * 
 * @param error - The error
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
    const classified = classifyError(error);
    return classified.message;
}

/**
 * Formats an error for logging
 * 
 * @param error - The error to format
 * @param context - Additional context
 * @returns Formatted error object
 */
export function formatErrorForLogging(
    error: any,
    context?: Record<string, any>
): Record<string, any> {
    const classified = classifyError(error);

    return {
        type: classified.type,
        message: classified.message,
        originalMessage: classified.originalError.message,
        stack: classified.originalError.stack,
        isRetryable: classified.isRetryable,
        timestamp: new Date().toISOString(),
        ...context,
    };
}
