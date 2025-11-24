/**
 * Comprehensive Error Handling Framework
 * 
 * Provides enterprise-grade error handling with:
 * - Structured try-catch blocks with context preservation
 * - Intelligent exponential backoff with jitter for retry scenarios
 * - User-friendly error messages with actionable recovery suggestions
 * - Graceful degradation with fallback mechanisms for service outages
 * - Comprehensive logging and monitoring integration
 * 
 * Validates: All requirements with focus on reliability and user experience
 */

import { retryWithBackoff, handleError, ErrorCategory, type ErrorContext, type RecoveryAction } from './error-handling';

// ============================================================================
// Enhanced Error Types
// ============================================================================

export interface ServiceError extends Error {
    code: string;
    category: ErrorCategory;
    context: ErrorContext;
    retryable: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userMessage: string;
    suggestedActions: string[];
    recoveryActions?: RecoveryAction[];
    originalError?: Error;
}

export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: ServiceError;
    message?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface RetryableOperation<T> {
    operation: () => Promise<T>;
    context: ErrorContext;
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    retryCondition?: (error: Error, attempt: number) => boolean;
    onRetry?: (error: Error, attempt: number) => void;
    fallback?: () => Promise<T>;
}

export interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
}

export interface FallbackConfig<T> {
    enabled: boolean;
    fallbackValue?: T;
    fallbackFunction?: () => Promise<T>;
    cacheKey?: string;
    cacheTTL?: number;
}

// ============================================================================
// Service Error Factory
// ============================================================================

export class ServiceErrorFactory {
    static create(
        message: string,
        code: string,
        category: ErrorCategory,
        context: ErrorContext,
        options: {
            retryable?: boolean;
            severity?: 'low' | 'medium' | 'high' | 'critical';
            userMessage?: string;
            suggestedActions?: string[];
            recoveryActions?: RecoveryAction[];
            originalError?: Error;
        } = {}
    ): ServiceError {
        const error = new Error(message) as ServiceError;

        error.code = code;
        error.category = category;
        error.context = context;
        error.retryable = options.retryable ?? this.isRetryableByCategory(category);
        error.severity = options.severity ?? this.getSeverityByCategory(category);
        error.userMessage = options.userMessage ?? this.getUserMessageByCategory(category, message);
        error.suggestedActions = options.suggestedActions ?? this.getSuggestedActionsByCategory(category);
        error.recoveryActions = options.recoveryActions;
        error.originalError = options.originalError;

        return error;
    }

    private static isRetryableByCategory(category: ErrorCategory): boolean {
        return [
            ErrorCategory.NETWORK,
            ErrorCategory.AI_OPERATION,
            ErrorCategory.DATABASE,
            ErrorCategory.SERVER_ERROR,
            ErrorCategory.RATE_LIMIT
        ].includes(category);
    }

    private static getSeverityByCategory(category: ErrorCategory): 'low' | 'medium' | 'high' | 'critical' {
        switch (category) {
            case ErrorCategory.VALIDATION:
            case ErrorCategory.NOT_FOUND:
                return 'low';
            case ErrorCategory.NETWORK:
            case ErrorCategory.RATE_LIMIT:
                return 'medium';
            case ErrorCategory.AUTHENTICATION:
            case ErrorCategory.AUTHORIZATION:
            case ErrorCategory.AI_OPERATION:
                return 'high';
            case ErrorCategory.DATABASE:
            case ErrorCategory.SERVER_ERROR:
                return 'critical';
            default:
                return 'medium';
        }
    }

