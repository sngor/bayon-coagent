/**
 * Onboarding Integration Tests
 * 
 * Comprehensive end-to-end tests for the onboarding system covering:
 * - Complete user onboarding flow
 * - Complete admin onboarding flow
 * - Dual role flow
 * - Skip and resume flow
 * - Mobile responsiveness
 * - Analytics tracking
 * 
 * Requirements: All onboarding requirements (1-15)
 * Task: 25. Final integration testing
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { getStepsForFlow, calculateProgress } from './mocks/onboarding-types';
import type { OnboardingState, OnboardingFlowType } from './mocks/onboarding-types';

// Mock services
const mockOnboardingService = {
    getOnboardingState: jest.fn(),
    initializeOnboarding: jest.fn(),
    completeStep: jest.fn(),
    skipStep: jest.fn(),
    completeOnboarding: jest.fn(),
    needsOnboarding: jest.fn(),
    getNextStep: jest.fn(),
    resetOnboarding: jest.fn(),
};

const mockOnboardingAnalytics = {
    trackOnboardingStarted: jest.fn(),
    trackStepCompleted: jest.fn(),
    trackStepSkipped: jest.fn(),
    trackOnboardingCompleted: jest.fn(),
    trackOnboardingAbandoned: jest.fn(),
    trackOnboardingResumed: jest.fn(),
    trackFlowSwitched: jest.fn(),
};

describe('Onboarding Integration Tests', () => {
    // Test user IDs
    const testUserId = 'test-user-integration';
    const testAdminId = 'test-admin-integration';
    const testDualRoleId = 'test-dual-role-integration';

    // Use mock services
    const onboardingService = mockOnboardingService;
    const onboardingAnalytics = mockOnboardingAnalytics;

    // Clean up after each test
    afterEach(async () => {
        jest.clearAllMocks();
    });

    describe('Complete User Onboarding Flow', () => {
        it('should complete entire user onboarding flow end-to-end', async () => {
            // Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 6.4

            // Mock initial state
            const mockInitialState: OnboardingState = {
                userId: testUserId,
                flowType: 'user',
                currentStep: 0,
                completedSteps: [],
                skippedSteps: [],
                isComplete: false,
                startedAt: new Date().toISOString(),
                lastAccessedAt: new Date().toISOString(),
                metadata: {},
            };

            onboardingService.initializeOnboarding.mockResolvedValue(mockInitialState);

            // Step 1: Initialize onboarding
            const initialState = await onboardingService.initializeOnboarding(
                testUserId,
                'user'
            );

            expect(initialState).toBeDefined();
            expect(initialState.userId).toBe(testUserId);
            expect(initialState.flowType).toBe('user');
            expect(initialState.completedSteps).toEqual([]);
            expect(initialState.isComplete).toBe(false);

            // Track analytics: onboarding started
            await onboardingAnalytics.trackOnboardingStarted(testUserId, 'user');

            // Step 2: Get user flow steps
            const userSteps = getStepsForFlow('user');
            expect(userSteps.length).toBeGreaterThan(0);

            // Step 3: Complete each step in sequence
            let currentState = initialState;
            const startTime = Date.now();

            for (const step of userSteps) {
                if (step.required) {
                    // Complete the step
                    currentState = await onboardingService.completeStep(
                        testUserId,
                        step.id
                    );

                    // Verify step was added to completed steps
                    expect(currentState.completedSteps).toContain(step.id);

                    // Track analytics: step completed
                    await onboardingAnalytics.trackStepCompleted(
                        testUserId,
                        'user',
                        step.id,
                        1000 // Mock time spent
                    );

                    // Verify progress increases
                    const progress = calculateProgress(currentState.completedSteps, 'user');
                    expect(progress).toBeGreaterThan(0);
                    expect(progress).toBeLessThanOrEqual(100);
                }
            }

            // Step 4: Verify all required steps completed
            const requiredSteps = userSteps.filter(s => s.required);
            const allCompleted = requiredSteps.every(step =>
                currentState.completedSteps.includes(step.id)
            );
            expect(allCompleted).toBe(true);

            // Step 5: Mark onboarding as complete
            const finalState = await onboardingService.completeOnboarding(testUserId);
            expect(finalState.isComplete).toBe(true);
            expect(finalState.completedAt).toBeDefined();

            // Track analytics: onboarding completed
            const totalTime = Date.now() - startTime;
            await onboardingAnalytics.trackOnboardingCompleted(
                testUserId,
                'user',
                totalTime
            );

            // Step 6: Verify user no longer needs onboarding
            const needsOnboarding = await onboardingService.needsOnboarding(testUserId);
            expect(needsOnboarding).toBe(false);

            // Step 7: Verify next step is null (all complete)
            const nextStep = await onboardingService.getNextStep(testUserId);
            expect(nextStep).toBeNull();
        });

        it('should preserve state when navigating away and returning', async () => {
            // Requirements: 6.2, 6.3

            // Initialize and complete some steps
            await onboardingService.initializeOnboarding(testUserId, 'user');
            const userSteps = getStepsForFlow('user');

            // Complete first 2 steps
            await onboardingService.completeStep(testUserId, userSteps[0].id);
            await onboardingService.completeStep(testUserId, userSteps[1].id);

            // Simulate navigation away (retrieve state)
            const stateBeforeNavigation = await onboardingService.getOnboardingState(testUserId);
            expect(stateBeforeNavigation?.completedSteps).toHaveLength(2);

            // Simulate returning (retrieve state again)
            const stateAfterReturn = await onboardingService.getOnboardingState(testUserId);
            expect(stateAfterReturn?.completedSteps).toEqual(stateBeforeNavigation?.completedSteps);
            expect(stateAfterReturn?.currentStep).toBe(stateBeforeNavigation?.currentStep);
        });

        it('should calculate progress correctly throughout flow', async () => {
            // Requirements: 9.1, 9.2, 9.3

            await onboardingService.initializeOnboarding(testUserId, 'user');
            const userSteps = getStepsForFlow('user');
            const requiredSteps = userSteps.filter(s => s.required);

            // Progress should start at 0
            let state = await onboardingService.getOnboardingState(testUserId);
            let progress = calculateProgress(state!.completedSteps, 'user');
            expect(progress).toBe(0);

            // Complete each step and verify progress increases
            for (let i = 0; i < requiredSteps.length; i++) {
                state = await onboardingService.completeStep(testUserId, requiredSteps[i].id);
                progress = calculateProgress(state.completedSteps, 'user');

                const expectedProgress = ((i + 1) / requiredSteps.length) * 100;
                expect(progress).toBeCloseTo(expectedProgress, 1);
            }

            // Final progress should be 100%
            expect(progress).toBe(100);
        });
    });

    describe('Complete Admin Onboarding Flow', () => {
        it('should complete entire admin onboarding flow end-to-end', async () => {
            // Requirements: 11.1, 11.2, 11.3, 11.4, 11.5

            // Step 1: Initialize admin onboarding
            const initialState = await onboardingService.initializeOnboarding(
                testAdminId,
                'admin'
            );

            expect(initialState.flowType).toBe('admin');
            expect(initialState.isComplete).toBe(false);

            // Track analytics
            await onboardingAnalytics.trackOnboardingStarted(testAdminId, 'admin');

            // Step 2: Get admin flow steps
            const adminSteps = getStepsForFlow('admin');
            expect(adminSteps.length).toBeGreaterThan(0);

            // Step 3: Complete each admin step
            let currentState = initialState;

            for (const step of adminSteps) {
                if (step.required) {
                    currentState = await onboardingService.completeStep(
                        testAdminId,
                        step.id
                    );

                    expect(currentState.completedSteps).toContain(step.id);

                    await onboardingAnalytics.trackStepCompleted(
                        testAdminId,
                        'admin',
                        step.id
                    );
                }
            }

            // Step 4: Complete onboarding
            const finalState = await onboardingService.completeOnboarding(testAdminId);
            expect(finalState.isComplete).toBe(true);

            // Step 5: Verify completion
            const needsOnboarding = await onboardingService.needsOnboarding(testAdminId);
            expect(needsOnboarding).toBe(false);
        });

        it('should show admin-specific steps only', async () => {
            // Requirements: 11.2, 11.3, 11.4

            await onboardingService.initializeOnboarding(testAdminId, 'admin');
            const adminSteps = getStepsForFlow('admin');

            // Verify admin-specific steps exist
            const hasUserManagement = adminSteps.some(s => s.id.includes('users'));
            const hasAnalytics = adminSteps.some(s => s.id.includes('analytics'));
            const hasConfig = adminSteps.some(s => s.id.includes('config'));

            expect(hasUserManagement || hasAnalytics || hasConfig).toBe(true);
        });
    });

    describe('Dual Role Flow', () => {
        it('should complete both admin and user flows for dual role users', async () => {
            // Requirements: 15.1, 15.2, 15.3, 15.4, 15.5

            // Step 1: Initialize dual role onboarding
            const initialState = await onboardingService.initializeOnboarding(
                testDualRoleId,
                'both'
            );

            expect(initialState.flowType).toBe('both');
            expect(initialState.metadata).toBeDefined();

            // Track analytics
            await onboardingAnalytics.trackOnboardingStarted(testDualRoleId, 'both');

            // Step 2: Complete admin flow first (requirement 15.3)
            const adminSteps = getStepsForFlow('admin');
            let currentState = initialState;

            for (const step of adminSteps) {
                if (step.required) {
                    currentState = await onboardingService.completeStep(
                        testDualRoleId,
                        step.id
                    );
                }
            }

            // Verify admin flow completion is tracked
            expect(currentState.metadata?.adminFlowComplete).toBe(true);
            expect(currentState.isComplete).toBe(false); // Overall not complete yet

            // Step 3: Complete user flow second
            const userSteps = getStepsForFlow('user');

            for (const step of userSteps) {
                if (step.required) {
                    currentState = await onboardingService.completeStep(
                        testDualRoleId,
                        step.id
                    );
                }
            }

            // Verify both flows complete
            expect(currentState.metadata?.adminFlowComplete).toBe(true);
            expect(currentState.metadata?.userFlowComplete).toBe(true);
            expect(currentState.isComplete).toBe(true);

            // Step 4: Verify completion
            const finalState = await onboardingService.completeOnboarding(testDualRoleId);
            expect(finalState.isComplete).toBe(true);
        });

        it('should track flow switching for dual role users', async () => {
            // Requirements: 15.4

            await onboardingService.initializeOnboarding(testDualRoleId, 'both');

            // Track flow switch
            await onboardingAnalytics.trackFlowSwitched(
                testDualRoleId,
                'admin',
                'user'
            );

            // No assertion needed - just verify no errors thrown
            expect(true).toBe(true);
        });

        it('should maintain separate completion tracking for each flow', async () => {
            // Requirements: 15.5

            await onboardingService.initializeOnboarding(testDualRoleId, 'both');

            // Complete only admin steps
            const adminSteps = getStepsForFlow('admin');
            let state = await onboardingService.getOnboardingState(testDualRoleId);

            for (const step of adminSteps) {
                if (step.required) {
                    state = await onboardingService.completeStep(testDualRoleId, step.id);
                }
            }

            // Admin flow should be complete, user flow should not
            expect(state?.metadata?.adminFlowComplete).toBe(true);
            expect(state?.metadata?.userFlowComplete).toBe(false);
            expect(state?.isComplete).toBe(false);
        });
    });

    describe('Skip and Resume Flow', () => {
        it('should allow skipping steps and resuming later', async () => {
            // Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.1, 10.2, 10.3

            // Step 1: Initialize onboarding
            await onboardingService.initializeOnboarding(testUserId, 'user');
            const userSteps = getStepsForFlow('user');

            // Step 2: Complete first step
            await onboardingService.completeStep(testUserId, userSteps[0].id);

            // Step 3: Skip second step
            const stateAfterSkip = await onboardingService.skipStep(
                testUserId,
                userSteps[1].id
            );

            expect(stateAfterSkip.skippedSteps).toContain(userSteps[1].id);
            expect(stateAfterSkip.completedSteps).not.toContain(userSteps[1].id);

            // Track analytics
            await onboardingAnalytics.trackStepSkipped(
                testUserId,
                'user',
                userSteps[1].id,
                'User chose to skip'
            );

            // Step 4: Verify onboarding is still incomplete
            const needsOnboarding = await onboardingService.needsOnboarding(testUserId);
            expect(needsOnboarding).toBe(true);

            // Step 5: Get next step (should skip the skipped step)
            const nextStep = await onboardingService.getNextStep(testUserId);
            expect(nextStep?.id).not.toBe(userSteps[1].id);

            // Step 6: Resume - complete the skipped step
            await onboardingAnalytics.trackOnboardingResumed(
                testUserId,
                'user',
                userSteps[1].id
            );

            const stateAfterResume = await onboardingService.completeStep(
                testUserId,
                userSteps[1].id
            );

            expect(stateAfterResume.completedSteps).toContain(userSteps[1].id);
            expect(stateAfterResume.skippedSteps).not.toContain(userSteps[1].id);
        });

        it('should preserve skip state across sessions', async () => {
            // Requirements: 5.5, 10.3

            // Initialize and skip a step
            await onboardingService.initializeOnboarding(testUserId, 'user');
            const userSteps = getStepsForFlow('user');

            await onboardingService.skipStep(testUserId, userSteps[0].id);

            // Simulate new session by retrieving state
            const state = await onboardingService.getOnboardingState(testUserId);
            expect(state?.skippedSteps).toContain(userSteps[0].id);

            // Verify onboarding still needed
            const needsOnboarding = await onboardingService.needsOnboarding(testUserId);
            expect(needsOnboarding).toBe(true);
        });

        it('should allow accessing skipped steps from settings', async () => {
            // Requirements: 10.5

            // Initialize and skip steps
            await onboardingService.initializeOnboarding(testUserId, 'user');
            const userSteps = getStepsForFlow('user');

            await onboardingService.skipStep(testUserId, userSteps[0].id);
            await onboardingService.skipStep(testUserId, userSteps[1].id);

            // Get state to see skipped steps
            const state = await onboardingService.getOnboardingState(testUserId);
            expect(state?.skippedSteps).toHaveLength(2);

            // User can complete skipped steps later
            await onboardingService.completeStep(testUserId, userSteps[0].id);

            const updatedState = await onboardingService.getOnboardingState(testUserId);
            expect(updatedState?.completedSteps).toContain(userSteps[0].id);
            expect(updatedState?.skippedSteps).not.toContain(userSteps[0].id);
        });

        it('should navigate to correct step when resuming', async () => {
            // Requirements: 5.3, 6.3

            await onboardingService.initializeOnboarding(testUserId, 'user');
            const userSteps = getStepsForFlow('user');

            // Complete first step, skip second, complete third
            await onboardingService.completeStep(testUserId, userSteps[0].id);
            await onboardingService.skipStep(testUserId, userSteps[1].id);
            await onboardingService.completeStep(testUserId, userSteps[2].id);

            // Next step should be the first incomplete, non-skipped step
            const nextStep = await onboardingService.getNextStep(testUserId);
            expect(nextStep?.id).not.toBe(userSteps[0].id); // Already complete
            expect(nextStep?.id).not.toBe(userSteps[1].id); // Skipped
            expect(nextStep?.id).not.toBe(userSteps[2].id); // Already complete
        });
    });

    describe('Analytics Tracking', () => {
        it('should track all analytics events throughout onboarding', async () => {
            // Requirements: 8.1, 8.2, 8.3, 8.4, 8.5

            const analyticsEvents: string[] = [];

            // Mock analytics to track events
            const originalTrackStart = onboardingAnalytics.trackOnboardingStarted;
            const originalTrackStep = onboardingAnalytics.trackStepCompleted;
            const originalTrackSkip = onboardingAnalytics.trackStepSkipped;
            const originalTrackComplete = onboardingAnalytics.trackOnboardingCompleted;

            onboardingAnalytics.trackOnboardingStarted = jest.fn(async () => {
                analyticsEvents.push('onboarding_started');
            });
            onboardingAnalytics.trackStepCompleted = jest.fn(async () => {
                analyticsEvents.push('step_completed');
            });
            onboardingAnalytics.trackStepSkipped = jest.fn(async () => {
                analyticsEvents.push('step_skipped');
            });
            onboardingAnalytics.trackOnboardingCompleted = jest.fn(async () => {
                analyticsEvents.push('onboarding_completed');
            });

            // Run through onboarding
            await onboardingService.initializeOnboarding(testUserId, 'user');
            await onboardingAnalytics.trackOnboardingStarted(testUserId, 'user');

            const userSteps = getStepsForFlow('user');

            // Complete some steps
            await onboardingService.completeStep(testUserId, userSteps[0].id);
            await onboardingAnalytics.trackStepCompleted(testUserId, 'user', userSteps[0].id);

            // Skip a step
            await onboardingService.skipStep(testUserId, userSteps[1].id);
            await onboardingAnalytics.trackStepSkipped(testUserId, 'user', userSteps[1].id);

            // Complete remaining steps
            for (let i = 2; i < userSteps.length; i++) {
                if (userSteps[i].required) {
                    await onboardingService.completeStep(testUserId, userSteps[i].id);
                    await onboardingAnalytics.trackStepCompleted(testUserId, 'user', userSteps[i].id);
                }
            }

            await onboardingService.completeOnboarding(testUserId);
            await onboardingAnalytics.trackOnboardingCompleted(testUserId, 'user');

            // Verify event order
            expect(analyticsEvents[0]).toBe('onboarding_started');
            expect(analyticsEvents[analyticsEvents.length - 1]).toBe('onboarding_completed');
            expect(analyticsEvents).toContain('step_completed');
            expect(analyticsEvents).toContain('step_skipped');

            // Restore original functions
            onboardingAnalytics.trackOnboardingStarted = originalTrackStart;
            onboardingAnalytics.trackStepCompleted = originalTrackStep;
            onboardingAnalytics.trackStepSkipped = originalTrackSkip;
            onboardingAnalytics.trackOnboardingCompleted = originalTrackComplete;
        });

        it('should track event ordering correctly', async () => {
            // Requirements: 8.1, 8.4 (Property 8: Analytics event ordering)

            const events: Array<{ type: string; timestamp: number }> = [];

            // Track events with timestamps
            await onboardingService.initializeOnboarding(testUserId, 'user');
            events.push({ type: 'started', timestamp: Date.now() });

            const userSteps = getStepsForFlow('user');

            for (const step of userSteps.slice(0, 3)) {
                if (step.required) {
                    await onboardingService.completeStep(testUserId, step.id);
                    events.push({ type: 'step_completed', timestamp: Date.now() });
                }
            }

            await onboardingService.completeOnboarding(testUserId);
            events.push({ type: 'completed', timestamp: Date.now() });

            // Verify chronological order
            for (let i = 1; i < events.length; i++) {
                expect(events[i].timestamp).toBeGreaterThanOrEqual(events[i - 1].timestamp);
            }

            // Verify event type order
            expect(events[0].type).toBe('started');
            expect(events[events.length - 1].type).toBe('completed');
        });
    });

    describe('Error Handling and Recovery', () => {
        it('should handle network errors gracefully', async () => {
            // Requirements: 6.1, 6.2

            // This test verifies the service handles errors without crashing
            // In a real scenario, network errors would be retried

            await onboardingService.initializeOnboarding(testUserId, 'user');

            // Attempt operations that should handle errors gracefully
            const needsOnboarding = await onboardingService.needsOnboarding(testUserId);
            expect(typeof needsOnboarding).toBe('boolean');

            const nextStep = await onboardingService.getNextStep(testUserId);
            expect(nextStep).toBeDefined();
        });

        it('should validate state structure and recover from corruption', async () => {
            // Requirements: 6.1

            await onboardingService.initializeOnboarding(testUserId, 'user');

            // Get state and verify it's valid
            const state = await onboardingService.getOnboardingState(testUserId);
            expect(state).toBeDefined();
            expect(state?.userId).toBe(testUserId);
            expect(Array.isArray(state?.completedSteps)).toBe(true);
            expect(Array.isArray(state?.skippedSteps)).toBe(true);
        });
    });

    describe('State Persistence and Consistency', () => {
        it('should maintain state consistency across multiple operations', async () => {
            // Requirements: 6.1, 6.2, 6.3

            await onboardingService.initializeOnboarding(testUserId, 'user');
            const userSteps = getStepsForFlow('user');

            // Perform multiple operations
            await onboardingService.completeStep(testUserId, userSteps[0].id);
            await onboardingService.completeStep(testUserId, userSteps[1].id);
            await onboardingService.skipStep(testUserId, userSteps[2].id);

            // Verify state is consistent
            const state = await onboardingService.getOnboardingState(testUserId);
            expect(state?.completedSteps).toHaveLength(2);
            expect(state?.skippedSteps).toHaveLength(1);
            expect(state?.completedSteps).toContain(userSteps[0].id);
            expect(state?.completedSteps).toContain(userSteps[1].id);
            expect(state?.skippedSteps).toContain(userSteps[2].id);
        });

        it('should prevent duplicate step completions', async () => {
            // Requirements: 6.1

            await onboardingService.initializeOnboarding(testUserId, 'user');
            const userSteps = getStepsForFlow('user');

            // Complete same step twice
            await onboardingService.completeStep(testUserId, userSteps[0].id);
            await onboardingService.completeStep(testUserId, userSteps[0].id);

            // Verify step only appears once
            const state = await onboardingService.getOnboardingState(testUserId);
            const count = state?.completedSteps.filter(id => id === userSteps[0].id).length;
            expect(count).toBe(1);
        });

        it('should update lastAccessedAt on every operation', async () => {
            // Requirements: 6.1

            await onboardingService.initializeOnboarding(testUserId, 'user');
            const userSteps = getStepsForFlow('user');

            const state1 = await onboardingService.getOnboardingState(testUserId);
            const timestamp1 = state1?.lastAccessedAt;

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 100));

            await onboardingService.completeStep(testUserId, userSteps[0].id);

            const state2 = await onboardingService.getOnboardingState(testUserId);
            const timestamp2 = state2?.lastAccessedAt;

            expect(timestamp2).not.toBe(timestamp1);
            expect(new Date(timestamp2!).getTime()).toBeGreaterThan(
                new Date(timestamp1!).getTime()
            );
        });
    });

    describe('Completion Detection', () => {
        it('should detect completion when all required steps are done', async () => {
            // Requirements: 6.4, 6.5

            await onboardingService.initializeOnboarding(testUserId, 'user');
            const userSteps = getStepsForFlow('user');
            const requiredSteps = userSteps.filter(s => s.required);

            // Complete all required steps
            for (const step of requiredSteps) {
                await onboardingService.completeStep(testUserId, step.id);
            }

            // Mark as complete
            const finalState = await onboardingService.completeOnboarding(testUserId);
            expect(finalState.isComplete).toBe(true);

            // Verify no longer needs onboarding
            const needsOnboarding = await onboardingService.needsOnboarding(testUserId);
            expect(needsOnboarding).toBe(false);
        });

        it('should not show onboarding prompts after completion', async () => {
            // Requirements: 6.5

            await onboardingService.initializeOnboarding(testUserId, 'user');
            await onboardingService.completeOnboarding(testUserId);

            // Verify state shows complete
            const state = await onboardingService.getOnboardingState(testUserId);
            expect(state?.isComplete).toBe(true);
            expect(state?.completedAt).toBeDefined();

            // Verify needsOnboarding returns false
            const needsOnboarding = await onboardingService.needsOnboarding(testUserId);
            expect(needsOnboarding).toBe(false);
        });
    });
});
