/**
 * Distributed Tracing Service
 * 
 * Provides request tracking across service boundaries using X-Ray and custom tracing
 * to enable observability and debugging in microservices architecture.
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ServiceConfig, ApiResponse } from './base-lambda-template';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import * as AWSXRay from 'aws-xray-sdk-core';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'distributed-tracing-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    description: 'Distributed tracing service for request tracking across service boundaries',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
    healthCheckEnabled: true,
};

// Initialize DynamoDB client
function createDynamoClient(): DynamoDBDocumentClient {
    let dynamoClient: DynamoDBClient;
    try {
        dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({
            region: process.env.AWS_REGION || 'us-east-1',
        }));
    } catch (error) {
        dynamoClient = new DynamoDBClient({
            region: process.env.AWS_REGION || 'us-east-1',
        });
    }
    return DynamoDBDocumentClient.from(dynamoClient);
}

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent-development';

// Trace interfaces
interface TraceSpan {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operationName: string;
    serviceName: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    status: 'started' | 'completed' | 'error';
    tags: Record<string, any>;
    logs: TraceLog[];
    baggage?: Record<string, string>;
    references?: SpanReference[];
}

interface TraceLog {
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    fields?: Record<string, any>;
}

interface SpanReference {
    type: 'child-of' | 'follows-from';
    traceId: string;
    spanId: string;
}

interface TraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    baggage?: Record<string, string>;
    samplingDecision?: boolean;
}

interface TraceSummary {
    traceId: string;
    rootSpanId: string;
    serviceName: string;
    operationName: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    status: 'in-progress' | 'completed' | 'error';
    spanCount: number;
    serviceCount: number;
    errorCount: number;
    tags: Record<string, any>;
}

// Request interfaces
interface StartSpanRequest {
    traceId?: string;
    parentSpanId?: string;
    operationName: string;
    serviceName: string;
    tags?: Record<string, any>;
    baggage?: Record<string, string>;
}

interface FinishSpanRequest {
    traceId: string;
    spanId: string;
    status?: 'completed' | 'error';
    tags?: Record<string, any>;
    logs?: TraceLog[];
}

interface LogRequest {
    traceId: string;
    spanId: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    fields?: Record<string, any>;
}

/**
 * Distributed Tracing Service Handler
 */
class DistributedTracingServiceHandler extends BaseLambdaHandler {
    private docClient: DynamoDBDocumentClient;
    private activeSpans: Map<string, TraceSpan> = new Map();
    private traceContexts: Map<string, TraceContext> = new Map();

    constructor() {
        super(SERVICE_CONFIG);
        this.docClient = createDynamoClient();
    }