    private static getUserMessageByCategory(category: ErrorCategory, originalMessage: string): string {
        switch (category) {
            case ErrorCategory.NETWORK:
                return 'Unable to connect to the server. Please check your internet connection.';
            case ErrorCategory.AUTHENTICATION:
                return 'Authentication failed. Please sign in again.';
            case ErrorCategory.AUTHORIZATION:
                return 'You don\'t have permission to perform this action.';
            case ErrorCategory.VALIDATION:
                return 'Some information is missing or incorrect. Please review and try again.';
            case ErrorCategory.AI_OPERATION:
                return 'AI operation failed. This is usually temporary.';
            case ErrorCategory.DATABASE:
                return 'Unable to access your data right now. Please try again.';
            case ErrorCategory.RATE_LIMIT:
                return 'Too many requests. Please wait a moment and try again.';
            case ErrorCategory.NOT_FOUND:
                return 'The requested resource could not be found.';
            case ErrorCategory.SERVER_ERROR:
                return 'Something went wrong on our end. We\'re working on it.';
            default:
                return originalMessage || 'An unexpected error occurred.';
        }
    }

    private static getSuggestedActionsByCategory(category: ErrorCategory): string[] {
        switch (category) {
            case ErrorCategory.NETWORK:
                return [
                    'Check your internet connection',
                    'Try refreshing the page',
                    'Wait a moment and try again'
                ];
            case ErrorCategory.AUTHENTICATION:
                return [
                    'Sign in again',
                    'Check your credentials',
                    'Use the "Forgot Password" option if needed'
                ];
            case ErrorCategory.AUTHORIZATION:
                return [
                    'Contact your administrator for access',
                    'Ensure you\'re signed in to the correct account',
                    'Upgrade your plan if needed'
                ];
            case ErrorCategory.VALIDATION:
                return [
                    'Check all required fields are filled',
                    'Ensure data is in the correct format',
                    'Review any highlighted errors'
                ];
            case ErrorCategory.AI_OPERATION:
                return [
                    'Try again in a moment',
                    'Simplify your request if it\'s complex',
                    'Contact support if this continues'
                ];
            case ErrorCategory.DATABASE:
                return [
                    'Try refreshing the page',
                    'Wait a moment and try again',
                    'Contact support if this persists'
                ];
            case ErrorCategory.RATE_LIMIT:
                return [
                    'Wait a few minutes before trying again',
                    'Avoid rapid repeated attempts',
                    'Contact support if this persists'
                ];
            case ErrorCategory.NOT_FOUND:
                return [
                    'Check the URL for typos',
                    'Return to the dashboard',
                    'Contact support if you believe this is an error'
                ];
            case ErrorCategory.SERVER_ERROR:
                return [
                    'Try again in a few minutes',
                    'Check our status page for updates',
                    'Contact support if this continues'
                ];
            default:
                return [
                    'Try again',
                    'Refresh the page',
                    'Contact support if this persists'
                ];
        }
    }
}

// ============================================================================
// Circuit Breaker Pattern
// ============================================================================

export class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private state: 'closed' | 'open' | 'half-open' = 'closed';

    constructor(private config: CircuitBreakerConfig) { }

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
                this.state = 'half-open';
            } else {
                throw ServiceErrorFactory.create(
                    'Service temporarily unavailable',
                    'CIRCUIT_BREAKER_OPEN',
                    ErrorCategory.SERVER_ERROR,
                    { operation: 'circuit_breaker', timestamp: new Date() },
                    {
                        userMessage: 'This service is temporarily unavailable. Please try again later.',
                        suggestedActions: ['Wait a few minutes and try again', 'Contact support if this persists']
                    }
                );
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.failures = 0;
        this.state = 'closed';
    }

    private onFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.config.failureThreshold) {
            this.state = 'open';
        }
    }

    getState(): 'closed' | 'open' | 'half-open' {
        return this.state;
    }

    getFailureCount(): number {
        return this.failures;
    }
}

// ============================================================================
// Enhanced Service Wrapper
// ============================================================================

export class ServiceWrapper {
    private circuitBreakers = new Map<string, CircuitBreaker>();
    private fallbackCache = new Map<string, { value: any; timestamp: number; ttl: number }>();

