/**
 * Unified Error Response Format
 * 
 * Provides a standardized error response format across all microservices.
 * Includes trace IDs for distributed tracing and correlation.
 * 
 * Requirements: 4.3 - Meaningful feedback and fallback options for partial failures
 */

import { tracer } from '@/aws/xray/tracer';

/**
 * Standard error codes used across all services
 */
export enum ErrorCode {
    // Client Errors (4xx)
    BAD_REQUEST = 'BAD_REQUEST',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

    // Server Errors (5xx)
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',

    // Service-Specific Errors
    AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
    INTEGRATION_ERROR = 'INTEGRATION_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',

    // OAuth Errors
    OAUTH_ERROR = 'OAUTH_ERROR',
    TOKEN_EXCHANGE_FAILED = 'TOKEN_EXCHANGE_FAILED',
    INVALID_STATE = 'INVALID_STATE',
    EXPIRED_STATE = 'EXPIRED_STATE',

    // Job Processing Errors
    JOB_PROCESSING_ERROR = 'JOB_PROCESSING_ERROR',
    JOB_TIMEOUT = 'JOB_TIMEOUT',
    JOB_CANCELLED = 'JOB_CANCELLED',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

/**
 * Fallback information when service degradation occurs
 */
export interface FallbackInfo {
    available: boolean;
    type?: 'cached' | 'default' | 'alternative_service' | 'queued';
    data?: any;
    message?: string;
}

/**
 * Error details for additional context
 */
export interface ErrorDetails {
    service: string;
    timestamp: string;
    traceId?: string;
    correlationId?: string;
    requestId?: string;
    userId?: string;
    path?: string;
    method?: string;
    statusCode?: number;
    [key: string]: any;
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
    error: {
        code: ErrorCode | string;
        message: string;
        severity?: ErrorSeverity;
        details: ErrorDetails;
        fallback?: FallbackInfo;
        retryable?: boolean;
        retryAfter?: number; // seconds
    };
}

/**
 * Success response with optional metadata
 */
export interface SuccessResponse<T = any> {
    success: true;
    data: T;
    message?: string;
    metadata?: {
        traceId?: string;
        correlationId?: string;
        timestamp?: string;
        [key: string]: any;
    };
}

/**
 * Options for formatting error responses
 */
export interface ErrorFormatterOptions {
    service: string;
    code?: ErrorCode | string;
    message?: string;
    severity?: ErrorSeverity;
    statusCode?: number;
    userId?: string;
    requestId?: string;
    path?: string;
    method?: string;
    fallback?: FallbackInfo;
    retryable?: boolean;
    retryAfter?: number;
    additionalDetails?: Record<string, any>;
}

/**
 * Format an error into the standard error response structure
 */
export function formatErrorResponse(
    error: Error | string,
    options: ErrorFormatterOptions
): ErrorResponse {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const timestamp = new Date().toISOString();

    // Get trace context from X-Ray
    const traceContext = tracer.getCurrentTraceContext();

    // Determine error code
    const errorCode = options.code || inferErrorCode(error);

    // Determine severity
    const severity = options.severity || inferSeverity(errorCode);

    // Build error details
    const details: ErrorDetails = {
        service: options.service,
        timestamp,
        traceId: traceContext?.traceId || process.env._X_AMZN_TRACE_ID,
        correlationId: traceContext?.correlationId,
        requestId: options.requestId,
        userId: options.userId,
        path: options.path,
        method: options.method,
        statusCode: options.statusCode,
        ...options.additionalDetails,
    };

    // Remove undefined values
    Object.keys(details).forEach(key => {
        if (details[key] === undefined) {
            delete details[key];
        }
    });

    return {
        error: {
            code: errorCode,
            message: options.message || errorMessage,
            severity,
            details,
            fallback: options.fallback,
            retryable: options.retryable,
            retryAfter: options.retryAfter,
        },
    };
}

/**
 * Format a success response with trace information
 */
export function formatSuccessResponse<T>(
    data: T,
    message?: string,
    additionalMetadata?: Record<string, any>
): SuccessResponse<T> {
    const traceContext = tracer.getCurrentTraceContext();

    return {
        success: true,
        data,
        message,
        metadata: {
            traceId: traceContext?.traceId || process.env._X_AMZN_TRACE_ID,
            correlationId: traceContext?.correlationId,
            timestamp: new Date().toISOString(),
            ...additionalMetadata,
        },
    };
}

/**
 * Infer error code from error object or message
 */
function inferErrorCode(error: Error | string): ErrorCode {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const lowerMessage = errorMessage.toLowerCase();

    // Check for common patterns
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('authentication')) {
        return ErrorCode.UNAUTHORIZED;
    }
    if (lowerMessage.includes('forbidden') || lowerMessage.includes('permission')) {
        return ErrorCode.FORBIDDEN;
    }
    if (lowerMessage.includes('not found')) {
        return ErrorCode.NOT_FOUND;
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
        return ErrorCode.VALIDATION_ERROR;
    }
    if (lowerMessage.includes('timeout')) {
        return ErrorCode.GATEWAY_TIMEOUT;
    }
    if (lowerMessage.includes('rate limit')) {
        return ErrorCode.RATE_LIMIT_EXCEEDED;
    }
    if (lowerMessage.includes('conflict') || lowerMessage.includes('already exists')) {
        return ErrorCode.CONFLICT;
    }
    if (lowerMessage.includes('unavailable') || lowerMessage.includes('service down')) {
        return ErrorCode.SERVICE_UNAVAILABLE;
    }

