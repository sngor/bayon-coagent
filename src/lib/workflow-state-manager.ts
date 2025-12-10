/**
 * Workflow State Manager
 * 
 * Pure functions for managing workflow state transitions and validation.
 * Ensures consistency and validates state transitions before applying them.
 * 
 * Requirements: 2.1, 2.2, 2.5, 9.3, 14.5
 */

import {
    WorkflowInstance,
    WorkflowState,
    WorkflowPreset,
    WorkflowStepDefinition,
    WorkflowStatus,
} from '@/types/workflows';

/**
 * Get the current step definition for a workflow instance
 * 
 * @param instance - The workflow instance
 * @param preset - The workflow preset definition
 * @returns The current step definition
 * @throws Error if current step is not found in preset
 */
export function getCurrentStep(
    instance: WorkflowInstance,
    preset: WorkflowPreset
): WorkflowStepDefinition {
    const step = preset.steps.find(s => s.id === instance.currentStepId);

    if (!step) {
        throw new Error(
            `Current step "${instance.currentStepId}" not found in preset "${preset.id}"`
        );
    }

    return step;
}

/**
 * Get the next step in the workflow sequence
 * 
 * @param instance - The workflow instance
 * @param preset - The workflow preset definition
 * @returns The next step definition, or null if at the end
 */
export function getNextStep(
    instance: WorkflowInstance,
    preset: WorkflowPreset
): WorkflowStepDefinition | null {
    const currentIndex = preset.steps.findIndex(s => s.id === instance.currentStepId);

    if (currentIndex === -1) {
        throw new Error(
            `Current step "${instance.currentStepId}" not found in preset "${preset.id}"`
        );
    }

    // Check if we're at the last step
    if (currentIndex >= preset.steps.length - 1) {
        return null;
    }

    return preset.steps[currentIndex + 1];
}

/**
 * Check if navigation to a specific step is allowed
 * 
 * Rules:
 * - Can always navigate to completed steps
 * - Can navigate to current step
 * - Cannot navigate to incomplete future steps
 * 
 * @param instance - The workflow instance
 * @param stepId - The step ID to navigate to
 * @param preset - The workflow preset definition
 * @returns True if navigation is allowed
 */
export function canNavigateToStep(
    instance: WorkflowInstance,
    stepId: string,
    preset: WorkflowPreset
): boolean {
    // Check if step exists in preset
    const stepExists = preset.steps.some(s => s.id === stepId);
    if (!stepExists) {
        return false;
    }

    // Can always navigate to current step
    if (stepId === instance.currentStepId) {
        return true;
    }

    // Can navigate to completed steps
    if (instance.completedSteps.includes(stepId)) {
        return true;
    }

    // Can navigate to skipped steps
    if (instance.skippedSteps.includes(stepId)) {
        return true;
    }

    // Cannot navigate to incomplete future steps
    return false;
}

/**
 * Transition to a specific step
 * 
 * Validates the transition is allowed before applying.
 * Updates currentStepId and lastActiveAt.
 * 
 * @param instance - The workflow instance
 * @param stepId - The step ID to transition to
 * @param preset - The workflow preset definition
 * @returns New workflow state
 * @throws Error if transition is not allowed
 */
export function transitionToStep(
    instance: WorkflowInstance,
    stepId: string,
    preset: WorkflowPreset
): WorkflowState {
    if (!canNavigateToStep(instance, stepId, preset)) {
        throw new Error(
            `Cannot navigate to step "${stepId}". Step must be completed or current.`
        );
    }

    return {
        currentStepId: stepId,
        completedSteps: instance.completedSteps,
        skippedSteps: instance.skippedSteps,
        contextData: instance.contextData,
        lastActiveAt: new Date().toISOString(),
    };
}

/**
 * Mark a step as complete and advance to next step
 * 
 * Adds the step to completedSteps, merges any context data,
 * and advances to the next step if available.
 * 
 * @param instance - The workflow instance
 * @param stepId - The step ID to mark complete
 * @param preset - The workflow preset definition
 * @param data - Optional context data to merge
 * @returns New workflow state
 * @throws Error if step is not the current step
 */
export function markStepComplete(
    instance: WorkflowInstance,
    stepId: string,
    preset: WorkflowPreset,
    data?: Record<string, any>
): WorkflowState {
    // Verify this is the current step
    if (instance.currentStepId !== stepId) {
        throw new Error(
            `Cannot complete step "${stepId}". Current step is "${instance.currentStepId}".`
        );
    }

    // Add to completed steps if not already there
    const completedSteps = instance.completedSteps.includes(stepId)
        ? instance.completedSteps
        : [...instance.completedSteps, stepId];

    // Remove from skipped steps if it was previously skipped
    const skippedSteps = instance.skippedSteps.filter(id => id !== stepId);

    // Merge context data
    const contextData = data
        ? { ...instance.contextData, ...data }
        : instance.contextData;

    // Get next step
    const nextStep = getNextStep(instance, preset);
    const currentStepId = nextStep ? nextStep.id : instance.currentStepId;

    return {
        currentStepId,
        completedSteps,
        skippedSteps,
        contextData,
        lastActiveAt: new Date().toISOString(),
    };
}

