/**
 * CloudWatch Logging Configuration for Market Intelligence Alerts
 * 
 * Provides structured logging configuration, metrics, and alarms
 * specifically for alert processing components.
 */

import { createLogger } from '@/aws/logging/logger';
import type { LogContext } from '@/aws/logging/logger';

// ==================== Log Groups Configuration ====================

export const ALERT_LOG_GROUPS = {
    LIFE_EVENT_PROCESSOR: '/aws/lambda/life-event-processor',
    COMPETITOR_MONITOR: '/aws/lambda/competitor-monitor-processor',
    TREND_DETECTOR: '/aws/lambda/trend-detector-processor',
    PRICE_REDUCTION_MONITOR: '/aws/lambda/price-reduction-processor',
    ALERT_API: '/aws/api-gateway/alert-api',
    ALERT_PROCESSING: '/bayon/alerts/processing',
    ALERT_ERRORS: '/bayon/alerts/errors',
    EXTERNAL_API_CALLS: '/bayon/alerts/external-apis',
} as const;

// ==================== Structured Logging for Alerts ====================

export interface AlertLogContext extends LogContext {
    alertType?: string;
    userId?: string;
    alertId?: string;
    competitorId?: string;
    neighborhood?: string;
    targetAreaId?: string;
    externalApi?: string;
    processingBatch?: string;
    executionTime?: number;
    memoryUsed?: number;
    apiResponseTime?: number;
    retryAttempt?: number;
}

export class AlertLogger {
    private logger = createLogger({ service: 'alert-system' });

    /**
     * Logs alert processing start
     */
    logProcessingStart(context: AlertLogContext): void {
        this.logger.info('Alert processing started', {
            ...context,
            timestamp: new Date().toISOString(),
            stage: 'start',
        });
    }

    /**
     * Logs alert processing completion
     */
    logProcessingComplete(context: AlertLogContext & {
        alertsGenerated: number;
        processingTimeMs: number;
    }): void {
        this.logger.info('Alert processing completed', {
            ...context,
            timestamp: new Date().toISOString(),
            stage: 'complete',
        });
    }

    /**
     * Logs alert processing error
     */
    logProcessingError(error: Error, context: AlertLogContext): void {
        this.logger.error('Alert processing error', error, {
            ...context,
            timestamp: new Date().toISOString(),
            stage: 'error',
            errorType: error.constructor.name,
        });
    }

    /**
     * Logs external API call
     */
    logExternalApiCall(context: AlertLogContext & {
        apiName: string;
        endpoint: string;
        method: string;
        statusCode?: number;
        responseTimeMs: number;
        success: boolean;
    }): void {
        const logLevel = context.success ? 'info' : 'warn';

        this.logger[logLevel](`External API call ${context.success ? 'succeeded' : 'failed'}`, {
            ...context,
            timestamp: new Date().toISOString(),
            stage: 'external-api',
        });
    }

    /**
     * Logs data quality issues
     */
    logDataQualityIssue(context: AlertLogContext & {
        dataType: string;
        validationErrors: string[];
        recordsAffected: number;
    }): void {
        this.logger.warn('Data quality issue detected', undefined, {
            ...context,
            timestamp: new Date().toISOString(),
            stage: 'data-quality',
        });
    }

    /**
     * Logs alert generation metrics
     */
    logAlertMetrics(context: AlertLogContext & {
        alertsGenerated: number;
        alertsFiltered: number;
        processingTimeMs: number;
        memoryUsedMB: number;
        externalApiCalls: number;
        failedApiCalls: number;
    }): void {
        this.logger.info('Alert processing metrics', {
            ...context,
            timestamp: new Date().toISOString(),
            stage: 'metrics',
        });
    }

    /**
     * Logs user interaction with alerts
     */
    logUserInteraction(context: AlertLogContext & {
        action: 'view' | 'read' | 'dismiss' | 'filter' | 'search';
        alertCount?: number;
        filterCriteria?: string[];
        searchQuery?: string;
    }): void {
        this.logger.info('User alert interaction', {
            ...context,
            timestamp: new Date().toISOString(),
            stage: 'user-interaction',
        });
    }

    /**
     * Logs performance metrics
     */
    logPerformanceMetrics(context: AlertLogContext & {
        operation: string;
        durationMs: number;
        memoryUsedMB: number;
        cpuUsagePercent?: number;
        dbQueryCount?: number;
        cacheHitRate?: number;
    }): void {
        this.logger.info('Performance metrics', {
            ...context,
            timestamp: new Date().toISOString(),
            stage: 'performance',
        });
    }
}

