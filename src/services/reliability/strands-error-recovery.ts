/**
 * Advanced Error Handling & Recovery System for Strands AI
 * 
 * Provides intelligent error recovery, circuit breakers, and graceful degradation
 * to ensure maximum reliability and user experience
 */

import { z } from 'zod';

// Error types and severity levels
export const ErrorSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const ErrorCategorySchema = z.enum([
    'network',
    'authentication',
    'rate-limit',
    'service-unavailable',
    'invalid-input',
    'processing-error',
    'timeout',
    'unknown'
]);

// Error tracking schema
export const ErrorEventSchema = z.object({
    id: z.string(),
    serviceType: z.string(),
    category: ErrorCategorySchema,
    severity: ErrorSeveritySchema,
    message: z.string(),
    stack: z.string().optional(),
    timestamp: z.number(),
    userId: z.string().optional(),
    inputs: z.any().optional(),
    recoveryAttempts: z.number().default(0),
    recovered: z.boolean().default(false),
    fallbackUsed: z.boolean().default(false),
});

// Circuit breaker configuration
export const CircuitBreakerConfigSchema = z.object({
    serviceType: z.string(),
    failureThreshold: z.number().default(5), // Number of failures before opening
    recoveryTimeout: z.number().default(60000), // Time before attempting recovery (ms)
    halfOpenMaxCalls: z.number().default(3), // Max calls in half-open state
    monitoringWindow: z.number().default(300000), // 5 minutes monitoring window
});

// Recovery strategy configuration
export const RecoveryStrategySchema = z.object({
    maxRetries: z.number().default(3),
    baseDelay: z.number().default(1000), // Base delay between retries (ms)
    maxDelay: z.number().default(10000), // Maximum delay (ms)
    backoffMultiplier: z.number().default(2), // Exponential backoff multiplier
    jitterFactor: z.number().default(0.1), // Random jitter to prevent thundering herd
});

export type ErrorEvent = z.infer<typeof ErrorEventSchema>;
export type CircuitBreakerConfig = z.infer<typeof CircuitBreakerConfigSchema>;
export type RecoveryStrategy = z.infer<typeof RecoveryStrategySchema>;

/**
 * Circuit Breaker Implementation
 */
class CircuitBreaker {
    private state: 'closed' | 'open' | 'half-open' = 'closed';
    private failures: number = 0;
    private lastFailureTime: number = 0;
    private halfOpenCalls: number = 0;
    private config: CircuitBreakerConfig;

    constructor(config: CircuitBreakerConfig) {
        this.config = config;
    }

    /**
     * Execute function with circuit breaker protection
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
                this.state = 'half-open';
                this.halfOpenCalls = 0;
                console.log(`🔄 Circuit breaker for ${this.config.serviceType} entering half-open state`);
            } else {
                throw new Error(`Circuit breaker is OPEN for ${this.config.serviceType}`);
            }
        }

        if (this.state === 'half-open' && this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
            throw new Error(`Circuit breaker half-open limit exceeded for ${this.config.serviceType}`);
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    /**
     * Handle successful execution
     */
    private onSuccess(): void {
        if (this.state === 'half-open') {
            this.halfOpenCalls++;
            if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
                this.state = 'closed';
                this.failures = 0;
                console.log(`✅ Circuit breaker for ${this.config.serviceType} closed - service recovered`);
            }
        } else if (this.state === 'closed') {
            this.failures = 0;
        }
    }

    /**
     * Handle failed execution
     */
    private onFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.state === 'half-open') {
            this.state = 'open';
            console.log(`🚨 Circuit breaker for ${this.config.serviceType} opened from half-open state`);
        } else if (this.state === 'closed' && this.failures >= this.config.failureThreshold) {
            this.state = 'open';
            console.log(`🚨 Circuit breaker for ${this.config.serviceType} opened - failure threshold exceeded`);
        }
    }

    /**
     * Get current circuit breaker status
     */
    getStatus(): { state: string; failures: number; lastFailureTime: number } {
        return {
            state: this.state,
            failures: this.failures,
            lastFailureTime: this.lastFailureTime,
        };
    }

    /**
     * Manually reset circuit breaker
     */
    reset(): void {
        this.state = 'closed';
        this.failures = 0;
        this.lastFailureTime = 0;
        this.halfOpenCalls = 0;
        console.log(`🔄 Circuit breaker for ${this.config.serviceType} manually reset`);
    }
}

/**
 * Error Recovery Manager
 */
class ErrorRecoveryManager {
    private circuitBreakers: Map<string, CircuitBreaker> = new Map();
    private errorHistory: ErrorEvent[] = [];
    private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();

    constructor() {
        this.initializeCircuitBreakers();
        this.initializeRecoveryStrategies();
        this.startErrorCleanup();
    }

