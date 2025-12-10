/**
 * Onboarding State Manager Tests
 * 
 * Tests for state management utilities including:
 * - State validation
 * - Completion detection
 * - Data preservation
 * - State restoration
 * - Consistency checks
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 18.1, 18.2, 18.3, 18.4
 */

import {
    validateOnboardingState,
    detectCompletion,
    shouldShowOnboardingPrompts,
    shouldShowResumeBanner,
    preserveStateData,
    restoreState,
    mergeStateUpdates,
    getIncompleteSteps,
    findNextStep,
    canTransitionToStep,
    markCompleteIfDone,
    needsSync,
    createStateSnapshot,
    validateStateConsistency,
    repairState,
} from '../state-manager';
import type { OnboardingState } from '@/types/onboarding';

describe('State Manager', () => {
    const mockState: OnboardingState = {
        userId: 'user-123',
        flowType: 'user',
        currentStep: 2,
        completedSteps: ['welcome', 'profile'],
        skippedSteps: [],
        isComplete: false,
        startedAt: '2024-01-01T00:00:00.000Z',
        lastAccessedAt: '2024-01-01T01:00:00.000Z',
        metadata: {},
    };

    describe('validateOnboardingState', () => {
        it('should validate a correct state', () => {
            expect(validateOnboardingState(mockState)).toBe(true);
        });

        it('should reject null or undefined', () => {
            expect(validateOnboardingState(null)).toBe(false);
            expect(validateOnboardingState(undefined)).toBe(false);
        });

        it('should reject state missing required fields', () => {
            const incomplete = { ...mockState };
            delete (incomplete as any).userId;
            expect(validateOnboardingState(incomplete)).toBe(false);
        });

        it('should reject state with invalid types', () => {
            const invalid = { ...mockState, currentStep: 'invalid' };
            expect(validateOnboardingState(invalid)).toBe(false);
        });

        it('should reject state with invalid flowType', () => {
            const invalid = { ...mockState, flowType: 'invalid' as any };
            expect(validateOnboardingState(invalid)).toBe(false);
        });
    });

    describe('detectCompletion - Requirement 6.4', () => {
        it('should detect completion when isComplete is true', () => {
            const complete = { ...mockState, isComplete: true };
            expect(detectCompletion(complete)).toBe(true);
        });

        it('should detect completion when all required steps are done', () => {
            const complete = {
                ...mockState,
                completedSteps: ['welcome', 'profile', 'tour', 'selection', 'complete'],
            };
            expect(detectCompletion(complete)).toBe(true);
        });

        it('should not detect completion when required steps are missing', () => {
            expect(detectCompletion(mockState)).toBe(false);
        });
    });

    describe('shouldShowOnboardingPrompts - Requirement 6.5', () => {
        it('should show prompts when state is null', () => {
            expect(shouldShowOnboardingPrompts(null)).toBe(true);
        });

        it('should not show prompts when onboarding is complete', () => {
            const complete = { ...mockState, isComplete: true };
            expect(shouldShowOnboardingPrompts(complete)).toBe(false);
        });

        it('should not show prompts when all required steps are done', () => {
            const complete = {
                ...mockState,
                completedSteps: ['welcome', 'profile', 'tour', 'selection', 'complete'],
            };
            expect(shouldShowOnboardingPrompts(complete)).toBe(false);
        });

        it('should show prompts when onboarding is incomplete', () => {
            expect(shouldShowOnboardingPrompts(mockState)).toBe(true);
        });
    });

    describe('shouldShowResumeBanner', () => {
        it('should not show banner when state is null', () => {
            expect(shouldShowResumeBanner(null)).toBe(false);
        });

        it('should not show banner when onboarding is complete', () => {
            const complete = { ...mockState, isComplete: true };
            expect(shouldShowResumeBanner(complete)).toBe(false);
        });

        it('should not show banner when dismissed in session', () => {
            const dismissed = {
                ...mockState,
                metadata: { bannerDismissed: true },
            };
            expect(shouldShowResumeBanner(dismissed)).toBe(false);
        });

        it('should show banner when onboarding is incomplete', () => {
            expect(shouldShowResumeBanner(mockState)).toBe(true);
        });
    });

    describe('preserveStateData - Requirement 6.2', () => {
        it('should update lastAccessedAt timestamp', () => {
            const preserved = preserveStateData(mockState);
            expect(preserved.lastAccessedAt).not.toBe(mockState.lastAccessedAt);
            expect(new Date(preserved.lastAccessedAt).getTime()).toBeGreaterThan(
                new Date(mockState.lastAccessedAt).getTime()
            );
        });

        it('should preserve all other fields', () => {
            const preserved = preserveStateData(mockState);
            expect(preserved.userId).toBe(mockState.userId);
            expect(preserved.flowType).toBe(mockState.flowType);
            expect(preserved.completedSteps).toEqual(mockState.completedSteps);
        });
    });

    describe('restoreState - Requirement 6.3', () => {
        it('should update lastAccessedAt timestamp', () => {
            const restored = restoreState(mockState);
            expect(restored.lastAccessedAt).not.toBe(mockState.lastAccessedAt);
        });

        it('should clear bannerDismissed flag', () => {
            const withBanner = {
                ...mockState,
                metadata: { bannerDismissed: true },
            };
            const restored = restoreState(withBanner);
            expect(restored.metadata?.bannerDismissed).toBe(false);
        });

        it('should preserve other metadata', () => {
            const withMetadata = {
                ...mockState,
                metadata: { selectedHub: 'studio', bannerDismissed: true },
            };
            const restored = restoreState(withMetadata);
            expect(restored.metadata?.selectedHub).toBe('studio');
        });
    });

    describe('mergeStateUpdates - Requirement 18.2', () => {
        it('should merge updates while preserving critical fields', () => {
            const updates = {
                currentStep: 3,
                completedSteps: ['tour'],
            };
            const merged = mergeStateUpdates(mockState, updates);

            expect(merged.userId).toBe(mockState.userId);
            expect(merged.startedAt).toBe(mockState.startedAt);
            expect(merged.currentStep).toBe(3);
        });

        it('should merge completedSteps arrays without duplicates', () => {
            const updates = {
                completedSteps: ['profile', 'tour'],
            };
            const merged = mergeStateUpdates(mockState, updates);

            expect(merged.completedSteps).toContain('welcome');
            expect(merged.completedSteps).toContain('profile');
            expect(merged.completedSteps).toContain('tour');
            expect(merged.completedSteps.filter(s => s === 'profile').length).toBe(1);
        });

        it('should merge metadata objects', () => {
            const stateWithMeta = {
                ...mockState,
                metadata: { selectedHub: 'studio' },
            };
            const updates = {
                metadata: { profileCompletion: 50 },
            };
            const merged = mergeStateUpdates(stateWithMeta, updates);

            expect(merged.metadata?.selectedHub).toBe('studio');
            expect(merged.metadata?.profileCompletion).toBe(50);
        });
    });

    describe('getIncompleteSteps', () => {
        it('should return steps that are not completed or skipped', () => {
            const incomplete = getIncompleteSteps(mockState);
            expect(incomplete.length).toBeGreaterThan(0);
            expect(incomplete.every(s => !mockState.completedSteps.includes(s.id))).toBe(true);
            expect(incomplete.every(s => !mockState.skippedSteps.includes(s.id))).toBe(true);
        });

        it('should return empty array when all steps are done', () => {
            const complete = {
                ...mockState,
                completedSteps: ['welcome', 'profile', 'tour', 'selection', 'complete'],
            };
            const incomplete = getIncompleteSteps(complete);
            expect(incomplete.length).toBe(0);
        });
    });

    describe('findNextStep - Requirement 5.3', () => {
        it('should return first incomplete step', () => {
            const next = findNextStep(mockState);
            expect(next).not.toBeNull();
            expect(mockState.completedSteps).not.toContain(next!.id);
            expect(mockState.skippedSteps).not.toContain(next!.id);
        });

        it('should return null when all steps are complete', () => {
            const complete = {
                ...mockState,
                completedSteps: ['welcome', 'profile', 'tour', 'selection', 'complete'],
            };
            const next = findNextStep(complete);
            expect(next).toBeNull();
        });
    });

    describe('canTransitionToStep', () => {
        it('should allow transition to completed steps', () => {
            expect(canTransitionToStep(mockState, 'welcome')).toBe(true);
            expect(canTransitionToStep(mockState, 'profile')).toBe(true);
        });

        it('should allow transition to skipped steps', () => {
            const withSkipped = {
                ...mockState,
                skippedSteps: ['tour'],
            };
            expect(canTransitionToStep(withSkipped, 'tour')).toBe(true);
        });

        it('should allow transition to next incomplete step', () => {
            const next = findNextStep(mockState);
            if (next) {
                expect(canTransitionToStep(mockState, next.id)).toBe(true);
            }
        });

        it('should not allow skipping ahead', () => {
            // Assuming 'complete' is a future step
            expect(canTransitionToStep(mockState, 'complete')).toBe(false);
        });
    });

    describe('markCompleteIfDone - Requirement 6.4', () => {
        it('should mark as complete when all required steps are done', () => {
            const almostComplete = {
                ...mockState,
                completedSteps: ['welcome', 'profile', 'tour', 'selection', 'complete'],
            };
            const marked = markCompleteIfDone(almostComplete);

            expect(marked.isComplete).toBe(true);
            expect(marked.completedAt).toBeDefined();
        });

        it('should not change state if already complete', () => {
            const complete = {
                ...mockState,
                isComplete: true,
                completedAt: '2024-01-01T02:00:00.000Z',
            };
            const marked = markCompleteIfDone(complete);

            expect(marked.completedAt).toBe(complete.completedAt);
        });

        it('should not mark as complete if required steps are missing', () => {
            const marked = markCompleteIfDone(mockState);
            expect(marked.isComplete).toBe(false);
            expect(marked.completedAt).toBeUndefined();
        });
    });

    describe('needsSync', () => {
        it('should need sync if last sync was long ago', () => {
            const oldTimestamp = Date.now() - 60000; // 1 minute ago
            expect(needsSync(mockState, oldTimestamp)).toBe(true);
        });

        it('should need sync if state was recently updated', () => {
            const recentState = {
                ...mockState,
                lastAccessedAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
            };
            const recentSync = Date.now() - 1000;
            expect(needsSync(recentState, recentSync)).toBe(true);
        });

        it('should not need sync if recently synced and no updates', () => {
            const recentSync = Date.now() - 5000; // 5 seconds ago
            expect(needsSync(mockState, recentSync)).toBe(false);
        });
    });

    describe('createStateSnapshot', () => {
        it('should create minimal snapshot with essential fields', () => {
            const snapshot = createStateSnapshot(mockState);

            expect(snapshot.userId).toBe(mockState.userId);
            expect(snapshot.flowType).toBe(mockState.flowType);
            expect(snapshot.completedSteps).toEqual(mockState.completedSteps);
            expect(snapshot.isComplete).toBe(mockState.isComplete);
        });

        it('should not include timestamps that change frequently', () => {
            const snapshot = createStateSnapshot(mockState);
            expect(snapshot).not.toHaveProperty('startedAt');
            expect(snapshot).not.toHaveProperty('completedAt');
        });
    });

    describe('validateStateConsistency', () => {
        it('should validate consistent state', () => {
            const result = validateStateConsistency(mockState);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect duplicate completed steps', () => {
            const invalid = {
                ...mockState,
                completedSteps: ['welcome', 'profile', 'welcome'],
            };
            const result = validateStateConsistency(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Duplicate'))).toBe(true);
        });

        it('should detect steps in both completed and skipped', () => {
            const invalid = {
                ...mockState,
                completedSteps: ['welcome', 'profile'],
                skippedSteps: ['profile'],
            };
            const result = validateStateConsistency(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('both completed and skipped'))).toBe(true);
        });

        it('should detect invalid currentStep', () => {
            const invalid = {
                ...mockState,
                currentStep: -1,
            };
            const result = validateStateConsistency(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Invalid currentStep'))).toBe(true);
        });

        it('should detect missing completedAt when isComplete', () => {
            const invalid = {
                ...mockState,
                isComplete: true,
                completedAt: undefined,
            };
            const result = validateStateConsistency(invalid);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('completedAt'))).toBe(true);
        });
    });

    describe('repairState', () => {
        it('should remove duplicate steps', () => {
            const invalid = {
                ...mockState,
                completedSteps: ['welcome', 'profile', 'welcome'],
            };
            const repaired = repairState(invalid);
            expect(repaired.completedSteps).toEqual(['welcome', 'profile']);
        });

        it('should remove steps from skipped if in completed', () => {
            const invalid = {
                ...mockState,
                completedSteps: ['welcome', 'profile'],
                skippedSteps: ['profile', 'tour'],
            };
            const repaired = repairState(invalid);
            expect(repaired.skippedSteps).not.toContain('profile');
            expect(repaired.skippedSteps).toContain('tour');
        });

        it('should fix out of bounds currentStep', () => {
            const invalid = {
                ...mockState,
                currentStep: -1,
            };
            const repaired = repairState(invalid);
            expect(repaired.currentStep).toBeGreaterThanOrEqual(0);
        });

        it('should set completedAt if isComplete but not set', () => {
            const invalid = {
                ...mockState,
                isComplete: true,
                completedAt: undefined,
            };
            const repaired = repairState(invalid);
            expect(repaired.completedAt).toBeDefined();
        });

        it('should update lastAccessedAt', () => {
            const repaired = repairState(mockState);
            expect(repaired.lastAccessedAt).not.toBe(mockState.lastAccessedAt);
        });
    });
});
