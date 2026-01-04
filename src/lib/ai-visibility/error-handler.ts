/**
 * Comprehensive Error Handler for AI Visibility System
 * 
 * Central error handling service that coordinates retry, fallback, and recovery
 * Requirements: All error handling scenarios
 */

import { 
  AIVisibilityError, 
  getErrorRecoverySteps, 
  logError,
  wrapError
} from './errors';
import { retryManager, RetryConfig } from './retry-manager';
import { fallbackManager } from './fallback-manager';

/**
 * Error handling strategy configuration
 */
export interface ErrorHandlingStrategy {
  /** Whether to use retry logic */
  useRetry: boolean;
  /** Retry configuration if enabled */
  retryConfig?: RetryConfig;
  /** Whether to use fallback mechanisms */
  useFallback: boolean;
  /** Fallback data to use if needed */
  fallbackData?: any;
  /** Whether to log errors */
  logErrors: boolean;
  /** Custom error handler function */
  customHandler?: (error: AIVisibilityError) => Promise<any> | any;
}

/**
 * Error handling result
 */
export interface ErrorHandlingResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Result data if successful */
  data?: T;
  /** Error if failed */
  error?: AIVisibilityError;
  /** Whether fallback was used */
  usedFallback: boolean;
  /** Number of retry attempts made */
  retryAttempts: number;
  /** Recovery steps for the user */
  recoverySteps: string[];
}

/**
 * Default error handling strategies for different operations
 */
export const DEFAULT_ERROR_STRATEGIES: Record<string, ErrorHandlingStrategy> = {
  // Critical operations - aggressive retry and fallback
  schemaGeneration: {
    useRetry: true,
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      useJitter: false,
    },
    useFallback: true,
    logErrors: true,
  },
  
  // AI platform operations - moderate retry, cached fallback
  aiPlatformQuery: {
    useRetry: true,
    retryConfig: {
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      useJitter: true,
    },
    useFallback: true,
    logErrors: true,
  },
  
  // Database operations - quick retry, no fallback
  databaseOperation: {
    useRetry: true,
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
      useJitter: false,
    },
    useFallback: false,
    logErrors: true,
  },
  
  // Export operations - minimal retry, simplified fallback
  exportOperation: {
    useRetry: true,
    retryConfig: {
      maxAttempts: 2,
      baseDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2,
      useJitter: false,
    },
    useFallback: true,
    logErrors: true,
  },
  
  // Website analysis - moderate retry, default fallback
  websiteAnalysis: {
    useRetry: true,
    retryConfig: {
      maxAttempts: 4,
      baseDelay: 3000,
      maxDelay: 15000,
      backoffMultiplier: 1.5,
      useJitter: true,
    },
    useFallback: true,
    logErrors: true,
  },
  
  // Non-critical operations - minimal error handling
  analytics: {
    useRetry: false,
    useFallback: true,
    logErrors: false,
  },
};

/**
 * Comprehensive error handler class
 */
