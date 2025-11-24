"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceWrapper = exports.ServiceWrapper = exports.CircuitBreaker = exports.ServiceErrorFactory = void 0;
exports.executeService = executeService;
exports.createServiceError = createServiceError;
exports.withErrorHandling = withErrorHandling;
const error_handling_1 = require("./error-handling");
class ServiceErrorFactory {
    static create(message, code, category, context, options = {}) {
        const error = new Error(message);
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
    static isRetryableByCategory(category) {
        return [
            error_handling_1.ErrorCategory.NETWORK,
            error_handling_1.ErrorCategory.AI_OPERATION,
            error_handling_1.ErrorCategory.DATABASE,
            error_handling_1.ErrorCategory.SERVER_ERROR,
            error_handling_1.ErrorCategory.RATE_LIMIT
        ].includes(category);
    }
    static getSeverityByCategory(category) {
        switch (category) {
            case error_handling_1.ErrorCategory.VALIDATION:
            case error_handling_1.ErrorCategory.NOT_FOUND:
                return 'low';
            case error_handling_1.ErrorCategory.NETWORK:
            case error_handling_1.ErrorCategory.RATE_LIMIT:
                return 'medium';
            case error_handling_1.ErrorCategory.AUTHENTICATION:
            case error_handling_1.ErrorCategory.AUTHORIZATION:
            case error_handling_1.ErrorCategory.AI_OPERATION:
                return 'high';
            case error_handling_1.ErrorCategory.DATABASE:
            case error_handling_1.ErrorCategory.SERVER_ERROR:
                return 'critical';
            default:
                return 'medium';
        }
    }
    static getUserMessageByCategory(category, originalMessage) {
        switch (category) {
            case error_handling_1.ErrorCategory.NETWORK:
                return 'Unable to connect to the server. Please check your internet connection.';
            case error_handling_1.ErrorCategory.AUTHENTICATION:
                return 'Authentication failed. Please sign in again.';
            case error_handling_1.ErrorCategory.AUTHORIZATION:
                return 'You don\'t have permission to perform this action.';
            case error_handling_1.ErrorCategory.VALIDATION:
                return 'Some information is missing or incorrect. Please review and try again.';
            case error_handling_1.ErrorCategory.AI_OPERATION:
                return 'AI operation failed. This is usually temporary.';
            case error_handling_1.ErrorCategory.DATABASE:
                return 'Unable to access your data right now. Please try again.';
            case error_handling_1.ErrorCategory.RATE_LIMIT:
                return 'Too many requests. Please wait a moment and try again.';
            case error_handling_1.ErrorCategory.NOT_FOUND:
                return 'The requested resource could not be found.';
            case error_handling_1.ErrorCategory.SERVER_ERROR:
                return 'Something went wrong on our end. We\'re working on it.';
            default:
                return originalMessage || 'An unexpected error occurred.';
        }
    }
    static getSuggestedActionsByCategory(category) {
        switch (category) {
            case error_handling_1.ErrorCategory.NETWORK:
                return [
                    'Check your internet connection',
                    'Try refreshing the page',
                    'Wait a moment and try again'
                ];
            case error_handling_1.ErrorCategory.AUTHENTICATION:
                return [
                    'Sign in again',
                    'Check your credentials',
                    'Use the "Forgot Password" option if needed'
                ];
            case error_handling_1.ErrorCategory.AUTHORIZATION:
                return [
                    'Contact your administrator for access',
                    'Ensure you\'re signed in to the correct account',
                    'Upgrade your plan if needed'
                ];
            case error_handling_1.ErrorCategory.VALIDATION:
                return [
                    'Check all required fields are filled',
                    'Ensure data is in the correct format',
                    'Review any highlighted errors'
                ];
            case error_handling_1.ErrorCategory.AI_OPERATION:
                return [
                    'Try again in a moment',
                    'Simplify your request if it\'s complex',
                    'Contact support if this continues'
                ];
            case error_handling_1.ErrorCategory.DATABASE:
                return [
                    'Try refreshing the page',
                    'Wait a moment and try again',
                    'Contact support if this persists'
                ];
            case error_handling_1.ErrorCategory.RATE_LIMIT:
                return [
                    'Wait a few minutes before trying again',
                    'Avoid rapid repeated attempts',
                    'Contact support if this persists'
                ];
            case error_handling_1.ErrorCategory.NOT_FOUND:
                return [
                    'Check the URL for typos',
                    'Return to the dashboard',
                    'Contact support if you believe this is an error'
                ];
            case error_handling_1.ErrorCategory.SERVER_ERROR:
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
exports.ServiceErrorFactory = ServiceErrorFactory;
class CircuitBreaker {
    constructor(config) {
        this.config = config;
        this.failures = 0;
        this.lastFailureTime = 0;
        this.state = 'closed';
    }
    async execute(operation) {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
                this.state = 'half-open';
            }
            else {
                throw ServiceErrorFactory.create('Service temporarily unavailable', 'CIRCUIT_BREAKER_OPEN', error_handling_1.ErrorCategory.SERVER_ERROR, { operation: 'circuit_breaker', timestamp: new Date() }, {
                    userMessage: 'This service is temporarily unavailable. Please try again later.',
                    suggestedActions: ['Wait a few minutes and try again', 'Contact support if this persists']
                });
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
        this.failures = 0;
        this.state = 'closed';
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.config.failureThreshold) {
            this.state = 'open';
        }
    }
    getState() {
        return this.state;
    }
    getFailureCount() {
        return this.failures;
    }
}
exports.CircuitBreaker = CircuitBreaker;
class ServiceWrapper {
    constructor() {
        this.circuitBreakers = new Map();
        this.fallbackCache = new Map();
    }
    async execute(operation, fallbackConfig) {
        const startTime = Date.now();
        try {
            const circuitBreaker = this.getCircuitBreaker(operation.context.operation);
            const result = await circuitBreaker.execute(async () => {
                return await (0, error_handling_1.retryWithBackoff)(operation.operation, {
                    maxAttempts: operation.maxRetries ?? 3,
                    baseDelay: operation.baseDelay ?? 1000,
                    maxDelay: operation.maxDelay ?? 30000,
                    backoffMultiplier: 2,
                    onRetry: (attempt, error) => {
                        console.warn(`Retry attempt ${attempt} for ${operation.context.operation}:`, error.message);
                        operation.onRetry?.(error, attempt);
                    }
                });
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
        }
        catch (error) {
            const serviceError = this.processError(error, operation.context);
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
                }
                catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                }
            }
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
    async executeWithGracefulDegradation(primaryOperation, fallbackOperation, context) {
        try {
            const result = await this.execute({
                operation: primaryOperation,
                context,
                maxRetries: 2
            });
            if (result.success) {
                return result;
            }
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
        }
        catch (error) {
            const serviceError = this.processError(error, context);
            return {
                success: false,
                error: serviceError,
                message: serviceError.userMessage,
                timestamp: new Date()
            };
        }
    }
    getCircuitBreaker(operationName) {
        if (!this.circuitBreakers.has(operationName)) {
            this.circuitBreakers.set(operationName, new CircuitBreaker({
                failureThreshold: 5,
                resetTimeout: 60000,
                monitoringPeriod: 300000
            }));
        }
        return this.circuitBreakers.get(operationName);
    }
    async executeFallback(config) {
        if (config.cacheKey) {
            const cached = this.fallbackCache.get(config.cacheKey);
            if (cached && Date.now() - cached.timestamp < cached.ttl) {
                return cached.value;
            }
        }
        if (config.fallbackFunction) {
            const result = await config.fallbackFunction();
            if (config.cacheKey && config.cacheTTL) {
                this.fallbackCache.set(config.cacheKey, {
                    value: result,
                    timestamp: Date.now(),
                    ttl: config.cacheTTL
                });
            }
            return result;
        }
        if (config.fallbackValue !== undefined) {
            return config.fallbackValue;
        }
        throw new Error('No fallback configured');
    }
    processError(error, context) {
        if ('code' in error && 'category' in error) {
            return error;
        }
        const pattern = (0, error_handling_1.handleError)(error, { showToast: false, logError: false });
        return ServiceErrorFactory.create(error.message, this.generateErrorCode(pattern.category, context.operation), pattern.category, context, {
            userMessage: pattern.userMessage,
            suggestedActions: pattern.suggestedActions,
            originalError: error
        });
    }
    generateErrorCode(category, operation) {
        const categoryCode = category.toUpperCase().replace('_', '');
        const operationCode = operation.toUpperCase().replace(/[^A-Z0-9]/g, '');
        return `${categoryCode}_${operationCode}`;
    }
    logError(error, context) {
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
        if (error.severity === 'critical' || error.severity === 'high') {
            console.error('[CRITICAL ERROR]', logData);
        }
        else {
            console.warn('[ERROR]', logData);
        }
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
            this.sendToMonitoring(logData);
        }
    }
    sendToMonitoring(logData) {
        console.log('[MONITORING]', logData);
    }
    clearFallbackCache(cacheKey) {
        if (cacheKey) {
            this.fallbackCache.delete(cacheKey);
        }
        else {
            this.fallbackCache.clear();
        }
    }
    getCircuitBreakerStatus() {
        const status = {};
        this.circuitBreakers.forEach((breaker, name) => {
            status[name] = {
                state: breaker.getState(),
                failures: breaker.getFailureCount()
            };
        });
        return status;
    }
}
exports.ServiceWrapper = ServiceWrapper;
exports.serviceWrapper = new ServiceWrapper();
async function executeService(operation, context, options = {}) {
    if (options.gracefulDegradation) {
        return exports.serviceWrapper.executeWithGracefulDegradation(operation, options.gracefulDegradation, context);
    }
    return exports.serviceWrapper.execute({
        operation,
        context,
        maxRetries: options.maxRetries
    }, options.fallback);
}
function createServiceError(message, operation, category = error_handling_1.ErrorCategory.UNKNOWN, originalError) {
    return ServiceErrorFactory.create(message, `${category.toUpperCase()}_${operation.toUpperCase()}`, category, { operation, timestamp: new Date() }, { originalError });
}
function withErrorHandling(fn, operation) {
    return async (...args) => {
        return executeService(() => fn(...args), { operation, timestamp: new Date() });
    };
}