    /**
     * Handle incoming API requests
     */
    public async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path, body, queryStringParameters } = event;
        const routeKey = `${httpMethod} ${path}`;

        this.logger.info('Processing distributed tracing request', {
            method: httpMethod,
            path,
            routeKey,
        });

        try {
            let response: ApiResponse;

            switch (routeKey) {
                case 'POST /spans/start':
                    response = await this.startSpan(body);
                    break;

                case 'POST /spans/finish':
                    response = await this.finishSpan(body);
                    break;

                case 'POST /spans/log':
                    response = await this.logToSpan(body);
                    break;

                case 'GET /traces/{traceId}':
                    response = await this.getTrace(event.pathParameters?.traceId);
                    break;

                case 'GET /traces/{traceId}/spans':
                    response = await this.getTraceSpans(event.pathParameters?.traceId);
                    break;

                case 'GET /traces':
                    response = await this.listTraces(queryStringParameters || {});
                    break;

                case 'GET /spans/{spanId}':
                    response = await this.getSpan(event.pathParameters?.spanId);
                    break;

                case 'POST /context/extract':
                    response = await this.extractTraceContext(body);
                    break;

                case 'POST /context/inject':
                    response = await this.injectTraceContext(body);
                    break;

                case 'GET /analytics/traces':
                    response = await this.getTraceAnalytics(queryStringParameters || {});
                    break;

                case 'GET /analytics/services':
                    response = await this.getServiceAnalytics(queryStringParameters || {});
                    break;

                case 'GET /health':
                    response = this.createHealthCheckResponse();
                    break;

                default:
                    response = this.createErrorResponseData('ROUTE_NOT_FOUND', 'Endpoint not found', 404);
            }

            return response;

        } catch (error) {
            this.logger.error('Distributed tracing request failed', error);
            return this.createErrorResponseData(
                'INTERNAL_ERROR',
                error instanceof Error ? error.message : 'Internal server error',
                500
            );
        }
    }

    /**
     * Start a new span
     */
    private async startSpan(body: string | null): Promise<ApiResponse> {
        if (!body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Request body is required', 400);
        }

        try {
            const request = JSON.parse(body) as StartSpanRequest;

            if (!request.operationName || !request.serviceName) {
                return this.createErrorResponseData(
                    'VALIDATION_ERROR',
                    'operationName and serviceName are required',
                    400
                );
            }

            // Generate IDs
            const traceId = request.traceId || this.generateTraceId();
            const spanId = this.generateSpanId();
            const startTime = new Date().toISOString();

            // Create span
            const span: TraceSpan = {
                traceId,
                spanId,
                parentSpanId: request.parentSpanId,
                operationName: request.operationName,
                serviceName: request.serviceName,
                startTime,
                status: 'started',
                tags: request.tags || {},
                logs: [],
                baggage: request.baggage,
                references: request.parentSpanId ? [{
                    type: 'child-of',
                    traceId,
                    spanId: request.parentSpanId,
                }] : undefined,
            };

            // Store in memory for quick access
            this.activeSpans.set(spanId, span);

            // Store trace context
            const traceContext: TraceContext = {
                traceId,
                spanId,
                parentSpanId: request.parentSpanId,
                baggage: request.baggage,
                samplingDecision: true, // Simple sampling - always sample for now
            };
            this.traceContexts.set(spanId, traceContext);

            // Store in DynamoDB
            await this.docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `TRACE#${traceId}`,
                    SK: `SPAN#${spanId}`,
                    EntityType: 'TRACE_SPAN',
                    GSI1PK: `SERVICE#${request.serviceName}`,
                    GSI1SK: `OPERATION#${request.operationName}#${startTime}`,
                    ...span,
                    TTL: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days TTL
                },
            }));

            // Update or create trace summary
            await this.updateTraceSummary(traceId, span, 'start');

            this.logger.info('Span started', {
                traceId,
                spanId,
                operationName: request.operationName,
                serviceName: request.serviceName,
            });

            return this.createSuccessResponse({
                traceId,
                spanId,
                traceContext,
                message: 'Span started successfully',
            }, 201);

        } catch (error) {
            this.logger.error('Failed to start span', error);
            return this.createErrorResponseData(
                'START_FAILED',
                error instanceof Error ? error.message : 'Failed to start span',
                500
            );
        }
    }

    /**
     * Finish a span
     */
    private async finishSpan(body: string | null): Promise<ApiResponse> {
        if (!body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Request body is required', 400);
        }

        try {
            const request = JSON.parse(body) as FinishSpanRequest;

            if (!request.traceId || !request.spanId) {
                return this.createErrorResponseData(
                    'VALIDATION_ERROR',
                    'traceId and spanId are required',
                    400
                );
            }

            // Get span from memory or database
            let span = this.activeSpans.get(request.spanId);
            if (!span) {
                span = await this.getSpanById(request.traceId, request.spanId);
                if (!span) {
                    return this.createErrorResponseData('NOT_FOUND', 'Span not found', 404);
                }
            }

            // Update span
            const endTime = new Date().toISOString();
            const duration = new Date(endTime).getTime() - new Date(span.startTime).getTime();

            span.endTime = endTime;
            span.duration = duration;
            span.status = request.status || 'completed';

            if (request.tags) {
                span.tags = { ...span.tags, ...request.tags };
            }

            if (request.logs) {
                span.logs.push(...request.logs);
            }

            // Update in DynamoDB
            await this.docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `TRACE#${request.traceId}`,
                    SK: `SPAN#${request.spanId}`,
                    EntityType: 'TRACE_SPAN',
                    GSI1PK: `SERVICE#${span.serviceName}`,
                    GSI1SK: `OPERATION#${span.operationName}#${span.startTime}`,
                    ...span,
                    TTL: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days TTL
                },
            }));

            // Update trace summary
            await this.updateTraceSummary(request.traceId, span, 'finish');

            // Remove from active spans
            this.activeSpans.delete(request.spanId);
            this.traceContexts.delete(request.spanId);

            this.logger.info('Span finished', {
                traceId: request.traceId,
                spanId: request.spanId,
                duration,
                status: span.status,
            });

            return this.createSuccessResponse({
                traceId: request.traceId,
                spanId: request.spanId,
                duration,
                status: span.status,
                message: 'Span finished successfully',
            });

        } catch (error) {
            this.logger.error('Failed to finish span', error);
            return this.createErrorResponseData(
                'FINISH_FAILED',
                error instanceof Error ? error.message : 'Failed to finish span',
                500
            );
        }
    }

    /**
     * Log to a span
     */
    private async logToSpan(body: string | null): Promise<ApiResponse> {
        if (!body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Request body is required', 400);
        }

        try {
            const request = JSON.parse(body) as LogRequest;

            if (!request.traceId || !request.spanId || !request.message) {
                return this.createErrorResponseData(
                    'VALIDATION_ERROR',
                    'traceId, spanId, and message are required',
                    400
                );
            }

            // Get span
            let span = this.activeSpans.get(request.spanId);
            if (!span) {
                span = await this.getSpanById(request.traceId, request.spanId);
                if (!span) {
                    return this.createErrorResponseData('NOT_FOUND', 'Span not found', 404);
                }
            }

            // Add log entry
            const logEntry: TraceLog = {
                timestamp: new Date().toISOString(),
                level: request.level,
                message: request.message,
                fields: request.fields,
            };

            span.logs.push(logEntry);

            // Update in DynamoDB if span is not active (already persisted)
            if (!this.activeSpans.has(request.spanId)) {
                await this.docClient.send(new PutCommand({
                    TableName: TABLE_NAME,
                    Item: {
                        PK: `TRACE#${request.traceId}`,
                        SK: `SPAN#${request.spanId}`,
                        EntityType: 'TRACE_SPAN',
                        GSI1PK: `SERVICE#${span.serviceName}`,
                        GSI1SK: `OPERATION#${span.operationName}#${span.startTime}`,
                        ...span,
                        TTL: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days TTL
                    },
                }));
            }

            this.logger.info('Log added to span', {
                traceId: request.traceId,
                spanId: request.spanId,
                level: request.level,
                message: request.message,
            });

            return this.createSuccessResponse({
                traceId: request.traceId,
                spanId: request.spanId,
                logEntry,
                message: 'Log added to span successfully',
            });

        } catch (error) {
            this.logger.error('Failed to log to span', error);
            return this.createErrorResponseData(
                'LOG_FAILED',
                error instanceof Error ? error.message : 'Failed to log to span',
                500
            );
        }
    }

    /**
     * Get a complete trace
     */
    private async getTrace(traceId: string | undefined): Promise<ApiResponse> {
        if (!traceId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Trace ID is required', 400);
        }

        try {
            // Get all spans for the trace
            const result = await this.docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': `TRACE#${traceId}`,
                },
            }));

            const spans = (result.Items || [])
                .filter(item => item.EntityType === 'TRACE_SPAN')
                .map(item => item as TraceSpan);

            if (spans.length === 0) {
                return this.createErrorResponseData('NOT_FOUND', 'Trace not found', 404);
            }

            // Get trace summary
            const summary = await this.getTraceSummaryById(traceId);

            // Build trace tree
            const traceTree = this.buildTraceTree(spans);

            this.logger.info('Trace retrieved', {
                traceId,
                spanCount: spans.length,
            });

            return this.createSuccessResponse({
                traceId,
                summary,
                spans,
                traceTree,
                spanCount: spans.length,
            });

        } catch (error) {
            this.logger.error('Failed to get trace', error);
            return this.createErrorResponseData(
                'GET_FAILED',
                error instanceof Error ? error.message : 'Failed to get trace',
                500
            );
        }
    }

    /**
     * Get trace spans
     */
    private async getTraceSpans(traceId: string | undefined): Promise<ApiResponse> {
        if (!traceId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Trace ID is required', 400);
        }

        try {
            const result = await this.docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': `TRACE#${traceId}`,
                    ':sk': 'SPAN#',
                },
            }));

            const spans = (result.Items || []) as TraceSpan[];

            this.logger.info('Trace spans retrieved', {
                traceId,
                spanCount: spans.length,
            });

            return this.createSuccessResponse({
                traceId,
                spans,
                spanCount: spans.length,
            });

        } catch (error) {
            this.logger.error('Failed to get trace spans', error);
            return this.createErrorResponseData(
                'GET_FAILED',
                error instanceof Error ? error.message : 'Failed to get trace spans',
                500
            );
        }
    }

    /**
     * List traces
     */
    private async listTraces(queryParams: Record<string, string>): Promise<ApiResponse> {
        try {
            const serviceName = queryParams.serviceName;
            const operationName = queryParams.operationName;
            const limit = parseInt(queryParams.limit || '50');

            let params: any;

            if (serviceName) {
                // Query by service name using GSI1
                params = {
                    TableName: TABLE_NAME,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :gsi1pk',
                    ExpressionAttributeValues: {
                        ':gsi1pk': `SERVICE#${serviceName}`,
                    },
                    Limit: limit,
                    ScanIndexForward: false, // Most recent first
                };

                if (operationName) {
                    params.KeyConditionExpression += ' AND begins_with(GSI1SK, :gsi1sk)';
                    params.ExpressionAttributeValues[':gsi1sk'] = `OPERATION#${operationName}`;
                }
            } else {
                // Scan all trace summaries
                params = {
                    TableName: TABLE_NAME,
                    FilterExpression: 'EntityType = :entityType',
                    ExpressionAttributeValues: {
                        ':entityType': 'TRACE_SUMMARY',
                    },
                    Limit: limit,
                };
            }

            const command = new QueryCommand(params);
            const result = await this.docClient.send(command);

            const traces = (result.Items || []) as TraceSummary[];

            this.logger.info('Traces listed', {
                count: traces.length,
                serviceName,
                operationName,
            });

            return this.createSuccessResponse({
                traces,
                count: traces.length,
            });

        } catch (error) {
            this.logger.error('Failed to list traces', error);
            return this.createErrorResponseData(
                'LIST_FAILED',
                error instanceof Error ? error.message : 'Failed to list traces',
                500
            );
        }
    }

    /**
     * Get a specific span
     */
    private async getSpan(spanId: string | undefined): Promise<ApiResponse> {
        if (!spanId) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Span ID is required', 400);
        }

        try {
            // Check active spans first
            let span = this.activeSpans.get(spanId);

            if (!span) {
                // Search in database - this is inefficient, in production you'd want a GSI on spanId
                const result = await this.docClient.send(new QueryCommand({
                    TableName: TABLE_NAME,
                    FilterExpression: 'EntityType = :entityType AND spanId = :spanId',
                    ExpressionAttributeValues: {
                        ':entityType': 'TRACE_SPAN',
                        ':spanId': spanId,
                    },
                    Limit: 1,
                }));

                if (result.Items && result.Items.length > 0) {
                    span = result.Items[0] as TraceSpan;
                }
            }

            if (!span) {
                return this.createErrorResponseData('NOT_FOUND', 'Span not found', 404);
            }

            this.logger.info('Span retrieved', {
                spanId,
                traceId: span.traceId,
                operationName: span.operationName,
            });

            return this.createSuccessResponse(span);

        } catch (error) {
            this.logger.error('Failed to get span', error);
            return this.createErrorResponseData(
                'GET_FAILED',
                error instanceof Error ? error.message : 'Failed to get span',
                500
            );
        }
    }

    /**
     * Extract trace context from headers
     */
    private async extractTraceContext(body: string | null): Promise<ApiResponse> {
        if (!body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Request body is required', 400);
        }

        try {
            const { headers } = JSON.parse(body);

            if (!headers) {
                return this.createErrorResponseData('VALIDATION_ERROR', 'headers are required', 400);
            }

            // Extract trace context from headers (simplified implementation)
            const traceHeader = headers['X-Trace-ID'] || headers['x-trace-id'];
            const spanHeader = headers['X-Span-ID'] || headers['x-span-id'];
            const parentSpanHeader = headers['X-Parent-Span-ID'] || headers['x-parent-span-id'];
            const baggageHeader = headers['X-Baggage'] || headers['x-baggage'];

            let baggage: Record<string, string> | undefined;
            if (baggageHeader) {
                try {
                    baggage = JSON.parse(baggageHeader);
                } catch (error) {
                    // Ignore baggage parsing errors
                }
            }

            const traceContext: TraceContext = {
                traceId: traceHeader || this.generateTraceId(),
                spanId: spanHeader || this.generateSpanId(),
                parentSpanId: parentSpanHeader,
                baggage,
                samplingDecision: true,
            };

            this.logger.info('Trace context extracted', {
                traceId: traceContext.traceId,
                spanId: traceContext.spanId,
                parentSpanId: traceContext.parentSpanId,
            });

            return this.createSuccessResponse({
                traceContext,
                message: 'Trace context extracted successfully',
            });

        } catch (error) {
            this.logger.error('Failed to extract trace context', error);
            return this.createErrorResponseData(
                'EXTRACT_FAILED',
                error instanceof Error ? error.message : 'Failed to extract trace context',
                500
            );
        }
    }

    /**
     * Inject trace context into headers
     */
    private async injectTraceContext(body: string | null): Promise<ApiResponse> {
        if (!body) {
            return this.createErrorResponseData('INVALID_REQUEST', 'Request body is required', 400);
        }

        try {
            const { traceContext } = JSON.parse(body);

            if (!traceContext || !traceContext.traceId || !traceContext.spanId) {
                return this.createErrorResponseData(
                    'VALIDATION_ERROR',
                    'traceContext with traceId and spanId are required',
                    400
                );
            }

            // Inject trace context into headers
            const headers: Record<string, string> = {
                'X-Trace-ID': traceContext.traceId,
                'X-Span-ID': traceContext.spanId,
            };

            if (traceContext.parentSpanId) {
                headers['X-Parent-Span-ID'] = traceContext.parentSpanId;
            }

            if (traceContext.baggage) {
                headers['X-Baggage'] = JSON.stringify(traceContext.baggage);
            }

            this.logger.info('Trace context injected', {
                traceId: traceContext.traceId,
                spanId: traceContext.spanId,
            });

            return this.createSuccessResponse({
                headers,
                message: 'Trace context injected successfully',
            });

        } catch (error) {
            this.logger.error('Failed to inject trace context', error);
            return this.createErrorResponseData(
                'INJECT_FAILED',
                error instanceof Error ? error.message : 'Failed to inject trace context',
                500
            );
        }
    }

    /**
     * Get trace analytics
     */
    private async getTraceAnalytics(queryParams: Record<string, string>): Promise<ApiResponse> {
        try {
            const serviceName = queryParams.serviceName;
            const timeRange = queryParams.timeRange || '1h'; // 1h, 24h, 7d

            // This is a simplified implementation - in production you'd want proper time-based queries
            const result = await this.docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                FilterExpression: 'EntityType = :entityType',
                ExpressionAttributeValues: {
                    ':entityType': 'TRACE_SUMMARY',
                },
                Limit: 1000,
            }));

            const traces = (result.Items || []) as TraceSummary[];

            // Filter by service if specified
            const filteredTraces = serviceName
                ? traces.filter(trace => trace.serviceName === serviceName)
                : traces;

            // Calculate analytics
            const analytics = {
                totalTraces: filteredTraces.length,
                completedTraces: filteredTraces.filter(t => t.status === 'completed').length,
                errorTraces: filteredTraces.filter(t => t.status === 'error').length,
                inProgressTraces: filteredTraces.filter(t => t.status === 'in-progress').length,
                averageDuration: filteredTraces
                    .filter(t => t.duration)
                    .reduce((sum, t) => sum + (t.duration || 0), 0) / filteredTraces.length || 0,
                serviceBreakdown: {} as Record<string, number>,
                operationBreakdown: {} as Record<string, number>,
                errorRate: filteredTraces.length > 0
                    ? (filteredTraces.filter(t => t.status === 'error').length / filteredTraces.length) * 100
                    : 0,
            };

            // Count by service and operation
            for (const trace of filteredTraces) {
                analytics.serviceBreakdown[trace.serviceName] = (analytics.serviceBreakdown[trace.serviceName] || 0) + 1;
                analytics.operationBreakdown[trace.operationName] = (analytics.operationBreakdown[trace.operationName] || 0) + 1;
            }

            this.logger.info('Trace analytics retrieved', {
                totalTraces: analytics.totalTraces,
                serviceName,
                timeRange,
            });

            return this.createSuccessResponse(analytics);

        } catch (error) {
            this.logger.error('Failed to get trace analytics', error);
            return this.createErrorResponseData(
                'ANALYTICS_FAILED',
                error instanceof Error ? error.message : 'Failed to get trace analytics',
                500
            );
        }
    }

    /**
     * Get service analytics
     */
    private async getServiceAnalytics(queryParams: Record<string, string>): Promise<ApiResponse> {
        try {
            const serviceName = queryParams.serviceName;

            if (!serviceName) {
                return this.createErrorResponseData('VALIDATION_ERROR', 'serviceName is required', 400);
            }

            // Get spans for the service
            const result = await this.docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :gsi1pk',
                ExpressionAttributeValues: {
                    ':gsi1pk': `SERVICE#${serviceName}`,
                },
                Limit: 1000,
            }));

            const spans = (result.Items || []) as TraceSpan[];

            // Calculate service analytics
            const analytics = {
                serviceName,
                totalSpans: spans.length,
                completedSpans: spans.filter(s => s.status === 'completed').length,
                errorSpans: spans.filter(s => s.status === 'error').length,
                averageDuration: spans
                    .filter(s => s.duration)
                    .reduce((sum, s) => sum + (s.duration || 0), 0) / spans.length || 0,
                operationBreakdown: {} as Record<string, { count: number; averageDuration: number; errorRate: number }>,
                errorRate: spans.length > 0
                    ? (spans.filter(s => s.status === 'error').length / spans.length) * 100
                    : 0,
            };

            // Calculate per-operation metrics
            const operationGroups = spans.reduce((groups, span) => {
                if (!groups[span.operationName]) {
                    groups[span.operationName] = [];
                }
                groups[span.operationName].push(span);
                return groups;
            }, {} as Record<string, TraceSpan[]>);

            for (const [operation, operationSpans] of Object.entries(operationGroups)) {
                const completedSpans = operationSpans.filter(s => s.duration);
                analytics.operationBreakdown[operation] = {
                    count: operationSpans.length,
                    averageDuration: completedSpans.length > 0
                        ? completedSpans.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSpans.length
                        : 0,
                    errorRate: operationSpans.length > 0
                        ? (operationSpans.filter(s => s.status === 'error').length / operationSpans.length) * 100
                        : 0,
                };
            }

            this.logger.info('Service analytics retrieved', {
                serviceName,
                totalSpans: analytics.totalSpans,
            });

            return this.createSuccessResponse(analytics);

        } catch (error) {
            this.logger.error('Failed to get service analytics', error);
            return this.createErrorResponseData(
                'ANALYTICS_FAILED',
                error instanceof Error ? error.message : 'Failed to get service analytics',
                500
            );
        }
    }

    /**
     * Generate a new trace ID
     */
    private generateTraceId(): string {
        return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate a new span ID
     */
    private generateSpanId(): string {
        return `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get span by ID from database
     */
    private async getSpanById(traceId: string, spanId: string): Promise<TraceSpan | null> {
        try {
            const result = await this.docClient.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `TRACE#${traceId}`,
                    SK: `SPAN#${spanId}`,
                },
            }));

            return result.Item as TraceSpan || null;

        } catch (error) {
            this.logger.error('Failed to get span by ID', error);
            return null;
        }
    }

    /**
     * Get trace summary by ID
     */
    private async getTraceSummaryById(traceId: string): Promise<TraceSummary | null> {
        try {
            const result = await this.docClient.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `TRACE#${traceId}`,
                    SK: 'SUMMARY',
                },
            }));

            return result.Item as TraceSummary || null;

        } catch (error) {
            this.logger.error('Failed to get trace summary', error);
            return null;
        }
    }

    /**
     * Update trace summary
     */
    private async updateTraceSummary(traceId: string, span: TraceSpan, action: 'start' | 'finish'): Promise<void> {
        try {
            let summary = await this.getTraceSummaryById(traceId);

            if (!summary) {
                // Create new summary
                summary = {
                    traceId,
                    rootSpanId: span.spanId,
                    serviceName: span.serviceName,
                    operationName: span.operationName,
                    startTime: span.startTime,
                    status: 'in-progress',
                    spanCount: 1,
                    serviceCount: 1,
                    errorCount: 0,
                    tags: span.tags,
                };
            } else {
                // Update existing summary
                if (action === 'start') {
                    summary.spanCount++;
                    // Add service to count if not already counted (simplified)
                    if (!summary.tags.services) {
                        summary.tags.services = [span.serviceName];
                    } else if (!summary.tags.services.includes(span.serviceName)) {
                        summary.tags.services.push(span.serviceName);
                        summary.serviceCount++;
                    }
                } else if (action === 'finish') {
                    if (span.status === 'error') {
                        summary.errorCount++;
                    }

                    // Update end time and duration if this is the root span
                    if (span.spanId === summary.rootSpanId && span.endTime) {
                        summary.endTime = span.endTime;
                        summary.duration = span.duration;
                        summary.status = span.status === 'error' ? 'error' : 'completed';
                    }
                }
            }

            // Store updated summary
            await this.docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: `TRACE#${traceId}`,
                    SK: 'SUMMARY',
                    EntityType: 'TRACE_SUMMARY',
                    GSI1PK: `SERVICE#${summary.serviceName}`,
                    GSI1SK: `OPERATION#${summary.operationName}#${summary.startTime}`,
                    ...summary,
                    TTL: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days TTL
                },
            }));

        } catch (error) {
            this.logger.error('Failed to update trace summary', error);
        }
    }

    /**
     * Build trace tree from spans
     */
    private buildTraceTree(spans: TraceSpan[]): any {
        const spanMap = new Map<string, TraceSpan>();
        const children = new Map<string, TraceSpan[]>();

        // Build maps
        for (const span of spans) {
            spanMap.set(span.spanId, span);

            if (span.parentSpanId) {
                if (!children.has(span.parentSpanId)) {
                    children.set(span.parentSpanId, []);
                }
                children.get(span.parentSpanId)!.push(span);
            }
        }

        // Find root spans (no parent)
        const rootSpans = spans.filter(span => !span.parentSpanId);

        // Build tree recursively
        const buildNode = (span: TraceSpan): any => {
            const node = {
                ...span,
                children: (children.get(span.spanId) || []).map(buildNode),
            };
            return node;
        };

        return rootSpans.map(buildNode);
    }
}

// Create handler instance
const handlerInstance = new DistributedTracingServiceHandler();

/**
 * Lambda handler entry point
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
    return handlerInstance.lambdaHandler(event, context);
};