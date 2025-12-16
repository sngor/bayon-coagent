/**
 * Webhook Handler Service
 * 
 * Validates and routes incoming webhooks from various external services
 * including payment processors, third-party APIs, and integration platforms.
 * 
 * **Validates: Requirements 6.4**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ApiResponse, ServiceConfig } from './base-lambda-template';
import { EventSource } from '../utils/eventbridge-client';
import { z } from 'zod';
import * as crypto from 'crypto';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'webhook-handler-service',
    version: '1.0.0',
    description: 'Webhook validation and routing service',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
};

// Zod schemas for request/response validation
const WebhookPayloadSchema = z.object({
    id: z.string().min(1, 'Webhook ID is required'),
    source: z.string().min(1, 'Webhook source is required'),
    eventType: z.string().min(1, 'Event type is required'),
    timestamp: z.string().min(1, 'Timestamp is required'),
    data: z.record(z.any()),
    signature: z.string().optional(),
    headers: z.record(z.string()).optional(),
});

const RegisterHandlerSchema = z.object({
    eventType: z.string().min(1, 'Event type is required'),
    handlerUrl: z.string().url('Valid handler URL is required'),
    handlerName: z.string().min(1, 'Handler name is required'),
    priority: z.number().int().min(1).max(10).default(5),
    retryConfig: z.object({
        maxRetries: z.number().int().min(0).max(5).default(3),
        backoffMultiplier: z.number().min(1).max(5).default(2),
        initialDelayMs: z.number().int().min(100).max(5000).default(1000),
    }).optional(),
});

const UnregisterHandlerSchema = z.object({
    eventType: z.string().min(1, 'Event type is required'),
    handlerName: z.string().min(1, 'Handler name is required'),
});

// Response types
interface WebhookValidationResult {
    isValid: boolean;
    source: string;
    eventType: string;
    validationErrors?: string[];
    signatureValid?: boolean;
    timestampValid?: boolean;
    payloadValid?: boolean;
}

interface WebhookRoutingResult {
    webhookId: string;
    routedTo: string[];
    routingDecisions: Array<{
        handler: string;
        matched: boolean;
        reason: string;
        responseTime?: number;
    }>;
    processedAt: string;
    totalHandlers: number;
    successfulRoutes: number;
}

interface WebhookHandler {
    name: string;
    url: string;
    priority: number;
    retryConfig?: {
        maxRetries: number;
        backoffMultiplier: number;
        initialDelayMs: number;
    };
    registeredAt: string;
    lastUsed?: string;
    successCount: number;
    errorCount: number;
}

interface WebhookStats {
    totalWebhooks: number;
    successfulWebhooks: number;
    failedWebhooks: number;
    averageProcessingTime: number;
    handlerStats: Record<string, {
        totalCalls: number;
        successfulCalls: number;
        averageResponseTime: number;
    }>;
}

/**
 * Webhook Handler Service Handler
 */
class WebhookHandlerServiceHandler extends BaseLambdaHandler {
    private handlers: Map<string, WebhookHandler[]> = new Map();
    private webhookSecrets: Map<string, string> = new Map();
    private processingStats: {
        totalProcessed: number;
        totalSuccessful: number;
        totalFailed: number;
        totalProcessingTime: number;
    } = {
            totalProcessed: 0,
            totalSuccessful: 0,
            totalFailed: 0,
            totalProcessingTime: 0,
        };

    constructor() {
        super(SERVICE_CONFIG);
        this.initializeDefaultSecrets();
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path } = event;

        try {
            // Route requests based on path and method
            if (httpMethod === 'POST' && path.includes('/webhook/receive')) {
                return await this.receiveWebhook(event);
            }

            if (httpMethod === 'POST' && path.includes('/handlers/register')) {
                return await this.registerHandler(event);
            }

            if (httpMethod === 'DELETE' && path.includes('/handlers/unregister')) {
                return await this.unregisterHandler(event);
            }

            if (httpMethod === 'GET' && path.includes('/handlers/list')) {
                return await this.listHandlers(event);
            }

            if (httpMethod === 'GET' && path.includes('/stats')) {
                return await this.getWebhookStats(event);
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
     * Receive and process incoming webhook
     */
    private async receiveWebhook(event: APIGatewayProxyEvent): Promise<ApiResponse<WebhookRoutingResult>> {
        const startTime = Date.now();

        try {
            // Parse webhook payload
            const webhookPayload = this.parseWebhookPayload(event);

            // Validate webhook
            const validationResult = await this.validateWebhook(webhookPayload, event.headers);

            if (!validationResult.isValid) {
                this.processingStats.totalProcessed++;
                this.processingStats.totalFailed++;

                return this.createErrorResponseData(
                    'WEBHOOK_VALIDATION_FAILED',
                    'Webhook validation failed',
                    400,
                    { validationErrors: validationResult.validationErrors }
                );
            }

            // Route webhook to handlers
            const routingResult = await this.routeWebhook(webhookPayload);

            // Update statistics
            this.processingStats.totalProcessed++;
            if (routingResult.successfulRoutes > 0) {
                this.processingStats.totalSuccessful++;
            } else {
                this.processingStats.totalFailed++;
            }
            this.processingStats.totalProcessingTime += (Date.now() - startTime);

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Webhook Processed',
                {
                    webhookId: webhookPayload.id,
                    source: webhookPayload.source,
                    eventType: webhookPayload.eventType,
                    successfulRoutes: routingResult.successfulRoutes,
                    totalHandlers: routingResult.totalHandlers,
                    processingTime: Date.now() - startTime,
                }
            );

            return this.createSuccessResponse(routingResult);

        } catch (error) {
            this.processingStats.totalProcessed++;
            this.processingStats.totalFailed++;

            return this.createErrorResponseData(
                'WEBHOOK_PROCESSING_FAILED',
                error instanceof Error ? error.message : 'Failed to process webhook',
                500
            );
        }
    }

    /**
     * Register a webhook handler
     */
    private async registerHandler(event: APIGatewayProxyEvent): Promise<ApiResponse<{ success: boolean; handlerName: string }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                RegisterHandlerSchema.parse(data)
            );

