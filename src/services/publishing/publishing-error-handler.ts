/**
 * Enterprise-Grade Error Handling for Publishing Service
 * 
 * Implements comprehensive error handling with:
 * - Exponential backoff with jitter for failed publishes
 * - Intelligent retry logic (up to 3 attempts) with different strategies per error type
 * - Comprehensive CloudWatch logging with structured error context
 * - Content status updates with detailed failure reasons and recovery suggestions
 * - Circuit breaker pattern for platform outages
 * 
 * Validates: Requirements 1.5
 */

import { logger, createLogger } from '@/aws/logging/logger';
import type { LogContext } from '@/aws/logging/logger';
import { Platform } from '@/integrations/social/types';
import { ErrorCategory, detectErrorPattern, isRetryableError } from '@/lib/error-handling';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PublishingError extends Error {
    platform: Platform;
    operation: string;
    retryable: boolean;
    category: ErrorCategory;
    statusCode?: number;
    platformError?: any;
    context?: Record<string, any>;
}

export interface RetryConfig {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    jitterFactor: number; // 0-1, adds randomness to prevent thundering herd
}

export interface CircuitBreakerConfig {
    failureThreshold: number; // Number of failures before opening circuit
    recoveryTimeoutMs: number; // Time to wait before attempting recovery
    successThreshold: number; // Number of successes needed to close circuit
}

export interface ErrorStrategy {
    shouldRetry: boolean;
    retryConfig?: Partial<RetryConfig>;
    fallbackAction?: () => Promise<void>;
    userMessage: string;
    recoveryActions: string[];
}

export enum CircuitState {
    CLOSED = 'closed',     // Normal operation
    OPEN = 'open',         // Failing, rejecting requests
    HALF_OPEN = 'half_open' // Testing if service recovered
}

export interface CircuitBreakerState {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
    nextAttemptTime: number;
}

export interface PublishingResult {
    success: boolean;
    postId?: string;
    postUrl?: string;
    error?: PublishingError;
    attempts: number;
    totalDuration: number;
    circuitBreakerTriggered?: boolean;
}

// ============================================================================
// Error Classification and Strategy
// ============================================================================

const ERROR_STRATEGIES: Record<string, ErrorStrategy> = {
    // Network and connectivity errors - retry with backoff
    'network_error': {
        shouldRetry: true,
        retryConfig: { maxAttempts: 3, baseDelayMs: 1000, backoffMultiplier: 2 },
        userMessage: 'Connection issue detected. Retrying automatically...',
        recoveryActions: [
            'Check your internet connection',
            'Try again in a few minutes',
            'Contact support if this persists'
        ]
    },

    // Rate limiting - retry with longer delays
    'rate_limit': {
        shouldRetry: true,
        retryConfig: { maxAttempts: 3, baseDelayMs: 5000, backoffMultiplier: 3, maxDelayMs: 60000 },
        userMessage: 'Rate limit reached. Waiting before retry...',
        recoveryActions: [
            'Wait a few minutes before trying again',
            'Reduce posting frequency',
            'Upgrade your platform plan if needed'
        ]
    },

    // Authentication errors - don't retry, need user action
    'auth_error': {
        shouldRetry: false,
        userMessage: 'Authentication failed. Please reconnect your account.',
        recoveryActions: [
            'Reconnect your social media account',
            'Check account permissions',
            'Ensure account is still active'
        ]
    },

    // Platform API errors - retry once with short delay
    'platform_api_error': {
        shouldRetry: true,
        retryConfig: { maxAttempts: 2, baseDelayMs: 2000, backoffMultiplier: 2 },
        userMessage: 'Platform API issue. Retrying...',
        recoveryActions: [
            'Try again in a moment',
            'Check platform status page',
            'Contact support if this continues'
        ]
    },

    // Content validation errors - don't retry
    'content_validation': {
        shouldRetry: false,
        userMessage: 'Content validation failed. Please review and modify.',
        recoveryActions: [
            'Check content length limits',
            'Remove unsupported characters',
            'Ensure images meet platform requirements'
        ]
    },

    // Server errors - retry with moderate backoff
    'server_error': {
        shouldRetry: true,
        retryConfig: { maxAttempts: 3, baseDelayMs: 2000, backoffMultiplier: 2.5 },
        userMessage: 'Server error occurred. Retrying automatically...',
        recoveryActions: [
            'Try again in a few minutes',
            'Check system status',
            'Contact support if this persists'
        ]
    }
};

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

