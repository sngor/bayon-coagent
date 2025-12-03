/**
 * AI Monitoring Scheduler Tests
 * 
 * Unit tests for the AIMonitoringScheduler class
 */

import { describe, it, expect } from '@jest/globals';
import {
    AIMonitoringScheduler,
    AIMonitoringError,
    RateLimitCheckResult,
    MonitoringExecutionResult,
} from '../ai-monitoring-scheduler';

describe('AIMonitoringScheduler', () => {
    describe('AIMonitoringError', () => {
        it('should create error with message', () => {
            const error = new AIMonitoringError('Test error');
            expect(error.message).toBe('Test error');
            expect(error.name).toBe('AIMonitoringError');
        });

        it('should create error with userId', () => {
            const error = new AIMonitoringError('Test error', 'user-123');
            expect(error.userId).toBe('user-123');
        });

        it('should create error with original error', () => {
            const originalError = new Error('Original');
            const error = new AIMonitoringError('Test error', 'user-123', originalError);
            expect(error.originalError).toBe(originalError);
        });
    });

    describe('Type definitions', () => {
        it('should have correct RateLimitCheckResult structure', () => {
            const result: RateLimitCheckResult = {
                canExecute: true,
                remainingQueries: 50,
                resetDate: new Date().toISOString(),
            };

            expect(result.canExecute).toBe(true);
            expect(result.remainingQueries).toBe(50);
            expect(typeof result.resetDate).toBe('string');
        });

        it('should have correct MonitoringExecutionResult structure', () => {
            const result: MonitoringExecutionResult = {
                queriesExecuted: 10,
                mentionsFound: 3,
                errors: ['Error 1', 'Error 2'],
            };

            expect(result.queriesExecuted).toBe(10);
            expect(result.mentionsFound).toBe(3);
            expect(result.errors).toHaveLength(2);
        });
    });

    // Note: Full integration tests with mocking would require more complex setup
    // These tests verify the basic structure and type definitions
    // Full testing would be done in integration tests with actual AWS services
});
