/**
 * Onboarding Infrastructure Tests
 * 
 * Tests for onboarding data models, key generation, and type utilities.
 */

import { describe, it, expect } from '@jest/globals';
import {
    getStepsForFlow,
    getStepById,
    getNextStep,
    getPreviousStep,
    calculateProgress,
    isOnboardingComplete,
    USER_ONBOARDING_STEPS,
    ADMIN_ONBOARDING_STEPS,
    type OnboardingFlowType,
} from '@/types/onboarding';
import { getOnboardingStateKeys, getOnboardingAnalyticsKeys } from '@/aws/dynamodb/keys';

describe('Onboarding Type Utilities', () => {
    describe('getStepsForFlow', () => {
        it('should return user steps for user flow', () => {
            const steps = getStepsForFlow('user');
            expect(steps).toEqual(USER_ONBOARDING_STEPS);
            expect(steps.length).toBeGreaterThan(0);
        });

        it('should return admin steps for admin flow', () => {
            const steps = getStepsForFlow('admin');
            expect(steps).toEqual(ADMIN_ONBOARDING_STEPS);
            expect(steps.length).toBeGreaterThan(0);
        });

        it('should return both flows for dual role', () => {
            const steps = getStepsForFlow('both');
            expect(steps.length).toBe(USER_ONBOARDING_STEPS.length + ADMIN_ONBOARDING_STEPS.length);
            // Admin steps should come first
            expect(steps[0]).toEqual(ADMIN_ONBOARDING_STEPS[0]);
        });
    });

    describe('getStepById', () => {
        it('should find user step by ID', () => {
            const step = getStepById('profile');
            expect(step).toBeDefined();
            expect(step?.id).toBe('profile');
            expect(step?.flowType).toBe('user');
        });

        it('should find admin step by ID', () => {
            const step = getStepById('admin-welcome');
            expect(step).toBeDefined();
            expect(step?.id).toBe('admin-welcome');
            expect(step?.flowType).toBe('admin');
        });

        it('should return undefined for non-existent step', () => {
            const step = getStepById('non-existent');
            expect(step).toBeUndefined();
        });
    });

    describe('getNextStep', () => {
        it('should return next step in user flow', () => {
            const nextStep = getNextStep('welcome', 'user', ['welcome']);
            expect(nextStep).toBeDefined();
            expect(nextStep?.id).toBe('profile');
        });

        it('should skip completed steps', () => {
            const nextStep = getNextStep('welcome', 'user', ['welcome', 'profile']);
            expect(nextStep).toBeDefined();
            expect(nextStep?.id).toBe('tour');
        });

        it('should return null when all steps completed', () => {
            const allStepIds = USER_ONBOARDING_STEPS.map(s => s.id);
            const nextStep = getNextStep('complete', 'user', allStepIds);
            expect(nextStep).toBeNull();
        });

        it('should return first incomplete step for invalid current step', () => {
            const nextStep = getNextStep('invalid', 'user', []);
            expect(nextStep).toBeDefined();
            expect(nextStep?.id).toBe('welcome');
        });
    });

    describe('getPreviousStep', () => {
        it('should return previous step', () => {
            const prevStep = getPreviousStep('profile', 'user');
            expect(prevStep).toBeDefined();
            expect(prevStep?.id).toBe('welcome');
        });

        it('should return null for first step', () => {
            const prevStep = getPreviousStep('welcome', 'user');
            expect(prevStep).toBeNull();
        });

        it('should return null for invalid step', () => {
            const prevStep = getPreviousStep('invalid', 'user');
            expect(prevStep).toBeNull();
        });
    });

    describe('calculateProgress', () => {
        it('should calculate 0% for no completed steps', () => {
            const progress = calculateProgress([], 'user');
            expect(progress).toBe(0);
        });

        it('should calculate 100% for all completed steps', () => {
            const allStepIds = USER_ONBOARDING_STEPS.map(s => s.id);
            const progress = calculateProgress(allStepIds, 'user');
            expect(progress).toBe(100);
        });

        it('should calculate correct percentage for partial completion', () => {
            const completedSteps = ['welcome', 'profile'];
            const progress = calculateProgress(completedSteps, 'user');
            const expected = Math.round((2 / USER_ONBOARDING_STEPS.length) * 100);
            expect(progress).toBe(expected);
        });

        it('should ignore steps from other flows', () => {
            const completedSteps = ['welcome', 'admin-welcome'];
            const progress = calculateProgress(completedSteps, 'user');
            const expected = Math.round((1 / USER_ONBOARDING_STEPS.length) * 100);
            expect(progress).toBe(expected);
        });
    });

    describe('isOnboardingComplete', () => {
        it('should return false for no completed steps', () => {
            const complete = isOnboardingComplete([], 'user');
            expect(complete).toBe(false);
        });

        it('should return true when all required steps completed', () => {
            const requiredSteps = USER_ONBOARDING_STEPS
                .filter(s => s.required)
                .map(s => s.id);
            const complete = isOnboardingComplete(requiredSteps, 'user');
            expect(complete).toBe(true);
        });

        it('should return false when missing required steps', () => {
            const completedSteps = ['welcome', 'tour']; // Missing required 'profile' and 'complete'
            const complete = isOnboardingComplete(completedSteps, 'user');
            expect(complete).toBe(false);
        });

        it('should not require optional steps', () => {
            const requiredSteps = USER_ONBOARDING_STEPS
                .filter(s => s.required)
                .map(s => s.id);
            const complete = isOnboardingComplete(requiredSteps, 'user');
            expect(complete).toBe(true);
        });
    });
});