    // Default to internal error
    return ErrorCode.INTERNAL_ERROR;
}

/**
 * Infer error severity from error code
 */
function inferSeverity(code: ErrorCode | string): ErrorSeverity {
    switch (code) {
        case ErrorCode.INTERNAL_ERROR:
        case ErrorCode.DATABASE_ERROR:
        case ErrorCode.SERVICE_UNAVAILABLE:
            return ErrorSeverity.CRITICAL;

        case ErrorCode.AI_SERVICE_ERROR:
        case ErrorCode.INTEGRATION_ERROR:
        case ErrorCode.EXTERNAL_API_ERROR:
        case ErrorCode.GATEWAY_TIMEOUT:
        case ErrorCode.JOB_PROCESSING_ERROR:
            return ErrorSeverity.HIGH;

        case ErrorCode.OAUTH_ERROR:
        case ErrorCode.TOKEN_EXCHANGE_FAILED:
        case ErrorCode.JOB_TIMEOUT:
        case ErrorCode.RATE_LIMIT_EXCEEDED:
            return ErrorSeverity.MEDIUM;

        case ErrorCode.BAD_REQUEST:
        case ErrorCode.VALIDATION_ERROR:
        case ErrorCode.NOT_FOUND:
        case ErrorCode.INVALID_STATE:
        case ErrorCode.EXPIRED_STATE:
            return ErrorSeverity.LOW;

        default:
            return ErrorSeverity.MEDIUM;
    }
}

/**
 * Convert error response to API Gateway response format
 */
export function toAPIGatewayResponse(
    errorResponse: ErrorResponse,
    statusCode?: number
): {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
} {
    // Determine HTTP status code from error code if not provided
    const httpStatusCode = statusCode || getHTTPStatusCode(errorResponse.error.code);

    return {
        statusCode: httpStatusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Trace-Id': errorResponse.error.details.traceId || '',
            'X-Correlation-Id': errorResponse.error.details.correlationId || '',
        },
        body: JSON.stringify(errorResponse),
    };
}

/**
 * Convert success response to API Gateway response format
 */
export function toAPIGatewaySuccessResponse<T>(
    successResponse: SuccessResponse<T>,
    statusCode: number = 200
): {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
} {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Trace-Id': successResponse.metadata?.traceId || '',
            'X-Correlation-Id': successResponse.metadata?.correlationId || '',
        },
        body: JSON.stringify(successResponse),
    };
}

/**
 * Get HTTP status code from error code
 */
function getHTTPStatusCode(code: ErrorCode | string): number {
    switch (code) {
        case ErrorCode.BAD_REQUEST:
        case ErrorCode.VALIDATION_ERROR:
            return 400;

        case ErrorCode.UNAUTHORIZED:
            return 401;

        case ErrorCode.FORBIDDEN:
            return 403;

        case ErrorCode.NOT_FOUND:
            return 404;

        case ErrorCode.CONFLICT:
            return 409;

        case ErrorCode.RATE_LIMIT_EXCEEDED:
            return 429;

        case ErrorCode.INTERNAL_ERROR:
        case ErrorCode.DATABASE_ERROR:
        case ErrorCode.AI_SERVICE_ERROR:
        case ErrorCode.INTEGRATION_ERROR:
        case ErrorCode.JOB_PROCESSING_ERROR:
            return 500;

        case ErrorCode.SERVICE_UNAVAILABLE:
            return 503;

        case ErrorCode.GATEWAY_TIMEOUT:
        case ErrorCode.JOB_TIMEOUT:
            return 504;

        default:
            return 500;
    }
}

/**
 * Create a user-friendly error message
 */
export function createUserFriendlyMessage(code: ErrorCode | string): string {
    switch (code) {
        case ErrorCode.SERVICE_UNAVAILABLE:
            return 'The service is temporarily unavailable. Please try again in a few moments.';

        case ErrorCode.AI_SERVICE_ERROR:
            return 'AI service is experiencing issues. Your request has been queued and will be processed shortly.';

        case ErrorCode.INTEGRATION_ERROR:
            return 'Unable to connect to external service. Please try again later.';

        case ErrorCode.RATE_LIMIT_EXCEEDED:
            return 'Too many requests. Please wait a moment before trying again.';

        case ErrorCode.VALIDATION_ERROR:
            return 'The provided information is invalid. Please check your input and try again.';

        case ErrorCode.UNAUTHORIZED:
            return 'Authentication required. Please sign in to continue.';

        case ErrorCode.FORBIDDEN:
            return 'You do not have permission to perform this action.';

        case ErrorCode.NOT_FOUND:
            return 'The requested resource was not found.';

        case ErrorCode.GATEWAY_TIMEOUT:
            return 'The request took too long to process. Please try again.';

        default:
            return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
}
