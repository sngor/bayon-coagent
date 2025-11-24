"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceDatabaseOperation = traceDatabaseOperation;
exports.traceS3Operation = traceS3Operation;
exports.traceBedrockOperation = traceBedrockOperation;
exports.traceExternalAPICall = traceExternalAPICall;
exports.traceBusinessLogic = traceBusinessLogic;
exports.createCrossServiceSegment = createCrossServiceSegment;
exports.addPerformanceMetrics = addPerformanceMetrics;
exports.addUserContext = addUserContext;
exports.addRequestContext = addRequestContext;
exports.addServiceMapAnnotation = addServiceMapAnnotation;
exports.getTraceConsoleURL = getTraceConsoleURL;
exports.extractTraceFromHeaders = extractTraceFromHeaders;
exports.createTraceHeaders = createTraceHeaders;
const tracer_1 = require("./tracer");
async function traceDatabaseOperation(operation, tableName, fn, options = {}) {
    return tracer_1.tracer.traceAsync(`dynamodb-${operation}`, fn, {
        serviceName: 'dynamodb',
        operationName: operation,
        userId: options.userId,
        requestId: options.requestId,
        metadata: {
            'db.type': 'dynamodb',
            'db.table': tableName,
            'db.operation': operation,
            ...options.metadata,
        },
        annotations: {
            [tracer_1.ANNOTATION_KEYS.AWS_SERVICE]: 'dynamodb',
            'db.table': tableName,
            'db.operation': operation,
        },
    });
}
async function traceS3Operation(operation, bucketName, key, fn, options = {}) {
    return tracer_1.tracer.traceAsync(`s3-${operation}`, fn, {
        serviceName: 's3',
        operationName: operation,
        userId: options.userId,
        requestId: options.requestId,
        metadata: {
            's3.bucket': bucketName,
            's3.key': key,
            's3.operation': operation,
            ...options.metadata,
        },
        annotations: {
            [tracer_1.ANNOTATION_KEYS.AWS_SERVICE]: 's3',
            's3.bucket': bucketName,
            's3.operation': operation,
        },
    });
}
async function traceBedrockOperation(modelId, operation, fn, options = {}) {
    return tracer_1.tracer.traceAsync(`bedrock-${operation}`, fn, {
        serviceName: 'bedrock',
        operationName: operation,
        userId: options.userId,
        requestId: options.requestId,
        metadata: {
            'bedrock.model_id': modelId,
            'bedrock.operation': operation,
            'bedrock.input_tokens': options.inputTokens,
            'bedrock.output_tokens': options.outputTokens,
            ...options.metadata,
        },
        annotations: {
            [tracer_1.ANNOTATION_KEYS.AWS_SERVICE]: 'bedrock',
            'bedrock.model_id': modelId,
            'bedrock.operation': operation,
        },
    });
}
async function traceExternalAPICall(serviceName, operation, url, method, fn, options = {}) {
    return tracer_1.tracer.traceAsync(`external-${serviceName}`, fn, {
        serviceName: `external-${serviceName}`,
        operationName: operation,
        userId: options.userId,
        requestId: options.requestId,
        metadata: {
            'http.url': url,
            'http.method': method,
            'external.service': serviceName,
            'external.operation': operation,
            ...options.metadata,
        },
        annotations: {
            [tracer_1.ANNOTATION_KEYS.HTTP_METHOD]: method,
            [tracer_1.ANNOTATION_KEYS.HTTP_URL]: url,
            'external.service': serviceName,
        },
    });
}
async function traceBusinessLogic(operationName, fn, options = {}) {
    return tracer_1.tracer.traceAsync(operationName, fn, {
        serviceName: options.serviceName || 'business-logic',
        operationName,
        userId: options.userId,
        requestId: options.requestId,
        metadata: {
            'business.operation': operationName,
            ...options.metadata,
        },
        annotations: {
            'business.operation': operationName,
            ...options.annotations,
        },
    });
}
function createCrossServiceSegment(targetService, operation, options = {}) {
    const subsegment = tracer_1.tracer.startSubsegment(`call-${targetService}`, {
        serviceName: targetService,
        operationName: operation,
        userId: options.userId,
        requestId: options.requestId,
        metadata: {
            'target.service': targetService,
            'target.operation': operation,
            'call.type': 'cross-service',
            ...options.metadata,
        },
        annotations: {
            'target.service': targetService,
            'target.operation': operation,
            'call.type': 'cross-service',
        },
    });
    return subsegment;
}
function addPerformanceMetrics(metrics) {
    if (metrics.executionTime !== undefined) {
        tracer_1.tracer.addMetadata(tracer_1.METADATA_KEYS.EXECUTION_TIME, metrics.executionTime);
        tracer_1.tracer.addAnnotation('performance.execution_time', metrics.executionTime);
    }
    if (metrics.memoryUsage !== undefined) {
        tracer_1.tracer.addMetadata(tracer_1.METADATA_KEYS.MEMORY_USAGE, metrics.memoryUsage);
        tracer_1.tracer.addAnnotation('performance.memory_usage', metrics.memoryUsage);
    }
    if (metrics.cpuUsage !== undefined) {
        tracer_1.tracer.addMetadata('performance.cpu_usage', metrics.cpuUsage);
        tracer_1.tracer.addAnnotation('performance.cpu_usage', metrics.cpuUsage);
    }
    if (metrics.requestSize !== undefined) {
        tracer_1.tracer.addMetadata('performance.request_size', metrics.requestSize);
    }
    if (metrics.responseSize !== undefined) {
        tracer_1.tracer.addMetadata('performance.response_size', metrics.responseSize);
    }
    if (metrics.errorRate !== undefined) {
        tracer_1.tracer.addMetadata('performance.error_rate', metrics.errorRate);
        tracer_1.tracer.addAnnotation('performance.error_rate', metrics.errorRate);
    }
}
function addUserContext(userContext) {
    tracer_1.tracer.addAnnotation(tracer_1.ANNOTATION_KEYS.USER_ID, userContext.userId);
    tracer_1.tracer.addMetadata('user.id', userContext.userId);
    if (userContext.userType) {
        tracer_1.tracer.addAnnotation('user.type', userContext.userType);
        tracer_1.tracer.addMetadata('user.type', userContext.userType);
    }
    if (userContext.organizationId) {
        tracer_1.tracer.addAnnotation('user.organization_id', userContext.organizationId);
        tracer_1.tracer.addMetadata('user.organization_id', userContext.organizationId);
    }
    if (userContext.sessionId) {
        tracer_1.tracer.addMetadata('user.session_id', userContext.sessionId);
    }
    if (userContext.ipAddress) {
        tracer_1.tracer.addMetadata('user.ip_address', userContext.ipAddress);
    }
    if (userContext.userAgent) {
        tracer_1.tracer.addMetadata('user.user_agent', userContext.userAgent);
    }
}
function addRequestContext(requestContext) {
    tracer_1.tracer.addAnnotation(tracer_1.ANNOTATION_KEYS.REQUEST_ID, requestContext.requestId);
    tracer_1.tracer.addMetadata('request.id', requestContext.requestId);
    if (requestContext.correlationId) {
        tracer_1.tracer.addMetadata(tracer_1.METADATA_KEYS.CORRELATION_ID, requestContext.correlationId);
    }
    if (requestContext.apiVersion) {
        tracer_1.tracer.addAnnotation('request.api_version', requestContext.apiVersion);
        tracer_1.tracer.addMetadata('request.api_version', requestContext.apiVersion);
    }
    if (requestContext.clientVersion) {
        tracer_1.tracer.addMetadata('request.client_version', requestContext.clientVersion);
    }
    if (requestContext.platform) {
        tracer_1.tracer.addMetadata('request.platform', requestContext.platform);
    }
    if (requestContext.deviceType) {
        tracer_1.tracer.addMetadata('request.device_type', requestContext.deviceType);
    }
}
function addServiceMapAnnotation(fromService, toService, operation, success = true) {
    tracer_1.tracer.addAnnotation('service_map.from', fromService);
    tracer_1.tracer.addAnnotation('service_map.to', toService);
    tracer_1.tracer.addAnnotation('service_map.operation', operation);
    tracer_1.tracer.addAnnotation('service_map.success', success);
    tracer_1.tracer.addMetadata('service_map', {
        from: fromService,
        to: toService,
        operation,
        success,
        timestamp: new Date().toISOString(),
    });
}
function getTraceConsoleURL(traceId, region = 'us-east-1') {
    return `https://${region}.console.aws.amazon.com/xray/home?region=${region}#/traces/${traceId}`;
}
function extractTraceFromHeaders(headers) {
    const traceHeader = headers['X-Amzn-Trace-Id'] || headers['x-amzn-trace-id'];
    const correlationId = headers['X-Correlation-Id'] || headers['x-correlation-id'];
    let traceInfo = {};
    if (traceHeader) {
        const parsed = tracer_1.tracer.parseTraceHeader(Array.isArray(traceHeader) ? traceHeader[0] : traceHeader);
        if (parsed) {
            traceInfo = parsed;
        }
    }
    if (correlationId) {
        traceInfo.correlationId = Array.isArray(correlationId) ? correlationId[0] : correlationId;
    }
    return traceInfo;
}
function createTraceHeaders() {
    const headers = {};
    const traceHeader = tracer_1.tracer.getTraceHeader();
    if (traceHeader) {
        headers['X-Amzn-Trace-Id'] = traceHeader;
    }
    const context = tracer_1.tracer.getCurrentTraceContext();
    if (context) {
        headers['X-Trace-Id'] = context.traceId;
        headers['X-Correlation-Id'] = context.correlationId;
    }
    return headers;
}
