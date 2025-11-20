/**
 * Kiro AI Assistant Error Handling and Logging Index
 * 
 * Central export point for all error handling, logging, and retry utilities.
 * 
 * Usage:
 * ```typescript
 * import {
 *   kiroLogger,
 *   createGuardrailsLogger,
 *   retryBedrockOperation,
 *   callChatGPTWithRetry,
 * } from '@/aws/bedrock/error-handling';
 * ```
 */

// ============================================================================
// Logging
// ============================================================================

export {
  KiroLogger,
  kiroLogger,
  createGuardrailsLogger,
  createOrchestratorLogger,
  createWorkerLogger,
  createCitationLogger,
  createVisionLogger,
  createSearchLogger,
  createProfileLogger,
  recordMetric,
  getAggregatedMetrics,
  type KiroLogContext,
  type PerformanceMetrics,
  type GuardrailsViolation,
  type WorkflowMetrics,
  type CitationMetrics,
} from './kiro-logger';

// ============================================================================
// Retry Utilities
// ============================================================================

export {
  retryOperation,
  retryBedrockOperation,
  retryDynamoDBOperation,
  retryExternalAPICall,
  retryBatchOperations,
  isRetryableError,
  isValidationError,
  calculateRetryDelay,
  CircuitBreaker,
  CircuitState,
  BEDROCK_RETRY_CONFIG,
  DYNAMODB_RETRY_CONFIG,
  EXTERNAL_API_RETRY_CONFIG,
  type RetryConfig,
  type RetryResult,
  type RetryableOperation,
  type BatchRetryResult,
  type CircuitBreakerConfig,
} from './retry-utils';

// ============================================================================
// DynamoDB Retry Wrappers
// ============================================================================

export {
  getItemWithRetry,
  putItemWithRetry,
  updateItemWithRetry,
  deleteItemWithRetry,
  queryWithRetry,
  scanWithRetry,
  batchGetItemsWithRetry,
  queryAllWithRetry,
  scanAllWithRetry,
  transactWriteWithRetry,
  conditionalPutWithRetry,
  conditionalUpdateWithRetry,
  itemExistsWithRetry,
  countItemsWithRetry,
} from '../dynamodb/retry-wrapper';

// ============================================================================
// External API Retry Wrappers
// ============================================================================

export {
  callChatGPTWithRetry,
  callGeminiWithRetry,
  callClaudeWithRetry,
  callTavilyWithRetry,
  callAPIsInParallel,
  httpRequestWithRetry,
  getCircuitBreakerStatus,
  logCircuitBreakerStatus,
  callWithFallback,
  callWithFallbackFn,
  callWithFailover,
  type ParallelAPIResult,
  type HTTPRequestOptions,
} from './external-api-wrapper';

// ============================================================================
// Error Boundary Components
// ============================================================================

export {
  KiroErrorBoundary,
  ChatErrorBoundary,
  VisionErrorBoundary,
  ProfileErrorBoundary,
  AIOperationErrorBoundary,
  WorkflowErrorBoundary,
  InlineErrorDisplay,
  type KiroErrorBoundaryProps,
  type KiroErrorBoundaryState,
} from '../../components/bayon-assistant/error-boundaries';

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Logging with Kiro Logger
 * 
 * ```typescript
 * import { createGuardrailsLogger } from '@/aws/bedrock/error-handling';
 * 
 * const logger = createGuardrailsLogger({ userId: 'user123' });
 * logger.logGuardrailsCheck(true);
 * logger.logGuardrailsViolation({
 *   type: 'out-of-domain',
 *   query: 'sanitized query',
 *   timestamp: new Date(),
 * });
 * ```
 */

/**
 * Example 2: Retry Bedrock Operation
 * 
 * ```typescript
 * import { retryBedrockOperation, createWorkerLogger } from '@/aws/bedrock/error-handling';
 * 
 * const logger = createWorkerLogger('data-analyst');
 * const result = await retryBedrockOperation(
 *   async () => {
 *     return await bedrockClient.invoke(prompt, schema);
 *   },
 *   'Data Analysis',
 *   logger
 * );
 * ```
 */

/**
 * Example 3: Retry DynamoDB Operation
 * 
 * ```typescript
 * import { getItemWithRetry } from '@/aws/bedrock/error-handling';
 * 
 * const profile = await getItemWithRetry({
 *   TableName: 'BayonCoAgent',
 *   Key: { PK: 'USER#user123', SK: 'PROFILE#AGENT' },
 * });
 * ```
 */

/**
 * Example 4: Parallel External API Calls
 * 
 * ```typescript
 * import { callAPIsInParallel } from '@/aws/bedrock/error-handling';
 * 
 * const results = await callAPIsInParallel([
 *   { platform: 'ChatGPT', operation: () => searchChatGPT(query) },
 *   { platform: 'Gemini', operation: () => searchGemini(query) },
 *   { platform: 'Claude', operation: () => searchClaude(query) },
 * ]);
 * 
 * const successful = results.filter(r => r.success);
 * ```
 */

/**
 * Example 5: Error Boundary Usage
 * 
 * ```typescript
 * import { ChatErrorBoundary } from '@/aws/bedrock/error-handling';
 * 
 * function ChatPage() {
 *   return (
 *     <ChatErrorBoundary>
 *       <ChatInterface />
 *     </ChatErrorBoundary>
 *   );
 * }
 * ```
 */

/**
 * Example 6: Circuit Breaker Status
 * 
 * ```typescript
 * import { getCircuitBreakerStatus } from '@/aws/bedrock/error-handling';
 * 
 * const status = getCircuitBreakerStatus();
 * console.log('ChatGPT circuit:', status.chatGPT.state);
 * ```
 */
