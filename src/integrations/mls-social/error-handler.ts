/**
 * MLS Social Integration Error Handler
 * 
 * Comprehensive error handling and logging for MLS and social media integrations.
 * Provides user-friendly error messages, retry mechanisms, and graceful degradation.
 * 
 * Requirements Coverage:
 * - 1.3: Authentication error handling with clear messages
 * - 2.4: Retry logic with exponential backoff
 * - 6.3: OAuth failure handling
 * - 7.5: Failed post error logging and user notification
 * - 10.5: Image optimization failure handling
 */

import { createLogger, LogContext } from '@/aws/logging';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    LOW = 'LOW',           // Non-critical, can be ignored
    MEDIUM = 'MEDIUM',     // Important but not blocking
    HIGH = 'HIGH',         // Critical, requires attention
    CRITICAL = 'CRITICAL', // System-level failure
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
    AUTHENTICATION = 'AUTHENTICATION',
    NETWORK = 'NETWORK',
    VALIDATION = 'VALIDATION',
    RATE_LIMIT = 'RATE_LIMIT',
    PERMISSION = 'PERMISSION',
    NOT_FOUND = 'NOT_FOUND',
    TIMEOUT = 'TIMEOUT',
    EXTERNAL_API = 'EXTERNAL_API',
    INTERNAL = 'INTERNAL',
}

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;      // Base delay in milliseconds
    maxDelay: number;       // Maximum delay in milliseconds
    exponential: boolean;   // Use exponential backoff
    jitter: boolean;        // Add random jitter
}

/**
 * Default retry configurations by error category
 */
const DEFAULT_RETRY_CONFIGS: Record<ErrorCategory, RetryConfig> = {
    [ErrorCategory.AUTHENTICATION]: {
        maxAttempts: 1, // Don't retry auth failures
        baseDelay: 0,
        maxDelay: 0,
        exponential: false,
        jitter: false,
    },
    [ErrorCategory.NETWORK]: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        exponential: true,
        jitter: true,
    },
    [ErrorCategory.VALIDATION]: {
        maxAttempts: 1, // Don't retry validation errors
        baseDelay: 0,
        maxDelay: 0,
        exponential: false,
        jitter: false,
    },
    [ErrorCategory.RATE_LIMIT]: {
        maxAttempts: 5,
        baseDelay: 2000,
        maxDelay: 30000,
        exponential: true,
        jitter: true,
    },
    [ErrorCategory.PERMISSION]: {
        maxAttempts: 1, // Don't retry permission errors
        baseDelay: 0,
        maxDelay: 0,
        exponential: false,
        jitter: false,
    },
    [ErrorCategory.NOT_FOUND]: {
        maxAttempts: 1, // Don't retry not found errors
        baseDelay: 0,
        maxDelay: 0,
        exponential: false,
        jitter: false,
    },
    [ErrorCategory.TIMEOUT]: {
        maxAttempts: 3,
        baseDelay: 2000,
        maxDelay: 15000,
        exponential: true,
        jitter: true,
    },
    [ErrorCategory.EXTERNAL_API]: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        exponential: true,
        jitter: true,
    },
    [ErrorCategory.INTERNAL]: {
        maxAttempts: 2,
        baseDelay: 500,
        maxDelay: 5000,
        exponential: true,
        jitter: false,
    },
};

/**
 * Enhanced error class with additional context
 */
export class MLSSocialError extends Error {
    public readonly category: ErrorCategory;
    public readonly severity: ErrorSeverity;
    public readonly userMessage: string;
    public readonly retryable: boolean;
    public readonly context: Record<string, any>;
    public readonly timestamp: number;

    constructor(
        message: string,
        category: ErrorCategory,
        severity: ErrorSeverity,
        userMessage: string,
        retryable: boolean = false,
        context: Record<string, any> = {}
    ) {
        super(message);
        this.name = 'MLSSocialError';
        this.category = category;
        this.severity = severity;
        this.userMessage = userMessage;
        this.retryable = retryable;
        this.context = context;
        this.timestamp = Date.now();
    }
}

/**
 * Error handler class
 */
export class ErrorHandler {
    private logger = createLogger({ service: 'mls-social-integration' });

    /**
     * Handle an error with logging and user-friendly message generation
     * 
     * @param error - The error to handle
     * @param operation - The operation that failed
     * @param context - Additional context
     * @returns Enhanced error with user-friendly message
     */
    handle(
        error: Error | MLSSocialError,
        operation: string,
        context: LogContext = {}
    ): MLSSocialError {
        // If already an MLSSocialError, just log and return
        if (error instanceof MLSSocialError) {
            this.logError(error, operation, context);
            return error;
        }

        // Classify and enhance the error
        const enhancedError = this.classifyError(error, operation, context);
        this.logError(enhancedError, operation, context);

        return enhancedError;
    }

