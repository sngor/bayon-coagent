"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withXRayTracing = withXRayTracing;
exports.withLambdaXRayTracing = withLambdaXRayTracing;
exports.expressXRayMiddleware = expressXRayMiddleware;
const tracer_1 = require("./tracer");
const logger_1 = require("@/aws/logging/logger");
function withXRayTracing(handler) {
    return async (request) => {
        if (!tracer_1.tracer.isEnabled()) {
            return handler(request);
        }
        const operationName = `${request.method} ${request.nextUrl.pathname}`;
        const correlationId = (0, logger_1.generateCorrelationId)();
        const traceHeader = request.headers.get('X-Amzn-Trace-Id') ||
            request.headers.get('X-Trace-Id');
        let traceContext = null;
        if (traceHeader) {
            const parsed = tracer_1.tracer.parseTraceHeader(traceHeader);
            if (parsed?.traceId) {
                traceContext = parsed;
            }
        }
        const spanOptions = {
            serviceName: 'bayon-coagent-nextjs',
            operationName,
            requestId: correlationId,
            metadata: {
                [tracer_1.METADATA_KEYS.HTTP_METHOD]: request.method,
                [tracer_1.METADATA_KEYS.HTTP_URL]: request.url,
                [tracer_1.METADATA_KEYS.CORRELATION_ID]: correlationId,
                'request.headers': Object.fromEntries(request.headers.entries()),
                'request.pathname': request.nextUrl.pathname,
                'request.search': request.nextUrl.search,
            },
            annotations: {
                [tracer_1.ANNOTATION_KEYS.HTTP_METHOD]: request.method,
                [tracer_1.ANNOTATION_KEYS.HTTP_URL]: request.nextUrl.pathname,
                [tracer_1.ANNOTATION_KEYS.REQUEST_ID]: correlationId,
            },
        };
        const userId = extractUserIdFromRequest(request);
        if (userId) {
            spanOptions.userId = userId;
            spanOptions.annotations[tracer_1.ANNOTATION_KEYS.USER_ID] = userId;
        }
        const context = tracer_1.tracer.startTrace(operationName, spanOptions);
        try {
            const startTime = Date.now();
            const response = await handler(request);
            const duration = Date.now() - startTime;
            tracer_1.tracer.addMetadata(tracer_1.METADATA_KEYS.EXECUTION_TIME, duration);
            tracer_1.tracer.addMetadata('response.status', response.status);
            tracer_1.tracer.addMetadata('response.headers', Object.fromEntries(response.headers.entries()));
            tracer_1.tracer.addAnnotation(tracer_1.ANNOTATION_KEYS.HTTP_STATUS_CODE, response.status);
            if (context) {
                response.headers.set('X-Trace-Id', context.traceId);
                response.headers.set('X-Correlation-Id', context.correlationId);
            }
            tracer_1.tracer.closeSegment();
            return response;
        }
        catch (error) {
            tracer_1.tracer.addError(error);
            tracer_1.tracer.closeSegment(error);
            throw error;
        }
    };
}
function withLambdaXRayTracing(handler) {
    return async (event, context) => {
        if (!tracer_1.tracer.isEnabled()) {
            return handler(event, context);
        }
        const functionName = context.functionName;
        const operationName = extractOperationFromEvent(event);
        const correlationId = (0, logger_1.generateCorrelationId)();
        let traceHeader;
        let userId;
        let requestId;
        if (isAPIGatewayEvent(event)) {
            traceHeader = event.headers?.['X-Amzn-Trace-Id'] ||
                event.headers?.['X-Trace-Id'];
            userId = extractUserIdFromAPIGatewayEvent(event);
            requestId = event.requestContext?.requestId;
        }
        const spanOptions = {
            serviceName: functionName,
            operationName,
            userId,
            requestId: requestId || correlationId,
            metadata: {
                [tracer_1.METADATA_KEYS.FUNCTION_NAME]: functionName,
                [tracer_1.METADATA_KEYS.FUNCTION_VERSION]: context.functionVersion,
                [tracer_1.METADATA_KEYS.CORRELATION_ID]: correlationId,
                [tracer_1.METADATA_KEYS.COLD_START]: context.getRemainingTimeInMillis() === context.getRemainingTimeInMillis(),
                'lambda.request_id': context.awsRequestId,
                'lambda.log_group_name': context.logGroupName,
                'lambda.log_stream_name': context.logStreamName,
                'lambda.memory_limit': context.memoryLimitInMB,
                'event.source': extractEventSource(event),
            },
            annotations: {
                [tracer_1.ANNOTATION_KEYS.AWS_SERVICE]: 'lambda',
                [tracer_1.ANNOTATION_KEYS.FUNCTION_NAME]: functionName,
                [tracer_1.ANNOTATION_KEYS.REQUEST_ID]: requestId || correlationId,
            },
        };
        if (userId) {
            spanOptions.annotations[tracer_1.ANNOTATION_KEYS.USER_ID] = userId;
        }
        if (isAPIGatewayEvent(event)) {
            spanOptions.metadata['apigateway.request_id'] = event.requestContext?.requestId;
            spanOptions.metadata['apigateway.stage'] = event.requestContext?.stage;
            spanOptions.metadata['apigateway.resource_path'] = event.resource;
            spanOptions.annotations[tracer_1.ANNOTATION_KEYS.HTTP_METHOD] = event.httpMethod;
            spanOptions.annotations[tracer_1.ANNOTATION_KEYS.HTTP_URL] = event.path;
        }
        const traceContext = tracer_1.tracer.startTrace(operationName, spanOptions);
        try {
            const startTime = Date.now();
            const result = await handler(event, context);
            const duration = Date.now() - startTime;
            const memoryUsed = context.memoryLimitInMB - context.getRemainingTimeInMillis();
            tracer_1.tracer.addMetadata(tracer_1.METADATA_KEYS.EXECUTION_TIME, duration);
            tracer_1.tracer.addMetadata(tracer_1.METADATA_KEYS.MEMORY_USAGE, memoryUsed);
            if (isAPIGatewayResult(result)) {
                tracer_1.tracer.addAnnotation(tracer_1.ANNOTATION_KEYS.HTTP_STATUS_CODE, result.statusCode);
                tracer_1.tracer.addMetadata('response.status_code', result.statusCode);
                if (traceContext && result.headers) {
                    result.headers['X-Trace-Id'] = traceContext.traceId;
                    result.headers['X-Correlation-Id'] = traceContext.correlationId;
                }
            }
            tracer_1.tracer.closeSegment();
            return result;
        }
        catch (error) {
            tracer_1.tracer.addError(error);
            tracer_1.tracer.closeSegment(error);
            throw error;
        }
    };
}
function expressXRayMiddleware() {
    return (req, res, next) => {
        if (!tracer_1.tracer.isEnabled()) {
            return next();
        }
        const operationName = `${req.method} ${req.path}`;
        const correlationId = (0, logger_1.generateCorrelationId)();
        const traceHeader = req.headers['x-amzn-trace-id'] || req.headers['x-trace-id'];
        const userId = req.user?.id || req.headers['x-user-id'];
        const spanOptions = {
            serviceName: process.env.SERVICE_NAME || 'express-service',
            operationName,
            userId,
            requestId: correlationId,
            metadata: {
                [tracer_1.METADATA_KEYS.HTTP_METHOD]: req.method,
                [tracer_1.METADATA_KEYS.HTTP_URL]: req.originalUrl,
                [tracer_1.METADATA_KEYS.CORRELATION_ID]: correlationId,
                'request.headers': req.headers,
                'request.ip': req.ip,
                'request.user_agent': req.get('User-Agent'),
            },
            annotations: {
                [tracer_1.ANNOTATION_KEYS.HTTP_METHOD]: req.method,
                [tracer_1.ANNOTATION_KEYS.HTTP_URL]: req.path,
                [tracer_1.ANNOTATION_KEYS.REQUEST_ID]: correlationId,
            },
        };
        if (userId) {
            spanOptions.annotations[tracer_1.ANNOTATION_KEYS.USER_ID] = userId;
        }
        const traceContext = tracer_1.tracer.startTrace(operationName, spanOptions);
        if (traceContext) {
            res.set('X-Trace-Id', traceContext.traceId);
            res.set('X-Correlation-Id', traceContext.correlationId);
        }
        const startTime = Date.now();
        const originalEnd = res.end;
        res.end = function (chunk, encoding) {
            const duration = Date.now() - startTime;
            tracer_1.tracer.addMetadata(tracer_1.METADATA_KEYS.EXECUTION_TIME, duration);
            tracer_1.tracer.addAnnotation(tracer_1.ANNOTATION_KEYS.HTTP_STATUS_CODE, res.statusCode);
            tracer_1.tracer.addMetadata('response.status_code', res.statusCode);
            if (res.statusCode >= 400) {
                tracer_1.tracer.addError(`HTTP ${res.statusCode}: ${res.statusMessage}`);
            }
            tracer_1.tracer.closeSegment();
            originalEnd.call(this, chunk, encoding);
        };
        next();
    };
}
function extractUserIdFromRequest(request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
    }
    return request.headers.get('x-user-id') || undefined;
}
function extractOperationFromEvent(event) {
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
function extractEventSource(event) {
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
function extractUserIdFromAPIGatewayEvent(event) {
    if (event.requestContext?.authorizer?.claims?.sub) {
        return event.requestContext.authorizer.claims.sub;
    }
    return event.headers?.['X-User-Id'] || event.headers?.['x-user-id'];
}
function isAPIGatewayEvent(event) {
    return event && event.httpMethod && event.requestContext;
}
function isAPIGatewayResult(result) {
    return result && typeof result.statusCode === 'number';
}
