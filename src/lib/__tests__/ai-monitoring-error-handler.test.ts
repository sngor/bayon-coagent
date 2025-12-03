/**
 * Tests for AI Monitoring Error Handler
 */

import {
    categorizeError,
    AIMonitoringErrorType,
    formatErrorForLogging,
    isDataStale,
    getTimeSinceUpdate,
    getEmptyStateMessage,
    validateMonitoringConfig,
} from '../ai-monitoring-error-handler';

describe('AI Monitoring Error Handler', () => {
    describe('categorizeError', () => {
        it('should categorize platform unavailable errors', () => {
            const error = new Error('Service unavailable (503)');
            const result = categorizeError(error);

            expect(result.type).toBe(AIMonitoringErrorType.PLATFORM_UNAVAILABLE);
            expect(result.isRetryable).toBe(true);
            expect(result.suggestedAction).toBeDefined();
        });

        it('should categorize rate limit errors', () => {
            const error = new Error('Rate limit exceeded (429)');
            const result = categorizeError(error);

            expect(result.type).toBe(AIMonitoringErrorType.RATE_LIMIT_EXCEEDED);
            expect(result.isRetryable).toBe(false);
        });

        it('should categorize authentication errors', () => {
            const error = new Error('Unauthorized (401)');
            const result = categorizeError(error);

            expect(result.type).toBe(AIMonitoringErrorType.AUTHENTICATION_FAILED);
            expect(result.isRetryable).toBe(false);
        });

        it('should categorize network errors', () => {
            const error = new Error('Network connection failed');
            const result = categorizeError(error);

            expect(result.type).toBe(AIMonitoringErrorType.NETWORK_ERROR);
            expect(result.isRetryable).toBe(true);
        });

        it('should categorize timeout errors', () => {
            const error = new Error('Request timed out');
            const result = categorizeError(error);

            expect(result.type).toBe(AIMonitoringErrorType.TIMEOUT);
            expect(result.isRetryable).toBe(true);
        });

        it('should categorize missing data errors', () => {
            const error = new Error('ResourceNotFoundException');
            const result = categorizeError(error);

            expect(result.type).toBe(AIMonitoringErrorType.MISSING_DATA);
            expect(result.isRetryable).toBe(false);
        });

        it('should categorize budget exceeded errors', () => {
            const error = new Error('Budget limit exceeded');
            const result = categorizeError(error);

            expect(result.type).toBe(AIMonitoringErrorType.BUDGET_EXCEEDED);
            expect(result.isRetryable).toBe(false);
        });

        it('should categorize unknown errors', () => {
            const error = new Error('Something went wrong');
            const result = categorizeError(error);

            expect(result.type).toBe(AIMonitoringErrorType.UNKNOWN);
            expect(result.isRetryable).toBe(true);
        });

        it('should handle non-Error objects', () => {
            const result = categorizeError('string error');

            expect(result.type).toBe(AIMonitoringErrorType.UNKNOWN);
            expect(result.message).toBeDefined();
        });
    });

    describe('formatErrorForLogging', () => {
        it('should format error with context', () => {
            const error = new Error('Test error');
            const context = { userId: '123', platform: 'chatgpt' };

            const formatted = formatErrorForLogging(error, context);

            expect(formatted).toContain('Test error');
            expect(formatted).toContain('userId');
            expect(formatted).toContain('chatgpt');
        });

        it('should format error without context', () => {
            const error = new Error('Test error');

            const formatted = formatErrorForLogging(error);

            expect(formatted).toContain('Test error');
            expect(formatted).toContain('[AI Monitoring Error]');
        });

        it('should handle non-Error objects', () => {
            const formatted = formatErrorForLogging('string error');

            expect(formatted).toContain('string error');
        });
    });

    describe('isDataStale', () => {
        it('should return true for null lastUpdated', () => {
            expect(isDataStale(null)).toBe(true);
        });

        it('should return true for data older than threshold', () => {
            const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
            expect(isDataStale(eightDaysAgo, 7)).toBe(true);
        });

        it('should return false for recent data', () => {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            expect(isDataStale(yesterday, 7)).toBe(false);
        });

        it('should use default threshold of 7 days', () => {
            const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
            expect(isDataStale(sixDaysAgo)).toBe(false);
        });
    });

    describe('getTimeSinceUpdate', () => {
        it('should return "Never" for null', () => {
            expect(getTimeSinceUpdate(null)).toBe('Never');
        });

        it('should return "Just now" for very recent updates', () => {
            const now = new Date().toISOString();
            expect(getTimeSinceUpdate(now)).toBe('Just now');
        });

        it('should return minutes for recent updates', () => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const result = getTimeSinceUpdate(fiveMinutesAgo);
            expect(result).toContain('minute');
        });

        it('should return hours for updates within a day', () => {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
            const result = getTimeSinceUpdate(twoHoursAgo);
            expect(result).toContain('hour');
        });

        it('should return days for updates within a month', () => {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
            const result = getTimeSinceUpdate(threeDaysAgo);
            expect(result).toContain('day');
        });

        it('should return months for older updates', () => {
            const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
            const result = getTimeSinceUpdate(twoMonthsAgo);
            expect(result).toContain('month');
        });
    });

    describe('getEmptyStateMessage', () => {
        it('should return setup message when no config', () => {
            const result = getEmptyStateMessage({
                hasConfig: false,
                hasScore: false,
                hasMentions: false,
                isFiltered: false,
            });

            expect(result.title).toContain('Not Set Up');
            expect(result.action).toBe('Set Up Monitoring');
        });

        it('should return collecting message when config exists but no data', () => {
            const result = getEmptyStateMessage({
                hasConfig: true,
                hasScore: false,
                hasMentions: false,
                isFiltered: false,
            });

            expect(result.title).toContain('Collecting');
            expect(result.action).toBe('Run Manual Check');
        });

        it('should return filtered message when no mentions with filters', () => {
            const result = getEmptyStateMessage({
                hasConfig: true,
                hasScore: true,
                hasMentions: false,
                isFiltered: true,
            });

            expect(result.title).toContain('No Mentions in This View');
            expect(result.action).toBe('Clear Filters');
        });

        it('should return no mentions message when genuinely no mentions', () => {
            const result = getEmptyStateMessage({
                hasConfig: true,
                hasScore: true,
                hasMentions: false,
                isFiltered: false,
            });

            expect(result.title).toContain('No Mentions Found');
            expect(result.action).toBe('View Tips');
        });
    });

    describe('validateMonitoringConfig', () => {
        it('should validate correct configuration', () => {
            const config = {
                enabled: true,
                platforms: ['chatgpt', 'perplexity'],
                queryTemplates: ['template1', 'template2'],
                alertThreshold: 20,
            };

            const result = validateMonitoringConfig(config);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect disabled monitoring', () => {
            const config = {
                enabled: false,
                platforms: ['chatgpt'],
                queryTemplates: ['template1'],
                alertThreshold: 20,
            };

            const result = validateMonitoringConfig(config);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Monitoring is disabled');
        });

        it('should detect missing platforms', () => {
            const config = {
                enabled: true,
                platforms: [],
                queryTemplates: ['template1'],
                alertThreshold: 20,
            };

            const result = validateMonitoringConfig(config);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('At least one platform must be selected');
        });

        it('should detect missing query templates', () => {
            const config = {
                enabled: true,
                platforms: ['chatgpt'],
                queryTemplates: [],
                alertThreshold: 20,
            };

            const result = validateMonitoringConfig(config);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('At least one query template must be selected');
        });

        it('should detect invalid alert threshold', () => {
            const config = {
                enabled: true,
                platforms: ['chatgpt'],
                queryTemplates: ['template1'],
                alertThreshold: 150,
            };

            const result = validateMonitoringConfig(config);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Alert threshold must be between 0 and 100');
        });

        it('should detect multiple errors', () => {
            const config = {
                enabled: false,
                platforms: [],
                queryTemplates: [],
                alertThreshold: -10,
            };

            const result = validateMonitoringConfig(config);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });
});