    /**
     * Initialize circuit breakers for each service
     */
    private initializeCircuitBreakers(): void {
        const services = [
            'research-agent',
            'content-studio',
            'listing-description',
            'market-intelligence',
            'brand-strategy',
            'image-analysis',
            'agent-orchestration'
        ];

        services.forEach(serviceType => {
            const config: CircuitBreakerConfig = {
                serviceType,
                failureThreshold: 5,
                recoveryTimeout: 60000,
                halfOpenMaxCalls: 3,
                monitoringWindow: 300000,
            };

            this.circuitBreakers.set(serviceType, new CircuitBreaker(config));
        });
    }

    /**
     * Initialize recovery strategies for different error types
     */
    private initializeRecoveryStrategies(): void {
        const strategies: Record<string, RecoveryStrategy> = {
            'network': {
                maxRetries: 3,
                baseDelay: 2000,
                maxDelay: 15000,
                backoffMultiplier: 2,
                jitterFactor: 0.2,
            },
            'rate-limit': {
                maxRetries: 5,
                baseDelay: 5000,
                maxDelay: 30000,
                backoffMultiplier: 1.5,
                jitterFactor: 0.3,
            },
            'timeout': {
                maxRetries: 2,
                baseDelay: 1000,
                maxDelay: 8000,
                backoffMultiplier: 2,
                jitterFactor: 0.1,
            },
            'service-unavailable': {
                maxRetries: 4,
                baseDelay: 3000,
                maxDelay: 20000,
                backoffMultiplier: 2,
                jitterFactor: 0.2,
            },
            'processing-error': {
                maxRetries: 2,
                baseDelay: 1000,
                maxDelay: 5000,
                backoffMultiplier: 1.5,
                jitterFactor: 0.1,
            },
        };

        Object.entries(strategies).forEach(([category, strategy]) => {
            this.recoveryStrategies.set(category, strategy);
        });
    }

    /**
     * Execute function with comprehensive error recovery
     */
    async executeWithRecovery<T>(
        serviceType: string,
        operation: () => Promise<T>,
        fallbackOperation?: () => Promise<T>,
        options?: {
            userId?: string;
            inputs?: any;
            customStrategy?: Partial<RecoveryStrategy>;
        }
    ): Promise<T> {
        const circuitBreaker = this.circuitBreakers.get(serviceType);
        if (!circuitBreaker) {
            throw new Error(`No circuit breaker configured for service: ${serviceType}`);
        }

        let lastError: Error | null = null;
        let recoveryAttempts = 0;

        // Try with circuit breaker protection
        try {
            return await circuitBreaker.execute(async () => {
                return await this.executeWithRetry(
                    serviceType,
                    operation,
                    options?.customStrategy,
                    options
                );
            });
        } catch (error) {
            lastError = error as Error;
            console.warn(`🚨 Service ${serviceType} failed after circuit breaker protection:`, error);

            // Log the error
            await this.logError(serviceType, error as Error, options);

            // Try fallback if available
            if (fallbackOperation) {
                try {
                    console.log(`🔄 Attempting fallback for ${serviceType}`);
                    const result = await fallbackOperation();

                    // Log successful fallback
                    await this.logError(serviceType, error as Error, {
                        ...options,
                        fallbackUsed: true,
                        recovered: true,
                    });

                    return result;
                } catch (fallbackError) {
                    console.error(`❌ Fallback failed for ${serviceType}:`, fallbackError);
                    lastError = fallbackError as Error;
                }
            }

            // If we get here, both primary and fallback failed
            throw lastError;
        }
    }

    /**
     * Execute operation with retry logic
     */
    private async executeWithRetry<T>(
        serviceType: string,
        operation: () => Promise<T>,
        customStrategy?: Partial<RecoveryStrategy>,
        options?: any
    ): Promise<T> {
        let lastError: Error | null = null;
        let attempt = 0;

        while (attempt <= (customStrategy?.maxRetries || 3)) {
            try {
                if (attempt > 0) {
                    const delay = this.calculateRetryDelay(attempt, serviceType, customStrategy);
                    console.log(`⏳ Retrying ${serviceType} in ${delay}ms (attempt ${attempt + 1})`);
                    await this.sleep(delay);
                }

                const result = await operation();

                if (attempt > 0) {
                    console.log(`✅ ${serviceType} recovered after ${attempt} retries`);
                }

                return result;
            } catch (error) {
                lastError = error as Error;
                attempt++;

                const errorCategory = this.categorizeError(error as Error);
                const shouldRetry = this.shouldRetry(errorCategory, attempt, customStrategy?.maxRetries || 3);

                if (!shouldRetry) {
                    break;
                }

                console.warn(`⚠️ ${serviceType} attempt ${attempt} failed:`, error);
            }
        }

        throw lastError;
    }

