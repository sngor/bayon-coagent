/**
 * Middleware Error Handler
 * 
 * Provides centralized error handling for middleware with proper logging,
 * graceful degradation, and user-friendly error responses.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface MiddlewareError extends Error {
    code?: string;
    statusCode?: number;
    retryable?: boolean;
}

export interface ErrorContext {
    pathname: string;
    method: string;
    userAgent?: string;
    ipAddress?: string;
    correlationId?: string;
}

/**
 * Create error context from request
 */
function createErrorContext(request: NextRequest): ErrorContext {
    return {
        pathname: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            undefined,
        correlationId: crypto.randomUUID(),
    };
}

/**
 * Log middleware errors with structured data
 */
function logMiddlewareError(
    error: MiddlewareError,
    context: ErrorContext,
    handlerName: string
): void {
    const logData = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        source: 'middleware',
        handler: handlerName,
        error: {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack,
            retryable: error.retryable,
        },
        context,
    };

    console.error('[MIDDLEWARE_ERROR]', JSON.stringify(logData, null, 2));
}

/**
 * Create error response based on error type
 */
function createErrorResponse(
    error: MiddlewareError,
    context: ErrorContext
): NextResponse {
    // Determine status code
    const statusCode = error.statusCode || 500;

    // Create user-friendly error message
    let message: string;
    let details: string | undefined;

    switch (error.code) {
        case 'AUTH_FAILED':
            message = 'Authentication failed. Please sign in again.';
            break;
        case 'RATE_LIMIT_EXCEEDED':
            message = 'Too many requests. Please try again later.';
            break;
        case 'INVALID_TOKEN':
            message = 'Invalid or expired access token.';
            break;
        case 'NETWORK_ERROR':
            message = 'Network error. Please check your connection and try again.';
            details = error.retryable ? 'This error is temporary and may resolve on retry.' : undefined;
            break;
        default:
            message = statusCode >= 500
                ? 'An internal error occurred. Please try again later.'
                : 'Request could not be processed.';
    }

    const responseBody = {
        error: true,
        message,
        details,
        correlationId: context.correlationId,
        timestamp: new Date().toISOString(),
    };

    return new NextResponse(
        JSON.stringify(responseBody),
        {
            status: statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Correlation-Id': context.correlationId || '',
                'X-Error-Code': error.code || 'UNKNOWN',
            },
        }
    );
}

/**
 * Middleware error handler wrapper
 */
export function withErrorHandler<T extends any[], R>(
    handler: (...args: T) => Promise<R>,
    handlerName: string
) {
    return async (...args: T): Promise<R | NextResponse> => {
        const request = args[0] as NextRequest;
        const context = createErrorContext(request);

        try {
            return await handler(...args);
        } catch (error) {
            const middlewareError = error as MiddlewareError;

            // Log the error
            logMiddlewareError(middlewareError, context, handlerName);

            // For certain errors, return error response
            if (middlewareError.statusCode && middlewareError.statusCode < 500) {
                return createErrorResponse(middlewareError, context);
            }

            // For server errors, implement graceful degradation
            console.warn(`[MIDDLEWARE] Graceful degradation for ${handlerName}:`, error);

            // Return null to continue processing (graceful degradation)
            return null as R;
        }
    };
}

/**
 * Create a retryable error
 */
export function createRetryableError(
    message: string,
    code: string,
    statusCode?: number
): MiddlewareError {
    const error = new Error(message) as MiddlewareError;
    error.code = code;
    error.statusCode = statusCode;
    error.retryable = true;
    return error;
}

/**
 * Create a non-retryable error
 */
export function createFatalError(
    message: string,
    code: string,
    statusCode?: number
): MiddlewareError {
    const error = new Error(message) as MiddlewareError;
    error.code = code;
    error.statusCode = statusCode;
    error.retryable = false;
    return error;
}