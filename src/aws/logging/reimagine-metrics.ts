/**
 * Reimagine Image Toolkit Monitoring and Analytics
 * 
 * This module provides comprehensive monitoring and analytics for the Reimagine
 * Image Toolkit, tracking:
 * - CloudWatch logging for all operations
 * - Bedrock invocation metrics by model
 * - S3 storage usage
 * - Average processing time per edit type
 * - Error rate tracking and alerts
 * 
 * Requirements: Task 29 - Deployment considerations
 */

import { logger, createLogger, type LogContext } from './logger';
import {
  CloudWatchClient,
  PutMetricDataCommand,
  type MetricDatum,
} from '@aws-sdk/client-cloudwatch';
import { getConfig, getAWSCredentials } from '@/aws/config';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type EditType =
  | 'virtual-staging'
  | 'day-to-dusk'
  | 'enhance'
  | 'item-removal'
  | 'virtual-renovation';

export type OperationType =
  | 'upload'
  | 'edit'
  | 'analysis'
  | 'download'
  | 'delete'
  | 'history';

export interface OperationMetrics {
  operationType: OperationType;
  editType?: EditType;
  userId: string;
  duration: number;
  success: boolean;
  errorType?: string;
  modelId?: string;
  imageSize?: number;
  timestamp: Date;
}

export interface BedrockMetrics {
  modelId: string;
  editType?: EditType;
  duration: number;
  success: boolean;
  errorType?: string;
  inputTokens?: number;
  outputTokens?: number;
  timestamp: Date;
}

export interface StorageMetrics {
  operation: 'upload' | 'download' | 'delete';
  fileSize: number;
  userId: string;
  success: boolean;
  duration: number;
  timestamp: Date;
}

// ============================================================================
// CloudWatch Metrics Client
// ============================================================================

class ReimagineMetricsClient {
  private cloudWatchClient: CloudWatchClient;
  private namespace = 'BayonCoagent/Reimagine';
  private logger = createLogger({ service: 'reimagine-metrics' });

  constructor() {
    const config = getConfig();
    const credentials = getAWSCredentials();

    this.cloudWatchClient = new CloudWatchClient({
      region: config.region,
      credentials: credentials.accessKeyId && credentials.secretAccessKey
        ? {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
          }
        : undefined,
    });
  }

  /**
   * Publishes metrics to CloudWatch
   */
  private async publishMetrics(metrics: MetricDatum[]): Promise<void> {
    if (metrics.length === 0) {
      return;
    }

    try {
      const command = new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: metrics,
      });

