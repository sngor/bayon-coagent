/**
 * X-Ray Middleware for Next.js and Lambda Functions
 * 
 * Provides middleware for automatic tracing of HTTP requests and Lambda invocations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { tracer, SpanOptions, ANNOTATION_KEYS, METADATA_KEYS } from './tracer';
import { generateCorrelationId } from '@/aws/logging/logger';

/**
 * Next.js middleware for X-Ray tracing
 */
export function withXRayTracing(
    handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        if (!tracer.isEnabled()) {
            return handler(request);
        }

        const operationName = `${request.method} ${request.nextUrl.pathname}`;
        const correlationId = generateCorrelationId();

        // Extract trace header from incoming request
        const traceHeader = request.headers.get('X-Amzn-Trace-Id') ||
            request.headers.get('X-Trace-Id');

        let traceContext = null;
        if (traceHeader) {
            const parsed = tracer.parseTraceHeader(traceHeader);
            if (parsed?.traceId) {
                traceContext = parsed;
            }
        }

        const spanOptions: SpanOptions = {
            serviceName: 'bayon-coagent-nextjs',
            operationName,
            requestId: correlationId,
            metadata: {
                [METADATA_KEYS.HTTP_METHOD]: request.method,
                [METADATA_KEYS.HTTP_URL]: request.url,
                [METADATA_KEYS.CORRELATION_ID]: correlationId,
                'request.headers': Object.fromEntries(request.headers.entries()),
                'request.pathname': request.nextUrl.pathname,
                'request.search': request.nextUrl.search,
            },
            annotations: {
                [ANNOTATION_KEYS.HTTP_METHOD]: request.method,
                [ANNOTATION_KEYS.HTTP_URL]: request.nextUrl.pathname,
                [ANNOTATION_KEYS.REQUEST_ID]: correlationId,
            },
        };

        // Extract user ID from request if available
        const userId = extractUserIdFromRequest(request);
        if (userId) {
            spanOptions.userId = userId;
            spanOptions.annotations![ANNOTATION_KEYS.USER_ID] = userId;
        }

        const context = tracer.startTrace(operationName, spanOptions);

        try {
            const startTime = Date.now();
            const response = await handler(request);
            const duration = Date.now() - startTime;

            // Add response metadata
            tracer.addMetadata(METADATA_KEYS.EXECUTION_TIME, duration);
            tracer.addMetadata('response.status', response.status);
            tracer.addMetadata('response.headers', Object.fromEntries(response.headers.entries()));

            tracer.addAnnotation(ANNOTATION_KEYS.HTTP_STATUS_CODE, response.status);

            // Add trace ID to response headers
            if (context) {
                response.headers.set('X-Trace-Id', context.traceId);
                response.headers.set('X-Correlation-Id', context.correlationId);
            }

            tracer.closeSegment();
            return response;
        } catch (error) {
            tracer.addError(error as Error);
            tracer.closeSegment(error as Error);
            throw error;
        }
    };
}

/**
 * Lambda function wrapper for X-Ray tracing
 */
export function withLambdaXRayTracing<TEvent = APIGatewayProxyEvent, TResult = APIGatewayProxyResult>(
    handler: (event: TEvent, context: Context) => Promise<TResult>
) {
    return async (event: TEvent, context: Context): Promise<TResult> => {
        if (!tracer.isEnabled()) {
            return handler(event, context);
        }

        const functionName = context.functionName;
        const operationName = extractOperationFromEvent(event);
        const correlationId = generateCorrelationId();

        // Extract trace information from event
        let traceHeader: string | undefined;
        let userId: string | undefined;
        let requestId: string | undefined;

        if (isAPIGatewayEvent(event)) {
            traceHeader = event.headers?.['X-Amzn-Trace-Id'] ||
                event.headers?.['X-Trace-Id'];
            userId = extractUserIdFromAPIGatewayEvent(event);
            requestId = event.requestContext?.requestId;
        }

        const spanOptions: SpanOptions = {
            serviceName: functionName,
            operationName,
            userId,
            requestId: requestId || correlationId,
            metadata: {
                [METADATA_KEYS.FUNCTION_NAME]: functionName,
                [METADATA_KEYS.FUNCTION_VERSION]: context.functionVersion,
                [METADATA_KEYS.CORRELATION_ID]: correlationId,
                [METADATA_KEYS.COLD_START]: context.getRemainingTimeInMillis() === context.getRemainingTimeInMillis(),
                'lambda.request_id': context.awsRequestId,
                'lambda.log_group_name': context.logGroupName,
                'lambda.log_stream_name': context.logStreamName,
                'lambda.memory_limit': context.memoryLimitInMB,
                'event.source': extractEventSource(event),
            },
            annotations: {
                [ANNOTATION_KEYS.AWS_SERVICE]: 'lambda',
                [ANNOTATION_KEYS.FUNCTION_NAME]: functionName,
                [ANNOTATION_KEYS.REQUEST_ID]: requestId || correlationId,
            },
        };

        if (userId) {
            spanOptions.annotations![ANNOTATION_KEYS.USER_ID] = userId;
        }

        if (isAPIGatewayEvent(event)) {
            spanOptions.metadata!['apigateway.request_id'] = event.requestContext?.requestId;
            spanOptions.metadata!['apigateway.stage'] = event.requestContext?.stage;
            spanOptions.metadata!['apigateway.resource_path'] = event.resource;
            spanOptions.annotations![ANNOTATION_KEYS.HTTP_METHOD] = event.httpMethod;
            spanOptions.annotations![ANNOTATION_KEYS.HTTP_URL] = event.path;
        }

        const traceContext = tracer.startTrace(operationName, spanOptions);

        try {
            const startTime = Date.now();
            const result = await handler(event, context);
            const duration = Date.now() - startTime;
            const memoryUsed = context.memoryLimitInMB - context.getRemainingTimeInMillis();

            // Add execution metadata
            tracer.addMetadata(METADATA_KEYS.EXECUTION_TIME, duration);
            tracer.addMetadata(METADATA_KEYS.MEMORY_USAGE, memoryUsed);

            // Add response status for API Gateway events
            if (isAPIGatewayResult(result)) {
                tracer.addAnnotation(ANNOTATION_KEYS.HTTP_STATUS_CODE, result.statusCode);
                tracer.addMetadata('response.status_code', result.statusCode);

                // Add trace headers to response
                if (traceContext && result.headers) {
                    result.headers['X-Trace-Id'] = traceContext.traceId;
                    result.headers['X-Correlation-Id'] = traceContext.correlationId;
                }
            }

            tracer.closeSegment();
            return result;
        } catch (error) {
            tracer.addError(error as Error);
            tracer.closeSegment(error as Error);
            throw error;
        }
    };
}

