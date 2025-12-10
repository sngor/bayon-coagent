/**
 * Onboarding Analytics Service
 * 
 * Tracks onboarding events and sends them to CloudWatch Logs for analysis.
 * Provides metrics for onboarding completion rates, step abandonment, and user flow.
 */

import { cloudWatchLogger } from '@/services/monitoring/cloudwatch-logging-service';
import { onboardingMonitoring } from './onboarding-monitoring-service';
import { getAnalyticsBatcher, destroyAnalyticsBatcher } from '@/lib/performance/analytics-batch';
import type {
    OnboardingAnalyticsEvent,
    OnboardingFlowType,
} from '@/types/onboarding';
import { v4 as uuidv4 } from 'uuid';

/**
 * Onboarding Analytics Service class
 * Handles event tracking and CloudWatch logging for onboarding with batching
 * 
 * Requirements: 8.5
 */
export class OnboardingAnalyticsService {
    private batcher: ReturnType<typeof getAnalyticsBatcher> | null = null;

    /**
     * Initialize the analytics batcher
     */
    private initializeBatcher(): void {
        if (!this.batcher) {
            this.batcher = getAnalyticsBatcher(
                async (events) => {
                    await this.flushEvents(events);
                },
                {
                    maxBatchSize: 10,
                    flushInterval: 30000, // 30 seconds
                    maxRetries: 3,
                }
            );
        }
    }

    /**
     * Flush a batch of events to CloudWatch
     * @param events Array of events to flush
     */
    private async flushEvents(events: OnboardingAnalyticsEvent[]): Promise<void> {
        try {
            // Log each event to CloudWatch
            for (const event of events) {
                cloudWatchLogger.logBusinessEvent(
                    `Onboarding: ${event.eventType}`,
                    {
                        userId: event.userId,
                        service: 'onboarding',
                        operation: event.eventType,
                        timestamp: new Date(event.timestamp),
                        environment: process.env.NODE_ENV || 'development',
                    },
                    {
                        eventType: event.eventType,
                        eventData: {
                            flowType: event.flowType,
                            stepId: event.stepId,
                            sessionId: event.sessionId,
                            timestamp: event.timestamp,
                            ...event.metadata,
                        },
                    }
                );
            }

            // Also log to console in development
            if (process.env.NODE_ENV !== 'production') {
                console.log('[ONBOARDING_ANALYTICS] Flushed batch:', events.length, 'events');
            }
        } catch (error) {
            console.error('[ONBOARDING_ANALYTICS] Error flushing events:', error);
            throw error; // Re-throw to trigger retry in batcher
        }
    }

