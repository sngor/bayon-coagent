/**
 * Kiro AI Assistant Logging Service
 * 
 * Provides structured logging for all Kiro AI Assistant components with:
 * - CloudWatch integration for production
 * - Performance metrics tracking
 * - Error context and correlation
 * - Component-specific loggers
 * 
 * Validates: Requirements 1.1, 4.5
 */

import { logger, createLogger, generateCorrelationId, type LogContext } from '@/aws/logging';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface KiroLogContext extends LogContext {
  component?: 'guardrails' | 'orchestrator' | 'worker' | 'citation' | 'vision' | 'search' | 'profile';
  workflowId?: string;
  taskId?: string;
  agentProfileId?: string;
  conversationId?: string;
  inputTokens?: number;
  outputTokens?: number;
  modelId?: string;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  retryCount?: number;
  errorCode?: string;
  metadata?: Record<string, any>;
}

export interface GuardrailsViolation {
  type: 'out-of-domain' | 'pii-detected' | 'financial-guarantee' | 'legal-advice' | 'unethical';
  query: string; // Sanitized query
  timestamp: Date;
  userId?: string;
}

export interface WorkflowMetrics {
  workflowId: string;
  totalDuration: number;
  taskCount: number;
  successfulTasks: number;
  failedTasks: number;
  workerBreakdown: Record<string, number>;
}

export interface CitationMetrics {
  totalCitations: number;
  validatedCitations: number;
  failedValidations: number;
  averageValidationTime: number;
}

// ============================================================================
// Kiro Logger Class
// ============================================================================

export class KiroLogger {
  private baseLogger: ReturnType<typeof createLogger>;
  private component: string;

  constructor(component: string, defaultContext?: KiroLogContext) {
    this.component = component;
    this.baseLogger = createLogger({
      service: 'kiro-ai-assistant',
      component,
      ...defaultContext,
    });
  }

  /**
   * Log guardrails validation
   */
  logGuardrailsCheck(
    allowed: boolean,
    reason?: string,
    context?: KiroLogContext
  ): void {
    if (allowed) {
      this.baseLogger.debug('Guardrails check passed', context);
    } else {
      this.baseLogger.warn('Guardrails check failed', {
        ...context,
        reason,
      });
    }
  }

  /**
   * Log guardrails violation for monitoring
   */
  logGuardrailsViolation(violation: GuardrailsViolation): void {
    this.baseLogger.warn('Guardrails violation detected', {
      violationType: violation.type,
      timestamp: violation.timestamp.toISOString(),
      userId: violation.userId,
      // Note: query is already sanitized
      queryLength: violation.query.length,
    });
  }

  /**
   * Log workflow execution
   */
  logWorkflowStart(workflowId: string, context?: KiroLogContext): void {
    this.baseLogger.info('Workflow started', {
      ...context,
      workflowId,
    });
  }

  logWorkflowComplete(
    workflowId: string,
    metrics: WorkflowMetrics,
    context?: KiroLogContext
  ): void {
    this.baseLogger.info('Workflow completed', {
      ...context,
      workflowId,
      ...metrics,
    });
  }

  logWorkflowError(
    workflowId: string,
    error: Error,
    context?: KiroLogContext
  ): void {
    this.baseLogger.error('Workflow failed', error, {
      ...context,
      workflowId,
    });
  }

  /**
   * Log worker agent execution
   */
  logWorkerStart(
    taskId: string,
    workerType: string,
    context?: KiroLogContext
  ): void {
    this.baseLogger.debug('Worker agent started', {
      ...context,
      taskId,
      workerType,
    });
  }

  logWorkerComplete(
    taskId: string,
    workerType: string,
    duration: number,
    context?: KiroLogContext
  ): void {
    this.baseLogger.info('Worker agent completed', {
      ...context,
      taskId,
      workerType,
      duration,
    });
  }

  logWorkerError(
    taskId: string,
    workerType: string,
    error: Error,
    context?: KiroLogContext
  ): void {
    this.baseLogger.error('Worker agent failed', error, {
      ...context,
      taskId,
      workerType,
    });
  }

  /**
   * Log citation operations
   */
  logCitationValidation(
    url: string,
    valid: boolean,
    duration: number,
    context?: KiroLogContext
  ): void {
    this.baseLogger.debug('Citation validation', {
      ...context,
      url,
      valid,
      duration,
    });
  }

  logCitationMetrics(metrics: CitationMetrics, context?: KiroLogContext): void {
    this.baseLogger.info('Citation metrics', {
      ...context,
      ...metrics,
    });
  }

  /**
   * Log vision analysis
   */
  logVisionAnalysis(
    imageSize: number,
    duration: number,
    context?: KiroLogContext
  ): void {
    this.baseLogger.info('Vision analysis completed', {
      ...context,
      imageSize,
      duration,
    });
  }

  /**
   * Log parallel search
   */
  logParallelSearch(
    platforms: string[],
    duration: number,
    successCount: number,
    context?: KiroLogContext
  ): void {
    this.baseLogger.info('Parallel search completed', {
      ...context,
      platforms: platforms.join(','),
      platformCount: platforms.length,
      successCount,
      duration,
    });
  }

