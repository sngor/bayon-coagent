"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishingErrorHandler = exports.PublishingErrorHandler = exports.CircuitState = void 0;
const logger_1 = require("@/aws/logging/logger");
const error_handling_1 = require("@/lib/error-handling");
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "closed";
    CircuitState["OPEN"] = "open";
    CircuitState["HALF_OPEN"] = "half_open";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
const ERROR_STRATEGIES = {
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
    'auth_error': {
        shouldRetry: false,
        userMessage: 'Authentication failed. Please reconnect your account.',
        recoveryActions: [
            'Reconnect your social media account',
            'Check account permissions',
            'Ensure account is still active'
        ]
    },
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
    'content_validation': {
        shouldRetry: false,
        userMessage: 'Content validation failed. Please review and modify.',
        recoveryActions: [
            'Check content length limits',
            'Remove unsupported characters',
            'Ensure images meet platform requirements'
        ]
    },
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
class CircuitBreaker {
    constructor(platform, config = {}) {
        this.platform = platform;
        this.config = {
            failureThreshold: 5,
            recoveryTimeoutMs: 60000,
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
        this.logger = (0, logger_1.createLogger)({
            service: 'circuit-breaker',
            platform: this.platform
        });
    }
    async execute(operation) {
        if (this.state.state === CircuitState.OPEN) {
            if (Date.now() < this.state.nextAttemptTime) {
                throw new PublishingError(`Circuit breaker is OPEN for ${this.platform}. Next attempt in ${Math.ceil((this.state.nextAttemptTime - Date.now()) / 1000)}s`, this.platform, 'circuit_breaker', false, error_handling_1.ErrorCategory.SERVER_ERROR);
            }
            else {
                this.state.state = CircuitState.HALF_OPEN;
                this.state.successCount = 0;
                this.logger.info(`Circuit breaker moving to HALF_OPEN state for ${this.platform}`);
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        if (this.state.state === CircuitState.HALF_OPEN) {
            this.state.successCount++;
            if (this.state.successCount >= this.config.successThreshold) {
                this.state.state = CircuitState.CLOSED;
                this.state.failureCount = 0;
                this.state.successCount = 0;
                this.logger.info(`Circuit breaker CLOSED for ${this.platform} after successful recovery`);
            }
        }
        else if (this.state.state === CircuitState.CLOSED) {
            this.state.failureCount = 0;
        }
    }
    onFailure() {
        this.state.failureCount++;
        this.state.lastFailureTime = Date.now();
        if (this.state.state === CircuitState.CLOSED &&
            this.state.failureCount >= this.config.failureThreshold) {
            this.state.state = CircuitState.OPEN;
            this.state.nextAttemptTime = Date.now() + this.config.recoveryTimeoutMs;
            this.logger.error(`Circuit breaker OPENED for ${this.platform} after ${this.state.failureCount} failures`, undefined, {
                failureCount: this.state.failureCount,
                nextAttemptTime: new Date(this.state.nextAttemptTime).toISOString()
            });
        }
        else if (this.state.state === CircuitState.HALF_OPEN) {
            this.state.state = CircuitState.OPEN;
            this.state.nextAttemptTime = Date.now() + this.config.recoveryTimeoutMs;
            this.state.successCount = 0;
            this.logger.warn(`Circuit breaker returned to OPEN state for ${this.platform} during recovery attempt`);
        }
    }
    getState() {
        return { ...this.state };
    }
    isOpen() {
        return this.state.state === CircuitState.OPEN && Date.now() < this.state.nextAttemptTime;
    }
}
class PublishingErrorHandler {
    constructor() {
        this.circuitBreakers = new Map();
        this.logger = (0, logger_1.createLogger)({ service: 'publishing-error-handler' });
    }
    createPublishingError(error, platform, operation, context) {
        const pattern = (0, error_handling_1.detectErrorPattern)(error);
        const publishingError = new PublishingError(error.message, platform, operation, (0, error_handling_1.isRetryableError)(error), pattern.category);
        publishingError.context = context;
        publishingError.stack = error.stack;
        if ('status' in error || 'statusCode' in error) {
            publishingError.statusCode = error.status || error.statusCode;
        }
        publishingError.platformError = error;
        return publishingError;
    }
    getCircuitBreaker(platform) {
        if (!this.circuitBreakers.has(platform)) {
            this.circuitBreakers.set(platform, new CircuitBreaker(platform));
        }
        return this.circuitBreakers.get(platform);
    }
    classifyError(error) {
        const message = error.message.toLowerCase();
        const statusCode = error.statusCode;
        if (statusCode === 429 || message.includes('rate limit') || message.includes('too many requests')) {
            return 'rate_limit';
        }
        if (statusCode === 401 || statusCode === 403 ||
            message.includes('unauthorized') || message.includes('forbidden') ||
            message.includes('token') || message.includes('authentication')) {
            return 'auth_error';
        }
        if (statusCode === 400 || message.includes('validation') ||
            message.includes('invalid') || message.includes('bad request')) {
            return 'content_validation';
        }
        if (statusCode && statusCode >= 500) {
            return 'server_error';
        }
        if (message.includes('network') || message.includes('connection') ||
            message.includes('timeout') || message.includes('fetch')) {
            return 'network_error';
        }
        return 'platform_api_error';
    }
    async executeWithRetry(operation, platform, operationName, context = {}) {
        const startTime = Date.now();
        const circuitBreaker = this.getCircuitBreaker(platform);
        const operationLogger = this.logger.child({
            ...context,
            platform,
            operation: operationName
        });
        let lastError = null;
        let attempts = 0;
        if (circuitBreaker.isOpen()) {
            const circuitState = circuitBreaker.getState();
            operationLogger.warn('Circuit breaker is OPEN, rejecting request', {
                circuitState,
                nextAttemptTime: new Date(circuitState.nextAttemptTime).toISOString()
            });
            return {
                success: false,
                error: this.createPublishingError(new Error(`Circuit breaker is OPEN for ${platform}. Service temporarily unavailable.`), platform, operationName, context),
                attempts: 0,
                totalDuration: Date.now() - startTime,
                circuitBreakerTriggered: true
            };
        }
        const executeAttempt = async () => {
            attempts++;
            operationLogger.debug(`Attempt ${attempts} for ${operationName}`, { attempt: attempts });
            try {
                return await circuitBreaker.execute(operation);
            }
            catch (error) {
                const publishingError = this.createPublishingError(error, platform, operationName, { ...context, attempt: attempts });
                lastError = publishingError;
                operationLogger.error(`Publishing attempt ${attempts} failed`, publishingError, {
                    attempt: attempts,
                    errorType: this.classifyError(publishingError),
                    statusCode: publishingError.statusCode,
                    retryable: publishingError.retryable
                });
                throw publishingError;
            }
        };
        try {
            const result = await this.retryWithStrategy(executeAttempt, platform, operationName);
            operationLogger.info(`Publishing succeeded after ${attempts} attempt(s)`, {
                attempts,
                duration: Date.now() - startTime
            });
            return {
                success: true,
                postId: result?.postId,
                postUrl: result?.postUrl,
                attempts,
                totalDuration: Date.now() - startTime
            };
        }
        catch (error) {
            const finalError = error;
            const errorType = this.classifyError(finalError);
            const strategy = ERROR_STRATEGIES[errorType];
            operationLogger.error(`Publishing failed after ${attempts} attempt(s)`, finalError, {
                attempts,
                duration: Date.now() - startTime,
                errorType,
                strategy: strategy.userMessage,
                recoveryActions: strategy.recoveryActions
            });
            return {
                success: false,
                error: finalError,
                attempts,
                totalDuration: Date.now() - startTime
            };
        }
    }
    async retryWithStrategy(operation, platform, operationName) {
        const defaultConfig = {
            maxAttempts: 3,
            baseDelayMs: 1000,
            maxDelayMs: 30000,
            backoffMultiplier: 2,
            jitterFactor: 0.3
        };
        let lastError;
        let currentConfig = defaultConfig;
        for (let attempt = 1; attempt <= currentConfig.maxAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                const errorType = this.classifyError(lastError);
                const strategy = ERROR_STRATEGIES[errorType];
                if (strategy.retryConfig) {
                    currentConfig = { ...defaultConfig, ...strategy.retryConfig };
                }
                if (!strategy.shouldRetry || attempt >= currentConfig.maxAttempts) {
                    throw lastError;
                }
                const baseDelay = currentConfig.baseDelayMs * Math.pow(currentConfig.backoffMultiplier, attempt - 1);
                const jitter = baseDelay * currentConfig.jitterFactor * Math.random();
                const delay = Math.min(baseDelay + jitter, currentConfig.maxDelayMs);
                this.logger.debug(`Retrying ${operationName} for ${platform} in ${Math.round(delay)}ms`, {
                    attempt,
                    maxAttempts: currentConfig.maxAttempts,
                    delay: Math.round(delay),
                    errorType,
                    strategy: strategy.userMessage
                });
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    getErrorDetails(error) {
        const errorType = this.classifyError(error);
        const strategy = ERROR_STRATEGIES[errorType] || ERROR_STRATEGIES['platform_api_error'];
        return {
            userMessage: strategy.userMessage,
            recoveryActions: strategy.recoveryActions,
            technicalDetails: `${error.platform} API Error: ${error.message}${error.statusCode ? ` (Status: ${error.statusCode})` : ''}`,
            shouldRetry: strategy.shouldRetry
        };
    }
    getCircuitBreakerStatus() {
        const status = {};
        for (const [platform, breaker] of this.circuitBreakers) {
            status[platform] = breaker.getState();
        }
        return status;
    }
    resetCircuitBreaker(platform) {
        this.circuitBreakers.delete(platform);
        this.logger.info(`Circuit breaker reset for ${platform}`);
    }
}
exports.PublishingErrorHandler = PublishingErrorHandler;
class PublishingError extends Error {
    constructor(message, platform, operation, retryable, category, statusCode, platformError, context) {
        super(message);
        this.platform = platform;
        this.operation = operation;
        this.retryable = retryable;
        this.category = category;
        this.statusCode = statusCode;
        this.platformError = platformError;
        this.context = context;
        this.name = 'PublishingError';
    }
}
exports.publishingErrorHandler = new PublishingErrorHandler();
