/**
 * X-Ray Utility Functions
 * 
 * Helper functions for working with X-Ray traces and creating custom segments.
 */

import { tracer, SpanOptions, ANNOTATION_KEYS, METADATA_KEYS } from './tracer';
import { Subsegment } from 'aws-xray-sdk-core';

/**
 * Trace a database operation
 */
export async function traceDatabaseOperation<T>(
    operation: string,
    tableName: string,
    fn: () => Promise<T>,
    options: {
        userId?: string;
        requestId?: string;
        metadata?: Record<string, any>;
    } = {}
): Promise<T> {
    return tracer.traceAsync(
        `dynamodb-${operation}`,
        fn,
        {
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
                [ANNOTATION_KEYS.AWS_SERVICE]: 'dynamodb',
                'db.table': tableName,
                'db.operation': operation,
            },
        }
    );
}

/**
 * Trace an S3 operation
 */
export async function traceS3Operation<T>(
    operation: string,
    bucketName: string,
    key?: string,
    fn: () => Promise<T>,
    options: {
        userId?: string;
        requestId?: string;
        metadata?: Record<string, any>;
    } = {}
): Promise<T> {
    return tracer.traceAsync(
        `s3-${operation}`,
        fn,
        {
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
                [ANNOTATION_KEYS.AWS_SERVICE]: 's3',
                's3.bucket': bucketName,
                's3.operation': operation,
            },
        }
    );
}

/**
 * Trace a Bedrock AI operation
 */
export async function traceBedrockOperation<T>(
    modelId: string,
    operation: string,
    fn: () => Promise<T>,
    options: {
        userId?: string;
        requestId?: string;
        inputTokens?: number;
        outputTokens?: number;
        metadata?: Record<string, any>;
    } = {}
): Promise<T> {
    return tracer.traceAsync(
        `bedrock-${operation}`,
        fn,
        {
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
                [ANNOTATION_KEYS.AWS_SERVICE]: 'bedrock',
                'bedrock.model_id': modelId,
                'bedrock.operation': operation,
            },
        }
    );
}

/**
 * Trace an external API call
 */
export async function traceExternalAPICall<T>(
    serviceName: string,
    operation: string,
    url: string,
    method: string,
    fn: () => Promise<T>,
    options: {
        userId?: string;
        requestId?: string;
        metadata?: Record<string, any>;
    } = {}
): Promise<T> {
    return tracer.traceAsync(
        `external-${serviceName}`,
        fn,
        {
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
                [ANNOTATION_KEYS.HTTP_METHOD]: method,
                [ANNOTATION_KEYS.HTTP_URL]: url,
                'external.service': serviceName,
            },
        }
    );
}

/**
 * Trace a business logic operation
 */
export async function traceBusinessLogic<T>(
    operationName: string,
    fn: () => Promise<T>,
    options: {
        serviceName?: string;
        userId?: string;
        requestId?: string;
        metadata?: Record<string, any>;
        annotations?: Record<string, string | number | boolean>;
    } = {}
): Promise<T> {
    return tracer.traceAsync(
        operationName,
        fn,
        {
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
        }
    );
}

/**
 * Create a custom trace segment for cross-service communication
 */
export function createCrossServiceSegment(
    targetService: string,
    operation: string,
    options: {
        userId?: string;
        requestId?: string;
        metadata?: Record<string, any>;
    } = {}
): Subsegment | null {
    const subsegment = tracer.startSubsegment(
        `call-${targetService}`,
        {
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
        }
    );

    return subsegment;
}

/**
 * Add performance metrics to current trace
 */
export function addPerformanceMetrics(metrics: {
    executionTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    requestSize?: number;
    responseSize?: number;
    errorRate?: number;
}): void {
    if (metrics.executionTime !== undefined) {
        tracer.addMetadata(METADATA_KEYS.EXECUTION_TIME, metrics.executionTime);
        tracer.addAnnotation('performance.execution_time', metrics.executionTime);
    }

    if (metrics.memoryUsage !== undefined) {
        tracer.addMetadata(METADATA_KEYS.MEMORY_USAGE, metrics.memoryUsage);
        tracer.addAnnotation('performance.memory_usage', metrics.memoryUsage);
    }

    if (metrics.cpuUsage !== undefined) {
        tracer.addMetadata('performance.cpu_usage', metrics.cpuUsage);
        tracer.addAnnotation('performance.cpu_usage', metrics.cpuUsage);
    }

    if (metrics.requestSize !== undefined) {
        tracer.addMetadata('performance.request_size', metrics.requestSize);
    }

    if (metrics.responseSize !== undefined) {
        tracer.addMetadata('performance.response_size', metrics.responseSize);
    }

    if (metrics.errorRate !== undefined) {
        tracer.addMetadata('performance.error_rate', metrics.errorRate);
        tracer.addAnnotation('performance.error_rate', metrics.errorRate);
    }
}