  /**
   * Log profile operations
   */
  logProfileOperation(
    operation: 'create' | 'update' | 'retrieve' | 'delete',
    userId: string,
    duration: number,
    context?: KiroLogContext
  ): void {
    this.baseLogger.info(`Profile ${operation}`, {
      ...context,
      userId,
      duration,
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(metrics: PerformanceMetrics, context?: KiroLogContext): void {
    const level = metrics.success ? 'info' : 'warn';
    
    if (level === 'info') {
      this.baseLogger.info(`Performance: ${metrics.operation}`, {
        ...context,
        ...metrics,
      });
    } else {
      this.baseLogger.warn(`Performance issue: ${metrics.operation}`, {
        ...context,
        ...metrics,
      });
    }
  }

  /**
   * Log Bedrock API calls
   */
  logBedrockInvocation(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    duration: number,
    context?: KiroLogContext
  ): void {
    this.baseLogger.info('Bedrock invocation', {
      ...context,
      modelId,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      duration,
    });
  }

  logBedrockError(
    modelId: string,
    error: Error,
    retryCount: number,
    context?: KiroLogContext
  ): void {
    this.baseLogger.error('Bedrock invocation failed', error, {
      ...context,
      modelId,
      retryCount,
    });
  }

  /**
   * Generic logging methods
   */
  debug(message: string, context?: KiroLogContext): void {
    this.baseLogger.debug(message, context);
  }

  info(message: string, context?: KiroLogContext): void {
    this.baseLogger.info(message, context);
  }

  warn(message: string, context?: KiroLogContext): void {
    this.baseLogger.warn(message, context);
  }

  error(message: string, error?: Error, context?: KiroLogContext): void {
    this.baseLogger.error(message, error, context);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: KiroLogContext): KiroLogger {
    const childLogger = new KiroLogger(this.component);
    childLogger.baseLogger = this.baseLogger.child(additionalContext);
    return childLogger;
  }

  /**
   * Start an operation and return a completion function
   */
  startOperation(operation: string, context?: KiroLogContext): () => void {
    return this.baseLogger.startOperation(operation, context);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a logger for guardrails component
 */
export function createGuardrailsLogger(context?: KiroLogContext): KiroLogger {
  return new KiroLogger('guardrails', { ...context, component: 'guardrails' });
}

/**
 * Create a logger for orchestrator component
 */
export function createOrchestratorLogger(context?: KiroLogContext): KiroLogger {
  return new KiroLogger('orchestrator', { ...context, component: 'orchestrator' });
}

/**
 * Create a logger for worker agent component
 */
export function createWorkerLogger(workerType: string, context?: KiroLogContext): KiroLogger {
  return new KiroLogger('worker', { ...context, component: 'worker', workerType });
}

/**
 * Create a logger for citation service
 */
export function createCitationLogger(context?: KiroLogContext): KiroLogger {
  return new KiroLogger('citation', { ...context, component: 'citation' });
}

/**
 * Create a logger for vision agent
 */
export function createVisionLogger(context?: KiroLogContext): KiroLogger {
  return new KiroLogger('vision', { ...context, component: 'vision' });
}

/**
 * Create a logger for parallel search agent
 */
export function createSearchLogger(context?: KiroLogContext): KiroLogger {
  return new KiroLogger('search', { ...context, component: 'search' });
}

/**
 * Create a logger for profile service
 */
export function createProfileLogger(context?: KiroLogContext): KiroLogger {
  return new KiroLogger('profile', { ...context, component: 'profile' });
}

// ============================================================================
// Metrics Aggregation
// ============================================================================

/**
 * In-memory metrics store for aggregation
 * In production, this would be replaced with CloudWatch Metrics
 */
class MetricsStore {
  private metrics: Map<string, number[]> = new Map();

  record(metricName: string, value: number): void {
    const existing = this.metrics.get(metricName) || [];
    existing.push(value);
    this.metrics.set(metricName, existing);
  }

  getAverage(metricName: string): number {
    const values = this.metrics.get(metricName) || [];
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  getCount(metricName: string): number {
    return (this.metrics.get(metricName) || []).length;
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const metricsStore = new MetricsStore();

/**
 * Record a metric for aggregation
 */
export function recordMetric(metricName: string, value: number): void {
  metricsStore.record(metricName, value);
}

/**
 * Get aggregated metrics
 */
export function getAggregatedMetrics(): Record<string, { average: number; count: number }> {
  const result: Record<string, { average: number; count: number }> = {};
  
  // Common metrics to track
  const metricNames = [
    'workflow.duration',
    'worker.duration',
    'citation.validation.duration',
    'bedrock.duration',
    'profile.retrieval.duration',
  ];

  for (const name of metricNames) {
    result[name] = {
      average: metricsStore.getAverage(name),
      count: metricsStore.getCount(name),
    };
  }

  return result;
}

// ============================================================================
// Export default logger instance
// ============================================================================

export const kiroLogger = new KiroLogger('kiro-ai-assistant');