// ==================== CloudWatch Metrics ====================

export interface AlertMetrics {
    alertsGenerated: number;
    alertsProcessed: number;
    alertsFiltered: number;
    processingErrors: number;
    externalApiErrors: number;
    dataQualityIssues: number;
    averageProcessingTime: number;
    memoryUsage: number;
    userInteractions: number;
}

export class AlertMetricsCollector {
    private logger = createLogger({ service: 'alert-metrics' });
    private metrics: AlertMetrics = {
        alertsGenerated: 0,
        alertsProcessed: 0,
        alertsFiltered: 0,
        processingErrors: 0,
        externalApiErrors: 0,
        dataQualityIssues: 0,
        averageProcessingTime: 0,
        memoryUsage: 0,
        userInteractions: 0,
    };

    /**
     * Increments alert generation count
     */
    incrementAlertsGenerated(count: number = 1): void {
        this.metrics.alertsGenerated += count;
        this.logMetric('AlertsGenerated', count);
    }

    /**
     * Increments processing error count
     */
    incrementProcessingErrors(count: number = 1): void {
        this.metrics.processingErrors += count;
        this.logMetric('ProcessingErrors', count);
    }

    /**
     * Increments external API error count
     */
    incrementExternalApiErrors(apiName: string, count: number = 1): void {
        this.metrics.externalApiErrors += count;
        this.logMetric('ExternalApiErrors', count, { apiName });
    }

    /**
     * Records processing time
     */
    recordProcessingTime(durationMs: number): void {
        // Update running average
        const currentAvg = this.metrics.averageProcessingTime;
        const processed = this.metrics.alertsProcessed;
        this.metrics.averageProcessingTime = (currentAvg * processed + durationMs) / (processed + 1);
        this.metrics.alertsProcessed++;

        this.logMetric('ProcessingTime', durationMs);
    }

    /**
     * Records memory usage
     */
    recordMemoryUsage(memoryMB: number): void {
        this.metrics.memoryUsage = memoryMB;
        this.logMetric('MemoryUsage', memoryMB);
    }

    /**
     * Records user interaction
     */
    recordUserInteraction(action: string): void {
        this.metrics.userInteractions++;
        this.logMetric('UserInteractions', 1, { action });
    }

    /**
     * Gets current metrics snapshot
     */
    getMetrics(): AlertMetrics {
        return { ...this.metrics };
    }

    /**
     * Resets metrics (typically called after publishing to CloudWatch)
     */
    resetMetrics(): void {
        this.metrics = {
            alertsGenerated: 0,
            alertsProcessed: 0,
            alertsFiltered: 0,
            processingErrors: 0,
            externalApiErrors: 0,
            dataQualityIssues: 0,
            averageProcessingTime: 0,
            memoryUsage: 0,
            userInteractions: 0,
        };
    }

    /**
     * Logs individual metric
     */
    private logMetric(metricName: string, value: number, dimensions?: Record<string, string>): void {
        this.logger.info(`Metric: ${metricName}`, {
            metricName,
            value,
            dimensions,
            timestamp: new Date().toISOString(),
            namespace: 'Bayon/Alerts',
        });
    }
}

// ==================== CloudWatch Alarms Configuration ====================

export const ALERT_ALARMS = {
    HIGH_ERROR_RATE: {
        name: 'AlertProcessingHighErrorRate',
        description: 'Alert processing error rate is above threshold',
        metricName: 'ProcessingErrors',
        threshold: 10,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        period: 300, // 5 minutes
    },
    EXTERNAL_API_FAILURES: {
        name: 'AlertExternalApiFailures',
        description: 'External API failure rate is above threshold',
        metricName: 'ExternalApiErrors',
        threshold: 5,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        period: 300,
    },
    HIGH_PROCESSING_TIME: {
        name: 'AlertHighProcessingTime',
        description: 'Alert processing time is above threshold',
        metricName: 'ProcessingTime',
        threshold: 30000, // 30 seconds
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 3,
        period: 300,
    },
    LOW_ALERT_GENERATION: {
        name: 'AlertLowGeneration',
        description: 'Alert generation rate is below expected threshold',
        metricName: 'AlertsGenerated',
        threshold: 1,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 6,
        period: 3600, // 1 hour
    },
    HIGH_MEMORY_USAGE: {
        name: 'AlertHighMemoryUsage',
        description: 'Alert processing memory usage is above threshold',
        metricName: 'MemoryUsage',
        threshold: 512, // MB
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        period: 300,
    },
} as const;

