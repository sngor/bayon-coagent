/**
 * Centralized error handling for learning operations
 */

import { ZodError } from 'zod';

export interface LearningError {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
}

export type LearningResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
    code?: string;
};

export class LearningErrorHandler {
    static handleAuthError(): LearningResult<never> {
        return { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' };
    }

    static handleValidationError(error: ZodError): LearningResult<never> {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return {
            success: false,
            error: `Validation failed: ${messages.join(', ')}`,
            code: 'VALIDATION_ERROR'
        };
    }

    static handleDatabaseError(operation: string, error: any): LearningResult<never> {
        console.error(`Database ${operation} error:`, error);

        // Log to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            // TODO: Integrate with CloudWatch or error tracking service
        }

        return {
            success: false,
            error: `Database operation failed: ${operation}`,
            code: 'DATABASE_ERROR'
        };
    }

    static handleGenericError(operation: string, error: any): LearningResult<never> {
        console.error(`${operation} error:`, error);

        // Extract meaningful error message
        let message = 'An unexpected error occurred';
        if (error instanceof Error) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }

        return {
            success: false,
            error: `${operation} failed: ${message}`,
            code: 'GENERIC_ERROR'
        };
    }

    static handleNotFoundError(resource: string): LearningResult<never> {
        return {
            success: false,
            error: `${resource} not found`,
            code: 'NOT_FOUND'
        };
    }
}

/**
 * Wrapper for learning operations with consistent error handling
 */
export async function withLearningErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>
): Promise<LearningResult<T>> {
    try {
        const data = await fn();
        return { success: true, data };
    } catch (error) {
        if (error instanceof ZodError) {
            return LearningErrorHandler.handleValidationError(error);
        }
        return LearningErrorHandler.handleGenericError(operation, error);
    }
}

/**
 * Type guard for learning results
 */
export function isLearningSuccess<T>(result: LearningResult<T>): result is { success: true; data: T } {
    return result.success;
}

/**
 * Extract error message from learning result
 */
export function getLearningError<T>(result: LearningResult<T>): string | null {
    return result.success ? null : result.error;
}