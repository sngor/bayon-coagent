/**
 * Retry Utilities for Kiro AI Assistant
 * 
 * Provides exponential backoff retry logic for:
 * - Bedrock API calls
 * - DynamoDB operations
 * - External API calls (ChatGPT, Gemini, Claude, Tavily)
 * 
 * Validates: Requirements 4.5, 5.1
 */

import { KiroLogger } from './kiro-logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number; // 0-1, adds randomness to prevent thundering herd
  retryableErrors?: string[]; // Error codes/names that should trigger retry
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalDuration: number;
  errors: Error[];
}

export interface RetryableOperation<T> {
  operation: () => Promise<T>;
  operationName: string;
  logger?: KiroLogger;
  config?: Partial<RetryConfig>;
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default retry configuration for Bedrock API calls
 */
export const BEDROCK_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds
  backoffMultiplier: 2,
  jitterFactor: 0.3,
  retryableErrors: [
    'ThrottlingException',
    'ServiceUnavailableException',
    'InternalServerException',
    'TimeoutError',
    'ModelTimeoutException',
  ],
};

/**
 * Default retry configuration for DynamoDB operations
 */
export const DYNAMODB_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 500, // 500ms
  maxDelayMs: 5000, // 5 seconds
  backoffMultiplier: 2,
  jitterFactor: 0.3,
  retryableErrors: [
    'ProvisionedThroughputExceededException',
    'ThrottlingException',
    'RequestLimitExceeded',
    'InternalServerError',
    'ServiceUnavailable',
  ],
};

/**
 * Default retry configuration for external API calls
 */
export const EXTERNAL_API_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2, // Fewer retries for external APIs
  baseDelayMs: 2000, // 2 seconds
  maxDelayMs: 8000, // 8 seconds
  backoffMultiplier: 2,
  jitterFactor: 0.5, // More jitter for external APIs
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'EAI_AGAIN',
  ],
};

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Determines if an error is retryable based on configuration
 */
export function isRetryableError(error: Error, config: RetryConfig): boolean {
  const errorCode = (error as any).code || (error as any).name || error.constructor.name;
  
  // Check if error code is in retryable list
  if (config.retryableErrors) {
    return config.retryableErrors.some(
      (retryableCode) =>
        errorCode === retryableCode ||
        error.message.includes(retryableCode)
    );
  }

  // Default retryable errors (network and service errors)
  const defaultRetryablePatterns = [
    /throttl/i,
    /timeout/i,
    /unavailable/i,
    /internal.*error/i,
    /service.*error/i,
    /network/i,
    /connection/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /429/, // Too Many Requests
    /500/, // Internal Server Error
    /502/, // Bad Gateway
    /503/, // Service Unavailable
    /504/, // Gateway Timeout
  ];

  return defaultRetryablePatterns.some(
    (pattern) =>
      pattern.test(errorCode) ||
      pattern.test(error.message)
  );
}

/**
 * Determines if an error is a validation error (should not retry)
 */
export function isValidationError(error: Error): boolean {
  const errorCode = (error as any).code || (error as any).name;
  const validationPatterns = [
    /validation/i,
    /invalid/i,
    /bad.*request/i,
    /400/,
    /401/, // Unauthorized
    /403/, // Forbidden
    /404/, // Not Found
  ];

  return validationPatterns.some(
    (pattern) =>
      pattern.test(errorCode) ||
      pattern.test(error.message)
  );
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Calculates the delay for the next retry attempt with exponential backoff and jitter
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig
): number {
  // Calculate exponential backoff
  const exponentialDelay =
    config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter to prevent thundering herd
  const jitter = cappedDelay * config.jitterFactor * Math.random();

  return Math.floor(cappedDelay + jitter);
}

/**
 * Executes an operation with retry logic
 */
