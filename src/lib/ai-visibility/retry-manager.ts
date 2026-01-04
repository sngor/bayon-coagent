/**
 * Retry Manager for AI Visibility Operations
 * 
 * Implements retry logic with exponential backoff for AI platform APIs
 * Requirements: All error handling scenarios
 */

import { AIVisibilityError, categorizeError, logError } from './errors';

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay in milliseconds */
  baseDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Whether to add jitter to delays */
  useJitter: boolean;
  /** Custom retry condition function */
  shouldRetry?: (error: any, attempt: number) => boolean;
}

/**
 * Default retry configurations for different operation types
 */
export const DEFAULT_RETRY_CONFIGS: Record<string, RetryConfig> = {
  // AI Platform API calls - more aggressive retry due to network issues
  aiPlatform: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    useJitter: true,
  },
  
  // Schema generation - less aggressive, mostly for validation issues
  schemaGeneration: {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    useJitter: false,
  },
  
  // Website crawling - moderate retry for network issues
  websiteCrawling: {
    maxAttempts: 4,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 1.5,
    useJitter: true,
  },
  
  // Database operations - quick retry for transient issues
  database: {
    maxAttempts: 3,
    baseDelay: 100,
    maxDelay: 2000,
    backoffMultiplier: 2,
    useJitter: false,
  },
  
  // Export operations - minimal retry, mostly for file system issues
  export: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    useJitter: false,
  },
};

/**
 * Retry statistics for monitoring
 */
export interface RetryStats {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageDelay: number;
  lastRetryTime: Date | null;
}

/**
 * Retry manager class
 */
export class RetryManager {
  private stats: Map<string, RetryStats> = new Map();

  /**
   * Execute an operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    operationType: string = 'unknown'
  ): Promise<T> {
    let lastError: any;
    let totalDelay = 0;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Update success stats
        this.updateStats(operationType, attempt, totalDelay, true);
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        const errorCategory = categorizeError(error);
        const shouldRetry = config.shouldRetry 
          ? config.shouldRetry(error, attempt)
          : this.shouldRetryError(error, attempt, config.maxAttempts);

        // Don't retry on last attempt or if error is not retryable
        if (attempt === config.maxAttempts || !shouldRetry) {
          this.updateStats(operationType, attempt, totalDelay, false);
          throw this.wrapRetryError(error, attempt, operationType);
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, config);
        totalDelay += delay;

        // Log retry attempt
        logError(
          error instanceof AIVisibilityError ? error : new AIVisibilityError(
            error.message || 'Unknown error',
            'RETRY_ATTEMPT',
            500,
            true,
            { attempt, delay, operationType },
            error
          ),
          { 
            retryAttempt: attempt, 
            nextDelay: delay, 
            operationType,
            errorCategory: errorCategory.category 
          }
        );

        // Wait before next attempt
        await this.sleep(delay);
      }
    }

    // This should never be reached, but just in case
    throw this.wrapRetryError(lastError, config.maxAttempts, operationType);
  }

  /**
   * Determine if an error should be retried
   */
  private shouldRetryError(error: any, attempt: number, maxAttempts: number): boolean {
    const errorCategory = categorizeError(error);
    
    // Never retry on last attempt
    if (attempt >= maxAttempts) {
      return false;
    }

    // Always retry if the error is marked as retryable
    if (errorCategory.retryable) {
      return true;
    }

    // Don't retry client errors (4xx) except rate limits
    if (errorCategory.category === 'client') {
      return false;
    }

    // Don't retry configuration errors
    if (errorCategory.category === 'configuration') {
      return false;
    }

    // Retry network and server errors
    return errorCategory.category === 'network' || errorCategory.category === 'server';
  }