/**
 * Express middleware for X-Ray tracing (for use in containerized services)
 */
export function expressXRayMiddleware() {
    return (req: any, res: any, next: any) => {
        if (!tracer.isEnabled()) {
            return next();
        }

        const operationName = `${req.method} ${req.path}`;
        const correlationId = generateCorrelationId();

        const traceHeader = req.headers['x-amzn-trace-id'] || req.headers['x-trace-id'];
        const userId = req.user?.id || req.headers['x-user-id'];

        const spanOptions: SpanOptions = {
            serviceName: process.env.SERVICE_NAME || 'express-service',
            operationName,
            userId,
            requestId: correlationId,
            metadata: {
                [METADATA_KEYS.HTTP_METHOD]: req.method,
                [METADATA_KEYS.HTTP_URL]: req.originalUrl,
                [METADATA_KEYS.CORRELATION_ID]: correlationId,
                'request.headers': req.headers,
                'request.ip': req.ip,
                'request.user_agent': req.get('User-Agent'),
            },
            annotations: {
                [ANNOTATION_KEYS.HTTP_METHOD]: req.method,
                [ANNOTATION_KEYS.HTTP_URL]: req.path,
                [ANNOTATION_KEYS.REQUEST_ID]: correlationId,
            },
        };

        if (userId) {
            spanOptions.annotations![ANNOTATION_KEYS.USER_ID] = userId;
        }

        const traceContext = tracer.startTrace(operationName, spanOptions);

        // Add trace headers to response
        if (traceContext) {
            res.set('X-Trace-Id', traceContext.traceId);
            res.set('X-Correlation-Id', traceContext.correlationId);
        }

        const startTime = Date.now();

        // Override res.end to capture response data
        const originalEnd = res.end;
        res.end = function (chunk: any, encoding: any) {
            const duration = Date.now() - startTime;

            tracer.addMetadata(METADATA_KEYS.EXECUTION_TIME, duration);
            tracer.addAnnotation(ANNOTATION_KEYS.HTTP_STATUS_CODE, res.statusCode);
            tracer.addMetadata('response.status_code', res.statusCode);

            if (res.statusCode >= 400) {
                tracer.addError(`HTTP ${res.statusCode}: ${res.statusMessage}`);
            }

            tracer.closeSegment();
            originalEnd.call(this, chunk, encoding);
        };

        next();
    };
}

// Helper functions

function extractUserIdFromRequest(request: NextRequest): string | undefined {
    // Try to extract user ID from various sources
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        // This would need to be implemented based on your auth system
        // For now, return undefined
    }

    return request.headers.get('x-user-id') || undefined;
}

function extractOperationFromEvent(event: any): string {
    if (isAPIGatewayEvent(event)) {
        return `${event.httpMethod} ${event.resource || event.path}`;
    }

    if (event.source === 'aws.events') {
        return event['detail-type'] || 'scheduled-event';
    }

    if (event.Records) {
        const record = event.Records[0];
        if (record.eventSource === 'aws:s3') {
            return `s3-${record.eventName}`;
        }
        if (record.eventSource === 'aws:dynamodb') {
            return `dynamodb-${record.eventName}`;
        }
        if (record.eventSource === 'aws:sqs') {
            return 'sqs-message';
        }
    }

    return 'lambda-invocation';
}

function extractEventSource(event: any): string {
    if (isAPIGatewayEvent(event)) {
        return 'apigateway';
    }

    if (event.source === 'aws.events') {
        return 'eventbridge';
    }

    if (event.Records) {
        const record = event.Records[0];
        return record.eventSource || 'unknown';
    }

    return 'direct-invocation';
}

function extractUserIdFromAPIGatewayEvent(event: APIGatewayProxyEvent): string | undefined {
    // Extract from authorizer context
    if (event.requestContext?.authorizer?.claims?.sub) {
        return event.requestContext.authorizer.claims.sub;
    }

    // Extract from custom headers
    return event.headers?.['X-User-Id'] || event.headers?.['x-user-id'];
}

function isAPIGatewayEvent(event: any): event is APIGatewayProxyEvent {
    return event && event.httpMethod && event.requestContext;
}

function isAPIGatewayResult(result: any): result is APIGatewayProxyResult {
    return result && typeof result.statusCode === 'number';
}