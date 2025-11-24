"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataQualityValidator = exports.retryHandler = exports.alertErrorHandler = exports.DataQualityValidator = exports.RetryHandler = exports.AlertErrorHandler = exports.DEFAULT_RETRY_CONFIG = exports.RetryExhaustedError = exports.DataQualityError = exports.ExternalAPIError = exports.AlertProcessingError = void 0;
exports.withErrorHandling = withErrorHandling;
exports.withRetry = withRetry;
exports.createUserFriendlyMessage = createUserFriendlyMessage;
const logger_1 = require("@/aws/logging/logger");
class AlertProcessingError extends Error {
    constructor(message, alertType, userId, cause) {
        super(message);
        this.alertType = alertType;
        this.userId = userId;
        this.cause = cause;
        this.name = 'AlertProcessingError';
    }
}
exports.AlertProcessingError = AlertProcessingError;
class ExternalAPIError extends Error {
    constructor(message, apiName, statusCode, retryable = true, cause) {
        super(message);
        this.apiName = apiName;
        this.statusCode = statusCode;
        this.retryable = retryable;
        this.cause = cause;
        this.name = 'ExternalAPIError';
    }
}
exports.ExternalAPIError = ExternalAPIError;
class DataQualityError extends Error {
    constructor(message, dataType, validationErrors, cause) {
        super(message);
        this.dataType = dataType;
        this.validationErrors = validationErrors;
        this.cause = cause;
        this.name = 'DataQualityError';
    }
}
exports.DataQualityError = DataQualityError;
class RetryExhaustedError extends Error {
    constructor(message, operation, attempts, lastError) {
        super(message);
        this.operation = operation;
        this.attempts = attempts;
        this.lastError = lastError;
        this.name = 'RetryExhaustedError';
    }
}
exports.RetryExhaustedError = RetryExhaustedError;
exports.DEFAULT_RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ThrottlingException',
        'ServiceUnavailableException',
        'InternalServerErrorException',
        'TooManyRequestsException',
    ],
};
class AlertErrorHandler {
    constructor() {
        this.logger = (0, logger_1.createLogger)({ service: 'alert-error-handler' });
    }
    handleError(error, context) {
        const { operation, userId, alertType, ...logContext } = context;
        this.logger.error(`Error in ${operation}`, error, {
            ...logContext,
            userId,
            alertType,
            errorType: error.constructor.name,
        });
        if (error instanceof ExternalAPIError) {
            return this.handleExternalAPIError(error);
        }
        if (error instanceof DataQualityError) {
            return this.handleDataQualityError(error);
        }
        if (error instanceof AlertProcessingError) {
            return this.handleAlertProcessingError(error);
        }
        if (error instanceof RetryExhaustedError) {
            return this.handleRetryExhaustedError(error);
        }
        if (this.isAWSError(error)) {
            return this.handleAWSError(error);
        }
        if (this.isNetworkError(error)) {
            return this.handleNetworkError(error);
        }
        return {
            userMessage: 'An unexpected error occurred. Please try again later.',
            shouldRetry: false,
            logLevel: 'ERROR',
        };
    }
    handleExternalAPIError(error) {
        const apiMessages = {
            'mls-api': 'MLS data service is temporarily unavailable. Alerts may be delayed.',
            'public-records': 'Public records service is temporarily unavailable. Life event analysis may be delayed.',
            'demographics': 'Demographics service is temporarily unavailable. Neighborhood profiles may be incomplete.',
            'schools': 'School ratings service is temporarily unavailable. Neighborhood profiles may be incomplete.',
            'walkability': 'Walkability service is temporarily unavailable. Neighborhood profiles may be incomplete.',
            'google-places': 'Places service is temporarily unavailable. Amenities data may be incomplete.',
        };
        const userMessage = apiMessages[error.apiName] ||
            `External service (${error.apiName}) is temporarily unavailable. Please try again later.`;
        return {
            userMessage,
            shouldRetry: error.retryable && (error.statusCode === undefined || error.statusCode >= 500),
            logLevel: error.retryable ? 'WARN' : 'ERROR',
        };
    }
    handleDataQualityError(error) {
        return {
            userMessage: `Data quality issue detected in ${error.dataType}. The system will continue with available data.`,
            shouldRetry: false,
            logLevel: 'WARN',
        };
    }
    handleAlertProcessingError(error) {
        const alertTypeMessages = {
            'life-event-lead': 'Life event analysis encountered an issue. Some leads may not be detected.',
            'competitor-new-listing': 'Competitor monitoring encountered an issue. Some new listings may not be detected.',
            'competitor-price-reduction': 'Price reduction monitoring encountered an issue. Some price changes may not be detected.',
            'competitor-withdrawal': 'Competitor monitoring encountered an issue. Some listing changes may not be detected.',
            'neighborhood-trend': 'Trend analysis encountered an issue. Some market trends may not be detected.',
            'price-reduction': 'Price reduction monitoring encountered an issue. Some price changes may not be detected.',
        };
        return {
            userMessage: alertTypeMessages[error.alertType] || 'Alert processing encountered an issue.',
            shouldRetry: true,
            logLevel: 'WARN',
        };
    }
    handleRetryExhaustedError(error) {
        return {
            userMessage: `Operation ${error.operation} failed after ${error.attempts} attempts. Please try again later.`,
            shouldRetry: false,
            logLevel: 'ERROR',
        };
    }
    handleAWSError(error) {
        const message = error.message.toLowerCase();
        if (message.includes('throttl') || message.includes('rate')) {
            return {
                userMessage: 'Service is temporarily busy. Please try again in a moment.',
                shouldRetry: true,
                logLevel: 'WARN',
            };
        }
        if (message.includes('dynamodb') || message.includes('provisioned throughput')) {
            return {
                userMessage: 'Database service is temporarily unavailable. Please try again.',
                shouldRetry: true,
                logLevel: 'WARN',
            };
        }
        if (message.includes('s3') || message.includes('bucket')) {
            return {
                userMessage: 'File storage service is temporarily unavailable. Please try again.',
                shouldRetry: true,
                logLevel: 'WARN',
            };
        }
        return {
            userMessage: 'AWS service error occurred. Please try again later.',
            shouldRetry: true,
            logLevel: 'ERROR',
        };
    }
    handleNetworkError(error) {
        return {
            userMessage: 'Network connection error. Please check your internet connection and try again.',
            shouldRetry: true,
            logLevel: 'WARN',
        };
    }
    isAWSError(error) {
        return error.name.includes('Exception') ||
            error.message.includes('AWS') ||
            error.message.includes('DynamoDB') ||
            error.message.includes('S3') ||
            error.message.includes('Bedrock');
    }
    isNetworkError(error) {
        const networkErrorCodes = ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH'];
        return networkErrorCodes.some(code => error.message.includes(code));
    }
}
exports.AlertErrorHandler = AlertErrorHandler;
class RetryHandler {
    constructor() {
        this.logger = (0, logger_1.createLogger)({ service: 'retry-handler' });
    }
    async withRetry(operation, config = {}, context) {
        const retryConfig = { ...exports.DEFAULT_RETRY_CONFIG, ...config };
        let lastError;
        let attempt = 0;
        while (attempt < retryConfig.maxAttempts) {
            attempt++;
            try {
                if (attempt > 1) {
                    this.logger.info(`Retry attempt ${attempt}/${retryConfig.maxAttempts}`, {
                        ...context,
                        attempt,
                    });
                }
                const result = await operation();
                if (attempt > 1) {
                    this.logger.info(`Operation succeeded on attempt ${attempt}`, {
                        ...context,
                        attempt,
                    });
                }
                return result;
            }
            catch (error) {
                lastError = error;
                this.logger.warn(`Operation failed on attempt ${attempt}`, lastError, {
                    ...context,
                    attempt,
                    willRetry: attempt < retryConfig.maxAttempts && this.shouldRetry(lastError, retryConfig),
                });
                if (attempt >= retryConfig.maxAttempts || !this.shouldRetry(lastError, retryConfig)) {
                    break;
                }
                const delay = Math.min(retryConfig.baseDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1), retryConfig.maxDelayMs);
                const jitteredDelay = delay + Math.random() * 1000;
                this.logger.debug(`Waiting ${jitteredDelay}ms before retry`, {
                    ...context,
                    delay: jitteredDelay,
                    attempt,
                });
                await this.sleep(jitteredDelay);
            }
        }
        throw new RetryExhaustedError(`Operation failed after ${attempt} attempts: ${lastError.message}`, context.operation, attempt, lastError);
    }
    shouldRetry(error, config) {
        if (error instanceof ExternalAPIError) {
            return error.retryable;
        }
        if (error instanceof DataQualityError) {
            return false;
        }
        return config.retryableErrors.some(pattern => error.message.includes(pattern) ||
            error.name.includes(pattern) ||
            error.code === pattern);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.RetryHandler = RetryHandler;
class DataQualityValidator {
    constructor() {
        this.logger = (0, logger_1.createLogger)({ service: 'data-quality-validator' });
    }
    validateAlert(alert) {
        const errors = [];
        if (!alert.id)
            errors.push('Alert ID is required');
        if (!alert.type)
            errors.push('Alert type is required');
        if (!alert.priority)
            errors.push('Alert priority is required');
        if (!alert.status)
            errors.push('Alert status is required');
        if (!alert.createdAt)
            errors.push('Alert creation date is required');
        if (!alert.data)
            errors.push('Alert data is required');
        if (alert.type && alert.data) {
            const typeErrors = this.validateAlertTypeData(alert.type, alert.data);
            errors.push(...typeErrors);
        }
        if (alert.createdAt && !this.isValidDate(alert.createdAt)) {
            errors.push('Invalid creation date format');
        }
        if (alert.readAt && !this.isValidDate(alert.readAt)) {
            errors.push('Invalid read date format');
        }
        if (alert.dismissedAt && !this.isValidDate(alert.dismissedAt)) {
            errors.push('Invalid dismissal date format');
        }
        if (alert.priority && !['high', 'medium', 'low'].includes(alert.priority)) {
            errors.push('Invalid alert priority');
        }
        if (alert.status && !['unread', 'read', 'dismissed', 'archived'].includes(alert.status)) {
            errors.push('Invalid alert status');
        }
        const isValid = errors.length === 0;
        if (!isValid) {
            this.logger.warn('Alert data validation failed', undefined, {
                alertId: alert.id,
                alertType: alert.type,
                errors,
            });
        }
        return { isValid, errors };
    }
    validateAlertSettings(settings) {
        const errors = [];
        if (!settings.userId)
            errors.push('User ID is required');
        if (!settings.enabledAlertTypes)
            errors.push('Enabled alert types is required');
        if (!settings.frequency)
            errors.push('Alert frequency is required');
        if (settings.leadScoreThreshold === undefined)
            errors.push('Lead score threshold is required');
        if (settings.frequency && !['real-time', 'daily', 'weekly'].includes(settings.frequency)) {
            errors.push('Invalid alert frequency');
        }
        if (settings.leadScoreThreshold !== undefined) {
            if (settings.leadScoreThreshold < 50 || settings.leadScoreThreshold > 90) {
                errors.push('Lead score threshold must be between 50 and 90');
            }
        }
        if (settings.targetAreas) {
            for (const area of settings.targetAreas) {
                const areaErrors = this.validateTargetArea(area);
                errors.push(...areaErrors);
            }
        }
        if (settings.priceRangeFilters) {
            const { min, max } = settings.priceRangeFilters;
            if (min !== undefined && min < 0) {
                errors.push('Minimum price must be non-negative');
            }
            if (max !== undefined && max < 0) {
                errors.push('Maximum price must be non-negative');
            }
            if (min !== undefined && max !== undefined && min > max) {
                errors.push('Minimum price cannot be greater than maximum price');
            }
        }
        const isValid = errors.length === 0;
        if (!isValid) {
            this.logger.warn('Alert settings validation failed', undefined, {
                userId: settings.userId,
                errors,
            });
        }
        return { isValid, errors };
    }
    validateTargetArea(area) {
        const errors = [];
        if (!area.id)
            errors.push('Target area ID is required');
        if (!area.type)
            errors.push('Target area type is required');
        if (!area.value)
            errors.push('Target area value is required');
        if (!area.label)
            errors.push('Target area label is required');
        if (area.type === 'zip' && typeof area.value === 'string') {
            if (!/^\d{5}(-\d{4})?$/.test(area.value)) {
                errors.push('Invalid ZIP code format');
            }
        }
        if (area.type === 'polygon' && typeof area.value === 'object') {
            const polygon = area.value;
            if (!polygon.coordinates || !Array.isArray(polygon.coordinates)) {
                errors.push('Polygon must have coordinates array');
            }
            else if (polygon.coordinates.length < 3) {
                errors.push('Polygon must have at least 3 coordinates');
            }
        }
        return errors;
    }
    validateAlertTypeData(type, data) {
        const errors = [];
        switch (type) {
            case 'life-event-lead':
                if (!data.prospectLocation)
                    errors.push('Prospect location is required');
                if (!data.eventType)
                    errors.push('Event type is required');
                if (!data.eventDate)
                    errors.push('Event date is required');
                if (data.leadScore === undefined)
                    errors.push('Lead score is required');
                if (data.leadScore < 0 || data.leadScore > 100)
                    errors.push('Lead score must be between 0 and 100');
                break;
            case 'competitor-new-listing':
            case 'competitor-withdrawal':
                if (!data.competitorName)
                    errors.push('Competitor name is required');
                if (!data.propertyAddress)
                    errors.push('Property address is required');
                break;
            case 'competitor-price-reduction':
                if (!data.competitorName)
                    errors.push('Competitor name is required');
                if (!data.propertyAddress)
                    errors.push('Property address is required');
                if (data.originalPrice === undefined)
                    errors.push('Original price is required');
                if (data.newPrice === undefined)
                    errors.push('New price is required');
                if (data.originalPrice <= data.newPrice)
                    errors.push('Original price must be greater than new price');
                break;
            case 'neighborhood-trend':
                if (!data.neighborhood)
                    errors.push('Neighborhood is required');
                if (!data.trendType)
                    errors.push('Trend type is required');
                if (data.currentValue === undefined)
                    errors.push('Current value is required');
                if (data.previousValue === undefined)
                    errors.push('Previous value is required');
                if (data.changePercent === undefined)
                    errors.push('Change percent is required');
                break;
            case 'price-reduction':
                if (!data.propertyAddress)
                    errors.push('Property address is required');
                if (data.originalPrice === undefined)
                    errors.push('Original price is required');
                if (data.newPrice === undefined)
                    errors.push('New price is required');
                if (data.originalPrice <= data.newPrice)
                    errors.push('Original price must be greater than new price');
                if (!data.propertyDetails)
                    errors.push('Property details are required');
                break;
        }
        return errors;
    }
    isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && dateString === date.toISOString();
    }
    sanitizeExternalData(data, dataType) {
        try {
            const sanitized = this.removeNullValues(data);
            switch (dataType) {
                case 'mls-listing':
                    return this.sanitizeMLSData(sanitized);
                case 'demographics':
                    return this.sanitizeDemographicsData(sanitized);
                case 'school-ratings':
                    return this.sanitizeSchoolData(sanitized);
                case 'walkability':
                    return this.sanitizeWalkabilityData(sanitized);
                default:
                    return sanitized;
            }
        }
        catch (error) {
            this.logger.warn(`Data sanitization failed for ${dataType}`, error, {
                dataType,
            });
            throw new DataQualityError(`Failed to sanitize ${dataType} data`, dataType, [error.message]);
        }
    }
    removeNullValues(obj) {
        if (obj === null || obj === undefined) {
            return null;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.removeNullValues(item)).filter(item => item !== null);
        }
        if (typeof obj === 'object') {
            const cleaned = {};
            for (const [key, value] of Object.entries(obj)) {
                const cleanedValue = this.removeNullValues(value);
                if (cleanedValue !== null) {
                    cleaned[key] = cleanedValue;
                }
            }
            return cleaned;
        }
        return obj;
    }
    sanitizeMLSData(data) {
        return {
            ...data,
            price: this.sanitizeNumber(data.price, 0),
            bedrooms: this.sanitizeNumber(data.bedrooms, 0),
            bathrooms: this.sanitizeNumber(data.bathrooms, 0),
            squareFeet: this.sanitizeNumber(data.squareFeet, 0),
            daysOnMarket: this.sanitizeNumber(data.daysOnMarket, 0),
            address: this.sanitizeString(data.address),
            propertyType: this.sanitizeString(data.propertyType),
        };
    }
    sanitizeDemographicsData(data) {
        return {
            ...data,
            population: this.sanitizeNumber(data.population, 0),
            medianHouseholdIncome: this.sanitizeNumber(data.medianHouseholdIncome, 0),
            ageDistribution: data.ageDistribution ? {
                under18: this.sanitizeNumber(data.ageDistribution.under18, 0),
                age18to34: this.sanitizeNumber(data.ageDistribution.age18to34, 0),
                age35to54: this.sanitizeNumber(data.ageDistribution.age35to54, 0),
                age55to74: this.sanitizeNumber(data.ageDistribution.age55to74, 0),
                over75: this.sanitizeNumber(data.ageDistribution.over75, 0),
            } : undefined,
        };
    }
    sanitizeSchoolData(data) {
        if (Array.isArray(data)) {
            return data.map(school => ({
                ...school,
                rating: this.sanitizeNumber(school.rating, 1, 10),
                distance: this.sanitizeNumber(school.distance, 0),
                name: this.sanitizeString(school.name),
                type: this.sanitizeString(school.type),
            }));
        }
        return data;
    }
    sanitizeWalkabilityData(data) {
        return {
            ...data,
            score: this.sanitizeNumber(data.score, 0, 100),
            description: this.sanitizeString(data.description),
        };
    }
    sanitizeNumber(value, min, max) {
        const num = Number(value);
        if (isNaN(num)) {
            return min || 0;
        }
        let sanitized = num;
        if (min !== undefined && sanitized < min)
            sanitized = min;
        if (max !== undefined && sanitized > max)
            sanitized = max;
        return sanitized;
    }
    sanitizeString(value) {
        if (typeof value !== 'string') {
            return String(value || '');
        }
        return value.trim();
    }
}
exports.DataQualityValidator = DataQualityValidator;
exports.alertErrorHandler = new AlertErrorHandler();
exports.retryHandler = new RetryHandler();
exports.dataQualityValidator = new DataQualityValidator();
function withErrorHandling(fn, context) {
    return (async (...args) => {
        const logger = (0, logger_1.createLogger)({ service: context.service });
        const startTime = Date.now();
        try {
            logger.debug(`Starting ${context.operation}`, {
                operation: context.operation,
                args: args.length,
            });
            const result = await fn(...args);
            logger.debug(`Completed ${context.operation}`, {
                operation: context.operation,
                duration: Date.now() - startTime,
            });
            return result;
        }
        catch (error) {
            const errorResult = exports.alertErrorHandler.handleError(error, {
                operation: context.operation,
                service: context.service,
                duration: Date.now() - startTime,
            });
            logger.error(`Failed ${context.operation}`, error, {
                operation: context.operation,
                duration: Date.now() - startTime,
                shouldRetry: errorResult.shouldRetry,
            });
            throw error;
        }
    });
}
function withRetry(fn, retryConfig, context) {
    return (async (...args) => {
        return exports.retryHandler.withRetry(() => fn(...args), retryConfig, { operation: context?.operation || fn.name });
    });
}
function createUserFriendlyMessage(error, operation) {
    const result = exports.alertErrorHandler.handleError(error, { operation });
    return result.userMessage;
}
