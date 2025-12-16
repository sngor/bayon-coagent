/**
 * Monitoring and Logging Infrastructure Setup
 * 
 * Provides comprehensive monitoring, logging, and X-Ray tracing setup for microservices
 * including CloudWatch metrics, custom dashboards, and distributed tracing.
 */

import { CloudWatchClient, PutMetricDataCommand, MetricDatum } from '@aws-sdk/client-cloudwatch';
import * as AWSXRay from 'aws-xray-sdk-core';

// Initialize CloudWatch client with X-Ray tracing
let cloudWatchClient: CloudWatchClient;
try {
    cloudWatchClient = AWSXRay.captureAWSv3Client(new CloudWatchClient({
        region: process.env.AWS_REGION || 'us-east-1',
    }));
} catch (error) {
    cloudWatchClient = new CloudWatchClient({
        region: process.env.AWS_REGION || 'us-east-1',
    });
}

// Metric interfaces
export interface ServiceMetric {
    metricName: string;
    value: number;
    unit: 'Count' | 'Seconds' | 'Milliseconds' | 'Bytes' | 'Percent';
    dimensions?: Record<string, string>;
    timestamp?: Date;
}

export interface PerformanceMetrics {
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    memoryUsage: number;
    cpuUsage?: number;
}

// Log levels
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    FATAL = 'FATAL',
}

// Structured log entry interface
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    service: string;
    version: string;
    requestId?: string;
    traceId?: string;
    userId?: string;
    correlationId?: string;
    metadata?: Record<string, any>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

/**
 * Structured Logger for Microservices
 */
export class MicroserviceLogger {
    private serviceName: string;
    private serviceVersion: string;
    private logLevel: LogLevel;

    constructor(serviceName: string, serviceVersion: string = '1.0.0', logLevel: LogLevel = LogLevel.INFO) {
        this.serviceName = serviceName;
        this.serviceVersion = serviceVersion;
        this.logLevel = logLevel;
    }

    /**
     * Log debug message
     */
    public debug(message: string, metadata?: Record<string, any>): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            this.writeLog(LogLevel.DEBUG, message, metadata);
        }
    }

    /**
     * Log info message
     */
    public info(message: string, metadata?: Record<string, any>): void {
        if (this.shouldLog(LogLevel.INFO)) {
            this.writeLog(LogLevel.INFO, message, metadata);
        }
    }

    /**
     * Log warning message
     */
    public warn(message: string, metadata?: Record<string, any>): void {
        if (this.shouldLog(LogLevel.WARN)) {
            this.writeLog(LogLevel.WARN, message, metadata);
        }
    }

    /**
     * Log error message
     */
    public error(message: string, error?: Error, metadata?: Record<string, any>): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            const errorMetadata = error ? {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                },
            } : {};

            this.writeLog(LogLevel.ERROR, message, { ...metadata, ...errorMetadata });
        }
    }

    /**
     * Log fatal message
     */
    public fatal(message: string, error?: Error, metadata?: Record<string, any>): void {
        const errorMetadata = error ? {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
        } : {};

        this.writeLog(LogLevel.FATAL, message, { ...metadata, ...errorMetadata });
    }

    /**
     * Check if log level should be written
     */
    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }

    /**
     * Write structured log entry
     */
    private writeLog(level: LogLevel, message: string, metadata?: Record<string, any>): void {
        const logEntry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            service: this.serviceName,
            version: this.serviceVersion,
            requestId: this.getRequestId(),
            traceId: this.getTraceId(),
            userId: this.getUserId(),
            correlationId: this.getCorrelationId(),
            ...metadata,
        };

        // Output to CloudWatch Logs (structured JSON)
        console.log(JSON.stringify(logEntry));
    }

    /**
     * Get current request ID from Lambda context
     */
    private getRequestId(): string | undefined {
        return process.env.AWS_REQUEST_ID;
    }

    /**
     * Get current X-Ray trace ID
     */
    private getTraceId(): string | undefined {
        return process.env._X_AMZN_TRACE_ID;
    }

    /**
     * Get current user ID (from context or headers)
     */
    private getUserId(): string | undefined {
        // This would typically be extracted from JWT token or request context
        return undefined;
    }

    /**
     * Get correlation ID for distributed tracing
     */
    private getCorrelationId(): string | undefined {
        // This would typically be extracted from request headers
        return undefined;
    }
}

/**
 * Metrics Publisher for CloudWatch
 */
export class MetricsPublisher {
    private serviceName: string;
    private namespace: string;
    private defaultDimensions: Record<string, string>;

    constructor(serviceName: string, namespace: string = 'BayonCoAgent/Microservices') {
        this.serviceName = serviceName;
        this.namespace = namespace;
        this.defaultDimensions = {
            Service: serviceName,
            Environment: process.env.NODE_ENV || 'development',
        };
    }

