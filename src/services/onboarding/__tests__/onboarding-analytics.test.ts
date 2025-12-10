/**
 * Onboarding Analytics Service Tests
 * 
 * Tests the analytics tracking functionality for onboarding events.
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock must be defined before imports
const mockLogBusinessEvent = jest.fn().mockResolvedValue(undefined);
const mockInfo = jest.fn();
const mockError = jest.fn();

// Mock analytics batcher with proper async handling
const mockAddEvent = jest.fn();
const mockFlush = jest.fn().mockResolvedValue(undefined);
let flushCallback: ((events: any[]) => Promise<void>) | null = null;

const mockBatcher = {
    addEvent: mockAddEvent,
    flush: mockFlush,
};

// Mock the CloudWatch logger module
jest.unstable_mockModule('@/services/monitoring/cloudwatch-logging-service', () => ({
    cloudWatchLogger: {
        logBusinessEvent: mockLogBusinessEvent,
        info: mockInfo,
        error: mockError,
    },
}));

// Mock the analytics batcher
jest.unstable_mockModule('@/lib/performance/analytics-batch', () => ({
    getAnalyticsBatcher: jest.fn((callback: (events: any[]) => Promise<void>) => {
        flushCallback = callback;
        return mockBatcher;
    }),
    destroyAnalyticsBatcher: jest.fn(),
}));

// Mock the monitoring service
const mockTrackOnboardingStart = jest.fn().mockResolvedValue(undefined);
const mockTrackStepCompletion = jest.fn().mockResolvedValue(undefined);
const mockTrackStepSkip = jest.fn().mockResolvedValue(undefined);
const mockTrackOnboardingCompletion = jest.fn().mockResolvedValue(undefined);
const mockTrackOnboardingAbandonment = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule('@/services/onboarding/onboarding-monitoring-service', () => ({
    onboardingMonitoring: {
        trackOnboardingStart: mockTrackOnboardingStart,
        trackStepCompletion: mockTrackStepCompletion,
        trackStepSkip: mockTrackStepSkip,
        trackOnboardingCompletion: mockTrackOnboardingCompletion,
        trackOnboardingAbandonment: mockTrackOnboardingAbandonment,
    },
}));

// Dynamic imports after mocking
const { OnboardingAnalyticsService } = await import('../onboarding-analytics');
const { OnboardingFlowType } = await import('@/types/onboarding');

describe('OnboardingAnalyticsService', () => {
    let analyticsService: InstanceType<typeof OnboardingAnalyticsService>;
    const mockUserId = 'test-user-123';
    const mockSessionId = 'session-456';

    beforeEach(() => {
        analyticsService = new OnboardingAnalyticsService();
        mockLogBusinessEvent.mockClear();
        mockInfo.mockClear();
        mockError.mockClear();
        mockAddEvent.mockClear();
        mockFlush.mockClear();
        mockTrackOnboardingStart.mockClear();
        mockTrackStepCompletion.mockClear();
        mockTrackStepSkip.mockClear();
        mockTrackOnboardingCompletion.mockClear();
        mockTrackOnboardingAbandonment.mockClear();
    });

    describe('trackOnboardingStarted', () => {
        it('should queue onboarding_started event and call monitoring service', async () => {
            // Requirement 8.1: Track onboarding start
            const flowType = 'user';

            await analyticsService.trackOnboardingStarted(mockUserId, flowType, mockSessionId);

            // Should queue the event in the batcher
            expect(mockAddEvent).toHaveBeenCalledTimes(1);
            expect(mockTrackOnboardingStart).toHaveBeenCalledWith(mockUserId, flowType);

            const queuedEvent = mockAddEvent.mock.calls[0][0];
            expect(queuedEvent).toMatchObject({
                eventType: 'onboarding_started',
                userId: mockUserId,
                flowType,
                sessionId: mockSessionId,
            });
        });

        it('should generate session ID if not provided', async () => {
            await analyticsService.trackOnboardingStarted(mockUserId, 'user');

            const queuedEvent = mockAddEvent.mock.calls[0][0];
            expect(queuedEvent.sessionId).toBeDefined();
            expect(typeof queuedEvent.sessionId).toBe('string');
        });

        it('should include device type in metadata', async () => {
            await analyticsService.trackOnboardingStarted(mockUserId, 'user', mockSessionId);

            const queuedEvent = mockAddEvent.mock.calls[0][0];
            expect(queuedEvent.metadata.deviceType).toBeDefined();
        });
    });

    describe('trackStepCompleted', () => {
        it('should queue step_completed event with step ID and time spent', async () => {
            // Requirement 8.2: Track step completion
            const flowType = 'user';
            const stepId = 'profile';
            const timeSpent = 45000; // 45 seconds

            await analyticsService.trackStepCompleted(
                mockUserId,
                flowType,
                stepId,
                timeSpent,
                mockSessionId
            );

            expect(mockAddEvent).toHaveBeenCalledTimes(1);
            expect(mockTrackStepCompletion).toHaveBeenCalledWith(mockUserId, flowType, stepId, timeSpent);

            const queuedEvent = mockAddEvent.mock.calls[0][0];
            expect(queuedEvent).toMatchObject({
                eventType: 'step_completed',
                userId: mockUserId,
                flowType,
                stepId,
                sessionId: mockSessionId,
                metadata: expect.objectContaining({
                    timeSpent,
                }),
            });
        });

        it('should work without time spent parameter', async () => {
            await analyticsService.trackStepCompleted(
                mockUserId,
                'user',
                'welcome',
                undefined,
                mockSessionId
            );

            expect(mockAddEvent).toHaveBeenCalledTimes(1);
            expect(mockTrackStepCompletion).toHaveBeenCalledWith(mockUserId, 'user', 'welcome', undefined);
        });
    });

    describe('trackStepSkipped', () => {
        it('should queue step_skipped event with step ID', async () => {
            // Requirement 8.3: Track step skips
            const flowType = 'user';
            const stepId = 'tour';

            await analyticsService.trackStepSkipped(
                mockUserId,
                flowType,
                stepId,
                undefined,
                mockSessionId
            );

            expect(mockAddEvent).toHaveBeenCalledTimes(1);
            expect(mockTrackStepSkip).toHaveBeenCalledWith(mockUserId, flowType, stepId);

            const queuedEvent = mockAddEvent.mock.calls[0][0];
            expect(queuedEvent).toMatchObject({
                eventType: 'step_skipped',
                userId: mockUserId,
                flowType,
                stepId,
                sessionId: mockSessionId,
            });
        });

        it('should include skip reason when provided', async () => {
            const skipReason = 'User wants to explore on their own';

            await analyticsService.trackStepSkipped(
                mockUserId,
                'user',
                'tour',
                skipReason,
                mockSessionId
            );

            const queuedEvent = mockAddEvent.mock.calls[0][0];
            expect(queuedEvent.metadata.skipReason).toBe(skipReason);
        });
    });

    describe('trackOnboardingCompleted', () => {
        it('should queue onboarding_completed event with total time', async () => {
            // Requirement 8.4: Track onboarding completion with timing
            const flowType = 'user';
            const totalTime = 300000; // 5 minutes

            await analyticsService.trackOnboardingCompleted(
                mockUserId,
                flowType,
                totalTime,
                mockSessionId
            );

            expect(mockAddEvent).toHaveBeenCalledTimes(1);
            expect(mockTrackOnboardingCompletion).toHaveBeenCalledWith(mockUserId, flowType, totalTime);

            const queuedEvent = mockAddEvent.mock.calls[0][0];
            expect(queuedEvent).toMatchObject({
                eventType: 'onboarding_completed',
                userId: mockUserId,
                flowType,
                sessionId: mockSessionId,
                metadata: expect.objectContaining({
                    totalTime,
                }),
            });
        });

        it('should work without total time parameter', async () => {
            await analyticsService.trackOnboardingCompleted(
                mockUserId,
                'admin',
                undefined,
                mockSessionId
            );

            expect(mockAddEvent).toHaveBeenCalledTimes(1);
            expect(mockTrackOnboardingCompletion).toHaveBeenCalledWith(mockUserId, 'admin', undefined);
        });
    });

    describe('CloudWatch integration', () => {
        it('should queue all events for batched CloudWatch logging', async () => {
            // Requirement 8.5: Send events to CloudWatch Logs
            await analyticsService.trackOnboardingStarted(mockUserId, 'user', mockSessionId);
            await analyticsService.trackStepCompleted(mockUserId, 'user', 'profile', 30000, mockSessionId);
            await analyticsService.trackStepSkipped(mockUserId, 'user', 'tour', undefined, mockSessionId);
            await analyticsService.trackOnboardingCompleted(mockUserId, 'user', 180000, mockSessionId);

            // All events should be queued in the batcher
            expect(mockAddEvent).toHaveBeenCalledTimes(4);
        });

        it('should successfully queue events for CloudWatch logging', async () => {
            // Test that events are properly queued for batched logging
            await analyticsService.trackOnboardingStarted(mockUserId, 'user', mockSessionId);

            // The event should be queued
            expect(mockAddEvent).toHaveBeenCalledTimes(1);

            // The monitoring service should also be called
            expect(mockTrackOnboardingStart).toHaveBeenCalledWith(mockUserId, 'user');
        });
    });

    describe('batchLogEvents', () => {
        it('should log multiple events in batch directly to CloudWatch', async () => {
            const events = [
                {
                    eventType: 'onboarding_started' as const,
                    userId: mockUserId,
                    flowType: 'user' as any,
                    timestamp: new Date().toISOString(),
                    sessionId: mockSessionId,
                    metadata: { deviceType: 'desktop' }
                },
                {
                    eventType: 'step_completed' as const,
                    userId: mockUserId,
                    flowType: 'user' as any,
                    stepId: 'profile',
                    timestamp: new Date().toISOString(),
                    sessionId: mockSessionId,
                    metadata: { deviceType: 'desktop' }
                },
            ];

            await analyticsService.batchLogEvents(events);

            expect(mockLogBusinessEvent).toHaveBeenCalledTimes(2);
        });
    });

    describe('additional tracking methods', () => {
        it('should track onboarding abandoned', async () => {
            await analyticsService.trackOnboardingAbandoned(
                mockUserId,
                'user',
                'profile',
                mockSessionId
            );

            expect(mockAddEvent).toHaveBeenCalledTimes(1);
            expect(mockTrackOnboardingAbandonment).toHaveBeenCalledWith(mockUserId, 'user', 'profile');

            const queuedEvent = mockAddEvent.mock.calls[0][0];
            expect(queuedEvent.eventType).toBe('onboarding_abandoned');
        });

        it('should track onboarding resumed', async () => {
            await analyticsService.trackOnboardingResumed(
                mockUserId,
                'user',
                'profile',
                mockSessionId
            );

            expect(mockAddEvent).toHaveBeenCalledTimes(1);

            const queuedEvent = mockAddEvent.mock.calls[0][0];
            expect(queuedEvent.eventType).toBe('onboarding_resumed');
            expect(queuedEvent.stepId).toBe('profile');
        });

        it('should track flow switched for dual role users', async () => {
            await analyticsService.trackFlowSwitched(
                mockUserId,
                'admin',
                'user',
                mockSessionId
            );

            expect(mockAddEvent).toHaveBeenCalledTimes(1);

            const queuedEvent = mockAddEvent.mock.calls[0][0];
            expect(queuedEvent.eventType).toBe('flow_switched');
            expect(queuedEvent.metadata.previousStep).toBe('admin');
            expect(queuedEvent.metadata.nextStep).toBe('user');
        });
    });

    describe('event structure validation', () => {
        it('should include all required fields in events', async () => {
            await analyticsService.trackStepCompleted(
                mockUserId,
                'user',
                'profile',
                30000,
                mockSessionId
            );

            const queuedEvent = mockAddEvent.mock.calls[0][0];

            // Verify all required fields are present
            expect(queuedEvent).toHaveProperty('eventType');
            expect(queuedEvent).toHaveProperty('userId');
            expect(queuedEvent).toHaveProperty('flowType');
            expect(queuedEvent).toHaveProperty('stepId');
            expect(queuedEvent).toHaveProperty('sessionId');
            expect(queuedEvent).toHaveProperty('timestamp');
            expect(queuedEvent.metadata).toHaveProperty('timeSpent');
            expect(queuedEvent.metadata).toHaveProperty('deviceType');
        });

        it('should use ISO timestamp format', async () => {
            await analyticsService.trackOnboardingStarted(mockUserId, 'user', mockSessionId);

            const queuedEvent = mockAddEvent.mock.calls[0][0];
            const timestamp = queuedEvent.timestamp;

            // Verify ISO format
            expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            expect(() => new Date(timestamp)).not.toThrow();
        });

        it('should manually flush queued events', async () => {
            await analyticsService.trackOnboardingStarted(mockUserId, 'user', mockSessionId);

            // Manually flush
            await analyticsService.flush();

            expect(mockFlush).toHaveBeenCalledTimes(1);
        });
    });
});
