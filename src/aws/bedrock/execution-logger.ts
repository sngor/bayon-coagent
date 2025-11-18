/**
 * Bedrock Flow Execution Logging Module
 * 
 * Provides execution logging and metrics tracking for Bedrock AI flows.
 * Logs model selection, execution time, token usage, and errors.
 */

import { createLogger, type LogContext } from '@/aws/logging/logger';
import { z } from 'zod';

/**
 * Token usage information from Bedrock response
 */
export interface TokenUsage {
  input: number;
  output: number;
}

/**
 * Error information for failed executions
 */
export interface ExecutionError {
  type: string;
  message: string;
  retryCount: number;
  code?: string;
  statusCode?: number;
}

/**
 * Metadata about the flow execution
 */
export interface ExecutionMetadata {
  userId?: string;
  featureCategory: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
}

/**
 * Complete log entry for a flow execution
 */
export interface FlowExecutionLog {
  timestamp: string;
  flowName: string;
  modelId: string;
  executionTimeMs: number;
  tokenUsage?: TokenUsage;
  success: boolean;
  error?: ExecutionError;
  metadata: ExecutionMetadata;
}

/**
 * Zod schema for FlowExecutionLog validation
 */
export const FlowExecutionLogSchema = z.object({
  timestamp: z.string(),
  flowName: z.string(),
  modelId: z.string(),
  executionTimeMs: z.number(),
  tokenUsage: z.object({
    input: z.number(),
    output: z.number(),
  }).optional(),
  success: z.boolean(),
  error: z.object({
    type: z.string(),
    message: z.string(),
    retryCount: z.number(),
    code: z.string().optional(),
    statusCode: z.number().optional(),
  }).optional(),
  metadata: z.object({
    userId: z.string().optional(),
    featureCategory: z.string(),
    temperature: z.number(),
    maxTokens: z.number(),
    topP: z.number().optional(),
  }),
});

/**
 * Logger instance for Bedrock flows
 */
const bedrockLogger = createLogger({ service: 'bedrock-flows' });

/**
 * Execution logger class for tracking flow executions
 */
export class ExecutionLogger {
  private flowName: string;
  private modelId: string;
  private startTime: number;
  private metadata: ExecutionMetadata;
  private retryCount: number = 0;

  constructor(
    flowName: string,
    modelId: string,
    metadata: ExecutionMetadata
  ) {
    this.flowName = flowName;
    this.modelId = modelId;
    this.metadata = metadata;
    this.startTime = Date.now();
  }

  /**
   * Increment retry count
   */
  incrementRetry(): void {
    this.retryCount++;
  }

  /**
   * Get current retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * Log successful execution
   */
  logSuccess(tokenUsage?: TokenUsage): void {
    const executionTimeMs = Date.now() - this.startTime;
    
    const logEntry: FlowExecutionLog = {
      timestamp: new Date().toISOString(),
      flowName: this.flowName,
      modelId: this.modelId,
      executionTimeMs,
      tokenUsage,
      success: true,
      metadata: this.metadata,
    };

    // Validate log entry
    FlowExecutionLogSchema.parse(logEntry);

    // Log to CloudWatch/console
    bedrockLogger.info(`Flow execution succeeded: ${this.flowName}`, {
      flowName: this.flowName,
      modelId: this.modelId,
      executionTimeMs,
      tokenUsage,
      featureCategory: this.metadata.featureCategory,
      temperature: this.metadata.temperature,
      maxTokens: this.metadata.maxTokens,
      userId: this.metadata.userId,
    } as LogContext);

    // Store structured log for metrics
    this.storeMetrics(logEntry);
  }

  /**
   * Log failed execution
   */
  logError(error: Error, errorCode?: string, statusCode?: number): void {
    const executionTimeMs = Date.now() - this.startTime;
    
    const executionError: ExecutionError = {
      type: error.name,
      message: error.message,
      retryCount: this.retryCount,
    };
    
    // Only add code and statusCode if they exist
    const code = errorCode || (error as any).code;
    const status = statusCode || (error as any).statusCode;
    
    if (code) {
      executionError.code = code;
    }
    
    if (status) {
      executionError.statusCode = status;
    }

    const logEntry: FlowExecutionLog = {
      timestamp: new Date().toISOString(),
      flowName: this.flowName,
      modelId: this.modelId,
      executionTimeMs,
      success: false,
      error: executionError,
      metadata: this.metadata,
    };

    // Validate log entry
    FlowExecutionLogSchema.parse(logEntry);

    // Log to CloudWatch/console with error details
    bedrockLogger.error(
      `Flow execution failed: ${this.flowName}`,
      error,
      {
        flowName: this.flowName,
        modelId: this.modelId,
        executionTimeMs,
        errorType: executionError.type,
        errorCode: executionError.code,
        statusCode: executionError.statusCode,
        retryCount: this.retryCount,
        featureCategory: this.metadata.featureCategory,
        temperature: this.metadata.temperature,
        maxTokens: this.metadata.maxTokens,
        userId: this.metadata.userId,
      } as LogContext
    );

    // Store structured log for metrics
    this.storeMetrics(logEntry);
  }

  /**
   * Store metrics for analysis
   * In production, this would send to CloudWatch Metrics
   */
  private storeMetrics(logEntry: FlowExecutionLog): void {
    // In local/dev, just log the structured data
    // In production, this would use CloudWatch PutMetricData API
    bedrockLogger.debug('Flow execution metrics', {
      metrics: logEntry,
    } as LogContext);
  }
}

/**
 * Create an execution logger for a flow
 */
export function createExecutionLogger(
  flowName: string,
  modelId: string,
  metadata: ExecutionMetadata
): ExecutionLogger {
  return new ExecutionLogger(flowName, modelId, metadata);
}

/**
 * Helper to extract token usage from Bedrock response metadata
 * Note: Token usage is available in the response metadata from Bedrock
 */
export function extractTokenUsage(responseMetadata: any): TokenUsage | undefined {
  // Bedrock Converse API returns usage in response.usage
  if (responseMetadata?.usage) {
    return {
      input: responseMetadata.usage.inputTokens || 0,
      output: responseMetadata.usage.outputTokens || 0,
    };
  }
  
  return undefined;
}

/**
 * Categorize flow by feature type
 */
export function categorizeFlow(flowName: string): string {
  const categories: Record<string, string[]> = {
    'content-generation': [
      'generateBlogPost',
      'generateNeighborhoodGuides',
      'generateSocialMediaPost',
      'listingDescriptionGenerator',
      'generateAgentBio',
      'generateVideoScript',
      'generateListingFaqs',
      'generateMarketUpdate',
    ],
    'analysis': [
      'analyzeReviewSentiment',
      'analyzeMultipleReviews',
      'runNapAudit',
      'findCompetitors',
      'enrichCompetitorData',
      'getKeywordRankings',
    ],
    'strategic': [
      'generateMarketingPlan',
      'runResearchAgent',
    ],
  };

  for (const [category, flows] of Object.entries(categories)) {
    if (flows.includes(flowName)) {
      return category;
    }
  }

  return 'other';
}
