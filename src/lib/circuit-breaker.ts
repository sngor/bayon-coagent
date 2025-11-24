/**
 * Circuit Breaker Pattern Implementation
 * 
 * Provides fault tolerance for external API calls by preventing
 * cascading failures and allowing systems to recover gracefully.
 * 
 * Requirements: 1.3 - Circuit breaker pattern for external calls
 * 
 * Circuit States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests fail fast
 * - HALF_OPEN: Testing if service has recovered
 */

export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
    /**
     * Number of failures before opening the circuit
     * @default 5
     */
    failureThreshold?: number;

    /**
     * Time in milliseconds to wait before attempting recovery
     * @default 60000 (1 minute)
     */
    recoveryTimeout?: number;

    /**
     * Number of successful requests needed to close the circuit from half-open
     * @default 2
     */
    successThreshold?: number;

    /**
     * Request timeout in milliseconds
     * @default 30000 (30 seconds)
     */
    requestTimeout?: number;

    /**
     * Callback when circuit state changes
     */
    onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;

    /**
     * Callback when circuit opens
     */
    onOpen?: () => void;

    /**
     * Callback when circuit closes
     */
    onClose?: () => void;
}

export class CircuitBreakerError extends Error {
    constructor(
        message: string,
        public readonly state: CircuitState
    ) {
        super(message);
        this.name = 'CircuitBreakerError';
    }
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private nextAttemptTime: number = 0;
    private readonly options: Required<CircuitBreakerOptions>;

    constructor(
        private readonly name: string,
        options: CircuitBreakerOptions = {}
    ) {
        this.options = {
            failureThreshold: options.failureThreshold ?? 5,
            recoveryTimeout: options.recoveryTimeout ?? 60000,
            successThreshold: options.successThreshold ?? 2,
            requestTimeout: options.requestTimeout ?? 30000,
            onStateChange: options.onStateChange ?? (() => { }),
            onOpen: options.onOpen ?? (() => { }),
            onClose: options.onClose ?? (() => { }),
        };

        console.log(`Circuit breaker initialized: ${name}`, {
            failureThreshold: this.options.failureThreshold,
            recoveryTimeout: this.options.recoveryTimeout,
            successThreshold: this.options.successThreshold,
        });
    }

    /**
     * Execute a function with circuit breaker protection
     * 
     * @param fn - Function to execute
     * @returns Result of the function
     * @throws CircuitBreakerError if circuit is open
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        // Check if circuit is open
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextAttemptTime) {
                throw new CircuitBreakerError(
                    `Circuit breaker is OPEN for ${this.name}. Next attempt at ${new Date(this.nextAttemptTime).toISOString()}`,
                    CircuitState.OPEN
                );
            }

            // Transition to half-open to test recovery
            this.transitionTo(CircuitState.HALF_OPEN);
        }

        try {
            // Execute with timeout
            const result = await this.executeWithTimeout(fn);

            // Record success
            this.onSuccess();

            return result;
        } catch (error) {
            // Record failure
            this.onFailure();

            throw error;
        }
    }

    /**
     * Execute function with timeout
     */
    private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
        return Promise.race([
            fn(),
            new Promise<T>((_, reject) =>
                setTimeout(
                    () => reject(new Error(`Request timeout after ${this.options.requestTimeout}ms`)),
                    this.options.requestTimeout
                )
            ),
        ]);
    }

    /**
     * Handle successful request
     */
    private onSuccess(): void {
        this.failureCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;

            if (this.successCount >= this.options.successThreshold) {
                this.transitionTo(CircuitState.CLOSED);
                this.successCount = 0;
            }
        }
    }

    /**
     * Handle failed request
     */
    private onFailure(): void {
        this.failureCount++;
        this.successCount = 0;

        console.warn(`Circuit breaker failure for ${this.name}:`, {
            failureCount: this.failureCount,
            threshold: this.options.failureThreshold,
            state: this.state,
        });

        if (
            this.failureCount >= this.options.failureThreshold ||
            this.state === CircuitState.HALF_OPEN
        ) {
            this.transitionTo(CircuitState.OPEN);
            this.nextAttemptTime = Date.now() + this.options.recoveryTimeout;

            console.error(`Circuit breaker OPENED for ${this.name}. Next attempt at ${new Date(this.nextAttemptTime).toISOString()}`);
        }
    }

    /**
     * Transition to a new state
     */
    private transitionTo(newState: CircuitState): void {
        const oldState = this.state;

        if (oldState === newState) {
            return;
        }

        console.log(`Circuit breaker ${this.name} transitioning: ${oldState} -> ${newState}`);

        this.state = newState;
        this.options.onStateChange(oldState, newState);

        if (newState === CircuitState.OPEN) {
            this.options.onOpen();
        } else if (newState === CircuitState.CLOSED) {
            this.options.onClose();
        }
    }

    /**
     * Get current circuit state
     */
    getState(): CircuitState {
        return this.state;
    }

    /**
     * Get circuit statistics
     */
    getStats() {
        return {
            name: this.name,
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            nextAttemptTime: this.nextAttemptTime,
            options: this.options,
        };
    }

    /**
     * Manually reset the circuit breaker
     */
    reset(): void {
        console.log(`Circuit breaker ${this.name} manually reset`);
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttemptTime = 0;
    }

    /**
     * Manually open the circuit breaker
     */
    open(): void {
        console.log(`Circuit breaker ${this.name} manually opened`);
        this.transitionTo(CircuitState.OPEN);
        this.nextAttemptTime = Date.now() + this.options.recoveryTimeout;
    }
}

/**
 * Circuit breaker registry for managing multiple circuit breakers
 */
class CircuitBreakerRegistry {
    private breakers = new Map<string, CircuitBreaker>();

    /**
     * Get or create a circuit breaker
     */
    getOrCreate(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
        if (!this.breakers.has(name)) {
            this.breakers.set(name, new CircuitBreaker(name, options));
        }

        return this.breakers.get(name)!;
    }

    /**
     * Get a circuit breaker by name
     */
    get(name: string): CircuitBreaker | undefined {
        return this.breakers.get(name);
    }

    /**
     * Get all circuit breakers
     */
    getAll(): CircuitBreaker[] {
        return Array.from(this.breakers.values());
    }

    /**
     * Get statistics for all circuit breakers
     */
    getAllStats() {
        return Array.from(this.breakers.values()).map(breaker => breaker.getStats());
    }

    /**
     * Reset all circuit breakers
     */
    resetAll(): void {
        this.breakers.forEach(breaker => breaker.reset());
    }

    /**
     * Remove a circuit breaker
     */
    remove(name: string): void {
        this.breakers.delete(name);
    }

    /**
     * Clear all circuit breakers
     */
    clear(): void {
        this.breakers.clear();
    }
}

// Global registry instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Create a circuit breaker for an external service
 * 
 * @param serviceName - Name of the external service
 * @param options - Circuit breaker options
 * @returns Circuit breaker instance
 */
export function createCircuitBreaker(
    serviceName: string,
    options?: CircuitBreakerOptions
): CircuitBreaker {
    return circuitBreakerRegistry.getOrCreate(serviceName, options);
}

/**
 * Execute a function with circuit breaker protection
 * 
 * @param serviceName - Name of the external service
 * @param fn - Function to execute
 * @param options - Circuit breaker options
 * @returns Result of the function
 */
export async function withCircuitBreaker<T>(
    serviceName: string,
    fn: () => Promise<T>,
    options?: CircuitBreakerOptions
): Promise<T> {
    const breaker = createCircuitBreaker(serviceName, options);
    return breaker.execute(fn);
}
