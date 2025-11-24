/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by stopping requests to failing services
 * and allowing them time to recover.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests fail fast
 * - HALF_OPEN: Testing if service has recovered
 */

export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
    /**
     * Number of failures before opening the circuit (default: 5)
     */
    failureThreshold?: number;

    /**
     * Time in milliseconds to wait before attempting recovery (default: 60000ms = 1min)
     */
    recoveryTimeoutMs?: number;

    /**
     * Number of successful requests needed to close circuit from half-open (default: 2)
     */
    successThreshold?: number;

    /**
     * Timeout for individual requests in milliseconds (default: 30000ms = 30s)
     */
    requestTimeoutMs?: number;

    /**
     * Callback invoked when circuit state changes
     */
    onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;

    /**
     * Callback invoked when circuit opens
     */
    onOpen?: (error: Error) => void;

    /**
     * Callback invoked when circuit closes
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

    private readonly failureThreshold: number;
    private readonly recoveryTimeoutMs: number;
    private readonly successThreshold: number;
    private readonly requestTimeoutMs: number;
    private readonly onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;
    private readonly onOpen?: (error: Error) => void;
    private readonly onClose?: () => void;

    constructor(
        private readonly name: string,
        options: CircuitBreakerOptions = {}
    ) {
        this.failureThreshold = options.failureThreshold || 5;
        this.recoveryTimeoutMs = options.recoveryTimeoutMs || 60000;
        this.successThreshold = options.successThreshold || 2;
        this.requestTimeoutMs = options.requestTimeoutMs || 30000;
        this.onStateChange = options.onStateChange;
        this.onOpen = options.onOpen;
        this.onClose = options.onClose;
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
        };
    }

    /**
     * Execute a function with circuit breaker protection
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        // Check if circuit is open
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextAttemptTime) {
                throw new CircuitBreakerError(
                    `Circuit breaker '${this.name}' is OPEN. Service unavailable.`,
                    CircuitState.OPEN
                );
            }

            // Time to try recovery
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
            this.onFailure(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Execute function with timeout
     */
    private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
        return Promise.race([
            fn(),
            new Promise<T>((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Request timeout after ${this.requestTimeoutMs}ms`));
                }, this.requestTimeoutMs);
            }),
        ]);
    }

    /**
     * Handle successful execution
     */
    private onSuccess(): void {
        this.failureCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;

            if (this.successCount >= this.successThreshold) {
                this.transitionTo(CircuitState.CLOSED);
                this.successCount = 0;

                if (this.onClose) {
                    this.onClose();
                }
            }
        }
    }

    /**
     * Handle failed execution
     */
    private onFailure(error: Error): void {
        this.failureCount++;
        this.successCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            // Failed during recovery attempt, go back to open
            this.transitionTo(CircuitState.OPEN);
            this.nextAttemptTime = Date.now() + this.recoveryTimeoutMs;

            if (this.onOpen) {
                this.onOpen(error);
            }
        } else if (this.failureCount >= this.failureThreshold) {
            // Too many failures, open the circuit
            this.transitionTo(CircuitState.OPEN);
            this.nextAttemptTime = Date.now() + this.recoveryTimeoutMs;

            if (this.onOpen) {
                this.onOpen(error);
            }
        }
    }

    /**
     * Transition to a new state
     */
    private transitionTo(newState: CircuitState): void {
        const oldState = this.state;

        if (oldState !== newState) {
            this.state = newState;

            if (this.onStateChange) {
                this.onStateChange(oldState, newState);
            }
        }
    }

    /**
     * Manually reset the circuit breaker
     */
    reset(): void {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttemptTime = 0;
    }

    /**
     * Manually open the circuit breaker
     */
    open(): void {
        this.transitionTo(CircuitState.OPEN);
        this.nextAttemptTime = Date.now() + this.recoveryTimeoutMs;
    }
}

/**
 * Circuit breaker registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry {
    private breakers: Map<string, CircuitBreaker> = new Map();

    /**
     * Get or create a circuit breaker
     */
    getOrCreate(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
        let breaker = this.breakers.get(name);

        if (!breaker) {
            breaker = new CircuitBreaker(name, options);
            this.breakers.set(name, breaker);
        }

        return breaker;
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
        return this.getAll().map(breaker => breaker.getStats());
    }

    /**
     * Reset all circuit breakers
     */
    resetAll(): void {
        this.breakers.forEach(breaker => breaker.reset());
    }
}

// Global registry instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry();
