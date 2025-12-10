/**
 * Unified Error Handling System
 * 
 * Provides consistent error handling across all services
 * Follows the established patterns from billing-errors.ts
 */

import { z } from 'zod';

export class ServiceError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 500,
        public readonly service: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'ServiceError';
    }
}

export class ValidationError extends ServiceError {
    constructor(message: string, validationErrors: z.ZodError, service: string) {
        super(message, 'validation_error', 400, service, {
            fieldErrors: validationErrors.flatten().fieldErrors,
        });
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends ServiceError {
    constructor(message: string = 'Authentication required', service: string) {
        super(message, 'authentication_required', 401, service);
        this.name = 'AuthenticationError';
    }
}

export class RateLimitError extends ServiceError {
    constructor(message: string, resetTime: number, service: string) {
        super(message, 'rate_limit_exceeded', 429, service, { resetTime });
        this.name = 'RateLimitError';
    }
}

export class ExternalServiceError extends ServiceError {
    constructor(message: string, externalService: string, service: string, originalError?: any) {
        super(message, 'external_service_error', 502, service, {
            externalService,
            originalError: originalError?.message,
        });
        this.name = 'ExternalServiceError';
    }
}

/**
 * Standard action response format
 */
export interface ActionResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, string[]>;
}

/**
 * Convert service errors to action responses
 */
export function serviceErrorToActionResponse(error: ServiceError): ActionResponse {
    const isDev = process.env.NODE_ENV === 'development';

    return {
        success: false,
        message: error.message,
        errors: {
            [error.code]: [error.message],
            ...(isDev && error.details ? { details: [JSON.stringify(error.details)] } : {}),
        },
    };
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends any[], R>(
    fn: (...args: T) => Promise<ActionResponse<R>>,
    serviceName: string
) {
    return async (...args: T): Promise<ActionResponse<R>> => {
        try {
            return await fn(...args);
        } catch (error) {
            console.error(`[${serviceName}] Error:`, error);

            if (error instanceof ServiceError) {
                return serviceErrorToActionResponse(error);
            }

            if (error instanceof z.ZodError) {
                const validationError = new ValidationError(
                    'Invalid input provided',
                    error,
                    serviceName
                );
                return serviceErrorToActionResponse(validationError);
            }

            // Generic error
            const genericError = new ServiceError(
                'An unexpected error occurred',
                'internal_error',
                500,
                serviceName,
                { originalError: error instanceof Error ? error.message : String(error) }
            );

            return serviceErrorToActionResponse(genericError);
        }
    };
}

/**
 * AWS-specific error mapping (from existing handleAWSError)
 */
export function mapAWSError(error: any, service: string): ServiceError {
    const isDev = process.env.NODE_ENV === 'development';
    const originalErrorMessage = error instanceof Error ? error.message : String(error);

    if (error instanceof Error) {
        const lowerCaseMessage = error.message.toLowerCase();

        // Bedrock-specific errors
        if (lowerCaseMessage.includes('throttl') || lowerCaseMessage.includes('rate')) {
            return new RateLimitError(
                'The AI service is currently busy. Please try again in a moment.',
                Date.now() + 60000, // 1 minute
                service
            );
        }

        if (lowerCaseMessage.includes('filtered') || lowerCaseMessage.includes('content policy')) {
            return new ServiceError(
                'The AI was unable to process this request due to safety filters. Please try a different topic.',
                'content_filtered',
                400,
                service
            );
        }

        if (lowerCaseMessage.includes('validation') || lowerCaseMessage.includes('invalid')) {
            return new ServiceError(
                'The request contains invalid data. Please check your input and try again.',
                'invalid_request',
                400,
                service
            );
        }

        if (lowerCaseMessage.includes('timeout') || lowerCaseMessage.includes('timed out')) {
            return new ServiceError(
                'The request took too long to process. Please try again.',
                'timeout',
                408,
                service
            );
        }

        // DynamoDB errors
        if (lowerCaseMessage.includes('dynamodb') || lowerCaseMessage.includes('provisioned throughput')) {
            return new ExternalServiceError(
                'Database service is temporarily unavailable. Please try again.',
                'DynamoDB',
                service,
                error
            );
        }

        // S3 errors
        if (lowerCaseMessage.includes('s3') || lowerCaseMessage.includes('bucket')) {
            return new ExternalServiceError(
                'File storage service is temporarily unavailable. Please try again.',
                'S3',
                service,
                error
            );
        }
    }

    // Generic AWS error
    return new ExternalServiceError(
        'AWS service error occurred',
        'AWS',
        service,
        error
    );
}