    /**
     * Publish a single metric
     */
    public async publishMetric(metric: ServiceMetric): Promise<void> {
        const metricData: MetricDatum = {
            MetricName: metric.metricName,
            Value: metric.value,
            Unit: metric.unit,
            Timestamp: metric.timestamp || new Date(),
            Dimensions: this.buildDimensions(metric.dimensions),
        };

        try {
            await cloudWatchClient.send(new PutMetricDataCommand({
                Namespace: this.namespace,
                MetricData: [metricData],
            }));
        } catch (error) {
            console.error('Failed to publish metric:', error);
        }
    }

    /**
     * Publish multiple metrics in batch
     */
    public async publishMetrics(metrics: ServiceMetric[]): Promise<void> {
        const metricData: MetricDatum[] = metrics.map(metric => ({
            MetricName: metric.metricName,
            Value: metric.value,
            Unit: metric.unit,
            Timestamp: metric.timestamp || new Date(),
            Dimensions: this.buildDimensions(metric.dimensions),
        }));

        try {
            // CloudWatch allows up to 20 metrics per request
            const batches = this.chunkArray(metricData, 20);

            for (const batch of batches) {
                await cloudWatchClient.send(new PutMetricDataCommand({
                    Namespace: this.namespace,
                    MetricData: batch,
                }));
            }
        } catch (error) {
            console.error('Failed to publish metrics batch:', error);
        }
    }

    /**
     * Publish performance metrics
     */
    public async publishPerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
        const serviceMetrics: ServiceMetric[] = [
            {
                metricName: 'RequestCount',
                value: metrics.requestCount,
                unit: 'Count',
            },
            {
                metricName: 'ErrorCount',
                value: metrics.errorCount,
                unit: 'Count',
            },
            {
                metricName: 'AverageResponseTime',
                value: metrics.averageResponseTime,
                unit: 'Milliseconds',
            },
            {
                metricName: 'P95ResponseTime',
                value: metrics.p95ResponseTime,
                unit: 'Milliseconds',
            },
            {
                metricName: 'P99ResponseTime',
                value: metrics.p99ResponseTime,
                unit: 'Milliseconds',
            },
            {
                metricName: 'MemoryUsage',
                value: metrics.memoryUsage,
                unit: 'Bytes',
            },
        ];

        if (metrics.cpuUsage !== undefined) {
            serviceMetrics.push({
                metricName: 'CPUUsage',
                value: metrics.cpuUsage,
                unit: 'Percent',
            });
        }

        await this.publishMetrics(serviceMetrics);
    }

    /**
     * Publish error rate metric
     */
    public async publishErrorRate(errorCount: number, totalCount: number): Promise<void> {
        const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;

        await this.publishMetric({
            metricName: 'ErrorRate',
            value: errorRate,
            unit: 'Percent',
        });
    }

    /**
     * Publish availability metric
     */
    public async publishAvailability(isHealthy: boolean): Promise<void> {
        await this.publishMetric({
            metricName: 'Availability',
            value: isHealthy ? 1 : 0,
            unit: 'Count',
        });
    }

    /**
     * Build dimensions array from object
     */
    private buildDimensions(customDimensions?: Record<string, string>) {
        const allDimensions = { ...this.defaultDimensions, ...customDimensions };

        return Object.entries(allDimensions).map(([name, value]) => ({
            Name: name,
            Value: value,
        }));
    }

    /**
     * Chunk array into smaller arrays
     */
    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}

/**
 * X-Ray Tracing Utilities
 */
export class TracingUtils {
    /**
     * Create a new subsegment for operation tracing
     */
    public static createSubsegment(name: string, operation: (subsegment: any) => Promise<any>): Promise<any> {
        if (!AWSXRay.getSegment()) {
            // No active segment, execute without tracing
            return operation(null);
        }

        return new Promise((resolve, reject) => {
            AWSXRay.captureAsyncFunc(name, async (subsegment) => {
                try {
                    const result = await operation(subsegment);
                    if (subsegment) {
                        subsegment.close();
                    }
                    resolve(result);
                } catch (error) {
                    if (subsegment) {
                        subsegment.addError(error);
                        subsegment.close(error);
                    }
                    reject(error);
                }
            });
        });
    }

    /**
     * Add annotation to current segment
     */
    public static addAnnotation(key: string, value: string | number | boolean): void {
        const segment = AWSXRay.getSegment();
        if (segment) {
            segment.addAnnotation(key, value);
        }
    }

    /**
     * Add metadata to current segment
     */
    public static addMetadata(key: string, value: any, namespace?: string): void {
        const segment = AWSXRay.getSegment();
        if (segment) {
            segment.addMetadata(key, value, namespace);
        }
    }