    /**
     * Execute a service operation with comprehensive error handling
     */
    async execute<T>(
        operation: RetryableOperation<T>,
        fallbackConfig?: FallbackConfig<T>
    ): Promise<ServiceResult<T>> {
        const startTime = Date.now();

        try {
            // Get or create circuit breaker for this operation
            const circuitBreaker = this.getCircuitBreaker(operation.context.operation);

            // Execute with circuit breaker protection
            const result = await circuitBreaker.execute(async () => {
                return await retryWithBackoff(
                    operation.operation,
                    {
                        maxAttempts: operation.maxRetries ?? 3,
                        baseDelay: operation.baseDelay ?? 1000,
                        maxDelay: operation.maxDelay ?? 30000,
                        backoffMultiplier: 2,
                        onRetry: (attempt, error) => {
                            console.warn(`Retry attempt ${attempt} for ${operation.context.operation}:`, error.message);
                            operation.onRetry?.(error, attempt);
                        }
                    }
                );
            });

            return {
                success: true,
                data: result,
                message: 'Operation completed successfully',
                timestamp: new Date(),
                metadata: {
                    executionTime: Date.now() - startTime,
                    circuitBreakerState: circuitBreaker.getState()
                }
            };

        } catch (error) {
            const serviceError = this.processError(error as Error, operation.context);

            // Try fallback if configured and error is not retryable
            if (fallbackConfig?.enabled && (!serviceError.retryable || fallbackConfig.fallbackFunction)) {
                try {
                    const fallbackResult = await this.executeFallback(fallbackConfig);

                    return {
                        success: true,
                        data: fallbackResult,
                        message: 'Operation completed using fallback',
                        timestamp: new Date(),
                        metadata: {
                            executionTime: Date.now() - startTime,
                            usedFallback: true,
                            originalError: serviceError.message
                        }
                    };
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                }
            }

            // Log error for monitoring
            this.logError(serviceError, operation.context);

            return {
                success: false,
                error: serviceError,
                message: serviceError.userMessage,
                timestamp: new Date(),
                metadata: {
                    executionTime: Date.now() - startTime,
                    errorCode: serviceError.code,
                    severity: serviceError.severity
                }
            };
        }
    }

    /**
     * Execute operation with graceful degradation
     */
    async executeWithGracefulDegradation<T>(
        primaryOperation: () => Promise<T>,
        fallbackOperation: () => Promise<T>,
        context: ErrorContext
    ): Promise<ServiceResult<T>> {
        try {
            const result = await this.execute({
                operation: primaryOperation,
                context,
                maxRetries: 2
            });

            if (result.success) {
                return result;
            }

            // Primary failed, try fallback
            console.warn(`Primary operation failed for ${context.operation}, trying fallback`);

            const fallbackResult = await fallbackOperation();

            return {
                success: true,
                data: fallbackResult,
                message: 'Operation completed using fallback service',
                timestamp: new Date(),
                metadata: {
                    usedFallback: true,
                    primaryError: result.error?.message
                }
            };

        } catch (error) {
            const serviceError = this.processError(error as Error, context);

            return {
                success: false,
                error: serviceError,
                message: serviceError.userMessage,
                timestamp: new Date()
            };
        }
    }

    private getCircuitBreaker(operationName: string): CircuitBreaker {
        if (!this.circuitBreakers.has(operationName)) {
            this.circuitBreakers.set(operationName, new CircuitBreaker({
                failureThreshold: 5,
                resetTimeout: 60000, // 1 minute
                monitoringPeriod: 300000 // 5 minutes
            }));
        }
        return this.circuitBreakers.get(operationName)!;
    }

    private async executeFallback<T>(config: FallbackConfig<T>): Promise<T> {
        // Try cached value first
        if (config.cacheKey) {
            const cached = this.fallbackCache.get(config.cacheKey);
            if (cached && Date.now() - cached.timestamp < cached.ttl) {
                return cached.value;
            }
        }

        // Execute fallback function
        if (config.fallbackFunction) {
            const result = await config.fallbackFunction();

            // Cache result if configured
            if (config.cacheKey && config.cacheTTL) {
                this.fallbackCache.set(config.cacheKey, {
                    value: result,
                    timestamp: Date.now(),
                    ttl: config.cacheTTL
                });
            }

            return result;
        }

        // Return fallback value
        if (config.fallbackValue !== undefined) {
            return config.fallbackValue;
        }

        throw new Error('No fallback configured');
    }

