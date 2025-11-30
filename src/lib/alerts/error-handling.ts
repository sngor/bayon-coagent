/**
 * Market Intelligence Alerts - Error Handling and Logging
 * 
 * Provides comprehensive error handling, logging, retry logic, and data quality validation
 * for all alert processing components.
 */

import { logger, createLogger, LogContext } from '@/aws/logging/logger';
import type { AlertType, Alert, AlertSettings, TargetArea } from './types';

// ==================== Error Types ====================

export class AlertProcessingError extends Error {
    constructor(
        message: string,
        public readonly alertType: AlertType,
        public readonly userId?: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'AlertProcessingError';
    }
}

export class ExternalAPIError extends Error {
    constructor(
        message: string,
        public readonly apiName: string,
        public readonly statusCode?: number,
        public readonly retryable: boolean = true,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'ExternalAPIError';
    }
}

export class DataQualityError extends Error {
    constructor(
        message: string,
        public readonly dataType: string,
        public readonly validationErrors: string[],
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'DataQualityError';
    }
}

export class RetryExhaustedError extends Error {
    constructor(
        message: string,
        public readonly operation: string,
        public readonly attempts: number,
        public readonly lastError: Error
    ) {
        super(message);
        this.name = 'RetryExhaustedError';
    }
}

// ==================== Retry Configuration ====================

export interface RetryConfig {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    retryableErrors: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
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

// ==================== Error Handler Class ====================

export class AlertErrorHandler {
    private logger = createLogger({ service: 'alert-error-handler' });

    /**
     * Handles errors with appropriate logging and user-friendly messages
     */
    handleError(
        error: Error,
        context: LogContext & {
            operation: string;
            userId?: string;
            alertType?: AlertType;
        }
    ): {
        userMessage: string;
        shouldRetry: boolean;
        logLevel: 'WARN' | 'ERROR';
    } {
        const { operation, userId, alertType, ...logContext } = context;

        // Log the error with full context
        this.logger.error(
            `Error in ${operation}`,
            error,
            {
                ...logContext,
                userId,
                alertType,
                errorType: error.constructor.name,
            }
        );

        // Determine error handling strategy
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

        // Handle AWS SDK errors
        if (this.isAWSError(error)) {
            return this.handleAWSError(error);
        }

        // Handle network errors
        if (this.isNetworkError(error)) {
            return this.handleNetworkError(error);
        }

        // Default error handling
        return {
            userMessage: 'An unexpected error occurred. Please try again later.',
            shouldRetry: false,
            logLevel: 'ERROR',
        };
    }

