/**
 * Onboarding State Manager
 * 
 * Centralized state management utilities for onboarding system.
 * Handles completion detection, state validation, and persistence logic.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 18.1, 18.2, 18.3, 18.4
 */

import type { OnboardingState, OnboardingFlowType, OnboardingStep } from '@/types/onboarding';
import { getStepsForFlow, isOnboardingComplete } from '@/types/onboarding';

/**
 * Validates onboarding state structure
 * Requirement 18.1: Automatic state saving on step completion
 */
export function validateOnboardingState(state: any): state is OnboardingState {
    if (!state || typeof state !== 'object') {
        return false;
    }

    const required = [
        'userId',
        'flowType',
        'currentStep',
        'completedSteps',
        'skippedSteps',
        'isComplete',
        'startedAt',
        'lastAccessedAt',
    ];

    for (const field of required) {
        if (!(field in state)) {
            return false;
        }
    }

    // Validate types
    if (typeof state.userId !== 'string') return false;
    if (!['user', 'admin', 'both'].includes(state.flowType)) return false;
    if (typeof state.currentStep !== 'number') return false;
    if (!Array.isArray(state.completedSteps)) return false;
    if (!Array.isArray(state.skippedSteps)) return false;
    if (typeof state.isComplete !== 'boolean') return false;
    if (typeof state.startedAt !== 'string') return false;
    if (typeof state.lastAccessedAt !== 'string') return false;

    return true;
}

/**
 * Detects if onboarding is complete based on state
 * Requirement 6.4: Completion detection when all steps done
 */
export function detectCompletion(state: OnboardingState): boolean {
    // If already marked complete, return true
    if (state.isComplete) {
        return true;
    }

    // Check if all required steps are completed
    return isOnboardingComplete(state.completedSteps, state.flowType);
}

/**
 * Checks if user should see onboarding prompts
 * Requirement 6.5: Prevent onboarding prompts after completion
 */
export function shouldShowOnboardingPrompts(state: OnboardingState | null): boolean {
    // No state means user needs onboarding
    if (!state) {
        return true;
    }

    // If marked complete, don't show prompts
    if (state.isComplete) {
        return false;
    }

    // If all required steps are done, don't show prompts
    if (detectCompletion(state)) {
        return false;
    }

    // Otherwise, show prompts
    return true;
}

/**
 * Checks if resume banner should be shown
 * Requirement 5.2: Resume banner for incomplete flows
 */
export function shouldShowResumeBanner(state: OnboardingState | null): boolean {
    // No state means user hasn't started
    if (!state) {
        return false;
    }

    // Don't show if complete
    if (state.isComplete) {
        return false;
    }

    // Don't show if dismissed in current session
    if (state.metadata?.bannerDismissed) {
        return false;
    }

    // Show if there are incomplete steps
    return !detectCompletion(state);
}

/**
 * Preserves state data during navigation
 * Requirement 6.2: Data preservation on navigation away
 */
export function preserveStateData(state: OnboardingState): OnboardingState {
    return {
        ...state,
        lastAccessedAt: new Date().toISOString(),
    };
}

/**
 * Restores state when returning to onboarding
 * Requirement 6.3: State restoration on return to onboarding
 */
export function restoreState(state: OnboardingState): OnboardingState {
    return {
        ...state,
        lastAccessedAt: new Date().toISOString(),
        metadata: {
            ...state.metadata,
            // Clear session-specific flags
            bannerDismissed: false,
        },
    };
}

/**
 * Merges state updates while preserving critical fields
 * Requirement 18.2: Data preservation on navigation away
 */
export function mergeStateUpdates(
    currentState: OnboardingState,
    updates: Partial<OnboardingState>
): OnboardingState {
    const merged: OnboardingState = {
        ...currentState,
        ...updates,
        // Preserve critical fields that shouldn't be overwritten
        userId: currentState.userId,
        startedAt: currentState.startedAt,
        // Update timestamp
        lastAccessedAt: new Date().toISOString(),
    };

    // Ensure arrays are properly merged
    if (updates.completedSteps) {
        merged.completedSteps = Array.from(
            new Set([...currentState.completedSteps, ...updates.completedSteps])
        );
    }

    if (updates.skippedSteps) {
        merged.skippedSteps = Array.from(
            new Set([...currentState.skippedSteps, ...updates.skippedSteps])
        );
    }

    // Merge metadata
    if (updates.metadata) {
        merged.metadata = {
            ...currentState.metadata,
            ...updates.metadata,
        };
    }

    return merged;
}

/**
 * Calculates which steps need to be completed
 * Requirement 6.3: State restoration on return to onboarding
 */
export function getIncompleteSteps(state: OnboardingState): OnboardingStep[] {
    const allSteps = getStepsForFlow(state.flowType);

    return allSteps.filter(
        step => !state.completedSteps.includes(step.id) && !state.skippedSteps.includes(step.id)
    );
}

/**
 * Finds the next step user should complete
 * Requirement 5.3: Resume navigation correctness
 */
