/**
 * Retry Logic for DynamoDB Operations
 * 
 * Implements exponential backoff retry logic for transient failures.
 */

import { isRetryableError } from './errors';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 100) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 5000) */
  maxDelayMs?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Whether to add jitter to delays (default: true) */
  jitter?: boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Calculates the delay for a retry attempt with exponential backoff
 */
function calculateDelay(
  attempt: number,
  options: Required<RetryOptions>
): number {
  const exponentialDelay = Math.min(
    options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt),
    options.maxDelayMs
  );

  if (options.jitter) {
    // Add random jitter (±25%)
    const jitterRange = exponentialDelay * 0.25;
    const jitter = Math.random() * jitterRange * 2 - jitterRange;
    return Math.max(0, exponentialDelay + jitter);
  }

  return exponentialDelay;
}

/**
 * Sleeps for the specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes a function with retry logic
 * 
 * @param fn The function to execute
 * @param options Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Don't retry if the error is not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Calculate delay and wait before retrying
      const delay = calculateDelay(attempt, config);
      
      // Log retry attempt (in production, this would go to CloudWatch)
      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          `DynamoDB operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}). ` +
          `Retrying in ${Math.round(delay)}ms...`,
          { error: error.message, code: error.code || error.name }
        );
      }

      await sleep(delay);
    }
  }

  // All retries exhausted
  throw lastError!;
}

/**
 * Executes a batch operation with retry logic
 * Handles unprocessed items by retrying them
 * 
 * @param fn The batch function to execute
 * @param getUnprocessed Function to extract unprocessed items from the result
 * @param mergeResults Function to merge results from multiple attempts
 * @param items Initial items to process
 * @param options Retry configuration options
 * @returns The accumulated result
 */
export async function withBatchRetry<T, R>(
  fn: (items: T[]) => Promise<R>,
  getUnprocessed: (result: R) => T[] | undefined,
  items: T[],
  options: RetryOptions = {},
  mergeResults?: (accumulated: R, newResult: R) => R
): Promise<R> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let currentItems = items;
  let accumulatedResult: R | undefined;
  let attempt = 0;

  while (attempt <= config.maxRetries) {
    try {
      const result = await fn(currentItems);
      
      // Merge results if we have a merge function and accumulated results
      if (accumulatedResult && mergeResults) {
        accumulatedResult = mergeResults(accumulatedResult, result);
      } else {
        accumulatedResult = result;
      }

      const unprocessed = getUnprocessed(result);

      // If no unprocessed items, we're done
      if (!unprocessed || unprocessed.length === 0) {
        return accumulatedResult;
      }

      // If this was the last attempt, return with what we have
      if (attempt === config.maxRetries) {
        return accumulatedResult;
      }

      // Retry unprocessed items
      currentItems = unprocessed;
      const delay = calculateDelay(attempt, config);

      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          `Batch operation has ${unprocessed.length} unprocessed items. ` +
          `Retrying in ${Math.round(delay)}ms...`
        );
      }

      await sleep(delay);
      attempt++;
    } catch (error: any) {
      // For batch operations, we want to retry on any error
      if (attempt === config.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = calculateDelay(attempt, config);
      
      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          `Batch operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}). ` +
          `Retrying in ${Math.round(delay)}ms...`,
          { error: error.message, code: error.code || error.name }
        );
      }

      await sleep(delay);
      attempt++;
    }
  }

  return accumulatedResult!;
}
