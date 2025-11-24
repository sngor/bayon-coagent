/**
 * Retry Logic Utility with Exponential Backoff
 * 
 * Provides intelligent retry mechanisms for service calls with:
 * - Exponential backoff with configurable multiplier
 * - Jitter to prevent thundering herd problem
 * - Configurable max retry attempts
 * - Retry condition customization
 * - Detailed logging and callbacks
 * 
 * Requirements: 1.3 - Retry logic with exponential backoff
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface RetryOptions {
    /**
     * Maximum number of retry attempts
     * @default 3
     */
    maxRetries?: number;

    /**
     * Base delay in milliseconds before first retry
     * @default 1000
     */
    baseDelay?: number;

    /**
     * Maximum delay in milliseconds between retries
     * @default 30000
     */
    maxDelay?: number;

    /**
     * Backoff multiplier for exponential backoff
     * @default 2
     */
    backoffMultiplier?: number;

    /**
     * Enable jitter to prevent thundering herd
     * @default true
     */
    enableJitter?: boolean;

    /**
     * Jitter factor (0-1) - percentage of delay to randomize
     * @default 0.3
     */
    jitterFactor?: number;

    /**
     * Custom condition to determine if error should be retried
     * @param error - The error that occurred
     * @param attempt - Current attempt number (1-indexed)
     * @returns true if should retry, false otherwise
     */
    shouldRetry?: (error: Error, attempt: number) => boolean;

    /**
     * Callback invoked before each retry attempt
     * @param error - The error that occurred
     * @param attempt - Current attempt number (1-indexed)
     * @param delay - Delay in milliseconds before retry
     */
    onRetry?: (error: Error, attempt: number, delay: number) => void;

    /**
     * Callback invoked when all retries are exhausted
     * @param error - The final error
     * @param attempts - Total number of attempts made
     */
    onMaxRetriesExceeded?: (error: Error, attempts: number) => void;

    /**
     * Operation name for logging purposes
     */
    operationName?: string;
}

export interface RetryResult<T> {
    /**
     * The result of the operation
     */
    data: T;

    /**
     * Number of attempts made (including initial attempt)
     */
    attempts: number;

    /**
     * Total time spent in milliseconds (including delays)
     */
    totalTime: number;

    /**
     * Whether any retries were needed
     */
    hadRetries: boolean;
}

export interface RetryStats {
    operationName: string;
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageAttempts: number;
    lastAttemptTime: Date;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'onMaxRetriesExceeded' | 'operationName'>> = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    enableJitter: true,
    jitterFactor: 0.3,
};

// ============================================================================
// Retry Statistics Tracking
// ============================================================================

class RetryStatsTracker {
    private stats = new Map<string, RetryStats>();

    track(operationName: string, attempts: number, success: boolean): void {
        const existing = this.stats.get(operationName);

        if (existing) {
            existing.totalAttempts += attempts;
            if (success) {
                existing.successfulAttempts++;
            } else {
                existing.failedAttempts++;
            }
            existing.averageAttempts =
                existing.totalAttempts / (existing.successfulAttempts + existing.failedAttempts);
            existing.lastAttemptTime = new Date();
        } else {
            this.stats.set(operationName, {
                operationName,
                totalAttempts: attempts,
                successfulAttempts: success ? 1 : 0,
                failedAttempts: success ? 0 : 1,
                averageAttempts: attempts,
                lastAttemptTime: new Date(),
            });
        }
    }

    getStats(operationName?: string): RetryStats | Map<string, RetryStats> {
        if (operationName) {
            return this.stats.get(operationName) || {
                operationName,
                totalAttempts: 0,
                successfulAttempts: 0,
                failedAttempts: 0,
                averageAttempts: 0,
                lastAttemptTime: new Date(),
            };
        }
        return new Map(this.stats);
    }

    reset(operationName?: string): void {
        if (operationName) {
            this.stats.delete(operationName);
        } else {
            this.stats.clear();
        }
    }
}

// Global stats tracker
const statsTracker = new RetryStatsTracker();

// ============================================================================
// Retry Utility Functions
// ============================================================================

/**
 * Calculate delay with exponential backoff and optional jitter
 * 
 * @param attempt - Current attempt number (1-indexed)
 * @param options - Retry options
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(
    attempt: number,
    options: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'onMaxRetriesExceeded' | 'operationName'>>
): number {
    // Calculate exponential backoff: baseDelay * (backoffMultiplier ^ (attempt - 1))
    const exponentialDelay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1);

    // Cap at maxDelay
    const cappedDelay = Math.min(exponentialDelay, options.maxDelay);

    // Add jitter if enabled
    if (options.enableJitter) {
        // Jitter range: [delay * (1 - jitterFactor), delay * (1 + jitterFactor)]
        const jitterRange = cappedDelay * options.jitterFactor;
        const jitter = (Math.random() * 2 - 1) * jitterRange;
        return Math.max(0, cappedDelay + jitter);
    }

    return cappedDelay;
}

/**
 * Default retry condition - retries on network, timeout, and server errors
 * 
 * @param error - The error that occurred
 * @returns true if should retry, false otherwise
 */
