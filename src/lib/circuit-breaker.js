"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreakerRegistry = exports.CircuitBreaker = exports.CircuitBreakerError = exports.CircuitState = void 0;
exports.createCircuitBreaker = createCircuitBreaker;
exports.withCircuitBreaker = withCircuitBreaker;
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreakerError extends Error {
    constructor(message, state) {
        super(message);
        this.state = state;
        this.name = 'CircuitBreakerError';
    }
}
exports.CircuitBreakerError = CircuitBreakerError;
class CircuitBreaker {
    constructor(name, options = {}) {
        this.name = name;
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttemptTime = 0;
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
    async execute(fn) {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextAttemptTime) {
                throw new CircuitBreakerError(`Circuit breaker is OPEN for ${this.name}. Next attempt at ${new Date(this.nextAttemptTime).toISOString()}`, CircuitState.OPEN);
            }
            this.transitionTo(CircuitState.HALF_OPEN);
        }
        try {
            const result = await this.executeWithTimeout(fn);
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    async executeWithTimeout(fn) {
        return Promise.race([
            fn(),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timeout after ${this.options.requestTimeout}ms`)), this.options.requestTimeout)),
        ]);
    }
    onSuccess() {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.options.successThreshold) {
                this.transitionTo(CircuitState.CLOSED);
                this.successCount = 0;
            }
        }
    }
    onFailure() {
        this.failureCount++;
        this.successCount = 0;
        console.warn(`Circuit breaker failure for ${this.name}:`, {
            failureCount: this.failureCount,
            threshold: this.options.failureThreshold,
            state: this.state,
        });
        if (this.failureCount >= this.options.failureThreshold ||
            this.state === CircuitState.HALF_OPEN) {
            this.transitionTo(CircuitState.OPEN);
            this.nextAttemptTime = Date.now() + this.options.recoveryTimeout;
            console.error(`Circuit breaker OPENED for ${this.name}. Next attempt at ${new Date(this.nextAttemptTime).toISOString()}`);
        }
    }
    transitionTo(newState) {
        const oldState = this.state;
        if (oldState === newState) {
            return;
        }
        console.log(`Circuit breaker ${this.name} transitioning: ${oldState} -> ${newState}`);
        this.state = newState;
        this.options.onStateChange(oldState, newState);
        if (newState === CircuitState.OPEN) {
            this.options.onOpen();
        }
        else if (newState === CircuitState.CLOSED) {
            this.options.onClose();
        }
    }
    getState() {
        return this.state;
    }
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
    reset() {
        console.log(`Circuit breaker ${this.name} manually reset`);
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttemptTime = 0;
    }
    open() {
        console.log(`Circuit breaker ${this.name} manually opened`);
        this.transitionTo(CircuitState.OPEN);
        this.nextAttemptTime = Date.now() + this.options.recoveryTimeout;
    }
}
exports.CircuitBreaker = CircuitBreaker;
class CircuitBreakerRegistry {
    constructor() {
        this.breakers = new Map();
    }
    getOrCreate(name, options) {
        if (!this.breakers.has(name)) {
            this.breakers.set(name, new CircuitBreaker(name, options));
        }
        return this.breakers.get(name);
    }
    get(name) {
        return this.breakers.get(name);
    }
    getAll() {
        return Array.from(this.breakers.values());
    }
    getAllStats() {
        return Array.from(this.breakers.values()).map(breaker => breaker.getStats());
    }
    resetAll() {
        this.breakers.forEach(breaker => breaker.reset());
    }
    remove(name) {
        this.breakers.delete(name);
    }
    clear() {
        this.breakers.clear();
    }
}
exports.circuitBreakerRegistry = new CircuitBreakerRegistry();
function createCircuitBreaker(serviceName, options) {
    return exports.circuitBreakerRegistry.getOrCreate(serviceName, options);
}
async function withCircuitBreaker(serviceName, fn, options) {
    const breaker = createCircuitBreaker(serviceName, options);
    return breaker.execute(fn);
}