    /**
     * Classify an error and create an enhanced MLSSocialError
     */
    private classifyError(
        error: Error,
        operation: string,
        context: LogContext
    ): MLSSocialError {
        const errorMessage = error.message.toLowerCase();

        // Authentication errors (Requirement 1.3)
        if (
            errorMessage.includes('authentication') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('invalid credentials') ||
            errorMessage.includes('access denied')
        ) {
            return new MLSSocialError(
                error.message,
                ErrorCategory.AUTHENTICATION,
                ErrorSeverity.HIGH,
                'Authentication failed. Please check your credentials and try again.',
                false,
                { ...context, originalError: error.name }
            );
        }

        // OAuth errors (Requirement 6.3)
        if (
            errorMessage.includes('oauth') ||
            errorMessage.includes('token expired') ||
            errorMessage.includes('invalid token')
        ) {
            return new MLSSocialError(
                error.message,
                ErrorCategory.AUTHENTICATION,
                ErrorSeverity.HIGH,
                'Your social media connection has expired. Please reconnect your account in settings.',
                false,
                { ...context, originalError: error.name }
            );
        }

        // Rate limit errors (Requirement 2.4, 7.5)
        if (
            errorMessage.includes('rate limit') ||
            errorMessage.includes('too many requests') ||
            errorMessage.includes('quota exceeded')
        ) {
            return new MLSSocialError(
                error.message,
                ErrorCategory.RATE_LIMIT,
                ErrorSeverity.MEDIUM,
                'Service rate limit reached. Please wait a moment and try again.',
                true,
                { ...context, originalError: error.name }
            );
        }

        // Network errors (Requirement 2.4)
        if (
            errorMessage.includes('network') ||
            errorMessage.includes('econnrefused') ||
            errorMessage.includes('enotfound') ||
            errorMessage.includes('etimedout')
        ) {
            return new MLSSocialError(
                error.message,
                ErrorCategory.NETWORK,
                ErrorSeverity.MEDIUM,
                'Network connection failed. Please check your internet connection and try again.',
                true,
                { ...context, originalError: error.name }
            );
        }

        // Timeout errors
        if (
            errorMessage.includes('timeout') ||
            errorMessage.includes('timed out')
        ) {
            return new MLSSocialError(
                error.message,
                ErrorCategory.TIMEOUT,
                ErrorSeverity.MEDIUM,
                'The operation took too long to complete. Please try again.',
                true,
                { ...context, originalError: error.name }
            );
        }

        // Validation errors
        if (
            errorMessage.includes('validation') ||
            errorMessage.includes('invalid') ||
            errorMessage.includes('required')
        ) {
            return new MLSSocialError(
                error.message,
                ErrorCategory.VALIDATION,
                ErrorSeverity.LOW,
                'Invalid data provided. Please check your input and try again.',
                false,
                { ...context, originalError: error.name }
            );
        }

        // Permission errors
        if (
            errorMessage.includes('permission') ||
            errorMessage.includes('forbidden') ||
            errorMessage.includes('not allowed')
        ) {
            return new MLSSocialError(
                error.message,
                ErrorCategory.PERMISSION,
                ErrorSeverity.HIGH,
                'You do not have permission to perform this action. Please check your account settings.',
                false,
                { ...context, originalError: error.name }
            );
        }

        // Not found errors
        if (
            errorMessage.includes('not found') ||
            errorMessage.includes('does not exist')
        ) {
            return new MLSSocialError(
                error.message,
                ErrorCategory.NOT_FOUND,
                ErrorSeverity.LOW,
                'The requested resource was not found.',
                false,
                { ...context, originalError: error.name }
            );
        }

        // External API errors (Requirement 7.5, 10.5)
        if (
            errorMessage.includes('api error') ||
            errorMessage.includes('facebook') ||
            errorMessage.includes('instagram') ||
            errorMessage.includes('linkedin') ||
            errorMessage.includes('mls')
        ) {
            return new MLSSocialError(
                error.message,
                ErrorCategory.EXTERNAL_API,
                ErrorSeverity.MEDIUM,
                'An error occurred while communicating with the external service. Please try again later.',
                true,
                { ...context, originalError: error.name }
            );
        }

        // Default to internal error
        return new MLSSocialError(
            error.message,
            ErrorCategory.INTERNAL,
            ErrorSeverity.HIGH,
            'An unexpected error occurred. Our team has been notified.',
            true,
            { ...context, originalError: error.name, stack: error.stack }
        );
    }

