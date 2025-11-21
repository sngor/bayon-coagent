/**
 * UI Error Handling for Market Intelligence Alerts
 * 
 * Provides user-friendly error messages and error boundary components
 * for alert-related UI components.
 */

import { createLogger } from '@/aws/logging/logger';
import { alertErrorHandler, createUserFriendlyMessage } from './error-handling';

// ==================== Error Message Mappings ====================

export const UI_ERROR_MESSAGES = {
    // Authentication errors
    AUTH_REQUIRED: 'Please sign in to access alerts.',
    AUTH_EXPIRED: 'Your session has expired. Please sign in again.',

    // Network errors
    NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
    TIMEOUT_ERROR: 'The request took too long. Please try again.',

    // Data loading errors
    ALERTS_LOAD_FAILED: 'Unable to load alerts. Please refresh the page.',
    SETTINGS_LOAD_FAILED: 'Unable to load alert settings. Please try again.',
    PROFILE_LOAD_FAILED: 'Unable to load neighborhood profile. Please try again.',

    // Data saving errors
    SETTINGS_SAVE_FAILED: 'Unable to save alert settings. Please try again.',
    ALERT_UPDATE_FAILED: 'Unable to update alert. Please try again.',

    // Validation errors
    INVALID_TARGET_AREA: 'Please enter a valid location or ZIP code.',
    INVALID_PRICE_RANGE: 'Please enter a valid price range.',
    INVALID_LEAD_SCORE: 'Lead score must be between 50 and 90.',

    // External service errors
    MLS_SERVICE_ERROR: 'Real estate data service is temporarily unavailable.',
    DEMOGRAPHICS_SERVICE_ERROR: 'Demographics service is temporarily unavailable.',
    WALKABILITY_SERVICE_ERROR: 'Walkability service is temporarily unavailable.',

    // Generic errors
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    PROCESSING_ERROR: 'Unable to process your request. Please try again later.',
} as const;

// ==================== Error Severity Levels ====================

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface UIError {
    message: string;
    severity: ErrorSeverity;
    code?: string;
    retryable: boolean;
    timestamp: Date;
}

// ==================== Error Handler for UI Components ====================

export class UIErrorHandler {
    private logger = createLogger({ service: 'ui-error-handler' });

    /**
     * Converts any error to a user-friendly UI error
     */
    handleUIError(error: Error, context: { component: string; operation: string }): UIError {
        this.logger.error(`UI Error in ${context.component}`, error, {
            component: context.component,
            operation: context.operation,
        });

        // Get error handling result
        const result = alertErrorHandler.handleError(error, {
            operation: context.operation,
            component: context.component,
        });

        // Map to UI error
        return {
            message: result.userMessage,
            severity: this.mapLogLevelToSeverity(result.logLevel),
            retryable: result.shouldRetry,
            timestamp: new Date(),
        };
    }

    /**
     * Creates a user-friendly error for specific error types
     */
    createUIError(
        errorType: keyof typeof UI_ERROR_MESSAGES,
        severity: ErrorSeverity = 'error',
        retryable: boolean = true
    ): UIError {
        return {
            message: UI_ERROR_MESSAGES[errorType],
            severity,
            retryable,
            timestamp: new Date(),
        };
    }

    /**
     * Maps log level to UI severity
     */
    private mapLogLevelToSeverity(logLevel: 'WARN' | 'ERROR'): ErrorSeverity {
        switch (logLevel) {
            case 'WARN':
                return 'warning';
            case 'ERROR':
                return 'error';
            default:
                return 'error';
        }
    }
}

// ==================== Error Display Utilities ====================

/**
 * Gets CSS classes for error severity styling
 */
export function getSeverityStyles(severity: ErrorSeverity): string {
    switch (severity) {
        case 'info':
            return 'border-blue-200 bg-blue-50 text-blue-700';
        case 'warning':
            return 'border-yellow-200 bg-yellow-50 text-yellow-700';
        case 'error':
            return 'border-red-200 bg-red-50 text-red-700';
        case 'critical':
            return 'border-red-300 bg-red-100 text-red-800';
        default:
            return 'border-gray-200 bg-gray-50 text-gray-700';
    }
}

/**
 * Gets icon name for error severity
 */
export function getSeverityIcon(severity: ErrorSeverity): string {
    switch (severity) {
        case 'info':
            return 'information-circle';
        case 'warning':
            return 'exclamation-triangle';
        case 'error':
        case 'critical':
            return 'x-circle';
        default:
            return 'information-circle';
    }
}

// ==================== Error State Management ====================

export interface ErrorState {
    hasError: boolean;
    error?: UIError;
    retryCount: number;
    lastRetryAt?: Date;
}

export class ErrorStateManager {
    private state: ErrorState = {
        hasError: false,
        retryCount: 0,
    };

    private listeners: Array<(state: ErrorState) => void> = [];

    /**
     * Sets an error state
     */
    setError(error: UIError): void {
        this.state = {
            hasError: true,
            error,
            retryCount: this.state.retryCount,
            lastRetryAt: this.state.lastRetryAt,
        };
        this.notifyListeners();
    }

    /**
     * Clears the error state
     */
    clearError(): void {
        this.state = {
            hasError: false,
            retryCount: 0,
        };
        this.notifyListeners();
    }

    /**
     * Increments retry count
     */
    incrementRetry(): void {
        this.state = {
            ...this.state,
            retryCount: this.state.retryCount + 1,
            lastRetryAt: new Date(),
        };
        this.notifyListeners();
    }