class CircuitBreaker {
    private state: CircuitBreakerState;
    private config: CircuitBreakerConfig;
    private logger: ReturnType<typeof createLogger>;

    constructor(
        private platform: Platform,
        config: Partial<CircuitBreakerConfig> = {}
    ) {
        this.config = {
            failureThreshold: 5,
            recoveryTimeoutMs: 60000, // 1 minute
            successThreshold: 3,
            ...config
        };

        this.state = {
            state: CircuitState.CLOSED,
            failureCount: 0,
            successCount: 0,
            lastFailureTime: 0,
            nextAttemptTime: 0
        };

        this.logger = createLogger({
            service: 'circuit-breaker',
            platform: this.platform
        });
    }

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        // Check if circuit is open and if we should attempt recovery
        if (this.state.state === CircuitState.OPEN) {
            if (Date.now() < this.state.nextAttemptTime) {
                throw new PublishingError(
                    `Circuit breaker is OPEN for ${this.platform}. Next attempt in ${Math.ceil((this.state.nextAttemptTime - Date.now()) / 1000)}s`,
                    this.platform,
                    'circuit_breaker',
                    false,
                    ErrorCategory.SERVER_ERROR
                );
            } else {
                // Move to half-open state
                this.state.state = CircuitState.HALF_OPEN;
                this.state.successCount = 0;
                this.logger.info(`Circuit breaker moving to HALF_OPEN state for ${this.platform}`);
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
        if (this.state.state === CircuitState.HALF_OPEN) {
            this.state.successCount++;

            if (this.state.successCount >= this.config.successThreshold) {
                // Close the circuit
                this.state.state = CircuitState.CLOSED;
                this.state.failureCount = 0;
                this.state.successCount = 0;
                this.logger.info(`Circuit breaker CLOSED for ${this.platform} after successful recovery`);
            }
        } else if (this.state.state === CircuitState.CLOSED) {
            // Reset failure count on success
            this.state.failureCount = 0;
        }
    }

    private onFailure(): void {
        this.state.failureCount++;
        this.state.lastFailureTime = Date.now();

        if (this.state.state === CircuitState.CLOSED &&
            this.state.failureCount >= this.config.failureThreshold) {
            // Open the circuit
            this.state.state = CircuitState.OPEN;
            this.state.nextAttemptTime = Date.now() + this.config.recoveryTimeoutMs;

            this.logger.error(
                `Circuit breaker OPENED for ${this.platform} after ${this.state.failureCount} failures`,
                undefined,
                {
                    failureCount: this.state.failureCount,
                    nextAttemptTime: new Date(this.state.nextAttemptTime).toISOString()
                }
            );
        } else if (this.state.state === CircuitState.HALF_OPEN) {
            // Failed during recovery, go back to open
            this.state.state = CircuitState.OPEN;
            this.state.nextAttemptTime = Date.now() + this.config.recoveryTimeoutMs;
            this.state.successCount = 0;

            this.logger.warn(`Circuit breaker returned to OPEN state for ${this.platform} during recovery attempt`);
        }
    }

    getState(): CircuitBreakerState {
        return { ...this.state };
    }

    isOpen(): boolean {
        return this.state.state === CircuitState.OPEN && Date.now() < this.state.nextAttemptTime;
    }
}

// ============================================================================
// Publishing Error Handler
// ============================================================================

export class PublishingErrorHandler {
    private circuitBreakers: Map<Platform, CircuitBreaker> = new Map();
    private logger: ReturnType<typeof createLogger>;

    constructor() {
        this.logger = createLogger({ service: 'publishing-error-handler' });
    }

