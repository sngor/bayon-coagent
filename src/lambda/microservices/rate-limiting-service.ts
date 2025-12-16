/**
 * Rate Limiting Service
 * 
 * Implements throttling and queuing mechanisms to protect services from
 * excessive requests and ensure fair resource allocation across users.
 * 
 * **Validates: Requirements 6.5**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ApiResponse, ServiceConfig } from './base-lambda-template';
import { EventSource } from '../utils/eventbridge-client';
import { z } from 'zod';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'rate-limiting-service',
    version: '1.0.0',
    description: 'Rate limiting and throttling service',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: false, // Don't retry rate limiting operations
};

// Zod schemas for request/response validation
const RateLimitConfigSchema = z.object({
    identifier: z.string().min(1, 'Identifier is required'),
    identifierType: z.enum(['user', 'ip', 'api_key', 'service']),
    limits: z.object({
        requestsPerSecond: z.number().int().min(1).max(1000).optional(),
        requestsPerMinute: z.number().int().min(1).max(60000).optional(),
        requestsPerHour: z.number().int().min(1).max(3600000).optional(),
        requestsPerDay: z.number().int().min(1).max(86400000).optional(),
        concurrentRequests: z.number().int().min(1).max(1000).optional(),
    }),
    burstAllowance: z.number().int().min(0).max(100).default(10),
    queueConfig: z.object({
        enabled: z.boolean().default(false),
        maxQueueSize: z.number().int().min(1).max(10000).default(100),
        maxWaitTimeMs: z.number().int().min(100).max(60000).default(5000),
    }).optional(),
    priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
});

const CheckRateLimitSchema = z.object({
    identifier: z.string().min(1, 'Identifier is required'),
    identifierType: z.enum(['user', 'ip', 'api_key', 'service']),
    requestWeight: z.number().int().min(1).max(100).default(1),
    operation: z.string().min(1, 'Operation is required'),
});

const QueueRequestSchema = z.object({
    identifier: z.string().min(1, 'Identifier is required'),
    identifierType: z.enum(['user', 'ip', 'api_key', 'service']),
    requestId: z.string().min(1, 'Request ID is required'),
    operation: z.string().min(1, 'Operation is required'),
    priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
    maxWaitTimeMs: z.number().int().min(100).max(60000).default(5000),
});

// Response types
interface RateLimitStatus {
    allowed: boolean;
    identifier: string;
    identifierType: string;
    currentUsage: {
        requestsPerSecond: number;
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
        concurrentRequests: number;
    };
    limits: {
        requestsPerSecond?: number;
        requestsPerMinute?: number;
        requestsPerHour?: number;
        requestsPerDay?: number;
        concurrentRequests?: number;
    };
    resetTimes: {
        nextSecondReset: string;
        nextMinuteReset: string;
        nextHourReset: string;
        nextDayReset: string;
    };
    retryAfterMs?: number;
    queuePosition?: number;
}

interface QueueStatus {
    requestId: string;
    position: number;
    estimatedWaitTimeMs: number;
    queueSize: number;
    status: 'queued' | 'processing' | 'completed' | 'expired' | 'failed';
    queuedAt: string;
    processedAt?: string;
}

interface RateLimitConfig {
    identifier: string;
    identifierType: string;
    limits: Record<string, number>;
    burstAllowance: number;
    queueConfig?: {
        enabled: boolean;
        maxQueueSize: number;
        maxWaitTimeMs: number;
    };
    priority: string;
    createdAt: string;
    updatedAt: string;
}

interface RateLimitMetrics {
    totalRequests: number;
    allowedRequests: number;
    blockedRequests: number;
    queuedRequests: number;
    averageResponseTime: number;
    topIdentifiers: Array<{
        identifier: string;
        identifierType: string;
        requestCount: number;
        blockedCount: number;
    }>;
    timeWindowStats: {
        lastHour: {
            requests: number;
            blocked: number;
            queued: number;
        };
        lastDay: {
            requests: number;
            blocked: number;
            queued: number;
        };
    };
}

/**
 * Rate Limiting Service Handler
 */
