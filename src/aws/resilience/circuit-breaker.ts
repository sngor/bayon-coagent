/**
 * Circuit Breaker implementation for external API calls
 * Prevents cascading failures and provides graceful degradation
 */

export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    expectedErrors?: string[];
}

export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreaker {
    private failureCount = 0;
    private lastFailureTime = 0;
    private state = CircuitState.CLOSED;
    private nextAttempt = 0;

    constructor(private config: CircuitBreakerConfig) { }

    async execute<T>(operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextAttempt) {
                if (fallback) {
                    console.log('Circuit breaker OPEN, executing fallback');
                    return await fallback();
                }
                throw new Error(`Circuit breaker is OPEN. Next attempt at ${new Date(this.nextAttempt)}`);
            }
            this.state = CircuitState.HALF_OPEN;
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error);

            if (fallback && this.state === CircuitState.OPEN) {
                console.log('Circuit breaker OPEN after failure, executing fallback');
                return await fallback();
            }

            throw error;
        }
    }

    private onSuccess(): void {
        this.failureCount = 0;
        this.state = CircuitState.CLOSED;
    }

    private onFailure(error: any): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.config.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + this.config.recoveryTimeout;

            console.error(`Circuit breaker opened after ${this.failureCount} failures. Next attempt: ${new Date(this.nextAttempt)}`);
        }
    }

    getState(): CircuitState {
        return this.state;
    }

    getMetrics() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime,
            nextAttempt: this.nextAttempt
        };
    }
}

// Retry logic with exponential backoff
export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors?: string[];
}

export class RetryHandler {
    constructor(private config: RetryConfig) { }

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        let lastError: any;

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                if (attempt === this.config.maxRetries) {
                    break;
                }

                if (!this.isRetryableError(error)) {
                    throw error;
                }

                const delay = Math.min(
                    this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt),
                    this.config.maxDelay
                );

                console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
                await this.sleep(delay);
            }
        }

        throw lastError;
    }

    private isRetryableError(error: any): boolean {
        if (!this.config.retryableErrors) {
            return true; // Retry all errors by default
        }

        return this.config.retryableErrors.some(retryableError =>
            error.message?.includes(retryableError) ||
            error.code === retryableError
        );
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Usage examples for your services
export const bedrockCircuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 60000, // 1 minute
});

export const externalApiRetry = new RetryHandler({
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ThrottlingException']
});

// Enhanced Bedrock client with resilience
export async function invokeBedrockWithResilience(
    modelId: string,
    prompt: string,
    fallbackResponse?: string
) {
    return await bedrockCircuitBreaker.execute(
        async () => {
            return await externalApiRetry.execute(async () => {
                // Your existing Bedrock invocation code
                const response = await bedrock.invokeModel({
                    modelId,
                    body: JSON.stringify({ prompt })
                }).promise();

                return JSON.parse(response.body.toString());
            });
        },
        // Fallback function
        fallbackResponse ? async () => ({ content: fallbackResponse }) : undefined
    );
}