    /**
     * Create a publishing error with proper classification
     */
    createPublishingError(
        error: Error,
        platform: Platform,
        operation: string,
        context?: Record<string, any>
    ): PublishingError {
        const pattern = detectErrorPattern(error);
        const publishingError = new PublishingError(
            error.message,
            platform,
            operation,
            isRetryableError(error),
            pattern.category
        );

        // Add additional context
        publishingError.context = context;
        publishingError.stack = error.stack;

        // Extract status code if available
        if ('status' in error || 'statusCode' in error) {
            publishingError.statusCode = (error as any).status || (error as any).statusCode;
        }

        // Store original platform error
        publishingError.platformError = error;

        return publishingError;
    }

    /**
     * Get circuit breaker for platform
     */
    private getCircuitBreaker(platform: Platform): CircuitBreaker {
        if (!this.circuitBreakers.has(platform)) {
            this.circuitBreakers.set(platform, new CircuitBreaker(platform));
        }
        return this.circuitBreakers.get(platform)!;
    }

    /**
     * Classify error and determine retry strategy
     */
    private classifyError(error: PublishingError): string {
        const message = error.message.toLowerCase();
        const statusCode = error.statusCode;

        // Rate limiting
        if (statusCode === 429 || message.includes('rate limit') || message.includes('too many requests')) {
            return 'rate_limit';
        }

        // Authentication/Authorization
        if (statusCode === 401 || statusCode === 403 ||
            message.includes('unauthorized') || message.includes('forbidden') ||
            message.includes('token') || message.includes('authentication')) {
            return 'auth_error';
        }

        // Content validation
        if (statusCode === 400 || message.includes('validation') ||
            message.includes('invalid') || message.includes('bad request')) {
            return 'content_validation';
        }

        // Server errors
        if (statusCode && statusCode >= 500) {
            return 'server_error';
        }

        // Network errors
        if (message.includes('network') || message.includes('connection') ||
            message.includes('timeout') || message.includes('fetch')) {
            return 'network_error';
        }

        // Platform API errors (default for unclassified platform errors)
        return 'platform_api_error';
    }

    /**
     * Execute operation with retry logic and circuit breaker
     */
    async executeWithRetry<T>(
        operation: () => Promise<T>,
        platform: Platform,
        operationName: string,
        context: LogContext = {}
    ): Promise<PublishingResult> {
        const startTime = Date.now();
        const circuitBreaker = this.getCircuitBreaker(platform);
        const operationLogger = this.logger.child({
            ...context,
            platform,
            operation: operationName
        });

        let lastError: PublishingError | null = null;
        let attempts = 0;

        // Check circuit breaker first
        if (circuitBreaker.isOpen()) {
            const circuitState = circuitBreaker.getState();
            operationLogger.warn('Circuit breaker is OPEN, rejecting request', {
                circuitState,
                nextAttemptTime: new Date(circuitState.nextAttemptTime).toISOString()
            });

            return {
                success: false,
                error: this.createPublishingError(
                    new Error(`Circuit breaker is OPEN for ${platform}. Service temporarily unavailable.`),
                    platform,
                    operationName,
                    context
                ),
                attempts: 0,
                totalDuration: Date.now() - startTime,
                circuitBreakerTriggered: true
            };
        }

        const executeAttempt = async (): Promise<T> => {
            attempts++;
            operationLogger.debug(`Attempt ${attempts} for ${operationName}`, { attempt: attempts });

            try {
                return await circuitBreaker.execute(operation);
            } catch (error) {
                const publishingError = this.createPublishingError(
                    error as Error,
                    platform,
                    operationName,
                    { ...context, attempt: attempts }
                );

                lastError = publishingError;

                // Log the error with full context
                operationLogger.error(
                    `Publishing attempt ${attempts} failed`,
                    publishingError,
                    {
                        attempt: attempts,
                        errorType: this.classifyError(publishingError),
                        statusCode: publishingError.statusCode,
                        retryable: publishingError.retryable
                    }
                );

                throw publishingError;
            }
        };

        // Try the operation with retry logic
        try {
            const result = await this.retryWithStrategy(executeAttempt, platform, operationName);

            operationLogger.info(`Publishing succeeded after ${attempts} attempt(s)`, {
                attempts,
                duration: Date.now() - startTime
            });

            return {
                success: true,
                postId: (result as any)?.postId,
                postUrl: (result as any)?.postUrl,
                attempts,
                totalDuration: Date.now() - startTime
            };

        } catch (error) {
            const finalError = error as PublishingError;
            const errorType = this.classifyError(finalError);
            const strategy = ERROR_STRATEGIES[errorType];

            operationLogger.error(
                `Publishing failed after ${attempts} attempt(s)`,
                finalError,
                {
                    attempts,
                    duration: Date.now() - startTime,
                    errorType,
                    strategy: strategy.userMessage,
                    recoveryActions: strategy.recoveryActions
                }
            );

            return {
                success: false,
                error: finalError,
                attempts,
                totalDuration: Date.now() - startTime
            };
        }
    }