export function findNextStep(state: OnboardingState): OnboardingStep | null {
    const incompleteSteps = getIncompleteSteps(state);

    if (incompleteSteps.length === 0) {
        return null;
    }

    // Return first incomplete step
    return incompleteSteps[0];
}

/**
 * Validates step transition
 * Ensures users can't skip ahead inappropriately
 */
export function canTransitionToStep(
    state: OnboardingState,
    targetStepId: string
): boolean {
    const allSteps = getStepsForFlow(state.flowType);
    const targetStep = allSteps.find(step => step.id === targetStepId);

    if (!targetStep) {
        return false;
    }

    // Can always go back to completed steps
    if (state.completedSteps.includes(targetStepId)) {
        return true;
    }

    // Can go to skipped steps
    if (state.skippedSteps.includes(targetStepId)) {
        return true;
    }

    // Can go to next incomplete step
    const nextStep = findNextStep(state);
    if (nextStep && nextStep.id === targetStepId) {
        return true;
    }

    // Can't skip ahead to future steps
    return false;
}

/**
 * Marks onboarding as complete if all required steps are done
 * Requirement 6.4: Flow completion marking
 */
export function markCompleteIfDone(state: OnboardingState): OnboardingState {
    if (state.isComplete) {
        return state;
    }

    if (detectCompletion(state)) {
        return {
            ...state,
            isComplete: true,
            completedAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
        };
    }

    return state;
}

/**
 * Checks if state needs to be synced to server
 * Used for optimizing network requests
 */
export function needsSync(
    state: OnboardingState,
    lastSyncTimestamp: number
): boolean {
    const SYNC_INTERVAL = 30000; // 30 seconds
    const now = Date.now();

    // Sync if last sync was more than interval ago
    if (now - lastSyncTimestamp > SYNC_INTERVAL) {
        return true;
    }

    // Sync if state was recently updated
    const lastAccessedTime = new Date(state.lastAccessedAt).getTime();
    if (now - lastAccessedTime < 5000) {
        return true;
    }

    return false;
}

/**
 * Creates a minimal state snapshot for storage
 * Reduces payload size for network requests
 */
export function createStateSnapshot(state: OnboardingState): Partial<OnboardingState> {
    return {
        userId: state.userId,
        flowType: state.flowType,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        skippedSteps: state.skippedSteps,
        isComplete: state.isComplete,
        lastAccessedAt: state.lastAccessedAt,
        metadata: state.metadata,
    };
}

/**
 * Validates state consistency
 * Ensures state is in a valid configuration
 */
export function validateStateConsistency(state: OnboardingState): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Check for duplicate steps
    const duplicateCompleted = state.completedSteps.filter(
        (step, index) => state.completedSteps.indexOf(step) !== index
    );
    if (duplicateCompleted.length > 0) {
        errors.push(`Duplicate completed steps: ${duplicateCompleted.join(', ')}`);
    }

    const duplicateSkipped = state.skippedSteps.filter(
        (step, index) => state.skippedSteps.indexOf(step) !== index
    );
    if (duplicateSkipped.length > 0) {
        errors.push(`Duplicate skipped steps: ${duplicateSkipped.join(', ')}`);
    }

    // Check for steps in both completed and skipped
    const overlap = state.completedSteps.filter(step => state.skippedSteps.includes(step));
    if (overlap.length > 0) {
        errors.push(`Steps in both completed and skipped: ${overlap.join(', ')}`);
    }

    // Check if currentStep is valid
    const allSteps = getStepsForFlow(state.flowType);
    if (state.currentStep < 0 || state.currentStep > allSteps.length) {
        errors.push(`Invalid currentStep: ${state.currentStep}`);
    }

    // Check if completedAt is set when isComplete is true
    if (state.isComplete && !state.completedAt) {
        errors.push('isComplete is true but completedAt is not set');
    }

    // Check if timestamps are valid
    try {
        new Date(state.startedAt);
        new Date(state.lastAccessedAt);
        if (state.completedAt) {
            new Date(state.completedAt);
        }
    } catch (err) {
        errors.push('Invalid timestamp format');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Repairs inconsistent state
 * Attempts to fix common state issues
 */
export function repairState(state: OnboardingState): OnboardingState {
    let repaired = { ...state };

    // Remove duplicates from arrays
    repaired.completedSteps = Array.from(new Set(repaired.completedSteps));
    repaired.skippedSteps = Array.from(new Set(repaired.skippedSteps));

    // Remove steps from skipped if they're in completed
    repaired.skippedSteps = repaired.skippedSteps.filter(
        step => !repaired.completedSteps.includes(step)
    );

    // Fix currentStep if out of bounds
    const allSteps = getStepsForFlow(repaired.flowType);
    if (repaired.currentStep < 0) {
        repaired.currentStep = 0;
    } else if (repaired.currentStep > allSteps.length) {
        repaired.currentStep = allSteps.length;
    }

    // Set completedAt if isComplete but not set
    if (repaired.isComplete && !repaired.completedAt) {
        repaired.completedAt = repaired.lastAccessedAt;
    }

    // Update lastAccessedAt
    repaired.lastAccessedAt = new Date().toISOString();

    return repaired;
}