    /**
     * Queue an event for batched logging
     * @param event Onboarding analytics event
     */
    private queueEvent(event: OnboardingAnalyticsEvent): void {
        this.initializeBatcher();
        this.batcher?.addEvent(event);

        // Also log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.log('[ONBOARDING_ANALYTICS] Queued event:', event);
        }
    }

    /**
     * Tracks when a user starts onboarding
     * @param userId User ID
     * @param flowType Flow type
     * @param sessionId Optional session ID
     */
    async trackOnboardingStarted(
        userId: string,
        flowType: OnboardingFlowType,
        sessionId?: string
    ): Promise<void> {
        const event: OnboardingAnalyticsEvent = {
            eventType: 'onboarding_started',
            userId,
            flowType,
            timestamp: new Date().toISOString(),
            sessionId: sessionId || uuidv4(),
            metadata: {
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
                deviceType: this.detectDeviceType(),
            },
        };

        // Queue event for batched logging
        this.queueEvent(event);

        // Publish metric to CloudWatch (not batched)
        await onboardingMonitoring.trackOnboardingStart(userId, flowType);
    }

    /**
     * Tracks when a user completes a step
     * @param userId User ID
     * @param flowType Flow type
     * @param stepId Step ID
     * @param timeSpent Time spent on step in milliseconds
     * @param sessionId Optional session ID
     */
    async trackStepCompleted(
        userId: string,
        flowType: OnboardingFlowType,
        stepId: string,
        timeSpent?: number,
        sessionId?: string
    ): Promise<void> {
        const event: OnboardingAnalyticsEvent = {
            eventType: 'step_completed',
            userId,
            flowType,
            stepId,
            timestamp: new Date().toISOString(),
            sessionId: sessionId || uuidv4(),
            metadata: {
                timeSpent,
                deviceType: this.detectDeviceType(),
            },
        };

        // Queue event for batched logging
        this.queueEvent(event);

        // Publish metric to CloudWatch (not batched)
        await onboardingMonitoring.trackStepCompletion(userId, flowType, stepId, timeSpent);
    }

    /**
     * Tracks when a user skips a step
     * @param userId User ID
     * @param flowType Flow type
     * @param stepId Step ID
     * @param skipReason Optional reason for skipping
     * @param sessionId Optional session ID
     */
    async trackStepSkipped(
        userId: string,
        flowType: OnboardingFlowType,
        stepId: string,
        skipReason?: string,
        sessionId?: string
    ): Promise<void> {
        const event: OnboardingAnalyticsEvent = {
            eventType: 'step_skipped',
            userId,
            flowType,
            stepId,
            timestamp: new Date().toISOString(),
            sessionId: sessionId || uuidv4(),
            metadata: {
                skipReason,
                deviceType: this.detectDeviceType(),
            },
        };

        // Queue event for batched logging
        this.queueEvent(event);

        // Publish metric to CloudWatch (not batched)
        await onboardingMonitoring.trackStepSkip(userId, flowType, stepId);
    }

    /**
     * Tracks when a user completes the entire onboarding
     * @param userId User ID
     * @param flowType Flow type
     * @param totalTime Total time to complete in milliseconds
     * @param sessionId Optional session ID
     */
    async trackOnboardingCompleted(
        userId: string,
        flowType: OnboardingFlowType,
        totalTime?: number,
        sessionId?: string
    ): Promise<void> {
        const event: OnboardingAnalyticsEvent = {
            eventType: 'onboarding_completed',
            userId,
            flowType,
            timestamp: new Date().toISOString(),
            sessionId: sessionId || uuidv4(),
            metadata: {
                totalTime,
                deviceType: this.detectDeviceType(),
            },
        };

        // Queue event for batched logging
        this.queueEvent(event);

        // Publish metric to CloudWatch (not batched)
        await onboardingMonitoring.trackOnboardingCompletion(userId, flowType, totalTime);
    }

    /**
     * Tracks when a user abandons onboarding
     * @param userId User ID
     * @param flowType Flow type
     * @param lastStepId Last step the user was on
     * @param sessionId Optional session ID
     */
    async trackOnboardingAbandoned(
        userId: string,
        flowType: OnboardingFlowType,
        lastStepId?: string,
        sessionId?: string
    ): Promise<void> {
        const event: OnboardingAnalyticsEvent = {
            eventType: 'onboarding_abandoned',
            userId,
            flowType,
            stepId: lastStepId,
            timestamp: new Date().toISOString(),
            sessionId: sessionId || uuidv4(),
            metadata: {
                deviceType: this.detectDeviceType(),
            },
        };

        // Queue event for batched logging
        this.queueEvent(event);

        // Publish metric to CloudWatch (not batched)
        await onboardingMonitoring.trackOnboardingAbandonment(userId, flowType, lastStepId);
    }

    /**
     * Tracks when a user resumes onboarding
     * @param userId User ID
     * @param flowType Flow type
     * @param resumeStepId Step being resumed
     * @param sessionId Optional session ID
     */
    async trackOnboardingResumed(
        userId: string,
        flowType: OnboardingFlowType,
        resumeStepId: string,
        sessionId?: string
    ): Promise<void> {
        const event: OnboardingAnalyticsEvent = {
            eventType: 'onboarding_resumed',
            userId,
            flowType,
            stepId: resumeStepId,
            timestamp: new Date().toISOString(),
            sessionId: sessionId || uuidv4(),
            metadata: {
                deviceType: this.detectDeviceType(),
            },
        };

        // Queue event for batched logging
        this.queueEvent(event);
    }

    /**
     * Tracks when a dual-role user switches between flows
     * @param userId User ID
     * @param fromFlow Flow being switched from
     * @param toFlow Flow being switched to
     * @param sessionId Optional session ID
     */
    async trackFlowSwitched(
        userId: string,
        fromFlow: OnboardingFlowType,
        toFlow: OnboardingFlowType,
        sessionId?: string
    ): Promise<void> {
        const event: OnboardingAnalyticsEvent = {
            eventType: 'flow_switched',
            userId,
            flowType: toFlow,
            timestamp: new Date().toISOString(),
            sessionId: sessionId || uuidv4(),
            metadata: {
                previousStep: fromFlow,
                nextStep: toFlow,
                deviceType: this.detectDeviceType(),
            },
        };

        // Queue event for batched logging
        this.queueEvent(event);
    }

    /**
     * Detects device type from user agent
     * @returns Device type string
     */
    private detectDeviceType(): string {
        if (typeof window === 'undefined') {
            return 'server';
        }

        const userAgent = window.navigator.userAgent.toLowerCase();

        if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
            if (/ipad|tablet/i.test(userAgent)) {
                return 'tablet';
            }
            return 'mobile';
        }

        return 'desktop';
    }

    /**
     * Batch log multiple events at once
     * @param events Array of events to log
     */
    async batchLogEvents(events: OnboardingAnalyticsEvent[]): Promise<void> {
        try {
            await this.flushEvents(events);
        } catch (error) {
            console.error('[ONBOARDING_ANALYTICS] Error batch logging events:', error);
            throw error;
        }
    }

    /**
     * Manually flush all queued events
     * Useful for critical events that need immediate logging
     */
    async flush(): Promise<void> {
        if (this.batcher) {
            await this.batcher.flush();
        }
    }

    /**
     * Destroy the analytics service and clean up
     * Should be called on app unmount
     */
    destroy(): void {
        destroyAnalyticsBatcher();
        this.batcher = null;
    }
}

// Export singleton instance
export const onboardingAnalytics = new OnboardingAnalyticsService();
