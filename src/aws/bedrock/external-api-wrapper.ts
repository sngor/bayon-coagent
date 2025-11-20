/**
 * External API Retry Wrapper
 * 
 * Provides retry logic for external API calls (ChatGPT, Gemini, Claude, Tavily)
 * with exponential backoff and circuit breaker pattern.
 * 
 * Validates: Requirements 5.1
 */

import { retryExternalAPICall, CircuitBreaker, type CircuitBreakerConfig } from './retry-utils';
import { createSearchLogger } from './kiro-logger';

const logger = createSearchLogger();

// ============================================================================
// Circuit Breakers for External APIs
// ============================================================================

const CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  resetTimeoutMs: 60000, // 1 minute
  monitoringWindowMs: 300000, // 5 minutes
};

// Create circuit breakers for each external API
const chatGPTCircuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_CONFIG, logger);
const geminiCircuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_CONFIG, logger);
const claudeCircuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_CONFIG, logger);
const tavilyCircuitBreaker = new CircuitBreaker(CIRCUIT_BREAKER_CONFIG, logger);

// ============================================================================
// External API Call Wrappers
// ============================================================================

/**
 * Call ChatGPT API with retry and circuit breaker
 */
export async function callChatGPTWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'ChatGPT API Call'
): Promise<T> {
  return chatGPTCircuitBreaker.execute(
    async () => {
      return retryExternalAPICall(
        operation,
        `ChatGPT: ${operationName}`,
        logger
      );
    },
    operationName
  );
}

/**
 * Call Gemini API with retry and circuit breaker
 */
export async function callGeminiWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Gemini API Call'
): Promise<T> {
  return geminiCircuitBreaker.execute(
    async () => {
      return retryExternalAPICall(
        operation,
        `Gemini: ${operationName}`,
        logger
      );
    },
    operationName
  );
}

/**
 * Call Claude API with retry and circuit breaker
 */
export async function callClaudeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Claude API Call'
): Promise<T> {
  return claudeCircuitBreaker.execute(
    async () => {
      return retryExternalAPICall(
        operation,
        `Claude: ${operationName}`,
        logger
      );
    },
    operationName
  );
}

/**
 * Call Tavily Search API with retry and circuit breaker
 */
export async function callTavilyWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Tavily Search'
): Promise<T> {
  return tavilyCircuitBreaker.execute(
    async () => {
      return retryExternalAPICall(
        operation,
        `Tavily: ${operationName}`,
        logger
      );
    },
    operationName
  );
}

// ============================================================================
// Parallel External API Calls with Partial Success
// ============================================================================

export interface ParallelAPIResult<T> {
  platform: string;
  success: boolean;
  data?: T;
  error?: Error;
}

/**
 * Call multiple external APIs in parallel, allowing partial success
 * Useful for parallel search across ChatGPT, Gemini, and Claude
 */
export async function callAPIsInParallel<T>(
  operations: Array<{
    platform: string;
    operation: () => Promise<T>;
  }>
): Promise<ParallelAPIResult<T>[]> {
  const startTime = Date.now();

  const results = await Promise.allSettled(
    operations.map(async ({ platform, operation }) => {
      let circuitBreaker: CircuitBreaker;
      
      // Select appropriate circuit breaker
      switch (platform.toLowerCase()) {
        case 'chatgpt':
          circuitBreaker = chatGPTCircuitBreaker;
          break;
        case 'gemini':
          circuitBreaker = geminiCircuitBreaker;
          break;
        case 'claude':
          circuitBreaker = claudeCircuitBreaker;
          break;
        default:
          circuitBreaker = tavilyCircuitBreaker;
      }

      return circuitBreaker.execute(
        async () => {
          return retryExternalAPICall(
            operation,
            `${platform} Parallel Search`,
            logger
          );
        },
        `${platform} Parallel Search`
      );
    })
  );

  const duration = Date.now() - startTime;

  const formattedResults: ParallelAPIResult<T>[] = results.map((result, index) => {
    const platform = operations[index].platform;

    if (result.status === 'fulfilled') {
      return {
        platform,
        success: true,
        data: result.value,
      };
    } else {
      return {
        platform,
        success: false,
        error: result.reason,
      };
    }
  });

  const successCount = formattedResults.filter((r) => r.success).length;

  logger.info('Parallel API calls completed', {
    totalAPIs: operations.length,
    successful: successCount,
    failed: operations.length - successCount,
    duration,
  });

  return formattedResults;
}

// ============================================================================
// HTTP Request Helpers with Retry
// ============================================================================

export interface HTTPRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

/**
 * Make an HTTP request with retry logic
 */
export async function httpRequestWithRetry<T>(
  url: string,
  options: HTTPRequestOptions = {},
  apiName: string = 'HTTP Request'
): Promise<T> {
  return retryExternalAPICall(
    async () => {
      const controller = new AbortController();
      const timeoutId = options.timeout
        ? setTimeout(() => controller.abort(), options.timeout)
        : null;

      try {
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        return data as T;
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    },
    apiName,
    logger
  );
}

// ============================================================================
// Circuit Breaker Status
// ============================================================================

/**
 * Get the status of all circuit breakers
 */
export function getCircuitBreakerStatus() {
  return {
    chatGPT: {
      state: chatGPTCircuitBreaker.getState(),
      failureCount: chatGPTCircuitBreaker.getFailureCount(),
    },
    gemini: {
      state: geminiCircuitBreaker.getState(),
      failureCount: geminiCircuitBreaker.getFailureCount(),
    },
    claude: {
      state: claudeCircuitBreaker.getState(),
      failureCount: claudeCircuitBreaker.getFailureCount(),
    },
    tavily: {
      state: tavilyCircuitBreaker.getState(),
      failureCount: tavilyCircuitBreaker.getFailureCount(),
    },
  };
}

/**
 * Log circuit breaker status
 */
export function logCircuitBreakerStatus(): void {
  const status = getCircuitBreakerStatus();
  logger.info('Circuit breaker status', status);
}

// ============================================================================
// Graceful Degradation Helpers
// ============================================================================

/**
 * Call an external API with a fallback value if it fails
 */
export async function callWithFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  apiName: string = 'External API'
): Promise<T> {
  try {
    return await retryExternalAPICall(operation, apiName, logger);
  } catch (error) {
    logger.warn(`${apiName} failed, using fallback`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}

/**
 * Call an external API with a fallback function if it fails
 */
export async function callWithFallbackFn<T>(
  operation: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  apiName: string = 'External API'
): Promise<T> {
  try {
    return await retryExternalAPICall(operation, apiName, logger);
  } catch (error) {
    logger.warn(`${apiName} failed, using fallback function`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return fallbackFn();
  }
}

/**
 * Call multiple APIs and return the first successful result
 * Useful for failover scenarios
 */
export async function callWithFailover<T>(
  operations: Array<{
    name: string;
    operation: () => Promise<T>;
  }>
): Promise<T> {
  let lastError: Error | undefined;

  for (const { name, operation } of operations) {
    try {
      logger.debug(`Attempting ${name}`);
      return await retryExternalAPICall(operation, name, logger);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`${name} failed, trying next option`, {
        error: lastError.message,
      });
    }
  }

  throw lastError || new Error('All failover options exhausted');
}