export function defaultShouldRetry(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Retry on network errors
    if (
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('enotfound')
    ) {
        return true;
    }

    // Retry on server errors (5xx)
    if (
        errorMessage.includes('500') ||
        errorMessage.includes('502') ||
        errorMessage.includes('503') ||
        errorMessage.includes('504') ||
        errorMessage.includes('server error')
    ) {
        return true;
    }

    // Retry on rate limiting (429)
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        return true;
    }

    // Don't retry on client errors (4xx except 429)
    if (
        errorMessage.includes('400') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('404') ||
        errorMessage.includes('validation') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('forbidden')
    ) {
        return false;
    }

    // Retry on AWS service errors that are transient
    if (
        errorName.includes('throttling') ||
        errorName.includes('serviceunavailable') ||
        errorName.includes('internalerror')
    ) {
        return true;
    }

    // Default: retry
    return true;
}

/**
 * Sleep for specified milliseconds
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Main Retry Function
// ============================================================================

/**
 * Execute an async operation with retry logic and exponential backoff
 * 
 * @param operation - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise with operation result and retry metadata
 * @throws The last error if all retries are exhausted
 * 
 * @example
 * ```typescript
 * const result = await retryWithExponentialBackoff(
 *   async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     return response.json();
 *   },
 *   {
 *     maxRetries: 3,
 *     baseDelay: 1000,
 *     backoffMultiplier: 2,
 *     operationName: 'fetch-api-data',
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry attempt ${attempt} after ${delay}ms: ${error.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<RetryResult<T>> {
    // Merge with defaults
    const config: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'onMaxRetriesExceeded' | 'operationName'>> & Pick<RetryOptions, 'shouldRetry' | 'onRetry' | 'onMaxRetriesExceeded' | 'operationName'> = {
        ...DEFAULT_RETRY_OPTIONS,
        ...options,
    };

    const shouldRetry = config.shouldRetry || defaultShouldRetry;
    const operationName = config.operationName || 'unknown-operation';

    let lastError: Error;
    let attempt = 0;
    const startTime = Date.now();

    while (attempt <= config.maxRetries) {
        attempt++;

        try {
            // Execute the operation
            const data = await operation();

            // Track success
            const totalTime = Date.now() - startTime;
            statsTracker.track(operationName, attempt, true);

            // Log success if there were retries
            if (attempt > 1) {
                console.log(
                    `[Retry Success] ${operationName} succeeded on attempt ${attempt}/${config.maxRetries + 1} after ${totalTime}ms`
                );
            }

            return {
                data,
                attempts: attempt,
                totalTime,
                hadRetries: attempt > 1,
            };
        } catch (error) {
            lastError = error as Error;

            // Check if we should retry
            const isLastAttempt = attempt > config.maxRetries;
            const shouldRetryError = shouldRetry(lastError, attempt);

            // Log the error
            console.warn(
                `[Retry Attempt ${attempt}/${config.maxRetries + 1}] ${operationName} failed:`,
                lastError.message
            );

            // If this is the last attempt or we shouldn't retry, throw the error
            if (isLastAttempt || !shouldRetryError) {
                const totalTime = Date.now() - startTime;
                statsTracker.track(operationName, attempt, false);

                if (isLastAttempt && config.onMaxRetriesExceeded) {
                    config.onMaxRetriesExceeded(lastError, attempt);
                }

                if (isLastAttempt) {
                    console.error(
                        `[Retry Failed] ${operationName} failed after ${attempt} attempts and ${totalTime}ms:`,
                        lastError.message
                    );
                } else {
                    console.error(
                        `[Retry Aborted] ${operationName} error not retryable:`,
                        lastError.message
                    );
                }

                throw lastError;
            }

            // Calculate delay for next retry
            const delay = calculateRetryDelay(attempt, config);

            // Call onRetry callback if provided
            if (config.onRetry) {
                config.onRetry(lastError, attempt, delay);
            }

            console.log(
                `[Retry Delay] ${operationName} waiting ${Math.round(delay)}ms before attempt ${attempt + 1}`
            );

            // Wait before retrying
            await sleep(delay);
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError!;
}

/**
 * Simpler retry function that returns the result directly (without metadata)
 * 
 * @param operation - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise with operation result
 * @throws The last error if all retries are exhausted
 */
export async function retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const result = await retryWithExponentialBackoff(operation, options);
    return result.data;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get retry statistics for an operation or all operations
 * 
 * @param operationName - Optional operation name to get stats for
 * @returns Retry statistics
 */
export function getRetryStats(operationName?: string): RetryStats | Map<string, RetryStats> {
    return statsTracker.getStats(operationName);
}

/**
 * Reset retry statistics
 * 
 * @param operationName - Optional operation name to reset stats for
 */
export function resetRetryStats(operationName?: string): void {
    statsTracker.reset(operationName);
}

/**
 * Create a retry wrapper for a function
 * 
 * @param fn - Function to wrap with retry logic
 * @param options - Retry configuration options
 * @returns Wrapped function with retry logic
 * 
 * @example
 * ```typescript
 * const fetchWithRetry = createRetryWrapper(
 *   async (url: string) => {
 *     const response = await fetch(url);
 *     return response.json();
 *   },
 *   { maxRetries: 3, operationName: 'fetch-data' }
 * );
 * 
 * const data = await fetchWithRetry('https://api.example.com/data');
 * ```
 */
export function createRetryWrapper<TArgs extends any[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
        return retry(() => fn(...args), options);
    };
}

// ============================================================================
// Export Default Configuration
// ============================================================================

export { DEFAULT_RETRY_OPTIONS };
