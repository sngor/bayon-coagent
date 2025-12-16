/**
 * Centralized Error Handling for Lambda Functions
 * Provides consistent error handling, logging, and response formatting
 */

import { APIGatewayProxyResult } from 'aws-lambda';

export interface ErrorContext {
    functionName: string;
    connectionId?: string;
    userId?: string;
    roomId?: string;
    resourceId?: string;
    action?: string;
}

export interface ErrorResponse {
    statusCode: number;
    body: string;
}

export class RealtimeError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isRetryable: boolean;

    constructor(
        message: string,
        code: string = 'UNKNOWN_ERROR',
        statusCode: number = 500,
        isRetryable: boolean = false
    ) {
        super(message);
        this.name = 'RealtimeError';
        this.code = code;
        this.statusCode = statusCode;
        this.isRetryable = isRetryable;
    }
}

/**
 * Common error types for real-time operations
 */
export const ErrorCodes = {
    // Connection errors
    CONNECTION_NOT_FOUND: 'CONNECTION_NOT_FOUND',
    INVALID_CONNECTION: 'INVALID_CONNECTION',
    CONNECTION_STALE: 'CONNECTION_STALE',

    // Authentication errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    SESSION_EXPIRED: 'SESSION_EXPIRED',

    // Validation errors
    INVALID_REQUEST: 'INVALID_REQUEST',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_ROOM_ID: 'INVALID_ROOM_ID',

    // Database errors
    DYNAMODB_ERROR: 'DYNAMODB_ERROR',
    ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
    CONDITIONAL_CHECK_FAILED: 'CONDITIONAL_CHECK_FAILED',

    // WebSocket errors
    WEBSOCKET_SEND_FAILED: 'WEBSOCKET_SEND_FAILED',
    BROADCAST_FAILED: 'BROADCAST_FAILED',

    // Rate limiting
    RATE_LIMITED: 'RATE_LIMITED',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS'
} as const;

/**
 * Maps AWS SDK errors to our error codes
 */
function mapAWSError(error: any): RealtimeError {
    const message = error.message || 'Unknown AWS error';

    switch (error.name) {
        case 'ResourceNotFoundException':
        case 'ItemNotFoundException':
            return new RealtimeError(
                'Resource not found',
                ErrorCodes.ITEM_NOT_FOUND,
                404,
                false
            );

        case 'ConditionalCheckFailedException':
            return new RealtimeError(
                'Conditional check failed',
                ErrorCodes.CONDITIONAL_CHECK_FAILED,
                409,
                false
            );

        case 'ValidationException':
            return new RealtimeError(
                'Invalid request parameters',
                ErrorCodes.INVALID_REQUEST,
                400,
                false
            );

        case 'ThrottlingException':
        case 'ProvisionedThroughputExceededException':
            return new RealtimeError(
                'Request rate exceeded',
                ErrorCodes.RATE_LIMITED,
                429,
                true
            );

        case 'GoneException':
            return new RealtimeError(
                'WebSocket connection is stale',
                ErrorCodes.CONNECTION_STALE,
                410,
                false
            );

        case 'UnauthorizedException':
        case 'AccessDeniedException':
            return new RealtimeError(
                'Unauthorized access',
                ErrorCodes.UNAUTHORIZED,
                401,
                false
            );

        default:
            return new RealtimeError(
                message,
                ErrorCodes.DYNAMODB_ERROR,
                500,
                true
            );
    }
}

/**
 * Handles errors and returns appropriate API Gateway response
 */
export function handleError(
    error: unknown,
    context: ErrorContext,
    defaultMessage: string = 'Internal server error'
): APIGatewayProxyResult {
    let realtimeError: RealtimeError;

    if (error instanceof RealtimeError) {
        realtimeError = error;
    } else if (error instanceof Error) {
        // Check if it's an AWS SDK error
        if ('name' in error && typeof error.name === 'string') {
            realtimeError = mapAWSError(error);
        } else {
            realtimeError = new RealtimeError(
                error.message || defaultMessage,
                'UNKNOWN_ERROR',
                500,
                false
            );
        }
    } else {
        realtimeError = new RealtimeError(
            defaultMessage,
            'UNKNOWN_ERROR',
            500,
            false
        );
    }

    // Log error with context
    console.error('Lambda function error:', {
        error: {
            message: realtimeError.message,
            code: realtimeError.code,
            statusCode: realtimeError.statusCode,
            isRetryable: realtimeError.isRetryable,
            stack: realtimeError.stack
        },
        context,
        originalError: error
    });

    // Return API Gateway response
    return {
        statusCode: realtimeError.statusCode,
        body: JSON.stringify({
            error: realtimeError.code,
            message: realtimeError.message,
            timestamp: Date.now(),
            isRetryable: realtimeError.isRetryable,
            ...(process.env.NODE_ENV === 'development' && {
                context,
                stack: realtimeError.stack
            })
        })
    };
}

/**
 * Validates required fields in request body
 */
export function validateRequiredFields(
    body: any,
    requiredFields: string[]
): void {
    const missing = requiredFields.filter(field => !body[field]);

    if (missing.length > 0) {
        throw new RealtimeError(
            `Missing required fields: ${missing.join(', ')}`,
            ErrorCodes.MISSING_REQUIRED_FIELD,
            400,
            false
        );
    }
}

/**
 * Wraps a Lambda handler with error handling
 */
export function withErrorHandling<T extends any[], R>(
    handler: (...args: T) => Promise<R>,
    context: Partial<ErrorContext>
) {
    return async (...args: T): Promise<R | APIGatewayProxyResult> => {
        try {
            return await handler(...args);
        } catch (error) {
            return handleError(error, context as ErrorContext);
        }
    };
}