    /**
     * Retry operation with intelligent strategy based on error type
     */
    private async retryWithStrategy<T>(
        operation: () => Promise<T>,
        platform: Platform,
        operationName: string
    ): Promise<T> {
        const defaultConfig: RetryConfig = {
            maxAttempts: 3,
            baseDelayMs: 1000,
            maxDelayMs: 30000,
            backoffMultiplier: 2,
            jitterFactor: 0.3
        };

        let lastError: PublishingError;
        let currentConfig = defaultConfig;

        for (let attempt = 1; attempt <= currentConfig.maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as PublishingError;

                // Determine strategy based on error type
                const errorType = this.classifyError(lastError);
                const strategy = ERROR_STRATEGIES[errorType];

                // Update retry config based on strategy
                if (strategy.retryConfig) {
                    currentConfig = { ...defaultConfig, ...strategy.retryConfig };
                }

                // Don't retry if strategy says not to or if this was the last attempt
                if (!strategy.shouldRetry || attempt >= currentConfig.maxAttempts) {
                    throw lastError;
                }

                // Calculate delay with exponential backoff and jitter
                const baseDelay = currentConfig.baseDelayMs * Math.pow(currentConfig.backoffMultiplier, attempt - 1);
                const jitter = baseDelay * currentConfig.jitterFactor * Math.random();
                const delay = Math.min(baseDelay + jitter, currentConfig.maxDelayMs);

                this.logger.debug(
                    `Retrying ${operationName} for ${platform} in ${Math.round(delay)}ms`,
                    {
                        attempt,
                        maxAttempts: currentConfig.maxAttempts,
                        delay: Math.round(delay),
                        errorType,
                        strategy: strategy.userMessage
                    }
                );

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError!;
    }

    /**
     * Get detailed error information for user display
     */
    getErrorDetails(error: PublishingError): {
        userMessage: string;
        recoveryActions: string[];
        technicalDetails: string;
        shouldRetry: boolean;
    } {
        const errorType = this.classifyError(error);
        const strategy = ERROR_STRATEGIES[errorType] || ERROR_STRATEGIES['platform_api_error'];

        return {
            userMessage: strategy.userMessage,
            recoveryActions: strategy.recoveryActions,
            technicalDetails: `${error.platform} API Error: ${error.message}${error.statusCode ? ` (Status: ${error.statusCode})` : ''}`,
            shouldRetry: strategy.shouldRetry
        };
    }

    /**
     * Get circuit breaker status for all platforms
     */
    getCircuitBreakerStatus(): Record<Platform, CircuitBreakerState> {
        const status: Record<string, CircuitBreakerState> = {};

        for (const [platform, breaker] of this.circuitBreakers) {
            status[platform] = breaker.getState();
        }

        return status as Record<Platform, CircuitBreakerState>;
    }

    /**
     * Reset circuit breaker for a platform (admin function)
     */
    resetCircuitBreaker(platform: Platform): void {
        this.circuitBreakers.delete(platform);
        this.logger.info(`Circuit breaker reset for ${platform}`);
    }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class PublishingError extends Error {
    constructor(
        message: string,
        public platform: Platform,
        public operation: string,
        public retryable: boolean,
        public category: ErrorCategory,
        public statusCode?: number,
        public platformError?: any,
        public context?: Record<string, any>
    ) {
        super(message);
        this.name = 'PublishingError';
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const publishingErrorHandler = new PublishingErrorHandler();