  /**
   * Calculate delay for next retry attempt
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Calculate exponential backoff
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    
    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter if enabled (±25% of delay)
    if (config.useJitter) {
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      delay = Math.max(0, delay + jitter);
    }
    
    return Math.round(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wrap error with retry information
   */
  private wrapRetryError(error: unknown, attempts: number, operationType: string): AIVisibilityError {
    if (error instanceof AIVisibilityError) {
      // Add retry context to existing error
      error.context = {
        ...error.context,
        retryAttempts: attempts,
        operationType,
        finalFailure: true,
      };
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof Error && 'code' in error ? (error as any).code : 
                     error instanceof Error ? error.name : 'UNKNOWN';

    // Create new error with retry context
    return new AIVisibilityError(
      `Operation failed after ${attempts} attempts: ${errorMessage}`,
      'RETRY_EXHAUSTED',
      500,
      false,
      {
        retryAttempts: attempts,
        operationType,
        originalError: errorMessage,
        originalErrorCode: errorCode,
      },
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Update retry statistics
   */
  private updateStats(
    operationType: string, 
    attempts: number, 
    totalDelay: number, 
    success: boolean
  ): void {
    const existing = this.stats.get(operationType) || {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageDelay: 0,
      lastRetryTime: null,
    };

    existing.totalAttempts += attempts;
    existing.lastRetryTime = new Date();

    if (success) {
      existing.successfulRetries++;
    } else {
      existing.failedRetries++;
    }

    // Update average delay (simple moving average)
    const totalOperations = existing.successfulRetries + existing.failedRetries;
    existing.averageDelay = (existing.averageDelay * (totalOperations - 1) + totalDelay) / totalOperations;

    this.stats.set(operationType, existing);
  }

  /**
   * Get retry statistics for monitoring
   */
  getStats(operationType?: string): Map<string, RetryStats> | RetryStats | null {
    if (operationType) {
      return this.stats.get(operationType) || null;
    }
    return new Map(this.stats);
  }

  /**
   * Reset statistics
   */
  resetStats(operationType?: string): void {
    if (operationType) {
      this.stats.delete(operationType);
    } else {
      this.stats.clear();
    }
  }

  /**
   * Get retry configuration for operation type
   */
  static getConfigForOperation(operationType: string): RetryConfig {
    return DEFAULT_RETRY_CONFIGS[operationType] || DEFAULT_RETRY_CONFIGS.database;
  }
}

/**
 * Singleton retry manager instance
 */
export const retryManager = new RetryManager();

/**
 * Convenience function for retrying AI platform operations
 */
export async function retryAIPlatformOperation<T>(
  operation: () => Promise<T>,
  platform: string
): Promise<T> {
  const config = {
    ...DEFAULT_RETRY_CONFIGS.aiPlatform,
    shouldRetry: (error: any, attempt: number) => {
      // Custom retry logic for AI platforms
      if (error?.status === 429 || error?.statusCode === 429) {
        // Always retry rate limits (up to max attempts)
        return attempt < DEFAULT_RETRY_CONFIGS.aiPlatform.maxAttempts;
      }
      
      // Don't retry authentication errors
      if (error?.status === 401 || error?.statusCode === 401) {
        return false;
      }
      
      // Don't retry bad request errors
      if (error?.status === 400 || error?.statusCode === 400) {
        return false;
      }
      
      // Retry server errors and network issues
      return error?.status >= 500 || error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED';
    },
  };

  return retryManager.executeWithRetry(operation, config, `aiPlatform:${platform}`);
}

/**
 * Convenience function for retrying schema operations
 */
export async function retrySchemaOperation<T>(
  operation: () => Promise<T>,
  schemaType: string
): Promise<T> {
  return retryManager.executeWithRetry(
    operation,
    DEFAULT_RETRY_CONFIGS.schemaGeneration,
    `schema:${schemaType}`
  );
}

/**
 * Convenience function for retrying website operations
 */
export async function retryWebsiteOperation<T>(
  operation: () => Promise<T>,
  url: string
): Promise<T> {
  return retryManager.executeWithRetry(
    operation,
    DEFAULT_RETRY_CONFIGS.websiteCrawling,
    `website:${new URL(url).hostname}`
  );
}

/**
 * Convenience function for retrying database operations
 */
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationType: string = 'query'
): Promise<T> {
  return retryManager.executeWithRetry(
    operation,
    DEFAULT_RETRY_CONFIGS.database,
    `database:${operationType}`
  );
}

/**
 * Convenience function for retrying export operations
 */
export async function retryExportOperation<T>(
  operation: () => Promise<T>,
  format: string
): Promise<T> {
  return retryManager.executeWithRetry(
    operation,
    DEFAULT_RETRY_CONFIGS.export,
    `export:${format}`
  );
}