/**
 * Mark a step as skipped and advance to next step
 * 
 * Only optional steps can be skipped.
 * Adds the step to skippedSteps and advances to the next step.
 * 
 * @param instance - The workflow instance
 * @param stepId - The step ID to skip
 * @param preset - The workflow preset definition
 * @returns New workflow state
 * @throws Error if step is not optional or not the current step
 */
export function markStepSkipped(
    instance: WorkflowInstance,
    stepId: string,
    preset: WorkflowPreset
): WorkflowState {
    // Verify this is the current step
    if (instance.currentStepId !== stepId) {
        throw new Error(
            `Cannot skip step "${stepId}". Current step is "${instance.currentStepId}".`
        );
    }

    // Verify step is optional
    const step = preset.steps.find(s => s.id === stepId);
    if (!step) {
        throw new Error(`Step "${stepId}" not found in preset "${preset.id}"`);
    }

    if (!step.isOptional) {
        throw new Error(`Cannot skip required step "${stepId}"`);
    }

    // Add to skipped steps if not already there
    const skippedSteps = instance.skippedSteps.includes(stepId)
        ? instance.skippedSteps
        : [...instance.skippedSteps, stepId];

    // Remove from completed steps if it was previously completed
    const completedSteps = instance.completedSteps.filter(id => id !== stepId);

    // Get next step
    const nextStep = getNextStep(instance, preset);
    const currentStepId = nextStep ? nextStep.id : instance.currentStepId;

    return {
        currentStepId,
        completedSteps,
        skippedSteps,
        contextData: instance.contextData,
        lastActiveAt: new Date().toISOString(),
    };
}

/**
 * Check if a workflow is complete
 * 
 * A workflow is complete when all required steps are either
 * completed or skipped (optional steps only).
 * 
 * @param instance - The workflow instance
 * @param preset - The workflow preset definition
 * @returns True if workflow is complete
 */
export function isWorkflowComplete(
    instance: WorkflowInstance,
    preset: WorkflowPreset
): boolean {
    // Get all required steps
    const requiredSteps = preset.steps.filter(s => !s.isOptional);

    // Check if all required steps are completed
    const allRequiredCompleted = requiredSteps.every(step =>
        instance.completedSteps.includes(step.id)
    );

    if (!allRequiredCompleted) {
        return false;
    }

    // Check if all optional steps are either completed or skipped
    const optionalSteps = preset.steps.filter(s => s.isOptional);
    const allOptionalHandled = optionalSteps.every(step =>
        instance.completedSteps.includes(step.id) ||
        instance.skippedSteps.includes(step.id)
    );

    return allOptionalHandled;
}

/**
 * Get the index of a step in the workflow
 * 
 * @param stepId - The step ID
 * @param preset - The workflow preset definition
 * @returns The step index, or -1 if not found
 */
export function getStepIndex(stepId: string, preset: WorkflowPreset): number {
    return preset.steps.findIndex(s => s.id === stepId);
}

/**
 * Get the step at a specific index
 * 
 * @param index - The step index
 * @param preset - The workflow preset definition
 * @returns The step definition, or null if index is out of bounds
 */
export function getStepAtIndex(
    index: number,
    preset: WorkflowPreset
): WorkflowStepDefinition | null {
    if (index < 0 || index >= preset.steps.length) {
        return null;
    }
    return preset.steps[index];
}

/**
 * Calculate progress percentage for a workflow instance
 * 
 * Progress = (completed steps + skipped steps) / total steps * 100
 * 
 * @param instance - The workflow instance
 * @param preset - The workflow preset definition
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
    instance: WorkflowInstance,
    preset: WorkflowPreset
): number {
    const totalSteps = preset.steps.length;
    if (totalSteps === 0) {
        return 100;
    }

    const handledSteps = instance.completedSteps.length + instance.skippedSteps.length;
    return Math.round((handledSteps / totalSteps) * 100);
}

/**
 * Calculate estimated time remaining for a workflow instance
 * 
 * Sums the estimated minutes for all incomplete steps
 * (steps that are neither completed nor skipped).
 * 
 * @param instance - The workflow instance
 * @param preset - The workflow preset definition
 * @returns Estimated minutes remaining
 */
export function calculateRemainingTime(
    instance: WorkflowInstance,
    preset: WorkflowPreset
): number {
    const incompleteSteps = preset.steps.filter(
        step =>
            !instance.completedSteps.includes(step.id) &&
            !instance.skippedSteps.includes(step.id)
    );

    return incompleteSteps.reduce((total, step) => total + step.estimatedMinutes, 0);
}