export async function retryOperation<T>(
  options: RetryableOperation<T>
): Promise<RetryResult<T>> {
  const { operation, operationName, logger, config: partialConfig } = options;

  // Merge with default config
  const config: RetryConfig = {
    ...BEDROCK_RETRY_CONFIG,
    ...partialConfig,
  };

  const errors: Error[] = [];
  const startTime = Date.now();
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      logger?.debug(`Attempting ${operationName} (attempt ${attempt}/${config.maxAttempts})`);

      const result = await operation();
      const totalDuration = Date.now() - startTime;

      // Log success
      if (attempt > 1) {
        logger?.info(`${operationName} succeeded after ${attempt} attempts`, {
          attempts: attempt,
          duration: totalDuration,
        });
      }

      return {
        result,
        attempts: attempt,
        totalDuration,
        errors,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      errors.push(lastError);

      // Check if error is retryable
      const shouldRetry =
        !isValidationError(lastError) &&
        isRetryableError(lastError, config) &&
        attempt < config.maxAttempts;

      if (!shouldRetry) {
        logger?.error(
          `${operationName} failed (non-retryable or max attempts reached)`,
          lastError,
          {
            attempts: attempt,
            duration: Date.now() - startTime,
          }
        );
        throw lastError;
      }

      // Calculate delay for next attempt
      const delay = calculateRetryDelay(attempt, config);

      logger?.warn(
        `${operationName} failed, retrying in ${delay}ms`,
        {
          attempt,
          maxAttempts: config.maxAttempts,
          error: lastError.message,
          delay,
        }
      );

      // Call retry callback if provided
      if (config.onRetry) {
        config.onRetry(attempt, lastError, delay);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error(`${operationName} failed after ${config.maxAttempts} attempts`);
}

// ============================================================================
// Specialized Retry Functions
// ============================================================================

/**
 * Retry a Bedrock API call with appropriate configuration
 */
export async function retryBedrockOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  logger?: KiroLogger
): Promise<T> {
  const result = await retryOperation({
    operation,
    operationName: `Bedrock: ${operationName}`,
    logger,
    config: BEDROCK_RETRY_CONFIG,
  });

  return result.result;
}

/**
 * Retry a DynamoDB operation with appropriate configuration
 */
export async function retryDynamoDBOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  logger?: KiroLogger
): Promise<T> {
  const result = await retryOperation({
    operation,
    operationName: `DynamoDB: ${operationName}`,
    logger,
    config: DYNAMODB_RETRY_CONFIG,
  });

  return result.result;
}

/**
 * Retry an external API call with appropriate configuration
 */
export async function retryExternalAPICall<T>(
  operation: () => Promise<T>,
  apiName: string,
  logger?: KiroLogger
): Promise<T> {
  const result = await retryOperation({
    operation,
    operationName: `External API: ${apiName}`,
    logger,
    config: EXTERNAL_API_RETRY_CONFIG,
  });

  return result.result;
}

// ============================================================================
// Batch Retry with Partial Success
// ============================================================================

export interface BatchRetryResult<T> {
  successful: T[];
  failed: Array<{ error: Error; index: number }>;
  totalAttempts: number;
}

/**
 * Retry multiple operations, allowing partial success
 * Useful for parallel search across multiple platforms
 */
export async function retryBatchOperations<T>(
  operations: Array<() => Promise<T>>,
  operationNames: string[],
  logger?: KiroLogger,
  config?: Partial<RetryConfig>
): Promise<BatchRetryResult<T>> {
  const results = await Promise.allSettled(
    operations.map((operation, index) =>
      retryOperation({
        operation,
        operationName: operationNames[index] || `Operation ${index}`,
        logger,
        config,
      })
    )
  );

  const successful: T[] = [];
  const failed: Array<{ error: Error; index: number }> = [];
  let totalAttempts = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value.result);
      totalAttempts += result.value.attempts;
    } else {
      failed.push({
        error: result.reason,
        index,
      });
      totalAttempts += config?.maxAttempts || BEDROCK_RETRY_CONFIG.maxAttempts;
    }
  });

  logger?.info('Batch operation completed', {
    total: operations.length,
    successful: successful.length,
    failed: failed.length,
    totalAttempts,
  });

  return {
    successful,
    failed,
    totalAttempts,
  };
}

// ============================================================================
// Circuit Breaker Pattern
// ============================================================================

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeoutMs: number; // Time to wait before attempting to close circuit
  monitoringWindowMs: number; // Time window for counting failures
}

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit breaker to prevent cascading failures
 * Useful for external API calls that may be down
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;

  constructor(
    private config: CircuitBreakerConfig,
    private logger?: KiroLogger
  ) {}

  async execute<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      if (this.nextAttemptTime && new Date() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker is OPEN for ${operationName}`);
      }
      // Try to transition to half-open
      this.state = CircuitState.HALF_OPEN;
      this.logger?.info(`Circuit breaker transitioning to HALF_OPEN for ${operationName}`);
    }

    try {
      const result = await operation();

      // Success - reset circuit if in half-open state
      if (this.state === CircuitState.HALF_OPEN) {
        this.reset();
        this.logger?.info(`Circuit breaker CLOSED for ${operationName}`);
      }

      return result;
    } catch (error) {
      this.recordFailure();

      if (this.state === CircuitState.HALF_OPEN) {
        // Failed in half-open state, go back to open
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeoutMs);
        this.logger?.warn(`Circuit breaker reopened for ${operationName}`);
      }

      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    // Check if we should open the circuit
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeoutMs);
      this.logger?.warn('Circuit breaker OPENED', {
        failureCount: this.failureCount,
        threshold: this.config.failureThreshold,
      });
    }
  }

  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}
