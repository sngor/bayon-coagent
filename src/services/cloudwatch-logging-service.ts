/**
 * CloudWatch Structured Logging Service
 * 
 * Provides comprehensive structured logging for content workflow features including:
 * - Structured JSON logging with correlation IDs and performance metrics
 * - API call and response logging with context preservation
 * - Error logging with full context, stack traces, and user impact assessment
 * - Intelligent log groups with appropriate retention policies
 * - Log aggregation and search capabilities for troubleshooting
 * 
 * Validates: All requirements with focus on observability and debugging
 */

import { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Logging Types and Interfaces
// ============================================================================

export interface LogContext {
    correlationId?: string;
    userId?: string;
    sessionId?: string;
    operation: string;
    service: string;
    timestamp: Date;
    environment: string;
    version?: string;
    requestId?: string;
    userAgent?: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
    duration: number; // milliseconds
    memoryUsed?: number; // bytes
    cpuUsage?: number; // percentage
    networkLatency?: number; // milliseconds
    databaseQueries?: number;
    externalApiCalls?: number;
    cacheHits?: number;
    cacheMisses?: number;
}

export interface APICallLog {
    method: string;
    url: string;
    statusCode: number;
    requestHeaders?: Record<string, string>;
    responseHeaders?: Record<string, string>;
    requestBody?: any;
    responseBody?: any;
    duration: number;
    retryAttempt?: number;
    error?: string;
}

export interface ErrorLog {
    errorId: string;
    message: string;
    stack?: string;
    code?: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userImpact: {
        affected: boolean;
        description?: string;
        recoverable: boolean;
    };
    context: Record<string, any>;
    resolution?: {
        status: 'investigating' | 'identified' | 'resolved';
        steps?: string[];
        resolvedAt?: Date;
    };
}

export interface BusinessEventLog {
    eventType: string;
    eventData: Record<string, any>;
    businessMetrics?: {
        revenue?: number;
        conversions?: number;
        userEngagement?: number;
        systemPerformance?: number;
    };
    tags?: string[];
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface StructuredLogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context: LogContext;
    performanceMetrics?: PerformanceMetrics;
    apiCall?: APICallLog;
    error?: ErrorLog;
    businessEvent?: BusinessEventLog;
    tags?: string[];
}

// ============================================================================
// CloudWatch Logging Service Class
// ============================================================================

export class CloudWatchLoggingService {
    private cloudWatchLogsClient: CloudWatchLogsClient;
    private logBuffer: StructuredLogEntry[] = [];
    private correlationIdMap = new Map<string, string>();

    // Configuration
    private readonly LOG_GROUP_PREFIX = '/aws/bayon-coagent';
    private readonly BUFFER_SIZE = 100;
    private readonly FLUSH_INTERVAL = 5000; // 5 seconds
    private readonly MAX_LOG_SIZE = 256 * 1024; // 256KB CloudWatch limit
    private readonly RETENTION_DAYS = process.env.NODE_ENV === 'production' ? 30 : 7;

    constructor() {
        this.cloudWatchLogsClient = new CloudWatchLogsClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });

        // Start periodic log flushing
        if (process.env.NODE_ENV === 'production') {
            setInterval(() => this.flushLogs(), this.FLUSH_INTERVAL);
        }
    }

    /**
     * Create a correlation ID for tracking related operations
     */
    createCorrelationId(): string {
        return uuidv4();
    }

    /**
     * Set correlation ID for the current context
     */
    setCorrelationId(correlationId: string, context?: string): void {
        this.correlationIdMap.set(context || 'default', correlationId);
    }

    /**
     * Get correlation ID for the current context
     */
    getCorrelationId(context?: string): string | undefined {
        return this.correlationIdMap.get(context || 'default');
    }

    /**
     * Log debug information
     */
    debug(message: string, context: Partial<LogContext>, metadata?: Record<string, any>): void {
        this.log('DEBUG', message, context, { metadata });
    }

    /**
     * Log informational messages
     */
    info(message: string, context: Partial<LogContext>, metadata?: Record<string, any>): void {
        this.log('INFO', message, context, { metadata });
    }

    /**
     * Log warning messages
     */
    warn(message: string, context: Partial<LogContext>, metadata?: Record<string, any>): void {
        this.log('WARN', message, context, { metadata });
    }

    /**
     * Log error messages
     */
    error(message: string, context: Partial<LogContext>, error?: Error | ErrorLog, metadata?: Record<string, any>): void {
        const errorLog = this.processError(error);
        this.log('ERROR', message, context, { error: errorLog, metadata });
    }

    /**
     * Log fatal errors
     */
    fatal(message: string, context: Partial<LogContext>, error?: Error | ErrorLog, metadata?: Record<string, any>): void {
        const errorLog = this.processError(error);
        this.log('FATAL', message, context, { error: errorLog, metadata });
    }

    /**
     * Log API calls with request/response details
     */
    logAPICall(
        message: string,
        context: Partial<LogContext>,
        apiCall: APICallLog,
        performanceMetrics?: PerformanceMetrics
    ): void {
        this.log('INFO', message, context, { apiCall, performanceMetrics });
    }

    /**
     * Log business events with metrics
     */
    logBusinessEvent(
        message: string,
        context: Partial<LogContext>,
        businessEvent: BusinessEventLog,
        performanceMetrics?: PerformanceMetrics
    ): void {
        this.log('INFO', message, context, { businessEvent, performanceMetrics });
    }

    /**
     * Log performance metrics
     */
    logPerformance(
        message: string,
        context: Partial<LogContext>,
        performanceMetrics: PerformanceMetrics,
        metadata?: Record<string, any>
    ): void {
        this.log('INFO', message, context, { performanceMetrics, metadata });
    }

    /**
     * Start performance tracking for an operation
     */
    startPerformanceTracking(operationId: string): () => PerformanceMetrics {
        const startTime = Date.now();
        const startMemory = process.memoryUsage();

        return (): PerformanceMetrics => {
            const endTime = Date.now();
            const endMemory = process.memoryUsage();

            return {
                duration: endTime - startTime,
                memoryUsed: endMemory.heapUsed - startMemory.heapUsed,
                cpuUsage: process.cpuUsage ? this.calculateCPUUsage() : undefined
            };
        };
    }

    /**
     * Create a child logger with inherited context
     */
    createChildLogger(additionalContext: Partial<LogContext>): CloudWatchChildLogger {
        return new CloudWatchChildLogger(this, additionalContext);
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    private log(
        level: LogLevel,
        message: string,
        context: Partial<LogContext>,
        additional?: {
            performanceMetrics?: PerformanceMetrics;
            apiCall?: APICallLog;
            error?: ErrorLog;
            businessEvent?: BusinessEventLog;
            metadata?: Record<string, any>;
        }
    ): void {
        const fullContext: LogContext = {
            correlationId: this.getCorrelationId(),
            operation: 'unknown',
            service: 'content-workflow',
            timestamp: new Date(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.APP_VERSION || '1.0.0',
            ...context
        };

        const logEntry: StructuredLogEntry = {
            timestamp: fullContext.timestamp.toISOString(),
            level,
            message,
            context: fullContext,
            ...additional,
            tags: this.generateTags(level, fullContext, additional)
        };

        // Add to buffer
        this.logBuffer.push(logEntry);

        // Console log in development or for errors
        if (process.env.NODE_ENV !== 'production' || level === 'ERROR' || level === 'FATAL') {
            this.consoleLog(logEntry);
        }

        // Flush if buffer is full or it's a critical error
        if (this.logBuffer.length >= this.BUFFER_SIZE || level === 'FATAL') {
            this.flushLogs();
        }
    }

    private processError(error?: Error | ErrorLog): ErrorLog | undefined {
        if (!error) return undefined;

        if ('errorId' in error) {
            return error as ErrorLog;
        }

        const err = error as Error;
        return {
            errorId: uuidv4(),
            message: err.message,
            stack: err.stack,
            code: (err as any).code,
            category: this.categorizeError(err),
            severity: this.determineSeverity(err),
            userImpact: {
                affected: this.determineUserImpact(err),
                recoverable: this.isRecoverable(err)
            },
            context: {
                name: err.name,
                cause: (err as any).cause
            }
        };
    }

    private categorizeError(error: Error): string {
        const message = error.message.toLowerCase();
        const name = error.name.toLowerCase();

        if (name.includes('validation') || message.includes('validation')) return 'validation';
        if (name.includes('auth') || message.includes('auth')) return 'authentication';
        if (name.includes('network') || message.includes('network')) return 'network';
        if (name.includes('timeout') || message.includes('timeout')) return 'timeout';
        if (name.includes('rate') || message.includes('rate')) return 'rate_limit';
        if (name.includes('database') || message.includes('database')) return 'database';
        if (name.includes('permission') || message.includes('permission')) return 'authorization';

        return 'unknown';
    }

    private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
        const category = this.categorizeError(error);

        switch (category) {
            case 'validation':
                return 'low';
            case 'network':
            case 'timeout':
            case 'rate_limit':
                return 'medium';
            case 'authentication':
            case 'authorization':
                return 'high';
            case 'database':
                return 'critical';
            default:
                return 'medium';
        }
    }

    private determineUserImpact(error: Error): boolean {
        const category = this.categorizeError(error);
        return ['authentication', 'authorization', 'database', 'network'].includes(category);
    }

    private isRecoverable(error: Error): boolean {
        const category = this.categorizeError(error);
        return ['network', 'timeout', 'rate_limit'].includes(category);
    }

    private generateTags(
        level: LogLevel,
        context: LogContext,
        additional?: any
    ): string[] {
        const tags = [
            `level:${level.toLowerCase()}`,
            `service:${context.service}`,
            `operation:${context.operation}`,
            `environment:${context.environment}`
        ];

        if (context.userId) tags.push(`user:${context.userId}`);
        if (context.correlationId) tags.push(`correlation:${context.correlationId}`);
        if (additional?.error) tags.push(`error:${additional.error.category}`);
        if (additional?.apiCall) tags.push(`api:${additional.apiCall.method}`);
        if (additional?.businessEvent) tags.push(`event:${additional.businessEvent.eventType}`);

        return tags;
    }

    private calculateCPUUsage(): number {
        // Simple CPU usage calculation
        const usage = process.cpuUsage();
        return (usage.user + usage.system) / 1000000; // Convert to seconds
    }

    private consoleLog(logEntry: StructuredLogEntry): void {
        const colorMap = {
            DEBUG: '\x1b[36m', // Cyan
            INFO: '\x1b[32m',  // Green
            WARN: '\x1b[33m',  // Yellow
            ERROR: '\x1b[31m', // Red
            FATAL: '\x1b[35m'  // Magenta
        };

        const reset = '\x1b[0m';
        const color = colorMap[logEntry.level] || '';

        const logMessage = `${color}[${logEntry.timestamp}] ${logEntry.level}: ${logEntry.message}${reset}`;

        if (logEntry.level === 'ERROR' || logEntry.level === 'FATAL') {
            console.error(logMessage, {
                context: logEntry.context,
                error: logEntry.error,
                performanceMetrics: logEntry.performanceMetrics
            });
        } else if (logEntry.level === 'WARN') {
            console.warn(logMessage, {
                context: logEntry.context,
                metadata: logEntry.context.metadata
            });
        } else {
            console.log(logMessage, {
                context: logEntry.context,
                performanceMetrics: logEntry.performanceMetrics
            });
        }
    }

    private async flushLogs(): Promise<void> {
        if (this.logBuffer.length === 0) return;

        const logsToFlush = [...this.logBuffer];
        this.logBuffer = [];

        try {
            // Group logs by service for different log streams
            const logGroups = this.groupLogsByService(logsToFlush);

            for (const [service, logs] of logGroups) {
                await this.sendLogsToCloudWatch(service, logs);
            }

        } catch (error) {
            console.error('[CLOUDWATCH_LOGGING] Error flushing logs:', error);
            // Re-add logs to buffer for retry
            this.logBuffer.unshift(...logsToFlush);
        }
    }

    private groupLogsByService(logs: StructuredLogEntry[]): Map<string, StructuredLogEntry[]> {
        const groups = new Map<string, StructuredLogEntry[]>();

        for (const log of logs) {
            const service = log.context.service;
            if (!groups.has(service)) {
                groups.set(service, []);
            }
            groups.get(service)!.push(log);
        }

        return groups;
    }

    private async sendLogsToCloudWatch(service: string, logs: StructuredLogEntry[]): Promise<void> {
        if (process.env.NODE_ENV !== 'production') {
            return; // Skip CloudWatch in development
        }

        const logGroupName = `${this.LOG_GROUP_PREFIX}/${service}`;
        const logStreamName = `${service}-${new Date().toISOString().split('T')[0]}-${process.env.AWS_LAMBDA_FUNCTION_NAME || 'local'}`;

        try {
            // Ensure log group exists
            await this.ensureLogGroup(logGroupName);

            // Ensure log stream exists
            await this.ensureLogStream(logGroupName, logStreamName);

            // Prepare log events
            const logEvents = logs.map(log => ({
                timestamp: new Date(log.timestamp).getTime(),
                message: JSON.stringify(log)
            })).filter(event => {
                // Ensure message size is within CloudWatch limits
                return Buffer.byteLength(event.message, 'utf8') <= this.MAX_LOG_SIZE;
            }).sort((a, b) => a.timestamp - b.timestamp);

            if (logEvents.length === 0) return;

            // Send logs to CloudWatch
            const command = new PutLogEventsCommand({
                logGroupName,
                logStreamName,
                logEvents
            });

            await this.cloudWatchLogsClient.send(command);

        } catch (error) {
            console.error(`[CLOUDWATCH_LOGGING] Error sending logs to CloudWatch for service ${service}:`, error);
            throw error;
        }
    }

    private async ensureLogGroup(logGroupName: string): Promise<void> {
        try {
            const command = new CreateLogGroupCommand({
                logGroupName,
                tags: {
                    Environment: process.env.NODE_ENV || 'development',
                    Application: 'BayonCoAgent',
                    Service: 'ContentWorkflow'
                }
            });

            await this.cloudWatchLogsClient.send(command);

        } catch (error: any) {
            if (error.name !== 'ResourceAlreadyExistsException') {
                throw error;
            }
        }
    }

    private async ensureLogStream(logGroupName: string, logStreamName: string): Promise<void> {
        try {
            const command = new CreateLogStreamCommand({
                logGroupName,
                logStreamName
            });

            await this.cloudWatchLogsClient.send(command);

        } catch (error: any) {
            if (error.name !== 'ResourceAlreadyExistsException') {
                throw error;
            }
        }
    }

    /**
     * Flush any remaining logs (call on shutdown)
     */
    async shutdown(): Promise<void> {
        await this.flushLogs();
    }
}