    /**
     * Handles external API errors with appropriate retry logic
     */
    private handleExternalAPIError(error: ExternalAPIError): {
        userMessage: string;
        shouldRetry: boolean;
        logLevel: 'WARN' | 'ERROR';
    } {
        const apiMessages: Record<string, string> = {
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

    /**
     * Handles data quality errors
     */
    private handleDataQualityError(error: DataQualityError): {
        userMessage: string;
        shouldRetry: boolean;
        logLevel: 'WARN' | 'ERROR';
    } {
        return {
            userMessage: `Data quality issue detected in ${error.dataType}. The system will continue with available data.`,
            shouldRetry: false,
            logLevel: 'WARN',
        };
    }

    /**
     * Handles alert processing errors
     */
    private handleAlertProcessingError(error: AlertProcessingError): {
        userMessage: string;
        shouldRetry: boolean;
        logLevel: 'WARN' | 'ERROR';
    } {
        const alertTypeMessages: Record<AlertType, string> = {
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

    /**
     * Handles retry exhausted errors
     */
    private handleRetryExhaustedError(error: RetryExhaustedError): {
        userMessage: string;
        shouldRetry: boolean;
        logLevel: 'WARN' | 'ERROR';
    } {
        return {
            userMessage: `Operation ${error.operation} failed after ${error.attempts} attempts. Please try again later.`,
            shouldRetry: false,
            logLevel: 'ERROR',
        };
    }

    /**
     * Handles AWS service errors
     */
    private handleAWSError(error: Error): {
        userMessage: string;
        shouldRetry: boolean;
        logLevel: 'WARN' | 'ERROR';
    } {
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

    /**
     * Handles network errors
     */
    private handleNetworkError(error: Error): {
        userMessage: string;
        shouldRetry: boolean;
        logLevel: 'WARN' | 'ERROR';
    } {
        return {
            userMessage: 'Network connection error. Please check your internet connection and try again.',
            shouldRetry: true,
            logLevel: 'WARN',
        };
    }

    /**
     * Checks if error is an AWS SDK error
     */
    private isAWSError(error: Error): boolean {
        return error.name.includes('Exception') ||
            error.message.includes('AWS') ||
            error.message.includes('DynamoDB') ||
            error.message.includes('S3') ||
            error.message.includes('Bedrock');
    }

    /**
     * Checks if error is a network error
     */
    private isNetworkError(error: Error): boolean {
        const networkErrorCodes = ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH'];
        return networkErrorCodes.some(code => error.message.includes(code));
    }
}

// ==================== Retry Logic ====================

export class RetryHandler {
    private logger = createLogger({ service: 'retry-handler' });

    /**
     * Executes an operation with retry logic
     */
    async withRetry<T>(
        operation: () => Promise<T>,
        config: Partial<RetryConfig> = {},
        context: LogContext & { operation: string }
    ): Promise<T> {
        const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
        let lastError: Error = new Error('Operation failed before first attempt');
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
            } catch (error) {
                lastError = error as Error;

                this.logger.warn(`Operation failed on attempt ${attempt}`, {
                    ...context,
                    attempt,
                    willRetry: attempt < retryConfig.maxAttempts && this.shouldRetry(lastError, retryConfig),
                    error: lastError
                });

                // Don't retry if this is the last attempt or error is not retryable
                if (attempt >= retryConfig.maxAttempts || !this.shouldRetry(lastError, retryConfig)) {
                    break;
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(
                    retryConfig.baseDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
                    retryConfig.maxDelayMs
                );

                // Add jitter to prevent thundering herd
                const jitteredDelay = delay + Math.random() * 1000;

                this.logger.debug(`Waiting ${jitteredDelay}ms before retry`, {
                    ...context,
                    delay: jitteredDelay,
                    attempt,
                });

                await this.sleep(jitteredDelay);
            }
        }

        throw new RetryExhaustedError(
            `Operation failed after ${attempt} attempts: ${lastError.message}`,
            context.operation,
            attempt,
            lastError
        );
    }

    /**
     * Determines if an error should trigger a retry
     */
    private shouldRetry(error: Error, config: RetryConfig): boolean {
        // Check if error type is retryable
        if (error instanceof ExternalAPIError) {
            return error.retryable;
        }

        if (error instanceof DataQualityError) {
            return false; // Data quality errors should not be retried
        }

        // Check error message/code against retryable patterns
        return config.retryableErrors.some(pattern =>
            error.message.includes(pattern) ||
            error.name.includes(pattern) ||
            (error as any).code === pattern
        );
    }

    /**
     * Sleep utility for delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ==================== Data Quality Validation ====================

export class DataQualityValidator {
    private logger = createLogger({ service: 'data-quality-validator' });

    /**
     * Validates alert data before processing
     */
    validateAlert(alert: Partial<Alert>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Required fields validation
        if (!alert.id) errors.push('Alert ID is required');
        if (!alert.type) errors.push('Alert type is required');
        if (!alert.priority) errors.push('Alert priority is required');
        if (!alert.status) errors.push('Alert status is required');
        if (!alert.createdAt) errors.push('Alert creation date is required');
        if (!alert.data) errors.push('Alert data is required');

        // Type-specific validation
        if (alert.type && alert.data) {
            const typeErrors = this.validateAlertTypeData(alert.type, alert.data);
            errors.push(...typeErrors);
        }

        // Date validation
        if (alert.createdAt && !this.isValidDate(alert.createdAt)) {
            errors.push('Invalid creation date format');
        }

        if (alert.readAt && !this.isValidDate(alert.readAt)) {
            errors.push('Invalid read date format');
        }

        if (alert.dismissedAt && !this.isValidDate(alert.dismissedAt)) {
            errors.push('Invalid dismissal date format');
        }

        // Priority validation
        if (alert.priority && !['high', 'medium', 'low'].includes(alert.priority)) {
            errors.push('Invalid alert priority');
        }

        // Status validation
        if (alert.status && !['unread', 'read', 'dismissed', 'archived'].includes(alert.status)) {
            errors.push('Invalid alert status');
        }

        const isValid = errors.length === 0;

        if (!isValid) {
            this.logger.warn('Alert data validation failed', {
                alertId: alert.id,
                alertType: alert.type,
                errors,
            });
        }

        return { isValid, errors };
    }

    /**
     * Validates alert settings
     */
    validateAlertSettings(settings: Partial<AlertSettings>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Required fields
        if (!settings.userId) errors.push('User ID is required');
        if (!settings.enabledAlertTypes) errors.push('Enabled alert types is required');
        if (!settings.frequency) errors.push('Alert frequency is required');
        if (settings.leadScoreThreshold === undefined) errors.push('Lead score threshold is required');

        // Frequency validation
        if (settings.frequency && !['real-time', 'daily', 'weekly'].includes(settings.frequency)) {
            errors.push('Invalid alert frequency');
        }

        // Lead score threshold validation
        if (settings.leadScoreThreshold !== undefined) {
            if (settings.leadScoreThreshold < 50 || settings.leadScoreThreshold > 90) {
                errors.push('Lead score threshold must be between 50 and 90');
            }
        }

        // Target areas validation
        if (settings.targetAreas) {
            for (const area of settings.targetAreas) {
                const validation = this.validateTargetArea(area);
                errors.push(...validation.errors);
            }
        }

        // Price range validation
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
            this.logger.warn('Alert settings validation failed', {
                userId: settings.userId,
                errors,
            });
        }

        return { isValid, errors };
    }

    /**
     * Validates target area data
     */
    public validateTargetArea(area: TargetArea): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!area.id) errors.push('Target area ID is required');
        if (!area.type) errors.push('Target area type is required');
        if (!area.value) errors.push('Target area value is required');
        if (!area.label) errors.push('Target area label is required');

        // Type-specific validation
        if (area.type === 'zip' && typeof area.value === 'string') {
            if (!/^\d{5}(-\d{4})?$/.test(area.value)) {
                errors.push('Invalid ZIP code format');
            }
        }

        if (area.type === 'polygon' && typeof area.value === 'object') {
            const polygon = area.value as any;
            if (!polygon.coordinates || !Array.isArray(polygon.coordinates)) {
                errors.push('Polygon must have coordinates array');
            } else if (polygon.coordinates.length < 3) {
                errors.push('Polygon must have at least 3 coordinates');
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Validates alert type-specific data
     */
    private validateAlertTypeData(type: AlertType, data: any): string[] {
        const errors: string[] = [];

        switch (type) {
            case 'life-event-lead':
                if (!data.prospectLocation) errors.push('Prospect location is required');
                if (!data.eventType) errors.push('Event type is required');
                if (!data.eventDate) errors.push('Event date is required');
                if (data.leadScore === undefined) errors.push('Lead score is required');
                if (data.leadScore < 0 || data.leadScore > 100) errors.push('Lead score must be between 0 and 100');
                break;

            case 'competitor-new-listing':
            case 'competitor-withdrawal':
                if (!data.competitorName) errors.push('Competitor name is required');
                if (!data.propertyAddress) errors.push('Property address is required');
                break;

            case 'competitor-price-reduction':
                if (!data.competitorName) errors.push('Competitor name is required');
                if (!data.propertyAddress) errors.push('Property address is required');
                if (data.originalPrice === undefined) errors.push('Original price is required');
                if (data.newPrice === undefined) errors.push('New price is required');
                if (data.originalPrice <= data.newPrice) errors.push('Original price must be greater than new price');
                break;

            case 'neighborhood-trend':
                if (!data.neighborhood) errors.push('Neighborhood is required');
                if (!data.trendType) errors.push('Trend type is required');
                if (data.currentValue === undefined) errors.push('Current value is required');
                if (data.previousValue === undefined) errors.push('Previous value is required');
                if (data.changePercent === undefined) errors.push('Change percent is required');
                break;

            case 'price-reduction':
                if (!data.propertyAddress) errors.push('Property address is required');
                if (data.originalPrice === undefined) errors.push('Original price is required');
                if (data.newPrice === undefined) errors.push('New price is required');
                if (data.originalPrice <= data.newPrice) errors.push('Original price must be greater than new price');
                if (!data.propertyDetails) errors.push('Property details are required');
                break;
        }

        return errors;
    }

    /**
     * Validates date string format
     */
    private isValidDate(dateString: string): boolean {
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && dateString === date.toISOString();
    }

    /**
     * Sanitizes external API data
     */
    sanitizeExternalData(data: any, dataType: string): any {
        try {
            // Remove null/undefined values
            const sanitized = this.removeNullValues(data);

            // Validate and sanitize based on data type
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
        } catch (error) {
            this.logger.warn(`Data sanitization failed for ${dataType}`, {
                dataType,
                error: error as Error
            });
            throw new DataQualityError(
                `Failed to sanitize ${dataType} data`,
                dataType,
                [(error as Error).message]
            );
        }
    }

    /**
     * Removes null and undefined values from objects
     */
    private removeNullValues(obj: any): any {
        if (obj === null || obj === undefined) {
            return null;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.removeNullValues(item)).filter(item => item !== null);
        }

        if (typeof obj === 'object') {
            const cleaned: any = {};
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

    /**
     * Sanitizes MLS listing data
     */
    private sanitizeMLSData(data: any): any {
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

    /**
     * Sanitizes demographics data
     */
    private sanitizeDemographicsData(data: any): any {
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

    /**
     * Sanitizes school data
     */
    private sanitizeSchoolData(data: any): any {
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

    /**
     * Sanitizes walkability data
     */
    private sanitizeWalkabilityData(data: any): any {
        return {
            ...data,
            score: this.sanitizeNumber(data.score, 0, 100),
            description: this.sanitizeString(data.description),
        };
    }

    /**
     * Sanitizes and validates numeric values
     */
    private sanitizeNumber(value: any, min?: number, max?: number): number {
        const num = Number(value);
        if (isNaN(num)) {
            return min || 0;
        }

        let sanitized = num;
        if (min !== undefined && sanitized < min) sanitized = min;
        if (max !== undefined && sanitized > max) sanitized = max;

        return sanitized;
    }

    /**
     * Sanitizes string values
     */
    private sanitizeString(value: any): string {
        if (typeof value !== 'string') {
            return String(value || '');
        }
        return value.trim();
    }
}

// ==================== Singleton Instances ====================

export const alertErrorHandler = new AlertErrorHandler();
export const retryHandler = new RetryHandler();
export const dataQualityValidator = new DataQualityValidator();

// ==================== Utility Functions ====================

/**
 * Wraps an async function with error handling and logging
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: { operation: string; service: string }
): T {
    return (async (...args: any[]) => {
        const logger = createLogger({ service: context.service });
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
        } catch (error) {
            const errorResult = alertErrorHandler.handleError(error as Error, {
                operation: context.operation,
                service: context.service,
                duration: Date.now() - startTime,
            });

            logger.error(`Failed ${context.operation}`, error as Error, {
                operation: context.operation,
                duration: Date.now() - startTime,
                shouldRetry: errorResult.shouldRetry,
            });

            throw error;
        }
    }) as T;
}

/**
 * Wraps an async function with retry logic
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    retryConfig?: Partial<RetryConfig>,
    context?: { operation: string }
): T {
    return (async (...args: any[]) => {
        return retryHandler.withRetry(
            () => fn(...args),
            retryConfig,
            { operation: context?.operation || fn.name }
        );
    }) as T;
}

/**
 * Creates a user-friendly error message from any error
 */
export function createUserFriendlyMessage(error: Error, operation: string): string {
    const result = alertErrorHandler.handleError(error, { operation });
    return result.userMessage;
}