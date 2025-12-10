/**
 * Workflow Context Manager
 * 
 * Manages context data passing between workflow steps.
 * Handles context storage, retrieval, aggregation, and graceful handling of missing data.
 * 
 * Requirements: 4.2, 4.3, 4.4, 4.5, 9.4
 */

import { WorkflowInstance, WorkflowPreset, WorkflowStepDefinition } from '@/types/workflows';

/**
 * Sets context data for a specific step in a workflow instance
 * 
 * @param instance - The workflow instance
 * @param stepId - The step ID to set context for
 * @param data - The context data to store
 * @returns Updated context data object
 */
export function setStepContext(
    instance: WorkflowInstance,
    stepId: string,
    data: Record<string, any>
): Record<string, any> {
    // Create a new context object with the step's data
    const updatedContext = {
        ...instance.contextData,
        [stepId]: data,
    };

    return updatedContext;
}

/**
 * Gets context data for a specific step
 * 
 * @param instance - The workflow instance
 * @param stepId - The step ID to get context for
 * @returns The context data for the step, or null if not found
 */
export function getStepContext(
    instance: WorkflowInstance,
    stepId: string
): Record<string, any> | null {
    return instance.contextData[stepId] || null;
}

/**
 * Gets aggregated context data for a step, including data from all previous steps
 * 
 * This function collects context data from all steps that come before the target step
 * in the workflow sequence, based on the step's contextInputs definition.
 * 
 * @param instance - The workflow instance
 * @param preset - The workflow preset definition
 * @param stepId - The step ID to get context for
 * @returns Aggregated context data from previous steps
 */
export function getContextForStep(
    instance: WorkflowInstance,
    preset: WorkflowPreset,
    stepId: string
): Record<string, any> {
    // Find the target step definition
    const stepIndex = preset.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) {
        return {};
    }

    const targetStep = preset.steps[stepIndex];

    // If the step doesn't specify context inputs, return empty object
    if (!targetStep.contextInputs || targetStep.contextInputs.length === 0) {
        return {};
    }

    // Collect context data from all previous steps
    const aggregatedContext: Record<string, any> = {};

    // Get all steps before the target step
    const previousSteps = preset.steps.slice(0, stepIndex);

    // For each previous step, check if it provides any of the required context inputs
    for (const prevStep of previousSteps) {
        const stepContext = getStepContext(instance, prevStep.id);

        if (stepContext && prevStep.contextOutputs) {
            // Only include context outputs that are needed by the target step
            for (const outputKey of prevStep.contextOutputs) {
                if (targetStep.contextInputs.includes(outputKey)) {
                    // Handle missing context gracefully
                    if (stepContext[outputKey] !== undefined) {
                        aggregatedContext[outputKey] = stepContext[outputKey];
                    }
                }
            }
        }
    }

    // Handle missing context gracefully by providing default values
    for (const inputKey of targetStep.contextInputs) {
        if (aggregatedContext[inputKey] === undefined) {
            // Provide a default empty value based on common patterns
            aggregatedContext[inputKey] = getDefaultContextValue(inputKey);
        }
    }

    return aggregatedContext;
}

/**
 * Clears all context data for a workflow instance
 * 
 * @param instance - The workflow instance
 * @returns Empty context data object
 */
export function clearContext(instance: WorkflowInstance): Record<string, any> {
    return {};
}

/**
 * Gets a default value for a missing context key
 * 
 * This provides graceful handling of missing context data by returning
 * sensible defaults based on the context key name.
 * 
 * @param contextKey - The context key to get a default for
 * @returns A default value for the context key
 */
function getDefaultContextValue(contextKey: string): any {
    // Provide defaults based on common context key patterns
    const key = contextKey.toLowerCase();

    // Array-like data
    if (key.includes('list') || key.includes('items') || key.includes('competitors')) {
        return [];
    }

    // Object-like data
    if (key.includes('data') || key.includes('details') || key.includes('profile') || key.includes('results')) {
        return {};
    }

    // String-like data
    if (key.includes('text') || key.includes('description') || key.includes('content') || key.includes('report')) {
        return '';
    }

    // Boolean-like data
    if (key.includes('is') || key.includes('has') || key.includes('enabled')) {
        return false;
    }

    // Numeric data
    if (key.includes('count') || key.includes('number') || key.includes('total')) {
        return 0;
    }

    // Default to null for unknown types
    return null;
}

/**
 * Validates that all required context inputs are available for a step
 * 
 * @param instance - The workflow instance
 * @param preset - The workflow preset definition
 * @param stepId - The step ID to validate context for
 * @returns Object with validation result and missing keys
 */
export function validateStepContext(
    instance: WorkflowInstance,
    preset: WorkflowPreset,
    stepId: string
): { isValid: boolean; missingKeys: string[] } {
    const stepIndex = preset.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) {
        return { isValid: false, missingKeys: [] };
    }

    const targetStep = preset.steps[stepIndex];

    // If no context inputs required, it's valid
    if (!targetStep.contextInputs || targetStep.contextInputs.length === 0) {
        return { isValid: true, missingKeys: [] };
    }

    const missingKeys: string[] = [];

    // Get all steps before the target step
    const previousSteps = preset.steps.slice(0, stepIndex);

    // For each required input, check if it's provided by any previous step
    for (const inputKey of targetStep.contextInputs) {
        let found = false;

        // Check each previous step to see if it provides this context
        for (const prevStep of previousSteps) {
            if (prevStep.contextOutputs && prevStep.contextOutputs.includes(inputKey)) {
                // Check if this step actually has context data with this key
                const stepContext = getStepContext(instance, prevStep.id);
                if (stepContext && stepContext[inputKey] !== undefined && stepContext[inputKey] !== null) {
                    // Don't consider empty strings as valid for validation
                    if (typeof stepContext[inputKey] === 'string' && stepContext[inputKey] === '') {
                        continue;
                    }
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            missingKeys.push(inputKey);
        }
    }

    return {
        isValid: missingKeys.length === 0,
        missingKeys,
    };
}

/**
 * Merges new context data with existing context for a step
 * 
 * @param instance - The workflow instance
 * @param stepId - The step ID to merge context for
 * @param newData - The new context data to merge
 * @returns Updated context data object
 */
export function mergeStepContext(
    instance: WorkflowInstance,
    stepId: string,
    newData: Record<string, any>
): Record<string, any> {
    const existingStepContext = getStepContext(instance, stepId) || {};

    // Merge the new data with existing step context
    const mergedStepContext = {
        ...existingStepContext,
        ...newData,
    };

    // Update the instance's context data
    return setStepContext(instance, stepId, mergedStepContext);
}

/**
 * Gets all context data keys that have been set in the workflow
 * 
 * @param instance - The workflow instance
 * @returns Array of step IDs that have context data
 */
export function getContextKeys(instance: WorkflowInstance): string[] {
    return Object.keys(instance.contextData);
}

/**
 * Checks if a step has any context data
 * 
 * @param instance - The workflow instance
 * @param stepId - The step ID to check
 * @returns True if the step has context data, false otherwise
 */
export function hasStepContext(instance: WorkflowInstance, stepId: string): boolean {
    return instance.contextData[stepId] !== undefined &&
        instance.contextData[stepId] !== null &&
        Object.keys(instance.contextData[stepId] || {}).length > 0;
}