    /**
     * Get current trace ID
     */
    public static getTraceId(): string | undefined {
        const segment = AWSXRay.getSegment();
        return segment?.trace_id;
    }

    /**
     * Set user ID for tracing
     */
    public static setUser(userId: string): void {
        const segment = AWSXRay.getSegment();
        if (segment) {
            segment.setUser(userId);
        }
    }
}

/**
 * Performance Monitor
 * Tracks and reports service performance metrics
 */
export class PerformanceMonitor {
    private requestTimes: number[] = [];
    private errorCount: number = 0;
    private requestCount: number = 0;
    private metricsPublisher: MetricsPublisher;
    private logger: MicroserviceLogger;

    constructor(serviceName: string) {
        this.metricsPublisher = new MetricsPublisher(serviceName);
        this.logger = new MicroserviceLogger(serviceName);
    }

    /**
     * Record request start time
     */
    public startRequest(): number {
        return Date.now();
    }

    /**
     * Record request completion
     */
    public endRequest(startTime: number, success: boolean = true): void {
        const duration = Date.now() - startTime;
        this.requestTimes.push(duration);
        this.requestCount++;

        if (!success) {
            this.errorCount++;
        }

        // Log performance data
        this.logger.info('Request completed', {
            duration,
            success,
            totalRequests: this.requestCount,
            errorCount: this.errorCount,
        });
    }

    /**
     * Calculate and publish performance metrics
     */
    public async publishMetrics(): Promise<void> {
        if (this.requestTimes.length === 0) {
            return;
        }

        const sortedTimes = [...this.requestTimes].sort((a, b) => a - b);
        const averageResponseTime = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
        const p95Index = Math.floor(sortedTimes.length * 0.95);
        const p99Index = Math.floor(sortedTimes.length * 0.99);

        const performanceMetrics: PerformanceMetrics = {
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            averageResponseTime,
            p95ResponseTime: sortedTimes[p95Index] || 0,
            p99ResponseTime: sortedTimes[p99Index] || 0,
            memoryUsage: process.memoryUsage().heapUsed,
        };

        await this.metricsPublisher.publishPerformanceMetrics(performanceMetrics);
        await this.metricsPublisher.publishErrorRate(this.errorCount, this.requestCount);

        // Reset counters
        this.requestTimes = [];
        this.errorCount = 0;
        this.requestCount = 0;
    }

    /**
     * Get current performance statistics
     */
    public getStats(): PerformanceMetrics {
        const sortedTimes = [...this.requestTimes].sort((a, b) => a - b);
        const averageResponseTime = sortedTimes.length > 0
            ? sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length
            : 0;
        const p95Index = Math.floor(sortedTimes.length * 0.95);
        const p99Index = Math.floor(sortedTimes.length * 0.99);

        return {
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            averageResponseTime,
            p95ResponseTime: sortedTimes[p95Index] || 0,
            p99ResponseTime: sortedTimes[p99Index] || 0,
            memoryUsage: process.memoryUsage().heapUsed,
        };
    }
}

/**
 * Health Check Utilities
 */
export class HealthChecker {
    private checks: Map<string, () => Promise<boolean>> = new Map();
    private logger: MicroserviceLogger;

    constructor(serviceName: string) {
        this.logger = new MicroserviceLogger(serviceName);
    }

    /**
     * Register a health check
     */
    public registerCheck(name: string, checkFunction: () => Promise<boolean>): void {
        this.checks.set(name, checkFunction);
    }

    /**
     * Run all health checks
     */
    public async runHealthChecks(): Promise<{ healthy: boolean; checks: Record<string, boolean> }> {
        const results: Record<string, boolean> = {};
        let overallHealthy = true;

        for (const [name, checkFunction] of this.checks) {
            try {
                const result = await checkFunction();
                results[name] = result;
                if (!result) {
                    overallHealthy = false;
                }
            } catch (error) {
                this.logger.error(`Health check failed: ${name}`, error);
                results[name] = false;
                overallHealthy = false;
            }
        }

        return {
            healthy: overallHealthy,
            checks: results,
        };
    }

    /**
     * Create standard health check response
     */
    public createHealthResponse(serviceName: string, version: string): any {
        return {
            service: serviceName,
            version,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };
    }
}

// Export singleton instances
export const createLogger = (serviceName: string, version?: string) => new MicroserviceLogger(serviceName, version);
export const createMetricsPublisher = (serviceName: string) => new MetricsPublisher(serviceName);
export const createPerformanceMonitor = (serviceName: string) => new PerformanceMonitor(serviceName);
export const createHealthChecker = (serviceName: string) => new HealthChecker(serviceName);