    /**
     * Gets current error state
     */
    getState(): ErrorState {
        return { ...this.state };
    }

    /**
     * Subscribes to error state changes
     */
    subscribe(listener: (state: ErrorState) => void): () => void {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Notifies all listeners of state changes
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.state));
    }
}

// ==================== Hook for Error Handling ====================

export interface UseErrorHandlerReturn {
    handleError: (error: Error, context: { component: string; operation: string }) => UIError;
    createError: (errorType: keyof typeof UI_ERROR_MESSAGES, severity?: ErrorSeverity, retryable?: boolean) => UIError;
    errorState: ErrorState;
    setError: (error: UIError) => void;
    clearError: () => void;
    retry: () => void;
}

/**
 * Custom hook for error handling in React components
 * Note: This would need to be implemented as a proper React hook in a .tsx file
 */
export function createErrorHandler(): UseErrorHandlerReturn {
    const uiErrorHandler = new UIErrorHandler();
    const errorStateManager = new ErrorStateManager();

    return {
        handleError: (error: Error, context: { component: string; operation: string }) => {
            const uiError = uiErrorHandler.handleUIError(error, context);
            errorStateManager.setError(uiError);
            return uiError;
        },
        createError: (errorType: keyof typeof UI_ERROR_MESSAGES, severity: ErrorSeverity = 'error', retryable: boolean = true) => {
            const uiError = uiErrorHandler.createUIError(errorType, severity, retryable);
            errorStateManager.setError(uiError);
            return uiError;
        },
        errorState: errorStateManager.getState(),
        setError: (error: UIError) => errorStateManager.setError(error),
        clearError: () => errorStateManager.clearError(),
        retry: () => errorStateManager.incrementRetry(),
    };
}

// ==================== Singleton Instances ====================

export const uiErrorHandler = new UIErrorHandler();

// ==================== Utility Functions ====================

/**
 * Wraps an async function with UI error handling
 */
export function withUIErrorHandling<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: { component: string; operation: string }
): (...args: Parameters<T>) => Promise<{ data?: Awaited<ReturnType<T>>; error?: UIError }> {
    return async (...args: Parameters<T>) => {
        try {
            const data = await fn(...args);
            return { data };
        } catch (error) {
            const uiError = uiErrorHandler.handleUIError(error as Error, context);
            return { error: uiError };
        }
    };
}

/**
 * Creates a standardized error toast message
 */
export function createErrorToast(error: UIError): {
    title: string;
    description: string;
    variant: 'default' | 'destructive';
} {
    return {
        title: error.severity === 'critical' ? 'Critical Error' : 'Error',
        description: error.message,
        variant: error.severity === 'info' ? 'default' : 'destructive',
    };
}

/**
 * Formats error for logging
 */
export function formatErrorForLogging(error: UIError, context?: Record<string, any>): Record<string, any> {
    return {
        message: error.message,
        severity: error.severity,
        retryable: error.retryable,
        timestamp: error.timestamp.toISOString(),
        code: error.code,
        ...context,
    };
}

/**
 * Determines if an error should trigger a retry
 */
export function shouldRetryError(error: UIError, retryCount: number, maxRetries: number = 3): boolean {
    return error.retryable && retryCount < maxRetries;
}

/**
 * Calculates retry delay with exponential backoff
 */
export function calculateRetryDelay(retryCount: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
    const delay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    return Math.min(delay + jitter, maxDelay);
}

/**
 * Creates a user-friendly error message from any error
 */
export function createUserFriendlyErrorMessage(error: Error, operation: string): string {
    const result = alertErrorHandler.handleError(error, { operation });
    return result.userMessage;
}

/**
 * Validates error object structure
 */
export function isValidUIError(obj: any): obj is UIError {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.message === 'string' &&
        typeof obj.severity === 'string' &&
        ['info', 'warning', 'error', 'critical'].includes(obj.severity) &&
        typeof obj.retryable === 'boolean' &&
        obj.timestamp instanceof Date
    );
}

/**
 * Sanitizes error message for display
 */
export function sanitizeErrorMessage(message: string): string {
    // Remove technical details that might confuse users
    return message
        .replace(/Error:\s*/gi, '')
        .replace(/Exception:\s*/gi, '')
        .replace(/\b[A-Z][a-zA-Z]*Error\b/g, 'Error')
        .replace(/\b[A-Z][a-zA-Z]*Exception\b/g, 'Error')
        .trim();
}

/**
 * Groups similar errors together
 */
export function groupSimilarErrors(errors: UIError[]): Map<string, UIError[]> {
    const groups = new Map<string, UIError[]>();

    for (const error of errors) {
        const key = `${error.severity}-${error.message.substring(0, 50)}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(error);
    }

    return groups;
}

/**
 * Gets error statistics
 */
export function getErrorStatistics(errors: UIError[]): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    retryableCount: number;
    recentCount: number; // Last hour
} {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const stats = {
        total: errors.length,
        bySeverity: {
            info: 0,
            warning: 0,
            error: 0,
            critical: 0,
        } as Record<ErrorSeverity, number>,
        retryableCount: 0,
        recentCount: 0,
    };

    for (const error of errors) {
        stats.bySeverity[error.severity]++;
        if (error.retryable) stats.retryableCount++;
        if (error.timestamp > oneHourAgo) stats.recentCount++;
    }

    return stats;
}