/**
 * Add user context to current trace
 */
export function addUserContext(userContext: {
    userId: string;
    userType?: string;
    organizationId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
}): void {
    tracer.addAnnotation(ANNOTATION_KEYS.USER_ID, userContext.userId);
    tracer.addMetadata('user.id', userContext.userId);

    if (userContext.userType) {
        tracer.addAnnotation('user.type', userContext.userType);
        tracer.addMetadata('user.type', userContext.userType);
    }

    if (userContext.organizationId) {
        tracer.addAnnotation('user.organization_id', userContext.organizationId);
        tracer.addMetadata('user.organization_id', userContext.organizationId);
    }

    if (userContext.sessionId) {
        tracer.addMetadata('user.session_id', userContext.sessionId);
    }

    if (userContext.ipAddress) {
        tracer.addMetadata('user.ip_address', userContext.ipAddress);
    }

    if (userContext.userAgent) {
        tracer.addMetadata('user.user_agent', userContext.userAgent);
    }
}

/**
 * Add request context to current trace
 */
export function addRequestContext(requestContext: {
    requestId: string;
    correlationId?: string;
    apiVersion?: string;
    clientVersion?: string;
    platform?: string;
    deviceType?: string;
}): void {
    tracer.addAnnotation(ANNOTATION_KEYS.REQUEST_ID, requestContext.requestId);
    tracer.addMetadata('request.id', requestContext.requestId);

    if (requestContext.correlationId) {
        tracer.addMetadata(METADATA_KEYS.CORRELATION_ID, requestContext.correlationId);
    }

    if (requestContext.apiVersion) {
        tracer.addAnnotation('request.api_version', requestContext.apiVersion);
        tracer.addMetadata('request.api_version', requestContext.apiVersion);
    }

    if (requestContext.clientVersion) {
        tracer.addMetadata('request.client_version', requestContext.clientVersion);
    }

    if (requestContext.platform) {
        tracer.addMetadata('request.platform', requestContext.platform);
    }

    if (requestContext.deviceType) {
        tracer.addMetadata('request.device_type', requestContext.deviceType);
    }
}

/**
 * Create a service map annotation for visualization
 */
export function addServiceMapAnnotation(
    fromService: string,
    toService: string,
    operation: string,
    success: boolean = true
): void {
    tracer.addAnnotation('service_map.from', fromService);
    tracer.addAnnotation('service_map.to', toService);
    tracer.addAnnotation('service_map.operation', operation);
    tracer.addAnnotation('service_map.success', success);

    tracer.addMetadata('service_map', {
        from: fromService,
        to: toService,
        operation,
        success,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Get trace URL for AWS X-Ray console
 */
export function getTraceConsoleURL(traceId: string, region: string = 'us-east-1'): string {
    return `https://${region}.console.aws.amazon.com/xray/home?region=${region}#/traces/${traceId}`;
}

/**
 * Extract trace information from headers
 */
export function extractTraceFromHeaders(headers: Record<string, string | string[] | undefined>): {
    traceId?: string;
    parentId?: string;
    correlationId?: string;
} {
    const traceHeader = headers['X-Amzn-Trace-Id'] || headers['x-amzn-trace-id'];
    const correlationId = headers['X-Correlation-Id'] || headers['x-correlation-id'];

    let traceInfo: any = {};

    if (traceHeader) {
        const parsed = tracer.parseTraceHeader(Array.isArray(traceHeader) ? traceHeader[0] : traceHeader);
        if (parsed) {
            traceInfo = parsed;
        }
    }

    if (correlationId) {
        traceInfo.correlationId = Array.isArray(correlationId) ? correlationId[0] : correlationId;
    }

    return traceInfo;
}

/**
 * Create trace headers for outgoing requests
 */
export function createTraceHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    const traceHeader = tracer.getTraceHeader();
    if (traceHeader) {
        headers['X-Amzn-Trace-Id'] = traceHeader;
    }

    const context = tracer.getCurrentTraceContext();
    if (context) {
        headers['X-Trace-Id'] = context.traceId;
        headers['X-Correlation-Id'] = context.correlationId;
    }

    return headers;
}