    private processError(error: Error, context: ErrorContext): ServiceError {
        // If already a ServiceError, return as-is
        if ('code' in error && 'category' in error) {
            return error as ServiceError;
        }

        // Detect error pattern and create ServiceError
        const pattern = handleError(error, { showToast: false, logError: false });

        return ServiceErrorFactory.create(
            error.message,
            this.generateErrorCode(pattern.category, context.operation),
            pattern.category,
            context,
            {
                userMessage: pattern.userMessage,
                suggestedActions: pattern.suggestedActions,
                originalError: error
            }
        );
    }

    private generateErrorCode(category: ErrorCategory, operation: string): string {
        const categoryCode = category.toUpperCase().replace('_', '');
        const operationCode = operation.toUpperCase().replace(/[^A-Z0-9]/g, '');
        return `${categoryCode}_${operationCode}`;
    }

    private logError(error: ServiceError, context: ErrorContext): void {
        const logData = {
            timestamp: new Date().toISOString(),
            error: {
                code: error.code,
                message: error.message,
                category: error.category,
                severity: error.severity,
                stack: error.stack
            },
            context,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
            url: typeof window !== 'undefined' ? window.location.href : 'server'
        };

        // Log to console (in production, this would go to CloudWatch)
        if (error.severity === 'critical' || error.severity === 'high') {
            console.error('[CRITICAL ERROR]', logData);
        } else {
            console.warn('[ERROR]', logData);
        }

        // In production, send to monitoring service
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
            // Send to error tracking service (e.g., Sentry, CloudWatch)
            this.sendToMonitoring(logData);
        }
    }

    private sendToMonitoring(logData: any): void {
        // Implementation would send to CloudWatch, Sentry, or other monitoring service
        // For now, just log to console
        console.log('[MONITORING]', logData);
    }

    /**
     * Clear fallback cache
     */
    clearFallbackCache(cacheKey?: string): void {
        if (cacheKey) {
            this.fallbackCache.delete(cacheKey);
        } else {
            this.fallbackCache.clear();
        }
    }

    /**
     * Get circuit breaker status for monitoring
     */
    getCircuitBreakerStatus(): Record<string, { state: string; failures: number }> {
        const status: Record<string, { state: string; failures: number }> = {};

        this.circuitBreakers.forEach((breaker, name) => {
            status[name] = {
                state: breaker.getState(),
                failures: breaker.getFailureCount()
            };
        });

        return status;
    }
}

// ============================================================================
// Global Service Wrapper Instance
// ============================================================================

export const serviceWrapper = new ServiceWrapper();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Execute a service operation with automatic error handling
 */
export async function executeService<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options: {
        maxRetries?: number;
        fallback?: FallbackConfig<T>;
        gracefulDegradation?: () => Promise<T>;
    } = {}
): Promise<ServiceResult<T>> {
    if (options.gracefulDegradation) {
        return serviceWrapper.executeWithGracefulDegradation(
            operation,
            options.gracefulDegradation,
            context
        );
    }

    return serviceWrapper.execute(
        {
            operation,
            context,
            maxRetries: options.maxRetries
        },
        options.fallback
    );
}

/**
 * Create a service error with proper categorization
 */
export function createServiceError(
    message: string,
    operation: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    originalError?: Error
): ServiceError {
    return ServiceErrorFactory.create(
        message,
        `${category.toUpperCase()}_${operation.toUpperCase()}`,
        category,
        { operation, timestamp: new Date() },
        { originalError }
    );
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    operation: string
) {
    return async (...args: T): Promise<ServiceResult<R>> => {
        return executeService(
            () => fn(...args),
            { operation, timestamp: new Date() }
        );
    };
}