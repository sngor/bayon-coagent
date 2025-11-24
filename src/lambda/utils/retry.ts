/**
 * Retry utility with exponential backoff and jitter
 * 
 * This utility provides resilient retry logic for service calls with:
 * - Exponential backoff (2x multiplier)
 * - Jitter to prevent thundering herd
 * - Configurable max retry attempts (default: 3)
 * - Type-safe error handling
 */

export interface RetryOptions {
    /**
     * Maximum number of retry attempts (default: 3)
     */
    maxAttempts?: number;

    /**
     * Initial delay in milliseconds (default: 100ms)
     */
    initialDelayMs?: number;

    /**
     * Backoff multiplier (default: 2)
     */
    backoffMultiplier?: number;

    /**
     * Maximum delay in milliseconds (default: 10000ms = 10s)
     */
    maxDelayMs?: number;

    /**
     * Whether to add jitter to prevent thundering herd (default: true)
     */
    useJitter?: boolean;

    /**
     * Custom function to determine if an error is retryable
     */
    isRetryable?: (error: Error) => boolean;

    /**
     * Callback invoked before each retry attempt
     */
    onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
    attempts: number;
}

/**
 * Default retryable error checker
 * Retries on network errors, timeouts, and 5xx server errors
 */
function defaultIsRetryable(error: Error): boolean {
    const retryableErrors = [
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'NetworkError',
        'TimeoutError',
    ];

    // Check error code
    if ('code' in error && typeof error.code === 'string') {
        if (retryableErrors.includes(error.code)) {
            return true;
        }
    }

    // Check HTTP status codes (5xx are retryable)
    if ('statusCode' in error && typeof error.statusCode === 'number') {
        return error.statusCode >= 500 && error.statusCode < 600;
    }

    // Check error message for common patterns
    const message = error.message.toLowerCase();
    return message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('unavailable') ||
        message.includes('throttl');
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
    attempt: number,
    initialDelayMs: number,
    backoffMultiplier: number,
    maxDelayMs: number,
    useJitter: boolean
): number {
    // Calculate exponential backoff: initialDelay * (multiplier ^ attempt)
    const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt);

    // Cap at max delay
    let delay = Math.min(exponentialDelay, maxDelayMs);

    // Add jitter: random value between 0 and delay
    if (useJitter) {
        delay = Math.random() * delay;
    }

    return Math.floor(delay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result or throwing the last error
 * 
 * @example
 * ```typescript
 * const result = await retry(
 *   async () => await fetchData(),
 *   { maxAttempts: 3, initialDelayMs: 100 }
 * );
 * ```
 */
export async function retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        initialDelayMs = 100,
        backoffMultiplier = 2,
        maxDelayMs = 10000,
        useJitter = true,
        isRetryable = defaultIsRetryable,
        onRetry,
    } = options;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // Attempt the operation
            const result = await fn();
            return result;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if we should retry
            const shouldRetry = attempt < maxAttempts - 1 && isRetryable(lastError);

            if (!shouldRetry) {
                throw lastError;
            }

            // Calculate delay for next attempt
            const delayMs = calculateDelay(
                attempt,
                initialDelayMs,
                backoffMultiplier,
                maxDelayMs,
                useJitter
            );

            // Invoke retry callback if provided
            if (onRetry) {
                onRetry(lastError, attempt + 1, delayMs);
            }

            // Wait before retrying
            await sleep(delayMs);
        }
    }

    // All attempts failed
    throw lastError || new Error('All retry attempts failed');
}

/**
 * Retry a function and return a result object instead of throwing
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to a RetryResult object
 * 
 * @example
 * ```typescript
 * const result = await retryWithResult(
 *   async () => await fetchData(),
 *   { maxAttempts: 3 }
 * );
 * 
 * if (result.success) {
 *   console.log('Data:', result.data);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts:', result.error);
 * }
 * ```
 */
export async function retryWithResult<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<RetryResult<T>> {
    const maxAttempts = options.maxAttempts || 3;
    let attempts = 0;

    try {
        const data = await retry(fn, {
            ...options,
            onRetry: (error, attempt, delayMs) => {
                attempts = attempt;
                if (options.onRetry) {
                    options.onRetry(error, attempt, delayMs);
                }
            },
        });

        return {
            success: true,
            data,
            attempts: attempts + 1,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            attempts: maxAttempts,
        };
    }
}

/**
 * Create a retryable version of a function
 * 
 * @param fn - The async function to make retryable
 * @param options - Retry configuration options
 * @returns A new function that automatically retries on failure
 * 
 * @example
 * ```typescript
 * const retryableFetch = makeRetryable(
 *   async (url: string) => await fetch(url),
 *   { maxAttempts: 3 }
 * );
 * 
 * const response = await retryableFetch('https://api.example.com/data');
 * ```
 */
export function makeRetryable<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs): Promise<TReturn> => {
        return retry(() => fn(...args), options);
    };
}