    /**
     * Log an error with appropriate severity
     */
    private logError(
        error: MLSSocialError,
        operation: string,
        context: LogContext
    ): void {
        const logContext: LogContext = {
            ...context,
            operation,
            category: error.category,
            severity: error.severity,
            retryable: error.retryable,
            errorContext: error.context,
        };

        // Log based on severity
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
            case ErrorSeverity.HIGH:
                this.logger.error(error.message, error, logContext);
                break;
            case ErrorSeverity.MEDIUM:
                this.logger.warn(error.message, logContext);
                break;
            case ErrorSeverity.LOW:
                this.logger.info(error.message, logContext);
                break;
        }
    }

    /**
     * Execute an operation with retry logic
     * Requirement 2.4: Retry logic with exponential backoff
     * 
     * @param operation - The operation to execute
     * @param operationName - Name of the operation for logging
     * @param retryConfig - Optional custom retry configuration
     * @param context - Additional context for logging
     * @returns Result of the operation
     */
    async withRetry<T>(
        operation: () => Promise<T>,
        operationName: string,
        retryConfig?: Partial<RetryConfig>,
        context: LogContext = {}
    ): Promise<T> {
        let lastError: Error | null = null;
        let attempts = 0;

        // Default retry config
        const config: RetryConfig = {
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            exponential: true,
            jitter: true,
            ...retryConfig,
        };

        while (attempts < config.maxAttempts) {
            attempts++;

            try {
                this.logger.debug(`Attempting ${operationName} (attempt ${attempts}/${config.maxAttempts})`, {
                    ...context,
                    attempt: attempts,
                });

                const result = await operation();

                if (attempts > 1) {
                    this.logger.info(`${operationName} succeeded after ${attempts} attempts`, context);
                }

                return result;
            } catch (error) {
                lastError = error as Error;

                // Classify the error
                const enhancedError = this.handle(lastError, operationName, {
                    ...context,
                    attempt: attempts,
                });

                // Check if we should retry
                if (!enhancedError.retryable || attempts >= config.maxAttempts) {
                    throw enhancedError;
                }

                // Calculate delay
                const delay = this.calculateDelay(attempts, config);

                this.logger.warn(
                    `${operationName} failed, retrying in ${delay}ms`,
                    {
                        ...context,
                        attempt: attempts,
                        delay,
                        error: enhancedError.message,
                    }
                );

                // Wait before retrying
                await this.sleep(delay);
            }
        }

        // All attempts failed
        throw this.handle(
            lastError || new Error('Operation failed'),
            operationName,
            { ...context, attempts }
        );
    }

    /**
     * Calculate retry delay with exponential backoff and jitter
     */
    private calculateDelay(attempt: number, config: RetryConfig): number {
        let delay: number;

        if (config.exponential) {
            // Exponential backoff: baseDelay * 2^(attempt-1)
            delay = config.baseDelay * Math.pow(2, attempt - 1);
        } else {
            // Linear backoff
            delay = config.baseDelay * attempt;
        }

        // Cap at max delay
        delay = Math.min(delay, config.maxDelay);

        // Add jitter if enabled (random 0-25% of delay)
        if (config.jitter) {
            const jitterAmount = delay * 0.25 * Math.random();
            delay += jitterAmount;
        }

        return Math.floor(delay);
    }

    /**
     * Sleep utility for retry delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Execute an operation with graceful degradation
     * If the operation fails, return a fallback value instead of throwing
     * 
     * @param operation - The operation to execute
     * @param fallback - Fallback value if operation fails
     * @param operationName - Name of the operation for logging
     * @param context - Additional context for logging
     * @returns Result of operation or fallback value
     */
    async withGracefulDegradation<T>(
        operation: () => Promise<T>,
        fallback: T,
        operationName: string,
        context: LogContext = {}
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            const enhancedError = this.handle(
                error as Error,
                operationName,
                context
            );

            this.logger.warn(
                `${operationName} failed, using fallback`,
                {
                    ...context,
                    error: enhancedError.message,
                    fallbackUsed: true,
                }
            );

            return fallback;
        }
    }

    /**
     * Get retry configuration for an error category
     */
    getRetryConfig(category: ErrorCategory): RetryConfig {
        return DEFAULT_RETRY_CONFIGS[category];
    }
}

/**
 * Singleton error handler instance
 */
let errorHandlerInstance: ErrorHandler | null = null;

/**
 * Get the error handler instance
 */
export function getErrorHandler(): ErrorHandler {
    if (!errorHandlerInstance) {
        errorHandlerInstance = new ErrorHandler();
    }
    return errorHandlerInstance;
}

/**
 * Convenience function to handle errors
 */
export function handleError(
    error: Error,
    operation: string,
    context?: LogContext
): MLSSocialError {
    return getErrorHandler().handle(error, operation, context);
}

/**
 * Convenience function to execute with retry
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryConfig?: Partial<RetryConfig>,
    context?: LogContext
): Promise<T> {
    return getErrorHandler().withRetry(operation, operationName, retryConfig, context);
}

/**
 * Convenience function to execute with graceful degradation
 */
export async function withGracefulDegradation<T>(
    operation: () => Promise<T>,
    fallback: T,
    operationName: string,
    context?: LogContext
): Promise<T> {
    return getErrorHandler().withGracefulDegradation(
        operation,
        fallback,
        operationName,
        context
    );
}