    /**
     * Calculate retry delay with exponential backoff and jitter
     */
    private calculateRetryDelay(
        attempt: number,
        serviceType: string,
        customStrategy?: Partial<RecoveryStrategy>
    ): number {
        const strategy = this.getRecoveryStrategy(serviceType, customStrategy);

        // Exponential backoff
        let delay = strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attempt - 1);

        // Apply maximum delay limit
        delay = Math.min(delay, strategy.maxDelay);

        // Add jitter to prevent thundering herd
        const jitter = delay * strategy.jitterFactor * Math.random();
        delay += jitter;

        return Math.round(delay);
    }

    /**
     * Get recovery strategy for error category
     */
    private getRecoveryStrategy(
        serviceType: string,
        customStrategy?: Partial<RecoveryStrategy>
    ): RecoveryStrategy {
        const defaultStrategy: RecoveryStrategy = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
            jitterFactor: 0.1,
        };

        return {
            ...defaultStrategy,
            ...customStrategy,
        };
    }

    /**
     * Categorize error for appropriate recovery strategy
     */
    private categorizeError(error: Error): string {
        const message = error.message.toLowerCase();

        if (message.includes('network') || message.includes('connection')) {
            return 'network';
        }
        if (message.includes('rate limit') || message.includes('quota')) {
            return 'rate-limit';
        }
        if (message.includes('timeout')) {
            return 'timeout';
        }
        if (message.includes('unavailable') || message.includes('service')) {
            return 'service-unavailable';
        }
        if (message.includes('auth') || message.includes('permission')) {
            return 'authentication';
        }

        return 'processing-error';
    }

    /**
     * Determine if error should be retried
     */
    private shouldRetry(errorCategory: string, attempt: number, maxRetries: number): boolean {
        if (attempt >= maxRetries) {
            return false;
        }

        // Don't retry authentication errors
        if (errorCategory === 'authentication') {
            return false;
        }

        // Don't retry invalid input errors
        if (errorCategory === 'invalid-input') {
            return false;
        }

        return true;
    }

    /**
     * Log error event for analysis
     */
    private async logError(
        serviceType: string,
        error: Error,
        options?: {
            userId?: string;
            inputs?: any;
            fallbackUsed?: boolean;
            recovered?: boolean;
        }
    ): Promise<void> {
        const errorEvent: ErrorEvent = {
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            serviceType,
            category: this.categorizeError(error) as any,
            severity: this.determineSeverity(error, serviceType),
            message: error.message,
            stack: error.stack,
            timestamp: Date.now(),
            userId: options?.userId,
            inputs: options?.inputs,
            recoveryAttempts: 0,
            recovered: options?.recovered || false,
            fallbackUsed: options?.fallbackUsed || false,
        };

        this.errorHistory.push(errorEvent);

        // Keep only recent errors (last 1000)
        if (this.errorHistory.length > 1000) {
            this.errorHistory = this.errorHistory.slice(-1000);
        }

        console.error(`📝 Logged error for ${serviceType}:`, {
            id: errorEvent.id,
            category: errorEvent.category,
            severity: errorEvent.severity,
            recovered: errorEvent.recovered,
            fallbackUsed: errorEvent.fallbackUsed,
        });
    }

    /**
     * Determine error severity
     */
    private determineSeverity(error: Error, serviceType: string): 'low' | 'medium' | 'high' | 'critical' {
        const message = error.message.toLowerCase();

        if (message.includes('critical') || message.includes('fatal')) {
            return 'critical';
        }
        if (message.includes('timeout') || message.includes('unavailable')) {
            return 'high';
        }
        if (message.includes('rate limit') || message.includes('network')) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Get error statistics and health metrics
     */
    getErrorStatistics(timeWindow: number = 3600000): any { // Default 1 hour
        const now = Date.now();
        const recentErrors = this.errorHistory.filter(
            error => now - error.timestamp <= timeWindow
        );

        const stats = {
            totalErrors: recentErrors.length,
            errorsByService: {} as Record<string, number>,
            errorsByCategory: {} as Record<string, number>,
            errorsBySeverity: {} as Record<string, number>,
            recoveryRate: 0,
            fallbackUsageRate: 0,
            circuitBreakerStatus: {} as Record<string, any>,
        };

        // Calculate error distributions
        recentErrors.forEach(error => {
            stats.errorsByService[error.serviceType] = (stats.errorsByService[error.serviceType] || 0) + 1;
            stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;
            stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
        });

        // Calculate recovery and fallback rates
        const recoveredErrors = recentErrors.filter(error => error.recovered).length;
        const fallbackUsedErrors = recentErrors.filter(error => error.fallbackUsed).length;

        stats.recoveryRate = recentErrors.length > 0 ? recoveredErrors / recentErrors.length : 0;
        stats.fallbackUsageRate = recentErrors.length > 0 ? fallbackUsedErrors / recentErrors.length : 0;

        // Get circuit breaker statuses
        this.circuitBreakers.forEach((breaker, serviceType) => {
            stats.circuitBreakerStatus[serviceType] = breaker.getStatus();
        });

        return stats;
    }

    /**
     * Get system health assessment
     */
    getSystemHealth(): {
        status: 'healthy' | 'degraded' | 'critical';
        issues: string[];
        recommendations: string[];
    } {
        const stats = this.getErrorStatistics();
        const issues: string[] = [];
        const recommendations: string[] = [];

        let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

        // Check error rates
        if (stats.totalErrors > 50) {
            status = 'critical';
            issues.push(`High error rate: ${stats.totalErrors} errors in the last hour`);
            recommendations.push('Investigate root cause of high error rate');
        } else if (stats.totalErrors > 20) {
            status = 'degraded';
            issues.push(`Elevated error rate: ${stats.totalErrors} errors in the last hour`);
            recommendations.push('Monitor error trends and consider scaling');
        }

        // Check circuit breaker states
        Object.entries(stats.circuitBreakerStatus).forEach(([service, status]) => {
            if (status.state === 'open') {
                issues.push(`Circuit breaker OPEN for ${service}`);
                recommendations.push(`Investigate and fix issues with ${service}`);
                if (status !== 'critical') status = 'degraded';
            }
        });

        // Check recovery rates
        if (stats.recoveryRate < 0.7 && stats.totalErrors > 5) {
            issues.push(`Low recovery rate: ${Math.round(stats.recoveryRate * 100)}%`);
            recommendations.push('Review retry strategies and fallback mechanisms');
            if (status === 'healthy') status = 'degraded';
        }

        // Check for critical errors
        if (stats.errorsBySeverity.critical > 0) {
            status = 'critical';
            issues.push(`${stats.errorsBySeverity.critical} critical errors detected`);
            recommendations.push('Address critical errors immediately');
        }

        if (issues.length === 0) {
            recommendations.push('System operating normally');
        }

        return { status, issues, recommendations };
    }

    /**
     * Manually reset circuit breaker for a service
     */
    resetCircuitBreaker(serviceType: string): boolean {
        const breaker = this.circuitBreakers.get(serviceType);
        if (breaker) {
            breaker.reset();
            return true;
        }
        return false;
    }

    /**
     * Sleep utility for delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Start periodic cleanup of old errors
     */
    private startErrorCleanup(): void {
        setInterval(() => {
            const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
            this.errorHistory = this.errorHistory.filter(error => error.timestamp > cutoff);
        }, 60 * 60 * 1000); // Clean up every hour
    }
}

