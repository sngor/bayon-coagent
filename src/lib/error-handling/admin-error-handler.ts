/**
 * Admin Error Handler
 * 
 * Centralized error handling for admin operations
 */

export class AdminError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500,
        public context?: Record<string, any>
    ) {
        super(message);
        this.name = 'AdminError';
    }
}

export class BillingError extends AdminError {
    constructor(message: string, code: string, statusCode = 500, context?: Record<string, any>) {
        super(message, code, statusCode, context);
        this.name = 'BillingError';
    }
}

export class AnnouncementError extends AdminError {
    constructor(message: string, code: string, statusCode = 500, context?: Record<string, any>) {
        super(message, code, statusCode, context);
        this.name = 'AnnouncementError';
    }
}

export const AdminErrorCodes = {
    // Billing errors
    BILLING_METRICS_FAILED: 'BILLING_METRICS_FAILED',
    STRIPE_API_ERROR: 'STRIPE_API_ERROR',
    PAYMENT_RETRY_FAILED: 'PAYMENT_RETRY_FAILED',
    SUBSCRIPTION_CANCEL_FAILED: 'SUBSCRIPTION_CANCEL_FAILED',

    // Announcement errors
    ANNOUNCEMENT_CREATE_FAILED: 'ANNOUNCEMENT_CREATE_FAILED',
    ANNOUNCEMENT_SEND_FAILED: 'ANNOUNCEMENT_SEND_FAILED',
    INVALID_TARGET_AUDIENCE: 'INVALID_TARGET_AUDIENCE',

    // General admin errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

export function handleAdminError(error: unknown): {
    message: string;
    code: string;
    statusCode: number;
} {
    if (error instanceof AdminError) {
        return {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode
        };
    }

    if (error instanceof Error) {
        // Handle Stripe errors
        if (error.message.includes('stripe')) {
            return {
                message: 'Payment processing error occurred',
                code: AdminErrorCodes.STRIPE_API_ERROR,
                statusCode: 502
            };
        }

        // Handle validation errors
        if (error.message.includes('validation') || error.message.includes('required')) {
            return {
                message: error.message,
                code: AdminErrorCodes.VALIDATION_ERROR,
                statusCode: 400
            };
        }
    }

    // Default error
    return {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500
    };
}

export function logAdminError(error: AdminError, context?: Record<string, any>): void {
    console.error('Admin Error:', {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        context: { ...error.context, ...context },
        stack: error.stack
    });

    // In production, send to monitoring service
    // errorReportingService.captureException(error, { extra: context });
}