export class AIVisibilityErrorHandler {
  /**
   * Handle an operation with comprehensive error management
   */
  async handleOperation<T>(
    operation: () => Promise<T>,
    operationType: string,
    strategy?: Partial<ErrorHandlingStrategy>,
    context?: {
      userId?: string;
      serviceName?: string;
      operationId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ErrorHandlingResult<T>> {
    const finalStrategy = this.mergeStrategy(operationType, strategy);
    let retryAttempts = 0;
    let usedFallback = false;
    let lastError: AIVisibilityError | null = null;

    try {
      // Execute operation with retry if enabled
      let result: T;
      
      if (finalStrategy.useRetry && finalStrategy.retryConfig) {
        result = await retryManager.executeWithRetry(
          operation,
          finalStrategy.retryConfig,
          operationType
        );
        
        // Get retry stats to determine attempts made
        const stats = retryManager.getStats(operationType);
        if (stats && typeof stats === 'object' && 'totalAttempts' in stats) {
          retryAttempts = stats.totalAttempts;
        }
      } else {
        result = await operation();
      }

      return {
        success: true,
        data: result,
        usedFallback,
        retryAttempts,
        recoverySteps: [],
      };
    } catch (error) {
      lastError = error instanceof AIVisibilityError ? error : wrapError(error);
      
      // Log error if enabled
      if (finalStrategy.logErrors) {
        logError(lastError, {
          operationType,
          ...context,
          retryAttempts,
        });
      }

      // Try custom handler if provided
      if (finalStrategy.customHandler) {
        try {
          const customResult = await finalStrategy.customHandler(lastError);
          return {
            success: true,
            data: customResult,
            usedFallback: false,
            retryAttempts,
            recoverySteps: [],
          };
        } catch (customError) {
          // Custom handler failed, continue with fallback
          logError(wrapError(customError, 'Custom error handler failed'), context);
        }
      }

      // Try fallback if enabled
      if (finalStrategy.useFallback) {
        try {
          const fallbackResult = await fallbackManager.executeWithFallback(
            operation,
            context?.serviceName || operationType,
            finalStrategy.fallbackData,
            context?.userId
          );
          
          usedFallback = true;
          
          return {
            success: true,
            data: fallbackResult,
            usedFallback,
            retryAttempts,
            recoverySteps: getErrorRecoverySteps(lastError),
          };
        } catch (fallbackError) {
          // Fallback also failed
          logError(wrapError(fallbackError, 'Fallback mechanism failed'), context);
        }
      }

      // All recovery attempts failed
      return {
        success: false,
        error: lastError,
        usedFallback,
        retryAttempts,
        recoverySteps: getErrorRecoverySteps(lastError),
      };
    }
  }

  /**
   * Handle multiple operations with coordinated error management
   */
  async handleBatchOperations<T>(
    operations: Array<{
      operation: () => Promise<T>;
      operationType: string;
      strategy?: Partial<ErrorHandlingStrategy>;
      context?: Record<string, any>;
    }>,
    options: {
      /** Whether to fail fast on first error */
      failFast?: boolean;
      /** Maximum concurrent operations */
      concurrency?: number;
      /** Whether to collect all results even if some fail */
      collectPartialResults?: boolean;
    } = {}
  ): Promise<{
    results: Array<ErrorHandlingResult<T>>;
    overallSuccess: boolean;
    successCount: number;
    failureCount: number;
  }> {
    const { failFast = false, concurrency = 5, collectPartialResults = true } = options;
    const results: Array<ErrorHandlingResult<T>> = [];
    
    // Process operations in batches to respect concurrency limits
    const batches = this.createBatches(operations, concurrency);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (op, index) => {
        try {
          const result = await this.handleOperation(
            op.operation,
            op.operationType,
            op.strategy,
            op.context
          );
          
          // Fail fast if enabled and operation failed
          if (failFast && !result.success) {
            throw result.error || new AIVisibilityError('Batch operation failed', 'BATCH_FAILURE');
          }
          
          return result;
        } catch (error) {
          const wrappedError = wrapError(error);
          
          if (failFast) {
            throw wrappedError;
          }
          
          return {
            success: false,
            error: wrappedError,
            usedFallback: false,
            retryAttempts: 0,
            recoverySteps: getErrorRecoverySteps(wrappedError),
          } as ErrorHandlingResult<T>;
        }
      });

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        // Fail fast was triggered
        if (!collectPartialResults) {
          throw wrapError(error, 'Batch operation failed');
        }
        
        // Add error result for failed batch
        results.push({
          success: false,
          error: wrapError(error),
          usedFallback: false,
          retryAttempts: 0,
          recoverySteps: [],
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return {
      results,
      overallSuccess: failureCount === 0,
      successCount,
      failureCount,
    };
  }

  /**
   * Create a graceful degradation wrapper for operations
   */
  createGracefulOperation<T>(
    operation: () => Promise<T>,
    operationType: string,
    degradedValue: T,
    strategy?: Partial<ErrorHandlingStrategy>
  ): () => Promise<T> {
    return async () => {
      const result = await this.handleOperation(operation, operationType, {
        ...strategy,
        useFallback: true,
        fallbackData: degradedValue,
      });

      if (result.success && result.data !== undefined) {
        return result.data;
      }

      // Return degraded value if all else fails
      return degradedValue;
    };
  }

  /**
   * Monitor error patterns and adjust strategies
   */
  analyzeErrorPatterns(timeWindowHours: number = 24): {
    errorsByType: Record<string, number>;
    errorsByOperation: Record<string, number>;
    retrySuccessRate: number;
    fallbackUsageRate: number;
    recommendations: string[];
  } {
    // This would analyze error logs and retry statistics
    // For now, return a basic structure
    
    const recommendations: string[] = [];
    
    // Get retry statistics
    const retryStats = retryManager.getStats();
    let totalRetries = 0;
    let successfulRetries = 0;
    
    if (retryStats instanceof Map) {
      const entries = Array.from(retryStats.entries());
      for (const [operation, stats] of entries) {
        totalRetries += stats.totalAttempts;
        successfulRetries += stats.successfulRetries;
        
        // Add recommendations based on patterns
        if (stats.failedRetries > stats.successfulRetries) {
          recommendations.push(`Consider adjusting retry strategy for ${operation}`);
        }
      }
    }

    const retrySuccessRate = totalRetries > 0 ? successfulRetries / totalRetries : 0;
    
    if (retrySuccessRate < 0.7) {
      recommendations.push('Overall retry success rate is low - review error handling strategies');
    }

    return {
      errorsByType: {}, // Would be populated from error logs
      errorsByOperation: {}, // Would be populated from error logs
      retrySuccessRate,
      fallbackUsageRate: 0, // Would be calculated from fallback usage
      recommendations,
    };
  }

  /**
   * Merge strategy with defaults
   */
  private mergeStrategy(
    operationType: string, 
    customStrategy?: Partial<ErrorHandlingStrategy>
  ): ErrorHandlingStrategy {
    const defaultStrategy = DEFAULT_ERROR_STRATEGIES[operationType] || DEFAULT_ERROR_STRATEGIES.databaseOperation;
    
    return {
      ...defaultStrategy,
      ...customStrategy,
      retryConfig: customStrategy?.retryConfig 
        ? { ...defaultStrategy.retryConfig, ...customStrategy.retryConfig }
        : defaultStrategy.retryConfig,
    };
  }

  /**
   * Create batches for concurrent processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }
}

/**
 * Singleton error handler instance
 */
export const errorHandler = new AIVisibilityErrorHandler();

/**
 * Convenience function for handling operations with default strategy
 */
export async function handleAIVisibilityOperation<T>(
  operation: () => Promise<T>,
  operationType: string,
  context?: {
    userId?: string;
    serviceName?: string;
    metadata?: Record<string, any>;
  }
): Promise<T> {
  const result = await errorHandler.handleOperation(operation, operationType, undefined, context);
  
  if (result.success && result.data !== undefined) {
    return result.data;
  }
  
  throw result.error || new AIVisibilityError('Operation failed', 'OPERATION_FAILED');
}

/**
 * Convenience function for creating graceful operations
 */
export function createGracefulAIOperation<T>(
  operation: () => Promise<T>,
  operationType: string,
  degradedValue: T
): () => Promise<T> {
  return errorHandler.createGracefulOperation(operation, operationType, degradedValue);
}