      await this.cloudWatchClient.send(command);
    } catch (error) {
      this.logger.error('Failed to publish metrics to CloudWatch', error as Error, {
        metricCount: metrics.length,
      });
    }
  }

  /**
   * Records operation metrics (upload, edit, analysis, etc.)
   */
  async recordOperation(metrics: OperationMetrics): Promise<void> {
    const logContext: LogContext = {
      service: 'reimagine',
      operation: metrics.operationType,
      editType: metrics.editType,
      userId: metrics.userId,
      duration: metrics.duration,
      success: metrics.success,
      errorType: metrics.errorType,
      modelId: metrics.modelId,
      imageSize: metrics.imageSize,
    };

    // Log to CloudWatch Logs
    if (metrics.success) {
      this.logger.info(
        `${metrics.operationType} operation completed successfully`,
        logContext
      );
    } else {
      this.logger.error(
        `${metrics.operationType} operation failed`,
        new Error(metrics.errorType || 'Unknown error'),
        logContext
      );
    }

    // Publish metrics to CloudWatch Metrics
    const metricData: MetricDatum[] = [
      // Operation duration
      {
        MetricName: 'OperationDuration',
        Value: metrics.duration,
        Unit: 'Milliseconds',
        Timestamp: metrics.timestamp,
        Dimensions: [
          { Name: 'OperationType', Value: metrics.operationType },
          ...(metrics.editType ? [{ Name: 'EditType', Value: metrics.editType }] : []),
        ],
      },
      // Operation count
      {
        MetricName: 'OperationCount',
        Value: 1,
        Unit: 'Count',
        Timestamp: metrics.timestamp,
        Dimensions: [
          { Name: 'OperationType', Value: metrics.operationType },
          { Name: 'Status', Value: metrics.success ? 'Success' : 'Failure' },
          ...(metrics.editType ? [{ Name: 'EditType', Value: metrics.editType }] : []),
        ],
      },
    ];

    // Add error metrics if operation failed
    if (!metrics.success && metrics.errorType) {
      metricData.push({
        MetricName: 'ErrorCount',
        Value: 1,
        Unit: 'Count',
        Timestamp: metrics.timestamp,
        Dimensions: [
          { Name: 'OperationType', Value: metrics.operationType },
          { Name: 'ErrorType', Value: metrics.errorType },
          ...(metrics.editType ? [{ Name: 'EditType', Value: metrics.editType }] : []),
        ],
      });
    }

    // Add image size metrics for uploads
    if (metrics.operationType === 'upload' && metrics.imageSize) {
      metricData.push({
        MetricName: 'ImageSize',
        Value: metrics.imageSize,
        Unit: 'Bytes',
        Timestamp: metrics.timestamp,
        Dimensions: [{ Name: 'OperationType', Value: 'upload' }],
      });
    }

    await this.publishMetrics(metricData);
  }

  /**
   * Records Bedrock model invocation metrics
   */
  async recordBedrockInvocation(metrics: BedrockMetrics): Promise<void> {
    const logContext: LogContext = {
      service: 'reimagine-bedrock',
      modelId: metrics.modelId,
      editType: metrics.editType,
      duration: metrics.duration,
      success: metrics.success,
      errorType: metrics.errorType,
      inputTokens: metrics.inputTokens,
      outputTokens: metrics.outputTokens,
    };

    // Log to CloudWatch Logs
    if (metrics.success) {
      this.logger.info(
        `Bedrock invocation completed: ${metrics.modelId}`,
        logContext
      );
    } else {
      this.logger.error(
        `Bedrock invocation failed: ${metrics.modelId}`,
        new Error(metrics.errorType || 'Unknown error'),
        logContext
      );
    }

    // Publish metrics to CloudWatch Metrics
    const metricData: MetricDatum[] = [
      // Invocation duration by model
      {
        MetricName: 'BedrockInvocationDuration',
        Value: metrics.duration,
        Unit: 'Milliseconds',
        Timestamp: metrics.timestamp,
        Dimensions: [
          { Name: 'ModelId', Value: metrics.modelId },
          ...(metrics.editType ? [{ Name: 'EditType', Value: metrics.editType }] : []),
        ],
      },
      // Invocation count by model
      {
        MetricName: 'BedrockInvocationCount',
        Value: 1,
        Unit: 'Count',
        Timestamp: metrics.timestamp,
        Dimensions: [
          { Name: 'ModelId', Value: metrics.modelId },
          { Name: 'Status', Value: metrics.success ? 'Success' : 'Failure' },
          ...(metrics.editType ? [{ Name: 'EditType', Value: metrics.editType }] : []),
        ],
      },
    ];

    // Add token usage metrics if available
    if (metrics.inputTokens !== undefined) {
      metricData.push({
        MetricName: 'BedrockInputTokens',
        Value: metrics.inputTokens,
        Unit: 'Count',
        Timestamp: metrics.timestamp,
        Dimensions: [
          { Name: 'ModelId', Value: metrics.modelId },
          ...(metrics.editType ? [{ Name: 'EditType', Value: metrics.editType }] : []),
        ],
      });
    }

    if (metrics.outputTokens !== undefined) {
      metricData.push({
        MetricName: 'BedrockOutputTokens',
        Value: metrics.outputTokens,
        Unit: 'Count',
        Timestamp: metrics.timestamp,
        Dimensions: [
          { Name: 'ModelId', Value: metrics.modelId },
          ...(metrics.editType ? [{ Name: 'EditType', Value: metrics.editType }] : []),
        ],
      });
    }

    // Add error metrics if invocation failed
    if (!metrics.success && metrics.errorType) {
      metricData.push({
        MetricName: 'BedrockErrorCount',
        Value: 1,
        Unit: 'Count',
        Timestamp: metrics.timestamp,
        Dimensions: [
          { Name: 'ModelId', Value: metrics.modelId },
          { Name: 'ErrorType', Value: metrics.errorType },
          ...(metrics.editType ? [{ Name: 'EditType', Value: metrics.editType }] : []),
        ],
      });
    }

    await this.publishMetrics(metricData);
  }

  /**
   * Records S3 storage operation metrics
   */
  async recordStorageOperation(metrics: StorageMetrics): Promise<void> {
    const logContext: LogContext = {
      service: 'reimagine-storage',
      operation: metrics.operation,
      userId: metrics.userId,
      fileSize: metrics.fileSize,
      duration: metrics.duration,
      success: metrics.success,
    };

    // Log to CloudWatch Logs
    if (metrics.success) {
      this.logger.info(
        `S3 ${metrics.operation} operation completed`,
        logContext
      );
    } else {
      this.logger.error(
        `S3 ${metrics.operation} operation failed`,
        new Error('S3 operation failed'),
        logContext
      );
    }

    // Publish metrics to CloudWatch Metrics
    const metricData: MetricDatum[] = [
      // Storage operation duration
      {
        MetricName: 'StorageOperationDuration',
        Value: metrics.duration,
        Unit: 'Milliseconds',
        Timestamp: metrics.timestamp,
        Dimensions: [
          { Name: 'Operation', Value: metrics.operation },
          { Name: 'Status', Value: metrics.success ? 'Success' : 'Failure' },
        ],
      },
      // Storage operation count
      {
        MetricName: 'StorageOperationCount',
        Value: 1,
        Unit: 'Count',
        Timestamp: metrics.timestamp,
        Dimensions: [
          { Name: 'Operation', Value: metrics.operation },
          { Name: 'Status', Value: metrics.success ? 'Success' : 'Failure' },
        ],
      },
    ];

    // Add file size metrics
    if (metrics.operation === 'upload') {
      metricData.push({
        MetricName: 'StorageUsage',
        Value: metrics.fileSize,
        Unit: 'Bytes',
        Timestamp: metrics.timestamp,
        Dimensions: [{ Name: 'Operation', Value: 'upload' }],
      });
    } else if (metrics.operation === 'delete') {
      metricData.push({
        MetricName: 'StorageUsage',
        Value: -metrics.fileSize, // Negative value for deletions
        Unit: 'Bytes',
        Timestamp: metrics.timestamp,
        Dimensions: [{ Name: 'Operation', Value: 'delete' }],
      });
    }

    await this.publishMetrics(metricData);
  }

  /**
   * Records error rate for alerting
   */
  async recordErrorRate(
    operationType: OperationType,
    errorCount: number,
    totalCount: number
  ): Promise<void> {
    const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;

    const logContext: LogContext = {
      service: 'reimagine',
      operation: operationType,
      errorCount,
      totalCount,
      errorRate,
    };

    this.logger.info(
      `Error rate for ${operationType}: ${errorRate.toFixed(2)}%`,
      logContext
    );

    // Publish error rate metric
    await this.publishMetrics([
      {
        MetricName: 'ErrorRate',
        Value: errorRate,
        Unit: 'Percent',
        Timestamp: new Date(),
        Dimensions: [{ Name: 'OperationType', Value: operationType }],
      },
    ]);
  }

  /**
   * Records average processing time per edit type
   */
  async recordAverageProcessingTime(
    editType: EditType,
    averageDuration: number,
    sampleCount: number
  ): Promise<void> {
    const logContext: LogContext = {
      service: 'reimagine',
      editType,
      averageDuration,
      sampleCount,
    };

    this.logger.info(
      `Average processing time for ${editType}: ${averageDuration}ms (${sampleCount} samples)`,
      logContext
    );

    // Publish average processing time metric
    await this.publishMetrics([
      {
        MetricName: 'AverageProcessingTime',
        Value: averageDuration,
        Unit: 'Milliseconds',
        Timestamp: new Date(),
        Dimensions: [{ Name: 'EditType', Value: editType }],
      },
    ]);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let metricsClientInstance: ReimagineMetricsClient | null = null;

/**
 * Gets the singleton metrics client instance
 */
export function getMetricsClient(): ReimagineMetricsClient {
  if (!metricsClientInstance) {
    metricsClientInstance = new ReimagineMetricsClient();
  }
  return metricsClientInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetMetricsClient(): void {
  metricsClientInstance = null;
}

// ============================================================================
// Helper Functions for Easy Integration
// ============================================================================

/**
 * Tracks an operation with automatic timing
 */
export async function trackOperation<T>(
  operationType: OperationType,
  userId: string,
  operation: () => Promise<T>,
  options?: {
    editType?: EditType;
    modelId?: string;
    imageSize?: number;
  }
): Promise<T> {
  const startTime = Date.now();
  const metricsClient = getMetricsClient();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    await metricsClient.recordOperation({
      operationType,
      editType: options?.editType,
      userId,
      duration,
      success: true,
      modelId: options?.modelId,
      imageSize: options?.imageSize,
      timestamp: new Date(),
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorType = error instanceof Error ? error.name : 'UnknownError';

    await metricsClient.recordOperation({
      operationType,
      editType: options?.editType,
      userId,
      duration,
      success: false,
      errorType,
      modelId: options?.modelId,
      imageSize: options?.imageSize,
      timestamp: new Date(),
    });

    throw error;
  }
}

/**
 * Tracks a Bedrock invocation with automatic timing
 */
export async function trackBedrockInvocation<T>(
  modelId: string,
  operation: () => Promise<T>,
  options?: {
    editType?: EditType;
    inputTokens?: number;
    outputTokens?: number;
  }
): Promise<T> {
  const startTime = Date.now();
  const metricsClient = getMetricsClient();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    await metricsClient.recordBedrockInvocation({
      modelId,
      editType: options?.editType,
      duration,
      success: true,
      inputTokens: options?.inputTokens,
      outputTokens: options?.outputTokens,
      timestamp: new Date(),
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorType = error instanceof Error ? error.name : 'UnknownError';

    await metricsClient.recordBedrockInvocation({
      modelId,
      editType: options?.editType,
      duration,
      success: false,
      errorType,
      inputTokens: options?.inputTokens,
      outputTokens: options?.outputTokens,
      timestamp: new Date(),
    });

    throw error;
  }
}

/**
 * Tracks an S3 storage operation with automatic timing
 */
export async function trackStorageOperation<T>(
  operation: 'upload' | 'download' | 'delete',
  userId: string,
  fileSize: number,
  storageOperation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const metricsClient = getMetricsClient();

  try {
    const result = await storageOperation();
    const duration = Date.now() - startTime;

    await metricsClient.recordStorageOperation({
      operation,
      fileSize,
      userId,
      success: true,
      duration,
      timestamp: new Date(),
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    await metricsClient.recordStorageOperation({
      operation,
      fileSize,
      userId,
      success: false,
      duration,
      timestamp: new Date(),
    });

    throw error;
  }
}