// ==================== Dashboard Configuration ====================

export const ALERT_DASHBOARD_WIDGETS = [
    {
        type: 'metric',
        properties: {
            metrics: [
                ['Bayon/Alerts', 'AlertsGenerated'],
                ['Bayon/Alerts', 'ProcessingErrors'],
                ['Bayon/Alerts', 'ExternalApiErrors'],
            ],
            period: 300,
            stat: 'Sum',
            region: 'us-east-1',
            title: 'Alert Processing Overview',
        },
    },
    {
        type: 'metric',
        properties: {
            metrics: [
                ['Bayon/Alerts', 'ProcessingTime'],
            ],
            period: 300,
            stat: 'Average',
            region: 'us-east-1',
            title: 'Average Processing Time',
        },
    },
    {
        type: 'metric',
        properties: {
            metrics: [
                ['Bayon/Alerts', 'MemoryUsage'],
            ],
            period: 300,
            stat: 'Average',
            region: 'us-east-1',
            title: 'Memory Usage',
        },
    },
    {
        type: 'log',
        properties: {
            query: `SOURCE '${ALERT_LOG_GROUPS.ALERT_ERRORS}'\n| fields @timestamp, @message, errorType, alertType, userId\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 100`,
            region: 'us-east-1',
            title: 'Recent Alert Processing Errors',
        },
    },
];

// ==================== Singleton Instances ====================

export const alertLogger = new AlertLogger();
export const alertMetrics = new AlertMetricsCollector();

// ==================== Utility Functions ====================

/**
 * Creates a logger with alert-specific context
 */
export function createAlertLogger(context: Partial<AlertLogContext>): AlertLogger {
    const logger = new AlertLogger();
    // Pre-populate context for all log calls
    return logger;
}

/**
 * Measures execution time and logs performance metrics
 */
export function measureExecutionTime<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Partial<AlertLogContext>
): Promise<T> {
    return new Promise(async (resolve, reject) => {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB

        try {
            const result = await fn();
            const endTime = Date.now();
            const endMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
            const duration = endTime - startTime;

            alertLogger.logPerformanceMetrics({
                ...context,
                operation,
                durationMs: duration,
                memoryUsedMB: endMemory - startMemory,
            });

            alertMetrics.recordProcessingTime(duration);
            alertMetrics.recordMemoryUsage(endMemory);

            resolve(result);
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;

            alertLogger.logProcessingError(error as Error, {
                ...context,
                operation,
                executionTime: duration,
            });

            alertMetrics.incrementProcessingErrors();

            reject(error);
        }
    });
}

/**
 * Logs external API call with automatic metrics collection
 */
export async function logExternalApiCall<T>(
    apiName: string,
    endpoint: string,
    method: string,
    fn: () => Promise<T>,
    context?: Partial<AlertLogContext>
): Promise<T> {
    const startTime = Date.now();

    try {
        const result = await fn();
        const responseTime = Date.now() - startTime;

        alertLogger.logExternalApiCall({
            ...context,
            apiName,
            endpoint,
            method,
            responseTimeMs: responseTime,
            success: true,
        });

        return result;
    } catch (error) {
        const responseTime = Date.now() - startTime;

        alertLogger.logExternalApiCall({
            ...context,
            apiName,
            endpoint,
            method,
            responseTimeMs: responseTime,
            success: false,
        });

        alertMetrics.incrementExternalApiErrors(apiName);

        throw error;
    }
}

/**
 * Creates a CloudWatch log stream name based on current date and instance
 */
export function createLogStreamName(service: string): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const instanceId = process.env.AWS_LAMBDA_FUNCTION_NAME || 'local';
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    return `${service}/${date}/${instanceId}/${randomSuffix}`;
}

/**
 * Formats log entry for CloudWatch structured logging
 */
export function formatCloudWatchLogEntry(
    level: string,
    message: string,
    context: AlertLogContext,
    error?: Error
): string {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        service: 'alert-system',
        ...context,
        ...(error && {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
        }),
    };

    return JSON.stringify(entry);
}