class RateLimitingServiceHandler extends BaseLambdaHandler {
    private rateLimitConfigs: Map<string, RateLimitConfig> = new Map();
    private usageCounters: Map<string, {
        requestsPerSecond: Map<number, number>;
        requestsPerMinute: Map<number, number>;
        requestsPerHour: Map<number, number>;
        requestsPerDay: Map<number, number>;
        concurrentRequests: number;
        lastRequestTime: number;
    }> = new Map();
    private requestQueue: Map<string, Array<{
        requestId: string;
        identifier: string;
        operation: string;
        priority: string;
        queuedAt: number;
        maxWaitTimeMs: number;
    }>> = new Map();
    private metrics = {
        totalRequests: 0,
        allowedRequests: 0,
        blockedRequests: 0,
        queuedRequests: 0,
        totalResponseTime: 0,
    };

    constructor() {
        super(SERVICE_CONFIG);
        this.initializeDefaultConfigs();
        this.startQueueProcessor();
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path } = event;

        try {
            // Route requests based on path and method
            if (httpMethod === 'POST' && path.includes('/config/set')) {
                return await this.setRateLimitConfig(event);
            }

            if (httpMethod === 'GET' && path.includes('/config/get')) {
                return await this.getRateLimitConfig(event);
            }

            if (httpMethod === 'POST' && path.includes('/check')) {
                return await this.checkRateLimit(event);
            }

            if (httpMethod === 'POST' && path.includes('/queue/add')) {
                return await this.addToQueue(event);
            }

            if (httpMethod === 'GET' && path.includes('/queue/status')) {
                return await this.getQueueStatus(event);
            }

            if (httpMethod === 'GET' && path.includes('/metrics')) {
                return await this.getMetrics(event);
            }

            if (httpMethod === 'POST' && path.includes('/reset')) {
                return await this.resetLimits(event);
            }

            if (httpMethod === 'GET' && path.includes('/health')) {
                return this.createHealthCheckResponse();
            }

            return this.createErrorResponseData(
                'INVALID_ENDPOINT',
                `Endpoint ${httpMethod} ${path} not found`,
                404
            );

        } catch (error) {
            this.logger.error('Error handling request:', error);
            return this.createErrorResponseData(
                'INTERNAL_ERROR',
                'Internal server error occurred',
                500,
                { error: error instanceof Error ? error.message : String(error) }
            );
        }
    }

    /**
     * Set rate limit configuration
     */
    private async setRateLimitConfig(event: APIGatewayProxyEvent): Promise<ApiResponse<{ success: boolean }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                RateLimitConfigSchema.parse(data)
            );

            const configKey = `${requestBody.identifierType}:${requestBody.identifier}`;

            const config: RateLimitConfig = {
                identifier: requestBody.identifier,
                identifierType: requestBody.identifierType,
                limits: requestBody.limits,
                burstAllowance: requestBody.burstAllowance,
                queueConfig: requestBody.queueConfig,
                priority: requestBody.priority,
                createdAt: this.rateLimitConfigs.has(configKey)
                    ? this.rateLimitConfigs.get(configKey)!.createdAt
                    : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            this.rateLimitConfigs.set(configKey, config);

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Rate Limit Config Updated',
                {
                    identifier: requestBody.identifier,
                    identifierType: requestBody.identifierType,
                    limits: requestBody.limits,
                }
            );

            return this.createSuccessResponse({ success: true });

        } catch (error) {
            return this.createErrorResponseData(
                'CONFIG_UPDATE_FAILED',
                error instanceof Error ? error.message : 'Failed to update rate limit config',
                400
            );
        }
    }

    /**
     * Get rate limit configuration
     */
    private async getRateLimitConfig(event: APIGatewayProxyEvent): Promise<ApiResponse<RateLimitConfig | null>> {
        try {
            const identifier = event.queryStringParameters?.identifier;
            const identifierType = event.queryStringParameters?.identifierType;

            if (!identifier || !identifierType) {
                throw new Error('Identifier and identifierType are required');
            }

            const configKey = `${identifierType}:${identifier}`;
            const config = this.rateLimitConfigs.get(configKey) || null;

            return this.createSuccessResponse(config);

        } catch (error) {
            return this.createErrorResponseData(
                'CONFIG_RETRIEVAL_FAILED',
                error instanceof Error ? error.message : 'Failed to retrieve rate limit config',
                400
            );
        }
    }

    /**
     * Check rate limit for a request
     */
    private async checkRateLimit(event: APIGatewayProxyEvent): Promise<ApiResponse<RateLimitStatus>> {
        const startTime = Date.now();

        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                CheckRateLimitSchema.parse(data)
            );

            const { identifier, identifierType, requestWeight, operation } = requestBody;
            const configKey = `${identifierType}:${identifier}`;

            // Get configuration (use default if not found)
            const config = this.rateLimitConfigs.get(configKey) || this.getDefaultConfig(identifierType);

            // Check current usage
            const currentUsage = this.getCurrentUsage(configKey);
            const now = Date.now();

            // Update metrics
            this.metrics.totalRequests++;
            this.metrics.totalResponseTime += (Date.now() - startTime);

            // Check each limit
            const allowed = this.checkAllLimits(config, currentUsage, requestWeight, now);

            if (allowed) {
                // Update usage counters
                this.updateUsageCounters(configKey, requestWeight, now);
                this.metrics.allowedRequests++;

                await this.publishServiceEvent(
                    EventSource.INTEGRATION,
                    'Request Allowed',
                    {
                        identifier,
                        identifierType,
                        operation,
                        requestWeight,
                    }
                );
            } else {
                this.metrics.blockedRequests++;

                await this.publishServiceEvent(
                    EventSource.INTEGRATION,
                    'Request Blocked',
                    {
                        identifier,
                        identifierType,
                        operation,
                        requestWeight,
                        reason: 'Rate limit exceeded',
                    }
                );
            }

            const status: RateLimitStatus = {
                allowed,
                identifier,
                identifierType,
                currentUsage: this.formatCurrentUsage(currentUsage),
                limits: config.limits,
                resetTimes: this.calculateResetTimes(now),
                retryAfterMs: allowed ? undefined : this.calculateRetryAfter(config, currentUsage),
            };

            return this.createSuccessResponse(status);

        } catch (error) {
            return this.createErrorResponseData(
                'RATE_LIMIT_CHECK_FAILED',
                error instanceof Error ? error.message : 'Failed to check rate limit',
                400
            );
        }
    }

    /**
     * Add request to queue
     */
    private async addToQueue(event: APIGatewayProxyEvent): Promise<ApiResponse<QueueStatus>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                QueueRequestSchema.parse(data)
            );

            const { identifier, identifierType, requestId, operation, priority, maxWaitTimeMs } = requestBody;
            const queueKey = `${identifierType}:${identifier}`;

            // Get or create queue
            const queue = this.requestQueue.get(queueKey) || [];

            // Check queue size limits
            const config = this.rateLimitConfigs.get(queueKey);
            const maxQueueSize = config?.queueConfig?.maxQueueSize || 100;

            if (queue.length >= maxQueueSize) {
                throw new Error('Queue is full');
            }

            // Add to queue
            const queueItem = {
                requestId,
                identifier,
                operation,
                priority,
                queuedAt: Date.now(),
                maxWaitTimeMs,
            };

            queue.push(queueItem);

            // Sort by priority (critical > high > normal > low)
            const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
            queue.sort((a, b) => priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]);

            this.requestQueue.set(queueKey, queue);
            this.metrics.queuedRequests++;

            const position = queue.findIndex(item => item.requestId === requestId) + 1;
            const estimatedWaitTimeMs = this.calculateEstimatedWaitTime(queue, position);

            const status: QueueStatus = {
                requestId,
                position,
                estimatedWaitTimeMs,
                queueSize: queue.length,
                status: 'queued',
                queuedAt: new Date(queueItem.queuedAt).toISOString(),
            };

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Request Queued',
                {
                    identifier,
                    identifierType,
                    requestId,
                    operation,
                    priority,
                    position,
                    queueSize: queue.length,
                }
            );

            return this.createSuccessResponse(status);

        } catch (error) {
            return this.createErrorResponseData(
                'QUEUE_ADD_FAILED',
                error instanceof Error ? error.message : 'Failed to add request to queue',
                400
            );
        }
    }

    /**
     * Get queue status for a request
     */
    private async getQueueStatus(event: APIGatewayProxyEvent): Promise<ApiResponse<QueueStatus | null>> {
        try {
            const requestId = event.queryStringParameters?.requestId;
            const identifier = event.queryStringParameters?.identifier;
            const identifierType = event.queryStringParameters?.identifierType;

            if (!requestId || !identifier || !identifierType) {
                throw new Error('RequestId, identifier, and identifierType are required');
            }

            const queueKey = `${identifierType}:${identifier}`;
            const queue = this.requestQueue.get(queueKey) || [];

            const queueItem = queue.find(item => item.requestId === requestId);
            if (!queueItem) {
                return this.createSuccessResponse(null);
            }

            const position = queue.findIndex(item => item.requestId === requestId) + 1;
            const estimatedWaitTimeMs = this.calculateEstimatedWaitTime(queue, position);

            const status: QueueStatus = {
                requestId,
                position,
                estimatedWaitTimeMs,
                queueSize: queue.length,
                status: 'queued',
                queuedAt: new Date(queueItem.queuedAt).toISOString(),
            };

            return this.createSuccessResponse(status);

        } catch (error) {
            return this.createErrorResponseData(
                'QUEUE_STATUS_FAILED',
                error instanceof Error ? error.message : 'Failed to get queue status',
                400
            );
        }
    }

    /**
     * Get rate limiting metrics
     */
    private async getMetrics(event: APIGatewayProxyEvent): Promise<ApiResponse<RateLimitMetrics>> {
        try {
            // Calculate top identifiers
            const identifierStats = new Map<string, { requests: number; blocked: number }>();

            // This would be calculated from actual usage data in a real implementation
            const topIdentifiers = Array.from(identifierStats.entries())
                .map(([key, stats]) => {
                    const [identifierType, identifier] = key.split(':');
                    return {
                        identifier,
                        identifierType,
                        requestCount: stats.requests,
                        blockedCount: stats.blocked,
                    };
                })
                .sort((a, b) => b.requestCount - a.requestCount)
                .slice(0, 10);

            const metrics: RateLimitMetrics = {
                totalRequests: this.metrics.totalRequests,
                allowedRequests: this.metrics.allowedRequests,
                blockedRequests: this.metrics.blockedRequests,
                queuedRequests: this.metrics.queuedRequests,
                averageResponseTime: this.metrics.totalRequests > 0
                    ? this.metrics.totalResponseTime / this.metrics.totalRequests
                    : 0,
                topIdentifiers,
                timeWindowStats: {
                    lastHour: {
                        requests: Math.floor(this.metrics.totalRequests * 0.1), // Simulated
                        blocked: Math.floor(this.metrics.blockedRequests * 0.1),
                        queued: Math.floor(this.metrics.queuedRequests * 0.1),
                    },
                    lastDay: {
                        requests: this.metrics.totalRequests,
                        blocked: this.metrics.blockedRequests,
                        queued: this.metrics.queuedRequests,
                    },
                },
            };

            return this.createSuccessResponse(metrics);

        } catch (error) {
            return this.createErrorResponseData(
                'METRICS_RETRIEVAL_FAILED',
                error instanceof Error ? error.message : 'Failed to retrieve metrics',
                500
            );
        }
    }

    /**
     * Reset rate limits for an identifier
     */
    private async resetLimits(event: APIGatewayProxyEvent): Promise<ApiResponse<{ success: boolean }>> {
        try {
            const identifier = event.queryStringParameters?.identifier;
            const identifierType = event.queryStringParameters?.identifierType;

            if (!identifier || !identifierType) {
                throw new Error('Identifier and identifierType are required');
            }

            const configKey = `${identifierType}:${identifier}`;

            // Reset usage counters
            this.usageCounters.delete(configKey);

            // Clear from queue
            this.requestQueue.delete(configKey);

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Limits Reset',
                {
                    identifier,
                    identifierType,
                }
            );

            return this.createSuccessResponse({ success: true });

        } catch (error) {
            return this.createErrorResponseData(
                'RESET_FAILED',
                error instanceof Error ? error.message : 'Failed to reset limits',
                400
            );
        }
    }

    // Helper methods
    private getCurrentUsage(configKey: string) {
        return this.usageCounters.get(configKey) || {
            requestsPerSecond: new Map(),
            requestsPerMinute: new Map(),
            requestsPerHour: new Map(),
            requestsPerDay: new Map(),
            concurrentRequests: 0,
            lastRequestTime: 0,
        };
    }

    private checkAllLimits(config: RateLimitConfig, currentUsage: any, requestWeight: number, now: number): boolean {
        const currentSecond = Math.floor(now / 1000);
        const currentMinute = Math.floor(now / 60000);
        const currentHour = Math.floor(now / 3600000);
        const currentDay = Math.floor(now / 86400000);

        // Check per-second limit
        if (config.limits.requestsPerSecond) {
            const currentSecondUsage = currentUsage.requestsPerSecond.get(currentSecond) || 0;
            if (currentSecondUsage + requestWeight > config.limits.requestsPerSecond) {
                return false;
            }
        }

        // Check per-minute limit
        if (config.limits.requestsPerMinute) {
            const currentMinuteUsage = currentUsage.requestsPerMinute.get(currentMinute) || 0;
            if (currentMinuteUsage + requestWeight > config.limits.requestsPerMinute) {
                return false;
            }
        }

        // Check per-hour limit
        if (config.limits.requestsPerHour) {
            const currentHourUsage = currentUsage.requestsPerHour.get(currentHour) || 0;
            if (currentHourUsage + requestWeight > config.limits.requestsPerHour) {
                return false;
            }
        }

        // Check per-day limit
        if (config.limits.requestsPerDay) {
            const currentDayUsage = currentUsage.requestsPerDay.get(currentDay) || 0;
            if (currentDayUsage + requestWeight > config.limits.requestsPerDay) {
                return false;
            }
        }

        // Check concurrent requests limit
        if (config.limits.concurrentRequests) {
            if (currentUsage.concurrentRequests + requestWeight > config.limits.concurrentRequests) {
                return false;
            }
        }

        return true;
    }

    private updateUsageCounters(configKey: string, requestWeight: number, now: number): void {
        const usage = this.getCurrentUsage(configKey);

        const currentSecond = Math.floor(now / 1000);
        const currentMinute = Math.floor(now / 60000);
        const currentHour = Math.floor(now / 3600000);
        const currentDay = Math.floor(now / 86400000);

        // Update counters
        usage.requestsPerSecond.set(currentSecond, (usage.requestsPerSecond.get(currentSecond) || 0) + requestWeight);
        usage.requestsPerMinute.set(currentMinute, (usage.requestsPerMinute.get(currentMinute) || 0) + requestWeight);
        usage.requestsPerHour.set(currentHour, (usage.requestsPerHour.get(currentHour) || 0) + requestWeight);
        usage.requestsPerDay.set(currentDay, (usage.requestsPerDay.get(currentDay) || 0) + requestWeight);
        usage.concurrentRequests += requestWeight;
        usage.lastRequestTime = now;

        // Clean up old entries
        this.cleanupOldCounters(usage, now);

        this.usageCounters.set(configKey, usage);
    }

    private cleanupOldCounters(usage: any, now: number): void {
        const currentSecond = Math.floor(now / 1000);
        const currentMinute = Math.floor(now / 60000);
        const currentHour = Math.floor(now / 3600000);
        const currentDay = Math.floor(now / 86400000);

        // Keep only recent entries
        for (const [second] of usage.requestsPerSecond) {
            if (second < currentSecond - 60) {
                usage.requestsPerSecond.delete(second);
            }
        }

        for (const [minute] of usage.requestsPerMinute) {
            if (minute < currentMinute - 60) {
                usage.requestsPerMinute.delete(minute);
            }
        }

        for (const [hour] of usage.requestsPerHour) {
            if (hour < currentHour - 24) {
                usage.requestsPerHour.delete(hour);
            }
        }

        for (const [day] of usage.requestsPerDay) {
            if (day < currentDay - 30) {
                usage.requestsPerDay.delete(day);
            }
        }
    }

    private formatCurrentUsage(usage: any) {
        const now = Date.now();
        const currentSecond = Math.floor(now / 1000);
        const currentMinute = Math.floor(now / 60000);
        const currentHour = Math.floor(now / 3600000);
        const currentDay = Math.floor(now / 86400000);

        return {
            requestsPerSecond: usage.requestsPerSecond.get(currentSecond) || 0,
            requestsPerMinute: usage.requestsPerMinute.get(currentMinute) || 0,
            requestsPerHour: usage.requestsPerHour.get(currentHour) || 0,
            requestsPerDay: usage.requestsPerDay.get(currentDay) || 0,
            concurrentRequests: usage.concurrentRequests,
        };
    }

    private calculateResetTimes(now: number) {
        const currentSecond = Math.floor(now / 1000);
        const currentMinute = Math.floor(now / 60000);
        const currentHour = Math.floor(now / 3600000);
        const currentDay = Math.floor(now / 86400000);

        return {
            nextSecondReset: new Date((currentSecond + 1) * 1000).toISOString(),
            nextMinuteReset: new Date((currentMinute + 1) * 60000).toISOString(),
            nextHourReset: new Date((currentHour + 1) * 3600000).toISOString(),
            nextDayReset: new Date((currentDay + 1) * 86400000).toISOString(),
        };
    }

    private calculateRetryAfter(config: RateLimitConfig, usage: any): number {
        // Calculate the shortest time until any limit resets
        const now = Date.now();
        const nextSecond = Math.ceil(now / 1000) * 1000;
        const nextMinute = Math.ceil(now / 60000) * 60000;

        // Return time until next second reset (minimum retry time)
        return Math.max(nextSecond - now, 1000);
    }

    private calculateEstimatedWaitTime(queue: any[], position: number): number {
        // Estimate based on average processing time and position
        const averageProcessingTime = 1000; // 1 second per request
        return position * averageProcessingTime;
    }

    private getDefaultConfig(identifierType: string): RateLimitConfig {
        const defaultLimits = {
            user: { requestsPerMinute: 60, requestsPerHour: 1000 },
            ip: { requestsPerMinute: 100, requestsPerHour: 2000 },
            api_key: { requestsPerMinute: 1000, requestsPerHour: 10000 },
            service: { requestsPerMinute: 5000, requestsPerHour: 100000 },
        };

        return {
            identifier: 'default',
            identifierType,
            limits: defaultLimits[identifierType as keyof typeof defaultLimits] || defaultLimits.user,
            burstAllowance: 10,
            priority: 'normal',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    private initializeDefaultConfigs(): void {
        // Set up some default rate limit configurations
        const defaultConfigs = [
            {
                identifier: 'default',
                identifierType: 'user',
                limits: { requestsPerMinute: 60, requestsPerHour: 1000 },
                burstAllowance: 10,
                priority: 'normal',
            },
            {
                identifier: 'default',
                identifierType: 'api_key',
                limits: { requestsPerMinute: 1000, requestsPerHour: 10000 },
                burstAllowance: 50,
                priority: 'high',
            },
        ];

        defaultConfigs.forEach(config => {
            const configKey = `${config.identifierType}:${config.identifier}`;
            this.rateLimitConfigs.set(configKey, {
                ...config,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        });
    }

    private startQueueProcessor(): void {
        // Process queues every second
        setInterval(() => {
            this.processQueues();
        }, 1000);
    }

    private processQueues(): void {
        for (const [queueKey, queue] of this.requestQueue.entries()) {
            if (queue.length === 0) continue;

            // Remove expired requests
            const now = Date.now();
            const validQueue = queue.filter(item =>
                (now - item.queuedAt) < item.maxWaitTimeMs
            );

            if (validQueue.length !== queue.length) {
                this.requestQueue.set(queueKey, validQueue);
            }

            // Process next request if rate limit allows
            if (validQueue.length > 0) {
                const nextRequest = validQueue[0];
                const [identifierType, identifier] = queueKey.split(':');

                // Check if we can process this request
                const config = this.rateLimitConfigs.get(queueKey) || this.getDefaultConfig(identifierType);
                const currentUsage = this.getCurrentUsage(queueKey);

                if (this.checkAllLimits(config, currentUsage, 1, now)) {
                    // Process the request
                    validQueue.shift();
                    this.requestQueue.set(queueKey, validQueue);

                    // Update usage counters
                    this.updateUsageCounters(queueKey, 1, now);

                    // In real implementation, trigger the actual request processing
                    this.logger.info('Processing queued request', {
                        requestId: nextRequest.requestId,
                        identifier,
                        identifierType,
                        operation: nextRequest.operation,
                    });
                }
            }
        }
    }
}

// Export the Lambda handler
export const handler = new RateLimitingServiceHandler().lambdaHandler.bind(
    new RateLimitingServiceHandler()
);