describe('DynamoDB Key Generation', () => {
    describe('getOnboardingStateKeys', () => {
        it('should generate correct keys for onboarding state', () => {
            const userId = 'user-123';
            const keys = getOnboardingStateKeys(userId);

            expect(keys.PK).toBe('USER#user-123');
            expect(keys.SK).toBe('ONBOARDING#STATE');
        });

        it('should include GSI keys for incomplete onboarding', () => {
            const userId = 'user-123';
            const lastAccessedAt = '2024-01-01T00:00:00.000Z';
            const keys = getOnboardingStateKeys(userId, false, lastAccessedAt);

            expect(keys.GSI1PK).toBe('ONBOARDING#INCOMPLETE');
            expect(keys.GSI1SK).toBe(lastAccessedAt);
        });

        it('should not include GSI keys for complete onboarding', () => {
            const userId = 'user-123';
            const lastAccessedAt = '2024-01-01T00:00:00.000Z';
            const keys = getOnboardingStateKeys(userId, true, lastAccessedAt);

            expect(keys.GSI1PK).toBeUndefined();
            expect(keys.GSI1SK).toBeUndefined();
        });
    });

    describe('getOnboardingAnalyticsKeys', () => {
        it('should generate correct keys for analytics event', () => {
            const userId = 'user-123';
            const eventId = 'event-456';
            const timestamp = '2024-01-01T00:00:00.000Z';
            const keys = getOnboardingAnalyticsKeys(userId, eventId, timestamp);

            expect(keys.PK).toBe('USER#user-123');
            expect(keys.SK).toBe('ONBOARDING#ANALYTICS#2024-01-01T00:00:00.000Z#event-456');
        });

        it('should include GSI keys for event type querying', () => {
            const userId = 'user-123';
            const eventId = 'event-456';
            const timestamp = '2024-01-01T00:00:00.000Z';
            const eventType = 'onboarding_started';
            const keys = getOnboardingAnalyticsKeys(userId, eventId, timestamp, eventType);

            expect(keys.GSI1PK).toBe('ANALYTICS#ONBOARDING#onboarding_started');
            expect(keys.GSI1SK).toBe(timestamp);
        });
    });
});

describe('Onboarding Step Definitions', () => {
    it('should have valid user onboarding steps', () => {
        expect(USER_ONBOARDING_STEPS.length).toBeGreaterThan(0);

        USER_ONBOARDING_STEPS.forEach((step, index) => {
            expect(step.id).toBeDefined();
            expect(step.name).toBeDefined();
            expect(step.description).toBeDefined();
            expect(step.path).toBeDefined();
            expect(step.order).toBe(index);
            expect(step.flowType).toBe('user');
            expect(typeof step.required).toBe('boolean');
        });
    });

    it('should have valid admin onboarding steps', () => {
        expect(ADMIN_ONBOARDING_STEPS.length).toBeGreaterThan(0);

        ADMIN_ONBOARDING_STEPS.forEach((step, index) => {
            expect(step.id).toBeDefined();
            expect(step.name).toBeDefined();
            expect(step.description).toBeDefined();
            expect(step.path).toBeDefined();
            expect(step.order).toBe(index);
            expect(step.flowType).toBe('admin');
            expect(typeof step.required).toBe('boolean');
        });
    });

    it('should have unique step IDs across all flows', () => {
        const allSteps = [...USER_ONBOARDING_STEPS, ...ADMIN_ONBOARDING_STEPS];
        const stepIds = allSteps.map(s => s.id);
        const uniqueIds = new Set(stepIds);

        expect(uniqueIds.size).toBe(stepIds.length);
    });

    it('should have at least one required step per flow', () => {
        const userRequired = USER_ONBOARDING_STEPS.filter(s => s.required);
        const adminRequired = ADMIN_ONBOARDING_STEPS.filter(s => s.required);

        expect(userRequired.length).toBeGreaterThan(0);
        expect(adminRequired.length).toBeGreaterThan(0);
    });
});