// ============================================================================
// Child Logger Class
// ============================================================================

export class CloudWatchChildLogger {
    constructor(
        private parent: CloudWatchLoggingService,
        private inheritedContext: Partial<LogContext>
    ) { }

    debug(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void {
        this.parent.debug(message, { ...this.inheritedContext, ...context }, metadata);
    }

    info(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void {
        this.parent.info(message, { ...this.inheritedContext, ...context }, metadata);
    }

    warn(message: string, context?: Partial<LogContext>, metadata?: Record<string, any>): void {
        this.parent.warn(message, { ...this.inheritedContext, ...context }, metadata);
    }

    error(message: string, context?: Partial<LogContext>, error?: Error | ErrorLog, metadata?: Record<string, any>): void {
        this.parent.error(message, { ...this.inheritedContext, ...context }, error, metadata);
    }

    fatal(message: string, context?: Partial<LogContext>, error?: Error | ErrorLog, metadata?: Record<string, any>): void {
        this.parent.fatal(message, { ...this.inheritedContext, ...context }, error, metadata);
    }

    logAPICall(message: string, context: Partial<LogContext>, apiCall: APICallLog, performanceMetrics?: PerformanceMetrics): void {
        this.parent.logAPICall(message, { ...this.inheritedContext, ...context }, apiCall, performanceMetrics);
    }

    logBusinessEvent(message: string, context: Partial<LogContext>, businessEvent: BusinessEventLog, performanceMetrics?: PerformanceMetrics): void {
        this.parent.logBusinessEvent(message, { ...this.inheritedContext, ...context }, businessEvent, performanceMetrics);
    }

    logPerformance(message: string, context: Partial<LogContext>, performanceMetrics: PerformanceMetrics, metadata?: Record<string, any>): void {
        this.parent.logPerformance(message, { ...this.inheritedContext, ...context }, performanceMetrics, metadata);
    }

    startPerformanceTracking(operationId: string): () => PerformanceMetrics {
        return this.parent.startPerformanceTracking(operationId);
    }
}

// ============================================================================
// Global Instance and Convenience Functions
// ============================================================================

export const cloudWatchLogger = new CloudWatchLoggingService();

/**
 * Create a correlation ID for tracking related operations
 */
export function createCorrelationId(): string {
    return cloudWatchLogger.createCorrelationId();
}

/**
 * Set correlation ID for the current context
 */
export function setCorrelationId(correlationId: string, context?: string): void {
    cloudWatchLogger.setCorrelationId(correlationId, context);
}

/**
 * Get correlation ID for the current context
 */
export function getCorrelationId(context?: string): string | undefined {
    return cloudWatchLogger.getCorrelationId(context);
}

/**
 * Create a child logger with inherited context
 */
export function createChildLogger(context: Partial<LogContext>): CloudWatchChildLogger {
    return cloudWatchLogger.createChildLogger(context);
}

/**
 * Log debug information
 */
export function logDebug(message: string, context: Partial<LogContext>, metadata?: Record<string, any>): void {
    cloudWatchLogger.debug(message, context, metadata);
}

/**
 * Log informational messages
 */
export function logInfo(message: string, context: Partial<LogContext>, metadata?: Record<string, any>): void {
    cloudWatchLogger.info(message, context, metadata);
}

/**
 * Log warning messages
 */
export function logWarn(message: string, context: Partial<LogContext>, metadata?: Record<string, any>): void {
    cloudWatchLogger.warn(message, context, metadata);
}

/**
 * Log error messages
 */
export function logError(message: string, context: Partial<LogContext>, error?: Error | ErrorLog, metadata?: Record<string, any>): void {
    cloudWatchLogger.error(message, context, error, metadata);
}

/**
 * Log fatal errors
 */
export function logFatal(message: string, context: Partial<LogContext>, error?: Error | ErrorLog, metadata?: Record<string, any>): void {
    cloudWatchLogger.fatal(message, context, error, metadata);
}

/**
 * Start performance tracking
 */
export function startPerformanceTracking(operationId: string): () => PerformanceMetrics {
    return cloudWatchLogger.startPerformanceTracking(operationId);
}

/**
 * Shutdown logging service (call on application shutdown)
 */
export async function shutdownLogging(): Promise<void> {
    await cloudWatchLogger.shutdown();
}