// Export singleton instance
export const errorRecoveryManager = new ErrorRecoveryManager();

/**
 * Decorator for automatic error recovery
 */
export function withErrorRecovery(serviceType: string, fallbackFn?: Function) {
    return function <T extends (...args: any[]) => Promise<any>>(
        target: any,
        propertyName: string,
        descriptor: TypedPropertyDescriptor<T>
    ) {
        const method = descriptor.value!;

        descriptor.value = async function (...args: any[]) {
            const [inputs, userId] = args;

            return errorRecoveryManager.executeWithRecovery(
                serviceType,
                () => method.apply(this, args),
                fallbackFn ? () => fallbackFn.apply(this, args) : undefined,
                { userId, inputs }
            );
        } as T;

        return descriptor;
    };
}

/**
 * Utility functions for error handling
 */
export const ErrorUtils = {
    /**
     * Create a safe wrapper for async operations
     */
    createSafeWrapper: <T>(
        operation: () => Promise<T>,
        fallback: T,
        errorHandler?: (error: Error) => void
    ) => async (): Promise<T> => {
        try {
            return await operation();
        } catch (error) {
            if (errorHandler) {
                errorHandler(error as Error);
            }
            return fallback;
        }
    },

    /**
     * Check if error is retryable
     */
    isRetryableError: (error: Error): boolean => {
        const message = error.message.toLowerCase();
        const retryablePatterns = [
            'network',
            'timeout',
            'rate limit',
            'service unavailable',
            'temporary',
        ];

        return retryablePatterns.some(pattern => message.includes(pattern));
    },

    /**
     * Extract error details for logging
     */
    extractErrorDetails: (error: Error): {
        message: string;
        stack?: string;
        category: string;
        severity: string;
    } => {
        return {
            message: error.message,
            stack: error.stack,
            category: errorRecoveryManager['categorizeError'](error),
            severity: errorRecoveryManager['determineSeverity'](error, 'unknown'),
        };
    },
};