            const { eventType, handlerUrl, handlerName, priority, retryConfig } = requestBody;

            // Create handler
            const handler: WebhookHandler = {
                name: handlerName,
                url: handlerUrl,
                priority: priority || 5,
                retryConfig,
                registeredAt: new Date().toISOString(),
                successCount: 0,
                errorCount: 0,
            };

            // Store handler
            const eventHandlers = this.handlers.get(eventType) || [];

            // Remove existing handler with same name
            const filteredHandlers = eventHandlers.filter(h => h.name !== handlerName);
            filteredHandlers.push(handler);

            // Sort by priority (higher priority first)
            filteredHandlers.sort((a, b) => b.priority - a.priority);

            this.handlers.set(eventType, filteredHandlers);

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Handler Registered',
                {
                    eventType,
                    handlerName,
                    handlerUrl,
                    priority,
                }
            );

            return this.createSuccessResponse({
                success: true,
                handlerName,
            });

        } catch (error) {
            return this.createErrorResponseData(
                'HANDLER_REGISTRATION_FAILED',
                error instanceof Error ? error.message : 'Failed to register handler',
                400
            );
        }
    }

    /**
     * Unregister a webhook handler
     */
    private async unregisterHandler(event: APIGatewayProxyEvent): Promise<ApiResponse<{ success: boolean }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                UnregisterHandlerSchema.parse(data)
            );

            const { eventType, handlerName } = requestBody;

            // Remove handler
            const eventHandlers = this.handlers.get(eventType) || [];
            const filteredHandlers = eventHandlers.filter(h => h.name !== handlerName);

            if (filteredHandlers.length === eventHandlers.length) {
                throw new Error('Handler not found');
            }

            this.handlers.set(eventType, filteredHandlers);

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Handler Unregistered',
                {
                    eventType,
                    handlerName,
                }
            );

            return this.createSuccessResponse({ success: true });

        } catch (error) {
            return this.createErrorResponseData(
                'HANDLER_UNREGISTRATION_FAILED',
                error instanceof Error ? error.message : 'Failed to unregister handler',
                400
            );
        }
    }

    /**
     * List registered handlers
     */
    private async listHandlers(event: APIGatewayProxyEvent): Promise<ApiResponse<Record<string, WebhookHandler[]>>> {
        try {
            const eventType = event.queryStringParameters?.eventType;

            if (eventType) {
                const handlers = this.handlers.get(eventType) || [];
                return this.createSuccessResponse({ [eventType]: handlers });
            }

            // Return all handlers
            const allHandlers: Record<string, WebhookHandler[]> = {};
            for (const [type, handlers] of this.handlers.entries()) {
                allHandlers[type] = handlers;
            }

            return this.createSuccessResponse(allHandlers);

        } catch (error) {
            return this.createErrorResponseData(
                'HANDLER_LIST_FAILED',
                error instanceof Error ? error.message : 'Failed to list handlers',
                500
            );
        }
    }

    /**
     * Get webhook processing statistics
     */
    private async getWebhookStats(event: APIGatewayProxyEvent): Promise<ApiResponse<WebhookStats>> {
        try {
            const handlerStats: Record<string, any> = {};

            for (const [eventType, handlers] of this.handlers.entries()) {
                for (const handler of handlers) {
                    handlerStats[handler.name] = {
                        totalCalls: handler.successCount + handler.errorCount,
                        successfulCalls: handler.successCount,
                        averageResponseTime: 150, // Simulated
                    };
                }
            }

            const stats: WebhookStats = {
                totalWebhooks: this.processingStats.totalProcessed,
                successfulWebhooks: this.processingStats.totalSuccessful,
                failedWebhooks: this.processingStats.totalFailed,
                averageProcessingTime: this.processingStats.totalProcessed > 0
                    ? this.processingStats.totalProcessingTime / this.processingStats.totalProcessed
                    : 0,
                handlerStats,
            };

            return this.createSuccessResponse(stats);

        } catch (error) {
            return this.createErrorResponseData(
                'STATS_RETRIEVAL_FAILED',
                error instanceof Error ? error.message : 'Failed to retrieve stats',
                500
            );
        }
    }

    // Helper methods
    private parseWebhookPayload(event: APIGatewayProxyEvent): any {
        if (!event.body) {
            throw new Error('Webhook payload is required');
        }

        try {
            const payload = JSON.parse(event.body);

            // Add headers to payload for validation
            payload.headers = event.headers;

            return WebhookPayloadSchema.parse(payload);
        } catch (error) {
            throw new Error('Invalid webhook payload format');
        }
    }

    private async validateWebhook(payload: any, headers: Record<string, string | undefined>): Promise<WebhookValidationResult> {
        const validationErrors: string[] = [];

        // Validate required fields
        if (!payload.id) validationErrors.push('Missing webhook ID');
        if (!payload.source) validationErrors.push('Missing webhook source');
        if (!payload.eventType) validationErrors.push('Missing event type');
        if (!payload.timestamp) validationErrors.push('Missing timestamp');

        // Validate timestamp (not too old - 5 minutes)
        const timestampValid = payload.timestamp ?
            (Date.now() - new Date(payload.timestamp).getTime()) < 300000 : false;

        if (!timestampValid) {
            validationErrors.push('Timestamp is too old or invalid');
        }

        // Validate signature if present
        let signatureValid = true;
        if (payload.signature) {
            const headersRecord: Record<string, string> = {};
            Object.entries(headers).forEach(([key, value]) => {
                if (value !== undefined) {
                    headersRecord[key] = value;
                }
            });
            signatureValid = await this.validateSignature(payload, headersRecord);
            if (!signatureValid) {
                validationErrors.push('Invalid signature');
            }
        }

        // Validate payload structure
        const payloadValid = payload.data && typeof payload.data === 'object';
        if (!payloadValid) {
            validationErrors.push('Invalid payload structure');
        }

        return {
            isValid: validationErrors.length === 0,
            source: payload.source,
            eventType: payload.eventType,
            validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
            signatureValid,
            timestampValid,
            payloadValid,
        };
    }

    private async validateSignature(payload: any, headers: Record<string, string>): Promise<boolean> {
        try {
            const secret = this.webhookSecrets.get(payload.source);
            if (!secret) {
                return false; // No secret configured for this source
            }

            // Create expected signature
            const payloadString = JSON.stringify(payload.data);
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(payloadString)
                .digest('hex');

            // Compare signatures
            const receivedSignature = payload.signature.replace('sha256=', '');
            return crypto.timingSafeEqual(
                Buffer.from(expectedSignature, 'hex'),
                Buffer.from(receivedSignature, 'hex')
            );

        } catch (error) {
            this.logger.warn('Signature validation error:', error);
            return false;
        }
    }

    private async routeWebhook(payload: any): Promise<WebhookRoutingResult> {
        const eventHandlers = this.handlers.get(payload.eventType) || [];
        const routingDecisions: WebhookRoutingResult['routingDecisions'] = [];
        const routedTo: string[] = [];
        let successfulRoutes = 0;

        for (const handler of eventHandlers) {
            const startTime = Date.now();

            try {
                // Call handler with retry logic
                await this.executeWithRetry(
                    async () => this.callWebhookHandler(handler, payload),
                    handler.retryConfig?.maxRetries || 3
                );

                const responseTime = Date.now() - startTime;

                routingDecisions.push({
                    handler: handler.name,
                    matched: true,
                    reason: 'Successfully processed',
                    responseTime,
                });

                routedTo.push(handler.name);
                successfulRoutes++;
                handler.successCount++;
                handler.lastUsed = new Date().toISOString();

            } catch (error) {
                const responseTime = Date.now() - startTime;

                routingDecisions.push({
                    handler: handler.name,
                    matched: false,
                    reason: error instanceof Error ? error.message : 'Unknown error',
                    responseTime,
                });

                handler.errorCount++;
            }
        }

        return {
            webhookId: payload.id,
            routedTo,
            routingDecisions,
            processedAt: new Date().toISOString(),
            totalHandlers: eventHandlers.length,
            successfulRoutes,
        };
    }

    private async callWebhookHandler(handler: WebhookHandler, payload: any): Promise<void> {
        // In real implementation, make HTTP request to handler URL
        // For now, simulate handler call

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

        // Simulate occasional failures (5% failure rate)
        if (Math.random() < 0.05) {
            throw new Error(`Handler ${handler.name} failed to process webhook`);
        }
    }

    private initializeDefaultSecrets(): void {
        // In real implementation, load from secure storage (AWS Secrets Manager)
        this.webhookSecrets.set('stripe', 'stripe_webhook_secret');
        this.webhookSecrets.set('github', 'github_webhook_secret');
        this.webhookSecrets.set('slack', 'slack_webhook_secret');
        this.webhookSecrets.set('mailchimp', 'mailchimp_webhook_secret');
        this.webhookSecrets.set('zapier', 'zapier_webhook_secret');
    }
}

// Export the Lambda handler
export const handler = new WebhookHandlerServiceHandler().lambdaHandler.bind(
    new WebhookHandlerServiceHandler()
);